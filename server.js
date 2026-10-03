const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database File Paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');
const DEVICE_FILE = path.join(DATA_DIR, 'device_state.json');

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function initJsonFile(filePath, defaultData) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}

initJsonFile(USERS_FILE, []);
initJsonFile(RECORDS_FILE, [
  {
    id: 1,
    temperature: 34,
    humidity: 50,
    time: "10:30 AM",
    date: "03-10-2026",
    timestamp: Date.now() - 3600000
  },
  {
    id: 2,
    temperature: 33.5,
    humidity: 52,
    time: "11:00 AM",
    date: "03-10-2026",
    timestamp: Date.now() - 1800000
  },
  {
    id: 3,
    temperature: 35.2,
    humidity: 49,
    time: "11:30 AM",
    date: "03-10-2026",
    timestamp: Date.now() - 900000
  }
]);

initJsonFile(DEVICE_FILE, {
  led: false,
  line1: "SMART DISPLAY",
  line2: "MyData",
  currentTemperature: 34.0,
  currentHumidity: 50.0,
  lastSeen: 0
});

// JSON Read / Write Helpers
function readJson(file) {
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
    return [];
  }
}

function writeJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing to ${file}:`, err);
    return false;
  }
}

// Timezone formatter: Asia/Kolkata (+5:30)
function getKolkataTimeAndDate(dateObj = new Date()) {
  // Format Time in HH:MM AM/PM
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  const time = timeFormatter.format(dateObj);

  // Format Date in DD-MM-YYYY
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).formatToParts(dateObj);

  const day = parts.find(p => p.type === 'day')?.value || '01';
  const month = parts.find(p => p.type === 'month')?.value || '01';
  const year = parts.find(p => p.type === 'year')?.value || '2026';
  const date = `${day}-${month}-${year}`;

  return { time, date };
}

// In-Memory Token Store for Session Management
const activeTokens = new Map();

// Helper to hash password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Authentication Middleware
function authenticateUser(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized. Token required.' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  const user = activeTokens.get(token);

  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  req.user = user;
  next();
}

// ----------------- AUTH ROUTES ----------------- //

// Register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
  }

  const users = readJson(USERS_FILE);
  const normalizedEmail = email.toLowerCase().trim();

  if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: 'Email is already registered. Please login.' });
  }

  const newUser = {
    id: Date.now().toString(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeJson(USERS_FILE, users);

  // Generate Token
  const token = crypto.randomBytes(32).toString('hex');
  activeTokens.set(token, { id: newUser.id, name: newUser.name, email: newUser.email });

  return res.json({
    message: 'Registration successful!',
    token,
    user: { id: newUser.id, name: newUser.name, email: newUser.email }
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const users = readJson(USERS_FILE);
  const normalizedEmail = email.toLowerCase().trim();
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Generate Token
  const token = crypto.randomBytes(32).toString('hex');
  activeTokens.set(token, { id: user.id, name: user.name, email: user.email });

  return res.json({
    message: 'Login successful!',
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

// Get Current User
app.get('/api/auth/me', authenticateUser, (req, res) => {
  res.json({ user: req.user });
});

// ----------------- IOT DEVICE & HARDWARE ROUTES ----------------- //

// Device Health Status check helper
function isDeviceOnline(lastSeen) {
  if (!lastSeen) return false;
  // Consider online if pinged within the last 25 seconds (since device sends every 10s)
  return (Date.now() - lastSeen) < 25000;
}

// ESP8266 Endpoint to POST Temperature & Humidity
app.post('/api/device/data', (req, res) => {
  const { temperature, humidity } = req.body;

  if (temperature === undefined || humidity === undefined) {
    return res.status(400).json({ error: 'temperature and humidity are required' });
  }

  const tempNum = parseFloat(temperature);
  const humNum = parseFloat(humidity);

  // Check valid readings
  if (isNaN(tempNum) || isNaN(humNum)) {
    return res.status(400).json({ error: 'Invalid numerical sensor values' });
  }

  const { time, date } = getKolkataTimeAndDate();
  const records = readJson(RECORDS_FILE);

  const nextId = records.length > 0 ? Math.max(...records.map(r => r.id || 0)) + 1 : 1;

  const newRecord = {
    id: nextId,
    temperature: tempNum,
    humidity: humNum,
    time,
    date,
    timestamp: Date.now()
  };

  records.push(newRecord);
  writeJson(RECORDS_FILE, records);

  // Update device state
  const deviceState = readJson(DEVICE_FILE);
  deviceState.currentTemperature = tempNum;
  deviceState.currentHumidity = humNum;
  deviceState.lastSeen = Date.now();
  writeJson(DEVICE_FILE, deviceState);

  // Return current commands back to ESP8266
  return res.json({
    success: true,
    message: 'Data recorded',
    led: deviceState.led,
    line1: deviceState.line1,
    line2: deviceState.line2
  });
});

// ESP8266 Endpoint to Poll Commands & Status
app.get('/api/device/status', (req, res) => {
  const deviceState = readJson(DEVICE_FILE);
  deviceState.lastSeen = Date.now();
  writeJson(DEVICE_FILE, deviceState);

  return res.json({
    led: deviceState.led,
    line1: deviceState.line1 || "SMART DISPLAY",
    line2: deviceState.line2 || "MyData",
    isOnline: true
  });
});

// Device Health for Frontend Dashboard
app.get('/api/device/health', (req, res) => {
  const deviceState = readJson(DEVICE_FILE);
  const online = isDeviceOnline(deviceState.lastSeen);
  const diffSec = deviceState.lastSeen ? Math.round((Date.now() - deviceState.lastSeen) / 1000) : null;

  return res.json({
    isOnline: online,
    lastSeenSecondsAgo: diffSec,
    lastSeen: deviceState.lastSeen
  });
});

// Update LCD lines from Web App (Tab 2)
app.post('/api/device/lcd', authenticateUser, (req, res) => {
  let { line1, line2 } = req.body;

  line1 = (line1 || '').toString().slice(0, 16);
  line2 = (line2 || '').toString().slice(0, 16);

  const deviceState = readJson(DEVICE_FILE);
  deviceState.line1 = line1;
  deviceState.line2 = line2;
  writeJson(DEVICE_FILE, deviceState);

  return res.json({
    success: true,
    message: 'LCD display updated successfully',
    line1: deviceState.line1,
    line2: deviceState.line2
  });
});

// Toggle / Set LED state from Web App (Tab 3)
app.post('/api/device/led', authenticateUser, (req, res) => {
  const { led } = req.body;

  if (typeof led !== 'boolean') {
    return res.status(400).json({ error: 'LED status must be a boolean (true/false)' });
  }

  const deviceState = readJson(DEVICE_FILE);
  deviceState.led = led;
  writeJson(DEVICE_FILE, deviceState);

  return res.json({
    success: true,
    message: `LED turned ${led ? 'ON' : 'OFF'}`,
    led: deviceState.led
  });
});

// ----------------- DASHBOARD & RECORDS ROUTES ----------------- //

// Get Live Dashboard Overview Stats
app.get('/api/dashboard/stats', authenticateUser, (req, res) => {
  const deviceState = readJson(DEVICE_FILE);
  const records = readJson(RECORDS_FILE);
  const online = isDeviceOnline(deviceState.lastSeen);

  const latestRecord = records.length > 0 ? records[records.length - 1] : null;

  res.json({
    online,
    lastSeen: deviceState.lastSeen,
    currentTemperature: latestRecord ? latestRecord.temperature : deviceState.currentTemperature,
    currentHumidity: latestRecord ? latestRecord.humidity : deviceState.currentHumidity,
    totalRecords: records.length,
    led: deviceState.led,
    line1: deviceState.line1,
    line2: deviceState.line2
  });
});

// Get Paginated Records (Section 2 of Tab 1)
app.get('/api/records', authenticateUser, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const records = readJson(RECORDS_FILE);
  // Sort by ID descending so newest records appear first
  const sorted = [...records].reverse();

  const total = sorted.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedData = sorted.slice(startIndex, startIndex + limit);

  res.json({
    records: paginatedData,
    page,
    limit,
    totalRecords: total,
    totalPages
  });
});

// Get Latest Records for Trend Charts (e.g., last 20 in chronological order)
app.get('/api/records/latest', authenticateUser, (req, res) => {
  const records = readJson(RECORDS_FILE);
  const count = parseInt(req.query.count) || 20;
  // Get last `count` items in original chronological order
  const latest = records.slice(-count);

  res.json({ records: latest });
});

// Delete Record by ID
app.delete('/api/records/:id', authenticateUser, (req, res) => {
  const idToDelete = parseInt(req.params.id);
  const records = readJson(RECORDS_FILE);

  const initialLength = records.length;
  const updatedRecords = records.filter(r => r.id !== idToDelete);

  if (updatedRecords.length === initialLength) {
    return res.status(404).json({ error: 'Record not found' });
  }

  writeJson(RECORDS_FILE, updatedRecords);

  res.json({
    success: true,
    message: `Record #${idToDelete} deleted successfully`
  });
});

// Export Records as CSV
app.get('/api/records/export/csv', (req, res) => {
  const records = readJson(RECORDS_FILE);
  let csv = 'ID,Temperature (°C),Humidity (%),Time (IST),Date\r\n';
  records.forEach(r => {
    csv += `"${r.id}","${r.temperature}","${r.humidity}","${r.time}","${r.date}"\r\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="Simple_IoT_World_Telemetry.csv"');
  res.status(200).send(csv);
});

// Render Keep-alive / Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Simple IoT World Server running on port ${PORT}`);
  console.log(`🌍 Local: http://localhost:${PORT}`);
  console.log(`🕒 Server Timezone configured for Asia/Kolkata`);
  console.log(`=========================================`);
});
