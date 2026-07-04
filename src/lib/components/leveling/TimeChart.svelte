<script lang="ts">
  import type { LevelingResult } from '../../types'
  import { formatHours } from '../../leveling/calculator'
  import { CLASS_MAP, PERS_CLASS_COLORS } from '../../constants'

  let { results }: { results: LevelingResult[] } = $props()

  const W = 300
  const H = 120
  const PAD_L = 4
  const PAD_R = 4
  const PAD_T = 8
  const PAD_B = 16
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B

  let pending = $derived(results.filter(r => !r.done90))
  let maxTime = $derived(Math.max(1, ...pending.map(r => r.timeTo90)))
  let barW = $derived(pending.length > 0 ? Math.min(40, innerW / pending.length - 2) : 0)

  function barX(i: number): number {
    const spacing = innerW / pending.length
    return PAD_L + i * spacing + (spacing - barW) / 2
  }

  function barH(hours: number): number {
    return (hours / maxTime) * innerH
  }

  function barY(hours: number): number {
    return PAD_T + innerH - barH(hours)
  }
</script>

<svg viewBox="0 0 {W} {H}" class="lvl-chart" preserveAspectRatio="xMidYMid meet">
  {#each pending as r, i (r.nombre)}
    <rect
      x={barX(i)}
      y={barY(r.timeTo90)}
      width={barW}
      height={barH(r.timeTo90)}
      rx="2"
      class="lvl-bar"
      fill={PERS_CLASS_COLORS[CLASS_MAP[r.clase] ?? 'warrior']}
    />
    {#if barW >= 18}
      <text
        x={barX(i) + barW / 2}
        y={barY(r.timeTo90) - 2}
        text-anchor="middle"
        class="lvl-chart-val"
      >{formatHours(r.timeTo90)}</text>
    {/if}
    <text
      x={barX(i) + barW / 2}
      y={H - 4}
      text-anchor="middle"
      class="lvl-chart-label"
      transform="rotate(-30 {barX(i) + barW / 2} {H - 4})"
    >{r.nombre.slice(0, 6)}</text>
  {/each}
  <line x1={PAD_L} y1={PAD_T + innerH} x2={W - PAD_R} y2={PAD_T + innerH} class="lvl-chart-axis-line" />
</svg>

<style>
  .lvl-chart {
    width: 100%;
    height: auto;
  }
  :global(.lvl-bar) {
    opacity: var(--chart-bar-opacity, 0.85);
    stroke: var(--chart-bar-stroke, none);
    stroke-width: 0.5;
  }
  :global(.lvl-chart-axis-line) {
    stroke: var(--chart-axis-line, rgba(255,255,255,0.1));
    stroke-width: 0.5;
  }
  :global(.lvl-chart-val) {
    fill: var(--chart-val, var(--gold-light));
    font-size: 5px;
    font-family: var(--font-heading);
  }
  :global(.lvl-chart-label) {
    fill: var(--chart-label, var(--text-muted));
    font-size: 5px;
  }
</style>