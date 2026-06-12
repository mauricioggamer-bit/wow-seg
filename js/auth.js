const AUTH = (() => {
  const STORAGE_KEY = 'wowseg_session';
  const DURATIONS = {
    '10min': 10 * 60 * 1000,
    '1hora': 60 * 60 * 1000,
    '8horas': 8 * 60 * 60 * 1000,
    '1semana': 7 * 24 * 60 * 60 * 1000,
    'siempre': null
  };

  function getToday() {
    return new Date().toLocaleString('en-US', {
      timeZone: 'America/Argentina/Cordoba',
      day: 'numeric'
    });
  }

  function verifyPassword(input) {
    return input === 'gusfraba' + getToday();
  }

  function hasValidSession() {
    try {
      const session = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!session) return false;
      if (session.expires === null) return true;
      return Date.now() < session.expires;
    } catch {
      return false;
    }
  }

  function saveSession(duration) {
    const expires = duration === null ? null : Date.now() + duration;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ expires }));
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
  }

  return { verifyPassword, hasValidSession, saveSession, clearSession, DURATIONS, STORAGE_KEY };
})();
