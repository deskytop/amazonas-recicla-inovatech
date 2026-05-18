// =============================================================================
// Amazonas Recicla — Firmware Arduino Mega (controlador fisico)
//
// Conforme arquitetura oficial do projeto (docs/Amazonas Recicla revisado.pdf):
// "O gerenciamento central do prototipo e realizado por um microcontrolador
// Arduino Mega, responsavel pela coordenacao dos perifericos."
//
// Recebe comandos do ESP32 DevKit via Serial1 (pinos 18 TX / 19 RX, 9600 baud)
// e responde:
//   PING                  -> PONG <versao>
//   STATUS                -> STATUS pos=<n> drawer=<open|closed> ir=<0|1> fill=<%>
//   HOME                  -> OK home (motor faz homing usando fim de curso)
//   GOTO <material>       -> OK goto <material> (gira motor pra posicao)
//                            materiais aceitos: plastic|metal|glass|paper
//   OPEN_DRAWER           -> OK drawer_open  (servo destrava)
//   CLOSE_DRAWER          -> OK drawer_closed (servo trava)
//   GET_FILL              -> FILL <percent>  (HC-SR04)
//   GET_IR                -> IR <0|1>        (sensor de obstaculo)
//
// Erros: ERROR <razao>
//
// Cada handler executa "best effort" — se o periferico nao estiver cabeado,
// retorna OK simulado (sem falhar). Isso permite testar UART antes de cabear
// tudo. As fases de hardware vao sendo ativadas conforme o cabling avanca.
// =============================================================================

#include <AccelStepper.h>
#include <Servo.h>

#include "config.h"

AccelStepper stepper(AccelStepper::DRIVER, STEPPER_STEP_PIN, STEPPER_DIR_PIN);
Servo drawerServo;

bool drawerOpen = false;

// -----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);          // USB pra debug
  Serial1.begin(GATEWAY_BAUD);   // pra DevKit
  delay(100);

  Serial.println();
  Serial.println(F("=========================================="));
  Serial.println(F("  Amazonas Recicla — Firmware Arduino Mega"));
  Serial.print  (F("  Versao: "));  Serial.println(FIRMWARE_VERSION);
  Serial.print  (F("  UART:   Serial1 @ ")); Serial.print(GATEWAY_BAUD);
  Serial.println(F(" baud (pinos 18=TX, 19=RX)"));
  Serial.println(F("=========================================="));

  // Configura pinos de hardware (mesmo que ainda nao cabeados — INPUT_PULLUP
  // garante leitura segura HIGH como default).
  pinMode(STEPPER_ENABLE_PIN, OUTPUT);
  digitalWrite(STEPPER_ENABLE_PIN, LOW);   // ativa driver
  stepper.setMaxSpeed(STEPPER_MAX_SPEED);
  stepper.setAcceleration(STEPPER_ACCEL);

  pinMode(LIMIT_SWITCH_PIN, INPUT_PULLUP);
  pinMode(IR_SENSOR_PIN, INPUT_PULLUP);

  pinMode(ULTRASONIC_TRIG_PIN, OUTPUT);
  pinMode(ULTRASONIC_ECHO_PIN, INPUT);
  digitalWrite(ULTRASONIC_TRIG_PIN, LOW);

  drawerServo.attach(SERVO_DRAWER_PIN);
  drawerServo.write(DRAWER_CLOSED_ANGLE);

  Serial1.print("READY ");
  Serial1.println(FIRMWARE_VERSION);
  Serial.println(F("[ready] aguardando comandos do gateway..."));
}

// -----------------------------------------------------------------------------
void loop() {
  // Motor "non-blocking" — sempre roda no loop pra completar movimentos
  // agendados.
  stepper.run();

  // Le comandos do DevKit linha a linha.
  if (Serial1.available()) {
    String line = Serial1.readStringUntil('\n');
    line.trim();
    if (line.length() > 0) {
      handleCommand(line);
    }
  }
}

