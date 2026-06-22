<script lang="ts">
  import { warbandsStore, dataStore } from '../stores/data'
  import { uiStore, currentView, currentWarband } from '../stores/ui'
  import { clsClass } from '../constants'

  function selectWarband(nombre: string) {
    uiStore.selectWarband(nombre)
  }

  let show = $derived($currentView === 'warband' || $currentView === 'fantasia' || $currentView === 'tareas')
</script>

<div class="warband-tabs" id="warbandTabs" style="display: {show ? '' : 'none'}">
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
