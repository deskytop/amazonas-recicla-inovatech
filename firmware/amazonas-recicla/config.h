#pragma once

// =============================================================================
// Configuracoes nao-secretas do firmware Amazonas Recicla.
// Tudo aqui e publico — qualquer dado sensivel vai em secrets.h (gitignored).
// =============================================================================

#define FIRMWARE_VERSION       "0.1.0"

#define API_BASE_URL           "https://amazonas-recicla.vercel.app"
#define BIN_CODE               "BIN-MNS-001"

// Intervalos (em milissegundos).
#define HEARTBEAT_INTERVAL_MS  30000UL   // 30s — mantem bin "online" no painel
#define HTTP_TIMEOUT_MS        10000UL   // 10s — corta requisicoes presas

// AP do captive portal (primeiro boot ou apos reset de credenciais).
#define WIFI_SETUP_AP_SSID     "AmazonasRecicla-Setup"
#define WIFI_SETUP_AP_PASS     "recicla123"     // 8+ chars obrigatorio no ESP32
#define WIFI_SETUP_TIMEOUT_S   180              // 3min pra configurar
