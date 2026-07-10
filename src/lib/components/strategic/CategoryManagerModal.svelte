<script lang="ts">
  import Modal from '../leveling/Modal.svelte'
  import { dataStore } from '../../stores/data'
  import type { StrategicCategory, EntityType } from '../../types'

  let { open = $bindable(false), entityType }: { open?: boolean; entityType?: EntityType } = $props()

  let storeData = $derived($dataStore)
  let categories: StrategicCategory[] = $derived(
    [...(storeData.strategicConfig?.categories ?? [])]
      .filter(c => !entityType || c.id === 'general' || c.entityType === entityType)
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
  )

  let newLabel = $state('')
  let error = $state('')

  function add() {
    if (!dataStore.addCategory(newLabel, entityType)) {
      error = 'Ya existe una categoría con ese nombre. Elegí otro.'
      return
    }
    error = ''
    newLabel = ''
  }

  function rename(cat: StrategicCategory, el: EventTarget & HTMLInputElement) {
    const label = el.value.trim()
    if (label && label !== cat.label) dataStore.updateCategory(cat.id, { label })
  }

  function remove(cat: StrategicCategory) {
    if (cat.id === 'general') return
    if (confirm(`Eliminar categoría "${cat.label}"? Las ventajas que la usaban vuelven a "General".`)) {
      dataStore.deleteCategory(cat.id)
    }
  }

  function move(cat: StrategicCategory, dir: -1 | 1) {
    const ids = categories.map(c => c.id)
    const i = ids.indexOf(cat.id)
    const j = i + dir
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    dataStore.reorderCategories(ids)
  }

  const ENTITY_LABELS: Record<EntityType, string> = {
    class: 'Clases', race: 'Razas', profession: 'Profesiones',
    task: 'Tareas', warband: 'Warbands', personaje: 'Personajes',
  }
  let modalTitle = $derived(entityType ? `Categorías — ${ENTITY_LABELS[entityType]}` : 'Gestionar categorías')
</script>

<Modal bind:open title={modalTitle}>
  <div class="cm-root">
    <div class="cm-add-row">
      <input type="text" bind:value={newLabel} placeholder="Nueva categoría" class="sv-text-input sv-text-wide" onkeydown={(e) => e.key === 'Enter' && add()} />
      <button class="sv-btn-add" onclick={add}>+ Añadir</button>
    </div>
    {#if error}
      <p class="sv-error">{error}</p>
    {/if}

    <ul class="cm-list">
      {#each categories as cat, i (cat.id)}
        <li class="cm-row">
          <span class="cm-order">
            <button class="cm-arrow" disabled={i === 0} onclick={() => move(cat, -1)}>↑</button>
            <button class="cm-arrow" disabled={i === categories.length - 1} onclick={() => move(cat, 1)}>↓</button>
          </span>
          <input type="text" value={cat.label} class="sv-text-input cm-name" onchange={(e) => rename(cat, e.currentTarget)} />
          {#if cat.id === 'general'}
            <span class="sv-muted">(protegida)</span>
          {:else}
            <button class="sv-btn-del" onclick={() => remove(cat)}>Eliminar</button>
          {/if}
        </li>
      {/each}
    </ul>
  </div>
</Modal>

<style>
  .cm-root {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .cm-add-row {
    display: flex;
    gap: 4px;
  }
  .cm-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .cm-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .cm-order {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .cm-arrow {
    background: transparent;
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.5rem;
    padding: 1px 4px;
    line-height: 1;
  }
  .cm-arrow:hover:not(:disabled) {
    border-color: var(--gold);
    color: var(--gold);
  }
  .cm-arrow:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .cm-name {
    flex: 1;
  }
</style>
