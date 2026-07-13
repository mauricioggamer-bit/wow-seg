<script lang="ts">
  import { dataStore, opieRingsStore } from '../../stores/data'
  import { uiStore } from '../../stores/ui'
  import { decodeRingString, splitInputStrings } from '../../opie/mapper'
  import type { OpieRing } from '../../opie/types'

  interface DecodedEntry {
    raw: string
    ring?: OpieRing
    error?: string
    savedAs?: 'created' | 'overwritten'
  }

  let { onImported }: { onImported?: (id: string) => void } = $props()

  let open = $state(true)
  let pasteText = $state('')
  let decoded = $state<DecodedEntry[]>([])
  let idCounter = 0

  function newId(): string {
    idCounter += 1
    return `opie-${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 6)}`
  }

  function existingByName(name: string) {
    return $opieRingsStore.find(r => r.name === name)
  }

  function decode() {
    if (!pasteText.trim()) {
      uiStore.setStatus('Pegá al menos un string para decodificar.', 'error')
      return
    }
    const chunks = splitInputStrings(pasteText)
    if (!chunks.length) {
      uiStore.setStatus('No se encontró ningún string oetohH7 en el texto pegado.', 'error')
      return
    }

    let lastSavedId: string | null = null
    let created = 0
    let overwritten = 0

    decoded = chunks.map((raw): DecodedEntry => {
      const result = decodeRingString(raw, newId)
      if ('error' in result) return { raw, error: result.error }

      const existing = existingByName(result.ring.name)
      if (existing) {
        dataStore.updateOpieRing(existing.id, { ...result.ring, id: existing.id })
        lastSavedId = existing.id
        overwritten += 1
        return { raw, ring: result.ring, savedAs: 'overwritten' }
      }
      const id = dataStore.addOpieRing({ ...result.ring, id: undefined })
      lastSavedId = id
      created += 1
      return { raw, ring: result.ring, savedAs: 'created' }
    })

    const failed = decoded.length - created - overwritten
    const parts = []
    if (created) parts.push(`${created} creado(s)`)
    if (overwritten) parts.push(`${overwritten} sobrescrito(s)`)
    if (failed) parts.push(`${failed} con error`)
    uiStore.setStatus(parts.join(', ') + '.', failed ? 'error' : 'ok')

    if (lastSavedId) onImported?.(lastSavedId)
  }

  function clear() {
    pasteText = ''
    decoded = []
  }
</script>

<div class="ie-panel wow-panel">
  <div class="wow-panel-header">
    <h3>Importar / Exportar (string OPie)</h3>
    <button class="wow-btn wow-btn-sm" onclick={() => (open = !open)}>{open ? 'Contraer' : 'Expandir'}</button>
  </div>
  {#if open}
    <div class="wow-panel-body ie-body">
      <p class="ie-hint">
        Pegá uno o varios strings <code>oetohH7…</code> (los que genera "Compartir anillo" en el addon, o los que
        genera esta misma vista) para traerlos acá. También podés pegar varios strings juntos.
      </p>
      <textarea class="ie-textarea" rows="4" placeholder="oetohH7 ..." bind:value={pasteText}></textarea>
      <div class="ie-row">
        <button class="wow-btn wow-btn-sm wow-btn-primary" onclick={decode}>Decodificar</button>
        <button class="wow-btn wow-btn-sm" onclick={clear}>Limpiar</button>
      </div>

      {#if decoded.length}
        <div class="ie-results">
          {#each decoded as entry, i (i)}
            <div class="ie-entry">
              {#if entry.error}
                <span class="ie-err">✗ {entry.error}</span>
              {:else if entry.ring}
                <span class="ie-name">{entry.ring.name}</span>
                <span class="ie-meta">{entry.ring.slices.length} slice(s)</span>
                {#if entry.savedAs === 'overwritten'}
                  <span class="ie-ok">✓ sobrescrito</span>
                {:else}
                  <span class="ie-ok">✓ creado</span>
                {/if}
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .ie-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ie-hint {
    font-size: 0.6rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.4;
  }
  .ie-hint code {
    color: var(--gold-light);
  }
  .ie-textarea {
    width: 100%;
    font-family: monospace;
    font-size: 0.6rem;
    background: var(--input-bg);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 6px;
    color: var(--text-primary);
    resize: vertical;
  }
  .ie-row {
    display: flex;
    gap: 6px;
  }
  .ie-results {
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-top: 1px solid var(--border-subtle);
    padding-top: 6px;
  }
  .ie-entry {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 0.65rem;
    padding: 3px 0;
  }
  .ie-name {
    color: var(--gold-light);
    font-weight: 600;
  }
  .ie-meta {
    color: var(--text-dim);
    font-size: 0.55rem;
  }
  .ie-ok {
    color: var(--ok, #6f9b5c);
  }
  .ie-err {
    color: var(--horde, #c5365a);
  }
</style>
