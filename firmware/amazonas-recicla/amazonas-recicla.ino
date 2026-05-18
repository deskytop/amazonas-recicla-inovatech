// =============================================================================
// Amazonas Recicla — Firmware ESP32 (gateway DevKit 38-pin)
//
// Sketch 4: classificacao via Claude vision, SEM reflashar o CAM.
//
// Estrategia: o ESP32-CAM continua com o CameraWebServer (firmware default),
// que expoe um AP aberto `ESP32-CAM-MB` com endpoint HTTP `/capture` que
// retorna um JPEG. O DevKit (este firmware) faz Wi-Fi switching:
//
//   Idle/heartbeat/polling → rede de casa (STA, Wi-Fi do usuario)
//   Quando precisa de foto:
//     1) salva credenciais da rede de casa
//     2) desconecta, conecta no AP do CAM (192.168.4.1)
//     3) HTTP GET /capture → recebe JPEG
//     4) desconecta, reconecta na rede de casa
//     5) HTTPS POST /api/sessions/{token}/classify-image com o JPEG
//     6) backend chama Claude Sonnet 4.6 vision
//     7) HTTPS POST /complete
//
// Esse switching custa ~10-15s por captura. Aceitavel pro demo da feira.
//
// Hardware: ESP32 DevKit 38-pin com CP2102 (USB direto no laptop).
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
  STATE_IDLE,             // polling /active-session na rede de casa
  STATE_SESSION_ACTIVE,   // sessao detectada, aguardando deposit delay
  STATE_CLASSIFYING,      // switching Wi-Fi + captura + POST /classify-image
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

// Credenciais da rede de casa — capturadas no boot, usadas pra reconectar
// depois do switch pro AP do CAM.
String homeSSID;
String homePSK;

// Cooldown de sessao que falhou — evita loop infinito de retries enquanto a
// mesma sessao ainda esta marcada como ativa no backend.
String lastFailedToken;
unsigned long lastFailedAtMs = 0;

// Comunicacao com o Arduino Mega (controlador fisico de motor, servo e
// sensores). Se nao responder ao PING inicial, seguimos sem ele (modo
// gracioso — fluxo digital continua funcionando).
HardwareSerial MegaSerial(2);
bool megaOnline = false;

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

  // UART2 pra falar com o Mega.
  MegaSerial.begin(MEGA_UART_BAUD, SERIAL_8N1, MEGA_UART_RX_PIN, MEGA_UART_TX_PIN);
  Serial.print(F("[mega] UART2 aberta @ "));
  Serial.print(MEGA_UART_BAUD); Serial.println(F(" baud"));

  // PING inicial — testa se o Mega esta cabeado.
  delay(200);
  pingMega();

  WiFi.mode(WIFI_STA);
  connectWifi();

  // Captura credenciais da rede de casa — vamos precisar reconectar depois
  // do switch pro AP do CAM.
  homeSSID = WiFi.SSID();
  homePSK  = WiFi.psk();
  Serial.print(F("[wifi] rede de casa salva: "));
  Serial.println(homeSSID);

  setState(STATE_IDLE);
}

// -----------------------------------------------------------------------------
// Loop
// -----------------------------------------------------------------------------
void loop() {
  checkWifiResetButton();

  // Heartbeat e polling so rodam quando estamos na rede de casa (IDLE ou
  // depois de switching).
  if (WiFi.status() != WL_CONNECTED && currentState == STATE_IDLE) {
    Serial.println(F("[wifi] Sem rede em IDLE, tentando reconectar..."));
    reconnectHome();
    delay(500);
    return;
  }

  const unsigned long now = millis();
  if (currentState == STATE_IDLE) {
    if (now - lastHeartbeatMs >= HEARTBEAT_INTERVAL_MS || lastHeartbeatMs == 0) {
      lastHeartbeatMs = now;
      sendHeartbeat();
    }
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

bool reconnectHome() {
  Serial.print(F("[wifi] reconectando rede de casa: "));
  Serial.println(homeSSID);
  WiFi.disconnect(true, false);
  delay(300);
  WiFi.mode(WIFI_STA);
  if (homePSK.length() > 0) {
    WiFi.begin(homeSSID.c_str(), homePSK.c_str());
  } else {
    WiFi.begin(homeSSID.c_str());
  }
  const unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - t0) < HOME_RECONNECT_TIMEOUT_MS) {
    delay(200);
    Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print(F("[wifi] reconectado, IP: "));
    Serial.println(WiFi.localIP());
    return true;
  } else {
    Serial.println(F("[wifi] FALHA ao reconectar rede de casa"));
    return false;
  }
}

