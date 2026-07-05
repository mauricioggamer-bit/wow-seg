<script lang="ts">
  import type { OptimizationPlan } from '../../types'
  import { formatHours } from '../../leveling/calculator'

  let { plan }: { plan: OptimizationPlan } = $props()

  const W = 300, H = 100, PAD_L = 20, PAD_R = 4, PAD_T = 8, PAD_B = 14
  const innerW = W - PAD_L - PAD_R, innerH = H - PAD_T - PAD_B

  let entries90 = $derived(plan.entries.filter(e => e.nivel < 90))

  let dataPoints = $derived(
    entries90.length + 1 > 1
      ? (() => {
          const pts: { x: number; y: number; label: string; cumTime: number; buffPct: number }[] = []
          let cumTime = 0
          let buffPct = entries90.length > 0 ? (plan.entries[0]?.buffBefore ?? 0) : 0
          pts.push({ x: 0, y: buffPct, label: 'Inicio', cumTime: 0, buffPct })
          for (const e of entries90) {
            cumTime += e.timeTo90
            buffPct = e.buffAfter
            pts.push({ x: cumTime, y: buffPct, label: e.nombre, cumTime, buffPct })
          }
          return pts
        })()
      : [],
  )

  let maxTime = $derived(dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].cumTime : 1)
  let maxBuff = $derived(Math.max(25, ...dataPoints.map(p => p.y)))

  function px(i: number): number {
    if (dataPoints.length <= 1) return PAD_L
    return PAD_L + (i / (dataPoints.length - 1)) * innerW
  }
  function py(val: number): number {
    return PAD_T + innerH - (val / maxBuff) * innerH
  }
  let pathD = $derived(dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(p.y)}`).join(' '))
</script>

{#if dataPoints.length > 1}
  <svg viewBox="0 0 {W} {H}" class="lvl-chart" preserveAspectRatio="xMidYMid meet">
    {#each [5, 10, 15, 20, 25] as lvl}
      <line x1={PAD_L} y1={py(lvl)} x2={W - PAD_R} y2={py(lvl)} class="lvl-chart-grid" />
      <text x="2" y={py(lvl) + 2} class="lvl-chart-axis">{lvl}%</text>
    {/each}
    <path d={pathD} class="lvl-chart-line" />
    {#each dataPoints as pt, i (pt.label)}
      <circle cx={px(i)} cy={py(pt.y)} r="2.5" class="lvl-chart-dot"><title>{pt.label}: +{pt.buffPct}% buff</title></circle>
      {#if i > 0}
        <text x={px(i)} y={py(pt.y) - 4} text-anchor="middle" class="lvl-chart-val">+{pt.buffPct}%</text>
      {/if}
    {/each}
    <text x={(PAD_L + W - PAD_R) / 2} y={H - 2} text-anchor="middle" class="lvl-chart-axis">
      Buff Warband 80-90 durante progreso óptimo
    </text>
  </svg>
{:else}
  <p class="lvl-chart-empty">Ningún personaje puede alcanzar 90</p>
{/if}

<style>
  .lvl-chart { width: 100%; height: auto; }
  :global(.lvl-chart-line) { fill: none; stroke: var(--gold); stroke-width: 1.5; }
  :global(.lvl-chart-dot) { fill: var(--gold); transition: r 0.15s; }
  :global(.lvl-chart-dot:hover) { r: 4; filter: brightness(1.3); }
  :global(.lvl-chart-grid) { stroke: var(--chart-grid, rgba(255,255,255,0.05)); stroke-width: 0.5; }
  :global(.lvl-chart-val) { fill: var(--chart-val, var(--gold-light)); font-size: 5px; font-family: var(--font-heading); }
  :global(.lvl-chart-label) { fill: var(--chart-label, var(--text-muted)); font-size: 5px; }
  :global(.lvl-chart-axis) { fill: var(--chart-axis-text, var(--text-dim)); font-size: 5px; }
  .lvl-chart-empty { font-size: 0.5rem; color: var(--text-dim); text-align: center; padding: 20px 0; }
</style>