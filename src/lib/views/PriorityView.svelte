<script lang="ts">
  import TaskGroupView from './TaskGroupView.svelte'

  let { openTaskEdit, openMissionEdit }: { openTaskEdit?: (char: string, taskId: string) => void, openMissionEdit?: (m: any) => void } = $props()
</script>

<TaskGroupView
  filterType="prioridad"
  filterOptions={[
    { key: '1', label: 'P1' },
    { key: '2', label: 'P2' },
    { key: '3', label: 'P3' },
  ]}
  {openTaskEdit}
  {openMissionEdit}
/>
