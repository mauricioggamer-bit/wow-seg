<script lang="ts">
  import { KEYBIND_LAYOUT } from '../../constants/keybinds'
  import type { KeybindState, SpellInfo } from '../../keybinds/types'
  import KeybindSlot from './KeybindSlot.svelte'

  let {
    parsed,
    spellData = {},
    onSelect,
  }: {
    parsed: KeybindState
    spellData: Record<number, SpellInfo>
    onSelect?: (keybind: string) => void
  } = $props()
</script>

<div class="kb-keyboard">
  {#each KEYBIND_LAYOUT as zone, i}
    {@const prevZone = i > 0 ? KEYBIND_LAYOUT[i - 1] : undefined}
    {@const showGroup = zone.group && zone.group !== prevZone?.group}
    {#if showGroup}
      <div class="kb-group-label">{zone.group}</div>
    {/if}
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
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }
  .kb-zone-label {
    font-family: var(--font-heading);
    font-size: 0.5rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    white-space: nowrap;
    min-width: 56px;
    text-align: right;
  }
  .kb-group-label {
    font-family: var(--font-heading);
    font-size: 0.55rem;
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-top: 8px;
    margin-bottom: 2px;
    padding-left: 2px;
  }
  .kb-zone-keys {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }
</style>
