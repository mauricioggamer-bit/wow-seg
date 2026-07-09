<script lang="ts">
  import TaskGroupView from './TaskGroupView.svelte'

  let { openTaskEdit }: { openTaskEdit?: (char: string, taskId: string) => void } = $props()
</script>

<TaskGroupView
  filterType="tiempo"
  filterOptions={[
    { key: 'rapido', label: '🟢 Rápido' },
    { key: 'medio', label: '🟡 Medio' },
    { key: 'largo', label: '🟠 Largo' },
    { key: 'marathon', label: '🔴 Marathon' },
  ]}
  {openTaskEdit}
/>
