<script lang="ts">
  import type { ProfCount } from './profession-charts-data'
  import { RECOLECCION_IDS } from './profession-charts-data'

  let {
    profCounts,
    profAvgValues,
    totalChars,
  }: {
    profCounts: ProfCount[]
    profAvgValues: Record<string, number>
    totalChars: number
  } = $props()

  const MARGIN = { top: 20, right: 20, bottom: 28, left: 36 }
  const CHART_W = 480
  const CHART_H = 320
  const SVG_W = CHART_W + MARGIN.left + MARGIN.right
  const SVG_H = CHART_H + MARGIN.top + MARGIN.bottom

  let hasValues = $derived(Object.keys(profAvgValues).length > 0)

  let maxCount = $derived(Math.max(1, ...profCounts.map(p => p.count)))
  let maxMains = $derived(Math.max(1, ...profCounts.map(p => p.mains)))

  let counts = $derived(profCounts.map(p => p.count))
  let avgX = $derived(counts.reduce((s, c) => s + c, 0) / counts.length)

  let values = $derived(
    hasValues
      ? profCounts.map(p => profAvgValues[p.id] ?? 0)
      : profCounts.map(p => p.mains)
  )
  let avgY = $derived(values.reduce((s, v) => s + v, 0) / values.length)

  function xPos(count: number): number {
    return MARGIN.left + (count / (maxCount * 1.15)) * CHART_W
  }

  function yPos(val: number): number {
    const maxVal = hasValues
      ? Math.max(0.1, ...Object.values(profAvgValues))
      : Math.max(1, ...profCounts.map(p => p.mains))
    return MARGIN.top + CHART_H - (val / (maxVal * 1.15)) * CHART_H
  }

  function bubbleR(mains: number): number {
    return Math.max(6, Math.min(32, 6 + (mains / maxMains) * 26))
  }

  function fillColor(esRecoleccion: boolean): string {
    return esRecoleccion ? '#4caf50' : '#ff9800'
  }

  interface Tooltip {
    x: number
    y: number
    text: string
  }

  let tooltip = $state<Tooltip | null>(null)
  let svgEl = $state<SVGSVGElement | null>(null)

  function showBubbleTooltip(e: MouseEvent, p: ProfCount) {
    const val = hasValues
      ? (profAvgValues[p.id] ?? 0).toFixed(2)
      : String(p.mains)
    const valLabel = hasValues ? 'valor str.' : 'mains'
    const rect = (e.currentTarget as SVGCircleElement).getBoundingClientRect()
    const pct = totalChars > 0 ? ((p.count / totalChars) * 100).toFixed(1) : '0'
    tooltip = {
      x: rect.left + rect.width / 2,
      y: rect.top - 4,
      text: `${p.nombre} · ${p.count} pj · ${p.mains}⭐ main · ${valLabel} ${val} · ${pct}% roster`,
    }
  }

  function hideTooltip() {
    tooltip = null
  }
</script>

<div class="bb-wrap" style="position:relative">
  <svg bind:this={svgEl} viewBox="0 0 {SVG_W} {SVG_H}" class="bb-svg">
    <!-- axes -->
    <line x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={MARGIN.top + CHART_H} stroke="var(--border-subtle, #444)" stroke-width="1" />
    <line x1={MARGIN.left} y1={MARGIN.top + CHART_H} x2={MARGIN.left + CHART_W} y2={MARGIN.top + CHART_H} stroke="var(--border-subtle, #444)" stroke-width="1" />

    <!-- quadrant lines -->
    <line x1={xPos(avgX)} y1={MARGIN.top} x2={xPos(avgX)} y2={MARGIN.top + CHART_H} stroke="#888" stroke-width="0.5" stroke-dasharray="3,3" />
    <line x1={MARGIN.left} y1={yPos(avgY)} x2={MARGIN.left + CHART_W} y2={yPos(avgY)} stroke="#888" stroke-width="0.5" stroke-dasharray="3,3" />

    <!-- quadrant labels -->
    <text x={MARGIN.left + 4} y={yPos(avgY) - 4} fill="#d4af37" font-size="7.5" opacity="0.7">Alta prioridad</text>
    <text x={MARGIN.left + CHART_W - 2} y={yPos(avgY) - 4} text-anchor="end" fill="#888" font-size="7.5" opacity="0.7">Priorizar roleo</text>
    <text x={MARGIN.left + 4} y={MARGIN.top + CHART_H - 2} fill="#888" font-size="7.5" opacity="0.7">Baja prioridad</text>
    <text x={MARGIN.left + CHART_W - 2} y={MARGIN.top + CHART_H - 2} text-anchor="end" fill="#888" font-size="7.5" opacity="0.7">Saturada</text>

    <!-- axis labels -->
    <text x={MARGIN.left + CHART_W / 2} y={MARGIN.top + CHART_H + 14} text-anchor="middle" fill="#aaa" font-size="8">
      {hasValues ? 'Frecuencia en roster' : 'Frecuencia (cantidad de pj)'}
    </text>
    <text x={0} y={MARGIN.top + CHART_H / 2} text-anchor="middle" fill="#aaa" font-size="8" transform="rotate(-90, 10, {MARGIN.top + CHART_H / 2})">
      {hasValues ? 'Valor estratégico promedio' : 'Main crafters'}
    </text>

    <!-- bubbles -->
    {#each profCounts as p}
      {@const cx = xPos(p.count)}
      {@const cy = yPos(hasValues ? (profAvgValues[p.id] ?? 0) : p.mains)}
      {@const r = bubbleR(p.mains)}
      <circle
        cx={cx} cy={cy} r={r}
        fill={fillColor(p.esRecoleccion)}
        opacity="0.75"
        stroke="#1a1a1a" stroke-width="1"
        style="cursor:pointer"
        onmouseenter={(e) => showBubbleTooltip(e, p)}
        onmouseleave={hideTooltip}
      />
      {#if r > 8}
        <text
          x={cx} y={cy}
          text-anchor="middle" dominant-baseline="middle"
          fill="#fff" font-size="7.5"
          pointer-events="none"
        >{p.icon}</text>
      {/if}
    {/each}
  </svg>

  {#if tooltip}
    <div class="bb-tooltip" style="left:{tooltip.x}px;top:{tooltip.y}px">
      {tooltip.text}
    </div>
  {/if}
</div>

<style>
  .bb-wrap {
    width: 100%;
    overflow: visible;
  }
  .bb-svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .bb-tooltip {
    position: fixed;
    transform: translate(-50%, -100%);
    background: var(--bg-panel, #1a1a1a);
    border: 1px solid var(--gold, #d4af37);
    border-radius: var(--r-sm);
    padding: 4px 8px;
    z-index: 1100;
    pointer-events: none;
    white-space: nowrap;
    box-shadow: 0 4px 16px rgba(0,0,0,0.5);
    font-size: 0.65rem;
    color: var(--text-secondary, #aaa);
  }
</style>
