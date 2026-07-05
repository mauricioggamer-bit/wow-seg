<script lang="ts">
  import { uiStore } from '../stores/ui'
  import { dataStore, personajesStore, misionesStore } from '../stores/data'

  let { openTaskEdit, openMissionEdit }: { openTaskEdit?: (char: string, taskId: string) => void, openMissionEdit?: (m: any) => void } = $props()

  let tf = $state({
    personaje: '', warband: '', tipo: '', expansion: '', prioridad: '',
    tiempo: '', estado: '', search: '', clase: '', faccion: '', reino: '', activo: '', cooldown: '',
  })

  let sortKey = $state('')
  let sortDir = $state<'asc' | 'desc'>('asc')

  let personajes = $derived($personajesStore)
  let warbands = $derived([...new Set(personajes.map(p => p.warband))].sort())
  let clases = $derived([...new Set(personajes.map(c => c.clase))].sort())
  let reinos = $derived([...new Set(personajes.map(c => c.reino))].sort())

  let items = $derived.by(() => {
    const tareas: Array<Record<string, any>> = []
    for (const p of personajes) {
      for (const t of p.tareas) {
        tareas.push({ ...t, _origen: 'tarea', _char: p.nombre, personaje: p.nombre, clase: p.clase, faccion: p.faccion, reino: p.reino, warband: p.warband, nivel: p.nivel, planeado_usar: p.planeado_usar, estado: t.hecho ? 'completada' : 'pendiente' })
      }
    }
    const misiones = $misionesStore.map(m => ({
      ...m, _origen: 'mision' as const, _char: m.personaje || '',
      clase: '', faccion: '', reino: '', warband: '', nivel: 0, planeado_usar: true,
      cooldown: m.tipo, recompensa: '', hecho: m.estado === 'completada',
    }))
    let all = [...tareas, ...misiones]

    if (tf.personaje) all = all.filter(i => i._char === tf.personaje)
    if (tf.warband) {
      const wbChars = personajes.filter(p => p.warband === tf.warband).map(p => p.nombre)
      all = all.filter(i => !i._char || wbChars.includes(i._char))
    }
    if (tf.tipo) all = all.filter(i => i.tipo === tf.tipo)
    if (tf.expansion) all = all.filter(i => i.expansion === tf.expansion)
    if (tf.prioridad) all = all.filter(i => i.prioridad === Number(tf.prioridad))
    if (tf.tiempo) {
      const ranges: Record<string, (v: number) => boolean> = {
        rapido: v => v <= 15,
        medio: v => v >= 16 && v <= 30,
        largo: v => v >= 31 && v <= 60,
        maraton: v => v > 60,
      }
      const fn = ranges[tf.tiempo]
      if (fn) all = all.filter(i => fn(i.tiempo_min || 0))
    }
    if (tf.estado === 'pendiente') all = all.filter(i => !i.hecho)
    else if (tf.estado === 'completada') all = all.filter(i => i.hecho)
    if (tf.clase) all = all.filter(i => i.clase === tf.clase)
    if (tf.faccion) all = all.filter(i => i.faccion === tf.faccion)
    if (tf.reino) all = all.filter(i => i.reino === tf.reino)
    if (tf.activo === 'si') all = all.filter(i => i.planeado_usar !== false)
    else if (tf.activo === 'no') all = all.filter(i => i.planeado_usar === false)
    if (tf.cooldown) all = all.filter(i => i.cooldown === tf.cooldown)
    if (tf.search) {
      const q = tf.search.toLowerCase()
      all = all.filter(i => i.nombre.toLowerCase().includes(q) || (i._char || '').toLowerCase().includes(q))
    }
    return all
  })

  let sortedItems = $derived.by(() => {
    if (!sortKey) return items
    const sorted = [...items].sort((a, b) => {
      const va = (a as any)[sortKey]
      const vb = (b as any)[sortKey]
      const cav = typeof va === 'string' ? va.toLowerCase() : va
      const cbv = typeof vb === 'string' ? vb.toLowerCase() : vb
      if (cav < cbv) return sortDir === 'asc' ? -1 : 1
      if (cav > cbv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  })

  type AriaSort = 'ascending' | 'descending' | 'none'

  function ariaSort(key: string): AriaSort {
    return sortKey === key ? (sortDir + 'ending') as AriaSort : 'none'
  }

  function toggleSort(key: string) {
    if (sortKey === key) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey = key
      sortDir = 'asc'
    }
  }

  function sortIcon(key: string): string {
    if (sortKey !== key) return ''
    return sortDir === 'asc' ? ' ▲' : ' ▼'
  }
</script>

  <div class="wow-panel tv-panel">
  <div class="wow-panel-header">
    <h3>Tabla Unificada</h3>
    <span class="text-sm text-muted">{items.length} ítems</span>
  </div>
    <div class="wow-panel-body tv-body">
      <div class="tv-filters">
        <span class="text-xs text-muted">Pers:</span>
        <select class="tv-select tv-select-80" bind:value={tf.personaje}>
          <option value="">Todos</option>
          {#each personajes as p}
            <option value={p.nombre}>{p.nombre}</option>
          {/each}
        </select>
        <span class="text-xs text-muted">Wb:</span>
        <select class="tv-select tv-select-70" bind:value={tf.warband}>
          <option value="">Todos</option>
          {#each warbands as w}
            <option value={w}>{w}</option>
          {/each}
        </select>
        <span class="text-xs text-muted">Tipo:</span>
        <select class="tv-select tv-select-70" bind:value={tf.tipo}>
          <option value="">Todos</option>
          <option value="weekly">Semanal</option>
          <option value="daily">Diaria</option>
          <option value="farm_libre">Farm</option>
          <option value="mision">Misión</option>
          <option value="achievement">Logro</option>
        </select>
        <span class="text-xs text-muted">Exp:</span>
        <select class="tv-select tv-select-65" bind:value={tf.expansion}>
          <option value="">Todas</option>
          <option value="tww">TWW</option>
          <option value="dragonflight">DF</option>
          <option value="shadowlands">SL</option>
          <option value="legion">Legion</option>
          <option value="bfa">BFA</option>
          <option value="draenor">Draenor</option>
          <option value="mop">MOP</option>
          <option value="cata">Cata</option>
          <option value="wotlk">WOTLK</option>
          <option value="midnight">Mid.</option>
          <option value="classic">Classic</option>
        </select>
        <span class="text-xs text-muted">Prio:</span>
        <select class="tv-select tv-select-50" bind:value={tf.prioridad}>
          <option value="">Todas</option>
          <option value="1">P1</option>
          <option value="2">P2</option>
          <option value="3">P3</option>
        </select>
        <span class="text-xs text-muted">Tpo:</span>
        <select class="tv-select tv-select-55" bind:value={tf.tiempo}>
          <option value="">Todos</option>
          <option value="rapido">≤15m</option>
          <option value="medio">16-30</option>
          <option value="largo">31-60</option>
          <option value="maraton">>60</option>
        </select>
        <span class="text-xs text-muted">Edo:</span>
        <select class="tv-select tv-select-65" bind:value={tf.estado}>
          <option value="">Todos</option>
          <option value="pendiente">Pend.</option>
          <option value="completada">Hecho</option>
        </select>
        <input type="text" placeholder="🔍" class="tv-search" bind:value={tf.search}>
      </div>
      <div class="tv-filters tv-filters-second">
        <span class="text-xs text-muted">Clase:</span>
        <select class="tv-select tv-select-80" bind:value={tf.clase}>
          <option value="">Todas</option>
          {#each clases as cl}
            <option value={cl}>{cl}</option>
          {/each}
        </select>
        <span class="text-xs text-muted">Facción:</span>
        <select class="tv-select tv-select-65" bind:value={tf.faccion}>
          <option value="">Todas</option>
          <option value="Horda">Horda</option>
          <option value="Alianza">Alianza</option>
        </select>
        <span class="text-xs text-muted">Reino:</span>
        <select class="tv-select tv-select-70" bind:value={tf.reino}>
          <option value="">Todos</option>
          {#each reinos as r}
            <option value={r}>{r}</option>
          {/each}
        </select>
        <span class="text-xs text-muted">Activo:</span>
        <select class="tv-select tv-select-60" bind:value={tf.activo}>
          <option value="">Todos</option>
          <option value="si">Sí</option>
          <option value="no">No</option>
        </select>
        <span class="text-xs text-muted">Cool:</span>
        <select class="tv-select tv-select-70" bind:value={tf.cooldown}>
          <option value="">Todos</option>
          <option value="weekly">Semanal</option>
          <option value="daily">Diaria</option>
          <option value="farm_libre">Farm</option>
        </select>
    </div>
    <div class="tv-table-wrap">
      <table class="task-table">
          <thead>
            <tr>
              <th class="tv-col-xs"></th>
              <th class="tv-col-personaje" role="columnheader" aria-sort={ariaSort('personaje')} onclick={() => toggleSort('personaje')}>Personaje{sortIcon('personaje')}</th>
              <th role="columnheader" aria-sort={ariaSort('nombre')} onclick={() => toggleSort('nombre')}>Nombre{sortIcon('nombre')}</th>
              <th class="tv-col-tipo" role="columnheader" aria-sort={ariaSort('tipo')} onclick={() => toggleSort('tipo')}>Tipo{sortIcon('tipo')}</th>
              <th class="tv-col-exp" role="columnheader" aria-sort={ariaSort('expansion')} onclick={() => toggleSort('expansion')}>Exp{sortIcon('expansion')}</th>
              <th class="tv-col-prio" role="columnheader" aria-sort={ariaSort('prioridad')} onclick={() => toggleSort('prioridad')}>Prio{sortIcon('prioridad')}</th>
              <th class="tv-col-tiempo" role="columnheader" aria-sort={ariaSort('tiempo_min')} onclick={() => toggleSort('tiempo_min')}>Tiempo{sortIcon('tiempo_min')}</th>
              <th class="tv-col-cooldown" role="columnheader" aria-sort={ariaSort('cooldown')} onclick={() => toggleSort('cooldown')}>Cool.{sortIcon('cooldown')}</th>
              <th role="columnheader" aria-sort={ariaSort('recompensa')} onclick={() => toggleSort('recompensa')}>Recompensa{sortIcon('recompensa')}</th>
              <th class="tv-col-estado" role="columnheader" aria-sort={ariaSort('hecho')} onclick={() => toggleSort('hecho')}>Estado{sortIcon('hecho')}</th>
              <th class="tv-col-acciones">Acciones</th>
            </tr>
          </thead>
        <tbody>
          {#if sortedItems.length === 0}
            <tr>
              <td colspan="11" class="tv-empty">No hay ítems. ¡Creá una tarea o misión!</td>
            </tr>
          {:else}
            {#each sortedItems as item}
              <tr class:done={item.hecho} class:tv-done={item.hecho}>
                <td>
                  <input
                    type="checkbox" class="task-check" checked={item.hecho}
                    onchange={() => {
                      if (item._origen === 'tarea') dataStore.toggleTarea(item._char, item.id)
                      else dataStore.toggleMision(item.id)
                    }}
                  />
                </td>
                <td class="tv-char" onclick={() => { uiStore.selectCharacter(item._char); uiStore.setView('warband') }}>
                  {item.personaje || '—'}
                </td>
                <td class="tv-name">
                  {item.nombre}
                  {#if item.tags?.length}
                    {#each item.tags as tag}
                      <span class="tag-badge">{tag}</span>
                    {/each}
                  {/if}
                </td>
                <td><span class="text-xs text-muted">{item.tipo}</span></td>
                <td><span class="tv-exp">{item.expansion || '—'}</span></td>
                <td><span class="text-xs text-muted">P{item.prioridad}</span></td>
                <td class="text-xs text-muted">{item.tiempo_min}min</td>
                <td class="text-xs text-muted">{item.cooldown}</td>
                <td class="text-xs">{#if item.recompensa}<span class="task-reward">{item.recompensa}</span>{/if}</td>
                <td>
                  <span class="text-xs" class:tv-pend={!item.hecho}>
                    {item.hecho ? '✓ Hecho' : '○ Pendiente'}
                  </span>
                </td>
                <td>
                  <div class="tv-actions">
                    <button onclick={() => {
                      if (item._origen === 'tarea' && openTaskEdit) openTaskEdit(item._char, item.id)
                      else if (openMissionEdit) openMissionEdit(item)
                    }} title="Editar" class="tv-btn">✏️</button>
                    <button onclick={() => {
                      if (item._origen === 'tarea') { if (confirm('¿Eliminar tarea?')) dataStore.deleteTarea(item._char, item.id) }
                      else { if (confirm('¿Eliminar misión?')) dataStore.deleteMision(item.id) }
                    }} title="Eliminar" class="tv-btn">🗑️</button>
                  </div>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>

<style>
  .tv-panel { margin-top: 4px; }
  .tv-body { padding: 6px 8px; }
  .tv-filters { display: flex; gap: 2px; flex-wrap: wrap; }
  .tv-filters-second { display: flex; gap: 2px; flex-wrap: wrap; margin-top: 2px; }
  .tv-select { font-size: 0.55rem; padding: 1px 3px; }
  .tv-select-80 { max-width: 80px; }
  .tv-select-70 { max-width: 70px; }
  .tv-select-65 { max-width: 65px; }
  .tv-select-60 { max-width: 60px; }
  .tv-select-55 { max-width: 55px; }
  .tv-select-50 { max-width: 50px; }
  .tv-search { font-size: 0.55rem; padding: 1px 3px; width: 60px; }
  .tv-table-wrap { margin-top: 4px; }
  .tv-col-xs { width: 24px; }
  .tv-col-personaje { width: 85px; cursor: pointer; user-select: none; }
  .tv-col-tipo { width: 48px; cursor: pointer; user-select: none; }
  .tv-col-exp { width: 38px; cursor: pointer; user-select: none; }
  .tv-col-prio { width: 32px; cursor: pointer; user-select: none; }
  .tv-col-tiempo { width: 40px; cursor: pointer; user-select: none; }
  .tv-col-cooldown { width: 42px; cursor: pointer; user-select: none; }
  .tv-col-estado { width: 52px; cursor: pointer; user-select: none; }
  .tv-col-acciones { width: 40px; }
  .tv-empty { text-align: center; padding: 16px; color: var(--text-muted); font-size: 0.75rem; }
  .tv-done { opacity: 0.55; }
  .tv-char { cursor: pointer; font-size: 0.7rem; }
  .tv-name { font-size: 0.7rem; cursor: pointer; }
  .tv-exp { font-size: 0.65rem; color: var(--gold); font-weight: 500; }
  .tv-pend { color: var(--gold); }
  .tv-actions { display: flex; gap: 2px; }
  .tv-btn { background: none; border: none; cursor: pointer; font-size: 0.6rem; padding: 0 2px; }
  th[role="columnheader"]:hover { color: var(--gold-dim); }
</style>
