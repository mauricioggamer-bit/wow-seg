export type TokenTier = 'T4' | 'T5' | 'T6' | 'T7' | 'T8' | 'T9' | 'T10' | 'T11'
export type TokenSlot = 'head' | 'shoulders' | 'chest' | 'gloves' | 'legs' | 'bracers' | 'belt' | 'boots' | 'mark'
export type TokenGroup = 'hero' | 'champion' | 'defender' | 'vanquisher' | 'conqueror' | 'protector'

export interface TokenSource {
  raid: string
  boss?: string
  modo?: 'normal' | 'heroic' | '10m' | '25m' | 'rf'
}

export interface TokenDef {
  id: string
  nombre: string
  tier: TokenTier
  slot: TokenSlot
  grupo: TokenGroup
  clases: string[]
  fuente: TokenSource[]
  pieza: Partial<Record<string, string>>
  ilvl?: number
}

export const TOKEN_TIERS: TokenTier[] = ['T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11']

export const TIER_INFO: Record<TokenTier, { label: string; expansion: string; raids: string[] }> = {
  T4: { label: 'T4 — the Fallen', expansion: 'TBC', raids: ['Karazhan', "Gruul's Lair", "Magtheridon's Lair"] },
  T5: { label: 'T5 — the Vanquished', expansion: 'TBC', raids: ['Serpentshrine Cavern', 'The Eye'] },
  T6: { label: 'T6 — the Forgotten', expansion: 'TBC', raids: ['Mount Hyjal', 'Black Temple', 'Sunwell Plateau'] },
  T7: { label: 'T7 — the Lost', expansion: 'WotLK', raids: ['Naxxramas', 'Obsidian Sanctum'] },
  T8: { label: 'T8 — the Wayward', expansion: 'WotLK', raids: ['Ulduar'] },
  T9: { label: 'T9 — Regalia', expansion: 'WotLK', raids: ['Trial of the Crusader'] },
  T10: { label: 'T10 — of Sanctification', expansion: 'WotLK', raids: ['Icecrown Citadel'] },
  T11: { label: 'T11 — the Forlorn', expansion: 'Cata', raids: ['Blackwing Descent', 'Bastion of Twilight', 'Throne of the Four Winds'] },
}

export const SLOT_INFO: Record<TokenSlot, string> = {
  head: 'Cabeza',
  shoulders: 'Hombros',
  chest: 'Pecho',
  gloves: 'Guantes',
  legs: 'Piernas',
  bracers: 'Brazales',
  belt: 'Cinturón',
  boots: 'Botas',
  mark: 'Marca (cualquier pieza)',
}

export const GROUP_INFO: Record<TokenGroup, { label: string; clasesAll: string[]; descripcion: string }> = {
  hero: { label: 'Hero', clasesAll: ['Cazador', 'Mago', 'Brujo'], descripcion: 'TBC: Hunter/Mage/Warlock' },
  champion: { label: 'Champion', clasesAll: ['Paladín', 'Pícaro', 'Chamán'], descripcion: 'TBC: Paladin/Rogue/Shaman' },
  defender: { label: 'Defender', clasesAll: ['Guerrero', 'Sacerdote', 'Druida'], descripcion: 'TBC: Warrior/Priest/Druid' },
  vanquisher: { label: 'Vanquisher', clasesAll: ['Pícaro', 'DK', 'Mago', 'Druida'], descripcion: 'Rogue/DK/Mage/Druid' },
  conqueror: { label: 'Conqueror', clasesAll: ['Paladín', 'Sacerdote', 'Brujo'], descripcion: 'Paladin/Priest/Warlock' },
  protector: { label: 'Protector', clasesAll: ['Guerrero', 'Cazador', 'Chamán'], descripcion: 'Warrior/Hunter/Shaman' },
}

