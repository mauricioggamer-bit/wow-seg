<script lang="ts">
  import type { SimulationResult } from '../../types'
  import { clsClass } from '../../constants'

  let { sim, totalPending }: { sim: SimulationResult; totalPending: number } = $props()

  const W = 300, H = 80, PAD_L = 30, PAD_R = 4, PAD_T = 8, PAD_B = 14
  const innerW = W - PAD_L - PAD_R, innerH = H - PAD_T - PAD_B

  let completedPct = $derived(totalPending > 0 ? (sim.charactersCompleted / totalPending) * 100 : 0)
  let remainingPct = $derived(100 - completedPct)

  let barW = $derived(innerW * (completedPct / 100))
  let barX2 = $derived(PAD_L + barW)
</script>

<svg viewBox="0 0 {W} {H}" class="lvl-chart" preserveAspectRatio="xMidYMid meet">
  <rect x={PAD_L} y={PAD_T} width={innerW} height={innerH} fill="rgba(0,0,0,0.4)" rx="3" />
  <rect x={PAD_L} y={PAD_T} width={Math.max(0, barW)} height={innerH} fill="var(--gold)" opacity="0.8" rx="3" />
  <text x={PAD_L + 2} y={PAD_T + innerH / 2 + 2} class="lvl-chart-bar-text">
    {sim.charactersCompleted}/{totalPending} completados
  </text>
  <text x={W - PAD_R - 2} y={PAD_T + innerH / 2 + 2} text-anchor="end" class="lvl-chart-bar-text">
    {completedPct.toFixed(0)}%
  </text>
  <text x={(PAD_L + W) / 2} y={H - 2} text-anchor="middle" class="lvl-chart-axis">
    Personajes completados esta simulación
  </text>
</svg>

<style>
  .lvl-chart { width: 100%; height: auto; }
  :global(.lvl-chart-bar-text) { fill: var(--text-primary); font-size: 5px; font-family: var(--font-heading); }
  :global(.lvl-chart-axis) { fill: var(--text-dim); font-size: 5px; }
</style>