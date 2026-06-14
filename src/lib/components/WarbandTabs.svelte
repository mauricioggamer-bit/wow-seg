<script lang="ts">
  import { warbandsStore, dataStore } from '../stores/data'
  import { uiStore } from '../stores/ui'
</script>

<div class="warband-tabs" id="warbandTabs" style="display: {$uiStore.currentView === 'warband' ? '' : 'none'}">
  {#each $warbandsStore as wb}
    <button
      class="warband-tab"
      class:active={$uiStore.currentView === 'warband'}
      onclick={() => {
        dataStore.moveCharToWarband('', ''); // placeholder
      }}
    >
      {wb.nombre} ({wb.personajes.length})
    </button>
  {/each}
</div>
