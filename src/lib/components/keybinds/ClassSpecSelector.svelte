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

  function selectClass(name: string) {
    selectedClass = name
    const firstSpec = classes.find(c => c.name === name)?.specs[0]
    if (firstSpec) selectedSpec = firstSpec.id
  }

  function selectSpec(id: number) {
    selectedSpec = id
  }
</script>

<div class="kb-class-selector">
  <div class="kb-btn-row">
    {#each classes as c}
      <button
        class="wow-btn wow-btn-sm"
        class:wow-btn-primary={selectedClass === c.name}
        onclick={() => selectClass(c.name)}
      >{c.displayName}</button>
    {/each}
  </div>
  <div class="kb-btn-row">
    {#each editedSpecs as s}
      <button
        class="wow-btn wow-btn-sm"
        class:wow-btn-primary={selectedSpec === s.id}
        onclick={() => selectSpec(s.id)}
      >{s.name}{s.edited ? ' *' : ''}</button>
    {/each}
  </div>
</div>

<style>
  .kb-class-selector {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .kb-btn-row {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
  }
</style>
