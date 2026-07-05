<script lang="ts">
  import type { LevelingResult } from '../../types'
  import { formatNumber } from '../../leveling/calculator'
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

  let pending = $derived(results.filter(r => !r.done90 && r.xpPerHour > 0))
  let maxXp = $derived(Math.max(1, ...pending.map(r => r.xpPerHour)))
  let barW = $derived(pending.length > 0 ? Math.min(40, innerW / pending.length - 2) : 0)

  function barX(i: number): number {
    const spacing = innerW / pending.length
    return PAD_L + i * spacing + (spacing - barW) / 2
  }

  function barH(xp: number): number {
    return (xp / maxXp) * innerH
  }

  function barY(xp: number): number {
    return PAD_T + innerH - barH(xp)
  }
</script>

{#if pending.length > 0}
  <svg viewBox="0 0 {W} {H}" class="lvl-chart" preserveAspectRatio="xMidYMid meet">
    {#each pending as r, i (r.nombre)}
      <rect
        x={barX(i)}
        y={barY(r.xpPerHour)}
        width={barW}
        height={barH(r.xpPerHour)}
        rx="2"
        class="lvl-bar"
        fill={PERS_CLASS_COLORS[CLASS_MAP[r.clase] ?? 'warrior']}
      ><title>{r.nombre}: {formatNumber(r.xpPerHour)} XP/h</title></rect>
      {#if barW >= 18}
        <text
          x={barX(i) + barW / 2}
          y={barY(r.xpPerHour) - 2}
          text-anchor="middle"
          class="lvl-chart-val"
        >{formatNumber(r.xpPerHour)}</text>
      {/if}
      <text
        x={barX(i) + barW / 2}
        y={H - 4}
        text-anchor="middle"
        class="lvl-chart-label"
        transform="rotate(-30 {barX(i) + barW / 2} {H - 4})"
      >{r.nombre.slice(0, 6)}</text>
    {/each}
    {#each [0.25, 0.5, 0.75] as pct}
      <line x1={PAD_L} y1={PAD_T + innerH * (1 - pct)} x2={W - PAD_R} y2={PAD_T + innerH * (1 - pct)} class="lvl-chart-grid" />
    {/each}
    <line x1={PAD_L} y1={PAD_T + innerH} x2={W - PAD_R} y2={PAD_T + innerH} class="lvl-chart-axis-line" />
  </svg>
{:else}
  <p class="lvl-chart-empty">Sin datos de XP/hora</p>
{/if}

<style>
  .lvl-chart {
    width: 100%;
    height: auto;
  }
  :global(.lvl-bar) {
    opacity: var(--chart-bar-opacity, 0.85);
    stroke: var(--chart-bar-stroke, none);
    stroke-width: 0.5;
    transition: opacity 0.15s, filter 0.15s;
  }
  :global(.lvl-bar:hover) {
    opacity: 1;
    filter: brightness(1.25);
  }
  :global(.lvl-chart-grid) {
    stroke: var(--chart-grid, rgba(255,255,255,0.05));
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
  .lvl-chart-empty {
    font-size: 0.5rem;
    color: var(--text-dim);
    text-align: center;
    padding: 20px 0;
  }
</style>