// -----------------------------------------------------------------------------
// Comandos
// -----------------------------------------------------------------------------
void handleCommand(const String& cmd) {
  Serial.print(F("[cmd] "));
  Serial.println(cmd);

  if (cmd.equalsIgnoreCase("PING")) {
    Serial1.print("PONG ");
    Serial1.println(FIRMWARE_VERSION);
    return;
  }

  if (cmd.equalsIgnoreCase("STATUS")) {
    sendStatus();
    return;
  }

  if (cmd.equalsIgnoreCase("HOME")) {
    doHoming();
    Serial1.println("OK home");
    return;
  }

  if (cmd.startsWith("GOTO ")) {
    const String material = cmd.substring(5);
    if (doGoto(material)) {
      Serial1.print("OK goto ");
      Serial1.println(material);
    } else {
      Serial1.print("ERROR unknown_material ");
      Serial1.println(material);
    }
    return;
  }

  if (cmd.equalsIgnoreCase("OPEN_DRAWER")) {
    drawerServo.write(DRAWER_OPEN_ANGLE);
    drawerOpen = true;
    Serial1.println("OK drawer_open");
    return;
  }

  if (cmd.equalsIgnoreCase("CLOSE_DRAWER")) {
    drawerServo.write(DRAWER_CLOSED_ANGLE);
    drawerOpen = false;
    Serial1.println("OK drawer_closed");
    return;
  }

  if (cmd.equalsIgnoreCase("GET_FILL")) {
    const int pct = readFillPercent();
    Serial1.print("FILL ");
    Serial1.println(pct);
    return;
  }

  if (cmd.equalsIgnoreCase("GET_IR")) {
    const int v = digitalRead(IR_SENSOR_PIN) == LOW ? 1 : 0;
    Serial1.print("IR ");
    Serial1.println(v);
    return;
  }

  Serial1.print("ERROR unknown_command ");
  Serial1.println(cmd);
}

// -----------------------------------------------------------------------------
// Status compilado (util pra debug do DevKit)
// -----------------------------------------------------------------------------
void sendStatus() {
  Serial1.print("STATUS pos=");
  Serial1.print(stepper.currentPosition());
  Serial1.print(" drawer=");
  Serial1.print(drawerOpen ? "open" : "closed");
  Serial1.print(" ir=");
  Serial1.print(digitalRead(IR_SENSOR_PIN) == LOW ? 1 : 0);
  Serial1.print(" fill=");
  Serial1.println(readFillPercent());
}

// -----------------------------------------------------------------------------
// Homing — gira motor lentamente ate bater no fim de curso, zera posicao.
// Se nao houver fim de curso cabeado, da timeout e assume posicao 0.
// -----------------------------------------------------------------------------
void doHoming() {
  Serial.println(F("[home] iniciando..."));
  stepper.setSpeed(-STEPPER_HOMING_SPEED);   // gira no sentido do fim de curso

  const unsigned long start = millis();
  while (millis() - start < 10000UL) {       // timeout 10s
    if (digitalRead(LIMIT_SWITCH_PIN) == LOW) {
      stepper.stop();
      stepper.setCurrentPosition(POSITION_HOME);
      Serial.println(F("[home] fim de curso atingido"));
      return;
    }
    stepper.runSpeed();
  }
  // Timeout: assume que ja esta em casa (fim de curso nao cabeado ainda).
  stepper.stop();
  stepper.setCurrentPosition(POSITION_HOME);
  Serial.println(F("[home] timeout — assumindo posicao 0"));
}

// -----------------------------------------------------------------------------
// Goto posicao do material — bloqueia ate motor chegar (com timeout).
// -----------------------------------------------------------------------------
bool doGoto(const String& material) {
  long target;
  if      (material.equalsIgnoreCase("plastic")) target = POSITION_PLASTIC;
  else if (material.equalsIgnoreCase("metal"))   target = POSITION_METAL;
  else if (material.equalsIgnoreCase("glass"))   target = POSITION_GLASS;
  else if (material.equalsIgnoreCase("paper"))   target = POSITION_PAPER;
  else if (material.equalsIgnoreCase("home"))    target = POSITION_HOME;
  else return false;

  Serial.print(F("[goto] target=")); Serial.println(target);
  stepper.moveTo(target);

  const unsigned long start = millis();
  while (stepper.distanceToGo() != 0 && millis() - start < 15000UL) {
    stepper.run();
  }
  Serial.print(F("[goto] reached pos=")); Serial.println(stepper.currentPosition());
  return true;
}

// -----------------------------------------------------------------------------
// HC-SR04 — retorna nivel de enchimento em %.
// Sem sensor cabeado, retorna 0.
// -----------------------------------------------------------------------------
int readFillPercent() {
  long total = 0;
  int valid = 0;
  for (int i = 0; i < ULTRASONIC_SAMPLES; i++) {
    digitalWrite(ULTRASONIC_TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(ULTRASONIC_TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(ULTRASONIC_TRIG_PIN, LOW);
    const unsigned long duration = pulseIn(ULTRASONIC_ECHO_PIN, HIGH, 30000UL);
    if (duration > 0) {
      total += duration;
      valid++;
    }
    delay(10);
  }
  if (valid == 0) return 0;
  const long avgDuration = total / valid;
  // distancia em cm = duracao * 0.0343 / 2
  const float distanceCm = (avgDuration * 0.0343f) / 2.0f;
  // nivel = quanto MENOR a distancia, MAIS cheio
  float pct = ((BIN_HEIGHT_CM - distanceCm) / (float)BIN_HEIGHT_CM) * 100.0f;
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  return (int)pct;
}
