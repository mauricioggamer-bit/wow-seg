<script lang="ts">
  import { uiStore } from '../stores/ui'
  import type { ViewType } from '../types'

  const views: { key: ViewType; label: string; icon: string }[] = [
    { key: 'warband', label: 'Warband', icon: '📁' },
    { key: 'tareas', label: 'Tareas', icon: '✅' },
    { key: 'tasks', label: 'Tareas', icon: '⚡' },
    { key: 'personajes', label: 'Personajes', icon: '🎭' },
    { key: 'mapa', label: 'Mapa', icon: '🗺' },
    { key: 'fantasia', label: 'Fantasia', icon: '🧝' },
    { key: 'profesion', label: 'Profesiones', icon: '⚒' },
    { key: 'keybinds', label: 'Keybinds', icon: '⌨' },
    { key: 'leveling', label: 'Leveling', icon: '📈' },
    { key: 'warband-manager', label: 'Gestor WB', icon: '📋' },
    { key: 'estrategia', label: 'Estrategia', icon: '⚙' },
    { key: 'opie', label: 'OPie Rings', icon: '💍' },
    { key: 'account-tasks', label: 'Tareas cuenta', icon: '📋' },
  ]
</script>

<div class="warband-tabs" id="viewTabs" role="tablist">
  {#each views as v}
    <button
      class="warband-tab"
      class:active={$uiStore.currentView === v.key}
      role="tab"
      aria-selected={$uiStore.currentView === v.key}
      onclick={() => uiStore.setView(v.key)}
    >
      {v.icon} {v.label}
    </button>
  {/each}
</div>
