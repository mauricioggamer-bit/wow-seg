<script lang="ts">
  import { untrack } from 'svelte'
  import { formatKeybind, KEYBIND_TO_SLOT } from '../../constants/keybinds'
  import { searchSpells, getSpellInfo } from '../../keybinds/spellService'
  import type { Slot, SpellInfo } from '../../keybinds/types'

  let {
    keybind,
    slot,
    spellData,
    onSave,
    onClose,
  }: {
    keybind: string
    slot: Slot | undefined
    spellData: Record<number, SpellInfo>
    onSave: (newSlot: Slot) => void
    onClose: () => void
  } = $props()

  let slotNum = $derived(KEYBIND_TO_SLOT[keybind] ?? 0)

  let activeTab = $state<'spell' | 'macro' | 'mount' | 'clear'>(untrack(() =>
    slot?.type === 'spell' ? 'spell' :
    slot?.type === 'macro' ? 'macro' :
    slot?.type === 'mount' ? 'mount' : 'spell'
  ))

  let spellQuery = $state('')
  let spellResults = $state<SpellInfo[]>([])
  let selectedSpellId = $state(untrack(() => slot?.type === 'spell' ? slot.spellId : 0))

  let macroName = $state(untrack(() => slot?.type === 'macro' ? slot.name : ''))
  let macroBody = $state(untrack(() => slot?.type === 'macro' ? slot.body : ''))
  let macroId = $state(untrack(() => slot?.type === 'macro' ? slot.macroId : '1'))

  let mountQuery = $state('')
  let mountResults = $state<SpellInfo[]>([])
  let selectedMountId = $state(untrack(() => slot?.type === 'mount' ? parseInt(slot.mountId) : 0))

  let currentInfo = $derived(
    selectedSpellId ? getSpellInfo(selectedSpellId) : null
  )
  let currentMountInfo = $derived(
    selectedMountId ? getSpellInfo(selectedMountId) : null
  )

  $effect(() => {
    spellResults = searchSpells(spellQuery, 30)
  })

  $effect(() => {
    mountResults = searchSpells(mountQuery, 30)
  })

  function selectSpell(id: number) {
    selectedSpellId = id
  }

  function selectMount(id: number) {
    selectedMountId = id
  }

  function save() {
    const base = { slotNum, keybind, keybind2: slot?.keybind2 ?? '' }

    if (activeTab === 'spell' && selectedSpellId) {
      onSave({ ...base, type: 'spell', spellId: selectedSpellId })
    } else if (activeTab === 'macro') {
      onSave({
        ...base,
        type: 'macro',
        macroId: macroId || '1',
        name: macroName,
        body: macroBody,
      })
    } else if (activeTab === 'mount' && selectedMountId) {
      onSave({ ...base, type: 'mount', mountId: String(selectedMountId) })
    } else if (activeTab === 'clear') {
      onSave({ type: 'emptyBind', slotNum, keybind, keybind2: '' })
    }
  }

  function clearSlot() {
    activeTab = 'clear'
  }
</script>

<div
  class="modal-overlay open"
  onclick={onClose}
  role="dialog"
  tabindex="-1"
  onkeydown={(e) => e.key === 'Escape' && onClose()}
