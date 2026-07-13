<script lang="ts">
  import type { Personaje } from '../../types'
  import { dataStore } from '../../stores/data'
  import { PROFESIONES, profesionNombre } from '../../constants/profesiones'
  import Dialog from '../Dialog.svelte'
  import BarChartProfessions from './BarChartProfessions.svelte'
  import HeatmapProfessions from './HeatmapProfessions.svelte'
  import ChordProfessions from './ChordProfessions.svelte'
  import BubbleChartProfessions from './BubbleChartProfessions.svelte'
  import {
    computeProfCounts,
    computeCharProfMatrix,
    computePairMatrix,
    computeProfAvgValues,
  } from './profession-charts-data'

  let {
    show = $bindable(false),
    personajes,
    profType,
    profSlot,
    filterMain,
    filterCD,
    filterNone,
  }: {
    show?: boolean
    personajes: Personaje[]
    profType: 'todas' | 'recoleccion' | 'artesania'
    profSlot: 'ambas' | 'primera' | 'segunda'
    filterMain: boolean
    filterCD: boolean
    filterNone: boolean
  } = $props()

  let tab = $state<'bars' | 'heatmap' | 'chord' | 'bubble'>('bars')

  let profOrden = $derived($dataStore.profesionOrden ?? PROFESIONES.map(p => p.id))

  let profCounts = $derived(computeProfCounts(personajes, profType, profSlot, filterMain, filterCD, filterNone))

  let pairMatrix = $derived(computePairMatrix(personajes))
  let maxPairCount = $derived(
    Math.max(1, ...Object.values(pairMatrix).flatMap(row => Object.values(row)))
  )

  let profAvgValues = $derived(computeProfAvgValues())

  const TABS: { id: typeof tab; label: string; icon: string }[] = [
    { id: 'bars', label: 'Barras', icon: '📊' },
    { id: 'heatmap', label: 'Matriz', icon: '🌡️' },
    { id: 'chord', label: 'Pares', icon: '🔗' },
    { id: 'bubble', label: 'Valor', icon: '💠' },
  ]
</script>

<Dialog show={show} title="Análisis de profesiones" onclose={() => show = false}>
  <div class="pcm-tabs">
    {#each TABS as t}
      <button
        class="pcm-tab"
        class:pcm-tab-active={tab === t.id}
        onclick={() => tab = t.id}
      >{t.icon} {t.label}</button>
    {/each}
  </div>

  <div class="pcm-content">
    {#if tab === 'bars'}
      <BarChartProfessions {profCounts} totalChars={personajes.length} />
    {:else if tab === 'heatmap'}
      <HeatmapProfessions personajes={personajes} profOrden={profOrden} />
    {:else if tab === 'chord'}
      <ChordProfessions {profCounts} {pairMatrix} {maxPairCount} />
    {:else if tab === 'bubble'}
      <BubbleChartProfessions {profCounts} {profAvgValues} totalChars={personajes.length} />
    {/if}
  </div>
</Dialog>

<style>
  .pcm-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }
  .pcm-tab {
    font-size: 0.65rem;
    padding: 3px 10px;
    border: 1px solid var(--border, #444);
    border-radius: var(--r-sm, 4px);
    background: transparent;
    color: var(--text-secondary, #aaa);
    cursor: pointer;
    transition: all 0.12s;
    font-family: var(--font-heading);
  }
  .pcm-tab:hover {
    border-color: var(--gold, #d4af37);
    color: #e0e0e0;
  }
  .pcm-tab-active {
    background: var(--gold, #d4af37);
    color: #1a1a1a;
    border-color: var(--gold, #d4af37);
    font-weight: 600;
  }
  .pcm-content {
    min-height: 200px;
  }
</style>
