<script lang="ts">
  import { dataStore } from '../../stores/data'
  import type { StrategicIndex, StrategicCategory, EntityType } from '../../types'

  type Column = { id: string; label: string; color: string; icon: string }
  type ExtraRow = { label: string; values: Record<string, number> }

  let { entityType, columns, indexes, categories, rowLabel = 'Modificador', extraRows = [], extraRowsLabel = 'Fijos' }: {
    entityType: EntityType
    columns: Column[]
    indexes: StrategicIndex[]
    categories: StrategicCategory[]
    rowLabel?: string
    extraRows?: ExtraRow[]
    extraRowsLabel?: string
  } = $props()

  let applicableIndexes = $derived(
    indexes.filter(i => !i.entityTypes || i.entityTypes.includes(entityType))
  )

  let groups = $derived(
    categories.map(cat => ({
      catId: cat.id,
      label: cat.label,
      items: applicableIndexes.filter(i => (i.context ?? 'general') === cat.id),
    }))
  )

  let collapsed = $state<Set<string>>(new Set())

  function toggleCollapse(catId: string) {
    const next = new Set(collapsed)
    if (next.has(catId)) next.delete(catId)
    else next.add(catId)
    collapsed = next
  }

  let liveValues = $derived($dataStore.strategicConfig?.values ?? {})

  function cellValue(colId: string, indexId: string): number | undefined {
    return liveValues[dataStore.valueKey(entityType, colId, indexId)]
  }

  function setCell(colId: string, indexId: string, raw: string) {
    const trimmed = raw.trim()
    if (trimmed === '') {
      dataStore.resetStrategicValue(entityType, colId, indexId)
      return
    }
    const v = parseInt(trimmed)
    if (!isNaN(v)) dataStore.setStrategicValue(entityType, colId, indexId, Math.max(0, Math.min(100, v)))
  }

  function totalFor(colId: string): number {
    const idxSum = applicableIndexes.reduce((sum, idx) => sum + (cellValue(colId, idx.id) ?? 0), 0)
    const extraSum = extraRows.reduce((sum, r) => sum + (r.values[colId] ?? 0), 0)
    return idxSum + extraSum
  }

  function deleteRow(idx: StrategicIndex) {
    if (confirm(`Eliminar ventaja "${idx.name}"? Se borran sus valores en todas las columnas.`)) {
      dataStore.deleteIndex(idx.id)
    }
  }

  let addingCat = $state<string | null>(null)
  let addingName = $state('')

  function startAdd(catId: string) {
    addingCat = catId
    addingName = ''
  }

  function cancelAdd() {
    addingCat = null
    addingName = ''
  }

  function confirmAdd(catId: string) {
    const name = addingName.trim()
    if (!name) { cancelAdd(); return }
    let id = 'idx_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_')
    if (!dataStore.addIndex({ id, name, description: '', context: catId, entityTypes: [entityType] })) {
      id = id + '_' + Date.now().toString(36)
      dataStore.addIndex({ id, name, description: '', context: catId, entityTypes: [entityType] })
    }
    cancelAdd()
  }
</script>

