import { Math2 } from './Math';
import { AudioSynth } from './Audio';
import { StorageSystem } from './Storage';
import { ParticleSystem } from './Particles';

interface Entity {
    type: string;
    active: boolean;
    angle?: number;
    dist?: number;
    speed?: number;
    mode?: 'normal' | 'eject' | 'spiral' | 'projectile';
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    radius?: number;
    centerX?: number;
    centerY?: number;
    radialSpeed?: number;
    angleSpeed?: number;
    r?: number;
    opacity?: number;
    fixed?: boolean;
}

interface Player {
    t: number;
    angle: number;
    rad: number;
    dir: number;
    color: string;
    tail: { x: number, y: number }[];
    invuln: number;
}

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D | null = null;
    private audio: AudioSynth;
    private storage: StorageSystem;
    private particles: ParticleSystem;

    private width = 0;
    private height = 0;
    private cx = 0;
    private cy = 0;
    private isMobile = false;

    private state: 'INTRO' | 'MENU' | 'PLAYING' | 'GAMEOVER' = 'INTRO';
    private score = 0;
    private lives = 3;
    private level = 1;
    private timeScale = 1.0;
    private hitStop = 0;
    private shake = 0;
    private flashIntensity = 0;
    private lastTime = 0;

    private greenStreak = 0;
    private streakThreshold = 8;
    private infinityMode = false;
    private infinityTimer = 0;
    private infinityHits = 0;
    private infinityMaxHits = 3;

    private baseRadius = 100;
    private minRadius = 30;
    private decayRate = 2.0;
    private orbitFreezeTimer = 0;
    private shieldCount = 0;
    private multiplierTimer = 0;
    private magnetTimer = 0;
    private warpTimer = 0;

    private pointsPerLevel = 50;
    private chaosMode = false;
    private chaosTimer = 0;
    private fireCooldown = 0;

    private gameWon = false;
    private victoryLap = false;
    private tutorialMoved = false;
    private tutorialDecayShown = false;

    private storyTimer = 0;
    private logs = [
        "REALITY INTEGRITY: 85%", "ENTROPY SPIKE DETECTED", "KEEP THE LOOP STABLE",
        "THE VOID IS LISTENING", "A.R.C. SYSTEM ACTIVE", "DONT BREAK THE CYCLE",
        "TIMELINE FRACTURED", "PROTOCOL OMEGA", "GRAVITY CRITICAL"
    ];

    private player: Player = { t: 0, angle: 0, rad: 100, dir: 1, color: '#00f3ff', tail: [], invuln: 0 };
    private entities: Entity[] = [];
    private stars: { x: number, y: number, z: number }[] = [];

    private spawnEnemyTimer = 0;
    private resizeObserver: ResizeObserver | null = null;
    private handleInput = (e: any) => this.action(e);
    private handleKey = (e: KeyboardEvent) => { if (e.code === 'Space') this.action(e); };

    constructor() {
        console.log('A.R.C. Initializing...');
        const canvas = document.getElementById('game-layer') as HTMLCanvasElement;
        if (!canvas) {
            console.error('Game layer not found!');
            throw new Error('Canvas not found');
        }
        this.canvas = canvas;
        this.audio = new AudioSynth();
        this.storage = new StorageSystem();
        this.particles = new ParticleSystem();

        this.initResize();
        this.initIntro();
        this.initInput();
    }

    public destroy() {
        console.log('A.R.C. Shutting down...');
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        document.removeEventListener('pointerdown', this.handleInput);
        document.removeEventListener('keydown', this.handleKey);
    }

    private initResize() {
        this.resizeObserver = new ResizeObserver(() => {
            this.resize();
        });
        this.resizeObserver.observe(document.body);
        this.resize();
    }

    private resize() {
        const dpr = window.devicePixelRatio || 1;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;

        this.ctx = this.canvas.getContext('2d', { alpha: false });
        if (this.ctx) {
            this.ctx.scale(dpr, dpr);
        }

        this.cx = this.width / 2;
        this.cy = this.height / 2;

        const minDim = Math.min(this.width, this.height);
        this.isMobile = this.width < 600;
        const ratio = this.isMobile ? 0.38 : 0.30;

        this.baseRadius = minDim * ratio;
        this.decayRate = this.isMobile ? 1.0 : 1.8;

        if (this.state === 'MENU' || this.state === 'INTRO') {
            this.player.rad = this.baseRadius;
        }
    }

    private initIntro() {
        const textElement = document.getElementById('terminal-text');
        const btnBoot = document.getElementById('btn-boot');
        if (!textElement || !btnBoot) return;

        const lines = [
            "> BIOS CHECK... OK",
            "> MEMORY INTEGRITY... 99%",
            "> LOADING PROTOCOL: 'LAST CYCLE'...",
            "> TARGET: STABILIZE SINGULARITY (LVL 10)",
            "> INITIALIZING A.R.C. CORE..."
        ];

        let lineIndex = 0;
        let charIndex = 0;

        console.log('A.R.C. Calling typewriter...');
        const typeWriter = () => {
            if (!textElement) {
                console.error('Terminal element missing!');
                return;
            }
            if (lineIndex < lines.length) {
                const currentLine = lines[lineIndex];
                if (charIndex < currentLine.length) {
                    textElement.innerHTML += currentLine.charAt(charIndex);
                    charIndex++;
                    setTimeout(typeWriter, 15);
                } else {
                    textElement.innerHTML += "<br>";
                    lineIndex++;
                    charIndex = 0;
                    setTimeout(typeWriter, 200);
                }
            } else {
                btnBoot.classList.remove('hidden');
            }
        };

        btnBoot.onclick = () => {
            console.log('A.R.C. Boot button clicked');
            this.audio.resume();
            this.audio.playTone(800, 'square', 0.1, 0.1);

            document.getElementById('intro-screen')?.classList.add('hidden');
            
            const startScreen = document.getElementById('screen-start');
            if (startScreen) {
                console.log('A.R.C. Showing start screen');
                startScreen.classList.remove('hidden');
                // Use a small timeout to ensure 'hidden' is gone before adding 'active' for transition
                setTimeout(() => startScreen.classList.add('active'), 10);
            } else {
                console.error('A.R.C. Screen Start element NOT FOUND');
            }

            this.state = 'MENU';
            this.initStars();
            this.storage.updateUI();

            this.lastTime = performance.now();
            console.log('A.R.C. Starting main loop');
            requestAnimationFrame(t => this.loop(t));
        };

        typeWriter();
    }

    private initInput() {
        document.addEventListener('pointerdown', this.handleInput);
        document.addEventListener('keydown', this.handleKey);

        const bindButton = (id: string, callback: (e: any) => void) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.onclick = (e) => { e.stopPropagation(); this.audio.resume(); callback(e); };
                btn.onpointerdown = (e) => e.stopPropagation();
            }
        };

        bindButton('btn-start', () => this.start());
        bindButton('btn-restart', () => this.start());
        
        bindButton('btn-tutorial', () => {
            document.getElementById('screen-tutorial')?.classList.remove('hidden');
            document.getElementById('screen-tutorial')?.classList.add('active');
        });
        
        bindButton('btn-help', () => {
            document.getElementById('screen-tutorial')?.classList.remove('hidden');
            document.getElementById('screen-tutorial')?.classList.add('active');
        });

        bindButton('btn-tutorial-close', () => {
            document.getElementById('screen-tutorial')?.classList.remove('active');
            setTimeout(() => document.getElementById('screen-tutorial')?.classList.add('hidden'), 400);
        });

        bindButton('btn-audio', (e) => {
            const on = this.audio.toggle();
            e.target.innerText = on ? '🎵' : '🔇';
            e.target.style.opacity = on ? 1 : 0.5;
        });
    }

    private action(e: any) {
        if (e.target?.closest('button')) return;
        this.audio.resume();

        if (this.state === 'PLAYING') {
            if (!this.tutorialMoved) {
                this.tutorialMoved = true;
                document.getElementById('tutorial-msg')?.remove();
            }

            this.player.dir *= -1;
            this.audio.sfx('tap');
            this.shake += 2;
        }
    }

    private initStars() {
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math2.rand(-1000, 1000), y: Math2.rand(-1000, 1000), z: Math2.rand(0.5, 2)
            });
        }
    }

    private start() {
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            setTimeout(() => s.classList.add('hidden'), 400);
        });
        this.state = 'PLAYING';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.greenStreak = 0;
        this.infinityMode = false;
        this.chaosMode = false;
        this.entities = [];
        this.player.angle = 0;
        this.player.t = 0;
        this.player.dir = 1;
        this.player.tail = [];
        this.player.invuln = 0;
        this.player.rad = this.baseRadius;
        this.orbitFreezeTimer = 0;
        this.shieldCount = 0;
        this.multiplierTimer = 0;
        this.magnetTimer = 0;
        this.warpTimer = 0;
        this.gameWon = false;
        this.victoryLap = false;
        this.tutorialMoved = false;
        this.tutorialDecayShown = false;
        this.storyTimer = 5.0;
        this.createFloatingText("A.R.C. ENGAGED", '#fff');
        this.showTutorialMessage("TAP SCREEN TO REVERSE");
        this.updateHUD();
        this.spawnEnemyTimer = 0;
    }

    private showTutorialMessage(text: string) {
        document.getElementById('tutorial-msg')?.remove();
        const el = document.createElement('div');
        el.id = 'tutorial-msg';
        el.innerText = text;
        Object.assign(el.style, {
            position: 'absolute', top: '70%', width: '100%', textAlign: 'center',
            color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', textShadow: '0 0 10px #0ff',
            pointerEvents: 'none', zIndex: '50', animation: 'blink 1s infinite'
        });
        document.body.appendChild(el);
    }

    private damagePlayer() {
        if (this.player.invuln > 0) return;
        if (this.shieldCount > 0) {
            this.shieldCount--;
            this.audio.sfx('shield');
            this.player.invuln = 1.0;
            this.shake = 10;
            this.createFloatingText("SHIELD DEPLETED", '#00f3ff');
            this.updateHUD();
            return;
        }
        if (this.infinityMode) {
            this.infinityHits++;
            this.audio.sfx('damage');
            this.shake = 15;
            this.createFloatingText(`${this.infinityMaxHits - this.infinityHits}/${this.infinityMaxHits} SYSTEM INTEGRITY`, '#ffaa00');
            if (this.infinityHits >= this.infinityMaxHits) this.deactivateInfinityMode("SYNC FAILURE");
            return;
        }
        this.lives--;
        if (this.greenStreak > 0) this.createFloatingText("SYNC LOST", '#f00');
        this.greenStreak = 0;
        this.updateHUD();
        this.audio.sfx('damage');
        this.shake = 15;
        this.hitStop = 0.12;
        this.flashIntensity = 0.4;
        if (this.lives <= 0) this.gameOver("SIGNAL LOST");
        else this.player.invuln = 1.5;
    }

    private triggerWin() {
        this.gameWon = true;
        this.victoryLap = true;
        this.flashIntensity = 1.5;
        this.shake = 45;
        this.audio.sfx('levelup');
        this.createFloatingText("REALITY STABILIZED", '#fff');
        setTimeout(() => this.createFloatingText("WHITE HOLE: EJECTION", '#00f3ff'), 2000);
        this.entities.forEach(e => {
            if (e.type === 'bad' || e.type === 'chaos_bad') {
                e.type = 'good';
                if (e.mode === 'normal' && e.angle && e.dist) {
                  const ex = this.cx + Math.cos(e.angle) * e.dist;
                  const ey = this.cy + Math.sin(e.angle) * e.dist;
                  this.particles.spawn(ex, ey, 10, '#00ff00', 150);
                }
            }
        });
        this.player.rad = this.baseRadius;
    }

    private activateInfinityMode() {
        this.infinityMode = true;
        this.infinityTimer = 10.0;
        this.infinityHits = 0;
        this.player.t = 0;
        this.player.rad = this.baseRadius;
        this.createFloatingText("DUAL CORE: SPIRAL", '#00f3ff');
        this.audio.sfx('powerup');
        this.flashIntensity = 0.6;
        this.greenStreak = 0;
        this.entities.forEach(e => e.active = false);
        document.getElementById('tutorial-msg')?.remove();
    }

    private deactivateInfinityMode(reason = "SYSTEM STABILIZED") {
        this.infinityMode = false;
        this.player.angle = 0;
        this.player.rad = this.baseRadius;
        this.createFloatingText(reason, '#fff');
        this.entities.forEach(e => e.active = false);
    }

    private triggerChaosMode() {
        this.chaosMode = true;
        this.chaosTimer = 5.0;
        this.createFloatingText("REALITY FRACTURE!", '#ffaa00');
        this.audio.sfx('powerup');
        this.flashIntensity = 0.6;
        this.entities.forEach(e => { if (e.type === 'bad') e.active = false; });
    }

    private createFloatingText(text: string, color: string) {
        const el = document.createElement('div');
        el.innerText = text;
        Object.assign(el.style, {
            position: 'absolute', left: '50%', top: '35%',
            transform: 'translate(-50%, -50%) scale(0.8)',
            color: color, fontSize: '1.2rem', fontWeight: 'bold',
            textShadow: `0 0 10px ${color}`, fontFamily: "'Share Tech Mono', monospace",
            letterSpacing: '2px', width: '100%', textAlign: 'center',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            pointerEvents: 'none', zIndex: '100', opacity: '0'
        });
        document.body.appendChild(el);
        requestAnimationFrame(() => {
            el.style.transform = 'translate(-50%, -50%) scale(1.1)';
            el.style.opacity = '1';
        });
        setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 400);
        }, 1800);
    }

    private gameOver(reason = "CRITICAL FAILURE") {
        this.state = 'GAMEOVER';
        this.audio.sfx('gameover');
        this.shake = 30;
        this.storage.addScore(this.score);
        const overTitle = document.querySelector('#screen-over h1');
        if (overTitle) (overTitle as HTMLElement).innerText = reason;
        const endScore = document.getElementById('end-score');
        if (endScore) endScore.innerText = this.score.toString();
        const endCurrency = document.getElementById('end-currency');
        if (endCurrency) endCurrency.innerText = Math.floor(this.score * 0.5).toString();
        
        const overScreen = document.getElementById('screen-over');
        if (overScreen) {
            overScreen.classList.remove('hidden');
            setTimeout(() => overScreen.classList.add('active'), 100);
        }
        document.getElementById('tutorial-msg')?.remove();
    }

    private spawnEntity() {
        if (this.infinityMode) {
            const scale = this.player.rad * 1.5;
            const offset = scale * 0.7;
            const isGood = Math.random() > 0.5;
            let type, startX;
            if (isGood) {
                startX = this.cx - offset;
                const rand = Math.random();
                if (rand > 0.90) type = 'heart'; else if (rand > 0.85) type = 'god'; else if (rand > 0.80) type = 'freeze'; else type = 'good';
            } else {
                startX = this.cx + offset;
                type = 'bad';
            }
            this.entities.push({
                type, active: true, centerX: startX, centerY: this.cy, radius: 5,
                angle: Math.random() * Math.PI * 2, radialSpeed: 140 + (this.level * 10),
                angleSpeed: isGood ? 2.5 : -2.5, mode: 'spiral'
            });
            return;
        }

        const rand = Math.random();
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(this.width, this.height) * 0.8;
        let type = 'bad';
        let speed = 90 + (this.level * 8);

        let mode: 'normal' | 'eject' = 'normal';
        let startDist = dist;

        if (this.victoryLap) {
            mode = 'eject';
            startDist = 20;
            speed = 220 + (this.level * 10);
        }

        if (rand > 0.98) type = 'god';
        else if (rand > 0.96) type = 'shield';
        else if (rand > 0.94) type = 'multiplier';
        else if (rand > 0.92) type = 'magnet';
        else if (rand > 0.90) type = 'warp';
        else if (rand > 0.88) type = 'freeze';
        else if (rand > 0.86) type = 'expand';
        else if (rand > 0.84) type = 'chaos';
        else if (rand > 0.82) type = 'nuke';
        else if (rand > 0.79) type = 'heart';
        else if (rand > 0.65) type = 'good';
        else { type = 'bad'; speed = 140 + (this.level * 12); }

        this.entities.push({ type, active: true, angle, dist: startDist, speed, mode });
    }

    private update(dt: number) {
        if (this.hitStop > 0) { this.hitStop -= dt; return; }
        const trueDt = dt * (this.warpTimer > 0 ? 0.4 : 1.0) * this.timeScale;
        this.shake = Math.max(0, this.shake - 45 * dt);
        if (this.flashIntensity > 0) this.flashIntensity -= 1.8 * dt;

        if (this.state === 'PLAYING') {
            if (this.multiplierTimer > 0) this.multiplierTimer -= trueDt;
            if (this.magnetTimer > 0) this.magnetTimer -= trueDt;
            if (this.warpTimer > 0) this.warpTimer -= trueDt;
            this.storyTimer -= trueDt;
            if (this.storyTimer <= 0) {
                const msg = this.logs[Math.floor(Math.random() * this.logs.length)];
                this.storyTimer = 12 + Math.random() * 12;
                if (Math.random() > 0.3) this.createFloatingText(msg, 'rgba(0, 243, 255, 0.4)');
            }

            if (!this.infinityMode) {
                if (this.orbitFreezeTimer > 0 || this.victoryLap) {
                    if (this.orbitFreezeTimer > 0) this.orbitFreezeTimer -= trueDt;
                } else {
                    this.player.rad -= this.decayRate * trueDt;
                    if (this.player.rad < 60 && !this.tutorialDecayShown) {
                        this.showTutorialMessage("ORBIT UNSTABLE - REGENERATE SCANLINE");
                        this.tutorialDecayShown = true;
                        setTimeout(() => document.getElementById('tutorial-msg')?.remove(), 3000);
                    }
                    if (this.player.rad <= this.minRadius) {
                        this.gameOver("SINGULARITY CONSUMED");
                        return;
                    }
                }
            }

            if (this.infinityMode) {
                this.infinityTimer -= trueDt;
                if (this.infinityTimer <= 0) this.deactivateInfinityMode();
                this.player.t += this.player.dir * 2.5 * trueDt;
            } else {
                this.player.angle += this.player.dir * (2.2 + (this.level * 0.05)) * trueDt;
            }

            let px: number, py: number;
            if (this.infinityMode) {
                const scale = this.player.rad * 1.5;
                const t = this.player.t;
                px = this.cx + (scale * Math.cos(t)) / (1 + Math.sin(t) ** 2);
                py = this.cy + (scale * Math.cos(t) * Math.sin(t)) / (1 + Math.sin(t) ** 2);
            } else {
                px = this.cx + Math.cos(this.player.angle) * this.player.rad;
                py = this.cy + Math.sin(this.player.angle) * this.player.rad;
            }

            this.player.tail.push({ x: px, y: py });
            if (this.player.tail.length > 20) this.player.tail.shift();
            if (this.player.invuln > 0) this.player.invuln -= trueDt;

            // Decay Feedback (Visual Stress)
            const dangerThreshold = 80;
            if (this.player.rad < dangerThreshold && !this.infinityMode) {
                const dangerFactor = Math.pow(1 - (this.player.rad - this.minRadius) / (dangerThreshold - this.minRadius), 1.5);
                
                // Increase base vibration as orbit shrinks
                if (this.player.rad < 60) {
                    this.shake = Math.max(this.shake, 0.4 + dangerFactor * 1.5);
                }

                // Emit decay particles streaming toward the center hole
                if (Math.random() < 0.1 + dangerFactor * 0.4) {
                    const angle = Math.random() * Math.PI * 2;
                    const px_p = this.cx + Math.cos(angle) * this.player.rad;
                    const py_p = this.cy + Math.sin(angle) * this.player.rad;
                    
                    this.particles.emit({
                        x: px_p, y: py_p,
                        vx: (this.cx - px_p) * (0.01 + Math.random() * 0.02),
                        vy: (this.cy - py_p) * (0.01 + Math.random() * 0.02),
                        color: dangerFactor > 0.7 ? '#ff3333' : '#ffffff',
                        life: 20 + Math.random() * 20,
                        size: 1 + Math.random() * 1.5
                    });
                }
            }

            if (this.chaosMode) {
                this.chaosTimer -= trueDt;
                this.fireCooldown -= trueDt;
                if (this.fireCooldown <= 0) {
                    const isGood = Math.random() > 0.4;
                    const angle = Math.random() * Math.PI * 2;
                    this.entities.push({
                        type: isGood ? 'chaos_point' : 'chaos_bad',
                        active: true, angle, dist: 20, speed: 250, mode: 'projectile'
                    });
                    this.audio.playTone(isGood ? 800 : 200, 'square', 0.05, 0.08);
                    this.fireCooldown = 0.08;
                }
                if (this.chaosTimer <= 0) { this.chaosMode = false; this.createFloatingText("ENTROPY REDUCED", '#fff'); }
            } else {
                let spawnRate = this.infinityMode ? 0.08 : (Math.max(0.08, 0.7 - (this.score * 0.001)));
                if (this.victoryLap) spawnRate = 0.2;
                this.spawnEnemyTimer -= trueDt;
                if (this.spawnEnemyTimer <= 0) {
                    this.spawnEntity();
                    this.spawnEnemyTimer = spawnRate;
                }
            }

            this.entities.forEach(e => {
                if (!e.active) return;
                let ex = 0, ey = 0;

                if (e.mode === 'spiral') {
                    if (e.radius !== undefined && e.angle !== undefined && e.radialSpeed !== undefined && e.angleSpeed !== undefined && e.centerX !== undefined && e.centerY !== undefined) {
                        e.radius += e.radialSpeed * trueDt; e.angle += e.angleSpeed * trueDt;
                        ex = e.centerX + Math.cos(e.angle) * e.radius;
                        ey = e.centerY + Math.sin(e.angle) * e.radius;
                    }
                    if (e.radius && e.radius > Math.max(this.width, this.height) * 0.8) e.active = false;
                } else if (e.mode === 'projectile' || e.mode === 'eject') {
                    if (e.angle !== undefined && e.dist !== undefined && e.speed !== undefined) {
                        ex = this.cx + Math.cos(e.angle) * e.dist; ey = this.cy + Math.sin(e.angle) * e.dist;
                        e.dist += (e.mode === 'eject' ? e.speed : e.speed) * trueDt;
                        if (e.dist > Math.max(this.width, this.height)) e.active = false;
                    }
                } else {
                    if (e.angle !== undefined && e.dist !== undefined && e.speed !== undefined) {
                      e.dist -= e.speed * trueDt;
                      if (e.dist < 10) { e.active = false; if (e.type === 'bad') { this.score++; this.updateHUD(); } }
                      ex = this.cx + Math.cos(e.angle) * e.dist;
                      ey = this.cy + Math.sin(e.angle) * e.dist;
                    }
                }

                // Magnet attraction logic
                if (this.magnetTimer > 0 && e.active && (e.type === 'good' || e.type === 'chaos_point')) {
                    const distToPlayer = Math2.dist(px, py, ex, ey);
                    if (distToPlayer < 180) {
                        const angleToPlayer = Math.atan2(py - ey, px - ex);
                        const pullForce = (180 - distToPlayer) * 0.02;
                        ex += Math.cos(angleToPlayer) * pullForce * 150 * trueDt;
                        ey += Math.sin(angleToPlayer) * pullForce * 150 * trueDt;
                    }
                }

                if (Math2.dist(px, py, ex, ey) < 28) {
                    e.active = false;
                    if (e.type === 'good' || e.type === 'chaos_point') {
                        const gain = this.multiplierTimer > 0 ? 10 : 5;
                        this.score += gain; this.audio.sfx('point');
                        this.particles.spawn(ex, ey, 8, this.multiplierTimer > 0 ? '#ff0' : '#0f0', 100);
                        if (!this.infinityMode && !this.chaosMode && !this.victoryLap) {
                            this.greenStreak++;
                            if (this.greenStreak >= this.streakThreshold) this.activateInfinityMode();
                        }
                        this.updateHUD();
                    } else if (e.type === 'freeze') {
                        this.orbitFreezeTimer = 5.0; this.createFloatingText("ORBIT FROZEN", '#aff'); this.audio.sfx('freeze');
                    } else if (e.type === 'god') {
                        this.player.invuln = 5.0; this.createFloatingText("GOD MODE", '#ffd700'); this.audio.sfx('god');
                    } else if (e.type === 'shield') {
                        this.shieldCount = Math.min(this.shieldCount + 1, 2);
                        this.createFloatingText("SHIELD ACTIVE", '#00f3ff'); this.audio.sfx('shield'); this.updateHUD();
                    } else if (e.type === 'multiplier') {
                        this.multiplierTimer = 10.0; this.createFloatingText("SCORE MULTIPLIER x2", '#ffff00'); this.audio.sfx('multiplier');
                    } else if (e.type === 'magnet') {
                        this.magnetTimer = 8.0; this.createFloatingText("MAGNETIZED", '#ffffff'); this.audio.sfx('magnet');
                    } else if (e.type === 'warp') {
                        this.warpTimer = 6.0; this.createFloatingText("TIME WARP", '#6600ff'); this.audio.sfx('warp');
                    } else if (e.type === 'expand') {
                        this.player.rad = Math.min(this.player.rad + 25, this.baseRadius + 10);
                        this.createFloatingText("ORBIT RESTORED", '#0ff'); this.audio.sfx('powerup');
                    } else if (e.type === 'chaos') this.triggerChaosMode();
                    else if (e.type === 'nuke') {
                        this.audio.sfx('nuke'); this.shake = 30; this.flashIntensity = 0.8;
                        this.entities.forEach(ent => { if (ent.type === 'bad') ent.active = false; });
                        this.score += 20; this.createFloatingText("AREA PURGED", '#d0f');
                    } else if (e.type === 'heart') {
                        if (this.lives < 3) this.lives++; this.audio.sfx('heart'); this.updateHUD();
                    } else if (e.type === 'bad' || e.type === 'chaos_bad') {
                        this.particles.spawn(ex, ey, 20, '#f05', 250);
                        this.damagePlayer();
                    }
                }
            });
            this.entities = this.entities.filter(e => e.active);
        }
        this.particles.update(dt);
    }

    private updateHUD() {
        const hudScore = document.getElementById('hud-score');
        if (hudScore) hudScore.innerText = this.score.toString();
        
        const currentLevel = Math.floor(this.score / this.pointsPerLevel) + 1;
        if (currentLevel > this.level) {
            this.level = currentLevel;
            this.audio.sfx('levelup');
            this.createFloatingText(`SYSTEM UPGRADE: LVL ${this.level}`, '#00f3ff');
            if (this.level >= 10 && !this.gameWon) this.triggerWin();
        }
        
        const hudLvl = document.getElementById('hud-level');
        if (hudLvl) hudLvl.innerText = this.victoryLap ? "OVERDRIVE MODE" : `SYSTEM LEVEL ${this.level}`;

        let statusText = "";
        if (this.infinityMode) {
             let stab = this.infinityMaxHits - this.infinityHits;
             let color = stab === 3 ? '#0f0' : (stab === 2 ? '#ff0' : '#f00');
             statusText = `<div style="color:${color}; font-weight:bold; font-size: 0.8rem; margin-top: 5px;">STABILITY ${stab}/${this.infinityMaxHits}</div>`;
        } else if (!this.chaosMode && this.greenStreak > 0 && !this.victoryLap) {
            let color = this.greenStreak > 6 ? '#0f0' : (this.greenStreak > 3 ? '#0ff' : '#fff');
            statusText = `<div style="color:${color}; font-weight:bold; font-size:0.8rem; margin-top: 5px;">SYNC ${this.greenStreak}/${this.streakThreshold}</div>`;
        }
        
        const livesDisplay = document.getElementById('lives-display');
        if (livesDisplay) {
            let hearts = '';
            for (let i = 0; i < 3; i++) hearts += (i < this.lives ? '🛡️' : '░');
            let shields = '';
            if (this.shieldCount > 0) {
                for (let i = 0; i < this.shieldCount; i++) shields += ' 💠';
            }
            livesDisplay.innerHTML = `<div>${hearts}${shields}</div>${statusText}`;
        }
    }

    private draw() {
        if (!this.ctx) return;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        const dpr = window.devicePixelRatio || 1;
        this.ctx.scale(dpr, dpr);

        let sx = (Math.random() - 0.5) * this.shake;
        let sy = (Math.random() - 0.5) * this.shake;
        this.ctx.translate(sx, sy);

        if (this.flashIntensity > 0) {
            this.ctx.fillStyle = `rgba(255,255,255,${this.flashIntensity})`;
            this.ctx.fillRect(-50, -50, this.width + 100, this.height + 100);
        }

        this.ctx.fillStyle = 'rgba(5, 5, 5, 0.25)';
        this.ctx.fillRect(-this.shake - 20, -this.shake - 20, this.width + this.shake * 2 + 40, this.height + this.shake * 2 + 40);

        this.ctx.fillStyle = '#fff';
        this.stars.forEach(s => {
            let t = Date.now() * 0.00012;
            let scale = 1 / Math.max(0.1, s.z + Math.sin(t) * 0.5);
            this.ctx!.globalAlpha = Math2.clamp(scale * 0.45, 0, 1);
            this.ctx!.beginPath();
            const sxp = this.cx + (Math.cos(t) * s.x - Math.sin(t) * s.y) * scale;
            const syp = this.cy + (Math.sin(t) * s.x + Math.cos(t) * s.y) * scale;
            this.ctx!.arc(sxp, syp, 1.4 * scale, 0, Math.PI * 2);
            this.ctx!.fill();
        });
        this.ctx.globalAlpha = 1;

        let orbitColor = 'rgba(255, 255, 255, 0.1)';
        let lineWidth = 2;
        let lineDash: number[] = [];

        if (!this.infinityMode) {
            if (this.orbitFreezeTimer > 0) {
                orbitColor = `rgba(150, 255, 255, ${0.5 + Math.sin(Date.now() * 0.01) * 0.2})`;
                lineWidth = 3;
            } else if (this.victoryLap) {
                orbitColor = `rgba(0, 255, 255, 0.8)`;
                lineWidth = 3;
            } else {
                // Decay state
                const danger = Math2.clamp(1 - (this.player.rad - this.minRadius) / (this.baseRadius - this.minRadius), 0, 1);
                
                if (this.player.rad < 60) {
                    const pulse = Math.sin(Date.now() * 0.02);
                    orbitColor = `rgba(255, ${50 * (1-danger)}, ${50 * (1-danger)}, ${0.4 + pulse * 0.3})`;
                    lineWidth = 2 + danger * 2 + pulse;
                    // Glitchy dash when critical
                    lineDash = [10 + Math.random() * 20, 5 + Math.random() * 10];
                } else if (danger > 0.4) {
                    // Subtle pulse during normal decay
                    const pulse = Math.sin(Date.now() * 0.005) * 0.05;
                    orbitColor = `rgba(255, 255, 255, ${0.1 + pulse})`;
                    lineDash = [30, 10];
                }
            }
        }
        
        this.ctx.strokeStyle = orbitColor;
        this.ctx.lineWidth = lineWidth;
        this.ctx.setLineDash(lineDash);
        this.ctx.lineDashOffset = Date.now() * 0.05; // Make it rotate
        this.ctx.beginPath();
        
        if (this.infinityMode) {
            this.ctx.setLineDash([]); // Reset for infinity
            const scale = this.player.rad * 1.5;
            for (let t = 0; t <= Math.PI * 2 + 0.1; t += 0.08) {
                let x = this.cx + (scale * Math.cos(t)) / (1 + Math.sin(t) ** 2);
                let y = this.cy + (scale * Math.cos(t) * Math.sin(t)) / (1 + Math.sin(t) ** 2);
                if (t === 0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y);
            }
        } else {
            // Apply a slight jitter to radius if danger is high
            const drawRad = (this.player.rad < 60) ? this.player.rad + (Math.random() - 0.5) * 2 : this.player.rad;
            this.ctx.arc(this.cx, this.cy, drawRad, 0, Math.PI * 2);
        }
        this.ctx.stroke();
        this.ctx.setLineDash([]); // Always reset

        this.ctx.shadowBlur = 15;
        if (this.infinityMode) {
            const scale = this.player.rad * 1.5; const offset = scale * 0.7;
            this.ctx.shadowColor = '#0ff'; this.ctx.fillStyle = '#fff';
            this.ctx.beginPath(); this.ctx.arc(this.cx - offset, this.cy, 12 + Math.sin(Date.now() * 0.01) * 4, 0, Math.PI * 2); this.ctx.fill();
            this.ctx.shadowColor = '#d0f'; this.ctx.fillStyle = '#000'; this.ctx.strokeStyle = '#d0f';
            this.ctx.beginPath(); this.ctx.arc(this.cx + offset, this.cy, 12, 0, Math.PI * 2); this.ctx.fill(); this.ctx.stroke();
        } else {
            if (this.gameWon) { this.ctx.shadowColor = '#fff'; this.ctx.fillStyle = '#fff'; }
            else { this.ctx.shadowColor = this.chaosMode ? '#ffaa00' : '#a000a0'; this.ctx.fillStyle = '#000'; }
            let pulseSpeed = this.chaosMode ? 0.04 : 0.005;
            this.ctx.beginPath(); this.ctx.arc(this.cx, this.cy, 18 + Math.sin(Date.now() * pulseSpeed) * 4, 0, Math.PI * 2); this.ctx.fill();
        }
        this.ctx.shadowBlur = 0;

        if (this.state === 'PLAYING' || this.state === 'GAMEOVER') {
            if (this.player.invuln <= 0 || Math.floor(Date.now() / 80) % 2 === 0) {
                this.ctx.beginPath();
                this.player.tail.forEach((p, i) => { if (i === 0) this.ctx!.moveTo(p.x, p.y); else this.ctx!.lineTo(p.x, p.y); });
                let pColor = (this.player.invuln > 0) ? '#ffd700' : this.player.color;
                this.ctx.strokeStyle = pColor; this.ctx.lineWidth = 3; this.ctx.stroke();

                let px, py;
                if (this.infinityMode) {
                    const scale = this.player.rad * 1.5; const t = this.player.t;
                    px = this.cx + (scale * Math.cos(t)) / (1 + Math.sin(t) ** 2);
                    py = this.cy + (scale * Math.cos(t) * Math.sin(t)) / (1 + Math.sin(t) ** 2);
                } else {
                    px = this.cx + Math.cos(this.player.angle) * this.player.rad;
                    py = this.cy + Math.sin(this.player.angle) * this.player.rad;
                }
                this.ctx.shadowBlur = 12; this.ctx.shadowColor = pColor; this.ctx.fillStyle = '#fff';
                this.ctx.beginPath(); this.ctx.arc(px, py, 7, 0, Math.PI * 2); this.ctx.fill(); this.ctx.shadowBlur = 0;

                // Visual effects for active power-ups
                if (this.shieldCount > 0) {
                    this.ctx.shadowBlur = 10; this.ctx.shadowColor = '#00f3ff';
                    this.ctx.strokeStyle = `rgba(0, 243, 255, ${0.4 + Math.sin(Date.now() * 0.01) * 0.2})`;
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath(); this.ctx.arc(px, py, 15, 0, Math.PI * 2); this.ctx.stroke();
                    if (this.shieldCount > 1) {
                        this.ctx.beginPath(); this.ctx.arc(px, py, 19, 0, Math.PI * 2); this.ctx.stroke();
                    }
                    this.ctx.shadowBlur = 0;
                }
                
                if (this.multiplierTimer > 0) {
                    this.ctx.shadowBlur = 15; this.ctx.shadowColor = '#ffff00';
                    this.ctx.strokeStyle = `rgba(255, 255, 0, ${0.3 + Math.sin(Date.now() * 0.02) * 0.2})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    for(let i=0; i<3; i++) {
                        const a = Date.now()*0.01 + (i * Math.PI * 0.6);
                        this.ctx.moveTo(px + Math.cos(a)*12, py + Math.sin(a)*12);
                        this.ctx.lineTo(px + Math.cos(a)*18, py + Math.sin(a)*18);
                    }
                    this.ctx.stroke(); this.ctx.shadowBlur = 0;
                }

                if (this.magnetTimer > 0) {
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.arc(px, py, 25 + Math.sin(Date.now() * 0.01) * 5, 0, Math.PI * 2);
                    this.ctx.stroke();
                }

                if (this.warpTimer > 0) {
                    this.ctx.fillStyle = 'rgba(102, 0, 255, 0.1)';
                    this.ctx.beginPath(); this.ctx.arc(px, py, 30, 0, Math.PI * 2); this.ctx.fill();
                }
            }

            this.entities.forEach(e => {
                let ex = 0, ey = 0;
                if (e.mode === 'spiral' && e.x && e.y) { ex = e.x; ey = e.y; }
                else if ((e.mode === 'projectile' || e.mode === 'eject' || e.mode === 'normal') && e.angle !== undefined && e.dist !== undefined) {
                    ex = this.cx + Math.cos(e.angle) * e.dist; ey = this.cy + Math.sin(e.angle) * e.dist;
                }
                
                let col = '#fff'; let iconSize = 6;
                if (e.type === 'good' || e.type === 'chaos_point') col = '#0f0';
                else if (e.type === 'bad' || e.type === 'chaos_bad') col = '#f05';
                else if (e.type === 'nuke') col = '#d0f';
                else if (e.type === 'heart') col = '#f00';
                else if (e.type === 'chaos') col = '#ffaa00';
                else if (e.type === 'expand') col = '#0ff';
                else if (e.type === 'freeze') col = '#aff';
                else if (e.type === 'god') col = '#ffd700';
                else if (e.type === 'shield') col = '#00f3ff';
                else if (e.type === 'multiplier') col = '#ffff00';
                else if (e.type === 'magnet') col = '#ffffff';
                else if (e.type === 'warp') col = '#6600ff';

                if (['nuke', 'chaos', 'god', 'freeze', 'shield', 'multiplier', 'magnet', 'warp'].includes(e.type)) iconSize = 9;

                this.ctx!.shadowBlur = 8; this.ctx!.shadowColor = col; this.ctx!.fillStyle = col;
                this.ctx!.beginPath();
                if (e.type === 'bad' || e.type === 'chaos_bad') {
                    this.ctx!.moveTo(ex, ey - 7); this.ctx!.lineTo(ex + 7, ey); this.ctx!.lineTo(ex, ey + 7); this.ctx!.lineTo(ex - 7, ey);
                } else {
                    this.ctx!.arc(ex, ey, iconSize, 0, Math.PI * 2);
                }
                this.ctx!.fill(); this.ctx!.shadowBlur = 0;
            });
            this.particles.draw(this.ctx);
        }
    }

    private loop(time: number) {
        const dt = Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;
        this.update(dt);
        this.draw();
        requestAnimationFrame(t => this.loop(t));
    }
}
