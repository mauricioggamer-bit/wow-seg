<script lang="ts">
  import type { LevelingResult, Personaje } from '../../types'
  import { dataStore } from '../../stores/data'
  import { formatNumber, formatHours } from '../../format'
  import { clsClass } from '../../constants'

  let {
    results,
    personajes,
    onSelect,
  }: {
    results: LevelingResult[]
    personajes: Personaje[]
    onSelect?: (nombre: string) => void
  } = $props()

  type SortField = 'nombre' | 'nivel' | 'objetivo' | 'maxTareaNivel' | 'dungeonsTo90' | 'timeTo90' | 'xpPerHour' | 'strategicScore'

  let sortField: SortField | null = $state(null)
  let sortDir: 'asc' | 'desc' = $state('asc')

  let filterName = $state('')
  let filterLevel = $state('')
  let filterObj = $state('')
  let filterTarea = $state('')
  let filterDungs = $state('')
  let filterHoras = $state('')
  let filterXp = $state('')
  let filterScore = $state('')

  let filteredResults = $derived(
    results
      .filter(r => {
        if (filterName && !r.nombre.toLowerCase().includes(filterName.toLowerCase())) return false
        if (filterLevel) {
          const lvl = parseInt(filterLevel)
          if (!isNaN(lvl) && r.nivel !== lvl) return false
        }
        if (filterObj) {
          const v = parseInt(filterObj)
          if (!isNaN(v) && r.objetivo !== v) return false
        }
        if (filterTarea) {
          const v = parseInt(filterTarea)
          if (!isNaN(v) && (r.maxTareaNivel ?? 0) !== v) return false
        }
        if (filterDungs) {
          const v = parseInt(filterDungs)
          if (!isNaN(v) && (r.doneObjetivo ? 0 : r.dungeonsTo90) !== v) return false
        }
        if (filterHoras) {
          const v = parseInt(filterHoras)
          if (!isNaN(v) && Math.round(r.doneObjetivo ? 0 : r.timeTo90) !== v) return false
        }
        if (filterXp) {
          const v = parseInt(filterXp)
          if (!isNaN(v) && Math.round(r.xpPerHour) !== v) return false
        }
        if (filterScore) {
          const v = parseInt(filterScore)
          if (!isNaN(v) && Math.round(r.strategicScore) !== v) return false
        }
        return true
      })
      .sort((a, b) => {
        if (!sortField) return 0
        let cmp = 0
        switch (sortField) {
          case 'nombre': cmp = a.nombre.localeCompare(b.nombre); break
          case 'nivel': cmp = a.nivel - b.nivel; break
          case 'objetivo': cmp = a.objetivo - b.objetivo; break
          case 'maxTareaNivel': cmp = (a.maxTareaNivel ?? 0) - (b.maxTareaNivel ?? 0); break
          case 'dungeonsTo90': cmp = (a.doneObjetivo ? 0 : a.dungeonsTo90) - (b.doneObjetivo ? 0 : b.dungeonsTo90); break
          case 'timeTo90': cmp = (a.doneObjetivo ? 0 : a.timeTo90) - (b.doneObjetivo ? 0 : b.timeTo90); break
          case 'xpPerHour': cmp = a.xpPerHour - b.xpPerHour; break
          case 'strategicScore': cmp = a.strategicScore - b.strategicScore; break
        }
        return sortDir === 'asc' ? cmp : -cmp
      })
  )

  let editing = $state<{nombre: string; field: 'timeways' | 'nivel'; value: number} | null>(null)
  let originalValue = $state<number>(0)

  function startEditTimeways(nombre: string) {
    const v = personajes.find(p => p.nombre === nombre)?.timewaysPct ?? 0
    editing = { nombre, field: 'timeways', value: v }
    originalValue = v
  }

  function startEditNivel(nombre: string) {
    const v = personajes.find(p => p.nombre === nombre)?.nivel ?? 0
    editing = { nombre, field: 'nivel', value: v }
    originalValue = v
  }

  function adjustEdit(delta: number) {
    if (!editing) return
    if (editing.field === 'timeways') {
      editing = { ...editing, value: Math.max(0, Math.min(30, editing.value + delta)) }
    } else {
      editing = { ...editing, value: Math.max(1, Math.min(90, editing.value + delta)) }
    }
  }

  function confirmEdit() {
    if (!editing) return
    if (editing.field === 'timeways') {
      dataStore.updateTimewaysPct(editing.nombre, editing.value)
    } else if (editing.field === 'nivel') {
      dataStore.updateNivel(editing.nombre, editing.value)
    }
    editing = null
  }

  function cancelEdit() {
    editing = null
  }

  function starString(stars: number): string {
    const s = Math.max(0, Math.min(5, Math.round(stars)))
    return '★'.repeat(s) + '☆'.repeat(5 - s)
  }

  function parseReasons(text: string): string[] {
    return text.split(/(?<=\.)\s+/).filter(Boolean).slice(0, 6)
  }

  function getTimewaysPct(nombre: string): number {
    return personajes.find(p => p.nombre === nombre)?.timewaysPct ?? 0
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      if (sortDir === 'asc') { sortDir = 'desc' }
      else { sortField = null; sortDir = 'asc' }
    } else {
      sortField = field
      sortDir = 'asc'
    }
  }

  function sortArrow(field: SortField): string {
    if (sortField !== field) return ''
    return sortDir === 'asc' ? ' ▲' : ' ▼'
  }
