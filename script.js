/**
 * ============================================================================
 * CYBERNETIC CODE HEART ENGINE - ADVANCED KERNEL v2.4.0
 * Architecture: Particle-Matrix Hybrid Rendering with Web Audio Synthesizer
 * ============================================================================
 */

class CyberCodeHeartEngine {
    constructor() {
        this.canvas = document.getElementById('heartCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.matrixCanvas = document.createElement('canvas');
        this.matrixCtx = this.matrixCanvas.getContext('2d');
        
        // إعدادات الحالة والبارامترات
        this.particles = [];
        this.matrixDrops = [];
        this.codeSnippets = [
            "function", "const", "let", "return", "if", "else", "for", "while",
            "class", "async", "await", "import", "export", "try", "catch", "=>",
            "HTML5", "CSS3", "JavaScript", "React", "Node.js", "Python", "C#",
            "0x7F", "0xFF", "NULL", "true", "false", "void", "int", "float",
            "canvas.getContext", "requestAnimationFrame", "addEventListener",
            "Math.sin", "Math.cos", "Math.PI", "vector3D", "matrixMatrix",
            "SHA-256", "RSA-4096", "AES-GCM", "TCP/IP", "SYN_ACK", "BUFFER_OVERFLOW"
        ];
        
        this.config = {
            theme: 'neon-pink',
            pulseSpeed: 1.0,
            particleCount: 1800,
            chaosLevel: 15,
            matrixActive: true,
            audioActive: false
        };

        this.mouse = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            isHovered: false
        };

        this.stats = {
            fps: 60,
            frameCount: 0,
            lastTime: performance.now(),
            energy: 99.8
        };

        this.audioCtx = null;
        this.oscillator = null;
        this.gainNode = null;

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.setupMatrixRain();
        this.setupEventListeners();
        this.generateHeartParticles();
        this.initAudioContext();

        // حلقة التشغيل الرئيسية (Main Render Loop)
        requestAnimationFrame((time) => this.loop(time));
    }

    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        this.matrixCanvas.width = window.innerWidth;
        this.matrixCanvas.height = window.innerHeight;
        
