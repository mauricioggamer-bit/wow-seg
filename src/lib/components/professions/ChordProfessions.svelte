<script lang="ts">
  import { PROFESIONES, profesionNombre, profesionIcon } from '../../constants/profesiones'
  import { RECOLECCION_IDS } from './profession-charts-data'
  import type { PairMatrix, ProfCount } from './profession-charts-data'

  let {
    profCounts,
    pairMatrix,
    maxPairCount,
  }: {
    profCounts: ProfCount[]
    pairMatrix: PairMatrix
    maxPairCount: number
  } = $props()

  const CX = 280
  const CY = 280
  const R = 170
  const NODE_R_MIN = 6
  const NODE_R_MAX = 20
  const LABEL_R = 205
  const SVG_SIZE = 560

  let maxProfCount = $derived(Math.max(1, ...profCounts.map(p => p.count)))

  let nodes = $derived(
    profCounts.map((p, i) => {
      const angle = (i / profCounts.length) * Math.PI * 2 - Math.PI / 2
      const x = CX + R * Math.cos(angle)
      const y = CY + R * Math.sin(angle)
      const lx = CX + LABEL_R * Math.cos(angle)
      const ly = CY + LABEL_R * Math.sin(angle)
      const labelAnchor = lx > CX ? 'start' : 'end'
      return {
        ...p,
        angle,
        x,
        y,
        lx,
        ly,
        labelAnchor,
        r: NODE_R_MIN + (p.count / maxProfCount) * (NODE_R_MAX - NODE_R_MIN),
      }
    })
  )

  let edges = $derived.by(() => {
    const result: { from: string; to: string; fromName: string; toName: string; count: number; thickness: number }[] = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const count = pairMatrix[nodes[i].id]?.[nodes[j].id] ?? 0
        if (count > 0) {
          result.push({
            from: nodes[i].id,
            to: nodes[j].id,
            fromName: nodes[i].nombre,
            toName: nodes[j].nombre,
            count,
            thickness: Math.max(1, (count / maxPairCount) * 10),
          })
        }
      }
    }
    return result
  })

  function nodeColor(esRecoleccion: boolean): string {
    return esRecoleccion ? '#4caf50' : '#ff9800'
  }

  interface Tooltip {
    x: number
    y: number
    text: string
  }

  let tooltip = $state<Tooltip | null>(null)

  function showNodeTooltip(e: MouseEvent, p: ProfCount) {
    const rect = (e.currentTarget as SVGCircleElement).getBoundingClientRect()
    const pct = profCounts.length > 0 ? ((p.count / profCounts.reduce((s, c) => s + c.count, 0)) * 100).toFixed(1) : '0'
    tooltip = {
      x: rect.left + rect.width / 2,
      y: rect.top - 4,
      text: `${p.nombre} · ${p.count} pj · ${p.mains}⭐ main · ${p.cds}⏱️ cd`,
    }
  }

  function showEdgeTooltip(e: MouseEvent, fromName: string, toName: string, count: number) {
    const rect = (e.currentTarget as SVGLineElement).getBoundingClientRect()
    tooltip = {
      x: rect.left + rect.width / 2,
      y: rect.top - 4,
      text: `${fromName} ↔ ${toName}: ${count} pj comparten ambas`,
    }
  }

  function hideTooltip() {
    tooltip = null
  }
</script>

<div class="chord-wrap" style="position:relative">
  <svg viewBox="0 0 {SVG_SIZE} {SVG_SIZE}" class="chord-svg">
    <!-- edges -->
    {#each edges as edge}
      {@const from = nodes.find(n => n.id === edge.from)}
      {@const to = nodes.find(n => n.id === edge.to)}
      {#if from && to}
        <line
          x1={from.x} y1={from.y}
          x2={to.x} y2={to.y}
          stroke={nodeColor(from.esRecoleccion)}
          stroke-width={Math.max(0.5, edge.thickness)}
          opacity="0.35"
          style="cursor:pointer"
          onmouseenter={(e) => showEdgeTooltip(e, edge.fromName, edge.toName, edge.count)}
          onmouseleave={hideTooltip}
        />
      {/if}
    {/each}

    <!-- nodes -->
    {#each nodes as node}
      <circle
        cx={node.x} cy={node.y} r={node.r}
        fill={nodeColor(node.esRecoleccion)}
        stroke="#1a1a1a"
        stroke-width="1.5"
        opacity="0.9"
        style="cursor:pointer"
        onmouseenter={(e) => showNodeTooltip(e, node)}
        onmouseleave={hideTooltip}
      />
      <text
        x={node.x} y={node.y}
        text-anchor="middle" dominant-baseline="middle"
        fill="#fff" font-size="8"
        pointer-events="none"
      >{node.icon}</text>

      <!-- label line -->
      <line x1={node.lx < node.x ? node.x - node.r : node.x + node.r} y1={node.y} x2={node.lx} y2={node.ly} stroke="var(--border-subtle, #444)" stroke-width="0.5" />
      <text
        x={node.lx + (node.labelAnchor === 'start' ? 4 : -4)}
        y={node.ly + 3}
        text-anchor={node.labelAnchor}
        fill="#e0e0e0"
        font-size="7.5"
      >{node.nombre}</text>
    {/each}
  </svg>

  {#if tooltip}
    <div class="chord-tooltip" style="left:{tooltip.x}px;top:{tooltip.y}px">
      {tooltip.text}
    </div>
  {/if}
</div>

<style>
  .chord-wrap {
    width: 100%;
    overflow: visible;
    display: flex;
    justify-content: center;
  }
  .chord-svg {
    width: min(500px, 100%);
    height: auto;
    display: block;
  }
  .chord-tooltip {
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
