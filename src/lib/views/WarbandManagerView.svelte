<script lang="ts">
  import { personajesStore, warbandsStore, dataStore } from '../stores/data'
  import { clsClass } from '../constants'

  let { openCharEdit }: { openCharEdit: (name: string) => void } = $props()

  let dragOverWb = $state<string | null>(null)
  let editingWb = $state<string | null>(null)
  let editingWbName = $state('')

  let allChars = $derived(
    [...$personajesStore].sort((a, b) => a.nombre.localeCompare(b.nombre))
  )

  let wbList = $derived(
    $warbandsStore.filter(w => w.nombre !== 'nada')
  )

  let nadaChars = $derived(
    allChars.filter(c => c.warband === 'nada')
  )

  function handleDragStart(e: DragEvent, charName: string) {
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', charName)
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  function handleDragOver(e: DragEvent, wbName: string) {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    dragOverWb = wbName
  }

  function handleDragLeave(wbName: string) {
    if (dragOverWb === wbName) dragOverWb = null
  }

  function handleDrop(e: DragEvent, wbName: string) {
    e.preventDefault()
    dragOverWb = null
    const charName = e.dataTransfer?.getData('text/plain')
    if (charName) {
      dataStore.moveCharToWarband(charName, wbName)
    }
  }

  function startRename(wb: string) {
    editingWb = wb
    editingWbName = wb
  }

  function commitRename() {
    if (editingWb && editingWbName.trim() && editingWbName.trim() !== editingWb) {
      dataStore.renameWarband(editingWb, editingWbName.trim())
    }
    editingWb = null
    editingWbName = ''
  }

  function getCharsInWb(wbName: string) {
    return allChars.filter(c => c.warband === wbName)
  }
</script>

<div class="wm-layout">
  <div class="wm-pool">
    <div class="wm-pool-header">
      <h3>Personajes</h3>
      <span class="text-sm text-muted">{allChars.length}</span>
    </div>
    <div class="wm-pool-body">
      {#each nadaChars as c (c.nombre)}
        <div
          class="wm-chip"
          draggable="true"
          ondragstart={(e) => handleDragStart(e, c.nombre)}
          role="button"
          tabindex="0"
        >
          <span class="wm-chip-name {clsClass(c.clase)}">{c.nombre}</span>
          <button
            class="wow-btn wow-btn-icon wm-chip-edit"
            onclick={() => openCharEdit(c.nombre)}
            title="Editar personaje"
          >✏️</button>
        </div>
      {/each}
      {#each wbList as wb}
        {#each getCharsInWb(wb.nombre) as c (c.nombre)}
          <div
            class="wm-chip"
            draggable="true"
            ondragstart={(e) => handleDragStart(e, c.nombre)}
            role="button"
            tabindex="0"
          >
            <span class="wm-chip-name {clsClass(c.clase)}">{c.nombre}</span>
            <button
              class="wow-btn wow-btn-icon wm-chip-edit"
              onclick={() => openCharEdit(c.nombre)}
              title="Editar personaje"
            >✏️</button>
          </div>
        {/each}
      {/each}
      {#if allChars.length === 0}
        <div class="empty-state"><p>No hay personajes disponibles</p></div>
      {/if}
    </div>
  </div>

  <div class="wm-wbs">
    <div class="wm-pool-header">
      <h3>Warbands</h3>
      <span class="text-sm text-muted">{wbList.length}</span>
    </div>
    {#each wbList as wb (wb.nombre)}
      <div
        class="wm-wb"
        class:drag-over={dragOverWb === wb.nombre}
        ondragover={(e) => handleDragOver(e, wb.nombre)}
        ondragleave={() => handleDragLeave(wb.nombre)}
        ondrop={(e) => handleDrop(e, wb.nombre)}
      >
        <div class="wm-wb-header">
          {#if editingWb === wb.nombre}
            <input
              class="wm-rename-input"
              type="text"
              bind:value={editingWbName}
              onkeydown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') editingWb = null }}
              onblur={commitRename}
              onclick={(e) => e.stopPropagation()}
              autofocus
            />
          {:else}
            <span class="wm-wb-name">{wb.nombre}</span>
            <button
              class="wow-btn wow-btn-icon wm-wb-edit"
              onclick={() => startRename(wb.nombre)}
              title="Renombrar warband"
            >✏️</button>
          {/if}
          <span class="text-sm text-muted">{wb.personajes.length}</span>
        </div>
        <div class="wm-wb-body">
          {#each getCharsInWb(wb.nombre) as c (c.nombre)}
            <div
              class="wm-chip wm-chip-inline"
              draggable="true"
              ondragstart={(e) => handleDragStart(e, c.nombre)}
              role="button"
              tabindex="0"
            >
              <span class="wm-chip-name {clsClass(c.clase)}">{c.nombre}</span>
              <button
                class="wow-btn wow-btn-icon wm-chip-edit"
                onclick={() => openCharEdit(c.nombre)}
                title="Editar personaje"
              >✏️</button>
            </div>
          {:else}
            <div class="text-xs text-muted wm-wb-empty">Arrastra personajes aquí</div>
          {/each}
        </div>
      </div>
    {/each}
    {#if wbList.length === 0}
      <div class="empty-state"><p>No hay warbands creados</p></div>
    {/if}
  </div>
</div>

<style>
  .wm-layout {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 8px;
    height: calc(100vh - 130px);
  }
  .wm-pool {
    background: var(--bg-elevated, #1e1e1e);
    border: 1px solid var(--border, #333);
    border-radius: var(--r-md, 6px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .wm-pool-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    border-bottom: 1px solid var(--border, #333);
    flex-shrink: 0;
  }
  .wm-pool-header h3 {
    margin: 0;
    font-size: 0.75rem;
    flex: 1;
  }
  .wm-pool-body {
    flex: 1;
    overflow-y: auto;
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .wm-wbs {
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow-y: auto;
    padding-right: 4px;
  }
  .wm-wb {
    background: var(--bg-elevated, #1e1e1e);
    border: 1px solid var(--border, #333);
    border-radius: var(--r-md, 6px);
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .wm-wb.drag-over {
    border-color: var(--gold, #d4af37);
    box-shadow: 0 0 12px rgba(212, 175, 55, 0.25);
  }
  .wm-wb-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-bottom: 1px solid var(--border-subtle, #2a2a2a);
  }
  .wm-wb-name {
    font-size: 0.75rem;
    font-weight: 600;
    flex: 1;
  }
  .wm-wb-edit {
    font-size: 0.65rem !important;
    width: 22px !important;
    height: 22px !important;
    opacity: 0.6;
    transition: opacity 0.15s;
  }
  .wm-wb-header:hover .wm-wb-edit {
    opacity: 1;
  }
  .wm-rename-input {
    flex: 1;
    font-size: 0.75rem;
    font-weight: 600;
    background: var(--input-bg, #2a2a2a);
    border: 1px solid var(--gold, #d4af37);
    border-radius: var(--r-sm, 4px);
    padding: 2px 6px;
    color: var(--text-primary, #e0e0e0);
    outline: none;
  }
  .wm-wb-body {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 6px 10px;
    min-height: 36px;
  }
  .wm-wb-empty {
    padding: 4px 0;
    font-style: italic;
    opacity: 0.5;
  }
  .wm-chip {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 4px 8px;
    background: var(--input-bg, #2a2a2a);
    border: 1px solid var(--border-subtle, #3a3a3a);
    border-radius: var(--r-sm, 4px);
    cursor: grab;
    user-select: none;
    transition: background 0.12s, box-shadow 0.12s;
    font-size: 0.7rem;
  }
  .wm-chip:active {
    cursor: grabbing;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  .wm-chip:hover {
    background: var(--bg-hover, #333);
  }
  .wm-chip-inline {
    padding: 2px 6px;
    font-size: 0.65rem;
  }
  .wm-chip-name {
    flex: 1;
    font-weight: 500;
  }
  .wm-chip-edit {
    font-size: 0.6rem !important;
    width: 20px !important;
    height: 20px !important;
    opacity: 0.4;
    transition: opacity 0.12s;
  }
  .wm-chip:hover .wm-chip-edit {
    opacity: 1;
  }
</style>
