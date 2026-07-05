<script lang="ts">
  import { personajesStore, dataStore } from '../stores/data'
  import { uiStore } from '../stores/ui'
  import { clsClass } from '../constants'

  let { openTaskEdit }: {
    openTaskEdit?: (charName: string, taskId: string) => void
  } = $props()

  let allTasksData = $derived.by(() => {
    const wb = $uiStore.currentWarband
    if (!wb) return null
    const chars = $personajesStore.filter(c => c.warband === wb && c.planeado_usar)
    const tasks = chars.flatMap(c => c.tareas.map(t => ({ ...t, personaje: c.nombre, clase: c.clase, raza: c.raza, nivel: c.nivel })))
    const grouped: Record<string, typeof tasks> = {}
    for (const t of tasks) {
      if (!grouped[t.personaje]) grouped[t.personaje] = []
      grouped[t.personaje].push(t)
    }
    for (const k of Object.keys(grouped)) {
      grouped[k].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    }
    const done = tasks.filter(t => t.hecho).length
    const totalMin = tasks.reduce((s, t) => s + (t.tiempo_min || 0), 0)
    return { tasks, grouped, done, totalMin }
  })
</script>

{#if allTasksData}
  <div class="wow-panel">
    <div class="wow-panel-header">
      <h2>{$uiStore.currentWarband}</h2>
      <span class="text-sm text-muted">{allTasksData.done}/{allTasksData.tasks.length} · {allTasksData.totalMin}min</span>
    </div>
    <div class="wow-panel-body" style="padding:6px 10px">
      {#each Object.entries(allTasksData.grouped) as [pName, tasks]}
        {@const d = tasks.filter(t => t.hecho).length}
        {@const c = $personajesStore.find(x => x.nombre === pName)}
        <div style="margin-bottom:4px">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 4px;cursor:pointer"
            onclick={() => uiStore.selectCharacter(pName)}>
            <span class={c ? clsClass(c.clase) : ''} style="font-weight:600;font-size:0.75rem">{pName}</span>
            <span class="text-xs text-muted">{d}/{tasks.length}</span>
          </div>
          <div class="task-list" style="padding-left:4px;gap:1px">
            {#each tasks as t}
              <div class="task-item" class:done={t.hecho} style="padding:4px 6px;position:relative">
                <input type="checkbox" class="task-check" checked={t.hecho}
                  onchange={() => dataStore.toggleTarea(t.personaje, t.id)} style="width:14px;height:14px" />
                <div class="task-info">
                  <div class="task-name" style="font-size:0.75rem">{t.nombre}</div>
                  <div class="task-meta" style="font-size:0.6rem">
                    <span class="text-xs text-muted">⏱{t.orden ?? 0}</span>
                    <span class="text-xs text-muted">P{t.prioridad}</span>
                    <span>{t.tiempo_min}min</span>
                    <span>{t.cooldown}</span>
                    {#if t.recompensa}
                      <span class="task-reward">🎁 {t.recompensa}</span>
                    {/if}
                  </div>
                </div>
                <div style="display:flex;gap:2px;align-items:center;flex-shrink:0">
                  <button onclick={() => openTaskEdit?.(t.personaje, t.id)} title="Editar"
                    style="background:none;border:none;cursor:pointer;font-size:0.65rem;padding:0 2px">✏️</button>
                  <button onclick={() => { if (confirm('¿Eliminar tarea?')) dataStore.deleteTarea(t.personaje, t.id) }} title="Eliminar"
                    style="background:none;border:none;cursor:pointer;font-size:0.65rem;padding:0 2px">🗑️</button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
{:else}
  <div class="wow-panel">
    <div class="wow-panel-body">
      <div class="empty-state">
        <div style="font-size:2rem;margin-bottom:8px">🐉</div>
        <p>Seleccioná un personaje para ver sus tareas</p>
      </div>
    </div>
  </div>
{/if}
