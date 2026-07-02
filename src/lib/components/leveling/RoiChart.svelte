<script lang="ts">
  import type { OptimizationPlan } from '../../types'
  import { formatHours } from '../../leveling/calculator'
  import { clsClass } from '../../constants'

  let { plan }: { plan: OptimizationPlan } = $props()

  const W = 300
  const H = 100
  const PAD_L = 4
  const PAD_R = 4
  const PAD_T = 8
  const PAD_B = 16
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B

  let contributors = $derived(plan.entries.filter(e => e.timeSavedForOthers > 0))
  let maxSaved = $derived(Math.max(1, ...contributors.map(e => e.timeSavedForOthers)))
  let barW = $derived(contributors.length > 0 ? Math.min(40, innerW / contributors.length - 2) : 0)

  function barX(i: number): number {
    const spacing = innerW / contributors.length
    return PAD_L + i * spacing + (spacing - barW) / 2
  }

  function barH(saved: number): number {
    return (saved / maxSaved) * innerH
  }

  function barY(saved: number): number {
    return PAD_T + innerH - barH(saved)
  }
</script>

{#if contributors.length > 0}
  <svg viewBox="0 0 {W} {H}" class="lvl-chart" preserveAspectRatio="xMidYMid meet">
    {#each contributors as e, i (e.nombre)}
      <rect
        x={barX(i)}
        y={barY(e.timeSavedForOthers)}
        width={barW}
        height={barH(e.timeSavedForOthers)}
        rx="2"
        fill={clsClass(e.clase)}
        opacity="0.8"
      />
      {#if barW >= 18}
        <text x={barX(i) + barW / 2} y={barY(e.timeSavedForOthers) - 2} text-anchor="middle" class="lvl-chart-val">
          {formatHours(e.timeSavedForOthers)}
        </text>
      {/if}
      <text
        x={barX(i) + barW / 2}
        y={H - 4}
        text-anchor="middle"
        class="lvl-chart-label"
        transform="rotate(-30 {barX(i) + barW / 2} {H - 4})"
      >{e.nombre.slice(0, 6)}</text>
    {/each}
    <line x1={PAD_L} y1={PAD_T + innerH} x2={W - PAD_R} y2={PAD_T + innerH} stroke="rgba(255,255,255,0.1)" stroke-width="0.5" />
  </svg>
{:else}
  <p class="lvl-chart-empty">Ningún personaje genera ahorro para otros</p>
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
  .lvl-chart-empty {
    font-size: 0.5rem;
    color: var(--text-dim);
    text-align: center;
    padding: 20px 0;
  }
</style>