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
    { key: 'tww', label: 'The War Within', color: '#8b6914', bg: '#0e0c06', icon: '🪨', order: 0 },
    { key: 'midnight', label: 'Midnight', color: '#6b2fa0', bg: '#0e081a', icon: '🌙', order: 1 },
    { key: 'dragonflight', label: 'Dragonflight', color: '#2a8b3a', bg: '#06140a', icon: '🐉', order: 2 },
    { key: 'shadowlands', label: 'Shadowlands', color: '#3a6bb5', bg: '#0a0818', icon: '👻', order: 3 },
    { key: 'bfa', label: 'Battle for Azeroth', color: '#c9a84c', bg: '#140e06', icon: '⚓', order: 4 },
    { key: 'legion', label: 'Legion', color: '#2a6b3a', bg: '#08140a', icon: '🔥', order: 5 },
    { key: 'draenor', label: 'Warlords of Draenor', color: '#8b2a14', bg: '#140804', icon: '🏴', order: 6 },
    { key: 'mop', label: 'Mists of Pandaria', color: '#3aaa6b', bg: '#081408', icon: '🐼', order: 7 },
    { key: 'cata', label: 'Cataclysm', color: '#b56b14', bg: '#140c04', icon: '🌋', order: 8 },
    { key: 'wotlk', label: 'Wrath of the Lich King', color: '#3a8bbb', bg: '#06101c', icon: '❄️', order: 9 }
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
     MAP SVG GENERATORS
     ================================================================ */

  function makeGridLines(w, h) {
    let s = '';
    for (let x = 0; x <= w; x += 100) s += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="currentColor" stroke-width="0.5" opacity="0.08"/>`;
    for (let y = 0; y <= h; y += 100) s += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="currentColor" stroke-width="0.5" opacity="0.08"/>`;
    return s;
  }

  function makeContinentPath(points) {
    return 'M ' + points.map((p, i) => (i === 0 ? '' : 'L ') + p[0] + ' ' + p[1]).join(' ') + ' Z';
  }

  function makeZoneDots(zones) {
    return zones.map(z =>
      `<g><circle cx="${z[0]}" cy="${z[1]}" r="4" fill="currentColor" opacity="0.6"/>` +
      `<text x="${z[0]}" y="${z[1] + 16}" text-anchor="middle" font-size="10" font-family="Cinzel,serif" fill="currentColor" opacity="0.7">${z[2]}</text></g>`
    ).join('');
  }

  function makeBadge(cx, cy, letter, color) {
    return `<g transform="translate(${cx},${cy})">` +
      `<circle r="28" fill="none" stroke="${color}" stroke-width="2" opacity="0.5"/>` +
      `<circle r="24" fill="${color}" opacity="0.15"/>` +
      `<text x="0" y="7" text-anchor="middle" font-size="16" font-family="Cinzel,serif" font-weight="700" fill="${color}">${letter}</text></g>`;
  }

  function makeCompRose(cx, cy, s) {
    return `<g transform="translate(${cx},${cy})" opacity="0.3">` +
      `<line x1="0" y1="${-s}" x2="0" y2="${s}" stroke="currentColor" stroke-width="1"/>` +
      `<line x1="${-s}" y1="0" x2="${s}" y2="0" stroke="currentColor" stroke-width="1"/>` +
      `<polygon points="0,${-s} 4,${-s+12} -4,${-s+12}" fill="currentColor"/>` +
      `<polygon points="0,${s} 4,${s-12} -4,${s-12}" fill="currentColor" opacity="0.4"/>` +
      `<polygon points="${s},0 ${s-12},4 ${s-12},-4" fill="currentColor" opacity="0.4"/>` +
      `<polygon points="${-s},0 ${-s+12},4 ${-s+12},-4" fill="currentColor"/>` +
      `<text x="0" y="${-s-6}" text-anchor="middle" font-size="8" fill="currentColor">N</text>` +
      `<text x="${s+8}" y="3" text-anchor="middle" font-size="8" fill="currentColor">E</text></g>`;
  }

  function makeTerrainBlobs(color) {
    return `<g opacity="0.06">
      <circle cx="200" cy="150" r="80" fill="${color}"/>
      <circle cx="600" cy="200" r="100" fill="${color}"/>
      <circle cx="400" cy="450" r="120" fill="${color}"/>
      <circle cx="750" cy="400" r="70" fill="${color}"/>
      <circle cx="100" cy="500" r="60" fill="${color}"/>
    </g>`;
  }

  function genSVG(params) {
    const { key, color, bg, zones, continent, label } = params;
    const badgeLetter = BADGE_LETTERS[key] || key.slice(0, 2).toUpperCase();
    const w = 800, h = 600;
    const c = color;
    return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="color:${c}">
      <defs>
        <radialGradient id="bg_${key}" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="${bg}"/>
          <stop offset="60%" stop-color="rgba(0,0,0,0.8)"/>
          <stop offset="100%" stop-color="#020202"/>
        </radialGradient>
        <filter id="glow_${key}">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#bg_${key})"/>
      ${makeGridLines(w, h)}
      ${makeTerrainBlobs(c)}
      ${makeCompRose(60, h - 60, 30)}
      <path d="${makeContinentPath(continent)}" fill="${c}" opacity="0.12" stroke="${c}" stroke-width="2" filter="url(#glow_${key})"/>
      <path d="${makeContinentPath(continent)}" fill="none" stroke="${c}" stroke-width="0.5" opacity="0.3"/>
      ${makeZoneDots(zones)}
      ${makeBadge(w - 60, 55, badgeLetter, c)}
      <text x="${w - 60}" y="100" text-anchor="middle" font-size="13" font-family="Cinzel,serif" font-weight="700" fill="${c}" opacity="0.8">${label}</text>
    </svg>`;
  }

  /* ================================================================
     CONTINENT SHAPES & ZONES PER EXPANSION
     ================================================================ */

  const MAP_PARAMS = {
    tww: {
      key: 'tww', color: '#8b6914', bg: '#0e0c06',
      label: 'Khaz Algar',
      continent: [[400,50],[650,120],[750,280],[700,450],[550,560],[350,580],[200,500],[100,350],[120,180],[250,80]],
      zones: [[400,200,'Azj-Kahet'],[550,300,'Hallowfall'],[300,350,'Deepforge'],[500,450,'Ringing Deeps'],[600,180,'Isle of Dorn']]
    },
    midnight: {
      key: 'midnight', color: '#6b2fa0', bg: '#0e081a',
      label: 'Midnight',
      continent: [[350,80],[500,60],[650,100],[700,250],[680,400],[550,500],[400,480],[250,420],[200,300],[220,150]],
      zones: [[400,160,'Eversong'],[550,200,'Ghostlands'],[600,320,'Que\'Thalas'],[350,350,'Tranquillien'],[450,400,'Deatholme']]
    },
    dragonflight: {
      key: 'dragonflight', color: '#2a8b3a', bg: '#06140a',
      label: 'Dragon Isles',
      continent: [[400,80],[580,100],[700,200],[720,350],[650,480],[500,550],[350,560],[200,510],[100,380],[120,220],[250,100]],
      zones: [[400,180,'Waking Shores'],[580,270,'Ohn\'ahra'],[500,380,'Azure Span'],[320,390,'Thaldraszus'],[200,330,'Forbidden Reach']]
    },
    shadowlands: {
      key: 'shadowlands', color: '#3a6bb5', bg: '#0a0818',
      label: 'Shadowlands',
      continent: [[400,50],[550,100],[600,250],[550,400],[400,450],[250,400],[200,250],[250,100]],
      zones: [[400,150,'Bastion'],[550,250,'Maldraxxus'],[400,350,'Ardenweald'],[250,250,'Revendreth'],[400,250,'Zereth Mortis']]
    },
    bfa: {
      key: 'bfa', color: '#c9a84c', bg: '#140e06',
      label: 'Zandalar',
      continent: [[300,100],[450,80],[600,120],[700,230],[750,380],[700,500],[550,560],[400,540],[250,480],[150,360],[120,220],[180,120]],
      zones: [[400,180,'Nazmir'],[580,240,'Vol\'dun'],[260,280,'Zuldazar'],[500,380,'Nazjatar'],[620,420,'Mechagon']]
    },
    legion: {
      key: 'legion', color: '#2a6b3a', bg: '#08140a',
      label: 'Broken Isles',
      continent: [[350,100],[520,120],[640,220],[680,350],[620,460],[500,510],[380,500],[260,440],[200,330],[220,200]],
      zones: [[400,200,'Azsuna'],[520,280,'Val\'sharah'],[600,350,'Stormheim'],[350,350,'Suramar'],[450,420,'Broken Shore']]
    },
    draenor: {
      key: 'draenor', color: '#8b2a14', bg: '#140804',
      label: 'Draenor',
      continent: [[350,80],[530,90],[680,180],[720,320],[650,450],[510,520],[360,510],[210,440],[140,300],[180,160]],
      zones: [[400,180,'Frostfire'],[560,250,'Shadowmoon'],[630,350,'Nagrand'],[430,370,'Talador'],[250,330,'Spires of Arak']]
    },
    mop: {
      key: 'mop', color: '#3aaa6b', bg: '#081408',
      label: 'Pandaria',
      continent: [[400,60],[560,100],[680,200],[700,340],[650,450],[550,510],[400,520],[280,480],[180,380],[170,240],[260,120]],
      zones: [[400,160,'Jade Forest'],[580,250,'Valley'],[500,370,'Kun-Lai'],[320,360,'Townlong'],[250,270,'Dread Wastes']]
    },
    cata: {
      key: 'cata', color: '#b56b14', bg: '#140c04',
      label: 'Azeroth',
      continent: [[300,50],[480,40],[650,80],[720,190],[680,320],[600,400],[500,430],[400,420],[300,380],[200,310],[150,200],[180,90]],
      zones: [[400,130,'Eastern Kingdoms'],[580,220,'Kalimdor'],[450,310,'Deepholm'],[300,260,'Uldum'],[500,350,'Twilight Highlands']]
    },
    wotlk: {
      key: 'wotlk', color: '#3a8bbb', bg: '#06101c',
      label: 'Northrend',
      continent: [[400,50],[570,90],[690,200],[710,340],[650,450],[510,510],[380,510],[250,470],[150,380],[130,230],[230,110]],
      zones: [[400,160,'Howling Fjord'],[580,250,'Dragonblight'],[500,370,'Storm Peaks'],[280,350,'Icecrown'],[180,270,'Zul\'Drak']]
    }
  };
  Object.keys(MAP_PARAMS).forEach(k => MAP_PARAMS[k] = { ...MAP_PARAMS[k], svg: genSVG(MAP_PARAMS[k]) });

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
