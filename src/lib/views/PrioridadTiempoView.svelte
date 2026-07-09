<script lang="ts">
  import TaskGroupView from './TaskGroupView.svelte'

  let { openTaskEdit }: { openTaskEdit?: (char: string, taskId: string) => void } = $props()
</script>

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
    />
  </div>
</div>

<style>
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
