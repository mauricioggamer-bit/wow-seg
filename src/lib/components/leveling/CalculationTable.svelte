<script lang="ts">
  import type { LevelingResult } from '../../types'
  import { formatNumber, formatHours } from '../../leveling/calculator'
  import { clsClass } from '../../constants'

  let {
    results,
    onSelect,
  }: {
    results: LevelingResult[]
    onSelect?: (nombre: string) => void
  } = $props()

  function starString(stars: number): string {
    return '★'.repeat(stars) + '☆'.repeat(5 - stars)
  }
</script>

<div class="lvl-table-wrap">
  <table class="lvl-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Personaje</th>
        <th>Nivel</th>
        <th>Objetivo</th>
        <th>XP restante</th>
        <th>Dungeons</th>
        <th>Horas</th>
        <th>XP/h</th>
        <th>ROI</th>
        <th>Estratégico</th>
      </tr>
    </thead>
    <tbody>
      {#each results as r, i (r.nombre)}
        <tr class:done={r.xpRemaining === 0} onclick={() => onSelect?.(r.nombre)}>
          <td class="lvl-priority">{i + 1}</td>
          <td class="lvl-char">
            <span class="lvl-char-name">{r.nombre}</span>
            <span class="lvl-char-class" style="color: {clsClass(r.clase)}">{r.clase}</span>
          </td>
          <td class="lvl-num">{r.nivel}</td>
          <td class="lvl-num">{r.objetivoNivel}</td>
          <td class="lvl-num">{r.xpRemaining === 0 ? '✓' : formatNumber(r.xpRemaining)}</td>
          <td class="lvl-num">{r.dungeons || '✓'}</td>
          <td class="lvl-num">{r.timeHours === 0 ? '✓' : formatHours(r.timeHours)}</td>
          <td class="lvl-num">{r.xpPerHour > 0 ? formatNumber(r.xpPerHour) : '—'}</td>
          <td class="lvl-num">{r.roi > 0 ? formatHours(r.roi) : '—'}</td>
          <td class="lvl-stars" title={r.strategicText}>{starString(r.strategicStars)}</td>
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
  .lvl-stars {
    color: var(--gold);
    font-size: 0.55rem;
    letter-spacing: -1px;
  }
</style>