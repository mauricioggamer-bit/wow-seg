<script lang="ts">
  import { personajesStore } from '../stores/data'
  import { EXPANSIONS } from '../constants'

  let selectedExp = $state('tww')
  let expansion = $derived(EXPANSIONS.find(e => e.id === selectedExp))
  let charsInExp = $derived($personajesStore.filter(c => {
    return c.tareas.some(t => t.expansion === selectedExp) || false
  }))
</script>

<div class="wow-panel">
  <div class="wow-panel-header">
    <h3>Mapa de Expansiones</h3>
  </div>
  <div class="wow-panel-body">
    <div class="filter-bar" style="margin-bottom:8px">
      {#each EXPANSIONS as exp}
        <button
          class="wow-btn wow-btn-sm"
          class:wow-btn-primary={selectedExp === exp.id}
          style={selectedExp === exp.id ? `background:${exp.color};color:#fff;border:none` : ''}
          onclick={() => selectedExp = exp.id}
        >
          {exp.nombre}
        </button>
      {/each}
    </div>

    {#if expansion}
      <div class="map-container" style="border:1px solid var(--border-subtle);border-radius:var(--r-md);padding:16px;min-height:300px">
        <div style="text-align:center;margin-bottom:12px">
          <h4 style="color: {expansion.color}">{expansion.nombre}</h4>
          <p class="text-muted" style="font-size:0.7rem">{expansion.region}</p>
        </div>

        <div class="map-stats" style="display:flex;gap:8px;justify-content:center;margin-bottom:12px;flex-wrap:wrap">
          <span class="stat-item"><span class="stat-value">{charsInExp.length}</span> personajes</span>
          <span class="stat-item">
            <span class="stat-value">
              {charsInExp.reduce((s, c) => s + c.tareas.filter(t => t.expansion === selectedExp && t.hecho).length, 0)}
              /
              {charsInExp.reduce((s, c) => s + c.tareas.filter(t => t.expansion === selectedExp).length, 0)}
            </span> tareas
          </span>
        </div>

        <div class="char-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
          {#each charsInExp as c}
            <div class="char-card" class:inactive={!c.activo}>
              <div class="char-name">{c.nombre}</div>
              <div class="char-info">
                <span class={c.faccion === 'Horda' ? 'faction-horda' : 'faction-alliance'}>{c.faccion}</span>
                <span>Nvl {c.nivel}</span>
              </div>
              <div class="char-tasks-bar">
                {#each c.tareas.filter(t => t.expansion === selectedExp) as t}
                  <span class="task-dot" class:done={t.hecho} class:pending={!t.hecho} title={t.nombre}></span>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>
