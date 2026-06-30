<script lang="ts">
  import Header from './lib/components/Header.svelte'
  import ViewSwitcher from './lib/components/ViewSwitcher.svelte'
  import WarbandTabs from './lib/components/WarbandTabs.svelte'
  import FilterBar from './lib/components/FilterBar.svelte'
  import DetailPanel from './lib/components/DetailPanel.svelte'
  import Dialog from './lib/components/Dialog.svelte'
  import StatusBar from './lib/components/StatusBar.svelte'
  import AuthView from './lib/views/AuthView.svelte'
  import WarbandView from './lib/views/WarbandView.svelte'
  import AllTasksView from './lib/views/AllTasksView.svelte'
  import TareasView from './lib/views/TareasView.svelte'
  import TablaView from './lib/views/TablaView.svelte'
  import PriorityView from './lib/views/PriorityView.svelte'
  import TimeView from './lib/views/TimeView.svelte'
  import PersonajesView from './lib/views/PersonajesView.svelte'
  import MapaView from './lib/views/MapaView.svelte'
  import FantasiaView from './lib/views/FantasiaView.svelte'
  import ProfesionView from './lib/views/ProfesionView.svelte'
  import { authStore } from './lib/stores/auth'
  import { uiStore } from './lib/stores/ui'
  import { dataStore, personajesStore, misionesStore, warbandsStore } from './lib/stores/data'
  import { gistStore } from './lib/stores/gist'
  import { EXPANSIONS, PERS_RACE_INFO } from './lib/constants'
  import { DUNGEON_EXPANSION_IDS, RAID_EXPANSION_IDS, WORLDBOSS_EXPANSION_IDS, dungeonsForExpansion, raidsForExpansion, worldBossesForExpansion, expNombre } from './lib/constants/wowContent'
  import { PROFESIONES } from './lib/constants/profesiones'
  import type { TipoContenido, DungeonDifficulty, RaidDifficulty } from './lib/constants/wowContent'
  import type { Tarea, Mision, ProfesionSlot } from './lib/types'

  let charOpts = $derived($personajesStore.map(p => p.nombre))

  let hasSidebar = $derived($uiStore.currentView === 'warband')

  $effect(() => {
    if ($authStore.authenticated && !$uiStore.currentWarband) {
      const wbs = $warbandsStore
      if (wbs.length > 0) uiStore.selectWarband(wbs[0].nombre)
    }
  })

  let misionNombre = $state('')
  let misionPersonaje = $state('')
  let misionTipo = $state('mision')
  let misionExpansion = $state('')
  let misionPrioridad = $state('2')
  let misionTiempo = $state(30)
  let misionTags = $state('')

  let warbandName = $state('')
  let warbandRenameNew = $state('')
  let moveCharName = $state('')
  let moveCharTarget = $state('')

  let importText = $state('')
  let gistToken = $state('')
  let gistId = $state('')

  let editCharName = $state('')
  let editCharClase = $state('')
  let editCharRaza = $state('')
  let editCharNivel = $state(1)
  let editCharFaccion = $state('')
  let editCharReino = $state('')
  let editCharActivo = $state(true)
  let editCharPlaneado = $state(true)
  let editCharWarband = $state('')
  let editCharMisionPrincipal = $state('')
  let editCharExpansion = $state('')
  let editCharParecidos = $state<string[]>([])
  let editCharDescripcion = $state('')
  let editCharTipo = $state<'iconico' | 'funcional'>('funcional')
  let editCharProfesiones = $state<ProfesionSlot[]>([{ id: '', nivel: 0 }, { id: '', nivel: 0 }])

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

  let editMissionId = $state('')
  let editMissionNombre = $state('')
  let editMissionPersonaje = $state('')
  let editMissionTipo = $state('mision')
  let editMissionExpansion = $state('')
  let editMissionPrioridad = $state('2')
  let editMissionTiempo = $state(30)
  let editMissionTags = $state('')
  let isNewChar = $state(false)

  let charClasses = $derived([...new Set($personajesStore.map(c => c.clase))].sort())
  let charRaces = $derived(Object.keys(PERS_RACE_INFO).sort())
  let charFactions = $derived([...new Set($personajesStore.map(c => c.faccion))].sort())
  let charRealms = $derived([...new Set($personajesStore.map(c => c.reino))].sort())

  function resetMissionForm() {
    misionNombre = ''
    misionPersonaje = $uiStore.selectedCharacter || ''
    misionTipo = 'mision'
    misionExpansion = ''
    misionPrioridad = '2'
    misionTiempo = 30
    misionTags = ''
  }

  function openCharEdit(name: string) {
    const c = $personajesStore.find(p => p.nombre === name)
    if (!c) return
    editCharName = c.nombre
    editCharClase = c.clase
    editCharRaza = c.raza
    editCharNivel = c.nivel
    editCharFaccion = c.faccion
    editCharReino = c.reino
    editCharActivo = c.activo
    editCharPlaneado = c.planeado_usar !== false
    editCharWarband = c.warband
    editCharMisionPrincipal = c.mision_principal || ''
    editCharExpansion = c.expansion_por_defecto || ''
    editCharParecidos = c.parecidos ? [...c.parecidos] : []
      while (editCharParecidos.length < 2) editCharParecidos.push('')
    editCharDescripcion = c.descripcion || ''
    editCharTipo = c.tipo || 'funcional'
    const rawProf = c.profesiones ?? []
    editCharProfesiones = [
      { id: rawProf[0]?.id ?? '', nivel: rawProf[0]?.nivel ?? 0 },
      { id: rawProf[1]?.id ?? '', nivel: rawProf[1]?.nivel ?? 0 },
    ]
    uiStore.openModal('CharEdit')
  }

  function openNewChar() {
    isNewChar = true
    editCharName = ''
    editCharClase = charClasses[0] || ''
    editCharRaza = charRaces[0] || ''
    editCharNivel = 1
    editCharFaccion = charFactions[0] || ''
    editCharReino = charRealms[0] || ''
    editCharActivo = true
    editCharPlaneado = true
    editCharWarband = ($warbandsStore.filter(w => w.nombre !== 'nada')[0]?.nombre) || ''
    editCharMisionPrincipal = ''
    editCharExpansion = ''
    editCharParecidos = ['', '']
    editCharDescripcion = ''
    editCharTipo = 'funcional'
    editCharProfesiones = [{ id: '', nivel: 0 }, { id: '', nivel: 0 }]
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
    editTaskExpansion = t.contenidoExpansion || ''
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
      prioridad: parseInt(editTaskPrioridad),
      tiempo_min: editTaskTiempo,
      cooldown: editTaskCooldown,
      recompensa: editTaskRecompensa || undefined,
      orden: editTaskOrden,
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
      prioridad: parseInt(newTaskPrioridad),
      tiempo_min: newTaskTiempo,
      cooldown: newTaskCooldown,
      recompensa: newTaskRecompensa || '',
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

  function openMissionEdit(m: Mision) {
    editMissionId = m.id
    editMissionNombre = m.nombre
    editMissionPersonaje = m.personaje || ''
    editMissionTipo = m.tipo
    editMissionExpansion = m.expansion || ''
    editMissionPrioridad = String(m.prioridad)
    editMissionTiempo = m.tiempo_min || 30
    editMissionTags = (m.tags || []).join(', ')
    uiStore.openModal('MissionEdit')
  }

  function saveMissionEdit() {
    if (!editMissionNombre.trim()) return
    dataStore.updateMision(editMissionId, {
      nombre: editMissionNombre.trim(),
      personaje: editMissionPersonaje,
      tipo: editMissionTipo,
      expansion: editMissionExpansion,
      prioridad: parseInt(editMissionPrioridad),
      tiempo_min: editMissionTiempo,
      tags: editMissionTags.split(',').map(s => s.trim()).filter(Boolean),
    })
    uiStore.closeModal()
  }

  function setEditProfesion(idx: number, id: string) {
    const arr = [
      { ...editCharProfesiones[0] },
      { ...editCharProfesiones[1] },
    ]
    const other = idx === 0 ? 1 : 0
    if (id && arr[other].id === id) arr[other] = { id: '', nivel: 0 }
    arr[idx] = { ...arr[idx], id }
    editCharProfesiones = arr
  }

  function saveCharEdit() {
    if (!editCharName.trim()) return
    if (isNewChar) {
      dataStore.addPersonaje({
        nombre: editCharName.trim(),
        clase: editCharClase,
        raza: editCharRaza,
        nivel: editCharNivel,
        faccion: editCharFaccion,
        reino: editCharReino,
        activo: editCharActivo,
        planeado_usar: editCharPlaneado,
        warband: editCharWarband,
        mision_principal: editCharMisionPrincipal || undefined,
        expansion_por_defecto: editCharExpansion || null,
        parecidos: editCharParecidos.filter(x => x.trim()).slice(0, 2),
        profesiones: editCharProfesiones,
        descripcion: editCharDescripcion,
        tipo: editCharTipo,
      })
      isNewChar = false
    } else {
      dataStore.updatePersonaje(editCharName, {
        clase: editCharClase,
        raza: editCharRaza,
        nivel: editCharNivel,
        faccion: editCharFaccion,
        reino: editCharReino,
        activo: editCharActivo,
        planeado_usar: editCharPlaneado,
        warband: editCharWarband,
        mision_principal: editCharMisionPrincipal || undefined,
        expansion_por_defecto: editCharExpansion || null,
        parecidos: editCharParecidos.filter(x => x.trim()).slice(0, 2),
        profesiones: editCharProfesiones,
        descripcion: editCharDescripcion,
        tipo: editCharTipo,
      })
    }
    uiStore.closeModal()
  }
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
    <div class="warband-layout" class:has-sidebar={hasSidebar}>
      <div class="warband-main">
        {#if $uiStore.currentView === 'warband'}
          <FilterBar />
          <WarbandView />
        {:else if $uiStore.currentView === 'tareas'}
          <TareasView {openTaskEdit} {openTaskNew} />
        {:else if $uiStore.currentView === 'tabla'}
          <TablaView {openTaskEdit} {openMissionEdit} />
        {:else if $uiStore.currentView === 'priority'}
          <PriorityView {openTaskEdit} {openMissionEdit} />
        {:else if $uiStore.currentView === 'time'}
          <TimeView {openTaskEdit} {openMissionEdit} />
        {:else if $uiStore.currentView === 'personajes'}
          <PersonajesView {openCharEdit} {openNewChar} />
        {:else if $uiStore.currentView === 'mapa'}
          <MapaView {openTaskEdit} {openMissionEdit} openNewItemForChar={(char) => { resetMissionForm(); misionPersonaje = char; uiStore.openModal('MissionNew') }} />
        {:else if $uiStore.currentView === 'fantasia'}
          <FantasiaView />
        {:else if $uiStore.currentView === 'profesion'}
          <ProfesionView />
        {/if}
      </div>
      {#if $uiStore.currentView === 'warband'}
        <aside class="detail-sidebar">
          {#if $uiStore.selectedCharacter}
            <DetailPanel {openCharEdit} {openTaskEdit} {openMissionEdit} />
          {:else if $uiStore.currentWarband}
            <AllTasksView {openTaskEdit} />
          {/if}
        </aside>
      {/if}
    </div>
  </div>
  <StatusBar />

  <!-- Modal: Nueva Misión -->
  <Dialog show={$uiStore.activeModal === 'MissionNew'} title="Nueva Misión" onclose={() => uiStore.closeModal()}>
    {#snippet children()}
      <div class="form-group">
        <label for="misionNombre">Nombre de la misión</label>
        <input id="misionNombre" type="text" bind:value={misionNombre} placeholder="Ej: Farmear Invincible" />
      </div>
      <div class="form-group">
        <label for="misionPersonaje">Personaje (opcional)</label>
        <select id="misionPersonaje" bind:value={misionPersonaje}>
          <option value="">(sin personaje)</option>
          {#each charOpts as n}
            <option value={n}>{n}</option>
          {/each}
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <div class="form-group">
          <label for="misionTipo">Tipo</label>
          <select id="misionTipo" bind:value={misionTipo}>
            <option value="mision">Misión</option>
            <option value="achievement">Logro</option>
            <option value="daily">Diaria</option>
            <option value="weekly">Semanal</option>
          </select>
        </div>
        <div class="form-group">
          <label for="misionExpansion">Expansión</label>
          <select id="misionExpansion" bind:value={misionExpansion}>
            <option value="">(ninguna)</option>
            {#each EXPANSIONS as exp}
              <option value={exp.id}>{exp.nombre}</option>
            {/each}
          </select>
        </div>
        <div class="form-group">
          <label for="misionPrioridad">Prioridad</label>
          <select id="misionPrioridad" bind:value={misionPrioridad}>
            <option value="1">P1 - Alta</option>
            <option value="2">P2 - Media</option>
            <option value="3">P3 - Baja</option>
          </select>
        </div>
        <div class="form-group">
          <label for="misionTiempo">Tiempo (min)</label>
          <input id="misionTiempo" type="number" bind:value={misionTiempo} min="0" />
        </div>
      </div>
      <div class="form-group">
        <label for="misionTags">Etiquetas (separadas por coma)</label>
        <input id="misionTags" type="text" bind:value={misionTags} placeholder="raids, mounts, weekly" />
      </div>
      <div class="modal-footer">
        <button class="wow-btn" onclick={() => uiStore.closeModal()}>Cancelar</button>
        <button class="wow-btn wow-btn-primary" onclick={() => {
          if (!misionNombre.trim()) return
          const tags = misionTags.split(',').map(s => s.trim()).filter(Boolean)
          dataStore.addMision({
            nombre: misionNombre.trim(),
            personaje: misionPersonaje,
            tipo: misionTipo,
            expansion: misionExpansion,
            tags,
            estado: 'pendiente',
            prioridad: parseInt(misionPrioridad),
            tiempo_min: misionTiempo || 0,
          })
          uiStore.closeModal()
          resetMissionForm()
        }}>Crear</button>
      </div>
    {/snippet}
  </Dialog>

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

  <!-- Modal: Import/Export -->
  <Dialog show={$uiStore.activeModal === 'ImportExport'} title="Importar / Exportar" onclose={() => uiStore.closeModal()}>
    {#snippet children()}
      <div class="form-group">
        <label>Exportar datos completos</label>
        <textarea style="width:100%;min-height:120px;font-size:0.6rem;font-family:monospace" readonly value={dataStore.exportJSON()}></textarea>
        <button class="wow-btn wow-btn-sm" style="margin-top:4px" onclick={() => {
          navigator.clipboard.writeText(dataStore.exportJSON())
        }}>Copiar</button>
      </div>
      <div class="form-group">
        <label>Exportar solo personajes (sin misiones)</label>
        <textarea style="width:100%;min-height:120px;font-size:0.6rem;font-family:monospace" readonly value={dataStore.exportPersonajesJSON()}></textarea>
        <button class="wow-btn wow-btn-sm" style="margin-top:4px" onclick={() => {
          navigator.clipboard.writeText(dataStore.exportPersonajesJSON())
        }}>Copiar</button>
      </div>
      <div class="form-group">
        <label for="importText">Importar JSON</label>
        <textarea id="importText" style="width:100%;min-height:80px;font-size:0.6rem;font-family:monospace" bind:value={importText}></textarea>
        <button class="wow-btn wow-btn-sm wow-btn-danger" style="margin-top:4px" onclick={() => {
          try {
            dataStore.importJSON(importText)
            uiStore.closeModal()
          } catch (e: any) {
            alert('Error: ' + e.message)
          }
        }}>Importar</button>
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
        {#each $warbandsStore.filter(w => w.nombre !== 'nada') as wb}
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
          {#each $warbandsStore as wb}
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
  <Dialog show={$uiStore.activeModal === 'CharEdit'} title={isNewChar ? 'Nuevo Personaje' : 'Editar Personaje'} onclose={() => { isNewChar = false; uiStore.closeModal() }}>
    {#snippet children()}
      <div class="form-group">
        <label>Nombre</label>
        <input type="text" bind:value={editCharName} disabled={!isNewChar} style={isNewChar ? '' : 'opacity:0.6'} />
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
            {#each $warbandsStore.filter(w => w.nombre !== 'nada') as wb}
              <option value={wb.nombre}>{wb.nombre}</option>
            {/each}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Misión Principal</label>
        <input type="text" bind:value={editCharMisionPrincipal} placeholder="Ej: Campaña TWW Cap.4" />
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
              <input
                type="number"
                min="0"
                placeholder="Nivel"
                value={editCharProfesiones[idx]?.nivel ?? 0}
                disabled={!editCharProfesiones[idx]?.id}
                oninput={(e) => {
                  const v = parseInt((e.target as HTMLInputElement).value) || 0
                  editCharProfesiones = editCharProfesiones.map((s, i) => i === idx ? { ...s, nivel: v } : s)
                }}
              />
            </div>
          {/each}
        </div>
      </div>
      <div class="form-group">
        <label>Tipo de personaje</label>
        <select bind:value={editCharTipo}>
          <option value="funcional">Funcional</option>
          <option value="iconico">Icónico</option>
        </select>
      </div>
      <label style="display:flex;align-items:center;gap:6px;font-size:0.75rem;margin-top:4px">
        <input type="checkbox" bind:checked={editCharActivo} />
        Activo
      </label>
      <label style="display:flex;align-items:center;gap:6px;font-size:0.75rem;margin-top:4px">
        <input type="checkbox" bind:checked={editCharPlaneado} />
        Planeado usar
      </label>
      <div class="modal-footer">
        <button class="wow-btn" onclick={() => uiStore.closeModal()}>Cancelar</button>
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
            <input id="editTaskNombre" type="text" bind:value={editTaskNombre} style="margin-top:6px;width:100%" />
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
            <input id="newTaskNombre" type="text" bind:value={newTaskNombre} placeholder="Ej: Weekly Zereth Mortis" style="margin-top:6px;width:100%" />
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
      </div>
      <div class="modal-footer">
        <button class="wow-btn" onclick={() => uiStore.closeModal()}>Cancelar</button>
        <button class="wow-btn wow-btn-primary" onclick={saveTaskNew}>Asignar</button>
      </div>
    {/snippet}
  </Dialog>

  <!-- Modal: Editar Misión -->
  <Dialog show={$uiStore.activeModal === 'MissionEdit'} title="Editar Misión" onclose={() => uiStore.closeModal()}>
    {#snippet children()}
      <div class="form-group">
        <label>Nombre</label>
        <input type="text" bind:value={editMissionNombre} />
      </div>
      <div class="form-group">
        <label>Personaje (opcional)</label>
        <select bind:value={editMissionPersonaje}>
          <option value="">(sin personaje)</option>
          {#each charOpts as n}
            <option value={n}>{n}</option>
          {/each}
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <div class="form-group">
          <label>Tipo</label>
          <select bind:value={editMissionTipo}>
            <option value="mision">Misión</option>
            <option value="achievement">Logro</option>
            <option value="daily">Diaria</option>
            <option value="weekly">Semanal</option>
          </select>
        </div>
        <div class="form-group">
          <label>Expansión</label>
          <select bind:value={editMissionExpansion}>
            <option value="">(ninguna)</option>
            {#each EXPANSIONS as exp}
              <option value={exp.id}>{exp.nombre}</option>
            {/each}
          </select>
        </div>
        <div class="form-group">
          <label>Prioridad</label>
          <select bind:value={editMissionPrioridad}>
            <option value="1">P1 - Alta</option>
            <option value="2">P2 - Media</option>
            <option value="3">P3 - Baja</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tiempo (min)</label>
          <input type="number" bind:value={editMissionTiempo} min="0" />
        </div>
      </div>
      <div class="form-group">
        <label>Etiquetas (separadas por coma)</label>
        <input type="text" bind:value={editMissionTags} placeholder="raids, mounts, weekly" />
      </div>
      <div class="modal-footer">
        <button class="wow-btn" onclick={() => uiStore.closeModal()}>Cancelar</button>
        <button class="wow-btn wow-btn-primary" onclick={saveMissionEdit}>Guardar</button>
      </div>
    {/snippet}
  </Dialog>
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
  .warband-layout.has-sidebar {
    grid-template-columns: 1fr 1fr;
  }
  .detail-sidebar {
    overflow-y: auto;
  }
  .detail-sidebar:empty { display: none; }
  .warband-main { min-width: 0; }
</style>
