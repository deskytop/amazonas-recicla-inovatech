// =============================================================================
// Amazonas Recicla — Firmware ESP32-CAM
//
// Responsabilidade UNICA: capturar JPEG sob demanda e mandar via UART pro
// gateway (ESP32 DevKit que roda o sketch principal). Nao usa Wi-Fi.
//
// Motivacao: ESP32-CAM tem regulador LDO interno modesto. Quando o radio
// Wi-Fi liga, ele faz pico de ~500mA. Se a fonte cair (USB compartilhada com
// outras placas, AMS1117 do Arduino quente, etc), o ESP-CAM faz brownout e
// trava. Tirando o Wi-Fi do CAM e movendo essa responsabilidade pro gateway
// DevKit (que tem regulador melhor e nao roda camera), resolvemos isso.
//
// Protocolo via UART1 (pinos 13/14, baud 460800):
//   READY <versao>\n            <- ao boot, indica que esta pronto
//   << CAPTURE\n                <- gateway pede uma foto
//   JPEG <tamanho_bytes>\n      -> header com o tamanho
//   <N bytes binarios JPEG>     -> conteudo bruto
//   (ou em caso de falha:)
//   ERROR <motivo>\n            -> erro nominal
// =============================================================================

#include <Arduino.h>
#include "esp_camera.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

#include "config.h"

HardwareSerial CamSerial(1);   // UART1

bool cameraReady = false;

// -----------------------------------------------------------------------------
void setup() {
  // Desabilita o detector de brownout (workaround conhecido pro AI-Thinker
  // que reseta sozinho quando a alimentacao oscila no boot).
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.println(F("========================================"));
  Serial.println(F("  Amazonas Recicla — Firmware ESP32-CAM"));
  Serial.print  (F("  Versao: ")); Serial.println(FIRMWARE_VERSION);
  Serial.println(F("  Modo:   captura sob demanda via UART"));
  Serial.println(F("========================================"));

  // UART pro gateway.
  CamSerial.begin(
    CAM_UART_BAUD,
    SERIAL_8N1,
    CAM_UART_RX_PIN,
    CAM_UART_TX_PIN
  );

  // Camera.
  if (!initCamera()) {
    Serial.println(F("[cam] FALHA na inicializacao da camera"));
    CamSerial.println("ERROR camera_init_failed");
    while (true) delay(1000);
  }
  cameraReady = true;

  // Sinaliza pro gateway que esta pronto.
  CamSerial.print("READY ");
  CamSerial.println(FIRMWARE_VERSION);
  Serial.println(F("[cam] pronto para CAPTURE"));
}

// -----------------------------------------------------------------------------
void loop() {
  // Le linha do gateway (terminada em \n).
  if (CamSerial.available() <= 0) {
    delay(10);
    return;
  }

  String line = CamSerial.readStringUntil('\n');
  line.trim();
  if (line.length() == 0) return;

  Serial.print(F("[uart] cmd: '")); Serial.print(line); Serial.println("'");

  if (line.equalsIgnoreCase("CAPTURE")) {
    handleCapture();
  } else if (line.equalsIgnoreCase("PING")) {
    CamSerial.println("PONG");
  } else {
    CamSerial.print("ERROR unknown_command ");
    CamSerial.println(line);
  }
}

