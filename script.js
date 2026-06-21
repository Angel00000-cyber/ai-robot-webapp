/**
 * AEON-v9 AI Robot Control System UI Controller (script.js)
 * Coordinates page UI interactions, animations, sensors, voice speech recognition, and AI vision overlays.
 * Integrated with ApiService (api.js) mock layer for backend-readiness.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize global styles and menu drawer toggles
    await syncThemeSettings();
    initializeLoaderFader();
    initializeSidebarDrawer();

    // Route functional page modules
    if (document.getElementById('homeNeuralCanvas')) {
        runHomeNetworkParticles();
    }
    if (document.getElementById('loginForm')) {
        runOperatorHandshakeForm();
    }
    if (document.getElementById('dpadContainer')) {
        runMotiveSteeringController();
    }
    if (document.getElementById('visionOverlayCanvas')) {
        runAiVisionInterface();
    }

});

// ==========================================
// 1. GLOBAL LAYOUTS & SYSTEM THEME SYNC
// ==========================================

async function syncThemeSettings() {
    try {
        // Force default theme to light
        localStorage.setItem('aeon_themeMode', 'light');
        
        // Fetch current active variables from local settings database
        const settings = await ApiService.getRobotSettings();
        document.body.setAttribute('data-theme-mode', settings.themeMode);
        document.body.setAttribute('data-theme-accent', settings.themeAccent);
    } catch (e) {
        console.error('Failed to sync settings from Api:', e);
    }
}

function initializeLoaderFader() {
    const loader = document.getElementById('cyberLoader');
    if (!loader) return;
    
    // Function to hide loader
    const hideLoader = () => {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
            showHudAlert('AEON-v9 SECURE SSL CONNECTION INITIALIZED', 'success');
        }, 500);
    };
    
    // Hide loader when page fully loads
    window.addEventListener('load', () => {
        setTimeout(hideLoader, 1200); // realistic load delay
    });
    
    // Safety timeout: hide loader after 5 seconds max
    setTimeout(hideLoader, 5000);
}

function initializeSidebarDrawer() {
    const burger = document.getElementById('mobileBurger');
    const sidebar = document.getElementById('sidebarMenu');
    if (!burger || !sidebar) return;

    burger.addEventListener('click', () => {
        burger.classList.toggle('open');
        sidebar.classList.toggle('open');
    });

    // Close menu when clicking outside on mobile devices
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 991 && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && !burger.contains(e.target)) {
                burger.classList.remove('open');
                sidebar.classList.remove('open');
            }
        }
    });
}

// Global HUD notification toast creator
function showHudAlert(message, type = 'info') {
    const container = document.getElementById('hudAlertContainer');
    if (!container) {
        const div = document.createElement('div');
        div.id = 'hudAlertContainer';
        document.body.appendChild(div);
    }
    
    const alert = document.createElement('div');
    alert.className = `hud-alert`;
    
    // Theme border and shadow mappings
    alert.style.borderColor = type === 'success' ? 'var(--color-success)' : type === 'error' ? 'var(--color-error)' : type === 'warning' ? 'var(--color-warning)' : 'var(--accent)';
    alert.style.boxShadow = `0 5px 25px rgba(0,0,0,0.5), 0 0 15px ${type === 'success' ? 'rgba(0, 255, 102, 0.3)' : type === 'error' ? 'rgba(255, 0, 85, 0.3)' : 'var(--accent-glow)'}`;
    
    let badge = '⚡';
    if (type === 'success') badge = '✓';
    else if (type === 'error') badge = '⚠';
    else if (type === 'warning') badge = '⚡';

    alert.innerHTML = `<span>${badge}</span> <span>${message}</span>`;
    document.getElementById('hudAlertContainer').appendChild(alert);

    // Audio beeps feedback
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'error') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(140, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.25);
        } else {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(type === 'success' ? 900 : 700, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.03, audioContext.currentTime);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.12);
        }
    } catch (e) { /* ignored if blocked by user interaction requirements */ }

    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transform = 'translateY(15px) scale(0.95)';
        alert.style.transition = 'all 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 3200);
}

// ==========================================
// 2. LANDING HOME PAGE NEURAL CANVAS
// ==========================================

