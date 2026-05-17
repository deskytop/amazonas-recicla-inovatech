#pragma once

// =============================================================================
// Configuracoes nao-secretas do firmware Amazonas Recicla.
// Tudo aqui e publico — qualquer dado sensivel vai em secrets.h (gitignored).
// =============================================================================

#define FIRMWARE_VERSION       "0.2.0"

#define API_BASE_URL           "https://amazonas-recicla.vercel.app"
#define BIN_CODE               "BIN-MNS-001"

// Intervalos de tempo (ms).
#define HEARTBEAT_INTERVAL_MS  30000UL   // 30s — mantem bin "online" no painel
#define POLLING_INTERVAL_MS    1500UL    // 1.5s — frequencia do polling de sessao
#define MOCK_DEPOSIT_DELAY_MS  5000UL    // 5s — simula usuario depositando material
#define STATE_TIMEOUT_MS       20000UL   // 20s — watchdog: estado preso volta a IDLE
#define HTTP_TIMEOUT_MS        10000UL   // 10s — corta requisicoes presas

// Classificacao mock (sem camera ainda). Sketch 4 substitui pela real.
#define MOCK_MATERIAL          "plastic"
#define MOCK_CONFIDENCE        0.94f

// Botao BOOT (GPIO 0) — segurar por WIFI_RESET_HOLD_MS reseta credenciais Wi-Fi.
#define WIFI_RESET_PIN         0
#define WIFI_RESET_HOLD_MS     5000UL

// AP do captive portal (primeiro boot ou apos reset de credenciais).
#define WIFI_SETUP_AP_SSID     "AmazonasRecicla-Setup"
#define WIFI_SETUP_AP_PASS     "recicla123"     // 8+ chars obrigatorio no ESP32
#define WIFI_SETUP_TIMEOUT_S   180              // 3min pra configurar
