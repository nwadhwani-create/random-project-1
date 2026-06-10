// Parses tools/data/wiki_squads.md (2026 FIFA World Cup squads, Wikipedia)
// into src/data/squads.json with generated player ratings.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, 'data/wiki_squads.md'), 'utf8');

// ---------- club tiers (affects base rating) ----------
const TIERS = [
  // tier 0: elite
  ['Real Madrid', 'Barcelona', 'Manchester City', 'Liverpool', 'Bayern Munich', 'Paris Saint-Germain', 'Arsenal', 'Inter Milan', 'Internazionale'],
  // tier 1: top european
  ['Chelsea', 'Manchester United', 'Tottenham Hotspur', 'Newcastle United', 'Atlético Madrid', 'Bayer Leverkusen', 'Borussia Dortmund', 'Juventus', 'Milan', 'Napoli', 'Atalanta', 'RB Leipzig', 'Aston Villa', 'Marseille', 'Monaco', 'Sporting CP', 'Benfica', 'Porto', 'Roma', 'Lazio', 'Real Sociedad', 'Athletic Bilbao', 'Villarreal', 'Lyon', 'Lille', 'Brighton & Hove Albion', 'Crystal Palace', 'Nottingham Forest', 'Bournemouth', 'West Ham United', 'Everton', 'Fulham', 'Brentford', 'Real Betis', 'Eintracht Frankfurt', 'VfB Stuttgart', 'Fenerbahçe', 'Galatasaray', 'Al-Hilal', 'Al-Nassr', 'Feyenoord', 'PSV Eindhoven', 'Ajax', 'Fiorentina', 'Bologna', 'Wolverhampton Wanderers', 'Leeds United', 'Sevilla', 'Celtic', 'Rangers', 'Beşiktaş', 'Al-Ittihad', 'Al-Ahli', 'Como', 'Girona', 'Borussia Mönchengladbach', 'SC Freiburg', 'TSG Hoffenheim', 'VfL Wolfsburg', 'Mainz 05', 'Werder Bremen', 'Nice', 'Rennes', 'Strasbourg', 'Leicester City', 'Southampton', 'Ipswich Town', 'Sunderland', 'Burnley', 'Valencia', 'Osasuna', 'Celta Vigo', 'Rayo Vallecano', 'Mallorca', 'Getafe', 'Torino', 'Udinese', 'Genoa', 'Sassuolo', 'Braga', 'River Plate', 'Boca Juniors', 'Flamengo', 'Palmeiras', 'Botafogo', 'Cruzeiro'],
  // tier 2: solid first-division
  ['AZ', 'Twente', 'Utrecht', 'Anderlecht', 'Club Brugge', 'Union Saint-Gilloise', 'Gent', 'Genk', 'Red Star Belgrade', 'Dinamo Zagreb', 'Hajduk Split', 'Slavia Prague', 'Sparta Prague', 'Viktoria Plzeň', 'Olympiacos', 'PAOK', 'AEK Athens', 'Panathinaikos', 'FC Copenhagen', 'Midtjylland', 'Brøndby', 'Salzburg', 'Red Bull Salzburg', 'Sturm Graz', 'Young Boys', 'Basel', 'Zürich', 'Shakhtar Donetsk', 'Dynamo Kyiv', 'Zenit Saint Petersburg', 'Spartak Moscow', 'CSKA Moscow', 'Lokomotiv Moscow', 'Dynamo Moscow', 'Krasnodar', 'Trabzonspor', 'Corinthians', 'São Paulo', 'Internacional', 'Grêmio', 'Atlético Mineiro', 'Fluminense', 'Santos', 'Vasco da Gama', 'Bahia', 'Racing Club', 'Independiente', 'San Lorenzo', 'Estudiantes', 'Vélez Sarsfield', 'Rosario Central', 'Talleres', 'Inter Miami CF', 'Los Angeles FC', 'LA Galaxy', 'Seattle Sounders FC', 'Atlanta United FC', 'Columbus Crew', 'FC Cincinnati', 'Philadelphia Union', 'América', 'Guadalajara', 'Cruz Azul', 'Monterrey', 'Tigres UANL', 'Toluca', 'Pumas', 'Pumas UNAM', 'Al-Qadsiah', 'Al-Shabab', 'Al-Ettifaq', 'Urawa Red Diamonds', 'Vissel Kobe', 'Kashima Antlers', 'Yokohama F. Marinos', 'Kawasaki Frontale', 'Ulsan HD', 'Jeonbuk Hyundai Motors', 'Al-Sadd', 'Al-Duhail', 'Espérance de Tunis', 'Al Ahly', 'Zamalek', 'Wydad AC', 'Raja CA', 'Mamelodi Sundowns', 'Orlando Pirates', 'Kaizer Chiefs', 'Hamburger SV', '1. FC Köln', 'Union Berlin', 'Augsburg', 'Heidenheim', 'St. Pauli', 'FC St. Pauli', 'Holstein Kiel', 'Hannover 96', 'Hertha BSC', 'Schalke 04', 'Toulouse', 'Nantes', 'Reims', 'Lens', 'Brest', 'Auxerre', 'Angers', 'Le Havre', 'Lorient', 'Montpellier', 'Espanyol', 'Alavés', 'Levante', 'Elche', 'Real Oviedo', 'Real Valladolid', 'Las Palmas', 'Leganés', 'Cagliari', 'Verona', 'Hellas Verona', 'Lecce', 'Parma', 'Empoli', 'Venezia', 'Monza', 'Cremonese', 'Pisa', 'Watford', 'Norwich City', 'Middlesbrough', 'Coventry City', 'West Bromwich Albion', 'Stoke City', 'Swansea City', 'Birmingham City', 'Sheffield United', 'Sheffield Wednesday', 'Blackburn Rovers', 'Bristol City', 'Hull City', 'Millwall', 'Preston North End', 'Queens Park Rangers', 'Cardiff City', 'Derby County', 'Portsmouth', 'Luton Town', 'Charlotte FC', 'St. Louis City SC', 'Nashville SC', 'Orlando City SC', 'New York City FC', 'New York Red Bulls', 'Austin FC', 'Houston Dynamo FC', 'Sporting Kansas City', 'Minnesota United FC', 'Chicago Fire FC', 'Colorado Rapids', 'Portland Timbers', 'Real Salt Lake', 'San Diego FC', 'San Jose Earthquakes', 'Toronto FC', 'CF Montréal', 'Vancouver Whitecaps FC', 'D.C. United', 'New England Revolution', 'FC Dallas'],
];
const clubTier = (club) => {
  for (let t = 0; t < TIERS.length; t++) if (TIERS[t].includes(club)) return t;
  return 3;
};
const TIER_BASE = [82, 78, 73, 68];

