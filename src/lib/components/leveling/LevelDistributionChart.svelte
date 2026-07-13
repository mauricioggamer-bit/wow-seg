<script lang="ts">
  import { PERS_CLASS_COLORS, CLASS_MAP } from '../../constants'
  import Modal from './Modal.svelte'

  let {
    open = $bindable(false),
    personajes = [],
  }: {
    open?: boolean
    personajes?: { nombre: string; clase: string; nivel: number }[]
  } = $props()

  let levelMin = $state(1)
  let levelMax = $state(90)

  $effect(() => {
    if (levelMin > levelMax) levelMax = levelMin
  })
  let tooltip = $state<{ x: number; y: number; clase: string; count: number; names: string[] } | null>(null)

  const ALL_BUCKETS = Array.from({ length: 18 }, (_, i) => {
    const min = i * 5 + 1
    const max = Math.min(min + 4, 90)
    return { levelMin: min, levelMax: max, label: `${min}-${max}` }
  })

  let buckets = $derived(
    ALL_BUCKETS.filter(b => b.levelMax >= levelMin && b.levelMin <= levelMax)
  )

  let filtered = $derived(personajes.filter(p => p.nivel >= levelMin && p.nivel <= levelMax))

  function classKey(clase: string): string {
    return CLASS_MAP[clase] || 'warrior'
  }

  let bucketData = $derived(
    buckets.map(b => {
      const chars = filtered.filter(p => p.nivel >= b.levelMin && p.nivel <= b.levelMax)
      const byClass = new Map<string, { count: number; names: string[] }>()
      for (const c of chars) {
        const key = c.clase
        if (!byClass.has(key)) byClass.set(key, { count: 0, names: [] })
        const entry = byClass.get(key)!
        entry.count++
        entry.names.push(`${c.nombre} (${c.nivel})`)
      }
      const segments = [...byClass.entries()]
        .map(([clase, data]) => ({ clase, ...data }))
        .sort((a, b) => classKey(a.clase).localeCompare(classKey(b.clase)))
      let cy = MARGIN.top + CHART_H
      const segmentsWithY = segments.map(s => {
        const h = barHeight(s.count)
        cy = cy - h
        return { ...s, y: cy, h }
      })
      return { ...b, total: chars.length, segments: segmentsWithY }
    })
  )

  let maxCount = $derived(
    Math.max(1, ...buckets.map(b =>
      filtered.filter(p => p.nivel >= b.levelMin && p.nivel <= b.levelMax).length
    ))
  )

  const MARGIN = { top: 20, right: 20, bottom: 40, left: 50 }
  const CHART_W = 700
  const CHART_H = 310
  const VIEWBOX_W = CHART_W + MARGIN.left + MARGIN.right
  const VIEWBOX_H = CHART_H + MARGIN.top + MARGIN.bottom

  let barWidth = $derived(buckets.length > 0 ? (CHART_W - 4) / buckets.length : CHART_W)

  function yPos(count: number): number {
    return MARGIN.top + CHART_H - (count / maxCount) * CHART_H
  }

  function barHeight(count: number): number {
    return (count / maxCount) * CHART_H
  }

  function pickColor(clase: string): string {
    return PERS_CLASS_COLORS[classKey(clase)] || '#888'
  }

  function handleMouseenter(e: MouseEvent, names: string[], clase: string, count: number) {
    const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect()
    tooltip = { x: rect.left + rect.width / 2, y: rect.top - 4, clase, count, names }
  }

  function handleMouseleave() {
    tooltip = null
  }
</script>

