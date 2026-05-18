#pragma once

// =============================================================================
// Firmware Arduino Mega — Amazonas Recicla
//
// Papel: controlador fisico central. Recebe comandos do ESP32 DevKit via
// Serial1 (UART) e atua nos perifericos:
//   - Motor de passo NEMA17 (via A4988): direciona compartimento por material
//   - Servo SG90 da gaveta: trava/destrava
//   - Sensor IR: confirma deposicao
//   - HC-SR04: nivel de enchimento
//   - Fim de curso YL99: homing do motor
//
// Comunicacao: Serial0 (USB) pra debug, Serial1 (pinos 18 TX / 19 RX) pra
// DevKit. Baud 9600 (baixo, robusto, sobrevive divisor de tensao no caminho
// 5V do Mega -> 3.3V do ESP32).
// =============================================================================

#define FIRMWARE_VERSION       "1.0.0"

// UART pro ESP32 DevKit gateway (Serial1 do Mega, pinos 18 TX / 19 RX).
#define GATEWAY_BAUD           9600UL
#define GATEWAY_LINE_TIMEOUT_MS 2000UL

// -----------------------------------------------------------------------------
// Pinout
// -----------------------------------------------------------------------------

// Motor de passo NEMA17 via A4988
#define STEPPER_DIR_PIN        4
#define STEPPER_STEP_PIN       5
#define STEPPER_ENABLE_PIN     6        // LOW = ativo

// Servo SG90 da gaveta
#define SERVO_DRAWER_PIN       9        // PWM nativo do Mega

// Fim de curso YL99 (homing do motor)
#define LIMIT_SWITCH_PIN       7        // INPUT_PULLUP, LOW = pressionado

// Sensor IR de obstaculo (deposit detect)
#define IR_SENSOR_PIN          8        // LOW = obstaculo detectado

// HC-SR04 (fill level)
#define ULTRASONIC_TRIG_PIN    10
#define ULTRASONIC_ECHO_PIN    11

// -----------------------------------------------------------------------------
// Parametros do motor de passo
// -----------------------------------------------------------------------------
// NEMA17 padrao: 200 steps/rev (1.8 graus por step) em full step.
// 4 compartimentos = 90 graus de separacao = 50 steps em full step.
#define STEPPER_STEPS_PER_REV  200
#define STEPPER_MAX_SPEED      400      // steps/segundo
#define STEPPER_ACCEL          200      // steps/segundo^2
#define STEPPER_HOMING_SPEED   80       // mais lento durante homing

// Posicoes (steps) por material — calibradas apos homing.
#define POSITION_HOME          0
#define POSITION_PLASTIC       50       // 90 graus
#define POSITION_METAL         100      // 180 graus
#define POSITION_GLASS         150      // 270 graus
#define POSITION_PAPER         50       // mesmo que plastic por enquanto

// Servo angles (SG90)
#define DRAWER_CLOSED_ANGLE    0
#define DRAWER_OPEN_ANGLE      90

// HC-SR04: medida em centimetros pro fundo da bin.
#define BIN_HEIGHT_CM          30        // altura interna da lixeira
#define ULTRASONIC_SAMPLES     5         // numero de leituras pra media
