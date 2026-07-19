export type TokenTier = 'T4' | 'T5' | 'T6' | 'T7' | 'T8' | 'T9' | 'T10' | 'T11' | 'T12' | 'T13' | 'T14' | 'T15' | 'T16'
export type TokenSlot = 'head' | 'shoulders' | 'chest' | 'gloves' | 'legs' | 'bracers' | 'belt' | 'boots' | 'mark'
export type TokenGroup = 'hero' | 'champion' | 'defender' | 'vanquisher' | 'conqueror' | 'protector'
export type TokenDifficulty = 'rf' | 'normal' | 'heroic' | 'mythic'

export interface TokenSource {
  raid: string
  boss?: string
}

export interface TokenDef {
  id: string
  nombre: string
  tier: TokenTier
  slot: TokenSlot
  grupo: TokenGroup
  clases: string[]
  fuente: TokenSource[]
  dificultades: TokenDifficulty[]
  ilvls?: Partial<Record<TokenDifficulty, number>>
}

export const TOKEN_TIERS: TokenTier[] = ['T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'T13', 'T14', 'T15', 'T16']

export const TIER_INFO: Record<TokenTier, { label: string; expansion: 'TBC' | 'WotLK' | 'Cata' | 'MoP'; raids: string[] }> = {
  T4: { label: 'T4 — the Fallen', expansion: 'TBC', raids: ['Karazhan', "Gruul's Lair", "Magtheridon's Lair"] },
  T5: { label: 'T5 — the Vanquished', expansion: 'TBC', raids: ['Serpentshrine Cavern', 'The Eye'] },
  T6: { label: 'T6 — the Forgotten', expansion: 'TBC', raids: ['Mount Hyjal', 'Black Temple', 'Sunwell Plateau'] },
  T7: { label: 'T7 — the Lost', expansion: 'WotLK', raids: ['Naxxramas', 'Obsidian Sanctum'] },
  T8: { label: 'T8 — the Wayward', expansion: 'WotLK', raids: ['Ulduar'] },
  T9: { label: 'T9 — Regalia', expansion: 'WotLK', raids: ['Trial of the Crusader'] },
  T10: { label: 'T10 — of Sanctification', expansion: 'WotLK', raids: ['Icecrown Citadel'] },
  T11: { label: 'T11 — the Forlorn', expansion: 'Cata', raids: ['Blackwing Descent', 'Bastion of Twilight', 'Throne of the Four Winds'] },
  T12: { label: 'T12 — the Fiery', expansion: 'Cata', raids: ['Firelands'] },
  T13: { label: 'T13 — the Corrupted', expansion: 'Cata', raids: ['Dragon Soul'] },
  T14: { label: 'T14 — the Shadowy', expansion: 'MoP', raids: ['Heart of Fear', 'Terrace of Endless Spring'] },
  T15: { label: 'T15 — the Crackling', expansion: 'MoP', raids: ['Throne of Thunder'] },
  T16: { label: 'T16 — the Cursed', expansion: 'MoP', raids: ['Siege of Orgrimmar'] },
}

export const DIFFICULTY_LABEL: Record<TokenDifficulty, string> = {
  rf: 'RF',
  normal: 'Normal',
  heroic: 'Heroic',
  mythic: 'Mythic',
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

export const GROUP_INFO: Record<TokenGroup, { label: string; descripcion: string }> = {
  hero: { label: 'Hero', descripcion: 'TBC: Hunter/Mage/Warlock' },
  champion: { label: 'Champion', descripcion: 'TBC: Paladin/Rogue/Shaman' },
  defender: { label: 'Defender', descripcion: 'TBC: Warrior/Priest/Druid' },
  vanquisher: { label: 'Vanquisher', descripcion: 'Rogue/DK/Mage/Druid' },
  conqueror: { label: 'Conqueror', descripcion: 'Paladin/Priest/Warlock' },
  protector: { label: 'Protector', descripcion: 'Warrior/Hunter/Shaman' },
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
    mark: 'Mark',
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
    T12: 'Fiery', T13: 'Corrupted', T14: 'Shadowy', T15: 'Crackling', T16: 'Cursed',
  }
  return map[t]
}

interface SlotSpec {
  slot: TokenSlot
  nombreSlot: string
  fuente: TokenSource[]
}

function buildSlots(tier: TokenTier): SlotSpec[] {
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
    { slot: 'head', nombreSlot: 'Helm', fuente: [{ raid: 'Naxxramas', boss: 'Kelthuzad / Loatheb' }] },
    { slot: 'shoulders', nombreSlot: 'Shoulders', fuente: [{ raid: 'Naxxramas', boss: 'Sapphiron' }] },
    { slot: 'chest', nombreSlot: 'Chest', fuente: [{ raid: 'Naxxramas', boss: 'Four Horsemen / Gluth' }] },
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
    { slot: 'mark', nombreSlot: 'Regalia', fuente: [{ raid: 'Trial of the Crusader', boss: 'Faction Champions' }] },
  ]
  if (tier === 'T10') return [
    { slot: 'mark', nombreSlot: 'Mark', fuente: [{ raid: 'Icecrown Citadel', boss: 'Deathbringer Saurfang (cache), Putricide, Blood-Queen, Sindragosa' }] },
  ]
  if (tier === 'T11') return [
    { slot: 'head', nombreSlot: 'Helm', fuente: [{ raid: 'Blackwing Descent', boss: 'Nefarian' }, { raid: 'Throne of the Four Winds', boss: "Al'Akir" }] },
    { slot: 'shoulders', nombreSlot: 'Shoulders', fuente: [{ raid: 'Bastion of Twilight', boss: "Cho'gall" }] },
  ]
  if (tier === 'T12') return [
    { slot: 'head', nombreSlot: 'Helm', fuente: [{ raid: 'Firelands', boss: 'Ragnaros' }] },
    { slot: 'shoulders', nombreSlot: 'Shoulders', fuente: [{ raid: 'Firelands', boss: 'Majordomo Staghelm' }] },
    { slot: 'chest', nombreSlot: 'Chest', fuente: [{ raid: 'Firelands', boss: 'Alysrazor' }] },
    { slot: 'gloves', nombreSlot: 'Gloves', fuente: [{ raid: 'Firelands', boss: 'Shannox' }] },
    { slot: 'legs', nombreSlot: 'Leggings', fuente: [{ raid: 'Firelands', boss: 'Baleroc' }] },
  ]
  if (tier === 'T13') {
    const bosses = ['Morchok', "Warlord Zon'ozz", "Yor'sahj the Unsleeping", 'Hagara', 'Ultraxion', 'Warmaster Blackhorn', 'Spine of Deathwing', 'Madness of Deathwing']
    const slots: SlotSpec[] = []
    const slotAssign: [TokenSlot, string][] = [
      ['head', 'Morchok'],
      ['shoulders', "Yor'sahj the Unsleeping"],
      ['chest', 'Warmaster Blackhorn'],
      ['gloves', 'Ultraxion'],
      ['legs', 'Hagara'],
    ]
    for (const [s, b] of slotAssign) {
      slots.push({ slot: s, nombreSlot: slotName(s), fuente: [{ raid: 'Dragon Soul', boss: b }] })
    }
    void bosses
    return slots
  }
  if (tier === 'T14') {
    const slotAssign: [TokenSlot, TokenSource][] = [
      ['head', { raid: 'Heart of Fear', boss: 'Grand Empress Shekzeer' }],
      ['shoulders', { raid: 'Terrace of Endless Spring', boss: 'Sha of Fear' }],
      ['chest', { raid: 'Heart of Fear', boss: 'Garalon' }],
      ['gloves', { raid: 'Terrace of Endless Spring', boss: 'Tsulong' }],
      ['legs', { raid: 'Heart of Fear', boss: 'Wind Lord Meljarak' }],
    ]
    return slotAssign.map(([s, f]) => ({ slot: s, nombreSlot: slotName(s), fuente: [f] }))
  }
  if (tier === 'T15') {
    const slotAssign: [TokenSlot, string][] = [
      ['head', 'Lei Shen'],
      ['shoulders', 'Twin Consorts'],
      ['chest', 'Iron Qon'],
      ['gloves', 'Primordius'],
      ['legs', 'Jinrokh the Broken Stormbringer'],
    ]
    return slotAssign.map(([s, b]) => ({ slot: s, nombreSlot: slotName(s), fuente: [{ raid: 'Throne of Thunder', boss: b }] }))
  }
  if (tier === 'T16') {
    const slotAssign: [TokenSlot, string][] = [
      ['head', 'Garrosh Hellscream'],
      ['shoulders', 'Paragons of the Klaxxi'],
      ['chest', 'Siegecrafter Blackfuse'],
      ['gloves', 'Thok the Bloodthirsty'],
      ['legs', 'Malkorok'],
    ]
    return slotAssign.map(([s, b]) => ({ slot: s, nombreSlot: slotName(s), fuente: [{ raid: 'Siege of Orgrimmar', boss: b }] }))
  }
  return []
}

