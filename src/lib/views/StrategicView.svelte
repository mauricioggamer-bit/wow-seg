<script lang="ts">
  import { dataStore } from '../stores/data'
  import { CLASS_STRATEGIC_VALUE, RACE_STRATEGIC_VALUE, PROFESSION_STRATEGIC_VALUE, STRATEGIC_COMPONENTS, RACE_PROFESSION_BONUS } from '../constants'
  import { PROFESIONES } from '../constants/profesiones'
  import type { Personaje, StrategicIndex, WowData } from '../types'

  let tab = $state<string>('indexes')
  let storeData: WowData = $state(dataStore.getData())
  $effect(() => dataStore.subscribe(v => storeData = v))

  const tabs = [
    { key: 'indexes', label: 'Ventajas' },
    { key: 'classes', label: 'Clases' },
    { key: 'races', label: 'Razas' },
    { key: 'professions', label: 'Profesiones' },
    { key: 'tasks', label: 'Tareas' },
    { key: 'warbands', label: 'Warbands' },
    { key: 'characters', label: 'Personajes' },
    { key: 'components', label: 'Pesos' },
  ]

  let indexes: StrategicIndex[] = $derived(storeData.strategicConfig?.indexes ?? [])
  let personajes: Personaje[] = $derived(storeData.personajes ?? [])
  let allClassNames = $derived(Object.keys(CLASS_STRATEGIC_VALUE).sort())
  let allRaceNames = $derived(Object.keys(RACE_STRATEGIC_VALUE).sort())
  let allWarbands = $derived((storeData.warbands ?? []).filter((w: { nombre: string }) => w.nombre !== 'nada').map((w: { nombre: string }) => w.nombre))
  let allProfItems = $derived([...PROFESIONES, { id: 'cocina', nombre: 'Cocina', icon: '🍳' }])
  let strategicValues = $derived(storeData.strategicConfig?.values ?? {})
  let componentWeights = $derived(storeData.strategicConfig?.componentWeights ?? {})

  function valKey(entityType: string, entityId: string, indexId: string): string {
    return `${entityType}:${entityId}:${indexId}`
  }
  function getVal(entityType: string, entityId: string, indexId: string): number {
    return strategicValues[valKey(entityType, entityId, indexId)] ?? 0
  }
  function isOver(entityType: string, entityId: string, indexId: string): boolean {
    return valKey(entityType, entityId, indexId) in strategicValues
  }
  function getDefault(entityType: string, entityId: string, indexId: string): number {
    if (indexId === 'general') {
      if (entityType === 'class') return CLASS_STRATEGIC_VALUE[entityId] ?? 0
      if (entityType === 'race') return RACE_STRATEGIC_VALUE[entityId] ?? 0
      if (entityType === 'profession') return PROFESSION_STRATEGIC_VALUE[entityId] ?? 0
    }
    return 0
  }
  function getCW(key: string): number {
    return componentWeights[key] || 0
  }
  function isCWOver(key: string): boolean {
    return key in componentWeights
  }
  function save(entityType: string, entityId: string, indexId: string, el: EventTarget & HTMLInputElement) {
    const v = parseInt(el.value)
    if (!isNaN(v) && v >= 0) dataStore.setStrategicValue(entityType, entityId, indexId, v)
  }
  function reset(entityType: string, entityId: string, indexId: string) {
    dataStore.resetStrategicValue(entityType, entityId, indexId)
  }

  let newIdxName = $state('')
  let newIdxDesc = $state('')
  function addIndex() {
    const name = newIdxName.trim()
    if (!name) return
    const id = 'idx_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_')
    dataStore.addIndex({ id, name, description: newIdxDesc.trim() })
    newIdxName = ''
    newIdxDesc = ''
  }
  function delIndex(id: string) {
    const idx = indexes.find(i => i.id === id)
    if (idx && confirm(`Eliminar ventaja "${idx.name}"?`)) dataStore.deleteIndex(id)
  }

  function raceProfBonusText(race: string): string {
    const bonuses = RACE_PROFESSION_BONUS[race]
    if (!bonuses || bonuses.length === 0) return '—'
    return bonuses.map(b => {
      if (b.profId === '*') return `+${b.bonus} a todas`
      return `+${b.bonus} ${b.profId}${b.note ? ' (' + b.note + ')' : ''}`
    }).join(', ')
  }

  function raceBonusesForProf(profId: string): [string, number][] {
    const result: [string, number][] = []
    for (const [race, bonuses] of Object.entries(RACE_PROFESSION_BONUS)) {
      for (const b of bonuses) {
        if (b.profId === profId || b.profId === '*') {
          result.push([race, b.bonus])
        }
      }
    }
    return result
  }

  function charProfString(p: Personaje): string {
    return (p.profesiones ?? []).map(pr => pr.id).filter(Boolean).join(',') || '—'
  }
