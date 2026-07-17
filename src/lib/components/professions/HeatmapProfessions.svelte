<script lang="ts">
  import type { Personaje } from '../../types'
  import { PROFESIONES } from '../../constants/profesiones'
  import { computeCharProfMatrix, sortByClass, classKey, PERS_CLASS_COLORS } from './profession-charts-data'
  import type { CharProfCell } from './profession-charts-data'
  import ChartLegend from '../ChartLegend.svelte'

  let {
    personajes,
    profOrden,
  }: {
    personajes: Personaje[]
    profOrden: string[]
  } = $props()

  let sortedProfs = $derived(
    [...PROFESIONES].sort((a, b) => profOrden.indexOf(a.id) - profOrden.indexOf(b.id))
  )

  let matrix = $derived(computeCharProfMatrix(personajes))

  let sortedChars = $derived(sortByClass(personajes))

  interface CharGroup {
    clase: string
    chars: Personaje[]
  }

  let groups = $derived.by<CharGroup[]>(() => {
    const map = new Map<string, Personaje[]>()
    for (const c of sortedChars) {
      if (!map.has(c.clase)) map.set(c.clase, [])
      map.get(c.clase)!.push(c)
    }
    return [...map.entries()].map(([clase, chars]) => ({ clase, chars }))
  })

  const CELL = 18
  const GAP = 1
  const LABEL_W = 130
  const COL_H = 20
  const HEADER_H = 16
  const GROUP_GAP = 5
  const GROUP_HEADER_H = 12

  function groupH(chars: Personaje[]): number {
    return GROUP_HEADER_H + chars.length * COL_H + GROUP_GAP
  }

  function truncateName(s: string, max = 12): string {
    return s.length > max ? s.slice(0, max - 1) + '…' : s
  }

  function cellColor(cell: CharProfCell | null): string {
    if (!cell) return '#222'
    if (cell.rol === '1ro') return '#d4af37'
    if (cell.rol === '2do') return '#3a7bd5'
    if (cell.rol === '3ro') return '#5a9bd5'
    if (cell.rol === '4to') return '#7abbf5'
    return '#555'
  }

  function cellTitle(cell: CharProfCell | null, profName: string, charName: string): string {
    if (!cell) return `${charName} — ${profName}: vacío`
    const rolLabel = cell.rol === 'none' ? 'Sin rol' : cell.rol
    return `${charName} — ${profName}: slot ${cell.slot + 1}, ${rolLabel}`
  }

  interface Tooltip {
    x: number
    y: number
    text: string
  }

  let tooltip = $state<Tooltip | null>(null)

  let svgH = $derived(HEADER_H + groups.reduce((s, g) => s + GROUP_HEADER_H + g.chars.length * COL_H + GROUP_GAP, 0) + 10)

  function showCellTooltip(e: MouseEvent, text: string) {
    const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect()
    tooltip = { x: rect.left + rect.width / 2, y: rect.top - 4, text }
  }

  function hideCellTooltip() {
    tooltip = null
  }
</script>

<ChartLegend items={[
  { color: '#d4af37', label: '1ro' },
  { color: '#3a7bd5', label: '2do' },
  { color: '#5a9bd5', label: '3ro' },
  { color: '#7abbf5', label: '4to' },
  { color: '#555', label: 'Sin rol' },
]} />

<div class="hm-wrap" style="position:relative">
  <svg viewBox="0 0 {LABEL_W + sortedProfs.length * (CELL + GAP) + 12} {svgH}" class="hm-svg">
    <!-- column headers -->
    {#each sortedProfs as prof, ci}
      <text
        x={LABEL_W + ci * (CELL + GAP) + CELL / 2}
        y={HEADER_H - 5}
        text-anchor="middle"
        fill="#e0e0e0"
        font-size="10"
      ><title>{prof.nombre}</title>{prof.icon}</text>
    {/each}

    <!-- rows grouped by class -->
  {#each groups as group}
      {@const groupIdx = groups.indexOf(group)}
      {@const gy = HEADER_H + groups.slice(0, groupIdx).reduce((s, g) => s + GROUP_HEADER_H + g.chars.length * COL_H + GROUP_GAP, 0)}
      <text
        x={LABEL_W - 2}
        y={gy + 8}
        text-anchor="end"
        fill={PERS_CLASS_COLORS[classKey(group.clase)] || '#888'}
        font-size="11"
        font-weight="700"
      >{group.clase}</text>

      {#each group.chars as c, ri}
        <text
          x={LABEL_W - 4}
          y={gy + GROUP_HEADER_H + ri * COL_H + COL_H / 2 + 1}
          text-anchor="end"
          dominant-baseline="middle"
          fill={PERS_CLASS_COLORS[classKey(c.clase)] || '#aaa'}
          font-size="10"
        ><title>{c.nombre}</title>{truncateName(c.nombre)}</text>

        {#each sortedProfs as prof, ci}
          {@const cell = matrix[c.nombre]?.[prof.id] ?? null}
          <rect
            x={LABEL_W + ci * (CELL + GAP)}
            y={gy + GROUP_HEADER_H + ri * COL_H}
            width={CELL}
            height={CELL}
            fill={cellColor(cell)}
            rx="1.5"
            opacity="0.85"
            style="cursor:pointer"
            onmouseenter={(e) => showCellTooltip(e, cellTitle(cell, prof.nombre, c.nombre))}
            onmouseleave={hideCellTooltip}
          />
        {/each}
      {/each}
    {/each}
  </svg>

  {#if tooltip}
    <div class="hm-tooltip" style="left:{tooltip.x}px;top:{tooltip.y}px">
      {tooltip.text}
    </div>
  {/if}
</div>

<style>
  .hm-wrap {
    width: 100%;
    overflow-x: auto;
    overflow-y: auto;
    max-height: 420px;
  }
  .hm-svg {
    display: block;
  }
  .hm-tooltip {
    position: fixed;
    transform: translate(-50%, -100%);
    background: var(--bg-panel, #1a1a1a);
    border: 1px solid var(--gold, #d4af37);
    border-radius: var(--r-sm);
    padding: 4px 8px;
    z-index: 1100;
    pointer-events: none;
    white-space: nowrap;
    box-shadow: 0 4px 16px rgba(0,0,0,0.5);
    font-size: 0.65rem;
    color: var(--text-secondary, #aaa);
  }
</style>