// -----------------------------------------------------------------------------
bool initCamera() {
  camera_config_t cfg;
  cfg.ledc_channel    = LEDC_CHANNEL_0;
  cfg.ledc_timer      = LEDC_TIMER_0;
  cfg.pin_d0          = CAM_PIN_Y2;
  cfg.pin_d1          = CAM_PIN_Y3;
  cfg.pin_d2          = CAM_PIN_Y4;
  cfg.pin_d3          = CAM_PIN_Y5;
  cfg.pin_d4          = CAM_PIN_Y6;
  cfg.pin_d5          = CAM_PIN_Y7;
  cfg.pin_d6          = CAM_PIN_Y8;
  cfg.pin_d7          = CAM_PIN_Y9;
  cfg.pin_xclk        = CAM_PIN_XCLK;
  cfg.pin_pclk        = CAM_PIN_PCLK;
  cfg.pin_vsync       = CAM_PIN_VSYNC;
  cfg.pin_href        = CAM_PIN_HREF;
  cfg.pin_sccb_sda    = CAM_PIN_SIOD;
  cfg.pin_sccb_scl    = CAM_PIN_SIOC;
  cfg.pin_pwdn        = CAM_PIN_PWDN;
  cfg.pin_reset       = CAM_PIN_RESET;
  cfg.xclk_freq_hz    = 20000000;
  cfg.pixel_format    = PIXFORMAT_JPEG;
  cfg.grab_mode       = CAMERA_GRAB_WHEN_EMPTY;

  if (psramFound()) {
    cfg.frame_size    = FRAMESIZE_SVGA;   // 800x600
    cfg.jpeg_quality  = 12;               // 1=best, 63=worst
    cfg.fb_count      = 1;
    cfg.fb_location   = CAMERA_FB_IN_PSRAM;
    Serial.println(F("[cam] PSRAM detectada, SVGA q=12"));
  } else {
    cfg.frame_size    = FRAMESIZE_VGA;    // 640x480
    cfg.jpeg_quality  = 18;
    cfg.fb_count      = 1;
    cfg.fb_location   = CAMERA_FB_IN_DRAM;
    Serial.println(F("[cam] sem PSRAM, VGA q=18 (fallback)"));
  }

  const esp_err_t err = esp_camera_init(&cfg);
  if (err != ESP_OK) {
    Serial.print(F("[cam] esp_camera_init falhou 0x"));
    Serial.println(err, HEX);
    return false;
  }

  // Ajustes de qualidade do sensor (white balance + auto exposure).
  sensor_t *s = esp_camera_sensor_get();
  if (s) {
    s->set_brightness(s, 0);
    s->set_contrast(s, 0);
    s->set_saturation(s, 0);
    s->set_whitebal(s, 1);
    s->set_awb_gain(s, 1);
    s->set_exposure_ctrl(s, 1);
    s->set_aec2(s, 1);
    s->set_gain_ctrl(s, 1);
  }

  return true;
}

// -----------------------------------------------------------------------------
void handleCapture() {
  if (!cameraReady) {
    CamSerial.println("ERROR camera_not_ready");
    return;
  }

  Serial.println(F("[cap] disparando..."));
  unsigned long t0 = millis();

  // Pisca o LED de flash brevemente (opcional).
  pinMode(CAM_FLASH_PIN, OUTPUT);
  digitalWrite(CAM_FLASH_PIN, HIGH);
  delay(60);
  digitalWrite(CAM_FLASH_PIN, LOW);

  // Descarta 1 frame velho do buffer (caso tenha) e pega um novo.
  camera_fb_t *fb = esp_camera_fb_get();
  if (fb) {
    esp_camera_fb_return(fb);
  }
  fb = esp_camera_fb_get();
  if (!fb) {
    CamSerial.println("ERROR fb_get_failed");
    Serial.println(F("[cap] esp_camera_fb_get retornou null"));
    return;
  }

  if (fb->format != PIXFORMAT_JPEG) {
    esp_camera_fb_return(fb);
    CamSerial.println("ERROR not_jpeg");
    return;
  }

  const size_t len = fb->len;
  Serial.print(F("[cap] frame ")); Serial.print(len);
  Serial.print(F(" bytes em "));
  Serial.print(millis() - t0); Serial.println(F(" ms"));

  // Header com tamanho.
  CamSerial.print("JPEG ");
  CamSerial.println(len);

  // Bytes binarios em chunks pequenos pra nao estourar buffer da UART.
  const size_t CHUNK = 256;
  size_t sent = 0;
  while (sent < len) {
    const size_t n = (len - sent) > CHUNK ? CHUNK : (len - sent);
    CamSerial.write(fb->buf + sent, n);
    sent += n;
  }
  CamSerial.flush();

  esp_camera_fb_return(fb);

  Serial.print(F("[cap] enviado em "));
  Serial.print(millis() - t0); Serial.println(F(" ms total"));
}
