<script lang="ts">
  import type { StrategicValueResult, ReasonGroup, Personaje } from '../../types'
  import { STAR_THRESHOLDS } from '../../constants'
  import StrategicValueModal from './StrategicValueModal.svelte'
  import { taskEditRequest } from '../../stores/taskEdit'

  let { strategic, personaje }: { strategic: StrategicValueResult; personaje?: Personaje } = $props()

  let modalOpen = $state(false)
  let starBand = $derived([...STAR_THRESHOLDS].find(t => strategic.totalScore >= t.min))

  function extractValue(entry: string): number {
    const m = entry.match(/([+-]\d+(?:\.\d+)?)\s*$/)
    return m ? parseFloat(m[1]) : 0
  }

  function valOrDash(v: number): string {
    return v === 0 ? '—' : (Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1))
  }

  function formatTotal(v: number): string {
    const s = Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1)
    return v >= 0 ? '+' + s : s
  }

  function groupTotal(g: ReasonGroup): number {
    let sum = 0
    if (g.subGroups) {
      for (const sub of g.subGroups) {
        for (const e of sub.entries) sum += extractValue(e)
      }
    } else {
      for (const e of g.entries) sum += extractValue(e)
    }
    return sum
  }

  let grandTotal = $derived.by(() => {
    let sum = 0
    for (const g of strategic.reasonGroups) sum += groupTotal(g)
    return sum
  })

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
    { label: 'Profesiones completas', weight: '×15', calc: (s: StrategicValueResult) => s.profesionesCompletasValor * 15, raw: (s: StrategicValueResult) => s.profesionesCompletasValor, desc: 'Puntos por tener 1ª y 2ª profesión asignadas.' },
    { label: 'Tareas', weight: 'fijo', calc: (s: StrategicValueResult) => s.taskValue, raw: (s: StrategicValueResult) => s.taskValue, desc: 'Puntos estratégicos de tareas.' },
    { label: 'Bonus <90', weight: '+10', calc: (s: StrategicValueResult) => s.bonusSub90 * 10, raw: (s: StrategicValueResult) => s.bonusSub90, desc: 'Fijo si está por debajo de 90.' },
    { label: 'Bonus 80-89', weight: '+15', calc: (s: StrategicValueResult) => s.bonus8089 * 15, raw: (s: StrategicValueResult) => s.bonus8089, desc: 'Fijo si está en 80-89.' },
    { label: 'Ventajas', weight: 'fijo', calc: (s: StrategicValueResult) => Object.values(s.indexValues).reduce((a, b) => a + b, 0), raw: (s: StrategicValueResult) => Object.values(s.indexValues).reduce((a, b) => a + b, 0), desc: 'Ventajas por índice (profesión, tarea, warband, personaje).' },
  ]

  const ACCOUNT_ROWS: RowDef[] = [
    { label: 'Warband Impact', weight: '×10', calc: (s: StrategicValueResult) => s.warbandImpact * 10, raw: (s: StrategicValueResult) => s.warbandImpact, desc: 'Personajes 80-89 que reciben +5% XP.' },
    { label: 'XP futura', weight: '×8', calc: (s: StrategicValueResult) => s.futureXpIncrease * 8, raw: (s: StrategicValueResult) => s.futureXpIncrease, desc: 'Delta de Warband Mentor al subir a 90.' },
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
      <span class="svd-bar-label">{strategic.totalScore.toFixed(0)}%</span>
    </div>

    <div class="svd-star-bands">
      <div class="svd-bands-grid">
        {#each [...STAR_THRESHOLDS] as band}
          <div class="svd-band" class:active={starBand?.stars === band.stars}>
            <span class="svd-band-stars">{'★'.repeat(band.stars)}{'☆'.repeat(5 - band.stars)}</span>
            <span class="svd-band-thresh">≥ {band.min}</span>
          </div>
        {/each}
      </div>
    </div>

    {#if strategic.reasonGroups.length > 0}
      <table class="svd-reasons-table">
        <tbody>
          {#each strategic.reasonGroups as group (group.subtitle)}
            {#if group.subtitle}
              <tr class="svd-reason-group-row">
                <td class="svd-group-title" colspan="2">
                  {group.subtitle}
                  {#if group.subtitle === 'Objetivo' && personaje}
                    {@const tareaObj = personaje.tareas.find(t => t.nivelRecomendado === strategic.objetivo)}
                    {#if tareaObj}
                      <button class="svd-edit-btn" onclick={() => taskEditRequest.set({ charName: personaje.nombre, taskId: tareaObj.id })}>✏️</button>
                    {/if}
                  {/if}
                </td>
              </tr>
            {/if}
            {#if group.subGroups}
              {#each group.subGroups as sub (sub.subtitle)}
                <tr class="svd-reason-sub-row">
                  <td class="svd-sub-title" colspan="2">{sub.subtitle}</td>
                </tr>
                {#each sub.entries as entry}
                  <tr class="svd-reason-entry-row">
                    <td class="svd-reason-entry">▸ {entry}</td>
                    <td class="svd-reason-val">{valOrDash(extractValue(entry))}</td>
                  </tr>
                {/each}
              {/each}
            {:else}
              {#each group.entries as entry}
                <tr class="svd-reason-entry-row">
                  <td class="svd-reason-entry">▸ {entry}</td>
                  <td class="svd-reason-val">{valOrDash(extractValue(entry))}</td>
                </tr>
              {/each}
            {/if}
            <tr class="svd-reason-subtotal-row">
              <td class="svd-reason-subtotal-label">Subtotal</td>
              <td class="svd-reason-subtotal-val">{formatTotal(groupTotal(group))}</td>
            </tr>
          {/each}
          <tr class="svd-reason-grandtotal-row">
            <td class="svd-reason-grandtotal-label">Total</td>
            <td class="svd-reason-grandtotal-val">{formatTotal(grandTotal)}</td>
          </tr>
        </tbody>
      </table>
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
        <td colspan="3"><strong>Pct. real</strong></td>
        <td class="svd-contrib"><strong>{strategic.totalScore.toFixed(0)}%</strong></td>
        <td title="Puntuación real sin cap: {strategic.rawTotalScore.toFixed(0)} / {strategic.maxPosible.toFixed(0)}">?</td>
      </tr>
    </tbody>
  </table>
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
  .svd-reasons-table {
    width: 100%;
    border-collapse: collapse;
  }
  .svd-group-title {
    font-size: 0.55rem;
    color: var(--gold);
    font-family: var(--font-heading);
    padding: 4px 0 2px 0;
    border: none;
  }
  .svd-sub-title {
    font-size: 0.5rem;
    color: var(--gold-light, #d4af37);
    font-family: var(--font-heading);
    padding: 3px 0 1px 4px;
    border: none;
  }
  .svd-reason-entry-row td {
    font-size: 0.5rem;
    color: var(--text-secondary);
    padding: 1px 0;
    border: none;
  }
  .svd-reason-entry {
    color: var(--text-secondary);
    padding-left: 10px;
  }
  .svd-reason-val {
    text-align: right;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
    width: 28px;
    padding-right: 2px;
  }
  .svd-reason-subtotal-row td {
    border-top: 1px solid var(--border-subtle);
    font-size: 0.5rem;
    padding: 2px 0;
  }
  .svd-reason-subtotal-label {
    text-align: right;
    color: var(--text-muted);
    font-style: italic;
    padding-right: 4px;
  }
  .svd-reason-subtotal-val {
    text-align: right;
    color: var(--gold-light, #d4af37);
    font-weight: bold;
    font-variant-numeric: tabular-nums;
    width: 28px;
    padding-right: 2px;
  }
  .svd-reason-grandtotal-row td {
    border-top: 2px solid var(--gold, #d4af37);
    font-size: 0.55rem;
    padding: 3px 0;
  }
  .svd-reason-grandtotal-label {
    text-align: right;
    color: var(--gold);
    font-weight: bold;
    padding-right: 4px;
  }
  .svd-edit-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.55rem;
    padding: 0 2px;
    vertical-align: middle;
    line-height: 1;
  }
  .svd-edit-btn:hover {
    filter: brightness(1.5);
  }
  .svd-reason-grandtotal-val {
    text-align: right;
    color: var(--gold-light, #d4af37);
    font-weight: bold;
    font-variant-numeric: tabular-nums;
    width: 28px;
    padding-right: 2px;
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
  .svd-star-bands { margin: 6px 0; }
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