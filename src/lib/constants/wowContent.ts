import { EXPANSIONS } from './index'

export type DungeonDifficulty = 'Normal' | 'Heroica' | 'Mítica' | 'Mítica+'
export type RaidDifficulty = 'LFR' | 'Normal' | 'Heroica' | 'Mítica' | 'Mítica+'

export interface DungeonEntry {
  nombre: string
  dificultad: DungeonDifficulty
  expansion: string
}

export interface RaidEntry {
  nombre: string
  dificultad: RaidDifficulty
  expansion: string
}

export interface WorldBossEntry {
  nombre: string
  expansion: string
}

export type TipoContenido = 'descripcion' | 'mazmorra' | 'raid' | 'worldboss'

const expNombre = (id: string): string =>
  EXPANSIONS.find(e => e.id === id)?.nombre ?? id

export const dungeonLabel = (d: DungeonEntry): string =>
  `${d.nombre}-${d.dificultad}-${expNombre(d.expansion)}`

export const raidLabel = (r: RaidEntry): string =>
  `${r.nombre}-${r.dificultad}-${expNombre(r.expansion)}`

export const worldBossLabel = (w: WorldBossEntry): string =>
  `${w.nombre}-${expNombre(w.expansion)}`

// TODO: completar la lista completa hasta Midnight. Aquí solo hay ejemplos
// representativos para que el usuario rellene los que falten / corrija los
// nombres oficiales en español. El formato del dropdown resulta en:
// "nombreMazmorra-dificultad-expansion".

export const DUNGEONS: DungeonEntry[] = [
  // TBC
  { nombre: 'Foso de Sangre', dificultad: 'Heroica', expansion: 'outland' },
  { nombre: 'Terráqueo', dificultad: 'Heroica', expansion: 'outland' },
  // WotLK
  { nombre: 'Azjol-Nerub', dificultad: 'Heroica', expansion: 'wotlk' },
  { nombre: 'Cámaras de Piedra', dificultad: 'Heroica', expansion: 'wotlk' },
  // Cata
  { nombre: 'Cima del Mundo', dificultad: 'Heroica', expansion: 'cata' },
  // MoP
  { nombre: 'Cervecería de Cremasol', dificultad: 'Heroica', expansion: 'mop' },
  { nombre: 'Monasterio del Escudo Pálido', dificultad: 'Heroica', expansion: 'mop' },
  // WoD
  { nombre: 'Depósito Algamar', dificultad: 'Heroica', expansion: 'draenor' },
  // Legion
  { nombre: 'Cámaras Arcavas', dificultad: 'Mítica', expansion: 'legion' },
  { nombre: 'Bosque Corazón Oscuro', dificultad: 'Mítica', expansion: 'legion' },
  { nombre: 'Corte de Estrellas', dificultad: 'Mítica', expansion: 'legion' },
  // BfA
  { nombre: 'Freehold', dificultad: 'Mítica', expansion: 'bfa' },
  { nombre: 'Requisa', dificultad: 'Mítica', expansion: 'bfa' },
  // Shadowlands
  { nombre: 'Sanguinas Profundas', dificultad: 'Mítica', expansion: 'shadowlands' },
  { nombre: 'Nieblas Tirna Scithe', dificultad: 'Mítica', expansion: 'shadowlands' },
  // Dragonflight
  { nombre: 'Cámaras Rocaluna', dificultad: 'Mítica', expansion: 'dragonflight' },
  { nombre: 'Profundidades de Rubí', dificultad: 'Mítica', expansion: 'dragonflight' },
  { nombre: 'Bóveda Azur', dificultad: 'Mítica', expansion: 'dragonflight' },
  // The War Within
  { nombre: 'Cavernas de Resonancia', dificultad: 'Mítica', expansion: 'tww' },
  { nombre: 'Granero Esmeralda', dificultad: 'Mítica', expansion: 'tww' },
  // Midnight
  // TODO: añadir mazmorras cuando se publiquen
]

