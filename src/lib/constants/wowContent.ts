import { EXPANSIONS } from './index'

export type DungeonDifficulty = 'Normal' | 'Heroica' | 'Mítica' | 'Mítica+'
export type RaidDifficulty = 'Normal' | 'Heroica' | 'Mítica'

export interface DungeonEntry {
  nombre: string
  expansion: string
  dificultades: DungeonDifficulty[]
}

export interface RaidEntry {
  nombre: string
  expansion: string
  dificultades: RaidDifficulty[]
}

export interface WorldBossEntry {
  nombre: string
  expansion: string
}

export type TipoContenido = 'descripcion' | 'mazmorra' | 'raid' | 'worldboss' | 'profesion'

const expNombre = (id: string): string =>
  EXPANSIONS.find(e => e.id === id)?.nombre ?? id

// Conjuntos de dificultad reutilizables
const D_CLASSIC: DungeonDifficulty[] = ['Normal']
const D_TBC_WOTLK_CATA_MOP: DungeonDifficulty[] = ['Normal', 'Heroica']
const D_WOD: DungeonDifficulty[] = ['Normal', 'Heroica', 'Mítica']
const D_MAS: DungeonDifficulty[] = ['Normal', 'Heroica', 'Mítica', 'Mítica+']

const R_CLASSIC: RaidDifficulty[] = ['Normal']
const R_TBC_MOP: RaidDifficulty[] = ['Normal', 'Heroica']
const R_WOD_PLUS: RaidDifficulty[] = ['Normal', 'Heroica', 'Mítica']

