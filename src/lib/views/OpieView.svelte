<script lang="ts">
  import { opieRingsStore } from '../stores/data'
  import RingImportExportPanel from '../components/opie/RingImportExportPanel.svelte'
  import RingMap from '../components/opie/RingMap.svelte'
  import RingList from '../components/opie/RingList.svelte'
  import RingEditor from '../components/opie/RingEditor.svelte'

  let selectedId = $state<string | null>(null)

  $effect(() => {
    if (selectedId && !$opieRingsStore.some((r) => r.id === selectedId)) selectedId = null
    if (!selectedId && $opieRingsStore.length) selectedId = $opieRingsStore[0].id
  })

  function selectRing(id: string) {
    selectedId = id || null
  }
</script>

<div class="opie-view">
  <RingImportExportPanel onImported={selectRing} />
  <RingMap {selectedId} onSelect={selectRing} />
  <div class="opie-columns">
    <RingList {selectedId} onSelect={selectRing} />
    {#if selectedId}
      <RingEditor ringId={selectedId} />
    {:else}
      <div class="opie-empty wow-panel">
        <div class="wow-panel-body">Creá un anillo para empezar.</div>
      </div>
    {/if}
  </div>
</div>

<style>
  .opie-view {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 4px 0;
  }
  .opie-columns {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 12px;
    align-items: start;
  }
  @media (max-width: 900px) {
    .opie-columns {
      grid-template-columns: 1fr;
    }
  }
</style>
