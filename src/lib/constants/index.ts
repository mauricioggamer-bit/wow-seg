export const CLASS_MAP: Record<string, string> = {
  'Guerrero': 'warrior', 'Paladín': 'paladin', 'Cazador': 'hunter',
  'Pícaro': 'rogue', 'Sacerdote': 'priest', 'DK': 'dk',
  'Chamán': 'shaman', 'Mago': 'mage', 'Brujo': 'warlock',
  'Monje': 'monk', 'Druida': 'druid', 'DH': 'dh', 'Evocadora': 'evoker',
}

export function clsClass(className: string): string {
  return 'class-' + (CLASS_MAP[className] || 'warrior')
}

export const PERS_RACE_INFO: Record<string, { icon: string; type: string }> = {
  'Orco':            { icon: '💀', type: 'Salvaje' },
  'Blood Elf':       { icon: '🔮', type: 'Élfico' },
  'Tauren':          { icon: '🐂', type: 'Bestial' },
  'Troll':           { icon: '🗿', type: 'Tribal' },
  'Goblin':          { icon: '💰', type: 'Pequeño' },
  "Mag'har":         { icon: '🏹', type: 'Salvaje' },
  'Nightborne':      { icon: '🌌', type: 'Élfico' },
  'Highmountain':    { icon: '🦌', type: 'Bestial' },
  'Zandalari':       { icon: '🏯', type: 'Tribal' },
  'Vulpera':         { icon: '🦊', type: 'Nómada' },
  'Undead':          { icon: '☠', type: 'No-muerto' },
  'Earthen':         { icon: '🪨', type: 'Elemental' },
  'Pandaren':        { icon: '🐼', type: 'Neutral' },
  'Human':           { icon: '👤', type: 'Humanoide' },
  'Night Elf':       { icon: '🌙', type: 'Élfico' },
  'Draenei':         { icon: '✦', type: 'Místico' },
  'Gnome':           { icon: '⚙', type: 'Pequeño' },
  'Dwarf':           { icon: '⛏', type: 'Humanoide' },
  'Void Elf':        { icon: '🌑', type: 'Élfico' },
  'Light Draenei':   { icon: '✦', type: 'Luz' },
  'Dark Iron Dwarf': { icon: '🖤', type: 'Humanoide' },
  'Kul Tiran':       { icon: '⚓', type: 'Humanoide' },
  'Mechagnome':      { icon: '🔧', type: 'Pequeño' },
  'Haranir':         { icon: '🌿', type: 'Místico' },
  'Dracthyr':        { icon: '🐉', type: 'Dragón' },
  'Worgen':          { icon: '🐺', type: 'Bestial' },
}

export const PERS_CLASS_ICONS: Record<string, string> = {
  warrior: '⚔️', paladin: '🛡️', hunter: '🏹', rogue: '🗡️',
  priest: '✝️', dk: '💀', shaman: '🌩️', mage: '🔮',
  warlock: '👁️', monk: '🥋', druid: '🌿', dh: '😈', evoker: '🐉',
}

export const PERS_CLASS_COLORS: Record<string, string> = {
  warrior: '#c69b3a', paladin: '#f48cba', hunter: '#aad372', rogue: '#fff569',
  priest: '#ffffff', dk: '#c41e3a', shaman: '#0070dd', mage: '#3fc7eb',
  warlock: '#8788ee', monk: '#00ff96', druid: '#ff7c0a', dh: '#a330c9', evoker: '#33937f',
}

export type RaceProfBonus = { profId: string; bonus: number; note?: string }

export const RACE_PROFESSION_BONUS: Record<string, RaceProfBonus[]> = {
  'Gnome':             [{ profId: 'ingenieria', bonus: 5, note: 'The Lazy Goldmaker' }],
  'Draenei':           [{ profId: 'joyeria', bonus: 5, note: 'The Lazy Goldmaker' }],
  'Blood Elf':         [{ profId: 'encantamiento', bonus: 5, note: 'The Lazy Goldmaker' }],
  'Worgen':            [{ profId: 'desuello', bonus: 5, note: 'The Lazy Goldmaker' }],
  'Goblin':            [{ profId: 'alquimia', bonus: 5, note: 'The Lazy Goldmaker' }],
  'Pandaren':          [{ profId: 'cocina', bonus: 5, note: 'The Lazy Goldmaker' }],
  'Light Draenei':     [{ profId: 'herreria', bonus: 5, note: 'The Lazy Goldmaker' }],
  'Nightborne':        [{ profId: 'inscripcion', bonus: 5, note: 'The Lazy Goldmaker' }],
  'Highmountain':      [{ profId: 'mineria', bonus: 5, note: 'The Lazy Goldmaker' }],
  'Dark Iron Dwarf':   [{ profId: 'herreria', bonus: 5, note: 'The Lazy Goldmaker' }],
  'Kul Tiran':         [{ profId: '*', bonus: 2, note: 'The Lazy Goldmaker — +2 a todas las primarias' }],
  'Tauren':            [{ profId: 'herboristeria', bonus: 5, note: 'Cultivation racial' }],
}

export const PROFESSION_STRATEGIC_VALUE: Record<string, number> = {
  'mineria': 5, 'herboristeria': 3, 'desuello': 3,
  'herreria': 8, 'peleteria': 6, 'sastreria': 6,
  'alquimia': 7, 'encantamiento': 7, 'ingenieria': 8,
  'joyeria': 6, 'inscripcion': 5,
}

