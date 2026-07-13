<script lang="ts">
  import { dataStore, opieRingsStore } from '../../stores/data'
  import { uiStore } from '../../stores/ui'
  import type { OpieRing } from '../../opie/types'

  interface MapNode {
    key: string
    name: string
    isGhost: boolean
    ringId?: string
  }
  interface MapEdge {
    src: MapNode
    tgt: MapNode
    ringId: string
    sliceIndex: number
  }

  let { selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string) => void } = $props()

  function getMapNodes(rings: OpieRing[]): MapNode[] {
    const nodes: MapNode[] = []
    const realNames = new Set(rings.map((r) => r.name))
    for (const r of rings) nodes.push({ key: `ring:${r.id}`, name: r.name, isGhost: false, ringId: r.id })
    const ghostNames = new Set<string>()
    for (const r of rings) {
      for (const s of r.slices) {
        if (s.type === 'ring' && typeof s.arg === 'string' && s.arg && !realNames.has(s.arg)) ghostNames.add(s.arg)
      }
    }
    for (const name of ghostNames) nodes.push({ key: `ghost:${name}`, name, isGhost: true })
    return nodes
  }

  function getMapEdges(rings: OpieRing[], nodes: MapNode[]): MapEdge[] {
    const byName = new Map(nodes.map((n) => [n.name, n]))
    const edges: MapEdge[] = []
    for (const r of rings) {
      const src = nodes.find((n) => !n.isGhost && n.ringId === r.id)
      if (!src) continue
      r.slices.forEach((s, sliceIndex) => {
        if (s.type === 'ring' && typeof s.arg === 'string' && s.arg) {
          const tgt = byName.get(s.arg)
          if (tgt) edges.push({ src, tgt, ringId: r.id, sliceIndex })
        }
      })
    }
    return edges
  }

  let nodes = $derived(getMapNodes($opieRingsStore))
  let edges = $derived(getMapEdges($opieRingsStore, nodes))

  let nodePositions = $state(new Map<string, { x: number; y: number }>())
  let mapWrapEl: HTMLDivElement | undefined = $state()
  let linkPreview = $state<{ x1: number; y1: number; x2: number; y2: number } | null>(null)

  const CELL_W = 170
  const CELL_H = 110
  const PAD = 24

  $effect(() => {
    const cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length || 1)))
    for (const n of nodes) {
      if (!nodePositions.has(n.key)) {
        const idx = nodePositions.size
        const col = idx % cols
        const row = Math.floor(idx / cols)
        nodePositions.set(n.key, { x: PAD + col * CELL_W, y: PAD + row * CELL_H })
      }
    }
    for (const key of Array.from(nodePositions.keys())) {
      if (!nodes.some((n) => n.key === key)) nodePositions.delete(key)
    }
  })

  let canvasSize = $derived.by(() => {
    let maxX = 320
    let maxY = 200
    for (const p of nodePositions.values()) {
      maxX = Math.max(maxX, p.x + 180)
      maxY = Math.max(maxY, p.y + 100)
    }
    return { width: maxX, height: maxY }
  })

  function reflow() {
    nodePositions.clear()
  }

  function onNodeMouseDown(e: MouseEvent, key: string) {
    const target = e.target as HTMLElement
    if (target.closest('.mn-actions') || target.closest('.mn-handle')) return
    e.preventDefault()
    const start = nodePositions.get(key)
    if (!start) return
    const sx = e.clientX
    const sy = e.clientY
    const ox = start.x
    const oy = start.y
    function onMove(ev: MouseEvent) {
      nodePositions.set(key, { x: ox + (ev.clientX - sx), y: oy + (ev.clientY - sy) })
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function onHandleMouseDown(e: MouseEvent, node: MapNode) {
    e.stopPropagation()
    e.preventDefault()
    const p1 = nodePositions.get(node.key)
    if (!p1 || !mapWrapEl) return
    function onMove(ev: MouseEvent) {
      const rect = mapWrapEl!.getBoundingClientRect()
      linkPreview = {
        x1: p1!.x + 70,
        y1: p1!.y + 28,
        x2: ev.clientX - rect.left + mapWrapEl!.scrollLeft,
        y2: ev.clientY - rect.top + mapWrapEl!.scrollTop,
      }
    }
    function onUp(ev: MouseEvent) {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      linkPreview = null
      const targetEl = (document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null)?.closest('.mn-node') as HTMLElement | null
      if (!targetEl) return
      const targetKey = targetEl.dataset.key
      const targetNode = nodes.find((n) => n.key === targetKey)
      if (!targetNode || targetNode.key === node.key) return
      if (targetNode.name === node.name) {
        uiStore.setStatus('Un anillo no puede anidarse a sí mismo.', 'error')
        return
      }
      if (!node.ringId) return
      dataStore.addOpieSlice(node.ringId, { type: 'ring', arg: targetNode.name })
      uiStore.setStatus(`Anidado "${targetNode.name}" dentro de "${node.name}".`, 'ok')
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function removeEdge(edge: MapEdge) {
    if (!confirm(`¿Quitar el anidamiento de "${edge.tgt.name}" dentro de "${edge.src.name}"?`)) return
    dataStore.deleteOpieSlice(edge.ringId, edge.sliceIndex)
  }

  function createFromGhost(name: string) {
    const id = dataStore.addOpieRing({ name, slices: [] })
    onSelect(id)
  }

  function deleteRing(node: MapNode) {
    if (!node.ringId) return
    if (!confirm(`¿Eliminar el anillo "${node.name}"? Esto no borra automáticamente los slices que lo referencian desde otros anillos.`)) return
    dataStore.deleteOpieRing(node.ringId)
  }

  function sliceCountFor(ringId: string | undefined): number {
    if (!ringId) return 0
    return $opieRingsStore.find((r) => r.id === ringId)?.slices.length ?? 0
  }
</script>

<div class="ring-map wow-panel">
  <div class="wow-panel-header">
    <h3>Mapa de anillos</h3>
    <button class="wow-btn wow-btn-sm" onclick={reflow}>Reorganizar</button>
  </div>
  <div class="wow-panel-body">
    {#if nodes.length}
      <p class="rm-hint">
        Arrastrá los cuadros para acomodarlos. Arrastrá desde el <b>punto dorado</b> de un anillo hasta otro para anidarlo
        (crea un slice tipo <code>ring</code>). Click en una flecha para borrar esa relación. Los cuadros punteados son
        anillos referenciados que todavía no existen en esta lista.
      </p>
      <div class="rm-wrap" bind:this={mapWrapEl}>
        <div class="rm-canvas" style={`width:${canvasSize.width}px; height:${canvasSize.height}px;`}>
          <svg class="rm-svg" width={canvasSize.width} height={canvasSize.height}>
            <defs>
              <marker id="opie-arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="var(--gold)" />
              </marker>
            </defs>
            {#each edges as edge (edge.ringId + ':' + edge.sliceIndex)}
              {@const p1 = nodePositions.get(edge.src.key)}
              {@const p2 = nodePositions.get(edge.tgt.key)}
              {#if p1 && p2}
                {@const x1 = p1.x + 70}
                {@const y1 = p1.y + 28}
                {@const x2 = p2.x + 10}
                {@const y2 = p2.y + 28}
                {@const mx = (x1 + x2) / 2}
                <path
                  class="rm-edge"
                  class:ghost={edge.tgt.isGhost}
                  d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                  marker-end="url(#opie-arrowhead)"
                  role="button"
                  tabindex="-1"
                  onclick={() => removeEdge(edge)}
                />
              {/if}
            {/each}
            {#if linkPreview}
              <path
                class="rm-link-preview"
                d={`M${linkPreview.x1},${linkPreview.y1} L${linkPreview.x2},${linkPreview.y2}`}
              />
            {/if}
          </svg>
          {#each nodes as node (node.key)}
            {@const pos = nodePositions.get(node.key)}
            {#if pos}
              <div
                class="mn-node"
                class:ghost={node.isGhost}
                class:selected={!node.isGhost && node.ringId === selectedId}
                data-key={node.key}
                style={`left:${pos.x}px; top:${pos.y}px;`}
                role="button"
                tabindex="0"
                onmousedown={(e) => onNodeMouseDown(e, node.key)}
              >
                <div class="mn-title">{node.name}</div>
                <div class="mn-meta">{node.isGhost ? 'no importado' : `${sliceCountFor(node.ringId)} slice(s)`}</div>
                <div class="mn-actions">
                  {#if node.isGhost}
                    <button class="wow-btn wow-btn-sm" onclick={() => createFromGhost(node.name)}>+ Crear</button>
                  {:else}
                    <button class="wow-btn wow-btn-sm" onclick={() => onSelect(node.ringId ?? '')}>Editar</button>
                    <button class="wow-btn wow-btn-sm wow-btn-danger" onclick={() => deleteRing(node)}>Eliminar</button>
                  {/if}
                </div>
                {#if !node.isGhost}
                  <div
                    class="mn-handle"
                    title="Arrastrá para anidar este anillo dentro de otro"
                    onmousedown={(e) => onHandleMouseDown(e, node)}
                  ></div>
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {:else}
      <p class="rm-empty">Todavía no hay anillos. Creá uno desde la lista o importá un string OPie.</p>
    {/if}
  </div>
</div>

<style>
  .rm-hint {
    font-size: 0.6rem;
    color: var(--text-muted);
    line-height: 1.4;
    margin: 0 0 8px;
  }
  .rm-hint code {
    color: var(--gold-light);
  }
  .rm-empty {
    font-size: 0.65rem;
    color: var(--text-dim);
    text-align: center;
    padding: 16px;
    margin: 0;
  }
  .rm-wrap {
    width: 100%;
    max-height: 420px;
    overflow: auto;
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    background: rgba(0, 0, 0, 0.2);
  }
  .rm-canvas {
    position: relative;
  }
  .rm-svg {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }
  .rm-edge {
    fill: none;
    stroke: var(--gold);
    stroke-width: 1.5;
    cursor: pointer;
    pointer-events: stroke;
  }
  .rm-edge:hover {
    stroke: var(--gold-light);
    stroke-width: 2.5;
  }
  .rm-edge.ghost {
    stroke-dasharray: 4 3;
    opacity: 0.6;
  }
  .rm-link-preview {
    fill: none;
    stroke: var(--gold-light);
    stroke-width: 1.5;
    stroke-dasharray: 3 2;
  }
  .mn-node {
    position: absolute;
    width: 150px;
    background: var(--bg-raised);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 6px 8px;
    cursor: grab;
    user-select: none;
  }
  .mn-node.selected {
    border-color: var(--gold);
    box-shadow: 0 0 0 1px var(--gold);
  }
  .mn-node.ghost {
    border-style: dashed;
    opacity: 0.7;
  }
  .mn-title {
    font-size: 0.65rem;
    color: var(--gold-light);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mn-meta {
    font-size: 0.5rem;
    color: var(--text-dim);
    margin-bottom: 4px;
  }
  .mn-actions {
    display: flex;
    gap: 3px;
  }
  .mn-handle {
    position: absolute;
    top: 50%;
    right: -6px;
    transform: translateY(-50%);
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--gold);
    cursor: crosshair;
    border: 2px solid var(--bg-raised);
  }
</style>
