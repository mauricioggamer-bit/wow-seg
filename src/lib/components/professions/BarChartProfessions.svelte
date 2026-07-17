<script lang="ts">
  import type { ProfCount } from './profession-charts-data'
  import ChartLegend from '../ChartLegend.svelte'

  let {
    profCounts,
    totalChars,
  }: {
    profCounts: ProfCount[]
    totalChars: number
  } = $props()

  const BAR_H = 28
  const GAP = 8
  const LABEL_W = 150
  const COUNT_W = 48
  const CHART_W = 500
  const MARGIN = { top: 10, right: 28, bottom: 28, left: LABEL_W, right2: COUNT_W + 10 }
  let svgW = $derived(MARGIN.left + CHART_W + MARGIN.right2)
  let rows = $derived(profCounts.length)
  let svgH = $derived(MARGIN.top + rows * (BAR_H + GAP) + MARGIN.bottom)

  let sorted = $derived([...profCounts].sort((a, b) => b.count - a.count))
  let maxCount = $derived(Math.max(1, ...sorted.map(p => p.count)))
  let avgLine = $derived(totalChars > 0 ? (2 * totalChars) / PROFESIONES.length : 0)
  let avgLabel = $derived(avgLine > 0 ? avgLine.toFixed(1) : '')

  import { PROFESIONES } from '../../constants/profesiones'

  function xPos(count: number): number {
    return MARGIN.left + (count / maxCount) * CHART_W
  }

  function barW(count: number): number {
    return (count / maxCount) * CHART_W
  }

  function barY(i: number): number {
    return MARGIN.top + i * (BAR_H + GAP)
  }

  function truncateName(s: string, max = 16): string {
    return s.length > max ? s.slice(0, max - 1) + '…' : s
  }

  interface Tooltip {
    x: number
    y: number
    nombre: string
    count: number
    p1ro: number
    p2do: number
    sinRol: number
    pct: string
  }

  let tooltip = $state<Tooltip | null>(null)

  function showTooltip(e: MouseEvent, p: ProfCount) {
    const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect()
    const pct = totalChars > 0 ? ((p.count / totalChars) * 100).toFixed(1) : '0'
    tooltip = {
      x: rect.left + rect.width / 2,
      y: rect.top - 4,
      nombre: p.nombre,
      count: p.count,
      p1ro: p.p1ro,
      p2do: p.p2do,
      sinRol: p.sinRol,
      pct,
    }
  }

  function hideTooltip() {
    tooltip = null
  }
</script>

<ChartLegend items={[
  { color: '#d4af37', label: 'Main' },
  { color: '#3a7bd5', label: 'CD' },
  { color: '#555', label: 'Sin rol' },
]} />

<div class="bc-wrap" style="position:relative">
  <svg viewBox="0 0 {svgW} {svgH}" class="bc-svg">
    {#if avgLine > 0}
      <line
        x1={xPos(avgLine)} y1={MARGIN.top - 4}
      x2={xPos(avgLine)} y2={MARGIN.top + rows * (BAR_H + GAP)}
      stroke="#d4af37"
        stroke-width="1"
        stroke-dasharray="4,4"
        opacity="0.6"
      />
      <text
        x={xPos(avgLine)} y={MARGIN.top + rows * (BAR_H + GAP) + 16}
        text-anchor="middle" fill="#d4af37" font-size="11"
      >Prom. {avgLabel}</text>
    {/if}

    {#each sorted as p, i}
      {@const y = barY(i)}
      <text x={MARGIN.left - 4} y={y + BAR_H / 2} text-anchor="end" dominant-baseline="middle" fill="#e0e0e0" font-size="11">
        <title>{p.nombre}</title>{p.icon} {truncateName(p.nombre)}
      </text>

      <g>
        {#if p.sinRol > 0}
          <rect
            x={MARGIN.left} y={y}
            width={Math.max(1, barW(p.sinRol))}
            height={BAR_H}
            fill="#555"
            rx="2"
          />
        {/if}
        {#if p.p2do > 0}
          <rect
            x={xPos(p.sinRol)} y={y}
            width={Math.max(1, barW(p.p2do))}
            height={BAR_H}
            fill="#3a7bd5"
            rx="2"
          />
        {/if}
        {#if p.p1ro > 0}
          <rect
            x={xPos(p.sinRol + p.p2do)} y={y}
            width={Math.max(1, barW(p.p1ro))}
            height={BAR_H}
            fill="#d4af37"
            rx="2"
          />
        {/if}
        <rect
          x={MARGIN.left} y={y}
          width={Math.max(1, barW(p.count))}
          height={BAR_H}
          fill="transparent"
          rx="2"
          style="cursor:pointer"
          onmouseenter={(e) => showTooltip(e, p)}
          onmouseleave={hideTooltip}
        />
      </g>

      <text x={MARGIN.left + CHART_W + 8} y={y + BAR_H / 2} dominant-baseline="middle" fill="#888" font-size="11" text-anchor="start">
        {p.count}
      </text>
    {/each}
  </svg>

  {#if tooltip}
    <div class="bc-tooltip" style="left:{tooltip.x}px;top:{tooltip.y}px">
      <div class="bc-tt-header">{tooltip.nombre}</div>
      <div class="bc-tt-row"><span class="bc-tt-label">Total:</span> {tooltip.count} pj ({tooltip.pct}%)</div>
      <div class="bc-tt-row"><span class="bc-tt-dot" style="background:#d4af37"></span> 1ro: {tooltip.p1ro}</div>
      <div class="bc-tt-row"><span class="bc-tt-dot" style="background:#3a7bd5"></span> 2do: {tooltip.p2do}</div>
      <div class="bc-tt-row"><span class="bc-tt-dot" style="background:#555"></span> Sin rol: {tooltip.sinRol}</div>
    </div>
  {/if}
</div>

<style>
  .bc-wrap {
    width: 100%;
    overflow-x: auto;
  }
  .bc-svg {
    width: 100%;
    height: auto;
    min-width: 480px;
    display: block;
  }
  .bc-tooltip {
    position: fixed;
    transform: translate(-50%, -100%);
    background: var(--bg-panel, #1a1a1a);
    border: 1px solid var(--gold, #d4af37);
    border-radius: var(--r-sm);
    padding: 6px 10px;
    z-index: 1100;
    pointer-events: none;
    white-space: nowrap;
    box-shadow: 0 4px 16px rgba(0,0,0,0.5);
    font-size: 0.7rem;
  }
  .bc-tt-header {
    font-family: var(--font-heading);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--gold, #d4af37);
    margin-bottom: 3px;
  }
  .bc-tt-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 1px 0;
    color: var(--text-secondary, #aaa);
  }
  .bc-tt-label {
    color: var(--text-muted, #888);
  }
  .bc-tt-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
</style>