function gruposTier(tier: TokenTier): TokenGroup[] {
  if (tier === 'T4' || tier === 'T5') return ['hero', 'champion', 'defender']
  return ['vanquisher', 'conqueror', 'protector']
}

function dificultadesTier(tier: TokenTier): TokenDifficulty[] {
  if (tier === 'T4' || tier === 'T5' || tier === 'T6' || tier === 'T7' || tier === 'T8' || tier === 'T9' || tier === 'T10' || tier === 'T11' || tier === 'T12') return []
  if (tier === 'T16') return ['rf', 'normal', 'heroic', 'mythic']
  return ['rf', 'normal', 'heroic']
}

function ilvlsForTier(tier: TokenTier): Partial<Record<TokenDifficulty, number>> | undefined {
  if (tier === 'T13') return { rf: 384, normal: 397, heroic: 410 }
  if (tier === 'T14') return { rf: 483, normal: 496, heroic: 509 }
  if (tier === 'T15') return { rf: 502, normal: 522, heroic: 535 }
  if (tier === 'T16') return { rf: 528, normal: 540, heroic: 553, mythic: 566 }
  return undefined
}

function buildTokenName(tier: TokenTier, slot: TokenSlot, grupo: TokenGroup): string {
  const p = tierPrefix(tier)
  const s = slotName(slot)
  const g = grupoSuffix(grupo)
  if (tier === 'T9') return `Regalia of the Grand ${g}`
  if (tier === 'T10') return `${g}'s Mark of Sanctification`
  return `${s} of the ${p} ${g}`
}

