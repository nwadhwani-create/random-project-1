# ⚽ World Cup 26 — Browser 3D Football

A browser-based 3D soccer game themed around the 2026 FIFA World Cup, built with **Three.js + TypeScript + Vite**. Runs entirely client-side — no backend, no downloaded assets: every texture, model, stadium, and sound is procedurally generated.

> Unofficial fan project. No FIFA, EA, or federation trademarks, logos, crests, or kits are used — only country names, flag colors, and original kit designs.

## Running locally

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # static production build in dist/ (deployable to any static host)
npm run preview  # serve the production build
```

Requires Node 20+. Tested in Chromium-based browsers and Firefox on desktop.

## Game modes

- **Quick Match** — pick any two of the 48 qualified teams.
- **World Cup Tournament** — the full 2026 format: 12 groups of 4, top two plus the 8 best third-placed teams advance to a Round of 32, then knockout rounds to the final. Matches you don't play are simulated from team strength. Group tables, bracket view, and top scorers included. Progress persists in `localStorage`.
- **Penalty Shootout** — straight to a shootout between any two teams.

## Controls

| Action | Keyboard | Gamepad (Xbox layout) |
|---|---|---|
| Move | Arrow keys | Left stick / D-pad |
| Sprint | Shift | RB |
| Ground pass / standing tackle | S | A |
| Lob / cross | D | B |
| Through ball | T | Y |
| Shoot (hold for power) | A | X |
| Slide tackle | W | RT |
| Switch player | E / Space | LB |
| Toggle GK control | Q | LT |
| Replay last 7 seconds | R | Back |
| Pause | Esc / P | Start |

Set pieces (kickoff, throw-in, corner, free kick, penalty) are taken with the same buttons: aim with the movement keys, then press pass / lob / shoot.

## Rosters and data

- All 48 qualified national teams with their **real final 2026 World Cup squads** (23–26 players each): names, shirt numbers, positions, caps, goals, and clubs, parsed from the Wikipedia squad page ([2026 FIFA World Cup squads](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads)) into `src/data/squads.json`.
- Player ratings (pace, shooting, passing, dribbling, defending, physical, plus GK diving/handling/reflexes) are generated from club strength, caps, goals, and age, with hand-tuned overrides for ~400 well-known players — star players feel meaningfully better.
- Each team has its FIFA code, flag, realistic home/away kit colors, and a formation appropriate to that nation (`src/data/teams.ts`).
- Regenerate the squad data with `npm run data` (parses `tools/data/wiki_squads.md`).

## Architecture

Modular layers, cleanly separated — the sim runs headlessly without any rendering:

```
src/
  core/      input (keyboard + Gamepad API), synthesized WebAudio engine
  data/      squads.json (real rosters), team metadata, roster/lineup builder
  sim/       pure game logic — no three.js scene dependencies
    ball.ts        ball physics: gravity, drag, Magnus spin, bounces, goal frame/net
    player.ts      player locomotion + action state machine
    formations.ts  formation slot layouts (433, 442, 4231, 352, 532, 541, 343)
    match.ts       match state machine: phases, restarts, fouls/cards, offside,
                   penalties, extra time, shootouts, stats
    ai.ts          team AI: positional play, pressing, marking, off-ball runs,
                   carrier decisions, goalkeeper logic; difficulty scaling
    userctl.ts     user input → controlled player, switching, power gauge
  render/    three.js layer — scene/lighting presets, procedural pitch & stadium,
             instanced crowd, articulated player rigs with procedural animation,
             broadcast TV camera + replay camera
  ui/        DOM overlays — HUD, menus, team select, lineups, tournament hub
  game.ts    GameSession: wires sim + render + audio + replay buffer together
```

### Headless testing

The whole match engine runs in Node without a browser:

```bash
npx tsx tools/headless_match.ts Brazil Argentina 3            # full match
npx tsx tools/headless_match.ts England France 3 --knockout   # with ET + pens
npx tsx tools/headless_shootout.ts                            # shootout mode
```

## Visuals & audio

- PBR materials, ACES tone mapping, real-time shadows, bloom; **day / dusk / night** lighting presets (switchable in settings or the pause menu).
- Procedural stadium: two-tier stands on four sides, instanced crowd (~20k spectators) that bobs and jumps with excitement, floodlight pylons, ad boards, mowing-striped grass, goals with physical nets, corner flags.
- Players are articulated low-poly rigs with procedural animation (run cycle, kick, slide tackle, GK dives, throw-ins, celebrations) with per-player skin tones, hair, heights from squad data, and kit textures with names and numbers.
- Broadcast presentation: damped TV camera, slow-motion goal replays, celebration cutaway camera, scoreboard/clock overlay, lineups screen.
- All audio is synthesized with WebAudio: crowd bed reacting to excitement, goal roars, whistle, kick thumps, post ping, net ripple.

## Performance

Targets 60 fps at 1080p on mid-range hardware: instanced crowd with throttled matrix updates, shared geometries, capped pixel ratio, single shadow-casting light, modest poly counts.
