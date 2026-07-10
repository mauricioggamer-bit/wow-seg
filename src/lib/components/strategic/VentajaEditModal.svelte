<script lang="ts">
  import Modal from '../leveling/Modal.svelte'
  import { dataStore } from '../../stores/data'
  import type { StrategicIndex, StrategicCategory } from '../../types'

  let { open = $bindable(false), idx, categories }: { open?: boolean; idx: StrategicIndex | null; categories: StrategicCategory[] } = $props()

  let name = $state('')
  let description = $state('')
  let context = $state('general')
  let error = $state('')

  $effect(() => {
    if (idx) {
      name = idx.name
      description = idx.description
      context = idx.context ?? 'general'
      error = ''
    }
  })

  function save() {
    if (!idx) return
    const trimmed = name.trim()
    if (!trimmed) { error = 'El nombre no puede estar vacío.'; return }
    dataStore.updateIndex(idx.id, { name: trimmed, description: description.trim(), context })
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
</style>
