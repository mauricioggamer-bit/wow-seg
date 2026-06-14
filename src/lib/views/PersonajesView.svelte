<script lang="ts">
  import { personajesStore, dataStore } from '../stores/data'
  import { uiStore } from '../stores/ui'
  import { CLASS_MAP, PERS_RACE_INFO, PERS_CLASS_ICONS, PERS_CLASS_COLORS, PERS_RACES_BY_COLUMN } from '../constants'

  let { openCharEdit }: { openCharEdit?: (name: string) => void } = $props()

  let persSelectedRace = $state<string | null>(null)
  let persSelectedFaction = $state<string | null>(null)
  let persSelectedClass = $state<string | null>(null)
  let persFactionFilter = $state('all')
  let persLevelFilter = $state('all')
  let persSelectedChar = $state<string | null>(null)

  let classEntries = $derived.by(() => {
    const deduped: Array<{ label: string; key: string }> = []
    const seen = new Set<string>()
    for (const [label, key] of Object.entries(CLASS_MAP)) {
      if (!seen.has(key)) { seen.add(key); deduped.push({ label, key }) }
    }
    return deduped
  })

  let levelRanges = ['all', '0-10', '10-20', '20-30', '30-40', '40-50', '50-60', '60-70', '70-80', '80-90']

  let filteredChars = $derived.by(() => {
    let chars = $personajesStore
    if (persFactionFilter === 'alliance') chars = chars.filter(c => c.faccion === 'Alianza')
    else if (persFactionFilter === 'horde') chars = chars.filter(c => c.faccion === 'Horda')
    if (persSelectedRace) chars = chars.filter(c => c.raza === persSelectedRace)
    if (persSelectedClass) {
      const revMap: Record<string, string> = {}
      for (const [k, v] of Object.entries(CLASS_MAP)) revMap[v] = k
      const targetClase = revMap[persSelectedClass]
      chars = chars.filter(c => (CLASS_MAP[c.clase] || '') === persSelectedClass || c.clase === targetClase)
    }
    if (persLevelFilter !== 'all') {
      const parts = persLevelFilter.split('-').map(Number)
      if (parts.length === 2) {
        const [min, max] = parts
        chars = chars.filter(c => c.nivel >= min && c.nivel <= max)
      }
    }
    return chars
  })

  let columnDefs = [
    { id: 'alliance-trad', label: 'ALIANZA', subtitle: 'TRADICIONALES', faction: 'alliance', cls: 'a' },
    { id: 'alliance-allied', label: 'ALIANZA', subtitle: 'ALIADAS', faction: 'alliance', cls: 'a-inner' },
    { id: 'horde-allied', label: 'HORDA', subtitle: 'ALIADAS', faction: 'horde', cls: 'h-inner' },
    { id: 'horde-trad', label: 'HORDA', subtitle: 'TRADICIONALES', faction: 'horde', cls: 'h' },
  ]

  $effect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        const modal = document.querySelector('.modal-overlay.open')
        if (modal) return
        if (persSelectedRace || persSelectedClass || persSelectedChar) resetPersAll()
        else uiStore.setView('warband')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function isRaceSelected(race: string, faction: string): boolean {
    return persSelectedRace === race && persSelectedFaction === faction
  }

  function togglePersRace(race: string, faction: string) {
    if (persSelectedRace === race && persSelectedFaction === faction) {
      persSelectedRace = null
      persSelectedFaction = null
    } else {
      persSelectedRace = race
      persSelectedFaction = faction
      persFactionFilter = faction === 'alliance' ? 'alliance' : 'horde'
    }
    persSelectedChar = null
  }

  function togglePersClass(key: string) {
    persSelectedClass = persSelectedClass === key ? null : key
    persSelectedChar = null
  }

  function selectPersChar(charName: string) {
    persSelectedChar = persSelectedChar === charName ? null : charName
  }

  function resetPersAll() {
    persSelectedRace = null
    persSelectedFaction = null
    persSelectedClass = null
    persFactionFilter = 'all'
    persLevelFilter = 'all'
    persSelectedChar = null
  }

  function closePersonajes() {
    resetPersAll()
    uiStore.setView('warband')
  }

  function editSelectedPersonaje() {
    if (!persSelectedChar) return
    uiStore.openModal('CharEdit')
    // openCharEdit will be called via the dialog, but we set the char name first
  }