// ---------- hand-authored overall overrides for stars ----------
const OVERRIDES = {
  // ~90+
  'Kylian Mbappé': 92, 'Erling Haaland': 91, 'Jude Bellingham': 90, 'Lamine Yamal': 91, 'Vinícius Júnior': 90,
  'Mohamed Salah': 90, 'Rodri': 90, 'Harry Kane': 90, 'Pedri': 90,
  // 86-89
  'Lionel Messi': 88, 'Bukayo Saka': 88, 'Florian Wirtz': 88, 'Jamal Musiala': 88, 'Federico Valverde': 88,
  'Achraf Hakimi': 88, 'Cole Palmer': 87, 'Phil Foden': 86, 'Declan Rice': 87, 'Virgil van Dijk': 88,
  'Alisson': 88, 'Thibaut Courtois': 89, 'Raphinha': 89, 'Lautaro Martínez': 88, 'Julián Álvarez': 88,
  'Ousmane Dembélé': 89, 'Vitinha': 88, 'João Neves': 87, 'Nuno Mendes': 87, 'Désiré Doué': 86,
  'Khvicha Kvaratskhelia': 87, 'Bruno Fernandes': 87, 'Bernardo Silva': 87, 'Rafael Leão': 86, 'Cristiano Ronaldo': 85,
  'Antoine Griezmann': 85, 'Aurélien Tchouaméni': 86, 'Eduardo Camavinga': 85, 'Michael Olise': 87, 'Rayan Cherki': 85,
  'William Saliba': 87, 'Ibrahima Konaté': 85, 'Theo Hernández': 84, 'Luka Modrić': 84, 'Joško Gvardiol': 86,
  'Mateo Kovačić': 84, 'Martin Ødegaard': 87, 'Alexander Sørloth': 84, 'Victor Osimhen': 87, 'Son Heung-min': 85,
  'Kim Min-jae': 85, 'Takefusa Kubo': 84, 'Kaoru Mitoma': 85, 'Wataru Endo': 82, 'Daichi Kamada': 82,
  'Frenkie de Jong': 87, 'Cody Gakpo': 85, 'Xavi Simons': 84, 'Memphis Depay': 83, 'Denzel Dumfries': 84,
  'Matthijs de Ligt': 84, 'Tijjani Reijnders': 86, 'Kevin De Bruyne': 86, 'Jérémy Doku': 86, 'Leandro Trossard': 83,
  'Youri Tielemans': 84, 'Amadou Onana': 83, 'Romelu Lukaku': 84, 'Nico Williams': 87, 'Unai Simón': 85,
  'Mikel Oyarzabal': 86, 'Dani Olmo': 86, 'Fabián Ruiz': 86, 'Mikel Merino': 84, 'Aymeric Laporte': 83,
  'Robin Le Normand': 84, 'Pau Cubarsí': 85, 'Dean Huijsen': 85, 'Álvaro Morata': 82, 'Ferran Torres': 84,
  'Marc Cucurella': 84, 'Dani Carvajal': 83, 'Rodrygo': 87, 'Éder Militão': 85, 'Marquinhos': 85,
  'Alexis Mac Allister': 87, 'Enzo Fernández': 86, 'Rodrigo De Paul': 85, 'Cristian Romero': 85, 'Emiliano Martínez': 87,
  'Nicolás Otamendi': 82, 'Giuliano Simeone': 84, 'Nahuel Molina': 82, 'Gianluigi Donnarumma': 89, 'Bruno Guimarães': 86,
  'Gabriel Magalhães': 86, 'Alex Sandro': 80, 'Casemiro': 83, 'Gabriel Martinelli': 84, 'Matheus Cunha': 84,
  'Estêvão': 86, 'Endrick': 82, 'Savinho': 83, 'João Pedro': 84, 'Wojciech Szczęsny': 84,
  'Sadio Mané': 84, 'Kalidou Koulibaly': 82, 'Nicolas Jackson': 83, 'Pape Matar Sarr': 84, 'Édouard Mendy': 82,
  'Ismaïla Sarr': 83, 'Iliman Ndiaye': 84, 'Hakim Ziyech': 80, 'Sofyan Amrabat': 82, 'Azzedine Ounahi': 81,
  'Brahim Díaz': 84, 'Yassine Bounou': 85, 'Nayef Aguerd': 83, 'Noussair Mazraoui': 83, 'Youssef En-Nesyri': 83,
  'Eliesse Ben Seghir': 83, 'Bilal El Khannouss': 84, 'Ayoub El Kaabi': 80, 'Riyad Mahrez': 82, 'Ismaël Bennacer': 81,
  'Houssem Aouar': 80, 'Amine Gouiri': 82, 'Mohamed Amoura': 83, 'Christian Pulisic': 85, 'Weston McKennie': 81,
  'Tyler Adams': 81, 'Antonee Robinson': 84, 'Matt Turner': 79, 'Folarin Balogun': 80, 'Timothy Weah': 80,
  'Sergiño Dest': 80, 'Gio Reyna': 79, 'Giovanni Reyna': 79, 'Alphonso Davies': 85, 'Jonathan David': 85,
  'Tajon Buchanan': 79, 'Stephen Eustáquio': 79, 'Cyle Larin': 78, 'Moise Bombito': 79, 'Hirving Lozano': 81,
  'Santiago Giménez': 82, 'Edson Álvarez': 83, 'Raúl Jiménez': 81, 'Guillermo Ochoa': 78, 'Luis Chávez': 79,
  'Johan Vásquez': 80, 'Gilberto Mora': 81, 'Harry Maguire': 80, 'John Stones': 84, 'Kyle Walker': 80,
  'Jordan Pickford': 86, 'Ollie Watkins': 83, 'Eberechi Eze': 85, 'Anthony Gordon': 83, 'Morgan Rogers': 84,
  'Adam Wharton': 83, 'Elliot Anderson': 84, 'Marc Guéhi': 85, 'Myles Lewis-Skelly': 82, 'Trent Alexander-Arnold': 86,
  'Ryan Gravenberch': 87, 'Virgil Van Dijk': 88, 'Micky van de Ven': 85, 'Brian Brobbey': 80, 'Donyell Malen': 81,
  'Jurriën Timber': 85, 'Bart Verbruggen': 84, 'Nathan Aké': 83, 'Joshua Kimmich': 87, 'Kai Havertz': 85,
  'Leroy Sané': 83, 'Serge Gnabry': 82, 'Leon Goretzka': 82, 'Antonio Rüdiger': 85, 'Jonathan Tah': 85,
  'Nico Schlotterbeck': 86, 'Marc-André ter Stegen': 86, 'Oliver Baumann': 82, 'Aleksandar Pavlović': 85, 'Angelo Stiller': 84,
  'Nick Woltemade': 85, 'Niclas Füllkrug': 81, 'Deniz Undav': 82, 'Karim Adeyemi': 83, 'Granit Xhaka': 84,
  'Manuel Akanji': 84, 'Breel Embolo': 80, 'Dan Ndoye': 82, 'Yann Sommer': 84, 'Remo Freuler': 80,
  'Nico Elvedi': 79, 'Ricardo Rodríguez': 78, 'Xherdan Shaqiri': 79, 'Sébastien Haller': 79, 'Franck Kessié': 82,
  'Simon Adingra': 80, 'Odilon Kossounou': 80, 'Evan Ndicka': 82, 'Serhou Guirassy': 85, 'Amir Rrahmani': 81,
  'Milan Škriniar': 82, 'Dušan Vlahović': 83, 'Sergej Milinković-Savić': 83, 'Aleksandar Mitrović': 82, 'Dominik Szoboszlai': 86,
  'Darwin Núñez': 82, 'Ronald Araújo': 83, 'José María Giménez': 83, 'Fede Valverde': 88, 'Manuel Ugarte': 82,
  'Rodrigo Bentancur': 83, 'Giorgian de Arrascaeta': 82, 'Luis Suárez': 78, 'Maxi Araújo': 80, 'Luis Díaz': 87,
  'James Rodríguez': 81, 'Jhon Arias': 83, 'Jhon Durán': 82, 'Richard Ríos': 82, 'Daniel Muñoz': 82,
  'Davinson Sánchez': 82, 'Jefferson Lerma': 80, 'Camilo Vargas': 80, 'Luis Sinisterra': 78, 'Jhon Córdoba': 79,
  'Enner Valencia': 78, 'Moisés Caicedo': 88, 'Piero Hincapié': 84, 'Pervis Estupiñán': 81, 'Willian Pacho': 85,
  'Kendry Páez': 81, 'Gonzalo Plata': 80, 'Hernán Galíndez': 76, 'Miguel Almirón': 79, 'Julio Enciso': 81,
  'Gustavo Gómez': 80, 'Omar Alderete': 79, 'Andrés Cubas': 77, 'Antonio Sanabria': 77, 'Salem Al-Dawsari': 80,
  'Mohammed Kanno': 76, 'Salman Al-Faraj': 74, 'Saud Abdulhamid': 75, 'Firas Al-Buraikan': 76, 'Mehdi Taremi': 81,
  'Sardar Azmoun': 78, 'Alireza Jahanbakhsh': 76, 'Saman Ghoddos': 74, 'Alireza Beiranvand': 76, 'Mohammad Mohebi': 75,
  'Akram Afif': 80, 'Almoez Ali': 77, 'Hassan Al-Haydos': 73, 'Chris Wood': 80, 'Liberato Cacace': 76,
  'Matthew Garbett': 73, 'Tom Saintfiet': 70, 'Mathew Ryan': 77, 'Jackson Irvine': 76, 'Harry Souttar': 76,
  'Craig Goodwin': 75, 'Riley McGree': 76, 'Nestory Irankunda': 75, 'Hakan Çalhanoğlu': 85, 'Arda Güler': 87,
  'Kenan Yıldız': 86, 'Barış Alper Yılmaz': 81, 'Orkun Kökçü': 82, 'Merih Demiral': 80, 'Ferdi Kadıoğlu': 81,
  'Kerem Aktürkoğlu': 81, 'Uğurcan Çakır': 81, 'İlkay Gündoğan': 82, 'Zeki Çelik': 79, 'Mert Günok': 78,
  'Vincenzo Montella': 70, 'Patrik Schick': 84, 'Tomáš Souček': 81, 'Ladislav Krejčí': 80, 'Adam Hložek': 79,
  'Pavel Šulc': 80, 'Mojmír Chytil': 77, 'Lukáš Provod': 77, 'Matěj Kovář': 78, 'Antonín Kinský': 79,
  'Scott McTominay': 85, 'John McGinn': 80, 'Andy Robertson': 82, 'Kieran Tierney': 78, 'Billy Gilmour': 80,
  'Aaron Hickey': 76, 'Scott McKenna': 75, 'Angus Gunn': 75, 'Craig Gordon': 74, 'Ché Adams': 77,
  'Lyndon Dykes': 74, 'Lawrence Shankland': 75, 'Ben Doak': 78, 'Mohammed Salisu': 78, 'Thomas Partey': 80,
  'Mohammed Kudus': 84, 'Iñaki Williams': 81, 'Jordan Ayew': 77, 'Antoine Semenyo': 85, 'Alexander Djiku': 76,
  'Tariq Lamptey': 76, 'Ernest Nuamah': 78, 'Abdul Fatawu Issahaku': 78, 'Kamaldeen Sulemana': 77, 'Omar Marmoush': 85,
  'Mohamed Elneny': 75, 'Trézéguet': 76, 'Mostafa Mohamed': 76, 'Mohamed Abdelmonem': 77, 'Ahmed Sayed Zizo': 77,
  'Ibrahim Adel': 77, 'Mohamed El Shenawy': 76, 'Marwan Attia': 75, 'Edmond Tapsoba': 82, 'Vincent Aboubakar': 78,
  'André-Frank Zambo Anguissa': 83, 'Carlos Baleba': 84, 'Bryan Mbeumo': 86, 'André Onana': 81, 'Nicolas Moumi Ngamaleu': 74,
  'Yoane Wissa': 82, 'Cédric Bakambu': 77, 'Chancel Mbemba': 78, 'Axel Tuanzebe': 75, 'Aaron Wan-Bissaka': 79,
  'Théo Bongonda': 76, 'Simon Banza': 77, 'Fiston Mayele': 77, 'Noah Sadiki': 79, 'Ngal\u2019ayel Mukau': 77,
  'Khalid Aït Ouarkhane': 73, 'Eldor Shomurodov': 78, 'Abbosbek Fayzullaev': 79, 'Abdukodir Khusanov': 83, 'Otabek Shukurov': 74,
  'Jaloliddin Masharipov': 74, 'Igor Sergeev': 73, 'Aziz Behich': 74, 'Mat Leckie': 73, 'Ali Jasim': 75,
  'Aymen Hussein': 76, 'Youssef Amyn': 74, 'Zidane Iqbal': 74, 'Jude Soonsup-Bell': 73, 'Ali Al-Hamadi': 74,
  'Mousa Tamari': 77, 'Yazan Al-Naimat': 75, 'Ali Olwan': 75, 'Nizar Al-Rashdan': 73, 'Ehsan Haddad': 72,
  'Andre Blake': 78, 'Adalberto Carrasquilla': 78, 'José Fajardo': 75, 'Michael Amir Murillo': 77, 'Edgar Yoel Bárcenas': 74,
  'Ismael Díaz': 75, 'Cecilio Waterman': 74, 'Aníbal Godoy': 73, 'Eric Pulgar': 76, 'Luquinhas': 74,
  'Leandro Bacuna': 74, 'Juninho Bacuna': 76, 'Eloy Room': 74, 'Tahith Chong': 75, 'Kenji Gorré': 73,
  'Jürgen Locadia': 74, 'Vurnon Anita': 71, 'Cuco Martina': 71, 'Gervane Kastaneer': 73, 'Jeremy Antonisse': 73,
  'Ryan Mendes': 75, 'Jamiro Monteiro': 75, 'Bebé': 74, 'Garry Rodrigues': 74, 'Logan Costa': 78,
  'Bryan Teixeira': 75, 'Telmo Arcanjo': 74, 'Dailon Livramento': 74, 'Willy Semedo': 73, 'Duckens Nazon': 74,
  'Frantzdy Pierrot': 75, 'Danley Jean Jacques': 76, 'Derrick Etienne': 73, 'Johnny Placide': 72, 'Don Deedson Louicius': 74,
  'Carlens Arcus': 72, 'Ruben Providence': 73, 'Hannes Delcroix': 75, 'Josué Casimir': 74, 'Jean-Kévin Duverne': 73,
  'Mohanad Ali': 75, 'Ibrahim Bayesh': 74, 'Amir Al-Ammari': 73, 'Jlloyd Samuel': 70, 'Rebin Sulaka': 71,
  'Alexis Sánchez': 76, 'Keylor Navas': 79, 'Kaito Nakamura': 77, 'Takehiro Tomiyasu': 80, 'Hidemasa Morita': 80,
  'Ko Itakura': 80, 'Ritsu Doan': 83, 'Junya Ito': 80, 'Ayase Ueda': 81, 'Zion Suzuki': 81,
  'Hiroki Ito': 80, 'Takumi Minamino': 80, 'Yukinari Sugawara': 77, 'Keito Nakamura': 79, 'Joel Chima Fujita': 76,
  'Alexander Isak': 89, 'Viktor Gyökeres': 87, 'Dejan Kulusevski': 84, 'Anthony Elanga': 82, 'Lucas Bergvall': 83,
  'Yasin Ayari': 80, 'Hugo Larsson': 81, 'Victor Lindelöf': 77, 'Robin Olsen': 76, 'Emil Krafth': 74,
  'Ludwig Augustinsson': 74, 'Jesper Karlström': 74, 'Ken Sema': 74, 'Jordan Larsson': 75, 'Benjamin Šeško': 84,
  'Martin Erlić': 77, 'Petar Sučić': 80, 'Luka Sučić': 79, 'Mario Pašalić': 80, 'Lovro Majer': 79,
  'Andrej Kramarić': 81, 'Ante Budimir': 79, 'Ivan Perišić': 79, 'Marcelo Brozović': 80, 'Dominik Livaković': 82,
  'Josip Stanišić': 81, 'Marin Pongračić': 79, 'Duje Ćaleta-Car': 77, 'Borna Sosa': 77, 'Kristijan Jakić': 76,
  'Nikola Vlašić': 78, 'Franjo Ivanović': 80, 'Roony Bardghji': 79, 'Tolu Arokodare': 78, 'Maxim De Cuyper': 79,
  'Zeno Debast': 79, 'Wout Faes': 78, 'Arthur Theate': 79, 'Koen Casteels': 79, 'Matz Sels': 82,
  'Charles De Ketelaere': 84, 'Loïs Openda': 83, 'Malick Fofana': 81, 'Nicolas Raskin': 80, 'Arthur Vermeeren': 80,
  'Aster Vranckx': 77, 'Timothy Castagne': 78, 'Thomas Meunier': 76, 'Axel Witsel': 75, 'Orel Mangala': 77,
  'Dodi Lukebakio': 80, 'Kasper Dolberg': 80, 'Christian Eriksen': 78, 'Pierre-Emile Højbjerg': 81, 'Rasmus Højlund': 82,
  'Joachim Andersen': 80, 'Andreas Christensen': 80, 'Kasper Schmeichel': 78, 'Morten Hjulmand': 81, 'Patrick Dorgu': 79,
  'Tijani Reijnders': 86, 'Jeremie Frimpong': 84, 'Ronald Koeman': 70, 'Quinten Timber': 80, 'Justin Kluivert': 80,
  'Wout Weghorst': 78, 'Noa Lang': 80, 'Mexx Meerdink': 77, 'Sem Steijn': 79, 'Jorrel Hato': 83,
  'Stefan de Vrij': 79, 'Lutsharel Geertruida': 78, 'Mark Flekken': 79, 'Sven Botman': 81, 'Jan Paul van Hecke': 80,
  'Ousmane Diomande': 80, 'Guéla Doué': 78, 'Wilfried Singo': 79, 'Ibrahim Sangaré': 78, 'Seko Fofana': 77,
  'Nicolas Pépé': 78, 'Jérémie Boga': 77, 'Jonathan Bamba': 75, 'Yahia Fofana': 77, 'Emmanuel Agbadou': 78,
  'Oumar Diakité': 77, 'Karim Konaté': 78, 'Vakoun Bayo': 75, 'Christian Kouamé': 75, 'Maghnes Akliouche': 83,
  'Rayan Aït-Nouri': 83, 'Lucas Hernández': 80, 'Dayot Upamecano': 85, 'Jules Koundé': 86, 'Manu Koné': 84,
  'N\u2019Golo Kanté': 79, 'Adrien Rabiot': 82, 'Mike Maignan': 86, 'Brice Samba': 79, 'Marcus Thuram': 85,
  'Randal Kolo Muani': 81, 'Bradley Barcola': 84, 'Christopher Nkunku': 82, 'Kingsley Coman': 81, 'Hugo Ekitiké': 85,
  'Khéphren Thuram': 82, 'Warren Zaïre-Emery': 82, 'Loïc Badé': 80, 'Malo Gusto': 80, 'Théo Hernandez': 84,
  'Benjamin Pavard': 81, 'Clément Lenglet': 78, 'Mattéo Guendouzi': 79, 'Youssouf Fofana': 81, 'Moussa Niakhaté': 78,
  'Kalidou Koulibaly ': 82, 'Boulaye Dia': 79, 'Habib Diarra': 81, 'Lamine Camara': 81, 'Idrissa Gueye': 78,
  'Abdou Diallo': 77, 'Mory Diaw': 75, 'Cheikhou Kouyaté': 74, 'Krépin Diatta': 78, 'El Hadji Malick Diouf': 80,
  'Assane Diao': 80, 'Nicolas Tagliafico': 80, 'Leandro Paredes': 81, 'Giovani Lo Celso': 80, 'Exequiel Palacios': 82,
  'Nicolás González': 81, 'Valentín Carboni': 78, 'Franco Mastantuono': 84, 'Claudio Echeverri': 81, 'Nico Paz': 86,
  'Thiago Almada': 83, 'Walter Benítez': 79, 'Gerónimo Rulli': 80, 'Leonardo Balerdi': 80, 'Gonzalo Montiel': 79,
  'Marcos Acuña': 78, 'Ángel Correa': 79, 'Valentín Barco': 78, 'Kevin Mac Allister': 77, 'Facundo Medina': 79,
  'Konrad Laimer': 80, 'Marcel Sabitzer': 80, 'Christoph Baumgartner': 81, 'Xaver Schlager': 80, 'Nicolas Seiwald': 80,
  'Romano Schmid': 79, 'Marko Arnautović': 77, 'Michael Gregoritsch': 76, 'Patrick Wimmer': 78, 'Stefan Posch': 77,
  'Philipp Lienhart': 78, 'Kevin Danso': 80, 'David Alaba': 79, 'Alexander Prass': 78, 'Daniel Bachmann': 75,
  'Alexander Schlager': 77, 'Marco Friedl': 77, 'Mohamed Aboutrika': 70, 'Houssem Mrezigue': 75, 'Hannibal Mejbri': 77,
  'Aïssa Laïdouni': 76, 'Elias Achouri': 76, 'Yan Valery': 74, 'Montassar Talbi': 76, 'Dylan Bronn': 74,
  'Yassine Meriah': 74, 'Aymen Dahmen': 74, 'Hazem Mastouri': 73, 'Firas Chaouat': 73, 'Seifeddine Jaziri': 73,
  'Anis Ben Slimane': 75, 'Ellyes Skhiri': 77, 'Ferjani Sassi': 73, 'Naïm Sliti': 74, 'Wahbi Khazri': 73,
  'Taha Yassine Khenissi': 71, 'Oliver Antman': 76, 'Kerfalla Cissoko': 73,
};

