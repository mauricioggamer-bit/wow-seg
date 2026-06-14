const UI = (() => {
  let state = {
    currentWarband: null,
    selectedChar: null,
    filterClase: '',
    filterReino: '',
    filterActivo: 'todos',
    search: '',
    currentView: 'warband',
    tablaFilter: { filterPersonaje: '', filterWarband: '', filterTipo: '', filterExpansion: '', filterPriority: '', filterTime: '', filterEstado: '', filterSearch: '', filterClase: '', filterFaccion: '', filterReino: '', filterActivo: '', filterCooldown: '' },
    priorityFilter: { priority: '1', warband: '' },
    timeFilter: { time: 'rapido', warband: '' }
  };
  
  // Personajes view state
  let persSelectedRace = null;
  let persSelectedFaction = null;
  let persSelectedClass = null;
  let persFactionFilter = 'all';
  let persLevelFilter = 'all';
  let persSelectedChar = null;

  const CLASS_MAP = {
    'Guerrero': 'warrior', 'Paladín': 'paladin', 'Cazador': 'hunter',
    'Pícaro': 'rogue', 'Sacerdote': 'priest', 'DK': 'dk',
    'Chamán': 'shaman', 'Mago': 'mage', 'Brujo': 'warlock',
    'Monje': 'monk', 'Druida': 'druid', 'DH': 'dh', 'Evocadora': 'evoker',
    'Maga': 'mage'
  };

  const PERS_RACE_INFO = {
    'Orco':          { icon: '💀', type: 'Salvaje' },
    'Blood Elf':     { icon: '🔮', type: 'Élfico' },
    'Tauren':        { icon: '🐂', type: 'Bestial' },
    'Troll':         { icon: '🗿', type: 'Tribal' },
    'Goblin':        { icon: '💰', type: 'Pequeño' },
    "Mag'har":       { icon: '🏹', type: 'Salvaje' },
    'Nightborne':    { icon: '🌌', type: 'Élfico' },
    'Highmountain':  { icon: '🦌', type: 'Bestial' },
    'Zandalari':     { icon: '🗿', type: 'Tribal' },
    'Vulpera':       { icon: '🦊', type: 'Nómada' },
    'Undead':        { icon: '☠', type: 'No-muerto' },
    'Earthen':       { icon: '🪨', type: 'Elemental' },
    'Pandaren':      { icon: '🐼', type: 'Neutral' },
    'Human':         { icon: '👤', type: 'Humanoide' },
    'Night Elf':     { icon: '🌙', type: 'Élfico' },
    'Draenei':       { icon: '✦', type: 'Místico' },
    'Gnome':         { icon: '⚙', type: 'Pequeño' },
    'Dwarf':         { icon: '⛏', type: 'Humanoide' },
    'Void Elf':      { icon: '🌑', type: 'Élfico' },
    'Light Draenei': { icon: '✦', type: 'Luz' },
    'Haranir':       { icon: '🌿', type: 'Místico' },
    'Dracthyr':      { icon: '🐉', type: 'Dragón' }
  };
  const PERS_CLASS_ICONS = {
    warrior: '⚔', paladin: '⚜', hunter: '🏹', rogue: '🗡',
    priest: '✝', dk: '☠', shaman: '⚡', mage: '❄',
    warlock: '👁', monk: '☯', druid: '🌿', dh: '◈', evoker: '🐉'
  };
  const PERS_CLASS_COLORS = {
    warrior: '#c69b3a', paladin: '#f48cba', hunter: '#aad372', rogue: '#fff569',
    priest: '#ffffff', dk: '#c41e3a', shaman: '#0070dd', mage: '#3fc7eb',
    warlock: '#8788ee', monk: '#00ff96', druid: '#ff7c0a', dh: '#a330c9', evoker: '#33937f'
  };
  const PERS_CHAR_ARTS = {
    warrior:  " \u2694\uFE0F\n \\o/\n /|\\\n/ | \\",
    paladin:  " \u269C\n \\o/\n )|(  \n/===\\",
    hunter:   " \uD83C\uDFF9\n \\o/\n /|\\\n/___\\",
    rogue:    " \uD83D\uDDE1\n \\o/\n )|(  \n/ | \\",
    priest:   " \u271D\n \\o/\n /|\\\n  |  ",
    dk:       " \u2620\n \\o/\n /|\\\n[===]",
    shaman:   " \u26A1\n \\o/\n /|\\\n/___\\",
    mage:     " \u2744\n \\o/\n /|\\\n  |  ",
    warlock:  " \uD83D\uDC41\n \\o/\n//|\\\\\n  |  ",
    monk:     " \u262F\n \\o/\n (|) \n/ | \\",
    druid:    " \uD83C\uDF3F\n \\o/\n /|\\\n(   )",
    dh:       " \u25C8\n \\o/\n /X\\\n/ | \\",
    evoker:   " \uD83D\uDC09\n \\o/\n /|\\\n~~~~~"
  };
  const PERS_BG_SCENES = {
    alliance: [
      "     _____         _____",
      "    |=====|       |=====|     ___",
      "    | [A] |       | [A] |    /|||\\",
      "    |_____|       |_____|   / ||| \\",
      "  __|_____|_______|_____|__/__|||||\\__",
      " /   \\   /     \\   /   \\   /  |||||  \\",
      "/     \\_/       \\_/     \\_/   |||||   \\",
      "~~~~~~~~~~~ IRONFORGE ~~~~~~~~~~~~~~~~~~~"
    ].join('\n'),
    horde: [
      "    /\\   /\\   /\\   /\\   /\\",
      "   /  \\ /  \\ /  \\ /  \\ /  \\",
      "  / [H]\\    /    \\    / [H] \\",
      " /______\\  /______\\  /______\\",
      " |  ||  |  |  ||  |  |  ||  |",
      " |  ||  |  |  ||  |  |  ||  |",
      "~~~~~~~~~~ ORGRIMMAR ~~~~~~~~~~~~~~~~"
    ].join('\n'),
    all: [
      "  ___________/\\___________/\\________",
      " /  ALIANZA  \\\\  /  HORDA  \\\\  /\\  /",
      "/____________//\\/____________//\\/  \\/",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ~~"
    ].join('\n')
  };

  const LABELS = { all: 'Todas', weekly: 'Semanal', daily: 'Diaria', farm_libre: 'Farm' };
  const PRIORITY_TABS = [
    { key: '1', label: 'P1' },
    { key: '2', label: 'P2' },
    { key: '3', label: 'P3' },
    { key: '', label: 'Todas' }
  ];
  const TIME_TABS = [
    { key: 'rapido', label: '🟢 Rápido' },
    { key: 'medio', label: '🟡 Medio' },
    { key: 'largo', label: '🟠 Largo' },
    { key: 'marathon', label: '🔴 Marathon' },
    { key: '', label: 'Todas' }
  ];
  const TIME_RANGES = [
    { key: 'rapido', label: '🟢 Rápido (≤15min)', fn: t => t.tiempo_min <= 15 },
    { key: 'medio', label: '🟡 Medio (16-30min)', fn: t => t.tiempo_min >= 16 && t.tiempo_min <= 30 },
    { key: 'largo', label: '🟠 Largo (31-60min)', fn: t => t.tiempo_min >= 31 && t.tiempo_min <= 60 },
    { key: 'marathon', label: '🔴 Marathon (>60min)', fn: t => t.tiempo_min > 60 }
  ];

  function clsClass(className) {
    return 'class-' + (CLASS_MAP[className] || 'warrior');
  }

  function render() {
    if (DATA.checkWeeklyReset()) GIST.doSync();
    if (state.currentView !== 'mapa') MAPA.destroy();
    renderHeaderStats();
    renderViewTabs();

    document.getElementById('warbandLayout').style.display = 'none';
    document.getElementById('dashboardPanel').style.display = 'none';
    document.getElementById('personajesPanel').style.display = 'none';
    document.getElementById('mapaPanel').style.display = 'none';
    // Clean up personajes Escape handler when leaving view
    document.removeEventListener('keydown', persEscapeHandler);
    const wbTabs = document.getElementById('warbandTabs');

    if (state.currentView === 'warband') {
      document.getElementById('warbandLayout').style.display = 'grid';
      if (wbTabs) wbTabs.style.display = '';
      renderWarbandTabs();
      const wb = state.currentWarband || DATA.getWarbands()[0]?.nombre;
      if (wb) { state.currentWarband = wb; renderWarbandContent(wb); }
      if (state.selectedChar) renderCharDetail(state.selectedChar);
      else renderAllTasks(state.currentWarband);
    } else if (state.currentView === 'personajes') {
      const pp = document.getElementById('personajesPanel');
      pp.style.display = 'flex';
      if (wbTabs) wbTabs.style.display = 'none';
      renderPersonajesView();
    } else if (state.currentView === 'mapa') {
      if (wbTabs) wbTabs.style.display = 'none';
      const mp = document.getElementById('mapaPanel');
      mp.style.display = 'flex';
      MAPA.resume();
      MAPA.render();
    } else {
      if (wbTabs) wbTabs.style.display = 'none';
      document.getElementById('dashboardPanel').style.display = 'block';
      if (state.currentView === 'tabla') renderTablaUnificada();
      else if (state.currentView === 'priority') renderPriorityView();
      else if (state.currentView === 'time') renderTimeView();
    }
  }

  function renderViewTabs() {
    const el = document.getElementById('viewTabs');
    if (!el) return;
    el.innerHTML = `
      <button class="warband-tab ${state.currentView === 'warband' ? 'active' : ''}" onclick="UI.setView('warband')">📁 Warband</button>
      <button class="warband-tab ${state.currentView === 'tabla' ? 'active' : ''}" onclick="UI.setView('tabla')">📋 Tabla</button>
      <button class="warband-tab ${state.currentView === 'priority' ? 'active' : ''}" onclick="UI.setView('priority')">⚡ Prioridad</button>
      <button class="warband-tab ${state.currentView === 'time' ? 'active' : ''}" onclick="UI.setView('time')">⏱ Tiempo</button>
      <button class="warband-tab ${state.currentView === 'personajes' ? 'active' : ''}" onclick="UI.setView('personajes')">🎭 Personajes</button>
      <button class="warband-tab ${state.currentView === 'mapa' ? 'active' : ''}" onclick="UI.setView('mapa')">🗺 Mapa</button>
    `;
  }

  function setView(v) {
    state.currentView = v;
    render();
  }

  function renderHeaderStats() {
    const stats = DATA.getStats();
    const el = document.getElementById('headerStats');
    if (!el) return;
    el.innerHTML = `
      <span class="stat-item"><span class="stat-value">${stats.total}</span> personajes</span>
      <span class="stat-item"><span class="stat-value">${stats.activos}</span> activos</span>
      <span class="stat-item"><span class="stat-value">${stats.warbands}</span> warbands</span>
      <span class="stat-item"><span class="stat-value">${stats.weeklyDone}/${stats.weeklyTotal}</span> semanales</span>
      <span class="stat-item"><span class="stat-value">${stats.dailyDone}/${stats.dailyTotal}</span> diarias</span>
      <span class="stat-item" style="color: ${stats.weeklyPct >= 50 ? 'var(--health-green)' : stats.weeklyPct >= 25 ? 'var(--orange)' : 'var(--red)'}">
        ${stats.weeklyPct}%
      </span>
    `;
  }

  // ===== WARBAND VIEW =====
  function renderWarbandTabs() {
    const el = document.getElementById('warbandTabs');
    if (!el) return;
    const warbands = DATA.getWarbands();
    el.innerHTML = warbands.map(wb => `
      <button class="warband-tab ${wb.nombre === state.currentWarband ? 'active' : ''}"
              onclick="UI.selectWarband('${wb.nombre}')">
        ${wb.nombre} (${wb.personajes.length})
      </button>
    `).join('');
  }

  function selectWarband(nombre) {
    state.currentWarband = nombre;
    state.selectedChar = null;
    render();
  }

  function renderWarbandContent(wbName) {
    const panel = document.getElementById('warbandPanel');
    if (!panel) return;
    const chars = DATA.getPersonajes().filter(c => c.warband === wbName);
    let filtered = applyFilters(chars);
    panel.innerHTML = `
      <div class="wow-panel">
        <div class="wow-panel-header">
          <h2>${wbName}</h2>
          <span class="text-sm text-muted">${filtered.length} personajes</span>
        </div>
        <div class="wow-panel-body">
          <div class="filter-bar mb-2">
            <input type="text" placeholder="Buscar..." value="${state.search}" oninput="UI.setSearch(this.value)">
            <select onchange="UI.setFilterClase(this.value)">
              <option value="">Todas las clases</option>
              ${[...new Set(DATA.getPersonajes().map(c => c.clase))].sort().map(cl =>
                `<option value="${cl}" ${state.filterClase === cl ? 'selected' : ''}>${cl}</option>`
              ).join('')}
            </select>
            <select onchange="UI.setFilterReino(this.value)">
              <option value="">Todos los reinos</option>
              ${[...new Set(DATA.getPersonajes().map(c => c.reino))].sort().map(r =>
                `<option value="${r}" ${state.filterReino === r ? 'selected' : ''}>${r}</option>`
              ).join('')}
            </select>
            <select onchange="UI.setFilterActivo(this.value)">
              <option value="todos" ${state.filterActivo === 'todos' ? 'selected' : ''}>Todos</option>
              <option value="activos" ${state.filterActivo === 'activos' ? 'selected' : ''}>Activos</option>
              <option value="inactivos" ${state.filterActivo === 'inactivos' ? 'selected' : ''}>Inactivos</option>
            </select>
          </div>
          <div class="char-grid">
            ${filtered.length === 0
              ? '<div class="empty-state"><p>No se encontraron personajes</p></div>'
              : filtered.map(c => renderCharCard(c)).join('')
            }
          </div>
        </div>
      </div>
    `;
  }

  function applyFilters(chars) {
    let result = [...chars];
    if (state.search) {
      const q = state.search.toLowerCase();
      result = result.filter(c => c.nombre.toLowerCase().includes(q));
    }
    if (state.filterClase) result = result.filter(c => c.clase === state.filterClase);
    if (state.filterReino) result = result.filter(c => c.reino === state.filterReino);
    if (state.filterActivo === 'activos') result = result.filter(c => c.activo);
    else if (state.filterActivo === 'inactivos') result = result.filter(c => !c.activo);
    return result;
  }

  function renderCharCard(c) {
    const done = c.tareas.filter(t => t.hecho).length;
    const total = c.tareas.length;
    const isSelected = state.selectedChar === c.nombre;
    return `
      <div class="char-card ${isSelected ? 'active' : ''} ${c.activo ? '' : 'inactive'}">
        <div style="display:flex;align-items:flex-start;justify-content:space-between">
          <div onclick="UI.selectChar('${c.nombre}')" style="flex:1;cursor:pointer">
            <div class="char-name ${clsClass(c.clase)}">${c.nombre}</div>
            <div class="char-info">
              <span class="${c.faccion === 'Horda' ? 'faction-horda' : 'faction-alliance'}">${c.faccion}</span>
              <span>Nvl ${c.nivel}</span>
            </div>
          </div>
          <button class="wow-btn wow-btn-icon" onclick="event.stopPropagation();UI.showMoveCharModal('${c.nombre}')"
                  title="Mover de warband" style="flex-shrink:0;width:28px;height:28px;font-size:0.8rem">↗</button>
        </div>
        ${total > 0 ? `
          <div class="char-tasks-bar" onclick="UI.selectChar('${c.nombre}')" style="cursor:pointer">
            ${c.tareas.map(t => `
              <span class="task-dot ${t.hecho ? 'done' : 'pending'}" title="${t.nombre}: ${t.hecho ? '✓' : '✗'}"></span>
            `).join('')}
            <span class="text-xs text-muted" style="margin-left:4px">${done}/${total}</span>
          </div>
        ` : '<div class="text-xs text-muted mt-1">Sin tareas</div>'}
      </div>
    `;
  }

  function selectChar(nombre) {
    state.selectedChar = state.selectedChar === nombre ? null : nombre;
    render();
    const detail = document.getElementById('charDetail');
    if (detail && state.selectedChar) {
      detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function renderCharDetail(nombre) {
    const el = document.getElementById('charDetail');
    if (!el) return;
    const c = DATA.getPersonaje(nombre);
    if (!c) { renderEmptyDetail(); return; }
    const weeklyTasks = c.tareas.filter(t => t.cooldown === 'weekly');
    const otherTasks = c.tareas.filter(t => t.cooldown !== 'weekly');
    const doneWeekly = weeklyTasks.filter(t => t.hecho).length;
    const totalWeekly = weeklyTasks.length;
    el.innerHTML = `
      <div class="wow-panel">
        <div class="wow-panel-header">
          <div>
            <h3>${c.nombre}</h3>
            <span class="text-xs text-muted">${c.clase} · ${c.raza} · Nvl ${c.nivel}</span>
          </div>
          <div class="flex gap-2 items-center">
            <span class="text-sm ${c.activo ? '' : 'text-muted'}">${c.activo ? '● Activo' : '○ Inactivo'}</span>
            <button class="wow-btn wow-btn-sm wow-btn-primary" onclick="UI.showAddMisionModal()" style="font-size:0.6rem;padding:2px 6px">+ Misión</button>
            <button onclick="UI.showEditCharModal('${c.nombre}')" title="Editar personaje" style="background:none;border:none;cursor:pointer;font-size:0.7rem;padding:0 2px">✏️</button>
          </div>
        </div>
        <div class="wow-panel-body">
          <div class="flex flex-wrap gap-3 mb-2 text-sm">
            <span class="${c.faccion === 'Horda' ? 'faction-horda' : 'faction-alliance'}"><strong>${c.faccion}</strong></span>
            <span class="text-muted">${c.reino}</span>
            <span class="text-gold">${c.mision_principal || 'Sin misión principal'}</span>
          </div>
          ${weeklyTasks.length > 0 ? `
            <h4 class="text-sm mb-1" style="color:var(--gold-light)">Semanales (${doneWeekly}/${totalWeekly})</h4>
            <div class="task-list mb-2">${weeklyTasks.map(t => renderTaskItem(c.nombre, t)).join('')}</div>
          ` : ''}
          ${otherTasks.length > 0 ? `
            <h4 class="text-sm mb-1 mt-2" style="color:var(--text-secondary)">Otras Tareas</h4>
            <div class="task-list">${otherTasks.map(t => renderTaskItem(c.nombre, t)).join('')}</div>
          ` : ''}
          ${c.tareas.length === 0 ? '<div class="empty-state"><p>Este personaje no tiene tareas</p></div>' : ''}
          ${renderCharMisionesSection(nombre)}
        </div>
      </div>
    `;
  }

  function renderCharMisionesSection(charName) {
    const misiones = DATA.getMisiones().filter(m => m.personaje === charName);
    if (misiones.length === 0) return `
      <div class="flex gap-2 items-center mt-2" style="border-top:1px solid var(--border);padding-top:6px">
        <h4 class="text-sm" style="color:var(--text-muted)">Misiones</h4>
        <span class="text-xs text-muted">0</span>
      </div>
    `;
    const pend = misiones.filter(m => m.estado !== 'completada').length;
    return `
      <div class="mt-2" style="border-top:1px solid var(--border);padding-top:6px">
        <div class="flex gap-2 items-center mb-1">
          <h4 class="text-sm" style="color:var(--gold-light)">Misiones</h4>
          <span class="text-xs text-muted">${pend} pendientes · ${misiones.length} total</span>
        </div>
        <div class="task-list">${misiones.map(m => renderMisionDetailItem(m)).join('')}</div>
      </div>
    `;
  }

  function renderMisionDetailItem(m) {
    return `
      <div class="task-item ${m.estado === 'completada' ? 'done' : ''}" style="position:relative">
        <input type="checkbox" class="task-check" ${m.estado === 'completada' ? 'checked' : ''}
               onchange="UI.toggleMision('${m.id}')">
        <div class="task-info">
          <div class="task-name" style="cursor:pointer" onclick="UI.editMision('${m.id}')">${m.nombre}</div>
          <div class="task-meta">
            <span class="text-xs text-muted">P${m.prioridad}</span>
            <span>${m.tiempo_min || 0} min</span>
            <span>${m.tipo}</span>
            ${m.expansion ? `<span style="color:var(--gold);font-size:0.6rem">${m.expansion}</span>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:2px;align-items:center;flex-shrink:0">
          <button onclick="UI.editMision('${m.id}')" title="Editar" style="background:none;border:none;cursor:pointer;font-size:0.65rem;padding:0 2px">✏️</button>
          <button onclick="UI.deleteMision('${m.id}')" title="Eliminar" style="background:none;border:none;cursor:pointer;font-size:0.65rem;padding:0 2px">🗑️</button>
        </div>
      </div>
    `;
  }

  function renderEmptyDetail() {
    const el = document.getElementById('charDetail');
    if (!el) return;
    el.innerHTML = `
      <div class="wow-panel">
        <div class="wow-panel-body">
          <div class="empty-state">
            <div style="font-size:2rem;margin-bottom:8px">🐉</div>
            <p>Seleccioná un personaje para ver sus tareas</p>
          </div>
        </div>
      </div>
    `;
  }

  function renderAllTasks(wbName) {
    const el = document.getElementById('charDetail');
    if (!el) return;
    const chars = DATA.getPersonajes().filter(c => c.warband === wbName && c.activo);
    const allTasks = [];
    chars.forEach(c => {
      c.tareas.forEach(t => {
        allTasks.push({ ...t, personaje: c.nombre, clase: c.clase, raza: c.raza, nivel: c.nivel });
      });
    });
    if (allTasks.length === 0) { renderEmptyDetail(); return; }
    const done = allTasks.filter(t => t.hecho).length;
    const totalMin = allTasks.reduce((s, t) => s + (t.tiempo_min || 0), 0);

    const grouped = {};
    allTasks.forEach(t => {
      if (!grouped[t.personaje]) grouped[t.personaje] = [];
      grouped[t.personaje].push(t);
    });

    el.innerHTML = `
      <div class="wow-panel">
        <div class="wow-panel-header">
          <h2>${wbName}</h2>
          <span class="text-sm text-muted">${done}/${allTasks.length} · ${totalMin}min</span>
        </div>
        <div class="wow-panel-body" style="padding:6px 10px">
          ${Object.keys(grouped).map(pName => {
            const tasks = grouped[pName];
            const d = tasks.filter(t => t.hecho).length;
            const c = DATA.getPersonajes().find(x => x.nombre === pName);
            return `
              <div style="margin-bottom:4px">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 4px;cursor:pointer" onclick="UI.selectChar('${pName}')">
                  <span class="${c ? clsClass(c.clase) : ''}" style="font-weight:600;font-size:0.75rem">${pName}</span>
                  <span class="text-xs text-muted">${d}/${tasks.length}</span>
                </div>
                <div class="task-list" style="padding-left:4px;gap:1px">
                  ${tasks.map(t => renderDashTaskItem(t)).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function setSearch(val) { state.search = val; renderWarbandContent(state.currentWarband); }
  function setFilterClase(val) { state.filterClase = val; renderWarbandContent(state.currentWarband); }
  function setFilterReino(val) { state.filterReino = val; renderWarbandContent(state.currentWarband); }
  function setFilterActivo(val) { state.filterActivo = val; renderWarbandContent(state.currentWarband); }

  // ===== TASK ITEM =====
  function renderTaskItem(charName, t) {
    return `
      <div class="task-item ${t.hecho ? 'done' : ''}" style="position:relative">
        <input type="checkbox" class="task-check" ${t.hecho ? 'checked' : ''}
               onchange="UI.toggleTask('${charName}','${t.id}')">
        <div class="task-info">
          <div class="task-name" style="cursor:pointer" onclick="UI.editTareaMision('${charName}','${t.id}')">${t.nombre}</div>
          <div class="task-meta">
            <span class="text-xs text-muted">P${t.prioridad}</span>
            <span>${t.tiempo_min} min</span>
            <span>${t.cooldown}</span>
            ${t.recompensa ? `<span class="task-reward">🎁 ${t.recompensa}</span>` : ''}
            ${t.ultimo_completado ? `<span class="text-xs text-muted">✓ ${formatDate(t.ultimo_completado)}</span>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:2px;align-items:center;flex-shrink:0">
          <button onclick="event.stopPropagation();UI.editTareaMision('${charName}','${t.id}')" title="Editar" style="background:none;border:none;cursor:pointer;font-size:0.65rem;padding:0 2px">✏️</button>
          <button onclick="event.stopPropagation();UI.deleteTareaMision('${charName}','${t.id}')" title="Eliminar" style="background:none;border:none;cursor:pointer;font-size:0.65rem;padding:0 2px">🗑️</button>
        </div>
      </div>
    `;
  }

  function toggleTask(charName, taskId) {
    DATA.toggleTarea(charName, taskId);
    render();
    GIST.doSync();
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }

  // ===== DASHBOARD DATA HELPERS =====
  function getAllTaskItems() {
    const items = [];
    DATA.getPersonajes().forEach(p => {
      if (!p.activo) return;
      p.tareas.forEach(t => {
        items.push({ ...t, personaje: p.nombre, clase: p.clase, warband: p.warband, nivel: p.nivel, faccion: p.faccion });
      });
    });
    return items;
  }

  function renderDashTaskItem(t, showChar = true) {
    const label = showChar && t.personaje ? `<span class="text-xs" style="color:var(--gold);font-weight:600">${t.personaje}</span>` : '';
    const charName = t.personaje || '';
    return `
      <div class="task-item ${t.hecho ? 'done' : ''}" style="padding:4px 6px;position:relative">
        <input type="checkbox" class="task-check" ${t.hecho ? 'checked' : ''}
               onchange="UI.toggleTask('${charName}','${t.id}')" style="width:14px;height:14px">
        <div class="task-info">
          <div class="task-name" style="font-size:0.75rem;cursor:pointer" onclick="UI.editTareaMision('${charName}','${t.id}')">${label} ${t.nombre}</div>
          <div class="task-meta" style="font-size:0.6rem">
            <span class="text-xs text-muted">P${t.prioridad}</span>
            <span>${t.tiempo_min}min</span>
            <span>${t.cooldown}</span>
            ${t.recompensa ? `<span class="task-reward">🎁 ${t.recompensa}</span>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:2px;align-items:center;flex-shrink:0">
          <button onclick="event.stopPropagation();UI.editTareaMision('${charName}','${t.id}')" title="Editar" style="background:none;border:none;cursor:pointer;font-size:0.65rem;padding:0 2px">✏️</button>
          <button onclick="event.stopPropagation();UI.deleteTareaMision('${charName}','${t.id}')" title="Eliminar" style="background:none;border:none;cursor:pointer;font-size:0.65rem;padding:0 2px">🗑️</button>
        </div>
      </div>
    `;
  }

  function selectCharFromTable(nombre) {
    state.currentView = 'warband';
    state.selectedChar = nombre;
    state.currentWarband = DATA.getPersonaje(nombre)?.warband || state.currentWarband;
    render();
  }

  function setPriorityTab(v) { state.priorityFilter.priority = v; render(); }
  function setPriorityWarband(v) { state.priorityFilter.warband = v; render(); }
  function setTimeTab(v) { state.timeFilter.time = v; render(); }
  function setTimeWarband(v) { state.timeFilter.warband = v; render(); }

  // ===== TABLA UNIFICADA =====
  function renderTablaUnificada() {
    const el = document.getElementById('dashboardPanel');
    if (!el) return;
    const cfg = state.tablaFilter;
    const tareas = getAllTaskItems().map(t => ({ ...t, _origen: 'tarea', _charName: t.personaje }));
    const misiones = DATA.getMisiones().map(m => ({
      id: m.id, nombre: m.nombre, personaje: m.personaje || '', tipo: m.tipo,
      expansion: m.expansion || '', tags: m.tags || [], prioridad: m.prioridad,
      tiempo_min: m.tiempo_min || 0, recompensa: '', cooldown: m.tipo,
      estado: m.estado, hecho: m.estado === 'completada', clase: '', warband: '',
      faccion: '', reino: '', activo: true, nivel: 0,
      _origen: 'mision', _charName: m.personaje || ''
    }));
    let all = [...tareas, ...misiones];
    all = applyTablaFiltros(all);
    el.innerHTML = `
      <div class="wow-panel">
        <div class="wow-panel-header">
          <h2>📋 Tabla Unificada</h2>
          <div class="flex gap-2 items-center">
            <span class="text-sm text-muted">${all.length} ítems</span>
            <button class="wow-btn wow-btn-sm wow-btn-primary" onclick="UI.showAddMisionModal()">+ Nueva</button>
          </div>
        </div>
        <div class="wow-panel-body" style="padding:6px 8px">
          ${renderTablaFiltros(cfg)}
          <div class="task-table-wrap" style="margin-top:4px">
            <table class="task-table">
              <thead>
                <tr>
                  <th style="width:24px"></th>
                  <th style="width:85px">Personaje</th>
                  <th>Nombre</th>
                  <th style="width:48px">Tipo</th>
                  <th style="width:38px">Exp</th>
                  <th style="width:32px">Prio</th>
                  <th style="width:40px">Tiempo</th>
                  <th style="width:42px">Cool.</th>
                  <th>Recompensa</th>
                  <th style="width:52px">Estado</th>
                  <th style="width:42px"></th>
                </tr>
              </thead>
              <tbody>
                ${all.length === 0 ? '<tr><td colspan="11" style="text-align:center;padding:16px;color:var(--text-muted);font-size:0.75rem">No hay ítems. ¡Creá una tarea o misión!</td></tr>'
                  : all.map(item => {
                    const isTarea = item._origen === 'tarea';
                    const charName = item._charName || '';
                    const toggleCall = isTarea ? `UI.toggleTareaMision('${charName}','${item.id}')` : `UI.toggleMision('${item.id}')`;
                    const editCall = isTarea ? `UI.editTareaMision('${charName}','${item.id}')` : `UI.editMision('${item.id}')`;
                    const deleteCall = isTarea ? `UI.deleteTareaMision('${charName}','${item.id}')` : `UI.deleteMision('${item.id}')`;
                    const done = isTarea ? item.hecho : item.estado === 'completada';
                    return `<tr class="${done ? 'done' : ''}" style="${done ? 'opacity:0.55' : ''}">
                      <td><input type="checkbox" class="task-check" ${done ? 'checked' : ''} onchange="${toggleCall}"></td>
                      <td class="char-cell ${clsClass(item.clase)}" onclick="UI.selectCharFromTable('${charName}')" style="cursor:pointer;font-size:0.7rem">${item.personaje || '—'}</td>
                      <td style="font-size:0.7rem;cursor:pointer" onclick="${editCall}">${item.nombre}${item.tags && item.tags.length ? ' ' + item.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('') : ''}</td>
                      <td><span class="text-xs text-muted">${item.tipo}</span></td>
                      <td><span class="text-xs" style="color:var(--gold);font-weight:500">${item.expansion || '—'}</span></td>
                      <td><span class="text-xs text-muted">P${item.prioridad}</span></td>
                      <td class="text-xs text-muted">${item.tiempo_min}min</td>
                      <td class="text-xs text-muted">${item.cooldown}</td>
                      <td class="text-xs">${item.recompensa ? '<span class="task-reward">🎁 ' + item.recompensa + '</span>' : ''}</td>
                      <td><span class="text-xs ${done ? 'text-muted' : ''}" style="${!done ? 'color:var(--gold)' : ''}">${done ? '✓ Hecho' : '○ Pendiente'}</span></td>
                      <td style="white-space:nowrap">
                        <button onclick="${editCall}" title="Editar" style="background:none;border:none;cursor:pointer;font-size:0.65rem;padding:0 2px">✏️</button>
                        <button onclick="${deleteCall}" title="Eliminar" style="background:none;border:none;cursor:pointer;font-size:0.65rem;padding:0 2px">🗑️</button>
                      </td>
                    </tr>`;
                  }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  }

  function renderTablaFiltros(cfg) {
    const warbands = DATA.getWarbands();
    const personajes = DATA.getPersonajes();
    const todos = personajes.map(p => p.nombre);
    return `
      <div class="filter-bar mb-1" style="gap:2px;flex-wrap:wrap">
        <span class="text-xs text-muted">Pers:</span>
        <select onchange="UI.setTablaFilterPersonaje(this.value)" style="font-size:0.55rem;padding:1px 3px;max-width:80px">
          <option value="">Todos</option>
          ${todos.map(n => `<option value="${n}" ${cfg.filterPersonaje === n ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
        <span class="text-xs text-muted">Wb:</span>
        <select onchange="UI.setTablaFilterWarband(this.value)" style="font-size:0.55rem;padding:1px 3px;max-width:70px">
          <option value="">Todos</option>
          ${warbands.map(w => `<option value="${w.nombre}" ${cfg.filterWarband === w.nombre ? 'selected' : ''}>${w.nombre}</option>`).join('')}
        </select>
        <span class="text-xs text-muted">Tipo:</span>
        <select onchange="UI.setTablaFilterTipo(this.value)" style="font-size:0.55rem;padding:1px 3px;max-width:70px">
          <option value="">Todos</option>
          <option value="weekly" ${cfg.filterTipo === 'weekly' ? 'selected' : ''}>Semanal</option>
          <option value="daily" ${cfg.filterTipo === 'daily' ? 'selected' : ''}>Diaria</option>
          <option value="farm_libre" ${cfg.filterTipo === 'farm_libre' ? 'selected' : ''}>Farm</option>
          <option value="mision" ${cfg.filterTipo === 'mision' ? 'selected' : ''}>Misión</option>
          <option value="achievement" ${cfg.filterTipo === 'achievement' ? 'selected' : ''}>Logro</option>
        </select>
        <span class="text-xs text-muted">Exp:</span>
        <select onchange="UI.setTablaFilterExpansion(this.value)" style="font-size:0.55rem;padding:1px 3px;max-width:65px">
          <option value="">Todas</option>
          <option value="tww" ${cfg.filterExpansion === 'tww' ? 'selected' : ''}>TWW</option>
          <option value="dragonflight" ${cfg.filterExpansion === 'dragonflight' ? 'selected' : ''}>DF</option>
          <option value="shadowlands" ${cfg.filterExpansion === 'shadowlands' ? 'selected' : ''}>SL</option>
          <option value="legion" ${cfg.filterExpansion === 'legion' ? 'selected' : ''}>Legion</option>
          <option value="bfa" ${cfg.filterExpansion === 'bfa' ? 'selected' : ''}>BFA</option>
          <option value="draenor" ${cfg.filterExpansion === 'draenor' ? 'selected' : ''}>Draenor</option>
          <option value="mop" ${cfg.filterExpansion === 'mop' ? 'selected' : ''}>MOP</option>
          <option value="cata" ${cfg.filterExpansion === 'cata' ? 'selected' : ''}>Cata</option>
          <option value="wotlk" ${cfg.filterExpansion === 'wotlk' ? 'selected' : ''}>WOTLK</option>
          <option value="midnight" ${cfg.filterExpansion === 'midnight' ? 'selected' : ''}>Mid.</option>
          <option value="classic" ${cfg.filterExpansion === 'classic' ? 'selected' : ''}>Classic</option>
        </select>
        <span class="text-xs text-muted">Prio:</span>
        <select onchange="UI.setTablaFilterPriority(this.value)" style="font-size:0.55rem;padding:1px 3px;max-width:50px">
          <option value="">Todas</option><option value="1" ${cfg.filterPriority === '1' ? 'selected' : ''}>P1</option>
          <option value="2" ${cfg.filterPriority === '2' ? 'selected' : ''}>P2</option>
          <option value="3" ${cfg.filterPriority === '3' ? 'selected' : ''}>P3</option>
        </select>
        <span class="text-xs text-muted">Tpo:</span>
        <select onchange="UI.setTablaFilterTime(this.value)" style="font-size:0.55rem;padding:1px 3px;max-width:55px">
          <option value="">Todos</option>
          <option value="rapido" ${cfg.filterTime === 'rapido' ? 'selected' : ''}>≤15m</option>
          <option value="medio" ${cfg.filterTime === 'medio' ? 'selected' : ''}>16-30</option>
          <option value="largo" ${cfg.filterTime === 'largo' ? 'selected' : ''}>31-60</option>
          <option value="maraton" ${cfg.filterTime === 'maraton' ? 'selected' : ''}>>60</option>
        </select>
        <span class="text-xs text-muted">Edo:</span>
        <select onchange="UI.setTablaFilterEstado(this.value)" style="font-size:0.55rem;padding:1px 3px;max-width:65px">
          <option value="">Todos</option>
          <option value="pendiente" ${cfg.filterEstado === 'pendiente' ? 'selected' : ''}>Pend.</option>
          <option value="completada" ${cfg.filterEstado === 'completada' ? 'selected' : ''}>Hecho</option>
        </select>
        <input type="text" placeholder="🔍" value="${cfg.filterSearch}"
               oninput="UI.setTablaFilterSearch(this.value)"
               style="font-size:0.55rem;padding:1px 3px;width:60px">
      </div>
      <div class="filter-bar" style="gap:2px;flex-wrap:wrap;margin-top:2px">
        <span class="text-xs text-muted">Clase:</span>
        <select onchange="UI.setTablaFilterClase(this.value)" style="font-size:0.55rem;padding:1px 3px;max-width:80px">
          <option value="">Todas</option>
          ${[...new Set(DATA.getPersonajes().map(c => c.clase))].sort().map(cl =>
            `<option value="${cl}" ${cfg.filterClase === cl ? 'selected' : ''}>${cl}</option>`
          ).join('')}
        </select>
        <span class="text-xs text-muted">Facción:</span>
        <select onchange="UI.setTablaFilterFaccion(this.value)" style="font-size:0.55rem;padding:1px 3px;max-width:65px">
          <option value="">Todas</option>
          <option value="Horda" ${cfg.filterFaccion === 'Horda' ? 'selected' : ''}>Horda</option>
          <option value="Alianza" ${cfg.filterFaccion === 'Alianza' ? 'selected' : ''}>Alianza</option>
        </select>
        <span class="text-xs text-muted">Reino:</span>
        <select onchange="UI.setTablaFilterReino(this.value)" style="font-size:0.55rem;padding:1px 3px;max-width:70px">
          <option value="">Todos</option>
          ${[...new Set(DATA.getPersonajes().map(c => c.reino))].sort().map(r =>
            `<option value="${r}" ${cfg.filterReino === r ? 'selected' : ''}>${r}</option>`
          ).join('')}
        </select>
        <span class="text-xs text-muted">Activo:</span>
        <select onchange="UI.setTablaFilterActivo(this.value)" style="font-size:0.55rem;padding:1px 3px;max-width:60px">
          <option value="">Todos</option>
          <option value="si" ${cfg.filterActivo === 'si' ? 'selected' : ''}>Sí</option>
          <option value="no" ${cfg.filterActivo === 'no' ? 'selected' : ''}>No</option>
        </select>
        <span class="text-xs text-muted">Cool:</span>
        <select onchange="UI.setTablaFilterCooldown(this.value)" style="font-size:0.55rem;padding:1px 3px;max-width:70px">
          <option value="">Todos</option>
          <option value="weekly" ${cfg.filterCooldown === 'weekly' ? 'selected' : ''}>Semanal</option>
          <option value="daily" ${cfg.filterCooldown === 'daily' ? 'selected' : ''}>Diaria</option>
          <option value="farm_libre" ${cfg.filterCooldown === 'farm_libre' ? 'selected' : ''}>Farm</option>
        </select>
      </div>`;
  }

  function applyTablaFiltros(items) {
    const cfg = state.tablaFilter;
    const personajes = DATA.getPersonajes();
    if (cfg.filterPersonaje) items = items.filter(m => m.personaje === cfg.filterPersonaje);
    if (cfg.filterWarband) {
      const wbChars = personajes.filter(p => p.warband === cfg.filterWarband).map(p => p.nombre);
      items = items.filter(m => !m.personaje || wbChars.includes(m.personaje));
    }
    if (cfg.filterTipo) items = items.filter(m => m.tipo === cfg.filterTipo);
    if (cfg.filterExpansion) items = items.filter(m => m.expansion === cfg.filterExpansion);
    if (cfg.filterPriority) items = items.filter(m => m.prioridad === parseInt(cfg.filterPriority));
    if (cfg.filterTime) {
      if (cfg.filterTime === 'rapido') items = items.filter(m => (m.tiempo_min || 0) <= 15);
      else if (cfg.filterTime === 'medio') items = items.filter(m => (m.tiempo_min || 0) >= 16 && (m.tiempo_min || 0) <= 30);
      else if (cfg.filterTime === 'largo') items = items.filter(m => (m.tiempo_min || 0) >= 31 && (m.tiempo_min || 0) <= 60);
      else if (cfg.filterTime === 'maraton') items = items.filter(m => (m.tiempo_min || 0) > 60);
    }
    if (cfg.filterEstado === 'pendiente') items = items.filter(m => !m.hecho && m.estado !== 'completada');
    else if (cfg.filterEstado === 'completada') items = items.filter(m => m.hecho || m.estado === 'completada');
    if (cfg.filterClase) items = items.filter(m => m.clase === cfg.filterClase);
    if (cfg.filterFaccion) items = items.filter(m => m.faccion === cfg.filterFaccion);
    if (cfg.filterReino) items = items.filter(m => m.reino === cfg.filterReino);
    if (cfg.filterActivo === 'si') items = items.filter(m => m.activo !== false);
    else if (cfg.filterActivo === 'no') items = items.filter(m => m.activo === false);
    if (cfg.filterCooldown) items = items.filter(m => m.cooldown === cfg.filterCooldown);
    if (cfg.filterSearch) {
      const q = cfg.filterSearch.toLowerCase();
      items = items.filter(m => m.nombre.toLowerCase().includes(q) || (m.personaje || '').toLowerCase().includes(q));
    }
    return items;
  }

  function setTablaFilterPersonaje(v) { state.tablaFilter.filterPersonaje = v; render(); }
  function setTablaFilterWarband(v) { state.tablaFilter.filterWarband = v; render(); }
  function setTablaFilterTipo(v) { state.tablaFilter.filterTipo = v; render(); }
  function setTablaFilterExpansion(v) { state.tablaFilter.filterExpansion = v; render(); }
  function setTablaFilterPriority(v) { state.tablaFilter.filterPriority = v; render(); }
  function setTablaFilterTime(v) { state.tablaFilter.filterTime = v; render(); }
  function setTablaFilterEstado(v) { state.tablaFilter.filterEstado = v; render(); }
  function setTablaFilterSearch(v) { state.tablaFilter.filterSearch = v; render(); }
  function setTablaFilterClase(v) { state.tablaFilter.filterClase = v; render(); }
  function setTablaFilterFaccion(v) { state.tablaFilter.filterFaccion = v; render(); }
  function setTablaFilterReino(v) { state.tablaFilter.filterReino = v; render(); }
  function setTablaFilterActivo(v) { state.tablaFilter.filterActivo = v; render(); }
  function setTablaFilterCooldown(v) { state.tablaFilter.filterCooldown = v; render(); }

  function toggleMision(id) {
    DATA.toggleMision(id);
    render();
    GIST.doSync();
  }

  function showAddMisionModal() {
    const personajes = DATA.getPersonajes();
    const selectedChar = state.selectedChar || '';
    const charOpts = '<option value="">(sin personaje)</option>' + personajes.map(p =>
      `<option value="${p.nombre}" ${p.nombre === selectedChar ? 'selected' : ''}>${p.nombre}</option>`
    ).join('');
    showModal('Nueva Misión', `
      <div class="form-group">
        <label>Nombre de la misión</label>
        <input type="text" id="misionNombre" placeholder="Ej: Farmear Invincible" style="width:100%">
      </div>
      <div class="form-group">
        <label>Personaje (opcional)</label>
        <select id="misionPersonaje" style="width:100%">${charOpts}</select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <div class="form-group">
          <label>Tipo</label>
          <select id="misionTipo" style="width:100%">
            <option value="mision">Misión</option>
            <option value="achievement">Logro</option>
            <option value="daily">Diaria</option>
            <option value="weekly">Semanal</option>
          </select>
        </div>
        <div class="form-group">
          <label>Expansión</label>
          <select id="misionExpansion" style="width:100%">
            <option value="">(ninguna)</option>
            <option value="tww">TWW</option>
            <option value="dragonflight">Dragonflight</option>
            <option value="shadowlands">Shadowlands</option>
            <option value="legion">Legion</option>
            <option value="bfa">BFA</option>
            <option value="draenor">Draenor</option>
            <option value="mop">MOP</option>
            <option value="cata">Cata</option>
            <option value="wotlk">WOTLK</option>
            <option value="midnight">Midnight</option>
            <option value="classic">Classic</option>
          </select>
        </div>
        <div class="form-group">
          <label>Prioridad</label>
          <select id="misionPrioridad" style="width:100%">
            <option value="1">P1 - Alta</option>
            <option value="2" selected>P2 - Media</option>
            <option value="3">P3 - Baja</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tiempo (min)</label>
          <input type="number" id="misionTiempo" value="30" min="0" style="width:100%">
        </div>
      </div>
      <div class="form-group">
        <label>Etiquetas (separadas por coma)</label>
        <input type="text" id="misionTags" placeholder="raids, mounts, weekly" style="width:100%">
      </div>
    `, 'Cancelar', () => {
      const nombre = document.getElementById('misionNombre').value.trim();
      if (!nombre) { showAlert('❌ Ingresá un nombre'); return; }
      const tags = document.getElementById('misionTags').value.split(',').map(s => s.trim()).filter(Boolean);
      DATA.addMision({
        nombre,
        personaje: document.getElementById('misionPersonaje').value,
        tipo: document.getElementById('misionTipo').value,
        expansion: document.getElementById('misionExpansion').value,
        tags,
        estado: 'pendiente',
        prioridad: parseInt(document.getElementById('misionPrioridad').value),
        tiempo_min: parseInt(document.getElementById('misionTiempo').value) || 0
      });
      render();
      GIST.doSync();
      closeModal();
      showAlert('✅ Misión creada');
    }, 'Crear');
    setTimeout(() => document.getElementById('misionNombre').focus(), 100);
  }

  function editMision(id) {
    const m = DATA.getMisiones().find(mx => mx.id === id);
    if (!m) return;
    const personajes = DATA.getPersonajes();
    const charOpts = '<option value="">(sin personaje)</option>' + personajes.map(p => `<option value="${p.nombre}" ${m.personaje === p.nombre ? 'selected' : ''}>${p.nombre}</option>`).join('');
    showModal('Editar Misión', `
      <div class="form-group">
        <label>Nombre</label>
        <input type="text" id="misionNombreEdit" value="${m.nombre}" style="width:100%">
      </div>
      <div class="form-group">
        <label>Personaje</label>
        <select id="misionPersonajeEdit" style="width:100%">${charOpts}</select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <div class="form-group">
          <label>Tipo</label>
          <select id="misionTipoEdit" style="width:100%">
            <option value="mision" ${m.tipo === 'mision' ? 'selected' : ''}>Misión</option>
            <option value="achievement" ${m.tipo === 'achievement' ? 'selected' : ''}>Logro</option>
            <option value="daily" ${m.tipo === 'daily' ? 'selected' : ''}>Diaria</option>
            <option value="weekly" ${m.tipo === 'weekly' ? 'selected' : ''}>Semanal</option>
          </select>
        </div>
        <div class="form-group">
          <label>Expansión</label>
          <select id="misionExpansionEdit" style="width:100%">
            <option value="">(ninguna)</option>
            <option value="tww" ${m.expansion === 'tww' ? 'selected' : ''}>TWW</option>
            <option value="dragonflight" ${m.expansion === 'dragonflight' ? 'selected' : ''}>Dragonflight</option>
            <option value="shadowlands" ${m.expansion === 'shadowlands' ? 'selected' : ''}>Shadowlands</option>
            <option value="legion" ${m.expansion === 'legion' ? 'selected' : ''}>Legion</option>
            <option value="bfa" ${m.expansion === 'bfa' ? 'selected' : ''}>BFA</option>
            <option value="draenor" ${m.expansion === 'draenor' ? 'selected' : ''}>Draenor</option>
            <option value="mop" ${m.expansion === 'mop' ? 'selected' : ''}>MOP</option>
            <option value="cata" ${m.expansion === 'cata' ? 'selected' : ''}>Cata</option>
            <option value="wotlk" ${m.expansion === 'wotlk' ? 'selected' : ''}>WOTLK</option>
            <option value="midnight" ${m.expansion === 'midnight' ? 'selected' : ''}>Midnight</option>
            <option value="classic" ${m.expansion === 'classic' ? 'selected' : ''}>Classic</option>
          </select>
        </div>
        <div class="form-group">
          <label>Prioridad</label>
          <select id="misionPrioridadEdit" style="width:100%">
            <option value="1" ${m.prioridad === 1 ? 'selected' : ''}>P1 - Alta</option>
            <option value="2" ${m.prioridad === 2 ? 'selected' : ''}>P2 - Media</option>
            <option value="3" ${m.prioridad === 3 ? 'selected' : ''}>P3 - Baja</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tiempo (min)</label>
          <input type="number" id="misionTiempoEdit" value="${m.tiempo_min || 30}" min="0" style="width:100%">
        </div>
      </div>
      <div class="form-group">
        <label>Etiquetas (separadas por coma)</label>
        <input type="text" id="misionTagsEdit" value="${(m.tags || []).join(', ')}" style="width:100%">
      </div>
    `, 'Cancelar', () => {
      const nombre = document.getElementById('misionNombreEdit').value.trim();
      if (!nombre) { showAlert('❌ Ingresá un nombre'); return; }
      const tags = document.getElementById('misionTagsEdit').value.split(',').map(s => s.trim()).filter(Boolean);
      DATA.updateMision(id, {
        nombre,
        personaje: document.getElementById('misionPersonajeEdit').value,
        tipo: document.getElementById('misionTipoEdit').value,
        expansion: document.getElementById('misionExpansionEdit').value,
        tags,
        prioridad: parseInt(document.getElementById('misionPrioridadEdit').value),
        tiempo_min: parseInt(document.getElementById('misionTiempoEdit').value) || 0
      });
      render();
      GIST.doSync();
      closeModal();
    }, 'Guardar');
  }

  function deleteMision(id) {
    const m = DATA.getMisiones().find(mx => mx.id === id);
    if (!m) return;
    showModal('Eliminar Misión', `
      <p class="text-sm">¿Eliminar "<strong>${m.nombre}</strong>"?</p>
    `, 'Cancelar', () => {
      DATA.deleteMision(id);
      render();
      GIST.doSync();
      closeModal();
    }, 'Eliminar');
  }

  // ===== TAREA MISION HELPERS (desde tabla Misiones) =====
  function toggleTareaMision(charName, taskId) {
    DATA.toggleTarea(charName, taskId);
    render();
    GIST.doSync();
  }

  function editTareaMision(charName, taskId) {
    const personajes = DATA.getPersonajes();
    const p = personajes.find(c => c.nombre === charName);
    if (!p) return;
    const t = p.tareas.find(tk => tk.id === taskId);
    if (!t) return;
    showModal(`Editar Tarea (${charName})`, `
      <div class="form-group">
        <label>Nombre</label>
        <input type="text" id="tareaNombreEdit" value="${t.nombre}" style="width:100%">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <div class="form-group">
          <label>Tipo</label>
          <select id="tareaTipoEdit" style="width:100%">
            <option value="weekly" ${t.tipo === 'weekly' ? 'selected' : ''}>Semanal</option>
            <option value="daily" ${t.tipo === 'daily' ? 'selected' : ''}>Diaria</option>
            <option value="farm_libre" ${t.tipo === 'farm_libre' ? 'selected' : ''}>Farm Libre</option>
          </select>
        </div>
        <div class="form-group">
          <label>Expansión</label>
          <select id="tareaExpansionEdit" style="width:100%">
            <option value="">(ninguna)</option>
            <option value="tww" ${t.expansion === 'tww' ? 'selected' : ''}>TWW</option>
            <option value="dragonflight" ${t.expansion === 'dragonflight' ? 'selected' : ''}>Dragonflight</option>
            <option value="shadowlands" ${t.expansion === 'shadowlands' ? 'selected' : ''}>Shadowlands</option>
            <option value="legion" ${t.expansion === 'legion' ? 'selected' : ''}>Legion</option>
            <option value="bfa" ${t.expansion === 'bfa' ? 'selected' : ''}>BFA</option>
            <option value="draenor" ${t.expansion === 'draenor' ? 'selected' : ''}>Draenor</option>
            <option value="mop" ${t.expansion === 'mop' ? 'selected' : ''}>MOP</option>
            <option value="cata" ${t.expansion === 'cata' ? 'selected' : ''}>Cata</option>
            <option value="wotlk" ${t.expansion === 'wotlk' ? 'selected' : ''}>WOTLK</option>
            <option value="midnight" ${t.expansion === 'midnight' ? 'selected' : ''}>Midnight</option>
            <option value="classic" ${t.expansion === 'classic' ? 'selected' : ''}>Classic</option>
          </select>
        </div>
        <div class="form-group">
          <label>Prioridad</label>
          <select id="tareaPrioridadEdit" style="width:100%">
            <option value="1" ${t.prioridad === 1 ? 'selected' : ''}>P1</option>
            <option value="2" ${t.prioridad === 2 ? 'selected' : ''}>P2</option>
            <option value="3" ${t.prioridad === 3 ? 'selected' : ''}>P3</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tiempo (min)</label>
          <input type="number" id="tareaTiempoEdit" value="${t.tiempo_min || 30}" min="0" style="width:100%">
        </div>
      </div>
      <div class="form-group">
        <label>Etiquetas (separadas por coma)</label>
        <input type="text" id="tareaTagsEdit" value="${(t.tags || []).join(', ')}" style="width:100%">
      </div>
    `, 'Cancelar', () => {
      const nombre = document.getElementById('tareaNombreEdit').value.trim();
      if (!nombre) { showAlert('❌ Ingresá un nombre'); return; }
      const tags = document.getElementById('tareaTagsEdit').value.split(',').map(s => s.trim()).filter(Boolean);
      DATA.updateTarea(charName, taskId, {
        nombre,
        tipo: document.getElementById('tareaTipoEdit').value,
        expansion: document.getElementById('tareaExpansionEdit').value,
        tags,
        prioridad: parseInt(document.getElementById('tareaPrioridadEdit').value),
        tiempo_min: parseInt(document.getElementById('tareaTiempoEdit').value) || 0
      });
      render();
      GIST.doSync();
      closeModal();
      showAlert('✅ Tarea actualizada');
    }, 'Guardar');
    setTimeout(() => document.getElementById('tareaNombreEdit').focus(), 100);
  }

  function deleteTareaMision(charName, taskId) {
    showModal('Eliminar Tarea', `
      <p class="text-sm">¿Eliminar tarea de <strong>${charName}</strong>?</p>
    `, 'Cancelar', () => {
      DATA.deleteTarea(charName, taskId);
      render();
      GIST.doSync();
      closeModal();
    }, 'Eliminar');
  }

  // ===== PRIORITY VIEW =====
  function renderPriorityView() {
    const el = document.getElementById('dashboardPanel');
    if (!el) return;
    const pf = state.priorityFilter;
    let tasks = getAllTaskItems().filter(t => !t.hecho);
    let missions = DATA.getMisiones().filter(m => m.estado !== 'completada');
    if (pf.priority) { tasks = tasks.filter(t => t.prioridad === parseInt(pf.priority)); missions = missions.filter(m => m.prioridad === parseInt(pf.priority)); }
    if (pf.warband) { tasks = tasks.filter(t => t.warband === pf.warband); const wbChars = DATA.getPersonajes().filter(c => c.warband === pf.warband).map(c => c.nombre); missions = missions.filter(m => !m.personaje || wbChars.includes(m.personaje)); }
    el.innerHTML = `
      <div class="wow-panel">
        <div class="wow-panel-body" style="padding:4px 6px">
          ${renderTabBar(PRIORITY_TABS, pf.priority, 'UI.setPriorityTab')}
          ${renderTabBar(getWarbandTabs(), pf.warband, 'UI.setPriorityWarband')}
          <div style="margin-top:4px">
            ${renderViewList('Tareas Pendientes', tasks, missions.length > 0, 'task')}
            ${renderViewList('Misiones Pendientes', missions, tasks.length > 0, 'mission')}
            ${tasks.length === 0 && missions.length === 0 ? '<div class="empty-state" style="padding:12px"><p>Todo completado 🎉</p></div>' : ''}
          </div>
        </div>
      </div>
    `;
  }

  // ===== TIME VIEW =====
  function renderTimeView() {
    const el = document.getElementById('dashboardPanel');
    if (!el) return;
    const tf = state.timeFilter;
    let tasks = getAllTaskItems().filter(t => !t.hecho);
    let missions = DATA.getMisiones().filter(m => m.estado !== 'completada' && (m.tiempo_min || 0) > 0);
    if (tf.time) { const r = TIME_RANGES.find(x => x.key === tf.time); if (r) { tasks = tasks.filter(r.fn); missions = missions.filter(r.fn); } }
    if (tf.warband) { tasks = tasks.filter(t => t.warband === tf.warband); const wbChars = DATA.getPersonajes().filter(c => c.warband === tf.warband).map(c => c.nombre); missions = missions.filter(m => !m.personaje || wbChars.includes(m.personaje)); }
    el.innerHTML = `
      <div class="wow-panel">
        <div class="wow-panel-body" style="padding:4px 6px">
          ${renderTabBar(TIME_TABS, tf.time, 'UI.setTimeTab')}
          ${renderTabBar(getWarbandTabs(), tf.warband, 'UI.setTimeWarband')}
          <div style="margin-top:4px">
            ${renderViewList('Tareas por Tiempo', tasks, missions.length > 0, 'task')}
            ${renderViewList('Misiones por Tiempo', missions, tasks.length > 0, 'mission')}
            ${tasks.length === 0 && missions.length === 0 ? '<div class="empty-state" style="padding:12px"><p>Todo completado 🎉</p></div>' : ''}
          </div>
        </div>
      </div>
    `;
  }

  function getWarbandTabs() {
    return [{ key: '', label: 'Todas' }, ...DATA.getWarbands().map(w => ({ key: w.nombre, label: `${w.nombre} (${w.personajes.length})` }))];
  }

  function renderTabBar(tabs, current, callback) {
    return `<div class="warband-tabs" style="margin:0">${tabs.map(t =>
      `<button class="warband-tab ${t.key === current ? 'active' : ''}" onclick="${callback}('${t.key}')">${t.label || t.key}</button>`
    ).join('')}</div>`;
  }

  function renderViewList(title, items, hasOtherSection, type) {
    if (items.length === 0) return '';
    const margin = hasOtherSection ? 'mb-2' : '';
    return `
      <h4 class="text-sm mb-1 mt-1 ${margin}" style="color:var(--text-secondary)">${title} <span class="text-xs text-muted">(${items.length})</span></h4>
      <div class="task-list" style="gap:1px">
        ${items.map(t => type === 'mission' ? renderCompactMissionItem(t) : renderCompactTaskItem(t)).join('')}
      </div>
    `;
  }

  function renderCompactTaskItem(t) {
    return `
      <div class="task-item ${t.hecho ? 'done' : ''}" style="padding:3px 6px;gap:4px;border-radius:2px">
        <input type="checkbox" class="task-check" ${t.hecho ? 'checked' : ''}
               onchange="UI.toggleTask('${t.personaje}','${t.id}')" style="width:14px;height:14px">
        <div class="task-info">
          <div class="task-name" style="font-size:0.7rem;display:flex;gap:4px;align-items:center">
            <span class="text-xs" style="color:var(--gold);font-weight:600">${t.personaje}</span>
            <span>${t.nombre}</span>
          </div>
          <div class="task-meta" style="font-size:0.55rem">
            <span class="text-xs text-muted">P${t.prioridad}</span>
            <span>${t.tiempo_min}min</span>
            <span class="text-muted">${t.cooldown}</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderCompactMissionItem(m) {
    return `
      <div class="task-item ${m.estado === 'completada' ? 'done' : ''}" style="padding:3px 6px;gap:4px;border-radius:2px">
        <input type="checkbox" class="task-check" ${m.estado === 'completada' ? 'checked' : ''}
               onchange="UI.toggleMision('${m.id}')" style="width:14px;height:14px">
        <div class="task-info">
          <div class="task-name" style="font-size:0.7rem;display:flex;gap:4px;align-items:center">
            <span class="text-xs" style="color:var(--gold);font-weight:600">${m.personaje || 'General'}</span>
            <span>${m.nombre}</span>
          </div>
          <div class="task-meta" style="font-size:0.55rem">
            <span class="text-xs text-muted">P${m.prioridad}</span>
            <span>${m.tiempo_min || 0}min</span>
            <span class="text-muted">${m.tipo}</span>
          </div>
        </div>
      </div>
    `;
  }

  // ===== PERSONAJES VIEW (WoW Character Selection) =====
  function persEscapeHandler(e) {
    if (e.key === 'Escape' && state.currentView === 'personajes') {
      const modal = document.getElementById('modalOverlay');
      if (modal && modal.classList.contains('open')) return;
      e.preventDefault();
      resetPersAll();
    }
  }

  function renderPersonajesView() {
    const panel = document.getElementById('personajesPanel');
    if (!panel) return;
    document.addEventListener('keydown', persEscapeHandler);
    panel.innerHTML = `
      <div class="pers-header">
        <div class="pers-faction-title a">⚔ ALIANZA</div>
        <div class="pers-center-title">
          ✦ SELECCIÓN DE PERSONAJE ✦
          <small>ELIGE TU RAZA · FILTRA TU CLASE</small>
        </div>
        <div class="pers-faction-title h">HORDA ⚔</div>
      </div>
      <div class="pers-body-row">
        <div class="pers-race-panel" id="pers-panel-alliance"><div class="pers-panel-faction-label a">[ ALIANZA ]</div></div>
        <div id="pers-panel-center">
          <pre id="pers-bg-art"></pre>
          <div id="pers-filter-bar"></div>
          <div id="pers-char-grid"></div>
          <div id="pers-class-bar-wrap"><div id="pers-class-bar"></div></div>
        </div>
        <div class="pers-race-panel" id="pers-panel-horde"><div class="pers-panel-faction-label h">[ HORDA ]</div></div>
      </div>
      <div id="pers-footer">
        <button class="pers-foot-btn" onclick="UI.closePersonajes()">◄ VOLVER</button>
        <div class="pers-realm-info">
          Raganaros Realm · PvP · <span class="pers-realm-ping">⬤ 44ms</span>
          <br>Personaje: <span id="pers-selected-label" style="color:var(--gold)">—</span>
        </div>
        <button class="pers-foot-btn primary" id="pers-btn-enter" disabled onclick="UI.editSelectedPersonaje()">EDITAR PERSONAJE ►</button>
      </div>`;
    buildPersRacePanels();
    buildPersFilterBar();
    buildPersClassBar();
    renderPersCharGrid();
    updatePersBgArt();
    // Restore selected char state after re-render
    if (persSelectedChar) {
      const c = DATA.getPersonaje(persSelectedChar);
      document.getElementById('pers-selected-label').textContent = c ? `${c.nombre} (Nv.${c.nivel} ${c.raza})` : persSelectedChar;
      document.getElementById('pers-btn-enter').disabled = false;
    } else {
      document.getElementById('pers-selected-label').textContent = '—';
      document.getElementById('pers-btn-enter').disabled = true;
    }
  }

  function updatePersBgArt() {
    const el = document.getElementById('pers-bg-art');
    if (!el) return;
    el.textContent = PERS_BG_SCENES[persFactionFilter] || PERS_BG_SCENES.all;
  }

  function buildPersRacePanels() {
    const chars = DATA.getPersonajes();
    const factions = { alliance: [], horde: [] };
    const seen = { alliance: new Set(), horde: new Set() };
    chars.forEach(c => {
      const faction = c.faccion === 'Alianza' ? 'alliance' : 'horde';
      if (!seen[faction].has(c.raza)) {
        seen[faction].add(c.raza);
        const info = PERS_RACE_INFO[c.raza] || { icon: '❓', type: '' };
        factions[faction].push({ nombre: c.raza, icon: info.icon, type: info.type });
      }
    });
    Object.keys(factions).forEach(f => factions[f].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    ['alliance','horde'].forEach(faction => {
      const panel = document.getElementById(`pers-panel-${faction}`);
      if (!panel) return;
      const isSelected = (r) => persSelectedRace === r.nombre && persSelectedFaction === faction;
      const cls = (r) => isSelected(r) ? (faction === 'alliance' ? 'active-a' : 'active-h') : '';
      panel.innerHTML = `<div class="pers-panel-faction-label ${faction === 'alliance' ? 'a' : 'h'}">[ ${faction === 'alliance' ? 'ALIANZA' : 'HORDA'} ]</div>` +
        factions[faction].map(r =>
          `<button class="pers-race-btn ${cls(r)}" data-race="${r.nombre}" data-faction="${faction}">
            <span class="pers-race-icon">${r.icon}</span>
            <span><div class="pers-race-name">${r.nombre}</div><div class="pers-race-type">${r.type}</div></span>
          </button>`
        ).join('');
      panel.querySelectorAll('.pers-race-btn').forEach(btn => {
        btn.addEventListener('click', () => togglePersRace(btn));
      });
    });
  }

  function buildPersFilterBar() {
    const el = document.getElementById('pers-filter-bar');
    if (!el) return;
    el.innerHTML = `
      <span class="pers-filter-label">FACCIÓN:</span>
      <button class="pers-filter-chip ${persFactionFilter === 'all' ? 'active' : ''}" data-pfaction="all">Todas</button>
      <button class="pers-filter-chip ${persFactionFilter === 'alliance' ? 'active' : ''}" data-pfaction="alliance" style="color:#4a9eff88">Alianza</button>
      <button class="pers-filter-chip ${persFactionFilter === 'horde' ? 'active' : ''}" data-pfaction="horde" style="color:#cc330088">Horda</button>
      <span class="pers-filter-sep">|</span>
      <span class="pers-filter-label">NIVEL:</span>
      <button class="pers-filter-chip ${persLevelFilter === 'all' ? 'active' : ''}" data-plevel="all">Todos</button>
      <button class="pers-filter-chip ${persLevelFilter === 'low' ? 'active' : ''}" data-plevel="low">1-60</button>
      <button class="pers-filter-chip ${persLevelFilter === 'high' ? 'active' : ''}" data-plevel="high">61-80</button>`;
    el.querySelectorAll('[data-pfaction]').forEach(chip => {
      chip.addEventListener('click', () => {
        persFactionFilter = chip.dataset.pfaction;
        buildPersRacePanels();
        buildPersFilterBar();
        buildPersClassBar();
        renderPersCharGrid();
        updatePersBgArt();
      });
    });
    el.querySelectorAll('[data-plevel]').forEach(chip => {
      chip.addEventListener('click', () => {
        persLevelFilter = chip.dataset.plevel;
        buildPersFilterBar();
        renderPersCharGrid();
      });
    });
  }

  function buildPersClassBar() {
    const bar = document.getElementById('pers-class-bar');
    if (!bar) return;
    const classEntries = Object.entries(CLASS_MAP);
    const deduped = [];
    const seen = new Set();
    classEntries.forEach(([label, key]) => {
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push({ label, key });
      }
    });
    bar.innerHTML = deduped.map(({ label, key }) => {
      const icon = PERS_CLASS_ICONS[key] || '❓';
      const color = PERS_CLASS_COLORS[key] || '#c9a84c';
      const active = persSelectedClass === key;
      return `<button class="pers-class-btn ${active ? 'active' : ''}" data-pclass="${key}" ${active ? `style="border-color:${color};color:${color}"` : ''}>
        <span class="pers-cbtn-icon">${icon}</span>
        <span class="pers-cbtn-label">${label}</span>
      </button>`;
    }).join('');
    bar.querySelectorAll('.pers-class-btn').forEach(btn => {
      btn.addEventListener('click', () => togglePersClass(btn));
    });
  }

  function renderPersCharGrid() {
    const grid = document.getElementById('pers-char-grid');
    if (!grid) return;
    let chars = DATA.getPersonajes();
    if (persFactionFilter === 'alliance') chars = chars.filter(c => c.faccion === 'Alianza');
    else if (persFactionFilter === 'horde') chars = chars.filter(c => c.faccion === 'Horda');
    if (persSelectedRace) chars = chars.filter(c => c.raza === persSelectedRace);
    if (persSelectedClass) {
      const revMap = {};
      Object.entries(CLASS_MAP).forEach(([k, v]) => { revMap[v] = k; });
      const targetClase = revMap[persSelectedClass];
      chars = chars.filter(c => {
        const clsKey = CLASS_MAP[c.clase] || '';
        return clsKey === persSelectedClass || c.clase === targetClase;
      });
    }
    if (persLevelFilter === 'low') chars = chars.filter(c => c.nivel <= 60);
    else if (persLevelFilter === 'high') chars = chars.filter(c => c.nivel > 60);
    if (chars.length === 0) {
      grid.innerHTML = `<div class="pers-empty-state"><span class="big">⚠</span>No hay personajes que coincidan.<br><span style="color:var(--text-muted)">Intenta cambiar los filtros.</span></div>`;
      return;
    }
    grid.innerHTML = chars.map(c => {
      const clsKey = CLASS_MAP[c.clase] || 'warrior';
      const color = PERS_CLASS_COLORS[clsKey] || '#c69b3a';
      const art = PERS_CHAR_ARTS[clsKey] || PERS_CHAR_ARTS.warrior;
      const faction = c.faccion === 'Alianza' ? 'a' : 'h';
      const sel = persSelectedChar === c.nombre;
      return `<div class="pers-char-card ${sel ? 'selected-' + faction : ''}" data-pchar="${c.nombre}">
        <span class="pers-card-faction-tag ${faction}">${c.faccion === 'Alianza' ? '⚔A' : '⚔H'}</span>
        <pre class="pers-card-art" style="color:${color};text-shadow:0 0 8px ${color}66">${art}</pre>
        <div class="pers-card-name">${c.nombre}</div>
        <div class="pers-card-meta">Nv.${c.nivel} ${c.raza}<br>${c.clase}</div>
      </div>`;
    }).join('') +
    `<div class="pers-char-card add-new">
      <span class="pers-add-icon">+</span>
      <span style="font-size:10px;color:var(--text-muted)">Nuevo<br>personaje</span>
    </div>`;
    grid.querySelectorAll('.pers-char-card[data-pchar]').forEach(card => {
      card.addEventListener('click', () => selectPersChar(card.dataset.pchar));
    });
  }

  function togglePersRace(btn) {
    const race = btn.dataset.race;
    const faction = btn.dataset.faction;
    if (persSelectedRace === race && persSelectedFaction === faction) {
      persSelectedRace = null;
      persSelectedFaction = null;
    } else {
      persSelectedRace = race;
      persSelectedFaction = faction;
      persFactionFilter = faction === 'alliance' ? 'alliance' : 'horde';
    }
    persSelectedChar = null;
    buildPersRacePanels();
    buildPersFilterBar();
    buildPersClassBar();
    renderPersCharGrid();
    updatePersBgArt();
    document.getElementById('pers-selected-label').textContent = '—';
    document.getElementById('pers-btn-enter').disabled = true;
  }

  function togglePersClass(btn) {
    const key = btn.dataset.pclass;
    if (persSelectedClass === key) {
      persSelectedClass = null;
    } else {
      persSelectedClass = key;
    }
    persSelectedChar = null;
    buildPersRacePanels();
    buildPersFilterBar();
    buildPersClassBar();
    renderPersCharGrid();
    updatePersBgArt();
    document.getElementById('pers-selected-label').textContent = '—';
    document.getElementById('pers-btn-enter').disabled = true;
  }

  function selectPersChar(charName) {
    if (persSelectedChar === charName) {
      persSelectedChar = null;
      document.getElementById('pers-selected-label').textContent = '—';
      document.getElementById('pers-btn-enter').disabled = true;
    } else {
      persSelectedChar = charName;
      const c = DATA.getPersonaje(charName);
      document.getElementById('pers-selected-label').textContent = c ? `${c.nombre} (Nv.${c.nivel} ${c.raza})` : charName;
      document.getElementById('pers-btn-enter').disabled = false;
    }
    renderPersCharGrid();
  }

  function editSelectedPersonaje() {
    if (!persSelectedChar) return;
    showEditCharModal(persSelectedChar);
  }

  function closePersonajes() {
    document.removeEventListener('keydown', persEscapeHandler);
    persSelectedRace = null;
    persSelectedFaction = null;
    persSelectedClass = null;
    persFactionFilter = 'all';
    persLevelFilter = 'all';
    persSelectedChar = null;
    state.currentView = 'warband';
    render();
  }

  function resetPersAll() {
    persSelectedRace = null;
    persSelectedFaction = null;
    persSelectedClass = null;
    persFactionFilter = 'all';
    persLevelFilter = 'all';
    persSelectedChar = null;
    render();
  }

  function resetAllDailies() {
    DATA.resetDailyTasks();
    render();
    GIST.doSync();
    showAlert('✅ Dailies reseteadas');
  }

  // ===== MODALS =====
  function showExportModal() {
    showModal('Exportar Datos', `
      <div class="form-group">
        <label>Backup completo (JSON)</label>
        <textarea id="exportJsonArea" rows="12" style="width:100%;background:var(--bg-input);border:1px solid var(--border-subtle);border-radius:3px;padding:8px;color:var(--text-primary);font-size:0.75rem;font-family:monospace" readonly></textarea>
      </div>
      <div class="flex gap-2">
        <button class="wow-btn wow-btn-primary" onclick="UI.downloadJSON()">📥 Descargar</button>
        <button class="wow-btn" onclick="UI.copyJSON()">📋 Copiar</button>
      </div>
    `, 'Cerrar');
    document.getElementById('exportJsonArea').value = DATA.exportFullBackup();
  }

  function showImportModal() {
    showModal('Importar Backup', `
      <p class="text-sm text-muted mb-2">Pegá el backup completo o seleccioná un archivo .json</p>
      <div class="form-group">
        <textarea id="importJsonArea" rows="10" style="width:100%;background:var(--bg-input);border:1px solid var(--border-subtle);border-radius:3px;padding:8px;color:var(--text-primary);font-size:0.75rem;font-family:monospace" placeholder="Pegá el JSON aquí..."></textarea>
      </div>
      <div class="form-group">
        <label>O seleccioná un archivo .json</label>
        <input type="file" id="importFileInput" accept=".json" style="color:var(--text-primary)">
      </div>
    `, 'Cancelar', async () => {
      const text = document.getElementById('importJsonArea').value;
      if (text.trim()) {
        try {
          DATA.importFullBackup(text);
          closeModal();
          showAlert('✅ Backup importado — recargando...');
          setTimeout(() => location.reload(), 800);
        } catch (e) { showAlert('❌ ' + e.message); }
      }
    }, 'Importar');
  }

  function downloadJSON() {
    const blob = new Blob([DATA.exportFullBackup()], { type: 'application/json' });
    downloadBlob(blob, 'wowseg-backup-completo.json');
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  function copyJSON() {
    const el = document.getElementById('exportJsonArea');
    if (!el) return;
    navigator.clipboard.writeText(el.value).then(() => {
      showAlert('✅ Copiado al portapapeles');
    }).catch(() => {
      el.select();
      document.execCommand('copy');
      showAlert('✅ Copiado al portapapeles');
    });
  }

  function showGistModal() {
    const cfg = GIST.getConfig();
    showModal('GitHub Gist', `
      <div class="form-group">
        <label>GitHub Token (scope: gist)</label>
        <input type="password" id="gistTokenInput" value="${cfg.hasToken ? '********' : ''}" placeholder="ghp_... o github_pat_...">
      </div>
      <div class="form-group">
        <label>Gist ID (dejá vacío para crear uno nuevo)</label>
        <input type="text" id="gistIdInput" value="${cfg.gistId}" placeholder="Ej: abc123def456">
      </div>
      <div class="form-group">
        <label>Nombre del archivo</label>
        <input type="text" id="gistFileInput" value="${cfg.fileName}">
      </div>
      <div class="form-group" style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="wow-btn wow-btn-primary" onclick="UI.gistConnect()">Conectar / Sync</button>
        <button class="wow-btn wow-btn-danger" onclick="UI.gistDisconnect()">Desconectar</button>
      </div>
      <div id="gistModalStatus" class="text-sm text-muted mt-1">${cfg.enabled && cfg.gistId ? 'Conectado' : 'Desconectado'}</div>
    `, 'Cerrar');
  }

  function gistConnect() {
    const token = document.getElementById('gistTokenInput').value;
    const gistId = document.getElementById('gistIdInput').value.trim();
    const fileName = document.getElementById('gistFileInput').value.trim() || 'wowseg-data.json';
    if (!token) { showAlert('❌ Ingresá un token'); return; }
    GIST.setConfigUpdate({ fileName });
    GIST.setToken(token);
    if (gistId) {
      GIST.connect(gistId, token, fileName).then(ok => {
        if (ok) { closeModal(); showAlert('✅ Gist conectado'); render(); }
      });
    } else {
      GIST.createNewGist(token, fileName, DATA.exportJSON()).then(id => {
        GIST.connect(id, token, fileName).then(ok => {
          if (ok) { closeModal(); showAlert('✅ Gist creado: ' + id.slice(0, 8) + '...'); render(); }
        });
      }).catch(e => showAlert('❌ ' + e.message));
    }
  }

  function gistDisconnect() {
    GIST.disconnect(); closeModal(); render(); showAlert('Gist desconectado');
  }

  function showModal(title, bodyHTML, cancelText, onConfirm, confirmText) {
    let footer = '';
    if (onConfirm) {
      footer = `
        <div class="modal-footer">
          <button class="wow-btn" onclick="UI.closeModal()">${cancelText || 'Cancelar'}</button>
          <button class="wow-btn wow-btn-primary" onclick="UI.confirmModal()">${confirmText || 'Confirmar'}</button>
        </div>`;
    } else if (cancelText) {
      footer = `<div class="modal-footer"><button class="wow-btn" onclick="UI.closeModal()">${cancelText}</button></div>`;
    }
    const overlay = document.getElementById('modalOverlay');
    overlay.innerHTML = `
      <div class="modal-content" style="position:relative">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="UI.closeModal()">×</button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        ${footer}
      </div>`;
    overlay._onConfirm = onConfirm || null;
    overlay.classList.add('open');
  }

  function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
  function confirmModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay._onConfirm) overlay._onConfirm();
  }
  function showAlert(msg) {
    showModal('', `<div style="text-align:center;padding:20px"><p class="text-sm">${msg}</p></div>`, 'OK');
  }

  function logout() {
    AUTH.clearSession(); GIST.disconnect(); location.reload();
  }

  function showEditCharModal(charName) {
    const c = DATA.getPersonaje(charName);
    if (!c) return;
    const CLASES = ['Guerrero','Paladín','Cazador','Pícaro','Sacerdote','DK','Chamán','Mago','Brujo','Monje','Druida','DH','Evocadora','Maga'];
    const RAZAS = ['Orco','Blood Elf','Tauren','Troll','Goblin','Mag\'har','Nightborne','Highmountain','Zandalari','Vulpera','Undead','Earthen','Pandaren','Human','Night Elf','Draenei','Gnome','Dwarf','Void Elf','Light Draenei','Haranir','Dracthyr'];
    showModal('Editar Personaje', `
      <p class="text-sm text-muted mb-2"><strong class="text-gold">${charName}</strong></p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <div class="form-group">
          <label>Clase</label>
          <select id="editCharClase" style="width:100%">${CLASES.map(cl => `<option value="${cl}" ${c.clase === cl ? 'selected' : ''}>${cl}</option>`).join('')}</select>
        </div>
        <div class="form-group">
          <label>Nivel</label>
          <input type="number" id="editCharNivel" value="${c.nivel}" min="1" max="90" style="width:100%">
        </div>
        <div class="form-group">
          <label>Facción</label>
          <select id="editCharFaccion" style="width:100%">
            <option value="Horda" ${c.faccion === 'Horda' ? 'selected' : ''}>Horda</option>
            <option value="Alianza" ${c.faccion === 'Alianza' ? 'selected' : ''}>Alianza</option>
          </select>
        </div>
        <div class="form-group">
          <label>Raza</label>
          <select id="editCharRaza" style="width:100%">${RAZAS.map(r => `<option value="${r}" ${c.raza === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
        </div>
        <div class="form-group">
          <label>Reino</label>
          <input type="text" id="editCharReino" value="${c.reino}" style="width:100%">
        </div>
        <div class="form-group">
          <label>Misión Principal</label>
          <input type="text" id="editCharMision" value="${c.mision_principal || ''}" style="width:100%">
        </div>
        <div class="form-group">
          <label>Activo</label>
          <select id="editCharActivo" style="width:100%">
            <option value="true" ${c.activo ? 'selected' : ''}>Sí</option>
            <option value="false" ${!c.activo ? 'selected' : ''}>No</option>
          </select>
        </div>
      </div>
    `, 'Cancelar', () => {
      DATA.updatePersonaje(charName, {
        clase: document.getElementById('editCharClase').value,
        nivel: parseInt(document.getElementById('editCharNivel').value) || 1,
        faccion: document.getElementById('editCharFaccion').value,
        raza: document.getElementById('editCharRaza').value,
        reino: document.getElementById('editCharReino').value.trim(),
        mision_principal: document.getElementById('editCharMision').value.trim() || null,
        activo: document.getElementById('editCharActivo').value === 'true'
      });
      render(); GIST.doSync(); closeModal(); showAlert('✅ Personaje actualizado');
    }, 'Guardar');
  }

  function showMoveCharModal(charName) {
    const warbands = DATA.getWarbands().filter(w => w.nombre !== 'nada');
    const char = DATA.getPersonaje(charName);
    if (!char) return;
    const opts = warbands.filter(w => w.nombre !== char.warband).map(w => `<option value="${w.nombre}">${w.nombre}</option>`).join('');
    showModal('Mover Personaje', `
      <p class="text-sm text-muted mb-2">Mover <strong class="text-gold">${charName}</strong> (${char.clase}) a otro warband:</p>
      <div class="form-group">
        <select id="moveTargetSelect" style="width:100%;background:var(--bg-input);border:1px solid var(--border-subtle);border-radius:3px;padding:10px;color:var(--text-primary);font-size:0.85rem">${opts || '<option value="">No hay otros warbands</option>'}</select>
      </div>
    `, 'Cancelar', () => {
      const target = document.getElementById('moveTargetSelect').value;
      if (target) {
        DATA.moveCharToWarband(charName, target);
        if (state.selectedChar === charName) state.selectedChar = null;
        render(); GIST.doSync();
      }
      closeModal();
    }, 'Mover');
  }

  function showManageWarbandsModal() {
    const warbands = DATA.getWarbands();
    const list = warbands.map(w => `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-subtle)">
        <span style="flex:1;font-size:0.85rem">${w.nombre} <span class="text-muted text-xs">(${w.personajes.length} personajes)</span></span>
        ${w.nombre !== 'nada' ? `
          <button class="wow-btn wow-btn-sm" onclick="UI.renameWarbandPrompt('${w.nombre}')">✏️</button>
          <button class="wow-btn wow-btn-sm wow-btn-danger" onclick="UI.deleteWarbandPrompt('${w.nombre}')">🗑️</button>
        ` : '<span class="text-xs text-muted">(fijo)</span>'}
      </div>`).join('');
    showModal('Administrar Warbands', `
      <div style="margin-bottom:12px">${list}</div>
      <div style="display:flex;gap:8px">
        <input type="text" id="newWarbandInput" placeholder="Nombre del nuevo warband..." style="flex:1;background:var(--bg-input);border:1px solid var(--border-subtle);border-radius:3px;padding:8px 10px;color:var(--text-primary);font-size:0.8rem">
        <button class="wow-btn wow-btn-primary" onclick="UI.addWarbandFromInput()">+ Agregar</button>
      </div>`, 'Cerrar');
  }

  function addWarbandFromInput() {
    const input = document.getElementById('newWarbandInput');
    const name = input.value.trim();
    if (!name) { showAlert('❌ Ingresá un nombre'); return; }
    if (DATA.addWarband(name)) { render(); closeModal(); showAlert('✅ Warband "' + name + '" creado'); }
    else { showAlert('❌ Ya existe un warband con ese nombre'); }
  }

  function renameWarbandPrompt(oldName) {
    closeModal();
    showModal('Renombrar Warband', `
      <div class="form-group">
        <label>Nombre actual: <strong>${oldName}</strong></label>
        <input type="text" id="renameWarbandInput" value="${oldName}" style="width:100%;background:var(--bg-input);border:1px solid var(--border-subtle);border-radius:3px;padding:10px;color:var(--text-primary);font-size:0.85rem">
      </div>`, 'Cancelar', () => {
      const newName = document.getElementById('renameWarbandInput').value.trim();
      if (!newName) { showAlert('❌ Ingresá un nombre'); return; }
      if (DATA.renameWarband(oldName, newName)) {
        if (state.currentWarband === oldName) state.currentWarband = newName;
        render(); GIST.doSync(); closeModal(); showAlert('✅ Warband renombrado a "' + newName + '"');
      } else { showAlert('❌ Ese nombre ya existe o no se encontró el warband'); }
    }, 'Renombrar');
  }

  function deleteWarbandPrompt(name) {
    const count = DATA.getPersonajes().filter(p => p.warband === name).length;
    showModal('Eliminar Warband', `
      <p class="text-sm mb-2">¿Eliminar <strong>${name}</strong>?</p>
      <p class="text-xs text-muted">Los ${count} personajes se moverán a "nada".</p>`, 'Cancelar', () => {
      DATA.deleteWarband(name);
      if (state.currentWarband === name) state.currentWarband = 'nada';
      state.selectedChar = null;
      render(); GIST.doSync(); closeModal(); showAlert('✅ Warband eliminado');
    }, 'Eliminar');
  }

  function handleImportFile() {
    const input = document.getElementById('importFileInput');
    if (!input || !input.files[0]) return;
    const reader = new FileReader();
    reader.onload = e => { document.getElementById('importJsonArea').value = e.target.result; };
    reader.readAsText(input.files[0]);
  }

  return {
    render, selectWarband, selectChar, toggleTask, setView,
    setSearch, setFilterClase, setFilterReino, setFilterActivo,
    resetAllDailies,
    showExportModal, showImportModal, downloadJSON, copyJSON,
    showGistModal, gistConnect, gistDisconnect, logout,
    showModal, closeModal, confirmModal, showAlert, handleImportFile,
    showEditCharModal, showMoveCharModal, showManageWarbandsModal,
    addWarbandFromInput, renameWarbandPrompt, deleteWarbandPrompt,
    selectCharFromTable,
    showAddMisionModal, toggleMision, editMision, deleteMision, toggleTareaMision, editTareaMision, deleteTareaMision,
    setPriorityTab, setPriorityWarband, setTimeTab, setTimeWarband,
    setTablaFilterPersonaje, setTablaFilterWarband, setTablaFilterTipo, setTablaFilterExpansion,
    setTablaFilterPriority, setTablaFilterTime, setTablaFilterEstado, setTablaFilterSearch,
    setTablaFilterClase, setTablaFilterFaccion, setTablaFilterReino, setTablaFilterActivo, setTablaFilterCooldown,
    togglePersRace, togglePersClass, selectPersChar, editSelectedPersonaje, closePersonajes, resetPersAll
  };
})();
