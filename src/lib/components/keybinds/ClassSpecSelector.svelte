<script lang="ts">
  import { KEYBIND_CLASSES } from '../../data/keybindDefaults'
  import { dataStore } from '../../stores/data'

  let {
    selectedClass = $bindable('shaman'),
    selectedSpec = $bindable(262),
  }: {
    selectedClass: string
    selectedSpec: number
  } = $props()

  let classes = $derived(KEYBIND_CLASSES)
  let currentClassInfo = $derived(classes.find(c => c.name === selectedClass))
  let specs = $derived(currentClassInfo?.specs ?? [])
  let editedSpecs = $derived(
    specs.map(s => ({
      ...s,
      edited: dataStore.isKeybindEdited(selectedClass, s.id),
    }))
  )

  function onClassChange(e: Event) {
    selectedClass = (e.target as HTMLSelectElement).value
    const firstSpec = classes.find(c => c.name === selectedClass)?.specs[0]
    if (firstSpec) selectedSpec = firstSpec.id
  }

  function onSpecChange(e: Event) {
    selectedSpec = parseInt((e.target as HTMLSelectElement).value)
  }
</script>

<div class="kb-selector">
  <div class="form-group" style="margin:0">
    <label>Clase</label>
    <select value={selectedClass} onchange={onClassChange}>
      {#each classes as c}
        <option value={c.name}>{c.displayName}</option>
      {/each}
    </select>
  </div>
  <div class="form-group" style="margin:0">
    <label>Spec</label>
    <select value={String(selectedSpec)} onchange={onSpecChange}>
      {#each editedSpecs as s}
        <option value={String(s.id)}>{s.name}{s.edited ? ' *' : ''}</option>
      {/each}
    </select>
  </div>
</div>
