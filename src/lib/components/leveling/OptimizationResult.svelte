<script lang="ts">
  import type { OptimizationPlan } from '../../types'
  import { formatHours } from '../../leveling/calculator'
  import { clsClass } from '../../constants'

  let { plan }: { plan: OptimizationPlan } = $props()
</script>

<div class="lvl-opt-result">
  {#if plan.timeSaved > 0}
    <div class="lvl-opt-savings">
      <span>Orden óptimo ahorra <strong>{formatHours(plan.timeSaved)}</strong> vs orden cualquier</span>
    </div>
  {/if}

  <ol class="lvl-opt-list">
    {#each plan.entries as e (e.nombre)}
      <li class="lvl-opt-item">
        <div class="lvl-opt-rank">{e.orden}</div>
        <div class="lvl-opt-info">
          <span class="lvl-opt-name" style="color: {clsClass(e.clase)}">{e.nombre}</span>
          <span class="lvl-opt-desc">{e.reason}</span>
          {#if e.buffBefore !== e.buffAfter}
            <span class="lvl-opt-buff">Warband 80-90: +{e.buffBefore}% → <strong>+{e.buffAfter}%</strong></span>
          {/if}
        </div>
        <div class="lvl-opt-meta">
          {#if e.timeToObjective > 0}
            <span class="lvl-opt-time">⏱ {formatHours(e.timeToObjective)}</span>
          {/if}
          {#if e.timeSavedForOthers > 0}
            <span class="lvl-opt-saved">↓ {formatHours(e.timeSavedForOthers)} ahorrados</span>
          {/if}
        </div>
      </li>
    {/each}
  </ol>
</div>

<style>
  .lvl-opt-result {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    background: rgba(0,0,0,0.25);
    border: 1px solid var(--gold);
    border-radius: var(--r-sm);
  }
  .lvl-opt-savings {
    font-size: 0.6rem;
    color: var(--text-secondary);
  }
  .lvl-opt-savings strong {
    color: var(--green, #38a169);
    font-weight: 700;
  }
  .lvl-opt-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .lvl-opt-item {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 4px 6px;
    background: rgba(255,255,255,0.03);
    border-radius: var(--r-sm);
    border-left: 2px solid var(--gold);
  }
  .lvl-opt-rank {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--gold);
    color: #000;
    font-size: 0.55rem;
    font-weight: 700;
    font-family: var(--font-heading);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .lvl-opt-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .lvl-opt-name {
    font-size: 0.6rem;
    font-weight: 700;
  }
  .lvl-opt-desc {
    font-size: 0.5rem;
    color: var(--text-muted);
  }
  .lvl-opt-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1px;
    flex-shrink: 0;
  }
  .lvl-opt-time {
    font-size: 0.5rem;
    color: var(--gold-light, #d4af37);
    white-space: nowrap;
  }
  .lvl-opt-saved {
    font-size: 0.45rem;
    color: var(--green, #38a169);
    white-space: nowrap;
  }
  .lvl-opt-buff {
    font-size: 0.48rem;
    color: var(--gold-light, #d4af37);
    font-family: var(--font-heading);
  }
  .lvl-opt-buff strong {
    color: var(--green, #38a169);
  }
</style>