<script lang="ts">
  import { dataStore } from '../../stores/data'
  import { CLASS_MAP, PERS_CLASS_COLORS, PERS_CLASS_ICONS } from '../../constants'
  import type { StrategicIndex, StrategicCategory } from '../../types'

  let { indexes, categories }: {
    indexes: StrategicIndex[]
    categories: StrategicCategory[]
  } = $props()

  let classEntries = $derived(
    Object.entries(CLASS_MAP)
      .map(([label, key]) => ({
        label,
        key,
        color: PERS_CLASS_COLORS[key] || '#c69b3a',
        icon: PERS_CLASS_ICONS[key] || '❓',
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  )

  let applicableIndexes = $derived(
    indexes.filter(i => !i.entityTypes || i.entityTypes.includes('class'))
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

  function cellValue(className: string, indexId: string): number | undefined {
    return liveValues[dataStore.valueKey('class', className, indexId)]
  }

  function setCell(className: string, indexId: string, raw: string) {
    const trimmed = raw.trim()
    if (trimmed === '') {
      dataStore.resetStrategicValue('class', className, indexId)
      return
    }
    const v = parseInt(trimmed)
    if (!isNaN(v)) dataStore.setStrategicValue('class', className, indexId, Math.max(0, Math.min(100, v)))
  }

  function totalFor(className: string): number {
    return applicableIndexes.reduce((sum, idx) => sum + (cellValue(className, idx.id) ?? 0), 0)
  }

  function deleteRow(idx: StrategicIndex) {
    if (confirm(`Eliminar ventaja "${idx.name}"? Se borran sus valores en todas las clases.`)) {
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
    if (!dataStore.addIndex({ id, name, description: '', context: catId, entityTypes: ['class'] })) {
      id = id + '_' + Date.now().toString(36)
      dataStore.addIndex({ id, name, description: '', context: catId, entityTypes: ['class'] })
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
          <th class="cmx-corner">Modificador</th>
          {#each classEntries as c (c.key)}
            <th class="cmx-class-head">
              <span class="cmx-class-head-text" style="color:{c.color}">{c.icon} {c.label}</span>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each groups as group (group.catId)}
          <tr class="cmx-cat-row">
            <td class="cmx-cat-cell" colspan={classEntries.length + 1}>
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
                {#each classEntries as c (c.key)}
                  <td class="cmx-cell">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      class="cmx-input"
                      value={cellValue(c.label, idx.id) ?? ''}
                      onchange={(e) => setCell(c.label, idx.id, e.currentTarget.value)}
                    />
                  </td>
                {/each}
              </tr>
            {/each}
            {#if group.items.length === 0}
              <tr class="cmx-row">
                <td class="cmx-row-empty" colspan={classEntries.length + 1}>Sin ventajas en esta categoría todavía.</td>
              </tr>
            {/if}
          {/if}
        {/each}
      </tbody>
      <tfoot>
        <tr class="cmx-total-row">
          <td class="cmx-row-label">Total</td>
          {#each classEntries as c (c.key)}
            <td class="cmx-total-cell">{totalFor(c.label)}</td>
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
