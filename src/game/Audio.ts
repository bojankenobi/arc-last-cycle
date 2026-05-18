export class AudioSynth {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private enabled = true;
    private bgm: HTMLAudioElement | null = null;
    private ambientOscs: OscillatorNode[] = [];

    constructor() {
        // Prvo pokušavamo da učitamo tvoj lokalni fajl ako ga uploaduješ u public/ folder
        this.bgm = new Audio('/music.mp3'); 
        this.bgm.loop = true;
        this.bgm.volume = 0.25;
    }

    resume() {
        if (!this.ctx) {
            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioContextClass();
            this.master = this.ctx!.createGain();
            this.master.gain.value = 0.4;
            this.master.connect(this.ctx!.destination);
            
            // Pokrećemo proceduralni ambient ako je omogućen
            this.startAmbient();
        }
        
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        if (this.enabled && this.bgm) {
            this.bgm.play().catch(() => {
                console.log("External BGM failed or interaction required, using synth ambient.");
            });
        }
    }

    private startAmbient() {
        if (!this.ctx || !this.master) return;
        
        // Pravimo 3 oscilatora za duboki "space drone" zvuk
        const freqs = [55, 110, 165]; // A1, A2, E3
        this.ambientOscs = freqs.map(f => {
            const osc = this.ctx!.createOscillator();
            const g = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, this.ctx!.currentTime);
            
            g.gain.setValueAtTime(0.02, this.ctx!.currentTime);
            // Polako pulsiranje jačine
            const now = this.ctx!.currentTime;
            g.gain.setTargetAtTime(0.015, now + 2, 2);
            
            osc.connect(g);
            g.connect(this.master!);
            osc.start();
            return osc;
        });
    }
    
    toggle() { 
        this.enabled = !this.enabled; 
        if (this.enabled) {
            this.bgm?.play();
            if (this.ctx && this.master) this.master.gain.setTargetAtTime(0.4, this.ctx.currentTime, 0.1);
        } else {
            this.bgm?.pause();
            if (this.ctx && this.master) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
        }
        return this.enabled;
    }

    playTone(freq: number, type: OscillatorType, duration: number, vol = 0.5, slideTo: number | null = null) {
        if (!this.enabled || !this.ctx || !this.master) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
        }
        
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.master);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playNoise(duration: number, vol = 0.5) {
        if (!this.enabled || !this.ctx || !this.master) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        
        noise.connect(gain);
        gain.connect(this.master);
        noise.start();
    }

    sfx(id: string) {
        if (!this.enabled || !this.ctx) return;
        switch(id) {
            case 'tap': 
                this.playTone(400, 'sine', 0.1, 0.15, 600); 
                break;
            case 'point': 
                // Crystal chime sound
                this.playTone(1000, 'sine', 0.15, 0.1, 2000);
                setTimeout(() => this.playTone(1500, 'sine', 0.1, 0.05, 2500), 50);
                break;
            case 'damage': 
                this.playTone(160, 'sawtooth', 0.4, 0.3, 40);
                this.playNoise(0.25, 0.2);
                break;
            case 'nuke':
                this.playTone(120, 'square', 1.2, 0.4, 10); 
                this.playNoise(1.2, 0.5);
                break;
            case 'powerup':
                this.playTone(440, 'triangle', 0.4, 0.2, 880);
                break;
            case 'freeze':
                // Chilling ice sound
                this.playTone(1200, 'triangle', 0.3, 0.2, 50);
                setTimeout(() => this.playTone(800, 'triangle', 0.2, 0.1, 40), 100);
                break;
            case 'god':
                // Celestial choir-like tone
                this.playTone(440, 'sine', 0.8, 0.3, 440);
                setTimeout(() => this.playTone(554, 'sine', 0.7, 0.2, 554), 50);
                setTimeout(() => this.playTone(659, 'sine', 0.6, 0.1, 659), 100);
                break;
            case 'heart':
                // Healing pulse
                this.playTone(200, 'sine', 0.2, 0.3, 400);
                setTimeout(() => this.playTone(300, 'sine', 0.2, 0.2, 500), 100);
                break;
            case 'levelup':
                this.playTone(400, 'square', 0.3, 0.15, 800);
                setTimeout(() => this.playTone(600, 'square', 0.3, 0.15, 1200), 100);
                setTimeout(() => this.playTone(800, 'square', 0.5, 0.15, 1600), 200);
                break;
            case 'gameover':
                // Disconnecting/glitching out
                this.playTone(200, 'sawtooth', 0.5, 0.4, 40);
                this.playNoise(0.5, 0.3);
                setTimeout(() => this.playTone(100, 'sawtooth', 0.6, 0.3, 20), 200);
                break;
            case 'shield':
                this.playTone(400, 'sine', 0.4, 0.3, 1200);
                setTimeout(() => this.playTone(800, 'sine', 0.2, 0.2, 1600), 50);
                break;
            case 'multiplier':
                this.playTone(300, 'triangle', 0.3, 0.2, 900);
                setTimeout(() => this.playTone(500, 'triangle', 0.3, 0.2, 1200), 100);
                break;
            case 'magnet':
                this.playTone(150, 'square', 0.5, 0.1, 300);
                this.playNoise(0.1, 0.05);
                break;
            case 'warp':
                this.playTone(600, 'sine', 1.0, 0.3, 100);
                break;
        }
    }
}
