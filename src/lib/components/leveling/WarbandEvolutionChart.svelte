<script lang="ts">
  import type { OptimizationPlan } from '../../types'
  import { formatHours } from '../../leveling/calculator'

  let { plan }: { plan: OptimizationPlan } = $props()

  const W = 300
  const H = 100
  const PAD_L = 20
  const PAD_R = 4
  const PAD_T = 8
  const PAD_B = 14
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B

  let entries90 = $derived(plan.entries.filter(e => e.objetivoNivel >= 90 && e.nivel < 90))

  const initialCount90 = 0

  let dataPoints = $derived(
    entries90.length + 1 > 1
      ? (() => {
          const pts: { x: number; y: number; label: string; cumTime: number }[] = []
          let count90 = initialCount90
          let cumTime = 0
          pts.push({ x: 0, y: count90, label: 'Inicio', cumTime: 0 })
          for (const e of entries90) {
            cumTime += e.timeTo90
            count90++
            pts.push({ x: cumTime, y: count90, label: e.nombre, cumTime })
          }
          return pts
        })()
      : [],
  )

  let maxTime = $derived(dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].cumTime : 1)
  let maxCount = $derived(Math.max(5, ...dataPoints.map(p => p.y)))

  function px(i: number): number {
    if (dataPoints.length <= 1) return PAD_L
    return PAD_L + (i / (dataPoints.length - 1)) * innerW
  }

  function py(val: number): number {
    return PAD_T + innerH - (val / maxCount) * innerH
  }

  let pathD = $derived(
    dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(p.y)}`).join(' '),
  )
</script>

{#if dataPoints.length > 1}
  <svg viewBox="0 0 {W} {H}" class="lvl-chart" preserveAspectRatio="xMidYMid meet">
    {#each [1, 2, 3, 4, 5] as lvl}
      <line x1={PAD_L} y1={py(lvl)} x2={W - PAD_R} y2={py(lvl)} stroke="rgba(255,255,255,0.05)" stroke-width="0.5" />
      <text x="2" y={py(lvl) + 2} class="lvl-chart-axis">{lvl}</text>
    {/each}

    <path d={pathD} fill="none" stroke="var(--gold)" stroke-width="1.5" />

    {#each dataPoints as pt, i (pt.label)}
      <circle cx={px(i)} cy={py(pt.y)} r="2.5" fill="var(--gold)" />
      {#if i > 0}
        <text x={px(i)} y={py(pt.y) - 4} text-anchor="middle" class="lvl-chart-val">+5%</text>
      {/if}
    {/each}

    {#if dataPoints.length > 1}
      <text x={(PAD_L + W - PAD_R) / 2} y={H - 2} text-anchor="middle" class="lvl-chart-axis">
        {formatHours(maxTime)} de progreso óptimo
      </text>
    {/if}
  </svg>
{:else}
  <p class="lvl-chart-empty">Ningún personaje con objetivo 90 pendiente</p>
{/if}

<style>
  .lvl-chart {
    width: 100%;
    height: auto;
  }
  :global(.lvl-chart-val) {
    fill: var(--gold-light, #d4af37);
    font-size: 5px;
    font-family: var(--font-heading);
  }
  :global(.lvl-chart-label) {
    fill: var(--text-muted);
    font-size: 5px;
  }
  :global(.lvl-chart-axis) {
    fill: var(--text-dim);
    font-size: 5px;
  }
  .lvl-chart-empty {
    font-size: 0.5rem;
    color: var(--text-dim);
    text-align: center;
    padding: 20px 0;
  }
</style>