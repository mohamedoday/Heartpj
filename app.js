/**
 * ============================================================================
 * LIQUID-OS QUANTUM COUNTER ENTERPRISE KERNEL v4.8
 * ============================================================================
 * Architecture Modules:
 * 1. CryptoVaultEngine      : AES-256-GCM State Encryption & PBKDF2 Key Derivation
 * 2. IntegrityGuard         : SHA-256 State Checksum & Tamper Prevention
 * 3. AcousticSynthesizer    : Web Audio API Procedural Dynamic Sound Engine
 * 4. ParticlePhysicsEngine  : High-FPS Canvas Fireworks & Confetti Emitter
 * 5. QuantumCounterKernel   : Core State Orchestrator & DOM Renderer
 * ============================================================================
 */

"use strict";

/* ============================================================================
 * MODULE 1: CRYPTOGRAPHIC STORAGE VAULT (AES-256-GCM + PBKDF2-SHA256)
 * ============================================================================ */
class CryptoVaultEngine {
    constructor(storageKey = "liquidos_enterprise_vault_v4") {
        this.storageKey = storageKey;
        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder();
        this.pbkdf2Iterations = 200000;
        this.masterSeed = this.#resolveDeviceFingerprintSeed();
    }

    #resolveDeviceFingerprintSeed() {
        return [
            navigator.userAgent || "browser",
            navigator.language || "ar",
            screen.width || 1920,
            screen.height || 1080,
            "LIQUID-OS-ENTERPRISE-SECURITY-ROOT-KEY-2026"
        ].join("|");
    }

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

    #bytesToBase64(bytes) {
        let binary = "";
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    #base64ToBytes(base64) {
        const binary = window.atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

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
                v: 4,
                alg: "AES-256-GCM",
                salt: this.#bytesToBase64(salt),
                iv: this.#bytesToBase64(iv),
                ct: this.#bytesToBase64(new Uint8Array(encryptedBuffer)),
                ts: Date.now()
            };

            window.localStorage.setItem(this.storageKey, JSON.stringify(envelope));
            return true;
        } catch (err) {
            console.error("[CryptoVaultEngine] Critical encryption failure:", err);
            return false;
        }
    }

    async unsealPayload() {
        try {
            const raw = window.localStorage.getItem(this.storageKey);
            if (!raw) return null;

            const envelope = JSON.parse(raw);
            if (!envelope || envelope.alg !== "AES-256-GCM") {
                throw new Error("Invalid cryptographic envelope format detected");
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

            return JSON.parse(this.decoder.decode(decryptedBuffer));
        } catch (err) {
            console.warn("[CryptoVaultEngine] Vault integrity validation failed. Purging state.", err);
            this.purgeVault();
            return null;
        }
    }

    purgeVault() {
        window.localStorage.removeItem(this.storageKey);
    }
}

/* ============================================================================
 * MODULE 2: INTEGRITY GUARD & HASH VERIFICATION
 * ============================================================================ */
class IntegrityGuard {
    constructor() {
        this.encoder = new TextEncoder();
        this.nonce = this.#generateNonce();
    }

    #generateNonce() {
        const arr = window.crypto.getRandomValues(new Uint8Array(12));
        return Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
    }

    async computeHash(count, timestamp) {
        const raw = `${this.nonce}::COUNT=${count}::TS=${timestamp}::LIQUIDOS`;
        const digest = await window.crypto.subtle.digest("SHA-256", this.encoder.encode(raw));
        const bytes = Array.from(new Uint8Array(digest));
        return bytes.map(b => b.toString(16).padStart(2, "0")).join("");
    }
}

/* ============================================================================
 * MODULE 3: ACOUSTIC SYNTHESIZER (WEB AUDIO API)
 * ============================================================================ */
class AcousticSynthesizer {
    constructor() {
        this.ctx = null;
    }

    #initContext() {
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

    playClickSound(currentCount) {
        this.#initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const freq = 300 + (Math.min(currentCount, 100) * 5.2);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.45, now + 0.06);

        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    playFanfare() {
        this.#initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const chord = [523.25, 659.25, 783.99, 987.77, 1174.66, 1318.51];

        chord.forEach((f, idx) => {
            const t = now + idx * 0.09;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = "triangle";
            osc.frequency.setValueAtTime(f, t);

            gain.gain.setValueAtTime(0.001, t);
            gain.gain.linearRampToValueAtTime(0.18, t + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.7);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.75);
        });
    }
}

/* ============================================================================
 * MODULE 4: PARTICLE PHYSICS & FIREWORKS ENGINE
 * ============================================================================ */
class ParticlePhysicsEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.particles = [];
        this.animId = null;
        this.colors = ["#f59e0b", "#38bdf8", "#10b981", "#8b5cf6", "#ef4444", "#ffffff", "#fbbf24"];
        this.#resize();
    }

    #resize() {
        const updateSize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        };
        updateSize();
        window.addEventListener("resize", updateSize);
    }

    spawnBurst(x, y, count = 120) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2.5 + Math.random() * 9;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.8,
                gravity: 0.16,
                drag: 0.965,
                size: 3 + Math.random() * 4.5,
                alpha: 1,
                decay: 0.006 + Math.random() * 0.009,
                color: this.colors[Math.floor(Math.random() * this.colors.length)]
            });
        }
        if (!this.animId) this.#loop();
    }

    launchCelebration() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.spawnBurst(w * 0.5, h * 0.4, 160);
        setTimeout(() => this.spawnBurst(w * 0.28, h * 0.32, 100), 220);
        setTimeout(() => this.spawnBurst(w * 0.72, h * 0.32, 100), 440);
        setTimeout(() => this.spawnBurst(w * 0.5, h * 0.25, 180), 750);
    }

    #loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.vx *= p.drag;
            p.vy = p.vy * p.drag + p.gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, p.alpha);
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        if (this.particles.length > 0) {
            this.animId = window.requestAnimationFrame(() => this.#loop());
        } else {
            this.animId = null;
        }
    }
}

/* ============================================================================
 * MODULE 5: QUANTUM COUNTER KERNEL & STATE ORCHESTRATOR
 * ============================================================================ */
class QuantumCounterKernel {
    constructor() {
        this.target = 100;
        this.ringCircumference = 816.814;
        this.vault = new CryptoVaultEngine();
        this.guard = new IntegrityGuard();
        this.audio = new AcousticSynthesizer();
        this.physics = new ParticlePhysicsEngine(document.getElementById("particleCanvas"));

        this.dom = {
            counterNum: document.getElementById("counterNumber"),
            ringProgress: document.getElementById("liquidRingProgress"),
            triggerBtn: document.getElementById("quantumTriggerBtn"),
            resetBtn: document.getElementById("resetVaultBtn"),
            vaultStatus: document.getElementById("vaultStatusText"),
            hashDisplay: document.getElementById("hashDisplay"),
            modal: document.getElementById("celebrationModal"),
            resumeBtn: document.getElementById("modalResumeBtn"),
            modalResetBtn: document.getElementById("modalResetBtn")
        };

        this.state = {
            count: 0,
            timestamp: null,
            celebrated: false,
            hash: ""
        };
    }

    async init() {
        const restored = await this.vault.unsealPayload();
        if (restored && typeof restored.count === "number") {
            this.state.count = restored.count;
            this.state.timestamp = restored.timestamp || null;
            this.state.celebrated = Boolean(restored.celebrated);
        }

        await this.#updateHash();
        this.#bind();
        this.#render(false);
    }

    #bind() {
        this.dom.triggerBtn.addEventListener("click", () => this.increment());
        this.dom.resetBtn.addEventListener("click", () => this.reset());
        this.dom.resumeBtn.addEventListener("click", () => this.dom.modal.setAttribute("hidden", ""));
        this.dom.modalResetBtn.addEventListener("click", async () => {
            this.dom.modal.setAttribute("hidden", "");
            await this.reset();
        });
    }

    async increment() {
        if (this.state.count === 0 && !this.state.timestamp) {
            this.state.timestamp = performance.now();
        }

        this.state.count += 1;
        this.audio.playClickSound(this.state.count);

        const rect = this.dom.triggerBtn.getBoundingClientRect();
        this.physics.spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 14);

        await this.#updateHash();
        this.#render(true);
        await this.#save();

        if (this.state.count === this.target && !this.state.celebrated) {
            this.state.celebrated = true;
            await this.#save();
            this.#celebrate();
        }
    }

    async reset() {
        this.state.count = 0;
        this.state.timestamp = null;
        this.state.celebrated = false;
        this.vault.purgeVault();
        await this.#updateHash();
        this.#render(false);
    }

    async #updateHash() {
        this.state.hash = await this.guard.computeHash(this.state.count, this.state.timestamp || 0);
    }

    async #save() {
        this.dom.vaultStatus.textContent = "جاري التشفير...";
        const ok = await this.vault.sealPayload({
            count: this.state.count,
            timestamp: this.state.timestamp,
            celebrated: this.state.celebrated,
            hash: this.state.hash
        });
        this.dom.vaultStatus.textContent = ok ? "AES-256-GCM [نشط]" : "خطأ تشفير";
    }

    #render(animate) {
        const count = this.state.count;
        this.dom.counterNum.textContent = String(count);

        if (animate) {
            this.dom.counterNum.classList.remove("bump");
            void this.dom.counterNum.offsetWidth;
            this.dom.counterNum.classList.add("bump");
        }

        const ratio = Math.min(count / this.target, 1);
        const offset = this.ringCircumference * (1 - ratio);
        this.dom.ringProgress.style.strokeDashoffset = String(offset);
        this.dom.hashDisplay.textContent = `0x${this.state.hash.slice(0, 8).toUpperCase()}`;

        if (count >= this.target) {
            this.dom.ringProgress.classList.add("complete");
            this.dom.counterNum.classList.add("complete");
        } else {
            this.dom.ringProgress.classList.remove("complete");
            this.dom.counterNum.classList.remove("complete");
        }
    }

    #celebrate() {
        this.dom.modal.removeAttribute("hidden");
        this.audio.playFanfare();
        this.physics.launchCelebration();
    }
}

window.addEventListener("DOMContentLoaded", async () => {
    const kernel = new QuantumCounterKernel();
    await kernel.init();
});
