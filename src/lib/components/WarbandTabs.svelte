<script lang="ts">
  import { warbandsStore, personajesStore } from '../stores/data'
  import { uiStore, currentView, currentWarband } from '../stores/ui'

  function selectWarband(nombre: string | null) {
    uiStore.selectWarband(nombre ?? '')
  }

  let show = $derived($currentView === 'warband' || $currentView === 'fantasia' || $currentView === 'tareas' || $currentView === 'tasks' || $currentView === 'profesion' || $currentView === 'leveling')

  let personajesActivos = $derived($personajesStore.filter(p => p.planeado_usar))
  let totalPjs = $derived(personajesActivos.length)

  let isAll = $derived(!$currentWarband || $currentWarband === '')

  function countInWarband(wbName: string): number {
    return personajesActivos.filter(p => p.warband === wbName).length
  }
</script>

<div class="warband-tabs" id="warbandTabs" role="tablist" style="display: {show ? '' : 'none'}">
  <button
    class="warband-tab"
    class:active={isAll}
    role="tab"
    aria-selected={isAll}
    onclick={() => selectWarband(null)}
  >
    Todos ({totalPjs})
  </button>
  {#each [...$warbandsStore].filter(w => w.nombre !== 'nada').sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)) as wb}
    <button
      class="warband-tab"
      class:active={$currentWarband === wb.nombre}
      role="tab"
      aria-selected={$currentWarband === wb.nombre}
      onclick={() => selectWarband(wb.nombre)}
    >
      {wb.nombre} ({countInWarband(wb.nombre)})
    </button>
  {/each}
</div>