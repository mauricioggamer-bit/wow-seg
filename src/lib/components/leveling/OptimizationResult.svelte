<script lang="ts">
  import type { OptimizationPlan } from '../../types'
  import { formatHours, formatNumber } from '../../leveling/calculator'
  import { clsClass } from '../../constants'

  let { plan }: { plan: OptimizationPlan } = $props()
</script>

<div class="lvl-opt-result">
  <div class="lvl-opt-savings">
    <div class="lvl-savings-item">
      <span>Tiempo base (sin ordenar)</span>
      <strong>{formatHours(plan.baselineTime)}</strong>
    </div>
    <div class="lvl-savings-item">
      <span>Tiempo optimizado</span>
      <strong class="opt">{formatHours(plan.optimizedTime)}</strong>
    </div>
    <div class="lvl-savings-item highlight">
      <span>Ahorro</span>
      <strong class="saved">{formatHours(plan.timeSaved)}</strong>
    </div>
  </div>

  {#if plan.entries.length > 0}
    <table class="lvl-opt-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Personaje</th>
          <th>Nivel</th>
          <th>Obj.</th>
          <th>Dungs → 90</th>
          <th>Tiempo → 90</th>
          <th>Buff antes</th>
          <th>Buff después</th>
          <th>Ahorra a otros</th>
          <th>ROI</th>
        </tr>
      </thead>
      <tbody>
        {#each plan.entries as e (e.nombre)}
          <tr>
            <td class="lvl-opt-orden">{e.orden}</td>
            <td class="lvl-opt-char">
              <span class="lvl-opt-name">{e.nombre}</span>
              <span class="lvl-opt-class" style="color: {clsClass(e.clase)}">{e.clase}</span>
            </td>
            <td class="lvl-opt-num">{e.nivel}</td>
            <td class="lvl-opt-num">{e.objetivoNivel}</td>
            <td class="lvl-opt-num">{e.dungeonsTo90 || '—'}</td>
            <td class="lvl-opt-num">{e.timeTo90 > 0 ? formatHours(e.timeTo90) : '—'}</td>
            <td class="lvl-opt-num">+{e.buffBefore}%</td>
            <td class="lvl-opt-num">+{e.buffAfter}%</td>
            <td class="lvl-opt-num">{e.timeSavedForOthers > 0 ? formatHours(e.timeSavedForOthers) : '—'}</td>
            <td class="lvl-opt-num roi">{e.roi > 0 ? `${(e.roi * 100).toFixed(0)}%` : '—'}</td>
          </tr>
          <tr class="lvl-opt-reason-row">
            <td colspan="10">
              <span class="lvl-opt-reason">{e.reason}</span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .lvl-opt-result {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .lvl-opt-savings {
    display: flex;
    gap: 12px;
    padding: 6px 8px;
    background: rgba(0,0,0,0.25);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
  }
  .lvl-savings-item {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .lvl-savings-item span {
    font-size: 0.45rem;
    color: var(--text-muted);
    text-transform: uppercase;
  }
  .lvl-savings-item strong {
    font-family: var(--font-heading);
    font-size: 0.7rem;
    color: var(--gold-light, #d4af37);
  }
  .lvl-savings-item strong.opt { color: var(--green, #38a169); }
  .lvl-savings-item.highlight strong.saved {
    color: var(--green, #38a169);
    font-size: 0.8rem;
  }
  .lvl-opt-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.55rem;
  }
  .lvl-opt-table th {
    text-align: left;
    padding: 3px 6px;
    font-family: var(--font-heading);
    font-size: 0.45rem;
    color: var(--gold);
    text-transform: uppercase;
    border-bottom: 1px solid var(--border-subtle);
    white-space: nowrap;
  }
  .lvl-opt-table td {
    padding: 3px 6px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
    color: var(--text-secondary);
    white-space: nowrap;
  }
  .lvl-opt-reason-row td {
    border-bottom: 1px solid var(--border-subtle);
    padding: 1px 6px 4px 6px;
  }
  .lvl-opt-orden {
    color: var(--gold);
    font-weight: 600;
    font-family: var(--font-heading);
    text-align: center;
  }
  .lvl-opt-char {
    display: flex;
    flex-direction: column;
  }
  .lvl-opt-name { font-weight: 600; color: var(--text-primary); }
  .lvl-opt-class { font-size: 0.45rem; }
  .lvl-opt-num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .lvl-opt-num.roi { color: var(--gold-light, #d4af37); font-weight: 600; }
  .lvl-opt-reason {
    font-size: 0.48rem;
    color: var(--text-muted);
    font-style: italic;
  }
</style>