export interface StrategicComponentInfo {
  key: string
  label: string
  weight: number | 'fixed' | 'bonus'
  description: string
}

export const STRATEGIC_COMPONENTS: StrategicComponentInfo[] = [
  { key: 'warbandImpact', label: 'Warband Impact', weight: 10, description: 'Personajes 80-89 que reciben +5% XP al llegar este a 90. Cada beneficiario suma 5 puntos.' },
  { key: 'professionValue', label: 'Profesiones', weight: 15, description: 'Suma de valores estratégicos de las profesiones del personaje.' },
  { key: 'closenessTo90', label: 'Cercanía a 90', weight: 25, description: 'max(0, (nivel - 10) / 80). Lineal de nivel 10 a 90.' },
  { key: 'closenessToObjective', label: 'Cercanía obj.', weight: 25, description: 'max(0, 1 - dungeonsTo90 / 200). Menos dungeons para 90 = más puntaje.' },
  { key: 'futureXpIncrease', label: 'XP futura', weight: 8, description: 'Incremento de Warband Mentor al subir a 90 (delta del buff entre count90 actual y +1).' },
  { key: 'remainingWeight', label: 'Peso restante', weight: 10, description: 'min(1, pendientes/10). Más personajes pendientes = más valor de Warband.' },
  { key: 'bonusSub90', label: 'Bonus <90', weight: 'bonus', description: '+10 fijo si el personaje está por debajo de nivel 90.' },
  { key: 'bonus8089', label: 'Bonus 80-89', weight: 'bonus', description: '+15 fijo si el personaje está en el rango 80-89 (barato para Warband Mentor 80-90).' },
  { key: 'classValue', label: 'Clase', weight: 'fixed', description: 'Suma de las ventajas (índice "General") asignadas a la clase del personaje. No tiene valor base — sale de lo que le asignes en la pestaña Clases.' },
  { key: 'raceValue', label: 'Raza', weight: 'fixed', description: 'Suma de las ventajas (índice "General") asignadas a la raza del personaje. No tiene valor base — sale de lo que le asignes en la pestaña Razas.' },
  { key: 'tagsValue', label: 'Tags', weight: 'fixed', description: 'Suma de puntos de tags estratégicos definidos por el usuario.' },
  { key: 'taskValue', label: 'Tareas', weight: 'fixed', description: 'Suma de puntos estratégicos de las tareas del personaje.' },
  { key: 'raceProfBonus', label: 'Bono Raza-Profesión', weight: 'fixed', description: 'Bonos raciales que otorgan puntos extra si el personaje tiene la profesión correspondiente.' },
  { key: 'indexValues', label: 'Ventajas', weight: 'fixed', description: 'Suma de ventajas estratégicas definidas por el usuario.' },
  { key: 'optimizationStrategicBonus', label: 'Bono ROI estratégico', weight: 0.1, description: 'Cuánto influye el valor estratégico total del personaje al elegir el orden de subida en el optimizador ROI.' },
]

export const STAR_THRESHOLDS = [
  { min: 85, stars: 5 },
  { min: 65, stars: 4 },
  { min: 45, stars: 3 },
  { min: 25, stars: 2 },
  { min: 0, stars: 1 },
] as const

export const PERS_RACES_BY_COLUMN: Record<string, string[]> = {
  'alliance-trad': ['Human', 'Night Elf', 'Gnome', 'Dwarf', 'Draenei', 'Worgen', 'Pandaren', 'Dracthyr'],
  'alliance-allied': ['Void Elf', 'Light Draenei', 'Dark Iron Dwarf', 'Kul Tiran', 'Mechagnome', 'Earthen'],
  'horde-allied': ['Nightborne', 'Highmountain', "Mag'har", 'Zandalari', 'Vulpera', 'Earthen', 'Haranir'],
  'horde-trad': ['Orco', 'Undead', 'Tauren', 'Troll', 'Blood Elf', 'Goblin', 'Pandaren', 'Dracthyr'],
}

export const EXPANSIONS = [
  { id: 'classic', nombre: 'Classic', color: '#c9a84c', region: 'Azeroth' },
  { id: 'outland', nombre: 'The Burning Crusade', color: '#7A4C8F', region: 'Outland' },
  { id: 'wotlk', nombre: 'Wrath of the Lich King', color: '#3A8BFF', region: 'Northrend' },
  { id: 'cata', nombre: 'Cataclysm', color: '#E84545', region: 'Azeroth' },
  { id: 'mop', nombre: 'Mists of Pandaria', color: '#00FF96', region: 'Pandaria' },
  { id: 'draenor', nombre: 'Warlords of Draenor', color: '#FF7C0A', region: 'Draenor' },
  { id: 'legion', nombre: 'Legion', color: '#A330C9', region: 'Broken Isles' },
  { id: 'bfa', nombre: 'Battle for Azeroth', color: '#C69B3A', region: 'Zandalar / Kul Tiras' },
  { id: 'shadowlands', nombre: 'Shadowlands', color: '#8788EE', region: 'Shadowlands' },
  { id: 'dragonflight', nombre: 'Dragonflight', color: '#33937F', region: 'Dragon Isles' },
  { id: 'tww', nombre: 'The War Within', color: '#3FC7EB', region: 'Khaz Algar' },
  { id: 'midnight', nombre: 'Midnight', color: '#7B2FBE', region: 'TBD' },
]

export const LABELS: Record<string, string> = { all: 'Todas', weekly: 'Semanal', daily: 'Diaria', farm_libre: 'Farm' }
