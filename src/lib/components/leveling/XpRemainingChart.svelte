<script lang="ts">
  import type { LevelingResult } from '../../types'
  import { formatNumber } from '../../leveling/calculator'
  import { clsClass } from '../../constants'

  let { results }: { results: LevelingResult[] } = $props()

  const W = 300, H = 120, PAD_L = 4, PAD_R = 4, PAD_T = 8, PAD_B = 16
  const innerW = W - PAD_L - PAD_R, innerH = H - PAD_T - PAD_B

  let pending = $derived(results.filter(r => !r.done90))
  let maxXp = $derived(Math.max(1, ...pending.map(r => r.xpTo90)))
  let barW = $derived(pending.length > 0 ? Math.min(40, innerW / pending.length - 2) : 0)

  function barX(i: number): number {
    const spacing = innerW / pending.length
    return PAD_L + i * spacing + (spacing - barW) / 2
  }
  function barH(xp: number): number { return (xp / maxXp) * innerH }
  function barY(xp: number): number { return PAD_T + innerH - barH(xp) }
</script>

{#if pending.length > 0}
  <svg viewBox="0 0 {W} {H}" class="lvl-chart" preserveAspectRatio="xMidYMid meet">
    {#each pending as r, i (r.nombre)}
      <rect x={barX(i)} y={barY(r.xpTo90)} width={barW} height={barH(r.xpTo90)} rx="2"
        fill={clsClass(r.clase)} opacity="var(--chart-bar-opacity, 0.8)"
        stroke="var(--chart-bar-stroke, none)" stroke-width="0.5" />
      {#if barW >= 18}
        <text x={barX(i) + barW / 2} y={barY(r.xpTo90) - 2} text-anchor="middle" class="lvl-chart-val">
          {formatNumber(r.xpTo90)}
        </text>
      {/if}
      <text x={barX(i) + barW / 2} y={H - 4} text-anchor="middle" class="lvl-chart-label"
        transform="rotate(-30 {barX(i) + barW / 2} {H - 4})">{r.nombre.slice(0, 6)}</text>
    {/each}
    <line x1={PAD_L} y1={PAD_T + innerH} x2={W - PAD_R} y2={PAD_T + innerH} stroke="var(--chart-axis-line, rgba(255,255,255,0.1))" stroke-width="0.5" />
  </svg>
{:else}
  <p class="lvl-chart-empty">Sin datos de XP restante</p>
{/if}

<style>
  .lvl-chart { width: 100%; height: auto; }
  :global(.lvl-chart-val) { fill: var(--chart-val, var(--gold-light)); font-size: 5px; font-family: var(--font-heading); }
  :global(.lvl-chart-label) { fill: var(--chart-label, var(--text-muted)); font-size: 5px; }
  .lvl-chart-empty { font-size: 0.5rem; color: var(--text-dim); text-align: center; padding: 20px 0; }
</style>