export const DUNGEONS: DungeonEntry[] = [
  // Classic (Vanilla)
  { nombre: 'Ragefire Chasm', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Wailing Caverns', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Deadmines', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Shadowfang Keep', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Blackfathom Deeps', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Stormwind Stockade', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Gnomeregan', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Razorfen Kraul', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Scarlet Monastery: Graveyard', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Scarlet Monastery: Library', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Scarlet Monastery: Armory', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Scarlet Monastery: Cathedral', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Razorfen Downs', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Uldaman', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Zul\'Farrak', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Maraudon', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Sunken Temple', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Blackrock Depths', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Lower Blackrock Spire', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Upper Blackrock Spire', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Dire Maul East/West/North', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Scholomance', expansion: 'classic', dificultades: D_CLASSIC },
  { nombre: 'Stratholme', expansion: 'classic', dificultades: D_CLASSIC },
  // The Burning Crusade
  { nombre: 'Hellfire Ramparts', expansion: 'outland', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Blood Furnace', expansion: 'outland', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Shattered Halls', expansion: 'outland', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Slave Pens', expansion: 'outland', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Underbog', expansion: 'outland', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Steamvault', expansion: 'outland', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Mana-Tombs', expansion: 'outland', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Auchenai Crypts', expansion: 'outland', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Sethekk Halls', expansion: 'outland', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Shadow Labyrinth', expansion: 'outland', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Old Hillsbrad', expansion: 'outland', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Black Morass', expansion: 'outland', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Mechanar', expansion: 'outland', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Botanica', expansion: 'outland', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Arcatraz', expansion: 'outland', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Magisters\' Terrace', expansion: 'outland', dificultades: D_TBC_WOTLK_CATA_MOP },
  // Wrath of the Lich King
  { nombre: 'Utgarde Keep', expansion: 'wotlk', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Utgarde Pinnacle', expansion: 'wotlk', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Nexus', expansion: 'wotlk', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Oculus', expansion: 'wotlk', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Azjol-Nerub', expansion: 'wotlk', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Ahn\'kahet', expansion: 'wotlk', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Drak\'Tharon Keep', expansion: 'wotlk', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Violet Hold', expansion: 'wotlk', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Gundrak', expansion: 'wotlk', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Halls of Stone', expansion: 'wotlk', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Halls of Lightning', expansion: 'wotlk', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Culling of Stratholme', expansion: 'wotlk', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Trial of the Champion', expansion: 'wotlk', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Forge of Souls', expansion: 'wotlk', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Pit of Saron', expansion: 'wotlk', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Halls of Reflection', expansion: 'wotlk', dificultades: D_TBC_WOTLK_CATA_MOP },
  // Cataclysm
  { nombre: 'Blackrock Caverns', expansion: 'cata', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Throne of the Tides', expansion: 'cata', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Stonecore', expansion: 'cata', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Vortex Pinnacle', expansion: 'cata', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Lost City of the Tol\'vir', expansion: 'cata', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Grim Batol', expansion: 'cata', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Halls of Origination', expansion: 'cata', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'End Time', expansion: 'cata', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Well of Eternity', expansion: 'cata', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Hour of Twilight', expansion: 'cata', dificultades: D_TBC_WOTLK_CATA_MOP },
  // Mists of Pandaria
  { nombre: 'Temple of the Jade Serpent', expansion: 'mop', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Stormstout Brewery', expansion: 'mop', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Shado-Pan Monastery', expansion: 'mop', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Gate of the Setting Sun', expansion: 'mop', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Mogu\'shan Palace', expansion: 'mop', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Siege of Niuzao Temple', expansion: 'mop', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Scarlet Halls', expansion: 'mop', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Scarlet Monastery', expansion: 'mop', dificultades: D_TBC_WOTLK_CATA_MOP },
  { nombre: 'Scholomance', expansion: 'mop', dificultades: D_TBC_WOTLK_CATA_MOP },
  // Warlords of Draenor
  { nombre: 'Bloodmaul Slag Mines', expansion: 'draenor', dificultades: D_WOD },
  { nombre: 'Iron Docks', expansion: 'draenor', dificultades: D_WOD },
  { nombre: 'Auchindoun', expansion: 'draenor', dificultades: D_WOD },
  { nombre: 'Skyreach', expansion: 'draenor', dificultades: D_WOD },
  { nombre: 'Grimrail Depot', expansion: 'draenor', dificultades: D_WOD },
  { nombre: 'Shadowmoon Burial Grounds', expansion: 'draenor', dificultades: D_WOD },
  { nombre: 'Everbloom', expansion: 'draenor', dificultades: D_WOD },
  { nombre: 'Upper Blackrock Spire', expansion: 'draenor', dificultades: D_WOD },
  // Legion
  { nombre: 'Eye of Azshara', expansion: 'legion', dificultades: D_MAS },
  { nombre: 'Darkheart Thicket', expansion: 'legion', dificultades: D_MAS },
  { nombre: 'Neltharion\'s Lair', expansion: 'legion', dificultades: D_MAS },
  { nombre: 'Halls of Valor', expansion: 'legion', dificultades: D_MAS },
  { nombre: 'Vault of the Wardens', expansion: 'legion', dificultades: D_MAS },
  { nombre: 'Black Rook Hold', expansion: 'legion', dificultades: D_MAS },
  { nombre: 'Maw of Souls', expansion: 'legion', dificultades: D_MAS },
  { nombre: 'Court of Stars', expansion: 'legion', dificultades: D_MAS },
  { nombre: 'Arcway', expansion: 'legion', dificultades: D_MAS },
  { nombre: 'Cathedral of Eternal Night', expansion: 'legion', dificultades: D_MAS },
  { nombre: 'Seat of the Triumvirate', expansion: 'legion', dificultades: D_MAS },
  // Battle for Azeroth
  { nombre: 'Atal\'Dazar', expansion: 'bfa', dificultades: D_MAS },
  { nombre: 'Freehold', expansion: 'bfa', dificultades: D_MAS },
  { nombre: 'Waycrest Manor', expansion: 'bfa', dificultades: D_MAS },
  { nombre: 'Shrine of the Storm', expansion: 'bfa', dificultades: D_MAS },
  { nombre: 'Tol Dagor', expansion: 'bfa', dificultades: D_MAS },
  { nombre: 'Temple of Sethraliss', expansion: 'bfa', dificultades: D_MAS },
  { nombre: 'The Underrot', expansion: 'bfa', dificultades: D_MAS },
  { nombre: 'King\'s Rest', expansion: 'bfa', dificultades: D_MAS },
  { nombre: 'Siege of Boralus', expansion: 'bfa', dificultades: D_MAS },
  { nombre: 'Operation: Mechagon', expansion: 'bfa', dificultades: D_MAS },
  // Shadowlands
  { nombre: 'Necrotic Wake', expansion: 'shadowlands', dificultades: D_MAS },
  { nombre: 'Plaguefall', expansion: 'shadowlands', dificultades: D_MAS },
  { nombre: 'Mists of Tirna Scithe', expansion: 'shadowlands', dificultades: D_MAS },
  { nombre: 'Halls of Atonement', expansion: 'shadowlands', dificultades: D_MAS },
  { nombre: 'Theater of Pain', expansion: 'shadowlands', dificultades: D_MAS },
  { nombre: 'De Other Side', expansion: 'shadowlands', dificultades: D_MAS },
  { nombre: 'Spires of Ascension', expansion: 'shadowlands', dificultades: D_MAS },
  { nombre: 'Sanguine Depths', expansion: 'shadowlands', dificultades: D_MAS },
  { nombre: 'Tazavesh', expansion: 'shadowlands', dificultades: D_MAS },
  // Dragonflight
  { nombre: 'Ruby Life Pools', expansion: 'dragonflight', dificultades: D_MAS },
  { nombre: 'Nokhud Offensive', expansion: 'dragonflight', dificultades: D_MAS },
  { nombre: 'Azure Vault', expansion: 'dragonflight', dificultades: D_MAS },
  { nombre: 'Algeth\'ar Academy', expansion: 'dragonflight', dificultades: D_MAS },
  { nombre: 'Brackenhide Hollow', expansion: 'dragonflight', dificultades: D_MAS },
  { nombre: 'Halls of Infusion', expansion: 'dragonflight', dificultades: D_MAS },
  { nombre: 'Neltharus', expansion: 'dragonflight', dificultades: D_MAS },
  { nombre: 'Uldaman: Legacy of Tyr', expansion: 'dragonflight', dificultades: D_MAS },
  { nombre: 'Dawn of the Infinite', expansion: 'dragonflight', dificultades: D_MAS },
  // The War Within
  { nombre: 'The Rookery', expansion: 'tww', dificultades: D_MAS },
  { nombre: 'The Stonevault', expansion: 'tww', dificultades: D_MAS },
  { nombre: 'Priory of the Sacred Flame', expansion: 'tww', dificultades: D_MAS },
  { nombre: 'Ara-Kara, City of Echoes', expansion: 'tww', dificultades: D_MAS },
  { nombre: 'Cinderbrew Meadery', expansion: 'tww', dificultades: D_MAS },
  { nombre: 'Darkflame Cleft', expansion: 'tww', dificultades: D_MAS },
  { nombre: 'The Dawnbreaker', expansion: 'tww', dificultades: D_MAS },
  { nombre: 'City of Threads', expansion: 'tww', dificultades: D_MAS },
  { nombre: 'Operation: Floodgate', expansion: 'tww', dificultades: D_MAS },
  { nombre: 'Eco-Dome Al\'dani', expansion: 'tww', dificultades: D_MAS },
  // Midnight: nombres no anunciados
]

export const RAIDS: RaidEntry[] = [
  // Classic
  { nombre: 'Molten Core', expansion: 'classic', dificultades: R_CLASSIC },
  { nombre: 'Onyxia\'s Lair', expansion: 'classic', dificultades: R_CLASSIC },
  { nombre: 'Blackwing Lair', expansion: 'classic', dificultades: R_CLASSIC },
  { nombre: 'Ruins of Ahn\'Qiraj (AQ20)', expansion: 'classic', dificultades: R_CLASSIC },
  { nombre: 'Ahn\'Qiraj (AQ40)', expansion: 'classic', dificultades: R_CLASSIC },
  { nombre: 'Naxxramas', expansion: 'classic', dificultades: R_CLASSIC },
  // Burning Crusade
  { nombre: 'Karazhan', expansion: 'outland', dificultades: R_TBC_MOP },
  { nombre: 'Gruul\'s Lair', expansion: 'outland', dificultades: R_TBC_MOP },
  { nombre: 'Magtheridon', expansion: 'outland', dificultades: R_TBC_MOP },
  { nombre: 'Serpentshrine Cavern', expansion: 'outland', dificultades: R_TBC_MOP },
  { nombre: 'Tempest Keep', expansion: 'outland', dificultades: R_TBC_MOP },
  { nombre: 'Black Temple', expansion: 'outland', dificultades: R_TBC_MOP },
  { nombre: 'Mount Hyjal', expansion: 'outland', dificultades: R_TBC_MOP },
  { nombre: 'Sunwell Plateau', expansion: 'outland', dificultades: R_TBC_MOP },
  // Wrath
  { nombre: 'Naxxramas', expansion: 'wotlk', dificultades: R_TBC_MOP },
  { nombre: 'Obsidian Sanctum', expansion: 'wotlk', dificultades: R_TBC_MOP },
  { nombre: 'Eye of Eternity', expansion: 'wotlk', dificultades: R_TBC_MOP },
  { nombre: 'Ulduar', expansion: 'wotlk', dificultades: R_TBC_MOP },
  { nombre: 'Trial of the Crusader', expansion: 'wotlk', dificultades: R_TBC_MOP },
  { nombre: 'Icecrown Citadel', expansion: 'wotlk', dificultades: R_TBC_MOP },
  { nombre: 'Ruby Sanctum', expansion: 'wotlk', dificultades: R_TBC_MOP },
  // Cataclysm
  { nombre: 'Blackwing Descent', expansion: 'cata', dificultades: R_TBC_MOP },
  { nombre: 'Bastion of Twilight', expansion: 'cata', dificultades: R_TBC_MOP },
  { nombre: 'Throne of the Four Winds', expansion: 'cata', dificultades: R_TBC_MOP },
  { nombre: 'Firelands', expansion: 'cata', dificultades: R_TBC_MOP },
  { nombre: 'Dragon Soul', expansion: 'cata', dificultades: R_TBC_MOP },
  // Mists
  { nombre: 'Mogu\'shan Vaults', expansion: 'mop', dificultades: R_TBC_MOP },
  { nombre: 'Heart of Fear', expansion: 'mop', dificultades: R_TBC_MOP },
  { nombre: 'Terrace of Endless Spring', expansion: 'mop', dificultades: R_TBC_MOP },
  { nombre: 'Throne of Thunder', expansion: 'mop', dificultades: R_TBC_MOP },
  { nombre: 'Siege of Orgrimmar', expansion: 'mop', dificultades: R_TBC_MOP },
  // Warlords
  { nombre: 'Highmaul', expansion: 'draenor', dificultades: R_WOD_PLUS },
  { nombre: 'Blackrock Foundry', expansion: 'draenor', dificultades: R_WOD_PLUS },
  { nombre: 'Hellfire Citadel', expansion: 'draenor', dificultades: R_WOD_PLUS },
  // Legion
  { nombre: 'Emerald Nightmare', expansion: 'legion', dificultades: R_WOD_PLUS },
  { nombre: 'Trial of Valor', expansion: 'legion', dificultades: R_WOD_PLUS },
  { nombre: 'Nighthold', expansion: 'legion', dificultades: R_WOD_PLUS },
  { nombre: 'Tomb of Sargeras', expansion: 'legion', dificultades: R_WOD_PLUS },
  { nombre: 'Antorus', expansion: 'legion', dificultades: R_WOD_PLUS },
  // Battle for Azeroth
  { nombre: 'Uldir', expansion: 'bfa', dificultades: R_WOD_PLUS },
  { nombre: 'Battle of Dazar\'alor', expansion: 'bfa', dificultades: R_WOD_PLUS },
  { nombre: 'Crucible of Storms', expansion: 'bfa', dificultades: R_WOD_PLUS },
  { nombre: 'Eternal Palace', expansion: 'bfa', dificultades: R_WOD_PLUS },
  { nombre: 'Ny\'alotha', expansion: 'bfa', dificultades: R_WOD_PLUS },
  // Shadowlands
  { nombre: 'Castle Nathria', expansion: 'shadowlands', dificultades: R_WOD_PLUS },
  { nombre: 'Sanctum of Domination', expansion: 'shadowlands', dificultades: R_WOD_PLUS },
  { nombre: 'Sepulcher of the First Ones', expansion: 'shadowlands', dificultades: R_WOD_PLUS },
  // Dragonflight
  { nombre: 'Vault of the Incarnates', expansion: 'dragonflight', dificultades: R_WOD_PLUS },
  { nombre: 'Aberrus', expansion: 'dragonflight', dificultades: R_WOD_PLUS },
  { nombre: 'Amirdrassil', expansion: 'dragonflight', dificultades: R_WOD_PLUS },
  // The War Within
  { nombre: 'Nerub-ar Palace', expansion: 'tww', dificultades: R_WOD_PLUS },
  { nombre: 'Liberation of Undermine', expansion: 'tww', dificultades: R_WOD_PLUS },
  { nombre: 'Manaforge Omega', expansion: 'tww', dificultades: R_WOD_PLUS },
  // Midnight
  { nombre: 'The Voidspire', expansion: 'midnight', dificultades: R_WOD_PLUS },
  { nombre: 'March on Quel\'Danas', expansion: 'midnight', dificultades: R_WOD_PLUS },
  { nombre: 'Dreamrift', expansion: 'midnight', dificultades: R_WOD_PLUS },
]

export const WORLDBOSSES: WorldBossEntry[] = [
  // Classic
  { nombre: 'Azuregos', expansion: 'classic' },
  { nombre: 'Lord Kazzak', expansion: 'classic' },
  { nombre: 'Dragons of Nightmare', expansion: 'classic' },
  // TBC
  { nombre: 'Doom Lord Kazzak', expansion: 'outland' },
  { nombre: 'Doomwalker', expansion: 'outland' },
  // Wrath
  { nombre: 'Archavon', expansion: 'wotlk' },
  { nombre: 'Emalon', expansion: 'wotlk' },
  { nombre: 'Koralon', expansion: 'wotlk' },
  { nombre: 'Toravon', expansion: 'wotlk' },
  // Cataclysm
  { nombre: 'Akma\'hat', expansion: 'cata' },
  { nombre: 'Garr', expansion: 'cata' },
  { nombre: 'Julak-Doom', expansion: 'cata' },
  { nombre: 'Mobus', expansion: 'cata' },
  { nombre: 'Xariona', expansion: 'cata' },
  { nombre: 'Vuk\'laz', expansion: 'cata' },
  // MoP
  { nombre: 'Sha of Anger', expansion: 'mop' },
  { nombre: 'Galleon', expansion: 'mop' },
  { nombre: 'Nalak', expansion: 'mop' },
  { nombre: 'Oondasta', expansion: 'mop' },
  { nombre: 'Ordos', expansion: 'mop' },
  // WoD
  { nombre: 'Rukhmar', expansion: 'draenor' },
  { nombre: 'Drov the Ruiner', expansion: 'draenor' },
  { nombre: 'Tarlna', expansion: 'draenor' },
  { nombre: 'Supreme Lord Kazzak', expansion: 'draenor' },
  // Legion
  { nombre: 'Nithogg', expansion: 'legion' },
  { nombre: 'Ana-Mouz', expansion: 'legion' },
  { nombre: 'Shar\'thos', expansion: 'legion' },
  { nombre: 'Withered J\'im', expansion: 'legion' },
  { nombre: 'Levantus', expansion: 'legion' },
  // BfA
  { nombre: 'Azurethos', expansion: 'bfa' },
  { nombre: 'Dunegorger Kraulok', expansion: 'bfa' },
  { nombre: 'Warbringer Yenajz', expansion: 'bfa' },
  { nombre: 'T\'zane', expansion: 'bfa' },
  { nombre: 'Ji\'arak', expansion: 'bfa' },
  { nombre: 'Hailstone Construct', expansion: 'bfa' },
  // Shadowlands
  { nombre: 'Mortanis', expansion: 'shadowlands' },
  { nombre: 'Nurgash', expansion: 'shadowlands' },
  { nombre: 'Oranomonos', expansion: 'shadowlands' },
  { nombre: 'Valinor', expansion: 'shadowlands' },
  { nombre: 'Mor\'geth', expansion: 'shadowlands' },
  { nombre: 'Antros', expansion: 'shadowlands' },
  // Dragonflight
  { nombre: 'Strunraan', expansion: 'dragonflight' },
  { nombre: 'Basrikron', expansion: 'dragonflight' },
  { nombre: 'Bazual', expansion: 'dragonflight' },
  { nombre: 'Liskanoth', expansion: 'dragonflight' },
  { nombre: 'Aurostor', expansion: 'dragonflight' },
  // The War Within
  { nombre: 'Reshanor', expansion: 'tww' },
  { nombre: 'The Gobfather', expansion: 'tww' },
  { nombre: 'Kordac', expansion: 'tww' },
  { nombre: 'Aggregation of Horrors', expansion: 'tww' },
  { nombre: 'Shurrai', expansion: 'tww' },
  { nombre: 'Orta', expansion: 'tww' },
  // Midnight
  { nombre: 'Pincombe', expansion: 'midnight' },
  { nombre: 'Lu\'ashal', expansion: 'midnight' },
  { nombre: 'Thorm\'belan', expansion: 'midnight' },
  { nombre: 'Predaxas', expansion: 'midnight' },
]

function uniqueExpansionIds(list: { expansion: string }[]): string[] {
  const seen = new Set<string>()
  const ids: string[] = []
  for (const item of list) {
    if (!seen.has(item.expansion)) { seen.add(item.expansion); ids.push(item.expansion) }
  }
  return ids
}

export const DUNGEON_EXPANSION_IDS = uniqueExpansionIds(DUNGEONS)
export const RAID_EXPANSION_IDS = uniqueExpansionIds(RAIDS)
export const WORLDBOSS_EXPANSION_IDS = uniqueExpansionIds(WORLDBOSSES)

export function dungeonsForExpansion(expId: string): DungeonEntry[] {
  return DUNGEONS.filter(d => d.expansion === expId)
}

export function raidsForExpansion(expId: string): RaidEntry[] {
  return RAIDS.filter(r => r.expansion === expId)
}

export function worldBossesForExpansion(expId: string): WorldBossEntry[] {
  return WORLDBOSSES.filter(w => w.expansion === expId)
}

export { expNombre }