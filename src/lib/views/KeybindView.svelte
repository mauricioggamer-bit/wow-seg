<script lang="ts">
  import { dataStore } from '../stores/data'
  import { uiStore } from '../stores/ui'
  import { getKeybindString, getDefaultKeybindString, findSpecInfo } from '../data/keybindDefaults'
  import { parseKeybindString } from '../keybinds/parser'
  import { encodeKeybindString } from '../keybinds/encoder'
  import type { KeybindState } from '../keybinds/types'
  import ClassSpecSelector from '../components/keybinds/ClassSpecSelector.svelte'
  import KeyboardVisualizer from '../components/keybinds/KeyboardVisualizer.svelte'

  let selectedClass = $state('shaman')
  let selectedSpec = $state(262)
  let spellData = $state<Record<number, { name: string; iconUrl: string }>>({})

  let currentString = $derived(dataStore.getKeybind(selectedClass, selectedSpec))
  let defaultString = $derived(getDefaultKeybindString(selectedClass, selectedSpec))
  let parsed = $derived<KeybindState>(parseKeybindString(currentString))
  let isEdited = $derived(dataStore.isKeybindEdited(selectedClass, selectedSpec))
  let specInfo = $derived(findSpecInfo(selectedClass, selectedSpec))

  let outputString = $derived(encodeKeybindString(parsed))

  function resetToDefault() {
    dataStore.resetKeybind(selectedClass, selectedSpec)
  }

  function copyOutput() {
    navigator.clipboard.writeText(outputString)
    uiStore.setStatus('Keybind copiado al portapapeles', 'ok')
  }

  function onSelectKeybind(kb: string) {
    // Fase 3: abrir editor
    console.log('Selected keybind:', kb)
  }
</script>

<div class="kb-view">
  <div class="kb-toolbar">
    <ClassSpecSelector bind:selectedClass bind:selectedSpec />
    <div class="kb-toolbar-actions">
      {#if isEdited}
        <span class="kb-edited-badge">Editado</span>
        <button class="wow-btn wow-btn-sm" onclick={resetToDefault}>Reset</button>
      {/if}
      <button class="wow-btn wow-btn-sm wow-btn-primary" onclick={copyOutput}>Copiar Base64</button>
    </div>
  </div>

  <div class="kb-info">
    <span>{parsed.header?.className ?? selectedClass} — {specInfo?.name ?? ''} (spec {selectedSpec})</span>
    <span class="kb-info-meta">{Object.values(parsed.slots).filter(s => s.type !== 'empty' && s.type !== 'emptyBind').length} slots asignados</span>
  </div>

  <KeyboardVisualizer {parsed} {spellData} onSelect={onSelectKeybind} />

  <div class="kb-output">
    <label>Base64 output</label>
    <textarea readonly value={outputString} rows="3" style="width:100%;font-size:0.5rem;font-family:monospace;background:var(--input-bg);border:1px solid var(--border-subtle);border-radius:var(--r-sm);padding:4px 6px;color:var(--text-secondary);resize:vertical"></textarea>
  </div>
</div>

<style>
  .kb-view {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 4px 0;
  }
  .kb-toolbar {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .kb-toolbar-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .kb-edited-badge {
    font-size: 0.55rem;
    color: var(--gold);
    font-family: var(--font-heading);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .kb-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: var(--text-muted);
    padding: 2px 0;
    border-bottom: 1px solid var(--border-subtle);
  }
  .kb-info-meta {
    color: var(--text-dim);
  }
  .kb-output label {
    font-size: 0.6rem;
    color: var(--text-muted);
    display: block;
    margin-bottom: 2px;
  }
</style>
