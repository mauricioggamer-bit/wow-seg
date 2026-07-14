<script lang="ts">
  import { dataStore, opieRingsStore } from '../../stores/data'
  import { uiStore } from '../../stores/ui'
  import { encodeRing } from '../../opie/mapper'
  import { getSpellInfo } from '../../keybinds/spellService'
  import { getItemInfo } from '../../opie/itemService'
  import type { SpellInfo } from '../../keybinds/types'
  import type { OpieSlice, SliceActionType } from '../../opie/types'
  import SpellPickerModal from './SpellPickerModal.svelte'

  let { ringId, onNavigateToRing }: { ringId: string; onNavigateToRing?: (id: string) => void } = $props()

  let ring = $derived($opieRingsStore.find(r => r.id === ringId))
  let allRingNames = $derived($opieRingsStore.filter(r => r.id !== ringId).map(r => r.name))

  const SLICE_TYPES: { value: SliceActionType; label: string }[] = [
    { value: '', label: '(vacío)' },
    { value: 'spell', label: 'Hechizo' },
    { value: 'item', label: 'Objeto' },
    { value: 'macro', label: 'Macro' },
    { value: 'toy', label: 'Juguete' },
    { value: 'mount', label: 'Montura' },
    { value: 'ring', label: 'Anillo anidado' },
    { value: 'extrabutton', label: 'Botón extra' },
    { value: 'opie.databroker.launcher', label: 'Databroker' },
    { value: 'imptext', label: 'Texto de macro' },
    { value: 'quest', label: 'Misión' },
    { value: 'specset', label: 'Especialización' },
    { value: 'raidmark', label: 'Marcador de objetivo' },
    { value: 'worldmark', label: 'Marcador de mundo' },
  ]

  const SPELL_LIKE = new Set(['spell', 'mount', 'toy'])
  const TEXT_LIKE = new Set(['macro', 'imptext'])
  // toys share WoW's item namespace (not the spell namespace), so their
  // name/icon come from itemService, not spellService — see itemService.ts.
  const PREVIEW_RESOLVER: Record<string, (id: number) => SpellInfo> = {
    spell: getSpellInfo,
    mount: getSpellInfo,
    toy: getItemInfo,
    item: getItemInfo,
  }

  let pickerForSlice = $state<number | null>(null)
  let showJson = $state(false)
  let jsonText = $state('')
  let jsonError = $state('')
  let exportResult = $state<{ value: string } | { error: string } | null>(null)

  $effect(() => {
    ringId
    pickerForSlice = null
    showJson = false
    jsonText = ''
    jsonError = ''
    exportResult = null
  })

  let limitKind = $derived.by(() => {
    const l = ring?.limit
    if (!l) return ''
    if (l === 'Horde' || l === 'Alliance' || l === 'PLAYER') return l
    return 'CLASS'
  })

  function renameRing(newName: string) {
    if (!ring) return
    const trimmed = newName.trim()
    if (trimmed && trimmed !== ring.name) dataStore.renameOpieRing(ring.id, trimmed)
  }

  function updateField(updates: Partial<import('../../opie/types').OpieRing>) {
    if (!ring) return
    dataStore.updateOpieRing(ring.id, updates)
  }

  function onLimitKindChange(value: string) {
    if (value === '') updateField({ limit: undefined })
    else if (value === 'Horde' || value === 'Alliance' || value === 'PLAYER') updateField({ limit: value })
    else updateField({ limit: '' }) // 'CLASS' — wait for the token input
  }

  function deleteRing() {
    if (!ring) return
    if (confirm(`¿Eliminar el anillo "${ring.name}"? Esto no borra automáticamente los slices que lo referencian desde otros anillos.`)) {
      dataStore.deleteOpieRing(ring.id)
    }
  }

  function addSlice() {
    if (!ring) return
    dataStore.addOpieSlice(ring.id, { type: 'spell' })
  }

  function updateSlice(index: number, updates: Partial<OpieSlice>) {
    if (!ring) return
    dataStore.updateOpieSlice(ring.id, index, updates)
  }

  function deleteSlice(index: number) {
    if (!ring) return
    dataStore.deleteOpieSlice(ring.id, index)
  }

  function moveSlice(index: number, dir: -1 | 1) {
    if (!ring) return
    const target = index + dir
    if (target < 0 || target >= ring.slices.length) return
    dataStore.reorderOpieSlices(ring.id, index, target)
  }

  function openPicker(index: number) {
    pickerForSlice = index
  }

  function onSpellSelected(id: number) {
    if (pickerForSlice === null) return
    updateSlice(pickerForSlice, { arg: id })
    pickerForSlice = null
  }

  function toggleJson() {
    if (!ring) return
    showJson = !showJson
    if (showJson) jsonText = JSON.stringify(ring, null, 2)
    jsonError = ''
  }

  function applyJson() {
    if (!ring) return
    try {
      const parsed = JSON.parse(jsonText)
      dataStore.updateOpieRing(ring.id, { ...parsed, id: ring.id })
      jsonError = ''
      uiStore.setStatus('JSON aplicado al anillo', 'ok')
    } catch (e) {
      jsonError = (e as Error).message
    }
  }

  function generateString() {
    if (!ring) return
    exportResult = encodeRing(ring)
  }

  function copyString() {
    if (exportResult && 'value' in exportResult) {
      navigator.clipboard.writeText(exportResult.value)
      uiStore.setStatus('String copiado al portapapeles', 'ok')
    }
  }

  function argIsSpellLike(type: SliceActionType) {
    return SPELL_LIKE.has(type)
  }

  function previewInfo(type: SliceActionType, arg: string | number | undefined): SpellInfo | null {
    const resolver = PREVIEW_RESOLVER[type]
    if (!resolver || arg === undefined) return null
    const id = Number(arg)
    if (!id || isNaN(id)) return null
    return resolver(id)
  }

  function ringSliceTargetId(name: string | number | undefined): string | undefined {
    if (typeof name !== 'string' || !name) return undefined
    return $opieRingsStore.find((r) => r.name === name)?.id
  }
