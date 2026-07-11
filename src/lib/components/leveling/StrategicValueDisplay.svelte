<script lang="ts">
  import type { StrategicValueResult } from '../../types'
  import { STAR_THRESHOLDS } from '../../constants'
  import StrategicValueModal from './StrategicValueModal.svelte'

  let { strategic }: { strategic: StrategicValueResult } = $props()

  let modalOpen = $state(false)
  let starBand = $derived([...STAR_THRESHOLDS].find(t => strategic.totalScore >= t.min))

  interface RowDef {
    label: string
    weight: string
    calc: (s: StrategicValueResult) => number
    raw: (s: StrategicValueResult) => number
    desc: string
  }

  const INTRINSIC_ROWS: RowDef[] = [
    { label: 'Clase', weight: 'fijo', calc: (s: StrategicValueResult) => s.classValue, raw: (s: StrategicValueResult) => s.classValue, desc: 'Ventajas estratégicas de la clase (todos los índices).' },
    { label: 'Raza', weight: 'fijo', calc: (s: StrategicValueResult) => s.raceValue, raw: (s: StrategicValueResult) => s.raceValue, desc: 'Ventajas estratégicas de la raza (todos los índices).' },
    { label: 'Proximidad al nivel máx.', weight: '×25', calc: (s: StrategicValueResult) => s.proximityToMaxLevel * 25, raw: (s: StrategicValueResult) => s.proximityToMaxLevel, desc: 'Qué tan cerca está del nivel máximo configurado.' },
    { label: 'Cercanía obj.', weight: '×25', calc: (s: StrategicValueResult) => s.closenessToObjective * 25, raw: (s: StrategicValueResult) => s.closenessToObjective, desc: 'Menos dungeons = más puntaje.' },
    { label: 'Profesiones completas', weight: '×15', calc: (s: StrategicValueResult) => s.profesionesCompletasValor * 15, raw: (s: StrategicValueResult) => s.profesionesCompletasValor, desc: 'Puntos por tener 1ª y 2ª profesión asignadas.' },
    { label: 'Tareas', weight: 'fijo', calc: (s: StrategicValueResult) => s.taskValue, raw: (s: StrategicValueResult) => s.taskValue, desc: 'Puntos estratégicos de tareas.' },
    { label: 'Bonus <90', weight: '+10', calc: (s: StrategicValueResult) => s.bonusSub90 * 10, raw: (s: StrategicValueResult) => s.bonusSub90, desc: 'Fijo si está por debajo de 90.' },
    { label: 'Bonus 80-89', weight: '+15', calc: (s: StrategicValueResult) => s.bonus8089 * 15, raw: (s: StrategicValueResult) => s.bonus8089, desc: 'Fijo si está en 80-89.' },
    { label: 'Ventajas', weight: 'fijo', calc: (s: StrategicValueResult) => Object.values(s.indexValues).reduce((a, b) => a + b, 0), raw: (s: StrategicValueResult) => Object.values(s.indexValues).reduce((a, b) => a + b, 0), desc: 'Ventajas por índice (sin incluir clase/raza).' },
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
</script>

<div class="svd-root">
  <div class="svd-card">
    <div class="svd-card-header">
      <h4 class="svd-card-title">Valor estratégico</h4>
      <button onclick={() => { modalOpen = true }}
        title="Ver fórmula y desglose"
        class="svd-modal-btn">?</button>
    </div>
    <div class="svd-stars">{'★'.repeat(strategic.stars)}{'☆'.repeat(5 - strategic.stars)}</div>
    <div class="svd-bar">
      <div class="svd-bar-fill" style="width: {strategic.totalScore}%"></div>
      <span class="svd-bar-label">{strategic.totalScore.toFixed(0)}/100</span>
    </div>

    {#if strategic.reasonGroups.length > 0}
      {#each strategic.reasonGroups as group (group.subtitle)}
        {#if group.subtitle}
          <h5 class="svd-group-title">{group.subtitle}</h5>
        {/if}
        {#if group.subGroups}
          {#each group.subGroups as sub (sub.subtitle)}
            <h6 class="svd-sub-title">{sub.subtitle}</h6>
            <ul class="svd-reasons">
              {#each sub.entries as entry}
                <li>{entry}</li>
              {/each}
            </ul>
          {/each}
        {:else}
          <ul class="svd-reasons">
            {#each group.entries as entry}
              <li>{entry}</li>
            {/each}
          </ul>
        {/if}
      {/each}
    {/if}


  </div>

  <table class="svd-table">
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
      <tr class="svd-section">
        <td colspan="5"><strong>VALOR INTRÍNSECO</strong></td>
      </tr>
      {#each INTRINSIC_ROWS as row}
        <tr>
          <td class="svd-label">{row.label}</td>
          <td class="svd-weight">{row.weight}</td>
          <td class="svd-val">{fmtVal(row.raw(strategic))}</td>
          <td class="svd-contrib">{fmtContrib(row.calc(strategic))}</td>
          <td class="svd-help" title={row.desc}>?</td>
        </tr>
      {/each}
      <tr class="svd-subtotal">
        <td colspan="3">Subtotal intrínseco</td>
        <td class="svd-contrib">{fmtContrib(strategic.intrinsicScore)}</td>
        <td></td>
      </tr>
      <tr class="svd-section">
        <td colspan="5"><strong>IMPACTO EN CUENTA</strong></td>
      </tr>
      {#each ACCOUNT_ROWS as row}
        <tr>
          <td class="svd-label">{row.label}</td>
          <td class="svd-weight">{row.weight}</td>
          <td class="svd-val">{fmtVal(row.raw(strategic))}</td>
          <td class="svd-contrib">{fmtContrib(row.calc(strategic))}</td>
          <td class="svd-help" title={row.desc}>?</td>
        </tr>
      {/each}
      <tr class="svd-subtotal">
        <td colspan="3">Subtotal impacto</td>
        <td class="svd-contrib">{fmtContrib(strategic.accountImpactScore)}</td>
        <td></td>
      </tr>
      <tr class="svd-total">
        <td colspan="3"><strong>Total</strong></td>
        <td class="svd-contrib"><strong>{strategic.totalScore.toFixed(0)}</strong></td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <div class="svd-star-bands">
    <h4>Bandas de estrellas</h4>
    <div class="svd-bands-grid">
      {#each [...STAR_THRESHOLDS] as band}
        <div class="svd-band" class:active={starBand?.stars === band.stars}>
          <span class="svd-band-stars">{'★'.repeat(band.stars)}{'☆'.repeat(5 - band.stars)}</span>
          <span class="svd-band-thresh">≥ {band.min}</span>
        </div>
      {/each}
    </div>
  </div>
</div>

<StrategicValueModal bind:open={modalOpen} {strategic} />

<style>
  .svd-root {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .svd-card {
    background: rgba(0,0,0,0.2);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 6px;
  }
  .svd-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .svd-card-title {
    margin: 0;
    font-size: 0.6rem;
    color: var(--gold);
  }
  .svd-modal-btn {
    background: var(--input-bg,#2a2a2a);
    border: 1px solid var(--gold,#d4af37);
    border-radius: 50%;
    width: 18px;
    height: 18px;
    line-height: 16px;
    color: var(--gold,#d4af37);
    cursor: pointer;
    font-size: 0.55rem;
    padding: 0;
  }
  .svd-stars {
    color: var(--gold);
    font-size: 0.8rem;
    letter-spacing: -1px;
    margin-bottom: 4px;
  }
  .svd-bar {
    position: relative;
    height: 10px;
    background: rgba(0,0,0,0.4);
    border-radius: 5px;
    overflow: hidden;
    margin-bottom: 6px;
  }
  .svd-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--gold), var(--gold-light, #d4af37));
    border-radius: 5px;
    transition: width var(--t-fast) var(--ease);
  }
  .svd-bar-label {
    position: absolute;
    right: 4px;
    top: -1px;
    font-size: 0.45rem;
    color: var(--text-primary);
    line-height: 10px;
  }
  .svd-group-title {
    font-size: 0.55rem;
    color: var(--gold);
    font-family: var(--font-heading);
    margin: 4px 0 2px 0;
  }
  .svd-sub-title {
    font-size: 0.5rem;
    color: var(--gold-light, #d4af37);
    font-family: var(--font-heading);
    margin: 3px 0 1px 4px;
  }
  .svd-reasons {
    list-style: none;
    padding: 0;
    margin: 0 0 4px 0;
  }
  .svd-reasons li {
    font-size: 0.5rem;
    color: var(--text-secondary);
    padding: 1px 0;
    padding-left: 10px;
    position: relative;
  }
  .svd-reasons li::before {
    content: '▸';
    position: absolute;
    left: 0;
    color: var(--gold);
  }
  .svd-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.65rem;
  }
  .svd-table th {
    text-align: left;
    padding: 4px 6px;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border-subtle);
    font-weight: normal;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .svd-table td {
    padding: 4px 6px;
    border-bottom: 1px solid var(--border-subtle, #2a2a2a);
  }
  .svd-label { color: var(--text-primary); }
  .svd-weight { color: var(--text-muted); font-style: italic; text-align: center; }
  .svd-val { text-align: right; color: var(--text-primary); font-variant-numeric: tabular-nums; }
  .svd-contrib { text-align: right; color: var(--gold-light, #d4af37); font-weight: bold; font-variant-numeric: tabular-nums; }
  .svd-help {
    text-align: center; color: var(--text-muted); cursor: help;
    background: var(--input-bg, #2a2a2a); border-radius: 50%;
    width: 16px; height: 16px; line-height: 16px; font-size: 0.55rem;
  }
  .svd-section td {
    border-top: 1px solid var(--gold, #d4af37);
    padding-top: 6px;
    font-size: 0.6rem;
    color: var(--gold, #d4af37);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .svd-subtotal td {
    border-top: 1px solid var(--border-subtle);
    font-size: 0.6rem;
    color: var(--text-primary);
    font-style: italic;
  }
  .svd-total td {
    border-top: 2px solid var(--gold, #d4af37);
    border-bottom: none;
    padding-top: 6px;
  }
  .svd-star-bands { margin-top: 4px; }
  .svd-star-bands h4 {
    font-size: 0.7rem;
    color: var(--gold);
    margin: 0 0 6px 0;
    font-family: var(--font-heading);
  }
  .svd-bands-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
  }
  .svd-band {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 4px 2px;
    border: 1px solid var(--border-subtle);
    border-radius: 3px;
    font-size: 0.55rem;
    color: var(--text-muted);
    background: var(--input-bg, #2a2a2a);
  }
  .svd-band.active {
    border-color: var(--gold, #d4af37);
    color: var(--gold-light, #d4af37);
  }
  .svd-band-stars { font-size: 0.7rem; }
  .svd-band-thresh { font-size: 0.5rem; }
</style>