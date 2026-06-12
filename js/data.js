const DATA = (() => {
  const STORAGE_KEY = 'wowseg_data';
  const RESET_KEY = 'wowseg_last_reset';

  const CHAR_EXPANSION = {
    "Fariat": "midnight", "Mawgul": "legion", "Orna": "tww", "Alezethar": "dragonflight",
    "Fangrim": "tww", "Kraiser": "shadowlands", "Elbet": "shadowlands", "Archondris": "shadowlands",
    "Unalaq": "shadowlands", "Xaigon": "legion", "Stormfeng": "legion", "Thaelune": "bfa",
    "Grogor": "bfa", "Izadur": "draenor", "Onuki": "draenor", "Secenio": "draenor",
    "Pogara": "draenor", "Ulnok": "mop", "Womak": "mop", "Razzlowe": "mop", "Zulgeku": "mop",
    "Dykaios": "cata", "Carandor": "cata", "Lisarah": "cata",
    "Nietzlock": "wotlk", "Healtonjohn": "wotlk", "Wasprepared": "wotlk", "Shockandroll": "wotlk"
  };

  const MISION_EXPANSION = { "m1": "wotlk", "m2": "wotlk", "m3": "tww" };

  function propagateExpansion(data) {
    (data.personajes || []).forEach(p => {
      const exp = CHAR_EXPANSION[p.nombre] || '';
      (p.tareas || []).forEach(t => {
        if (!t.expansion) t.expansion = exp;
        if (!t.tags) t.tags = [];
      });
    });
    (data.misiones || []).forEach(m => {
      if (!m.expansion) m.expansion = MISION_EXPANSION[m.id] || '';
      if (!m.tags) m.tags = [];
    });
    return data;
  }

  function getData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      initSeed();
      return getData();
    }
    try {
      const data = JSON.parse(raw);
      const needsExp = !data.personajes[0]?.tareas?.[0]?.expansion;
      if (data.personajes && data.personajes.length > 0 && !data.personajes[0].tareas) {
        const merged = mergeSeed(data);
        saveData(merged);
        return merged;
      }
      if (needsExp) {
        propagateExpansion(data);
        saveData(data);
      }
      return data;
    } catch {
      initSeed();
      return getData();
    }
  }

  function mergeSeed(data) {
    const seed = SEED_DATA;
    data.personajes = data.personajes.map(p => {
      const sp = seed.personajes.find(sp => sp.nombre === p.nombre);
      if (sp) return { ...sp, ...p, tareas: p.tareas || sp.tareas || [] };
      return { ...p, tareas: p.tareas || [] };
    });
    if (!data.misiones) data.misiones = seed.misiones || [];
    if (!data.warbands) data.warbands = seed.warbands || [];
    data._meta = { ...seed._meta, ...data._meta };
    return propagateExpansion(data);
  }

  function initSeed() {
    const data = JSON.parse(JSON.stringify(SEED_DATA));
    propagateExpansion(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    checkWeeklyReset();
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }

  function getPersonajes() {
    return getData().personajes;
  }

  function getWarbands() {
    return getData().warbands;
  }

  function getMeta() {
    return getData()._meta;
  }

  function getPersonaje(nombre) {
    return getPersonajes().find(p => p.nombre === nombre);
  }

  function updatePersonaje(nombre, updates) {
    const data = getData();
    const idx = data.personajes.findIndex(p => p.nombre === nombre);
    if (idx === -1) return null;
    data.personajes[idx] = { ...data.personajes[idx], ...updates };
    saveData(data);
    return data.personajes[idx];
  }

  function updateTarea(nombrePersonaje, tareaId, updates) {
    const data = getData();
    const personaje = data.personajes.find(p => p.nombre === nombrePersonaje);
    if (!personaje) return null;
    const tarea = personaje.tareas.find(t => t.id === tareaId);
    if (!tarea) return null;
    Object.assign(tarea, updates);
    saveData(data);
    return tarea;
  }

  function deleteTarea(nombrePersonaje, tareaId) {
    const data = getData();
    const personaje = data.personajes.find(p => p.nombre === nombrePersonaje);
    if (!personaje) return false;
    personaje.tareas = personaje.tareas.filter(t => t.id !== tareaId);
    saveData(data);
    return true;
  }

  function toggleTarea(nombrePersonaje, tareaId) {
    const tarea = updateTarea(nombrePersonaje, tareaId, null);
    const data = getData();
    const p = data.personajes.find(pj => pj.nombre === nombrePersonaje);
    const t = p.tareas.find(tk => tk.id === tareaId);
    t.hecho = !t.hecho;
    if (t.hecho) {
      t.ultimo_completado = new Date().toISOString();
    } else {
      t.ultimo_completado = null;
    }
    saveData(data);
    return t;
  }

  function checkWeeklyReset() {
    const data = getData();
    const today = new Date();
    const dayName = today.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    const lastReset = localStorage.getItem(RESET_KEY);

    const resetDay = data._meta.reset_weekly_dia || 'tuesday';

    if (dayName === resetDay) {
      const todayStr = today.toISOString().slice(0, 10);
      if (lastReset !== todayStr) {
        data.personajes.forEach(p => {
          p.tareas.forEach(t => {
            if (t.cooldown === 'weekly') {
              t.hecho = false;
              t.ultimo_completado = null;
            }
          });
        });
        data._meta.ultimo_reset_semanal = todayStr;
        saveData(data);
        localStorage.setItem(RESET_KEY, todayStr);
        return true;
      }
    }
    return false;
  }

  function importJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.personajes || !data.warbands || !data._meta) {
        throw new Error('Estructura inválida');
      }
      saveData(data);
      checkWeeklyReset();
      return true;
    } catch (e) {
      throw new Error('JSON inválido: ' + e.message);
    }
  }

  function exportJSON() {
    return JSON.stringify(getData(), null, 2);
  }

  function exportCSV() {
    const chars = getPersonajes();
    const rows = [['Nombre', 'Clase', 'Nivel', 'Facción', 'Raza', 'Reino', 'Warband', 'Misión Principal', 'Activo', 'Tareas Hechas', 'Total Tareas']];
    chars.forEach(c => {
      const done = c.tareas.filter(t => t.hecho).length;
      rows.push([c.nombre, c.clase, c.nivel, c.faccion, c.raza, c.reino, c.warband, c.mision_principal || '', c.activo ? 'Sí' : 'No', done, c.tareas.length]);
    });
    return rows.map(r => r.map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : v).join(',')).join('\n');
  }

  function getStats() {
    const chars = getPersonajes();
    const activos = chars.filter(c => c.activo);
    const totalWeekly = chars.reduce((s, c) => s + c.tareas.filter(t => t.cooldown === 'weekly').length, 0);
    const doneWeekly = chars.reduce((s, c) => s + c.tareas.filter(t => t.cooldown === 'weekly' && t.hecho).length, 0);
    const totalDaily = chars.reduce((s, c) => s + c.tareas.filter(t => t.cooldown === 'daily').length, 0);
    const doneDaily = chars.reduce((s, c) => s + c.tareas.filter(t => t.cooldown === 'daily' && t.hecho).length, 0);
    const warbands = getWarbands();
    return {
      total: chars.length,
      activos: activos.length,
      warbands: warbands.length,
      weeklyTotal: totalWeekly,
      weeklyDone: doneWeekly,
      weeklyPct: totalWeekly > 0 ? Math.round(doneWeekly / totalWeekly * 100) : 0,
      dailyTotal: totalDaily,
      dailyDone: doneDaily
    };
  }

  function resetDailyTasks() {
    const data = getData();
    data.personajes.forEach(p => {
      p.tareas.forEach(t => {
        if (t.cooldown === 'daily') {
          t.hecho = false;
          t.ultimo_completado = null;
        }
      });
    });
    saveData(data);
  }

  // ===== MISIONES =====
  function getMisiones() {
    const data = getData();
    if (!data.misiones) data.misiones = [];
    return data.misiones;
  }

  function addMision(m) {
    const data = getData();
    if (!data.misiones) data.misiones = [];
    const id = 'm' + Date.now();
    data.misiones.push({ id, expansion: '', tags: [], ...m, creada: new Date().toISOString() });
    saveData(data);
    return id;
  }

  function updateMision(id, updates) {
    const data = getData();
    if (!data.misiones) return false;
    const idx = data.misiones.findIndex(m => m.id === id);
    if (idx === -1) return false;
    data.misiones[idx] = { ...data.misiones[idx], ...updates };
    saveData(data);
    return true;
  }

  function deleteMision(id) {
    const data = getData();
    if (!data.misiones) return false;
    data.misiones = data.misiones.filter(m => m.id !== id);
    saveData(data);
    return true;
  }

  function toggleMision(id) {
    const data = getData();
    if (!data.misiones) return false;
    const m = data.misiones.find(mx => mx.id === id);
    if (!m) return false;
    m.estado = m.estado === 'completada' ? 'pendiente' : 'completada';
    saveData(data);
    return true;
  }

  function moveCharToWarband(charName, newWarband) {
    const data = getData();
    const char = data.personajes.find(p => p.nombre === charName);
    if (!char) return false;
    const oldWarband = char.warband;
    if (oldWarband === newWarband) return false;

    char.warband = newWarband;

    const oldWb = data.warbands.find(w => w.nombre === oldWarband);
    if (oldWb) {
      oldWb.personajes = oldWb.personajes.filter(n => n !== charName);
    }

    let newWb = data.warbands.find(w => w.nombre === newWarband);
    if (!newWb) {
      data.warbands.push({ nombre: newWarband, personajes: [charName], tareas_disponibles: [] });
    } else {
      if (!newWb.personajes.includes(charName)) {
        newWb.personajes.push(charName);
      }
    }

    data._meta.total_personajes = data.personajes.length;
    data._meta.total_activos = data.personajes.filter(p => p.activo).length;
    saveData(data);
    return true;
  }

  function addWarband(name) {
    const data = getData();
    if (data.warbands.find(w => w.nombre === name)) return false;
    data.warbands.push({ nombre: name, personajes: [], tareas_disponibles: [] });
    saveData(data);
    return true;
  }

  function renameWarband(oldName, newName) {
    const data = getData();
    const wb = data.warbands.find(w => w.nombre === oldName);
    if (!wb || data.warbands.find(w => w.nombre === newName)) return false;
    wb.nombre = newName;
    data.personajes.forEach(p => {
      if (p.warband === oldName) p.warband = newName;
    });
    saveData(data);
    return true;
  }

  function deleteWarband(name) {
    const data = getData();
    const idx = data.warbands.findIndex(w => w.nombre === name);
    if (idx === -1) return false;
    data.warbands.splice(idx, 1);
    data.personajes.forEach(p => {
      if (p.warband === name) p.warband = 'nada';
    });
    const nadaWb = data.warbands.find(w => w.nombre === 'nada');
    if (nadaWb) {
      nadaWb.personajes = data.personajes.filter(p => p.warband === 'nada').map(p => p.nombre);
    }
    data._meta.total_personajes = data.personajes.length;
    data._meta.total_activos = data.personajes.filter(p => p.activo).length;
    saveData(data);
    return true;
  }

  return {
    getData, initSeed, saveData,
    getPersonajes, getWarbands, getMeta,
    getPersonaje, updatePersonaje, updateTarea, deleteTarea, toggleTarea,
    checkWeeklyReset, importJSON, exportJSON, exportCSV, getStats,
    moveCharToWarband, addWarband, renameWarband, deleteWarband,
    resetDailyTasks,
    getMisiones, addMision, updateMision, deleteMision, toggleMision
  };
})();
