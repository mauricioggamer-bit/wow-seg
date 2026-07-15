<script lang="ts">
  import { personajesStore, warbandsStore, dataStore } from '../stores/data'
  import { levelingStore } from '../stores/leveling'
  import { clsClass } from '../constants'
  import { MAX_LEVEL } from '../constants/experience'
  import { getObjetivoFromTareas } from '../leveling/objetivo'
  import Dialog from '../components/Dialog.svelte'
  import { getSessionPref, setSessionPref } from '../stores/sessionPrefs'

  let { openCharEdit }: { openCharEdit: (name: string) => void } = $props()

  let dragOverWb = $state<string | null>(null)
  let dragOverNada = $state(false)
  let editingWb = $state<string | null>(null)
  let editingWbName = $state('')
  let newWbName = $state('')
  let showReorder = $state(false)
  let reorderList = $state<string[]>([])
  let showMotivos = $state(getSessionPref('showMotivosWb'))
  let showDescripciones = $state(getSessionPref('showDescripcionesWb'))
  let editingMotivo = $state<Record<string, string>>({})
  let editingWbDesc = $state<Record<string, string>>({})

  let allChars = $derived(
    [...$personajesStore].sort((a, b) => a.nombre.localeCompare(b.nombre))
  )

  function getCharObjetivo(c: { tareas: { nivelRecomendado?: number }[] }): number {
    return getObjetivoFromTareas(c.tareas as any, MAX_LEVEL, $levelingStore.objetivoSinTareas)
  }

  let wbList = $derived(
    $warbandsStore.filter(w => w.nombre !== 'nada').sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
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
    const wb = wbList.find(w => w.nombre === wbName)
    if (wb && wb.personajes.length >= 4) return
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

  function addWarband() {
    if (newWbName.trim()) {
      dataStore.addWarband(newWbName.trim())
      newWbName = ''
    }
  }

  function deleteWb(name: string) {
    if (confirm(`¿Eliminar warband "${name}"? Los personajes se moverán a "Sin Warband".`)) {
      dataStore.deleteWarband(name)
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

  function openReorder() {
    reorderList = wbList.map(w => w.nombre)
    showReorder = true
  }

  function moveUp(i: number) {
    if (i <= 0) return
    const arr = [...reorderList]
    ;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
    reorderList = arr
  }

  function moveDown(i: number) {
    if (i >= reorderList.length - 1) return
    const arr = [...reorderList]
    ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
    reorderList = arr
  }

  function saveReorder() {
    dataStore.reorderWarbands(reorderList)
    showReorder = false
  }

  function startEditMotivo(charName: string, current: string) {
    editingMotivo = { ...editingMotivo, [charName]: current }
  }

  function saveMotivo(charName: string) {
    const draft = editingMotivo[charName]
    dataStore.updatePersonaje(charName, { motivoWarband: draft?.trim() || undefined })
    const next = { ...editingMotivo }
    delete next[charName]
    editingMotivo = next
  }

  function cancelEditMotivo(charName: string) {
    const next = { ...editingMotivo }
    delete next[charName]
    editingMotivo = next
  }

  function startEditWbDesc(wbName: string, current: string) {
    editingWbDesc = { ...editingWbDesc, [wbName]: current }
  }

  function saveWbDesc(wbName: string) {
    const draft = editingWbDesc[wbName]
    dataStore.updateWarbandDescripcion(wbName, draft?.trim() || undefined)
    const next = { ...editingWbDesc }
    delete next[wbName]
    editingWbDesc = next
  }

  function cancelEditWbDesc(wbName: string) {
    const next = { ...editingWbDesc }
    delete next[wbName]
    editingWbDesc = next
  }
</script>

<div class="wm-layout">
  <div
    class="wm-pool"
    class:drag-over={dragOverNada}
    ondragover={(e) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; dragOverNada = true }}
    ondragleave={() => { dragOverNada = false }}
    ondrop={(e) => { e.preventDefault(); dragOverNada = false; const n = e.dataTransfer?.getData('text/plain'); if (n) dataStore.moveCharToWarband(n, 'nada') }}
  >
    <div class="wm-pool-header">
      <h3>Sin Warband</h3>
      <span class="text-sm text-muted">{nadaChars.length}</span>
    </div>
    <div class="wm-pool-body">
      {#if nadaChars.length === 0}
        <div class="text-xs text-muted wm-pool-empty">Todos con warband</div>
      {:else}
        {#each nadaChars as c (c.nombre)}
          <div
            class="wm-chip"
            draggable="true"
            ondragstart={(e) => handleDragStart(e, c.nombre)}
            role="button"
            tabindex="0"
          >
            <span class="wm-chip-name {clsClass(c.clase)}">
              {c.nombre}
              {#if c.nivel < getCharObjetivo(c)}
                <span class="wm-chip-obj">({c.nivel}→{getCharObjetivo(c)})</span>
              {:else}
                <span class="wm-chip-obj">({c.nivel})</span>
              {/if}
            </span>
            <button
              class="wow-btn wow-btn-icon wm-chip-edit"
              onclick={() => openCharEdit(c.nombre)}
              title="Editar personaje"
            >✏️</button>
          </div>
          {#if showMotivos}
            <div class="wm-chip-motivo">
              {#if editingMotivo[c.nombre] !== undefined}
                <textarea rows="3" maxlength="200" bind:value={editingMotivo[c.nombre]}
                  onkeydown={(e) => { if (e.key === 'Escape') cancelEditMotivo(c.nombre) }}
                  autofocus
                ></textarea>
                <button class="wm-motivo-btn" onclick={() => saveMotivo(c.nombre)} title="Guardar">✓</button>
                <button class="wm-motivo-btn" onclick={() => cancelEditMotivo(c.nombre)} title="Cancelar">✗</button>
              {:else}
                <span class="wm-motivo-text" onclick={() => startEditMotivo(c.nombre, c.motivoWarband ?? '')} title="Editar motivo">
                  {c.motivoWarband || '(sin motivo)'}
                </span>
              {/if}
            </div>
          {/if}
        {/each}
      {/if}
    </div>
  </div>

  <div class="wm-main-col">
    <div class="wm-toggles">
      <label class="wm-toggle">
        <input type="checkbox" bind:checked={showMotivos} onchange={() => setSessionPref('showMotivosWb', showMotivos)} />
        <span>Ver motivos</span>
      </label>
      <label class="wm-toggle">
        <input type="checkbox" bind:checked={showDescripciones} onchange={() => setSessionPref('showDescripcionesWb', showDescripciones)} />
        <span>Ver descripciones</span>
      </label>
    </div>
    <div class="wm-wbs-col">
    <div class="wm-create-wb">
      <input
        type="text"
        bind:value={newWbName}
        placeholder="Nuevo warband..."
        onkeydown={(e) => { if (e.key === 'Enter') addWarband() }}
        class="wm-create-input"
      />
      <button class="wow-btn wow-btn-sm wow-btn-primary" onclick={addWarband}>Crear</button>
      <button class="wow-btn wow-btn-sm" onclick={openReorder} title="Ordenar warbands">⚙️</button>
    </div>

    {#if wbList.length === 0}
      <div class="empty-state"><p>No hay warbands creados</p></div>
    {:else}
      <div class="wm-wbs">
        {#each wbList as wb (wb.nombre)}
          <div
            class="wm-wb"
            class:drag-over={dragOverWb === wb.nombre}
            class:wm-wb-full={wb.personajes.length >= 4}
            class:wm-wb-over={wb.personajes.length > 4}
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
                <span class="text-sm wm-wb-count" class:over={wb.personajes.length > 4}>{wb.personajes.length}/4</span>
              {/if}
              <div class="wm-wb-actions">
                {#if editingWb !== wb.nombre}
                  <button
                    class="wow-btn wow-btn-icon wm-icon-btn"
                    onclick={() => startRename(wb.nombre)}
                    title="Renombrar"
                  >✏️</button>
                {/if}
                <button
                  class="wow-btn wow-btn-icon wm-icon-btn wm-icon-btn-danger"
                  onclick={() => deleteWb(wb.nombre)}
                  title="Eliminar warband"
                >🗑️</button>
              </div>
            </div>
            {#if showDescripciones}
              <div class="wm-wb-desc">
                {#if editingWbDesc[wb.nombre] !== undefined}
                  <textarea rows="2" bind:value={editingWbDesc[wb.nombre]}
                    onkeydown={(e) => { if (e.key === 'Escape') cancelEditWbDesc(wb.nombre) }}
                    autofocus
                  ></textarea>
                  <button class="wm-motivo-btn" onclick={() => saveWbDesc(wb.nombre)} title="Guardar">✓</button>
                  <button class="wm-motivo-btn" onclick={() => cancelEditWbDesc(wb.nombre)} title="Cancelar">✗</button>
                {:else}
                  <span class="wm-desc-text" onclick={() => startEditWbDesc(wb.nombre, wb.descripcion ?? '')} title="Editar descripción">
                    {wb.descripcion || '(sin descripción)'}
                  </span>
                {/if}
              </div>
            {/if}
            <div class="wm-wb-body">
              {#each getCharsInWb(wb.nombre) as c (c.nombre)}
                <div
                  class="wm-chip wm-chip-inline"
                  draggable="true"
                  ondragstart={(e) => handleDragStart(e, c.nombre)}
                  role="button"
                  tabindex="0"
                >
                  <span class="wm-chip-name {clsClass(c.clase)}">
                    {c.nombre}
                    {#if c.nivel < getCharObjetivo(c)}
                      <span class="wm-chip-obj">({c.nivel}→{getCharObjetivo(c)})</span>
                    {:else}
                      <span class="wm-chip-obj">({c.nivel})</span>
                    {/if}
                  </span>
                  <button
                    class="wow-btn wow-btn-icon wm-chip-edit"
                    onclick={() => openCharEdit(c.nombre)}
                    title="Editar personaje"
                  >✏️</button>
                </div>
                {#if showMotivos}
                  <div class="wm-chip-motivo-inline">
                    {#if editingMotivo[c.nombre] !== undefined}
                      <textarea rows="3" maxlength="200" bind:value={editingMotivo[c.nombre]}
                        onkeydown={(e) => { if (e.key === 'Escape') cancelEditMotivo(c.nombre) }}
                        autofocus
                      ></textarea>
                      <button class="wm-motivo-btn" onclick={() => saveMotivo(c.nombre)} title="Guardar">✓</button>
                      <button class="wm-motivo-btn" onclick={() => cancelEditMotivo(c.nombre)} title="Cancelar">✗</button>
                    {:else}
                      <span class="wm-motivo-text" onclick={() => startEditMotivo(c.nombre, c.motivoWarband ?? '')} title="Editar motivo">
                        {c.motivoWarband || '(sin motivo)'}
                      </span>
                    {/if}
                  </div>
                {/if}
              {:else}
              {#if wb.personajes.length >= 4}
                <div class="text-xs text-muted wm-wb-empty">Lleno</div>
              {:else}
                <div class="text-xs text-muted wm-wb-empty">Arrastra personajes aquí</div>
              {/if}
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
    </div>
  </div>
</div>

<Dialog show={showReorder} title="Ordenar Warbands" onclose={() => showReorder = false}>
  {#snippet children()}
    <div style="display:flex;flex-direction:column;gap:4px;min-width:260px">
      {#each reorderList as name, i (name)}
        <div style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:var(--input-bg,#2a2a2a);border:1px solid var(--border-subtle,#3a3a3a);border-radius:var(--r-sm,4px)">
          <span style="flex:1;font-size:0.75rem">{name}</span>
          <button class="wow-btn wow-btn-icon" onclick={() => moveUp(i)} disabled={i === 0} style="font-size:0.65rem;width:24px;height:24px">⬆</button>
          <button class="wow-btn wow-btn-icon" onclick={() => moveDown(i)} disabled={i === reorderList.length - 1} style="font-size:0.65rem;width:24px;height:24px">⬇</button>
        </div>
      {/each}
    </div>
    <div class="modal-footer" style="margin-top:8px">
      <button class="wow-btn" onclick={() => showReorder = false}>Cancelar</button>
      <button class="wow-btn wow-btn-primary" onclick={saveReorder}>Guardar orden</button>
    </div>
  {/snippet}
</Dialog>

<style>
  .wm-layout {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 8px;
    align-items: start;
  }
  .wm-pool {
    background: var(--bg-elevated, #1e1e1e);
    border: 1px solid var(--border, #333);
    border-radius: var(--r-md, 6px);
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 130px);
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
  .wm-pool-empty {
    font-style: italic;
    padding: 12px 0;
    text-align: center;
    opacity: 0.5;
  }
  .wm-wbs-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .wm-create-wb {
    display: flex;
    gap: 4px;
  }
  .wm-create-input {
    flex: 1;
    font-size: 0.7rem;
    background: var(--input-bg, #2a2a2a);
    border: 1px solid var(--border, #333);
    border-radius: var(--r-sm, 4px);
    padding: 4px 8px;
    color: var(--text-primary, #e0e0e0);
    outline: none;
  }
  .wm-create-input:focus {
    border-color: var(--gold, #d4af37);
  }
  .wm-wbs {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 6px;
  }
  .wm-wb {
    background: var(--bg-elevated, #1e1e1e);
    border: 1px solid var(--border, #333);
    border-radius: var(--r-md, 6px);
    transition: border-color 0.15s, box-shadow 0.15s;
    min-width: 0;
  }
  .wm-pool.drag-over {
    border-color: var(--gold, #d4af37);
    box-shadow: 0 0 12px rgba(212, 175, 55, 0.25);
  }
  .wm-wb.drag-over {
    border-color: var(--gold, #d4af37);
    box-shadow: 0 0 12px rgba(212, 175, 55, 0.25);
  }
  .wm-wb-full {
    border-color: var(--border-subtle, #2a2a2a);
    opacity: 0.75;
  }
  .wm-wb-over {
    border-color: var(--horde, #c5365a) !important;
    opacity: 1;
  }
  .wm-wb-count.over {
    color: var(--horde, #c5365a) !important;
    font-weight: 700;
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
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .wm-wb-actions {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
  }
  .wm-icon-btn {
    font-size: 0.6rem !important;
    width: 20px !important;
    height: 20px !important;
    opacity: 0.4;
    transition: opacity 0.12s;
  }
  .wm-icon-btn-danger {
    filter: saturate(0.5);
  }
  .wm-icon-btn-danger:hover {
    filter: saturate(1);
  }
  .wm-wb-header:hover .wm-icon-btn {
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
    flex-direction: column;
    gap: 3px;
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
    padding: 3px 8px;
    font-size: 0.7rem;
    width: 100%;
    box-sizing: border-box;
  }
  .wm-chip-name {
    flex: 1;
    font-weight: 500;
    min-width: 0;
  }
  .wm-chip-obj {
    font-weight: 400;
    opacity: 0.7;
    font-size: 0.6rem;
  }
  .wm-chip-edit {
    font-size: 0.55rem !important;
    width: 18px !important;
    height: 18px !important;
    opacity: 0.4;
    transition: opacity 0.12s;
  }
  .wm-chip:hover .wm-chip-edit {
    opacity: 1;
  }
  .wm-main-col {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .wm-toggles {
    display: flex;
    gap: 12px;
  }
  .wm-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.55rem;
    color: var(--text-secondary);
    cursor: pointer;
    user-select: none;
  }
  .wm-toggle input {
    accent-color: var(--gold, #d4af37);
  }
  .wm-wb-desc {
    padding: 4px 10px;
    border-bottom: 1px solid var(--border-subtle, #2a2a2a);
    display: flex;
    align-items: flex-start;
    gap: 3px;
    font-size: 0.5rem;
  }
  .wm-wb-desc textarea {
    flex: 1;
    font-size: 0.5rem;
    background: var(--input-bg, #2a2a2a);
    border: 1px solid var(--gold, #d4af37);
    border-radius: var(--r-sm, 4px);
    padding: 2px 4px;
    color: var(--text-primary, #e0e0e0);
    outline: none;
    min-width: 0;
    resize: none;
    line-height: 1.3;
    font-family: inherit;
  }
  .wm-desc-text {
    flex: 1;
    color: var(--text-muted, #888);
    cursor: pointer;
    padding: 1px 4px;
    border-radius: var(--r-sm, 4px);
    font-size: 0.5rem;
    line-height: 1.3;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .wm-desc-text:hover {
    background: var(--bg-hover, #333);
    color: var(--text-primary, #e0e0e0);
  }
  .wm-chip-motivo {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 0 8px 4px 8px;
    font-size: 0.55rem;
  }
  .wm-chip-motivo-inline {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 0 10px 4px 10px;
    font-size: 0.55rem;
  }
  .wm-motivo-text {
    color: var(--text-muted, #888);
    cursor: pointer;
    padding: 1px 4px;
    border-radius: var(--r-sm, 4px);
    flex: 1;
    font-size: 0.5rem;
    line-height: 1.3;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .wm-motivo-text:hover {
    background: var(--bg-hover, #333);
    color: var(--text-primary, #e0e0e0);
  }
  .wm-chip-motivo textarea,
  .wm-chip-motivo-inline textarea {
    flex: 1;
    font-size: 0.5rem;
    background: var(--input-bg, #2a2a2a);
    border: 1px solid var(--gold, #d4af37);
    border-radius: var(--r-sm, 4px);
    padding: 2px 4px;
    color: var(--text-primary, #e0e0e0);
    outline: none;
    min-width: 0;
    resize: none;
    line-height: 1.3;
  }
  .wm-motivo-btn {
    font-size: 0.5rem;
    width: 16px;
    height: 16px;
    padding: 0;
    border: 1px solid var(--border-subtle, #3a3a3a);
    border-radius: var(--r-sm, 4px);
    background: transparent;
    color: var(--text-muted, #888);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }
  .wm-motivo-btn:hover {
    border-color: var(--gold, #d4af37);
    color: var(--gold, #d4af37);
  }
</style>
