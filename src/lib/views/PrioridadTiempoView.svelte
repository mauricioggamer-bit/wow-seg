<script lang="ts">
  import TaskGroupView from './TaskGroupView.svelte'
  import { getSessionPref, setSessionPref } from '../stores/sessionPrefs'

  let { openTaskEdit }: { openTaskEdit?: (char: string, taskId: string) => void } = $props()

  let showNoTasks = $state(getSessionPref('listado_sinTareas'))
  $effect(() => { setSessionPref('listado_sinTareas', showNoTasks) })

  let showInactive = $state(getSessionPref('listado_noActivos'))
  $effect(() => { setSessionPref('listado_noActivos', showInactive) })

  let levelFilter = $state('')
</script>

<div class="listado-filters">
  <label class="listado-filter-label">
    <input type="checkbox" bind:checked={showNoTasks} /> Sin tareas
  </label>
  <label class="listado-filter-label">
    <input type="checkbox" bind:checked={showInactive} /> No activos
  </label>
  <label class="listado-filter-label">
    Nivel: <input type="number" min="1" max="80" bind:value={levelFilter} class="listado-level-input" placeholder="—" />
  </label>
</div>

<div class="split-task-view">
  <div class="split-task-panel">
    <TaskGroupView
      filterType="prioridad"
      filterOptions={[
        { key: '1', label: 'P1' },
        { key: '2', label: 'P2' },
        { key: '3', label: 'P3' },
      ]}
      panel={true}
      {openTaskEdit}
      {showNoTasks}
      {showInactive}
      {levelFilter}
    />
  </div>
  <div class="split-task-panel">
    <TaskGroupView
      filterType="tiempo"
      filterOptions={[
        { key: 'rapido', label: '🟢 Rápido' },
        { key: 'medio', label: '🟡 Medio' },
        { key: 'largo', label: '🟠 Largo' },
        { key: 'marathon', label: '🔴 Marathon' },
      ]}
      panel={true}
      {openTaskEdit}
      {showNoTasks}
      {showInactive}
      {levelFilter}
    />
  </div>
</div>

<style>
  .listado-filters {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 6px 8px;
    margin-bottom: 4px;
    background: var(--bg-card);
    border-radius: 6px;
    flex-wrap: wrap;
  }
  .listado-filter-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.6rem;
    cursor: pointer;
    user-select: none;
  }
  .listado-filter-label input[type="checkbox"] {
    width: 14px;
    height: 14px;
  }
  .listado-level-input {
    width: 48px;
    padding: 2px 4px;
    font-size: 0.6rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--bg-input);
    color: var(--text);
  }
  .split-task-view {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .split-task-panel {
    min-width: 0;
    overflow-y: auto;
  }
</style>
