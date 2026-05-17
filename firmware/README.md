# Firmware ESP32 — Amazonas Recicla

Firmware Arduino para a lixeira inteligente. Fala HTTP REST com a API em
produção (`https://amazonas-recicla.vercel.app`).

## Hardware-alvo

Dois caminhos suportados — o código é idêntico, muda só o método de upload:

| Placa | Quando usar | Upload |
|---|---|---|
| **ESP32 DevKit 38-pin (CP2102)** | Bootstrap, debug, todos os sketches sem câmera | USB direto |
| **ESP32-CAM AI-Thinker** | Quando precisar da câmera OV2640 | Programador FTDI |

Comece pelo DevKit 38-pin. Toda a comunicação HTTP é validada nele antes de
migrar pra ESP32-CAM.

## Estrutura

```
firmware/
└── amazonas-recicla/
    ├── amazonas-recicla.ino   # sketch principal
    ├── config.h               # constantes (URL, código da bin, intervalos)
    ├── secrets.h.example      # template (commit)
    └── secrets.h              # chaves reais (gitignored)
```

## Setup do ambiente (uma única vez)

### 1. Arduino IDE 2.x

Baixar em https://www.arduino.cc/en/software e instalar.

### 2. Driver USB-Serial (Windows)

Para o ESP32 DevKit com chip **CP2102**, instalar o driver da Silicon Labs:
https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers

Plugar a placa: deve aparecer como `COMx` no Gerenciador de Dispositivos.

### 3. Suporte a ESP32 no Arduino IDE

`File → Preferences → Additional boards manager URLs`:

```
https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
```

Depois `Tools → Board → Boards Manager`, buscar **esp32** (by Espressif Systems)
e instalar.

### 4. Bibliotecas

`Tools → Manage Libraries`, instalar:

- **WiFiManager** (by tzapu)
- **ArduinoJson** (by Benoit Blanchon) — versão 7.x

### 5. Criar `secrets.h` local

Copiar o template e preencher com a chave real:

```bash
cp firmware/amazonas-recicla/secrets.h.example firmware/amazonas-recicla/secrets.h
```

Editar `secrets.h` e substituir `bink_SUBSTITUA_PELA_CHAVE_REAL` pela chave da
bin (vem do gerenciador de senhas).

## Compilar e fazer upload (ESP32 DevKit 38-pin)

1. Abrir `firmware/amazonas-recicla/amazonas-recicla.ino` no Arduino IDE.
2. `Tools → Board → ESP32 Arduino → ESP32 Dev Module`.
3. `Tools → Port`, escolher o `COMx` da placa.
4. Botão **Upload** (seta pra direita no topo da IDE).
5. Abrir `Tools → Serial Monitor`, configurar baud `115200`.

### Primeira execução (sem credenciais salvas)

O ESP32 vai criar um Wi-Fi próprio:

- **SSID:** `AmazonasRecicla-Setup`
- **Senha:** `recicla123`

Conectar pelo celular nessa rede → uma página abre automaticamente (captive
portal) → escolher a rede de verdade → digitar senha → salvar. O ESP32
reconecta e a partir daí lembra dessa rede em todo boot.

### Trocar de rede (ex: casa → feira)

Opção mais simples: dentro do código tem a função `connectWifi()`. Pra forçar
nova configuração, adicionar antes do `wm.autoConnect`:

```cpp
wm.resetSettings();
```

Recompilar, fazer upload uma vez. Depois remover essa linha e voltar a fazer
upload — a próxima vez que rodar, o AP de setup volta. (Em sketches futuros
isso vai virar um botão físico.)

## O que esperar no Serial Monitor

```
======================================
  Amazonas Recicla — Firmware ESP32
  Versao: 0.1.0
  Bin:    BIN-MNS-001
======================================
[wifi] Tentando conectar com credenciais salvas...
[wifi] Conectado! SSID: minha-rede
[wifi] IP local:        192.168.1.42
[wifi] RSSI:            -54 dBm
[hb] #1 -> https://amazonas-recicla.vercel.app/api/bins/BIN-MNS-001/heartbeat
[hb] HTTP 200 | {"ok":true}
```

Daí em diante, a cada 30s: novo heartbeat com `HTTP 200`.

## Roadmap dos sketches

| # | Funcionalidade | Status |
|---|---|---|
| 1 | Wi-Fi + heartbeat | ✅ |
| 2 | Polling de `active-session` | a fazer |
| 3 | Classify mock + complete (sem câmera) | a fazer |
| 4 | Câmera OV2640 + captura | a fazer |
| 5 | Classificação simples (cor dominante) | a fazer |
| 6 | Servo da gaveta + HC-SR04 | a fazer |
| 7 | Motor de passo direcionando compartimentos | V2 |

## Troubleshooting

| Sintoma | Provável causa | Solução |
|---|---|---|
| Porta `COMx` não aparece | Driver CP2102 não instalado | Item 2 do setup |
| Upload falha com `timed out waiting for packet header` | Boot mode | Segurar `BOOT`, tocar `EN`, soltar `EN`, soltar `BOOT` |
| `[hb] HTTP 401` | Chave inválida | Reverificar `BIN_API_KEY` em `secrets.h` |
| `[hb] HTTP 404` | Bin não cadastrada | Reverificar `BIN_CODE` em `config.h` |
| `[hb] Erro de transporte: -1` | Sem rota / DNS | Confirmar que o Wi-Fi tem internet |