function clasesGrupo(g: TokenGroup, tier: TokenTier): string[] {
  if (tier === 'T4' || tier === 'T5') {
    if (g === 'hero') return ['Cazador', 'Mago', 'Brujo']
    if (g === 'champion') return ['Paladín', 'Pícaro', 'Chamán']
    if (g === 'defender') return ['Guerrero', 'Sacerdote', 'Druida']
  }
  if (g === 'vanquisher') return ['Pícaro', 'DK', 'Mago', 'Druida']
  if (g === 'conqueror') return ['Paladín', 'Sacerdote', 'Brujo']
  if (g === 'protector') return ['Guerrero', 'Cazador', 'Chamán']
  return []
}

function slotName(s: TokenSlot): string {
  const map: Record<TokenSlot, string> = {
    head: 'Helm', shoulders: 'Shoulders', chest: 'Chest', gloves: 'Gloves',
    legs: 'Leggings', bracers: 'Bracers', belt: 'Belt', boots: 'Boots',
    mark: "Mark",
  }
  return map[s]
}

function grupoSuffix(g: TokenGroup): string {
  const map: Record<TokenGroup, string> = {
    hero: 'Hero', champion: 'Champion', defender: 'Defender',
    vanquisher: 'Vanquisher', conqueror: 'Conqueror', protector: 'Protector',
  }
  return map[g]
}

function tierPrefix(t: TokenTier): string {
  const map: Record<TokenTier, string> = {
    T4: 'Fallen', T5: 'Vanquished', T6: 'Forgotten', T7: 'Lost',
    T8: 'Wayward', T9: 'Regalia', T10: 'of Sanctification', T11: 'Forlorn',
  }
  return map[t]
}

