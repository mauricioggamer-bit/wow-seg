<script lang="ts">
  import { uiStore } from '../stores/ui'
  import { dataStore, personajesStore } from '../stores/data'
  import { clsClass } from '../constants'
  import { expNombre } from '../constants/wowContent'

  let { openCharEdit, openTaskEdit }: {
    openCharEdit?: (name: string) => void
    openTaskEdit?: (charName: string, taskId: string) => void
  } = $props()

  let selected = $derived(
    $uiStore.selectedCharacter
      ? $personajesStore.find(p => p.nombre === $uiStore.selectedCharacter)
      : null
  )

  function formatDate(iso: string | null): string {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  }
</script>

{#if selected}
  <div class="wow-panel" id="charDetail">
    <div class="wow-panel-header">
      <div>
        <h3>{selected.nombre}</h3>
        <span class="text-xs text-muted">{selected.clase} · {selected.raza} · Nvl {selected.nivel}</span>
      </div>
      <div class="flex gap-2 items-center">
        <span class="text-sm" class:text-muted={!selected.planeado_usar}>
          {selected.planeado_usar ? '● Activo' : '○ Inactivo'}
        </span>
        <button class="wow-btn wow-btn-sm wow-btn-primary" onclick={() => uiStore.openModal('MissionNew')}
          style="font-size:0.6rem;padding:2px 6px">+ Misión</button>
        <button onclick={() => openCharEdit?.(selected.nombre)} title="Editar personaje"
          style="background:none;border:none;cursor:pointer;font-size:0.7rem;padding:0 2px">✏️</button>
        <button class="wow-btn wow-btn-icon" onclick={() => uiStore.selectCharacter(null)} title="Cerrar">✕</button>
      </div>
    </div>
    <div class="wow-panel-body">
      <div class="flex flex-wrap gap-3 mb-2 text-sm">
        <span class={selected.faccion === 'Horda' ? 'faction-horda' : 'faction-alliance'}><strong>{selected.faccion}</strong></span>
        <span class="text-muted">{selected.reino}</span>
        <span class="text-gold">{(selected.tareas ?? []).find(t => t.esPrincipal)?.nombre || 'Sin misión principal'}</span>
      </div>

      {#each ['weekly', 'daily', 'farm_libre', 'none'] as cd}
        {@const tasks = selected.tareas.filter(t => t.cooldown === cd).slice().sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))}
        {#if tasks.length > 0}
          <h4 class="text-sm mb-1" style="color:{cd === 'weekly' ? 'var(--gold-light)' : 'var(--text-secondary)'};margin-top:6px">
            {cd === 'weekly' ? `Semanales (${tasks.filter(t => t.hecho).length}/${tasks.length})` : cd === 'daily' ? 'Diarias' : cd === 'farm_libre' ? 'Farm Libre' : 'Otras Tareas'}
          </h4>
          <div class="task-list mb-1">
            {#each tasks as t, i}
              {@const expId = t.contenidoExpansion || t.expansion}
              <div class="task-item" class:done={t.hecho} style="position:relative">
                <input type="checkbox" class="task-check" checked={t.hecho}
                  onchange={() => dataStore.toggleTarea(selected.nombre, t.id)} />
                <div class="task-info">
                  <div class="task-name" style="cursor:pointer">{t.nombre}</div>
                  <div class="task-meta">
                    {#if expId}
                      <span class="tag-badge">{expNombre(expId)}</span>
                    {/if}
                    <span class="text-xs text-muted">⏱ {t.orden ?? i}</span>
                    <span class="text-xs text-muted">P{t.prioridad}</span>
                    <span>{t.tiempo_min} min</span>
                    <span>{t.cooldown}</span>
                    {#if t.recompensa}
                      <span class="task-reward">🎁 {t.recompensa}</span>
                    {/if}
                    {#if t.ultimo_completado}
                      <span class="text-xs text-muted">✓ {formatDate(t.ultimo_completado)}</span>
                    {/if}
                  </div>
                </div>
                <div style="display:flex;gap:2px;align-items:center;flex-shrink:0">
                  <button onclick={() => dataStore.moveTarea(selected.nombre, t.id, -1)} title="Subir"
                    style="background:none;border:none;cursor:pointer;font-size:0.65rem;padding:0 2px">↑</button>
                  <button onclick={() => dataStore.moveTarea(selected.nombre, t.id, 1)} title="Bajar"
                    style="background:none;border:none;cursor:pointer;font-size:0.65rem;padding:0 2px">↓</button>
                  <button onclick={() => openTaskEdit?.(selected.nombre, t.id)} title="Editar"
                    style="background:none;border:none;cursor:pointer;font-size:0.65rem;padding:0 2px">✏️</button>
                  <button onclick={() => { if (confirm('¿Eliminar tarea?')) dataStore.deleteTarea(selected.nombre, t.id) }} title="Eliminar"
                    style="background:none;border:none;cursor:pointer;font-size:0.65rem;padding:0 2px">🗑️</button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      {/each}

      {#if selected.tareas.length === 0}
        <div class="empty-state"><p>Este personaje no tiene tareas</p></div>
      {/if}

      </div>
  </div>
{/if}

<style>
  .dp-name { cursor: pointer; }
</style>
