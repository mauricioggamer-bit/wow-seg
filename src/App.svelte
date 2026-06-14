<script lang="ts">
  import Header from './lib/components/Header.svelte'
  import ViewSwitcher from './lib/components/ViewSwitcher.svelte'
  import WarbandTabs from './lib/components/WarbandTabs.svelte'
  import FilterBar from './lib/components/FilterBar.svelte'
  import DetailPanel from './lib/components/DetailPanel.svelte'
  import Modal from './lib/components/Modal.svelte'
  import StatusBar from './lib/components/StatusBar.svelte'
  import AuthView from './lib/views/AuthView.svelte'
  import WarbandView from './lib/views/WarbandView.svelte'
  import TablaView from './lib/views/TablaView.svelte'
  import PriorityView from './lib/views/PriorityView.svelte'
  import TimeView from './lib/views/TimeView.svelte'
  import PersonajesView from './lib/views/PersonajesView.svelte'
  import MapaView from './lib/views/MapaView.svelte'
  import { authStore } from './lib/stores/auth'
  import { uiStore } from './lib/stores/ui'
</script>

{#if $authStore.authenticated}
  <header class="main-header">
    <div class="app-container">
      <Header />
    </div>
  </header>
  <div class="app-container">
    <ViewSwitcher />
    <WarbandTabs />
    <div class="warband-layout">
      <div class="warband-main">
        {#if $uiStore.currentView === 'warband'}
          <FilterBar />
          <WarbandView />
        {:else if $uiStore.currentView === 'tabla'}
          <TablaView />
        {:else if $uiStore.currentView === 'priority'}
          <PriorityView />
        {:else if $uiStore.currentView === 'time'}
          <TimeView />
        {:else if $uiStore.currentView === 'personajes'}
          <PersonajesView />
        {:else if $uiStore.currentView === 'mapa'}
          <MapaView />
        {/if}
      </div>
      {#if $uiStore.showDetailPanel && $uiStore.currentView === 'warband'}
        <aside class="detail-sidebar">
          <DetailPanel />
        </aside>
      {/if}
    </div>
  </div>
  <StatusBar />
  <Modal />
{:else}
  <AuthView />
{/if}

<style>
  .warband-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    margin-top: 4px;
  }
  .warband-layout:has(.detail-sidebar) {
    grid-template-columns: 1fr 320px;
  }
  .detail-sidebar {
    position: sticky;
    top: 70px;
    align-self: start;
    max-height: calc(100vh - 80px);
    overflow-y: auto;
  }
  .warband-main {
    min-width: 0;
  }
</style>
