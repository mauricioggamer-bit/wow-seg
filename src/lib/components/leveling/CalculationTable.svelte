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

  let viewMode = $state<'both' | 'to80' | 'to90'>('to90')

  const COL_KEY = 'wowseg_lvl_view_mode'
  function loadViewMode(): 'both' | 'to80' | 'to90' {
    try {
      const v = localStorage.getItem(COL_KEY)
      if (v === 'both' || v === 'to80' || v === 'to90') return v
    } catch { /* empty */ }
    return 'to90'
  }
  viewMode = loadViewMode()
  function setViewMode(m: 'both' | 'to80' | 'to90') {
    viewMode = m
    try { localStorage.setItem(COL_KEY, m) } catch { /* empty */ }
  }

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
    return '★'.repeat(stars) + '☆'.repeat(5 - stars)
  }

  function parseReasons(text: string): string[] {
    return text.split(/(?<=\.)\s+/).filter(Boolean).slice(0, 6)
  }

  function getTimewaysPct(nombre: string): number {
    return personajes.find(p => p.nombre === nombre)?.timewaysPct ?? 0
  }
</script>

<div class="lvl-table-wrap">
  <div class="lvl-table-toolbar">
    <div class="lvl-view-toggle">
      <button class="lvl-view-btn" class:active={viewMode === 'to80'} onclick={() => setViewMode('to80')}>→80</button>
      <button class="lvl-view-btn" class:active={viewMode === 'both'} onclick={() => setViewMode('both')}>Ambos</button>
      <button class="lvl-view-btn" class:active={viewMode === 'to90'} onclick={() => setViewMode('to90')}>→90</button>
    </div>
  </div>

  <table class="lvl-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Personaje</th>
        <th>Nivel</th>
        <th class="lvl-col-tw">Timeways</th>
        {#if viewMode !== 'to90'}
          <th class="lvl-col-80">→80 Dungs</th>
          <th class="lvl-col-80">→80 Horas</th>
        {/if}
        {#if viewMode !== 'to80'}
          <th class="lvl-col-90">XP rest.</th>
          <th class="lvl-col-90">→90 Dungs</th>
          <th class="lvl-col-90">→90 Horas</th>
        {/if}
        <th>XP/h</th>
        <th>ROI</th>
        <th>Estratégico</th>
      </tr>
    </thead>
    <tbody>
      {#each results as r, i (r.nombre)}
        <tr class:done={r.done90} class:done80={r.done80 && !r.done90} onclick={() => onSelect?.(r.nombre)}>
          <td class="lvl-priority">{i + 1}</td>
          <td class="lvl-char">
            <span class="lvl-char-name">{r.nombre}</span>
            <span class="lvl-char-class" style="color: {clsClass(r.clase)}">{r.clase}</span>
          </td>
          <td class="lvl-num" onclick={(e) => e.stopPropagation()}>
            {#if editing?.nombre === r.nombre && editing?.field === 'nivel'}
              <button class="lvl-tw-btn" onclick={() => adjustEdit(-1)} disabled={editing.value <= 1}>−</button>
              <span class="lvl-tw-val">{editing.value}</span>
              <button class="lvl-tw-btn" onclick={() => adjustEdit(1)} disabled={editing.value >= 90}>+</button>
              <button class="lvl-edit-yes" onclick={confirmEdit}>✓</button>
              <button class="lvl-edit-no" onclick={cancelEdit}>✗</button>
            {:else}
              <span class="lvl-clickable" onclick={() => startEditNivel(r.nombre)}>{r.nivel}</span>
            {/if}
          </td>
          <td class="lvl-tw-cell" onclick={(e) => e.stopPropagation()}>
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
          </td>
          {#if viewMode !== 'to90'}
            <td class="lvl-num lvl-col-80">{r.done80 ? '✓' : r.dungeonsTo80 || '✓'}</td>
            <td class="lvl-num lvl-col-80">{r.done80 ? '✓' : formatHours(r.timeTo80)}</td>
          {/if}
          {#if viewMode !== 'to80'}
            <td class="lvl-num lvl-col-90">{r.done90 ? '✓' : r.xpTo90 > 0 ? formatNumber(r.xpTo90) : '✓'}</td>
            <td class="lvl-num lvl-col-90">{r.done90 ? '✓' : r.dungeonsTo90 || '✓'}</td>
            <td class="lvl-num lvl-col-90">{r.done90 ? '✓' : formatHours(r.timeTo90)}</td>
          {/if}
          <td class="lvl-num">{r.xpPerHour > 0 ? formatNumber(r.xpPerHour) : '—'}</td>
          <td class="lvl-num">{r.roi > 0 ? `+${formatHours(r.roi)}` : '—'}</td>
          <td class="lvl-strat-cell">
            <div class="lvl-strat-trigger">
              <span class="lvl-stars">{starString(r.strategicStars)}</span>
              <div class="lvl-strat-tip">
                <div class="lvl-tip-score">
                  <span class="lvl-tip-score-bar">
                    <span class="lvl-tip-score-fill" style="width: {r.strategicScore}%"></span>
                  </span>
                  <span class="lvl-tip-score-val">{r.strategicScore}/100</span>
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
  .lvl-table-toolbar {
    display: flex;
    justify-content: flex-end;
    padding: 0 0 4px 0;
  }
  .lvl-view-toggle {
    display: flex;
    gap: 2px;
  }
  .lvl-view-btn {
    background: var(--bg-soft, rgba(0,0,0,0.3));
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 2px 8px;
    font-size: 0.5rem;
    color: var(--text-muted);
    cursor: pointer;
    font-family: var(--font-heading);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .lvl-view-btn.active {
    background: var(--gold);
    color: #000;
    border-color: var(--gold);
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
  .lvl-col-80 { border-right: 1px solid rgba(255,255,255,0.06); }
  .lvl-col-90 { border-left: 1px solid rgba(255,255,255,0.06); }
  .lvl-col-tw { border-left: 1px solid rgba(255,255,255,0.06); border-right: 1px solid rgba(255,255,255,0.06); }
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
  .lvl-table tr.done80 {
    opacity: 0.6;
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