</script>

  <div class="lvl-table-wrap">
    <table class="lvl-table">
      <thead>
        <tr>
          <th>#</th>
          <th class="lvl-th-sort" onclick={() => toggleSort('nombre')}>Personaje{sortArrow('nombre')}</th>
          <th class="lvl-th-sort lvl-th-num" onclick={() => toggleSort('nivel')}>Nivel{sortArrow('nivel')}</th>
          <th class="lvl-th-sort lvl-th-num" onclick={() => toggleSort('objetivo')}>Obj{sortArrow('objetivo')}</th>
          <th class="lvl-col-tarea lvl-th-sort lvl-th-num" onclick={() => toggleSort('maxTareaNivel')}>Tarea max{sortArrow('maxTareaNivel')}</th>
          <th class="lvl-col-tw">Timeways</th>
          <th class="lvl-col-obj lvl-th-sort lvl-th-num" onclick={() => toggleSort('dungeonsTo90')}>→Obj Dungs{sortArrow('dungeonsTo90')}</th>
          <th class="lvl-col-obj lvl-th-sort lvl-th-num" onclick={() => toggleSort('timeTo90')}>→Obj Horas{sortArrow('timeTo90')}</th>
          <th class="lvl-th-sort lvl-th-num" onclick={() => toggleSort('xpPerHour')}>XP/h{sortArrow('xpPerHour')}</th>
          <th class="lvl-th-sort lvl-th-num" onclick={() => toggleSort('strategicScore')}>Estratégico{sortArrow('strategicScore')}</th>
        </tr>
        <tr class="lvl-filter-row">
          <td></td>
          <td><input type="text" class="lvl-filt-inp" placeholder="…" bind:value={filterName} /></td>
          <td><input type="text" class="lvl-filt-inp lvl-filt-num" placeholder="…" bind:value={filterLevel} /></td>
          <td><input type="text" class="lvl-filt-inp lvl-filt-num" placeholder="…" bind:value={filterObj} /></td>
          <td><input type="text" class="lvl-filt-inp lvl-filt-num" placeholder="…" bind:value={filterTarea} /></td>
          <td></td>
          <td><input type="text" class="lvl-filt-inp lvl-filt-num" placeholder="…" bind:value={filterDungs} /></td>
          <td><input type="text" class="lvl-filt-inp lvl-filt-num" placeholder="…" bind:value={filterHoras} /></td>
          <td><input type="text" class="lvl-filt-inp lvl-filt-num" placeholder="…" bind:value={filterXp} /></td>
          <td><input type="text" class="lvl-filt-inp lvl-filt-num" placeholder="…" bind:value={filterScore} /></td>
        </tr>
      </thead>
      <tbody>
        {#each filteredResults as r, i (r.nombre)}
          <tr class:done={r.doneObjetivo} onclick={() => onSelect?.(r.nombre)}>
            <td class="lvl-priority">{i + 1}</td>
            <td class="lvl-char">
              <span class="lvl-char-name">{r.nombre}</span>
              <span class="lvl-char-class" style="color: {clsClass(r.clase)}">{r.clase}</span>
            </td>
            <td class="lvl-num">
              <div class="lvl-tw-cell" onclick={(e) => e.stopPropagation()}>
                {#if editing?.nombre === r.nombre && editing?.field === 'nivel'}
                  <button class="lvl-tw-btn" onclick={() => adjustEdit(-1)} disabled={editing.value <= 1}>−</button>
                  <span class="lvl-tw-val">{editing.value}</span>
                  <button class="lvl-tw-btn" onclick={() => adjustEdit(1)} disabled={editing.value >= 90}>+</button>
                  <button class="lvl-edit-yes" onclick={confirmEdit}>✓</button>
                  <button class="lvl-edit-no" onclick={cancelEdit}>✗</button>
                {:else}
                  <button class="lvl-tw-btn" onclick={() => { startEditNivel(r.nombre); editing!.value = Math.max(1, r.nivel - 1) }} disabled={r.nivel <= 1}>−</button>
                  <span class="lvl-clickable" onclick={() => startEditNivel(r.nombre)}>{r.nivel}</span>
                  <button class="lvl-tw-btn" onclick={() => { startEditNivel(r.nombre); editing!.value = Math.min(90, r.nivel + 1) }} disabled={r.nivel >= 90}>+</button>
                {/if}
              </div>
            </td>
            <td class="lvl-num">{r.objetivo}</td>
            <td class="lvl-num lvl-col-tarea" class:lvl-col-tarea-warn={r.maxTareaNivel != null && r.nivel < r.maxTareaNivel}>
              {#if r.maxTareaNivel != null}
                {r.maxTareaNivel}
              {:else}
                <span class="lvl-no-tarea-icon" title="Sin tarea de nivel — objetivo automático {r.objetivo}">⚡</span>
              {/if}
            </td>
            <td class="lvl-col-tw" onclick={(e) => e.stopPropagation()}>
              <div class="lvl-tw-cell">
                {#if editing?.nombre === r.nombre && editing?.field === 'timeways'}
                  <button class="lvl-tw-btn" onclick={() => adjustEdit(-5)} disabled={editing.value <= 0}>−</button>
                  <span class="lvl-tw-val">+{editing.value}%</span>
                  <button class="lvl-tw-btn" onclick={() => adjustEdit(5)} disabled={editing.value >= 30}>+</button>
                  <button class="lvl-edit-yes" onclick={confirmEdit}>✓</button>
                  <button class="lvl-edit-no" onclick={cancelEdit}>✗</button>
                {:else}
                  <button class="lvl-tw-btn" onclick={() => { startEditTimeways(r.nombre); editing!.value = Math.max(0, getTimewaysPct(r.nombre) - 5) }} disabled={getTimewaysPct(r.nombre) <= 0}>−</button>
                  <span class="lvl-clickable" onclick={() => startEditTimeways(r.nombre)}>+{getTimewaysPct(r.nombre)}%</span>
                  <button class="lvl-tw-btn" onclick={() => { startEditTimeways(r.nombre); editing!.value = Math.min(30, getTimewaysPct(r.nombre) + 5) }} disabled={getTimewaysPct(r.nombre) >= 30}>+</button>
                {/if}
              </div>
            </td>
            <td class="lvl-num lvl-col-obj">{r.doneObjetivo ? '✓' : r.dungeonsTo90}</td>
            <td class="lvl-num lvl-col-obj">{r.doneObjetivo ? '✓' : formatHours(r.timeTo90)}</td>
            <td class="lvl-num">{r.xpPerHour > 0 ? formatNumber(r.xpPerHour) : '—'}</td>
            <td class="lvl-strat-cell">
              <div class="lvl-strat-trigger">
                <span class="lvl-stars">{starString(r.strategicStars)}</span>
                <div class="lvl-strat-tip">
                  <div class="lvl-tip-score">
                    <span class="lvl-tip-score-bar">
                      <span class="lvl-tip-score-fill" style="width: {r.strategicScore}%"></span>
                    </span>
                    <span class="lvl-tip-score-val">{r.strategicScore}%</span>
                  </div>
                  {#if r.warbandImpact > 0}
                    <div class="lvl-tip-impact">Warband impact: +{r.warbandImpact}%</div>
                  {/if}
                  <ul class="lvl-tip-reasons">
                    {#each parseReasons(r.strategicText) as reason}
                      <li>{reason}</li>
                    {/each}
                  </ul>
                </div>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

<style>
  .lvl-table-wrap {
    overflow-x: auto;
  }
  .lvl-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.6rem;
  }
  .lvl-table th {
    text-align: left;
    padding: 4px 6px;
    font-family: var(--font-heading);
    font-size: 0.5rem;
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--border-subtle);
    white-space: nowrap;
  }
  .lvl-th-sort { cursor: pointer; user-select: none; }
  .lvl-th-sort:hover { color: var(--gold-light, #d4af37); }
  .lvl-th-num { text-align: right; }
  .lvl-col-tw { border-left: 1px solid rgba(255,255,255,0.06); border-right: 1px solid rgba(255,255,255,0.06); }
  .lvl-filter-row td { padding: 1px 6px; border-bottom: 1px solid var(--border-subtle); }
  .lvl-filt-inp {
    background: var(--input-bg);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 1px 4px;
    font-size: 0.5rem;
    color: var(--text-primary);
    width: 100%;
    box-sizing: border-box;
  }
  .lvl-filt-inp::placeholder { color: var(--text-dim); }
  .lvl-filt-inp:focus { outline: none; border-color: var(--gold); }
  .lvl-filt-num { text-align: right; width: 100%; }
  .lvl-col-obj { border-left: 1px solid rgba(255,255,255,0.06); }
  .lvl-col-tarea { border-left: 1px solid rgba(255,255,255,0.06); min-width: 28px; max-width: 40px; }
  .lvl-col-tarea-warn { color: var(--horde, #f97316); font-weight: 700; }
  .lvl-no-tarea-icon { cursor: help; opacity: 0.5; font-size: 0.55rem; }
  .lvl-table td {
    padding: 3px 6px;
    border-bottom: 1px solid var(--border-subtle);
    color: var(--text-secondary);
    white-space: nowrap;
  }
  .lvl-table tr {
    cursor: pointer;
    transition: background var(--t-fast) var(--ease);
  }
  .lvl-table tr:hover {
    background: rgba(255, 215, 0, 0.05);
  }
  .lvl-table tr.done {
    opacity: 0.4;
  }
  .lvl-priority {
    color: var(--gold);
    font-weight: 600;
    font-family: var(--font-heading);
    width: 24px;
  }
  .lvl-char {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .lvl-char-name {
    font-weight: 600;
    color: var(--text-primary);
  }
  .lvl-char-class {
    font-size: 0.5rem;
  }
  .lvl-num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .lvl-tw-cell {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: default;
  }
  .lvl-tw-btn {
    width: 18px;
    height: 18px;
    border: 1px solid var(--gold);
    background: transparent;
    color: var(--gold);
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.7rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  .lvl-tw-btn:hover:not(:disabled) {
    background: var(--gold);
    color: var(--bg, #000);
  }
  .lvl-tw-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .lvl-tw-val {
    font-size: 0.5rem;
    color: var(--gold-light, #d4af37);
    font-family: var(--font-heading);
    white-space: nowrap;
    min-width: 32px;
  }
  .lvl-strat-cell {
    position: relative;
  }
  .lvl-strat-trigger {
    position: relative;
    cursor: help;
  }
  .lvl-stars {
    color: var(--gold);
    font-size: 0.55rem;
    letter-spacing: -1px;
  }
  .lvl-strat-tip {
    display: none;
    position: absolute;
    bottom: 100%;
    right: 0;
    margin-bottom: 4px;
    background: var(--bg-panel, #1a1a1a);
    border: 1px solid var(--gold, #d4af37);
    border-radius: var(--r-sm);
    padding: 6px 8px;
    width: 240px;
    max-width: 80vw;
    z-index: 50;
    box-shadow: 0 4px 16px rgba(0,0,0,0.6);
    pointer-events: none;
  }
  .lvl-edit-yes, .lvl-edit-no {
    width: 18px;
    height: 18px;
    border: 1px solid var(--border-subtle);
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.65rem;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: transparent;
  }
  .lvl-edit-yes {
    color: var(--green, #38a169);
    border-color: var(--green, #38a169);
  }
  .lvl-edit-yes:hover {
    background: var(--green, #38a169);
    color: #000;
  }
  .lvl-edit-no {
    color: var(--horde, #c5365a);
    border-color: var(--horde, #c5365a);
  }
  .lvl-edit-no:hover {
    background: var(--horde, #c5365a);
    color: #fff;
  }
  .lvl-clickable {
    cursor: pointer;
    padding: 2px 4px;
    border-radius: var(--r-sm);
  }
  .lvl-clickable:hover {
    background: rgba(255, 215, 0, 0.1);
  }
  .lvl-strat-trigger:hover .lvl-strat-tip {
    display: block;
  }
  .lvl-tip-score {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;
  }
  .lvl-tip-score-bar {
    flex: 1;
    height: 6px;
    background: rgba(0,0,0,0.4);
    border-radius: 3px;
    overflow: hidden;
    display: block;
  }
  .lvl-tip-score-fill {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, var(--gold), var(--gold-light, #d4af37));
    border-radius: 3px;
  }
  .lvl-tip-score-val {
    font-size: 0.45rem;
    color: var(--gold-light, #d4af37);
    font-family: var(--font-heading);
  }
  .lvl-tip-impact {
    font-size: 0.45rem;
    color: var(--green, #38a169);
    margin-bottom: 3px;
  }
  .lvl-tip-reasons {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .lvl-tip-reasons li {
    font-size: 0.45rem;
    color: var(--text-secondary);
    padding: 1px 0 1px 8px;
    position: relative;
  }
  .lvl-tip-reasons li::before {
    content: '▸';
    position: absolute;
    left: 0;
    color: var(--gold);
  }
</style>