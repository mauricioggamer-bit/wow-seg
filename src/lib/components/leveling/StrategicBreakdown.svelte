<script lang="ts">
  import type { StrategicValueResult } from '../../types'
  import { STAR_THRESHOLDS } from '../../constants'

  let { strategic }: { strategic: StrategicValueResult } = $props()

  const COMPONENT_ROWS = [
    { key: 'warbandImpact', label: 'Warband Impact', weight: '×10', calc: (s: StrategicValueResult) => s.warbandImpact * 10, raw: (s: StrategicValueResult) => s.warbandImpact, desc: 'Personajes 80-89 que reciben +5% XP al llegar este a 90. Cada beneficiario suma 5.' },
    { key: 'professionValue', label: 'Profesiones', weight: '×15', calc: (s: StrategicValueResult) => s.professionValue * 15, raw: (s: StrategicValueResult) => s.professionValue, desc: '1 si tiene al menos una profesión, 0 si no.' },
    { key: 'closenessTo90', label: 'Cercanía a 90', weight: '×25', calc: (s: StrategicValueResult) => s.closenessTo90 * 25, raw: (s: StrategicValueResult) => s.closenessTo90, desc: 'max(0, (nivel - 10) / 80). Lineal de nivel 10 a 90.' },
    { key: 'closenessToObjective', label: 'Cercanía obj.', weight: '×25', calc: (s: StrategicValueResult) => s.closenessToObjective * 25, raw: (s: StrategicValueResult) => s.closenessToObjective, desc: 'max(0, 1 - dungeonsTo90 / 200). Menos dungeons = más puntaje.' },
    { key: 'futureXpIncrease', label: 'XP futura', weight: '×8', calc: (s: StrategicValueResult) => s.futureXpIncrease * 8, raw: (s: StrategicValueResult) => s.futureXpIncrease, desc: 'Delta del Warband Mentor (5% por nuevo 90 en cuenta).' },
    { key: 'remainingWeight', label: 'Peso restante', weight: '×10', calc: (s: StrategicValueResult) => s.remainingWeight * 10, raw: (s: StrategicValueResult) => s.remainingWeight, desc: 'min(1, pendientes/10). Más pendientes = más valor Warband.' },
    { key: 'bonusSub90', label: 'Bonus <90', weight: '+10', calc: (s: StrategicValueResult) => s.bonusSub90 * 10, raw: (s: StrategicValueResult) => s.bonusSub90, desc: '+10 fijo si el personaje está por debajo de 90.' },
    { key: 'bonus8089', label: 'Bonus 80-89', weight: '+15', calc: (s: StrategicValueResult) => s.bonus8089 * 15, raw: (s: StrategicValueResult) => s.bonus8089, desc: '+15 si está en 80-89 (barato para Warband Mentor).' },
    { key: 'classValue', label: 'Clase', weight: 'fijo', calc: (s: StrategicValueResult) => s.classValue, raw: (s: StrategicValueResult) => s.classValue, desc: 'Suma de ventajas asignadas a la clase del personaje.' },
    { key: 'raceValue', label: 'Raza', weight: 'fijo', calc: (s: StrategicValueResult) => s.raceValue, raw: (s: StrategicValueResult) => s.raceValue, desc: 'Suma de ventajas asignadas a la raza del personaje.' },
    { key: 'raceProfBonus', label: 'Bono Raza-Profesión', weight: 'fijo', calc: (s: StrategicValueResult) => s.raceProfBonus, raw: (s: StrategicValueResult) => s.raceProfBonus, desc: 'Bonos raciales que otorgan puntos extra si el personaje tiene la profesión correspondiente.' },
    { key: 'tagsValue', label: 'Tags', weight: 'fijo', calc: (s: StrategicValueResult) => s.tagsValue, raw: (s: StrategicValueResult) => s.tagsValue, desc: 'Suma de puntos de tags estratégicos del usuario.' },
    { key: 'taskValue', label: 'Tareas', weight: 'fijo', calc: (s: StrategicValueResult) => s.taskValue, raw: (s: StrategicValueResult) => s.taskValue, desc: 'Suma de puntos estratégicos de las tareas del personaje.' },
  ] as const

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
    {#each COMPONENT_ROWS as row}
      <tr>
        <td class="svm-label">{row.label}</td>
        <td class="svm-weight">{row.weight}</td>
        <td class="svm-val">{fmtVal(row.raw(strategic))}</td>
        <td class="svm-contrib">{fmtContrib(row.calc(strategic))}</td>
        <td class="svm-help" title={row.desc}>?</td>
      </tr>
    {/each}
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

{#if strategic.reasons.length > 0}
  <div class="svm-reasons">
    <h4>Razones</h4>
    <ul>
      {#each strategic.reasons as reason}
        <li>{reason}</li>
      {/each}
    </ul>
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
  .svm-total-row td { border-top: 2px solid var(--gold, #d4af37); border-bottom: none; padding-top: 6px; }
  .svm-stars-section { margin-bottom: 12px; }
  .svm-stars-section h4, .svm-reasons h4 {
    font-size: 0.7rem; color: var(--gold); margin: 0 0 6px 0; font-family: var(--font-heading);
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
