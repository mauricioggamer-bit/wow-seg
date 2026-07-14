<script lang="ts">
  import { dataStore, opieRingsStore } from '../../stores/data'
  import { uiStore } from '../../stores/ui'
  import { decodeRingString, splitInputStrings } from '../../opie/mapper'
  import type { OpieRing } from '../../opie/types'

  interface SavedRing {
    ring: OpieRing
    savedAs: 'created' | 'overwritten'
  }

  interface DecodedEntry {
    raw: string
    rings?: SavedRing[]
    error?: string
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

      // A single string can bundle more than one named ring (OPie's
      // "share ring" nests referenced rings inline) — save every one of
      // them, not just the root.
      const saved: SavedRing[] = result.rings.map((ring) => {
        const existing = existingByName(ring.name)
        if (existing) {
          dataStore.updateOpieRing(existing.id, { ...ring, id: existing.id })
          lastSavedId = existing.id
          overwritten += 1
          return { ring, savedAs: 'overwritten' as const }
        }
        const id = dataStore.addOpieRing({ ...ring, id: undefined })
        lastSavedId = id
        created += 1
        return { ring, savedAs: 'created' as const }
      })
      return { raw, rings: saved }
    })

    const failed = decoded.filter((d) => d.error).length
    const parts = []
    if (created) parts.push(`${created} anillo(s) creado(s)`)
    if (overwritten) parts.push(`${overwritten} sobrescrito(s)`)
    if (failed) parts.push(`${failed} string(s) con error`)
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
            {#if entry.error}
              <div class="ie-entry">
                <span class="ie-err">✗ {entry.error}</span>
              </div>
            {:else if entry.rings}
              {#each entry.rings as saved, j (j)}
                <div class="ie-entry">
                  <span class="ie-name">{saved.ring.name}</span>
                  <span class="ie-meta">{saved.ring.slices.length} slice(s)</span>
                  {#if saved.savedAs === 'overwritten'}
                    <span class="ie-ok">✓ sobrescrito</span>
                  {:else}
                    <span class="ie-ok">✓ creado</span>
                  {/if}
                </div>
              {/each}
            {/if}
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
