#pragma once

// =============================================================================
// Configuracoes nao-secretas do firmware Amazonas Recicla (gateway DevKit).
// Tudo aqui e publico — qualquer dado sensivel vai em secrets.h (gitignored).
// =============================================================================

#define FIRMWARE_VERSION       "0.3.0"

#define API_BASE_URL           "https://amazonas-recicla.vercel.app"
#define BIN_CODE               "BIN-MNS-001"

// Intervalos de tempo (ms).
#define HEARTBEAT_INTERVAL_MS  30000UL   // 30s — mantem bin "online" no painel
#define POLLING_INTERVAL_MS    1500UL    // 1.5s — frequencia do polling de sessao
#define DEPOSIT_DELAY_MS       3000UL    // 3s — espera o usuario posicionar o material
#define STATE_TIMEOUT_MS       60000UL   // 60s — watchdog (claude vision pode demorar)
#define HTTP_TIMEOUT_MS        15000UL   // 15s — corta requisicoes presas

// UART2 do DevKit que fala com o ESP32-CAM (firmware amazonas-recicla-cam).
// Default da SDK ESP32 pra UART2: RX=16, TX=17.
#define CAM_UART_BAUD          460800UL
#define CAM_UART_RX_PIN        16        // recebe do TX do CAM (GPIO 14 do CAM)
#define CAM_UART_TX_PIN        17        // envia pro RX do CAM (GPIO 13 do CAM)
#define CAM_HEADER_TIMEOUT_MS  5000UL    // tempo pra receber a linha "JPEG <n>"
#define CAM_BODY_TIMEOUT_MS    10000UL   // tempo pra receber os bytes do JPEG
#define CAM_MAX_JPEG_BYTES     262144UL  // 256KB hard limit (sanity check)

// Botao BOOT (GPIO 0) — segurar por WIFI_RESET_HOLD_MS reseta credenciais Wi-Fi.
#define WIFI_RESET_PIN         0
#define WIFI_RESET_HOLD_MS     5000UL

// AP do captive portal (primeiro boot ou apos reset de credenciais).
#define WIFI_SETUP_AP_SSID     "AmazonasRecicla-Setup"
#define WIFI_SETUP_AP_PASS     "recicla123"     // 8+ chars obrigatorio no ESP32
#define WIFI_SETUP_TIMEOUT_S   180              // 3min pra configurar
