<script lang="ts">
  import type { StrategicValueResult } from '../../types'
  import { STAR_THRESHOLDS } from '../../constants'

  let { strategic }: { strategic: StrategicValueResult } = $props()

  interface RowDef {
    label: string
    weight: string
    calc: (s: StrategicValueResult) => number
    raw: (s: StrategicValueResult) => number
    desc: string
  }

  const INTRINSIC_ROWS: RowDef[] = [
    { label: 'Proximidad al nivel máx.', weight: '×25', calc: (s: StrategicValueResult) => s.proximityToMaxLevel * 25, raw: (s: StrategicValueResult) => s.proximityToMaxLevel, desc: 'Qué tan cerca está del nivel máximo configurado.' },
    { label: 'Cercanía obj.', weight: '×25', calc: (s: StrategicValueResult) => s.closenessToObjective * 25, raw: (s: StrategicValueResult) => s.closenessToObjective, desc: 'Menos dungeons = más puntaje.' },
    { label: 'Profesiones', weight: '×15', calc: (s: StrategicValueResult) => s.professionValue * 15, raw: (s: StrategicValueResult) => s.professionValue, desc: 'Puntos estratégicos de las profesiones del personaje.' },
    { label: 'Bono Raza-Profesión', weight: 'fijo', calc: (s: StrategicValueResult) => s.raceProfBonus, raw: (s: StrategicValueResult) => s.raceProfBonus, desc: 'Bonos raciales si la profesión coincide.' },
    { label: 'Tareas', weight: 'fijo', calc: (s: StrategicValueResult) => s.taskValue, raw: (s: StrategicValueResult) => s.taskValue, desc: 'Puntos estratégicos de tareas.' },
    { label: 'Bonus <90', weight: '+10', calc: (s: StrategicValueResult) => s.bonusSub90 * 10, raw: (s: StrategicValueResult) => s.bonusSub90, desc: 'Fijo si está por debajo de 90.' },
    { label: 'Bonus 80-89', weight: '+15', calc: (s: StrategicValueResult) => s.bonus8089 * 15, raw: (s: StrategicValueResult) => s.bonus8089, desc: 'Fijo si está en 80-89.' },
    { label: 'Ventajas', weight: 'fijo', calc: (s: StrategicValueResult) => Object.values(s.indexValues).reduce((a, b) => a + b, 0), raw: (s: StrategicValueResult) => Object.values(s.indexValues).reduce((a, b) => a + b, 0), desc: 'Ventajas por índice asignadas al personaje.' },
  ]

  const ACCOUNT_ROWS: RowDef[] = [
    { label: 'Warband Impact', weight: '×10', calc: (s: StrategicValueResult) => s.warbandImpact * 10, raw: (s: StrategicValueResult) => s.warbandImpact, desc: 'Personajes 80-89 que reciben +5% XP.' },
    { label: 'XP futura', weight: '×8', calc: (s: StrategicValueResult) => s.futureXpIncrease * 8, raw: (s: StrategicValueResult) => s.futureXpIncrease, desc: 'Delta de Warband Mentor al subir a 90.' },
    { label: 'Peso restante', weight: '×10', calc: (s: StrategicValueResult) => s.remainingWeight * 10, raw: (s: StrategicValueResult) => s.remainingWeight, desc: 'Más pendientes = más valor de Warband.' },
  ]

  function fmtVal(v: number): string {
    if (Number.isInteger(v)) return v.toFixed(0)
    return v.toFixed(2)
  }
  function fmtContrib(v: number): string {
    if (Number.isInteger(v)) return v.toFixed(0)
    return v.toFixed(1)
  }

  let starBand = $derived([...STAR_THRESHOLDS].find(t => strategic.totalScore >= t.min))
</script>

<div class="svm-summary">
  <div class="svm-score-bar">
    <div class="svm-score-fill" style="width: {strategic.totalScore}%"></div>
  </div>
  <div class="svm-score-label">
    <strong>{strategic.totalScore.toFixed(0)}/100</strong>
    <span>{'★'.repeat(strategic.stars)}{'☆'.repeat(5 - strategic.stars)}</span>
  </div>
</div>

