<script lang="ts">
  import { dataStore, personajesStore } from '../stores/data'
  import { uiStore } from '../stores/ui'

  let clases = $derived([...new Set($personajesStore.map(c => c.clase))].sort())
  let reinos = $derived([...new Set($personajesStore.map(c => c.reino))].sort())
</script>

<div class="filter-bar mb-2">
  <input
    type="text"
    placeholder="Buscar..."
    value={$uiStore.filters.searchText}
    oninput={(e) => uiStore.setFilter('searchText', e.currentTarget.value)}
  />
  <select
    value={$uiStore.filters.clase[0] || ''}
    onchange={(e) => uiStore.setFilter('clase', e.currentTarget.value ? [e.currentTarget.value] : [])}
  >
    <option value="">Todas las clases</option>
    {#each clases as cl}
      <option value={cl}>{cl}</option>
    {/each}
  </select>
  <select
    value={$uiStore.filters.reino}
    onchange={(e) => uiStore.setFilter('reino', e.currentTarget.value)}
  >
    <option value="">Todos los reinos</option>
    {#each reinos as r}
      <option value={r}>{r}</option>
    {/each}
  </select>
  <select
    value={$uiStore.filters.soloActivos ? 'activos' : 'todos'}
    onchange={(e) => uiStore.setFilter('soloActivos', e.currentTarget.value === 'activos')}
  >
    <option value="todos">Todos</option>
    <option value="activos">Activos</option>
    <option value="inactivos">Inactivos</option>
  </select>
</div>
