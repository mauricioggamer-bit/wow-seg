<script lang="ts">
  import { searchSpells, getSpellInfo } from '../../keybinds/spellService'
  import type { SpellInfo } from '../../keybinds/types'

  let {
    selectedId,
    onSelect,
    onClose,
  }: {
    selectedId?: number
    onSelect: (id: number, info: SpellInfo) => void
    onClose: () => void
  } = $props()

  let query = $state('')
  let results = $state<SpellInfo[]>([])

  let currentInfo = $derived(selectedId ? getSpellInfo(selectedId) : null)

  $effect(() => {
    results = searchSpells(query, 30)
  })

  function pick(id: number) {
    onSelect(id, getSpellInfo(id))
    onClose()
  }
</script>

<div
  class="modal-overlay open"
  onclick={onClose}
  role="dialog"
  tabindex="-1"
  onkeydown={(e) => e.key === 'Escape' && onClose()}
>
  <div class="modal-content spell-picker" onclick={(e) => e.stopPropagation()} role="presentation">
    <div class="modal-header">
      <h3>Elegir hechizo</h3>
      <button class="modal-close" onclick={onClose}>✕</button>
    </div>
    <div class="modal-body">
      <input
        type="text"
        class="sp-search"
        placeholder="Buscar hechizo por nombre..."
        bind:value={query}
      />
      {#if currentInfo}
        <div class="sp-selected">
          {#if currentInfo.iconUrl}
            <img src={currentInfo.iconUrl} alt={currentInfo.name} class="sp-selected-icon" />
          {/if}
          <div class="sp-selected-info">
            <span class="sp-selected-name">{currentInfo.name}</span>
            <span class="sp-selected-id">ID: {selectedId}</span>
          </div>
        </div>
      {/if}
      <div class="sp-results">
        {#each results as spell (spell.id)}
          <button
            class="sp-item"
            class:selected={spell.id === selectedId}
            onclick={() => pick(spell.id)}
          >
            {#if spell.iconUrl}
              <img src={spell.iconUrl} alt={spell.name} class="sp-icon" />
            {/if}
            <span class="sp-name">{spell.name}</span>
            <span class="sp-id">{spell.id}</span>
          </button>
        {/each}
        {#if query.length >= 2 && results.length === 0}
          <div class="sp-no-results">Sin resultados</div>
        {/if}
      </div>
    </div>
    <div class="modal-footer">
      <button class="wow-btn wow-btn-sm" onclick={onClose}>Cerrar</button>
    </div>
  </div>
</div>

<style>
  .spell-picker {
    max-width: 420px;
  }
  .sp-search {
    width: 100%;
    padding: 4px 8px;
    font-size: 0.65rem;
    background: var(--input-bg);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    color: var(--text-primary);
    margin-bottom: 6px;
  }
  .sp-search:focus {
    outline: none;
    border-color: var(--gold);
  }
  .sp-selected {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    margin-bottom: 6px;
    background: rgba(255, 215, 0, 0.08);
    border: 1px solid var(--gold);
    border-radius: var(--r-sm);
  }
  .sp-selected-icon {
    width: 24px;
    height: 24px;
    border-radius: 2px;
  }
  .sp-selected-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .sp-selected-name {
    font-size: 0.65rem;
    color: var(--gold-light);
    font-weight: 600;
  }
  .sp-selected-id {
    font-size: 0.5rem;
    color: var(--text-dim);
  }
  .sp-results {
    display: flex;
    flex-direction: column;
    gap: 1px;
    max-height: 280px;
    overflow-y: auto;
  }
  .sp-item {
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
  .sp-item:hover {
    border-color: var(--border-subtle);
    background: rgba(0, 0, 0, 0.5);
  }
  .sp-item.selected {
    border-color: var(--gold);
    background: rgba(255, 215, 0, 0.1);
  }
  .sp-icon {
    width: 20px;
    height: 20px;
    border-radius: 2px;
    flex-shrink: 0;
  }
  .sp-name {
    font-size: 0.6rem;
    color: var(--text-secondary);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sp-id {
    font-size: 0.5rem;
    color: var(--text-dim);
    flex-shrink: 0;
  }
  .sp-no-results {
    font-size: 0.6rem;
    color: var(--text-dim);
    text-align: center;
    padding: 12px;
  }
</style>