<table class="svm-table">
  <thead>
    <tr>
      <th>Componente</th>
      <th>Peso</th>
      <th>Valor</th>
      <th>Contrib.</th>
      <th title="Ayuda">?</th>
    </tr>
  </thead>
  <tbody>
    <tr class="svm-section-row">
      <td colspan="5"><strong>VALOR INTRÍNSECO</strong></td>
    </tr>
    {#each INTRINSIC_ROWS as row}
      <tr>
        <td class="svm-label">{row.label}</td>
        <td class="svm-weight">{row.weight}</td>
        <td class="svm-val">{fmtVal(row.raw(strategic))}</td>
        <td class="svm-contrib">{fmtContrib(row.calc(strategic))}</td>
        <td class="svm-help" title={row.desc}>?</td>
      </tr>
    {/each}
    <tr class="svm-subtotal-row">
      <td colspan="3">Subtotal intrínseco</td>
      <td class="svm-contrib">{fmtContrib(strategic.intrinsicScore)}</td>
      <td></td>
    </tr>

    <tr class="svm-section-row">
      <td colspan="5"><strong>IMPACTO EN CUENTA</strong></td>
    </tr>
    {#each ACCOUNT_ROWS as row}
      <tr>
        <td class="svm-label">{row.label}</td>
        <td class="svm-weight">{row.weight}</td>
        <td class="svm-val">{fmtVal(row.raw(strategic))}</td>
        <td class="svm-contrib">{fmtContrib(row.calc(strategic))}</td>
        <td class="svm-help" title={row.desc}>?</td>
      </tr>
    {/each}
    <tr class="svm-subtotal-row">
      <td colspan="3">Subtotal impacto</td>
      <td class="svm-contrib">{fmtContrib(strategic.accountImpactScore)}</td>
      <td></td>
    </tr>

    <tr class="svm-total-row">
      <td colspan="3"><strong>Total</strong></td>
      <td class="svm-contrib"><strong>{strategic.totalScore.toFixed(0)}</strong></td>
      <td></td>
    </tr>
  </tbody>
</table>

<div class="svm-stars-section">
  <h4>Bandas de estrellas</h4>
  <div class="svm-stars-grid">
    {#each [...STAR_THRESHOLDS] as band}
      <div class="svm-star-band" class:active={starBand?.stars === band.stars}>
        <span class="svm-band-stars">{'★'.repeat(band.stars)}{'☆'.repeat(5 - band.stars)}</span>
        <span class="svm-band-thresh">≥ {band.min}</span>
      </div>
    {/each}
  </div>
</div>

{#if strategic.reasonGroups.length > 0}
  <div class="svm-reasons">
    <h4>Razones</h4>
    {#each strategic.reasonGroups as group (group.subtitle)}
      {#if group.subtitle}
        <h5 class="svm-group-title">{group.subtitle}</h5>
      {/if}
      <ul>
        {#each group.entries as entry}
          <li>{entry}</li>
        {/each}
      </ul>
    {/each}
  </div>
{/if}

<style>
  .svm-summary { margin-bottom: 12px; }
  .svm-score-bar {
    height: 6px; background: var(--input-bg, #2a2a2a); border-radius: 3px;
    overflow: hidden; border: 1px solid var(--border-subtle);
  }
  .svm-score-fill {
    height: 100%; background: linear-gradient(90deg, var(--gold, #d4af37), var(--gold-light, #e8c547));
    transition: width 0.2s;
  }
  .svm-score-label {
    display: flex; justify-content: space-between; align-items: center;
    margin-top: 4px; font-size: 0.7rem; color: var(--gold-light, #d4af37);
  }
  .svm-table {
    width: 100%; border-collapse: collapse; font-size: 0.65rem; margin-bottom: 12px;
  }
  .svm-table th {
    text-align: left; padding: 4px 6px; color: var(--text-muted);
    border-bottom: 1px solid var(--border-subtle); font-weight: normal;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .svm-table td {
    padding: 4px 6px; border-bottom: 1px solid var(--border-subtle, #2a2a2a);
  }
  .svm-label { color: var(--text-primary); }
  .svm-weight { color: var(--text-muted); font-style: italic; text-align: center; }
  .svm-val { text-align: right; color: var(--text-primary); font-variant-numeric: tabular-nums; }
  .svm-contrib { text-align: right; color: var(--gold-light, #d4af37); font-weight: bold; font-variant-numeric: tabular-nums; }
  .svm-help {
    text-align: center; color: var(--text-muted); cursor: help;
    background: var(--input-bg, #2a2a2a); border-radius: 50%;
    width: 16px; height: 16px; line-height: 16px; font-size: 0.55rem;
  }
  .svm-section-row td { border-top: 1px solid var(--gold, #d4af37); padding-top: 6px; font-size: 0.6rem; color: var(--gold, #d4af37); text-transform: uppercase; letter-spacing: 0.06em; }
  .svm-subtotal-row td { border-top: 1px solid var(--border-subtle); font-size: 0.6rem; color: var(--text-primary); font-style: italic; }
  .svm-total-row td { border-top: 2px solid var(--gold, #d4af37); border-bottom: none; padding-top: 6px; }
  .svm-stars-section { margin-bottom: 12px; }
  .svm-stars-section h4,   .svm-reasons h4 {
    font-size: 0.7rem; color: var(--gold); margin: 0 0 6px 0; font-family: var(--font-heading);
  }
  .svm-group-title {
    font-size: 0.6rem; color: var(--gold); font-family: var(--font-heading);
    margin: 6px 0 2px 0;
  }
  .svm-stars-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
  .svm-star-band {
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    padding: 4px 2px; border: 1px solid var(--border-subtle); border-radius: 3px;
    font-size: 0.55rem; color: var(--text-muted); background: var(--input-bg, #2a2a2a);
  }
  .svm-star-band.active { border-color: var(--gold, #d4af37); color: var(--gold-light, #d4af37); }
  .svm-band-stars { font-size: 0.7rem; }
  .svm-band-thresh { font-size: 0.5rem; }
  .svm-reasons ul { margin: 0; padding-left: 16px; }
  .svm-reasons li { font-size: 0.6rem; color: var(--text-primary); margin-bottom: 3px; line-height: 1.3; }
</style>
