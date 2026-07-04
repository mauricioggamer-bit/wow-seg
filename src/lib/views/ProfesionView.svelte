<script lang="ts">
  import { personajesStore, dataStore } from '../stores/data'
  import { currentWarband } from '../stores/ui'
  import { CLASS_MAP, PERS_CLASS_ICONS, PERS_CLASS_COLORS } from '../constants'
  import { PROFESIONES, profesionIcon, profesionNombre } from '../constants/profesiones'
  import type { ProfesionSlot } from '../types'

  let filterText = $state('')
  let showAll = $state(false)

  let activeWarband = $derived(showAll || $currentWarband === '' ? null : ($currentWarband || $personajesStore[0]?.warband || null))

  let scoped = $derived(
    activeWarband ? $personajesStore.filter(c => c.warband === activeWarband) : $personajesStore
  )

  let sorted = $derived(
    [...scoped]
      .filter(c => !filterText || c.nombre.toLowerCase().includes(filterText.toLowerCase()) || (c.clase || '').toLowerCase().includes(filterText.toLowerCase()) || (c.raza || '').toLowerCase().includes(filterText.toLowerCase()))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  )

  let profCounts = $derived.by(() => {
    const m: Record<string, number> = {}
    for (const c of scoped) {
      for (const slot of c.profesiones ?? []) {
        if (slot.id) m[slot.id] = (m[slot.id] || 0) + 1
      }
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  })

  function slotAt(c: { profesiones?: ProfesionSlot[] }, idx: number): ProfesionSlot {
    return c.profesiones?.[idx] ?? { id: '', nivel: 0 }
  }

  function saveSlot(charName: string, idx: number, patch: Partial<ProfesionSlot>) {
    const c = $personajesStore.find(p => p.nombre === charName)
    if (!c) return
    const base: ProfesionSlot[] = [
      { ...slotAt(c, 0) },
      { ...slotAt(c, 1) },
    ]
    base[idx] = { ...base[idx], ...patch }
    if (idx === 0 && base[1].id && base[1].id === patch.id) {
      base[1] = { id: '', nivel: 0 }
    } else if (idx === 1 && base[0].id && base[0].id === patch.id) {
      base[0] = { id: '', nivel: 0 }
    }
    dataStore.updatePersonaje(charName, { profesiones: base })
  }

  function otherId(c: { profesiones?: ProfesionSlot[] }, idx: number): string {
    return slotAt(c, idx === 0 ? 1 : 0).id
  }
</script>

<div class="profesion-panel">
  <div class="profesion-sidebar">
    <div class="profesion-sidebar-title">⚒️ Profesiones</div>
    <div class="profesion-count-list">
      {#each profCounts as [pid, count]}
        <div class="profesion-count-row">
          <span class="profesion-count-icon">{profesionIcon(pid)}</span>
          <span class="profesion-count-label">{profesionNombre(pid)}</span>
          <span class="profesion-count-num">{count}</span>
        </div>
      {/each}
      {#if profCounts.length === 0}
        <div class="profesion-count-empty">Sin profesiones asignadas</div>
      {/if}
    </div>
  </div>

  <div class="profesion-editor">
    <div class="profesion-editor-header">
      <span class="profesion-editor-title">⚒️ {activeWarband ? activeWarband : 'Todas'} ({sorted.length})</span>
      <label class="profesion-toggle"><input type="checkbox" bind:checked={showAll} /> Todas</label>
      <input class="profesion-search" type="text" placeholder="Filtrar personajes..." bind:value={filterText} />
    </div>
    <div class="profesion-list">
      {#each sorted as c (c.nombre)}
        {@const clsKey = CLASS_MAP[c.clase] || 'warrior'}
        {@const color = PERS_CLASS_COLORS[clsKey] || '#c9a84c'}
        <div class="profesion-row">
          <div class="profesion-row-head">
            <span class="profesion-row-icon">{PERS_CLASS_ICONS[clsKey] || '?'}</span>
            <span class="profesion-row-name" style="color:{color}">{c.nombre}</span>
            <span class="profesion-row-info">Nv.{c.nivel} · {c.raza}</span>
          </div>
          <div class="profesion-row-slots">
            {#each [0, 1] as idx}
              {@const slot = slotAt(c, idx)}
              {@const other = otherId(c, idx)}
              <div class="profesion-slot">
                <select
                  class="profesion-select"
                  value={slot.id}
                  onchange={(e) => saveSlot(c.nombre, idx, { id: (e.target as HTMLSelectElement).value })}
                >
                  <option value="">— Ninguna —</option>
                  {#each PROFESIONES as p}
                    <option value={p.id} disabled={p.id === other}>{p.icon} {p.nombre}</option>
                  {/each}
                </select>
                <div class="profesion-slot-level">
                  <span class="profesion-slot-icon">{profesionIcon(slot.id)}</span>
                  <input
                    class="profesion-level"
                    type="number"
                    min="0"
                    placeholder="Nv."
                    value={slot.nivel}
                    disabled={!slot.id}
                    oninput={(e) => saveSlot(c.nombre, idx, { nivel: parseInt((e.target as HTMLInputElement).value) || 0 })}
                  />
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
      {#if sorted.length === 0}
        <div class="profesion-empty">No hay personajes para mostrar.</div>
      {/if}
    </div>
  </div>
</div>

<style>
  .profesion-panel { display:flex; gap:10px; height:calc(100vh - 100px); margin-top:6px; border:1px solid var(--border-subtle); border-radius:var(--r-md); overflow:hidden; background:var(--bg-base); }
  .profesion-sidebar { width:220px; flex-shrink:0; display:flex; flex-direction:column; gap:8px; padding:10px; background:var(--bg-soft); border-right:1px solid var(--border-subtle); overflow-y:auto; }
  .profesion-sidebar-title { font-size:0.6rem; font-weight:700; color:var(--gold-light); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; padding-bottom:3px; border-bottom:1px solid var(--border-subtle); }
  .profesion-count-list { display:flex; flex-direction:column; gap:1px; }
  .profesion-count-row { display:flex; align-items:center; gap:4px; padding:2px 4px; font-size:0.5rem; color:var(--text-secondary); }
  .profesion-count-row:hover { background:var(--bg-raised); border-radius:2px; }
  .profesion-count-icon { font-size:0.65rem; width:16px; text-align:center; }
  .profesion-count-label { flex:1; }
  .profesion-count-num { color:var(--gold); font-weight:700; font-size:0.55rem; min-width:20px; text-align:right; }
  .profesion-count-empty { font-size:0.5rem; color:var(--text-dim); padding:4px; }
  .profesion-editor { flex:1; display:flex; flex-direction:column; overflow:hidden; }
  .profesion-editor-header { display:flex; align-items:center; gap:8px; padding:6px 10px; border-bottom:1px solid var(--border-subtle); flex-shrink:0; }
  .profesion-editor-title { font-size:0.6rem; color:var(--gold-light); font-weight:700; text-transform:uppercase; letter-spacing:1px; }
  .profesion-search { margin-left:auto; background:var(--input-bg); border:1px solid var(--border-subtle); border-radius:var(--r-sm); padding:3px 8px; color:var(--text-primary); font-size:0.5rem; font-family:var(--font-body); width:180px; }
  .profesion-search:focus { outline:none; border-color:var(--gold-dim); }
  .profesion-search::placeholder { color:var(--text-dim); }
  .profesion-toggle { display:flex; align-items:center; gap:3px; font-size:0.5rem; color:var(--text-secondary); cursor:pointer; margin-left:auto; }
  .profesion-toggle input { width:auto; }
  .profesion-list { flex:1; overflow-y:auto; padding:4px 8px; }
  .profesion-row { display:flex; flex-direction:column; padding:4px 6px; border-bottom:1px solid var(--border-subtle); transition:background var(--t-fast); }
  .profesion-row:hover { background:var(--bg-raised); border-radius:2px; }
  .profesion-row-head { display:flex; align-items:center; gap:6px; margin-bottom:3px; }
  .profesion-row-icon { font-size:0.7rem; width:20px; text-align:center; flex-shrink:0; }
  .profesion-row-name { font-size:0.55rem; font-weight:600; min-width:120px; }
  .profesion-row-info { font-size:0.45rem; color:var(--text-muted); }
  .profesion-row-slots { display:grid; grid-template-columns:1fr 1fr; gap:6px; padding-left:26px; }
  .profesion-slot { display:flex; flex-direction:column; gap:2px; }
  .profesion-select { background:var(--input-bg); border:1px solid var(--border-subtle); border-radius:var(--r-sm); padding:3px 6px; color:var(--text-primary); font-size:0.5rem; font-family:var(--font-body); }
  .profesion-select:focus { outline:none; border-color:var(--gold-dim); }
  .profesion-slot-level { display:flex; align-items:center; gap:4px; }
  .profesion-slot-icon { font-size:0.6rem; width:14px; text-align:center; flex-shrink:0; }
  .profesion-level { flex:1; background:var(--input-bg); border:1px solid var(--border-subtle); border-radius:var(--r-sm); padding:2px 6px; color:var(--text-primary); font-size:0.5rem; font-family:var(--font-body); min-width:0; }
  .profesion-level:focus { outline:none; border-color:var(--gold-dim); }
  .profesion-level:disabled { opacity:0.4; }
  .profesion-empty { padding:20px; text-align:center; font-size:0.55rem; color:var(--text-dim); }
  @media (max-width:768px) { .profesion-sidebar { display:none; } .profesion-row-slots { grid-template-columns:1fr; } .profesion-row-name { min-width:80px; } .profesion-row-info { display:none; } }
</style>
