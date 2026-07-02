<script lang="ts">
  import type { LevelingResult } from '../../types'
  import { clsClass } from '../../constants'

  let { results }: { results: LevelingResult[] } = $props()

  const W = 300
  const H = 120
  const PAD_L = 4
  const PAD_R = 4
  const PAD_T = 8
  const PAD_B = 16
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B

  let pending = $derived(results.filter(r => r.xpRemaining > 0))
  let maxDungeons = $derived(Math.max(1, ...pending.map(r => r.dungeons)))
  let barW = $derived(pending.length > 0 ? Math.min(40, innerW / pending.length - 2) : 0)

  function barX(i: number): number {
    const spacing = innerW / pending.length
    return PAD_L + i * spacing + (spacing - barW) / 2
  }

  function barH(dungeons: number): number {
    return (dungeons / maxDungeons) * innerH
  }

  function barY(dungeons: number): number {
    return PAD_T + innerH - barH(dungeons)
  }
</script>

<svg viewBox="0 0 {W} {H}" class="lvl-chart" preserveAspectRatio="xMidYMid meet">
  {#each pending as r, i (r.nombre)}
    <rect
      x={barX(i)}
      y={barY(r.dungeons)}
      width={barW}
      height={barH(r.dungeons)}
      rx="2"
      fill={clsClass(r.clase)}
      opacity="0.8"
    />
    {#if barW >= 18}
      <text
        x={barX(i) + barW / 2}
        y={barY(r.dungeons) - 2}
        text-anchor="middle"
        class="lvl-chart-val"
      >{r.dungeons}</text>
    {/if}
    <text
      x={barX(i) + barW / 2}
      y={H - 4}
      text-anchor="middle"
      class="lvl-chart-label"
      transform="rotate(-30 {barX(i) + barW / 2} {H - 4})"
    >{r.nombre.slice(0, 6)}</text>
  {/each}
  <line x1={PAD_L} y1={PAD_T + innerH} x2={W - PAD_R} y2={PAD_T + innerH} stroke="rgba(255,255,255,0.1)" stroke-width="0.5" />
</svg>

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
</style>