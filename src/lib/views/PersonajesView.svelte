<script lang="ts">
  import { personajesStore } from '../stores/data'
  import { uiStore } from '../stores/ui'

  const CLASS_MAP: Record<string, string> = {
    'Guerrero': 'warrior', 'Paladín': 'paladin', 'Cazador': 'hunter',
    'Pícaro': 'rogue', 'Sacerdote': 'priest', 'DK': 'dk',
    'Chamán': 'shaman', 'Mago': 'mage', 'Brujo': 'warlock',
    'Monje': 'monk', 'Druida': 'druid', 'DH': 'dh', 'Evocadora': 'evoker',
    'Maga': 'mage',
  }

  const PERS_RACE_INFO: Record<string, { icon: string; type: string }> = {
    'Orco': { icon: '💀', type: 'Salvaje' },
    'Blood Elf': { icon: '🔮', type: 'Élfico' },
    'Tauren': { icon: '🐂', type: 'Bestial' },
    'Troll': { icon: '🗿', type: 'Tribal' },
    'Goblin': { icon: '💰', type: 'Pequeño' },
    "Mag'har": { icon: '🏹', type: 'Salvaje' },
    'Nightborne': { icon: '🌌', type: 'Élfico' },
    'Highmountain': { icon: '🦌', type: 'Bestial' },
    'Zandalari': { icon: '🏯', type: 'Tribal' },
    'Vulpera': { icon: '🦊', type: 'Nómada' },
    'Undead': { icon: '☠', type: 'No-muerto' },
    'Earthen': { icon: '🪨', type: 'Elemental' },
    'Pandaren': { icon: '🐼', type: 'Neutral' },
    'Human': { icon: '👤', type: 'Humanoide' },
    'Night Elf': { icon: '🌙', type: 'Élfico' },
    'Draenei': { icon: '✦', type: 'Místico' },
    'Gnome': { icon: '⚙', type: 'Pequeño' },
    'Dwarf': { icon: '⛏', type: 'Humanoide' },
    'Void Elf': { icon: '🌑', type: 'Élfico' },
    'Light Draenei': { icon: '✦', type: 'Luz' },
    'Haranir': { icon: '🌿', type: 'Místico' },
    'Dracthyr': { icon: '🐉', type: 'Dragón' },
  }

  const PERS_CLASS_ICONS: Record<string, string> = {
    warrior: '⚔', paladin: '⚜', hunter: '🏹', rogue: '🗡',
    priest: '✝', dk: '☠', shaman: '⚡', mage: '❄',
    warlock: '👁', monk: '☯', druid: '🌿', dh: '◈', evoker: '🐉',
  }

  const PERS_RACES_BY_COLUMN: Record<string, string[]> = {
    'alliance-trad': ['Human', 'Night Elf', 'Gnome', 'Dwarf', 'Draenei', 'Worgen', 'Pandaren', 'Dracthyr'],
    'alliance-allied': ['Void Elf', 'Light Draenei', 'Dark Iron Dwarf', 'Kul Tiran', 'Mechagnome', 'Earthen'],
    'horde-allied': ['Nightborne', 'Highmountain', "Mag'har", 'Zandalari', 'Vulpera', 'Earthen', 'Haranir'],
    'horde-trad': ['Orco', 'Undead', 'Tauren', 'Troll', 'Blood Elf', 'Goblin', 'Pandaren', 'Dracthyr'],
  }

  let factionFilter = $state('all')
  let levelFilter = $state('all')
  let selectedRace = $state<string | null>(null)
  let selectedClass = $state<string | null>(null)
  let selectedChar = $state<string | null>(null)

  let races = $derived.by(() => {
    const result: Array<{ key: string; label: string; items: Array<{ icon: string; nombre: string; type: string }> }> = []
    for (const [key, raceNames] of Object.entries(PERS_RACES_BY_COLUMN)) {
      if (factionFilter !== 'all') {
        if (factionFilter === 'Horda' && key.startsWith('alliance')) continue
        if (factionFilter === 'Alianza' && key.startsWith('horde')) continue
      }
      result.push({
        key,
        label: key.includes('trad') ? 'Tradicionales' : 'Aliadas',
        items: raceNames
          .filter(name => name in PERS_RACE_INFO)
          .map(name => ({ icon: PERS_RACE_INFO[name]?.icon || '', nombre: name, type: PERS_RACE_INFO[name]?.type || '' })),
      })
    }
    return result
  })

  let filteredChars = $derived.by(() => {
    let chars = $personajesStore
    if (selectedRace) chars = chars.filter(c => c.raza === selectedRace)
    if (selectedClass) chars = chars.filter(c => c.clase === selectedClass)
    if (factionFilter !== 'all') chars = chars.filter(c => c.faccion === factionFilter)
    if (levelFilter === 'bajo') chars = chars.filter(c => c.nivel < 30)
    else if (levelFilter === 'medio') chars = chars.filter(c => c.nivel >= 30 && c.nivel < 60)
    else if (levelFilter === 'alto') chars = chars.filter(c => c.nivel >= 60 && c.nivel < 80)
    else if (levelFilter === 'max') chars = chars.filter(c => c.nivel >= 80)
    return chars
  })

  let allClasses = $derived([...new Set($personajesStore.map(c => c.clase))].sort())

  $effect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (selectedChar) { selectedChar = null; uiStore.selectCharacter(null) }
        else if (selectedRace) selectedRace = null
        else if (selectedClass) selectedClass = null
        else uiStore.setView('warband')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
