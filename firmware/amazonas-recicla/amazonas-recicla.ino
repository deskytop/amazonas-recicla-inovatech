// =============================================================================
// Amazonas Recicla — Firmware ESP32
// Sketch 2: Maquina de estados completa com polling + classify mock + complete.
//
// Adiciona ao sketch 1:
//  - Polling de /active-session a cada 1.5s
//  - Quando detecta sessao: aguarda 5s simulando deposito, manda classify mock
//    (plastic / 0.94), manda complete, volta a IDLE
//  - Botao BOOT (GPIO 0) segurado por 5s reseta credenciais Wi-Fi
//  - Watchdog: estado preso por 20s volta a IDLE
//
// Hardware testado: ESP32 DevKit 38-pin com CP2102 (USB direto no laptop).
// =============================================================================

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <WiFiManager.h>   // tzapu/WiFiManager
#include <ArduinoJson.h>   // bblanchon/ArduinoJson (v7)

#include "config.h"
#include "secrets.h"

// -----------------------------------------------------------------------------
// Maquina de estados
// -----------------------------------------------------------------------------
enum FirmwareState {
  STATE_IDLE,             // gaveta trancada, polling /active-session
  STATE_SESSION_ACTIVE,   // sessao detectada, aguardando deposito (mock = delay)
  STATE_CLASSIFYING,      // postando /classify
  STATE_COMPLETING        // postando /complete
};

FirmwareState currentState   = STATE_IDLE;
unsigned long stateEnteredMs = 0;
unsigned long lastPollMs     = 0;
unsigned long lastHeartbeatMs = 0;
unsigned long buttonPressedMs = 0;
uint32_t      heartbeatCount  = 0;

String currentToken;
String currentUserName;

struct HttpResult {
  int    code;
  String body;
};

// -----------------------------------------------------------------------------
// Setup
// -----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.println(F("======================================"));
  Serial.println(F("  Amazonas Recicla — Firmware ESP32"));
  Serial.print  (F("  Versao: "));   Serial.println(FIRMWARE_VERSION);
  Serial.print  (F("  Bin:    "));   Serial.println(BIN_CODE);
  Serial.println(F("======================================"));

  pinMode(WIFI_RESET_PIN, INPUT_PULLUP);

  connectWifi();
  setState(STATE_IDLE);
}

// -----------------------------------------------------------------------------
// Loop
// -----------------------------------------------------------------------------
void loop() {
  checkWifiResetButton();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[wifi] Conexao caiu, tentando reconectar..."));
    WiFi.reconnect();
    delay(2000);
    return;
  }

  // Heartbeat roda independente do estado.
  const unsigned long now = millis();
  if (now - lastHeartbeatMs >= HEARTBEAT_INTERVAL_MS || lastHeartbeatMs == 0) {
    lastHeartbeatMs = now;
    sendHeartbeat();
  }

  tickStateMachine();
  delay(50);
}

// -----------------------------------------------------------------------------
// Wi-Fi
// -----------------------------------------------------------------------------
void connectWifi() {
  WiFiManager wm;
  wm.setConfigPortalTimeout(WIFI_SETUP_TIMEOUT_S);

  Serial.println(F("[wifi] Tentando conectar com credenciais salvas..."));
  Serial.print  (F("[wifi] Se nao houver, abre AP de setup: "));
  Serial.println(WIFI_SETUP_AP_SSID);

  const bool ok = wm.autoConnect(WIFI_SETUP_AP_SSID, WIFI_SETUP_AP_PASS);
  if (!ok) {
    Serial.println(F("[wifi] Falha no setup. Reiniciando em 3s..."));
    delay(3000);
    ESP.restart();
  }

  Serial.print  (F("[wifi] Conectado! SSID: "));  Serial.println(WiFi.SSID());
  Serial.print  (F("[wifi] IP local:        "));  Serial.println(WiFi.localIP());
  Serial.print  (F("[wifi] RSSI:            "));  Serial.print  (WiFi.RSSI());
  Serial.println(F(" dBm"));
}

