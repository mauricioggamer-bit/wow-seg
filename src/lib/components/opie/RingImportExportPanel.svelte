<script lang="ts">
  import { dataStore, opieRingsStore } from '../../stores/data'
  import { uiStore } from '../../stores/ui'
  import { decodeRingString, splitInputStrings } from '../../opie/mapper'
  import type { OpieRing } from '../../opie/types'

  interface DecodedEntry {
    raw: string
    ring?: OpieRing
    error?: string
    imported?: boolean
  }

  let open = $state(true)
  let pasteText = $state('')
  let decoded = $state<DecodedEntry[]>([])
  let idCounter = 0

  function newId(): string {
    idCounter += 1
    return `opie-${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 6)}`
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
    decoded = chunks.map((raw): DecodedEntry => {
      const result = decodeRingString(raw, newId)
      if ('error' in result) return { raw, error: result.error }
      return { raw, ring: result.ring }
    })
    const ok = decoded.filter(d => d.ring).length
    uiStore.setStatus(`${ok} anillo(s) decodificado(s) correctamente${decoded.length - ok ? `, ${decoded.length - ok} con error.` : '.'}`, ok === decoded.length ? 'ok' : 'error')
  }

  function existingByName(name: string) {
    return $opieRingsStore.find(r => r.name === name)
  }

  function importAsNew(entry: DecodedEntry) {
    if (!entry.ring) return
    dataStore.addOpieRing({ ...entry.ring, id: undefined })
    entry.imported = true
    decoded = [...decoded]
    uiStore.setStatus(`"${entry.ring.name}" importado como anillo nuevo.`, 'ok')
  }

  function overwrite(entry: DecodedEntry) {
    if (!entry.ring) return
    const existing = existingByName(entry.ring.name)
    if (!existing) return
    dataStore.updateOpieRing(existing.id, { ...entry.ring, id: existing.id })
    entry.imported = true
    decoded = [...decoded]
    uiStore.setStatus(`"${entry.ring.name}" sobrescrito.`, 'ok')
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
                {@const existing = existingByName(entry.ring.name)}
                <span class="ie-name">{entry.ring.name}</span>
                <span class="ie-meta">{entry.ring.slices.length} slice(s)</span>
                {#if entry.imported}
                  <span class="ie-ok">✓ importado</span>
                {:else if existing}
                  <button class="wow-btn wow-btn-sm wow-btn-danger" onclick={() => overwrite(entry)}>Sobrescribir "{existing.name}"</button>
                  <button class="wow-btn wow-btn-sm" onclick={() => importAsNew(entry)}>Importar como nuevo</button>
                {:else}
                  <button class="wow-btn wow-btn-sm wow-btn-primary" onclick={() => importAsNew(entry)}>Importar</button>
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
