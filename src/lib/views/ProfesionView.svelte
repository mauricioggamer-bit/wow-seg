<script lang="ts">
  import { personajesStore, dataStore } from '../stores/data'
  import { currentWarband } from '../stores/ui'
  import { clsClass } from '../constants'
  import { getSessionPref, setSessionPref } from '../stores/sessionPrefs'
  import { PROFESIONES, profesionIcon } from '../constants/profesiones'
  import { EXPANSIONS } from '../constants'
  import type { ProfesionSlot } from '../types'
  import Dialog from '../components/Dialog.svelte'
  import ProfessionChartsModal from '../components/professions/ProfessionChartsModal.svelte'

  let { openCharEdit }: { openCharEdit: (name: string) => void } = $props()

  let dragOverProf = $state<string | null>(null)
  let showCharts = $state(false)

  // reorder
  let showReorder = $state(false)
  let reorderList = $state<string[]>([])

  // filters
  let filterMain = $state(false)
  let filterCD = $state(false)
  let filterNone = $state(false)
  let profType = $state<'todas' | 'recoleccion' | 'artesania'>('todas')
  let profSlot = $state<'ambas' | 'primera' | 'segunda'>('ambas')
  let showMotivos = $state(getSessionPref('showMotivosProf'))
  let showExpansions = $state(getSessionPref('showExpansionsProf'))
  $effect(() => { setSessionPref('showExpansionsProf', showExpansions) })
  let cardSort = $state<'expansion' | 'nombre' | 'rol'>('nombre')

  const BAR_COLORS = ['#8d6e63', '#66bb6a', '#ffa726', '#42a5f5', '#ab47bc', '#ef5350', '#26c6da', '#ec407a', '#7e57c2', '#26a69a', '#d4e157']

  let editingMotivoChar = $state<string | null>(null)
  let editingMotivoProf = $state<string | null>(null)
  let editingMotivoValue = $state('')

  let recoleccionIds = $derived(new Set(
    PROFESIONES.filter(p => dataStore.getProfesionTipo(p.id) === 'recoleccion').map(p => p.id)
  ))

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

  let totalSlots = $derived(allChars.reduce((s, c) => s + (c.profesiones ?? []).filter(sl => sl.id).length, 0))
  let recoSlots = $derived(allChars.reduce((s, c) => s + (c.profesiones ?? []).filter(sl => sl.id && recoleccionIds.has(sl.id)).length, 0))
  let artSlots = $derived(totalSlots - recoSlots)
  let recoPct = $derived(totalSlots > 0 ? (recoSlots / totalSlots * 100) : 0)
  let artPct = $derived(totalSlots > 0 ? (artSlots / totalSlots * 100) : 0)

  let filteredProfesiones = $derived(
    profType === 'todas'
      ? sortedProfesiones
      : sortedProfesiones.filter(p =>
          profType === 'recoleccion'
            ? recoleccionIds.has(p.id)
            : !recoleccionIds.has(p.id)
        )
  )

  let profMaxExp = $derived(
    new Map(PROFESIONES.map(p => [
      p.id,
      Math.max(-1, ...allChars.flatMap(c => {
        const slot = (c.profesiones ?? []).find(s => s.id === p.id)
        return slot ? slot.completadas.map(expId => EXPANSIONS.findIndex(e => e.id === expId)) : [-1]
      }))
    ]))
  )

  let displayProfesiones = $derived.by(() => {
    const list = [...filteredProfesiones]
    switch (cardSort) {
      case 'nombre':
        return list.sort((a, b) => a.nombre.localeCompare(b.nombre))
      case 'expansion':
        return list.sort((a, b) => {
          const aIdx = profMaxExp.get(a.id) ?? -1
          const bIdx = profMaxExp.get(b.id) ?? -1
          return bIdx - aIdx
        })
      case 'rol':
        return list.sort((a, b) => {
          const a1 = rolCount(a.id, '1ro'), b1 = rolCount(b.id, '1ro')
          if (a1 !== b1) return b1 - a1
          const a2 = rolCount(a.id, '2do'), b2 = rolCount(b.id, '2do')
          if (a2 !== b2) return b2 - a2
          const a3 = rolCount(a.id, '3ro'), b3 = rolCount(b.id, '3ro')
          if (a3 !== b3) return b3 - a3
          const a4 = rolCount(a.id, '4to'), b4 = rolCount(b.id, '4to')
          if (a4 !== b4) return b4 - a4
          return a.nombre.localeCompare(b.nombre)
        })
    }
  })

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
        if (filterMain && rol === '1ro') return true
        if (filterCD && (rol === '2do' || rol === '3ro' || rol === '4to')) return true
        if (filterNone && rol === 'none') return true
        return false
      })
    }
    chars.sort((a, b) => {
      const rolA = (a.profesiones ?? []).find(s => s.id === profId)?.rol ?? 'none'
      const rolB = (b.profesiones ?? []).find(s => s.id === profId)?.rol ?? 'none'
      const order = { '1ro': 0, '2do': 1, '3ro': 2, '4to': 3, none: 4 } as const
      return (order[rolA] ?? 4) - (order[rolB] ?? 4)
    })
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
    base[slotIdx] = { ...base[slotIdx], id: profId, completadas: base[slotIdx]?.completadas ?? [] }
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

  function setRol(charName: string, profId: string, newRol: '1ro' | '2do' | '3ro' | '4to' | 'none') {
    dataStore.updateProfesionRol(charName, profId, newRol === 'none' ? undefined : newRol)
  }

  function profRol(c: { profesiones?: ProfesionSlot[] }, profId: string): '1ro' | '2do' | '3ro' | '4to' | 'none' {
    const slot = (c.profesiones ?? []).find(s => s.id === profId)
    return slot?.rol ?? 'none'
  }

  function rolCount(profId: string, rol: '1ro' | '2do' | '3ro' | '4to'): number {
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
      <div class="prof-grid-actions">
        <button class="wow-btn wow-btn-sm" onclick={openReorder}>⚙️ Orden</button>
        <button class="wow-btn wow-btn-sm" onclick={() => showCharts = true}>📊 Análisis</button>
      </div>
    </div>

    <div class="prof-bars">
      {#if totalSlots > 0}
        <div class="prof-bar-row">
          <div class="prof-bar-labels">
            <span class="prof-bar-label prof-bar-label-reco">Recolección {recoSlots} ({recoPct.toFixed(0)}%)</span>
            <span class="prof-bar-label prof-bar-label-art">Artesanía {artSlots} ({artPct.toFixed(0)}%)</span>
          </div>
          <div class="prof-bar-track">
            <div class="prof-bar-fill prof-bar-fill-reco" style="width: {recoPct}%">
              {#if recoPct > 10}<span class="prof-bar-text">{recoPct.toFixed(0)}%</span>{/if}
            </div>
            <div class="prof-bar-fill prof-bar-fill-art" style="width: {artPct}%">
              {#if artPct > 10}<span class="prof-bar-text">{artPct.toFixed(0)}%</span>{/if}
            </div>
          </div>
        </div>
        {#if recoSlots > 0}
          <div class="prof-bar-row prof-bar-row-sub">
            <div class="prof-bar-labels">
              {#each PROFESIONES.filter(p => recoleccionIds.has(p.id)) as prof, i}
                {@const count = allChars.reduce((s, c) => s + (c.profesiones ?? []).filter(sl => sl.id === prof.id).length, 0)}
                {#if count > 0}
                  <span class="prof-bar-label prof-bar-label-sub">
                    <span class="prof-bar-dot" style="background: {BAR_COLORS[i % BAR_COLORS.length]}"></span>
                    {prof.nombre} {count} ({(count / recoSlots * 100).toFixed(0)}%)
                  </span>
                {/if}
              {/each}
            </div>
            <div class="prof-bar-track">
              {#each PROFESIONES.filter(p => recoleccionIds.has(p.id)) as prof, i}
                {@const count = allChars.reduce((s, c) => s + (c.profesiones ?? []).filter(sl => sl.id === prof.id).length, 0)}
                {#if count > 0}
                  {@const pct = count / recoSlots * 100}
                  <div class="prof-bar-fill" style="width: {pct.toFixed(1)}%; background: {BAR_COLORS[i % BAR_COLORS.length]}">
                    {#if pct > 10}<span class="prof-bar-text">{prof.nombre} {pct.toFixed(0)}%</span>{/if}
                  </div>
                {/if}
              {/each}
            </div>
          </div>
          {:else}
          <div class="prof-bar-row prof-bar-row-sub">
            <span class="text-xs text-muted">Sin profesiones de recolección</span>
          </div>
        {/if}
        {#if artSlots > 0}
          <div class="prof-bar-row prof-bar-row-sub">
            <div class="prof-bar-labels">
              {#each PROFESIONES.filter(p => !recoleccionIds.has(p.id)) as prof, i}
                {@const count = allChars.reduce((s, c) => s + (c.profesiones ?? []).filter(sl => sl.id === prof.id).length, 0)}
                {#if count > 0}
                  <span class="prof-bar-label prof-bar-label-sub">
                    <span class="prof-bar-dot" style="background: {BAR_COLORS[i % BAR_COLORS.length]}"></span>
                    {prof.nombre} {count} ({(count / artSlots * 100).toFixed(0)}%)
                  </span>
                {/if}
              {/each}
            </div>
            <div class="prof-bar-track">
              {#each PROFESIONES.filter(p => !recoleccionIds.has(p.id)) as prof, i}
                {@const count = allChars.reduce((s, c) => s + (c.profesiones ?? []).filter(sl => sl.id === prof.id).length, 0)}
                {#if count > 0}
                  {@const pct = count / artSlots * 100}
                  <div class="prof-bar-fill" style="width: {pct.toFixed(1)}%; background: {BAR_COLORS[i % BAR_COLORS.length]}">
                    {#if pct > 10}<span class="prof-bar-text">{prof.nombre} {pct.toFixed(0)}%</span>{/if}
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {:else}
          <div class="prof-bar-row prof-bar-row-sub">
            <span class="text-xs text-muted">Sin profesiones de artesanía</span>
          </div>
        {/if}
      {:else}
        <div class="prof-bar-row">
          <span class="text-xs text-muted">Sin profesiones asignadas</span>
        </div>
      {/if}
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
        <label class="filter-check"><input type="checkbox" bind:checked={filterMain} /> 1ro</label>
        <label class="filter-check"><input type="checkbox" bind:checked={filterCD} /> 2do+</label>
        <label class="filter-check"><input type="checkbox" bind:checked={filterNone} /> Sin rol</label>
      </div>
      <div class="prof-filter-group">
        <span class="filter-label">Orden:</span>
        <select class="prof-sort-select" bind:value={cardSort}>
          <option value="expansion">Expansión</option>
          <option value="nombre">Apellido</option>
          <option value="rol">1ro/2do/3ro/4to</option>
        </select>
      </div>
      <div class="prof-filter-group">
        <label class="filter-check"><input type="checkbox" bind:checked={showMotivos} onchange={() => setSessionPref('showMotivosProf', showMotivos)} /> Ver motivos</label>
        <label class="filter-check"><input type="checkbox" bind:checked={showExpansions} onchange={() => setSessionPref('showExpansionsProf', showExpansions)} /> Ver expansiones</label>
      </div>
    </div>

    <div class="prof-grid">
      {#each displayProfesiones as prof (prof.id)}}
        {@const chars = getCharsInProf(prof.id)}
        {@const c1ro = rolCount(prof.id, '1ro')}
        {@const c2do = rolCount(prof.id, '2do')}
        {@const c3ro = rolCount(prof.id, '3ro')}
        {@const c4to = rolCount(prof.id, '4to')}
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
              <span class="rol-badge rol-badge-1ro" title="1ro">1ro {c1ro}</span>
              <span class="rol-badge rol-badge-2do" title="2do">2do {c2do}</span>
              <span class="rol-badge rol-badge-3ro" title="3ro">3ro {c3ro}</span>
              <span class="rol-badge rol-badge-4to" title="4to">4to {c4to}</span>
              <span class="rol-badge rol-badge-none" title="Sin rol">{chars.length - c1ro - c2do - c3ro - c4to}</span>
              <span class="text-xs text-muted">({chars.length})</span>
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
                {#if slot?.rol}
                  <span class="rol-indicator rol-indicator-{slot.rol}" title={slot.rol}>{slot.rol}</span>
                {/if}
                <span class="prof-chip-name {clsClass(c.clase)}">{c.nombre}</span>
                <select
                  class="prof-rol-select"
                  value={profRol(c, prof.id)}
                  onchange={(e) => setRol(c.nombre, prof.id, (e.target as HTMLSelectElement).value as '1ro' | '2do' | '3ro' | '4to' | 'none')}
                  onclick={(e) => e.stopPropagation()}
                >
                  <option value="none">—</option>
                  <option value="1ro">1ro</option>
                  <option value="2do">2do</option>
                  <option value="3ro">3ro</option>
                  <option value="4to">4to</option>
                </select>
                <button
                  class="wow-btn wow-btn-icon prof-chip-edit"
                  onclick={() => openCharEdit(c.nombre)}
                  title="Editar personaje"
                >✏️</button>
                {#if showExpansions}
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
                {/if}
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

<Dialog show={showReorder} title="Orden y tipo de profesiones" onclose={() => showReorder = false}>
  <div class="reorder-list">
    {#each reorderList as id, i}
      {@const info = PROFESIONES.find(p => p.id === id)}
      {@const tipo = dataStore.getProfesionTipo(id)}
      <div class="reorder-item">
        <span class="reorder-item-info">{profesionIcon(id)} {info?.nombre ?? id}</span>
        <select
          class="prof-tipo-select"
          value={tipo}
          onchange={(e) => dataStore.setProfesionTipo(id, (e.target as HTMLSelectElement).value as 'recoleccion' | 'artesania')}
          onclick={(e) => e.stopPropagation()}
        >
          <option value="recoleccion">Recolección</option>
          <option value="artesania">Artesanía</option>
        </select>
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

<ProfessionChartsModal
  bind:show={showCharts}
  personajes={scopedChars}
  {profType}
  {profSlot}
  {filterMain}
  {filterCD}
  {filterNone}
/>

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
  .prof-grid-actions {
    display: flex;
    gap: 4px;
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
  .rol-badge-1ro {
    background: var(--gold, #d4af37);
    color: #1a1a1a;
  }
  .rol-badge-2do {
    background: #3a7bd5;
    color: #fff;
  }
  .rol-badge-3ro {
    background: #5a9bd5;
    color: #fff;
  }
  .rol-badge-4to {
    background: #7abbf5;
    color: #1a1a1a;
  }
  .rol-badge-none {
    background: var(--border-subtle, #3a3a3a);
    color: var(--text-muted, #888);
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
  .prof-sort-select {
    font-size: 0.55rem;
    padding: 1px 4px;
    border: 1px solid var(--border-subtle, #444);
    border-radius: 3px;
    background: var(--input-bg, #2a2a2a);
    color: var(--text-primary, #e0e0e0);
    cursor: pointer;
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

  .prof-tipo-select {
    font-size: 0.55rem;
    padding: 1px 4px;
    border: 1px solid var(--border-subtle, #444);
    border-radius: 3px;
    background: var(--input-bg, #2a2a2a);
    color: var(--text-primary, #e0e0e0);
    cursor: pointer;
    flex-shrink: 0;
  }

  .prof-bars {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 6px 8px;
    background: var(--bg-elevated, #1e1e1e);
    border: 1px solid var(--border, #333);
    border-radius: var(--r-md, 6px);
  }

  .prof-bar-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .prof-bar-row-sub {
    margin-top: 2px;
    padding-top: 3px;
    border-top: 1px solid var(--border-subtle, #2a2a2a);
  }

  .prof-bar-labels {
    display: flex;
    gap: 8px;
    font-size: 0.5rem;
    flex-wrap: wrap;
  }

  .prof-bar-label {
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .prof-bar-dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .prof-bar-label-reco { color: #4caf50; }
  .prof-bar-label-art { color: #42a5f5; }
  .prof-bar-label-sub { color: var(--text-muted, #888); }

  .prof-bar-track {
    display: flex;
    height: 22px;
    border-radius: 11px;
    overflow: hidden;
    background: var(--input-bg, #2a2a2a);
    border: 1px solid var(--border-subtle, #3a3a3a);
  }

  .prof-bar-fill {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: width 0.2s ease;
  }

  .prof-bar-text {
    font-size: 0.5rem;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    white-space: nowrap;
    overflow: hidden;
  }

  .prof-bar-fill-reco { background: #4caf50; }
  .prof-bar-fill-art { background: #42a5f5; }
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