function runHomeNetworkParticles() {
    const canvas = document.getElementById('homeNeuralCanvas');
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    
    window.addEventListener('resize', () => {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
    });

    const dots = [];
    const maxDots = 35;
    
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.7;
            this.vy = (Math.random() - 0.5) * 0.7;
            this.radius = Math.random() * 2 + 1;
        }
        
        move() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > width) this.vx = -this.vx;
            if (this.y < 0 || this.y > height) this.vy = -this.vy;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--accent');
            ctx.fill();
        }
    }
    
    for (let i = 0; i < maxDots; i++) {
        dots.push(new Particle());
    }
    
    function loop() {
        ctx.clearRect(0, 0, width, height);
        dots.forEach(d => {
            d.move();
            d.draw();
        });
        
        // Render glowing nodes linking
        const accentColor = getComputedStyle(document.body).getPropertyValue('--accent-rgb');
        for (let i = 0; i < dots.length; i++) {
            for (let j = i + 1; j < dots.length; j++) {
                const dx = dots[i].x - dots[j].x;
                const dy = dots[i].y - dots[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 100) {
                    ctx.beginPath();
                    ctx.moveTo(dots[i].x, dots[i].y);
                    ctx.lineTo(dots[j].x, dots[j].y);
                    ctx.strokeStyle = `rgba(${accentColor || '0, 240, 255'}, ${0.15 * (1 - dist/100)})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(loop);
    }
    loop();
}

// ==========================================
// 3. OPERATOR PORTAL HANDSHAKE VALIDATOR
// ==========================================

function runOperatorHandshakeForm() {
    const form = document.getElementById('loginForm');
    const scanner = document.getElementById('loginScanner');
    const scanBar = document.getElementById('scanProgress');
    const scanText = document.getElementById('scanText');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('opEmail').value.trim();
        const password = document.getElementById('opPasscode').value.trim();

        if (!email || !password) {
            showHudAlert('FIELDS MISSING', 'error');
            return;
        }

        try {
            // Call mock fetch authentication
            const data = await ApiService.loginOperator(email, password);
            
            if (data.success) {
                // Engage scanning HUD visual overlay
                scanner.classList.add('active');
                showHudAlert('HANDSHAKE DECRYPT KEY ENGAGED', 'warning');
                
                let percent = 0;
                const progressTimer = setInterval(() => {
                    percent += 4;
                    scanBar.style.width = `${percent}%`;
                    
                    if (percent === 40) scanText.innerText = "AUTHENTICATING COMMAND CREDENTIALS...";
                    if (percent === 80) scanText.innerText = "OPENING SECURE SHIELD TUNNELS...";
                    
                    if (percent >= 100) {
                        clearInterval(progressTimer);
                        scanText.innerText = `LINK COMPLETE! WELCOME COMMANDER.`;
                        
                        // Set credentials cache
                        localStorage.setItem('op_authorized', 'true');
                        localStorage.setItem('op_token', data.token);
                        localStorage.setItem('op_moniker', data.operator.callSign);
                        
                        setTimeout(() => {
                            window.location.href = 'control.html';
                        }, 1200);
                    }
                }, 60);
            }
        } catch (err) {
            showHudAlert('SECURITY SERVICE OFFLINE', 'error');
        }
    });

    const forgotBtn = document.getElementById('btnForgot');
    if (forgotBtn) {
        forgotBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showHudAlert('CONTACT LAB ADMINISTRATOR FOR PASSWORD RESET', 'warning');
        });
    }
}

// ==========================================
// 5. MOTIVE STEERING & VOICE CONTROL DESK
// ==========================================

function runMotiveSteeringController() {
    const statusLabel = document.getElementById('motiveStatusText');
    const speedSlider = document.getElementById('thrustSlider');
    const speedLabel = document.getElementById('thrustVal');

    // ==========================================
    // ROBOTIC ARM CONTROLS & STABILIZERS CHECK
    // ==========================================
    const toggleArms = document.getElementById('toggleArms');
    const armLockOverlay = document.getElementById('armLockOverlay');
    const armStatusText = document.getElementById('armStatusText');
    const btnPick = document.getElementById('btnArmPick');
    const btnDrop = document.getElementById('btnArmDrop');

    function updateArmLockState() {
        if (!toggleArms || !armLockOverlay) return;
        if (toggleArms.checked) {
            armLockOverlay.classList.add('disabled');
            if (armStatusText) armStatusText.innerText = 'ARM: READY';
        } else {
            armLockOverlay.classList.remove('disabled');
            if (armStatusText) armStatusText.innerText = 'ARM: PARKED';
        }
    }

    if (toggleArms) {
        toggleArms.addEventListener('change', () => {
            updateArmLockState();
            const state = toggleArms.checked ? 'CALIBRATED & ONLINE' : 'PARKED & OFFLINE';
            showHudAlert(`SERVO GRIPPERS: ${state}`, toggleArms.checked ? 'success' : 'error');
        });
        // Run initial check
        updateArmLockState();
    }

    // Direct Arm Directional Movement Buttons
    const armButtons = document.querySelectorAll('.arm-dpad-btn:not(.arm-center-node)');
    armButtons.forEach(btn => {
        const armDir = btn.getAttribute('data-arm-dir');
        
        const startArmAction = () => {
            if (toggleArms && !toggleArms.checked) return;
            if (armStatusText) armStatusText.innerText = `ARM: MOVING ${armDir}`;
            ApiService.sendArmCommand(`MOVE_${armDir}`);
            showHudAlert(`ARM PROTOCOL: MOVE ${armDir}`, 'warning');
            btn.classList.add('active');
        };

        const stopArmAction = () => {
            if (toggleArms && !toggleArms.checked) return;
            if (armStatusText) armStatusText.innerText = 'ARM: READY';
            ApiService.sendArmCommand('STOP');
            btn.classList.remove('active');
        };

        btn.addEventListener('mousedown', startArmAction);
        btn.addEventListener('mouseup', stopArmAction);
        btn.addEventListener('mouseleave', stopArmAction);

        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startArmAction();
        });
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            stopArmAction();
        });
    });

    // Arm PICK (GRAB) Trigger action
    if (btnPick) {
        btnPick.addEventListener('click', () => {
            if (toggleArms && !toggleArms.checked) {
                showHudAlert('ARM CALIBRATION DEACTIVATED', 'error');
                return;
            }
            if (armStatusText) armStatusText.innerText = 'ARM: PICKING';
            ApiService.sendArmCommand('PICK');
            showHudAlert('ARM COMMAND: PICK (GRAB) SEQUENCE DISPATCHED', 'success');
            
            btnPick.classList.add('active');
            setTimeout(() => {
                btnPick.classList.remove('active');
                if (armStatusText && toggleArms && toggleArms.checked) armStatusText.innerText = 'ARM: READY';
            }, 800);
        });
    }

    // Arm DROP (RELEASE) Trigger action
    if (btnDrop) {
        btnDrop.addEventListener('click', () => {
            if (toggleArms && !toggleArms.checked) {
                showHudAlert('ARM CALIBRATION DEACTIVATED', 'error');
                return;
            }
            if (armStatusText) armStatusText.innerText = 'ARM: DROPPING';
            ApiService.sendArmCommand('DROP');
            showHudAlert('ARM COMMAND: DROP (RELEASE) SEQUENCE DISPATCHED', 'error');
            
            btnDrop.classList.add('active');
            setTimeout(() => {
                btnDrop.classList.remove('active');
                if (armStatusText && toggleArms && toggleArms.checked) armStatusText.innerText = 'ARM: READY';
            }, 800);
        });
    }

    // ==========================================
    // MOTIVE PROPULSION D-PAD DIRECT BURSTS
    // ==========================================
    const motiveButtons = document.querySelectorAll('.dpad-btn:not(.center-node)');
    motiveButtons.forEach(btn => {
        const dir = btn.getAttribute('data-dir');
        
        const startMotiveAction = () => {
            const speed = speedSlider ? parseInt(speedSlider.value) : 50;
            if (statusLabel) statusLabel.innerText = `STEERINGBURST: ${dir}`;
            ApiService.sendMotiveCommand(dir, speed);
            showHudAlert(`PROPULSION DISPATCHED: ${dir}`, 'warning');
            btn.classList.add('active');
        };

        const stopMotiveAction = () => {
            if (statusLabel) statusLabel.innerText = 'PROPULSION: READY';
            ApiService.sendMotiveCommand("STOP", 0);
            btn.classList.remove('active');
        };

        btn.addEventListener('mousedown', startMotiveAction);
        btn.addEventListener('mouseup', stopMotiveAction);
        btn.addEventListener('mouseleave', stopMotiveAction);

        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startMotiveAction();
        });
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            stopMotiveAction();
        });
    });

    // ==========================================
    // DUAL KEYBOARD GAMEPAD INTEGRATION
    // ==========================================
    const motiveKeyMap = {
        'w': 'UP',
        's': 'DOWN',
        'a': 'LEFT',
        'd': 'RIGHT'
    };

    const armKeyMap = {
        'arrowup': 'UP',
        'arrowdown': 'DOWN',
        'arrowleft': 'LEFT',
        'arrowright': 'RIGHT'
    };

    const activeMotiveKeys = new Set();
    const activeArmKeys = new Set();

    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }
        
        const key = e.key.toLowerCase();

        // 1. Motive D-Pad Control Keys (WASD)
        if (motiveKeyMap[key]) {
            const dir = motiveKeyMap[key];
            if (!activeMotiveKeys.has(dir)) {
                e.preventDefault();
                activeMotiveKeys.add(dir);
                
                const btn = document.querySelector(`.dpad-btn[data-dir="${dir}"]`);
                if (btn) btn.classList.add('active');

                const speed = speedSlider ? parseInt(speedSlider.value) : 50;
                if (statusLabel) statusLabel.innerText = `STEERINGBURST: ${dir}`;
                ApiService.sendMotiveCommand(dir, speed);
                showHudAlert(`PROPULSION DISPATCHED: ${dir}`, 'warning');
            }
        }
        
        // 2. Robotic Arm Control Keys (Arrow Keys)
        else if (armKeyMap[key]) {
            if (toggleArms && !toggleArms.checked) {
                return; // Arm is locked
            }
            const dir = armKeyMap[key];
            if (!activeArmKeys.has(dir)) {
                e.preventDefault();
                activeArmKeys.add(dir);
                
                const btn = document.querySelector(`.arm-dpad-btn[data-arm-dir="${dir}"]`);
                if (btn) btn.classList.add('active');

                if (armStatusText) armStatusText.innerText = `ARM: MOVING ${dir}`;
                ApiService.sendArmCommand(`MOVE_${dir}`);
                showHudAlert(`ARM PROTOCOL: MOVE ${dir}`, 'warning');
            }
        }

        // 3. Pick/Grab Shortcuts (Space / P)
        else if (key === ' ' || key === 'p') {
            e.preventDefault();
            const pickButton = document.getElementById('btnArmPick');
            if (pickButton) pickButton.click();
        }

        // 4. Drop/Release Shortcuts (Escape / Backspace / O)
        else if (key === 'escape' || key === 'backspace' || key === 'o') {
            e.preventDefault();
            const dropButton = document.getElementById('btnArmDrop');
            if (dropButton) dropButton.click();
        }
    });

    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();

        // 1. Motive Keys Up
        if (motiveKeyMap[key]) {
            const dir = motiveKeyMap[key];
            if (activeMotiveKeys.has(dir)) {
                activeMotiveKeys.delete(dir);
                
                const btn = document.querySelector(`.dpad-btn[data-dir="${dir}"]`);
                if (btn) btn.classList.remove('active');

                if (activeMotiveKeys.size === 0) {
                    if (statusLabel) statusLabel.innerText = 'PROPULSION: READY';
                    ApiService.sendMotiveCommand("STOP", 0);
                } else {
                    const nextDir = Array.from(activeMotiveKeys)[activeMotiveKeys.size - 1];
                    const speed = speedSlider ? parseInt(speedSlider.value) : 50;
                    if (statusLabel) statusLabel.innerText = `STEERINGBURST: ${nextDir}`;
                    ApiService.sendMotiveCommand(nextDir, speed);
                }
            }
        }
        
        // 2. Arm Keys Up
        else if (armKeyMap[key]) {
            const dir = armKeyMap[key];
            if (activeArmKeys.has(dir)) {
                activeArmKeys.delete(dir);
                
                const btn = document.querySelector(`.arm-dpad-btn[data-arm-dir="${dir}"]`);
                if (btn) btn.classList.remove('active');

                if (activeArmKeys.size === 0) {
                    if (armStatusText && toggleArms && toggleArms.checked) armStatusText.innerText = 'ARM: READY';
                    ApiService.sendArmCommand('STOP');
                } else {
                    const nextDir = Array.from(activeArmKeys)[activeArmKeys.size - 1];
                    if (armStatusText && toggleArms && toggleArms.checked) armStatusText.innerText = `ARM: MOVING ${nextDir}`;
                    ApiService.sendArmCommand(`MOVE_${nextDir}`);
                }
            }
        }
    });

    window.addEventListener('blur', () => {
        // Clear motive keys
        if (activeMotiveKeys.size > 0) {
            activeMotiveKeys.forEach(dir => {
                const btn = document.querySelector(`.dpad-btn[data-dir="${dir}"]`);
                if (btn) btn.classList.remove('active');
            });
            activeMotiveKeys.clear();
            if (statusLabel) statusLabel.innerText = 'PROPULSION: READY';
            ApiService.sendMotiveCommand("STOP", 0);
        }

        // Clear arm keys
        if (activeArmKeys.size > 0) {
            activeArmKeys.forEach(dir => {
                const btn = document.querySelector(`.arm-dpad-btn[data-arm-dir="${dir}"]`);
                if (btn) btn.classList.remove('active');
            });
            activeArmKeys.clear();
            if (armStatusText && toggleArms && toggleArms.checked) armStatusText.innerText = 'ARM: READY';
            ApiService.sendArmCommand('STOP');
        }
    });

    // Speed Controller Adjustments
    if (speedSlider && speedLabel) {
        speedSlider.addEventListener('input', () => {
            speedLabel.innerText = `${speedSlider.value}%`;
        });
    }

    // Toggle stabilizers status logs triggers
    const stabilizers = document.getElementById('toggleStabilizer');
    if (stabilizers) {
        stabilizers.addEventListener('change', () => {
            const state = stabilizers.checked ? 'ACTIVE' : 'OFFLINE';
            showHudAlert(`STABILIZERS SET TO: ${state}`, stabilizers.checked ? 'success' : 'error');
        });
    }

    // Toggle Headlight status logs triggers
    const headlight = document.getElementById('toggleLights');
    if (headlight) {
        headlight.addEventListener('change', () => {
            const state = headlight.checked ? 'BEAM ACTIVE' : 'BEAM OFFLINE';
            showHudAlert(`FRONT HEADLIGHT: ${state}`, headlight.checked ? 'success' : 'warning');
        });
    }

    // Toggle speaker status logs triggers
    const audioSpeaker = document.getElementById('toggleAudio');
    if (audioSpeaker) {
        audioSpeaker.addEventListener('change', () => {
            const state = audioSpeaker.checked ? 'SYNTHESIZER ONLINE' : 'SYNTHESIZER MUTED';
            showHudAlert(`IMPELLER SPEAKER: ${state}`, audioSpeaker.checked ? 'success' : 'warning');
        });
    }

    // Voice Command Speech Engine Integration
    const voiceBtn = document.getElementById('btnVoiceCommand');
    const voiceStatusText = document.getElementById('voiceStatusText');
    const voiceLogs = document.getElementById('voiceCommandLog');
    const voiceLastText = document.getElementById('voiceLastCommand');
    const waveLines = document.querySelectorAll('.wave-bar');
    
    let recognitionInstance;
    let waveTimer;

    if (voiceBtn) {
        voiceBtn.addEventListener('click', () => {
            if (voiceStatusText.innerText.includes('LISTENING')) {
                deactivateMicrophoneSpeech();
            } else {
                activateMicrophoneSpeech();
            }
        });
    }

    function activateMicrophoneSpeech() {
        voiceStatusText.innerText = 'MIC: LISTENING';
        voiceStatusText.className = 'neon-text';
        voiceBtn.innerText = 'Close Voice Link';
        voiceBtn.classList.add('sec');

        // Animate wave graphics
        waveLines.forEach(w => w.classList.add('active'));
        waveTimer = setInterval(() => {
            waveLines.forEach(w => {
                const height = Math.random() * 32 + 5;
                w.style.height = `${height}px`;
            });
        }, 80);

        showHudAlert('SPEECH RECOGNIZER ENGINE ACTIVE', 'success');

        // Setup speech bindings
        const WebSpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (WebSpeechRecognition) {
            recognitionInstance = new WebSpeechRecognition();
            recognitionInstance.continuous = true;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = 'en-US';

            recognitionInstance.onresult = (e) => {
                const phrase = e.results[e.results.length - 1][0].transcript.trim().toLowerCase();
                processSpeechPhrase(phrase);
            };

            recognitionInstance.onerror = (e) => {
                console.warn('Speech recognition error:', e.error);
                if (e.error === 'not-allowed') {
                    showHudAlert('MICROPHONE ACCESS DENIED', 'error');
                    deactivateMicrophoneSpeech();
                }
            };

            // Restart recognition if it ends while we are still listening (e.g. browser silent timeout)
            recognitionInstance.onend = () => {
                if (voiceStatusText && voiceStatusText.innerText.includes('LISTENING') && recognitionInstance) {
                    try {
                        recognitionInstance.start();
                    } catch (err) {
                        console.error('Failed to restart speech recognition:', err);
                    }
                }
            };

            recognitionInstance.start();
        } else {
            showHudAlert('SPEECH RECOGNITION NOT SUPPORTED BY BROWSER', 'error');
            deactivateMicrophoneSpeech();
        }
    }

    function deactivateMicrophoneSpeech() {
        voiceStatusText.innerText = 'MIC: INACTIVE';
        voiceStatusText.className = 'neon-text-sec';
        voiceBtn.innerText = 'Initialize Mic Link';
        voiceBtn.classList.remove('sec');

        waveLines.forEach(w => {
            w.classList.remove('active');
            w.style.height = '4px';
        });
        clearInterval(waveTimer);

        if (voiceSimulationTimeout) {
            clearTimeout(voiceSimulationTimeout);
            voiceSimulationTimeout = null;
        }

        if (recognitionInstance) {
            recognitionInstance.stop();
            recognitionInstance = null;
        }
        showHudAlert('VOICE SPEECH INPUT SHUTDOWN', 'info');
    }

    function processSpeechPhrase(command) {
        if (!voiceLogs || !voiceLastText) return;
        voiceLogs.style.display = 'block';
        voiceLastText.innerText = `"${command}"`;

        const speed = speedSlider ? parseInt(speedSlider.value) : 50;
        
        // Match vocal phrases to robotic steering directions
        if (command.includes('move forward') || command.includes('forward')) {
            showHudAlert('VOICE COMMAND: FORWARD', 'success');
            statusLabel.innerText = 'VOICE: MOVE FORWARD';
            ApiService.sendMotiveCommand('FORWARD', speed);
            highlightDpadNode('UP');
        } else if (command.includes('move backward') || command.includes('backward')) {
            showHudAlert('VOICE COMMAND: BACKWARD', 'success');
            statusLabel.innerText = 'VOICE: MOVE BACKWARD';
            ApiService.sendMotiveCommand('BACKWARD', speed);
            highlightDpadNode('DOWN');
        } else if (command.includes('turn left') || command.includes('left')) {
            showHudAlert('VOICE COMMAND: LEFT', 'success');
            statusLabel.innerText = 'VOICE: TURN LEFT';
            ApiService.sendMotiveCommand('LEFT', speed);
            highlightDpadNode('LEFT');
        } else if (command.includes('turn right') || command.includes('right')) {
            showHudAlert('VOICE COMMAND: RIGHT', 'success');
            statusLabel.innerText = 'VOICE: TURN RIGHT';
            ApiService.sendMotiveCommand('RIGHT', speed);
            highlightDpadNode('RIGHT');
        } else if (command.includes('stop')) {
            showHudAlert('VOICE COMMAND: STOP MOTIVE', 'error');
            statusLabel.innerText = 'VOICE: STOP';
            ApiService.sendMotiveCommand('STOP', 0);
            highlightDpadNode(null);
        } else {
            showHudAlert(`UNRECOGNIZED PHRASE: "${command}"`, 'warning');
        }
    }

    function highlightDpadNode(dir) {
        const nodes = document.querySelectorAll('.dpad-btn');
        nodes.forEach(n => n.classList.remove('active'));
        if (!dir) return;
        const target = document.querySelector(`.dpad-btn[data-dir="${dir}"]`);
        if (target) {
            target.classList.add('active');
            setTimeout(() => target.classList.remove('active'), 1500);
        }
    }

    // Fallback simulation for unsupported browsers/offline mic
    let voiceSimulationTimeout;
    function simulateVocalCommands() {
        const phrases = ['move forward', 'turn left', 'stop', 'turn right'];
        
        function queueSimulation() {
            voiceSimulationTimeout = setTimeout(() => {
                if (voiceStatusText.innerText.includes('LISTENING')) {
                    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
                    processSpeechPhrase(phrase);
                    queueSimulation();
                }
            }, 6000);
        }
        queueSimulation();
    }
}

// ==========================================
// 6. AI VISION INTERFACE WIDGETS
// ==========================================

function runAiVisionInterface() {
    const canvas = document.getElementById('visionOverlayCanvas');
    const ctx = canvas.getContext('2d');
    const list = document.getElementById('visionDetectionsList');
    const video = document.getElementById('webcamVideo');
    const btnToggleWebcam = document.getElementById('btnToggleWebcam');
    const btnClearClassifier = document.getElementById('btnClearClassifier');
    const webcamStatus = document.getElementById('webcamStatus');
    const trackedObjectsListContainer = document.getElementById('trackedObjectsListContainer');
    const activeModelName = document.getElementById('activeModelName');
    const totalSamplesCount = document.getElementById('totalSamplesCount');
    const targetObjectNameInput = document.getElementById('targetObjectName');
    const btnUploadTarget = document.getElementById('btnUploadTarget');
    const targetImageInput = document.getElementById('targetImageInput');
    const targetThumbnailsContainer = document.getElementById('targetThumbnailsContainer');
    const targetSamplesBadge = document.getElementById('targetSamplesBadge');

    let width = canvas.width = 800;
    let height = canvas.height = 450;
    
    // Core state
    let isWebcamActive = false;
    let streamInstance = null;
    let registeredTarget = {
        name: "Custom Target",
        samples: [] // Array of { src, vector (Float32Array) }
    };
    
    let cocoModel = null;
    let tfModel = null;
    let fallbackClassifier = null;
    let isTfReady = false;
    let animationFrameId = null;
    let lastTrackedObjects = [];
    let isClassifying = false;
    let lastClassifyTime = 0;
    const classifyThrottleMs = 150; // Throttle classification to run at most once every 150ms to keep webcam feed smooth
    
    // Offscreen Canvas for cropping bounding boxes
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');

    // Helper: Calculate Cosine Similarity between two Float32Arrays
    function cosineSimilarity(vecA, vecB) {
        let dotProduct = 0.0;
        let normA = 0.0;
        let normB = 0.0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    // Fallback Pixel-Matching Classifier for Offline Use
    class PixelTargetMatcher {
        constructor() {
            this.examples = []; // Array of Float32Array (16x16 color grids)
            this.canvas = document.createElement('canvas');
            this.canvas.width = 16;
            this.canvas.height = 16;
            this.ctx = this.canvas.getContext('2d');
        }

        getFeatureVector(imageElement) {
            this.ctx.clearRect(0, 0, 16, 16);
            this.ctx.drawImage(imageElement, 0, 0, 16, 16);
            const imgData = this.ctx.getImageData(0, 0, 16, 16).data;
            const vector = new Float32Array(16 * 16 * 3);
            let idx = 0;
            for (let i = 0; i < imgData.length; i += 4) {
                vector[idx++] = imgData[i] / 255.0;     // R
                vector[idx++] = imgData[i + 1] / 255.0; // G
                vector[idx++] = imgData[i + 2] / 255.0; // B
            }
            return vector;
        }

        addExample(imageElement) {
            const vector = this.getFeatureVector(imageElement);
            this.examples.push(vector);
        }

        clear() {
            this.examples = [];
        }

        match(cropElement) {
            if (this.examples.length === 0) return 0;
            
            const cropVector = this.getFeatureVector(cropElement);
            let minDistance = Infinity;

            for (const exVector of this.examples) {
                let sumSq = 0;
                for (let i = 0; i < cropVector.length; i++) {
                    const diff = cropVector[i] - exVector[i];
                    sumSq += diff * diff;
                }
                const dist = Math.sqrt(sumSq);
                if (dist < minDistance) {
                    minDistance = dist;
                }
            }

            // Map distance (0.0 - 5.5) to confidence (100% - 0%)
            const confidence = Math.max(0, 1 - (minDistance / 4.8));
            return confidence;
        }
    }

    // Initialize Models
    async function initModels() {
        if (activeModelName) activeModelName.innerText = "LOADING AI MODELS...";
        
        try {
            // Check CDN scripts availability
            if (window.tf && window.mobilenet && window.cocoSsd) {
                // Try WebGL backend first for GPU acceleration, fallback to CPU if needed
                try {
                    await tf.setBackend('webgl');
                    console.log("Using WebGL backend for GPU acceleration.");
                } catch (webglErr) {
                    console.warn("WebGL backend loading failed, falling back to CPU backend:", webglErr);
                    await tf.setBackend('cpu');
                }
                cocoModel = await cocoSsd.load();
                tfModel = await mobilenet.load({ version: 2, alpha: 1.0 });
                isTfReady = true;
                if (activeModelName) activeModelName.innerText = `COCO-SSD + MobileNet V2 (${tf.getBackend().toUpperCase()})`;
                showHudAlert("AI COGNITIVE DETECTOR LOADED SUCCESSFULLY", "success");
            } else {
                throw new Error("TensorFlow CDN scripts not available");
            }
        } catch (e) {
            console.warn("TF CDN loading failed. Engaging offline pixel-matcher.", e);
            fallbackClassifier = new PixelTargetMatcher();
            isTfReady = false;
            if (activeModelName) activeModelName.innerText = "Pixel-Matching Fallback (Offline)";
            showHudAlert("ENGAGING OFFLINE COGNITIVE SCAN ENGINE", "warning");
        }
        
        // Load target name if stored
        const storedName = localStorage.getItem("aeon_target_name");
        if (storedName && targetObjectNameInput) {
            targetObjectNameInput.value = storedName;
            registeredTarget.name = storedName;
        }
        
        updateTotalSamplesCount();
    }

    // Target Memory Registration Operations
    async function addReferenceAngles(files) {
        showHudAlert(`PROCESSING ${files.length} REFERENCE ANGLES...`, "warning");
        let loadedCount = 0;

        for (const file of files) {
            await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = async () => {
                        let trainElement = img;
                        
                        // Smart Bounding Box Cropping for Reference Uploads
                        if (isTfReady && cocoModel) {
                            try {
                                const predictions = await cocoModel.detect(img);
                                if (predictions.length > 0) {
                                    // Take largest detected bounding box area to filter out background
                                    let largest = predictions[0];
                                    for (let j = 1; j < predictions.length; j++) {
                                        if (predictions[j].bbox[2] * predictions[j].bbox[3] > largest.bbox[2] * largest.bbox[3]) {
                                            largest = predictions[j];
                                        }
                                    }
                                    
                                    const [bx, by, bw, bh] = largest.bbox;
                                    const cropCanvas = document.createElement('canvas');
                                    cropCanvas.width = bw;
                                    cropCanvas.height = bh;
                                    const cropCtx = cropCanvas.getContext('2d');
                                    cropCtx.drawImage(img, bx, by, bw, bh, 0, 0, bw, bh);
                                    
                                    // Use cropped sub-image for feature extraction
                                    trainElement = cropCanvas;
                                }
                            } catch (e) {
                                console.warn("Failed reference cropping check, falling back to full image", e);
                            }
                        }

                        // Feature vector extraction
                        if (isTfReady && tfModel) {
                            try {
                                const tensor = tf.browser.fromPixels(trainElement);
                                const logits = tfModel.infer(tensor, 'conv_preds');
                                const vector = await logits.data();
                                
                                registeredTarget.samples.push({
                                    src: event.target.result,
                                    vector: vector
                                });
                                
                                tensor.dispose();
                                logits.dispose();
                            } catch (err) {
                                console.error("MobileNet extraction error:", err);
                            }
                        } else if (fallbackClassifier) {
                            fallbackClassifier.addExample(trainElement);
                            registeredTarget.samples.push({
                                src: event.target.result,
                                vector: null
                            });
                        }

                        loadedCount++;
                        resolve();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        updateTotalSamplesCount();
        renderThumbnailsUI();
        showHudAlert(`FED ${loadedCount} TARGET REFERENCE ANGLES TO DATABASE`, "success");
    }

    function updateTotalSamplesCount() {
        const count = registeredTarget.samples.length;
        
        if (totalSamplesCount) totalSamplesCount.innerText = `${count} angles`;
        if (targetSamplesBadge) targetSamplesBadge.innerText = `${count} Reference Angles`;
        
        if (count > 0 && btnClearClassifier) {
            btnClearClassifier.style.display = "block";
        } else if (btnClearClassifier) {
            btnClearClassifier.style.display = "none";
        }
    }

    function renderThumbnailsUI() {
        if (!targetThumbnailsContainer) return;
        targetThumbnailsContainer.innerHTML = "";
        
        if (registeredTarget.samples.length === 0) {
            targetThumbnailsContainer.innerHTML = `<span style="color: var(--text-muted); font-size: 0.7rem; font-family: var(--font-mono)">NO ANGLES LOADED</span>`;
            return;
        }

        // Show last 8 reference thumbnails
        const recent = registeredTarget.samples.slice(-8);
        recent.forEach(sample => {
            const imgEl = document.createElement("img");
            imgEl.src = sample.src;
            imgEl.className = "class-thumbnail";
            imgEl.alt = "Trained angle";
            targetThumbnailsContainer.appendChild(imgEl);
        });
    }

    function clearMemory() {
        registeredTarget.samples = [];
        if (fallbackClassifier) {
            fallbackClassifier.clear();
        }
        
        updateTotalSamplesCount();
        renderThumbnailsUI();
        showHudAlert("TARGET MEMORY PURGED SUCCESSFULLY", "error");
    }

    function pushLogEntry(targetName, conf) {
        if (!list) return;
        const timestamp = new Date().toLocaleTimeString();
        const row = document.createElement('div');
        row.className = 'vision-detection-card';
        row.innerHTML = `
            <div class="vision-obj-info">
                <span class="vision-obj-name" style="color: var(--color-success); font-weight:bold;">LOCK: ${targetName.toUpperCase()}</span>
                <span class="vision-obj-time">${timestamp}</span>
            </div>
            <span class="vision-obj-conf" style="color: var(--color-success)">
                ${(conf * 100).toFixed(0)}%
            </span>
        `;
        list.insertBefore(row, list.firstChild);
        
        if (list.children.length > 10) {
            list.removeChild(list.lastChild);
        }
    }

    function drawPlaceholderBackdrop() {
        ctx.fillStyle = '#050a18';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.font = '15px Share Tech Mono';
        ctx.textAlign = 'center';
        
        if (registeredTarget.samples.length === 0) {
            ctx.fillText('UPLOAD object images from different angles to register your target.', width / 2, height / 2 - 12);
            ctx.fillText('Name your target and load reference files to activate detection.', width / 2, height / 2 + 12);
        } else {
            ctx.fillText('OPTICAL WEB CAMERA STREAM DISCONNECTED', width / 2, height / 2 - 12);
            ctx.fillText('Click "INITIALIZE WEBCAM" below to start normal camera stream.', width / 2, height / 2 + 12);
        }
    }

    // Helper function to draw overlay boxes and lock tags on top of video feed
    function drawOverlay(objects) {
        if (!objects || objects.length === 0) return;

        for (const obj of objects) {
            if (obj.isFallback) {
                ctx.strokeStyle = '#00ff66';
                ctx.lineWidth = 3;
                ctx.strokeRect(40, 40, width - 80, height - 80);

                const labelText = `LOCK MATCH: ${obj.name.toUpperCase()} (${(obj.conf * 100).toFixed(0)}%)`;
                ctx.fillStyle = 'rgba(0,0,0,0.85)';
                ctx.font = 'bold 12px Share Tech Mono';
                ctx.fillRect(40, 20, ctx.measureText(labelText).width + 10, 20);
                ctx.fillStyle = '#00ff66';
                ctx.fillText(labelText, 45, 34);
                continue;
            }

            const { x, y, w, h, name, conf, isTarget } = obj;

            if (isTarget) {
                // Custom Target Lock: Glowing green/red thicker borders
                ctx.strokeStyle = '#00ff66';
                ctx.lineWidth = 3.5;
                ctx.strokeRect(x, y, w, h);

                // Bracket corners
                ctx.fillStyle = '#00ff66';
                const cornerLen = Math.min(15, Math.min(w, h) * 0.2);
                // Top-left
                ctx.fillRect(x - 1, y - 1, cornerLen, 4);
                ctx.fillRect(x - 1, y - 1, 4, cornerLen);
                // Top-right
                ctx.fillRect(x + w - cornerLen + 1, y - 1, cornerLen, 4);
                ctx.fillRect(x + w - 4 + 1, y - 1, 4, cornerLen);
                // Bottom-left
                ctx.fillRect(x - 1, y + h - 4 + 1, cornerLen, 4);
                ctx.fillRect(x - 1, y + h - cornerLen + 1, 4, cornerLen);
                // Bottom-right
                ctx.fillRect(x + w - cornerLen + 1, y + h - 4 + 1, cornerLen, 4);
                ctx.fillRect(x + w - 4 + 1, y + h - cornerLen + 1, 4, cornerLen);

                // Draw Lock acquired text box
                const labelText = `TARGET LOCK: ${name.toUpperCase()} (${(conf * 100).toFixed(0)}%)`;
                ctx.fillStyle = 'rgba(0,0,0,0.85)';
                ctx.font = 'bold 12px Share Tech Mono';
                const labelWidth = ctx.measureText(labelText).width;
                ctx.fillRect(x, y - 20, labelWidth + 10, 20);

                ctx.fillStyle = '#00ff66';
                ctx.fillText(labelText, x + 5, y - 6);
            } else {
                // Generic Object: Thin white/blue outline box
                ctx.strokeStyle = '#00f0ff';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(x, y, w, h);

                const labelText = `${name.toUpperCase()} (${(conf * 100).toFixed(0)}%)`;
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.font = '11px Share Tech Mono';
                const labelWidth = ctx.measureText(labelText).width;
                ctx.fillRect(x, y - 18, labelWidth + 8, 18);

                ctx.fillStyle = '#00f0ff';
                ctx.fillText(labelText, x + 4, y - 5);
            }
        }
    }

    // Core Frame Classifier & Bounding Tracker Loop
    async function classifyFrame() {
        if (!isWebcamActive || !video || video.paused || video.ended) return;

        let trackedObjects = [];

        // 2. Locate objects via COCO-SSD
        if (isTfReady && cocoModel) {
            try {
                const scaleX = width / video.videoWidth;
                const scaleY = height / video.videoHeight;
                const predictions = await cocoModel.detect(video);
                
                for (const pred of predictions) {
                    const [bboxX, bboxY, bboxW, bboxH] = pred.bbox;
                    const x = bboxX * scaleX;
                    const y = bboxY * scaleY;
                    const w = bboxW * scaleX;
                    const h = bboxH * scaleY;

                    let isTargetMatch = false;
                    let matchConfidence = 0;

                    // 3. Crop object region and verify against memory database
                    if (registeredTarget.samples.length > 0) {
                        offscreenCanvas.width = Math.max(1, bboxW);
                        offscreenCanvas.height = Math.max(1, bboxH);
                        offscreenCtx.drawImage(video, bboxX, bboxY, bboxW, bboxH, 0, 0, bboxW, bboxH);

                        if (tfModel) {
                            try {
                                const cropTensor = tf.browser.fromPixels(offscreenCanvas);
                                const logits = tfModel.infer(cropTensor, 'conv_preds');
                                const cropVector = await logits.data();
                                
                                cropTensor.dispose();
                                logits.dispose();

                                let maxSim = -1;
                                for (const sample of registeredTarget.samples) {
                                    if (sample.vector) {
                                        const sim = cosineSimilarity(cropVector, sample.vector);
                                        if (sim > maxSim) maxSim = sim;
                                    }
                                }
                                
                                const simThreshold = 0.74; // Standard metric threshold
                                if (maxSim >= simThreshold) {
                                    isTargetMatch = true;
                                    matchConfidence = Math.min(1.0, (maxSim - simThreshold) / (1.0 - simThreshold));
                                }
                            } catch (e) {
                                console.error("Error cropping neural evaluation:", e);
                            }
                        }
                    }

                    // 4. Record Bounding Boxes & Target Tag Overlays
                    if (isTargetMatch && matchConfidence > 0.55) {
                        trackedObjects.push({
                            name: registeredTarget.name,
                            x: x,
                            y: y,
                            w: w,
                            h: h,
                            conf: matchConfidence,
                            isTarget: true,
                            coords: `x:${Math.round(x)}, y:${Math.round(y)}`
                        });

                        // Log acquisitions
                        if (Math.random() > 0.95) {
                            pushLogEntry(registeredTarget.name, matchConfidence);
                        }
                    } else {
                        trackedObjects.push({
                            name: pred.class,
                            x: x,
                            y: y,
                            w: w,
                            h: h,
                            conf: pred.score,
                            isTarget: false,
                            coords: `x:${Math.round(x)}, y:${Math.round(y)}`
                        });
                    }
                }
            } catch (err) {
                console.error("COCO-SSD tracking loop error:", err);
            }
        } else if (fallbackClassifier && registeredTarget.samples.length > 0) {
            // Offline fallbacks using Pixel Target Matcher on full canvas
            const confidence = fallbackClassifier.match(video);
            if (confidence > 0.58) {
                trackedObjects.push({
                    name: registeredTarget.name,
                    coords: "Centered viewport",
                    conf: confidence,
                    isTarget: true,
                    isFallback: true
                });

                if (Math.random() > 0.95) {
                    pushLogEntry(registeredTarget.name, confidence);
                }
            }
        }

        // 5. Update right-hand Neural Tracker Status panel
        lastTrackedObjects = trackedObjects;
        updateNeuralTrackerList(trackedObjects);
    }

    function updateNeuralTrackerList(objects) {
        if (!trackedObjectsListContainer) return;
        
        if (objects.length === 0) {
            trackedObjectsListContainer.innerHTML = `<span style="color: var(--text-muted); font-size: 0.75rem; font-family: var(--font-mono); text-align: center; display: block; padding-top: 25px;">NO DETECTIONS ACTIVE</span>`;
            return;
        }

        trackedObjectsListContainer.innerHTML = "";
        objects.forEach(obj => {
            const row = document.createElement("div");
            row.className = "tracked-object-row";
            row.innerHTML = `
                <span class="tracked-object-name ${obj.isTarget ? 'target-lock' : ''}">
                    ${obj.isTarget ? '⚡ ' : ''}${obj.name.toUpperCase()}
                </span>
                <span class="tracked-object-coords">
                    ${obj.coords} (${(obj.conf * 100).toFixed(0)}%)
                </span>
            `;
            trackedObjectsListContainer.appendChild(row);
        });
    }

    // Webcam streams control lifecycle
    async function toggleWebcam() {
        if (isWebcamActive) {
            stopWebcamStream();
        } else {
            await startWebcamStream();
        }
    }

    async function startWebcamStream() {
        if (btnToggleWebcam) {
            btnToggleWebcam.innerText = "CONNECTING...";
            btnToggleWebcam.disabled = true;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 360 },
                    frameRate: { ideal: 60, min: 30 },
                    facingMode: "user"
                },
                audio: false
            });
            
            streamInstance = stream;
            video.srcObject = stream;
            video.style.display = "none";
            
            await new Promise((resolve) => {
                video.onloadedmetadata = () => {
                    video.play().then(resolve);
                };
            });

            isWebcamActive = true;
            if (webcamStatus) {
                webcamStatus.innerText = "WEBCAM: ACTIVE";
                webcamStatus.className = "neon-text";
            }
            if (btnToggleWebcam) {
                btnToggleWebcam.innerText = "STOP CAM FEED";
                btnToggleWebcam.classList.add("sec");
                btnToggleWebcam.classList.remove("filled");
                btnToggleWebcam.disabled = false;
            }

            // Fire main tick loop
            const renderLoop = () => {
                if (!isWebcamActive) return;

                // 1. Draw raw video feed & overlay on canvas at high framerate (60 FPS)
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(video, 0, 0, width, height);
                drawOverlay(lastTrackedObjects);

                // 2. Schedule async classification if the previous run is completed and throttle interval has elapsed
                const now = performance.now();
                if (!isClassifying && now - lastClassifyTime >= classifyThrottleMs) {
                    isClassifying = true;
                    lastClassifyTime = now;
                    classifyFrame().catch(err => {
                        console.error("Error in frame classification loop:", err);
                    }).finally(() => {
                        isClassifying = false;
                    });
                }

                animationFrameId = requestAnimationFrame(renderLoop);
            };
            renderLoop();
            
            showHudAlert("OPTICAL WEBCAM FEED COMPLETED HANDSHAKE", "success");
        } catch (e) {
            console.error("Camera access failed:", e);
            if (btnToggleWebcam) {
                btnToggleWebcam.innerText = "INITIALIZE WEBCAM";
                btnToggleWebcam.classList.remove("sec");
                btnToggleWebcam.classList.add("filled");
                btnToggleWebcam.disabled = false;
            }
            showHudAlert("WEBCAM INITIALIZATION REJECTED. CHECK SYSTEM PERMISSIONS.", "error");
        }
    }

    function stopWebcamStream() {
        isWebcamActive = false;
        isClassifying = false;
        lastTrackedObjects = [];
        
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        if (streamInstance) {
            streamInstance.getTracks().forEach(track => track.stop());
            streamInstance = null;
        }

        if (video) {
            video.pause();
            video.srcObject = null;
            video.style.display = "none";
        }

        if (webcamStatus) {
            webcamStatus.innerText = "WEBCAM: OFFLINE";
            webcamStatus.className = "neon-text-sec";
        }

        if (btnToggleWebcam) {
            btnToggleWebcam.innerText = "INITIALIZE WEBCAM";
            btnToggleWebcam.classList.remove("sec");
            btnToggleWebcam.classList.add("filled");
        }

        if (trackedObjectsListContainer) {
            trackedObjectsListContainer.innerHTML = `<span style="color: var(--text-muted); font-size: 0.75rem; font-family: var(--font-mono); text-align: center; display: block; padding-top: 25px;">NO DETECTIONS ACTIVE</span>`;
        }

        drawPlaceholderBackdrop();
        showHudAlert("WEBCAM TERMINATED", "info");
    }

    // Setup Event Listeners
    if (btnToggleWebcam) {
        btnToggleWebcam.addEventListener("click", toggleWebcam);
    }

    if (btnClearClassifier) {
        btnClearClassifier.addEventListener("click", clearMemory);
    }
    
    if (btnUploadTarget) {
        btnUploadTarget.addEventListener("click", () => {
            if (targetImageInput) targetImageInput.click();
        });
    }

    if (targetImageInput) {
        targetImageInput.addEventListener("change", (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                addReferenceAngles(Array.from(files));
            }
        });
    }

    if (targetObjectNameInput) {
        targetObjectNameInput.addEventListener("input", (e) => {
            const newName = e.target.value.trim() || "Custom Target";
            registeredTarget.name = newName;
            localStorage.setItem("aeon_target_name", newName);
        });
    }

    // Run Initializers
    initModels();
    drawPlaceholderBackdrop();
}


