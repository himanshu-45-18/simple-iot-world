# Simple IoT World 🌐⚡
### Comprehensive IoT + Web Application for ESP8266 (NodeMCU CP2102)

**Developed with ❤️ by Himanshu**  
*Department of ETC, SB Jain, Nagpur*

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [Hardware Specifications & Pinout Connections](#-hardware-specifications--pinout-connections)
4. [Deployment to Render (Step-by-Step)](#-deployment-to-render-step-by-step)
5. [Local Development & Running](#-local-development--running)
6. [ESP8266 Firmware Setup (Arduino IDE)](#-esp8266-firmware-setup-arduino-ide)
7. [Web Application Features](#-web-application-features)
8. [Manual Testing Walkthrough](#-manual-testing-walkthrough)

---

## 🌟 Project Overview
**Simple IoT World** is an end-to-end full-stack IoT solution bridging an ESP8266 NodeMCU CP2102 microcontroller with a modern, high-performance web dashboard deployable to **Render**.

- **Microcontroller**: ESP8266 (NodeMCU CP2102)
- **Sensor**: DHT11 Temperature & Humidity on **D5**
- **Actuators**:
  - 16x2 I2C Character LCD (@ address `0x27`) on **D1** (SCL) and **D2** (SDA)
  - Actuator LED on **D3**
- **Web App**: Node.js & Express REST Backend with JSON database, Tailwind CSS frontend with dark/light themes, Chart.js graphs, dynamic gauges, pagination, and remote actuation.

---

## 🛠 Tech Stack
- **Frontend**: HTML5, Tailwind CSS (via CDN), Chart.js, Lucide Icons
- **Backend**: Node.js & Express.js
- **Database**: Simple JSON-based flat-file storage (`data/users.json`, `data/records.json`, `data/device_state.json`)
- **IoT Firmware**: C++ / Arduino IDE for ESP8266 NodeMCU
- **Timezone**: `Asia/Kolkata` (+05:30)

---

## 🔌 Hardware Specifications & Pinout Connections

| Component | Component Pin | NodeMCU Pin | GPIO Pin | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **DHT11 Sensor** | VCC | 3.3V or VIN | - | Power supply |
| | GND | GND | - | Ground |
| | DATA | **D5** | GPIO 14 | Digital input for temperature/humidity |
| **16x2 LCD I2C** | VCC | VIN (5V) | - | Backlight requires 5V |
| (@ Address `0x27`)| GND | GND | - | Ground |
| | SCL | **D1** | GPIO 5 | I2C Clock Line |
| | SDA | **D2** | GPIO 4 | I2C Data Line |
| **Actuator LED** | Anode (+) | **D3** | GPIO 0 | Connect via 220Ω resistor |
| | Cathode (-) | GND | - | Ground |

---

## 🚀 Deployment to Render (Step-by-Step)

The project is structured to be 100% compatible with Render's Web Service deployment.

### Step 1: Push Code to GitHub
1. Initialize git and commit files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Simple IoT World"
   ```
2. Create a new repository on your GitHub account (e.g. `simple-iot-world`).
3. Push to your repository:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/simple-iot-world.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Create Web Service on Render
1. Go to [https://render.com](https://render.com) and log in.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository `simple-iot-world`.
4. Configure the settings:
   - **Name**: `simple-iot-world` (or any unique name)
   - **Region**: Choose the closest region (e.g. Singapore or Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: *(leave blank)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`
5. Click **Create Web Service**.
6. Wait 1–2 minutes for the build to finish. Render will generate a live URL:
   ```text
   https://simple-iot-world.onrender.com
   ```
7. Copy this URL — you will paste it into your ESP8266 code!

---

## 💻 Local Development & Running

To test locally on your computer:
```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start
```
Open your browser at: `http://localhost:3000`

---

## ⚡ ESP8266 Firmware Setup (Arduino IDE)

### 1. Arduino IDE Board Setup
1. Open **Arduino IDE**.
2. Go to **File -> Preferences**.
3. In **Additional Boards Manager URLs**, paste:
   ```text
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
4. Go to **Tools -> Board -> Boards Manager**, search for `esp8266` by *ESP8266 Community*, and click **Install**.
5. Select Board: **Tools -> Board -> ESP8266 Boards -> NodeMCU 1.0 (ESP-12E Module)**.
6. Select your CP2102 COM Port: **Tools -> Port -> COMx**.

### 2. Install Required Libraries
Go to **Sketch -> Include Library -> Manage Libraries...** and install:
1. **LiquidCrystal_I2C** by *Frank de Brabander* (or *Marco Schwartz*)
2. **DHT sensor library** by *Adafruit* (also install *Adafruit Unified Sensor* when prompted)
3. **ArduinoJson** by *Benoit Blanchon* (Version 6.x or 7.x)

### 3. Configure and Upload Code
1. Open the sketch in `esp8266/Simple_IoT_World.ino`.
2. Locate the WiFi and Server configuration section:
   ```cpp
   // WiFi Credentials (as required)
   const char* ssid     = "ESP8266";
   const char* password = "12345678";

   // Paste your Render URL here:
   const char* serverUrl = "https://simple-iot-world.onrender.com";
   ```
3. Click the **Upload** button (Right Arrow).

---

## 🖥 Hardware LCD & Startup Sequence

### During Setup:
1. **Step 1**:
   - `R1: MyProject`
   - `R2: WELCOME`
   - *(Delay: 3 seconds)*
2. **Step 2**:
   - `R1: CONNECTING TO`
   - `R2: WiFi..........`
3. **Step 3 (Upon connection)**:
   - `R1: CONNECTED TO`
   - `R2: WiFi....SUCCESS`

### During Loop (Continuous execution with 10s sync):
1. **Phase 1**:
   - `R1: TEMPERATURE`
   - `R2: 38 'C`
   - *(Delay: 2 seconds)*
2. **Phase 2**:
   - `R1: HUMIDITY`
   - `R2: 59 %`
   - *(Delay: 2 seconds)*
3. **Phase 3 (Remote Server Text)**:
   - `R1: SMART DISPLAY`
   - `R2: MyData`
   - *(Delay: 2 seconds)*
4. **Phase 4 (Remote Server LED Status)**:
   - `R1: LED STATUS`
   - `R2: ON` or `OFF`
   - *(Delay: 2 seconds)*

---

## 🎨 Web Application Features

### 1. Page 1: Authentication
- Seamless Login and Registration views.
- Fields: Full Name, Email, Password.
- Secure token session stored locally.

### 2. Header
- **Web App Name**: "Simple IoT World" with gradient red branding.
- **Logged In User Name**: e.g., `Welcome Ashish`.
- **Live Hardware Status**: Real-time pulsing badge showing `ONLINE (ESP8266)` or `OFFLINE` based on active telemetry.
- **Light/Dark Mode Switcher**: Smooth transition between high-contrast dark theme and clean light theme.
- **Logout Button**.

### 3. Page 2: Web Dashboard (3 Tabs)
- **Tab 1: Monitoring & Records**:
  - **Section 1**:
    - Circular SVG HUD radial gauges for Temperature & Humidity with dynamic percentage calculation.
    - Dual real-time neon trend curve charts powered by Chart.js (last 20 readings).
    - **Emergency Overheat Strobe Alert**: Flashing alert banner with audio tone when temperature exceeds 36°C with quick-cooling trigger.
  - **Section 2**:
    - Saved Records Table with full pagination and **Live Instant Search / Filter**.
    - **One-Click CSV Export**: Download complete historical logs as `.csv`.
    - Format: `# | Temperature | Humidity | Time | Date | Action (Delete)`
    - Formatted strictly in `Asia/Kolkata` (+05:30) timezone.
- **Tab 2: Smart LCD 16x2 Broadcaster**:
  - **Quick Transmit Presets**: 1-click buttons for `ETC Dept`, `Welcome IoT`, `System Alert`, and `Live Clock`.
  - Field 1 & 2 with character counters and authentic green dot-matrix PCB simulator.
- **Tab 3: Arc Reactor LED Actuator**:
  - Sci-fi Arc Reactor with spinning magnetic rings, glowing plasma core, and Web Audio sound effects.
  - **Smart Auto-Cooling Mode**: Automatically triggers reactor/LED ON when temperature exceeds 35°C.
- **Header Additions**:
  - **Voice Recognition Control (🎙️)**: Speak commands like *"Turn LED ON"*, *"Turn LED OFF"*, or *"Refresh"*.
  - **Virtual ESP8266 Simulator**: Test complete telemetry without hardware plugged in!
  - **Audio Effects Toggle**: Mute/unmute futuristic synthesizers.

### 4. Footer
- *Developed with Love ❤️ by <span class="himanshu-cyber-signature">Himanshu ✦</span>.*
- *Department of ETC, SB Jain, Nagpur*

---

## 🧪 Manual Testing Walkthrough

1. **Start the Web App**: Run `npm start` and visit `http://localhost:3000`.
2. **Register/Login**: Enter your Name (e.g. `Ashish`), Email, and Password. Verify header shows `Welcome Ashish`.
3. **Toggle Light/Dark Theme**: Click the Sun/Moon icon in the header to observe the dark/light mode toggle.
4. **Test Tab 1 (Monitoring)**:
   - Check the Temperature & Humidity gauge seek bars.
   - Inspect the Table under Section 2 with columns `# | Temperature | Humidity | Time | Date | Action`.
   - Test deleting a record.
5. **Test Tab 2 (Smart LCD 16x2)**:
   - Enter text into Field 1 (max 16 chars) and Field 2 (max 16 chars).
   - Watch the live blue dot-matrix LCD preview update in real time.
   - Click **Save and Send to LCD**.
6. **Test Tab 3 (LED Switch)**:
   - Click the innovative 3D toggle button.
   - Watch the switch light up and the bulb illuminate with warm red radiance.
   - Notice the status label update to `LED IS ON`.
7. **ESP8266 Live Test**:
   - Power up your NodeMCU with WiFi credentials `ESP8266` / `12345678`.
   - Watch the LCD show `MyProject / WELCOME` -> `CONNECTING TO / WiFi..........` -> `CONNECTED TO / WiFi....SUCCESS`.
   - Watch the Web App header status change from `OFFLINE` to pulsing green `ONLINE (ESP8266)`.
   - Watch live temperature and humidity update on the dashboard every 10 seconds!
