<script lang="ts">
  import Header from './lib/components/Header.svelte'
  import ViewSwitcher from './lib/components/ViewSwitcher.svelte'
  import WarbandTabs from './lib/components/WarbandTabs.svelte'
  import FilterBar from './lib/components/FilterBar.svelte'
  import DetailPanel from './lib/components/DetailPanel.svelte'
  import Dialog from './lib/components/Dialog.svelte'
  import Toast from './lib/components/Toast.svelte'
  import AuthView from './lib/views/AuthView.svelte'
  import WarbandView from './lib/views/WarbandView.svelte'
  import AllTasksView from './lib/views/AllTasksView.svelte'
  import TareasView from './lib/views/TareasView.svelte'
  import PrioridadTiempoView from './lib/views/PrioridadTiempoView.svelte'
  import PersonajesView from './lib/views/PersonajesView.svelte'
  import MapaView from './lib/views/MapaView.svelte'
  import FantasiaView from './lib/views/FantasiaView.svelte'
  import ProfesionView from './lib/views/ProfesionView.svelte'
  import KeybindView from './lib/views/KeybindView.svelte'
  import LevelingView from './lib/views/LevelingView.svelte'
  import WarbandManagerView from './lib/views/WarbandManagerView.svelte'
  import StrategicView from './lib/views/StrategicView.svelte'
  import EntityAssignments from './lib/components/strategic/EntityAssignments.svelte'
  import { authStore } from './lib/stores/auth'
  import { uiStore } from './lib/stores/ui'
  import { dataStore, personajesStore, warbandsStore } from './lib/stores/data'
  import { levelingStore } from './lib/stores/leveling'
  import { gistStore } from './lib/stores/gist'
  import { supabaseStore } from './lib/stores/supabaseSync'
  import { EXPANSIONS, PERS_RACE_INFO, CLASS_MAP } from './lib/constants'
  import { DUNGEON_EXPANSION_IDS, RAID_EXPANSION_IDS, WORLDBOSS_EXPANSION_IDS, dungeonsForExpansion, raidsForExpansion, worldBossesForExpansion, expNombre } from './lib/constants/wowContent'
  import { PROFESIONES } from './lib/constants/profesiones'
  import type { TipoContenido, DungeonDifficulty, RaidDifficulty } from './lib/constants/wowContent'
  import { fade } from 'svelte/transition'
  import type { Tarea, ProfesionSlot, ViewType, ExportSection } from './lib/types'

  let charOpts = $derived($personajesStore.map(p => p.nombre))

  let hasSidebar = $derived($uiStore.currentView === 'warband')

  let strategicIndexes = $derived($dataStore.strategicConfig?.indexes ?? [])
  let strategicCategories = $derived(
    [...($dataStore.strategicConfig?.categories ?? [])].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
  )
  let strategicLevelingCtx = $derived({
    config: $levelingStore,
    roster: $personajesStore,
    count90: $personajesStore.filter(p => p.nivel >= 90).length,
  })

  const VIEW_KEYS: Record<string, string> = {
    '1': 'warband', '2': 'tareas',
    '4': 'tasks', '6': 'personajes',
    '7': 'mapa', '8': 'fantasia', '9': 'profesion',
    '0': 'leveling',
  }

  $effect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const key = VIEW_KEYS[e.key]
      if (key) { e.preventDefault(); uiStore.setView(key as ViewType) }
    }
    if ($authStore.authenticated) {
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }
  })

  $effect(() => {
    if ($authStore.authenticated && !$uiStore.warbandInitialized) {
      const wbs = [...$warbandsStore].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      if (wbs.length > 0) uiStore.selectWarband(wbs[0].nombre)
    }
  })

  let warbandName = $state('')
  let warbandRenameNew = $state('')
  let moveCharName = $state('')
  let moveCharTarget = $state('')

  let importText = $state('')
  let importResult = $state<'idle' | 'success' | 'error'>('idle')
  let importErrorMsg = $state('')
  let exportSectionsState = $state<ExportSection[]>(['personajes', 'nombres_fantasia', 'profesiones', 'tareas', 'warbands', 'keybinds', 'config_leveling'])
  let exportSelectAll = $state(true)
  let copied = $state(false)

  const ALL_EXPORT_SECTIONS: { key: ExportSection; label: string }[] = [
    { key: 'personajes', label: 'Personajes' },
    { key: 'nombres_fantasia', label: 'Nombres y fantasía' },
    { key: 'profesiones', label: 'Profesiones' },
    { key: 'tareas', label: 'Tareas' },
    { key: 'warbands', label: 'Warbands' },
    { key: 'keybinds', label: 'Keybinds' },
    { key: 'config_leveling', label: 'Config leveling' },
  ]

  function handleExportCopy() {
    navigator.clipboard.writeText(exportJson)
    copied = true
    setTimeout(() => copied = false, 2000)
  }

  function handleImport() {
    importResult = 'idle'
    try {
      dataStore.importJSON(importText)
      importResult = 'success'
    } catch (e: any) {
      importResult = 'error'
      importErrorMsg = e.message
    }
  }

  let exportJson = $derived(
    exportSectionsState.length > 0
      ? dataStore.exportSections(exportSectionsState)
      : '// Selecciona al menos una sección para exportar'
  )
  let gistToken = $state('')
  let gistId = $state('')
  let sbInterval = $state(60)
  let sbConflict = $state<'local-wins' | 'remote-wins' | 'newest'>('newest')

  let editCharName = $state('')
  let editCharOriginalName = $state('')
  let editCharPersonaje = $derived($personajesStore.find(p => p.nombre === editCharOriginalName))
  let editCharClase = $state('')
  let editCharRaza = $state('')
  let editCharNivel = $state(1)
  let editCharFaccion = $state('')
  let editCharReino = $state('')
  let editCharPlaneado = $state(true)
  let editCharWarband = $state('')
  let editCharExpansion = $state('')
  let editCharParecidos = $state<string[]>([])
  let editCharDescripcion = $state('')
  let editCharProfesiones = $state<ProfesionSlot[]>([{ id: '', completadas: [] }, { id: '', completadas: [] }])

  let editTaskChar = $state('')
  let editTaskId = $state('')
  let editTaskNombre = $state('')
  let editTaskTipoContenido = $state<TipoContenido>('descripcion')
  let editTaskExpansion = $state('')
  let editTaskDificultad = $state('')
  let editTaskContenidoNombre = $state('')
  let editTaskPrioridad = $state('2')
  let editTaskTiempo = $state(15)
  let editTaskCooldown = $state('none')
  let editTaskRecompensa = $state('')
  let editTaskOrden = $state(0)
  let editTaskPuntos = $state(0)

  let newTaskChar = $state('')
  let newTaskNombre = $state('')
  let newTaskTipoContenido = $state<TipoContenido>('descripcion')
  let newTaskExpansion = $state('')
  let newTaskDificultad = $state('')
  let newTaskContenidoNombre = $state('')
  let newTaskPrioridad = $state('2')
  let newTaskTiempo = $state(15)
  let newTaskCooldown = $state('none')
  let newTaskRecompensa = $state('')
  let newTaskPuntos = $state(0)

  let isNewChar = $state(false)

  let charClasses = $derived(Object.keys(CLASS_MAP).sort())
  let charRaces = $derived(Object.keys(PERS_RACE_INFO).sort())
  let charFactions = $derived(['Alianza', 'Horda'])
  let charRealms = $derived([...new Set($personajesStore.map(c => c.reino).filter(r => r))].sort())

  function openCharEdit(name: string) {
    const c = $personajesStore.find(p => p.nombre === name)
    if (!c) return
    charEditError = null
    editCharName = c.nombre
    editCharOriginalName = c.nombre
    editCharClase = c.clase
    editCharRaza = c.raza
    editCharNivel = c.nivel
    editCharFaccion = c.faccion
    editCharReino = c.reino
    editCharPlaneado = c.planeado_usar
    editCharWarband = c.warband
    editCharExpansion = c.expansion_por_defecto || ''
    editCharParecidos = c.parecidos ? [...c.parecidos] : []
      while (editCharParecidos.length < 2) editCharParecidos.push('')
    editCharDescripcion = c.descripcion || ''
    const rawProf = c.profesiones ?? []
    editCharProfesiones = [
      { id: rawProf[0]?.id ?? '', completadas: Array.isArray(rawProf[0]?.completadas) ? [...rawProf[0].completadas] : [] },
      { id: rawProf[1]?.id ?? '', completadas: Array.isArray(rawProf[1]?.completadas) ? [...rawProf[1].completadas] : [] },
    ]
    uiStore.openModal('CharEdit')
  }

  function openNewChar() {
    isNewChar = true
    charEditError = null
    editCharName = ''
    editCharOriginalName = ''
    editCharClase = charClasses[0] || 'Guerrero'
    editCharRaza = charRaces[0] || ''
    editCharNivel = 1
    editCharFaccion = 'Horda'
    editCharReino = charRealms[0] || 'Raganaros'
    editCharPlaneado = true
    editCharWarband = ([...$warbandsStore].filter(w => w.nombre !== 'nada').sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))[0]?.nombre) || ''
    editCharExpansion = ''
    editCharParecidos = ['', '']
    editCharDescripcion = ''
    editCharProfesiones = [{ id: '', completadas: [] }, { id: '', completadas: [] }]
    uiStore.openModal('CharEdit')
  }

  function openTaskEdit(charName: string, taskId: string) {
    const c = $personajesStore.find(p => p.nombre === charName)
    if (!c) return
    const t = c.tareas.find(t => t.id === taskId)
    if (!t) return
    editTaskChar = charName
    editTaskId = taskId
    editTaskNombre = t.nombre
    editTaskTipoContenido = t.tipoContenido ?? 'descripcion'
    editTaskExpansion = editTaskTipoContenido === 'descripcion' ? (t.expansion || '') : (t.contenidoExpansion || '')
    editTaskDificultad = t.contenidoDificultad || ''
    editTaskContenidoNombre = t.nombre
    if (editTaskTipoContenido === 'descripcion') editTaskContenidoNombre = ''
    // Validar que la expansion guardada aún existe; si no, resetear
    if (editTaskTipoContenido === 'mazmorra' && !DUNGEON_EXPANSION_IDS.includes(editTaskExpansion)) editTaskExpansion = ''
    if (editTaskTipoContenido === 'raid' && !RAID_EXPANSION_IDS.includes(editTaskExpansion)) editTaskExpansion = ''
    if (editTaskTipoContenido === 'worldboss' && !WORLDBOSS_EXPANSION_IDS.includes(editTaskExpansion)) editTaskExpansion = ''
    editTaskPrioridad = String(t.prioridad)
    editTaskTiempo = t.tiempo_min
    editTaskCooldown = t.cooldown
    editTaskRecompensa = t.recompensa || ''
    editTaskOrden = t.orden ?? 0
    editTaskPuntos = t.puntos ?? 0
    uiStore.openModal('TaskEdit')
  }

  function saveTaskEdit() {
    const finalNombre = editTaskTipoContenido === 'descripcion'
      ? editTaskNombre.trim()
      : editTaskContenidoNombre
    if (!finalNombre) return
    dataStore.updateTarea(editTaskChar, editTaskId, {
      nombre: finalNombre,
      tipoContenido: editTaskTipoContenido,
      contenidoExpansion: editTaskTipoContenido === 'descripcion' ? '' : editTaskExpansion,
      contenidoDificultad: (editTaskTipoContenido === 'mazmorra' || editTaskTipoContenido === 'raid') ? editTaskDificultad : '',
      expansion: editTaskTipoContenido === 'descripcion' ? editTaskExpansion : '',
      prioridad: parseInt(editTaskPrioridad) as 1 | 2 | 3,
      tiempo_min: editTaskTiempo,
      cooldown: editTaskCooldown as 'weekly' | 'daily' | 'none',
      recompensa: editTaskRecompensa || undefined,
      orden: editTaskOrden,
      puntos: editTaskPuntos,
    })
    uiStore.closeModal()
  }

  function openTaskNew(charName: string) {
    newTaskChar = charName
    newTaskNombre = ''
    newTaskTipoContenido = 'descripcion'
    newTaskExpansion = ''
    newTaskDificultad = ''
    newTaskContenidoNombre = ''
    newTaskPrioridad = '2'
    newTaskTiempo = 15
    newTaskCooldown = 'none'
    newTaskRecompensa = ''
    newTaskPuntos = 0
    uiStore.openModal('TaskNew')
  }

  function saveTaskNew() {
    const finalNombre = newTaskTipoContenido === 'descripcion'
      ? newTaskNombre.trim()
      : newTaskContenidoNombre
    if (!finalNombre) return
    dataStore.addTarea(newTaskChar, {
      nombre: finalNombre,
      tipoContenido: newTaskTipoContenido,
      contenidoExpansion: newTaskTipoContenido === 'descripcion' ? '' : newTaskExpansion,
      contenidoDificultad: (newTaskTipoContenido === 'mazmorra' || newTaskTipoContenido === 'raid') ? newTaskDificultad : '',
      expansion: newTaskTipoContenido === 'descripcion' ? newTaskExpansion : '',
      prioridad: parseInt(newTaskPrioridad),
      tiempo_min: newTaskTiempo,
      cooldown: newTaskCooldown,
      recompensa: newTaskRecompensa || '',
      puntos: newTaskPuntos,
    })
    uiStore.closeModal()
  }

  function setNewTipoContenido(t: TipoContenido) {
    newTaskTipoContenido = t
    newTaskExpansion = ''
    newTaskDificultad = ''
    newTaskContenidoNombre = ''
    if (t === 'descripcion') { newTaskNombre = ''; return }
    if (t === 'mazmorra') newTaskExpansion = DUNGEON_EXPANSION_IDS[0] ?? ''
    else if (t === 'raid') newTaskExpansion = RAID_EXPANSION_IDS[0] ?? ''
    else if (t === 'worldboss') newTaskExpansion = WORLDBOSS_EXPANSION_IDS[0] ?? ''
    onNewExpansionChange()
  }

  function setEditTipoContenido(t: TipoContenido) {
    editTaskTipoContenido = t
    editTaskExpansion = ''
    editTaskDificultad = ''
    editTaskContenidoNombre = ''
    if (t === 'descripcion') return
    if (t === 'mazmorra') editTaskExpansion = DUNGEON_EXPANSION_IDS[0] ?? ''
    else if (t === 'raid') editTaskExpansion = RAID_EXPANSION_IDS[0] ?? ''
    else if (t === 'worldboss') editTaskExpansion = WORLDBOSS_EXPANSION_IDS[0] ?? ''
    onEditExpansionChange()
  }

  function onNewExpansionChange() {
    newTaskDificultad = ''
    newTaskContenidoNombre = ''
    if (newTaskTipoContenido === 'mazmorra') {
      const list = dungeonsForExpansion(newTaskExpansion)
      if (list.length) newTaskDificultad = list[0].dificultades[0]
    } else if (newTaskTipoContenido === 'raid') {
      const list = raidsForExpansion(newTaskExpansion)
      if (list.length) newTaskDificultad = list[0].dificultades[0]
    }
    onNewDificultadChange()
  }

  function onNewDificultadChange() {
    newTaskContenidoNombre = ''
    if (newTaskTipoContenido === 'mazmorra') {
      const list = dungeonsForExpansion(newTaskExpansion).filter(d => d.dificultades.includes(newTaskDificultad as DungeonDifficulty))
      newTaskContenidoNombre = list[0]?.nombre ?? ''
    } else if (newTaskTipoContenido === 'raid') {
      const list = raidsForExpansion(newTaskExpansion).filter(r => r.dificultades.includes(newTaskDificultad as RaidDifficulty))
      newTaskContenidoNombre = list[0]?.nombre ?? ''
    } else if (newTaskTipoContenido === 'worldboss') {
      const list = worldBossesForExpansion(newTaskExpansion)
      newTaskContenidoNombre = list[0]?.nombre ?? ''
    }
  }

  function onEditExpansionChange() {
    editTaskDificultad = ''
    editTaskContenidoNombre = ''
    if (editTaskTipoContenido === 'mazmorra') {
      const list = dungeonsForExpansion(editTaskExpansion)
      if (list.length) editTaskDificultad = list[0].dificultades[0]
    } else if (editTaskTipoContenido === 'raid') {
      const list = raidsForExpansion(editTaskExpansion)
      if (list.length) editTaskDificultad = list[0].dificultades[0]
    }
    onEditDificultadChange()
  }

  function onEditDificultadChange() {
    editTaskContenidoNombre = ''
    if (editTaskTipoContenido === 'mazmorra') {
      const list = dungeonsForExpansion(editTaskExpansion).filter(d => d.dificultades.includes(editTaskDificultad as DungeonDifficulty))
      editTaskContenidoNombre = list[0]?.nombre ?? ''
    } else if (editTaskTipoContenido === 'raid') {
      const list = raidsForExpansion(editTaskExpansion).filter(r => r.dificultades.includes(editTaskDificultad as RaidDifficulty))
      editTaskContenidoNombre = list[0]?.nombre ?? ''
    } else if (editTaskTipoContenido === 'worldboss') {
      const list = worldBossesForExpansion(editTaskExpansion)
      editTaskContenidoNombre = list[0]?.nombre ?? ''
    }
  }

  function setEditProfesion(idx: number, id: string) {
    const arr = [
      { ...editCharProfesiones[0] },
      { ...editCharProfesiones[1] },
    ]
    const other = idx === 0 ? 1 : 0
    if (id && arr[other].id === id) arr[other] = { id: '', completadas: [] }
    arr[idx] = { ...arr[idx], id }
    editCharProfesiones = arr
  }

  let charEditError = $state<string | null>(null)

  function saveCharEdit() {
    if (!editCharName.trim()) return
    const newName = editCharName.trim()
    if (isNewChar) {
      if (editCharWarband !== 'nada') {
        const wbFull = $warbandsStore.some(w => w.nombre === editCharWarband && w.personajes.length >= 4)
        if (wbFull) {
          charEditError = 'Ese warband está lleno (máx. 4 personajes)'
          return
        }
      }
      const ok = dataStore.addPersonaje({
        nombre: editCharName.trim(),
        clase: editCharClase,
        raza: editCharRaza,
        nivel: editCharNivel,
        faccion: editCharFaccion as 'Horda' | 'Alianza',
        reino: editCharReino,
        planeado_usar: editCharPlaneado,
        warband: editCharWarband,
        expansion_por_defecto: editCharExpansion || null,
        parecidos: editCharParecidos.filter(x => x.trim()).slice(0, 2),
        profesiones: editCharProfesiones,
        descripcion: editCharDescripcion,
      })
      if (!ok) {
        charEditError = `Ya existe un personaje llamado "${editCharName.trim()}"`
        return
      }
      isNewChar = false
    } else {
      if (newName !== editCharOriginalName) {
        const ok = dataStore.renamePersonaje(editCharOriginalName, newName)
        if (!ok) {
          charEditError = `Ya existe un personaje llamado "${newName}"`
          return
        }
        if ($uiStore.selectedCharacter === editCharOriginalName) {
          uiStore.selectCharacter(newName)
        }
      }
      const updateOk = dataStore.updatePersonaje(newName, {
        clase: editCharClase,
        raza: editCharRaza,
        nivel: editCharNivel,
        faccion: editCharFaccion as 'Horda' | 'Alianza',
        reino: editCharReino,
        planeado_usar: editCharPlaneado,
        warband: editCharWarband,
        expansion_por_defecto: editCharExpansion || null,
        parecidos: editCharParecidos.filter(x => x.trim()).slice(0, 2),
        profesiones: editCharProfesiones,
        descripcion: editCharDescripcion,
      })
      if (!updateOk) {
        charEditError = 'Ese warband está lleno (máx. 4 personajes)'
        return
      }
    }
    charEditError = null
    uiStore.closeModal()
  }
