export type SliceActionType =
  | ''
  | 'spell'
  | 'item'
  | 'macro'
  | 'toy'
  | 'mount'
  | 'ring'
  | 'extrabutton'
  | 'opie.databroker.launcher'
  | 'imptext'
  | 'quest'
  | 'specset'
  | 'raidmark'
  | 'worldmark'
  | 'peq'
  | 'uipanel'
  | 'housing'

export type RingRotationMode = 'cycle' | 'shuffle' | 'random' | 'reset' | 'jump'

export interface OpieSlice {
  type: SliceActionType
  arg?: string | number
  flags?: number
  icon?: string | number
  label?: string
  show?: string
  color?: string
  embed?: boolean
  rotationMode?: RingRotationMode
  fastClick?: boolean
  extra?: Record<string, unknown>
}

export interface OpieRing {
  id: string
  name: string
  hotkey?: string
  limit?: string
  internal?: boolean
  embed?: boolean
  onOpen?: number
  noOpportunisticCA?: boolean
  noPersistentCA?: boolean
  skipSpecs?: string[]
  offset?: number
  slices: OpieSlice[]
  extra?: Record<string, unknown>
  orden?: number
}
