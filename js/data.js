const DATA = (() => {
  const STORAGE_KEY = 'wowseg_data';
  const RESET_KEY = 'wowseg_last_reset';

  function getData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      initSeed();
      return getData();
    }
    try {
      return JSON.parse(raw);
    } catch {
      initSeed();
      return getData();
    }
  }

  function initSeed() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
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
    const personaje = data.personajes.find(p => p.nombre === nombre);
    if (!personaje) return null;
    const tarea = personaje.tareas.find(t => t.id === tareaId);
    if (!tarea) return null;
    Object.assign(tarea, updates);
    saveData(data);
    return tarea;
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
      }
    }
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
    const warbands = getWarbands();
    return {
      total: chars.length,
      activos: activos.length,
      warbands: warbands.length,
      weeklyTotal: totalWeekly,
      weeklyDone: doneWeekly,
      weeklyPct: totalWeekly > 0 ? Math.round(doneWeekly / totalWeekly * 100) : 0
    };
  }

  return {
    getData, initSeed, saveData,
    getPersonajes, getWarbands, getMeta,
    getPersonaje, updatePersonaje, updateTarea, toggleTarea,
    checkWeeklyReset, importJSON, exportJSON, exportCSV, getStats
  };
})();
