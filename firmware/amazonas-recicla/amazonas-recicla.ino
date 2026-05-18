// =============================================================================
// Amazonas Recicla — Firmware ESP32 (gateway DevKit 38-pin)
//
// Sketch 3: classificacao REAL via Claude vision no backend.
//
// Arquitetura distribuida em 2 camadas:
//   ESP32-CAM (firmware amazonas-recicla-cam)  ──UART──>  ESP32 DevKit (este)
//                                                              │
//                                                              ▼ HTTPS
//                                                         Backend Vercel
//                                                              │
//                                                              ▼
//                                                         Claude Sonnet 4.6
//                                                         (vision)
//
// Quando detecta sessao ativa:
//   1. Espera DEPOSIT_DELAY_MS pra usuario depositar o material
//   2. Manda "CAPTURE\n" pro CAM via UART2
//   3. Recebe header "JPEG <bytes>\n" e os bytes brutos do JPEG
//   4. POST esses bytes pro /api/sessions/<token>/classify-image
//   5. Backend chama Claude vision, retorna {material, pointsValue, ...}
//   6. Manda /complete e volta a IDLE
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
  STATE_IDLE,             // polling /active-session
  STATE_SESSION_ACTIVE,   // sessao detectada, aguardando deposit delay
  STATE_CLASSIFYING,      // captura foto + POST /classify-image
  STATE_COMPLETING        // POST /complete
};

FirmwareState currentState   = STATE_IDLE;
unsigned long stateEnteredMs = 0;
unsigned long lastPollMs     = 0;
unsigned long lastHeartbeatMs = 0;
unsigned long buttonPressedMs = 0;
uint32_t      heartbeatCount  = 0;

String currentToken;
String currentUserName;

HardwareSerial CamSerial(2);   // UART2 do DevKit

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

  // UART2 pra falar com a ESP32-CAM.
  CamSerial.begin(CAM_UART_BAUD, SERIAL_8N1, CAM_UART_RX_PIN, CAM_UART_TX_PIN);
  Serial.print(F("[cam] UART2 aberta em "));
  Serial.print(CAM_UART_BAUD);
  Serial.println(F(" baud"));

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

  // Logs do CAM (debug):
  drainCamLogs();

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
  client.setInsecure();

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

// Versao binaria pra POST de imagem.
HttpResult httpPostBinary(const String& path, const uint8_t* data, size_t len, const char* contentType) {
  HttpResult result = {0, ""};
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);

  const String url = String(API_BASE_URL) + path;
  if (!http.begin(client, url)) {
    Serial.println(F("[http] ERRO: http.begin falhou"));
    result.code = -1;
    return result;
  }

  http.addHeader("X-Bin-Key", BIN_API_KEY);
  http.addHeader("Content-Type", contentType);
  http.addHeader("User-Agent", "AmazonasRecicla-Firmware/" FIRMWARE_VERSION);

  result.code = http.POST(const_cast<uint8_t*>(data), len);
  result.body = http.getString();
  http.end();
  return result;
}

// -----------------------------------------------------------------------------
// Heartbeat — POST /api/bins/{code}/heartbeat
// -----------------------------------------------------------------------------
void sendHeartbeat() {
  heartbeatCount++;
  Serial.print(F("[hb] #")); Serial.println(heartbeatCount);

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
    Serial.println(F("[hb] !! Chave da bin invalida."));
  } else if (r.code < 0) {
    Serial.print  (F("[hb] !! Erro de transporte: "));
    Serial.println(HTTPClient::errorToString(r.code));
  }
}

