<script lang="ts">
  import { dataStore, personajesStore } from '../stores/data'
  import { uiStore } from '../stores/ui'

  let filtered = $derived.by(() => {
    let chars = $personajesStore
    const f = $uiStore.filters
    if (f.searchText) {
      const q = f.searchText.toLowerCase()
      chars = chars.filter(c => c.nombre.toLowerCase().includes(q))
    }
    if (f.clase.length > 0) chars = chars.filter(c => f.clase.includes(c.clase))
    if (f.reino) chars = chars.filter(c => c.reino === f.reino)
    if (f.soloActivos) chars = chars.filter(c => c.activo)
    return chars
  })
</script>

<div class="wow-panel">
  <div class="wow-panel-body">
    {#if filtered.length === 0}
      <div class="empty-state"><p>No se encontraron personajes</p></div>
    {:else}
      <div class="char-grid">
        {#each filtered as c (c.nombre)}
          <button
            type="button"
            class="char-card"
            class:active={$uiStore.selectedCharacter === c.nombre}
            class:inactive={!c.activo}
            onclick={() => uiStore.selectCharacter(c.nombre)}
          >
            <div style="display:flex;align-items:flex-start;justify-content:space-between">
              <div style="flex:1;cursor:pointer">
                <div class="char-name class-{c.clase}">{c.nombre}</div>
                <div class="char-info">
                  <span class={c.faccion === 'Horda' ? 'faction-horda' : 'faction-alliance'}>
                    {c.faccion}
                  </span>
                  <span>Nvl {c.nivel}</span>
                  <span>{c.clase}</span>
                </div>
              </div>
            </div>
            {#if c.tareas.length > 0}
              <div class="char-tasks-bar">
                {#each c.tareas as t}
                  <span class="task-dot" class:done={t.hecho} class:pending={!t.hecho} title={t.nombre}></span>
                {/each}
                <span class="text-xs text-muted" style="margin-left:4px">
                  {c.tareas.filter(t => t.hecho).length}/{c.tareas.length}
                </span>
              </div>
            {:else}
              <div class="text-xs text-muted mt-1">Sin tareas</div>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .char-card {
    text-align: left;
    width: 100%;
    font-family: inherit;
  }
</style>
