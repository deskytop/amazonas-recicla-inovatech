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
├── amazonas-recicla/             # Gateway (ESP32 DevKit 38-pin)
│   ├── amazonas-recicla.ino      # sketch principal: polling + UART + HTTP
│   ├── config.h                  # URLs, intervalos, pinos UART2
│   ├── secrets.h.example         # template
│   └── secrets.h                 # gitignored
└── amazonas-recicla-cam/         # Captura (ESP32-CAM AI-Thinker)
    ├── amazonas-recicla-cam.ino  # captura JPEG sob demanda via UART
    └── config.h                  # pinos da câmera + UART1
```

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
