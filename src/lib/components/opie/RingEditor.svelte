<script lang="ts">
  import { dataStore, opieRingsStore } from '../../stores/data'
  import { uiStore } from '../../stores/ui'
  import { encodeRing } from '../../opie/mapper'
  import { getSpellInfo } from '../../keybinds/spellService'
  import { getItemInfo } from '../../opie/itemService'
  import type { SpellInfo } from '../../keybinds/types'
  import type { OpieSlice, SliceActionType, RingRotationMode } from '../../opie/types'
  import { CLASS_SPECS } from '../../opie/specTable'
  import { parseSkipSpecs, applySkipSpecs } from '../../opie/specConditional'
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
    { value: 'peq', label: 'Slot de equipo' },
    { value: 'uipanel', label: 'Panel de interfaz' },
    { value: 'housing', label: 'Vivienda' },
  ]

  const SPELL_LIKE = new Set(['spell', 'mount', 'toy', 'item'])
  const ITEM_NAMESPACE = new Set(['toy', 'item'])
  const TEXT_LIKE = new Set(['macro', 'imptext'])
  const FIXED_NUMERIC_ENUM = new Set(['raidmark', 'worldmark'])
  const FIXED_TOKEN_ENUM = new Set(['uipanel', 'peq', 'housing'])
  // toys share WoW's item namespace (not the spell namespace), so their
  // name/icon come from itemService, not spellService — see itemService.ts.
  const PREVIEW_RESOLVER: Record<string, (id: number) => SpellInfo> = {
    spell: getSpellInfo,
    mount: getSpellInfo,
    toy: getItemInfo,
    item: getItemInfo,
  }

  const ROTATION_OPTIONS: { value: string; label: string }[] = [
    { value: '', label: 'No personalizado' },
    { value: 'embed', label: 'Embeber slices de este anillo' },
    { value: 'cycle', label: 'Ciclar' },
    { value: 'shuffle', label: 'Aleatorio al usar' },
    { value: 'random', label: 'Aleatorio al mostrar' },
    { value: 'reset', label: 'Reiniciar al mostrar' },
    { value: 'jump', label: 'Slice de salto' },
  ]

  const FLAG_DEFS: Record<string, { bit: number; label: string }[]> = {
    item: [
      { bit: 1, label: 'Mostrar aunque no esté disponible' },
      { bit: 2, label: 'Usar también objetos con el mismo nombre' },
      { bit: 4, label: 'Solo mostrar si está equipado' },
    ],
    macro: [{ bit: 1, label: 'Mostrar aunque no esté disponible' }],
    extrabutton: [{ bit: 1, label: 'Mostrar aunque no esté disponible' }],
    toy: [{ bit: 1, label: 'Mostrar aunque no esté disponible' }],
    'opie.databroker.launcher': [{ bit: 8, label: 'Simular clic derecho' }],
  }

  const RAIDMARK_OPTIONS = [
    { value: '0', label: 'Ninguno' },
    { value: '1', label: '1 — Estrella' },
    { value: '2', label: '2 — Círculo' },
    { value: '3', label: '3 — Diamante' },
    { value: '4', label: '4 — Triángulo' },
    { value: '5', label: '5 — Luna' },
    { value: '6', label: '6 — Cuadrado' },
    { value: '7', label: '7 — Cruz' },
    { value: '8', label: '8 — Calavera' },
  ]
  const WORLDMARK_OPTIONS = [
    { value: '0', label: 'Ninguno (borrar todos)' },
    { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' },
    { value: '4', label: '4' }, { value: '5', label: '5' }, { value: '6', label: '6' },
    { value: '7', label: '7' }, { value: '8', label: '8' },
  ]
  const UIPANEL_OPTIONS = [
    'character', 'reputation', 'currency', 'spellbook', 'talents', 'profs', 'achievements',
    'quests', 'groupfinder', 'collections', 'adventureguide', 'guild', 'map', 'vault', 'social',
    'calendar', 'macro', 'options', 'gamemenu',
  ].map((v) => ({ value: v, label: v }))
  const PEQ_OPTIONS = [
    'head', 'neck', 'shoulders', 'back', 'chest', 'tabard', 'shirt', 'wrist', 'hands', 'waist',
    'legs', 'feet', 'finger1', 'finger2', 'trinket1', 'trinket2',
  ].map((v) => ({ value: v, label: v }))
  const HOUSING_OPTIONS = [
    { value: 'return', label: 'return' },
    { value: 'match', label: 'match' },
    { value: 'cross', label: 'cross' },
    { value: 'elwynn', label: "elwynn (Founder's Point)" },
    { value: 'durotar', label: 'durotar (Razorwind Shores)' },
  ]
  const FIXED_ENUM_OPTIONS: Record<string, { value: string; label: string }[]> = {
    raidmark: RAIDMARK_OPTIONS,
    worldmark: WORLDMARK_OPTIONS,
    uipanel: UIPANEL_OPTIONS,
    peq: PEQ_OPTIONS,
    housing: HOUSING_OPTIONS,
  }

  let pickerForSlice = $state<number | null>(null)
  let expandedSlice = $state<number | null>(null)
  let showJson = $state(false)
  let jsonText = $state('')
  let jsonError = $state('')
  let exportResult = $state<{ value: string } | { error: string } | null>(null)

  $effect(() => {
    ringId
    pickerForSlice = null
    expandedSlice = null
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

  function ringDisplayMode(slice: OpieSlice): string {
    if (slice.embed) return 'embed'
    return slice.rotationMode ?? ''
  }

  function onRingDisplayModeChange(i: number, value: string) {
    if (value === 'embed') updateSlice(i, { embed: true, rotationMode: undefined })
    else if (value === '') updateSlice(i, { embed: undefined, rotationMode: undefined })
    else updateSlice(i, { embed: undefined, rotationMode: value as RingRotationMode })
  }

  function hasFlag(flags: number | undefined, bit: number): boolean {
    return !!(flags && (flags & bit))
  }

  function toggleFlag(i: number, current: number | undefined, bit: number, checked: boolean) {
    const base = current ?? 0
    const next = checked ? base | bit : base & ~bit
    updateSlice(i, { flags: next === 0 ? undefined : next })
  }

  function ringSkipSpecIds(specs: string[] | undefined): number[] {
    return (specs ?? []).map(Number).filter((n) => !isNaN(n))
  }

  function selectedSpecIds(e: Event): number[] {
    const select = e.currentTarget as HTMLSelectElement
    return Array.from(select.selectedOptions).map((o) => Number(o.value))
  }

  function onRingSkipSpecsChange(e: Event) {
    const ids = selectedSpecIds(e)
    updateField({ skipSpecs: ids.length ? ids.map(String) : undefined })
  }

  function onSliceSkipSpecsChange(i: number, show: string | undefined, e: Event) {
    updateSlice(i, { show: applySkipSpecs(show, selectedSpecIds(e)) })
  }

  function colorHex(color: string | undefined): string {
    return `#${(color ?? '000000').padStart(6, '0')}`
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
        <label class="re-field re-checkbox">
          <input
            type="checkbox"
            checked={ring.onOpen === 1}
            onchange={(e) => updateField({ onOpen: e.currentTarget.checked ? 1 : undefined })}
          />
          <span>Usar el primer slice al abrir</span>
        </label>
        <label class="re-field re-checkbox">
          <input
            type="checkbox"
            checked={!ring.noOpportunisticCA}
            onchange={(e) => {
              const checked = e.currentTarget.checked
              updateField({ noOpportunisticCA: checked ? undefined : true, noPersistentCA: checked ? undefined : true })
            }}
          />
          <span>Preseleccionar acción rápida</span>
        </label>
        <label class="re-field re-checkbox">
          <input
            type="checkbox"
            checked={!!ring.internal}
            onchange={(e) => updateField({ internal: e.currentTarget.checked || undefined })}
          />
          <span>Ocultar este anillo</span>
        </label>
        <label class="re-field">
          <span>Especializaciones a saltar</span>
          <select multiple size="4" class="re-spec-select" onchange={onRingSkipSpecsChange}>
            {#each CLASS_SPECS as c}
              <optgroup label={c.className}>
                {#each c.specs as s}
                  <option value={s.id} selected={ringSkipSpecIds(ring.skipSpecs).includes(s.id)}>{s.name}</option>
                {/each}
              </optgroup>
            {/each}
          </select>
        </label>
        <label class="re-field">
          <span>Rotación ({ring.offset ?? 0}°)</span>
          <input
            type="range"
            min="0"
            max="345"
            step="15"
            value={ring.offset ?? 0}
            onchange={(e) => updateField({ offset: Number(e.currentTarget.value) || undefined })}
          />
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
                  <select
                    class="re-rotation-select"
                    value={ringDisplayMode(slice)}
                    onchange={(e) => onRingDisplayModeChange(i, e.currentTarget.value)}
                  >
                    {#each ROTATION_OPTIONS as opt}
                      <option value={opt.value}>{opt.label}</option>
                    {/each}
                  </select>
                {:else if TEXT_LIKE.has(slice.type)}
                  <textarea
                    rows="2"
                    value={slice.arg ?? ''}
                    placeholder="texto del macro / comando"
                    onchange={(e) => updateSlice(i, { arg: e.currentTarget.value })}
                  ></textarea>
                {:else if FIXED_NUMERIC_ENUM.has(slice.type)}
                  <select
                    value={String(slice.arg ?? 0)}
                    onchange={(e) => updateSlice(i, { arg: Number(e.currentTarget.value) })}
                  >
                    {#each FIXED_ENUM_OPTIONS[slice.type] as opt}
                      <option value={opt.value}>{opt.label}</option>
                    {/each}
                  </select>
                {:else if FIXED_TOKEN_ENUM.has(slice.type)}
                  <select
                    value={slice.arg ?? ''}
                    onchange={(e) => updateSlice(i, { arg: e.currentTarget.value })}
                  >
                    <option value="">(elegir)</option>
                    {#each FIXED_ENUM_OPTIONS[slice.type] as opt}
                      <option value={opt.value}>{opt.label}</option>
                    {/each}
                  </select>
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
                <button
                  class="wow-btn wow-btn-sm"
                  title="Más opciones"
                  class:active={expandedSlice === i}
                  onclick={() => (expandedSlice = expandedSlice === i ? null : i)}
                >⚙</button>
                <button class="wow-btn wow-btn-sm" title="Subir" onclick={() => moveSlice(i, -1)}>↑</button>
                <button class="wow-btn wow-btn-sm" title="Bajar" onclick={() => moveSlice(i, 1)}>↓</button>
                <button class="wow-btn wow-btn-sm wow-btn-danger" title="Eliminar" onclick={() => deleteSlice(i)}>✕</button>
              </td>
            </tr>
            {#if expandedSlice === i}
              <tr class="re-advanced-row">
                <td></td>
                <td colspan="5">
                  <div class="re-advanced">
                    <label class="re-field">
                      <span>Etiqueta</span>
                      <input
                        type="text"
                        value={slice.label ?? ''}
                        placeholder="texto corto override"
                        onchange={(e) => updateSlice(i, { label: e.currentTarget.value || undefined })}
                      />
                    </label>
                    <label class="re-field">
                      <span>Condición (show)</span>
                      <input
                        type="text"
                        value={slice.show ?? ''}
                        placeholder="[combat] hide; [mod] show"
                        title="Condición cruda de visibilidad — se guarda y exporta tal cual, no se evalúa en vivo acá."
                        onchange={(e) => updateSlice(i, { show: e.currentTarget.value || undefined })}
                      />
                    </label>
                    <label class="re-field">
                      <span>Color</span>
                      <div class="re-color-row">
                        <input
                          type="color"
                          value={colorHex(slice.color)}
                          onchange={(e) => updateSlice(i, { color: e.currentTarget.value.replace('#', '').toUpperCase() })}
                        />
                        <input
                          type="text"
                          value={slice.color ?? ''}
                          placeholder="RRGGBB"
                          onchange={(e) => updateSlice(i, { color: e.currentTarget.value.replace('#', '').toUpperCase() || undefined })}
                        />
                      </div>
                    </label>
                    <label class="re-field re-checkbox">
                      <input
                        type="checkbox"
                        checked={!!slice.fastClick}
                        onchange={(e) => updateSlice(i, { fastClick: e.currentTarget.checked || undefined })}
                      />
                      <span>Permitir como acción rápida</span>
                    </label>
                    <label class="re-field">
                      <span>Ocultar para estas specs</span>
                      <select
                        multiple
                        size="4"
                        class="re-spec-select"
                        onchange={(e) => onSliceSkipSpecsChange(i, slice.show, e)}
                      >
                        {#each CLASS_SPECS as c}
                          <optgroup label={c.className}>
                            {#each c.specs as s}
                              <option value={s.id} selected={parseSkipSpecs(slice.show).includes(s.id)}>{s.name}</option>
                            {/each}
                          </optgroup>
                        {/each}
                      </select>
                    </label>
                    {#if FLAG_DEFS[slice.type]}
                      <div class="re-flag-checks">
                        <span class="re-flags-label">Flags</span>
                        {#each FLAG_DEFS[slice.type] as f}
                          <label class="re-field re-checkbox">
                            <input
                              type="checkbox"
                              checked={hasFlag(slice.flags, f.bit)}
                              onchange={(e) => toggleFlag(i, slice.flags, f.bit, e.currentTarget.checked)}
                            />
                            <span>{f.label}</span>
                          </label>
                        {/each}
                      </div>
                    {/if}
                  </div>
                </td>
              </tr>
            {/if}
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
      mode={ITEM_NAMESPACE.has(ring.slices[pickerForSlice]?.type ?? '') ? 'item' : 'spell'}
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
  .re-rotation-select {
    margin-top: 4px;
  }
  .re-actions button.active {
    border-color: var(--gold);
    color: var(--gold-light);
  }
  .re-advanced-row td {
    border-bottom: 1px solid var(--border-subtle);
    padding: 4px 6px 8px;
    background: rgba(0, 0, 0, 0.15);
  }
  .re-advanced {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: flex-end;
  }
  .re-advanced .re-field {
    min-width: 130px;
  }
  .re-color-row {
    display: flex;
    gap: 4px;
    align-items: center;
  }
  .re-color-row input[type='color'] {
    width: 28px;
    height: 22px;
    padding: 1px 2px;
  }
  .re-flag-checks {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
  .re-flags-label {
    font-size: 0.55rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .re-spec-select {
    min-width: 160px;
    font-size: 0.55rem !important;
  }
</style>
