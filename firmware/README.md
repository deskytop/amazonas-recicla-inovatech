# Firmware ESP32 — Amazonas Recicla

Firmware Arduino para a lixeira inteligente. Arquitetura distribuída em
**2 camadas**:

```
ESP32-CAM (firmware amazonas-recicla-cam)  ──UART2 460800─►  ESP32 DevKit (gateway)
                                                                    │
                                                                    │ HTTPS
                                                                    ▼
                                                            Backend Vercel
                                                                    │
                                                                    ▼
                                                            Claude Sonnet 4.6
                                                              (vision)
```

A separação resolve o brownout do regulador LDO interno do ESP32-CAM (pico
de ~500mA quando o Wi-Fi liga). O CAM fica só com a câmera, o DevKit cuida
do Wi-Fi e HTTPS.

## Estrutura

```
firmware/
├── amazonas-recicla/              # Gateway (ESP32 DevKit 38-pin)
│   ├── amazonas-recicla.ino       # polling HTTP + Wi-Fi switching + UART pro Mega
│   ├── config.h                   # URLs, intervalos, pinos UART2
│   ├── secrets.h.example          # template
│   └── secrets.h                  # gitignored
├── amazonas-recicla-cam/          # ESP32-CAM AI-Thinker (NÃO USADO — fica
│   ├── amazonas-recicla-cam.ino   # como referência se um dia conseguirmos
│   └── config.h                   # flashar. Atualmente usamos o CameraWebServer
│                                  # que já está flashado, via Wi-Fi switching)
└── amazonas-recicla-mega/         # Arquivos Arduino Mega (controlador físico)
    ├── amazonas-recicla-mega.ino  # motor NEMA17 + servo + sensores
    └── config.h                   # pinout do hardware
```

## Cabeamento Fase 1.1 — DevKit ↔ Mega via UART (apenas 3 pontos)

Comunicação serial bidirecional. Mega trabalha em 5V, ESP32 em 3.3V — então o
sentido **Mega → ESP32 precisa de divisor de tensão** (proteger o GPIO do ESP32).

```
ESP32 DevKit                                       Arduino Mega
══════════════                                     ═══════════════
GND ─────────────────────────────────────────────  GND (POWER)

GPIO 17 ─────────────────────────────────────────  pin 19 (Serial1 RX)
(UART2 TX, 3.3V)         direto, 3.3V serve

GPIO 16 ◄──┬── R 2K2 ────────────────────────────  pin 18 (Serial1 TX)
(UART2 RX) │       (5V → 3.3V via divisor)
           │
           └── R 4K7 ── GND
```

**3 fios + 2 resistores** (2K2 e 4K7 do kit).

### Montagem do divisor de tensão na protoboard

1. Plug R **2K2** com uma ponta numa linha qualquer (chamemos **L1**) e outra
   ponta numa linha diferente (**L2**).
2. Plug R **4K7** com uma ponta em **L2** e outra ponta no trilho `−` (GND).
3. **L1** recebe o fio do pin 18 (TX) do Mega.
4. **L2** alimenta o GPIO 16 do DevKit (RX).
5. O GND comum entre Mega, DevKit e o trilho `−` precisa estar conectado.

Cálculo do divisor: 5V × 4.7 / (2.2 + 4.7) ≈ 3.4V — dentro da faixa lógica HIGH
do ESP32 e seguro contra clamp diodes.

### Sentido inverso (ESP32 → Mega)

Vai direto sem divisor. O Mega aceita 3.3V como HIGH (limiar ~2.5V).

## Protocolo entre DevKit e Mega

DevKit envia comandos pelo UART2, Mega responde:

| Comando do DevKit | Resposta do Mega | Quando |
|---|---|---|
| `PING` | `PONG <versao>` | No boot do DevKit |
| `STATUS` | `STATUS pos=<n> drawer=<open\|closed> ir=<0\|1> fill=<%>` | Debug manual |
| `HOME` | `OK home` | Início de operação |
| `GOTO <plastic\|metal\|glass\|paper\|home>` | `OK goto <material>` | Após Claude classificar |
| `OPEN_DRAWER` | `OK drawer_open` | Quando detecta sessão ativa |
| `CLOSE_DRAWER` | `OK drawer_closed` | Após complete |
| `GET_FILL` | `FILL <percent>` | A cada heartbeat (futuro) |
| `GET_IR` | `IR <0\|1>` | Debug |

**Modo gracioso:** se o Mega não responder ao PING inicial, o DevKit segue
funcionando sem ele. Útil pra testar fluxo digital antes de cabear hardware.

## Cabeamento Fase 1.2 — Motor NEMA17 via A4988 (a fazer)

