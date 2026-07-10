<script lang="ts">
  import { formatKeybind, getCategoryForKeybind } from '../../constants/keybinds'
  import type { Slot } from '../../keybinds/types'

  let {
    keybind,
    slot,
    spellName = '',
    spellIconUrl = '',
    onSelect,
  }: {
    keybind: string
    slot: Slot | undefined
    spellName?: string
    spellIconUrl?: string
    onSelect?: (keybind: string) => void
  } = $props()

  let category = $derived(getCategoryForKeybind(keybind))
  let isEmpty = $derived(!slot || slot.type === 'empty' || slot.type === 'emptyBind')
  let catColor = $derived(category?.color ?? '#4a5568')
  let label = $derived(formatKeybind(keybind))

  function getDisplayText(): string {
    if (!slot) return ''
    if (slot.type === 'empty') return ''
    if (slot.type === 'emptyBind') return ''
    if (slot.type === 'spell') return spellName || `#${slot.spellId}`
    if (slot.type === 'macro') return slot.name || 'Macro'
    if (slot.type === 'mount') return 'Mount'
    return ''
  }
</script>

<button
  class="kb-slot"
  class:empty={isEmpty}
  style="--cat-color: {catColor}"
  onclick={() => onSelect?.(keybind)}
  title={keybind + (spellName ? ' — ' + spellName : '')}
>
  <span class="kb-label">{label}</span>
  {#if spellIconUrl && !isEmpty}
    <img class="kb-icon" src={spellIconUrl} alt={spellName} />
  {/if}
  <span class="kb-name">{getDisplayText()}</span>
</button>

<style>
  .kb-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    width: 52px;
    min-height: 52px;
    padding: 2px;
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    background: rgba(0, 0, 0, 0.4);
    cursor: pointer;
    transition: all var(--t-fast) var(--ease);
    position: relative;
    overflow: hidden;
    gap: 1px;
  }
  .kb-slot:hover {
    border-color: var(--gold);
    box-shadow: 0 0 4px var(--cat-color);
  }
  .kb-slot.empty {
    opacity: 0.4;
  }
  .kb-slot::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--cat-color);
    opacity: 0.30;
    pointer-events: none;
  }
  .kb-label {
    font-family: var(--font-heading);
    font-size: 0.5rem;
    color: var(--cat-color);
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
    z-index: 1;
    line-height: 1;
  }
  .kb-icon {
    width: 28px;
    height: 28px;
    border-radius: 2px;
    z-index: 1;
    image-rendering: pixelated;
  }
  .kb-name {
    font-size: 0.45rem;
    color: var(--text-secondary);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 48px;
    z-index: 1;
    line-height: 1.1;
  }
</style>
