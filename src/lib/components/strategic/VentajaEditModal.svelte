<script lang="ts">
  import Modal from '../leveling/Modal.svelte'
  import { dataStore } from '../../stores/data'
  import { ENTITY_TYPE_LABELS } from '../../constants'
  import type { StrategicIndex, StrategicCategory, EntityType } from '../../types'

  let { open = $bindable(false), idx, categories }: { open?: boolean; idx: StrategicIndex | null; categories: StrategicCategory[] } = $props()

  let name = $state('')
  let description = $state('')
  let context = $state('general')
  let entityTypes = $state<Set<EntityType>>(new Set(ENTITY_TYPE_LABELS.map(e => e.key)))
  let error = $state('')

  $effect(() => {
    if (idx) {
      name = idx.name
      description = idx.description
      context = idx.context ?? 'general'
      entityTypes = new Set(idx.entityTypes ?? ENTITY_TYPE_LABELS.map(e => e.key))
      error = ''
    }
  })

  function toggleType(key: EntityType) {
    const next = new Set(entityTypes)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    entityTypes = next
  }

  function save() {
    if (!idx) return
    const trimmed = name.trim()
    if (!trimmed) { error = 'El nombre no puede estar vacío.'; return }
    dataStore.updateIndex(idx.id, { name: trimmed, description: description.trim(), context, entityTypes: [...entityTypes] })
    open = false
  }
</script>

<Modal bind:open title={idx ? `Editar ventaja "${idx.name}"` : 'Editar ventaja'}>
  {#if idx}
    <div class="vem-form">
      <label class="vem-field">
        <span class="vem-label">Nombre</span>
        <input type="text" bind:value={name} class="sv-text-input" />
      </label>
      <label class="vem-field">
        <span class="vem-label">Descripción</span>
        <input type="text" bind:value={description} class="sv-text-input" />
      </label>
      <label class="vem-field">
        <span class="vem-label">Contexto</span>
        <select bind:value={context} class="sv-text-input" disabled={idx.id === 'general'}>
          {#each categories as ctx}
            <option value={ctx.id}>{ctx.label}</option>
          {/each}
        </select>
      </label>
      <div class="vem-field">
        <span class="vem-label">Aplica a</span>
        <div class="vem-checks">
          {#each ENTITY_TYPE_LABELS as et}
            <label class="vem-check">
              <input type="checkbox" checked={entityTypes.has(et.key)} onchange={() => toggleType(et.key)} />
              {et.label}
            </label>
          {/each}
        </div>
      </div>
      {#if error}
        <p class="sv-error">{error}</p>
      {/if}
      <div class="vem-actions">
        <button class="sv-btn-add" onclick={save}>Guardar</button>
      </div>
    </div>
  {/if}
</Modal>

<style>
  .vem-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .vem-field {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .vem-label {
    font-size: 0.55rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .vem-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 4px;
  }
  .vem-checks {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .vem-check {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 0.55rem;
    color: var(--text-secondary);
  }
</style>
