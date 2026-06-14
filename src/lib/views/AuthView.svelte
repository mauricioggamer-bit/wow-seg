<script lang="ts">
  import { authStore } from '../stores/auth'
  import type { AuthDuration } from '../types'

  let password = $state('')
  let selectedDuration = $state<AuthDuration>('1hora')
  let error = $state('')

  function handleLogin() {
    if (authStore.verifyPassword(password)) {
      authStore.login(selectedDuration)
    } else {
      error = 'Contraseña incorrecta'
      password = ''
    }
  }
</script>

<div class="auth-container">
  <div class="wow-panel" style="max-width:380px;margin:auto">
    <div class="wow-panel-header">
      <h2>WoW Seg</h2>
    </div>
    <div class="wow-panel-body">
      <p style="margin-bottom:12px;font-size:0.75rem;color:var(--text-secondary)">
        Warband Tracker — Iniciar sesión
      </p>
      <form onsubmit={(e) => { e.preventDefault(); handleLogin() }}>
        <div class="form-group">
          <label for="auth-password">Contraseña</label>
          <input
            id="auth-password"
            type="password"
            bind:value={password}
            placeholder="Ingresá la contraseña"
          />
        </div>
        <div class="form-group">
          <label for="auth-duration">Duración de sesión</label>
          <select id="auth-duration" bind:value={selectedDuration}>
            <option value="10min">10 minutos</option>
            <option value="1hora">1 hora</option>
            <option value="8horas">8 horas</option>
            <option value="1semana">1 semana</option>
            <option value="siempre">Siempre</option>
          </select>
        </div>
        {#if error}
          <p style="color:var(--red);font-size:0.65rem;margin-bottom:6px">{error}</p>
        {/if}
        <button type="submit" class="wow-btn wow-btn-primary" style="width:100%;justify-content:center">
          Ingresar
        </button>
      </form>
    </div>
  </div>
</div>

<style>
  .auth-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 16px;
  }
</style>