function buildSlots(tier: TokenTier): { slot: TokenSlot; nombreSlot: string; fuente: TokenSource[] }[] {
  if (tier === 'T4') return [
    { slot: 'head', nombreSlot: 'Helm', fuente: [{ raid: 'Karazhan', boss: 'Prince Malchezaar' }] },
    { slot: 'shoulders', nombreSlot: 'Shoulders', fuente: [{ raid: "Gruul's Lair", boss: 'High King Maulgar' }] },
    { slot: 'chest', nombreSlot: 'Chest', fuente: [{ raid: "Magtheridon's Lair", boss: 'Magtheridon' }] },
    { slot: 'gloves', nombreSlot: 'Gloves', fuente: [{ raid: 'Karazhan', boss: 'The Curator' }] },
    { slot: 'legs', nombreSlot: 'Leggings', fuente: [{ raid: "Gruul's Lair", boss: 'Gruul the Dragonkiller' }] },
  ]
  if (tier === 'T5') return [
    { slot: 'head', nombreSlot: 'Helm', fuente: [{ raid: 'Serpentshrine Cavern', boss: 'Lady Vashj' }, { raid: 'The Eye', boss: "Kael'thas Sunstrider" }] },
    { slot: 'shoulders', nombreSlot: 'Shoulders', fuente: [{ raid: 'The Eye', boss: 'Void Reaver' }] },
    { slot: 'chest', nombreSlot: 'Chest', fuente: [{ raid: 'Serpentshrine Cavern', boss: 'Fathom-Lord Karathress' }] },
    { slot: 'gloves', nombreSlot: 'Gloves', fuente: [{ raid: 'Serpentshrine Cavern', boss: 'Leotheras the Blind' }, { raid: 'The Eye', boss: "Al'ar" }] },
    { slot: 'legs', nombreSlot: 'Leggings', fuente: [{ raid: 'The Eye', boss: 'High Astromancer Solarian' }] },
  ]
  if (tier === 'T6') return [
    { slot: 'head', nombreSlot: 'Helm', fuente: [{ raid: 'Mount Hyjal', boss: 'Archimonde' }] },
    { slot: 'shoulders', nombreSlot: 'Shoulders', fuente: [{ raid: 'Black Temple', boss: 'Mother Shahraz' }] },
    { slot: 'chest', nombreSlot: 'Chest', fuente: [{ raid: 'Black Temple', boss: 'Illidan Stormrage' }] },
    { slot: 'gloves', nombreSlot: 'Gloves', fuente: [{ raid: 'Black Temple', boss: 'Eredar Twins' }] },
    { slot: 'legs', nombreSlot: 'Leggings', fuente: [{ raid: 'Black Temple', boss: 'Gurtogg Bloodboil' }] },
    { slot: 'bracers', nombreSlot: 'Bracers', fuente: [{ raid: 'Sunwell Plateau', boss: 'Kalecgos' }] },
    { slot: 'belt', nombreSlot: 'Belt', fuente: [{ raid: 'Sunwell Plateau', boss: 'Brutallus' }] },
    { slot: 'boots', nombreSlot: 'Boots', fuente: [{ raid: 'Sunwell Plateau', boss: 'Felmyst' }] },
  ]
  if (tier === 'T7') return [
    { slot: 'head', nombreSlot: 'Helm', fuente: [{ raid: 'Naxxramas', boss: 'Kelthuzad (25m)' }, { raid: 'Naxxramas', boss: 'Loatheb (10m)' }] },
    { slot: 'shoulders', nombreSlot: 'Shoulders', fuente: [{ raid: 'Naxxramas', boss: 'Sapphiron' }] },
    { slot: 'chest', nombreSlot: 'Chest', fuente: [{ raid: 'Naxxramas', boss: 'Four Horsemen (25m)' }, { raid: 'Naxxramas', boss: 'Gluth (10m)' }] },
    { slot: 'gloves', nombreSlot: 'Gloves', fuente: [{ raid: 'Naxxramas', boss: 'Heigan the Unclean' }] },
    { slot: 'legs', nombreSlot: 'Leggings', fuente: [{ raid: 'Naxxramas', boss: 'Thaddius' }] },
    { slot: 'bracers', nombreSlot: 'Bracers', fuente: [{ raid: 'Obsidian Sanctum', boss: 'Sartharion' }] },
    { slot: 'belt', nombreSlot: 'Belt', fuente: [{ raid: 'Naxxramas', boss: 'Grobbulus' }] },
    { slot: 'boots', nombreSlot: 'Boots', fuente: [{ raid: 'Naxxramas', boss: 'Maexxna' }] },
  ]
  if (tier === 'T8') return [
    { slot: 'head', nombreSlot: 'Helm', fuente: [{ raid: 'Ulduar', boss: 'Yogg-Saron' }] },
    { slot: 'shoulders', nombreSlot: 'Shoulders', fuente: [{ raid: 'Ulduar', boss: 'Hodir' }] },
    { slot: 'chest', nombreSlot: 'Chest', fuente: [{ raid: 'Ulduar', boss: 'General Vezax' }] },
    { slot: 'gloves', nombreSlot: 'Gloves', fuente: [{ raid: 'Ulduar', boss: 'Freya' }] },
    { slot: 'legs', nombreSlot: 'Leggings', fuente: [{ raid: 'Ulduar', boss: 'Thorim' }] },
    { slot: 'bracers', nombreSlot: 'Bracers', fuente: [{ raid: 'Ulduar', boss: 'Kologarn' }] },
    { slot: 'belt', nombreSlot: 'Belt', fuente: [{ raid: 'Ulduar', boss: 'Auriaya' }] },
    { slot: 'boots', nombreSlot: 'Boots', fuente: [{ raid: 'Ulduar', boss: 'Mimiron' }] },
  ]
  if (tier === 'T9') return [
    { slot: 'mark', nombreSlot: 'Regalia', fuente: [{ raid: 'Trial of the Crusader', boss: ' Faction Champions (25m)' }] },
  ]
  if (tier === 'T10') return [
    { slot: 'mark', nombreSlot: "Mark", fuente: [{ raid: 'Icecrown Citadel', boss: 'Deathbringer Saurfang (cache)' }, { raid: 'Icecrown Citadel', boss: 'Professor Putricide' }, { raid: 'Icecrown Citadel', boss: "Blood-Queen Lana'thel" }, { raid: 'Icecrown Citadel', boss: 'Sindragosa' }] },
  ]
  if (tier === 'T11') return [
    { slot: 'head', nombreSlot: 'Helm', fuente: [{ raid: 'Blackwing Descent', boss: 'Nefarian' }, { raid: 'Throne of the Four Winds', boss: "Al'Akir" }] },
    { slot: 'shoulders', nombreSlot: 'Shoulders', fuente: [{ raid: 'Bastion of Twilight', boss: "Cho'gall" }] },
  ]
  return []
}

