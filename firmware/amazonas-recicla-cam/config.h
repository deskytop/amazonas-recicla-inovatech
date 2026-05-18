#pragma once

// =============================================================================
// Firmware ESP32-CAM — Amazonas Recicla
//
// Responsabilidade unica: capturar JPEG sob demanda e enviar via UART pro
// gateway (ESP32 DevKit). SEM Wi-Fi (evita brownout do regulador).
// =============================================================================

#define FIRMWARE_VERSION       "1.0.0"

// UART de comando: recebe "CAPTURE\n" do gateway, devolve JPEG.
// AI-Thinker tem GPIO 12/13/14/15 livres (eram pra SD card).
#define CAM_UART_BAUD          460800UL
#define CAM_UART_RX_PIN        13       // recebe do TX do gateway
#define CAM_UART_TX_PIN        14       // envia pro RX do gateway

// Camera (pinos fixos do AI-Thinker ESP32-CAM).
#define CAM_PIN_PWDN           32
#define CAM_PIN_RESET          -1
#define CAM_PIN_XCLK           0
#define CAM_PIN_SIOD           26
#define CAM_PIN_SIOC           27
#define CAM_PIN_Y9             35
#define CAM_PIN_Y8             34
#define CAM_PIN_Y7             39
#define CAM_PIN_Y6             36
#define CAM_PIN_Y5             21
#define CAM_PIN_Y4             19
#define CAM_PIN_Y3             18
#define CAM_PIN_Y2             5
#define CAM_PIN_VSYNC          25
#define CAM_PIN_HREF           23
#define CAM_PIN_PCLK           22

// LED de flash (alta intensidade). Cuidado: alimentado por GPIO 4.
#define CAM_FLASH_PIN          4
