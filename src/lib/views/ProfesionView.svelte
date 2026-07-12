<script lang="ts">
  import { personajesStore, dataStore } from '../stores/data'
  import { currentWarband } from '../stores/ui'
  import { clsClass } from '../constants'
  import { PROFESIONES, profesionIcon } from '../constants/profesiones'
  import { EXPANSIONS } from '../constants'
  import type { ProfesionSlot } from '../types'
  import Dialog from '../components/Dialog.svelte'

  let { openCharEdit }: { openCharEdit: (name: string) => void } = $props()

  let dragOverProf = $state<string | null>(null)

  // reorder
  let showReorder = $state(false)
  let reorderList = $state<string[]>([])

  // filters
  let filterMain = $state(false)
  let filterCD = $state(false)
  let filterNone = $state(false)
  let profType = $state<'todas' | 'recoleccion' | 'artesania'>('todas')
  let profSlot = $state<'ambas' | 'primera' | 'segunda'>('ambas')
  let showMotivos = $state(dataStore.getUIPref('showMotivosProf', false))

  let editingMotivoChar = $state<string | null>(null)
  let editingMotivoProf = $state<string | null>(null)
  let editingMotivoValue = $state('')

  const RECOLECCION_IDS = new Set(['mineria', 'herboristeria', 'desuello'])

  let activeWarband = $derived(
    $currentWarband && $currentWarband !== '' ? $currentWarband : null
  )

  let scopedChars = $derived(
    (activeWarband
      ? $personajesStore.filter(c => c.warband === activeWarband)
      : [...$personajesStore]
    ).filter(c => c.planeado_usar)
  )

  let poolChars = $derived(
    scopedChars
      .filter(c => {
        const filled = (c.profesiones ?? []).filter(s => s.id).length
        return filled < 2
      })
      .sort((a, b) => {
        const aFilled = (a.profesiones ?? []).filter(s => s.id).length
        const bFilled = (b.profesiones ?? []).filter(s => s.id).length
        if (aFilled !== bFilled) return aFilled - bFilled
        return a.nombre.localeCompare(b.nombre)
      })
  )

  let allChars = $derived(
    scopedChars.sort((a, b) => a.nombre.localeCompare(b.nombre))
  )

  let profOrden = $derived($dataStore.profesionOrden ?? PROFESIONES.map(p => p.id))

  let sortedProfesiones = $derived(
    [...PROFESIONES].sort((a, b) => profOrden.indexOf(a.id) - profOrden.indexOf(b.id))
  )

  let filteredProfesiones = $derived(
    profType === 'todas'
      ? sortedProfesiones
      : sortedProfesiones.filter(p =>
          profType === 'recoleccion'
            ? RECOLECCION_IDS.has(p.id)
            : !RECOLECCION_IDS.has(p.id)
        )
  )

  function getCharsInProf(profId: string) {
    let chars = allChars.filter(c => (c.profesiones ?? []).some(s => s.id === profId))
    if (profSlot !== 'ambas') {
      const slotIdx = profSlot === 'primera' ? 0 : 1
      chars = chars.filter(c => (c.profesiones ?? [])[slotIdx]?.id === profId)
    }
    const anyRoleFilter = filterMain || filterCD || filterNone
    if (anyRoleFilter) {
      chars = chars.filter(c => {
        const slot = (c.profesiones ?? []).find(s => s.id === profId)
        const rol = slot?.rol ?? 'none'
        if (filterMain && rol === 'main') return true
        if (filterCD && rol === 'cd') return true
        if (filterNone && rol === 'none') return true
        return false
      })
    }
    return chars
  }

  function getSlotForProf(charName: string, profId: string): number | null {
    const c = allChars.find(x => x.nombre === charName)
    if (!c) return null
    const slots = c.profesiones ?? []
    const existing = slots.findIndex(s => s.id === profId)
    if (existing >= 0) return existing
    const empty = slots.findIndex(s => !s.id)
    return empty >= 0 ? empty : null
  }

  function handleDragStart(e: DragEvent, charName: string) {
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', charName)
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  function handleDragOver(e: DragEvent, profId: string) {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    dragOverProf = profId
  }

  function handleDragLeave() {
    dragOverProf = null
  }

  function handleDrop(e: DragEvent, profId: string) {
    e.preventDefault()
    dragOverProf = null
    const charName = e.dataTransfer?.getData('text/plain')
    if (!charName) return
    const slotIdx = getSlotForProf(charName, profId)
    if (slotIdx === null) return
    const c = allChars.find(x => x.nombre === charName)
    if (!c) return
    const base: ProfesionSlot[] = [
      { ...(c.profesiones?.[0] ?? { id: '', completadas: [] }) },
      { ...(c.profesiones?.[1] ?? { id: '', completadas: [] }) },
    ]
    base[slotIdx] = { id: profId, completadas: base[slotIdx]?.completadas ?? [] }
    if (slotIdx === 0 && base[1]?.id === profId) base[1] = { id: '', completadas: [] }
    if (slotIdx === 1 && base[0]?.id === profId) base[0] = { id: '', completadas: [] }
    dataStore.updatePersonaje(charName, { profesiones: base })
  }

  function toggleExp(charName: string, profId: string, expId: string) {
    const c = allChars.find(x => x.nombre === charName)
    if (!c) return
    const slots = c.profesiones ?? []
    const slotIdx = slots.findIndex(s => s.id === profId)
    if (slotIdx < 0) return
    const slot = slots[slotIdx]
    const next = slot.completadas.includes(expId)
      ? slot.completadas.filter(x => x !== expId)
      : [...slot.completadas, expId]
    const base: ProfesionSlot[] = [
      { ...(slots[0] ?? { id: '', completadas: [] }) },
      { ...(slots[1] ?? { id: '', completadas: [] }) },
    ]
    base[slotIdx] = { ...base[slotIdx], completadas: next }
    dataStore.updatePersonaje(charName, { profesiones: base })
  }

  function setRol(charName: string, profId: string, newRol: 'main' | 'cd' | 'none') {
    dataStore.updateProfesionRol(charName, profId, newRol === 'none' ? undefined : newRol)
  }

  function profRol(c: { profesiones?: ProfesionSlot[] }, profId: string): 'main' | 'cd' | 'none' {
    const slot = (c.profesiones ?? []).find(s => s.id === profId)
    return slot?.rol ?? 'none'
  }

  function rolCount(profId: string, rol: 'main' | 'cd'): number {
    return getCharsInProf(profId).filter(c =>
      (c.profesiones ?? []).some(s => s.id === profId && s.rol === rol)
    ).length
  }

  function expAbbr(id: string): string {
    const map: Record<string, string> = {
      classic: 'C', tww: 'T', dragonflight: 'D', shadowlands: 'S',
      legion: 'L', bfa: 'B', draenor: 'W', mop: 'M',
      cata: 'Ct', wotlk: 'Wr', midnight: 'Md', outland: 'O',
    }
    return map[id] || '?'
  }

  function openReorder() {
    reorderList = [...profOrden]
    showReorder = true
  }

  function saveReorder() {
    dataStore.reorderProfesiones(reorderList)
    showReorder = false
  }

  function moveReorderItem(idx: number, dir: -1 | 1) {
    const swap = idx + dir
    if (swap < 0 || swap >= reorderList.length) return
    const tmp = reorderList[idx]
    reorderList[idx] = reorderList[swap]
    reorderList[swap] = tmp
  }

  function startEditMotivo(charName: string, profId: string) {
    const c = allChars.find(x => x.nombre === charName)
    if (!c) return
    const slot = (c.profesiones ?? []).find(s => s.id === profId)
    editingMotivoChar = charName
    editingMotivoProf = profId
    editingMotivoValue = slot?.motivo ?? ''
  }

  function saveMotivo() {
    if (!editingMotivoChar || !editingMotivoProf) return
    const c = allChars.find(x => x.nombre === editingMotivoChar)
    if (!c) return
    const slots = c.profesiones ?? []
    const slotIdx = slots.findIndex(s => s.id === editingMotivoProf)
    if (slotIdx < 0) return
    const base: ProfesionSlot[] = [
      { ...(slots[0] ?? { id: '', completadas: [] }) },
      { ...(slots[1] ?? { id: '', completadas: [] }) },
    ]
    base[slotIdx] = { ...base[slotIdx], motivo: editingMotivoValue.trim() || undefined }
    dataStore.updatePersonaje(editingMotivoChar, { profesiones: base })
    editingMotivoChar = null
    editingMotivoProf = null
    editingMotivoValue = ''
  }

  function cancelEditMotivo() {
    editingMotivoChar = null
    editingMotivoProf = null
    editingMotivoValue = ''
  }
</script>

<div class="prof-layout">
  <div class="prof-pool">
    <div class="prof-pool-header">
      <h3>Personajes</h3>
      <span class="text-sm text-muted">{poolChars.length}</span>
    </div>
    <div class="prof-pool-body">
      {#each poolChars as c (c.nombre)}
        <div
          class="prof-chip"
          draggable="true"
          ondragstart={(e) => handleDragStart(e, c.nombre)}
          role="button"
          tabindex="0"
        >
          <span class="prof-chip-name {clsClass(c.clase)}">{c.nombre}</span>
          <span class="prof-chip-icons">
            {(c.profesiones ?? []).filter(s => s.id).map(s => profesionIcon(s.id)).join('')}
          </span>
          <button
            class="wow-btn wow-btn-icon prof-chip-edit"
            onclick={() => openCharEdit(c.nombre)}
            title="Editar personaje"
          >✏️</button>
        </div>
      {:else}
        <div class="text-xs text-muted prof-pool-empty">No hay personajes</div>
      {/each}
    </div>
  </div>

  <div class="prof-grid-wrap">
    <div class="prof-grid-header">
      <span class="text-xs text-muted">
        {#if activeWarband}
          Filtrado por: <strong>{activeWarband}</strong>
        {:else}
          Todos los personajes
        {/if}
      </span>
      <button class="wow-btn wow-btn-sm" onclick={openReorder}>⚙️ Orden</button>
    </div>

    <div class="prof-filters">
      <div class="prof-filter-group">
        <span class="filter-label">Tipo:</span>
        <label class="filter-radio"><input type="radio" name="profType" bind:group={profType} value="todas" /> Todas</label>
        <label class="filter-radio"><input type="radio" name="profType" bind:group={profType} value="recoleccion" /> Recolección</label>
        <label class="filter-radio"><input type="radio" name="profType" bind:group={profType} value="artesania" /> Artesanía</label>
      </div>
      <div class="prof-filter-group">
        <span class="filter-label">Slot:</span>
        <label class="filter-radio"><input type="radio" name="profSlot" bind:group={profSlot} value="ambas" /> Ambas</label>
        <label class="filter-radio"><input type="radio" name="profSlot" bind:group={profSlot} value="primera" /> 1ª</label>
        <label class="filter-radio"><input type="radio" name="profSlot" bind:group={profSlot} value="segunda" /> 2ª</label>
      </div>
      <div class="prof-filter-group">
        <span class="filter-label">Rol:</span>
        <label class="filter-check"><input type="checkbox" bind:checked={filterMain} /> Main</label>
        <label class="filter-check"><input type="checkbox" bind:checked={filterCD} /> CD</label>
        <label class="filter-check"><input type="checkbox" bind:checked={filterNone} /> None</label>
      </div>
      <div class="prof-filter-group">
        <label class="filter-check"><input type="checkbox" bind:checked={showMotivos} onchange={() => dataStore.setUIPref('showMotivosProf', showMotivos)} /> Ver motivos</label>
      </div>
    </div>

    <div class="prof-grid">
      {#each filteredProfesiones as prof}
        {@const chars = getCharsInProf(prof.id)}
        {@const mainCount = rolCount(prof.id, 'main')}
        {@const cdCount = rolCount(prof.id, 'cd')}
        <div
          class="prof-card"
          class:drag-over={dragOverProf === prof.id}
          ondragover={(e) => handleDragOver(e, prof.id)}
          ondragleave={handleDragLeave}
          ondrop={(e) => handleDrop(e, prof.id)}
        >
          <div class="prof-card-header">
            <span class="prof-card-icon">{profesionIcon(prof.id)}</span>
            <span class="prof-card-name">{prof.nombre}</span>
            <span class="prof-card-counts">
              {#if mainCount > 0}<span class="rol-badge rol-badge-main" title="Main">{mainCount}⭐</span>{/if}
              {#if cdCount > 0}<span class="rol-badge rol-badge-cd" title="Cooldown">{cdCount}⏱️</span>{/if}
              <span class="text-xs text-muted">{chars.length}</span>
            </span>
          </div>
          <div class="prof-card-body">
            {#each chars as c (c.nombre + prof.id)}
              {@const slot = (c.profesiones ?? []).find(s => s.id === prof.id)}
              <div
                class="prof-chip prof-chip-mini"
                draggable="true"
                ondragstart={(e) => handleDragStart(e, c.nombre)}
                role="button"
                tabindex="0"
              >
                {#if slot?.rol === 'main'}
                  <span class="rol-indicator rol-indicator-main" title="Main">⭐</span>
                {:else if slot?.rol === 'cd'}
                  <span class="rol-indicator rol-indicator-cd" title="Cooldown">⏱️</span>
                {/if}
                <span class="prof-chip-name {clsClass(c.clase)}">{c.nombre}</span>
                <select
                  class="prof-rol-select"
                  value={profRol(c, prof.id)}
                  onchange={(e) => setRol(c.nombre, prof.id, (e.target as HTMLSelectElement).value as 'main' | 'cd' | 'none')}
                  onclick={(e) => e.stopPropagation()}
                >
                  <option value="none">—</option>
                  <option value="main">Main</option>
                  <option value="cd">CD</option>
                </select>
                <button
                  class="wow-btn wow-btn-icon prof-chip-edit"
                  onclick={() => openCharEdit(c.nombre)}
                  title="Editar personaje"
                >✏️</button>
                <div class="prof-exp-row">
                  {#each EXPANSIONS as exp}
                    {@const done = slot?.completadas?.includes(exp.id)}
                    <button
                      class="prof-exp-dot"
                      class:done={done}
                      title={exp.nombre}
                      onclick={() => toggleExp(c.nombre, prof.id, exp.id)}
                    >{expAbbr(exp.id)}</button>
                  {/each}
                </div>
              </div>
              {#if showMotivos}
                {#if editingMotivoChar === c.nombre && editingMotivoProf === prof.id}
                  <textarea
                    class="prof-motivo-input"
                    rows="3"
                    maxlength="200"
                    bind:value={editingMotivoValue}
                    onkeydown={(e) => { if (e.key === 'Escape') cancelEditMotivo(); }}
                  ></textarea>
                  <button class="prof-motivo-btn prof-motivo-ok" onclick={saveMotivo} title="Guardar">✓</button>
                  <button class="prof-motivo-btn prof-motivo-cancel" onclick={cancelEditMotivo} title="Cancelar">✗</button>
                {:else}
                  <span
                    class="prof-motivo-text"
                    class:prof-motivo-empty={!slot?.motivo}
                    onclick={() => startEditMotivo(c.nombre, prof.id)}
                    title="Editar motivo"
                  >{slot?.motivo || 'Añadir motivo'}</span>
                {/if}
              {/if}
            {:else}
              <div class="text-xs text-muted prof-empty">Arrastra personajes aquí</div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<Dialog show={showReorder} title="Orden de profesiones" onclose={() => showReorder = false}>
  <div class="reorder-list">
    {#each reorderList as id, i}
      {@const info = PROFESIONES.find(p => p.id === id)}
      <div class="reorder-item">
        <span class="reorder-item-info">{profesionIcon(id)} {info?.nombre ?? id}</span>
        <div class="reorder-item-arrows">
          <button class="wow-btn wow-btn-icon" disabled={i === 0} onclick={() => moveReorderItem(i, -1)}>↑</button>
          <button class="wow-btn wow-btn-icon" disabled={i === reorderList.length - 1} onclick={() => moveReorderItem(i, 1)}>↓</button>
        </div>
      </div>
    {/each}
  </div>
  <div class="reorder-actions">
    <button class="wow-btn" onclick={saveReorder}>Guardar orden</button>
    <button class="wow-btn wow-btn-ghost" onclick={() => showReorder = false}>Cancelar</button>
  </div>
</Dialog>

<style>
  .prof-layout {
    display: grid;
    grid-template-columns: 170px 1fr;
    gap: 8px;
    align-items: start;
  }
  .prof-pool {
    background: var(--bg-elevated, #1e1e1e);
    border: 1px solid var(--border, #333);
    border-radius: var(--r-md, 6px);
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 130px);
  }
  .prof-pool-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    border-bottom: 1px solid var(--border, #333);
    flex-shrink: 0;
  }
  .prof-pool-header h3 {
    margin: 0;
    font-size: 0.75rem;
    flex: 1;
  }
  .prof-pool-body {
    flex: 1;
    overflow-y: auto;
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .prof-pool-empty {
    font-style: italic;
    padding: 12px 0;
    text-align: center;
    opacity: 0.5;
  }
  .prof-grid-wrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .prof-grid-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2px;
  }
  .prof-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 6px 8px;
    background: var(--bg-elevated, #1e1e1e);
    border: 1px solid var(--border, #333);
    border-radius: var(--r-md, 6px);
    font-size: 0.65rem;
  }
  .prof-filter-group {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .filter-label {
    font-weight: 600;
    color: var(--text-muted, #888);
    margin-right: 2px;
  }
  .filter-radio,
  .filter-check {
    display: flex;
    align-items: center;
    gap: 2px;
    cursor: pointer;
    color: var(--text-primary, #e0e0e0);
    white-space: nowrap;
  }
  .filter-radio input,
  .filter-check input {
    margin: 0;
  }
  .prof-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 6px;
  }
  .prof-card {
    background: var(--bg-elevated, #1e1e1e);
    border: 1px solid var(--border, #333);
    border-radius: var(--r-md, 6px);
    transition: border-color 0.15s, box-shadow 0.15s;
    min-width: 0;
  }
  .prof-card.drag-over {
    border-color: var(--gold, #d4af37);
    box-shadow: 0 0 12px rgba(212, 175, 55, 0.25);
  }
  .prof-card-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-bottom: 1px solid var(--border-subtle, #2a2a2a);
  }
  .prof-card-icon {
    font-size: 0.8rem;
    flex-shrink: 0;
  }
  .prof-card-name {
    font-size: 0.75rem;
    font-weight: 600;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .prof-card-counts {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  .rol-badge {
    font-size: 0.5rem;
    padding: 1px 4px;
    border-radius: 3px;
    font-weight: 700;
    line-height: 1.2;
  }
  .rol-badge-main {
    background: var(--gold, #d4af37);
    color: #1a1a1a;
  }
  .rol-badge-cd {
    background: #3a7bd5;
    color: #fff;
  }
  .prof-card-body {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 6px 10px;
    min-height: 36px;
  }
  .prof-empty {
    font-style: italic;
    opacity: 0.5;
    padding: 4px 0;
  }
  .prof-chip {
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
  .prof-chip:active {
    cursor: grabbing;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  .prof-chip:hover {
    background: var(--bg-hover, #333);
  }
  .prof-chip-mini {
    padding: 3px 6px;
    font-size: 0.65rem;
    flex-wrap: wrap;
  }
  .prof-chip-name {
    flex: 1;
    font-weight: 500;
    min-width: 0;
  }
  .prof-chip-icons {
    font-size: 0.55rem;
    opacity: 0.7;
    flex-shrink: 0;
  }
  .prof-chip-edit {
    font-size: 0.55rem !important;
    width: 18px !important;
    height: 18px !important;
    opacity: 0.4;
    transition: opacity 0.12s;
    flex-shrink: 0;
  }
  .prof-chip:hover .prof-chip-edit {
    opacity: 1;
  }
  .rol-indicator {
    font-size: 0.5rem;
    flex-shrink: 0;
  }
  .prof-rol-select {
    font-size: 0.55rem;
    padding: 1px 2px;
    border: 1px solid var(--border-subtle, #444);
    border-radius: 3px;
    background: var(--input-bg, #2a2a2a);
    color: var(--text-primary, #e0e0e0);
    cursor: pointer;
    flex-shrink: 0;
    max-width: 48px;
  }
  .prof-exp-row {
    display: flex;
    gap: 2px;
    flex-wrap: wrap;
    margin-top: 2px;
    width: 100%;
  }
  .prof-exp-dot {
    width: 18px;
    height: 18px;
    font-size: 0.45rem;
    font-weight: 700;
    border: 1px solid var(--border-subtle, #444);
    border-radius: 3px;
    background: var(--input-bg, #2a2a2a);
    color: var(--text-muted, #666);
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  .prof-exp-dot.done {
    background: var(--gold, #d4af37);
    color: #1a1a1a;
    border-color: var(--gold, #d4af37);
  }
  .prof-exp-dot:hover {
    border-color: var(--text-primary, #e0e0e0);
  }
  .reorder-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 60vh;
    overflow-y: auto;
  }
  .reorder-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    background: var(--input-bg, #2a2a2a);
    border: 1px solid var(--border-subtle, #3a3a3a);
    border-radius: var(--r-sm, 4px);
    font-size: 0.7rem;
  }
  .reorder-item-info {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .reorder-item-arrows {
    display: flex;
    gap: 4px;
  }
  .reorder-actions {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
    margin-top: 10px;
  }
  .prof-motivo-text {
    font-size: 0.5rem;
    color: var(--text-muted, #888);
    cursor: pointer;
    padding: 1px 4px;
    border: 1px solid transparent;
    border-radius: 3px;
    width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    overflow: hidden;
    line-height: 1.3;
  }
  .prof-motivo-text:hover {
    border-color: var(--border-subtle, #444);
  }
  .prof-motivo-empty {
    opacity: 0.4;
    font-style: italic;
  }
  .prof-motivo-input {
    font-size: 0.5rem;
    padding: 2px 4px;
    border: 1px solid var(--border, #555);
    border-radius: 3px;
    background: var(--input-bg, #2a2a2a);
    color: var(--text-primary, #e0e0e0);
    width: 100%;
    resize: none;
    line-height: 1.3;
  }
  .prof-motivo-btn {
    background: transparent;
    border: 1px solid var(--border-subtle, #444);
    border-radius: 3px;
    color: var(--text-primary, #e0e0e0);
    cursor: pointer;
    font-size: 0.5rem;
    padding: 1px 4px;
    line-height: 1.2;
    flex-shrink: 0;
  }
  .prof-motivo-ok:hover {
    border-color: #4caf50;
    color: #4caf50;
  }
  .prof-motivo-cancel:hover {
    border-color: #f44336;
    color: #f44336;
  }
</style>