</script>

<div class="pers-view">
  <div class="pers-header">
    <div class="pers-faction-title a">⚔ ALIANZA</div>
    <div class="pers-center-title">
      ✦ SELECCIÓN DE PERSONAJE ✦
      <small>ELIGE TU RAZA · FILTRA TU CLASE</small>
    </div>
    <div class="pers-faction-title h">HORDA ⚔</div>
  </div>

  <div class="pers-body-row">
    {#each columnDefs.slice(0, 2) as col}
      <div class="pers-race-panel" class:pers-panel-a={col.faction === 'alliance'}>
        <div class="pers-panel-faction-label {col.cls}">[ {col.subtitle} ]</div>
        {#each (PERS_RACES_BY_COLUMN[col.id] || []) as race}
          {@const info = PERS_RACE_INFO[race] || { icon: '❓', type: '' }}
          {@const active = isRaceSelected(race, col.faction)}
          <button
            class="pers-race-btn"
            class:active-a={active && col.faction === 'alliance'}
            class:active-h={active && col.faction === 'horde'}
            onclick={() => togglePersRace(race, col.faction)}
          >
            <span class="pers-race-icon">{info.icon}</span>
            <span><div class="pers-race-name">{race}</div><div class="pers-race-type">{info.type}</div></span>
          </button>
        {/each}
      </div>
    {/each}

    <div id="pers-panel-center">
      <div id="pers-filter-bar">
        <span class="pers-filter-label">FACCIÓN:</span>
        <button
          class="pers-filter-chip"
          class:active={persFactionFilter === 'all'}
          onclick={() => { persFactionFilter = 'all'; persSelectedRace = null; persSelectedFaction = null; persSelectedChar = null }}
        >Todas</button>
        <button
          class="pers-filter-chip"
          class:active={persFactionFilter === 'alliance'}
          style="color:#4a9eff88"
          onclick={() => { persFactionFilter = 'alliance'; persSelectedRace = null; persSelectedFaction = null; persSelectedChar = null }}
        >Alianza</button>
        <button
          class="pers-filter-chip"
          class:active={persFactionFilter === 'horde'}
          style="color:#cc330088"
          onclick={() => { persFactionFilter = 'horde'; persSelectedRace = null; persSelectedFaction = null; persSelectedChar = null }}
        >Horda</button>
        <span class="pers-filter-sep">|</span>
        <span class="pers-filter-label">NIVEL:</span>
        <select class="pers-level-select" bind:value={persLevelFilter}>
          {#each levelRanges as r}
            <option value={r}>{r === 'all' ? 'Todos' : r}</option>
          {/each}
        </select>
      </div>

      <div id="pers-char-grid">
        {#if filteredChars.length === 0}
          <div class="pers-empty-state">
            <span class="big">⚠</span>No hay personajes que coincidan.<br>
            <span style="color:var(--text-muted)">Intenta cambiar los filtros.</span>
          </div>
        {:else}
          {#each filteredChars as c (c.nombre)}
            {@const clsKey = CLASS_MAP[c.clase] || 'warrior'}
            {@const color = PERS_CLASS_COLORS[clsKey] || '#c69b3a'}
            {@const icon = PERS_CLASS_ICONS[clsKey] || '❓'}
            {@const sel = persSelectedChar === c.nombre}
            <div
              class="pers-char-card {sel ? 'selected-' + (c.faccion === 'Alianza' ? 'a' : 'h') : ''}"
              onclick={() => selectPersChar(c.nombre)}
            >
              <span class="pers-card-faction-tag {c.faccion === 'Alianza' ? 'a' : 'h'}">
                {c.faccion === 'Alianza' ? 'A' : 'H'}
              </span>
              <div class="pers-card-icon" style="color:{color}">{icon}</div>
              <div class="pers-card-name" style="color:{color}">{c.nombre}</div>
              <div class="pers-card-meta">Nv.{c.nivel}<br>{c.clase} · {c.raza}</div>
            </div>
          {/each}
          
        {/if}
      </div>

      <div id="pers-class-bar-wrap">
        <div id="pers-class-bar">
          {#each classEntries as { label, key }}
            {@const color = PERS_CLASS_COLORS[key] || '#c9a84c'}
            <button
              class="pers-class-btn"
              class:active={persSelectedClass === key}
              style={persSelectedClass === key ? `border-color:${color};color:${color}` : ''}
              onclick={() => togglePersClass(key)}
            >
              <span class="pers-cbtn-icon">{PERS_CLASS_ICONS[key] || '❓'}</span>
              <span class="pers-cbtn-label">{label}</span>
            </button>
          {/each}
        </div>
      </div>
    </div>

    {#each columnDefs.slice(2) as col}
      <div class="pers-race-panel" class:pers-panel-h={col.faction === 'horde'}>
        <div class="pers-panel-faction-label {col.cls}">[ {col.subtitle} ]</div>
        {#each (PERS_RACES_BY_COLUMN[col.id] || []) as race}
          {@const info = PERS_RACE_INFO[race] || { icon: '❓', type: '' }}
          {@const active = isRaceSelected(race, col.faction)}
          <button
            class="pers-race-btn"
            class:active-a={active && col.faction === 'alliance'}
            class:active-h={active && col.faction === 'horde'}
            onclick={() => togglePersRace(race, col.faction)}
          >
            <span class="pers-race-icon">{info.icon}</span>
            <span><div class="pers-race-name">{race}</div><div class="pers-race-type">{info.type}</div></span>
          </button>
        {/each}
      </div>
    {/each}
  </div>

  <div id="pers-footer">
    <button class="pers-foot-btn" onclick={closePersonajes}>◄ VOLVER</button>
    <div class="pers-realm-info">
      Raganaros Realm · PvP · <span class="pers-realm-ping">⬤ 44ms</span>
      <br>Personaje: <span id="pers-selected-label" style="color:var(--gold)">
        {persSelectedChar
          ? (() => { const c = $personajesStore.find(p => p.nombre === persSelectedChar); return c ? `${c.nombre} (Nv.${c.nivel} ${c.raza})` : persSelectedChar })()
          : '—'
        }
      </span>
    </div>
    <button
      class="pers-foot-btn primary"
      disabled={!persSelectedChar}
      onclick={() => { if (persSelectedChar && openCharEdit) openCharEdit(persSelectedChar) }}
    >EDITAR PERSONAJE ►</button>
  </div>
</div>

<style>
  .pers-view { display:flex; flex-direction:column; height:calc(100vh - 100px); margin-top:6px; border:1px solid var(--border-subtle); border-radius:var(--r-md); overflow:hidden; background:var(--bg-base); }
  .pers-header { display:flex; align-items:center; justify-content:space-between; padding:5px 14px; background:linear-gradient(180deg,#1a0c00,#0a0500); border-bottom:1px solid var(--border-main); flex-shrink:0; }
  .pers-faction-title { font-size:13px; font-weight:bold; letter-spacing:3px; display:flex; align-items:center; gap:8px; }
  .pers-faction-title.a { color:var(--alliance); }
  .pers-faction-title.h { color:var(--horde); }
  .pers-center-title { color:var(--gold-light); font-size:14px; letter-spacing:5px; text-shadow:0 0 12px var(--gold); text-align:center; }
  .pers-center-title small { display:block; font-size:9px; color:var(--text-muted); letter-spacing:2px; margin-top:1px; }
  .pers-body-row { display:flex; flex:1; overflow:hidden; }
  .pers-race-panel { width:105px; flex-shrink:0; display:flex; flex-direction:column; padding:6px 4px; gap:2px; overflow-y:auto; }
  .pers-panel-a:nth-child(1) { border-right:1px solid var(--border-subtle); background:linear-gradient(180deg,rgba(26,74,153,0.13),var(--bg-soft)); }
  .pers-panel-a:nth-child(2) { border-right:1px solid var(--border-subtle); background:linear-gradient(180deg,rgba(26,74,153,0.07),var(--bg-soft)); }
  .pers-panel-h:nth-child(1) { border-left:1px solid var(--border-subtle); background:linear-gradient(180deg,rgba(136,21,0,0.07),var(--bg-soft)); }
  .pers-panel-h:nth-child(2) { border-left:1px solid var(--border-subtle); background:linear-gradient(180deg,rgba(136,21,0,0.13),var(--bg-soft)); }
  .pers-panel-faction-label { font-size:9px; letter-spacing:2px; text-align:center; padding:2px 0 4px; border-bottom:1px solid var(--border-subtle); margin-bottom:4px; }
  .pers-panel-faction-label.a, .pers-panel-faction-label.a-inner { color:var(--alliance); }
  .pers-panel-faction-label.a-inner { opacity:0.65; }
  .pers-panel-faction-label.h, .pers-panel-faction-label.h-inner { color:var(--horde); }
  .pers-panel-faction-label.h-inner { opacity:0.65; }
  .pers-race-btn { display:flex; align-items:center; gap:6px; padding:4px 6px; border:1px solid transparent; border-radius:2px; cursor:pointer; transition:all 0.12s; background:none; width:100%; color:var(--text-primary); text-align:left; font-family:inherit; font-size:12px; }
  .pers-race-btn:hover { background:rgba(26,12,0,0.53); border-color:var(--border-main); }
  .pers-race-btn.active-a { background:rgba(10,32,80,0.6); border-color:var(--alliance); box-shadow:0 0 8px rgba(26,74,153,0.5); }
  .pers-race-btn.active-h { background:rgba(58,8,0,0.6); border-color:var(--horde); box-shadow:0 0 8px rgba(136,21,0,0.5); }
  .pers-race-icon { font-size:20px; line-height:1; }
  .pers-race-name { color:var(--gold); font-size:10px; line-height:1.3; }
  .pers-race-type { color:var(--text-muted); font-size:9px; }
  #pers-panel-center { flex:1; display:flex; flex-direction:column; overflow:hidden; position:relative; }
  #pers-filter-bar { position:relative; z-index:2; display:flex; align-items:center; justify-content:center; gap:6px; padding:5px 8px; background:rgba(10,5,0,0.53); border-bottom:1px solid var(--border-subtle); flex-shrink:0; flex-wrap:wrap; }
  .pers-filter-label { color:var(--text-muted); font-size:10px; margin-right:2px; }
  .pers-filter-chip { border:1px solid var(--border-main); background:none; color:var(--gold-dim); font-family:inherit; font-size:10px; padding:2px 7px; cursor:pointer; border-radius:1px; letter-spacing:0.5px; transition:all 0.12s; }
  .pers-filter-chip:hover { color:var(--gold); border-color:var(--gold-dim); background:rgba(26,12,0,0.53); }
  .pers-filter-chip.active { border-color:var(--gold); color:var(--gold-light); background:rgba(42,24,0,0.6); text-shadow:0 0 6px var(--gold); }
  .pers-filter-sep { color:var(--border-subtle); }
  .pers-level-select { background:rgba(10,5,0,0.8); border:1px solid var(--border-main); color:var(--gold); font-size:10px; padding:2px 6px; border-radius:2px; cursor:pointer; font-family:inherit; }
  #pers-char-grid { position:relative; z-index:2; flex:1; overflow-y:auto; padding:10px; display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:8px; align-content:start; }
  .pers-char-card { border:1px solid var(--border-subtle); background:linear-gradient(180deg,rgba(22,10,0,0.53),rgba(10,5,0,0.53)); border-radius:2px; padding:8px; cursor:pointer; transition:all 0.15s; text-align:center; position:relative; }
  .pers-char-card:hover { border-color:var(--border-main); background:rgba(31,14,0,0.53); }
  .pers-char-card.selected-a { border-color:var(--alliance); background:rgba(10,32,80,0.5); box-shadow:0 0 12px rgba(26,74,153,0.5); }
  .pers-char-card.selected-h { border-color:var(--horde); background:rgba(58,8,0,0.5); box-shadow:0 0 12px rgba(136,21,0,0.5); }
  .pers-card-icon { font-size:28px; line-height:1.2; margin-bottom:4px; }
  .pers-card-name { font-size:11px; font-weight:bold; letter-spacing:1px; color:var(--gold-light); }
  .pers-card-meta { color:var(--text-muted); font-size:9px; margin-top:1px; }
  .pers-card-faction-tag { font-size:8px; position:absolute; top:4px; right:5px; letter-spacing:1px; }
  .pers-card-faction-tag.a { color:var(--alliance); }
  .pers-card-faction-tag.h { color:var(--horde); }
  .pers-empty-state { grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted); font-size:11px; line-height:2; }
  .pers-empty-state .big { font-size:32px; display:block; margin-bottom:8px; }
  .pers-char-card.add-new { border-style:dashed; border-color:var(--border-subtle); color:var(--text-muted); display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:90px; gap:4px; }
  .pers-char-card.add-new:hover { color:var(--gold-dim); border-color:var(--border-main); }
  .pers-add-icon { font-size:24px; }
  #pers-class-bar-wrap { position:relative; z-index:2; border-top:1px solid var(--border-subtle); background:linear-gradient(180deg,rgba(14,7,0,0.53),rgba(6,4,1,0.8)); padding:5px 8px; flex-shrink:0; }
  #pers-class-bar { display:flex; gap:3px; justify-content:center; overflow-x:auto; padding-bottom:2px; }
  .pers-class-btn { background:none; border:1px solid var(--border-subtle); color:var(--text-muted); font-family:inherit; font-size:10px; padding:3px 8px; cursor:pointer; border-radius:2px; white-space:nowrap; transition:all 0.12s; display:flex; flex-direction:column; align-items:center; gap:1px; min-width:58px; }
  .pers-class-btn:hover { background:rgba(26,12,0,0.6); border-color:var(--border-main); color:var(--gold-dim); }
  .pers-class-btn.active { background:rgba(42,21,0,0.6); border-color:var(--gold); color:var(--gold-light); }
  .pers-cbtn-icon { font-size:14px; line-height:1; }
  .pers-cbtn-label { font-size:9px; letter-spacing:0.3px; }
  #pers-footer { display:flex; justify-content:space-between; align-items:center; padding:5px 14px; background:linear-gradient(0deg,#100800,#0a0500); border-top:1px solid var(--border-main); flex-shrink:0; }
  .pers-foot-btn { background:linear-gradient(180deg,#2a1500,#170900); border:1px solid #7a4a10; color:var(--gold-light); font-family:inherit; font-size:12px; letter-spacing:1px; padding:5px 18px; cursor:pointer; border-radius:2px; transition:all 0.15s; }
  .pers-foot-btn:hover { background:linear-gradient(180deg,#3a2000,#1f0e00); border-color:var(--gold); }
  .pers-foot-btn:disabled { opacity:0.3; pointer-events:none; }
  .pers-foot-btn.primary { border-color:#c8a84b; background:linear-gradient(180deg,#3a2800,#1f1200); }
  .pers-foot-btn.primary:hover { background:linear-gradient(180deg,#5a3a00,#2a1800); box-shadow:0 0 10px var(--gold-dim); }
  .pers-realm-info { color:var(--text-muted); font-size:10px; text-align:center; line-height:1.6; }
  .pers-realm-ping { color:#44cc44; }
</style>
