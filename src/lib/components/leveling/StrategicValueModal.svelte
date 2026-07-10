<script lang="ts">
  import type { StrategicValueResult } from '../../types'
  import StrategicBreakdown from './StrategicBreakdown.svelte'

  let { open = $bindable(false), strategic }: {
    open?: boolean
    strategic: StrategicValueResult | null
  } = $props()
</script>

{#if open && strategic}
  <div class="svm-overlay" onclick={() => { open = false }}>
    <div class="svm-panel" onclick={(e) => e.stopPropagation()}>
      <div class="svm-header">
        <h3>Valor estratégico — Fórmula</h3>
        <button class="svm-close" onclick={() => { open = false }}>✕</button>
      </div>
      <div class="svm-body">
        <StrategicBreakdown {strategic} />
      </div>
      <div class="svm-footer">
        <button class="wow-btn wow-btn-primary svm-close-btn" onclick={() => { open = false }}>Cerrar</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .svm-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000;
    display: flex; align-items: center; justify-content: center; padding: 12px;
  }
  .svm-panel {
    background: var(--bg-panel, #1a1a1a); border: 1px solid var(--gold, #d4af37);
    border-radius: var(--r-md, 6px); max-width: 480px; width: 100%;
    max-height: 88vh; display: flex; flex-direction: column;
    box-shadow: 0 12px 40px rgba(0,0,0,0.6);
  }
  .svm-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 12px; border-bottom: 1px solid var(--border-subtle);
  }
  .svm-header h3 { font-size: 0.8rem; color: var(--gold); margin: 0; font-family: var(--font-heading); }
  .svm-close { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.8rem; }
  .svm-close:hover { color: var(--horde, #c5365a); }
  .svm-body { overflow-y: auto; padding: 10px 14px; flex: 1; }
  .svm-footer { padding: 8px 12px; border-top: 1px solid var(--border-subtle); text-align: right; }
  .svm-close-btn { font-size: 0.7rem; padding: 4px 12px; }
</style>
