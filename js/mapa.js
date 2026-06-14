/* ══════════════════════════════════════════════════════════════
   MAPA — Interactive Expansion Map View
   ══════════════════════════════════════════════════════════════ */
const MAPA = (() => {
  const STORAGE_POS = 'wowseg_mapa_positions';
  const STORAGE_EXP = 'wowseg_mapa_expansion';
  const MAP_W = 1000;
  const MAP_H = 750;

  const CLASS_MAP = {
    'Guerrero': 'warrior', 'Paladín': 'paladin', 'Cazador': 'hunter',
    'Pícaro': 'rogue', 'Sacerdote': 'priest', 'DK': 'dk',
    'Chamán': 'shaman', 'Mago': 'mage', 'Brujo': 'warlock',
    'Monje': 'monk', 'Druida': 'druid', 'DH': 'dh', 'Evocadora': 'evoker',
    'Maga': 'mage'
  };
  const CLASS_ICONS = {
    warrior: '⚔', paladin: '⚜', hunter: '🏹', rogue: '🗡',
    priest: '✝', dk: '☠', shaman: '⚡', mage: '❄',
    warlock: '👁', monk: '☯', druid: '🌿', dh: '◈', evoker: '🐉'
  };
  const CLASS_COLORS = {
    warrior: '#C69B3A', paladin: '#F48CBA', hunter: '#AAD372', rogue: '#FFF569',
    priest: '#FFFFFF', dk: '#C41E3A', shaman: '#0070DD', mage: '#3FC7EB',
    warlock: '#8788EE', monk: '#00FF96', druid: '#FF7C0A', dh: '#A330C9', evoker: '#33937F'
  };
  const FACTION_COLORS = { Horda: '#AA1111', Alianza: '#1A6DB5' };
  const BADGE_LETTERS = {
    midnight: 'M', tww: 'TW', dragonflight: 'DF', shadowlands: 'SL',
    bfa: 'BFA', legion: 'L', draenor: 'WD', mop: 'MOP', cata: 'C', wotlk: 'W'
  };

  const EXPANSIONS = [
    { key: 'tww', label: 'The War Within', color: '#8b6914', icon: '🪨' },
    { key: 'midnight', label: 'Midnight', color: '#6b2fa0', icon: '🌙' },
    { key: 'dragonflight', label: 'Dragonflight', color: '#2a8b3a', icon: '🐉' },
    { key: 'shadowlands', label: 'Shadowlands', color: '#3a6bb5', icon: '👻' },
    { key: 'bfa', label: 'Battle for Azeroth', color: '#c9a84c', icon: '⚓' },
    { key: 'legion', label: 'Legion', color: '#2a6b3a', icon: '🔥' },
    { key: 'draenor', label: 'Warlords of Draenor', color: '#8b2a14', icon: '🏴' },
    { key: 'mop', label: 'Mists of Pandaria', color: '#3aaa6b', icon: '🐼' },
    { key: 'cata', label: 'Cataclysm', color: '#b56b14', icon: '🌋' },
    { key: 'wotlk', label: 'Wrath of the Lich King', color: '#3a8bbb', icon: '❄️' },
    { key: 'classic', label: 'Classic', color: '#4a7a3a', icon: '🗺️' },
    { key: 'outland', label: 'The Burning Crusade', color: '#8a2a18', icon: '💀' }
  ];
  const EXP_MAP = {};
  EXPANSIONS.forEach(e => EXP_MAP[e.key] = e);

  let state = {
    activeExp: null,
    positions: {},
    dragging: null,
    dragOffX: 0, dragOffY: 0,
    sidebarTab: 'chars',
    showInactivos: true,
    highlight: null,
    containerRect: null
  };

  let isDestroyed = false;

  /* ================================================================
     MAP SVG DATA — loaded from external file
     ================================================================ */

  const MAP_PARAMS = typeof MAPA_SVGS !== 'undefined' ? MAPA_SVGS : {};

  function genMidnightSVG() {
    const c = '#6b2fa0', bg = '#0e081a';
    return `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" style="color:${c}">
      <defs>
        <radialGradient id="bg_mid" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="${bg}"/>
          <stop offset="60%" stop-color="rgba(0,0,0,0.8)"/>
          <stop offset="100%" stop-color="#020202"/>
        </radialGradient>
        <filter id="glow_mid"><feGaussianBlur stdDeviation="4"/></filter>
      </defs>
      <rect width="800" height="600" fill="url(#bg_mid)"/>
      <path d="M400,80 Q550,100 650,180 Q720,280 680,400 Q600,500 480,520 Q350,530 250,480 Q150,400 160,280 Q180,160 300,100 Z" fill="${c}" opacity="0.12" stroke="${c}" stroke-width="2" filter="url(#glow_mid)"/>
      <path d="M400,80 Q550,100 650,180 Q720,280 680,400 Q600,500 480,520 Q350,530 250,480 Q150,400 160,280 Q180,160 300,100 Z" fill="none" stroke="${c}" stroke-width="0.5" opacity="0.3"/>
      <g fill="${c}" opacity="0.8" font-family="Cinzel,serif" font-size="12" text-anchor="middle">
        <circle cx="420" cy="200" r="4"/><text x="420" y="222">Eversong Woods</text>
        <circle cx="500" cy="280" r="4"/><text x="500" y="302">Ghostlands</text>
        <circle cx="420" cy="360" r="4"/><text x="420" y="382">Que'Thalas</text>
        <circle cx="320" cy="400" r="4"/><text x="320" y="422">Tranquillien</text>
        <circle cx="550" cy="420" r="4"/><text x="550" y="442">Deatholme</text>
        <circle cx="700" cy="200" r="3" opacity="0.6"/><text x="700" y="222" font-size="10">Lordaeron</text>
      </g>
      <g transform="translate(720, 55)">
        <circle r="32" fill="none" stroke="${c}" stroke-width="2" opacity="0.4"/>
        <circle r="26" fill="${c}" opacity="0.15"/>
        <text x="0" y="8" text-anchor="middle" font-size="20" font-family="Cinzel,serif" font-weight="700" fill="${c}">M</text>
      </g>
      <text x="720" y="110" text-anchor="middle" font-size="14" font-family="Cinzel,serif" font-weight="700" fill="${c}" opacity="0.8">Midnight</text>
    </svg>`;
  }
  MAP_PARAMS.midnight = { svg: genMidnightSVG() };

  /* ================================================================
     STATE HELPERS
     ================================================================ */

  function getChars() { return DATA.getPersonajes(); }

  function getCharsForExp(expKey) {
    return getChars().filter(c => DATA.getCharExpansion(c.nombre) === expKey);
  }

  function getActiveExp() {
    if (!state.activeExp) {
      state.activeExp = localStorage.getItem(STORAGE_EXP) || EXPANSIONS[0].key;
    }
    return state.activeExp;
  }

  function loadPositions() {
    try {
      const raw = localStorage.getItem(STORAGE_POS);
      state.positions = raw ? JSON.parse(raw) : {};
    } catch { state.positions = {}; }
  }

  function savePositions() {
    localStorage.setItem(STORAGE_POS, JSON.stringify(state.positions));
  }

  function getPos(id) {
    return state.positions[id] || null;
  }

  function setPos(id, x, y) {
    state.positions[id] = { x, y };
  }

  function autoLayout(chars, containerW, containerH) {
    if (!containerW || !containerH) return;
    const padX = 80, padY = 40;
    const availW = containerW - padX * 2;
    const availH = containerH - padY * 2;
    const cols = Math.min(chars.length, 4);
    const rows = Math.ceil(chars.length / cols);
    const cellW = availW / cols;
    const cellH = availH / rows;

    chars.forEach((c, i) => {
      const id = 'char_' + c.nombre;
      if (getPos(id)) return;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = padX + cellW * (col + 0.5);
      const cy = padY + cellH * (row + 0.5);
      setPos(id, (cx / containerW) * MAP_W, (cy / containerH) * MAP_H);

      c.tareas.forEach((t, ti) => {
        const tid = 'task_' + c.nombre + '_' + t.id;
        if (getPos(tid)) return;
        const tx = padX + cellW * (col + 0.5) + 80 + ti * 60;
        const ty = padY + cellH * (row + 0.5) - 30 + ti * 30;
        setPos(tid, (tx / containerW) * MAP_W, (ty / containerH) * MAP_H);
      });
    });
    savePositions();
  }

  /* ================================================================
     RENDER
     ================================================================ */

  function render() {
    if (isDestroyed) return;
    const panel = document.getElementById('mapaPanel');
    if (!panel) return;
    panel.classList.add('open');

    loadPositions();
    const expKey = getActiveExp();
    const exp = EXP_MAP[expKey];
    if (!exp) { state.activeExp = EXPANSIONS[0].key; return render(); }

    panel.innerHTML = `
      <div class="mapa-exp-selector" id="mapaExpSelector"></div>
      <div class="mapa-layout">
        <div class="mapa-area" id="mapaArea"></div>
        <div class="mapa-sidebar" id="mapaSidebar"></div>
      </div>
      <div class="mapa-stats" id="mapaStats"></div>
    `;

    renderSelector();
    renderSidebarContent();

    const chars = getCharsForExp(expKey);
    const area = document.getElementById('mapaArea');
    const rect = area.getBoundingClientRect();
    state.containerRect = rect;

    autoLayout(chars, rect.width, rect.height);
    renderMapa(expKey, chars);
    renderStats();
  }

  function renderSelector() {
    const el = document.getElementById('mapaExpSelector');
    if (!el) return;
    const expKey = getActiveExp();
    el.innerHTML = EXPANSIONS.map(e => {
      const count = getCharsForExp(e.key).length;
      return `<button class="mapa-exp-btn ${e.key === expKey ? 'active' : ''}" data-exp="${e.key}">
        <span class="mapa-exp-dot" style="background:${e.color}"></span>
        ${e.icon} ${e.label}
        <span class="mapa-exp-count">${count}</span>
      </button>`;
    }).join('');

    el.querySelectorAll('.mapa-exp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeExp = btn.dataset.exp;
        localStorage.setItem(STORAGE_EXP, state.activeExp);
        render();
      });
    });
  }

  function renderMapa(expKey, chars) {
    const area = document.getElementById('mapaArea');
    if (!area) return;
    const exp = EXP_MAP[expKey];
    const params = MAP_PARAMS[expKey];

    const rect = area.getBoundingClientRect();
    state.containerRect = rect;
    const scX = rect.width / MAP_W;
    const scY = rect.height / MAP_H;

    area.innerHTML = `
      <div class="mapa-svg-wrap">${params ? params.svg : ''}</div>
      <svg class="mapa-conexiones" id="mapaConexiones"></svg>
    `;

    const container = area;

    // Render cards
    chars.forEach(c => {
      const pos = getPos('char_' + c.nombre);
      if (!pos) return;
      const px = pos.x * scX;
      const py = pos.y * scY;
      const card = document.createElement('div');
      card.className = 'mapa-card ' + (c.faccion === 'Horda' ? 'horda' : 'alliance');
      card.dataset.charName = c.nombre;
      card.style.left = px + 'px';
      card.style.top = py + 'px';
      const clsKey = CLASS_MAP[c.clase] || 'warrior';
      const clsColor = CLASS_COLORS[clsKey] || '#fff';
      const clsIcon = CLASS_ICONS[clsKey] || '?';
      const done = c.tareas.filter(t => t.hecho).length;
      const total = c.tareas.length;
      card.innerHTML = `
        <div class="mapa-card-header">
          <div class="mapa-card-name" style="color:${clsColor}">${c.nombre}</div>
          <div class="mapa-card-class-icon">${clsIcon}</div>
        </div>
        <div class="mapa-card-info">Nvl ${c.nivel} · ${c.raza} · ${c.clase}</div>
        <div class="mapa-card-warband">${c.warband}</div>
        ${total > 0 ? `<div class="mapa-card-tasks">${c.tareas.map(t => `<span class="mapa-card-dot ${t.hecho ? 'done' : 'pending'}"></span>`).join('')}</div>` : ''}
      `;
      container.appendChild(card);
      makeDraggable(card, 'char_' + c.nombre);

      // Highlight target
      card.addEventListener('click', (e) => {
        if (state.dragging) return;
        state.highlight = 'char_' + c.nombre;
        renderSidebarContent();
        document.querySelectorAll('.mapa-card,.mapa-slip').forEach(el => el.classList.remove('highlight'));
        card.classList.add('highlight');
      });
    });

    // Render slips for each character's tasks
    chars.forEach(c => {
      c.tareas.forEach(t => {
        const tid = 'task_' + c.nombre + '_' + t.id;
        const pos = getPos(tid);
        if (!pos) return;
        const px = pos.x * scX;
        const py = pos.y * scY;
        const slip = document.createElement('div');
        slip.className = 'mapa-slip';
        slip.dataset.taskId = tid;
        slip.dataset.charName = c.nombre;
        slip.dataset.taskRealId = t.id;
        slip.style.left = px + 'px';
        slip.style.top = py + 'px';
        const typeLabel = t.cooldown || 'none';
        slip.innerHTML = `
          <div class="mapa-slip-header">
            <div class="mapa-slip-name">${t.nombre}</div>
            <input type="checkbox" class="mapa-slip-check" ${t.hecho ? 'checked' : ''}>
          </div>
          <div class="mapa-slip-meta">
            <span class="mapa-slip-type ${typeLabel}">${typeLabel}</span>
            <span>P${t.prioridad}</span>
            <span>${t.tiempo_min}min</span>
          </div>
          ${t.recompensa ? `<div class="mapa-slip-reward">🎁 ${t.recompensa}</div>` : ''}
        `;
        container.appendChild(slip);
        makeDraggable(slip, tid);

        slip.querySelector('.mapa-slip-check').addEventListener('change', function(e) {
          e.stopPropagation();
          DATA.toggleTarea(c.nombre, t.id);
          if (typeof GIST !== 'undefined' && GIST.doSync) GIST.doSync();
          render();
        });

        slip.addEventListener('click', (e) => {
          if (e.target.classList.contains('mapa-slip-check')) return;
          if (state.dragging) return;
          state.highlight = tid;
          renderSidebarContent();
          document.querySelectorAll('.mapa-card,.mapa-slip').forEach(el => el.classList.remove('highlight'));
          slip.classList.add('highlight');
        });
      });
    });

    // Draw connections
    renderConexiones();
  }

  /* ================================================================
     CONNECTION LINES
     ================================================================ */

  function renderConexiones() {
    const svg = document.getElementById('mapaConexiones');
    if (!svg) return;
    const area = document.getElementById('mapaArea');
    if (!area) return;
    const rect = area.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    svg.style.width = rect.width + 'px';
    svg.style.height = rect.height + 'px';

    let lines = '';
    const expKey = getActiveExp();
    const chars = getCharsForExp(expKey);

    chars.forEach(c => {
      c.tareas.forEach(t => {
        const cardEl = area.querySelector(`.mapa-card[data-char-name="${c.nombre}"]`);
        const slipEl = area.querySelector(`.mapa-slip[data-task-id="task_${c.nombre}_${t.id}"]`);
        if (!cardEl || !slipEl) return;

        const cr = cardEl.getBoundingClientRect();
        const sr = slipEl.getBoundingClientRect();
        const areaRect = area.getBoundingClientRect();

        const x1 = cr.left - areaRect.left + cr.width / 2;
        const y1 = cr.top - areaRect.top + cr.height;
        const x2 = sr.left - areaRect.left + sr.width / 2;
        const y2 = sr.top - areaRect.top;

        const color = FACTION_COLORS[c.faccion] || '#888';
        const opacity = t.hecho ? '0.3' : '0.5';
        lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" opacity="${opacity}"/>`;

        // Small dot at endpoints
        lines += `<circle cx="${x1}" cy="${y1}" r="3" fill="${color}" opacity="${opacity}"/>`;
        lines += `<circle cx="${x2}" cy="${y2}" r="2" fill="${color}" opacity="${opacity}"/>`;
      });
    });

    svg.innerHTML = lines;
  }

  /* ================================================================
     DRAG & DROP
     ================================================================ */

  function makeDraggable(el, id) {
    let startX, startY, origX, origY;
    let isDragging = false;

    el.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
      isDragging = false;
      const rect = el.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      origX = parseFloat(el.style.left) || 0;
      origY = parseFloat(el.style.top) || 0;

      const onMove = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDragging = true;
        if (!isDragging) return;

        state.dragging = true;
        el.classList.add('dragging');

        const area = document.getElementById('mapaArea');
        if (!area) return;
        const areaRect = area.getBoundingClientRect();
        const scX = areaRect.width / MAP_W;
        const scY = areaRect.height / MAP_H;

        let newX = origX + dx;
        let newY = origY + dy;
        newX = Math.max(0, Math.min(areaRect.width - 40, newX));
        newY = Math.max(0, Math.min(areaRect.height - 30, newY));

        el.style.left = newX + 'px';
        el.style.top = newY + 'px';

        // Update position in state (in map coordinates)
        const mapX = newX / scX;
        const mapY = newY / scY;
        setPos(id, mapX, mapY);

        // Update connections
        renderConexiones();
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (isDragging) {
          state.dragging = false;
          el.classList.remove('dragging');
          savePositions();
        }
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  /* ================================================================
     SIDEBAR
     ================================================================ */

  function renderSidebarContent() {
    const el = document.getElementById('mapaSidebar');
    if (!el) return;
    const expKey = getActiveExp();
    const chars = getCharsForExp(expKey);
    const tab = state.sidebarTab;

    let filtered = chars;
    if (!state.showInactivos) filtered = filtered.filter(c => c.activo);

    el.innerHTML = `
      <div class="mapa-sidebar-tabs">
        <button class="mapa-sidebar-tab ${tab === 'chars' ? 'active' : ''}" data-tab="chars">🎭 Chars</button>
        <button class="mapa-sidebar-tab ${tab === 'tasks' ? 'active' : ''}" data-tab="tasks">📋 Tasks</button>
        <button class="mapa-sidebar-tab ${tab === 'groups' ? 'active' : ''}" data-tab="groups">📁 Groups</button>
      </div>
      <div class="mapa-sidebar-filter">
        <label><input type="checkbox" ${state.showInactivos ? 'checked' : ''} id="mapaShowInactive"> Mostrar inactivos</label>
      </div>
      <div class="mapa-sidebar-content" id="mapaSidebarContent"></div>
    `;

    el.querySelectorAll('.mapa-sidebar-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        state.sidebarTab = btn.dataset.tab;
        renderSidebarContent();
      });
    });

    const cb = document.getElementById('mapaShowInactive');
    if (cb) {
      cb.addEventListener('change', () => {
        state.showInactivos = cb.checked;
        renderSidebarContent();
      });
    }

    const content = document.getElementById('mapaSidebarContent');
    if (!content) return;

    if (tab === 'chars') renderSidebarChars(content, filtered);
    else if (tab === 'tasks') renderSidebarTasks(content, filtered);
    else if (tab === 'groups') renderSidebarGroups(content, filtered);
  }

  function scrollToElement(selector) {
    const area = document.getElementById('mapaArea');
    if (!area) return;
    const el = area.querySelector(selector);
    if (!el) return;
    state.highlight = selector;
    document.querySelectorAll('.mapa-card,.mapa-slip').forEach(e => e.classList.remove('highlight'));
    el.classList.add('highlight');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.querySelectorAll('.mapa-sidebar-item').forEach(e => e.classList.remove('active'));
    const sid = document.querySelector(`.mapa-sidebar-item[data-char="${el.dataset.charName || ''}"]`);
    if (sid) sid.classList.add('active');
  }

  function renderSidebarChars(content, chars) {
    if (chars.length === 0) {
      content.innerHTML = '<div class="mapa-sidebar-empty">No hay personajes para esta expansión</div>';
      return;
    }
    content.innerHTML = chars.map(c => {
      const clsKey = CLASS_MAP[c.clase] || 'warrior';
      const icon = CLASS_ICONS[clsKey] || '?';
      const isHighlight = state.highlight === 'char_' + c.nombre;
      return `<div class="mapa-sidebar-item ${isHighlight ? 'active' : ''}" data-char="${c.nombre}">
        <span class="item-icon">${icon}</span>
        <span class="item-name" style="color:${CLASS_COLORS[clsKey]}">${c.nombre}</span>
        <span class="item-count">${c.tareas.length}t</span>
      </div>`;
    }).join('');

    content.querySelectorAll('.mapa-sidebar-item').forEach(item => {
      item.addEventListener('click', () => {
        const name = item.dataset.char;
        scrollToElement(`.mapa-card[data-char-name="${name}"]`);
      });
    });
  }

  function renderSidebarTasks(content, chars) {
    let allTasks = [];
    chars.forEach(c => {
      c.tareas.forEach(t => {
        allTasks.push({ ...t, personaje: c.nombre, faccion: c.faccion, clase: c.clase });
      });
    });
    if (allTasks.length === 0) {
      content.innerHTML = '<div class="mapa-sidebar-empty">No hay tareas para esta expansión</div>';
      return;
    }
    const done = allTasks.filter(t => t.hecho).length;
    content.innerHTML = `<div style="padding:2px 8px;font-size:0.55rem;color:var(--text-dim);margin-bottom:2px">${done}/${allTasks.length} hechas</div>` +
      allTasks.map(t => {
        const isHighlight = state.highlight === 'task_' + t.personaje + '_' + t.id;
        const clsKey = CLASS_MAP[t.clase] || 'warrior';
        return `<div class="mapa-sidebar-item ${isHighlight ? 'active' : ''}" data-task="${t.id}" data-char="${t.personaje}">
          <span class="item-icon" style="color:${t.hecho ? 'var(--health-green)' : 'var(--text-dim)'}">${t.hecho ? '✓' : '○'}</span>
          <span class="item-name">${t.nombre}</span>
          <span class="item-count" style="color:CLASS_COLORS[clsKey]">${t.personaje}</span>
        </div>`;
      }).join('');

    content.querySelectorAll('.mapa-sidebar-item').forEach(item => {
      item.addEventListener('click', () => {
        const name = item.dataset.char;
        const taskId = item.dataset.task;
        scrollToElement(`.mapa-slip[data-task-id="task_${name}_${taskId}"]`);
      });
    });
  }

  function renderSidebarGroups(content, chars) {
    const groups = {};
    chars.forEach(c => {
      if (!groups[c.warband]) groups[c.warband] = [];
      groups[c.warband].push(c);
    });
    const keys = Object.keys(groups).sort();
    if (keys.length === 0) {
      content.innerHTML = '<div class="mapa-sidebar-empty">No hay grupos</div>';
      return;
    }
    content.innerHTML = keys.map(wb => `
      <div style="padding:3px 8px;font-size:0.6rem;color:var(--gold-light);font-weight:600;border-bottom:1px solid var(--border-subtle);margin-top:4px">${wb} (${groups[wb].length})</div>
      ${groups[wb].map(c => {
        const clsKey = CLASS_MAP[c.clase] || 'warrior';
        const icon = CLASS_ICONS[clsKey] || '?';
        const isHighlight = state.highlight === 'char_' + c.nombre;
        return `<div class="mapa-sidebar-item ${isHighlight ? 'active' : ''}" data-char="${c.nombre}">
          <span class="item-icon">${icon}</span>
          <span class="item-name" style="color:${CLASS_COLORS[clsKey]}">${c.nombre}</span>
          <span class="item-count">${c.tareas.filter(t => t.hecho).length}/${c.tareas.length}</span>
        </div>`;
      }).join('')}
    `).join('');

    content.querySelectorAll('.mapa-sidebar-item').forEach(item => {
      item.addEventListener('click', () => {
        const name = item.dataset.char;
        scrollToElement(`.mapa-card[data-char-name="${name}"]`);
      });
    });
  }

  /* ================================================================
     STATS BAR
     ================================================================ */

  function renderStats() {
    const el = document.getElementById('mapaStats');
    if (!el) return;
    const expKey = getActiveExp();
    const chars = getCharsForExp(expKey);
    const allTasks = [];
    chars.forEach(c => c.tareas.forEach(t => allTasks.push(t)));
    const done = allTasks.filter(t => t.hecho).length;
    const total = allTasks.length;
    const pct = total > 0 ? Math.round(done / total * 100) : 0;
    const totalMin = allTasks.reduce((s, t) => s + (t.tiempo_min || 0), 0);
    const weekly = allTasks.filter(t => t.cooldown === 'weekly');
    const weeklyDone = weekly.filter(t => t.hecho).length;
    const weeklyTotal = weekly.length;
    const barColor = pct >= 50 ? 'green' : pct >= 25 ? 'yellow' : 'red';

    el.innerHTML = `
      <span class="mapa-stat"><span class="mapa-stat-value">${chars.length}</span> personajes</span>
      <span class="mapa-stat"><span class="mapa-stat-value">${done}/${total}</span> tareas</span>
      <span class="mapa-stat"><span class="mapa-stat-value">${weeklyDone}/${weeklyTotal}</span> semanales</span>
      <span class="mapa-stat"><span class="mapa-stat-value">${totalMin}min</span> total</span>
      <div class="mapa-stat-bar"><div class="mapa-stat-fill ${barColor}" style="width:${pct}%"></div></div>
      <span style="color:var(--gold);font-weight:600">${pct}%</span>
    `;
  }

  /* ================================================================
     WINDOW RESIZE
     ================================================================ */

  let resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (isDestroyed) return;
      const panel = document.getElementById('mapaPanel');
      if (!panel || !panel.classList.contains('open')) return;
      renderConexiones();
    }, 100);
  }

  /* ================================================================
     PUBLIC API
     ================================================================ */

  function init() {
    window.addEventListener('resize', onResize);
  }

  function renderView() {
    state.highlight = null;
    state.dragging = null;
    render();
  }

  function destroy() {
    isDestroyed = true;
    const panel = document.getElementById('mapaPanel');
    if (panel) panel.classList.remove('open');
    window.removeEventListener('resize', onResize);
  }

  function resume() {
    isDestroyed = false;
  }

  return { init, render: renderView, destroy, resume };
})();

// Auto-init
document.addEventListener('DOMContentLoaded', () => MAPA.init());
