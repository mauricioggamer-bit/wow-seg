<script lang="ts">
  import { levelingStore } from '../../stores/leveling'
  import type { CustomBuff } from '../../types'

  let config = $derived($levelingStore)

  let newBuffName = $state('')
  let newBuffPct = $state(10)
  let newBuffTarget = $state<'monsters' | 'reward' | 'both'>('both')

  const buffOptions = [0, 5, 10, 15, 20, 25, 30]

  function updateField<K extends keyof typeof config>(key: K, value: (typeof config)[K]) {
    levelingStore.updateConfig({ [key]: value } as Partial<typeof config>)
  }

  function addBuff() {
    if (!newBuffName.trim()) return
    const buff: CustomBuff = {
      id: 'buff_' + Date.now(),
      name: newBuffName.trim(),
      percentage: newBuffPct,
      target: newBuffTarget,
    }
    levelingStore.addCustomBuff(buff)
    newBuffName = ''
    newBuffPct = 10
  }

  function removeBuff(id: string) {
    levelingStore.removeCustomBuff(id)
  }

  function updateBuff(id: string, pct: number) {
    levelingStore.updateCustomBuff(id, { percentage: pct })
  }
</script>

<div class="lvl-config">
  <div class="lvl-config-section">
    <div class="lvl-config-title">XP por Dungeon</div>
    <div class="lvl-config-note">Recompensa timewalking: automática según nivel del personaje</div>
    <div class="lvl-config-row">
      <label>
        <span>XP Monstruos @80 (escala por nivel)</span>
        <input type="number" value={config.xpMonstruos} min="0"
          oninput={(e) => updateField('xpMonstruos', parseInt(e.currentTarget.value) || 0)} />
      </label>
    </div>
  </div>

  <div class="lvl-config-section">
    <div class="lvl-config-title">Duración promedio</div>
    <label class="lvl-config-inline">
      <input type="number" value={config.duracionDungeon} min="1" max="120"
        oninput={(e) => updateField('duracionDungeon', parseInt(e.currentTarget.value) || 18)} />
      <span class="lvl-config-unit">minutos</span>
    </label>
  </div>

  <div class="lvl-config-section">
    <div class="lvl-config-title">Warband Mentor 0-80</div>
    <select onchange={(e) => updateField('warbandMentor080', parseInt(e.currentTarget.value))}>
      {#each buffOptions as opt}
        <option value={opt} selected={config.warbandMentor080 === opt}>{opt}%</option>
      {/each}
    </select>
  </div>

  <div class="lvl-config-section">
    <div class="lvl-config-title">Knowledge of Timeways</div>
    <select onchange={(e) => updateField('knowledgeOfTimeways', parseInt(e.currentTarget.value))}>
      {#each buffOptions as opt}
        <option value={opt} selected={config.knowledgeOfTimeways === opt}>{opt}%</option>
      {/each}
    </select>
  </div>

  <div class="lvl-config-section">
    <div class="lvl-config-title">War Mode</div>
    <div class="lvl-config-row">
      <label class="lvl-checkbox">
        <input type="checkbox" checked={config.warMode}
          onchange={(e) => updateField('warMode', e.currentTarget.checked)} />
        <span>Activado (+15%)</span>
      </label>
      {#if config.warMode}
        <select onchange={(e) => updateField('warModeTarget', e.currentTarget.value as 'monsters' | 'reward' | 'both')}>
          <option value="both" selected={config.warModeTarget === 'both'}>Monstruos + Recompensa</option>
          <option value="monsters" selected={config.warModeTarget === 'monsters'}>Solo Monstruos</option>
          <option value="reward" selected={config.warModeTarget === 'reward'}>Solo Recompensa</option>
        </select>
      {/if}
    </div>
  </div>

  <div class="lvl-config-section">
    <div class="lvl-config-title">Buffs personalizados</div>
    <div class="lvl-buff-add">
      <input type="text" placeholder="Nombre (ej: Darkmoon Faire)" bind:value={newBuffName} />
      <input type="number" value={newBuffPct} min="1" max="100" style="width:60px"
        oninput={(e) => newBuffPct = parseInt(e.currentTarget.value) || 0} />
      <span class="lvl-pct">%</span>
      <select bind:value={newBuffTarget}>
        <option value="both">Ambos</option>
        <option value="monsters">Monstruos</option>
        <option value="reward">Recompensa</option>
      </select>
      <button class="wow-btn wow-btn-sm" onclick={addBuff}>+ Add</button>
    </div>
    {#each config.customBuffs as buff (buff.id)}
      <div class="lvl-buff-item">
        <span class="lvl-buff-name">{buff.name}</span>
        <input type="range" min="0" max="100" value={buff.percentage}
          oninput={(e) => updateBuff(buff.id, parseInt(e.currentTarget.value))} />
        <span class="lvl-buff-pct">{buff.percentage}%</span>
        <span class="lvl-buff-target">{buff.target}</span>
        <button class="lvl-buff-remove" onclick={() => removeBuff(buff.id)}>✕</button>
      </div>
    {/each}
  </div>
</div>

<style>
  .lvl-config {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    background: var(--bg-soft, rgba(0,0,0,0.3));
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-md);
    font-size: 0.6rem;
  }
  .lvl-config-section {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border-subtle);
  }
  .lvl-config-section:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .lvl-config-title {
    font-family: var(--font-heading);
    font-size: 0.55rem;
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .lvl-config-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    flex-wrap: wrap;
  }
  .lvl-config-row label, .lvl-config-inline {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .lvl-config-row span, .lvl-config-inline span {
    font-size: 0.5rem;
    color: var(--text-muted);
  }
  .lvl-config input[type="number"], .lvl-config select {
    background: var(--input-bg);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 2px 4px;
    font-size: 0.6rem;
    color: var(--text-primary);
    width: 100px;
  }
  .lvl-config-note {
    font-size: 0.45rem;
    color: var(--text-dim);
    font-style: italic;
  }
  .lvl-config-inline input {
    width: 60px;
  }
  .lvl-config-unit {
    font-size: 0.5rem !important;
    color: var(--text-muted);
  }
  .lvl-checkbox {
    display: flex !important;
    flex-direction: row !important;
    align-items: center;
    gap: 4px;
  }
  .lvl-buff-add {
    display: flex;
    align-items: center;
    gap: 3px;
    flex-wrap: wrap;
  }
  .lvl-buff-add input[type="text"] {
    background: var(--input-bg);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 2px 4px;
    font-size: 0.6rem;
    color: var(--text-primary);
    width: 140px;
  }
  .lvl-buff-add input[type="number"] {
    width: 50px !important;
  }
  .lvl-pct {
    font-size: 0.55rem;
    color: var(--text-muted);
  }
  .lvl-buff-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 4px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: var(--r-sm);
    margin-top: 2px;
  }
  .lvl-buff-name {
    flex: 1;
    font-size: 0.55rem;
    color: var(--text-secondary);
  }
  .lvl-buff-item input[type="range"] {
    width: 60px;
  }
  .lvl-buff-pct {
    font-size: 0.5rem;
    color: var(--gold);
    width: 28px;
    text-align: right;
  }
  .lvl-buff-target {
    font-size: 0.45rem;
    color: var(--text-dim);
    text-transform: uppercase;
  }
  .lvl-buff-remove {
    background: none;
    border: none;
    color: var(--horde, #c5365a);
    cursor: pointer;
    font-size: 0.6rem;
    padding: 0 2px;
  }
</style>