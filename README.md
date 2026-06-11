# World Cup 2026 Soccer

A browser-based 3D soccer game themed around the 2026 FIFA World Cup. Built with **Three.js**, **TypeScript**, and **Vite**. Runs entirely client-side — no backend required.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in a modern desktop browser (Chrome, Firefox, Edge).

```bash
npm run build    # Production build to dist/
npm run preview  # Preview production build
```

## Controls

| Action | Keyboard | Gamepad |
|--------|----------|---------|
| Move | WASD / Arrow keys | Left stick |
| Sprint | Shift | RT (R2) |
| Pass | E | X (Cross) |
| Shoot (hold for power) | Space | A |
| Tackle | F | B (Circle) |
| Switch player | Q | LB (L1) |
| Toggle camera | C | Y (Triangle) |

## Milestones

### ✅ Milestone 1 — Playable Core
- FIFA-standard pitch with procedural grass, mowing stripes, line markings
- Goals with nets, corner flags, ad boards
- Tiered stadium stands with instanced animated crowd (800 billboards)
- PBR materials, real-time shadows, HDR environment lighting
- Day / dusk / night lighting presets
- Ball physics: gravity, friction, bounce, spin/curl
- One controllable player with keyboard + Gamepad API
- Broadcast & follow camera modes with smooth damping
- Power gauge shooting, passing, sprinting, tackling
- Basic 11v11 AI movement, goals, scoreboard, replay camera

### ✅ Milestone 2 — Full Match (Current)
- Referee: fouls, offside, throw-ins, goal kicks, yellow cards
- Formation-based team AI with difficulty settings
- Match engine: halves, clock, set pieces, goal replays
- Synthesized audio: crowd ambience, kicks, whistle, goals
- Power gauge shooting, passing, sprinting, tackling

### 🔄 Milestone 3 — Tournament (In Progress)
- All 48 qualified teams with metadata and generated squads (JSON)
- Team picker for Quick Match (any of 48 nations)
- Tournament simulation scaffold (group stage)
- Full bracket UI and real squad data enrichment coming next

```bash
npm run generate-squads  # Regenerate 48 team squad JSON files
```

### 🔜 Milestone 4 — Polish
- Skeletal player animations (Mixamo-style)
- Bloom, SSAO post-processing
- Reactive crowd audio, referee whistle, ball sounds
- Lineup screen, celebration cutaways

## Architecture

```
src/
├── core/          # Constants, shared types
├── data/          # Team & player JSON data
├── entities/      # Ball, Player game objects
├── game/          # Game loop, formations, match state
├── input/         # Keyboard + Gamepad input manager
├── physics/       # Ball & player physics
├── rendering/     # Three.js scene, pitch, stadium, meshes
├── styles/        # HUD CSS
└── main.ts        # Entry point
```

Layers are separated: rendering, physics, AI, match state, and data are independent modules.

## Performance

- Instanced crowd rendering (800 instances)
- Shadow map 2048×2048
- Pixel ratio capped at 2×
- Target: 60fps at 1080p on mid-range hardware

## Legal

This project does not use FIFA, EA, or federation logos, crests, kits, or trademarks. Teams are represented by country names, flag colors, and original kit designs.

## License

MIT
