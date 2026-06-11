import "./styles.css";
import { SoccerGame } from "./game/SoccerGame";

const getElement = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required element #${id}`);
  return element as T;
};

const game = new SoccerGame(getElement<HTMLCanvasElement>("game-canvas"), {
  inputStatus: getElement("input-status"),
  toast: getElement("match-toast"),
  clock: getElement("match-clock"),
  homeScore: getElement("home-score"),
  awayScore: getElement("away-score"),
  lightingStatus: getElement("lighting-status"),
});

game.start();
