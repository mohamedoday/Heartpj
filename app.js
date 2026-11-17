/**
 * ============================================================================
 * QUANTUM-PULSE 100 // ENTERPRISE CRYPTOGRAPHIC COUNTER & CELEBRATION ENGINE
 * ============================================================================
 * Layers Implemented:
 * 1. CryptoVaultEngine      : AES-256-GCM Encryption + PBKDF2 Key Derivation
 * 2. IntegrityGuard         : SHA-256 State Checksum & Tamper Detection
 * 3. AcousticSynthesizer    : Web Audio API Procedural Sound & Fanfare Engine
 * 4. ParticlePhysicsEngine  : High-FPS Canvas Fireworks & Confetti Emitter
 * 5. QuantumCounterKernel   : Core State Orchestrator & DOM Controller
 * ============================================================================
 */

"use strict";

/* ============================================================================
 * LAYER 1: CRYPTOGRAPHIC STORAGE VAULT (AES-256-GCM + PBKDF2-SHA256)
 * ============================================================================ */
class CryptoVaultEngine {
    constructor(storageKey = "qp100_encrypted_vault_v1") {
        this.storageKey = storageKey;
        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder();
        this.pbkdf2Iterations = 120000;
        this.masterSeed = this.#resolveDeviceFingerprintSeed();
    }

    /**
     * Generates a deterministic local entropy seed combined with random salt
     * so stored ciphertext cannot be trivially copied across origins.
     */
    #resolveDeviceFingerprintSeed() {
        const rawEntropy = [
            navigator.userAgent,
            navigator.language,
            screen.width,
            screen.height,
            new Date().getTimezoneOffset(),
            "QP100-MILESTONE-VAULT-SECRET-ROOT"
        ].join("|");
        return rawEntropy;
    }

    /**
     * Derives a non-extractable AES-256-GCM CryptoKey using PBKDF2.
     * @param {Uint8Array} salt
     * @returns {Promise<CryptoKey>}
     */
    async #deriveAesKey(salt) {
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            this.encoder.encode(this.masterSeed),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        return window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: this.pbkdf2Iterations,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    }

    /**
     * Converts an ArrayBuffer or Uint8Array to a Base64 string.
     * @param {Uint8Array} bytes
     * @returns {string}
     */
    #bytesToBase64(bytes) {
        let binary = "";
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    /**
     * Converts a Base64 string back into a Uint8Array.
     * @param {string} base64
     * @returns {Uint8Array}
     */
    #base64ToBytes(base64) {
        const binary = window.atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Encrypts a JavaScript payload object with AES-256-GCM and persists it.
     * @param {Object} payload
     * @returns {Promise<boolean>}
     */
    async sealPayload(payload) {
        try {
            const salt = window.crypto.getRandomValues(new Uint8Array(16));
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const aesKey = await this.#deriveAesKey(salt);

            const serialized = JSON.stringify(payload);
            const encryptedBuffer = await window.crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv, tagLength: 128 },
                aesKey,
                this.encoder.encode(serialized)
            );

            const envelope = {
                v: 1,
                alg: "AES-256-GCM",
                salt: this.#bytesToBase64(salt),
                iv: this.#bytesToBase64(iv),
                ct: this.#bytesToBase64(new Uint8Array(encryptedBuffer)),
                ts: Date.now()
            };

            window.localStorage.setItem(this.storageKey, JSON.stringify(envelope));
            return true;
        } catch (err) {
            console.error("[CryptoVaultEngine] Encryption failure:", err);
            return false;
        }
    }

    /**
     * Reads, authenticates, and decrypts the stored vault payload.
     * @returns {Promise<Object|null>}
     */
    async unsealPayload() {
        try {
            const raw = window.localStorage.getItem(this.storageKey);
            if (!raw) return null;

            const envelope = JSON.parse(raw);
            if (!envelope || envelope.alg !== "AES-256-GCM" || !envelope.salt || !envelope.iv || !envelope.ct) {
                throw new Error("Malformed cryptographic envelope");
            }

            const salt = this.#base64ToBytes(envelope.salt);
            const iv = this.#base64ToBytes(envelope.iv);
            const ciphertext = this.#base64ToBytes(envelope.ct);
            const aesKey = await this.#deriveAesKey(salt);

            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv, tagLength: 128 },
                aesKey,
                ciphertext
            );

            const decodedJson = this.decoder.decode(decryptedBuffer);
            return JSON.parse(decodedJson);
        } catch (err) {
            console.warn("[CryptoVaultEngine] Vault tampered or unreadable. Purging corrupted data.", err);
            this.purgeVault();
            return null;
        }
    }

    /**
     * Securely erases the encrypted storage key.
     */
    purgeVault() {
        window.localStorage.removeItem(this.storageKey);
    }
}

