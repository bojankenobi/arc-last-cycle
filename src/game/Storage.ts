export class StorageSystem {
    private data: {
        highScore: number;
        currency: number;
        skin: string;
    };

    constructor() {
        const saved = localStorage.getItem('arc_last_cycle_v1');
        this.data = saved ? JSON.parse(saved) : {
            highScore: 0,
            currency: 0,
            skin: 'neon'
        };
    }

    save() {
        localStorage.setItem('arc_last_cycle_v1', JSON.stringify(this.data));
        this.updateUI();
        
        // Notify Devvit (Reddit backend) of the new high score
        // This is where we bridge to the Reddit Key-Value store
        window.parent?.postMessage({
            type: 'UPDATE_SCORE',
            data: { score: this.data.highScore }
        }, '*');
    }

    addScore(score: number) {
        if (score > this.data.highScore) {
            this.data.highScore = score;
        }
        this.data.currency += Math.floor(score * 0.5);
        this.save();
    }

    getHighScore() { return this.data.highScore; }
    getCurrency() { return this.data.currency; }

    updateUI() {
        const highEl = document.getElementById('menu-high');
        const currEl = document.getElementById('menu-currency');
        if (highEl) highEl.innerText = this.data.highScore.toString();
        if (currEl) currEl.innerText = this.data.currency.toString();
    }
}
