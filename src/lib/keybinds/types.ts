export interface KeybindHeader {
  className: string
  specId: number
}

export type SlotType = 'spell' | 'macro' | 'mount' | 'empty' | 'emptyBind'

export interface BaseSlot {
  type: SlotType
  slotNum: number
  keybind: string
  keybind2?: string
}

export interface SpellSlot extends BaseSlot {
  type: 'spell'
  spellId: number
}

export interface MacroSlot extends BaseSlot {
  type: 'macro'
  macroId: string
  name: string
  body: string
}

export interface MountSlot extends BaseSlot {
  type: 'mount'
  mountId: string
}

export interface EmptySlot extends BaseSlot {
  type: 'empty'
}

export interface EmptyBindSlot extends BaseSlot {
  type: 'emptyBind'
}

export type Slot = SpellSlot | MacroSlot | MountSlot | EmptySlot | EmptyBindSlot

export interface KeybindState {
  header: KeybindHeader | null
  slots: Record<number, Slot>
  keybindMap: Record<string, Slot>
}

export interface SpellInfo {
  id: number
  name: string
  iconUrl: string
  description?: string
}