>
  <div class="modal-content slot-editor" onclick={(e) => e.stopPropagation()} role="presentation">
    <div class="modal-header">
      <h3>Slot {formatKeybind(keybind)} <span class="slot-num">#{slotNum}</span></h3>
      <button class="modal-close" onclick={onClose}>✕</button>
    </div>
    <div class="modal-body">
      <div class="kb-tabs">
        <button class="kb-tab" class:active={activeTab === 'spell'} onclick={() => activeTab = 'spell'}>Spell</button>
        <button class="kb-tab" class:active={activeTab === 'macro'} onclick={() => activeTab = 'macro'}>Macro</button>
        <button class="kb-tab" class:active={activeTab === 'mount'} onclick={() => activeTab = 'mount'}>Mount</button>
        <button class="kb-tab kb-tab-clear" class:active={activeTab === 'clear'} onclick={clearSlot}>Clear</button>
      </div>

      {#if activeTab === 'spell'}
        <div class="kb-tab-content">
          <input
            type="text"
            class="kb-search"
            placeholder="Search spell name..."
            bind:value={spellQuery}
          />
          {#if currentInfo}
            <div class="kb-selected">
              {#if currentInfo.iconUrl}
                <img src={currentInfo.iconUrl} alt={currentInfo.name} class="kb-selected-icon" />
              {/if}
              <div class="kb-selected-info">
                <span class="kb-selected-name">{currentInfo.name}</span>
                <span class="kb-selected-id">ID: {selectedSpellId}</span>
              </div>
            </div>
          {/if}
          <div class="kb-search-results">
            {#each spellResults as spell (spell.id)}
              <button
                class="kb-search-item"
                class:selected={spell.id === selectedSpellId}
                onclick={() => selectSpell(spell.id)}
              >
                {#if spell.iconUrl}
                  <img src={spell.iconUrl} alt={spell.name} class="kb-search-icon" />
                {/if}
                <span class="kb-search-name">{spell.name}</span>
                <span class="kb-search-id">{spell.id}</span>
              </button>
            {/each}
            {#if spellQuery.length >= 2 && spellResults.length === 0}
              <div class="kb-no-results">No spells found</div>
            {/if}
          </div>
        </div>
      {:else if activeTab === 'macro'}
        <div class="kb-tab-content">
          <label class="kb-field">
            <span>Macro ID</span>
            <input type="text" bind:value={macroId} placeholder="1" />
          </label>
          <label class="kb-field">
            <span>Name</span>
            <input type="text" bind:value={macroName} placeholder="Macro name" />
          </label>
          <label class="kb-field">
            <span>Body</span>
            <textarea bind:value={macroBody} rows="4" placeholder="#showtooltip&#10;/cast ..." style="width:100%;font-family:monospace;font-size:0.6rem"></textarea>
          </label>
        </div>
      {:else if activeTab === 'mount'}
        <div class="kb-tab-content">
          <input
            type="text"
            class="kb-search"
            placeholder="Search mount name..."
            bind:value={mountQuery}
          />
          {#if currentMountInfo}
            <div class="kb-selected">
              {#if currentMountInfo.iconUrl}
                <img src={currentMountInfo.iconUrl} alt={currentMountInfo.name} class="kb-selected-icon" />
              {/if}
              <div class="kb-selected-info">
                <span class="kb-selected-name">{currentMountInfo.name}</span>
                <span class="kb-selected-id">ID: {selectedMountId}</span>
              </div>
            </div>
          {/if}
          <div class="kb-search-results">
            {#each mountResults as mt (mt.id)}
              <button
                class="kb-search-item"
                class:selected={mt.id === selectedMountId}
                onclick={() => selectMount(mt.id)}
              >
                {#if mt.iconUrl}
                  <img src={mt.iconUrl} alt={mt.name} class="kb-search-icon" />
                {/if}
                <span class="kb-search-name">{mt.name}</span>
                <span class="kb-search-id">{mt.id}</span>
              </button>
            {/each}
            {#if mountQuery.length >= 2 && mountResults.length === 0}
              <div class="kb-no-results">No mounts found</div>
            {/if}
          </div>
        </div>
      {:else if activeTab === 'clear'}
        <div class="kb-tab-content">
          <div class="kb-clear-confirm">
            <p>This will clear the keybind <strong>{formatKeybind(keybind)}</strong> (slot #{slotNum}).</p>
            <p class="kb-clear-note">The slot will remain in the bar but with no action assigned.</p>
          </div>
        </div>
      {/if}
    </div>
    <div class="modal-footer">
      <button class="wow-btn wow-btn-sm" onclick={onClose}>Cancel</button>
      <button class="wow-btn wow-btn-sm wow-btn-primary" onclick={save}>Save</button>
    </div>
  </div>
</div>

<style>
  .slot-editor {
    max-width: 420px;
  }
  .slot-num {
    font-size: 0.6rem;
    color: var(--text-muted);
    font-weight: 400;
    margin-left: 4px;
  }
  .kb-tabs {
    display: flex;
    gap: 2px;
    border-bottom: 1px solid var(--border-subtle);
    margin-bottom: 8px;
  }
  .kb-tab {
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-muted);
    font-size: 0.6rem;
    font-family: var(--font-heading);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 4px 10px;
    cursor: pointer;
    transition: all var(--t-fast) var(--ease);
  }
  .kb-tab:hover {
    color: var(--text-secondary);
  }
  .kb-tab.active {
    color: var(--gold);
    border-bottom-color: var(--gold);
  }
  .kb-tab-clear.active {
    color: var(--horde, #c5365a);
    border-bottom-color: var(--horde, #c5365a);
  }
  .kb-tab-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 360px;
    overflow-y: auto;
  }
  .kb-search {
    width: 100%;
    padding: 4px 8px;
    font-size: 0.65rem;
    background: var(--input-bg);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    color: var(--text-primary);
  }
  .kb-search:focus {
    outline: none;
    border-color: var(--gold);
  }
  .kb-selected {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    background: rgba(255, 215, 0, 0.08);
    border: 1px solid var(--gold);
    border-radius: var(--r-sm);
  }
  .kb-selected-icon {
    width: 24px;
    height: 24px;
    border-radius: 2px;
  }
  .kb-selected-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .kb-selected-name {
    font-size: 0.65rem;
    color: var(--gold-light, #d4af37);
    font-weight: 600;
  }
  .kb-selected-id {
    font-size: 0.5rem;
    color: var(--text-dim);
  }
  .kb-search-results {
    display: flex;
    flex-direction: column;
    gap: 1px;
    max-height: 240px;
    overflow-y: auto;
  }
  .kb-search-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 6px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid transparent;
    border-radius: var(--r-sm);
    cursor: pointer;
    transition: all var(--t-fast) var(--ease);
    text-align: left;
    width: 100%;
  }
  .kb-search-item:hover {
    border-color: var(--border-subtle);
    background: rgba(0, 0, 0, 0.5);
  }
  .kb-search-item.selected {
    border-color: var(--gold);
    background: rgba(255, 215, 0, 0.1);
  }
  .kb-search-icon {
    width: 20px;
    height: 20px;
    border-radius: 2px;
    flex-shrink: 0;
  }
  .kb-search-name {
    font-size: 0.6rem;
    color: var(--text-secondary);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .kb-search-id {
    font-size: 0.5rem;
    color: var(--text-dim);
    flex-shrink: 0;
  }
  .kb-no-results {
    font-size: 0.6rem;
    color: var(--text-dim);
    text-align: center;
    padding: 12px;
  }
  .kb-field {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .kb-field span {
    font-size: 0.55rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .kb-field input,
  .kb-field textarea {
    background: var(--input-bg);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 4px 6px;
    font-size: 0.6rem;
    color: var(--text-primary);
  }
  .kb-field input:focus,
  .kb-field textarea:focus {
    outline: none;
    border-color: var(--gold);
  }
  .kb-clear-confirm {
    padding: 12px 6px;
    text-align: center;
  }
  .kb-clear-confirm p {
    font-size: 0.65rem;
    color: var(--text-secondary);
    margin-bottom: 6px;
  }
  .kb-clear-note {
    color: var(--text-dim) !important;
    font-size: 0.55rem !important;
  }
</style>
