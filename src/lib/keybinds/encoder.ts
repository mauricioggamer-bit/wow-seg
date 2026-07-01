import type { KeybindState } from './types'

function safeBtoa(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
}

export function encodeKeybindString(state: KeybindState): string {
  const { header, slots } = state

  const parts: string[] = []

  if (header) {
    parts.push(`0,_header,${header.className},${header.specId},,`)
  }

  const sortedSlots = Object.values(slots).sort((a, b) => a.slotNum - b.slotNum)

  for (const slot of sortedSlots) {
    let entry = ''

    switch (slot.type) {
      case 'empty':
        entry = `${slot.slotNum}#5,`
        break

      case 'emptyBind': {
        const k2 = slot.keybind2 || ''
        entry = `${slot.slotNum}#4,${slot.keybind},${k2}`
        break
      }

      case 'spell': {
        const k2 = slot.keybind2 || ''
        entry = `${slot.slotNum},spell,${slot.spellId},spell,${slot.keybind},${k2}`
        break
      }

      case 'macro': {
        const nameB64 = safeBtoa(slot.name || '')
        const bodyB64 = safeBtoa(slot.body || '')
        entry = `${slot.slotNum},macro,${slot.macroId},${slot.macroId},${slot.keybind},,${nameB64},${bodyB64},c`
        break
      }

      case 'mount': {
        const k2 = slot.keybind2 || ''
        entry = `${slot.slotNum},summonmount,${slot.mountId},,${slot.keybind},${k2}`
        break
      }
    }

    if (entry) parts.push(entry)
  }

  const raw = parts.join('|') + '|'
  return safeBtoa(raw)
}

export { safeBtoa }
