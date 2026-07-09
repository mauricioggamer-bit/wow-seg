<script lang="ts">
  import { dataStore } from '../stores/data'
  import { CLASS_STRATEGIC_VALUE, RACE_STRATEGIC_VALUE, PROFESSION_STRATEGIC_VALUE, STRATEGIC_COMPONENTS } from '../constants'
  import { PROFESIONES } from '../constants/profesiones'
  import type { Personaje } from '../types'

  let tab = $state<'classes' | 'races' | 'professions' | 'tasks' | 'components' | 'characters'>('classes')

  const tabs = [
    { key: 'classes', label: 'Clases' },
    { key: 'races', label: 'Razas' },
    { key: 'professions', label: 'Profesiones' },
    { key: 'tasks', label: 'Tareas' },
    { key: 'components', label: 'Componentes' },
    { key: 'characters', label: 'Personajes' },
  ] as const

  const allClassNames = Object.keys(CLASS_STRATEGIC_VALUE).sort()
  const allRaceNames = Object.keys(RACE_STRATEGIC_VALUE).sort()
  let personajes: Personaje[] = $derived(dataStore.getPersonajes())

  function currentClassValue(name: string): number {
    return dataStore.getStrategicClassValue(name) ?? CLASS_STRATEGIC_VALUE[name] ?? 0
  }
  function currentRaceValue(name: string): number {
    return dataStore.getStrategicRaceValue(name) ?? RACE_STRATEGIC_VALUE[name] ?? 0
  }
  function currentProfValue(id: string): number {
    return dataStore.getStrategicProfessionValue(id) ?? PROFESSION_STRATEGIC_VALUE[id] ?? 0
  }
  function currentComponentWeight(key: string): number {
    return dataStore.getStrategicComponentWeight(key) ?? 0
  }
  function isOverridden(name: string, type: 'class' | 'race'): boolean {
    if (type === 'class') return dataStore.getStrategicClassValue(name) !== undefined
    return dataStore.getStrategicRaceValue(name) !== undefined
  }
  function isProfOverridden(id: string): boolean {
    return dataStore.getStrategicProfessionValue(id) !== undefined
  }
  function isWeightOverridden(key: string): boolean {
    return dataStore.getStrategicComponentWeight(key) !== undefined
  }

  function saveClassValue(name: string, el: EventTarget & HTMLInputElement) {
    const val = parseInt(el.value)
    if (!isNaN(val) && val >= 0) {
      dataStore.setStrategicClassValue(name, val)
    }
  }
  function saveRaceValue(name: string, el: EventTarget & HTMLInputElement) {
    const val = parseInt(el.value)
    if (!isNaN(val) && val >= 0) {
      dataStore.setStrategicRaceValue(name, val)
    }
  }
  function saveProfValue(id: string, el: EventTarget & HTMLInputElement) {
    const val = parseInt(el.value)
    if (!isNaN(val) && val >= 0) {
      dataStore.setStrategicProfessionValue(id, val)
    }
  }
  function saveWeight(key: string, el: EventTarget & HTMLInputElement) {
    const val = parseInt(el.value)
    if (!isNaN(val) && val >= 1) {
      dataStore.setStrategicComponentWeight(key, val)
    }
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

  {#if tab === 'classes'}
    <div class="sv-table-wrap">
      <table class="sv-table">
        <thead>
          <tr><th>Clase</th><th>Default</th><th>Valor</th><th></th></tr>
        </thead>
        <tbody>
          {#each allClassNames as name}
            {@const def = CLASS_STRATEGIC_VALUE[name] ?? 0}
            {@const cur = currentClassValue(name)}
            <tr>
              <td>{name}</td>
              <td class="sv-default">{def}</td>
              <td>
                <input type="number" min="0" max="100"
                  value={cur}
                  onchange={(e) => saveClassValue(name, e.currentTarget)}
                  class="sv-input"
                  class:sv-overridden={isOverridden(name, 'class')} />
              </td>
              <td>
                {#if isOverridden(name, 'class')}
                  <button class="sv-btn-reset" onclick={() => dataStore.resetStrategicClassValue(name)}>Reset</button>
                {:else}
                  <span class="sv-default-label">Default</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

  {:else if tab === 'races'}
    <div class="sv-table-wrap">
      <table class="sv-table">
        <thead>
          <tr><th>Raza</th><th>Default</th><th>Valor</th><th></th></tr>
        </thead>
        <tbody>
          {#each allRaceNames as name}
            {@const def = RACE_STRATEGIC_VALUE[name] ?? 0}
            {@const cur = currentRaceValue(name)}
            <tr>
              <td>{name}</td>
              <td class="sv-default">{def}</td>
              <td>
                <input type="number" min="0" max="100"
                  value={cur}
                  onchange={(e) => saveRaceValue(name, e.currentTarget)}
                  class="sv-input"
                  class:sv-overridden={isOverridden(name, 'race')} />
              </td>
              <td>
                {#if isOverridden(name, 'race')}
                  <button class="sv-btn-reset" onclick={() => dataStore.resetStrategicRaceValue(name)}>Reset</button>
                {:else}
                  <span class="sv-default-label">Default</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

  {:else if tab === 'professions'}
    <div class="sv-table-wrap">
      <table class="sv-table">
        <thead>
          <tr><th>Profesión</th><th>Default</th><th>Valor</th><th></th></tr>
        </thead>
        <tbody>
          {#each PROFESIONES as prof}
            {@const def = PROFESSION_STRATEGIC_VALUE[prof.id] ?? 0}
            {@const cur = currentProfValue(prof.id)}
            <tr>
              <td>{prof.icon} {prof.nombre}</td>
              <td class="sv-default">{def}</td>
              <td>
                <input type="number" min="0" max="100"
                  value={cur}
                  onchange={(e) => saveProfValue(prof.id, e.currentTarget)}
                  class="sv-input"
                  class:sv-overridden={isProfOverridden(prof.id)} />
              </td>
              <td>
                {#if isProfOverridden(prof.id)}
                  <button class="sv-btn-reset" onclick={() => dataStore.resetStrategicProfessionValue(prof.id)}>Reset</button>
                {:else}
                  <span class="sv-default-label">Default</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

  {:else if tab === 'tasks'}
    <div class="sv-table-wrap">
      <p class="sv-hint">Edita los puntos estratégicos por tarea directamente desde la vista de Tareas o al editar un personaje. Aquí se muestran todas las tareas de todos los personajes.</p>
      <table class="sv-table">
        <thead>
          <tr><th>Personaje</th><th>Tarea</th><th>Puntos</th></tr>
        </thead>
        <tbody>
          {#each personajes as p}
            {#each p.tareas as t}
              <tr>
                <td>{p.nombre}</td>
                <td>{t.nombre}</td>
                <td>
                  <input type="number" min="0" max="100"
                    value={t.puntos ?? 0}
                    onchange={(e) => {
                      const val = parseInt(e.currentTarget.value)
                      if (!isNaN(val) && val >= 0) {
                        dataStore.updateTarea(p.nombre, t.id, { puntos: val })
                      }
                    }}
                    class="sv-input sv-input-sm" />
                </td>
              </tr>
            {/each}
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
            {@const def = comp.weight}
            <tr>
              <td>{comp.label}</td>
              <td class="sv-default">{def === 'fixed' || def === 'bonus' ? '—' : def}</td>
              <td>
                {#if typeof def === 'number'}
                  {@const cur = currentComponentWeight(comp.key) || def}
                  <input type="number" min="1" max="100"
                    value={cur}
                    onchange={(e) => saveWeight(comp.key, e.currentTarget)}
                    class="sv-input"
                    class:sv-overridden={isWeightOverridden(comp.key)} />
                {:else}
                  <span class="sv-muted">{def}</span>
                {/if}
              </td>
              <td class="sv-desc">{comp.description}</td>
              <td>
                {#if typeof def === 'number'}
                  {#if isWeightOverridden(comp.key)}
                    <button class="sv-btn-reset" onclick={() => dataStore.resetStrategicComponentWeight(comp.key)}>Reset</button>
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

  {:else if tab === 'characters'}
    <div class="sv-table-wrap">
      <table class="sv-table">
        <thead>
          <tr>
            <th>Personaje</th>
            <th>Clase</th>
            <th>Valor Clase</th>
            <th>Raza</th>
            <th>Valor Raza</th>
            <th>Profesiones</th>
            <th>Valor Prof.</th>
            <th>Tags</th>
            <th>Valor Tags</th>
            <th>Tareas</th>
            <th>Valor Tareas</th>
          </tr>
        </thead>
        <tbody>
          {#each personajes as p}
            {@const classVal = currentClassValue(p.clase)}
            {@const raceVal = currentRaceValue(p.raza)}
            {@const profVal = (p.profesiones ?? []).reduce((sum, pr) => sum + (pr.id ? currentProfValue(pr.id) : 0), 0)}
            {@const tagsVal = (p.tagsEstrategicos ?? []).reduce((sum, t) => sum + t.puntos, 0)}
            {@const taskVal = (p.tareas ?? []).reduce((sum, t) => sum + (t.puntos ?? 0), 0)}
            <tr>
              <td>{p.nombre}</td>
              <td>{p.clase}</td>
              <td>{classVal}</td>
              <td>{p.raza}</td>
              <td>{raceVal}</td>
              <td>{(p.profesiones ?? []).map(pr => pr.id).filter(Boolean).join(', ') || '—'}</td>
              <td>{profVal}</td>
              <td>{(p.tagsEstrategicos ?? []).map(t => t.texto).join(', ') || '—'}</td>
              <td>{tagsVal}</td>
              <td>{(p.tareas ?? []).filter(t => t.puntos).length}</td>
              <td>{taskVal}</td>
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
  .sv-input-sm {
    width: 40px;
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
  .sv-overridden {
    border-color: var(--gold) !important;
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
</style>