export const RAIDS: RaidEntry[] = [
  // TBC
  { nombre: 'Karazhan', dificultad: 'Normal', expansion: 'outland' },
  { nombre: 'Templo Oscuro', dificultad: 'Normal', expansion: 'outland' },
  // WotLK
  { nombre: 'Naxxramas', dificultad: 'Normal', expansion: 'wotlk' },
  { nombre: 'Ulduar', dificultad: 'Normal', expansion: 'wotlk' },
  { nombre: 'Ciudadela de Corona de Hielo', dificultad: 'Heroica', expansion: 'wotlk' },
  // Cata
  { nombre: 'Bastión del Crepúsculo', dificultad: 'Heroica', expansion: 'cata' },
  { nombre: 'Guarida de Alamuerte', dificultad: 'Heroica', expansion: 'cata' },
  // MoP
  { nombre: 'Trono del Trueno', dificultad: 'Heroica', expansion: 'mop' },
  { nombre: 'Asedio de Orgrimmar', dificultad: 'Heroica', expansion: 'mop' },
  // WoD
  { nombre: 'Alto Mausoleo', dificultad: 'Normal', expansion: 'draenor' },
  { nombre: 'Ciudadela del Señor del Fuego', dificultad: 'Heroica', expansion: 'draenor' },
  // Legion
  { nombre: 'Tumba de Sargeras', dificultad: 'Heroica', expansion: 'legion' },
  { nombre: 'Antorus, el Trono Ardiente', dificultad: 'Heroica', expansion: 'legion' },
  { nombre: 'Bastión Nocturno', dificultad: 'Heroica', expansion: 'legion' },
  // BfA
  { nombre: 'Uldir', dificultad: 'Heroica', expansion: 'bfa' },
  { nombre: 'Palacio Eterno', dificultad: 'Heroica', expansion: 'bfa' },
  { nombre: 'Nya\'lotha, la Ciudad Despertada', dificultad: 'Heroica', expansion: 'bfa' },
  // Shadowlands
  { nombre: 'Castillo Nathria', dificultad: 'Heroica', expansion: 'shadowlands' },
  { nombre: 'Cámaras Sagradas de la Dominación', dificultad: 'Heroica', expansion: 'shadowlands' },
  { nombre: 'Mausoleo Sagrado', dificultad: 'Heroica', expansion: 'shadowlands' },
  { nombre: 'Sepulcro Eterno', dificultad: 'Heroica', expansion: 'shadowlands' },
  // Dragonflight
  { nombre: 'Caverna Esmeralda', dificultad: 'Heroica', expansion: 'dragonflight' },
  { nombre: 'Abismo Crepuscular', dificultad: 'Heroica', expansion: 'dragonflight' },
  { nombre: 'Frente Abisal', dificultad: 'Heroica', expansion: 'dragonflight' },
  // The War Within
  // TODO: añadir raids de TWW con nombres oficiales
  // Midnight
  // TODO: añadir raids cuando se publiquen
]

export const WORLDBOSSES: WorldBossEntry[] = [
  // Classic
  { nombre: 'Lord Kazzak', expansion: 'classic' },
  { nombre: 'Azuregos', expansion: 'classic' },
  { nombre: 'Emeriss', expansion: 'classic' },
  { nombre: 'Taerar', expansion: 'classic' },
  { nombre: 'Lethon', expansion: 'classic' },
  { nombre: 'Ysondre', expansion: 'classic' },
  // TBC
  { nombre: 'Doomwalker', expansion: 'outland' },
  { nombre: 'Doomlord Kazzak', expansion: 'outland' },
  // WotLK
  { nombre: 'Archavon', expansion: 'wotlk' },
  { nombre: 'Emalon the Storm Watcher', expansion: 'wotlk' },
  { nombre: 'Koralon the Flame Watcher', expansion: 'wotlk' },
  { nombre: 'Toravon the Ice Watcher', expansion: 'wotlk' },
  // Cata
  // TODO: completar jefes del mundo de Cataclysm
  // MoP
  { nombre: 'Galleon', expansion: 'mop' },
  { nombre: 'Sha of Anger', expansion: 'mop' },
  { nombre: 'Nalak', expansion: 'mop' },
  { nombre: 'Ondasta', expansion: 'mop' },
  { nombre: 'Huolon', expansion: 'mop' },
  // WoD
  // TODO: completar jefes del mundo de WoD
  // Legion
  { nombre: 'Nithogg', expansion: 'legion' },
  { nombre: 'Ana-Mouz', expansion: 'legion' },
  { nombre: 'Brutallus', expansion: 'legion' },
  // BfA
  { nombre: 'Vuk\'laz de Tierritura', expansion: 'bfa' },
  // TODO: completar el resto de jefes del mundo de BfA
  // Shadowlands
  { nombre: 'Valinor', expansion: 'shadowlands' },
  { nombre: 'Mortanis', expansion: 'shadowlands' },
  { nombre: 'Oranausk', expansion: 'shadowlands' },
  { nombre: 'Nurgash de Lodo', expansion: 'shadowlands' },
  // Dragonflight
  // TODO: completar jefes del mundo de Dragonflight
  // The War Within
  // TODO: completar jefes del mundo de The War Within
  // Midnight
  // TODO: añadir jefes cuando se publiquen
]

export const DUNGEON_LABELS = DUNGEONS.map(dungeonLabel)
export const RAID_LABELS = RAIDS.map(raidLabel)
export const WORLDBOSS_LABELS = WORLDBOSSES.map(worldBossLabel)