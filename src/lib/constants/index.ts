export const CLASS_MAP: Record<string, string> = {
  'Guerrero': 'warrior', 'Paladín': 'paladin', 'Cazador': 'hunter',
  'Pícaro': 'rogue', 'Sacerdote': 'priest', 'DK': 'dk',
  'Chamán': 'shaman', 'Mago': 'mage', 'Brujo': 'warlock',
  'Monje': 'monk', 'Druida': 'druid', 'DH': 'dh', 'Evocadora': 'evoker',
  'Maga': 'mage',
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

export const PERS_RACES_BY_COLUMN: Record<string, string[]> = {
  'alliance-trad': ['Human', 'Night Elf', 'Gnome', 'Dwarf', 'Draenei', 'Worgen', 'Pandaren', 'Dracthyr'],
  'alliance-allied': ['Void Elf', 'Light Draenei', 'Dark Iron Dwarf', 'Kul Tiran', 'Mechagnome', 'Earthen'],
  'horde-allied': ['Nightborne', 'Highmountain', "Mag'har", 'Zandalari', 'Vulpera', 'Earthen', 'Haranir'],
  'horde-trad': ['Orco', 'Undead', 'Tauren', 'Troll', 'Blood Elf', 'Goblin', 'Pandaren', 'Dracthyr'],
}

export const EXPANSIONS = [
  { id: 'classic', nombre: 'Classic', color: '#c9a84c', region: 'Azeroth' },
  { id: 'tww', nombre: 'The War Within', color: '#3FC7EB', region: 'Khaz Algar' },
  { id: 'dragonflight', nombre: 'Dragonflight', color: '#33937F', region: 'Dragon Isles' },
  { id: 'shadowlands', nombre: 'Shadowlands', color: '#8788EE', region: 'Shadowlands' },
  { id: 'legion', nombre: 'Legion', color: '#A330C9', region: 'Broken Isles' },
  { id: 'bfa', nombre: 'Battle for Azeroth', color: '#C69B3A', region: 'Zandalar / Kul Tiras' },
  { id: 'draenor', nombre: 'Warlords of Draenor', color: '#FF7C0A', region: 'Draenor' },
  { id: 'mop', nombre: 'Mists of Pandaria', color: '#00FF96', region: 'Pandaria' },
  { id: 'cata', nombre: 'Cataclysm', color: '#E84545', region: 'Azeroth' },
  { id: 'wotlk', nombre: 'Wrath of the Lich King', color: '#3A8BFF', region: 'Northrend' },
  { id: 'midnight', nombre: 'Midnight', color: '#7B2FBE', region: 'TBD' },
  { id: 'outland', nombre: 'The Burning Crusade', color: '#7A4C8F', region: 'Outland' },
]

export const LABELS: Record<string, string> = { all: 'Todas', weekly: 'Semanal', daily: 'Diaria', farm_libre: 'Farm' }
