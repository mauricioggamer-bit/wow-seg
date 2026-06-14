<script lang="ts">
  import { dataStore, statsStore } from '../stores/data'
  import { preferencesStore } from '../stores/preferences'
  import { authStore } from '../stores/auth'
  import { gistStore } from '../stores/gist'
  import { uiStore } from '../stores/ui'

  const fontSizes = [
    { value: 'small', label: 'S' },
    { value: 'medium', label: 'M' },
    { value: 'large', label: 'L' },
    { value: 'xlarge', label: 'XL' },
  ]
</script>

<div class="header-left">
  <div class="header-logo">WoW Seg</div>
  <span class="header-subtitle">Warband Tracker</span>
  <span class="stats-bar">
    <span class="stat-item">
      <span class="stat-value">{$statsStore.total}</span> personajes
    </span>
    <span class="stat-item">
      <span class="stat-value">{$statsStore.activos}</span> activos
    </span>
    <span class="stat-item">
      <span class="stat-value">{$statsStore.warbands}</span> warbands
    </span>
    <span class="stat-item">
      <span class="stat-value">{$statsStore.weeklyDone}/{$statsStore.weeklyTotal}</span> semanales
    </span>
    <span class="stat-item">
      <span class="stat-value">{$statsStore.dailyDone}/{$statsStore.dailyTotal}</span> diarias
    </span>
    <span class="stat-item" style="color: {$statsStore.weeklyPct >= 50 ? 'var(--health-green)' : $statsStore.weeklyPct >= 25 ? 'var(--orange)' : 'var(--red)'}">
      {$statsStore.weeklyPct}%
    </span>
  </span>
</div>
<div class="header-actions">
  <button class="wow-btn wow-btn-sm" onclick={() => uiStore.openModal('ImportExportModal')} title="Importar/Exportar">
    💾
  </button>
  <button class="wow-btn wow-btn-sm" onclick={() => uiStore.openModal('GistModal')} title="Sincronizar Gist">
    ☁
  </button>
  <button class="wow-btn wow-btn-sm" onclick={() => uiStore.openModal('WarbandModal')} title="Gestionar Warbands">
    📁
  </button>
  <button class="wow-btn wow-btn-sm" onclick={() => uiStore.openModal('MissionModal')} title="Gestionar Misiones">
    📋
  </button>
  <button class="theme-toggle" onclick={preferencesStore.toggleTheme}>
    <span class="theme-toggle__icon"></span>
    <span class="theme-toggle__label">{$preferencesStore.theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
  </button>
  <select class="font-size-select" value={$preferencesStore.fontSize}
    onchange={(e) => preferencesStore.setFontSize(e.currentTarget.value as any)}>
    {#each fontSizes as fs}
      <option value={fs.value}>{fs.label}</option>
    {/each}
  </select>
  <button class="wow-btn wow-btn-sm wow-btn-danger" onclick={authStore.logout} title="Cerrar sesión">
    Salir
  </button>
</div>