        const matrixBg = document.getElementById('matrixBg');
        if (matrixBg && !matrixBg.contains(this.matrixCanvas)) {
            matrixBg.appendChild(this.matrixCanvas);
        }
    }

    setupMatrixRain() {
        const fontSize = 14;
        const columns = Math.floor(this.matrixCanvas.width / fontSize);
        this.matrixDrops = [];
        for (let i = 0; i < columns; i++) {
            this.matrixDrops[i] = Math.floor(Math.random() * this.matrixCanvas.height);
        }
    }

    setupEventListeners() {
        // لوحة التحكم وتغيير المتغيرات
        document.getElementById('colorTheme').addEventListener('change', (e) => {
            this.config.theme = e.target.value;
        });

        const speedSlider = document.getElementById('pulseSpeed');
        speedSlider.addEventListener('input', (e) => {
            this.config.pulseSpeed = parseFloat(e.target.value);
            document.getElementById('speedVal').textContent = this.config.pulseSpeed.toFixed(1);
        });

        const densitySlider = document.getElementById('particleDensity');
        densitySlider.addEventListener('input', (e) => {
            this.config.particleCount = parseInt(e.target.value);
            this.generateHeartParticles();
        });

        const chaosSlider = document.getElementById('chaosLevel');
        chaosSlider.addEventListener('input', (e) => {
            this.config.chaosLevel = parseInt(e.target.value);
        });

        document.getElementById('toggleMatrix').addEventListener('click', (e) => {
            this.config.matrixActive = !this.config.matrixActive;
            e.target.classList.toggle('active', this.config.matrixActive);
            e.target.textContent = this.config.matrixActive ? 'تشغيل تساقط الماتركس' : 'إيقاف تساقط الماتركس';
        });

        const audioBtn = document.getElementById('toggleAudio');
        audioBtn.addEventListener('click', (e) => {
            this.config.audioActive = !this.config.audioActive;
            e.target.classList.toggle('active', this.config.audioActive);
            audioBtn.textContent = this.config.audioActive ? 'إيقاف النبض الصوتي' : 'تفعيل النبض الصوتي';
            if (this.config.audioActive) {
                this.startAudio();
            } else {
                this.stopAudio();
            }
        });

        document.getElementById('resetView').addEventListener('click', () => {
            this.mouse.targetX = 0;
            this.mouse.targetY = 0;
            this.config.chaosLevel = 15;
            chaosSlider.value = 15;
        });

        // تفاعل الماوس مع الكانفاس للتدوير ثلاثي الأبعاد
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            this.mouse.targetX = x * 0.003;
            this.mouse.targetY = y * 0.003;
            this.mouse.isHovered = true;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.mouse.targetX = 0;
            this.mouse.targetY = 0;
            this.mouse.isHovered = false;
        });

        // دعم اللمس للأجهزة المحمولة
        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.touches[0].clientX - rect.left - rect.width / 2;
                const y = e.touches[0].clientY - rect.top - rect.height / 2;
                this.mouse.targetX = x * 0.003;
                this.mouse.targetY = y * 0.003;
            }
        }, { passive: true });
    }

    initAudioContext() {
        // تهيئة مولد الصوت السيبراني باستخدام Web Audio API
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        } catch (e) {
            console.warn("Web Audio API not supported in this environment.");
        }
    }

    startAudio() {
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        
        this.oscillator = this.audioCtx.createOscillator();
        this.gainNode = this.audioCtx.createGain();
        
        this.oscillator.type = 'sine';
        this.oscillator.frequency.setValueAtTime(55, this.audioCtx.currentTime); // نبرة منخفضة عميقة (Low sub bass)
        
        this.gainNode.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
        
        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);
        
        this.oscillator.start();
    }

    stopAudio() {
        if (this.oscillator) {
            try {
                this.oscillator.stop();
                this.oscillator.disconnect();
            } catch(e) {}
            this.oscillator = null;
        }
    }

    triggerHeartbeatSound() {
        if (!this.config.audioActive || !this.audioCtx) return;
        
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(120, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(30, this.audioCtx.currentTime + 0.15);
            
            gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.2);
            
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.25);
        } catch(e) {}
    }

    generateHeartParticles() {
        this.particles = [];
        const count = this.config.particleCount;

        for (let i = 0; i < count; i++) {
            // معادلة بارامترية رياضية لقلب ثلاثي الأبعاد
            const t = Math.PI * 2 * Math.random();
            const u = Math.PI * (Math.random() - 0.5);

            // إحداثيات القلب الرياضية
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
            const z = 10 * u * Math.cos(t);

            // اختيار كود برمجي عشوائي لكل جسيم
            const codeText = this.codeSnippets[Math.floor(Math.random() * this.codeSnippets.length)];

            this.particles.push({
                x: x * 12,
                y: y * 12,
                z: z * 12,
                originX: x * 12,
                originY: y * 12,
                originZ: z * 12,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                vz: (Math.random() - 0.5) * 2,
                color: this.getThemeColor(),
                size: Math.random() * 2 + 1.5,
                text: codeText,
                isText: Math.random() > 0.65 // نسبة الجسيمات التي تظهر كأكواد برمجية
            });
        }
    }

    getThemeColor() {
        const theme = this.config.theme;
        if (theme === 'neon-pink') {
            const colors = ['#ff007f', '#ff3399', '#ff66b2', '#ff0055'];
            return colors[Math.floor(Math.random() * colors.length)];
        } else if (theme === 'cyber-blue') {
            const colors = ['#00f3ff', '#0099ff', '#33ccff', '#00ffee'];
            return colors[Math.floor(Math.random() * colors.length)];
        } else if (theme === 'matrix-green') {
            const colors = ['#00ff66', '#33ff88', '#00cc44', '#66ff99'];
            return colors[Math.floor(Math.random() * colors.length)];
        } else if (theme === 'gold-fire') {
            const colors = ['#ffb700', '#ff8800', '#ffcc33', '#ffaa00'];
            return colors[Math.floor(Math.random() * colors.length)];
        }
        return '#00f3ff';
    }

    renderMatrixRain() {
        if (!this.config.matrixActive) return;

        this.matrixCtx.fillStyle = 'rgba(3, 7, 18, 0.08)';
        this.matrixCtx.fillRect(0, 0, this.matrixCanvas.width, this.matrixCanvas.height);

        this.matrixCtx.fillStyle = this.getMatrixColor();
        this.matrixCtx.font = '13px "Fira Code", monospace';

        const fontSize = 14;
        for (let i = 0; i < this.matrixDrops.length; i++) {
            const text = this.codeSnippets[Math.floor(Math.random() * this.codeSnippets.length)];
            const x = i * fontSize;
            const y = this.matrixDrops[i] * fontSize;

            this.matrixCtx.fillText(text, x, y);

            if (y > this.matrixCanvas.height && Math.random() > 0.975) {
                this.matrixDrops[i] = 0;
            }
            this.matrixDrops[i]++;
        }
    }

    getMatrixColor() {
        switch(this.config.theme) {
            case 'neon-pink': return 'rgba(255, 0, 127, 0.35)';
            case 'cyber-blue': return 'rgba(0, 243, 255, 0.35)';
            case 'matrix-green': return 'rgba(0, 255, 102, 0.4)';
            case 'gold-fire': return 'rgba(255, 183, 0, 0.35)';
            default: return 'rgba(0, 243, 255, 0.35)';
        }
    }

    loop(currentTime) {
        // حساب معدل الإطارات FPS
        this.stats.frameCount++;
        if (currentTime - this.stats.lastTime >= 1000) {
            this.stats.fps = this.stats.frameCount;
            this.stats.frameCount = 0;
            this.stats.lastTime = currentTime;
            document.getElementById('statFps').textContent = `${this.stats.fps} FPS`;
            document.getElementById('statParticles').textContent = this.particles.length;
        }

        // مسح الكانفاس الرئيسي
        this.ctx.fillStyle = 'rgba(3, 7, 18, 0.25)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // تنفيذ تساقط الماتركس في الخلفية
        this.renderMatrixRain();

        // تحديث دوران الكاميرا بسلاسة
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

        // حساب نبض القلب الرياضي (Heartbeat Rhythm)
        const time = currentTime * 0.002 * this.config.pulseSpeed;
        const heartbeat = Math.pow(Math.sin(time * 3), 2) * 0.12 + Math.sin(time * 1.5) * 0.05 + 1.0;

        // رسم وترتيب الجسيمات ثلاثية الأبعاد
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // تدوير العالم ثلاثي الأبعاد
        const angleX = this.mouse.y;
        const angleY = this.mouse.x + currentTime * 0.0003;

        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);

        // تحديث وتجهيز الجسيمات
        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];

            // تأثير الفوضى العشوائية (Chaos)
            const chaosFactor = this.config.chaosLevel * 0.02;
            const targetX = p.originX * heartbeat + (Math.random() - 0.5) * chaosFactor * 50;
            const targetY = p.originY * heartbeat + (Math.random() - 0.5) * chaosFactor * 50;
            const targetZ = p.originZ * heartbeat + (Math.random() - 0.5) * chaosFactor * 50;

            p.x += (targetX - p.x) * 0.1;
            p.y += (targetY - p.y) * 0.1;
            p.z += (targetZ - p.z) * 0.1;

            // تطبيق مصفوفة الدوران ثلاثي الأبعاد (3D Rotation Matrix)
            // 1. الدوران حول المحور Y
            let x1 = p.x * cosY + p.z * sinY;
            let z1 = -p.x * sinY + p.z * cosY;
            let y1 = p.y;

            // 2. الدوران حول المحور X
            let y2 = y1 * cosX - z1 * sinX;
            let z2 = y1 * sinX + z1 * cosX;
            let x2 = x1;

            // منظور الإسقاط (Perspective Projection)
            const perspective = 400;
            const scale = perspective / (perspective + z2 + 250);
            const projX = centerX + x2 * scale;
            const projY = centerY + y2 * scale;

            if (scale > 0) {
                this.ctx.globalAlpha = Math.min(Math.max((z2 + 150) / 300, 0.2), 1.0);
                
                if (p.isText && scale > 0.8) {
                    this.ctx.font = `${Math.max(10, Math.floor(11 * scale))}px "Fira Code", monospace`;
                    this.ctx.fillStyle = p.color;
                    this.ctx.fillText(p.text, projX, projY);
                } else {
                    this.ctx.beginPath();
                    this.ctx.arc(projX, projY, Math.max(1, p.size * scale), 0, Math.PI * 2);
                    this.ctx.fillStyle = p.color;
                    this.ctx.shadowBlur = 10;
                    this.ctx.shadowColor = p.color;
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0;
                }
            }
        }

        requestAnimationFrame((t) => this.loop(t));
    }
}

// تشغيل المحرك بالكامل عند تحميل المستند
window.addEventListener('DOMContentLoaded', () => {
    const cyberHeart = new CyberCodeHeartEngine();
    console.log("%c[SYSTEM INITIALIZED] Cybernetic Code Heart Engine is running smoothly.", "color: #00f3ff; font-family: monospace; font-size: 14px;");
});
