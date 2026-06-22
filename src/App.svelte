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
  import TablaView from './lib/views/TablaView.svelte'
  import PriorityView from './lib/views/PriorityView.svelte'
  import TimeView from './lib/views/TimeView.svelte'
  import PersonajesView from './lib/views/PersonajesView.svelte'
  import MapaView from './lib/views/MapaView.svelte'
  import FantasiaView from './lib/views/FantasiaView.svelte'
  import { authStore } from './lib/stores/auth'
  import { uiStore } from './lib/stores/ui'
  import { dataStore, personajesStore, misionesStore, warbandsStore } from './lib/stores/data'
  import { gistStore } from './lib/stores/gist'
  import { EXPANSIONS } from './lib/constants'
  import type { Tarea, Mision } from './lib/types'

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
  let editCharWarband = $state('')
  let editCharMisionPrincipal = $state('')
  let editCharExpansion = $state('')
  let editCharParecido = $state('')

  let editTaskChar = $state('')
  let editTaskId = $state('')
  let editTaskNombre = $state('')
  let editTaskPrioridad = $state('2')
  let editTaskTiempo = $state(15)
  let editTaskCooldown = $state('none')
  let editTaskRecompensa = $state('')
  let editTaskOrden = $state(0)

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
  let charRaces = $derived([...new Set($personajesStore.map(c => c.raza))].sort())
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
    editCharWarband = c.warband
    editCharMisionPrincipal = c.mision_principal || ''
    editCharExpansion = c.expansion_por_defecto || ''
    editCharParecido = c.parecido || ''
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
    editCharWarband = ($warbandsStore.filter(w => w.nombre !== 'nada')[0]?.nombre) || ''
    editCharMisionPrincipal = ''
    editCharExpansion = ''
    editCharParecido = ''
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
    editTaskPrioridad = String(t.prioridad)
    editTaskTiempo = t.tiempo_min
    editTaskCooldown = t.cooldown
    editTaskRecompensa = t.recompensa || ''
    editTaskOrden = t.orden ?? 0
    uiStore.openModal('TaskEdit')
  }

  function saveTaskEdit() {
    if (!editTaskNombre.trim()) return
    dataStore.updateTarea(editTaskChar, editTaskId, {
      nombre: editTaskNombre.trim(),
      prioridad: parseInt(editTaskPrioridad),
      tiempo_min: editTaskTiempo,
      cooldown: editTaskCooldown,
      recompensa: editTaskRecompensa || undefined,
      orden: editTaskOrden,
    })
    uiStore.closeModal()
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
        warband: editCharWarband,
        mision_principal: editCharMisionPrincipal || undefined,
        expansion_por_defecto: editCharExpansion || null,
        parecido: editCharParecido || null,
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
        warband: editCharWarband,
        mision_principal: editCharMisionPrincipal || undefined,
        expansion_por_defecto: editCharExpansion || null,
        parecido: editCharParecido || null,
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
        <label>Se parece a (personaje del lore)</label>
        <input type="text" bind:value={editCharParecido} placeholder="Ej: Thrall, Jaina, Illidan..." />
      </div>
      <label style="display:flex;align-items:center;gap:6px;font-size:0.75rem;margin-top:4px">
        <input type="checkbox" bind:checked={editCharActivo} />
        Activo
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
        <label for="editTaskNombre">Nombre</label>
        <input id="editTaskNombre" type="text" bind:value={editTaskNombre} />
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
