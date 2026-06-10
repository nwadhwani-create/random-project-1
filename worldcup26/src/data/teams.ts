// Hand-authored metadata for the 48 qualified teams of the 2026 World Cup.
// Kit designs are original; colors are based on traditional national colors.
// No federation crests or trademarks are used.

export interface KitColors {
  shirt: string;
  shorts: string;
  socks: string;
  accent: string; // trim / number color
}

export interface TeamMeta {
  name: string;      // must match Wikipedia squad page name
  code: string;      // FIFA country code
  flag: string;      // emoji flag
  group: string;     // A-L
  formation: string; // e.g. '433'
  home: KitColors;
  away: KitColors;
  gk: KitColors;
}

const kit = (shirt: string, shorts: string, socks: string, accent: string): KitColors => ({ shirt, shorts, socks, accent });

export const TEAMS: TeamMeta[] = [
  // ---- Group A ----
  { name: 'Czech Republic', code: 'CZE', flag: '🇨🇿', group: 'A', formation: '4231', home: kit('#d7141a', '#ffffff', '#11457e', '#ffffff'), away: kit('#f4f4f4', '#11457e', '#f4f4f4', '#d7141a'), gk: kit('#222831', '#222831', '#222831', '#7cf26a') },
  { name: 'Mexico', code: 'MEX', flag: '🇲🇽', group: 'A', formation: '433', home: kit('#0a6640', '#ffffff', '#b3122f', '#ffffff'), away: kit('#f2ede4', '#7a1c2c', '#f2ede4', '#7a1c2c'), gk: kit('#caa53d', '#caa53d', '#caa53d', '#1a1a1a') },
  { name: 'South Africa', code: 'RSA', flag: '🇿🇦', group: 'A', formation: '433', home: kit('#f3c218', '#0b6e4f', '#f3c218', '#0b6e4f'), away: kit('#ffffff', '#ffffff', '#ffffff', '#0b6e4f'), gk: kit('#5b2e91', '#5b2e91', '#5b2e91', '#f3c218') },
  { name: 'South Korea', code: 'KOR', flag: '🇰🇷', group: 'A', formation: '4231', home: kit('#cd2e3a', '#1a1a1a', '#cd2e3a', '#ffffff'), away: kit('#f4f4f4', '#f4f4f4', '#f4f4f4', '#0047a0'), gk: kit('#76d34a', '#76d34a', '#76d34a', '#1a1a1a') },
  // ---- Group B ----
  { name: 'Bosnia and Herzegovina', code: 'BIH', flag: '🇧🇦', group: 'B', formation: '442', home: kit('#002f6c', '#ffffff', '#002f6c', '#fecb00'), away: kit('#ffffff', '#002f6c', '#ffffff', '#fecb00'), gk: kit('#9ad44b', '#9ad44b', '#9ad44b', '#002f6c') },
  { name: 'Canada', code: 'CAN', flag: '🇨🇦', group: 'B', formation: '442', home: kit('#d52b1e', '#d52b1e', '#d52b1e', '#ffffff'), away: kit('#f4f4f4', '#f4f4f4', '#f4f4f4', '#d52b1e'), gk: kit('#ffb71b', '#ffb71b', '#ffb71b', '#1a1a1a') },
  { name: 'Qatar', code: 'QAT', flag: '🇶🇦', group: 'B', formation: '532', home: kit('#8a1538', '#ffffff', '#8a1538', '#ffffff'), away: kit('#f4f4f4', '#8a1538', '#f4f4f4', '#8a1538'), gk: kit('#1f8a70', '#1f8a70', '#1f8a70', '#ffffff') },
  { name: 'Switzerland', code: 'SUI', flag: '🇨🇭', group: 'B', formation: '4231', home: kit('#da291c', '#ffffff', '#da291c', '#ffffff'), away: kit('#f4f4f4', '#1a1a1a', '#f4f4f4', '#da291c'), gk: kit('#ff9f1c', '#ff9f1c', '#ff9f1c', '#1a1a1a') },
  // ---- Group C ----
  { name: 'Brazil', code: 'BRA', flag: '🇧🇷', group: 'C', formation: '4231', home: kit('#ffdf00', '#0044aa', '#ffffff', '#009c3b'), away: kit('#0044aa', '#ffffff', '#0044aa', '#ffdf00'), gk: kit('#3dd6d0', '#3dd6d0', '#3dd6d0', '#1a1a1a') },
  { name: 'Haiti', code: 'HAI', flag: '🇭🇹', group: 'C', formation: '532', home: kit('#00209f', '#d21034', '#00209f', '#ffffff'), away: kit('#f4f4f4', '#f4f4f4', '#f4f4f4', '#00209f'), gk: kit('#ffd100', '#ffd100', '#ffd100', '#00209f') },
  { name: 'Morocco', code: 'MAR', flag: '🇲🇦', group: 'C', formation: '433', home: kit('#c1272d', '#006233', '#c1272d', '#006233'), away: kit('#f4f4f4', '#f4f4f4', '#f4f4f4', '#c1272d'), gk: kit('#ffd23f', '#ffd23f', '#ffd23f', '#006233') },
  { name: 'Scotland', code: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'C', formation: '352', home: kit('#003078', '#ffffff', '#003078', '#ffffff'), away: kit('#f7e017', '#003078', '#f7e017', '#003078'), gk: kit('#ce58c4', '#ce58c4', '#ce58c4', '#1a1a1a') },
  // ---- Group D ----
  { name: 'Australia', code: 'AUS', flag: '🇦🇺', group: 'D', formation: '352', home: kit('#ffcd00', '#00843d', '#ffcd00', '#00843d'), away: kit('#003a30', '#003a30', '#003a30', '#ffcd00'), gk: kit('#9e9efc', '#9e9efc', '#9e9efc', '#1a1a1a') },
  { name: 'Paraguay', code: 'PAR', flag: '🇵🇾', group: 'D', formation: '442', home: kit('#d3122e', '#00338d', '#ffffff', '#ffffff'), away: kit('#f4f4f4', '#f4f4f4', '#f4f4f4', '#d3122e'), gk: kit('#54e08a', '#54e08a', '#54e08a', '#1a1a1a') },
  { name: 'Turkey', code: 'TUR', flag: '🇹🇷', group: 'D', formation: '4231', home: kit('#e30a17', '#ffffff', '#e30a17', '#ffffff'), away: kit('#f4f4f4', '#f4f4f4', '#f4f4f4', '#e30a17'), gk: kit('#28c2a0', '#28c2a0', '#28c2a0', '#1a1a1a') },
  { name: 'United States', code: 'USA', flag: '🇺🇸', group: 'D', formation: '4231', home: kit('#ffffff', '#1a3668', '#ffffff', '#bf0d3e'), away: kit('#1a3668', '#1a3668', '#1a3668', '#ffffff'), gk: kit('#ffe16b', '#ffe16b', '#ffe16b', '#1a3668') },
  // ---- Group E ----
  { name: 'Curaçao', code: 'CUW', flag: '🇨🇼', group: 'E', formation: '433', home: kit('#002b7f', '#002b7f', '#f9e814', '#f9e814'), away: kit('#f4f4f4', '#f4f4f4', '#f4f4f4', '#002b7f'), gk: kit('#fc8b4b', '#fc8b4b', '#fc8b4b', '#1a1a1a') },
  { name: 'Ecuador', code: 'ECU', flag: '🇪🇨', group: 'E', formation: '4231', home: kit('#ffd100', '#003da5', '#d52b1e', '#003da5'), away: kit('#23356c', '#23356c', '#23356c', '#ffd100'), gk: kit('#9be564', '#9be564', '#9be564', '#1a1a1a') },
  { name: 'Germany', code: 'GER', flag: '🇩🇪', group: 'E', formation: '4231', home: kit('#f4f4f4', '#1a1a1a', '#f4f4f4', '#1a1a1a'), away: kit('#23856d', '#23856d', '#23856d', '#ffffff'), gk: kit('#c5f04a', '#c5f04a', '#c5f04a', '#1a1a1a') },
  { name: 'Ivory Coast', code: 'CIV', flag: '🇨🇮', group: 'E', formation: '433', home: kit('#f77f00', '#ffffff', '#009e60', '#ffffff'), away: kit('#f4f4f4', '#f77f00', '#f4f4f4', '#f77f00'), gk: kit('#48cae4', '#48cae4', '#48cae4', '#1a1a1a') },
  // ---- Group F ----
  { name: 'Japan', code: 'JPN', flag: '🇯🇵', group: 'F', formation: '352', home: kit('#10146c', '#ffffff', '#10146c', '#e60012'), away: kit('#f4f4f4', '#f4f4f4', '#f4f4f4', '#10146c'), gk: kit('#ff7847', '#ff7847', '#ff7847', '#1a1a1a') },
  { name: 'Netherlands', code: 'NED', flag: '🇳🇱', group: 'F', formation: '433', home: kit('#f36c21', '#f36c21', '#f36c21', '#21468b'), away: kit('#21468b', '#21468b', '#21468b', '#f36c21'), gk: kit('#b6f26a', '#b6f26a', '#b6f26a', '#1a1a1a') },
  { name: 'Sweden', code: 'SWE', flag: '🇸🇪', group: 'F', formation: '442', home: kit('#ffcd00', '#005293', '#ffcd00', '#005293'), away: kit('#10243e', '#10243e', '#10243e', '#ffcd00'), gk: kit('#7ad7f0', '#7ad7f0', '#7ad7f0', '#1a1a1a') },
  { name: 'Tunisia', code: 'TUN', flag: '🇹🇳', group: 'F', formation: '352', home: kit('#f4f4f4', '#f4f4f4', '#f4f4f4', '#e70013'), away: kit('#e70013', '#e70013', '#e70013', '#ffffff'), gk: kit('#52b788', '#52b788', '#52b788', '#1a1a1a') },
  // ---- Group G ----
  { name: 'Belgium', code: 'BEL', flag: '🇧🇪', group: 'G', formation: '433', home: kit('#c8102e', '#c8102e', '#c8102e', '#fdda24'), away: kit('#2d2926', '#2d2926', '#2d2926', '#fdda24'), gk: kit('#7bdff2', '#7bdff2', '#7bdff2', '#1a1a1a') },
  { name: 'Egypt', code: 'EGY', flag: '🇪🇬', group: 'G', formation: '4231', home: kit('#ce1126', '#1a1a1a', '#ce1126', '#ffffff'), away: kit('#f4f4f4', '#f4f4f4', '#f4f4f4', '#ce1126'), gk: kit('#ffd60a', '#ffd60a', '#ffd60a', '#1a1a1a') },
  { name: 'Iran', code: 'IRN', flag: '🇮🇷', group: 'G', formation: '532', home: kit('#f4f4f4', '#f4f4f4', '#f4f4f4', '#da0000'), away: kit('#da0000', '#da0000', '#da0000', '#ffffff'), gk: kit('#80ed99', '#80ed99', '#80ed99', '#1a1a1a') },
  { name: 'New Zealand', code: 'NZL', flag: '🇳🇿', group: 'G', formation: '442', home: kit('#f4f4f4', '#f4f4f4', '#f4f4f4', '#1a1a1a'), away: kit('#1a1a1a', '#1a1a1a', '#1a1a1a', '#ffffff'), gk: kit('#4895ef', '#4895ef', '#4895ef', '#ffffff') },
  // ---- Group H ----
  { name: 'Cape Verde', code: 'CPV', flag: '🇨🇻', group: 'H', formation: '541', home: kit('#003893', '#003893', '#003893', '#f7d116'), away: kit('#cf2027', '#f4f4f4', '#cf2027', '#ffffff'), gk: kit('#ffba08', '#ffba08', '#ffba08', '#003893') },
  { name: 'Saudi Arabia', code: 'KSA', flag: '🇸🇦', group: 'H', formation: '433', home: kit('#f4f4f4', '#f4f4f4', '#f4f4f4', '#006c35'), away: kit('#006c35', '#006c35', '#006c35', '#ffffff'), gk: kit('#ff6d44', '#ff6d44', '#ff6d44', '#1a1a1a') },
  { name: 'Spain', code: 'ESP', flag: '🇪🇸', group: 'H', formation: '433', home: kit('#aa151b', '#1c2f6b', '#aa151b', '#f1bf00'), away: kit('#f2efe6', '#f2efe6', '#f2efe6', '#aa151b'), gk: kit('#9ef01a', '#9ef01a', '#9ef01a', '#1a1a1a') },
  { name: 'Uruguay', code: 'URU', flag: '🇺🇾', group: 'H', formation: '433', home: kit('#5cbfeb', '#1a1a1a', '#1a1a1a', '#ffffff'), away: kit('#f4f4f4', '#5cbfeb', '#f4f4f4', '#5cbfeb'), gk: kit('#ff5d8f', '#ff5d8f', '#ff5d8f', '#1a1a1a') },
  // ---- Group I ----
  { name: 'France', code: 'FRA', flag: '🇫🇷', group: 'I', formation: '4231', home: kit('#21304d', '#ffffff', '#ce1126', '#ffffff'), away: kit('#f4f4f4', '#21304d', '#f4f4f4', '#21304d'), gk: kit('#ffe45e', '#ffe45e', '#ffe45e', '#21304d') },
  { name: 'Iraq', code: 'IRQ', flag: '🇮🇶', group: 'I', formation: '4231', home: kit('#007a3d', '#ffffff', '#007a3d', '#ffffff'), away: kit('#f4f4f4', '#f4f4f4', '#f4f4f4', '#007a3d'), gk: kit('#ffafcc', '#ffafcc', '#ffafcc', '#1a1a1a') },
  { name: 'Norway', code: 'NOR', flag: '🇳🇴', group: 'I', formation: '442', home: kit('#ba0c2f', '#ffffff', '#00205b', '#ffffff'), away: kit('#f4f4f4', '#00205b', '#f4f4f4', '#00205b'), gk: kit('#90e0ef', '#90e0ef', '#90e0ef', '#1a1a1a') },
  { name: 'Senegal', code: 'SEN', flag: '🇸🇳', group: 'I', formation: '433', home: kit('#f4f4f4', '#f4f4f4', '#f4f4f4', '#00853f'), away: kit('#00853f', '#fdef42', '#00853f', '#fdef42'), gk: kit('#e63946', '#e63946', '#e63946', '#ffffff') },
  // ---- Group J ----
  { name: 'Algeria', code: 'ALG', flag: '🇩🇿', group: 'J', formation: '433', home: kit('#f4f4f4', '#f4f4f4', '#f4f4f4', '#006233'), away: kit('#006233', '#006233', '#006233', '#ffffff'), gk: kit('#ffd166', '#ffd166', '#ffd166', '#006233') },
  { name: 'Argentina', code: 'ARG', flag: '🇦🇷', group: 'J', formation: '433', home: kit('#74acdf', '#1a1a1a', '#f4f4f4', '#ffffff'), away: kit('#2b1f4e', '#2b1f4e', '#2b1f4e', '#74acdf'), gk: kit('#ff9505', '#ff9505', '#ff9505', '#1a1a1a') },
  { name: 'Austria', code: 'AUT', flag: '🇦🇹', group: 'J', formation: '4231', home: kit('#ed2939', '#1a1a1a', '#ed2939', '#ffffff'), away: kit('#f4f4f4', '#f4f4f4', '#f4f4f4', '#ed2939'), gk: kit('#06d6a0', '#06d6a0', '#06d6a0', '#1a1a1a') },
  { name: 'Jordan', code: 'JOR', flag: '🇯🇴', group: 'J', formation: '442', home: kit('#f4f4f4', '#f4f4f4', '#f4f4f4', '#ce1126'), away: kit('#ce1126', '#ce1126', '#ce1126', '#ffffff'), gk: kit('#118ab2', '#118ab2', '#118ab2', '#ffffff') },
  // ---- Group K ----
  { name: 'Colombia', code: 'COL', flag: '🇨🇴', group: 'K', formation: '4231', home: kit('#fcd116', '#003893', '#ce1126', '#003893'), away: kit('#003893', '#003893', '#003893', '#fcd116'), gk: kit('#80ffdb', '#80ffdb', '#80ffdb', '#1a1a1a') },
  { name: 'DR Congo', code: 'COD', flag: '🇨🇩', group: 'K', formation: '433', home: kit('#007fff', '#007fff', '#f7d618', '#ce1021'), away: kit('#f4f4f4', '#f4f4f4', '#f4f4f4', '#007fff'), gk: kit('#f7d618', '#f7d618', '#f7d618', '#ce1021') },
  { name: 'Portugal', code: 'POR', flag: '🇵🇹', group: 'K', formation: '433', home: kit('#a4161a', '#006233', '#a4161a', '#f1bf00'), away: kit('#f2efe6', '#f2efe6', '#f2efe6', '#a4161a'), gk: kit('#b5e48c', '#b5e48c', '#b5e48c', '#1a1a1a') },
  { name: 'Uzbekistan', code: 'UZB', flag: '🇺🇿', group: 'K', formation: '4231', home: kit('#f4f4f4', '#f4f4f4', '#f4f4f4', '#0099b5'), away: kit('#0099b5', '#0099b5', '#0099b5', '#ffffff'), gk: kit('#ef476f', '#ef476f', '#ef476f', '#ffffff') },
  // ---- Group L ----
  { name: 'Croatia', code: 'CRO', flag: '🇭🇷', group: 'L', formation: '433', home: kit('#e63946', '#f4f4f4', '#0a3161', '#ffffff'), away: kit('#10243e', '#10243e', '#10243e', '#7cd5f2'), gk: kit('#ffd60a', '#ffd60a', '#ffd60a', '#1a1a1a') },
  { name: 'England', code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'L', formation: '4231', home: kit('#f4f4f4', '#10243e', '#f4f4f4', '#ce1126'), away: kit('#ce1126', '#ce1126', '#ce1126', '#ffffff'), gk: kit('#ffe16b', '#ffe16b', '#ffe16b', '#10243e') },
  { name: 'Ghana', code: 'GHA', flag: '🇬🇭', group: 'L', formation: '433', home: kit('#f4f4f4', '#f4f4f4', '#f4f4f4', '#ce1126'), away: kit('#ce1126', '#fcd116', '#006b3f', '#fcd116'), gk: kit('#fcd116', '#fcd116', '#fcd116', '#1a1a1a') },
  { name: 'Panama', code: 'PAN', flag: '🇵🇦', group: 'L', formation: '442', home: kit('#d21034', '#d21034', '#d21034', '#ffffff'), away: kit('#f4f4f4', '#005293', '#f4f4f4', '#005293'), gk: kit('#3a86ff', '#3a86ff', '#3a86ff', '#ffffff') },
];

export const GROUPS = 'ABCDEFGHIJKL'.split('');

export function teamMeta(name: string): TeamMeta {
  const m = TEAMS.find((t) => t.name === name);
  if (!m) throw new Error(`No team meta for ${name}`);
  return m;
}
