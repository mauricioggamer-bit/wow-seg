const GIST = (() => {
  const CONFIG_KEY = 'wowseg_gist_config';
  const TOKEN_KEY = 'wowseg_gist_token';
  const GIST_API = 'https://api.github.com/gists';
  const DEFAULT_FILENAME = 'wowseg-data.json';

  let config = {
    enabled: false,
    gistId: '',
    fileName: DEFAULT_FILENAME,
    intervalMinutes: 60,
    rememberToken: false
  };

  let syncTimer = null;
  let syncInFlight = false;
  let lastHash = '';
  let onStatus = null;

  function init(opts = {}) {
    if (opts.onStatus) onStatus = opts.onStatus;
    loadConfig();
    if (config.enabled && config.gistId) {
      scheduleSync();
    }
  }

  function loadConfig() {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) config = { ...config, ...JSON.parse(raw) };
    } catch {}
    try {
      const tok = localStorage.getItem(TOKEN_KEY);
      if (tok && config.rememberToken) getToken = () => tok;
    } catch {}
  }

  function saveConfig() {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({
      enabled: config.enabled,
      gistId: config.gistId,
      fileName: config.fileName,
      intervalMinutes: config.intervalMinutes,
      rememberToken: config.rememberToken
    }));
    if (config.rememberToken) {
      const tok = getToken();
      if (tok) localStorage.setItem(TOKEN_KEY, tok);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  let getToken = () => sessionStorage.getItem(TOKEN_KEY) || '';

  function setToken(token) {
    sessionStorage.setItem(TOKEN_KEY, token);
    getToken = () => token;
  }

  function setStatus(msg, tone) {
    if (onStatus) onStatus(msg, tone);
  }

  function scheduleSync() {
    clearTimeout(syncTimer);
    if (!config.enabled || !config.gistId) return;
    const ms = Math.max(30000, config.intervalMinutes * 60 * 1000);
    syncTimer = setTimeout(doSync, ms);
  }

  async function doSync(forcePush = false) {
    const token = getToken();
    if (!token || !config.gistId) return;
    if (syncInFlight) return;
    syncInFlight = true;
    setStatus('Sincronizando...', 'syncing');

    try {
      const localStr = DATA.exportJSON();
      const localHash = simpleHash(localStr);

      if (!forcePush && localHash === lastHash) {
        setStatus('Sin cambios', 'ok');
        syncInFlight = false;
        scheduleSync();
        return;
      }

      const remote = await fetchGist(token, config.gistId);
      const remoteStr = remote?.files?.[config.fileName]?.content || '';
      const remoteHash = remoteStr ? simpleHash(remoteStr) : '';

      if (forcePush || !remoteHash || localHash === lastHash) {
        await updateGist(token, config.gistId, config.fileName, localStr);
        lastHash = localHash;
        setStatus('Subido OK', 'ok');
      } else if (remoteHash === lastHash) {
        await updateGist(token, config.gistId, config.fileName, localStr);
        lastHash = localHash;
        setStatus('Subido OK', 'ok');
      } else if (!lastHash) {
        DATA.importJSON(remoteStr);
        lastHash = remoteHash;
        setStatus('Descargado OK', 'ok');
      } else {
        DATA.importJSON(remoteStr);
        lastHash = remoteHash;
        setStatus('Descargado (conflicto resuelto: prevaleció remoto)', 'warn');
      }
    } catch (e) {
      setStatus('Error: ' + e.message, 'error');
    }

    syncInFlight = false;
    scheduleSync();
  }

  async function connect(gistId, token, fileName) {
    setToken(token);
    config.gistId = gistId;
    config.fileName = fileName || DEFAULT_FILENAME;
    config.enabled = true;
    saveConfig();

    try {
      await doSync(true);
      setStatus('Conectado y sincronizado', 'ok');
      return true;
    } catch (e) {
      setStatus('Error al conectar: ' + e.message, 'error');
      return false;
    }
  }

  async function createNewGist(token, fileName, content) {
    const res = await fetch(GIST_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        public: false,
        files: {
          [fileName]: { content }
        }
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const gist = await res.json();
    return gist.id;
  }

  async function fetchGist(token, gistId) {
    const res = await fetch(`${GIST_API}/${gistId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async function updateGist(token, gistId, fileName, content) {
    const res = await fetch(`${GIST_API}/${gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: {
          [fileName]: { content }
        }
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  }

  function disconnect() {
    config.enabled = false;
    config.gistId = '';
    config.fileName = DEFAULT_FILENAME;
    lastHash = '';
    clearTimeout(syncTimer);
    saveConfig();
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    setStatus('Desconectado', 'idle');
  }

  function getConfig() {
    return { ...config, hasToken: !!getToken() };
  }

  function setConfigUpdate(updates) {
    Object.assign(config, updates);
    saveConfig();
  }

  function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return 'h' + Math.abs(h).toString(36);
  }

  return { init, doSync, connect, createNewGist, disconnect, getConfig, setConfigUpdate, setToken, getToken, simpleHash };
})();
