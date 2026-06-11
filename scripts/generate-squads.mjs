#!/usr/bin/env node
/**
 * Generates squad JSON files for all 48 World Cup 2026 teams.
 * Run: node scripts/generate-squads.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const teams = JSON.parse(readFileSync(join(__dirname, '../src/data/teams/index.json'), 'utf8'));
const outDir = join(__dirname, '../src/data/teams/squads');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const POSITIONS = ['GK', 'GK', 'CB', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CDM', 'CM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'ST', 'ST', 'CB', 'LB', 'RB', 'CM', 'LW', 'RW', 'CF', 'GK'];
const FIRST_NAMES = ['James', 'Carlos', 'Mohamed', 'Lucas', 'Omar', 'Diego', 'Andre', 'Marco', 'Yuki', 'Samuel', 'Thomas', 'Hassan', 'Pedro', 'Ivan', 'Kenji', 'Ali', 'Jean', 'Pierre', 'Hans', 'Luis'];
const LAST_NAMES = ['Silva', 'Garcia', 'Müller', 'Kim', 'Patel', 'Santos', 'Nielsen', 'Rossi', 'Tanaka', 'Okonkwo', 'Berg', 'Haddad', 'Fernandez', 'Novak', 'Sato', 'Rahman', 'Dubois', 'Weber', 'Costa', 'Ali'];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateSquad(team) {
  const rand = seededRandom(team.code.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  const baseRating = team.strength;
  const players = [];

  for (let i = 0; i < 25; i++) {
    const pos = POSITIONS[i] ?? 'CM';
    const isGK = pos === 'GK';
    const variance = Math.floor(rand() * 16) - 8;
    const rating = Math.max(55, Math.min(92, baseRating + variance + (i < 11 ? 5 : 0)));

    const ratings = isGK
      ? { pace: 40, shooting: 30, passing: rating - 10, dribbling: 35, defending: 40, physical: rating, diving: rating + 5, handling: rating, kicking: rating - 5, reflexes: rating + 3, positioning: rating }
      : { pace: rating + Math.floor(rand() * 6) - 3, shooting: rating + Math.floor(rand() * 6) - 3, passing: rating + Math.floor(rand() * 6) - 3, dribbling: rating + Math.floor(rand() * 6) - 3, defending: rating + Math.floor(rand() * 6) - 3, physical: rating + Math.floor(rand() * 6) - 3 };

    const fn = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];

    players.push({
      id: `${team.code.toLowerCase()}-${i + 1}`,
      name: `${fn} ${ln}`,
      number: i < 11 ? i + 1 : 12 + (i - 11),
      position: pos,
      club: `${team.name} FC`,
      ratings,
      height: 1.72 + rand() * 0.18,
      skinTone: 0xb87840 + Math.floor(rand() * 6) * 0x0a0806,
      hairColor: [0x2c1810, 0x1a1a1a, 0x8b4513, 0xd4a574, 0x000000][Math.floor(rand() * 5)],
    });
  }

  return {
    code: team.code,
    name: team.name,
    flagColors: team.flagColors,
    kit: team.kit,
    formation: team.formation,
    strength: team.strength,
    players,
  };
}

for (const team of teams) {
  const squad = generateSquad(team);
  writeFileSync(join(outDir, `${team.code.toLowerCase()}.json`), JSON.stringify(squad, null, 2));
  console.log(`Generated ${team.code} (${squad.players.length} players)`);
}

console.log(`\nDone — ${teams.length} squads written to src/data/teams/squads/`);