<Modal bind:open title="Distribución de niveles">
  <div class="ldc-container">
    <div class="ldc-filters">
      <label class="ldc-range-label">Nivel:</label>
      <input type="range" min="1" max="90" bind:value={levelMin} class="ldc-range" />
      <input type="number" min="1" max="90" bind:value={levelMin} class="ldc-num" />
      <span class="ldc-range-sep">—</span>
      <input type="number" min="1" max="90" bind:value={levelMax} class="ldc-num" />
      <input type="range" min="1" max="90" bind:value={levelMax} class="ldc-range" />
    </div>

    <div class="ldc-chart-wrap" style="position:relative">
      <svg viewBox="0 0 {VIEWBOX_W} {VIEWBOX_H}" class="ldc-svg">
        <line x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={MARGIN.top + CHART_H} stroke="var(--border-subtle)" stroke-width="1" />
        <line x1={MARGIN.left} y1={MARGIN.top + CHART_H} x2={MARGIN.left + CHART_W} y2={MARGIN.top + CHART_H} stroke="var(--border-subtle)" stroke-width="1" />

        <text x={MARGIN.left - 8} y={yPos(0)} text-anchor="end" dominant-baseline="middle" fill="#fff" font-size="11">0</text>
        <text x={MARGIN.left - 8} y={yPos(Math.ceil(maxCount / 2))} text-anchor="end" dominant-baseline="middle" fill="#fff" font-size="11">{Math.ceil(maxCount / 2)}</text>
        <text x={MARGIN.left - 8} y={yPos(maxCount)} text-anchor="end" dominant-baseline="middle" fill="#fff" font-size="11">{maxCount}</text>

        {#each bucketData as b, i}
          {@const bx = MARGIN.left + i * barWidth}
          <text x={bx + barWidth / 2} y={MARGIN.top + CHART_H + 14} text-anchor="middle" fill="#fff" font-size="9">{b.label}</text>
          {#each b.segments as seg}
            <rect
              x={bx + 1}
              y={seg.y}
              width={Math.max(2, barWidth - 2)}
              height={Math.max(1, seg.h)}
              fill={pickColor(seg.clase)}
              opacity="0.85"
              rx="1"
              onmouseenter={(e) => handleMouseenter(e, seg.names, seg.clase, seg.count)}
              onmouseleave={handleMouseleave}
            />
            <rect
              x={bx + 1}
              y={seg.y}
              width={Math.max(2, barWidth - 2)}
              height={Math.max(1, seg.h)}
              fill="transparent"
              rx="1"
              onmouseenter={(e) => handleMouseenter(e, seg.names, seg.clase, seg.count)}
              onmouseleave={handleMouseleave}
              style="cursor:pointer"
            />
          {/each}
        {/each}
      </svg>

      {#if tooltip}
        <div class="ldc-tooltip" style="left:{tooltip.x}px;top:{tooltip.y}px">
          <div class="ldc-tt-header" style="color:{pickColor(tooltip.clase)}">
            {tooltip.clase} — {tooltip.count} pj
          </div>
          <div class="ldc-tt-list">
            {#each tooltip.names as name}
              <div class="ldc-tt-name">{name}</div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    {#if filtered.length === 0}
      <div class="ldc-empty">Sin personajes en este rango</div>
    {:else}
      <div class="ldc-total">
        {filtered.length} personaje{filtered.length !== 1 ? 's' : ''} — {bucketData.reduce((s, b) => s + b.segments.length, 0)} segmentos
      </div>
    {/if}
  </div>
</Modal>

<style>
  .ldc-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
  }
  .ldc-filters {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .ldc-range-label {
    font-size: 0.7rem;
    color: var(--text-secondary);
    font-family: var(--font-heading);
  }
  .ldc-num {
    width: 40px;
    background: var(--input-bg, #2a2a2a);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 2px 4px;
    font-size: 0.75rem;
    color: #fff;
    text-align: center;
    outline: none;
    -moz-appearance: textfield;
    appearance: textfield;
  }
  .ldc-num:focus {
    border-color: var(--gold, #d4af37);
  }
  .ldc-num::-webkit-inner-spin-button,
  .ldc-num::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .ldc-range {
    width: 80px;
    accent-color: var(--gold, #d4af37);
    cursor: pointer;
  }
  .ldc-range-sep {
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  .ldc-chart-wrap {
    position: relative;
    overflow: visible;
  }
  .ldc-svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .ldc-tooltip {
    position: fixed;
    transform: translate(-50%, -100%);
    background: var(--bg-panel, #1a1a1a);
    border: 1px solid var(--gold, #d4af37);
    border-radius: var(--r-sm);
    padding: 6px 10px;
    z-index: 1100;
    pointer-events: none;
    white-space: nowrap;
    box-shadow: 0 4px 16px rgba(0,0,0,0.5);
  }
  .ldc-tt-header {
    font-family: var(--font-heading);
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: 3px;
  }
  .ldc-tt-list {
    max-height: 160px;
    overflow-y: auto;
  }
  .ldc-tt-name {
    font-size: 0.65rem;
    color: var(--text-secondary);
    padding: 1px 0;
  }
  .ldc-empty {
    text-align: center;
    color: var(--text-dim);
    font-size: 0.75rem;
    font-style: italic;
    padding: 20px 0;
  }
  .ldc-total {
    text-align: center;
    color: var(--text-muted);
    font-size: 0.65rem;
  }
</style>