</script>

{#if $authStore.authenticated}
  <header class="main-header">
    <div class="app-container">
      <Header />
    </div>
  </header>
  <main id="main-content" class="app-container">
    <nav aria-label="Vistas principales">
      <ViewSwitcher />
    </nav>
    <nav aria-label="Filtro de warband">
      <WarbandTabs />
    </nav>
    <div class="warband-layout" class:has-sidebar={hasSidebar}>
      <div class="warband-main">
        {#key $uiStore.currentView}
          <div transition:fade={{ duration: 100 }}>
            {#if $uiStore.currentView === 'warband'}
              <FilterBar />
              <WarbandView />
            {:else if $uiStore.currentView === 'tareas'}
              <TareasView {openTaskEdit} {openTaskNew} />
            {:else if $uiStore.currentView === 'tasks'}
              <PrioridadTiempoView {openTaskEdit} />
            {:else if $uiStore.currentView === 'personajes'}
              <PersonajesView {openCharEdit} {openNewChar} />
            {:else if $uiStore.currentView === 'mapa'}
              <MapaView {openTaskEdit} openNewItemForChar={(char) => { uiStore.openModal('TaskNew') }} />
            {:else if $uiStore.currentView === 'fantasia'}
              <FantasiaView />
            {:else if $uiStore.currentView === 'profesion'}
              <ProfesionView {openCharEdit} />
            {:else if $uiStore.currentView === 'keybinds'}
              <KeybindView />
            {:else if $uiStore.currentView === 'leveling'}
              <LevelingView {openCharEdit} />
            {:else if $uiStore.currentView === 'warband-manager'}
              <WarbandManagerView {openCharEdit} />
            {:else if $uiStore.currentView === 'estrategia'}
              <StrategicView />
            {/if}
          </div>
        {/key}
      </div>
      {#if $uiStore.currentView === 'warband'}
        <aside class="detail-sidebar">
          {#if $uiStore.selectedCharacter}
            <DetailPanel {openCharEdit} {openTaskEdit} />
          {:else if $uiStore.currentWarband}
            <AllTasksView {openTaskEdit} />
          {/if}
        </aside>
      {/if}
    </div>
  </main>
  <Toast />

  <!-- Modal: Gist Config -->
  <Dialog show={$uiStore.activeModal === 'GistConfig'} title="Sincronizar Gist" onclose={() => uiStore.closeModal()}>
    {#snippet children()}
      <div class="form-group">
        <label for="gistToken">GitHub Token</label>
        <input id="gistToken" type="password" bind:value={gistToken} placeholder="ghp_..." />
      </div>
      <div class="form-group">
        <label for="gistId">Gist ID (opcional, dejar vacío para crear nuevo)</label>
        <input id="gistId" type="text" bind:value={gistId} placeholder="o dejar vacío" />
      </div>
      <div class="modal-footer">
        <button class="wow-btn" onclick={() => uiStore.closeModal()}>Cancelar</button>
        <button class="wow-btn wow-btn-arcane" onclick={() => {
          if (gistToken) {
            gistStore.connect(gistId || '', gistToken)
          }
          uiStore.closeModal()
        }}>Conectar</button>
      </div>
    {/snippet}
  </Dialog>

  <!-- Modal: Supabase Config -->
  <Dialog show={$uiStore.activeModal === 'SupabaseConfig'} title="Sincronizar Supabase" onclose={() => uiStore.closeModal()}>
    {#snippet children()}
      <div class="form-group">
        <label> Estado</label>
        <div class="wowseg-supabase-state">
          <span class:ok={$supabaseStore.status.tone === 'ok'} class:error={$supabaseStore.status.tone === 'error'} class:syncing={$supabaseStore.status.tone === 'syncing'}>
            {$supabaseStore.status.text || 'desconectado'}
          </span>
          <button class="wow-btn wow-btn-sm" onclick={() => { if ($supabaseStore.config.enabled) supabaseStore.disable(); else { supabaseStore.setConfigUpdate({ intervalMinutes: sbInterval, conflictStrategy: sbConflict }); supabaseStore.enable() } }}>
            {$supabaseStore.config.enabled ? 'Desconectar' : 'Conectar'}
          </button>
        </div>
      </div>
      <div class="form-group">
        <label for="sbInterval">Intervalo de sincronización (minutos)</label>
        <input id="sbInterval" type="number" min="5" max="1440" bind:value={sbInterval} disabled={$supabaseStore.config.enabled} />
      </div>
      <div class="form-group">
        <label for="sbConflict">Resolución de conflictos</label>
        <select id="sbConflict" bind:value={sbConflict} disabled={$supabaseStore.config.enabled}>
          <option value="newest">El remoto más nuevo (por updated_at)</option>
          <option value="local-wins">Local gana</option>
          <option value="remote-wins">Remoto gana</option>
        </select>
      </div>
      <div class="modal-footer">
        <button class="wow-btn" onclick={() => uiStore.closeModal()}>Cerrar</button>
        <button class="wow-btn wow-btn-arcane" onclick={() => { supabaseStore.doSync(true); uiStore.closeModal() }}>Sincronizar ahora</button>
      </div>
    {/snippet}
  </Dialog>

  <!-- Modal: Import/Export -->
  <Dialog show={$uiStore.activeModal === 'ImportExport'} title="Importar / Exportar" onclose={() => { importResult = 'idle'; importText = ''; uiStore.closeModal() }}>
    {#snippet children()}
      <div class="export-grid">
        <div class="export-panel">
          <h4 class="export-panel-title">Exportar</h4>
          <div class="export-checkboxes">
            <label class="export-checkbox export-checkbox-all">
              <input type="checkbox" checked={exportSelectAll} onchange={() => {
                exportSelectAll = !exportSelectAll
                exportSectionsState = exportSelectAll ? ALL_EXPORT_SECTIONS.map(s => s.key) : []
              }} />
              <span>Todo</span>
            </label>
            {#each ALL_EXPORT_SECTIONS as sec}
              <label class="export-checkbox">
                <input type="checkbox" checked={exportSectionsState.includes(sec.key)} onchange={() => {
                  if (exportSectionsState.includes(sec.key)) {
                    exportSectionsState = exportSectionsState.filter(k => k !== sec.key)
                  } else {
                    exportSectionsState = [...exportSectionsState, sec.key]
                  }
                  exportSelectAll = exportSectionsState.length === ALL_EXPORT_SECTIONS.length
                }} />
                <span>{sec.label}</span>
              </label>
            {/each}
          </div>
          <textarea class="export-textarea" readonly value={exportJson} placeholder="Selecciona secciones para generar el JSON"></textarea>
          <div class="export-actions">
            <button class="wow-btn wow-btn-sm wow-btn-primary" onclick={handleExportCopy} disabled={exportSectionsState.length === 0}>
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
        <div class="export-panel">
          <h4 class="export-panel-title">Importar</h4>
          <p class="export-hint">Pega el JSON exportado para restaurar datos. El import es aditivo por secciones.</p>
          <textarea class="export-textarea" bind:value={importText} placeholder="Pega el JSON aquí..."></textarea>
          <div class="export-actions">
            <button class="wow-btn wow-btn-sm wow-btn-danger" onclick={handleImport} disabled={!importText.trim()}>Importar</button>
          </div>
          {#if importResult === 'success'}
            <div class="import-status success">✓ Datos importados correctamente</div>
          {:else if importResult === 'error'}
            <div class="import-status error">✗ Error: {importErrorMsg}</div>
          {/if}
        </div>
      </div>
    {/snippet}
  </Dialog>

  <!-- Modal: Warband Management -->
  <Dialog show={$uiStore.activeModal === 'WarbandManage'} title="Gestionar Warbands" onclose={() => uiStore.closeModal()}>
    {#snippet children()}
      <div class="form-group">
        <label>Nuevo Warband</label>
        <div style="display:flex;gap:4px">
          <input type="text" bind:value={warbandName} placeholder="Nombre del warband" style="flex:1" />
          <button class="wow-btn wow-btn-sm wow-btn-primary" onclick={() => {
            if (warbandName.trim()) {
              dataStore.addWarband(warbandName.trim())
              warbandName = ''
            }
          }}>Crear</button>
        </div>
      </div>
      <div style="max-height:300px;overflow-y:auto">
        {#each [...$warbandsStore].filter(w => w.nombre !== 'nada').sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)) as wb}
          <div style="display:flex;align-items:center;gap:4px;padding:4px 0;border-bottom:1px solid var(--border)">
            <span style="flex:1;font-size:0.7rem">{wb.nombre} ({wb.personajes.length})</span>
            <input type="text" placeholder="Renombrar" bind:value={warbandRenameNew} style="width:100px;font-size:0.55rem;padding:1px 4px" />
            <button class="wow-btn wow-btn-sm" onclick={() => {
              if (warbandRenameNew.trim()) {
                dataStore.renameWarband(wb.nombre, warbandRenameNew.trim())
                warbandRenameNew = ''
              }
            }}>Renombrar</button>
            <button class="wow-btn wow-btn-sm wow-btn-danger" onclick={() => {
              if (confirm(`¿Eliminar warband "${wb.nombre}"?`)) {
                dataStore.deleteWarband(wb.nombre)
              }
            }}>Eliminar</button>
          </div>
        {/each}
      </div>
    {/snippet}
  </Dialog>

  <!-- Modal: Mover personaje -->
  <Dialog show={$uiStore.activeModal === 'WarbandMove'} title="Mover personaje" onclose={() => uiStore.closeModal()}>
    {#snippet children()}
      <div class="form-group">
        <label>Personaje</label>
        <select bind:value={moveCharName}>
          {#each $personajesStore as p}
            <option value={p.nombre}>{p.nombre} ({p.warband})</option>
          {/each}
        </select>
      </div>
      <div class="form-group">
        <label>Mover a</label>
        <select bind:value={moveCharTarget}>
          {#each [...$warbandsStore].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)) as wb}
            <option value={wb.nombre}>{wb.nombre}</option>
          {/each}
        </select>
      </div>
      <div class="modal-footer">
        <button class="wow-btn" onclick={() => uiStore.closeModal()}>Cancelar</button>
        <button class="wow-btn wow-btn-primary" onclick={() => {
          if (moveCharName && moveCharTarget) {
            dataStore.moveCharToWarband(moveCharName, moveCharTarget)
            uiStore.closeModal()
          }
        }}>Mover</button>
      </div>
    {/snippet}
  </Dialog>

  <!-- Modal: Editar / Nuevo Personaje -->
  <Dialog show={$uiStore.activeModal === 'CharEdit'} title={isNewChar ? 'Nuevo Personaje' : 'Editar Personaje'} side={true} onclose={() => { isNewChar = false; uiStore.closeModal() }}>
    {#snippet children()}
      <div class="form-group">
        <label>Nombre</label>
        <input type="text" bind:value={editCharName} />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <div class="form-group">
          <label>Clase</label>
          <select bind:value={editCharClase}>
            {#each charClasses as cl}
              <option value={cl}>{cl}</option>
            {/each}
          </select>
        </div>
        <div class="form-group">
          <label>Raza</label>
          <select bind:value={editCharRaza}>
            {#each charRaces as r}
              <option value={r}>{r}</option>
            {/each}
          </select>
        </div>
        <div class="form-group">
          <label>Nivel</label>
          <input type="number" bind:value={editCharNivel} min="1" max="90" />
        </div>
        <div class="form-group">
          <label>Facción</label>
          <select bind:value={editCharFaccion}>
            {#each charFactions as f}
              <option value={f}>{f}</option>
            {/each}
          </select>
        </div>
        <div class="form-group">
          <label>Reino</label>
          <select bind:value={editCharReino}>
            {#each charRealms as r}
              <option value={r}>{r}</option>
            {/each}
          </select>
        </div>
        <div class="form-group">
          <label>Warband</label>
          <select bind:value={editCharWarband}>
            <option value="nada">Sin Warband</option>
            {#each [...$warbandsStore].filter(w => w.nombre !== 'nada').sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)) as wb}
              <option value={wb.nombre} disabled={wb.personajes.length >= 4 && wb.nombre !== editCharWarband}>
                {wb.nombre}{wb.personajes.length >= 4 ? ' (lleno)' : ''}
              </option>
            {/each}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Expansión por defecto (mapa)</label>
        <select bind:value={editCharExpansion}>
          <option value="">(ninguna)</option>
          {#each EXPANSIONS as exp}
            <option value={exp.id}>{exp.nombre}</option>
          {/each}
        </select>
      </div>
      <div class="form-group">
        <label>Se parece a (personaje del lore) · 2 máx.</label>
        <div style="display:flex;gap:6px">
          <input type="text" bind:value={editCharParecidos[0]} placeholder="Ej: Thrall..." />
          <input type="text" bind:value={editCharParecidos[1]} placeholder="Ej: Jaina..." />
        </div>
      </div>
      <div class="form-group">
        <label>Descripción</label>
        <textarea bind:value={editCharDescripcion} placeholder="Historia, objetivos, rol del personaje..." rows="2" style="width:100%;background:var(--input-bg);border:1px solid var(--border-subtle);border-radius:var(--r-sm);padding:4px 6px;color:var(--text-primary);font-size:0.75rem;font-family:inherit;resize:vertical"></textarea>
      </div>
      <div class="form-group">
        <label>Profesiones (2 máx.)</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          {#each [0, 1] as idx}
            <div style="display:flex;flex-direction:column;gap:4px">
              <select
                value={editCharProfesiones[idx]?.id ?? ''}
                onchange={(e) => setEditProfesion(idx, (e.target as HTMLSelectElement).value)}
              >
                <option value="">— Ninguna —</option>
                {#each PROFESIONES as p}
                  <option
                    value={p.id}
                    disabled={p.id === (editCharProfesiones[idx === 0 ? 1 : 0]?.id ?? '')}
                  >{p.icon} {p.nombre}</option>
                {/each}
              </select>
              <div class="prof-exp-badges">
                {#each EXPANSIONS as exp}
                  {@const checked = editCharProfesiones[idx]?.completadas?.includes(exp.id)}
                  <button
                    class="prof-exp-badge"
                    class:done={checked}
                    disabled={!editCharProfesiones[idx]?.id}
                    title={exp.nombre}
                    onclick={() => {
                      const slot = editCharProfesiones[idx]
                      if (!slot?.id) return
                      const next = checked
                        ? slot.completadas.filter(x => x !== exp.id)
                        : [...slot.completadas, exp.id]
                      editCharProfesiones = editCharProfesiones.map((s, i) =>
                        i === idx ? { ...s, completadas: next } : s
                      )
                    }}
                  >{exp.id === 'classic' ? 'C' : exp.id === 'tww' ? 'T' : exp.id === 'dragonflight' ? 'D' : exp.id === 'shadowlands' ? 'S' : exp.id === 'legion' ? 'L' : exp.id === 'bfa' ? 'B' : exp.id === 'draenor' ? 'W' : exp.id === 'mop' ? 'M' : exp.id === 'cata' ? 'Ct' : exp.id === 'wotlk' ? 'Wr' : exp.id === 'midnight' ? 'Md' : exp.id === 'outland' ? 'O' : '?'}</button>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
      {#if !isNewChar && editCharPersonaje}
        <div class="form-group">
          <label>Ventajas estratégicas</label>
          <EntityAssignments
            entityType="personaje"
            entityId={editCharOriginalName}
            entityLabel={editCharName}
            indexes={strategicIndexes}
            categories={strategicCategories}
            personajeData={editCharPersonaje}
            levelingCtx={strategicLevelingCtx}
          />
        </div>
      {/if}
      <label style="display:flex;align-items:center;gap:6px;font-size:0.75rem;margin-top:4px">
        <input type="checkbox" bind:checked={editCharPlaneado} />
        Activo
      </label>
      {#if charEditError}
        <div class="char-edit-error">{charEditError}</div>
      {/if}
      <div class="modal-footer">
        {#if !isNewChar}
          <button class="wow-btn wow-btn-danger" onclick={() => {
            if (confirm(`¿Eliminar definitivamente a "${editCharName}"?`)) {
              dataStore.deletePersonaje(editCharOriginalName)
              if ($uiStore.selectedCharacter === editCharOriginalName) uiStore.selectCharacter(null)
              isNewChar = false
              uiStore.closeModal()
            }
          }}>Eliminar personaje</button>
        {/if}
        <div style="flex:1"></div>
        <button class="wow-btn" onclick={() => { charEditError = null; isNewChar = false; uiStore.closeModal() }}>Cancelar</button>
        <button class="wow-btn wow-btn-primary" onclick={saveCharEdit}>Guardar</button>
      </div>
    {/snippet}
  </Dialog>

  <!-- Modal: Editar Tarea -->
  <Dialog show={$uiStore.activeModal === 'TaskEdit'} title="Editar Tarea" onclose={() => uiStore.closeModal()}>
    {#snippet children()}
      <div class="form-group">
        <label>Contenido de la tarea</label>
        <fieldset style="border:1px solid #555;padding:8px;margin:2px 0">
          <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:0.85em">
            <label><input type="radio" name="editTipoContenido" checked={editTaskTipoContenido==='descripcion'} onclick={() => setEditTipoContenido('descripcion')} /> Descripción</label>
            <label><input type="radio" name="editTipoContenido" checked={editTaskTipoContenido==='mazmorra'} onclick={() => setEditTipoContenido('mazmorra')} /> Mazmorra</label>
            <label><input type="radio" name="editTipoContenido" checked={editTaskTipoContenido==='raid'} onclick={() => setEditTipoContenido('raid')} /> Raid</label>
            <label><input type="radio" name="editTipoContenido" checked={editTaskTipoContenido==='worldboss'} onclick={() => setEditTipoContenido('worldboss')} /> Jefe del mundo</label>
          </div>
          {#if editTaskTipoContenido === 'descripcion'}
            <div style="margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:6px">
              <div class="form-group" style="margin:0;grid-column:1/-1">
                <label style="font-size:0.7rem">Nombre</label>
                <input id="editTaskNombre" type="text" bind:value={editTaskNombre} style="width:100%" />
              </div>
              <div class="form-group" style="margin:0;grid-column:1/-1">
                <label style="font-size:0.7rem">Expansión</label>
                <select bind:value={editTaskExpansion}>
                  <option value="">Sin especificar</option>
                  {#each EXPANSIONS as exp}<option value={exp.id}>{exp.nombre}</option>{/each}
                </select>
              </div>
            </div>
          {:else}
            <div style="margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:6px">
              <div class="form-group" style="margin:0">
                <label style="font-size:0.7rem">Expansión</label>
                <select bind:value={editTaskExpansion} onchange={onEditExpansionChange}>
                  {#each (editTaskTipoContenido === 'mazmorra' ? DUNGEON_EXPANSION_IDS : editTaskTipoContenido === 'raid' ? RAID_EXPANSION_IDS : WORLDBOSS_EXPANSION_IDS) as e}<option value={e}>{expNombre(e)}</option>{/each}
                </select>
              </div>
              {#if editTaskTipoContenido !== 'worldboss'}
                <div class="form-group" style="margin:0">
                  <label style="font-size:0.7rem">Dificultad</label>
                  <select bind:value={editTaskDificultad} onchange={onEditDificultadChange}>
                    {#each (editTaskTipoContenido === 'mazmorra'
                      ? [...new Set(dungeonsForExpansion(editTaskExpansion).flatMap(d => d.dificultades))]
                      : [...new Set(raidsForExpansion(editTaskExpansion).flatMap(r => r.dificultades))]) as d}<option value={d}>{d}</option>{/each}
                  </select>
                </div>
                <div class="form-group" style="margin:0;grid-column:1/-1">
                  <label style="font-size:0.7rem">{editTaskTipoContenido === 'mazmorra' ? 'Mazmorra' : 'Raid'}</label>
                  <select bind:value={editTaskContenidoNombre}>
                    {#each (editTaskTipoContenido === 'mazmorra'
                      ? dungeonsForExpansion(editTaskExpansion).filter(d => d.dificultades.includes(editTaskDificultad as DungeonDifficulty)).map(d => d.nombre)
                      : raidsForExpansion(editTaskExpansion).filter(r => r.dificultades.includes(editTaskDificultad as RaidDifficulty)).map(r => r.nombre)) as n}<option value={n}>{n}</option>{/each}
                  </select>
                </div>
              {:else}
                <div class="form-group" style="margin:0;grid-column:1/-1">
                  <label style="font-size:0.7rem">Jefe del mundo</label>
                  <select bind:value={editTaskContenidoNombre}>
                    {#each worldBossesForExpansion(editTaskExpansion) as w}<option value={w.nombre}>{w.nombre}</option>{/each}
                  </select>
                </div>
              {/if}
            </div>
          {/if}
        </fieldset>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <div class="form-group">
          <label>Prioridad</label>
          <select bind:value={editTaskPrioridad}>
            <option value="1">P1 - Alta</option>
            <option value="2">P2 - Media</option>
            <option value="3">P3 - Baja</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tiempo (min)</label>
          <input type="number" bind:value={editTaskTiempo} min="0" />
        </div>
        <div class="form-group">
          <label>Cooldown</label>
          <select bind:value={editTaskCooldown}>
            <option value="none">Farm Libre</option>
            <option value="daily">Diaria</option>
            <option value="weekly">Semanal</option>
          </select>
        </div>
        <div class="form-group">
          <label>Recompensa</label>
          <input type="text" bind:value={editTaskRecompensa} placeholder="Ej: 500g" />
        </div>
        <div class="form-group">
          <label>Puntos Estratégicos</label>
          <input type="number" bind:value={editTaskPuntos} min="0" max="100" />
        </div>
        <div class="form-group">
          <label>Orden</label>
          <input type="number" bind:value={editTaskOrden} min="0" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="wow-btn" onclick={() => uiStore.closeModal()}>Cancelar</button>
        <button class="wow-btn wow-btn-primary" onclick={saveTaskEdit}>Guardar</button>
      </div>
    {/snippet}
  </Dialog>

  <!-- Modal: Asignar Tarea -->
  <Dialog show={$uiStore.activeModal === 'TaskNew'} title="Asignar Tarea" onclose={() => uiStore.closeModal()}>
    {#snippet children()}
      <div class="form-group">
        <label>Personaje</label>
        <input type="text" value={newTaskChar} disabled />
      </div>
      <div class="form-group">
        <label>Contenido de la tarea</label>
        <fieldset style="border:1px solid #555;padding:8px;margin:2px 0">
          <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:0.85em">
            <label><input type="radio" name="newTipoContenido" checked={newTaskTipoContenido==='descripcion'} onclick={() => setNewTipoContenido('descripcion')} /> Descripción</label>
            <label><input type="radio" name="newTipoContenido" checked={newTaskTipoContenido==='mazmorra'} onclick={() => setNewTipoContenido('mazmorra')} /> Mazmorra</label>
            <label><input type="radio" name="newTipoContenido" checked={newTaskTipoContenido==='raid'} onclick={() => setNewTipoContenido('raid')} /> Raid</label>
            <label><input type="radio" name="newTipoContenido" checked={newTaskTipoContenido==='worldboss'} onclick={() => setNewTipoContenido('worldboss')} /> Jefe del mundo</label>
          </div>
          {#if newTaskTipoContenido === 'descripcion'}
            <div style="margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:6px">
              <div class="form-group" style="margin:0;grid-column:1/-1">
                <label style="font-size:0.7rem">Nombre</label>
                <input id="newTaskNombre" type="text" bind:value={newTaskNombre} placeholder="Ej: Weekly Zereth Mortis" style="width:100%" />
              </div>
              <div class="form-group" style="margin:0;grid-column:1/-1">
                <label style="font-size:0.7rem">Expansión</label>
                <select bind:value={newTaskExpansion}>
                  <option value="">Sin especificar</option>
                  {#each EXPANSIONS as exp}<option value={exp.id}>{exp.nombre}</option>{/each}
                </select>
              </div>
            </div>
          {:else}
            <div style="margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:6px">
              <div class="form-group" style="margin:0">
                <label style="font-size:0.7rem">Expansión</label>
                <select bind:value={newTaskExpansion} onchange={onNewExpansionChange}>
                  {#each (newTaskTipoContenido === 'mazmorra' ? DUNGEON_EXPANSION_IDS : newTaskTipoContenido === 'raid' ? RAID_EXPANSION_IDS : WORLDBOSS_EXPANSION_IDS) as e}<option value={e}>{expNombre(e)}</option>{/each}
                </select>
              </div>
              {#if newTaskTipoContenido !== 'worldboss'}
                <div class="form-group" style="margin:0">
                  <label style="font-size:0.7rem">Dificultad</label>
                  <select bind:value={newTaskDificultad} onchange={onNewDificultadChange}>
                    {#each (newTaskTipoContenido === 'mazmorra'
                      ? [...new Set(dungeonsForExpansion(newTaskExpansion).flatMap(d => d.dificultades))]
                      : [...new Set(raidsForExpansion(newTaskExpansion).flatMap(r => r.dificultades))]) as d}<option value={d}>{d}</option>{/each}
                  </select>
                </div>
                <div class="form-group" style="margin:0;grid-column:1/-1">
                  <label style="font-size:0.7rem">{newTaskTipoContenido === 'mazmorra' ? 'Mazmorra' : 'Raid'}</label>
                  <select bind:value={newTaskContenidoNombre}>
                    {#each (newTaskTipoContenido === 'mazmorra'
                      ? dungeonsForExpansion(newTaskExpansion).filter(d => d.dificultades.includes(newTaskDificultad as DungeonDifficulty)).map(d => d.nombre)
                      : raidsForExpansion(newTaskExpansion).filter(r => r.dificultades.includes(newTaskDificultad as RaidDifficulty)).map(r => r.nombre)) as n}<option value={n}>{n}</option>{/each}
                  </select>
                </div>
              {:else}
                <div class="form-group" style="margin:0;grid-column:1/-1">
                  <label style="font-size:0.7rem">Jefe del mundo</label>
                  <select bind:value={newTaskContenidoNombre}>
                    {#each worldBossesForExpansion(newTaskExpansion) as w}<option value={w.nombre}>{w.nombre}</option>{/each}
                  </select>
                </div>
              {/if}
            </div>
          {/if}
        </fieldset>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <div class="form-group">
          <label>Prioridad</label>
          <select bind:value={newTaskPrioridad}>
            <option value="1">P1 - Alta</option>
            <option value="2">P2 - Media</option>
            <option value="3">P3 - Baja</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tiempo (min)</label>
          <input type="number" bind:value={newTaskTiempo} min="0" />
        </div>
        <div class="form-group">
          <label>Cooldown</label>
          <select bind:value={newTaskCooldown}>
            <option value="none">Farm Libre</option>
            <option value="daily">Diaria</option>
            <option value="weekly">Semanal</option>
          </select>
        </div>
        <div class="form-group">
          <label>Recompensa</label>
          <input type="text" bind:value={newTaskRecompensa} placeholder="Ej: 500g" />
        </div>
        <div class="form-group">
          <label>Puntos Estratégicos</label>
          <input type="number" bind:value={newTaskPuntos} min="0" max="100" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="wow-btn" onclick={() => uiStore.closeModal()}>Cancelar</button>
        <button class="wow-btn wow-btn-primary" onclick={saveTaskNew}>Asignar</button>
      </div>
    {/snippet}
  </Dialog>

{:else}
  <AuthView />
{/if}

<style>
  .export-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .export-panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .export-panel:first-child {
    border-right: 1px solid var(--border-subtle, #333);
    padding-right: 12px;
  }
  .export-panel-title {
    margin: 0;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-primary, #e0e0e0);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .export-hint {
    margin: 0;
    font-size: 0.55rem;
    color: var(--text-muted, #888);
    line-height: 1.4;
  }
  .export-checkboxes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px 8px;
    font-size: 0.6rem;
  }
  .export-checkbox {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    color: var(--text-muted, #888);
  }
  .export-checkbox input {
    accent-color: var(--gold, #d4af37);
  }
  .export-checkbox:hover {
    color: var(--text-primary, #e0e0e0);
  }
  .export-checkbox-all {
    grid-column: 1 / -1;
    font-weight: 600;
    padding-bottom: 3px;
    border-bottom: 1px solid var(--border-subtle, #333);
    margin-bottom: 2px;
  }
  .export-checkbox-all span {
    color: var(--text-primary, #e0e0e0);
  }
  .export-textarea {
    width: 100%;
    min-height: 100px;
    font-size: 0.55rem;
    font-family: monospace;
    background: var(--input-bg, #1e1e1e);
    color: var(--text-primary, #e0e0e0);
    border: 1px solid var(--border-subtle, #333);
    border-radius: 3px;
    padding: 6px;
    resize: vertical;
    box-sizing: border-box;
  }
  .export-textarea:focus {
    outline: none;
    border-color: var(--gold, #d4af37);
  }
  .export-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .import-status {
    font-size: 0.55rem;
    padding: 4px 8px;
    border-radius: 3px;
    text-align: center;
  }
  .import-status.success {
    color: #4caf50;
    background: rgba(76,175,80,0.1);
    border: 1px solid rgba(76,175,80,0.3);
  }
  .import-status.error {
    color: #ff4444;
    background: rgba(255,68,68,0.1);
    border: 1px solid rgba(255,68,68,0.3);
  }
  .warband-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    margin-top: 4px;
    transition: grid-template-columns 0.25s ease;
  }
  .warband-layout.has-sidebar {
    grid-template-columns: 1fr 1fr;
  }
  .detail-sidebar {
    overflow-y: auto;
  }
  .detail-sidebar:empty { display: none; }
  .warband-main { min-width: 0; }
  .prof-exp-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    margin-top: 2px;
  }
  .prof-exp-badge {
    width: 22px;
    height: 22px;
    font-size: 0.5rem;
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
  .prof-exp-badge.done {
    background: var(--gold, #d4af37);
    color: #1a1a1a;
    border-color: var(--gold, #d4af37);
  }
  .prof-exp-badge:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .prof-exp-badge:not(:disabled):hover {
    border-color: var(--text-primary, #e0e0e0);
  }
  .char-edit-error {
    color: #ff4444;
    font-size: 0.5rem;
    padding: 4px 8px;
    margin-bottom: 4px;
    background: rgba(255,68,68,0.1);
    border: 1px solid rgba(255,68,68,0.3);
    border-radius: 2px;
    text-align: center;
  }
</style>