```
Fonte 12V/3A (plug P4)                    Arduino Mega
═════════════════════                     ═════════════
12V ─────────────────────── A4988 VMOT
GND ───────────────┬─────── A4988 GND (lado VMOT)
                   │
                   └─────── GND (POWER do Mega)        (terra comum!)

5V (do USB Mega) ─────────── A4988 VDD
GND          ─────────────── A4988 GND (lado VDD)

pin 5 (STEP)  ────────────── A4988 STEP
pin 4 (DIR)   ────────────── A4988 DIR
pin 6 (~ENABLE) ──────────── A4988 ENABLE
                  (LOW = ativo)

A4988 RESET ──┐
              │── curto entre os 2 pinos
A4988 SLEEP ──┘

A4988 saída → Motor NEMA17 KS422STH34-1504A (4 fios):
    1A, 1B → bobina A (par)
    2A, 2B → bobina B (par)
```

**SEM CAPACITOR** entre VMOT e GND — risco assumido. Mitigações:
- Ajustar potenciômetro do A4988 pra **corrente baixa** (girar parafuso anti-horário, fios bem curtos)
- Não inverter direção bruscamente
- Movimentos suaves (rampa de aceleração já configurada via AccelStepper)

### Identificar pares de bobinas do motor (sem multímetro)

1. Cabos típicos do NEMA17: vermelho, azul, verde, preto.
2. Tente: 1A=vermelho, 1B=azul, 2A=verde, 2B=preto.
3. Se motor vibrar sem girar = par errado. Inverta 1A↔1B (mantém 2A/2B).
4. Se ainda errado, inverta 2A↔2B.
5. 4 combinações no máximo — alguma vai funcionar.

## Cabeamento operacional (CAM ↔ DevKit, 4 fios)

Esta é a fiação que fica permanente. Usar jumpers macho-fêmea (CAM tem
header macho, DevKit tem header macho — então MM funciona direto entre
os dois, sem protoboard).

| # | DevKit (gateway) | ESP32-CAM | Função |
|:-:|---|---|---|
| 1 | `5V` (ou `VIN`) | `5V` | alimentação |
| 2 | `GND` | `GND` | terra comum |
| 3 | `GPIO 17` (UART2 TX) | `GPIO 13` (UART1 RX / U2T silkscreen pode confundir, é IO13) | DevKit → CAM (comandos) |
| 4 | `GPIO 16` (UART2 RX) | `GPIO 14` (UART1 TX) | CAM → DevKit (JPEG) |

> Atenção: os pinos `U0R` e `U0T` do ESP32-CAM são UART0 (a serial de debug).
> A comunicação com o DevKit usa **UART1 em pinos GPIO 13 e GPIO 14** —
> que ficam noutro lado da plaquinha, junto com IO12, IO15, IO2, IO4.

## Cabeamento de FLASH do ESP32-CAM (CAM ↔ Arduino Mega, temporário)

Toda vez que precisar fazer upload de firmware novo no CAM, refaz essa
fiação (depois desfaz e volta pra operacional acima):

| Mega | ESP32-CAM | Função |
|---|---|---|
| `5V` (POWER) | `5V` | alimentação |
| `GND` (POWER) | `GND` | terra |
| `RX0` (pin 0) | `U0R` | bytes do PC → CAM |
| `TX0` (pin 1) | `U0T` | bytes do CAM → PC |
| `RESET` (POWER) | `GND` (do próprio Mega) | desabilita ATmega2560 |
| - | `IO0` ↔ `GND` (do próprio CAM) | só DURANTE o flash |

Ritual: GPIO 0 → GND, segura RST do CAM, clica Upload, espera "Connecting",
solta RST. Depois do upload, **remove GPIO 0 → GND** e reseta o CAM.

## Setup do ambiente (uma única vez)

### 1. Arduino IDE 2.x + drivers

Baixar em https://www.arduino.cc/en/software. No Windows, instalar drivers:
- **CP2102** (DevKit): https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers
- **ATmega16U2** (Mega): normalmente nativo do Windows.

### 2. Board manager

`File → Preferences → Additional boards manager URLs`:

```
https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
```

Depois `Tools → Board → Boards Manager`, instalar **esp32 by Espressif Systems**.

### 3. Bibliotecas

`Tools → Manage Libraries`, instalar:
- **WiFiManager** (by tzapu)
- **ArduinoJson** (by Benoit Blanchon, v7.x)

### 4. Criar `secrets.h` do gateway

```bash
cp firmware/amazonas-recicla/secrets.h.example firmware/amazonas-recicla/secrets.h
```

Editar `secrets.h` e colocar a `BIN_API_KEY` real (vem do gerenciador de senhas).

