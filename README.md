# World Cup 2026 Soccer Web Prototype

A browser-based 3D soccer prototype built with plain TypeScript, Vite, and Three.js. This first milestone prioritizes a playable core loop: a stadium scene, one controllable player, ball physics, shooting/passing, broadcast camera tracking, basic HUD, synthesized audio, and keyboard/gamepad input.

This project is inspired by modern console soccer presentation, but it does not use FIFA, EA, federation logos, crests, real kits, or other protected marks. Team names, country codes, flag-inspired colors, and original kit designs are used for theme and gameplay context.

## Run locally

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

Build for static hosting:

```bash
npm run build
```

## Controls

- `WASD` or gamepad left stick: move
- `Shift` or right trigger: sprint
- `Space` or gamepad `A/Cross`: ground pass
- Hold and release `J` or gamepad `X/Square`: charged shot
- `K` or gamepad `B/Circle`: tackle animation
- `L`: cycle day, dusk, and night/floodlight lighting presets

Browser audio starts after the first pointer or keyboard interaction.

## Architecture

- `src/main.ts`: app bootstrap and DOM wiring
- `src/game/SoccerGame.ts`: match loop, player control, HUD, camera, scoring
- `src/game/SceneFactory.ts`: Three.js renderer, stadium, pitch, crowd, player, goals, lighting
- `src/game/BallPhysics.ts`: gravity, friction, bounce, spin, kick impulse, goal detection
- `src/game/InputController.ts`: keyboard and Gamepad API state normalization
- `src/game/AudioEngine.ts`: synthesized crowd, kick, whistle, and goal audio
- `src/data/teams.ts`: original kit/team data and starter player metadata

## Current milestone

Milestone 1 is independently runnable and includes:

- Detailed procedural stadium with tiered stands, crowd imposters, pitch stripes, markings, goals, net lines, ad boards, corner flags, PBR-style materials, shadows, and three lighting presets
- One controllable player with procedural humanoid mesh, simple run/tackle animation, shirt number/name texture, varied appearance metadata
- Ball physics with gravity, bounce, ground friction, spin/curl, passing, charged shooting, and goal detection
- Broadcast-style damped camera, scoreboard/clock overlay, match toast, and basic reactive crowd audio
- Keyboard controls plus Gamepad API support

## Roadmap

1. Pitch, stadium, ball physics, one controllable player: complete in this prototype.
2. Full 11v11: add formation slots, teammate/opponent AI, player switching, goalkeeper behavior, restarts, fouls, offside, cards, penalties, and configurable difficulty.
3. Rosters and tournament mode: add verified public-source squad JSON only when final 2026 squads are available and cite source snapshots; add all 48 teams, group tables, round-of-32 bracket, simulated matches, top scorers, extra time, and shootouts.
4. Visual/audio polish: skeletal animation imports or procedural blending, replay buffers, celebration cameras, more crowd states, dynamic LOD, SSAO/bloom performance toggles, richer synthesized or openly licensed audio.

## Performance notes

- Crowd spectators are instanced meshes with per-frame matrix updates.
- Stadium, pitch, and players are procedural to avoid large assets in v1.
- Renderer pixel ratio is capped at `2` for mid-range desktop hardware.
- Shadows are enabled with one primary directional light plus optional floodlights for night mode.
