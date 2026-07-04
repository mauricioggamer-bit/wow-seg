<script lang="ts">
  import {
    saveDungeonXpOverrides,
    clearDungeonXpOverrides,
    getDungeonXpOverrides,
    rebuildDungeonXpCurve,
    getDungeonXpForLevel,
    DUNGEON_XP_TABLE,
  } from '../../constants/experience'
  import Modal from './Modal.svelte'

  let { open = $bindable(false) }: { open?: boolean } = $props()

  let overrides = $state<Record<number, number>>(getDungeonXpOverrides())
  let filter = $state<'all' | '10-30' | '31-60' | '61-90'>('all')
  let editingLevel = $state<number | null>(null)
  let editValue = $state<string>('')

  let filteredRows = $derived(
    DUNGEON_XP_TABLE.filter(r => {
      if (filter === 'all') return true
      if (filter === '10-30') return r.level >= 10 && r.level <= 30
      if (filter === '31-60') return r.level >= 31 && r.level <= 60
      return r.level >= 61 && r.level <= 90
    })
  )

  function startEdit(level: number) {
    editingLevel = level
    const current = overrides[level]
    editValue = current !== undefined ? String(current) : String(getDungeonXpForLevel(level))
  }

  function commitEdit() {
    if (editingLevel === null) return
    const val = parseInt(editValue)
    if (!isNaN(val) && val > 0) {
      const next = { ...overrides, [editingLevel]: val }
      overrides = next
      saveDungeonXpOverrides(next)
      rebuildDungeonXpCurve()
    }
    editingLevel = null
    editValue = ''
  }

  function cancelEdit() {
    editingLevel = null
    editValue = ''
  }

  function clearOverride(level: number) {
    const next = { ...overrides }
    delete next[level]
    overrides = next
    saveDungeonXpOverrides(next)
    rebuildDungeonXpCurve()
  }

  function clearAll() {
    overrides = {}
    clearDungeonXpOverrides()
    rebuildDungeonXpCurve()
  }

  function fmt(n: number): string {
    return n.toLocaleString('es-ES')
  }
</script>

<Modal bind:open title="XP por Mazmorra — Tabla editable (10-90)">
  <div class="dxp-modal">
    <div class="dxp-toolbar">
      <div class="dxp-filters">
        <button class="dxp-filter-btn" class:active={filter === 'all'} onclick={() => filter = 'all'}>Todos</button>
        <button class="dxp-filter-btn" class:active={filter === '10-30'} onclick={() => filter = '10-30'}>10-30</button>
        <button class="dxp-filter-btn" class:active={filter === '31-60'} onclick={() => filter = '31-60'}>31-60</button>
        <button class="dxp-filter-btn" class:active={filter === '61-90'} onclick={() => filter = '61-90'}>61-90</button>
      </div>
      <button class="wow-btn wow-btn-sm dxp-clear" onclick={clearAll} disabled={Object.keys(overrides).length === 0}>
        Restaurar todo
      </button>
    </div>

    <div class="dxp-note">
      Edita la XP de recompensa por nivel. Vacío = interpolación automática. Los niveles con override se resaltan.
      <strong>{Object.keys(overrides).length} niveles editados</strong>
    </div>

    <div class="dxp-list">
      {#each filteredRows as row (row.level)}
        <div class="dxp-row" class:overridden={overrides[row.level] !== undefined}>
          <span class="dxp-lvl">Nv {row.level}</span>
          {#if editingLevel === row.level}
            <input
              type="number"
              class="dxp-input"
              bind:value={editValue}
              onkeydown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
              onblur={commitEdit}
            />
            <span class="dxp-hint">↵ guardar</span>
          {:else}
            <span class="dxp-val">{fmt(overrides[row.level] ?? row.xp)} XP</span>
            <button class="dxp-edit" onclick={() => startEdit(row.level)}>✎</button>
            {#if overrides[row.level] !== undefined}
              <button class="dxp-reset" onclick={() => clearOverride(row.level)} title="Restaurar">↺</button>
            {/if}
          {/if}
        </div>
      {/each}
    </div>
  </div>
</Modal>

<style>
  .dxp-modal { display: flex; flex-direction: column; gap: 8px; }
  .dxp-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap; }
  .dxp-filters { display: flex; gap: 3px; }
  .dxp-filter-btn {
    background: var(--bg-soft, rgba(0,0,0,0.3));
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 3px 8px;
    font-size: 0.55rem;
    color: var(--text-muted);
    cursor: pointer;
    font-family: var(--font-heading);
  }
  .dxp-filter-btn.active {
    background: var(--gold, #d4af37);
    color: #000;
    border-color: var(--gold);
  }
  .dxp-clear { font-size: 0.5rem; }
  .dxp-note {
    font-size: 0.5rem;
    color: var(--text-dim);
    font-style: italic;
    padding: 4px 6px;
    background: rgba(0,0,0,0.2);
    border-radius: var(--r-sm);
  }
  .dxp-note strong { color: var(--gold-light, #d4af37); font-style: normal; margin-left: 4px; }
  .dxp-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
    max-height: 60vh;
    overflow-y: auto;
    padding-right: 3px;
  }
  .dxp-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 6px;
    background: rgba(255,255,255,0.02);
    border-radius: var(--r-sm);
    font-size: 0.55rem;
  }
  .dxp-row.overridden {
    background: rgba(56, 161, 105, 0.1);
    border-left: 2px solid var(--green, #38a169);
  }
  .dxp-lvl {
    color: var(--gold);
    font-family: var(--font-heading);
    font-weight: 600;
    width: 50px;
    flex-shrink: 0;
  }
  .dxp-val {
    color: var(--text-secondary);
    flex: 1;
    font-variant-numeric: tabular-nums;
  }
  .dxp-input {
    flex: 1;
    background: var(--input-bg);
    border: 1px solid var(--gold);
    border-radius: var(--r-sm);
    padding: 2px 4px;
    font-size: 0.55rem;
    color: var(--text-primary);
    width: 100px;
  }
  .dxp-hint { font-size: 0.45rem; color: var(--text-dim); }
  .dxp-edit, .dxp-reset {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.6rem;
    padding: 0 3px;
    color: var(--text-muted);
  }
  .dxp-edit:hover { color: var(--gold); }
  .dxp-reset:hover { color: var(--horde, #c5365a); }
</style>