<script lang="ts">
  import { personajesStore, dataStore } from '../stores/data'
  import { uiStore } from '../stores/ui'
  import { CLASS_MAP, PERS_RACE_INFO, PERS_CLASS_ICONS, PERS_CLASS_COLORS, PERS_RACES_BY_COLUMN } from '../constants'

  let { openCharEdit, openNewChar }: { openCharEdit?: (name: string) => void; openNewChar?: () => void } = $props()

  let persSelectedRace = $state<string | null>(null)
  let persSelectedFaction = $state<string | null>(null)
  let persSelectedClass = $state<string | null>(null)
  let persFactionFilter = $state('all')
  let persLevelMin = $state<number | null>(null)
  let persLevelMax = $state<number | null>(null)
  let persSelectedChar = $state<string | null>(null)
  let persHideNotPlanned = $state(true)

  let classEntries = $derived.by(() => {
    const deduped: Array<{ label: string; key: string }> = []
    const seen = new Set<string>()
    for (const [label, key] of Object.entries(CLASS_MAP)) {
      if (!seen.has(key)) { seen.add(key); deduped.push({ label, key }) }
    }
    return deduped
  })

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
    if (persLevelMin !== null) chars = chars.filter(c => c.nivel >= persLevelMin!)
    if (persLevelMax !== null) chars = chars.filter(c => c.nivel <= persLevelMax!)
    if (persHideNotPlanned) chars = chars.filter(c => c.planeado_usar)
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

  function togglePersPlanned(e: MouseEvent, charName: string) {
    e.stopPropagation()
    const c = $personajesStore.find(p => p.nombre === charName)
    if (!c) return
    dataStore.updatePersonaje(charName, { planeado_usar: !c.planeado_usar })
  }

  function resetPersAll() {
    persSelectedRace = null
    persSelectedFaction = null
    persSelectedClass = null
    persFactionFilter = 'all'
    persLevelMin = null
    persLevelMax = null
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

  type CountEntry = { label: string; count: number }

  function countByField(chars: typeof $personajesStore, field: 'raza' | 'clase'): CountEntry[] {
    const map = new Map<string, number>()
    for (const c of chars) {
      const raw = c[field]
      const v = (field === 'raza' && !raw) ? c.nombre : raw
      map.set(v, (map.get(v) || 0) + 1)
    }
    return [...map.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  }

  let hordeChars = $derived(filteredChars.filter(c => c.faccion === 'Horda'))
  let allianceChars = $derived(filteredChars.filter(c => c.faccion === 'Alianza'))
  let allChars = $derived(filteredChars)

  let hordeRazas = $derived(countByField(hordeChars, 'raza'))
  let hordeClases = $derived(countByField(hordeChars, 'clase'))
  let allianceRazas = $derived(countByField(allianceChars, 'raza'))
  let allianceClases = $derived(countByField(allianceChars, 'clase'))
  let allRazas = $derived(countByField(allChars, 'raza'))
  let allClases = $derived(countByField(allChars, 'clase'))
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
        <input class="pers-level-input" type="number" placeholder="Min" bind:value={persLevelMin} min="1" max="90" />
        <span class="pers-filter-sep">–</span>
        <input class="pers-level-input" type="number" placeholder="Max" bind:value={persLevelMax} min="1" max="90" />
        <span class="pers-filter-sep">|</span>
        <label class="pers-filter-check" title="Mostrar solo personajes que planeas usar">
          <input type="checkbox" bind:checked={persHideNotPlanned} />
          <span class="pers-filter-check-text">SOLO PLANEADOS</span>
        </label>
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
              <button
                class="pers-card-delete"
                title="Eliminar personaje"
                onclick={(e) => { e.stopPropagation(); if (confirm(`¿Eliminar a ${c.nombre}?`)) dataStore.deletePersonaje(c.nombre) }}
              >✕</button>
              <span class="pers-card-faction-tag {c.faccion === 'Alianza' ? 'a' : 'h'}">
                {c.faccion === 'Alianza' ? 'A' : 'H'}
              </span>
              <button
                class="pers-card-planned"
                class:active={c.planeado_usar}
                title={c.planeado_usar ? 'Planeado usar' : 'No planeado'}
                onclick={(e) => togglePersPlanned(e, c.nombre)}
                aria-pressed={c.planeado_usar}
              ></button>
              <div class="pers-card-icon">{icon}</div>
              <div class="pers-card-name" style="color:{color}">{c.nombre}</div>
              <div class="pers-card-meta">
                <div class="pers-card-line">Nv.{c.nivel}</div>
                <div class="pers-card-line">{c.clase}</div>
                <div class="pers-card-line">{c.raza}</div>
                {#if c.parecidos && c.parecidos.length}
                  {#each c.parecidos as p}
                    <div class="pers-card-parecido" style="color:{color}">{p}</div>
                  {/each}
                {/if}
              </div>
              {#if c.descripcion}
                <div class="pers-card-desc" title={c.descripcion}>{c.descripcion}</div>
              {/if}
              {#if c.tipo === 'iconico'}
                <span class="pers-card-tipo iconico" title="Icónico">★</span>
              {/if}
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

  <div id="pers-stats">
    {#each [{ title: 'HORDA', cls: 'h', razas: hordeRazas, clases: hordeClases }, { title: 'ALIANZA', cls: 'a', razas: allianceRazas, clases: allianceClases }, { title: 'CUENTA', cls: 'all', razas: allRazas, clases: allClases }] as group}
      <div class="pers-stats-group">
        <div class="pers-stats-title {group.cls}">{group.title}</div>
        <div class="pers-stats-tables">
          <div class="pers-stats-table">
            <div class="pers-stats-subtitle">RAZAS</div>
            {#each group.razas as row, i}
              <div class="pers-stats-row">
                <span class="pers-stats-rank">{i + 1}.</span>
                <span class="pers-stats-label">{row.label}</span>
                <span class="pers-stats-count">{row.count}</span>
              </div>
            {:else}
              <div class="pers-stats-empty">—</div>
            {/each}
          </div>
          <div class="pers-stats-table">
            <div class="pers-stats-subtitle">CLASES</div>
            {#each group.clases as row, i}
              <div class="pers-stats-row">
                <span class="pers-stats-rank">{i + 1}.</span>
                <span class="pers-stats-label">{row.label}</span>
                <span class="pers-stats-count">{row.count}</span>
              </div>
            {:else}
              <div class="pers-stats-empty">—</div>
            {/each}
          </div>
        </div>
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
    <div style="display:flex;gap:4px">
      <button
        class="pers-foot-btn"
        onclick={() => { if (openNewChar) openNewChar() }}
      >✚ NUEVO</button>
      <button
        class="pers-foot-btn primary"
        disabled={!persSelectedChar}
        onclick={() => { if (persSelectedChar && openCharEdit) openCharEdit(persSelectedChar) }}
      >EDITAR ►</button>
    </div>
  </div>
</div>

<style>
  .pers-view { display:flex; flex-direction:column; min-height:calc(100vh - 100px); margin-top:6px; border:1px solid var(--border-subtle); border-radius:var(--r-md); background:var(--bg-base); }
  .pers-header { display:flex; align-items:center; justify-content:space-between; padding:5px 14px; background:linear-gradient(180deg,#1a0c00,#0a0500); border-bottom:1px solid var(--border-main); flex-shrink:0; }
  .pers-faction-title { font-size:0.6rem; font-weight:bold; letter-spacing:3px; display:flex; align-items:center; gap:8px; }
  .pers-faction-title.a { color:var(--alliance); }
  .pers-faction-title.h { color:var(--horde); }
  .pers-center-title { color:var(--gold-light); font-size:0.65rem; letter-spacing:5px; text-shadow:0 0 12px var(--gold); text-align:center; }
  .pers-center-title small { display:block; font-size:0.4rem; color:var(--text-muted); letter-spacing:2px; margin-top:1px; }
  .pers-body-row { display:flex; flex:1; }
  .pers-race-panel { width:125px; flex-shrink:0; display:flex; flex-direction:column; padding:6px 4px; gap:2px; }
  .pers-panel-a:nth-child(1) { border-right:1px solid var(--border-subtle); background:linear-gradient(180deg,rgba(26,74,153,0.13),var(--bg-soft)); }
  .pers-panel-a:nth-child(2) { border-right:1px solid var(--border-subtle); background:linear-gradient(180deg,rgba(26,74,153,0.07),var(--bg-soft)); }
  .pers-panel-h:nth-child(1) { border-left:1px solid var(--border-subtle); background:linear-gradient(180deg,rgba(136,21,0,0.07),var(--bg-soft)); }
  .pers-panel-h:nth-child(2) { border-left:1px solid var(--border-subtle); background:linear-gradient(180deg,rgba(136,21,0,0.13),var(--bg-soft)); }
  .pers-panel-faction-label { font-size:0.4rem; letter-spacing:2px; text-align:center; padding:2px 0 4px; border-bottom:1px solid var(--border-subtle); margin-bottom:4px; }
  .pers-panel-faction-label.a, .pers-panel-faction-label.a-inner { color:var(--alliance); }
  .pers-panel-faction-label.a-inner { opacity:0.65; }
  .pers-panel-faction-label.h, .pers-panel-faction-label.h-inner { color:var(--horde); }
  .pers-panel-faction-label.h-inner { opacity:0.65; }
  .pers-race-btn { display:flex; align-items:center; gap:6px; padding:4px 6px; border:1px solid transparent; border-radius:2px; cursor:pointer; transition:all 0.12s; background:none; width:100%; color:var(--text-primary); text-align:left; font-family:inherit; font-size:0.55rem; }
  .pers-race-btn:hover { background:rgba(26,12,0,0.53); border-color:var(--border-main); }
  .pers-race-btn.active-a { background:rgba(10,32,80,0.6); border-color:var(--alliance); box-shadow:0 0 8px rgba(26,74,153,0.5); }
  .pers-race-btn.active-h { background:rgba(58,8,0,0.6); border-color:var(--horde); box-shadow:0 0 8px rgba(136,21,0,0.5); }
  .pers-race-icon { font-size:20px; line-height:1; }
  .pers-race-name { color:var(--gold); font-size:11px; line-height:1.3; }
  .pers-race-type { color:var(--text-muted); font-size:10px; }
  #pers-panel-center { flex:1; display:flex; flex-direction:column; position:relative; }
  #pers-filter-bar { position:relative; z-index:2; display:flex; align-items:center; justify-content:center; gap:6px; padding:5px 8px; background:rgba(10,5,0,0.53); border-bottom:1px solid var(--border-subtle); flex-shrink:0; flex-wrap:wrap; }
  .pers-filter-label { color:var(--text-muted); font-size:0.45rem; margin-right:2px; }
  .pers-filter-chip { border:1px solid var(--border-main); background:none; color:var(--gold-dim); font-family:inherit; font-size:0.45rem; padding:2px 7px; cursor:pointer; border-radius:1px; letter-spacing:0.5px; transition:all 0.12s; }
  .pers-filter-chip:hover { color:var(--gold); border-color:var(--gold-dim); background:rgba(26,12,0,0.53); }
  .pers-filter-chip.active { border-color:var(--gold); color:var(--gold-light); background:rgba(42,24,0,0.6); text-shadow:0 0 6px var(--gold); }
  .pers-filter-sep { color:var(--border-subtle); }
  .pers-level-input { width:48px; background:rgba(10,5,0,0.8); border:1px solid var(--border-main); color:var(--gold); font-size:0.45rem; padding:2px 4px; border-radius:2px; font-family:inherit; text-align:center; }
  .pers-level-input:focus { outline:none; border-color:var(--gold); }
  .pers-level-input::placeholder { color:var(--text-dim); }
  #pers-char-grid { position:relative; z-index:2; flex:1; padding:10px; display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:8px; align-content:start; min-width:0; overflow-y:auto; overflow-x:hidden; }
  .pers-char-card { border:1px solid var(--border-subtle); background:linear-gradient(180deg,rgba(22,10,0,0.53),rgba(10,5,0,0.53)); border-radius:2px; padding:8px; cursor:pointer; transition:all 0.15s; text-align:center; position:relative; min-width:0; }
  .pers-card-delete { position:absolute; top:3px; right:3px; width:14px; height:14px; padding:0; border:none; background:none; color:var(--text-dim); font-size:10px; line-height:1; cursor:pointer; z-index:3; display:flex; align-items:center; justify-content:center; border-radius:1px; opacity:0; transition:opacity 0.12s,color 0.12s; }
  .pers-char-card:hover .pers-card-delete { opacity:1; }
  .pers-card-delete:hover { color:#ff4444; background:rgba(0,0,0,0.5); }
  .pers-char-card:hover { border-color:var(--border-main); background:rgba(31,14,0,0.53); }
  .pers-char-card.selected-a { border-color:var(--alliance); background:rgba(10,32,80,0.5); box-shadow:0 0 12px rgba(26,74,153,0.5); }
  .pers-char-card.selected-h { border-color:var(--horde); background:rgba(58,8,0,0.5); box-shadow:0 0 12px rgba(136,21,0,0.5); }
  .pers-card-icon { font-size:28px; line-height:1.2; margin-bottom:4px; }
  .pers-card-name { font-size:0.5rem; font-weight:bold; letter-spacing:1px; color:var(--gold-light); }
  .pers-card-meta { color:var(--text-muted); font-size:0.45rem; margin-top:1px; display:flex; flex-direction:column; gap:1px; }
  .pers-card-line { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .pers-card-parecido { font-weight:600; font-size:0.4rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .pers-card-faction-tag { font-size:0.35rem; position:absolute; top:4px; right:5px; letter-spacing:1px; }
  .pers-card-faction-tag.a { color:var(--alliance); }
  .pers-card-faction-tag.h { color:var(--horde); }
  .pers-card-desc { color:var(--text-dim); font-size:0.4rem; margin-top:2px; line-height:1.3; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; }
  .pers-card-tipo { font-size:0.5rem; position:absolute; top:4px; left:22px; }
  .pers-card-tipo.iconico { color:#ffd700; text-shadow:0 0 4px rgba(255,215,0,0.5); }
  .pers-card-planned { position:absolute; top:4px; left:5px; cursor:pointer; display:flex; align-items:center; justify-content:center; width:12px; height:12px; border:1px solid var(--border-main); border-radius:1px; background:rgba(0,0,0,0.5); transition:all 0.12s; padding:0; }
  .pers-card-planned:hover { border-color:var(--gold); }
  .pers-card-planned.active { border-color:var(--gold); background:rgba(42,24,0,0.85); box-shadow:0 0 5px rgba(200,168,75,0.6); }
  .pers-card-planned.active::after { content:'✓'; color:var(--gold-light); font-size:9px; line-height:1; }
  .pers-filter-check { display:flex; align-items:center; gap:3px; cursor:pointer; font-size:0.45rem; letter-spacing:0.5px; color:var(--gold-dim); user-select:none; }
  .pers-filter-check input { margin:0; cursor:pointer; accent-color:var(--gold); }
  .pers-filter-check-text { color:var(--gold-dim); }
  .pers-filter-check:has(input:checked) .pers-filter-check-text { color:var(--gold); text-shadow:0 0 4px var(--gold-dim); }
  .pers-empty-state { grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted); font-size:0.5rem; line-height:2; }
  .pers-empty-state .big { font-size:32px; display:block; margin-bottom:8px; }
  .pers-char-card.add-new { border-style:dashed; border-color:var(--border-subtle); color:var(--text-muted); display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:90px; gap:4px; }
  .pers-char-card.add-new:hover { color:var(--gold-dim); border-color:var(--border-main); }
  .pers-add-icon { font-size:24px; }
  #pers-class-bar-wrap { position:relative; z-index:2; border-top:1px solid var(--border-subtle); background:linear-gradient(180deg,rgba(14,7,0,0.53),rgba(6,4,1,0.8)); padding:5px 8px; flex-shrink:0; }
  #pers-class-bar { display:flex; gap:3px; justify-content:center; overflow-x:auto; padding-bottom:2px; }
  .pers-class-btn { background:none; border:1px solid var(--border-subtle); color:var(--text-muted); font-family:inherit; font-size:0.5rem; padding:4px 10px; cursor:pointer; border-radius:2px; white-space:nowrap; transition:all 0.12s; display:flex; flex-direction:column; align-items:center; gap:1px; min-width:64px; }
  .pers-class-btn:hover { background:rgba(26,12,0,0.6); border-color:var(--border-main); color:var(--gold-dim); }
  .pers-class-btn.active { background:rgba(42,21,0,0.6); border-color:var(--gold); color:var(--gold-light); }
  .pers-cbtn-icon { font-size:0.65rem; line-height:1; }
  .pers-cbtn-label { font-size:0.4rem; letter-spacing:0.3px; }
  #pers-footer { display:flex; justify-content:space-between; align-items:center; padding:5px 14px; background:linear-gradient(0deg,#100800,#0a0500); border-top:1px solid var(--border-main); flex-shrink:0; }
  .pers-foot-btn { background:linear-gradient(180deg,#2a1500,#170900); border:1px solid #7a4a10; color:var(--gold-light); font-family:inherit; font-size:0.55rem; letter-spacing:1px; padding:5px 18px; cursor:pointer; border-radius:2px; transition:all 0.15s; }
  .pers-foot-btn:hover { background:linear-gradient(180deg,#3a2000,#1f0e00); border-color:var(--gold); }
  .pers-foot-btn:disabled { opacity:0.3; pointer-events:none; }
  .pers-foot-btn.primary { border-color:#c8a84b; background:linear-gradient(180deg,#3a2800,#1f1200); }
  .pers-foot-btn.primary:hover { background:linear-gradient(180deg,#5a3a00,#2a1800); box-shadow:0 0 10px var(--gold-dim); }
  .pers-realm-info { color:var(--text-muted); font-size:0.45rem; text-align:center; line-height:1.6; }
  .pers-realm-ping { color:#44cc44; }
  #pers-stats { display:flex; gap:8px; padding:6px 10px; background:linear-gradient(180deg,rgba(10,5,0,0.6),rgba(6,3,0,0.85)); border-top:1px solid var(--border-subtle); flex-shrink:0; }
  .pers-stats-group { flex:1; min-width:180px; display:flex; flex-direction:column; gap:3px; }
  .pers-stats-title { font-size:0.5rem; font-weight:bold; letter-spacing:2px; text-align:center; padding-bottom:2px; border-bottom:1px solid var(--border-subtle); }
  .pers-stats-title.h { color:var(--horde); }
  .pers-stats-title.a { color:var(--alliance); }
  .pers-stats-title.all { color:var(--gold-light); }
  .pers-stats-tables { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
  .pers-stats-table { display:flex; flex-direction:column; gap:1px; min-width:0; }
  .pers-stats-subtitle { font-size:0.35rem; letter-spacing:1px; color:var(--text-muted); text-align:center; padding-bottom:1px; border-bottom:1px dotted var(--border-subtle); }
  .pers-stats-row { display:flex; align-items:center; gap:4px; font-size:0.4rem; padding:1px 3px; border-radius:1px; }
  .pers-stats-row:nth-child(odd) { background:rgba(26,12,0,0.4); }
  .pers-stats-rank { color:var(--text-muted); width:12px; flex-shrink:0; text-align:right; }
  .pers-stats-label { flex:1; min-width:0; color:var(--text-primary); white-space:normal; word-break:break-word; line-height:1.2; }
  .pers-stats-count { color:var(--gold); font-weight:bold; flex-shrink:0; min-width:14px; text-align:right; }
  .pers-stats-empty { color:var(--text-dim); font-size:0.4rem; text-align:center; padding:4px; }
</style>