<div class="cmx-root">
  <p class="sv-hint">Las categorías se crean, renombran y borran desde "⚙ Categorías" (arriba). Cada fila es una ventaja; el "+" de cada categoría crea una nueva directamente.</p>

  <div class="cmx-scroll">
    <table class="cmx-table">
      <thead>
        <tr>
          <th class="cmx-corner">{rowLabel}</th>
          {#each columns as c (c.id)}
            <th class="cmx-class-head">
              <span class="cmx-class-head-text" style="color:{c.color}">{c.icon} {c.label}</span>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each groups as group (group.catId)}
          <tr class="cmx-cat-row">
            <td class="cmx-cat-cell" colspan={columns.length + 1}>
              <button class="cmx-collapse-btn" onclick={() => toggleCollapse(group.catId)}>
                {collapsed.has(group.catId) ? '▸' : '▾'} {group.label}
              </button>
              {#if addingCat === group.catId}
                <input
                  type="text"
                  class="sv-text-input"
                  placeholder="Nombre de la ventaja"
                  bind:value={addingName}
                  autofocus
                  onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmAdd(group.catId) } else if (e.key === 'Escape') { e.preventDefault(); cancelAdd() } }}
                />
                <button class="sv-btn-add" onclick={() => confirmAdd(group.catId)}>✓</button>
                <button class="cmx-cancel-btn" onclick={cancelAdd}>✕</button>
              {:else}
                <button class="cmx-add-btn" title="Nueva ventaja en {group.label}" onclick={() => startAdd(group.catId)}>+</button>
              {/if}
            </td>
          </tr>
          {#if !collapsed.has(group.catId)}
            {#each group.items as idx (idx.id)}
              <tr class="cmx-row">
                <td class="cmx-row-label">
                  <span>{idx.name}</span>
                  <button class="cmx-del-btn" title="Eliminar ventaja" onclick={() => deleteRow(idx)}>✕</button>
                </td>
                {#each columns as c (c.id)}
                  <td class="cmx-cell">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      class="cmx-input"
                      value={cellValue(c.id, idx.id) ?? ''}
                      onchange={(e) => setCell(c.id, idx.id, e.currentTarget.value)}
                    />
                  </td>
                {/each}
              </tr>
            {/each}
            {#if group.items.length === 0}
              <tr class="cmx-row">
                <td class="cmx-row-empty" colspan={columns.length + 1}>Sin ventajas en esta categoría todavía.</td>
              </tr>
            {/if}
          {/if}
        {/each}
        {#if extraRows.length > 0}
          <tr class="cmx-cat-row">
            <td class="cmx-cat-cell" colspan={columns.length + 1}>
              <span class="cmx-collapse-btn cmx-static-label">{extraRowsLabel}</span>
            </td>
          </tr>
          {#each extraRows as row (row.label)}
            <tr class="cmx-row">
              <td class="cmx-row-label"><span>{row.label}</span></td>
              {#each columns as c (c.id)}
                <td class="cmx-cell cmx-cell-readonly">{row.values[c.id] ?? ''}</td>
              {/each}
            </tr>
          {/each}
        {/if}
      </tbody>
      <tfoot>
        <tr class="cmx-total-row">
          <td class="cmx-row-label">Total</td>
          {#each columns as c (c.id)}
            <td class="cmx-total-cell">{totalFor(c.id)}</td>
          {/each}
        </tr>
      </tfoot>
    </table>
  </div>
</div>

<style>
  .cmx-root {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .cmx-scroll {
    overflow: auto;
    max-height: 65vh;
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
  }
  .cmx-table {
    border-collapse: collapse;
    width: 100%;
    font-size: 0.6rem;
  }
  .cmx-corner {
    position: sticky;
    left: 0;
    top: 0;
    z-index: 3;
    background: var(--bg-card);
    min-width: 160px;
    text-align: left;
    padding: 4px 6px;
    border-bottom: 1px solid var(--border-main);
    border-right: 1px solid var(--border-subtle);
  }
  .cmx-class-head {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-main);
    border-left: 1px solid var(--border-subtle);
    padding: 6px 2px;
    height: 90px;
    vertical-align: bottom;
    text-align: center;
  }
  .cmx-class-head-text {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    white-space: nowrap;
    font-family: var(--font-heading);
    font-size: 0.6rem;
    letter-spacing: 0.04em;
  }
  .cmx-cat-row td {
    background: var(--bg-soft);
    border-top: 1px solid var(--border-subtle);
    border-bottom: 1px solid var(--border-subtle);
    padding: 4px 6px;
  }
  .cmx-cat-cell {
    position: sticky;
    left: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .cmx-collapse-btn {
    background: transparent;
    border: none;
    color: var(--gold);
    cursor: pointer;
    font-family: var(--font-heading);
    font-size: 0.62rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 0;
  }
  .cmx-add-btn {
    background: transparent;
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.6rem;
    width: 16px;
    height: 16px;
    line-height: 1;
    padding: 0;
    margin-left: auto;
  }
  .cmx-add-btn:hover {
    border-color: var(--gold);
    color: var(--gold);
  }
  .cmx-cancel-btn {
    background: transparent;
    border: none;
    color: var(--danger);
    cursor: pointer;
    font-size: 0.6rem;
    padding: 0 2px;
  }
  .cmx-row-label {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--bg-base);
    min-width: 160px;
    max-width: 220px;
    padding: 3px 6px;
    border-right: 1px solid var(--border-subtle);
    border-bottom: 1px solid var(--border-subtle);
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .cmx-del-btn {
    background: transparent;
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    font-size: 0.55rem;
    padding: 0 2px;
    flex-shrink: 0;
  }
  .cmx-del-btn:hover {
    color: var(--danger);
  }
  .cmx-row-empty {
    padding: 4px 6px;
    color: var(--text-dim);
    font-style: italic;
    font-size: 0.55rem;
  }
  .cmx-cell {
    border-bottom: 1px solid var(--border-subtle);
    border-left: 1px solid var(--border-subtle);
    padding: 1px;
    text-align: center;
  }
  .cmx-cell-readonly {
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }
  .cmx-static-label {
    cursor: default;
  }
  .cmx-input {
    width: 36px;
    padding: 2px 1px;
    border: 1px solid transparent;
    border-radius: var(--r-sm);
    background: transparent;
    color: var(--text-primary);
    font-size: 0.6rem;
    text-align: center;
  }
  .cmx-input:hover {
    border-color: var(--border-subtle);
  }
  .cmx-input:focus {
    outline: none;
    border-color: var(--gold);
    background: var(--input-bg);
  }
  .cmx-input::-webkit-outer-spin-button,
  .cmx-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .cmx-input[type='number'] {
    appearance: textfield;
    -moz-appearance: textfield;
  }
  .cmx-total-row td {
    border-top: 2px solid var(--gold);
    background: var(--bg-soft);
  }
  .cmx-total-row .cmx-row-label {
    background: var(--bg-soft);
    font-weight: bold;
    color: var(--gold);
  }
  .cmx-total-cell {
    text-align: center;
    color: var(--gold-light);
    font-weight: bold;
  }
</style>