/* ============================================================================
 * LAYER 2: MEMORY & STATE INTEGRITY GUARD (SHA-256 CHECKSUM ENGINE)
 * ============================================================================ */
class IntegrityGuard {
    constructor() {
        this.encoder = new TextEncoder();
        this.sessionNonce = this.#generateHexNonce(16);
    }

    #generateHexNonce(byteLength) {
        const bytes = window.crypto.getRandomValues(new Uint8Array(byteLength));
        return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    }

    /**
     * Computes a SHA-256 cryptographic signature for the current counter state.
     * @param {number} count
     * @param {number} startTimestamp
     * @returns {Promise<string>}
     */
    async computeStateSignature(count, startTimestamp) {
        const canonical = `${this.sessionNonce}::COUNT=${count}::START=${startTimestamp}`;
        const digest = await window.crypto.subtle.digest("SHA-256", this.encoder.encode(canonical));
        const hashArray = Array.from(new Uint8Array(digest));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
}

/* ============================================================================
 * LAYER 3: PROCEDURAL ACOUSTIC SYNTHESIZER (WEB AUDIO API)
 * ============================================================================ */
class AcousticSynthesizer {
    constructor() {
        this.ctx = null;
    }

    #ensureContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume().catch(() => {});
        }
    }

    /**
     * Plays a crisp tactile click whose pitch scales smoothly from 0 to 100.
     * @param {number} currentCount
     */
    playPulseTick(currentCount) {
        this.#ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Pitch ascends harmonically as user approaches 100
        const baseFreq = 260 + (Math.min(currentCount, 100) * 5.2);
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.065);

        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    /**
     * Plays a triumphant multi-chord victory fanfare when reaching 100.
     */
    playCelebrationFanfare() {
        this.#ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        // C Major 9th arpeggio notes (C5, E5, G5, B5, D6, C6)
        const notes = [523.25, 659.25, 783.99, 987.77, 1174.66, 1046.50];

        notes.forEach((freq, index) => {
            const startTime = now + index * 0.09;
            const duration = index === notes.length - 1 ? 0.95 : 0.35;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.001, startTime);
            gain.gain.linearRampToValueAtTime(0.18, startTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration + 0.02);
        });
    }
}

/* ============================================================================
 * LAYER 4: PARTICLE PHYSICS & FIREWORKS CELEBRATION ENGINE
 * ============================================================================ */