</script>

<div class="wow-panel">
  <div class="wow-panel-header">
    <h3>Personajes</h3>
    <button class="wow-btn wow-btn-sm" onclick={() => uiStore.setView('warband')}>◄ Volver</button>
  </div>
  <div class="wow-panel-body">
    <div class="filter-bar" style="margin-bottom:8px">
      <select bind:value={factionFilter} style="font-size:0.65rem">
        <option value="all">Todas las facciones</option>
        <option value="Horda">Horda</option>
        <option value="Alianza">Alianza</option>
      </select>
      <select bind:value={levelFilter} style="font-size:0.65rem">
        <option value="all">Todos los niveles</option>
        <option value="bajo">Bajo (&lt;30)</option>
        <option value="medio">Medio (30-59)</option>
        <option value="alto">Alto (60-79)</option>
        <option value="max">Max (80+)</option>
      </select>
    </div>

    <div class="race-grid">
      {#each races as group}
        <div class="race-column">
          <div class="race-column-header">{group.label}</div>
          {#each group.items as race}
            <button
              class="race-btn"
              class:selected={selectedRace === race.nombre}
              onclick={() => selectedRace = selectedRace === race.nombre ? null : race.nombre}
            >
              <span class="race-icon">{race.icon}</span>
              <span class="race-name">{race.nombre}</span>
              <span class="race-type">{race.type}</span>
            </button>
          {/each}
        </div>
      {/each}
    </div>

    <div class="class-bar" style="margin-top:8px">
      {#each allClasses as cl}
        <button
          class="class-btn"
          class:selected={selectedClass === cl}
          style="--class-color: var(--class-{CLASS_MAP[cl] || 'warrior'})"
          onclick={() => selectedClass = selectedClass === cl ? null : cl}
        >
          {PERS_CLASS_ICONS[CLASS_MAP[cl] || 'warrior']} {cl}
        </button>
      {/each}
    </div>

    {#if selectedRace || selectedClass}
      <div style="margin-top:8px">
        <h4 style="font-size:0.75rem;margin-bottom:4px">
          Personajes ({filteredChars.length})
        </h4>
        <div class="char-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
          {#each filteredChars as c}
            <button
              class="char-card"
              class:active={selectedChar === c.nombre}
              class:inactive={!c.activo}
              onclick={() => {
                selectedChar = c.nombre
                uiStore.selectCharacter(c.nombre)
                uiStore.setView('warband')
              }}
            >
              <div class="char-name" style="color: var(--class-{CLASS_MAP[c.clase] || 'warrior'})">
                {c.nombre}
              </div>
              <div class="char-info">
                <span class={c.faccion === 'Horda' ? 'faction-horda' : 'faction-alliance'}>{c.faccion}</span>
                <span>Nvl {c.nivel}</span>
                <span>{c.clase}</span>
              </div>
              <div class="char-tasks-bar" style="margin-top:4px">
                {#each c.tareas as t}
                  <span class="task-dot" class:done={t.hecho} class:pending={!t.hecho} title={t.nombre}></span>
                {/each}
                {#if c.tareas.length > 0}
                  <span class="text-xs text-muted" style="margin-left:4px">
                    {c.tareas.filter(t => t.hecho).length}/{c.tareas.length}
                  </span>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      </div>
    {:else}
      <div class="empty-state" style="margin-top:16px">
        <p>Seleccioná una raza y/o clase para filtrar personajes</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .race-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 4px;
  }
  .race-column-header {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    padding: 2px 4px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 2px;
  }
  .race-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding: 3px 6px;
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    cursor: pointer;
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 0.65rem;
    transition: all 0.15s;
    margin-bottom: 2px;
  }
  .race-btn:hover { border-color: var(--gold-dim); }
  .race-btn.selected { border-color: var(--gold); background: var(--card-active-bg); }
  .race-icon { font-size: 1rem; width: 24px; text-align: center; }
  .race-name { font-weight: 600; flex: 1; text-align: left; }
  .race-type { font-size: 0.5rem; color: var(--text-muted); }
  .class-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }
  .class-btn {
    padding: 3px 8px;
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    cursor: pointer;
    color: var(--class-color);
    font-family: var(--font-heading);
    font-size: 0.6rem;
    font-weight: 600;
    transition: all 0.15s;
  }
  .class-btn:hover { border-color: var(--class-color); }
  .class-btn.selected { border-color: var(--class-color); background: color-mix(in srgb, var(--class-color) 15%, transparent); }
  .char-card {
    text-align: left;
    width: 100%;
    font-family: inherit;
  }
</style>
