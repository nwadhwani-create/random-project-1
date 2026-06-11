import { Game } from '@/game/Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const game = new Game(canvas);

function loop(): void {
  game.update();
  requestAnimationFrame(loop);
}

document.getElementById('btn-quick-match')?.addEventListener('click', () => {
  game.startMatch({ halfMinutes: 5, lighting: 'day' });
});

// Pre-render one frame for menu background
game.update();
requestAnimationFrame(loop);
