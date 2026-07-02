<script lang="ts">
  import type { Personaje, LevelingConfig, LevelBreakdownEntry } from '../../types'
  import { getLevelBreakdown, formatNumber, formatHours, calculateForCharacter } from '../../leveling/calculator'
  import { calculateStrategicValue } from '../../leveling/strategicValue'
  import { clsClass } from '../../constants'

  let {
    personaje,
    config,
    roster,
    count90,
  }: {
    personaje: Personaje
    config: LevelingConfig
    roster: Personaje[]
    count90: number
  } = $props()

  let breakdown = $derived(getLevelBreakdown(personaje, config, count90))
  let calc = $derived(calculateForCharacter(personaje, config, count90))
  let strategic = $derived(calculateStrategicValue(personaje, config, roster, count90))
</script>

<div class="lvl-detail-view">
  {#if breakdown.length === 0}
    <p class="lvl-done-msg">Objetivo completado ✓</p>
  {:else}
    <table class="lvl-breakdown-table">
      <thead>
        <tr>
          <th>Nivel</th>
          <th>XP nivel</th>
          <th>XP/dungeon</th>
          <th>Dungeons</th>
          <th>∑ Dungeons</th>
          <th>∑ Tiempo</th>
        </tr>
      </thead>
      <tbody>
        {#each breakdown as entry (entry.level)}
          <tr>
            <td class="lvl-bd-level">{entry.level}</td>
            <td class="lvl-bd-num">{formatNumber(entry.xpNeeded)}</td>
            <td class="lvl-bd-num">{formatNumber(entry.xpPerDungeon)}</td>
            <td class="lvl-bd-num">{entry.dungeons}</td>
            <td class="lvl-bd-num">{entry.cumulativeDungeons}</td>
            <td class="lvl-bd-num">{formatHours(entry.cumulativeTime)}</td>
          </tr>
        {/each}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" class="lvl-bd-total">Total</td>
          <td class="lvl-bd-num">{calc.dungeons}</td>
          <td class="lvl-bd-num">{formatHours(calc.timeHours)}</td>
        </tr>
      </tfoot>
    </table>

    <div class="lvl-strategic-detail">
      <h4>Valor estratégico</h4>
      <div class="lvl-stars-display">{'★'.repeat(strategic.stars)}{'☆'.repeat(5 - strategic.stars)}</div>
      <div class="lvl-score-bar">
        <div class="lvl-score-fill" style="width: {strategic.totalScore}%"></div>
        <span class="lvl-score-label">{strategic.totalScore}/100</span>
      </div>
      <ul class="lvl-reasons">
        {#each strategic.reasons as reason}
          <li>{reason}</li>
        {/each}
      </ul>
      <div class="lvl-strategic-stats">
        <div class="lvl-sv-stat">
          <span>Warband Impact</span>
          <strong>{strategic.warbandImpact > 0 ? `+${strategic.warbandImpact}%` : '—'}</strong>
        </div>
        <div class="lvl-sv-stat">
          <span>Profesiones</span>
          <strong>{strategic.professionValue > 0 ? 'Sí' : 'No'}</strong>
        </div>
        <div class="lvl-sv-stat">
          <span>Cercanía a 90</span>
          <strong>{(strategic.closenessTo90 * 100).toFixed(0)}%</strong>
        </div>
        <div class="lvl-sv-stat">
          <span>Cercanía obj.</span>
          <strong>{(strategic.closenessToObjective * 100).toFixed(0)}%</strong>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .lvl-detail-view {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .lvl-breakdown-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.55rem;
  }
  .lvl-breakdown-table th {
    text-align: left;
    padding: 3px 6px;
    font-family: var(--font-heading);
    font-size: 0.5rem;
    color: var(--gold);
    text-transform: uppercase;
    border-bottom: 1px solid var(--border-subtle);
  }
  .lvl-breakdown-table td {
    padding: 2px 6px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    color: var(--text-secondary);
  }
  .lvl-breakdown-table tfoot td {
    border-top: 1px solid var(--border-subtle);
    font-weight: 600;
    color: var(--gold-light, #d4af37);
  }
  .lvl-bd-level {
    color: var(--gold);
    font-weight: 600;
    font-family: var(--font-heading);
  }
  .lvl-bd-num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .lvl-bd-total {
    text-align: left;
    font-family: var(--font-heading);
    text-transform: uppercase;
    font-size: 0.5rem;
  }
  .lvl-done-msg {
    color: var(--green, #38a169);
    font-size: 0.65rem;
    text-align: center;
    padding: 8px;
  }
  .lvl-strategic-detail {
    background: rgba(0,0,0,0.2);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 6px;
  }
  .lvl-strategic-detail h4 {
    font-size: 0.6rem;
    color: var(--gold);
    margin-bottom: 4px;
  }
  .lvl-stars-display {
    color: var(--gold);
    font-size: 0.8rem;
    letter-spacing: -1px;
    margin-bottom: 4px;
  }
  .lvl-score-bar {
    position: relative;
    height: 10px;
    background: rgba(0,0,0,0.4);
    border-radius: 5px;
    overflow: hidden;
    margin-bottom: 6px;
  }
  .lvl-score-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--gold), var(--gold-light, #d4af37));
    border-radius: 5px;
    transition: width var(--t-fast) var(--ease);
  }
  .lvl-score-label {
    position: absolute;
    right: 4px;
    top: -1px;
    font-size: 0.45rem;
    color: var(--text-primary);
    line-height: 10px;
  }
  .lvl-reasons {
    list-style: none;
    padding: 0;
    margin: 0 0 6px 0;
  }
  .lvl-reasons li {
    font-size: 0.5rem;
    color: var(--text-secondary);
    padding: 1px 0;
    padding-left: 10px;
    position: relative;
  }
  .lvl-reasons li::before {
    content: '▸';
    position: absolute;
    left: 0;
    color: var(--gold);
  }
  .lvl-strategic-stats {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .lvl-sv-stat {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .lvl-sv-stat span {
    font-size: 0.4rem;
    color: var(--text-muted);
    text-transform: uppercase;
  }
  .lvl-sv-stat strong {
    font-size: 0.55rem;
    color: var(--gold-light, #d4af37);
  }
</style>