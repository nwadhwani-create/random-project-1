import type { SquadPlayer, Team } from "../game/types";

const rating = (
  pace: number,
  shooting: number,
  passing: number,
  dribbling: number,
  defending: number,
  physical: number,
  goalkeeping = 20,
) => ({ pace, shooting, passing, dribbling, defending, physical, goalkeeping });

const makePlayer = (
  name: string,
  number: number,
  position: SquadPlayer["position"],
  club: string,
  ratings: SquadPlayer["ratings"],
  heightCm: number,
  skinTone: string,
  hair: string,
): SquadPlayer => ({
  name,
  number,
  position,
  club,
  ratings,
  heightCm,
  skinTone,
  hair,
});

export const starterTeams: Team[] = [
  {
    name: "United States",
    code: "USA",
    flagColors: ["#b22234", "#ffffff", "#3c3b6e"],
    kit: { home: "#f7fbff", away: "#172554", trim: "#b91c1c" },
    formation: "4-3-3",
    tacticalStyle: "High tempo pressing, wide fullback overlaps, quick switches.",
    squad: [
      makePlayer("Christian Pulisic", 10, "FWD", "Milan", rating(86, 82, 80, 86, 44, 66), 177, "#c9875f", "#3b2416"),
      makePlayer("Tyler Adams", 4, "MID", "Bournemouth", rating(77, 58, 76, 74, 82, 78), 175, "#9b6746", "#1b1512"),
      makePlayer("Weston McKennie", 8, "MID", "Juventus", rating(76, 75, 78, 80, 77, 84), 185, "#6f432e", "#17100c"),
      makePlayer("Tim Weah", 21, "FWD", "Juventus", rating(90, 74, 75, 82, 52, 72), 183, "#6a3f2c", "#0f0c0a"),
      makePlayer("Antonee Robinson", 5, "DEF", "Fulham", rating(88, 55, 76, 78, 80, 79), 183, "#5a3829", "#100d0b"),
      makePlayer("Matt Turner", 1, "GK", "Nottingham Forest", rating(48, 20, 52, 45, 28, 74, 80), 191, "#c5865e", "#2b1b12"),
    ],
  },
  {
    name: "Mexico",
    code: "MEX",
    flagColors: ["#006341", "#ffffff", "#ce1126"],
    kit: { home: "#116530", away: "#fff7ed", trim: "#ce1126" },
    formation: "4-2-3-1",
    tacticalStyle: "Patient buildup, aggressive central midfield, late runs from wide areas.",
    squad: [
      makePlayer("Santiago Gimenez", 11, "FWD", "Feyenoord", rating(78, 83, 72, 79, 39, 80), 182, "#b6774f", "#21140f"),
      makePlayer("Edson Alvarez", 4, "MID", "West Ham", rating(63, 66, 74, 73, 84, 85), 187, "#a56645", "#1a120e"),
      makePlayer("Hirving Lozano", 22, "FWD", "PSV", rating(87, 78, 76, 84, 42, 68), 175, "#b97952", "#1b120e"),
      makePlayer("Luis Chavez", 18, "MID", "Dynamo Moscow", rating(74, 78, 82, 79, 74, 76), 178, "#a86a48", "#20130d"),
      makePlayer("Jorge Sanchez", 2, "DEF", "Porto", rating(82, 56, 70, 74, 76, 77), 175, "#9d6243", "#130d0a"),
      makePlayer("Guillermo Ochoa", 13, "GK", "Salernitana", rating(43, 18, 55, 48, 24, 71, 79), 185, "#aa6b47", "#17100d"),
    ],
  },
];

export const tournamentPlaceholders = [
  "Canada",
  "Argentina",
  "Brazil",
  "England",
  "France",
  "Germany",
  "Spain",
  "Portugal",
  "Netherlands",
  "Uruguay",
  "Japan",
  "South Korea",
  "Morocco",
  "Senegal",
  "Australia",
  "New Zealand",
];