// Some surname-only display names used on shirts
const SHIRT_NAMES = {
  'Vinícius Júnior': 'VINI JR.', 'Cristiano Ronaldo': 'RONALDO', 'Lionel Messi': 'MESSI',
};

const lines = src.split('\n');
let group = null, team = null;
const teams = [];
const posMap = { GK: 'GK', DF: 'DF', MF: 'MF', FW: 'FW' };

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const g = line.match(/^## Group ([A-L])\b/);
  if (g) { group = g[1]; continue; }
  if (/^## /.test(line)) { group = null; continue; }
  const t = line.match(/^### (.+)$/);
  if (t && group) {
    team = { name: t[1].trim(), group, players: [] };
    teams.push(team);
    continue;
  }
  if (!team || !group) continue;
  const row = line.match(/^\| (\d+) \| \d (GK|DF|MF|FW) \| (.+?) \| \((\d{4})-(\d{2})-(\d{2})\).*? \| (\d+) \| (\d+) \| (.+?) \|\s*$/);
  if (row) {
    let name = row[3].replace(/\[.*?\]/g, '').trim();
    const captain = /\(captain\)/i.test(name);
    name = name.replace(/\(captain\)/i, '').trim();
    team.players.push({
      no: +row[1], pos: posMap[row[2]], name, captain,
      birth: `${row[4]}-${row[5]}-${row[6]}`,
      caps: +row[7], goals: +row[8], club: row[9].trim(),
    });
  }
}

// ---------- rating generation ----------
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)));