void checkWifiResetButton() {
  if (digitalRead(WIFI_RESET_PIN) == LOW) {
    if (buttonPressedMs == 0) {
      buttonPressedMs = millis();
      Serial.println(F("[btn] BOOT pressionado — segure 5s pra resetar Wi-Fi"));
    } else if (millis() - buttonPressedMs >= WIFI_RESET_HOLD_MS) {
      Serial.println(F("[btn] !! RESETANDO CREDENCIAIS WI-FI E REINICIANDO"));
      WiFiManager wm;
      wm.resetSettings();
      delay(500);
      ESP.restart();
    }
  } else if (buttonPressedMs != 0) {
    Serial.println(F("[btn] BOOT solto antes dos 5s — cancelado"));
    buttonPressedMs = 0;
  }
}

// -----------------------------------------------------------------------------
// Helpers HTTP
// -----------------------------------------------------------------------------
HttpResult httpRequest(const String& path, const char* method, const String& body) {
  HttpResult result = {0, ""};
  WiFiClientSecure client;
  client.setInsecure();   // MVP: pula validacao de cert.

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);

  const String url = String(API_BASE_URL) + path;
  if (!http.begin(client, url)) {
    Serial.println(F("[http] ERRO: http.begin falhou"));
    result.code = -1;
    return result;
  }

  http.addHeader("X-Bin-Key", BIN_API_KEY);
  http.addHeader("User-Agent", "AmazonasRecicla-Firmware/" FIRMWARE_VERSION);
  if (body.length() > 0) {
    http.addHeader("Content-Type", "application/json");
  }

  if (strcmp(method, "GET") == 0) {
    result.code = http.GET();
  } else {
    result.code = http.POST(body);
  }
  result.body = http.getString();
  http.end();
  return result;
}

// -----------------------------------------------------------------------------
// Heartbeat — POST /api/bins/{code}/heartbeat
// -----------------------------------------------------------------------------
void sendHeartbeat() {
  heartbeatCount++;
  Serial.print(F("[hb] #")); Serial.print(heartbeatCount);
  Serial.print(F(" -> "));   Serial.print(API_BASE_URL);
  Serial.print(F("/api/bins/")); Serial.print(BIN_CODE);
  Serial.println(F("/heartbeat"));

  JsonDocument doc;
  doc["fillLevelPercent"] = 0;
  doc["firmwareVersion"]  = FIRMWARE_VERSION;
  String body;
  serializeJson(doc, body);

  const String path = String("/api/bins/") + BIN_CODE + "/heartbeat";
  HttpResult r = httpRequest(path, "POST", body);

  Serial.print(F("[hb] HTTP ")); Serial.print(r.code);
  Serial.print(F(" | "));        Serial.println(r.body);

  if (r.code == 401) {
    Serial.println(F("[hb] !! Chave da bin invalida. Confira BIN_API_KEY em secrets.h."));
  } else if (r.code == 404) {
    Serial.println(F("[hb] !! Bin nao encontrada. Confira BIN_CODE em config.h."));
  } else if (r.code < 0) {
    Serial.print  (F("[hb] !! Erro de transporte: "));
    Serial.println(HTTPClient::errorToString(r.code));
  }
}

// -----------------------------------------------------------------------------
// Maquina de estados
// -----------------------------------------------------------------------------
void setState(FirmwareState newState) {
  currentState   = newState;
  stateEnteredMs = millis();
  Serial.print(F("[state] -> "));
  switch (newState) {
    case STATE_IDLE:           Serial.println(F("IDLE")); break;
    case STATE_SESSION_ACTIVE: Serial.println(F("SESSION_ACTIVE")); break;
    case STATE_CLASSIFYING:    Serial.println(F("CLASSIFYING")); break;
    case STATE_COMPLETING:     Serial.println(F("COMPLETING")); break;
  }
}

void resetToIdle(const __FlashStringHelper* reason) {
  Serial.print(F("[session] reset: "));
  Serial.println(reason);
  currentToken    = "";
  currentUserName = "";
  setState(STATE_IDLE);
}

void tickStateMachine() {
  const unsigned long inState = millis() - stateEnteredMs;

  // Watchdog: qualquer estado nao-IDLE preso por mais de STATE_TIMEOUT_MS volta a IDLE.
  if (currentState != STATE_IDLE && inState > STATE_TIMEOUT_MS) {
    resetToIdle(F("watchdog (estado preso)"));
    return;
  }

  switch (currentState) {
    case STATE_IDLE:
      pollActiveSession();
      break;
    case STATE_SESSION_ACTIVE:
      if (inState >= MOCK_DEPOSIT_DELAY_MS) {
        Serial.println(F("[mock] simulacao de deposito completa"));
        setState(STATE_CLASSIFYING);
      }
      break;
    case STATE_CLASSIFYING:
      doClassify();
      break;
    case STATE_COMPLETING:
      doComplete();
      break;
  }
}