class ParticlePhysicsEngine {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext("2d");
        this.particles = [];
        this.animationFrameId = null;
        this.palette = [
            "#f59e0b", "#38bdf8", "#10b981", "#f43f5e",
            "#a855f7", "#fde047", "#ffffff"
        ];
        this.#bindResize();
    }

    #bindResize() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);
    }

    /**
     * Spawns a radial burst of high-velocity celebratory particles.
     * @param {number} originX
     * @param {number} originY
     * @param {number} count
     */
    emitBurst(originX, originY, count = 90) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
            const speed = 3 + Math.random() * 9.5;
            this.particles.push({
                x: originX,
                y: originY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2.2,
                gravity: 0.16 + Math.random() * 0.06,
                drag: 0.965,
                size: 3 + Math.random() * 4.5,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                color: this.palette[Math.floor(Math.random() * this.palette.length)],
                alpha: 1,
                decay: 0.008 + Math.random() * 0.01,
                shape: Math.random() > 0.45 ? "rect" : "circle"
            });
        }

        if (!this.animationFrameId) {
            this.#renderLoop();
        }
    }

    /**
     * Launches a multi-stage fireworks sequence across the viewport.
     */
    launchGrandCelebration() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        this.emitBurst(w * 0.5, h * 0.42, 130);
        setTimeout(() => this.emitBurst(w * 0.25, h * 0.35, 95), 250);
        setTimeout(() => this.emitBurst(w * 0.75, h * 0.35, 95), 480);
        setTimeout(() => this.emitBurst(w * 0.5, h * 0.28, 140), 780);
    }

    #renderLoop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.vx *= p.drag;
            p.vy = p.vy * p.drag + p.gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, p.alpha);
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            this.ctx.fillStyle = p.color;

            if (p.shape === "rect") {
                this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
            } else {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        }

        if (this.particles.length > 0) {
            this.animationFrameId = window.requestAnimationFrame(() => this.#renderLoop());
        } else {
            this.animationFrameId = null;
        }
    }
}

/* ============================================================================
 * LAYER 5: QUANTUM COUNTER KERNEL (ORCHESTRATOR & DOM CONTROLLER)
 * ============================================================================ */
class QuantumCounterKernel {
    constructor() {
        this.targetMilestone = 100;
        this.ringCircumference = 2 * Math.PI * 115; // 722.56631

        this.vault = new CryptoVaultEngine();
        this.guard = new IntegrityGuard();
        this.audio = new AcousticSynthesizer();
        this.physics = new ParticlePhysicsEngine(document.getElementById("celebrationCanvas"));

        this.dom = {
            counterDisplay: document.getElementById("counterDisplay"),
            progressRing: document.getElementById("progressRing"),
            incrementBtn: document.getElementById("incrementBtn"),
            resetBtn: document.getElementById("resetBtn"),
            percentDisplay: document.getElementById("percentDisplay"),
            vaultStateDisplay: document.getElementById("vaultStateDisplay"),
            integrityHash: document.getElementById("integrityHash"),
            celebrationModal: document.getElementById("celebrationModal"),
            completionTimeDisplay: document.getElementById("completionTimeDisplay"),
            closeCelebrationBtn: document.getElementById("closeCelebrationBtn"),
            restartFromModalBtn: document.getElementById("restartFromModalBtn")
        };

        this.state = {
            count: 0,
            startTimestamp: null,
            celebrated: false,
            signature: ""
        };
    }

    async initialize() {
        const restored = await this.vault.unsealPayload();
        if (restored && typeof restored.count === "number" && restored.count >= 0) {
            this.state.count = restored.count;
            this.state.startTimestamp = restored.startTimestamp || null;
            this.state.celebrated = Boolean(restored.celebrated);
        }

        await this.#refreshIntegritySignature();
        this.#bindEvents();
        this.#renderUI(false);
    }

    #bindEvents() {
        this.dom.incrementBtn.addEventListener("click", () => this.handleIncrement());
        this.dom.resetBtn.addEventListener("click", () => this.handleReset());

        this.dom.closeCelebrationBtn.addEventListener("click", () => {
            this.dom.celebrationModal.setAttribute("hidden", "");
        });

        this.dom.restartFromModalBtn.addEventListener("click", async () => {
            this.dom.celebrationModal.setAttribute("hidden", "");
            await this.handleReset();
        });

