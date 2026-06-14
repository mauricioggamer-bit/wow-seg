<script lang="ts">
  import { uiStore } from '../stores/ui'
  import type { ViewType } from '../types'

  const views: { key: ViewType; label: string; icon: string }[] = [
    { key: 'warband', label: 'Warband', icon: '📁' },
    { key: 'tabla', label: 'Tabla', icon: '📋' },
    { key: 'priority', label: 'Prioridad', icon: '⚡' },
    { key: 'time', label: 'Tiempo', icon: '⏱' },
    { key: 'personajes', label: 'Personajes', icon: '🎭' },
    { key: 'mapa', label: 'Mapa', icon: '🗺' },
  ]
</script>

<div class="warband-tabs" id="viewTabs">
  {#each views as v}
    <button
      class="warband-tab"
      class:active={$uiStore.currentView === v.key}
      onclick={() => uiStore.setView(v.key)}
    >
      {v.icon} {v.label}
    </button>
  {/each}
</div>