bool connectToCamAP() {
  Serial.print(F("[wifi] conectando no AP do CAM: "));
  Serial.println(CAM_AP_SSID);
  WiFi.disconnect(true, false);
  delay(300);
  WiFi.mode(WIFI_STA);
  if (strlen(CAM_AP_PASSWORD) > 0) {
    WiFi.begin(CAM_AP_SSID, CAM_AP_PASSWORD);
  } else {
    WiFi.begin(CAM_AP_SSID);
  }
  const unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - t0) < CAM_CONNECT_TIMEOUT_MS) {
    delay(200);
    Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print(F("[wifi] conectado no AP do CAM, IP: "));
    Serial.println(WiFi.localIP());
    return true;
  } else {
    Serial.println(F("[wifi] FALHA ao conectar no AP do CAM"));
    return false;
  }
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
// Comunicacao com Arduino Mega (UART2, 9600 baud)
// -----------------------------------------------------------------------------
// Drena qualquer lixo pendente da UART (antes de enviar comando).
void drainMegaSerial() {
  while (MegaSerial.available()) MegaSerial.read();
}

// Envia comando + le linha de resposta com timeout. Retorna "" se nada veio.
String sendMegaCommand(const char* cmd) {
  drainMegaSerial();
  MegaSerial.println(cmd);

  String line;
  const unsigned long start = millis();
  while ((millis() - start) < MEGA_RESPONSE_TIMEOUT_MS) {
    if (MegaSerial.available()) {
      const char c = MegaSerial.read();
      if (c == '\n') return line;
      if (c != '\r') line += c;
    } else {
      delay(2);
    }
  }
  return line;
}

void pingMega() {
  Serial.println(F("[mega] enviando PING..."));
  String reply = sendMegaCommand("PING");
  reply.trim();
  if (reply.startsWith("PONG")) {
    megaOnline = true;
    Serial.print(F("[mega] online: "));
    Serial.println(reply);
  } else {
    megaOnline = false;
    Serial.println(F("[mega] sem resposta — modo gracioso (so fluxo digital)"));
  }
}

// Tenta enviar comando "fire-and-forget". Loga resposta mas nao bloqueia
// o fluxo se falhar.
void megaCommand(const char* cmd) {
  if (!megaOnline) return;
  String reply = sendMegaCommand(cmd);
  reply.trim();
  Serial.print(F("[mega] ")); Serial.print(cmd);
  Serial.print(F(" -> ")); Serial.println(reply);
}

// -----------------------------------------------------------------------------
// Helpers HTTP
// -----------------------------------------------------------------------------
HttpResult httpsRequest(const String& path, const char* method, const String& body) {
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

HttpResult httpsPostBinary(const String& path, const uint8_t* data, size_t len, const char* contentType) {
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
  HttpResult r = httpsRequest(path, "POST", body);

  Serial.print(F("[hb] HTTP ")); Serial.print(r.code);
  Serial.print(F(" | "));        Serial.println(r.body);
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
  // Sempre garantir que voltamos pra rede de casa antes de IDLE.
  if (WiFi.status() != WL_CONNECTED || WiFi.SSID() != homeSSID) {
    reconnectHome();
  }
  setState(STATE_IDLE);
}

void resetToIdleAfterFailure(const __FlashStringHelper* reason) {
  // Marca o token como recentemente falho pra evitar loop de retries enquanto
  // o backend ainda considera a sessao ativa (so vai expirar em ~60s).
  lastFailedToken = currentToken;
  lastFailedAtMs  = millis();
  Serial.print(F("[session] marcando token como failed (cooldown "));
  Serial.print(FAIL_COOLDOWN_MS / 1000);
  Serial.println(F("s)"));
  resetToIdle(reason);
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
  HttpResult r = httpsRequest(path, "GET", "");

  if (r.code != 200) {
    Serial.print(F("[poll] HTTP ")); Serial.print(r.code);
    Serial.print(F(" | "));          Serial.println(r.body);
    return;
  }

  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, r.body);
  if (err) return;

  const bool active = doc["active"] | false;
  if (!active) return;

  const char* token    = doc["token"];
  const char* userName = doc["userDisplayName"] | "";
  if (!token) return;

  // Cooldown: ignora token que falhou recentemente. Evita loop ate a sessao
  // expirar no backend.
  if (lastFailedToken.length() > 0 &&
      String(token) == lastFailedToken &&
      (millis() - lastFailedAtMs) < FAIL_COOLDOWN_MS) {
    return;
  }

  currentToken    = token;
  currentUserName = userName;
  Serial.println();
  Serial.println(F("[poll] >>> SESSAO ATIVA DETECTADA <<<"));
  Serial.print  (F("[poll]     token:   ")); Serial.println(currentToken);
  Serial.print  (F("[poll]     usuario: ")); Serial.println(currentUserName);
  // Sessao ativa: pede pro Mega destravar a gaveta.
  megaCommand("OPEN_DRAWER");
  setState(STATE_SESSION_ACTIVE);
}

