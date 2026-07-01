<script lang="ts">
  import { KEYBIND_LAYOUT } from '../../constants/keybinds'
  import type { KeybindState } from '../../keybinds/types'
  import KeybindSlot from './KeybindSlot.svelte'

  let {
    parsed,
    spellData = {},
    onSelect,
  }: {
    parsed: KeybindState
    spellData: Record<number, { name: string; iconUrl: string }>
    onSelect?: (keybind: string) => void
  } = $props()
</script>

<div class="kb-keyboard">
  {#each KEYBIND_LAYOUT as zone}
    <div class="kb-zone">
      <div class="kb-zone-label">{zone.label}</div>
      <div class="kb-zone-keys">
        {#each zone.keybinds as kb}
          {@const slot = parsed.keybindMap[kb]}
          {@const spellId = slot?.type === 'spell' ? slot.spellId : 0}
          {@const info = spellId ? spellData[spellId] : undefined}
          <KeybindSlot
            keybind={kb}
            {slot}
            spellName={info?.name ?? ''}
            spellIconUrl={info?.iconUrl ?? ''}
            {onSelect}
          />
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .kb-keyboard {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .kb-zone {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .kb-zone-label {
    font-family: var(--font-heading);
    font-size: 0.5rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding-left: 2px;
  }
  .kb-zone-keys {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }
</style>
