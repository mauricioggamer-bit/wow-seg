<script lang="ts">
  import { onMount } from 'svelte'

  let {
    open = $bindable(false),
    title = '',
    onClose,
    children,
  }: {
    open?: boolean
    title?: string
    onClose?: () => void
    children?: import('svelte').Snippet
  } = $props()

  function close() {
    open = false
    onClose?.()
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') close()
  }

  onMount(() => {
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
</script>

{#if open}
  <div class="modal-overlay" onclick={close} role="presentation">
    <div class="modal-card" onclick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
      <div class="modal-header">
        <h3 class="modal-title">{title}</h3>
        <button class="modal-close" onclick={close} aria-label="Cerrar">✕</button>
      </div>
      <div class="modal-body">
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 12px;
  }
  .modal-card {
    background: var(--bg-panel, #1a1a1a);
    border: 1px solid var(--gold, #d4af37);
    border-radius: var(--r-md, 6px);
    width: min(720px, 96vw);
    max-height: 86vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
    flex-shrink: 0;
  }
  .modal-title {
    font-family: var(--font-heading);
    font-size: 0.7rem;
    color: var(--gold, #d4af37);
    margin: 0;
    letter-spacing: 0.04em;
  }
  .modal-close {
    background: none;
    border: none;
    color: var(--text-muted, #888);
    cursor: pointer;
    font-size: 0.75rem;
    padding: 2px 6px;
    border-radius: 3px;
  }
  .modal-close:hover { color: var(--horde, #c5365a); }
  .modal-body {
    overflow-y: auto;
    padding: 10px;
    flex: 1;
  }
</style>