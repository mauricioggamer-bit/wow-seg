<script lang="ts">
  import { slide, fade } from 'svelte/transition'
  import type { Personaje, LevelingConfig, LevelingResult } from '../../types'
  import { formatNumber, formatHours } from '../../leveling/calculator'
  import DetailView from './DetailView.svelte'

  let {
    open = $bindable(false),
    result,
    personaje,
    config,
    roster,
    count90,
    onEditChar,
    onClose,
  }: {
    open?: boolean
    result: LevelingResult | undefined
    personaje: Personaje | undefined
    config: LevelingConfig
    roster: Personaje[]
    count90: number
    onEditChar?: (name: string) => void
    onClose?: () => void
  } = $props()

  function close() {
    open = false
    onClose?.()
  }
</script>

{#if open && result && personaje}
  <div class="drawer-overlay" transition:fade={{ duration: 150 }} onclick={close} role="presentation"></div>
  <aside class="drawer" transition:slide={{ duration: 200, axis: 'x' }} role="dialog" aria-label="Detalle del personaje">
    <div class="drawer-header">
      <h3>{result.nombre} — {result.clase}</h3>
      <div class="drawer-actions">
        {#if onEditChar}
          <button onclick={() => onEditChar(result.nombre)} title="Editar personaje"
            style="background:none;border:none;cursor:pointer;font-size:0.7rem;padding:0 4px;">✏️</button>
        {/if}
        <button class="drawer-close" onclick={close} aria-label="Cerrar">✕</button>
      </div>
    </div>
    <div class="drawer-summary">
      <div class="drawer-stat">
        <span>Nivel</span>
        <strong>{result.nivel}</strong>
      </div>
      <div class="drawer-stat">
        <span>XP/h</span>
        <strong>{formatNumber(result.xpPerHour)}</strong>
      </div>
      <div class="drawer-stat">
        <span>Timeways</span>
        <strong>{personaje.timewaysPct ?? 0}%</strong>
      </div>
      {#if !result.done80}
        <div class="drawer-stat">
          <span>→80 Dungs</span>
          <strong>{result.dungeonsTo80}</strong>
        </div>
        <div class="drawer-stat">
          <span>→80 Horas</span>
          <strong>{formatHours(result.timeTo80)}</strong>
        </div>
      {/if}
      <div class="drawer-stat">
        <span>→90 Dungs</span>
        <strong>{result.done90 ? '✓' : result.dungeonsTo90}</strong>
      </div>
      <div class="drawer-stat">
        <span>→90 Horas</span>
        <strong>{result.done90 ? '✓' : formatHours(result.timeTo90)}</strong>
      </div>
    </div>
    <div class="drawer-body">
      <DetailView {personaje} {config} {roster} {count90} />
    </div>
  </aside>
{/if}

<style>
  .drawer-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 998;
  }
  .drawer {
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    width: min(420px, 92vw);
    background: var(--bg-panel, #1a1a1a);
    border-left: 1px solid var(--gold, #d4af37);
    box-shadow: -8px 0 32px rgba(0,0,0,0.5);
    z-index: 999;
    display: flex;
    flex-direction: column;
  }
  .drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
  }
  .drawer-header h3 {
    font-size: 0.75rem;
    color: var(--gold);
    margin: 0;
    font-family: var(--font-heading);
  }
  .drawer-actions {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .drawer-close {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.75rem;
  }
  .drawer-close:hover { color: var(--horde, #c5365a); }
  .drawer-summary {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
  }
  .drawer-stat {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .drawer-stat span {
    font-size: 0.45rem;
    color: var(--text-muted);
    text-transform: uppercase;
  }
  .drawer-stat strong {
    font-size: 0.65rem;
    color: var(--gold-light, #d4af37);
  }
  .drawer-body {
    overflow-y: auto;
    padding: 10px 12px;
    flex: 1;
  }
  @media (max-width: 480px) {
    .drawer { width: 100vw; }
  }
</style>