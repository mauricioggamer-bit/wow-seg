<script lang="ts">
  import { dataStore, personajesStore } from '../stores/data'
  import { currentWarband } from '../stores/ui'
  import { clsClass, PERS_CLASS_COLORS, CLASS_MAP } from '../constants'
  import type { AccountTask, AccountTaskStatus } from '../types'

  let { onRequestLuegoMotivo, onRequestPasaMotivo }: {
    onRequestLuegoMotivo?: (taskId: string, charName: string) => void
    onRequestPasaMotivo?: (taskId: string, charName: string) => void
  } = $props()

  let newTaskName = $state('')
  let editingId = $state<string | null>(null)
  let editName = $state('')

  let activeWarband = $derived($currentWarband && $currentWarband !== '' ? $currentWarband : null)

  let scoped = $derived(
    activeWarband ? $personajesStore.filter(c => c.warband === activeWarband) : $personajesStore
  )

  let sorted = $derived(
    [...scoped].sort((a, b) => a.nombre.localeCompare(b.nombre))
  )

  let tasks = $derived(
    [...(dataStore.getAccountTasks())].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
  )

  function getEntry(task: AccountTask, charName: string): AccountTaskStatus {
    const e = task.entries.find(e => e.nombrePersonaje === charName)
    return e?.estado ?? 'incompleto'
  }

  function getMotivo(task: AccountTask, charName: string): string | undefined {
    const e = task.entries.find(e => e.nombrePersonaje === charName)
    return e?.motivo
  }

  function addTask() {
    const name = newTaskName.trim()
    if (!name) return
    dataStore.addAccountTask(name)
    newTaskName = ''
  }

  function startEdit(id: string, currentName: string) {
    editingId = id
    editName = currentName
  }

  function saveEdit(id: string) {
    const name = editName.trim()
    if (name) dataStore.renameAccountTask(id, name)
    editingId = null
  }

  function deleteTask(id: string, nombre: string) {
    if (confirm(`¿Eliminar tarea "${nombre}"?`)) {
      dataStore.deleteAccountTask(id)
    }
  }

  function cycleStatus(taskId: string, charName: string, current: AccountTaskStatus) {
    switch (current) {
      case 'incompleto':
        dataStore.setAccountTaskStatus(taskId, charName, 'completo')
        break
      case 'completo':
        onRequestLuegoMotivo?.(taskId, charName)
        break
      case 'luego':
        onRequestPasaMotivo?.(taskId, charName)
        break
      case 'pasa':
        dataStore.setAccountTaskStatus(taskId, charName, 'incompleto')
        break
    }
  }

  const STATUS_LABELS: Record<AccountTaskStatus, string> = {
    incompleto: 'Incompleto',
    completo: 'Completado',
    luego: 'Luego',
    pasa: 'Pasa',
  }

  const STATUS_ICONS: Record<AccountTaskStatus, string> = {
    incompleto: '◻',
    completo: '✓',
    luego: '🕐',
    pasa: '✗',
  }

  const STATUS_CLASSES: Record<AccountTaskStatus, string> = {
    incompleto: 'st-incompleto',
    completo: 'st-completo',
    luego: 'st-luego',
    pasa: 'st-pasa',
  }
</script>

