<script lang="ts">
  import { dataStore } from '../stores/data'
  import { levelingStore } from '../stores/leveling'
  import { CLASS_MAP, PERS_RACE_INFO, STRATEGIC_COMPONENTS } from '../constants'
  import { PROFESIONES } from '../constants/profesiones'
  import VentajaList from '../components/strategic/VentajaList.svelte'
  import VentajaDetail from '../components/strategic/VentajaDetail.svelte'
  import EntityMode from '../components/strategic/EntityMode.svelte'
  import ClassMatrix from '../components/strategic/ClassMatrix.svelte'
  import CategoryManagerModal from '../components/strategic/CategoryManagerModal.svelte'
  import { STRATEGIC_PARAMS } from '../constants'
  import type { Personaje, StrategicIndex, StrategicCategory, Warband } from '../types'
  import type { EntityKind } from '../components/strategic/types'

  let { openCharEdit }: { openCharEdit?: (name: string) => void } = $props()

  let tab = $state<'ventajas' | 'class' | 'race' | 'profession' | 'task' | 'warband' | 'personaje' | 'pesos'>('ventajas')
  let storeData = $derived($dataStore)
  let config = $derived($levelingStore)

  const tabs = [
    { key: 'ventajas' as const, label: 'Ventajas' },
    { key: 'class' as const, label: 'Clases' },
    { key: 'race' as const, label: 'Razas' },
    { key: 'profession' as const, label: 'Profesiones' },
    { key: 'task' as const, label: 'Tareas' },
    { key: 'warband' as const, label: 'Warbands' },
    { key: 'personaje' as const, label: 'Personajes' },
    { key: 'pesos' as const, label: 'Pesos' },
  ]

  let indexes: StrategicIndex[] = $derived(storeData.strategicConfig?.indexes ?? [])
  let categories: StrategicCategory[] = $derived(
    [...(storeData.strategicConfig?.categories ?? [])].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
  )
  let personajes: Personaje[] = $derived(storeData.personajes ?? [])
  let warbandList: Warband[] = $derived((storeData.warbands ?? []).filter((w: Warband) => w.nombre !== 'nada'))
  let allProfItems = $derived([...PROFESIONES, { id: 'cocina', nombre: 'Cocina', icon: '🍳' }])
  let count90 = $derived(personajes.filter(p => p.nivel >= 90).length)

  let entityKinds: EntityKind[] = $derived([
    { key: 'class', label: 'Clases', items: Object.keys(CLASS_MAP).sort().map(name => ({ id: name, label: name })) },
    { key: 'race', label: 'Razas', items: Object.keys(PERS_RACE_INFO).sort().map(name => ({ id: name, label: name })) },
    { key: 'profession', label: 'Profesiones', items: allProfItems.map(p => ({ id: p.id, label: `${p.icon} ${p.nombre}` })) },
    { key: 'task', label: 'Tareas', items: [{ id: '', label: 'Todas las tareas (global)' }] },
    { key: 'warband', label: 'Warbands', items: warbandList.map(w => ({ id: w.nombre, label: w.nombre })) },
    { key: 'personaje', label: 'Personajes', items: personajes.map(p => ({ id: p.nombre, label: p.nombre, sub: `${p.clase} · ${p.raza}` })) },
  ])

  let activeKind = $derived(entityKinds.find(k => k.key === tab))
  let levelingCtx = $derived({ config, roster: personajes, count90 })

  let selectedVentajaId = $state<string | null>(null)
  let selectedVentaja = $derived(indexes.find(i => i.id === selectedVentajaId) ?? null)

  let categoryModalOpen = $state(false)
</script>

