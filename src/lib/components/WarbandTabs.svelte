<script lang="ts">
  import { warbandsStore, personajesStore } from '../stores/data'
  import { uiStore, currentView, currentWarband } from '../stores/ui'

  function selectWarband(nombre: string | null) {
    uiStore.selectWarband(nombre ?? '')
  }

  let show = $derived($currentView === 'warband' || $currentView === 'fantasia' || $currentView === 'tareas' || $currentView === 'profesion' || $currentView === 'leveling')

  let totalPjs = $derived($personajesStore.filter(p => p.planeado_usar).length)

  let isAll = $derived(!$currentWarband || $currentWarband === '')
</script>

<div class="warband-tabs" id="warbandTabs" style="display: {show ? '' : 'none'}">
  <button
    class="warband-tab"
    class:active={isAll}
    onclick={() => selectWarband(null)}
  >
    Todos ({totalPjs})
  </button>
  {#each $warbandsStore as wb}
    <button
      class="warband-tab"
      class:active={$currentWarband === wb.nombre}
      onclick={() => selectWarband(wb.nombre)}
    >
      {wb.nombre} ({wb.personajes.length})
    </button>
  {/each}
</div>