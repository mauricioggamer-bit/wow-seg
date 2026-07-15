<script lang="ts">
  import type { Personaje } from '../../types'
  import { PERS_RACE_INFO } from '../../constants'
  import { computeRaceClassMatrix, PERS_CLASS_COLORS } from './personajes-charts-data'
  import type { RaceClassCell } from './personajes-charts-data'

  let { personajes }: { personajes: Personaje[] } = $props()

  let data = $derived(computeRaceClassMatrix(personajes))

  const CELL = 26
  const GAP = 2
  const LABEL_W = 165
  const HEADER_H = 55
  const SVG_W = 1050

  function maxCount(): number {
    let m = 0
    for (const row of Object.values(data.matrix)) {
      for (const cell of Object.values(row)) {
        if (cell.count > m) m = cell.count
      }
    }
    return Math.max(1, m)
  }

  function cellColor(cell: RaceClassCell | undefined): string {
    if (!cell || cell.count === 0) return '#1a1a1a'
    const intensity = Math.min(1, 0.15 + (cell.count / maxCount()) * 0.85)
    return `rgba(212, 175, 55, ${intensity})`
  }

  function cellTitle(race: string, cls: string, cell: RaceClassCell | undefined): string {
    if (!cell || cell.count === 0) return `${race} · ${cls}: 0`
    return `${race} · ${cls}: ${cell.count} pj — ${cell.names.join(', ')}`
  }

  let svgH = $derived(HEADER_H + data.races.length * (CELL + GAP) + 10)

  interface Tooltip { x: number; y: number; text: string }
  let tooltip = $state<Tooltip | null>(null)

  function showTt(e: MouseEvent, text: string) {
    const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect()
    tooltip = { x: rect.left + rect.width / 2, y: rect.top - 4, text }
  }
  function hideTt() { tooltip = null }
</script>

<div class="rc-wrap" style="position:relative">
  <svg viewBox="0 0 {SVG_W} {svgH}" class="rc-svg">
    {#each data.classes as ck, ci}
      {@const hx = LABEL_W + ci * (CELL + GAP) + CELL / 2}
      <text x={hx} y={HEADER_H - 4} text-anchor="start" fill={PERS_CLASS_COLORS[ck] || '#e0e0e0'} font-size="11" transform="rotate(-45, {hx}, {HEADER_H - 4})">{ck}</text>
    {/each}

    {#each data.races as race, ri}
      {@const info = PERS_RACE_INFO[race] || { icon: '❓', type: '' }}
      <text x={LABEL_W - 4} y={HEADER_H + ri * (CELL + GAP) + CELL / 2 + 1} text-anchor="end" dominant-baseline="middle" fill="#e0e0e0" font-size="10">
        {info.icon} {race}
      </text>

      {#each data.classes as ck, ci}
        {@const cell = data.matrix[race]?.[ck]}
        <rect
          x={LABEL_W + ci * (CELL + GAP)} y={HEADER_H + ri * (CELL + GAP)}
          width={CELL} height={CELL} rx="1.5"
          fill={cellColor(cell)}
          opacity="0.9"
          style="cursor:pointer"
          onmouseenter={(e) => showTt(e, cellTitle(race, ck, cell))}
          onmouseleave={hideTt}
        />
        {#if cell && cell.count > 0}
          <text x={LABEL_W + ci * (CELL + GAP) + CELL / 2} y={HEADER_H + ri * (CELL + GAP) + CELL / 2 + 1} text-anchor="middle" dominant-baseline="middle" fill={cell.count > 1 ? '#1a1a1a' : '#e0e0e0'} font-size="9.5">
            {cell.count}
          </text>
        {/if}
      {/each}
    {/each}
  </svg>

  {#if tooltip}
    <div class="rc-tooltip" style="left:{tooltip.x}px;top:{tooltip.y}px">{tooltip.text}</div>
  {/if}
</div>

<style>
  .rc-wrap { width: 100%; overflow-x: auto; overflow-y: auto; max-height: 420px; }
  .rc-svg { display: block; }
  .rc-tooltip { position: fixed; transform: translate(-50%, -100%); background: var(--bg-panel, #1a1a1a); border: 1px solid var(--gold, #d4af37); border-radius: var(--r-sm); padding: 4px 8px; z-index: 1100; pointer-events: none; white-space: nowrap; box-shadow: 0 4px 16px rgba(0,0,0,0.5); font-size: 0.65rem; color: var(--text-secondary, #aaa); }
</style>
