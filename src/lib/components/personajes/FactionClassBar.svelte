<script lang="ts">
  import type { Personaje } from '../../types'
  import { computeFactionClassCounts, PERS_CLASS_COLORS, FACTION_COLORS } from './personajes-charts-data'
  import type { FactionClassEntry } from './personajes-charts-data'
  import ChartLegend from '../ChartLegend.svelte'

  let { personajes }: { personajes: Personaje[] } = $props()

  let entries = $derived(computeFactionClassCounts(personajes))
  let maxTotal = $derived(Math.max(1, ...entries.map(e => e.total)))

  const BAR_H = 26
  const GAP = 6
  const LABEL_W = 100
  const CHART_W = 500
  const MARGIN = { top: 10, right: 30, bottom: 24, left: LABEL_W }
  let svgW = $derived(MARGIN.left + CHART_W + MARGIN.right)
  let svgH = $derived(MARGIN.top + entries.length * (BAR_H + GAP) + MARGIN.bottom)

  function xPos(count: number): number {
    return MARGIN.left + (count / maxTotal) * CHART_W
  }
  function barW(count: number): number {
    return (count / maxTotal) * CHART_W
  }
  function barY(i: number): number {
    return MARGIN.top + i * (BAR_H + GAP)
  }

  function truncateName(s: string, max = 12): string {
    return s.length > max ? s.slice(0, max - 1) + '…' : s
  }

  interface Tooltip { x: number; y: number; text: string }
  let tooltip = $state<Tooltip | null>(null)

  function showTt(e: MouseEvent, e2: FactionClassEntry) {
    const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect()
    const pctAll = e2.total > 0 ? ((e2.alliance / e2.total) * 100).toFixed(0) : '0'
    const pctHorde = e2.total > 0 ? ((e2.horde / e2.total) * 100).toFixed(0) : '0'
    tooltip = {
      x: rect.left + rect.width / 2,
      y: rect.top - 4,
      text: `${e2.clase} · ${e2.total} pj · Alianza ${e2.alliance} (${pctAll}%) · Horda ${e2.horde} (${pctHorde}%)`,
    }
  }
  function hideTt() { tooltip = null }
</script>

<ChartLegend items={[
  { color: FACTION_COLORS.Alianza, label: 'Alianza' },
  { color: FACTION_COLORS.Horda, label: 'Horda' },
]} />

<div class="fc-wrap" style="position:relative">
  <svg viewBox="0 0 {svgW} {svgH}" class="fc-svg">
    {#each entries as e, i}
      {@const y = barY(i)}
      <text x={MARGIN.left - 4} y={y + BAR_H / 2} text-anchor="end" dominant-baseline="middle" fill={PERS_CLASS_COLORS[e.classKey] || '#e0e0e0'} font-size="10"><title>{e.clase}</title>{truncateName(e.clase)}</text>

      <g>
        {#if e.alliance > 0}
          <rect x={MARGIN.left} y={y} width={Math.max(1, barW(e.alliance))} height={BAR_H} fill={FACTION_COLORS.Alianza} rx="2" opacity="0.8" />
        {/if}
        {#if e.horde > 0}
          <rect x={xPos(e.alliance)} y={y} width={Math.max(1, barW(e.horde))} height={BAR_H} fill={FACTION_COLORS.Horda} rx="2" opacity="0.8" />
        {/if}
        <rect x={MARGIN.left} y={y} width={Math.max(1, barW(e.total))} height={BAR_H} fill="transparent" rx="2" style="cursor:pointer" onmouseenter={(e2) => showTt(e2, e)} onmouseleave={hideTt} />
      </g>

      <text x={MARGIN.left + CHART_W + 4} y={y + BAR_H / 2} dominant-baseline="middle" fill="#888" font-size="10">{e.total}</text>
    {/each}
  </svg>

  {#if tooltip}
    <div class="fc-tooltip" style="left:{tooltip.x}px;top:{tooltip.y}px">{tooltip.text}</div>
  {/if}
</div>

<style>
  .fc-wrap { width: 100%; overflow-x: auto; }
  .fc-svg { width: 100%; height: auto; min-width: 440px; display: block; }
  .fc-tooltip { position: fixed; transform: translate(-50%, -100%); background: var(--bg-panel, #1a1a1a); border: 1px solid var(--gold, #d4af37); border-radius: var(--r-sm); padding: 4px 8px; z-index: 1100; pointer-events: none; white-space: nowrap; box-shadow: 0 4px 16px rgba(0,0,0,0.5); font-size: 0.65rem; color: var(--text-secondary, #aaa); }
</style>
