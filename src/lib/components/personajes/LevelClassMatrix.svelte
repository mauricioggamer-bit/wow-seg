<script lang="ts">
  import type { Personaje } from '../../types'
  import { computeLevelClassMatrix, PERS_CLASS_COLORS } from './personajes-charts-data'
  import type { LevelClassCell } from './personajes-charts-data'

  let { personajes }: { personajes: Personaje[] } = $props()

  let data = $derived(computeLevelClassMatrix(personajes))

  const CELL = 16
  const GAP = 1
  const LABEL_W = 46
  const HEADER_H = 16
  const SVG_W = 580

  function maxCount(): number {
    let m = 0
    for (const row of Object.values(data.matrix)) {
      for (const cell of Object.values(row)) {
        if (cell.count > m) m = cell.count
      }
    }
    return Math.max(1, m)
  }

  function cellColor(cell: LevelClassCell | undefined): string {
    if (!cell || cell.count === 0) return '#1a1a1a'
    const intensity = Math.min(1, 0.15 + (cell.count / maxCount()) * 0.85)
    return `rgba(60, 190, 255, ${intensity})`
  }

  function cellTitle(bucket: string, cls: string, cell: LevelClassCell | undefined): string {
    if (!cell || cell.count === 0) return `${bucket} · ${cls}: 0`
    return `${bucket} · ${cls}: ${cell.count} pj — ${cell.names.join(', ')}`
  }

  let svgH = $derived(HEADER_H + data.buckets.length * (CELL + GAP) + 10)

  interface Tooltip { x: number; y: number; text: string }
  let tooltip = $state<Tooltip | null>(null)

  function showTt(e: MouseEvent, text: string) {
    const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect()
    tooltip = { x: rect.left + rect.width / 2, y: rect.top - 4, text }
  }
  function hideTt() { tooltip = null }
</script>

<div class="lc-wrap" style="position:relative">
  <svg viewBox="0 0 {SVG_W} {svgH}" class="lc-svg">
    {#each data.classes as ck, ci}
      <text x={LABEL_W + ci * (CELL + GAP) + CELL / 2} y={HEADER_H - 4} text-anchor="middle" fill={PERS_CLASS_COLORS[ck] || '#e0e0e0'} font-size="7">{ck}</text>
    {/each}

    {#each data.buckets as bucket, ri}
      <text x={LABEL_W - 4} y={HEADER_H + ri * (CELL + GAP) + CELL / 2 + 1} text-anchor="end" dominant-baseline="middle" fill="#e0e0e0" font-size="6.5">{bucket.label}</text>

      {#each data.classes as ck, ci}
        {@const cell = data.matrix[bucket.label]?.[ck]}
        <rect
          x={LABEL_W + ci * (CELL + GAP)} y={HEADER_H + ri * (CELL + GAP)}
          width={CELL} height={CELL} rx="1.5"
          fill={cellColor(cell)}
          opacity="0.9"
          style="cursor:pointer"
          onmouseenter={(e) => showTt(e, cellTitle(bucket.label, ck, cell))}
          onmouseleave={hideTt}
        />
        {#if cell && cell.count > 0}
          <text x={LABEL_W + ci * (CELL + GAP) + CELL / 2} y={HEADER_H + ri * (CELL + GAP) + CELL / 2 + 1} text-anchor="middle" dominant-baseline="middle" fill={cell.count > 1 ? '#1a1a1a' : '#e0e0e0'} font-size="5.5">
            {cell.count}
          </text>
        {/if}
      {/each}
    {/each}
  </svg>

  {#if tooltip}
    <div class="lc-tooltip" style="left:{tooltip.x}px;top:{tooltip.y}px">{tooltip.text}</div>
  {/if}
</div>

<style>
  .lc-wrap { width: 100%; overflow-x: auto; overflow-y: auto; max-height: 420px; }
  .lc-svg { display: block; }
  .lc-tooltip { position: fixed; transform: translate(-50%, -100%); background: var(--bg-panel, #1a1a1a); border: 1px solid var(--gold, #d4af37); border-radius: var(--r-sm); padding: 4px 8px; z-index: 1100; pointer-events: none; white-space: nowrap; box-shadow: 0 4px 16px rgba(0,0,0,0.5); font-size: 0.55rem; color: var(--text-secondary, #aaa); }
</style>