const AGE_REF = new Date('2026-06-11');
function age(birth) { return (AGE_REF - new Date(birth)) / 3.15576e10; }

for (const t of teams) {
  for (const p of t.players) {
    const rnd = mulberry(hash(t.name + p.name));
    const a = age(p.birth);
    let overall = OVERRIDES[p.name];
    if (overall == null) {
      let base = TIER_BASE[clubTier(p.club)];
      // experience signal
      base += Math.min(6, Math.sqrt(p.caps) * 0.55);
      if (p.pos === 'FW' && p.caps >= 10) base += Math.min(4, (p.goals / p.caps) * 9);
      if (p.pos === 'MF' && p.caps >= 10) base += Math.min(2, (p.goals / p.caps) * 8);
      // age curve: peak 24-30
      if (a < 21) base -= (21 - a) * 0.8;
      else if (a > 32) base -= (a - 32) * 1.1;
      base += (rnd() - 0.5) * 3;
      overall = clamp(base, 62, 86);
    }
    const o = overall;
    const v = (spread) => (rnd() - 0.5) * 2 * spread;
    const yng = a < 24 ? 3 : a > 31 ? -4 : 0; // pace adjustment
    let attrs;
    if (p.pos === 'GK') {
      attrs = {
        pace: clamp(o - 25 + v(4), 30, 70), shooting: clamp(o - 40 + v(5), 15, 45),
        passing: clamp(o - 18 + v(5), 35, 80), dribbling: clamp(o - 25 + v(4), 30, 70),
        defending: clamp(o - 30 + v(5), 20, 60), physical: clamp(o - 8 + v(4), 50, 90),
        diving: clamp(o + 1 + v(3), 50, 95), handling: clamp(o + v(3), 50, 95), reflexes: clamp(o + 2 + v(3), 50, 95),
      };
    } else if (p.pos === 'DF') {
      attrs = {
        pace: clamp(o - 4 + yng + v(6), 40, 92), shooting: clamp(o - 22 + v(6), 25, 72),
        passing: clamp(o - 8 + v(5), 40, 88), dribbling: clamp(o - 10 + v(5), 40, 86),
        defending: clamp(o + 3 + v(3), 50, 94), physical: clamp(o + 1 + v(4), 50, 94),
      };
    } else if (p.pos === 'MF') {
      attrs = {
        pace: clamp(o - 6 + yng + v(6), 42, 92), shooting: clamp(o - 9 + v(6), 35, 88),
        passing: clamp(o + 2 + v(3), 50, 95), dribbling: clamp(o + v(4), 48, 94),
        defending: clamp(o - 12 + v(8), 30, 88), physical: clamp(o - 5 + v(5), 42, 90),
      };
    } else {
      attrs = {
        pace: clamp(o + 2 + yng + v(5), 50, 97), shooting: clamp(o + 2 + v(3), 50, 95),
        passing: clamp(o - 9 + v(5), 42, 88), dribbling: clamp(o + 1 + v(4), 50, 95),
        defending: clamp(o - 35 + v(8), 20, 60), physical: clamp(o - 6 + v(6), 42, 92),
      };
    }
    p.overall = o;
    p.attrs = attrs;
    p.shirtName = SHIRT_NAMES[p.name] ?? shirtName(p.name);
    // appearance variety, seeded
    p.look = {
      skin: Math.floor(rnd() * 6),               // 0..5 skin tone index
      hair: Math.floor(rnd() * 5),               // hair style index
      hairColor: Math.floor(rnd() * 4),
      height: +(1.68 + rnd() * 0.27).toFixed(2), // 1.68 - 1.95 m
    };
    if (p.pos === 'GK') p.look.height = +(1.85 + rnd() * 0.12).toFixed(2);
  }
}

function shirtName(full) {
  const parts = full.split(' ');
  const last = parts[parts.length - 1];
  return last.toUpperCase();
}

const out = { generated: new Date().toISOString().slice(0, 10), source: 'Wikipedia: 2026 FIFA World Cup squads', teams };
writeFileSync(join(here, '../src/data/squads.json'), JSON.stringify(out));
console.log(`Wrote ${teams.length} teams, ${teams.reduce((s, t) => s + t.players.length, 0)} players`);
for (const t of teams) if (t.players.length < 23 || t.players.length > 26) console.warn(`WARN ${t.name}: ${t.players.length} players`);
