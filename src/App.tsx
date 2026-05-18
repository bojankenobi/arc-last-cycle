import { useEffect, useRef } from 'react';
import { Game } from './game/Game';

export default function App() {
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    let game: Game | null = null;
    
    // Slight delay to ensure elements are mounted and sized
    const timer = setTimeout(() => {
      try {
        game = new Game();
      } catch (err) {
        console.error('Failed to initialize game:', err);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (game) {
        game.destroy();
      }
    };
  }, []);

  return (
    <div id="game-container" className="relative w-full h-full overflow-hidden bg-black">
      <div id="crt-overlay" />
      
      <canvas id="game-layer" className="absolute top-0 left-0" />
      
      <div id="ui-layer">
        <div className="hud-top">
          <div className="hud-left">
            <button className="btn-icon" id="btn-audio">🎵</button>
          </div>
          
          <div className="score-box">
            <div className="score-sub" id="hud-level">INITIALIZING...</div>
            <div className="score-big" id="hud-score">0</div>
          </div>
          
          <div className="hud-right">
            <div id="lives-display">🛡️🛡️🛡️</div>
          </div>
        </div>
      </div>

      <div id="intro-screen" className="terminal-screen">
        <div className="terminal-content">
          <div className="mb-4 text-cyan-400 font-bold opacity-50 text-xs tracking-tighter">REDDIT DEV_PROT V4.4</div>
          <div id="terminal-text" className="min-h-[120px]">
            <span className="opacity-30">ESTABLISHING CONNECTION...</span><br/>
          </div>
          <button id="btn-boot" className="hidden">INITIALIZE A.R.C. PK-404</button>
        </div>
      </div>

      <div id="screen-start" className="screen hidden">
        <div className="panel">
          <h1 className="mega-glitch">
            <span className="glitch-line line-top" data-text="A.R.C.">A.R.C.</span>
            <span className="glitch-line line-bottom" data-text="LAST CYCLE">LAST CYCLE</span>
          </h1>
          <p className="text-gray-500 mb-8 uppercase tracking-widest text-xs font-mono">
            System Ready // Final Attempt // [SUBREDDIT MODE]
          </p>
          <div className="stat-grid">
            <div className="stat-box">
              <div className="stat-val" id="menu-high">0</div>
              <div className="stat-label">Best Sync</div>
            </div>
            <div className="stat-box">
              <div className="stat-val" id="menu-currency">0</div>
              <div className="stat-label">Entropy Data</div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button className="btn-main" id="btn-start">EXECUTE PROTOCOL</button>
            <button className="btn-secondary" id="btn-tutorial">FIELD MANUAL</button>
          </div>
        </div>
      </div>

      <div id="screen-tutorial" className="screen hidden">
        <div className="panel max-w-lg">
          <h2 className="text-2xl font-bold mb-6 text-cyan-400 font-mono tracking-tighter uppercase whitespace-nowrap">Data Log: Mechanics</h2>
          <div className="text-left space-y-4 text-sm font-mono text-gray-300">
            <div className="flex items-start gap-4">
              <span className="text-white bg-cyan-700/30 p-1 px-2 border border-cyan-500 text-[10px]">CONTROL</span>
              <p>Tap screen to <span className="text-white">REVERSE</span> your orbital direction. Avoid the SINGULARITY.</p>
            </div>
            <div className="flex items-start gap-4 text-red-400">
              <span className="bg-red-900/40 p-1 px-2 border border-red-500 text-[10px]">DECAY</span>
              <p>Your orbit shrinks over time. Collect <span className="text-cyan-400">CYAN ORBS</span> to expand it back.</p>
            </div>
            <div className="flex items-start gap-4 text-green-400">
              <span className="bg-green-900/40 p-1 px-2 border border-green-500 text-[10px]">SYNC</span>
              <p>Collecting 8 orbs in a row triggers <span className="text-white font-bold">INFINITY MODE</span>.</p>
            </div>
          </div>
          <button className="btn-main mt-10" id="btn-tutorial-close">ACKNOWLEDGED</button>
        </div>
      </div>

      <div id="screen-over" className="screen hidden">
        <div className="panel">
          <h1 className="text-4xl font-bold mb-4 tracking-tighter" style={{ color: '#ff0055' }}>SIGNAL LOST</h1>
          <div className="text-6xl font-black mb-2 font-mono" id="end-score">0</div>
          <div className="text-blue-400 mb-8 uppercase text-sm tracking-widest">+<span id="end-currency">0</span> Data Saved</div>
          <div className="flex flex-col gap-3">
            <button className="btn-main" id="btn-restart">REBOOT SYSTEM</button>
            <button className="btn-secondary" id="btn-help">RE-READ MANUAL</button>
          </div>
        </div>
      </div>
    </div>
  );
}