<div class="at-view">
  <div class="at-header">
    <span class="at-title">📋 Tareas de cuenta {activeWarband ? `(${activeWarband})` : '(Todas)'} · {tasks.length}</span>
    <div class="at-add-row">
      <input type="text" class="at-input" bind:value={newTaskName} placeholder="Nueva tarea de cuenta..."
        onkeydown={(e) => e.key === 'Enter' && addTask()} />
      <button class="wow-btn wow-btn-sm wow-btn-primary" onclick={addTask} disabled={!newTaskName.trim()}>+ Añadir</button>
    </div>
  </div>

  <div class="at-table-wrap">
    <table class="at-table">
      <thead>
        <tr>
          <th class="at-th at-th-task">Tarea</th>
          {#each sorted as c}
            {@const clsKey = CLASS_MAP[c.clase] || 'warrior'}
            {@const color = PERS_CLASS_COLORS[clsKey] || '#c9a84c'}
            <th class="at-th at-th-char" style="color:{color}">{c.nombre}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each tasks as task (task.id)}
          <tr>
            <td class="at-td at-td-task">
              {#if editingId === task.id}
                <input type="text" class="at-edit-input" bind:value={editName}
                  onkeydown={(e) => { if (e.key === 'Enter') saveEdit(task.id); if (e.key === 'Escape') editingId = null }}
                  onblur={() => saveEdit(task.id)} />
              {:else}
                <span class="at-task-name">{task.nombre}</span>
                <div class="at-task-actions">
                  <button class="at-btn-icon" title="Renombrar" onclick={() => startEdit(task.id, task.nombre)}>✏️</button>
                  <button class="at-btn-icon" title="Eliminar" onclick={() => deleteTask(task.id, task.nombre)}>🗑️</button>
                </div>
              {/if}
            </td>
            {#each sorted as c}
              {@const status = getEntry(task, c.nombre)}
              {@const motivo = getMotivo(task, c.nombre)}
              <td class="at-td at-td-cell"
                title="{c.nombre}: {STATUS_LABELS[status]}{motivo ? ` — ${motivo}` : ''}"
                onclick={() => cycleStatus(task.id, c.nombre, status)}>
                <span class="at-status {STATUS_CLASSES[status]}">{STATUS_ICONS[status]}</span>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
    {#if tasks.length === 0}
      <div class="at-empty">No hay tareas de cuenta. Añade una arriba.</div>
    {/if}
  </div>
</div>

<style>
  .at-view {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 100px);
    margin-top: 6px;
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-md);
    overflow: hidden;
    background: var(--bg-base);
  }
  .at-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
  }
  .at-title {
    font-size: 0.6rem;
    color: var(--gold-light);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .at-add-row {
    display: flex;
    gap: 4px;
    flex: 1;
    max-width: 400px;
  }
  .at-input {
    flex: 1;
    background: var(--input-bg);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 3px 8px;
    color: var(--text-primary);
    font-size: 0.5rem;
    font-family: var(--font-body);
  }
  .at-input:focus {
    outline: none;
    border-color: var(--gold-dim);
  }
  .at-input::placeholder { color: var(--text-dim); }
  .at-table-wrap {
    overflow: auto;
    flex: 1;
  }
  .at-table {
    border-collapse: collapse;
    width: max-content;
    min-width: 100%;
    font-size: 0.5rem;
  }
  .at-th {
    position: sticky;
    top: 0;
    background: var(--bg-panel, #1a1a1a);
    padding: 4px 6px;
    border-bottom: 1px solid var(--border-subtle);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 0.48rem;
    white-space: nowrap;
    z-index: 1;
  }
  .at-th-task {
    text-align: left;
    min-width: 180px;
    left: 0;
    z-index: 2;
  }
  .at-th-char {
    text-align: center;
    min-width: 70px;
  }
  .at-td {
    padding: 3px 6px;
    border-bottom: 1px solid var(--border-subtle);
    vertical-align: middle;
  }
  .at-td-task {
    position: sticky;
    left: 0;
    background: var(--bg-base);
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .at-td-cell {
    text-align: center;
    cursor: pointer;
    transition: background var(--t-fast);
  }
  .at-td-cell:hover {
    background: var(--bg-raised);
  }
  .at-task-name {
    flex: 1;
    font-size: 0.5rem;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .at-task-actions {
    display: flex;
    gap: 1px;
    flex-shrink: 0;
  }
  .at-btn-icon {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.45rem;
    padding: 0 2px;
    opacity: 0.5;
    transition: opacity var(--t-fast);
  }
  .at-btn-icon:hover { opacity: 1; }
  .at-edit-input {
    width: 100%;
    background: var(--input-bg);
    border: 1px solid var(--gold-dim);
    border-radius: var(--r-sm);
    padding: 2px 6px;
    color: var(--text-primary);
    font-size: 0.5rem;
    font-family: var(--font-body);
  }
  .at-edit-input:focus { outline: none; border-color: var(--gold); }
  .at-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: var(--r-sm);
    font-size: 0.55rem;
    transition: all var(--t-fast);
  }
  .at-status.st-completo { background: rgba(76, 175, 80, 0.15); color: #4caf50; }
  .at-status.st-luego { background: rgba(255, 193, 7, 0.15); color: #ffc107; }
  .at-status.st-pasa { background: rgba(244, 67, 54, 0.15); color: #f44336; }
  .at-status.st-incompleto { background: transparent; color: var(--text-dim); opacity: 0.4; }
  .at-td-cell:hover .at-status.st-incompleto { opacity: 0.8; }
  .at-empty {
    padding: 20px;
    text-align: center;
    color: var(--text-dim);
    font-size: 0.5rem;
    font-style: italic;
  }
</style>
