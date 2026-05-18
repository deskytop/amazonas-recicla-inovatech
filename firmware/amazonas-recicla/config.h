#pragma once

// =============================================================================
// Configuracoes nao-secretas do firmware Amazonas Recicla (gateway DevKit).
// Tudo aqui e publico — qualquer dado sensivel vai em secrets.h (gitignored).
// =============================================================================

#define FIRMWARE_VERSION       "0.4.1"

#define API_BASE_URL           "https://amazonas-recicla.vercel.app"
#define BIN_CODE               "BIN-MNS-001"

// Intervalos de tempo (ms).
#define HEARTBEAT_INTERVAL_MS  30000UL   // 30s — mantem bin "online" no painel
#define POLLING_INTERVAL_MS    1500UL    // 1.5s — frequencia do polling de sessao
#define DEPOSIT_DELAY_MS       3000UL    // 3s — espera o usuario posicionar o material
#define STATE_TIMEOUT_MS       90000UL   // 90s — watchdog (switching Wi-Fi + claude)
#define HTTP_TIMEOUT_MS        20000UL   // 20s — corta requisicoes presas

// =============================================================================
// Estrategia de captura: o CAM esta rodando o CameraWebServer com AP aberto.
// O DevKit faz Wi-Fi switching: desconecta da rede de casa, conecta no AP do
// CAM (sem senha), baixa JPEG via HTTP /capture, reconecta na rede de casa,
// posta JPEG pro backend.
// =============================================================================
#define CAM_AP_SSID            "ESP32-CAM-MB"   // nome do AP que o CAM expoe
#define CAM_AP_PASSWORD        ""               // AP aberto (sem senha)
#define CAM_CAPTURE_URL        "http://192.168.4.1/capture"
#define CAM_CONNECT_TIMEOUT_MS 10000UL          // tempo pra conectar no AP do CAM
#define HOME_RECONNECT_TIMEOUT_MS 15000UL       // tempo pra voltar pra casa
#define CAM_MAX_JPEG_BYTES     262144UL         // 256KB hard limit
#define CAM_CAPTURE_RETRIES    2                // tentativas extras se /capture falhar
#define FAIL_COOLDOWN_MS       60000UL          // ignora token que falhou por 60s

// Botao BOOT (GPIO 0) — segurar por WIFI_RESET_HOLD_MS reseta credenciais Wi-Fi.
#define WIFI_RESET_PIN         0
#define WIFI_RESET_HOLD_MS     5000UL

// AP do captive portal (primeiro boot ou apos reset de credenciais).
#define WIFI_SETUP_AP_SSID     "AmazonasRecicla-Setup"
#define WIFI_SETUP_AP_PASS     "recicla123"     // 8+ chars obrigatorio no ESP32
#define WIFI_SETUP_TIMEOUT_S   180              // 3min pra configurar