// -----------------------------------------------------------------------------
// Pega JPEG do CAM via /capture (HTTP, rede local) — retorna ponteiro malloc'd
// Caller deve free()
// -----------------------------------------------------------------------------
uint8_t* fetchJpegFromCam(size_t *outLen) {
  *outLen = 0;
  WiFiClient client;
  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);

  if (!http.begin(client, CAM_CAPTURE_URL)) {
    Serial.println(F("[cam] http.begin falhou"));
    return nullptr;
  }

  const int code = http.GET();
  if (code != 200) {
    Serial.print(F("[cam] /capture HTTP ")); Serial.println(code);
    http.end();
    return nullptr;
  }

  const int contentLength = http.getSize();
  if (contentLength <= 1000) {
    Serial.print(F("[cam] tamanho suspeito: ")); Serial.println(contentLength);
    http.end();
    return nullptr;
  }
  if ((size_t)contentLength > CAM_MAX_JPEG_BYTES) {
    Serial.print(F("[cam] tamanho muito grande: ")); Serial.println(contentLength);
    http.end();
    return nullptr;
  }

  uint8_t *buf = (uint8_t*) malloc(contentLength);
  if (!buf) {
    Serial.println(F("[cam] malloc falhou"));
    http.end();
    return nullptr;
  }

  WiFiClient *stream = http.getStreamPtr();
  size_t totalRead = 0;
  const unsigned long t0 = millis();
  while (totalRead < (size_t)contentLength && (millis() - t0) < HTTP_TIMEOUT_MS) {
    const int avail = stream->available();
    if (avail > 0) {
      const size_t toRead = (size_t)contentLength - totalRead;
      const int n = stream->read(buf + totalRead, avail < (int)toRead ? avail : (int)toRead);
      if (n > 0) totalRead += n;
    } else {
      delay(2);
    }
  }
  http.end();

  if (totalRead != (size_t)contentLength) {
    Serial.print(F("[cam] download incompleto: ")); Serial.print(totalRead);
    Serial.print(F("/")); Serial.println(contentLength);
    free(buf);
    return nullptr;
  }

  *outLen = totalRead;
  return buf;
}

// -----------------------------------------------------------------------------
// Switching Wi-Fi + captura + POST /classify-image
// -----------------------------------------------------------------------------
void doClassifyWithImage() {
  Serial.println(F("[classify] iniciando captura..."));

  // 1. Switch pra AP do CAM
  if (!connectToCamAP()) {
    resetToIdleAfterFailure(F("nao conseguiu conectar no AP do CAM"));
    return;
  }
  delay(800);   // estabiliza DHCP + da tempo do CameraWebServer ficar pronto

  // 2. Baixa JPEG (com retry — CameraWebServer as vezes solta a conexao no
  //    primeiro request apos boot/reconnect).
  size_t jpegLen = 0;
  uint8_t *jpeg = nullptr;
  for (int attempt = 0; attempt <= CAM_CAPTURE_RETRIES; attempt++) {
    if (attempt > 0) {
      Serial.print(F("[classify] retry "));
      Serial.print(attempt);
      Serial.print(F("/"));
      Serial.println(CAM_CAPTURE_RETRIES);
      delay(800);
    }
    jpeg = fetchJpegFromCam(&jpegLen);
    if (jpeg) break;
  }

  if (!jpeg) {
    Serial.println(F("[classify] falha ao baixar JPEG apos retries"));
    reconnectHome();
    resetToIdleAfterFailure(F("falha na captura"));
    return;
  }
  Serial.print(F("[classify] JPEG baixado: "));
  Serial.print(jpegLen); Serial.println(F(" bytes"));

  // 3. Volta pra rede de casa
  if (!reconnectHome()) {
    free(jpeg);
    resetToIdleAfterFailure(F("falha ao reconectar rede de casa"));
    return;
  }
  delay(500);

  // 4. POST pro backend
  const String path = String("/api/sessions/") + currentToken + "/classify-image";
  HttpResult r = httpsPostBinary(path, jpeg, jpegLen, "image/jpeg");
  free(jpeg);

  Serial.print(F("[classify] HTTP ")); Serial.print(r.code);
  Serial.print(F(" | "));              Serial.println(r.body);

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
        // Pede pro Mega rotacionar a gaveta pra posicao do material.
        if (megaOnline) {
          char gotoCmd[32];
          snprintf(gotoCmd, sizeof(gotoCmd), "GOTO %s", material);
          megaCommand(gotoCmd);
        }
        setState(STATE_COMPLETING);
        return;
      } else {
        const char* reason = resp["reason"] | "?";
        Serial.print(F("[classify] backend recusou: "));
        Serial.println(reason);
        resetToIdleAfterFailure(F("classificacao com baixa confianca"));
        return;
      }
    }
  }

  if (r.code == 410)      resetToIdleAfterFailure(F("sessao expirada (410)"));
  else if (r.code == 409) resetToIdleAfterFailure(F("transicao invalida (409)"));
  else if (r.code == 401) resetToIdleAfterFailure(F("chave invalida (401)"));
  else                    resetToIdleAfterFailure(F("erro generico no classify-image"));
}

// -----------------------------------------------------------------------------
// Complete — POST /api/sessions/{token}/complete
// -----------------------------------------------------------------------------
void doComplete() {
  Serial.println(F("[complete] enviando..."));

  const String path = String("/api/sessions/") + currentToken + "/complete";
  HttpResult r = httpsRequest(path, "POST", "{}");

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
  // Fim do ciclo: gaveta volta a HOME e trava.
  megaCommand("GOTO home");
  megaCommand("CLOSE_DRAWER");
  resetToIdle(F("ciclo concluido"));
}
