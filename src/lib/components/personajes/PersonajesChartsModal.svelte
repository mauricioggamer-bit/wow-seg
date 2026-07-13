<script lang="ts">
  import type { Personaje } from '../../types'
  import Dialog from '../Dialog.svelte'
  import RaceClassMatrix from './RaceClassMatrix.svelte'
  import LevelClassMatrix from './LevelClassMatrix.svelte'
  import FactionClassBar from './FactionClassBar.svelte'
  import RaceLevelBubble from './RaceLevelBubble.svelte'

  let {
    show = $bindable(false),
    personajes,
  }: {
    show?: boolean
    personajes: Personaje[]
  } = $props()

  let tab = $state<'race-class' | 'level-class' | 'faction-class' | 'race-level'>('race-class')

  const TABS: { id: typeof tab; label: string; icon: string }[] = [
    { id: 'race-class', label: 'Raza × Clase', icon: '🌡️' },
    { id: 'level-class', label: 'Nivel × Clase', icon: '📈' },
    { id: 'faction-class', label: 'Facción × Clase', icon: '⚖️' },
    { id: 'race-level', label: 'Raza × Nivel', icon: '💠' },
  ]
</script>

<Dialog show={show} title="Análisis de personajes" onclose={() => show = false}>
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
    {#if tab === 'race-class'}
      <RaceClassMatrix {personajes} />
    {:else if tab === 'level-class'}
      <LevelClassMatrix {personajes} />
    {:else if tab === 'faction-class'}
      <FactionClassBar {personajes} />
    {:else if tab === 'race-level'}
      <RaceLevelBubble {personajes} />
    {/if}
  </div>
</Dialog>

<style>
  .pcm-tabs { display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap; }
  .pcm-tab { font-size: 0.65rem; padding: 3px 10px; border: 1px solid var(--border, #444); border-radius: var(--r-sm, 4px); background: transparent; color: var(--text-secondary, #aaa); cursor: pointer; transition: all 0.12s; font-family: var(--font-heading); }
  .pcm-tab:hover { border-color: var(--gold, #d4af37); color: #e0e0e0; }
  .pcm-tab-active { background: var(--gold, #d4af37); color: #1a1a1a; border-color: var(--gold, #d4af37); font-weight: 600; }
  .pcm-content { min-height: 200px; }
</style>
