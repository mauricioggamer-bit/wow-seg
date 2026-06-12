const UI = (() => {
  let state = {
    currentWarband: null,
    selectedChar: null,
    filterClase: '',
    filterReino: '',
    filterActivo: 'todos',
    search: '',
    currentView: 'warband',
    dash: { filter: 'all', group1: 'warband', group2: 'personaje', order: 'prioridad', filterWarband: '', filterPriority: '', filterTime: '', filterEstado: '', filterSearch: '' },
    priorityFilter: { priority: '1', warband: '' },
    timeFilter: { time: 'rapido', warband: '' },
    misionesFilter: { filterPersonaje: '', filterWarband: '', filterTipo: '', filterPriority: '', filterTime: '', filterEstado: '', filterSearch: '' }
  };

  const CLASS_MAP = {
    'Guerrero': 'warrior', 'Paladín': 'paladin', 'Cazador': 'hunter',
    'Pícaro': 'rogue', 'Sacerdote': 'priest', 'DK': 'dk',
    'Chamán': 'shaman', 'Mago': 'mage', 'Brujo': 'warlock',
    'Monje': 'monk', 'Druida': 'druid', 'DH': 'dh', 'Evocadora': 'evoker',
    'Maga': 'mage'
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
    renderHeaderStats();
    renderViewTabs();

    document.getElementById('warbandLayout').style.display = 'none';
    document.getElementById('dashboardPanel').style.display = 'none';
    const wbTabs = document.getElementById('warbandTabs');

    if (state.currentView === 'warband') {
      document.getElementById('warbandLayout').style.display = 'grid';
      if (wbTabs) wbTabs.style.display = '';
      renderWarbandTabs();
      const wb = state.currentWarband || DATA.getWarbands()[0]?.nombre;
      if (wb) { state.currentWarband = wb; renderWarbandContent(wb); }
      if (state.selectedChar) renderCharDetail(state.selectedChar);
      else renderAllTasks(state.currentWarband);
    } else {
      if (wbTabs) wbTabs.style.display = 'none';
      document.getElementById('dashboardPanel').style.display = 'block';
      if (state.currentView === 'dashboard') renderDashboard();
      else if (state.currentView === 'tabla') renderTabla();
      else if (state.currentView === 'misiones') renderMisiones();
      else if (state.currentView === 'priority') renderPriorityView();
      else if (state.currentView === 'time') renderTimeView();
    }
  }

  function renderViewTabs() {
    const el = document.getElementById('viewTabs');
    if (!el) return;
    el.innerHTML = `
      <button class="warband-tab ${state.currentView === 'warband' ? 'active' : ''}" onclick="UI.setView('warband')">📁 Warband</button>
      <button class="warband-tab ${state.currentView === 'dashboard' ? 'active' : ''}" onclick="UI.setView('dashboard')">📊 Tablero</button>
      <button class="warband-tab ${state.currentView === 'tabla' ? 'active' : ''}" onclick="UI.setView('tabla')">📋 Tabla</button>
      <button class="warband-tab ${state.currentView === 'misiones' ? 'active' : ''}" onclick="UI.setView('misiones')">🎯 Misiones</button>
      <button class="warband-tab ${state.currentView === 'priority' ? 'active' : ''}" onclick="UI.setView('priority')">⚡ Prioridad</button>
      <button class="warband-tab ${state.currentView === 'time' ? 'active' : ''}" onclick="UI.setView('time')">⏱ Tiempo</button>
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
      <div class="task-item ${t.hecho ? 'done' : ''}">
        <input type="checkbox" class="task-check" ${t.hecho ? 'checked' : ''}
               onchange="UI.toggleTask('${charName}','${t.id}')">
        <div class="task-info">
          <div class="task-name">${t.nombre}</div>
          <div class="task-meta">
            <span class="text-xs text-muted">P${t.prioridad}</span>
            <span>${t.tiempo_min} min</span>
            <span>${t.cooldown}</span>
            ${t.recompensa ? `<span class="task-reward">🎁 ${t.recompensa}</span>` : ''}
            ${t.ultimo_completado ? `<span class="text-xs text-muted">✓ ${formatDate(t.ultimo_completado)}</span>` : ''}
          </div>
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

  function getTimeRange(min) {
    if (min <= 15) return '🟢 Rapido (≤15min)';
    if (min <= 30) return '🟡 Medio (16-30min)';
    if (min <= 60) return '🟠 Largo (31-60min)';
    return '🔴 Marathon (>60min)';
  }

  function getGroupKey(item, g) {
    if (g === 'warband') return item.warband;
    if (g === 'personaje') return item.personaje;
    if (g === 'prioridad') return 'P' + item.prioridad;
    if (g === 'tiempo') return getTimeRange(item.tiempo_min);
    return '';
  }

  function getGroupSortKey(key, g) {
    if (g === 'prioridad') return key === 'P1' ? '1' : key === 'P2' ? '2' : '3';
    if (g === 'tiempo' || g === 'warband' || g === 'personaje') return key;
    return key;
  }

  function sortTaskList(items, order) {
    const s = [...items];
    if (order === 'prioridad') return s.sort((a, b) => a.prioridad - b.prioridad);
    if (order === 'tiempo_asc') return s.sort((a, b) => a.tiempo_min - b.tiempo_min);
    if (order === 'tiempo_desc') return s.sort((a, b) => b.tiempo_min - a.tiempo_min);
    if (order === 'nombre_asc') return s.sort((a, b) => (a.personaje || '').localeCompare(b.personaje || ''));
    if (order === 'nombre_desc') return s.sort((a, b) => (b.personaje || '').localeCompare(a.personaje || ''));
    return s;
  }

  function renderDashControls(cfg, prefix, showGroups) {
    return `
      <div class="dash-controls">
        <span class="dash-label">Filtro:</span>
        <select onchange="UI.setDashFilter(this.value)">
          ${['all','weekly','daily','farm_libre'].map(v =>
            `<option value="${v}" ${cfg.filter === v ? 'selected' : ''}>${LABELS[v]}</option>`
          ).join('')}
        </select>
        ${showGroups ? `
          <span class="dash-label">G1:</span>
          <select onchange="UI.setDashGroup1(this.value)">
            ${['warband','personaje','prioridad','tiempo','none'].map(v =>
              `<option value="${v}" ${cfg.group1 === v ? 'selected' : ''}>${v.charAt(0).toUpperCase() + v.slice(1)}</option>`
            ).join('')}
          </select>
          <span class="dash-label">G2:</span>
          <select onchange="UI.setDashGroup2(this.value)">
            ${['personaje','warband','prioridad','tiempo','none'].map(v =>
              `<option value="${v}" ${cfg.group2 === v ? 'selected' : ''}>${v.charAt(0).toUpperCase() + v.slice(1)}</option>`
            ).join('')}
          </select>
        ` : ''}
        <span class="dash-label">Orden:</span>
        <select onchange="UI.setDashOrder(this.value)">
          ${[['prioridad','Prioridad'],['tiempo_asc','Tiempo ↑'],['tiempo_desc','Tiempo ↓'],['nombre_asc','Nombre ↑'],['nombre_desc','Nombre ↓']].map(([v,l]) =>
            `<option value="${v}" ${cfg.order === v ? 'selected' : ''}>${l}</option>`
          ).join('')}
        </select>
      </div>
    `;
  }

  // ===== DASHBOARD (MINIMAL) =====
  function renderDashboard() {
    const el = document.getElementById('dashboardPanel');
    if (!el) return;
    const cfg = state.dash;
    let items = getAllTaskItems();
    if (cfg.filter !== 'all') items = items.filter(t => t.cooldown === cfg.filter);
    items = sortTaskList(items, cfg.order);

    let g1 = cfg.group1;
    let g2 = cfg.group2;
    if (g1 === 'none' && g2 === 'none') { g1 = 'warband'; g2 = 'personaje'; }

    const grouped = {};
    items.forEach(item => {
      const k1 = g1 === 'none' ? '_all' : getGroupKey(item, g1);
      if (!grouped[k1]) grouped[k1] = {};
      const k2 = (g2 === 'none' || g1 === 'none') ? '_all' : getGroupKey(item, g2);
      if (!grouped[k1][k2]) grouped[k1][k2] = [];
      grouped[k1][k2].push(item);
    });

    const g1Keys = Object.keys(grouped).sort((a, b) => getGroupSortKey(a, g1).localeCompare(getGroupSortKey(b, g1)));

    el.innerHTML = `
      <div class="dash-minimal">
        ${renderDashControls(cfg, '', true)}
        <div style="display:flex;flex-direction:column;gap:2px;margin-top:4px">
          ${g1Keys.map(k1 => {
            const sub = grouped[k1];
            const subKeys = Object.keys(sub).sort((a, b) => getGroupSortKey(a, g2).localeCompare(getGroupSortKey(b, g2)));
            const totalTasks = subKeys.reduce((s, k) => s + sub[k].length, 0);
            const doneTasks = subKeys.reduce((s, k) => s + sub[k].filter(t => t.hecho).length, 0);
            const totalMin = subKeys.reduce((s, k) => s + sub[k].reduce((ss, t) => ss + (t.tiempo_min || 0), 0), 0);
            const g1Label = k1 === '_all' ? 'Todas' : k1;

            return `
              <div class="dash-group">
                <div class="dash-group-header" onclick="this.classList.toggle('collapsed');this.nextElementSibling.classList.toggle('hidden')">
                  <span class="arrow">▼</span>
                  <span style="flex:1;font-weight:600">${g1Label}</span>
                  <span class="text-xs text-muted">${doneTasks}/${totalTasks} · ${totalMin}min</span>
                </div>
                <div>
                  ${subKeys.map(k2 => {
                    const tasks = sub[k2];
                    const d2 = tasks.filter(t => t.hecho).length;
                    const m2 = tasks.reduce((s, t) => s + (t.tiempo_min || 0), 0);
                    const g2Label = k2 === '_all' ? '' : k2;
                    return `
                      <div style="margin-bottom:${g2Label ? '2px' : '0'}">
                        ${g2Label ? `
                          <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 6px;margin-bottom:1px">
                            <span class="text-xs" style="font-weight:600;color:var(--text-secondary)">${g2Label}</span>
                            <span class="text-xs text-muted">${d2}/${tasks.length} · ${m2}min</span>
                          </div>
                        ` : ''}
                        <div class="task-list" style="gap:1px">
                  ${tasks.map(t => renderDashTaskItem(t, false)).join('')}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
        ${items.length === 0 ? '<div class="empty-state"><p>No hay tareas con los filtros seleccionados</p></div>' : ''}
      </div>
    `;
  }

  function renderDashTaskItem(t, showChar = true) {
    const label = showChar && t.personaje ? `<span class="text-xs" style="color:var(--gold);font-weight:600">${t.personaje}</span>` : '';
    return `
      <div class="task-item ${t.hecho ? 'done' : ''}" style="padding:4px 6px">
        <input type="checkbox" class="task-check" ${t.hecho ? 'checked' : ''}
               onchange="UI.toggleTask('${t.personaje}','${t.id}')" style="width:14px;height:14px">
        <div class="task-info">
          <div class="task-name" style="font-size:0.75rem">${label} ${t.nombre}</div>
          <div class="task-meta" style="font-size:0.6rem">
            <span class="text-xs text-muted">P${t.prioridad}</span>
            <span>${t.tiempo_min}min</span>
            <span>${t.cooldown}</span>
            ${t.recompensa ? `<span class="task-reward">🎁 ${t.recompensa}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  function setDashFilter(v) { state.dash.filter = v; render(); }
  function setDashGroup1(v) { state.dash.group1 = v; render(); }
  function setDashGroup2(v) { state.dash.group2 = v; render(); }
  function setDashOrder(v) { state.dash.order = v; render(); }
  function setDashFilterWarband(v) { state.dash.filterWarband = v; render(); }
  function setDashFilterPriority(v) { state.dash.filterPriority = v; render(); }
  function setDashFilterTime(v) { state.dash.filterTime = v; render(); }
  function setDashFilterEstado(v) { state.dash.filterEstado = v; render(); }
  function setDashFilterSearch(v) { state.dash.filterSearch = v; render(); }
  function setMisionesFilterPersonaje(v) { state.misionesFilter.filterPersonaje = v; render(); }
  function setMisionesFilterWarband(v) { state.misionesFilter.filterWarband = v; render(); }
  function setMisionesFilterTipo(v) { state.misionesFilter.filterTipo = v; render(); }
  function setMisionesFilterPriority(v) { state.misionesFilter.filterPriority = v; render(); }
  function setMisionesFilterTime(v) { state.misionesFilter.filterTime = v; render(); }
  function setMisionesFilterEstado(v) { state.misionesFilter.filterEstado = v; render(); }
  function setMisionesFilterSearch(v) { state.misionesFilter.filterSearch = v; render(); }
  function setPriorityTab(v) { state.priorityFilter.priority = v; render(); }
  function setPriorityWarband(v) { state.priorityFilter.warband = v; render(); }
  function setTimeTab(v) { state.timeFilter.time = v; render(); }
  function setTimeWarband(v) { state.timeFilter.warband = v; render(); }

  // ===== TABLA VIEW =====
  function renderTablaFilterControls(cfg) {
    const warbands = DATA.getWarbands();
    return `
      <div class="filter-bar mb-1" style="gap:3px">
        <span class="text-xs text-muted" style="margin-right:2px">Warband:</span>
        <select onchange="UI.setDashFilterWarband(this.value)" style="font-size:0.6rem;padding:2px 5px">
          <option value="">Todos</option>
          ${warbands.map(w => `<option value="${w.nombre}" ${cfg.filterWarband === w.nombre ? 'selected' : ''}>${w.nombre}</option>`).join('')}
        </select>
        <span class="text-xs text-muted" style="margin-left:4px">Prioridad:</span>
        <select onchange="UI.setDashFilterPriority(this.value)" style="font-size:0.6rem;padding:2px 5px">
          <option value="">Todas</option>
          <option value="1" ${cfg.filterPriority === '1' ? 'selected' : ''}>P1</option>
          <option value="2" ${cfg.filterPriority === '2' ? 'selected' : ''}>P2</option>
          <option value="3" ${cfg.filterPriority === '3' ? 'selected' : ''}>P3</option>
        </select>
        <span class="text-xs text-muted" style="margin-left:4px">Tiempo:</span>
        <select onchange="UI.setDashFilterTime(this.value)" style="font-size:0.6rem;padding:2px 5px">
          <option value="">Todos</option>
          <option value="rapido" ${cfg.filterTime === 'rapido' ? 'selected' : ''}>≤15min</option>
          <option value="medio" ${cfg.filterTime === 'medio' ? 'selected' : ''}>16-30</option>
          <option value="largo" ${cfg.filterTime === 'largo' ? 'selected' : ''}>31-60</option>
          <option value="maraton" ${cfg.filterTime === 'maraton' ? 'selected' : ''}>>60</option>
        </select>
        <span class="text-xs text-muted" style="margin-left:4px">Estado:</span>
        <select onchange="UI.setDashFilterEstado(this.value)" style="font-size:0.6rem;padding:2px 5px">
          <option value="">Todos</option>
          <option value="pendiente" ${cfg.filterEstado === 'pendiente' ? 'selected' : ''}>Pendientes</option>
          <option value="hecho" ${cfg.filterEstado === 'hecho' ? 'selected' : ''}>Completadas</option>
        </select>
        <input type="text" placeholder="Buscar..." value="${cfg.filterSearch}"
               oninput="UI.setDashFilterSearch(this.value)"
               style="font-size:0.6rem;padding:2px 5px;width:100px">
      </div>
    `;
  }

  function applyTablaFilters(items) {
    const cfg = state.dash;
    if (cfg.filter !== 'all') items = items.filter(t => t.cooldown === cfg.filter);
    if (cfg.filterWarband) items = items.filter(t => t.warband === cfg.filterWarband);
    if (cfg.filterPriority) items = items.filter(t => t.prioridad === parseInt(cfg.filterPriority));
    if (cfg.filterTime) {
      if (cfg.filterTime === 'rapido') items = items.filter(t => t.tiempo_min <= 15);
      else if (cfg.filterTime === 'medio') items = items.filter(t => t.tiempo_min >= 16 && t.tiempo_min <= 30);
      else if (cfg.filterTime === 'largo') items = items.filter(t => t.tiempo_min >= 31 && t.tiempo_min <= 60);
      else if (cfg.filterTime === 'maraton') items = items.filter(t => t.tiempo_min > 60);
    }
    if (cfg.filterEstado === 'pendiente') items = items.filter(t => !t.hecho);
    else if (cfg.filterEstado === 'hecho') items = items.filter(t => t.hecho);
    if (cfg.filterSearch) {
      const q = cfg.filterSearch.toLowerCase();
      items = items.filter(t => t.nombre.toLowerCase().includes(q) || (t.personaje || '').toLowerCase().includes(q));
    }
    return items;
  }

  // ===== MISIONES FILTERS =====
  function renderMisionesFilterControls(cfg) {
    const warbands = DATA.getWarbands();
    const personajes = DATA.getPersonajes();
    const todos = personajes.map(p => p.nombre);
    return `
      <div class="filter-bar mb-1" style="gap:3px">
        <span class="text-xs text-muted" style="margin-right:2px">Pers:</span>
        <select onchange="UI.setMisionesFilterPersonaje(this.value)" style="font-size:0.6rem;padding:2px 4px;max-width:90px">
          <option value="">Todos</option>
          ${todos.map(n => `<option value="${n}" ${cfg.filterPersonaje === n ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
        <span class="text-xs text-muted" style="margin-left:4px">Wb:</span>
        <select onchange="UI.setMisionesFilterWarband(this.value)" style="font-size:0.6rem;padding:2px 4px;max-width:80px">
          <option value="">Todos</option>
          ${warbands.map(w => `<option value="${w.nombre}" ${cfg.filterWarband === w.nombre ? 'selected' : ''}>${w.nombre}</option>`).join('')}
        </select>
        <span class="text-xs text-muted" style="margin-left:4px">Tipo:</span>
        <select onchange="UI.setMisionesFilterTipo(this.value)" style="font-size:0.6rem;padding:2px 4px;max-width:80px">
          <option value="">Todos</option>
          <option value="weekly" ${cfg.filterTipo === 'weekly' ? 'selected' : ''}>Semanal</option>
          <option value="daily" ${cfg.filterTipo === 'daily' ? 'selected' : ''}>Diaria</option>
          <option value="farm_libre" ${cfg.filterTipo === 'farm_libre' ? 'selected' : ''}>Farm</option>
          <option value="mision" ${cfg.filterTipo === 'mision' ? 'selected' : ''}>Misión</option>
          <option value="achievement" ${cfg.filterTipo === 'achievement' ? 'selected' : ''}>Logro</option>
        </select>
        <span class="text-xs text-muted" style="margin-left:4px">Prio:</span>
        <select onchange="UI.setMisionesFilterPriority(this.value)" style="font-size:0.6rem;padding:2px 4px;max-width:55px">
          <option value="">Todas</option>
          <option value="1" ${cfg.filterPriority === '1' ? 'selected' : ''}>P1</option>
          <option value="2" ${cfg.filterPriority === '2' ? 'selected' : ''}>P2</option>
          <option value="3" ${cfg.filterPriority === '3' ? 'selected' : ''}>P3</option>
        </select>
        <span class="text-xs text-muted" style="margin-left:4px">Tpo:</span>
        <select onchange="UI.setMisionesFilterTime(this.value)" style="font-size:0.6rem;padding:2px 4px;max-width:65px">
          <option value="">Todos</option>
          <option value="rapido" ${cfg.filterTime === 'rapido' ? 'selected' : ''}>≤15m</option>
          <option value="medio" ${cfg.filterTime === 'medio' ? 'selected' : ''}>16-30</option>
          <option value="largo" ${cfg.filterTime === 'largo' ? 'selected' : ''}>31-60</option>
          <option value="maraton" ${cfg.filterTime === 'maraton' ? 'selected' : ''}>>60</option>
        </select>
        <span class="text-xs text-muted" style="margin-left:4px">Edo:</span>
        <select onchange="UI.setMisionesFilterEstado(this.value)" style="font-size:0.6rem;padding:2px 4px;max-width:75px">
          <option value="">Todos</option>
          <option value="pendiente" ${cfg.filterEstado === 'pendiente' ? 'selected' : ''}>Pend.</option>
          <option value="completada" ${cfg.filterEstado === 'completada' ? 'selected' : ''}>Hecho</option>
        </select>
        <input type="text" placeholder="🔍" value="${cfg.filterSearch}"
               oninput="UI.setMisionesFilterSearch(this.value)"
               style="font-size:0.6rem;padding:2px 4px;width:70px">
      </div>
    `;
  }

  function applyMisionesFilters(items) {
    const cfg = state.misionesFilter;
    const personajes = DATA.getPersonajes();
    if (cfg.filterPersonaje) items = items.filter(m => m.personaje === cfg.filterPersonaje);
    if (cfg.filterWarband) {
      const wbChars = personajes.filter(p => p.warband === cfg.filterWarband).map(p => p.nombre);
      items = items.filter(m => !m.personaje || wbChars.includes(m.personaje));
    }
    if (cfg.filterTipo) items = items.filter(m => m.tipo === cfg.filterTipo);
    if (cfg.filterPriority) items = items.filter(m => m.prioridad === parseInt(cfg.filterPriority));
    if (cfg.filterTime) {
      if (cfg.filterTime === 'rapido') items = items.filter(m => (m.tiempo_min || 0) <= 15);
      else if (cfg.filterTime === 'medio') items = items.filter(m => (m.tiempo_min || 0) >= 16 && (m.tiempo_min || 0) <= 30);
      else if (cfg.filterTime === 'largo') items = items.filter(m => (m.tiempo_min || 0) >= 31 && (m.tiempo_min || 0) <= 60);
      else if (cfg.filterTime === 'maraton') items = items.filter(m => (m.tiempo_min || 0) > 60);
    }
    if (cfg.filterEstado === 'pendiente') items = items.filter(m => m.estado !== 'completada');
    else if (cfg.filterEstado === 'completada') items = items.filter(m => m.estado === 'completada');
    if (cfg.filterSearch) {
      const q = cfg.filterSearch.toLowerCase();
      items = items.filter(m => m.nombre.toLowerCase().includes(q) || (m.personaje || '').toLowerCase().includes(q));
    }
    return items;
  }

  function renderTabla() {
    const el = document.getElementById('dashboardPanel');
    if (!el) return;
    const cfg = state.dash;
    let items = getAllTaskItems();
    items = applyTablaFilters(items);
    items = sortTaskList(items, cfg.order);

    el.innerHTML = `
      <div class="wow-panel">
        <div class="wow-panel-header">
          <h2>📋 Tabla de Tareas</h2>
          <div class="flex gap-2 items-center">
            <span class="text-sm text-muted">${items.length} tareas</span>
          </div>
        </div>
        <div class="wow-panel-body" style="padding:6px 8px">
          ${renderTablaFilterControls(cfg)}
          <div class="task-table-wrap" style="margin-top:4px">
            <table class="task-table">
              <thead>
                <tr>
                  <th style="width:24px"></th>
                  <th style="width:100px">Personaje</th>
                  <th>Tarea</th>
                  <th style="width:45px">Prioridad</th>
                  <th style="width:45px">Tiempo</th>
                  <th style="width:55px">Tipo</th>
                  <th>Recompensa</th>
                </tr>
              </thead>
              <tbody>
                ${items.length === 0 ? `
                  <tr><td colspan="7" style="text-align:center;padding:16px;color:var(--text-muted);font-size:0.75rem">No hay tareas</td></tr>
                ` : items.map(t => `
                  <tr>
                    <td>
                      <input type="checkbox" class="task-check" ${t.hecho ? 'checked' : ''}
                             onchange="UI.toggleTask('${t.personaje}','${t.id}')">
                    </td>
                    <td class="char-cell ${clsClass(t.clase)}" onclick="UI.selectCharFromTable('${t.personaje}')">${t.personaje}</td>
                    <td style="font-size:0.7rem">${t.nombre}</td>
                    <td><span class="task-priority priority-${t.prioridad}" style="font-size:0.5rem;padding:0 3px">P${t.prioridad}</span></td>
                    <td class="time-cell">${t.tiempo_min}min</td>
                    <td><span class="text-xs text-muted">${t.cooldown}</span></td>
                    <td class="text-xs">${t.recompensa ? `<span class="task-reward">🎁 ${t.recompensa}</span>` : ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
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

  // ===== MISIONES VIEW =====
  function renderMisiones() {
    const el = document.getElementById('dashboardPanel');
    if (!el) return;
    const misiones = DATA.getMisiones().map(m => ({ ...m, _isTarea: false }));
    const personajes = DATA.getPersonajes();
    const tareas = [];
    personajes.forEach(p => {
      (p.tareas || []).forEach(t => {
        tareas.push({
          id: t.id,
          nombre: t.nombre,
          personaje: p.nombre,
          tipo: t.tipo,
          prioridad: t.prioridad,
          tiempo_min: t.tiempo_min || 0,
          estado: t.hecho ? 'completada' : 'pendiente',
          _isTarea: true,
          _charName: p.nombre
        });
      });
    });
    const all = [...misiones, ...tareas];
    const filtered = applyMisionesFilters(all);
    const grouped = {};
    filtered.forEach(m => {
      const key = m.personaje || '(sin personaje)';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    });
    const orderedKeys = Object.keys(grouped).sort((a, b) => a === '(sin personaje)' ? -1 : b === '(sin personaje)' ? 1 : a.localeCompare(b));

    el.innerHTML = `
      <div class="wow-panel">
        <div class="wow-panel-header">
          <h2>🎯 Misiones</h2>
          <div class="flex gap-2 items-center">
            <span class="text-sm text-muted">${filtered.length} ítems (${tareas.length} tareas · ${misiones.length} misiones)</span>
            <button class="wow-btn wow-btn-sm wow-btn-primary" onclick="UI.showAddMisionModal()">+ Nueva</button>
          </div>
        </div>
        <div class="wow-panel-body" style="padding:6px 8px">
          ${renderMisionesFilterControls(state.misionesFilter)}
          <div class="task-table-wrap" style="margin-top:4px">
            <table class="task-table">
              <thead>
                <tr>
                  <th style="width:24px"></th>
                  <th style="width:100px">Personaje</th>
                  <th>Misión</th>
                  <th style="width:55px">Tipo</th>
                  <th style="width:40px">Prio</th>
                  <th style="width:45px">Tiempo</th>
                  <th style="width:70px">Estado</th>
                  <th style="width:50px"></th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length === 0 ? `
                  <tr><td colspan="8" style="text-align:center;padding:16px;color:var(--text-muted);font-size:0.75rem">No hay misiones. ¡Creá una!</td></tr>
                ` : orderedKeys.map(key => {
                  const items = grouped[key];
                  const pend = items.filter(m => m.estado !== 'completada').length;
                  return `
                    <tr class="dash-group-header" style="background:transparent;cursor:pointer" onclick="const n=this.nextElementSibling;while(n&&!n.classList.contains('dash-group-header')&&n.tagName==='TR'){n.classList.toggle('hidden');n=n.nextElementSibling}">
                      <td colspan="8" style="padding:3px 6px;font-size:0.65rem;font-weight:600">
                        <span class="arrow" style="font-size:0.5rem;display:inline-block;margin-right:4px">▼</span>
                        ${key === '(sin personaje)' ? '📋 Sin personaje' : `👤 ${key}`}
                        <span class="text-xs text-muted" style="margin-left:6px">${items.length} ítems · ${pend} pendientes</span>
                      </td>
                    </tr>
                    ${items.sort((a,b) => a.prioridad - b.prioridad).map(m => {
                      const isTarea = m._isTarea;
                      const toggleCall = isTarea
                        ? `UI.toggleTareaMision('${m._charName}','${m.id}')`
                        : `UI.toggleMision('${m.id}')`;
                      const editCall = isTarea
                        ? `UI.editTareaMision('${m._charName}','${m.id}')`
                        : `UI.editMision('${m.id}')`;
                      const deleteCall = isTarea
                        ? `UI.deleteTareaMision('${m._charName}','${m.id}')`
                        : `UI.deleteMision('${m.id}')`;
                      return `
                      <tr class="${m.estado === 'completada' ? 'done' : ''}" style="${m.estado === 'completada' ? 'opacity:0.55' : ''}">
                        <td>
                          <input type="checkbox" class="task-check" ${m.estado === 'completada' ? 'checked' : ''}
                                 onchange="${toggleCall}">
                        </td>
                        <td><span class="text-xs" style="color:var(--gold);font-weight:600">${m.personaje || '—'}</span></td>
                        <td style="font-size:0.7rem;cursor:pointer" onclick="${editCall}">${m.nombre}</td>
                        <td><span class="text-xs text-muted">${m.tipo}</span></td>
                        <td><span class="text-xs text-muted">P${m.prioridad}</span></td>
                        <td class="text-xs text-muted">${m.tiempo_min || 0}min</td>
                        <td><span class="text-xs ${m.estado === 'completada' ? 'text-muted' : ''}" style="${m.estado !== 'completada' ? 'color:var(--gold)' : ''}">${m.estado === 'completada' ? '✓ Hecho' : '○ Pendiente'}</span></td>
                        <td style="white-space:nowrap">
                          <button onclick="${editCall}" title="Editar" style="background:none;border:none;cursor:pointer;font-size:0.7rem;padding:0 2px">✏️</button>
                          <button onclick="${deleteCall}" title="Eliminar" style="background:none;border:none;cursor:pointer;font-size:0.7rem;padding:0 2px">🗑️</button>
                        </td>
                      </tr>
                      `;
                    }).join('')}
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

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
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
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
    `, 'Cancelar', () => {
      const nombre = document.getElementById('misionNombre').value.trim();
      if (!nombre) { showAlert('❌ Ingresá un nombre'); return; }
      DATA.addMision({
        nombre,
        personaje: document.getElementById('misionPersonaje').value,
        tipo: document.getElementById('misionTipo').value,
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
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
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
    `, 'Cancelar', () => {
      const nombre = document.getElementById('misionNombreEdit').value.trim();
      if (!nombre) { showAlert('❌ Ingresá un nombre'); return; }
      DATA.updateMision(id, {
        nombre,
        personaje: document.getElementById('misionPersonajeEdit').value,
        tipo: document.getElementById('misionTipoEdit').value,
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
          <label>Prioridad</label>
          <select id="tareaPrioridadEdit" style="width:100%">
            <option value="1" ${t.prioridad === 1 ? 'selected' : ''}>P1</option>
            <option value="2" ${t.prioridad === 2 ? 'selected' : ''}>P2</option>
            <option value="3" ${t.prioridad === 3 ? 'selected' : ''}>P3</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Tiempo (min)</label>
        <input type="number" id="tareaTiempoEdit" value="${t.tiempo_min || 30}" min="0" style="width:100%">
      </div>
    `, 'Cancelar', () => {
      const nombre = document.getElementById('tareaNombreEdit').value.trim();
      if (!nombre) { showAlert('❌ Ingresá un nombre'); return; }
      DATA.updateTarea(charName, taskId, {
        nombre,
        tipo: document.getElementById('tareaTipoEdit').value,
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
        <label>JSON</label>
        <textarea id="exportJsonArea" rows="12" style="width:100%;background:var(--bg-input);border:1px solid var(--border-subtle);border-radius:3px;padding:8px;color:var(--text-primary);font-size:0.75rem;font-family:monospace" readonly></textarea>
      </div>
      <div class="flex gap-2">
        <button class="wow-btn wow-btn-primary" onclick="UI.downloadJSON()">📥 Descargar JSON</button>
        <button class="wow-btn" onclick="UI.downloadCSV()">📥 Descargar CSV</button>
      </div>
    `, 'Cerrar');
    document.getElementById('exportJsonArea').value = DATA.exportJSON();
  }

  function showImportModal() {
    showModal('Importar Datos', `
      <p class="text-sm text-muted mb-2">Pegá el JSON completo o seleccioná un archivo</p>
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
          DATA.importJSON(text);
          state.selectedChar = null;
          render();
          GIST.doSync();
          closeModal();
          showAlert('✅ Datos importados correctamente');
        } catch (e) { showAlert('❌ ' + e.message); }
      }
    }, 'Importar');
  }

  function downloadJSON() {
    const blob = new Blob([DATA.exportJSON()], { type: 'application/json' });
    downloadBlob(blob, 'wowseg-data.json');
  }

  function downloadCSV() {
    const blob = new Blob([DATA.exportCSV()], { type: 'text/csv' });
    downloadBlob(blob, 'wowseg-personajes.csv');
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
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
    setDashFilter, setDashGroup1, setDashGroup2, setDashOrder,
    setDashFilterWarband, setDashFilterPriority, setDashFilterTime, setDashFilterEstado, setDashFilterSearch,
    resetAllDailies,
    showExportModal, showImportModal, downloadJSON, downloadCSV,
    showGistModal, gistConnect, gistDisconnect, logout,
    showModal, closeModal, confirmModal, showAlert, handleImportFile,
    showMoveCharModal, showManageWarbandsModal,
    addWarbandFromInput, renameWarbandPrompt, deleteWarbandPrompt,
    selectCharFromTable,
    showAddMisionModal, toggleMision, editMision, deleteMision, toggleTareaMision, editTareaMision, deleteTareaMision,
    setPriorityTab, setPriorityWarband, setTimeTab, setTimeWarband,
    setMisionesFilterPersonaje, setMisionesFilterWarband, setMisionesFilterTipo,
    setMisionesFilterPriority, setMisionesFilterTime, setMisionesFilterEstado, setMisionesFilterSearch
  };
})();
