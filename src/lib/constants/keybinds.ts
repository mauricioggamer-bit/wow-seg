export const SLOT_TO_KEYBIND: Record<number, string> = {
  1: '1', 2: '2', 3: '3', 4: '4', 5: 'Q', 6: 'E', 7: 'R', 8: 'F',
  9: 'T', 10: 'G', 11: '-', 12: '=',
  25: 'SHIFT-Z', 26: 'SHIFT-X', 27: 'SHIFT-C', 28: 'SHIFT-V',
  29: 'Z', 30: 'X', 31: 'C', 32: 'V',
  33: 'BUTTON5', 34: 'BUTTON4',
  35: 'MOUSEWHEELUP', 36: 'MOUSEWHEELDOWN',
  37: 'ALT-Z', 38: 'ALT-X', 39: 'ALT-C', 40: 'ALT-V',
  41: 'CTRL-Z', 42: 'CTRL-X', 43: 'CTRL-C', 44: 'CTRL-V',
  49: 'CTRL-1', 50: 'CTRL-2', 51: 'CTRL-3', 52: 'CTRL-4',
  53: 'CTRL-Q', 54: 'CTRL-E', 55: 'CTRL-R', 56: 'CTRL-F',
  57: 'CTRL-T', 58: 'CTRL-G', 59: 'CTRL-B',
  61: 'SHIFT-1', 62: 'SHIFT-2', 63: 'SHIFT-3', 64: 'SHIFT-4',
  65: 'SHIFT-Q', 66: 'SHIFT-E', 67: 'SHIFT-R', 68: 'SHIFT-F',
  69: 'SHIFT-T', 70: 'SHIFT-G', 71: 'SHIFT-B',
  145: 'ALT-1', 146: 'ALT-2', 147: 'ALT-3', 148: 'ALT-4',
  149: 'ALT-Q', 150: 'ALT-E', 151: 'ALT-R', 152: 'ALT-F',
  153: 'ALT-T', 154: 'ALT-G', 155: 'ALT-B',
  183: 'F1', 184: 'F2', 185: 'F3', 186: 'F4', 187: 'F5', 188: 'F6',
}

export const KEYBIND_TO_SLOT: Record<string, number> = Object.fromEntries(
  Object.entries(SLOT_TO_KEYBIND).map(([slot, kb]) => [kb, parseInt(slot)])
)

export interface KeybindCategory {
  key: string
  label: string
  color: string
  keybinds: string[]
}

export const KEYBIND_CATEGORIES: KeybindCategory[] = [
  { key: 'COMBAT', label: 'Combat', color: '#e53e3e', keybinds: ['1','2','3','4','Q','E','R','F','T','G','-','='] },
  { key: 'EXTRAS', label: 'Extra Keys', color: '#4a5568', keybinds: [] },
  { key: 'DEFENSIVE', label: 'Defensive', color: '#3182ce', keybinds: ['Z','SHIFT-Z','CTRL-Z'] },
  { key: 'MOVEMENT', label: 'Movement', color: '#38a169', keybinds: ['X','SHIFT-X','CTRL-X'] },
  { key: 'CC', label: 'CC / Interrupt', color: '#805ad5', keybinds: ['C','SHIFT-C','CTRL-C','V','SHIFT-V','CTRL-V'] },
  { key: 'COMBAT_SHIFT', label: 'Combat (Shift)', color: '#dd6b20', keybinds: ['SHIFT-1','SHIFT-2','SHIFT-3','SHIFT-4','SHIFT-Q','SHIFT-E','SHIFT-R','SHIFT-F','SHIFT-T','SHIFT-G','SHIFT-B',''] },
  { key: 'SELF_HEAL', label: 'Self Heal', color: '#2c7a7b', keybinds: ['CTRL-1','CTRL-2','CTRL-3','CTRL-4','CTRL-Q','CTRL-E','CTRL-R','CTRL-F','CTRL-T','CTRL-G','CTRL-B',''] },
  { key: 'ITEMS', label: 'Items / Alt', color: '#553c9a', keybinds: ['ALT-1','ALT-2','ALT-3','ALT-4','ALT-Q','ALT-E','ALT-R','ALT-F','ALT-T','ALT-G','ALT-B',''] },
  { key: 'PVP', label: 'PvP / Misc', color: '#702459', keybinds: ['ALT-Z','ALT-X','ALT-C','ALT-V'] },
  { key: 'MOUSE', label: 'Mouse', color: '#4a5568', keybinds: ['BUTTON4','BUTTON5','MOUSEWHEELUP','MOUSEWHEELDOWN'] },
  { key: 'FKEYS', label: 'F-Keys / Stances', color: '#2d3748', keybinds: ['F1','F2','F3','F4','F5','F6'] },
]

const categoryMap: Map<string, KeybindCategory> = new Map()
for (const cat of KEYBIND_CATEGORIES) {
  for (const kb of cat.keybinds) categoryMap.set(kb, cat)
}

export function getCategoryForKeybind(keybind: string): KeybindCategory | undefined {
  return categoryMap.get(keybind)
}

export interface KeybindZone {
  label: string
  categoryKey: string
  keybinds: string[]
}

export const KEYBIND_LAYOUT: KeybindZone[] = [
  { label: 'Alt Row', categoryKey: 'ITEMS', keybinds: ['ALT-1','ALT-2','ALT-3','ALT-4','ALT-Q','ALT-E','ALT-R','ALT-F','ALT-T','ALT-G','ALT-B',''] },
  { label: 'Ctrl Row', categoryKey: 'SELF_HEAL', keybinds: ['CTRL-1','CTRL-2','CTRL-3','CTRL-4','CTRL-Q','CTRL-E','CTRL-R','CTRL-F','CTRL-T','CTRL-G','CTRL-B',''] },
  { label: 'Shift Row', categoryKey: 'COMBAT_SHIFT', keybinds: ['SHIFT-1','SHIFT-2','SHIFT-3','SHIFT-4','SHIFT-Q','SHIFT-E','SHIFT-R','SHIFT-F','SHIFT-T','SHIFT-G','SHIFT-B',''] },
  { label: 'Combat', categoryKey: 'COMBAT', keybinds: ['1','2','3','4','Q','E','R','F','T','G','-','='] },
  { label: 'Z X C V', categoryKey: 'DEFENSIVE', keybinds: ['Z','X','C','V'] },
  { label: '\u21E7 Z X C V', categoryKey: 'DEFENSIVE', keybinds: ['SHIFT-Z','SHIFT-X','SHIFT-C','SHIFT-V'] },
  { label: '^ Z X C V', categoryKey: 'DEFENSIVE', keybinds: ['CTRL-Z','CTRL-X','CTRL-C','CTRL-V'] },
  { label: '\u2325 Z X C V', categoryKey: 'PVP', keybinds: ['ALT-Z','ALT-X','ALT-C','ALT-V'] },
  { label: 'Mouse & F-Keys', categoryKey: 'MOUSE', keybinds: ['BUTTON4','BUTTON5','MOUSEWHEELUP','MOUSEWHEELDOWN','F1','F2','F3','F4','F5','F6'] },
]

export function formatKeybind(kb: string): string {
  return kb
    .replace('SHIFT-', '\u21E7')
    .replace('CTRL-', '^')
    .replace('ALT-', '\u2325')
    .replace('BUTTON4', '\uD83D\uDDA14')
    .replace('BUTTON5', '\uD83D\uDDA15')
    .replace('MOUSEWHEELUP', '\uD83D\uDDA1\u2191')
    .replace('MOUSEWHEELDOWN', '\uD83D\uDDA1\u2193')
}