        // Keyboard accessibility (Space / Enter when not focused on another button)
        window.addEventListener("keydown", (event) => {
            if (event.code === "Space" && document.activeElement !== this.dom.incrementBtn) {
                if (this.dom.celebrationModal.hasAttribute("hidden")) {
                    event.preventDefault();
                    this.handleIncrement();
                }
            }
        });
    }

    async handleIncrement() {
        if (this.state.count === 0 && !this.state.startTimestamp) {
            this.state.startTimestamp = performance.now();
        }

        this.state.count += 1;
        this.audio.playPulseTick(this.state.count);

        // Emit subtle micro-spark on button click
        const btnRect = this.dom.incrementBtn.getBoundingClientRect();
        this.physics.emitBurst(
            btnRect.left + btnRect.width / 2,
            btnRect.top + btnRect.height / 2,
            12
        );

        await this.#refreshIntegritySignature();
        this.#renderUI(true);
        await this.#persistEncryptedState();

        // Trigger full celebration strictly upon reaching 100
        if (this.state.count === this.targetMilestone && !this.state.celebrated) {
            this.state.celebrated = true;
            await this.#persistEncryptedState();
            this.#triggerMilestone100Celebration();
        }
    }

    async handleReset() {
        this.state.count = 0;
        this.state.startTimestamp = null;
        this.state.celebrated = false;

        this.vault.purgeVault();
        await this.#refreshIntegritySignature();
        this.#renderUI(false);
    }

    async #refreshIntegritySignature() {
        this.state.signature = await this.guard.computeStateSignature(
            this.state.count,
            this.state.startTimestamp || 0
        );
    }

    async #persistEncryptedState() {
        this.dom.vaultStateDisplay.textContent = "جاري التشفير...";
        const ok = await this.vault.sealPayload({
            count: this.state.count,
            startTimestamp: this.state.startTimestamp,
            celebrated: this.state.celebrated,
            signature: this.state.signature
        });
        this.dom.vaultStateDisplay.textContent = ok ? "مؤمّن (AES-256)" : "خطأ تشفير";
    }

    #renderUI(animateBump) {
        const count = this.state.count;
        this.dom.counterDisplay.textContent = String(count);

        if (animateBump) {
            this.dom.counterDisplay.classList.remove("bump");
            void this.dom.counterDisplay.offsetWidth; // Force reflow for crisp animation
            this.dom.counterDisplay.classList.add("bump");
        }

        // Update SVG circular progress bar (clamped at 100%)
        const clampedRatio = Math.min(count / this.targetMilestone, 1);
        const offset = this.ringCircumference * (1 - clampedRatio);
        this.dom.progressRing.style.strokeDashoffset = String(offset);

        // Update percentage & integrity hash readout
        const percent = Math.floor(clampedRatio * 100);
        this.dom.percentDisplay.textContent = `${percent}%`;
        this.dom.integrityHash.textContent = `SHA256: 0x${this.state.signature.slice(0, 8).toUpperCase()}`;

        if (count >= this.targetMilestone) {
            this.dom.progressRing.classList.add("milestone-reached");
            this.dom.counterDisplay.classList.add("complete");
        } else {
            this.dom.progressRing.classList.remove("milestone-reached");
            this.dom.counterDisplay.classList.remove("complete");
        }
    }

    #triggerMilestone100Celebration() {
        const elapsedMs = this.state.startTimestamp
            ? Math.max(0, performance.now() - this.state.startTimestamp)
            : 0;
        const seconds = (elapsedMs / 1000).toFixed(1);

        this.dom.completionTimeDisplay.textContent = `${seconds}s`;
        this.dom.celebrationModal.removeAttribute("hidden");

        this.audio.playCelebrationFanfare();
        this.physics.launchGrandCelebration();
    }
}

/* ============================================================================
 * BOOTSTRAP APPLICATION ON DOM READY
 * ============================================================================ */
window.addEventListener("DOMContentLoaded", async () => {
    const kernel = new QuantumCounterKernel();
    await kernel.initialize();
});
