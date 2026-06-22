<script lang="ts">
  import { personajesStore, dataStore } from '../stores/data'
  import { uiStore, currentWarband } from '../stores/ui'
  import { clsClass, CLASS_MAP, PERS_CLASS_ICONS, PERS_CLASS_COLORS } from '../constants'

  let { openTaskEdit, openTaskNew }: {
    openTaskEdit?: (charName: string, taskId: string) => void
    openTaskNew?: (charName: string) => void
  } = $props()

  let filterText = $state('')
  let showAll = $state(false)

  let activeWarband = $derived(showAll ? null : ($currentWarband || $personajesStore[0]?.warband || null))

  let scoped = $derived(
    activeWarband ? $personajesStore.filter(c => c.warband === activeWarband) : $personajesStore
  )

  let sorted = $derived(
    [...scoped]
      .filter(c => !filterText || c.nombre.toLowerCase().includes(filterText.toLowerCase()) || (c.clase || '').toLowerCase().includes(filterText.toLowerCase()) || (c.raza || '').toLowerCase().includes(filterText.toLowerCase()))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  )

  function sortedTasks(tareas: any[]) {
    return [...tareas].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
  }

  const CD_LABELS: Record<string, string> = { weekly: 'S', daily: 'D', none: 'F' }
  const CD_COLORS: Record<string, string> = { weekly: 'var(--gold-light)', daily: '#4fc3f7', none: '#888' }
</script>

<div class="tareas-panel">
  <div class="tareas-header">
    <span class="tareas-title">✅ {activeWarband ? activeWarband : 'Todas'} ({sorted.length})</span>
    <label class="tareas-toggle"><input type="checkbox" bind:checked={showAll} /> Todas</label>
    <input class="tareas-search" type="text" placeholder="Filtrar personajes..." bind:value={filterText} />
  </div>
  <div class="tareas-list">
    {#each sorted as c (c.nombre)}
      {@const clsKey = CLASS_MAP[c.clase] || 'warrior'}
      {@const color = PERS_CLASS_COLORS[clsKey] || '#c9a84c'}
      {@const tasks = sortedTasks(c.tareas)}
      <div class="tareas-row">
        <div class="tareas-char">
          <span class="tareas-char-icon">{PERS_CLASS_ICONS[clsKey] || '?'}</span>
          <span class="tareas-char-name" style="color:{color}">{c.nombre}</span>
          <span class="tareas-char-info">Nv.{c.nivel} · {c.raza}</span>
        </div>
        <div class="tareas-tasks">
          {#if tasks.length > 0}
            {#each tasks as t}
              <div class="task-chip" class:done={t.hecho}
                style="--cd-color:{CD_COLORS[t.cooldown] || '#888'}"
                title={`${t.nombre} · P${t.prioridad} · ${t.tiempo_min}min · ${t.cooldown}`}>
                <span class="task-chip-ord">{t.orden ?? 0}</span>
                <input type="checkbox" class="task-check"
                  checked={t.hecho}
                  onchange={() => dataStore.toggleTarea(c.nombre, t.id)} />
                <span class="task-chip-cd">{CD_LABELS[t.cooldown] || '?'}</span>
                <span class="task-chip-name">{t.nombre}</span>
                <button class="task-chip-btn" title="Editar"
                  onclick={() => openTaskEdit?.(c.nombre, t.id)}>✏️</button>
                <button class="task-chip-btn" title="Quitar"
                  onclick={() => { if (confirm('¿Eliminar tarea?')) dataStore.deleteTarea(c.nombre, t.id) }}>🗑️</button>
              </div>
            {/each}
          {:else}
            <span class="tareas-empty">Sin tareas</span>
          {/if}
          <button class="task-chip task-chip-add" title="Asignar tarea"
            onclick={() => openTaskNew?.(c.nombre)}>+ Asignar</button>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .tareas-panel { display:flex; flex-direction:column; height:calc(100vh - 100px); margin-top:6px; border:1px solid var(--border-subtle); border-radius:var(--r-md); overflow:hidden; background:var(--bg-base); }
  .tareas-header { display:flex; align-items:center; gap:8px; padding:6px 10px; border-bottom:1px solid var(--border-subtle); flex-shrink:0; }
  .tareas-title { font-size:0.6rem; color:var(--gold-light); font-weight:700; text-transform:uppercase; letter-spacing:1px; }
  .tareas-toggle { display:flex; align-items:center; gap:3px; font-size:0.5rem; color:var(--text-secondary); cursor:pointer; margin-left:auto; }
  .tareas-toggle input { width:auto; }
  .tareas-search { background:var(--input-bg); border:1px solid var(--border-subtle); border-radius:var(--r-sm); padding:3px 8px; color:var(--text-primary); font-size:0.5rem; font-family:var(--font-body); width:180px; }
  .tareas-search:focus { outline:none; border-color:var(--gold-dim); }
  .tareas-search::placeholder { color:var(--text-dim); }
  .tareas-list { flex:1; overflow-y:auto; padding:4px 8px; }
  .tareas-row { display:flex; align-items:flex-start; gap:8px; padding:6px; border-bottom:1px solid var(--border-subtle); transition:background var(--t-fast); }
  .tareas-row:hover { background:var(--bg-raised); border-radius:2px; }
  .tareas-char { display:flex; align-items:center; gap:4px; flex-shrink:0; min-width:160px; }
  .tareas-char-icon { font-size:0.7rem; width:20px; text-align:center; flex-shrink:0; }
  .tareas-char-name { font-size:0.55rem; font-weight:600; }
  .tareas-char-info { font-size:0.45rem; color:var(--text-muted); }
  .tareas-tasks { display:flex; flex-wrap:wrap; gap:4px; align-items:center; flex:1; }
  .tareas-empty { font-size:0.45rem; color:var(--text-dim); font-style:italic; }
  .task-chip { display:inline-flex; align-items:center; gap:2px; padding:2px 4px; border-radius:var(--r-sm); border:1px solid var(--border-subtle); background:var(--bg-soft); font-size:0.48rem; transition:all var(--t-fast); }
  .task-chip.done { opacity:0.5; }
  .task-chip.done .task-chip-name { text-decoration:line-through; }
  .task-chip .task-check { width:11px; height:11px; flex-shrink:0; }
  .task-chip-ord { font-size:0.4rem; font-weight:700; color:var(--text-dim); min-width:10px; text-align:center; flex-shrink:0; }
  .task-chip-cd { font-size:0.4rem; font-weight:700; color:var(--cd-color); background:rgba(0,0,0,0.3); border-radius:2px; padding:0 2px; min-width:10px; text-align:center; flex-shrink:0; }
  .task-chip-name { font-size:0.48rem; color:var(--text-secondary); }
  .task-chip-btn { background:none; border:none; cursor:pointer; font-size:0.45rem; padding:0 1px; opacity:0.6; transition:opacity var(--t-fast); }
  .task-chip-btn:hover { opacity:1; }
  .task-chip-add { color:var(--gold-light); border-style:dashed; border-color:var(--gold-dim); cursor:pointer; font-size:0.5rem; font-weight:600; padding:2px 8px; }
  .task-chip-add:hover { background:var(--bg-raised); border-color:var(--gold); color:var(--gold); }
  @media (max-width:768px) { .tareas-char { min-width:90px; } .tareas-char-info { display:none; } }
</style>