</script>

<div class="sv-view">
  <div class="sv-tabs">
    {#each tabs as t}
      <button class="sv-tab" class:active={tab === t.key} onclick={() => tab = t.key}>
        {t.label}
      </button>
    {/each}
  </div>

  {#if tab === 'indexes'}
    <div class="sv-section">
      <div class="sv-add-row">
        <input type="text" bind:value={newIdxName} placeholder="Nombre de la ventaja" class="sv-text-input" />
        <input type="text" bind:value={newIdxDesc} placeholder="Descripción (opcional)" class="sv-text-input sv-text-wide" />
        <button class="sv-btn-add" onclick={addIndex}>+ Añadir</button>
      </div>
      {#if indexes.length === 0}
        <p class="sv-hint">No hay ventajas definidas. Crea una para empezar.</p>
      {:else}
        <table class="sv-table">
          <thead>
            <tr><th>ID</th><th>Nombre</th><th>Descripción</th><th></th></tr>
          </thead>
          <tbody>
            {#each indexes as idx}
              <tr>
                <td class="sv-muted">{idx.id}</td>
                <td>{idx.name}</td>
                <td class="sv-desc">{idx.description || '—'}</td>
                <td>
                  {#if idx.id !== 'general'}
                    <button class="sv-btn-del" onclick={() => delIndex(idx.id)}>Eliminar</button>
                  {:else}
                    <span class="sv-muted">(protegido)</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>

  {:else if tab === 'classes'}
    <div class="sv-table-wrap">
      <table class="sv-table sv-matrix">
        <thead>
          <tr>
            <th>Clase</th>
            {#each indexes as idx}
              <th class="sv-col-idx">{idx.name}</th>
            {/each}
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          {#each allClassNames as name}
            <tr>
              <td>{name}</td>
              {#each indexes as idx}
                <td>
                  <input type="number" min="0" max="100"
                    value={getVal('class', name, idx.id)}
                    onchange={(e) => save('class', name, idx.id, e.currentTarget)}
                    class="sv-input"
                    class:sv-overridden={isOver('class', name, idx.id)} />
                </td>
              {/each}
              <td class="sv-default">{getDefault('class', name, 'general')}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

  {:else if tab === 'races'}
    <div class="sv-table-wrap">
      <table class="sv-table sv-matrix">
        <thead>
          <tr>
            <th>Raza</th>
            {#each indexes as idx}
              <th class="sv-col-idx">{idx.name}</th>
            {/each}
            <th>Bono Prof.</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          {#each allRaceNames as name}
            <tr>
              <td>{name}</td>
              {#each indexes as idx}
                <td>
                  <input type="number" min="0" max="100"
                    value={getVal('race', name, idx.id)}
                    onchange={(e) => save('race', name, idx.id, e.currentTarget)}
                    class="sv-input"
                    class:sv-overridden={isOver('race', name, idx.id)} />
                </td>
              {/each}
              <td class="sv-default">{raceProfBonusText(name)}</td>
              <td class="sv-default">{getDefault('race', name, 'general')}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

  {:else if tab === 'professions'}
    <div class="sv-table-wrap">
      <table class="sv-table sv-matrix">
        <thead>
          <tr>
            <th>Profesión</th>
            {#each indexes as idx}
              <th class="sv-col-idx">{idx.name}</th>
            {/each}
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          {#each allProfItems as prof}
            <tr>
              <td>{prof.icon} {prof.nombre}
                {#each raceBonusesForProf(prof.id) as [race, bonus]}
                  <span class="sv-race-badge" title="{race}: +{bonus}">{race[0]}+{bonus}</span>
                {/each}
              </td>
              {#each indexes as idx}
                <td>
                  <input type="number" min="0" max="100"
                    value={getVal('profession', prof.id, idx.id)}
                    onchange={(e) => save('profession', prof.id, idx.id, e.currentTarget)}
                    class="sv-input"
                    class:sv-overridden={isOver('profession', prof.id, idx.id)} />
                </td>
              {/each}
              <td class="sv-default">{getDefault('profession', prof.id, 'general')}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

  {:else if tab === 'tasks'}
    <div class="sv-section">
      <p class="sv-hint">Valor estratégico por ventaja aplicado globalmente a todas las tareas (se suma una vez por personaje).</p>
      <table class="sv-table">
        <thead>
          <tr><th>Ventaja</th><th>Valor</th></tr>
        </thead>
        <tbody>
          {#each indexes as idx}
            <tr>
              <td>{idx.name}</td>
              <td>
                <input type="number" min="0" max="100"
                  value={getVal('task', '', idx.id)}
                  onchange={(e) => save('task', '', idx.id, e.currentTarget)}
                  class="sv-input"
                  class:sv-overridden={isOver('task', '', idx.id)} />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

  {:else if tab === 'warbands'}
    <div class="sv-table-wrap">
      <table class="sv-table sv-matrix">
        <thead>
          <tr>
            <th>Warband</th>
            {#each indexes as idx}
              <th class="sv-col-idx">{idx.name}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each allWarbands as wb}
            <tr>
              <td>{wb}</td>
              {#each indexes as idx}
                <td>
                  <input type="number" min="0" max="100"
                    value={getVal('warband', wb, idx.id)}
                    onchange={(e) => save('warband', wb, idx.id, e.currentTarget)}
                    class="sv-input"
                    class:sv-overridden={isOver('warband', wb, idx.id)} />
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

  {:else if tab === 'characters'}
    <div class="sv-table-wrap">
      <table class="sv-table sv-matrix">
        <thead>
          <tr>
            <th>Personaje</th>
            <th>Clase</th>
            <th>Raza</th>
            <th>Prof.</th>
            {#each indexes as idx}
              <th class="sv-col-idx">{idx.name}</th>
            {/each}
            <th>Base</th>
          </tr>
        </thead>
        <tbody>
          {#each personajes as p}
            <tr>
              <td>{p.nombre}</td>
              <td class="sv-default">{p.clase}</td>
              <td class="sv-default">{p.raza}</td>
              <td class="sv-default">{charProfString(p)}</td>
              {#each indexes as idx}
                <td>
                  <input type="number" min="0" max="100"
                    value={getVal('personaje', p.nombre, idx.id)}
                    onchange={(e) => save('personaje', p.nombre, idx.id, e.currentTarget)}
                    class="sv-input"
                    class:sv-overridden={isOver('personaje', p.nombre, idx.id)} />
                </td>
              {/each}
              <td class="sv-default">
                {getVal('class', p.clase, 'general') || CLASS_STRATEGIC_VALUE[p.clase] || 0}
                +
                {getVal('race', p.raza, 'general') || RACE_STRATEGIC_VALUE[p.raza] || 0}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

  {:else if tab === 'components'}
    <div class="sv-table-wrap">
      <table class="sv-table">
        <thead>
          <tr><th>Componente</th><th>Peso Default</th><th>Peso Actual</th><th>Descripción</th><th></th></tr>
        </thead>
        <tbody>
          {#each STRATEGIC_COMPONENTS as comp}
            <tr>
              <td>{comp.label}</td>
              <td class="sv-default">{comp.weight === 'fixed' || comp.weight === 'bonus' ? '—' : comp.weight}</td>
              <td>
                {#if typeof comp.weight === 'number'}
                  <input type="number" min="1" max="100"
                    value={getCW(comp.key) || comp.weight}
                    onchange={(e) => {
                      const v = parseInt(e.currentTarget.value)
                      if (!isNaN(v) && v >= 1) dataStore.setComponentWeight(comp.key, v)
                    }}
                    class="sv-input"
                    class:sv-overridden={isCWOver(comp.key)} />
                {:else}
                  <span class="sv-muted">{comp.weight}</span>
                {/if}
              </td>
              <td class="sv-desc">{comp.description}</td>
              <td>
                {#if typeof comp.weight === 'number'}
                  {#if isCWOver(comp.key)}
                    <button class="sv-btn-reset" onclick={() => dataStore.resetComponentWeight(comp.key)}>Reset</button>
                  {:else}
                    <span class="sv-default-label">Default</span>
                  {/if}
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .sv-view {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sv-tabs {
    display: flex;
    gap: 2px;
    flex-wrap: wrap;
  }
  .sv-tab {
    font-family: var(--font-heading);
    font-size: 0.6rem;
    padding: 4px 10px;
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm) var(--r-sm) 0 0;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .sv-tab.active {
    background: var(--bg-card);
    color: var(--gold);
    border-color: var(--gold);
    border-bottom-color: var(--bg-card);
  }
  .sv-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .sv-add-row {
    display: flex;
    gap: 4px;
    align-items: center;
    flex-wrap: wrap;
  }
  .sv-text-input {
    padding: 4px 6px;
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    background: var(--input-bg);
    color: var(--text-primary);
    font-size: 0.6rem;
  }
  .sv-text-wide {
    flex: 1;
    min-width: 150px;
  }
  .sv-btn-add {
    font-size: 0.55rem;
    padding: 4px 10px;
    border: 1px solid var(--gold);
    border-radius: var(--r-sm);
    background: transparent;
    color: var(--gold);
    cursor: pointer;
  }
  .sv-btn-add:hover {
    background: var(--gold);
    color: var(--bg-app);
  }
  .sv-btn-del {
    font-size: 0.5rem;
    padding: 2px 6px;
    border: 1px solid var(--danger);
    border-radius: var(--r-sm);
    background: transparent;
    color: var(--danger);
    cursor: pointer;
  }
  .sv-btn-del:hover {
    background: var(--danger);
    color: white;
  }
  .sv-table-wrap {
    overflow-x: auto;
  }
  .sv-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.6rem;
  }
  .sv-table th {
    text-align: left;
    padding: 4px 6px;
    border-bottom: 1px solid var(--border-subtle);
    color: var(--text-muted);
    font-family: var(--font-heading);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 400;
    white-space: nowrap;
  }
  .sv-table td {
    padding: 3px 6px;
    border-bottom: 1px solid var(--border-subtle);
    color: var(--text-primary);
    white-space: nowrap;
  }
  .sv-default {
    color: var(--text-muted);
    font-size: 0.55rem;
  }
  .sv-muted {
    color: var(--text-dim);
    font-style: italic;
  }
  .sv-desc {
    color: var(--text-dim);
    font-size: 0.5rem;
    max-width: 300px;
    white-space: normal;
  }
  .sv-input {
    width: 50px;
    padding: 2px 4px;
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    background: var(--input-bg);
    color: var(--text-primary);
    font-size: 0.6rem;
    text-align: center;
  }
  .sv-overridden {
    border-color: var(--gold) !important;
  }
  .sv-btn-reset {
    font-size: 0.5rem;
    padding: 2px 6px;
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
  }
  .sv-btn-reset:hover {
    border-color: var(--gold);
    color: var(--gold);
  }
  .sv-default-label {
    font-size: 0.5rem;
    color: var(--text-dim);
    font-style: italic;
  }
  .sv-hint {
    font-size: 0.55rem;
    color: var(--text-muted);
    margin: 0;
    padding: 4px 0;
  }
  .sv-col-idx {
    min-width: 40px;
    text-align: center;
  }
  .sv-matrix td {
    text-align: center;
  }
  .sv-matrix td:first-child {
    text-align: left;
  }
  .sv-race-badge {
    display: inline-block;
    font-size: 0.45rem;
    background: var(--gold);
    color: var(--bg-app);
    border-radius: 4px;
    padding: 1px 4px;
    margin: 1px;
    cursor: help;
  }
</style>