function gruposTier(tier: TokenTier): TokenGroup[] {
  if (tier === 'T4' || tier === 'T5') return ['hero', 'champion', 'defender']
  return ['vanquisher', 'conqueror', 'protector']
}

function buildTokenName(tier: TokenTier, slot: TokenSlot, grupo: TokenGroup): string {
  const p = tierPrefix(tier)
  const s = slotName(slot)
  const g = grupoSuffix(grupo)
  if (tier === 'T9') return `Regalia of the Grand ${g}`
  if (tier === 'T10') return `${g}'s Mark of Sanctification`
  return `${s} of the ${p} ${g}`
}

function buildId(tier: TokenTier, slot: TokenSlot, grupo: TokenGroup, modo?: 'heroic'): string {
  const base = `${tier.toLowerCase()}-${slot}-${grupo}${modo === 'heroic' ? '-heroic' : ''}`
  return base
}

function buildTokens(): TokenDef[] {
  const out: TokenDef[] = []
  for (const tier of TOKEN_TIERS) {
    const slots = buildSlots(tier)
    const grupos = gruposTier(tier)
    for (const slot of slots) {
      for (const grupo of grupos) {
        const clases = clasesGrupo(grupo, tier)
        const nombre = buildTokenName(tier, slot.slot, grupo)
        if (tier === 'T10') {
          out.push({
            id: buildId(tier, slot.slot, grupo),
            nombre,
            tier, slot: slot.slot, grupo,
            clases, fuente: slot.fuente,
            pieza: {}, ilvl: 264,
          })
          out.push({
            id: buildId(tier, slot.slot, grupo, 'heroic'),
            nombre: nombre + ' (Heroic)',
            tier, slot: slot.slot, grupo,
            clases, fuente: slot.fuente,
            pieza: {}, ilvl: 277,
          })
        } else if (tier === 'T9') {
          for (const ilvl of [232, 245, 258] as const) {
            const subId = ilvl === 232 ? '' : ilvl === 245 ? '-245' : '-258'
            out.push({
              id: `${tier.toLowerCase()}-${grupo}${subId}`,
              nombre: ilvl === 258 ? `Regalia of the Grand ${grupoSuffix(grupo)} (ilvl 258)` : ilvl === 245 ? `Regalia of the Grand ${grupoSuffix(grupo)} (ilvl 245 + Trophy)` : `Regalia of the Grand ${grupoSuffix(grupo)} (ilvl 232)`,
              tier, slot: 'mark', grupo,
              clases, fuente: slot.fuente,
              pieza: {}, ilvl,
            })
          }
        } else {
          out.push({
            id: buildId(tier, slot.slot, grupo),
            nombre,
            tier, slot: slot.slot, grupo,
            clases, fuente: slot.fuente,
            pieza: {},
          })
        }
      }
    }
  }
  return out
}

export const TOKENS: TokenDef[] = buildTokens()

export function tokenById(id: string): TokenDef | undefined {
  return TOKENS.find(t => t.id === id)
}

export function tokensByTier(tier: TokenTier): TokenDef[] {
  return TOKENS.filter(t => t.tier === tier)
}

export function allClasesInRoster(personajes: { clase: string }[]): string[] {
  const set = new Set<string>()
  for (const p of personajes) if (p.clase) set.add(p.clase)
  return [...set].sort()
}

export function classesUnlocked(unlocks: Record<string, string[]> | undefined, tokenId: string): string[] {
  if (!unlocks) return []
  const v = unlocks[tokenId]
  return Array.isArray(v) ? v : []
}

export function tokenKey(tokenId: string, clase: string): string {
  return `${tokenId}::${clase}`
}