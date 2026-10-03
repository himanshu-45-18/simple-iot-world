/**
 * Simple IoT World - Cyber Telemetry & Control Engine (Enhanced Edition)
 * Includes:
 * - Real-time DHT11 Telemetry & Circular SVG Gauges
 * - Neon Chart.js Visualizations & Historical Archives
 * - Virtual ESP8266 Telemetry Simulator Mode
 * - Voice Recognition Control (Web Speech API)
 * - Emergency High-Temperature Strobe Alert & Smart Auto-Cooling
 * - One-Click CSV Telemetry Exporter
 * - Quick LCD Presets with Live Clock Broadcasting
 * - Arc Reactor Actuator with Web Audio Sound Effects
 */

document.addEventListener('DOMContentLoaded', () => {
  // Lucide Icons initialization helper
  function initIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const state = {
    token: localStorage.getItem('iot_token') || null,
    user: JSON.parse(localStorage.getItem('iot_user') || 'null'),
    currentTab: 1,
    currentPage: 1,
    recordsLimit: 8,
    totalPages: 1,
    recordsCache: [],
    ledStatus: false,
    lcdLine1: 'SMART DISPLAY',
    lcdLine2: 'MyData',
    tempChartInstance: null,
    humChartInstance: null,
    isDeviceOnline: false,
    pollInterval: null,
    soundEnabled: true,
    isSimulatorActive: false,
    simulatorInterval: null,
    autoCoolingActive: false,
    tempThreshold: 36.0
  };

  const CIRCLE_CIRCUMFERENCE = 301.59; // 2 * PI * 48

  // ==========================================
  // FUTURISTIC SOUND SYNTHESIZER
  // ==========================================
  function playCyberSound(type = 'click') {
    if (!state.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'powerOn') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.14, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } else if (type === 'powerOff') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.14, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } else if (type === 'alert') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'telemetry') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1100, ctx.currentTime);
        osc.frequency.setValueAtTime(1400, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);
        osc.start();
        osc.stop(ctx.currentTime + 0.09);
      }
    } catch (e) {
      // Audio fallback
    }
  }

  // ==========================================
  // DOM REFERENCES
  // ==========================================
  const elements = {
    appBody: document.getElementById('appBody'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    soundIcon: document.getElementById('soundIcon'),
    simulatorBtn: document.getElementById('simulatorBtn'),
    simStatusText: document.getElementById('simStatusText'),
    voiceBtn: document.getElementById('voiceBtn'),
    voiceMicIcon: document.getElementById('voiceMicIcon'),
    voiceFeedbackBanner: document.getElementById('voiceFeedbackBanner'),
    voiceTranscriptText: document.getElementById('voiceTranscriptText'),
    closeVoiceBannerBtn: document.getElementById('closeVoiceBannerBtn'),
    
    // Header
    deviceStatusBadge: document.getElementById('deviceStatusBadge'),
    deviceStatusPing: document.getElementById('deviceStatusPing'),
    deviceStatusDot: document.getElementById('deviceStatusDot'),
    deviceStatusText: document.getElementById('deviceStatusText'),
    userBadge: document.getElementById('userBadge'),
    userGreeting: document.getElementById('userGreeting'),
    logoutBtn: document.getElementById('logoutBtn'),

    // Pages
    authPage: document.getElementById('authPage'),
    dashboardPage: document.getElementById('dashboardPage'),

    // Auth Form
    authForm: document.getElementById('authForm'),
    authHeading: document.getElementById('authHeading'),
    authSubheading: document.getElementById('authSubheading'),
    nameFieldGroup: document.getElementById('nameFieldGroup'),
    userNameInput: document.getElementById('userNameInput'),
    userEmailInput: document.getElementById('userEmailInput'),
    userPasswordInput: document.getElementById('userPasswordInput'),
    authSubmitBtn: document.getElementById('authSubmitBtn'),
    authBtnText: document.getElementById('authBtnText'),
    toggleAuthPrompt: document.getElementById('toggleAuthPrompt'),
    toggleAuthModeBtn: document.getElementById('toggleAuthModeBtn'),
    authAlert: document.getElementById('authAlert'),

    // Tabs
    tabBtn1: document.getElementById('tabBtn1'),
    tabBtn2: document.getElementById('tabBtn2'),
    tabBtn3: document.getElementById('tabBtn3'),
    tabContent1: document.getElementById('tabContent1'),
    tabContent2: document.getElementById('tabContent2'),
    tabContent3: document.getElementById('tabContent3'),

    // Tab 1: Gauges & Alert
    tempAlertBanner: document.getElementById('tempAlertBanner'),
    alertCoolingBtn: document.getElementById('alertCoolingBtn'),
    refreshStatsBtn: document.getElementById('refreshStatsBtn'),
    currentTempDisplay: document.getElementById('currentTempDisplay'),
    currentHumDisplay: document.getElementById('currentHumDisplay'),
    tempSeekPercent: document.getElementById('tempSeekPercent'),
    humSeekPercent: document.getElementById('humSeekPercent'),
    tempCircleGauge: document.getElementById('tempCircleGauge'),
    humCircleGauge: document.getElementById('humCircleGauge'),
    tempBar: document.getElementById('tempBar'),
    humBar: document.getElementById('humBar'),
    tempChartCanvas: document.getElementById('tempChart'),
    humChartCanvas: document.getElementById('humChart'),

    // Tab 1: Records Table
    recordSearchInput: document.getElementById('recordSearchInput'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    recordsTableBody: document.getElementById('recordsTableBody'),
    totalRecordsBadge: document.getElementById('totalRecordsBadge'),
    currentPageNum: document.getElementById('currentPageNum'),
    totalPagesNum: document.getElementById('totalPagesNum'),
    prevPageBtn: document.getElementById('prevPageBtn'),
    nextPageBtn: document.getElementById('nextPageBtn'),
    pageNumbersContainer: document.getElementById('pageNumbersContainer'),

    // Tab 2: LCD
    lcdForm: document.getElementById('lcdForm'),
    lcdLine1: document.getElementById('lcdLine1'),
    lcdLine2: document.getElementById('lcdLine2'),
    line1Count: document.getElementById('line1Count'),
    line2Count: document.getElementById('line2Count'),
    lcdPreviewR1: document.getElementById('lcdPreviewR1'),
    lcdPreviewR2: document.getElementById('lcdPreviewR2'),
    saveLcdBtn: document.getElementById('saveLcdBtn'),
    lcdStatusAlert: document.getElementById('lcdStatusAlert'),
    presetChips: document.querySelectorAll('.lcd-preset-chip'),

    // Tab 3: Arc Reactor LED & Auto-Cooling
    innovativeLedToggleBtn: document.getElementById('innovativeLedToggleBtn'),
    reactorCore: document.getElementById('reactorCore'),
    reactorIcon: document.getElementById('reactorIcon'),
    ledStatusBadge: document.getElementById('ledStatusBadge'),
    ledButtonLabel: document.getElementById('ledButtonLabel'),
    ledAmbientGlow: document.getElementById('ledAmbientGlow'),
    ledSyncFeedback: document.getElementById('ledSyncFeedback'),
    autoCoolingToggle: document.getElementById('autoCoolingToggle')
  };

  let isRegisterMode = false;

  // ==========================================
  // SOUND TOGGLE
  // ==========================================
  elements.soundToggleBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    elements.soundIcon.setAttribute('data-lucide', state.soundEnabled ? 'volume-2' : 'volume-x');
    elements.soundToggleBtn.title = `Audio Effects: ${state.soundEnabled ? 'ON' : 'MUTED'}`;
    elements.soundToggleBtn.classList.toggle('text-cyan-400', state.soundEnabled);
    elements.soundToggleBtn.classList.toggle('text-slate-500', !state.soundEnabled);
    initIcons();
    if (state.soundEnabled) playCyberSound('click');
  });

  // ==========================================
  // VIRTUAL ESP8266 HARDWARE SIMULATOR
  // ==========================================
  elements.simulatorBtn.addEventListener('click', () => {
    state.isSimulatorActive = !state.isSimulatorActive;

    if (state.isSimulatorActive) {
      elements.simulatorBtn.classList.add('sim-active', 'border-emerald-500/60');
      elements.simStatusText.textContent = 'ACTIVE';
      elements.simStatusText.className = 'text-emerald-400 font-bold';
      playCyberSound('powerOn');

      // Run simulation step immediately then every 10s
      runSimulationStep();
      state.simulatorInterval = setInterval(runSimulationStep, 10000);
    } else {
      elements.simulatorBtn.classList.remove('sim-active', 'border-emerald-500/60');
      elements.simStatusText.textContent = 'OFF';
      elements.simStatusText.className = 'text-slate-500';
      playCyberSound('powerOff');

      if (state.simulatorInterval) {
        clearInterval(state.simulatorInterval);
        state.simulatorInterval = null;
      }
    }
  });

  async function runSimulationStep() {
    // Generate realistic fluctuating temperature (32.0 to 38.5 °C) and humidity (45.0 to 65.0 %)
    const simTemp = parseFloat((32.0 + Math.random() * 6.5).toFixed(1));
    const simHum = parseFloat((46.0 + Math.random() * 16.0).toFixed(1));

    try {
      const res = await fetch('/api/device/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temperature: simTemp, humidity: simHum })
      });

      if (res.ok) {
        playCyberSound('telemetry');
        fetchDashboardStats();
        checkDeviceHealth();
        if (state.currentTab === 1) {
          fetchChartData();
          fetchRecords(state.currentPage);
        }
      }
    } catch (e) {
      console.warn('Simulation step transmission error:', e);
    }
  }

  // ==========================================
  // VOICE CONTROL (WEB SPEECH API)
  // ==========================================
  let speechRecognizer = null;
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRec) {
    speechRecognizer = new SpeechRec();
    speechRecognizer.continuous = false;
    speechRecognizer.interimResults = false;
    speechRecognizer.lang = 'en-US';

    speechRecognizer.onstart = () => {
      elements.voiceBtn.classList.add('voice-recording');
      elements.voiceFeedbackBanner.classList.remove('hidden');
      elements.voiceTranscriptText.textContent = 'Listening... Speak: "Turn LED ON" or "Turn LED OFF"';
      playCyberSound('click');
      initIcons();
    };

    speechRecognizer.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      elements.voiceTranscriptText.textContent = `"${transcript}"`;
      handleVoiceCommand(transcript);
    };

    speechRecognizer.onerror = (e) => {
      elements.voiceTranscriptText.textContent = `Error recognizing: ${e.error}`;
      elements.voiceBtn.classList.remove('voice-recording');
      setTimeout(() => elements.voiceFeedbackBanner.classList.add('hidden'), 4000);
    };

    speechRecognizer.onend = () => {
      elements.voiceBtn.classList.remove('voice-recording');
    };
  }

  elements.voiceBtn.addEventListener('click', () => {
    if (!speechRecognizer) {
      alert('Speech Recognition is not supported by your browser. Please use Chrome/Edge.');
      return;
    }
    try {
      speechRecognizer.start();
    } catch (e) {
      speechRecognizer.stop();
    }
  });

  if (elements.closeVoiceBannerBtn) {
    elements.closeVoiceBannerBtn.addEventListener('click', () => {
      elements.voiceFeedbackBanner.classList.add('hidden');
    });
  }

  async function handleVoiceCommand(cmd) {
    playCyberSound('telemetry');

    if (cmd.includes('on') || cmd.includes('activate') || cmd.includes('light on') || cmd.includes('ignite')) {
      elements.voiceTranscriptText.textContent = 'Command confirmed: Igniting Arc Reactor (LED ON)...';
      await setLedActuator(true);
    } else if (cmd.includes('off') || cmd.includes('shutdown') || cmd.includes('light off')) {
      elements.voiceTranscriptText.textContent = 'Command confirmed: Shutting down Arc Reactor (LED OFF)...';
      await setLedActuator(false);
    } else if (cmd.includes('refresh') || cmd.includes('update') || cmd.includes('sync')) {
      elements.voiceTranscriptText.textContent = 'Command confirmed: Refreshing telemetry...';
      fetchDashboardStats();
      fetchChartData();
      fetchRecords(state.currentPage);
    } else if (cmd.includes('alert') || cmd.includes('emergency')) {
      elements.voiceTranscriptText.textContent = 'Command confirmed: Transmitting Emergency Alert to LCD...';
      elements.lcdLine1.value = 'SYSTEM ALERT';
      elements.lcdLine2.value = 'TEMP CRITICAL';
      elements.lcdForm.dispatchEvent(new Event('submit'));
    } else {
      elements.voiceTranscriptText.textContent = `Unrecognized command "${cmd}". Try "Turn LED ON" or "Turn LED OFF"`;
    }

    setTimeout(() => elements.voiceFeedbackBanner.classList.add('hidden'), 5000);
  }

  // ==========================================
  // THEME SWITCHING (LIGHT / DARK)
  // ==========================================
  function updateBodyMesh(isDark) {
    if (elements.appBody) {
      if (isDark) {
        elements.appBody.className = 'bg-mesh-dark min-h-screen flex flex-col font-sans text-slate-100 transition-colors duration-500 antialiased selection:bg-cyan-500 selection:text-black';
      } else {
        elements.appBody.className = 'bg-mesh-light min-h-screen flex flex-col font-sans text-slate-800 transition-colors duration-500 antialiased selection:bg-indigo-500 selection:text-white';
      }
    }
  }

  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = (savedTheme === 'dark') || (!savedTheme && prefersDark);
    
    document.documentElement.classList.toggle('dark', isDark);
    updateBodyMesh(isDark);
  }

  elements.themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateBodyMesh(isDark);

    if (state.tempChartInstance && state.humChartInstance) {
      updateChartThemes(isDark);
    }
    initIcons();
  });

  // ==========================================
  // AUTHENTICATION LOGIC
  // ==========================================
  function showAuthAlert(message, isError = true) {
    elements.authAlert.className = `p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
      isError 
        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' 
        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
    }`;
    elements.authAlert.innerHTML = `
      <i data-lucide="${isError ? 'alert-octagon' : 'check-circle'}" class="w-4 h-4 flex-shrink-0"></i>
      <span>${message}</span>
    `;
    elements.authAlert.classList.remove('hidden');
    initIcons();
  }

  function hideAuthAlert() {
    elements.authAlert.classList.add('hidden');
    elements.authAlert.innerHTML = '';
  }

  elements.toggleAuthModeBtn.addEventListener('click', () => {
    isRegisterMode = !isRegisterMode;
    hideAuthAlert();

    if (isRegisterMode) {
      elements.authHeading.textContent = 'CREATE CYBER ACCOUNT';
      elements.authSubheading.textContent = 'Register to control and monitor IoT devices';
      elements.nameFieldGroup.classList.remove('hidden');
      elements.userNameInput.required = true;
      elements.authBtnText.textContent = 'INITIALIZE ACCOUNT';
      elements.toggleAuthPrompt.textContent = 'Already authorized?';
      elements.toggleAuthModeBtn.textContent = 'Sign In';
    } else {
      elements.authHeading.textContent = 'ACCESS CYBER DASHBOARD';
      elements.authSubheading.textContent = 'Enter your credentials to link with ESP8266 telemetry';
      elements.nameFieldGroup.classList.add('hidden');
      elements.userNameInput.required = false;
      elements.authBtnText.textContent = 'Sign In';
      elements.toggleAuthPrompt.textContent = "Don't have an account?";
      elements.toggleAuthModeBtn.textContent = 'Create an account';
    }
    initIcons();
  });

  elements.authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuthAlert();

    const email = elements.userEmailInput.value.trim();
    const password = elements.userPasswordInput.value;
    const name = elements.userNameInput.value.trim();

    const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegisterMode ? { name, email, password } : { email, password };

    elements.authSubmitBtn.disabled = true;
    elements.authBtnText.textContent = 'AUTHENTICATING...';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Authentication error');

      playCyberSound('click');
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('iot_token', data.token);
      localStorage.setItem('iot_user', JSON.stringify(data.user));

      renderAuthSuccess();
    } catch (err) {
      showAuthAlert(err.message, true);
    } finally {
      elements.authSubmitBtn.disabled = false;
      elements.authBtnText.textContent = isRegisterMode ? 'INITIALIZE ACCOUNT' : 'Sign In';
      initIcons();
    }
  });

  elements.logoutBtn.addEventListener('click', () => {
    playCyberSound('click');
    state.token = null;
    state.user = null;
    localStorage.removeItem('iot_token');
    localStorage.removeItem('iot_user');

    if (state.pollInterval) {
      clearInterval(state.pollInterval);
      state.pollInterval = null;
    }
    if (state.simulatorInterval) {
      clearInterval(state.simulatorInterval);
      state.simulatorInterval = null;
    }

    renderView();
  });

  function renderAuthSuccess() {
    renderView();
    fetchDashboardStats();
    fetchRecords(1);
    fetchChartData();
    startPolling();
  }

  // ==========================================
  // VIEW SWITCHING
  // ==========================================
  function renderView() {
    if (state.token && state.user) {
      elements.authPage.classList.add('hidden');
      elements.dashboardPage.classList.remove('hidden');
      elements.userBadge.classList.remove('hidden');
      elements.logoutBtn.classList.remove('hidden');
      elements.userGreeting.textContent = `Welcome ${state.user.name || 'User'}`;
      switchTab(state.currentTab);
    } else {
      elements.authPage.classList.remove('hidden');
      elements.dashboardPage.classList.add('hidden');
      elements.userBadge.classList.add('hidden');
      elements.logoutBtn.classList.add('hidden');
    }
    initIcons();
  }

  // ==========================================
  // TAB NAVIGATION
  // ==========================================
  function switchTab(tabNum) {
    state.currentTab = tabNum;
    playCyberSound('click');

    const tabs = [
      { btn: elements.tabBtn1, pane: elements.tabContent1 },
      { btn: elements.tabBtn2, pane: elements.tabContent2 },
      { btn: elements.tabBtn3, pane: elements.tabContent3 }
    ];

    tabs.forEach((tab, index) => {
      const isCurrent = index + 1 === tabNum;
      if (isCurrent) {
        tab.btn.classList.add('active-tab');
        tab.btn.classList.remove('text-slate-500', 'dark:text-slate-400');
        tab.pane.classList.remove('hidden');
      } else {
        tab.btn.classList.remove('active-tab');
        tab.btn.classList.add('text-slate-500', 'dark:text-slate-400');
        tab.pane.classList.add('hidden');
      }
    });

    if (tabNum === 1) {
      setTimeout(() => {
        if (state.tempChartInstance) state.tempChartInstance.resize();
        if (state.humChartInstance) state.humChartInstance.resize();
      }, 60);
    }
    initIcons();
  }

  elements.tabBtn1.addEventListener('click', () => switchTab(1));
  elements.tabBtn2.addEventListener('click', () => switchTab(2));
  elements.tabBtn3.addEventListener('click', () => switchTab(3));

  // ==========================================
  // HARDWARE TELEMETRY HEALTH STATUS
  // ==========================================
  async function checkDeviceHealth() {
    try {
      const res = await fetch('/api/device/health');
      if (!res.ok) return;
      const data = await res.json();
      state.isDeviceOnline = data.isOnline;

      if (data.isOnline) {
        elements.deviceStatusDot.className = 'relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee]';
        elements.deviceStatusPing.className = 'animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80';
        elements.deviceStatusText.textContent = 'ONLINE (ESP8266)';
        elements.deviceStatusText.className = 'font-tech text-cyan-500 dark:text-cyan-400 font-bold uppercase tracking-wider text-[11px]';
        elements.deviceStatusBadge.title = `ESP8266 actively transmitting (Last telemetry ${data.lastSeenSecondsAgo || 0}s ago)`;
      } else {
        elements.deviceStatusDot.className = 'relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_8px_#f43f5e]';
        elements.deviceStatusPing.className = 'hidden';
        elements.deviceStatusText.textContent = 'OFFLINE';
        elements.deviceStatusText.className = 'font-tech text-rose-500 font-bold uppercase tracking-wider text-[11px]';
        elements.deviceStatusBadge.title = data.lastSeen 
          ? `Device offline (Last seen ${data.lastSeenSecondsAgo}s ago)` 
          : 'Awaiting connection from ESP8266';
      }
    } catch (e) {
      console.warn('Device health check error:', e);
    }
  }

  // ==========================================
  // TAB 1: METRICS, CIRCULAR GAUGES & CHARTS
  // ==========================================
  async function fetchDashboardStats() {
    if (!state.token) return;
    try {
      const res = await fetch('/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      if (!res.ok) return;
      const data = await res.json();

      // Temperature (0 to 50 °C)
      const temp = parseFloat(data.currentTemperature) || 0;
      elements.currentTempDisplay.textContent = temp.toFixed(1);
      const tempPercent = Math.min(Math.max((temp / 50) * 100, 0), 100);
      elements.tempSeekPercent.textContent = `${Math.round(tempPercent)}%`;
      elements.tempBar.style.width = `${tempPercent}%`;

      // Circular Radial Gauge
      const tempOffset = CIRCLE_CIRCUMFERENCE - (tempPercent / 100) * CIRCLE_CIRCUMFERENCE;
      if (elements.tempCircleGauge) {
        elements.tempCircleGauge.style.strokeDashoffset = tempOffset;
      }

      // High Temperature Threshold Check & Auto-Cooling
      if (temp >= state.tempThreshold) {
        elements.tempAlertBanner.classList.remove('hidden');
        if (state.autoCoolingActive && !state.ledStatus) {
          playCyberSound('alert');
          setLedActuator(true);
        }
      } else {
        elements.tempAlertBanner.classList.add('hidden');
      }

      // Humidity (0 to 100 %)
      const hum = parseFloat(data.currentHumidity) || 0;
      elements.currentHumDisplay.textContent = hum.toFixed(1);
      const humPercent = Math.min(Math.max(hum, 0), 100);
      elements.humSeekPercent.textContent = `${Math.round(humPercent)}%`;
      elements.humBar.style.width = `${humPercent}%`;

      // Circular Radial Gauge
      const humOffset = CIRCLE_CIRCUMFERENCE - (humPercent / 100) * CIRCLE_CIRCUMFERENCE;
      if (elements.humCircleGauge) {
        elements.humCircleGauge.style.strokeDashoffset = humOffset;
      }

      // Sync Actuator & LCD
      if (typeof data.led === 'boolean') {
        updateLedUi(data.led, false);
      }
      if (data.line1 !== undefined && data.line2 !== undefined) {
        state.lcdLine1 = data.line1;
        state.lcdLine2 = data.line2;
        updateLcdUi(data.line1, data.line2);
      }

      elements.totalRecordsBadge.textContent = `TOTAL: ${data.totalRecords || 0}`;

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  }

  // Emergency Fan Button in Alert Banner
  if (elements.alertCoolingBtn) {
    elements.alertCoolingBtn.addEventListener('click', () => {
      setLedActuator(true);
    });
  }

  // Auto-Cooling Toggle in Tab 3
  if (elements.autoCoolingToggle) {
    elements.autoCoolingToggle.addEventListener('change', (e) => {
      state.autoCoolingActive = e.target.checked;
      playCyberSound('click');
    });
  }

  elements.refreshStatsBtn.addEventListener('click', () => {
    playCyberSound('click');
    fetchDashboardStats();
    fetchRecords(state.currentPage);
    fetchChartData();
    checkDeviceHealth();
  });

  // ==========================================
  // TAB 1: NEON CYBER CHARTS (CHART.JS)
  // ==========================================
  function isDarkMode() {
    return document.documentElement.classList.contains('dark');
  }

  function getChartColors(isDark) {
    return {
      textColor: isDark ? '#94a3b8' : '#64748b',
      gridColor: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(203, 213, 225, 0.5)',
      tempLine: '#f43f5e',
      tempFill: isDark ? 'rgba(244, 63, 94, 0.15)' : 'rgba(244, 63, 94, 0.08)',
      humLine: '#06b6d4',
      humFill: isDark ? 'rgba(6, 182, 212, 0.18)' : 'rgba(6, 182, 212, 0.08)'
    };
  }

  function initCharts() {
    const isDark = isDarkMode();
    const colors = getChartColors(isDark);

    const commonOptions = (yTitle, unit, minVal, maxVal) => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#0d121e' : '#ffffff',
          titleColor: isDark ? '#38bdf8' : '#0f172a',
          bodyColor: isDark ? '#f1f5f9' : '#334155',
          borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#cbd5e1',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            label: (ctx) => `${yTitle}: ${ctx.parsed.y} ${unit}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: colors.textColor, font: { family: 'VT323', size: 14 } }
        },
        y: {
          min: minVal,
          max: maxVal,
          grid: { color: colors.gridColor },
          ticks: {
            color: colors.textColor,
            font: { family: 'Chakra Petch', size: 11 },
            callback: (value) => `${value}${unit}`
          }
        }
      }
    });

    const ctxTemp = elements.tempChartCanvas.getContext('2d');
    state.tempChartInstance = new Chart(ctxTemp, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Temperature (°C)',
          data: [],
          borderColor: colors.tempLine,
          backgroundColor: colors.tempFill,
          borderWidth: 2.5,
          tension: 0.38,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: colors.tempLine
        }]
      },
      options: commonOptions('Temperature', '°C', 15, 50)
    });

    const ctxHum = elements.humChartCanvas.getContext('2d');
    state.humChartInstance = new Chart(ctxHum, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Humidity (%)',
          data: [],
          borderColor: colors.humLine,
          backgroundColor: colors.humFill,
          borderWidth: 2.5,
          tension: 0.38,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: colors.humLine
        }]
      },
      options: commonOptions('Humidity', '%', 20, 100)
    });
  }

  function updateChartThemes(isDark) {
    const colors = getChartColors(isDark);
    [state.tempChartInstance, state.humChartInstance].forEach(chart => {
      if (!chart) return;
      chart.options.scales.x.ticks.color = colors.textColor;
      chart.options.scales.y.ticks.color = colors.textColor;
      chart.options.scales.y.grid.color = colors.gridColor;
      chart.update();
    });
  }

  async function fetchChartData() {
    if (!state.token) return;
    try {
      const res = await fetch('/api/records/latest?count=20', {
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      const records = data.records || [];

      const labels = records.map(r => r.time || '');
      const tempData = records.map(r => r.temperature);
      const humData = records.map(r => r.humidity);

      if (state.tempChartInstance) {
        state.tempChartInstance.data.labels = labels;
        state.tempChartInstance.data.datasets[0].data = tempData;
        state.tempChartInstance.update('none');
      }

      if (state.humChartInstance) {
        state.humChartInstance.data.labels = labels;
        state.humChartInstance.data.datasets[0].data = humData;
        state.humChartInstance.update('none');
      }
    } catch (e) {
      console.warn('Error fetching chart telemetry:', e);
    }
  }

  // ==========================================
  // TAB 1: SAVED RECORDS (WITH PAGINATION & SEARCH)
  // Format: # | Temperature | Humidity | Time | Date | Action (Delete)
  // Timezone: Asia/Kolkata +5:30
  // ==========================================
  async function fetchRecords(page = 1) {
    if (!state.token) return;
    try {
      const res = await fetch(`/api/records?page=${page}&limit=${state.recordsLimit}`, {
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      if (!res.ok) return;
      const data = await res.json();

      state.currentPage = data.page;
      state.totalPages = data.totalPages || 1;
      state.recordsCache = data.records || [];

      filterAndRenderRecords();
      renderPagination(data.page, data.totalPages, data.totalRecords);

    } catch (err) {
      console.error('Error fetching records:', err);
    }
  }

  function filterAndRenderRecords() {
    const query = (elements.recordSearchInput ? elements.recordSearchInput.value : '').toLowerCase().trim();
    let records = state.recordsCache;

    if (query) {
      records = records.filter(r => 
        (r.time && r.time.toLowerCase().includes(query)) ||
        (r.date && r.date.toLowerCase().includes(query)) ||
        (r.temperature && r.temperature.toString().includes(query)) ||
        (r.humidity && r.humidity.toString().includes(query)) ||
        (r.id && r.id.toString().includes(query))
      );
    }

    renderRecordsTable(records);
  }

  if (elements.recordSearchInput) {
    elements.recordSearchInput.addEventListener('input', () => {
      filterAndRenderRecords();
    });
  }

  // Export to CSV
  if (elements.exportCsvBtn) {
    elements.exportCsvBtn.addEventListener('click', () => {
      playCyberSound('click');
      window.open('/api/records/export/csv', '_blank');
    });
  }

  function renderRecordsTable(records) {
    if (!records || records.length === 0) {
      elements.recordsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="py-12 text-center text-slate-400">
            <div class="flex flex-col items-center justify-center gap-2">
              <i data-lucide="database" class="w-8 h-8 text-slate-500"></i>
              <span class="text-sm font-tech">NO TELEMETRY LOGS MATCHING QUERY</span>
              <span class="text-xs text-slate-500 font-mono">ESP8266 DHT11 logs will automatically stream here.</span>
            </div>
          </td>
        </tr>
      `;
      initIcons();
      return;
    }

    elements.recordsTableBody.innerHTML = records.map(record => `
      <tr class="hover:bg-cyan-500/5 dark:hover:bg-indigo-500/10 transition-colors">
        <!-- # ID -->
        <td class="py-4 px-6 font-tech font-bold text-cyan-400">
          #${record.id}
        </td>

        <!-- Temperature -->
        <td class="py-4 px-6">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 font-tech">
            <i data-lucide="thermometer" class="w-3.5 h-3.5"></i>
            ${record.temperature} °C
          </span>
        </td>

        <!-- Humidity -->
        <td class="py-4 px-6">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-tech">
            <i data-lucide="droplet" class="w-3.5 h-3.5"></i>
            ${record.humidity}%
          </span>
        </td>

        <!-- Time (IST) -->
        <td class="py-4 px-6 font-mono text-xs text-slate-600 dark:text-slate-300">
          ${record.time}
        </td>

        <!-- Date (IST) -->
        <td class="py-4 px-6 font-mono text-xs text-slate-600 dark:text-slate-300">
          ${record.date}
        </td>

        <!-- Action: Delete -->
        <td class="py-4 px-6 text-right">
          <button 
            onclick="deleteRecordById(${record.id})" 
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold font-tech uppercase text-rose-500 hover:text-white hover:bg-rose-500 transition-all border border-rose-500/30 shadow-sm"
            title="Purge Record #${record.id}"
          >
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            <span>PURGE</span>
          </button>
        </td>
      </tr>
    `).join('');

    initIcons();
  }

  window.deleteRecordById = async function(id) {
    if (!confirm(`Confirm deletion of telemetry record #${id}?`)) return;

    try {
      const res = await fetch(`/api/records/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${state.token}` }
      });

      if (!res.ok) throw new Error('Deletion failed');
      playCyberSound('click');

      fetchRecords(state.currentPage);
      fetchDashboardStats();
      fetchChartData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  function renderPagination(currentPage, totalPages, totalRecords) {
    elements.currentPageNum.textContent = currentPage;
    elements.totalPagesNum.textContent = totalPages;
    elements.totalRecordsBadge.textContent = `TOTAL: ${totalRecords}`;

    elements.prevPageBtn.disabled = currentPage <= 1;
    elements.nextPageBtn.disabled = currentPage >= totalPages;

    elements.pageNumbersContainer.innerHTML = '';
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `w-7 h-7 rounded-lg text-xs font-bold font-tech transition-all ${
        i === currentPage 
          ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/30' 
          : 'bg-white/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-cyan-400'
      }`;
      pageBtn.textContent = i;
      pageBtn.onclick = () => {
        playCyberSound('click');
        fetchRecords(i);
      };
      elements.pageNumbersContainer.appendChild(pageBtn);
    }
  }

  elements.prevPageBtn.addEventListener('click', () => {
    if (state.currentPage > 1) {
      playCyberSound('click');
      fetchRecords(state.currentPage - 1);
    }
  });

  elements.nextPageBtn.addEventListener('click', () => {
    if (state.currentPage < state.totalPages) {
      playCyberSound('click');
      fetchRecords(state.currentPage + 1);
    }
  });

  // ==========================================
  // TAB 2: SMART LCD 16X2 CONTROLLER & PRESETS
  // ==========================================
  function updateLcdUi(r1, r2) {
    const padR1 = (r1 || '').toUpperCase().slice(0, 16);
    const padR2 = (r2 || '').toUpperCase().slice(0, 16);

    elements.lcdPreviewR1.textContent = padR1.padEnd(16, ' ');
    elements.lcdPreviewR2.textContent = padR2.padEnd(16, ' ');

    if (document.activeElement !== elements.lcdLine1) {
      elements.lcdLine1.value = padR1;
    }
    if (document.activeElement !== elements.lcdLine2) {
      elements.lcdLine2.value = padR2;
    }

    elements.line1Count.textContent = `${elements.lcdLine1.value.length} / 16`;
    elements.line2Count.textContent = `${elements.lcdLine2.value.length} / 16`;
  }

  // Quick Preset Chips click handler
  elements.presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      playCyberSound('click');
      const r1 = chip.getAttribute('data-r1') || '';
      let r2 = chip.getAttribute('data-r2') || '';

      if (chip.getAttribute('data-time') === 'true') {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        r2 = timeStr;
      }

      elements.lcdLine1.value = r1;
      elements.lcdLine2.value = r2;
      updateLcdUi(r1, r2);
    });
  });

  elements.lcdLine1.addEventListener('input', (e) => {
    const val = e.target.value.toUpperCase().slice(0, 16);
    e.target.value = val;
    elements.lcdPreviewR1.textContent = val.padEnd(16, ' ');
    elements.line1Count.textContent = `${val.length} / 16`;
  });

  elements.lcdLine2.addEventListener('input', (e) => {
    const val = e.target.value.toUpperCase().slice(0, 16);
    e.target.value = val;
    elements.lcdPreviewR2.textContent = val.padEnd(16, ' ');
    elements.line2Count.textContent = `${val.length} / 16`;
  });

  elements.lcdForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const line1 = elements.lcdLine1.value.trim().toUpperCase().slice(0, 16);
    const line2 = elements.lcdLine2.value.trim().toUpperCase().slice(0, 16);

    elements.saveLcdBtn.disabled = true;
    elements.saveLcdBtn.innerHTML = `
      <i data-lucide="loader" class="w-4 h-4 animate-spin"></i>
      <span>TRANSMITTING...</span>
    `;
    initIcons();

    try {
      const res = await fetch('/api/device/lcd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({ line1, line2 })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'LCD transmission failed');

      playCyberSound('click');
      elements.lcdStatusAlert.className = 'p-3 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-2';
      elements.lcdStatusAlert.innerHTML = `
        <i data-lucide="check-circle" class="w-4 h-4 flex-shrink-0"></i>
        <span>BUFFER CONFIRMED: "${data.line1}" / "${data.line2}"</span>
      `;
      elements.lcdStatusAlert.classList.remove('hidden');

    } catch (err) {
      elements.lcdStatusAlert.className = 'p-3 rounded-xl text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-2';
      elements.lcdStatusAlert.innerHTML = `
        <i data-lucide="alert-octagon" class="w-4 h-4 flex-shrink-0"></i>
        <span>ERROR: ${err.message}</span>
      `;
      elements.lcdStatusAlert.classList.remove('hidden');
    } finally {
      elements.saveLcdBtn.disabled = false;
      elements.saveLcdBtn.innerHTML = `
        <i data-lucide="send" class="w-4 h-4"></i>
        <span>TRANSMIT TO LCD</span>
      `;
      initIcons();
      setTimeout(() => elements.lcdStatusAlert.classList.add('hidden'), 5000);
    }
  });

  // ==========================================
  // TAB 3: ARC REACTOR ACTUATOR (PIN D3)
  // ==========================================
  function updateLedUi(isOn, triggerSound = false) {
    state.ledStatus = isOn;

    if (isOn) {
      if (triggerSound) playCyberSound('powerOn');
      elements.innovativeLedToggleBtn.classList.add('active-switch');
      elements.ledButtonLabel.textContent = 'SHUTDOWN REACTOR (LED OFF)';
      elements.ledStatusBadge.textContent = 'CORE ACTIVE (LED ON)';
      elements.ledStatusBadge.className = 'mt-1 text-3xl sm:text-4xl font-black font-tech tracking-wider text-cyan-400 drop-shadow-[0_0_15px_#22d3ee]';

      elements.reactorCore.classList.remove('is-off');
      elements.reactorCore.classList.add('is-on');
      elements.ledAmbientGlow.className = 'absolute inset-0 bg-gradient-to-b from-cyan-500/15 via-indigo-500/10 to-transparent transition-all duration-700 pointer-events-none';
      elements.ledSyncFeedback.textContent = 'NODEMCU PIN D3 DRIVEN HIGH (3.3V)';
      elements.ledSyncFeedback.className = 'mt-6 text-xs text-cyan-400 font-bold font-mono';
    } else {
      if (triggerSound) playCyberSound('powerOff');
      elements.innovativeLedToggleBtn.classList.remove('active-switch');
      elements.ledButtonLabel.textContent = 'INITIALIZE REACTOR (LED ON)';
      elements.ledStatusBadge.textContent = 'CORE OFFLINE (LED OFF)';
      elements.ledStatusBadge.className = 'mt-1 text-3xl sm:text-4xl font-black font-tech tracking-wider text-slate-400 dark:text-slate-600';

      elements.reactorCore.classList.remove('is-on');
      elements.reactorCore.classList.add('is-off');
      elements.ledAmbientGlow.className = 'absolute inset-0 bg-gradient-to-b from-cyan-500/0 via-indigo-500/0 to-transparent transition-all duration-700 pointer-events-none';
      elements.ledSyncFeedback.textContent = 'NODEMCU PIN D3 DRIVEN LOW (0V)';
      elements.ledSyncFeedback.className = 'mt-6 text-xs text-slate-400 font-mono';
    }
    initIcons();
  }

  async function setLedActuator(targetState) {
    updateLedUi(targetState, true);

    try {
      const res = await fetch('/api/device/led', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({ led: targetState })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Actuator toggle failed');

      updateLedUi(data.led, false);
    } catch (err) {
      console.error('Error toggling LED:', err);
      updateLedUi(!targetState, false);
      elements.ledSyncFeedback.textContent = `SYNC ERROR: ${err.message}`;
      elements.ledSyncFeedback.className = 'mt-6 text-xs text-rose-500 font-mono font-bold';
    }
  }

  elements.innovativeLedToggleBtn.addEventListener('click', () => {
    setLedActuator(!state.ledStatus);
  });

  // ==========================================
  // AUTO-POLLING INTERVAL (EVERY 5 SECONDS)
  // ==========================================
  function startPolling() {
    if (state.pollInterval) clearInterval(state.pollInterval);

    state.pollInterval = setInterval(() => {
      if (state.token) {
        checkDeviceHealth();
        fetchDashboardStats();
        if (state.currentTab === 1) {
          fetchChartData();
          fetchRecords(state.currentPage);
        }
      }
    }, 5000);
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================
  initTheme();
  initCharts();
  renderView();
  checkDeviceHealth();

  if (state.token && state.user) {
    fetchDashboardStats();
    fetchRecords(1);
    fetchChartData();
    startPolling();
  }

  initIcons();
});