function buildId(tier: TokenTier, slot: TokenSlot, grupo: TokenGroup): string {
  return `${tier.toLowerCase()}-${slot}-${grupo}`
}

function buildTokens(): TokenDef[] {
  const out: TokenDef[] = []
  for (const tier of TOKEN_TIERS) {
    const slots = buildSlots(tier)
    const grupos = gruposTier(tier)
    const dificultades = dificultadesTier(tier)
    const ilvls = ilvlsForTier(tier)
    for (const slot of slots) {
      for (const grupo of grupos) {
        if (tier === 'T10') {
          for (const modo of ['normal', 'heroic'] as const) {
            const suffix = modo === 'heroic' ? '-heroic' : ''
            out.push({
              id: `${buildId(tier, slot.slot, grupo)}${suffix}`,
              nombre: buildTokenName(tier, slot.slot, grupo) + (modo === 'heroic' ? ' (Heroic)' : ''),
              tier, slot: slot.slot, grupo,
              clases: clasesGrupo(grupo, tier),
              fuente: slot.fuente,
              dificultades: [],
              ilvls: modo === 'heroic' ? { normal: 277 } : { normal: 264 },
            })
          }
        } else if (tier === 'T9') {
          for (const ilvl of [232, 245, 258] as const) {
            const subId = ilvl === 232 ? '' : ilvl === 245 ? '-245' : '-258'
            out.push({
              id: `${tier.toLowerCase()}-${grupo}${subId}`,
              nombre: ilvl === 258 ? `Regalia of the Grand ${grupoSuffix(grupo)} (ilvl 258)`
                : ilvl === 245 ? `Regalia of the Grand ${grupoSuffix(grupo)} (ilvl 245 + Trophy)`
                : `Regalia of the Grand ${grupoSuffix(grupo)} (ilvl 232)`,
              tier, slot: 'mark', grupo,
              clases: clasesGrupo(grupo, tier),
              fuente: slot.fuente,
              dificultades: [],
              ilvls: { normal: ilvl },
            })
          }
        } else {
          out.push({
            id: buildId(tier, slot.slot, grupo),
            nombre: buildTokenName(tier, slot.slot, grupo),
            tier, slot: slot.slot, grupo,
            clases: clasesGrupo(grupo, tier),
            fuente: slot.fuente,
            dificultades,
            ilvls,
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

export function tokenIdFor(t: TokenDef, d?: TokenDifficulty): string {
  if (d && t.dificultades.includes(d)) return `${t.id}-${d}`
  return t.id
}

export function defaultDifficulty(t: TokenDef): TokenDifficulty | undefined {
  return t.dificultades[0]
}

export function allClasesInRoster(personajes: { clase: string }[]): string[] {
  const set = new Set<string>()
  for (const p of personajes) if (p.clase) set.add(p.clase)
  return [...set].sort()
}