</script>

{#if ring}
  <div class="ring-editor wow-panel">
    <div class="wow-panel-header">
      <h3>Editar anillo</h3>
      <button class="wow-btn wow-btn-sm wow-btn-danger" onclick={deleteRing}>Eliminar anillo</button>
    </div>
    <div class="wow-panel-body re-body">
      <div class="re-fields">
        <label class="re-field">
          <span>Nombre</span>
          <input type="text" value={ring.name} onchange={(e) => renameRing(e.currentTarget.value)} />
        </label>
        <label class="re-field">
          <span>Hotkey</span>
          <input
            type="text"
            value={ring.hotkey ?? ''}
            placeholder="p.ej. SHIFT-BUTTON2"
            onchange={(e) => updateField({ hotkey: e.currentTarget.value || undefined })}
          />
        </label>
        <label class="re-field">
          <span>Visibilidad</span>
          <select value={limitKind} onchange={(e) => onLimitKindChange(e.currentTarget.value)}>
            <option value="">Todos los personajes</option>
            <option value="Horde">Solo Horda</option>
            <option value="Alliance">Solo Alianza</option>
            <option value="PLAYER">Solo este personaje</option>
            <option value="CLASS">Solo esta clase…</option>
          </select>
        </label>
        {#if limitKind === 'CLASS'}
          <label class="re-field">
            <span>Clase (token)</span>
            <input
              type="text"
              value={ring.limit ?? ''}
              placeholder="p.ej. MAGE"
              onchange={(e) => updateField({ limit: e.currentTarget.value.toUpperCase() || undefined })}
            />
          </label>
        {/if}
        <label class="re-field re-checkbox">
          <input
            type="checkbox"
            checked={!!ring.embed}
            onchange={(e) => updateField({ embed: e.currentTarget.checked || undefined })}
          />
          <span>Embeber en otros anillos por defecto</span>
        </label>
      </div>

      {#if ring.slices.length > 0}
        <div class="re-radial-wrap">
          <div class="re-radial">
            {#each ring.slices as slice, i}
              {@const n = ring.slices.length}
              {@const angle = n <= 1 ? -90 : -90 + (360 * i) / n}
              {@const rad = (angle * Math.PI) / 180}
              {@const x = 90 + 68 * Math.cos(rad)}
              {@const y = 90 + 68 * Math.sin(rad)}
              <div
                class="re-radial-slot"
                class:empty={!slice.type}
                style={`left:${x}px; top:${y}px;`}
                title={`Slice ${i + 1}${slice.type ? ': ' + slice.type : ''}`}
              >
                {slice.type ? slice.type.slice(0, 4) : '—'}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <table class="re-slices">
        <thead>
          <tr>
            <th>#</th>
            <th>Tipo</th>
            <th>Valor / ID</th>
            <th>Icono</th>
            <th>Flags</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each ring.slices as slice, i (i)}
            <tr>
              <td class="re-idx">{i + 1}</td>
              <td>
                <select
                  value={slice.type}
                  onchange={(e) => updateSlice(i, { type: e.currentTarget.value as SliceActionType })}
                >
                  {#each SLICE_TYPES as t}
                    <option value={t.value}>{t.label}</option>
                  {/each}
                </select>
              </td>
              <td>
                {#if argIsSpellLike(slice.type)}
                  <div class="re-arg-row">
                    <input
                      type="text"
                      value={slice.arg ?? ''}
                      placeholder="ID"
                      onchange={(e) => {
                        const v = e.currentTarget.value
                        const num = Number(v)
                        updateSlice(i, { arg: v !== '' && !isNaN(num) ? num : v })
                      }}
                    />
                    <button class="wow-btn wow-btn-sm" onclick={() => openPicker(i)}>Elegir…</button>
                  </div>
                {:else if slice.type === 'ring'}
                  {@const targetId = ringSliceTargetId(slice.arg)}
                  <div class="re-arg-row">
                    <select
                      value={slice.arg ?? ''}
                      onchange={(e) => updateSlice(i, { arg: e.currentTarget.value })}
                    >
                      <option value="">(elegir anillo)</option>
                      {#each allRingNames as name}
                        <option value={name}>{name}</option>
                      {/each}
                    </select>
                    {#if targetId}
                      <button
                        class="wow-btn wow-btn-sm"
                        title="Ir a este anillo"
                        onclick={() => onNavigateToRing?.(targetId)}
                      >Ir →</button>
                    {/if}
                  </div>
                {:else if TEXT_LIKE.has(slice.type)}
                  <textarea
                    rows="2"
                    value={slice.arg ?? ''}
                    placeholder="texto del macro / comando"
                    onchange={(e) => updateSlice(i, { arg: e.currentTarget.value })}
                  ></textarea>
                {:else}
                  <input
                    type="text"
                    value={slice.arg ?? ''}
                    placeholder="id / nombre"
                    onchange={(e) => {
                      const v = e.currentTarget.value
                      const num = Number(v)
                      updateSlice(i, { arg: v !== '' && !isNaN(num) ? num : v })
                    }}
                  />
                {/if}
                {#if PREVIEW_RESOLVER[slice.type]}
                  {@const info = previewInfo(slice.type, slice.arg)}
                  {#if info}
                    <div class="re-preview">
                      {#if info.iconUrl}<img src={info.iconUrl} alt={info.name} />{/if}
                      <span>{info.name}</span>
                    </div>
                  {/if}
                {/if}
              </td>
              <td>
                <input
                  type="text"
                  value={slice.icon ?? ''}
                  placeholder="icon override"
                  onchange={(e) => updateSlice(i, { icon: e.currentTarget.value || undefined })}
                />
              </td>
              <td>
                <input
                  type="number"
                  class="re-flags"
                  value={slice.flags ?? ''}
                  title="Bitfield crudo — el significado depende del tipo de acción (ver opciones del addon)"
                  onchange={(e) => {
                    const v = e.currentTarget.value
                    updateSlice(i, { flags: v === '' ? undefined : Number(v) })
                  }}
                />
              </td>
              <td class="re-actions">
                <button class="wow-btn wow-btn-sm" title="Subir" onclick={() => moveSlice(i, -1)}>↑</button>
                <button class="wow-btn wow-btn-sm" title="Bajar" onclick={() => moveSlice(i, 1)}>↓</button>
                <button class="wow-btn wow-btn-sm wow-btn-danger" title="Eliminar" onclick={() => deleteSlice(i)}>✕</button>
              </td>
            </tr>
          {:else}
            <tr><td colspan="6" class="re-empty">Sin slices. Agregá uno abajo.</td></tr>
          {/each}
        </tbody>
      </table>

      <div class="re-row">
        <button class="wow-btn wow-btn-sm" onclick={addSlice}>+ Agregar slice</button>
      </div>

      <div class="re-json-toggle">
        <button class="wow-btn wow-btn-sm" onclick={toggleJson}>Ver / editar JSON crudo</button>
        {#if showJson}
          <textarea class="re-json-box" rows="10" bind:value={jsonText}></textarea>
          <div class="re-row">
            <button class="wow-btn wow-btn-sm wow-btn-primary" onclick={applyJson}>Aplicar JSON</button>
            {#if jsonError}<span class="re-json-error">{jsonError}</span>{/if}
          </div>
        {/if}
      </div>

      <div class="re-export">
        <button class="wow-btn wow-btn-sm wow-btn-arcane" onclick={generateString}>Generar string</button>
        {#if exportResult}
          {#if 'value' in exportResult}
            <span class="re-export-ok">✓ válido</span>
            <textarea class="re-export-box" readonly rows="3">{exportResult.value}</textarea>
            <button class="wow-btn wow-btn-sm" onclick={copyString}>Copiar</button>
          {:else}
            <span class="re-export-err">✗ {exportResult.error}</span>
          {/if}
        {/if}
      </div>
    </div>
  </div>

  {#if pickerForSlice !== null}
    <SpellPickerModal
      selectedId={typeof ring.slices[pickerForSlice]?.arg === 'number' ? ring.slices[pickerForSlice].arg as number : undefined}
      onSelect={onSpellSelected}
      onClose={() => (pickerForSlice = null)}
    />
  {/if}
{:else}
  <div class="ring-editor-empty wow-panel">
    <div class="wow-panel-body">Seleccioná un anillo de la lista para editarlo.</div>
  </div>
{/if}

<style>
  .re-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .re-fields {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .re-field {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 140px;
  }
  .re-field span {
    font-size: 0.55rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .re-field input,
  .re-field select {
    background: var(--input-bg);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 4px 6px;
    font-size: 0.65rem;
    color: var(--text-primary);
  }
  .re-checkbox {
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }
  .re-checkbox span {
    text-transform: none;
    letter-spacing: normal;
    font-size: 0.65rem;
    color: var(--text-secondary);
  }
  .re-radial-wrap {
    display: flex;
    justify-content: center;
    padding: 6px 0;
  }
  .re-radial {
    position: relative;
    width: 180px;
    height: 180px;
  }
  .re-radial-slot {
    position: absolute;
    transform: translate(-50%, -50%);
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 1px solid var(--gold);
    background: var(--bg-raised);
    color: var(--gold-light);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.5rem;
    text-align: center;
    line-height: 1.1;
    overflow: hidden;
  }
  .re-radial-slot.empty {
    border-color: var(--border-subtle);
    color: var(--text-dim);
  }
  .re-slices {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.65rem;
  }
  .re-slices th {
    text-align: left;
    color: var(--text-muted);
    font-size: 0.55rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 4px 6px;
    border-bottom: 1px solid var(--border-subtle);
  }
  .re-slices td {
    padding: 4px 6px;
    border-bottom: 1px solid var(--border-subtle);
    vertical-align: top;
  }
  .re-idx {
    color: var(--text-dim);
    width: 20px;
  }
  .re-slices select,
  .re-slices input,
  .re-slices textarea {
    background: var(--input-bg);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 3px 5px;
    font-size: 0.6rem;
    color: var(--text-primary);
    width: 100%;
  }
  .re-flags {
    width: 60px !important;
  }
  .re-arg-row {
    display: flex;
    gap: 4px;
  }
  .re-preview {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 3px;
    font-size: 0.55rem;
    color: var(--text-secondary);
  }
  .re-preview img {
    width: 16px;
    height: 16px;
    border-radius: 2px;
  }
  .re-actions {
    display: flex;
    gap: 2px;
    white-space: nowrap;
  }
  .re-empty {
    text-align: center;
    color: var(--text-dim);
    padding: 12px;
  }
  .re-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .re-json-box,
  .re-export-box {
    width: 100%;
    font-family: monospace;
    font-size: 0.55rem;
    background: var(--input-bg);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 6px;
    color: var(--text-secondary);
    resize: vertical;
  }
  .re-json-error {
    color: var(--horde, #c5365a);
    font-size: 0.6rem;
  }
  .re-export {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
    border-top: 1px solid var(--border-subtle);
    padding-top: 8px;
  }
  .re-export-ok {
    color: var(--ok, #6f9b5c);
    font-size: 0.6rem;
  }
  .re-export-err {
    color: var(--horde, #c5365a);
    font-size: 0.6rem;
  }
</style>
