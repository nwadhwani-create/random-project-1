import { GameEngine } from './game/gameEngine';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const engine = new GameEngine(canvas, 'ui-root');

// Expose for debugging
(window as unknown as { game: GameEngine }).game = engine;
