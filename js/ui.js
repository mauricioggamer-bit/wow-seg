const UI = (() => {
  let state = {
    currentWarband: null,
    selectedChar: null,
    filterClase: '',
    filterReino: '',
    filterActivo: 'todos',
    search: '',
    viewMode: 'cards'
  };

  const CLASS_MAP = {
    'Guerrero': 'warrior', 'Paladín': 'paladin', 'Cazador': 'hunter',
    'Pícaro': 'rogue', 'Sacerdote': 'priest', 'DK': 'dk',
    'Chamán': 'shaman', 'Mago': 'mage', 'Brujo': 'warlock',
    'Monje': 'monk', 'Druida': 'druid', 'DH': 'dh', 'Evocadora': 'evoker',
    'Maga': 'mage'
  };

  function clsClass(className) {
    return 'class-' + (CLASS_MAP[className] || 'warrior');
  }

  function render() {
    DATA.checkWeeklyReset();
    renderHeaderStats();
    renderWarbandTabs();
    const wb = state.currentWarband || DATA.getWarbands()[0]?.nombre;
    if (wb) {
      state.currentWarband = wb;
      renderWarbandContent(wb);
    }
    if (state.selectedChar) {
      renderCharDetail(state.selectedChar);
    } else {
      renderEmptyDetail();
    }
  }

  function renderHeaderStats() {
    const stats = DATA.getStats();
    const el = document.getElementById('headerStats');
    if (!el) return;
    el.innerHTML = `
      <span class="stat-item"><span class="stat-value">${stats.total}</span> personajes</span>
      <span class="stat-item"><span class="stat-value">${stats.activos}</span> activos</span>
      <span class="stat-item"><span class="stat-value">${stats.warbands}</span> warbands</span>
      <span class="stat-item"><span class="stat-value">${stats.weeklyDone}/${stats.weeklyTotal}</span> tareas semanales</span>
      <span class="stat-item" style="color: ${stats.weeklyPct >= 50 ? 'var(--health-green)' : stats.weeklyPct >= 25 ? 'var(--orange)' : 'var(--red)'}">
        ${stats.weeklyPct}%
      </span>
    `;
  }

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
    const detail = document.getElementById('charDetail');
    if (!panel) return;
    const chars = DATA.getPersonajes().filter(c => c.warband === wbName);
    const wb = DATA.getWarbands().find(w => w.nombre === wbName);

    let filtered = applyFilters(chars);

    panel.innerHTML = `
      <div class="wow-panel">
        <div class="wow-panel-header">
          <h2>${wbName}</h2>
          <span class="text-sm text-muted">${filtered.length} personajes</span>
        </div>
        <div class="wow-panel-body">
          <div class="filter-bar mb-2">
            <input type="text" id="searchInput" placeholder="Buscar personaje..." value="${state.search}"
                   oninput="UI.setSearch(this.value)">
            <select id="filterClase" onchange="UI.setFilterClase(this.value)">
              <option value="">Todas las clases</option>
              ${[...new Set(DATA.getPersonajes().map(c => c.clase))].sort().map(cl =>
                `<option value="${cl}" ${state.filterClase === cl ? 'selected' : ''}>${cl}</option>`
              ).join('')}
            </select>
            <select id="filterReino" onchange="UI.setFilterReino(this.value)">
              <option value="">Todos los reinos</option>
              ${[...new Set(DATA.getPersonajes().map(c => c.reino))].sort().map(r =>
                `<option value="${r}" ${state.filterReino === r ? 'selected' : ''}>${r}</option>`
              ).join('')}
            </select>
            <select id="filterActivo" onchange="UI.setFilterActivo(this.value)">
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
    if (state.filterClase) {
      result = result.filter(c => c.clase === state.filterClase);
    }
    if (state.filterReino) {
      result = result.filter(c => c.reino === state.filterReino);
    }
    if (state.filterActivo === 'activos') {
      result = result.filter(c => c.activo);
    } else if (state.filterActivo === 'inactivos') {
      result = result.filter(c => !c.activo);
    }
    return result;
  }

  function renderCharCard(c) {
    const done = c.tareas.filter(t => t.hecho).length;
    const total = c.tareas.length;
    const isSelected = state.selectedChar === c.nombre;
    return `
      <div class="char-card ${isSelected ? 'active' : ''} ${c.activo ? '' : 'inactive'}"
           onclick="UI.selectChar('${c.nombre}')">
        <div class="char-name ${clsClass(c.clase)}">${c.nombre}</div>
        <div class="char-info">
          <span class="char-class ${clsClass(c.clase)}">${c.clase}</span>
          <span>Nvl ${c.nivel}</span>
          <span class="${c.faccion === 'Horda' ? 'faction-horda' : 'faction-alliance'}">${c.faccion}</span>
          <span>${c.raza}</span>
          <span class="text-muted">${c.reino}</span>
        </div>
        ${total > 0 ? `
          <div class="char-tasks-bar">
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
    if (state.selectedChar === nombre) {
      state.selectedChar = null;
    } else {
      state.selectedChar = nombre;
    }
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

    const weeklyTasks = c.tareas.filter(t => t.tipo === 'weekly');
    const otherTasks = c.tareas.filter(t => t.tipo !== 'weekly');
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
          </div>
        </div>
        <div class="wow-panel-body">
          <div class="flex flex-wrap gap-3 mb-2 text-sm">
            <span class="${c.faccion === 'Horda' ? 'faction-horda' : 'faction-alliance'}"><strong>${c.faccion}</strong></span>
            <span class="text-muted">${c.reino}</span>
            <span class="text-gold">${c.mision_principal || 'Sin misión principal'}</span>
          </div>

          ${weeklyTasks.length > 0 ? `
            <h4 class="text-sm mb-1" style="color:var(--gold-light)">Tareas Semanales (${doneWeekly}/${totalWeekly})</h4>
            <div class="task-list mb-2">
              ${weeklyTasks.map(t => renderTaskItem(c.nombre, t)).join('')}
            </div>
          ` : ''}

          ${otherTasks.length > 0 ? `
            <h4 class="text-sm mb-1 mt-2" style="color:var(--text-secondary)">Otras Tareas</h4>
            <div class="task-list">
              ${otherTasks.map(t => renderTaskItem(c.nombre, t)).join('')}
            </div>
          ` : ''}

          ${c.tareas.length === 0 ? '<div class="empty-state"><p>Este personaje no tiene tareas asignadas</p></div>' : ''}
        </div>
      </div>
    `;
  }

  function renderTaskItem(charName, t) {
    return `
      <div class="task-item ${t.hecho ? 'done' : ''}">
        <input type="checkbox" class="task-check" ${t.hecho ? 'checked' : ''}
               onchange="UI.toggleTask('${charName}','${t.id}')">
        <div class="task-info">
          <div class="task-name">${t.nombre}</div>
          <div class="task-meta">
            <span class="task-priority priority-${t.prioridad}">P${t.prioridad}</span>
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
    const t = DATA.toggleTarea(charName, taskId);
    renderHeaderStats();
    renderWarbandContent(state.currentWarband);
    renderCharDetail(state.selectedChar);
    GIST.doSync();
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

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }

  function setSearch(val) { state.search = val; renderWarbandContent(state.currentWarband); }
  function setFilterClase(val) { state.filterClase = val; renderWarbandContent(state.currentWarband); }
  function setFilterReino(val) { state.filterReino = val; renderWarbandContent(state.currentWarband); }
  function setFilterActivo(val) { state.filterActivo = val; renderWarbandContent(state.currentWarband); }

  function showExportModal() {
    showModal('Exportar Datos', `
      <div class="form-group">
        <label>JSON</label>
        <textarea id="exportJsonArea" rows="12" style="width:100%;background:var(--bg-input);border:1px solid var(--border);border-radius:3px;padding:8px;color:var(--text-primary);font-size:0.75rem;font-family:monospace" readonly></textarea>
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
        <textarea id="importJsonArea" rows="10" style="width:100%;background:var(--bg-input);border:1px solid var(--border);border-radius:3px;padding:8px;color:var(--text-primary);font-size:0.75rem;font-family:monospace" placeholder="Pegá el JSON aquí..."></textarea>
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
        } catch (e) {
          showAlert('❌ ' + e.message);
        }
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
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
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
      <div class="form-group flex gap-2 items-center">
        <label class="flex items-center gap-1" style="cursor:pointer">
          <input type="checkbox" id="gistRememberToken" ${cfg.hasToken && cfg.rememberToken ? 'checked' : ''}>
          <span class="text-sm">Recordar token</span>
        </label>
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
    const remember = document.getElementById('gistRememberToken').checked;

    if (!token) { showAlert('❌ Ingresá un token'); return; }

    GIST.setConfigUpdate({ rememberToken: remember, fileName });
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
    GIST.disconnect();
    closeModal();
    render();
    showAlert('Gist desconectado');
  }

  function showModal(title, bodyHTML, cancelText, onConfirm, confirmText) {
    let footer = '';
    if (onConfirm) {
      footer = `
        <div class="modal-footer">
          <button class="wow-btn" onclick="UI.closeModal()">${cancelText || 'Cancelar'}</button>
          <button class="wow-btn wow-btn-primary" onclick="UI.confirmModal()">${confirmText || 'Confirmar'}</button>
        </div>
      `;
    } else if (cancelText) {
      footer = `
        <div class="modal-footer">
          <button class="wow-btn" onclick="UI.closeModal()">${cancelText}</button>
        </div>
      `;
    }

    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    overlay.innerHTML = `
      <div class="modal-content" style="position:relative">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="UI.closeModal()">×</button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        ${footer}
      </div>
    `;
    overlay._onConfirm = onConfirm || null;
    overlay.classList.add('open');
  }

  function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
  }

  let alertResolve = null;
  function confirmModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay._onConfirm) overlay._onConfirm();
  }

  function showAlert(msg) {
    showModal('', `
      <div class="flex flex-wrap gap-2 items-center" style="justify-content:center;padding:20px">
        <p class="text-sm">${msg}</p>
      </div>
    `, 'OK');
  }

  function handleImportFile() {
    const input = document.getElementById('importFileInput');
    if (!input || !input.files[0]) return;
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('importJsonArea').value = e.target.result;
    };
    reader.readAsText(input.files[0]);
  }

  return {
    render, selectWarband, selectChar, toggleTask,
    setSearch, setFilterClase, setFilterReino, setFilterActivo,
    showExportModal, showImportModal, downloadJSON, downloadCSV,
    showGistModal, gistConnect, gistDisconnect,
    showModal, closeModal, confirmModal, showAlert, handleImportFile
  };
})();
