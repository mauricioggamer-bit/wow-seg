<script lang="ts">
  import { uiStore } from '../stores/ui'
  import { dataStore, personajesStore } from '../stores/data'

  let selected = $derived(
    $uiStore.selectedCharacter
      ? $personajesStore.find(p => p.nombre === $uiStore.selectedCharacter)
      : null
  )
</script>

{#if selected}
  <div class="wow-panel" id="charDetail">
    <div class="wow-panel-header">
      <h3>{selected.nombre}</h3>
      <button class="wow-btn wow-btn-icon" onclick={() => uiStore.selectCharacter(null)}>✕</button>
    </div>
    <div class="wow-panel-body">
      <div class="char-info">
        <span class={selected.faccion === 'Horda' ? 'faction-horda' : 'faction-alliance'}>
          {selected.faccion}
        </span>
        <span>{selected.clase}</span>
        <span>Nvl {selected.nivel}</span>
        <span>{selected.raza}</span>
      </div>
      <div class="task-list" style="margin-top:8px">
        {#each selected.tareas as tarea}
          <div class="task-item" class:dones={tarea.hecho}>
            <input
              type="checkbox"
              class="task-check"
              checked={tarea.hecho}
              onchange={() => dataStore.toggleTarea(selected.nombre, tarea.id)}
            />
            <div class="task-info">
              <div class="task-name">{tarea.nombre}</div>
              <div class="task-meta">
                <span class="task-priority priority-{tarea.prioridad}">P{tarea.prioridad}</span>
                <span>{tarea.tiempo_min}min</span>
                <span class="task-reward">{tarea.recompensa}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}
