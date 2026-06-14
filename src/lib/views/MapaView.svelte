<script lang="ts">
  import { onMount, onDestroy, untrack } from 'svelte'
  import { personajesStore, dataStore, misionesStore } from '../stores/data'
  import { CLASS_MAP, PERS_CLASS_ICONS, PERS_CLASS_COLORS, EXPANSIONS } from '../constants'
  import mapa_svgs from '../data/mapa_svgs'

  let { openTaskEdit, openMissionEdit, openNewItemForChar }: { openTaskEdit: (char: string, taskId: string) => void, openMissionEdit: (m: any) => void, openNewItemForChar: (char: string) => void } = $props()

  const STORAGE_POS = 'wowseg_mapa_positions'
  const STORAGE_EXP = 'wowseg_mapa_expansion'
  const MAP_W = 1000
  const MAP_H = 750

  let activeExp = $state(localStorage.getItem(STORAGE_EXP) || EXPANSIONS[0]?.id || 'tww')
  let positions = $state<Record<string, { x: number; y: number }>>({})
  let dragging: string | null = $state(null)
  let sidebarTab = $state('chars')
  let showInactivos = $state(true)
  let highlight: string | null = $state(null)
  let mapAreaEl: HTMLDivElement | undefined = $state(undefined)
  let dragStartX = 0, dragStartY = 0
  let dragOrigX = 0, dragOrigY = 0
  let wasDragged = false

  function areaRect() {
    return mapAreaEl?.getBoundingClientRect() ?? null
  }

  let charsForExp = $derived(
    $personajesStore.filter(c => {
      if (!c.activo && !showInactivos) return false
      return c.expansion_por_defecto === activeExp || c.tareas.some(t => t.expansion === activeExp) || $misionesStore.some(m => m.personaje === c.nombre && m.expansion === activeExp)
    })
  )

  function loadPositions() {
    try {
      const raw = localStorage.getItem(STORAGE_POS)
      if (raw) positions = JSON.parse(raw)
      else positions = {}
    } catch { positions = {} }
  }

  function savePositions() {
    localStorage.setItem(STORAGE_POS, JSON.stringify(positions))
  }

  function getPos(id: string): { x: number; y: number } | null {
    return positions[id] || null
  }

  function setPos(id: string, x: number, y: number) {
    positions = { ...positions, [id]: { x, y } }
  }

  let allItems = $derived.by(() => {
    const items: Array<Record<string, any>> = []
    for (const c of charsForExp) {
      for (const t of c.tareas) {
        items.push({ ...t, personaje: c.nombre, faccion: c.faccion, clase: c.clase, _type: 'task' })
      }
      for (const m of $misionesStore) {
        if (m.personaje === c.nombre && (!m.expansion || m.expansion === activeExp)) {
          items.push({ ...m, personaje: c.nombre, faccion: c.faccion, clase: c.clase, _type: 'mission' })
        }
      }
    }
    return items
  })

  function charItems(charName: string) {
    const char = $personajesStore.find(c => c.nombre === charName)
    if (!char) return []
    const tasks = char.tareas.map(t => ({ ...t, _type: 'task' as const, _charName: charName }))
    const misiones = $misionesStore.filter(m => m.personaje === charName).map(m => ({ ...m, _type: 'mission' as const, _charName: charName }))
    return [...tasks, ...misiones]
  }

  let stats = $derived.by(() => {
    const done = allItems.filter(t => t.hecho).length
    const total = allItems.length
    const pct = total > 0 ? Math.round(done / total * 100) : 0
    const totalMin = allItems.reduce((s: number, t: any) => s + (t.tiempo_min || 0), 0)
    const weekly = allItems.filter(t => t.cooldown === 'weekly')
    const weeklyDone = weekly.filter(t => t.hecho).length
    const weeklyTotal = weekly.length
    return { chars: charsForExp.length, done, total, pct, totalMin, weeklyDone, weeklyTotal }
  })

  let sidebarContent = $derived.by(() => {
    if (sidebarTab === 'chars') {
      if (charsForExp.length === 0) return { type: 'empty', text: 'No hay personajes para esta expansión' } as const
      return { type: 'chars', items: charsForExp.map(c => ({
        id: c.nombre,
        icon: PERS_CLASS_ICONS[CLASS_MAP[c.clase] || 'warrior'] || '?',
        name: c.nombre,
        color: PERS_CLASS_COLORS[CLASS_MAP[c.clase] || 'warrior'] || '#c69b3a',
        count: c.tareas.length + 't',
        highlightId: 'char_' + c.nombre,
      }))} as const
    }
    if (sidebarTab === 'tasks') {
      if (allItems.length === 0) return { type: 'empty', text: 'No hay items para esta expansión' } as const
      return { type: 'tasks', done: allItems.filter(t => t.hecho).length, total: allItems.length, items: allItems.map(t => ({
        id: t.id,
        name: t.nombre,
        hecho: t.hecho,
        personaje: t.personaje,
        highlightId: 'char_' + t.personaje,
        personajeColor: PERS_CLASS_COLORS[CLASS_MAP[t.clase] || 'warrior'] || '#c69b3a',
      }))} as const
    }
    return { type: 'empty', text: '' } as const
  })

  function selectExp(key: string) {
    activeExp = key
    localStorage.setItem(STORAGE_EXP, key)
    highlight = null
    dragging = null
  }

  function handlePointerDown(e: PointerEvent, id: string) {
    if ((e.target as HTMLElement).tagName === 'INPUT') return
    e.preventDefault()
    dragging = null
    wasDragged = false
    const el = (e.currentTarget as HTMLElement)
    dragStartX = e.clientX
    dragStartY = e.clientY
    dragOrigX = parseFloat(el.style.left) || 0
    dragOrigY = parseFloat(el.style.top) || 0

    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - dragStartX
      const dy = ev.clientY - dragStartY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) wasDragged = true
      if (!wasDragged) return
      if (!dragging) dragging = id
      el.classList.add('dragging')
      if (!mapAreaEl) return
      const areaRect = mapAreaEl.getBoundingClientRect()
      const scX = areaRect.width / MAP_W
      const scY = areaRect.height / MAP_H
      let newX = dragOrigX + dx
      let newY = dragOrigY + dy
      newX = Math.max(0, Math.min(areaRect.width - 40, newX))
      newY = Math.max(0, Math.min(areaRect.height - 30, newY))
      el.style.left = newX + 'px'
      el.style.top = newY + 'px'
      setPos(id, newX / scX, newY / scY)
    }

    function onUp(ev: PointerEvent) {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      if (wasDragged) {
        dragging = null
        el.classList.remove('dragging')
        const expandEls = document.elementsFromPoint(ev.clientX, ev.clientY)
        const dropBtn = expandEls.find((el): el is HTMLElement => el instanceof HTMLElement && el.closest?.('.mapa-exp-btn'))
        if (dropBtn) {
          const expBtn = dropBtn.closest('.mapa-exp-btn') as HTMLElement
          const newExp = expBtn.getAttribute('data-drop-exp')
          const charName = id.replace('char_', '')
          if (newExp && charName) {
            dataStore.moveCharToExpansion(charName, newExp)
          }
        } else {
          savePositions()
        }
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function handleCardClick(e: PointerEvent, charName: string) {
    if (wasDragged) return
    highlight = 'char_' + charName
  }

  function scrollToElement(selector: string) {
    if (!mapAreaEl) return
    const el = mapAreaEl.querySelector(selector) as HTMLElement
    if (!el) return
    highlight = selector
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  let resizeTimer: ReturnType<typeof setTimeout> | null = null

  onMount(() => {
    loadPositions()
    return () => {
      if (resizeTimer) clearTimeout(resizeTimer)
    }
  })

  onDestroy(() => {
    if (resizeTimer) clearTimeout(resizeTimer)
  })

  function autoLayout() {
    const el = mapAreaEl
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0) return
    let changed = false
    const cur = untrack(() => positions)
    const newPos = { ...cur }
    charsForExp.forEach((c, i) => {
      const id = 'char_' + c.nombre
      if (newPos[id]) return
      changed = true
      const padX = 80, padY = 40
      const cols = Math.min(charsForExp.length, 4)
      const rows = Math.ceil(charsForExp.length / cols)
      const cellW = (rect.width - padX * 2) / cols
      const cellH = (rect.height - padY * 2) / rows
      const col = i % cols
      const row = Math.floor(i / cols)
      newPos[id] = { x: ((padX + cellW * (col + 0.5)) / rect.width) * MAP_W, y: ((padY + cellH * (row + 0.5)) / rect.height) * MAP_H }
    })
    if (changed) { positions = newPos; savePositions() }
  }

  $effect(() => {
    if (mapAreaEl) {
      autoLayout()
    }
  })
</script>

<div class="mapa-panel">
  <div class="mapa-layout">
    <div class="mapa-exp-selector">
      {#each EXPANSIONS as exp}
        {@const count = charsForExp.length}
        <button class="mapa-exp-btn" class:active={activeExp === exp.id}
          onclick={() => selectExp(exp.id)}
          data-drop-exp={exp.id}>
          <span class="mapa-exp-dot" style="background:{exp.color}"></span>
          <span class="mapa-exp-label">{exp.nombre}</span>
          <span class="mapa-exp-count">{count}</span>
        </button>
      {/each}
    </div>
    <div class="mapa-area" bind:this={mapAreaEl}>
      <div class="mapa-svg-wrap">{@html mapa_svgs[activeExp] || ''}</div>
      {#each charsForExp as c (c.nombre)}
        {@const pid = 'char_' + c.nombre}
        {@const pos = getPos(pid)}
        {@const clsKey = CLASS_MAP[c.clase] || 'warrior'}
        {@const clsColor = PERS_CLASS_COLORS[clsKey] || '#fff'}
        {@const clsIcon = PERS_CLASS_ICONS[clsKey] || '?'}
        {@const items = charItems(c.nombre)}
        {#if pos && areaRect()}
          {@const px = pos.x * (areaRect()!.width / MAP_W)}
          {@const py = pos.y * (areaRect()!.height / MAP_H)}
          <div
            class="mapa-card {c.faccion === 'Horda' ? 'horda' : 'alliance'}"
            class:dragging={dragging === pid}
            class:highlight={highlight === pid}
            style="left:{px}px;top:{py}px"
            data-char-name={c.nombre}
            onpointerdown={(e) => handlePointerDown(e, pid)}
            onclick={(e) => handleCardClick(e, c.nombre)}
          >
            <div class="mapa-card-header">
              <div class="mapa-card-name" style="color:{clsColor}">{c.nombre}</div>
              <div class="mapa-card-class-icon">{clsIcon}</div>
            </div>
            <div class="mapa-card-info">Nvl {c.nivel} · {c.raza} · {c.clase}</div>
            {#if items.length > 0}
              <div class="mapa-card-items">
                {#each items.slice(0, 3) as item (item.id)}
                  <div class="mapa-card-item" class:done={item.hecho}>
                    <input type="checkbox" checked={item.hecho}
                      onchange={() => {
                        if (item._type === 'task') dataStore.toggleTarea(c.nombre, item.id)
                        else dataStore.toggleMision(item.id)
                      }}
                      onclick={(e) => e.stopPropagation()} />
                    <span class="mapa-item-name">{item.nombre}</span>
                  </div>
                {/each}
                {#if items.length > 3}
                  <div class="mapa-card-more">+{items.length - 3} más</div>
                {/if}
              </div>
            {:else}
              <div class="mapa-card-items">
                <div class="mapa-card-item-empty">Sin tareas</div>
              </div>
            {/if}
            <button class="mapa-add-btn" onclick={(e) => { e.stopPropagation(); openNewItemForChar(c.nombre) }} title="Nueva tarea/misión">+</button>
          </div>
        {/if}
      {/each}
    </div>

    <div class="mapa-sidebar">
      <div class="mapa-sidebar-tabs">
        <button class="mapa-sidebar-tab" class:active={sidebarTab === 'chars'} onclick={() => sidebarTab = 'chars'}>🎭 Chars</button>
        <button class="mapa-sidebar-tab" class:active={sidebarTab === 'tasks'} onclick={() => sidebarTab = 'tasks'}>📋 Tasks</button>
      </div>
      <div class="mapa-sidebar-filter">
        <label><input type="checkbox" checked={showInactivos} onchange={() => showInactivos = !showInactivos} /> Mostrar inactivos</label>
      </div>
      <div class="mapa-sidebar-content">
        {#if sidebarContent.type === 'empty'}
          <div class="mapa-sidebar-empty">{sidebarContent.text}</div>
        {:else if sidebarContent.type === 'chars'}
          {#each sidebarContent.items as item}
            <div class="mapa-sidebar-item" class:active={highlight === item.highlightId}
              onclick={() => scrollToElement('.mapa-card[data-char-name="' + item.id + '"]')}>
              <span class="item-icon">{item.icon}</span>
              <span class="item-name" style="color:{item.color}">{item.name}</span>
              <span class="item-count">{item.count}</span>
            </div>
          {/each}
        {:else if sidebarContent.type === 'tasks'}
          <div style="padding:2px 8px;font-size:0.55rem;color:var(--text-dim);margin-bottom:2px">{sidebarContent.done}/{sidebarContent.total} hechas</div>
          {#each sidebarContent.items as item}
            <div class="mapa-sidebar-item" class:active={highlight === item.highlightId}
              onclick={() => scrollToElement('.mapa-card[data-char-name="' + item.personaje + '"]')}>
              <span class="item-icon" style="color:{item.hecho ? 'var(--health-green)' : 'var(--text-dim)'}">{item.hecho ? '✓' : '○'}</span>
              <span class="item-name">{item.name}</span>
              <span class="item-count" style="color:{item.personajeColor}">{item.personaje}</span>
            </div>
          {/each}
          {/if}
      </div>
    </div>
  </div>

  <div class="mapa-stats">
    <span class="mapa-stat"><span class="mapa-stat-value">{stats.chars}</span> personajes</span>
    <span class="mapa-stat"><span class="mapa-stat-value">{stats.done}/{stats.total}</span> tareas</span>
    <span class="mapa-stat"><span class="mapa-stat-value">{stats.weeklyDone}/{stats.weeklyTotal}</span> semanales</span>
    <span class="mapa-stat"><span class="mapa-stat-value">{stats.totalMin}min</span> total</span>
    <div class="mapa-stat-bar">
      <div class="mapa-stat-fill {stats.pct >= 50 ? 'green' : stats.pct >= 25 ? 'yellow' : 'red'}" style="width:{stats.pct}%"></div>
    </div>
    <span style="color:var(--gold);font-weight:600">{stats.pct}%</span>
  </div>
</div>

<style>
  .mapa-panel { display:flex; flex-direction:column; height:calc(100vh - 100px); margin-top:6px; border:1px solid var(--border-subtle); border-radius:var(--r-md); overflow:hidden; background:var(--bg-base); user-select:none; }
  .mapa-exp-selector { width:105px; flex-shrink:0; display:flex; flex-direction:column; gap:2px; padding:6px 4px; background:linear-gradient(180deg,#1a0c00,#0a0500); border-right:1px solid var(--border-main); overflow-y:auto; }
  .mapa-exp-btn { display:flex; flex-direction:column; align-items:center; gap:2px; padding:5px 4px; border:1px solid transparent; border-radius:var(--r-sm); background:transparent; color:var(--text-muted); cursor:pointer; font-family:var(--font-body); font-size:0.55rem; text-align:center; transition:all var(--t-fast) var(--ease); }
  .mapa-exp-btn:hover { color:var(--text-primary); background:var(--bg-raised); border-color:var(--border-subtle); }
  .mapa-exp-btn.active { color:var(--gold); background:rgba(201,168,76,0.12); border-color:var(--gold-dim); box-shadow:0 0 10px rgba(201,168,76,0.08); }
  .mapa-exp-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
  .mapa-exp-count { font-size:0.5rem; color:var(--text-dim); }
  .mapa-layout { display:flex; flex:1; overflow:hidden; }
  .mapa-area { flex:1; position:relative; overflow:hidden; background:#0a0804; }
  .mapa-svg-wrap { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; }
  .mapa-svg-wrap :global(svg) { width:100%; height:100%; object-fit:contain; }
  .mapa-card-items { margin-top:3px; border-top:1px solid rgba(255,255,255,0.06); padding-top:2px; }
  .mapa-card-item { display:flex; align-items:center; gap:3px; padding:1px 0; font-size:0.5rem; line-height:1.2; }
  .mapa-card-item input[type="checkbox"] { width:9px; height:9px; cursor:pointer; accent-color:var(--health-green); flex-shrink:0; }
  .mapa-card-item.done .mapa-item-name { opacity:0.4; text-decoration:line-through; }
  .mapa-item-name { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--gold-light); }
  .mapa-card-item-empty { font-size:0.5rem; color:var(--text-dim); padding:2px 0; }
  .mapa-add-btn { display:block; width:100%; margin-top:2px; padding:1px 0; background:rgba(255,255,255,0.04); border:1px dashed var(--border-subtle); border-radius:var(--r-sm); color:var(--text-muted); cursor:pointer; font-family:var(--font-body); font-size:0.55rem; text-align:center; transition:all var(--t-fast) var(--ease); }
  .mapa-add-btn:hover { background:rgba(201,168,76,0.1); border-color:var(--gold-dim); color:var(--gold-light); }
  .mapa-sidebar { width:200px; flex-shrink:0; display:flex; flex-direction:column; background:var(--bg-soft); border-left:1px solid var(--border-subtle); overflow:hidden; }
  .mapa-sidebar-tabs { display:flex; border-bottom:1px solid var(--border-subtle); flex-shrink:0; }
  .mapa-sidebar-tab { flex:1; padding:5px 4px; border:none; background:transparent; color:var(--text-muted); cursor:pointer; font-family:var(--font-body); font-size:0.6rem; text-align:center; transition:all var(--t-fast) var(--ease); border-bottom:2px solid transparent; }
  .mapa-sidebar-tab:hover { color:var(--text-primary); }
  .mapa-sidebar-tab.active { color:var(--gold); border-bottom-color:var(--gold-dim); }
  .mapa-sidebar-content { flex:1; overflow-y:auto; padding:4px 0; }
  .mapa-sidebar-filter { padding:3px 6px; border-bottom:1px solid var(--border-subtle); flex-shrink:0; }
  .mapa-sidebar-filter label { display:flex; align-items:center; gap:4px; font-size:0.55rem; color:var(--text-muted); cursor:pointer; }
  .mapa-sidebar-filter input { width:12px; height:12px; cursor:pointer; }
  .mapa-sidebar-item { display:flex; align-items:center; gap:4px; padding:3px 8px; cursor:pointer; font-size:0.6rem; color:var(--text-secondary); transition:background var(--t-fast) var(--ease); border-left:2px solid transparent; }
  .mapa-sidebar-item:hover { background:var(--bg-raised); color:var(--text-primary); }
  .mapa-sidebar-item.active { border-left-color:var(--gold); background:rgba(201,168,76,0.08); color:var(--gold-light); }
  .mapa-sidebar-item .item-icon { font-size:0.7rem; width:16px; text-align:center; flex-shrink:0; }
  .mapa-sidebar-item .item-name { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .mapa-sidebar-item .item-count { color:var(--text-dim); font-size:0.5rem; }
  .mapa-sidebar-empty { padding:12px 8px; font-size:0.6rem; color:var(--text-dim); text-align:center; }
  .mapa-stats { display:flex; align-items:center; gap:12px; padding:4px 12px; background:linear-gradient(0deg,#0a0500,#1a0c00); border-top:1px solid var(--border-main); flex-shrink:0; font-size:0.6rem; color:var(--text-muted); }
  .mapa-stat { display:flex; align-items:center; gap:3px; }
  .mapa-stat-value { color:var(--gold); font-weight:600; }
  .mapa-stat-bar { flex:1; max-width:120px; height:6px; background:var(--bg-raised); border-radius:3px; overflow:hidden; }
  .mapa-stat-fill { height:100%; border-radius:3px; transition:width var(--t-slow) var(--ease); }
  .mapa-stat-fill.green { background:var(--health-green); }
  .mapa-stat-fill.yellow { background:#c9a84c; }
  .mapa-stat-fill.red { background:var(--red); }
  @media (max-width:900px) { .mapa-sidebar { width:140px; } }
  @media (max-width:700px) { .mapa-sidebar { display:none; } .mapa-stats { flex-wrap:wrap; gap:6px; } }
</style>
