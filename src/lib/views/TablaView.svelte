<script lang="ts">
  import { uiStore } from '../stores/ui'
  import { dataStore, personajesStore, misionesStore } from '../stores/data'
  import type { Personaje } from '../types'

  let tf = $state({
    personaje: '', warband: '', tipo: '', expansion: '', prioridad: '',
    tiempo: '', estado: '', search: '', clase: '', faccion: '', reino: '', activo: '', cooldown: '',
  })

  let personajes = $derived($personajesStore)
  let warbands = $derived([...new Set(personajes.map(p => p.warband))].sort())
  let clases = $derived([...new Set(personajes.map(c => c.clase))].sort())
  let reinos = $derived([...new Set(personajes.map(c => c.reino))].sort())

  let items = $derived.by(() => {
    const tareas: Array<Record<string, any>> = []
    for (const p of personajes) {
      for (const t of p.tareas) {
        tareas.push({ ...t, _origen: 'tarea', _char: p.nombre, personaje: p.nombre, clase: p.clase, faccion: p.faccion, reino: p.reino, warband: p.warband, nivel: p.nivel, activo: p.activo, estado: t.hecho ? 'completada' : 'pendiente' })
      }
    }
    const misiones = $misionesStore.map(m => ({
      ...m, _origen: 'mision' as const, _char: m.personaje || '',
      clase: '', faccion: '', reino: '', warband: '', nivel: 0, activo: true,
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
    if (tf.activo === 'si') all = all.filter(i => i.activo !== false)
    else if (tf.activo === 'no') all = all.filter(i => i.activo === false)
    if (tf.cooldown) all = all.filter(i => i.cooldown === tf.cooldown)
    if (tf.search) {
      const q = tf.search.toLowerCase()
      all = all.filter(i => i.nombre.toLowerCase().includes(q) || (i._char || '').toLowerCase().includes(q))
    }
    return all
  })
</script>

<div class="wow-panel" style="margin-top:4px">
  <div class="wow-panel-header">
    <h3>Tabla Unificada</h3>
    <span class="text-sm text-muted">{items.length} ítems</span>
  </div>
  <div class="wow-panel-body" style="padding:6px 8px">
    <div class="filter-bar" style="gap:2px;flex-wrap:wrap">
      <span class="text-xs text-muted">Pers:</span>
      <select bind:value={tf.personaje} style="font-size:0.55rem;padding:1px 3px;max-width:80px">
        <option value="">Todos</option>
        {#each personajes as p}
          <option value={p.nombre}>{p.nombre}</option>
        {/each}
      </select>
      <span class="text-xs text-muted">Wb:</span>
      <select bind:value={tf.warband} style="font-size:0.55rem;padding:1px 3px;max-width:70px">
        <option value="">Todos</option>
        {#each warbands as w}
          <option value={w}>{w}</option>
        {/each}
      </select>
      <span class="text-xs text-muted">Tipo:</span>
      <select bind:value={tf.tipo} style="font-size:0.55rem;padding:1px 3px;max-width:70px">
        <option value="">Todos</option>
        <option value="weekly">Semanal</option>
        <option value="daily">Diaria</option>
        <option value="farm_libre">Farm</option>
        <option value="mision">Misión</option>
        <option value="achievement">Logro</option>
      </select>
      <span class="text-xs text-muted">Exp:</span>
      <select bind:value={tf.expansion} style="font-size:0.55rem;padding:1px 3px;max-width:65px">
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
      <select bind:value={tf.prioridad} style="font-size:0.55rem;padding:1px 3px;max-width:50px">
        <option value="">Todas</option>
        <option value="1">P1</option>
        <option value="2">P2</option>
        <option value="3">P3</option>
      </select>
      <span class="text-xs text-muted">Tpo:</span>
      <select bind:value={tf.tiempo} style="font-size:0.55rem;padding:1px 3px;max-width:55px">
        <option value="">Todos</option>
        <option value="rapido">≤15m</option>
        <option value="medio">16-30</option>
        <option value="largo">31-60</option>
        <option value="maraton">>60</option>
      </select>
      <span class="text-xs text-muted">Edo:</span>
      <select bind:value={tf.estado} style="font-size:0.55rem;padding:1px 3px;max-width:65px">
        <option value="">Todos</option>
        <option value="pendiente">Pend.</option>
        <option value="completada">Hecho</option>
      </select>
      <input type="text" placeholder="🔍" bind:value={tf.search} style="font-size:0.55rem;padding:1px 3px;width:60px">
    </div>
    <div class="filter-bar" style="gap:2px;flex-wrap:wrap;margin-top:2px">
      <span class="text-xs text-muted">Clase:</span>
      <select bind:value={tf.clase} style="font-size:0.55rem;padding:1px 3px;max-width:80px">
        <option value="">Todas</option>
        {#each clases as cl}
          <option value={cl}>{cl}</option>
        {/each}
      </select>
      <span class="text-xs text-muted">Facción:</span>
      <select bind:value={tf.faccion} style="font-size:0.55rem;padding:1px 3px;max-width:65px">
        <option value="">Todas</option>
        <option value="Horda">Horda</option>
        <option value="Alianza">Alianza</option>
      </select>
      <span class="text-xs text-muted">Reino:</span>
      <select bind:value={tf.reino} style="font-size:0.55rem;padding:1px 3px;max-width:70px">
        <option value="">Todos</option>
        {#each reinos as r}
          <option value={r}>{r}</option>
        {/each}
      </select>
      <span class="text-xs text-muted">Activo:</span>
      <select bind:value={tf.activo} style="font-size:0.55rem;padding:1px 3px;max-width:60px">
        <option value="">Todos</option>
        <option value="si">Sí</option>
        <option value="no">No</option>
      </select>
      <span class="text-xs text-muted">Cool:</span>
      <select bind:value={tf.cooldown} style="font-size:0.55rem;padding:1px 3px;max-width:70px">
        <option value="">Todos</option>
        <option value="weekly">Semanal</option>
        <option value="daily">Diaria</option>
        <option value="farm_libre">Farm</option>
      </select>
    </div>
    <div class="task-table-wrap" style="margin-top:4px">
      <table class="task-table">
        <thead>
          <tr>
            <th style="width:24px"></th>
            <th style="width:85px">Personaje</th>
            <th>Nombre</th>
            <th style="width:48px">Tipo</th>
            <th style="width:38px">Exp</th>
            <th style="width:32px">Prio</th>
            <th style="width:40px">Tiempo</th>
            <th style="width:42px">Cool.</th>
            <th>Recompensa</th>
            <th style="width:52px">Estado</th>
          </tr>
        </thead>
        <tbody>
          {#if items.length === 0}
            <tr>
              <td colspan="10" style="text-align:center;padding:16px;color:var(--text-muted);font-size:0.75rem">
                No hay ítems. ¡Creá una tarea o misión!
              </td>
            </tr>
          {:else}
            {#each items as item}
              <tr class:done={item.hecho} style={item.hecho ? 'opacity:0.55' : ''}>
                <td>
                  <input
                    type="checkbox" class="task-check" checked={item.hecho}
                    onchange={() => {
                      if (item._origen === 'tarea') dataStore.toggleTarea(item._char, item.id)
                      else dataStore.toggleMision(item.id)
                    }}
                  />
                </td>
                <td class="char-cell" style="cursor:pointer;font-size:0.7rem"
                  onclick={() => { uiStore.selectCharacter(item._char); uiStore.setView('warband') }}>
                  {item.personaje || '—'}
                </td>
                <td style="font-size:0.7rem;cursor:pointer">
                  {item.nombre}
                  {#if item.tags?.length}
                    {#each item.tags as tag}
                      <span class="tag-badge">{tag}</span>
                    {/each}
                  {/if}
                </td>
                <td><span class="text-xs text-muted">{item.tipo}</span></td>
                <td><span class="text-xs" style="color:var(--gold);font-weight:500">{item.expansion || '—'}</span></td>
                <td><span class="text-xs text-muted">P{item.prioridad}</span></td>
                <td class="text-xs text-muted">{item.tiempo_min}min</td>
                <td class="text-xs text-muted">{item.cooldown}</td>
                <td class="text-xs">{#if item.recompensa}<span class="task-reward">{item.recompensa}</span>{/if}</td>
                <td>
                  <span class="text-xs" style={item.hecho ? '' : 'color:var(--gold)'}>
                    {item.hecho ? '✓ Hecho' : '○ Pendiente'}
                  </span>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>
