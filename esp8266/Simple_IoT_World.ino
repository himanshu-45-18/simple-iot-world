/*
 * =====================================================================================
 * Project Name: Simple IoT World
 * Microcontroller: ESP8266 (NodeMCU CP2102)
 *
 * Hardware Pin Connections:
 * -------------------------------------------------------------
 * 1. DHT11 Sensor:
 *    - VCC -> 3.3V (or 5V depending on module)
 *    - GND -> GND
 *    - DATA -> NodeMCU Pin D5 (GPIO 14)
 *
 * 2. 16x2 LCD with I2C Module (@0x27):
 *    - VCC -> VIN (5V)
 *    - GND -> GND
 *    - SCL -> NodeMCU Pin D1 (GPIO 5)
 *    - SDA -> NodeMCU Pin D2 (GPIO 4)
 *
 * 3. Actuator LED:
 *    - Anode (+) -> Resistor (220-330 ohm) -> NodeMCU Pin D3 (GPIO 0)
 *    - Cathode (-) -> GND
 *
 * Developed by: Himanshu (Dept of ETC, SB Jain, Nagpur)
 * =====================================================================================
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ======================== PIN DEFINITIONS ========================
#define DHTPIN      D5      // GPIO 14 (DHT11 Data)
#define DHTTYPE     DHT11   // Sensor type DHT11
#define LEDPIN      D3      // GPIO 0  (Actuator LED)

// ======================== WIFI CONFIGURATION =====================
const char* ssid     = "ESP8266";
const char* password = "12345678";

// ======================== SERVER CONFIGURATION ===================
// NOTE: Keep it blank for now. Paste your Render URL after deployment!
// Example: "https://simple-iot-world.onrender.com"
const char* serverUrl = ""; 

// ======================== HARDWARE INSTANCES =====================
LiquidCrystal_I2C lcd(0x27, 16, 2);
DHT dht(DHTPIN, DHTTYPE);

// ======================== GLOBAL VARIABLES =======================
bool ledStatus = false;
String lcdLine1 = "SMART DISPLAY";
String lcdLine2 = "MyData";

unsigned long lastServerSync = 0;
const unsigned long syncInterval = 10000; // 10 seconds interval

// Helper function to print 2 lines cleanly on LCD
void displayLcdMessage(String line1, String line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1.substring(0, 16));
  lcd.setCursor(0, 1);
  lcd.print(line2.substring(0, 16));
}

// Function to Send Temperature and Humidity to Server
void sendDataToServer(float temperature, float humidity) {
  if (strlen(serverUrl) == 0) {
    Serial.println("[WARN] Server URL is blank. Skipping HTTP POST.");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure(); // Bypass SSL fingerprint verification for Render HTTPS

  HTTPClient http;
  String endpoint = String(serverUrl) + "/api/device/data";

  if (http.begin(client, endpoint)) {
    http.addHeader("Content-Type", "application/json");

    // Prepare JSON payload
    StaticJsonDocument<200> doc;
    doc["temperature"] = temperature;
    doc["humidity"] = humidity;

    String requestBody;
    serializeJson(doc, requestBody);

    Serial.print("[HTTP] POST Data: ");
    Serial.println(requestBody);

    int httpCode = http.POST(requestBody);

    if (httpCode > 0) {
      Serial.printf("[HTTP] POST Status: %d\n", httpCode);
      if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
        String payload = http.getString();
        Serial.println("[HTTP] Server Response: " + payload);

        // Parse returned commands
        StaticJsonDocument<256> responseDoc;
        DeserializationError error = deserializeJson(responseDoc, payload);
        if (!error) {
          if (responseDoc.containsKey("led")) {
            ledStatus = responseDoc["led"].as<bool>();
          }
          if (responseDoc.containsKey("line1")) {
            lcdLine1 = responseDoc["line1"].as<String>();
          }
          if (responseDoc.containsKey("line2")) {
            lcdLine2 = responseDoc["line2"].as<String>();
          }
        }
      }
    } else {
      Serial.printf("[HTTP] POST failed, error: %s\n", http.errorToString(httpCode).c_str());
    }
    http.end();
  }
}

// Function to Fetch Status (LCD text & LED state) from Server
void fetchStatusFromServer() {
  if (strlen(serverUrl) == 0) {
    return;
  }

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  String endpoint = String(serverUrl) + "/api/device/status";

  if (http.begin(client, endpoint)) {
    int httpCode = http.GET();
    if (httpCode == HTTP_CODE_OK) {
      String payload = http.getString();
      Serial.println("[HTTP] GET Status: " + payload);

      StaticJsonDocument<256> responseDoc;
      DeserializationError error = deserializeJson(responseDoc, payload);
      if (!error) {
        if (responseDoc.containsKey("led")) {
          ledStatus = responseDoc["led"].as<bool>();
        }
        if (responseDoc.containsKey("line1")) {
          lcdLine1 = responseDoc["line1"].as<String>();
        }
        if (responseDoc.containsKey("line2")) {
          lcdLine2 = responseDoc["line2"].as<String>();
        }
      }
    }
    http.end();
  }
}

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\n--- Simple IoT World - NodeMCU ESP8266 Initializing ---");

  // Pin Configuration
  pinMode(LEDPIN, OUTPUT);
  digitalWrite(LEDPIN, LOW);

  // Initialize I2C with NodeMCU Pins: D2 = SDA (GPIO 4), D1 = SCL (GPIO 5)
  Wire.begin(D2, D1);
  lcd.init();
  lcd.backlight();
  dht.begin();

  // -------------------------------------------------------------
  // Sequence 1:
  // R1: MyProject
  // R2: WELCOME
  // delay(3S)
  // -------------------------------------------------------------
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("MyProject");
  lcd.setCursor(0, 1);
  lcd.print("WELCOME");
  delay(3000);

  // -------------------------------------------------------------
  // Sequence 2:
  // R1: CONNECTING TO
  // R2: WiFi..........
  // -------------------------------------------------------------
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("CONNECTING TO");
  lcd.setCursor(0, 1);
  lcd.print("WiFi..........");

  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int wifiDots = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    wifiDots++;
    if (wifiDots > 25) {
      Serial.println("\nWiFi connect timeout, proceeding...");
      break;
    }
  }

  // -------------------------------------------------------------
  // Sequence 3:
  // R1: CONNECTED TO
  // R2: WiFi....SUCCESS
  // -------------------------------------------------------------
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected! IP: " + WiFi.localIP().toString());
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("CONNECTED TO");
    lcd.setCursor(0, 1);
    lcd.print("WiFi....SUCCESS");
  } else {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("CONNECTED TO");
    lcd.setCursor(0, 1);
    lcd.print("WiFi....FAILED");
  }
  delay(1500);
}

void loop() {
  // Read Temperature and Humidity from DHT11
  float temp = dht.readTemperature();
  float hum  = dht.readHumidity();

  // Fallback defaults if sensor read glitch occurs
  if (isnan(temp) || isnan(hum)) {
    Serial.println("[SENSOR] Warning: Failed to read from DHT11 sensor! Using fallback.");
    temp = 34.0;
    hum  = 50.0;
  } else {
    Serial.printf("[SENSOR] DHT11 -> Temp: %.1f C, Hum: %.1f %%\n", temp, hum);
  }

  // -------------------------------------------------------------
  // 1. Fetch Details from Server (LCD Data & LED Data)
  // 2. Send Details to Server (Temperature and Humidity) Every 10 Seconds
  // -------------------------------------------------------------
  if (millis() - lastServerSync >= syncInterval || lastServerSync == 0) {
    lastServerSync = millis();
    if (WiFi.status() == WL_CONNECTED) {
      sendDataToServer(temp, hum);
      fetchStatusFromServer();
    }
  }

  // Apply LED state to hardware actuator Pin D3
  digitalWrite(LEDPIN, ledStatus ? HIGH : LOW);

  // -------------------------------------------------------------
  // Required LCD Loop Display Sequences
  // -------------------------------------------------------------

  // Display 1: Temperature
  // R1: TEMPERATURE
  // R2: <temp> 'C (e.g. 38 'C)
  // delay(2s)
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("TEMPERATURE");
  lcd.setCursor(0, 1);
  lcd.print(String((int)round(temp)) + " 'C");
  delay(2000);

  // Display 2: Humidity
  // R1: HUMIDITY
  // R2: <hum> % (e.g. 59 %)
  // delay(2s)
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("HUMIDITY");
  lcd.setCursor(0, 1);
  lcd.print(String((int)round(hum)) + " %");
  delay(2000);

  // Display 3: Smart Display Details from Server
  // R1: SMART DISPLAY (or Field 1 from Server)
  // R2: MyData (or Field 2 from Server)
  // delay(2s)
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(lcdLine1.substring(0, 16));
  lcd.setCursor(0, 1);
  lcd.print(lcdLine2.substring(0, 16));
  delay(2000);

  // Display 4: LED Status from Server
  // R1: LED STATUS
  // R2: ON / OFF
  // delay(2s)
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("LED STATUS");
  lcd.setCursor(0, 1);
  lcd.print(ledStatus ? "ON" : "OFF");
  delay(2000);
}
