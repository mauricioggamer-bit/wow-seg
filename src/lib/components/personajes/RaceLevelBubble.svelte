<script lang="ts">
  import type { Personaje } from '../../types'
  import { PERS_RACE_INFO, PERS_CLASS_ICONS } from '../../constants'
  import { classKey, PERS_CLASS_COLORS, RACE_FACTION, FACTION_COLORS } from './personajes-charts-data'

  let { personajes }: { personajes: Personaje[] } = $props()

  let races = $derived([...new Set(personajes.map(c => c.raza))].sort((a, b) => {
    const fa = RACE_FACTION[a] || ''
    const fb = RACE_FACTION[b] || ''
    if (fa !== fb) return fa === 'Alianza' ? -1 : 1
    return a.localeCompare(b)
  }))

  const MARGIN = { top: 20, right: 30, bottom: 34, left: 36 }
  const CHART_W = 625
  const CHART_H = 420
  const SVG_W = CHART_W + MARGIN.left + MARGIN.right
  const SVG_H = CHART_H + MARGIN.top + MARGIN.bottom

  let maxLevel = 90

  function xPos(race: string): number {
    const idx = races.indexOf(race)
    return MARGIN.left + (idx / Math.max(1, races.length - 1)) * CHART_W
  }

  function yPos(level: number): number {
    return MARGIN.top + CHART_H - (level / (maxLevel * 1.1)) * CHART_H
  }

  function bubbleR(level: number): number {
    return Math.max(6, 6 + (level / maxLevel) * 18)
  }

  function raceColor(race: string): string {
    return FACTION_COLORS[RACE_FACTION[race]] || '#888'
  }

  const Y_GRIDLINES = [10, 30, 50, 70, 90]

  interface Bubble { c: Personaje; cx: number; cy: number; r: number }

  let bubbles = $derived.by<Bubble[]>(() => {
    const seen = new Map<string, number>()
    return personajes.map(c => {
      const key = `${c.raza}|${c.nivel}`
      const idx = seen.get(key) ?? 0
      seen.set(key, idx + 1)
      const jitter = idx === 0 ? 0 : (idx % 2 === 0 ? 1 : -1) * Math.min(14, Math.ceil(idx / 2) * 5)
      return { c, cx: xPos(c.raza) + jitter, cy: yPos(c.nivel), r: bubbleR(c.nivel) }
    })
  })

  interface Tooltip { x: number; y: number; text: string }
  let tooltip = $state<Tooltip | null>(null)

  function showTt(e: MouseEvent, c: Personaje) {
    const rect = (e.currentTarget as SVGCircleElement).getBoundingClientRect()
    const ck = classKey(c.clase)
    const icon = PERS_CLASS_ICONS[ck] || '?'
    tooltip = {
      x: rect.left + rect.width / 2,
      y: rect.top - 4,
      text: `${c.nombre} · ${c.clase} ${icon} · Nv.${c.nivel} · ${c.raza} · ${c.faccion}`,
    }
  }
  function hideTt() { tooltip = null }
</script>

<div class="rb-wrap" style="position:relative">
  <svg viewBox="0 0 {SVG_W} {SVG_H}" class="rb-svg">
    <line x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={MARGIN.top + CHART_H} stroke="var(--border-subtle, #444)" stroke-width="1" />
    <line x1={MARGIN.left} y1={MARGIN.top + CHART_H} x2={MARGIN.left + CHART_W} y2={MARGIN.top + CHART_H} stroke="var(--border-subtle, #444)" stroke-width="1" />

    {#each Y_GRIDLINES as lvl}
      <line x1={MARGIN.left} y1={yPos(lvl)} x2={MARGIN.left + CHART_W} y2={yPos(lvl)} stroke="var(--border-subtle, #444)" stroke-width="0.5" stroke-dasharray="2,3" opacity="0.5" />
      <text x={MARGIN.left - 4} y={yPos(lvl) + 3} text-anchor="end" fill="#888" font-size="10">{lvl}</text>
    {/each}

    {#each races as race}
      <text x={xPos(race)} y={MARGIN.top + CHART_H + 14} text-anchor="end" fill={raceColor(race)} font-size="10" transform="rotate(-45, {xPos(race)}, {MARGIN.top + CHART_H + 14})">{race}</text>
    {/each}

    {#each bubbles as b}
      {@const ck = classKey(b.c.clase)}
      <circle
        cx={b.cx} cy={b.cy} r={b.r}
        fill={PERS_CLASS_COLORS[ck] || '#888'}
        opacity="0.7"
        stroke="#1a1a1a" stroke-width="0.8"
        style="cursor:pointer"
        onmouseenter={(e) => showTt(e, b.c)}
        onmouseleave={hideTt}
      />
    {/each}
  </svg>

  {#if tooltip}
    <div class="rb-tooltip" style="left:{tooltip.x}px;top:{tooltip.y}px">{tooltip.text}</div>
  {/if}
</div>

<style>
  .rb-wrap { width: 100%; overflow-x: auto; overflow-y: auto; max-height: 420px; }
  .rb-svg { width: 100%; height: auto; display: block; min-width: 600px; }
  .rb-tooltip { position: fixed; transform: translate(-50%, -100%); background: var(--bg-panel, #1a1a1a); border: 1px solid var(--gold, #d4af37); border-radius: var(--r-sm); padding: 4px 8px; z-index: 1100; pointer-events: none; white-space: nowrap; box-shadow: 0 4px 16px rgba(0,0,0,0.5); font-size: 0.65rem; color: var(--text-secondary, #aaa); }
</style>
