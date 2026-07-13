<script lang="ts">
  import { dataStore, opieRingsStore } from '../../stores/data'

  let { selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string) => void } = $props()

  function newRing() {
    const name = prompt('Nombre del nuevo anillo:', 'Nuevo Anillo')
    if (name === null || !name.trim()) return
    const id = dataStore.addOpieRing({ name: name.trim(), slices: [] })
    onSelect(id)
  }

  function deleteRing(e: MouseEvent, id: string, name: string) {
    e.stopPropagation()
    if (confirm(`¿Eliminar el anillo "${name}"?`)) {
      dataStore.deleteOpieRing(id)
      if (selectedId === id) onSelect('')
    }
  }
</script>

<div class="ring-list wow-panel">
  <div class="wow-panel-header">
    <h3>Anillos</h3>
    <button class="wow-btn wow-btn-sm wow-btn-primary" onclick={newRing}>+ Nuevo anillo</button>
  </div>
  <div class="wow-panel-body rl-body">
    {#each $opieRingsStore as ring (ring.id)}
      <div
        class="rl-item"
        class:active={ring.id === selectedId}
        role="button"
        tabindex="0"
        onclick={() => onSelect(ring.id)}
        onkeydown={(e) => e.key === 'Enter' && onSelect(ring.id)}
      >
        <div class="rl-info">
          <span class="rl-name">{ring.name}</span>
          <span class="rl-meta">{ring.slices.length} slice(s){ring.hotkey ? ' · ' + ring.hotkey : ''}</span>
        </div>
        <button class="rl-del" onclick={(e) => deleteRing(e, ring.id, ring.name)} title="Eliminar">✕</button>
      </div>
    {:else}
      <div class="rl-empty">Sin anillos todavía. Creá uno o importá un string.</div>
    {/each}
  </div>
</div>

<style>
  .rl-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 420px;
    overflow-y: auto;
  }
  .rl-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 6px 8px;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid transparent;
    border-radius: var(--r-sm);
    cursor: pointer;
    transition: all var(--t-fast) var(--ease);
  }
  .rl-item:hover {
    border-color: var(--border-subtle);
  }
  .rl-item.active {
    border-color: var(--gold);
    background: rgba(255, 215, 0, 0.08);
  }
  .rl-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    overflow: hidden;
  }
  .rl-name {
    font-size: 0.7rem;
    color: var(--gold-light);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .rl-meta {
    font-size: 0.55rem;
    color: var(--text-dim);
  }
  .rl-del {
    background: none;
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    font-size: 0.6rem;
    padding: 2px 4px;
    flex-shrink: 0;
  }
  .rl-del:hover {
    color: var(--horde, #c5365a);
  }
  .rl-empty {
    font-size: 0.65rem;
    color: var(--text-dim);
    text-align: center;
    padding: 16px;
  }
</style>
