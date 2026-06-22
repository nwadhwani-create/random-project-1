# World Cup 2026 — Browser Soccer Game

A client-side 3D soccer game built for the 2026 FIFA World Cup, targeting the feel of modern console soccer titles. Runs entirely in the browser with Three.js, TypeScript, and Vite.

## Quick Start

```bash
cd world-cup-2026
npm install
npm run dev
```

Open http://localhost:5173 in a modern desktop browser (Chrome, Firefox, Edge).

### Build for Static Hosting

```bash
npm run build
npm run preview
```

Output is in `dist/` and can be deployed to any static host (Netlify, Vercel, GitHub Pages, etc.).

## Controls

| Action | Keyboard | Gamepad |
|--------|----------|---------|
| Move | WASD / Arrow keys | Left stick |
| Sprint | Shift | RT |
| Shoot (hold for power) | Space / E | X (power via RT) |
| Pass | X | A |
| Lob / Through ball | C | B |
| Tackle | Z | Y |
| Slide tackle | V | — |
| Switch player | Q | LB |
| Goalkeeper control | Tab | — |
| Pause | Escape | Start |

## Game Modes

- **Quick Match** — Pick any two of 48 nations and play immediately
- **World Cup Tournament** — Full 2026 format: 12 groups of 4, top 2 + 8 best third-place teams advance to Round of 32, then knockout
- **Penalty Shootout** — Practice penalties under floodlights
- **Training Ground** — Sandbox mode for free play

## Features

### Gameplay (Milestone 2)
- 11v11 matches with AI-controlled teammates and opponents
- Player switching, sprint with stamina, pass, lob, shoot with power gauge
- Tackle and slide tackle, goalkeeper control on demand
- Ball physics: gravity, friction, bounce, spin/curl
- Team AI: positional play, attacking runs, defensive shape, goalkeeper dives
- Adjustable difficulty (Easy / Medium / Hard / Legendary)
- Configurable match length (3 / 5 / 10 minute halves)

### Rosters (Milestone 3)
- All 48 World Cup 2026 teams with squads (26 players each)
- Team kits (home/away), flag colors, formations, overall ratings
- Player attributes: pace, shooting, passing, dribbling, defending, physical, GK stats
- Tournament mode with group simulation and bracket progression

### Visuals (Milestone 4)
- Stadium with tiered stands and instanced crowd billboards
- Realistic grass pitch with mowing stripes and line markings
- Goals with net geometry, corner flags, ad boards
- PBR materials, real-time shadows, HDR tone mapping
- Post-processing: bloom, SSAO (on capable hardware)
- Day, dusk, and night/floodlight lighting presets
- Rigged player models with procedural animation blending
- Broadcast-style camera with smooth damping and goal replay

### Audio
- Reactive crowd ambience (synthesized)
- Referee whistle, kick sounds, net ripple, goal celebration tones

## Architecture

```
src/
├── main.ts              # Entry point
├── game/
│   └── gameEngine.ts    # Main loop, scene setup, match lifecycle
├── rendering/
│   ├── stadium.ts       # Pitch, goals, stands, crowd, lighting
│   ├── playerRenderer.ts# Player meshes and animation
│   ├── camera.ts        # Broadcast / follow / replay cameras
│   └── postProcessing.ts# Bloom, SSAO composer
├── physics/
│   ├── ballPhysics.ts   # Ball state, kicks, collisions, goals
│   └── playerPhysics.ts # Movement, formations, stamina
├── ai/
│   └── teamAI.ts        # Team AI, offside check, difficulty configs
├── match/
│   ├── matchState.ts    # Score, clock, events, set pieces
│   └── tournament.ts    # World Cup bracket and group simulation
├── input/
│   └── inputManager.ts  # Keyboard + Gamepad API
├── audio/
│   └── audioManager.ts  # Synthesized SFX and crowd
├── data/
│   ├── types.ts         # Shared types and pitch constants
│   ├── teams.ts         # Team data loader
│   └── teams/           # 48 team JSON files + index
└── ui/
    └── uiManager.ts     # Menus, HUD, scoreboard, lineups
```

### Layer Separation

| Layer | Responsibility |
|-------|---------------|
| **Data** | Team rosters, formations, ratings (JSON) |
| **Physics** | Ball and player movement, collisions |
| **AI** | Off-ball runs, passing, shooting decisions |
| **Match** | Game state, scoring, clock, tournaments |
| **Rendering** | Three.js scene, materials, post-processing |
| **Input** | Keyboard and gamepad polling |
| **UI** | DOM overlays for menus and HUD |

## Team Data

Squads are stored in `src/data/teams/*.json`. Regenerate with:

```bash
npx tsx scripts/generate-squads.ts
```

Each file contains 26 players with positions, ratings, kit colors, and formation. Update individual team files with real squad data from public sources as needed.

## Performance

- Target: 60 fps at 1080p on mid-range hardware
- Instanced crowd rendering (1500 billboards)
- Shadow maps at 2048² for main light
- SSAO disabled automatically is not the bottleneck; can be toggled in `gameEngine.ts`
- Pixel ratio capped at 2×

## Milestones

| # | Scope | Status |
|---|-------|--------|
| 1 | Pitch + ball physics + controllable player | ✅ |
| 2 | Full 11v11 with AI and rules | ✅ |
| 3 | 48 team rosters + tournament mode | ✅ |
| 4 | Visual and audio polish | ✅ (baseline) |

## Legal

This project does not use FIFA, EA, or federation trademarks, logos, crests, or official kits. Teams are represented by country names, flag colors, and original kit designs only.

## License

MIT
