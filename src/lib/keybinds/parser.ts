import type { KeybindState, Slot, SpellSlot, MacroSlot, MountSlot, EmptySlot, EmptyBindSlot } from './types'

function safeAtob(str: string): string {
  try {
    return atob(str)
  } catch {
    const padded = str + '='.repeat((4 - (str.length % 4)) % 4)
    return atob(padded)
  }
}

export function parseKeybindString(base64String: string): KeybindState {
  const raw = safeAtob(base64String)
  const entries = raw.split('|').filter(Boolean)
  const result: KeybindState = {
    header: null,
    slots: {},
    keybindMap: {},
  }

  for (const entry of entries) {
    if (entry.startsWith('0,_header,')) {
      const parts = entry.split(',')
      result.header = {
        className: parts[2],
        specId: parseInt(parts[3]),
      }
      continue
    }

    if (entry.includes('#5')) {
      const slotNum = parseInt(entry.split('#')[0])
      if (isNaN(slotNum)) continue
      const slot: EmptySlot = { type: 'empty', slotNum, keybind: '' }
      result.slots[slotNum] = slot
      continue
    }

    if (entry.includes('#4')) {
      const [slotPart, ...rest] = entry.split(',')
      const slotNum = parseInt(slotPart.split('#')[0])
      if (isNaN(slotNum)) continue
      const slot: EmptyBindSlot = {
        type: 'emptyBind',
        slotNum,
        keybind: rest[0] || '',
        keybind2: rest[1] || '',
      }
      result.slots[slotNum] = slot
      continue
    }

    const parts = entry.split(',')
    const slotNum = parseInt(parts[0])
    if (isNaN(slotNum)) continue

    const entryType = parts[1]

    if (entryType === 'spell') {
      const slot: SpellSlot = {
        type: 'spell',
        slotNum,
        spellId: parseInt(parts[2]),
        keybind: parts[4] || '',
        keybind2: parts[5] || '',
      }
      result.slots[slotNum] = slot
    } else if (entryType === 'macro') {
      const nameB64 = parts[6] || ''
      const bodyB64 = parts[7] || ''
      const slot: MacroSlot = {
        type: 'macro',
        slotNum,
        macroId: parts[2],
        keybind: parts[4] || '',
        name: nameB64 ? safeAtob(nameB64) : '',
        body: bodyB64 ? safeAtob(bodyB64) : '',
      }
      result.slots[slotNum] = slot
    } else if (entryType === 'summonmount') {
      const slot: MountSlot = {
        type: 'mount',
        slotNum,
        mountId: parts[2],
        keybind: parts[4] || '',
        keybind2: parts[5] || '',
      }
      result.slots[slotNum] = slot
    }
  }

  for (const slot of Object.values(result.slots)) {
    if (slot.keybind) {
      result.keybindMap[slot.keybind] = slot
    }
  }

  return result
}

export { safeAtob }