// -----------------------------------------------------------------------------
// Polling — GET /api/bins/{code}/active-session
// -----------------------------------------------------------------------------
void pollActiveSession() {
  const unsigned long now = millis();
  if (now - lastPollMs < POLLING_INTERVAL_MS) return;
  lastPollMs = now;

  const String path = String("/api/bins/") + BIN_CODE + "/active-session";
  HttpResult r = httpRequest(path, "GET", "");

  if (r.code != 200) {
    Serial.print(F("[poll] HTTP ")); Serial.print(r.code);
    Serial.print(F(" | "));          Serial.println(r.body);
    return;
  }

  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, r.body);
  if (err) {
    Serial.print(F("[poll] JSON parse: "));
    Serial.println(err.c_str());
    return;
  }

  const bool active = doc["active"] | false;
  if (!active) return;   // silencioso — sem polluir log a cada 1.5s

  const char* token    = doc["token"];
  const char* userName = doc["userDisplayName"] | "";
  if (!token) {
    Serial.println(F("[poll] active=true mas sem token?!"));
    return;
  }

  currentToken    = token;
  currentUserName = userName;
  Serial.println();
  Serial.println(F("[poll] >>> SESSAO ATIVA DETECTADA <<<"));
  Serial.print  (F("[poll]     token:   ")); Serial.println(currentToken);
  Serial.print  (F("[poll]     usuario: ")); Serial.println(currentUserName);
  setState(STATE_SESSION_ACTIVE);
}

// -----------------------------------------------------------------------------
// Classify — POST /api/sessions/{token}/classify
// -----------------------------------------------------------------------------
void doClassify() {
  Serial.print(F("[classify] mock -> material="));
  Serial.print(MOCK_MATERIAL);
  Serial.print(F(" confidence="));
  Serial.println(MOCK_CONFIDENCE);

  JsonDocument doc;
  doc["material"]   = MOCK_MATERIAL;
  doc["confidence"] = MOCK_CONFIDENCE;
  String body;
  serializeJson(doc, body);

  const String path = String("/api/sessions/") + currentToken + "/classify";
  HttpResult r = httpRequest(path, "POST", body);

  Serial.print(F("[classify] HTTP ")); Serial.print(r.code);
  Serial.print(F(" | "));              Serial.println(r.body);

  if (r.code == 200) {
    JsonDocument resp;
    if (!deserializeJson(resp, r.body)) {
      const int   pts  = resp["pointsValue"] | 0;
      const char* dest = resp["destinationCompartment"] | "?";
      Serial.print(F("[classify] -> ")); Serial.print(pts);
      Serial.print(F(" pts | destino: "));
      Serial.println(dest);
    }
    setState(STATE_COMPLETING);
    return;
  }

  if (r.code == 410)      resetToIdle(F("sessao expirada (410)"));
  else if (r.code == 409) resetToIdle(F("transicao invalida (409)"));
  else if (r.code == 401) resetToIdle(F("chave invalida (401)"));
  else                    resetToIdle(F("erro no classify"));
}

// -----------------------------------------------------------------------------
// Complete — POST /api/sessions/{token}/complete
// -----------------------------------------------------------------------------
void doComplete() {
  Serial.println(F("[complete] enviando..."));

  const String path = String("/api/sessions/") + currentToken + "/complete";
  HttpResult r = httpRequest(path, "POST", "{}");

  Serial.print(F("[complete] HTTP ")); Serial.print(r.code);
  Serial.print(F(" | "));              Serial.println(r.body);

  if (r.code == 200) {
    JsonDocument resp;
    if (!deserializeJson(resp, r.body)) {
      const int credited = resp["pointsCredited"] | 0;
      Serial.print(F("[complete] !!! "));
      Serial.print(credited);
      Serial.println(F(" pts CREDITADOS no usuario"));
    }
  }
  resetToIdle(F("ciclo concluido"));
}