> Nota: a CAM **não precisa de secrets.h** — ela não fala com o backend.

## Compilar e fazer upload

### Gateway (ESP32 DevKit 38-pin)

1. Abrir `firmware/amazonas-recicla/amazonas-recicla.ino` no IDE.
2. `Tools → Board → ESP32 Arduino → ESP32 Dev Module`.
3. `Tools → Port → COM do DevKit` (geralmente COM7, depende do PC).
4. Upload (seta verde →).
5. Serial Monitor → 115200 baud.

### ESP32-CAM (com Mega como programador)

1. Refaz cabeamento de flash (tabela acima, com Mega).
2. GPIO 0 → GND (jumper de modo download).
3. Abrir `firmware/amazonas-recicla-cam/amazonas-recicla-cam.ino`.
4. `Tools → Board → ESP32 Arduino → AI Thinker ESP32-CAM`.
5. `Tools → Partition Scheme → Huge APP (3MB No OTA/1MB SPIFFS)`.
6. `Tools → Port → COM do Mega` (geralmente COM8).
7. Upload. Ritual: segura RST do CAM, clica Upload, espera `Connecting......`,
   solta RST. Pode precisar repetir o RST 2-3 vezes.
8. Quando aparecer `Hard resetting...`, o upload terminou.
9. **REMOVE o jumper GPIO 0 → GND** (senão fica em modo download pra sempre).
10. Desconecta o Mega e refaz cabeamento OPERACIONAL com o DevKit.
11. Reseta o CAM.

## Primeira execução

### Wi-Fi (apenas no DevKit/gateway)

Sem credenciais salvas, o DevKit cria `AmazonasRecicla-Setup` (senha
`recicla123`). Conecta o celular nessa rede, um captive portal abre, escolhe
a rede de verdade e digita a senha. O DevKit salva em flash e reconecta
nos boots seguintes.

Pra trocar de rede (casa → feira), **segura o botão `BOOT` do DevKit por
5 segundos**: ele zera as credenciais salvas e levanta de novo o AP de setup.

### Fluxo end-to-end

```
Usuario abre /app/bin/BIN-MNS-001/iniciar no celular → clica "Iniciar sessao"
       ▼
DevKit detecta via polling (1.5s)              [state] -> SESSION_ACTIVE
       ▼
DevKit espera 3s (deposit window)              [deposit] janela encerrada
       ▼
DevKit manda "CAPTURE" via UART2               [classify] solicitando foto...
       ▼
CAM responde "JPEG <N>\n" + N bytes JPEG       [cam] JPEG 24576
       ▼
DevKit POST /classify-image (JPEG binario)     [classify] postando pro backend...
       ▼
Backend chama Claude vision                    [classify] HTTP 200
       ▼
Backend retorna {material, pointsValue}        [classify] OK -> plastic / 75 pts
       ▼
DevKit POST /complete                          [complete] !!! 75 pts CREDITADOS
       ▼
Celular atualiza via Realtime: "Obrigado por reciclar!"
```

## Roadmap

| # | Funcionalidade | Status |
|---|---|---|
| 1 | Wi-Fi + heartbeat (DevKit) | ✅ |
| 2 | Polling + classify mock + complete (DevKit) | ✅ |
| 3 | Classificação real via Claude vision (CAM + DevKit + backend) | ✅ |
| 4 | Servo SG90 da trava da gaveta | a fazer |
| 5 | Sensor IR confirmando deposição | a fazer |
| 6 | HC-SR04 medindo fill level real | a fazer |
| 7 | Motor NEMA17 + A4988 direcionando compartimentos | V2 |

## Troubleshooting

| Sintoma | Provável causa | Solução |
|---|---|---|
| Upload do CAM `No serial data received` | GPIO 0 não em GND ou ritual de RST errado | Confere jumper IO0→GND, segura RST do CAM antes de clicar Upload |
| LED vermelho do CAM fraco | Subtensão | Alimenta CAM direto pelo 5V do DevKit (não via protoboard com trilhos longos) |
| `[classify] header inesperado do CAM` | UART mal cabeada ou CAM resetando | Confere fios GPIO 13/14 do CAM ↔ GPIO 16/17 do DevKit, GND comum |
| `[classify] backend recusou: unrecognized_or_low_confidence` | Claude não reconheceu o material | Iluminação ruim, objeto fora de foco, ou material atípico — refazer captura |
| `[classify] HTTP 500 anthropic_key_missing` | Variável de ambiente não setada | Adicionar `ANTHROPIC_API_KEY` no Vercel (Settings → Environment Variables) |
| `[hb] HTTP 401` | Bin key inválida | Reverificar `BIN_API_KEY` em `secrets.h` |