<div class="sv-view">
  <div class="sv-tabbar">
    <div class="sv-tabs">
      {#each tabs as t}
        <button class="sv-tab" class:active={tab === t.key} onclick={() => tab = t.key}>
          {t.label}
        </button>
      {/each}
    </div>
    <button class="sv-btn-reset sv-cat-btn" onclick={() => categoryModalOpen = true}>⚙ Categorías</button>
  </div>

  {#if tab === 'ventajas'}
    <div class="sv-split">
      <div class="sv-split-master">
        <VentajaList {indexes} {categories} bind:selectedId={selectedVentajaId} />
      </div>
      <div class="sv-split-detail">
        {#if selectedVentaja}
          <VentajaDetail idx={selectedVentaja} {entityKinds} />
        {:else}
          <p class="sv-hint">Elegí una ventaja de la lista para ver y editar quién la tiene asignada.</p>
        {/if}
      </div>
    </div>

  {:else if tab === 'class'}
    <ClassMatrix {indexes} {categories} />

  {:else if activeKind}
    <EntityMode kind={activeKind} {indexes} {categories} {personajes} {levelingCtx} {openCharEdit} />

  {:else if tab === 'pesos'}
    <div class="sv-params-section">
      <h4 class="sv-params-title">Parámetros</h4>
      <div class="sv-params-grid">
        {#each STRATEGIC_PARAMS as param}
          <div class="sv-param-row">
            <span class="sv-param-label">{param.label}</span>
            <input type="number" min="1" max="200"
              value={dataStore.getStrategicParam(param.key, param.default)}
              onchange={(e) => {
                const v = parseInt(e.currentTarget.value)
                if (!isNaN(v) && v >= 1) dataStore.setStrategicParam(param.key, v)
              }}
              class="sv-input" />
            <span class="sv-default">Default: {param.default}</span>
            <span class="sv-desc">{param.description}</span>
          </div>
        {/each}
      </div>
    </div>

    <div class="sv-table-wrap">
      <table class="sv-table">
        <thead>
          <tr><th>Componente</th><th>Peso Default</th><th>Peso Actual</th><th>Descripción</th><th></th></tr>
        </thead>
        <tbody>
          {#each STRATEGIC_COMPONENTS as comp}
            <tr>
              <td>{comp.label}</td>
              <td class="sv-default">{comp.weight === 'fixed' || comp.weight === 'bonus' ? '—' : comp.weight}</td>
              <td>
                {#if typeof comp.weight === 'number'}
                  <input type="number" min="1" max="100"
                    value={dataStore.getComponentWeight(comp.key) || comp.weight}
                    onchange={(e) => {
                      const v = parseInt(e.currentTarget.value)
                      if (!isNaN(v) && v >= 1) dataStore.setComponentWeight(comp.key, v)
                    }}
                    class="sv-input"
                    class:sv-overridden={dataStore.getComponentWeight(comp.key) > 0} />
                {:else}
                  <span class="sv-muted">{comp.weight}</span>
                {/if}
              </td>
              <td class="sv-desc">{comp.description}</td>
              <td>
                {#if typeof comp.weight === 'number'}
                  {#if dataStore.getComponentWeight(comp.key) > 0}
                    <button class="sv-btn-reset" onclick={() => dataStore.resetComponentWeight(comp.key)}>Reset</button>
                  {:else}
                    <span class="sv-default-label">Default</span>
                  {/if}
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<CategoryManagerModal bind:open={categoryModalOpen} />

<style>
  .sv-view {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sv-tabbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 8px;
    flex-wrap: wrap;
  }
  .sv-tabs {
    display: flex;
    gap: 2px;
    flex-wrap: wrap;
  }
  .sv-cat-btn {
    margin-bottom: 2px;
  }
  :global(.sv-tab) {
    font-family: var(--font-heading);
    font-size: 0.6rem;
    padding: 4px 10px;
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm) var(--r-sm) 0 0;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  :global(.sv-tab.active) {
    background: var(--bg-card);
    color: var(--gold);
    border-color: var(--gold);
    border-bottom-color: var(--bg-card);
  }
  .sv-split {
    display: grid;
    grid-template-columns: minmax(200px, 280px) 1fr;
    gap: 10px;
    min-width: 0;
  }
  .sv-split-master {
    min-width: 0;
  }
  .sv-split-detail {
    min-width: 0;
    border-left: 1px solid var(--border-subtle);
    padding-left: 10px;
  }
  @media (max-width: 640px) {
    .sv-split {
      grid-template-columns: 1fr;
    }
    .sv-split-detail {
      border-left: none;
      padding-left: 0;
      border-top: 1px solid var(--border-subtle);
      padding-top: 8px;
    }
  }
  :global(.sv-text-input) {
    padding: 4px 6px;
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    background: var(--input-bg);
    color: var(--text-primary);
    font-size: 0.6rem;
  }
  :global(.sv-text-wide) {
    flex: 1;
    min-width: 150px;
  }
  :global(.sv-btn-add) {
    font-size: 0.55rem;
    padding: 4px 10px;
    border: 1px solid var(--gold);
    border-radius: var(--r-sm);
    background: transparent;
    color: var(--gold);
    cursor: pointer;
  }
  :global(.sv-btn-add:hover) {
    background: var(--gold);
    color: var(--bg-app);
  }
  :global(.sv-btn-add:disabled) {
    opacity: 0.4;
    cursor: not-allowed;
  }
  :global(.sv-btn-del) {
    font-size: 0.5rem;
    padding: 2px 6px;
    border: 1px solid var(--danger);
    border-radius: var(--r-sm);
    background: transparent;
    color: var(--danger);
    cursor: pointer;
  }
  :global(.sv-table-wrap) {
    overflow-x: auto;
  }
  :global(.sv-table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.6rem;
  }
  :global(.sv-table th) {
    text-align: left;
    padding: 4px 6px;
    border-bottom: 1px solid var(--border-subtle);
    color: var(--text-muted);
    font-family: var(--font-heading);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 400;
    white-space: nowrap;
  }
  :global(.sv-table td) {
    padding: 3px 6px;
    border-bottom: 1px solid var(--border-subtle);
    color: var(--text-primary);
    white-space: nowrap;
  }
  :global(.sv-default) {
    color: var(--text-muted);
    font-size: 0.55rem;
  }
  :global(.sv-muted) {
    color: var(--text-dim);
    font-style: italic;
  }
  :global(.sv-desc) {
    color: var(--text-dim);
    font-size: 0.5rem;
    max-width: 300px;
    white-space: normal;
  }
  :global(.sv-input) {
    width: 50px;
    padding: 2px 4px;
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    background: var(--input-bg);
    color: var(--text-primary);
    font-size: 0.6rem;
    text-align: center;
  }
  :global(.sv-overridden) {
    border-color: var(--gold) !important;
  }
  :global(.sv-btn-reset) {
    font-size: 0.5rem;
    padding: 2px 6px;
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
  }
  :global(.sv-btn-reset:hover) {
    border-color: var(--gold);
    color: var(--gold);
  }
  :global(.sv-default-label) {
    font-size: 0.5rem;
    color: var(--text-dim);
    font-style: italic;
  }
  :global(.sv-params-section) { margin-bottom: 12px; }
  :global(.sv-params-title) { font-size: 0.65rem; color: var(--gold); margin: 0 0 6px 0; font-family: var(--font-heading); text-transform: uppercase; letter-spacing: 0.06em; }
  :global(.sv-params-grid) { display: flex; flex-direction: column; gap: 6px; }
  :global(.sv-param-row) { display: flex; align-items: center; gap: 8px; font-size: 0.6rem; padding: 4px 6px; border: 1px solid var(--border-subtle); border-radius: var(--r-sm); }
  :global(.sv-param-label) { min-width: 100px; color: var(--text-primary); font-weight: bold; }
  :global(.sv-hint) {
    font-size: 0.55rem;
    color: var(--text-muted);
    margin: 0;
    padding: 4px 0;
  }
  :global(.sv-error) {
    font-size: 0.55rem;
    color: var(--danger);
    margin: 0;
    padding: 2px 0;
  }
</style>
