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

  let mainZones = $derived(KEYBIND_LAYOUT.filter(z => z.group === 'Main'))
  let assistZones = $derived(KEYBIND_LAYOUT.filter(z => z.group === 'Assist'))
</script>

<div class="kb-keyboard">
  <div class="kb-group-panel">
    <div class="kb-group-label">Assist</div>
    <div class="kb-group-grid">
      {#each assistZones as zone}
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
      {/each}
    </div>
  </div>
  <div class="kb-group-panel">
    <div class="kb-group-label">Main</div>
    <div class="kb-group-grid">
      {#each mainZones as zone}
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
      {/each}
    </div>
  </div>
</div>

<style>
  .kb-keyboard {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .kb-group-panel {
    min-width: 0;
  }
  .kb-group-label {
    font-family: var(--font-heading);
    font-size: 0.55rem;
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 6px;
    padding-left: 2px;
  }
  .kb-group-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 6px;
    align-items: center;
  }
  .kb-zone-label {
    grid-column: 1;
    font-family: var(--font-heading);
    font-size: 0.5rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    white-space: nowrap;
    text-align: right;
  }
  .kb-zone-keys {
    grid-column: 2;
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }
</style>