// -----------------------------------------------------------------------------
// Drenar mensagens informativas do CAM (READY, ERROR, etc) — em IDLE.
// -----------------------------------------------------------------------------
void drainCamLogs() {
  while (CamSerial.available() > 0) {
    String line = CamSerial.readStringUntil('\n');
    line.trim();
    if (line.length() > 0) {
      Serial.print(F("[cam] "));
      Serial.println(line);
    }
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

  if (currentState != STATE_IDLE && inState > STATE_TIMEOUT_MS) {
    resetToIdle(F("watchdog (estado preso)"));
    return;
  }

  switch (currentState) {
    case STATE_IDLE:
      pollActiveSession();
      break;
    case STATE_SESSION_ACTIVE:
      if (inState >= DEPOSIT_DELAY_MS) {
        Serial.println(F("[deposit] janela de deposito encerrada"));
        setState(STATE_CLASSIFYING);
      }
      break;
    case STATE_CLASSIFYING:
      doClassifyWithImage();
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
  if (!active) return;

  const char* token    = doc["token"];
  const char* userName = doc["userDisplayName"] | "";
  if (!token) return;

  currentToken    = token;
  currentUserName = userName;
  Serial.println();
  Serial.println(F("[poll] >>> SESSAO ATIVA DETECTADA <<<"));
  Serial.print  (F("[poll]     token:   ")); Serial.println(currentToken);
  Serial.print  (F("[poll]     usuario: ")); Serial.println(currentUserName);
  setState(STATE_SESSION_ACTIVE);
}

// -----------------------------------------------------------------------------
// Captura via UART + POST /api/sessions/{token}/classify-image
// -----------------------------------------------------------------------------
void doClassifyWithImage() {
  Serial.println(F("[classify] solicitando foto pro ESP32-CAM..."));

  // 1. Drena qualquer lixo pendente da UART antes de pedir.
  while (CamSerial.available() > 0) CamSerial.read();

  // 2. Manda CAPTURE.
  CamSerial.println("CAPTURE");

  // 3. Espera linha de header "JPEG <n>" ou "ERROR ..."
  String header = readLineWithTimeout(CAM_HEADER_TIMEOUT_MS);
  header.trim();
  Serial.print(F("[classify] header: '")); Serial.print(header); Serial.println("'");

  if (header.startsWith("ERROR")) {
    resetToIdle(F("CAM reportou ERROR"));
    return;
  }
  if (!header.startsWith("JPEG ")) {
    resetToIdle(F("header inesperado do CAM"));
    return;
  }

  const size_t jpegSize = header.substring(5).toInt();
  if (jpegSize < 1000 || jpegSize > CAM_MAX_JPEG_BYTES) {
    Serial.print(F("[classify] jpegSize invalido: "));
    Serial.println(jpegSize);
    resetToIdle(F("tamanho de JPEG fora do esperado"));
    return;
  }
  Serial.print(F("[classify] JPEG size: ")); Serial.print(jpegSize);
  Serial.println(F(" bytes — baixando..."));

  // 4. Aloca buffer.
  uint8_t *buffer = (uint8_t*) malloc(jpegSize);
  if (!buffer) {
    resetToIdle(F("malloc do JPEG falhou"));
    return;
  }

  // 5. Le os bytes do CAM com timeout.
  size_t received = readBytesWithTimeout(buffer, jpegSize, CAM_BODY_TIMEOUT_MS);
  if (received != jpegSize) {
    Serial.print(F("[classify] esperado ")); Serial.print(jpegSize);
    Serial.print(F(", recebido "));          Serial.println(received);
    free(buffer);
    resetToIdle(F("download incompleto do JPEG"));
    return;
  }
  Serial.println(F("[classify] JPEG recebido, postando pro backend..."));

  // 6. POST pro backend.
  const String path = String("/api/sessions/") + currentToken + "/classify-image";
  HttpResult r = httpPostBinary(path, buffer, jpegSize, "image/jpeg");
  free(buffer);

  Serial.print(F("[classify] HTTP ")); Serial.print(r.code);
  Serial.print(F(" | "));              Serial.println(r.body);

  // 7. Avalia resposta.
  if (r.code == 200) {
    JsonDocument resp;
    if (!deserializeJson(resp, r.body)) {
      const bool ok = resp["ok"] | false;
      if (ok) {
        const char* material = resp["material"] | "?";
        const int   pts      = resp["pointsValue"] | 0;
        const float conf     = resp["confidence"] | 0.0f;
        Serial.print(F("[classify] OK -> "));
        Serial.print(material);
        Serial.print(F(" / "));
        Serial.print(pts);
        Serial.print(F(" pts (confianca "));
        Serial.print(conf, 2);
        Serial.println(F(")"));
        setState(STATE_COMPLETING);
        return;
      } else {
        const char* reason = resp["reason"] | "?";
        Serial.print(F("[classify] backend recusou: "));
        Serial.println(reason);
        resetToIdle(F("classificacao com baixa confianca"));
        return;
      }
    }
  }

  if (r.code == 410)      resetToIdle(F("sessao expirada (410)"));
  else if (r.code == 409) resetToIdle(F("transicao invalida (409)"));
  else if (r.code == 401) resetToIdle(F("chave invalida (401)"));
  else                    resetToIdle(F("erro generico no classify-image"));
}

// -----------------------------------------------------------------------------
// Helpers da UART
// -----------------------------------------------------------------------------
String readLineWithTimeout(unsigned long timeoutMs) {
  String line;
  const unsigned long start = millis();
  while ((millis() - start) < timeoutMs) {
    if (CamSerial.available()) {
      const char c = CamSerial.read();
      if (c == '\n') return line;
      if (c != '\r') line += c;
    } else {
      delay(1);
    }
  }
  return line;
}

size_t readBytesWithTimeout(uint8_t *buffer, size_t expected, unsigned long timeoutMs) {
  size_t read = 0;
  unsigned long lastByteMs = millis();
  while (read < expected && (millis() - lastByteMs) < timeoutMs) {
    if (CamSerial.available()) {
      buffer[read++] = (uint8_t)CamSerial.read();
      lastByteMs = millis();
    } else {
      delay(1);
    }
  }
  return read;
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
