export class ParticleSystem {
    private pool: any[] = [];
    private active: any[] = [];

    constructor() {
        // Pre-warm pool
        for (let i = 0; i < 300; i++) {
            this.pool.push({
                x: 0, y: 0, vx: 0, vy: 0, life: 0, color: '#fff', size: 1
            });
        }
    }

    spawn(x: number, y: number, count: number, color: string, speed: number) {
        for (let i = 0; i < count; i++) {
            if (this.pool.length === 0) return;
            const p = this.pool.pop();
            p.x = x; p.y = y;
            const angle = Math.random() * Math.PI * 2;
            const v = Math.random() * speed;
            p.vx = Math.cos(angle) * v;
            p.vy = Math.sin(angle) * v;
            p.life = 1.0;
            p.color = color;
            p.size = Math.random() * 3 + 1;
            this.active.push(p);
        }
    }

    emit(config: { x: number, y: number, vx: number, vy: number, color: string, life: number, size: number }) {
        if (this.pool.length === 0) return;
        const p = this.pool.pop();
        p.x = config.x;
        p.y = config.y;
        p.vx = config.vx;
        p.vy = config.vy;
        p.life = config.life / 60; // Convert frames to normalized life if needed, or just use config.life
        p.color = config.color;
        p.size = config.size;
        this.active.push(p);
    }

    update(dt: number) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const p = this.active[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= 1.5 * dt;
            if (p.life <= 0) {
                this.active.splice(i, 1);
                this.pool.push(p);
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.globalCompositeOperation = 'lighter';
        for (const p of this.active) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
    }
}
