// =============================================================================
// Amazonas Recicla — Firmware ESP32
// Sketch 1: Wi-Fi via WiFiManager + heartbeat HTTP a cada 30s.
//
// Objetivo desta versao: provar que o ESP32 consegue conectar no Wi-Fi e falar
// com a API em producao. Sem camera, sem motor, sem polling de sessao ainda.
//
// Hardware testado: ESP32 DevKit 38-pin com CP2102 (USB direto no laptop).
// Mesmo codigo roda no ESP32-CAM AI-Thinker — so muda o metodo de upload.
// =============================================================================

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <WiFiManager.h>   // tzapu/WiFiManager
#include <ArduinoJson.h>   // bblanchon/ArduinoJson (v7)

#include "config.h"
#include "secrets.h"

// -----------------------------------------------------------------------------
// Estado
// -----------------------------------------------------------------------------
unsigned long lastHeartbeatMs = 0;
uint32_t      heartbeatCount  = 0;

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

  connectWifi();
}

// -----------------------------------------------------------------------------
// Loop
// -----------------------------------------------------------------------------
void loop() {
  // Se cair o Wi-Fi durante operacao, tenta reconectar antes de bater na API.
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[wifi] Conexao caiu, tentando reconectar..."));
    WiFi.reconnect();
    delay(2000);
    return;
  }

  const unsigned long now = millis();
  if (now - lastHeartbeatMs >= HEARTBEAT_INTERVAL_MS || lastHeartbeatMs == 0) {
    lastHeartbeatMs = now;
    sendHeartbeat();
  }

  delay(100);
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

// -----------------------------------------------------------------------------
// Heartbeat — POST /api/bins/{code}/heartbeat
// -----------------------------------------------------------------------------
void sendHeartbeat() {
  heartbeatCount++;
  Serial.print(F("[hb] #")); Serial.print(heartbeatCount);
  Serial.print(F(" -> "));   Serial.print(API_BASE_URL);
  Serial.print(F("/api/bins/")); Serial.print(BIN_CODE);
  Serial.println(F("/heartbeat"));

  WiFiClientSecure client;
  client.setInsecure();   // MVP: pula validacao de cert. Suficiente pra feira.

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);

  const String url = String(API_BASE_URL) + "/api/bins/" + BIN_CODE + "/heartbeat";
  if (!http.begin(client, url)) {
    Serial.println(F("[hb] ERRO: http.begin falhou"));
    return;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Bin-Key", BIN_API_KEY);
  http.addHeader("User-Agent", "AmazonasRecicla-Firmware/" FIRMWARE_VERSION);

  // Payload: fillLevelPercent fixo em 0 por enquanto (sem HC-SR04 ainda).
  JsonDocument doc;
  doc["fillLevelPercent"] = 0;
  doc["firmwareVersion"]  = FIRMWARE_VERSION;

  String body;
  serializeJson(doc, body);

  const int code = http.POST(body);
  const String resp = http.getString();
  http.end();

  Serial.print(F("[hb] HTTP ")); Serial.print(code);
  Serial.print(F(" | "));        Serial.println(resp);

  if (code == 401) {
    Serial.println(F("[hb] !! Chave da bin invalida. Confira BIN_API_KEY em secrets.h."));
  } else if (code == 404) {
    Serial.println(F("[hb] !! Bin nao encontrada. Confira BIN_CODE em config.h."));
  } else if (code < 0) {
    Serial.print  (F("[hb] !! Erro de transporte: "));
    Serial.println(HTTPClient::errorToString(code));
  }
}
