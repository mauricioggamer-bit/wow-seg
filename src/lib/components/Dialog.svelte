<script lang="ts">
  import { fade, slide } from 'svelte/transition'
  import { tick } from 'svelte'

  let { show = false, title = '', side = false, onclose = () => {}, children }: {
    show?: boolean
    title?: string
    side?: boolean
    onclose?: () => void
    children?: import('svelte').Snippet
  } = $props()

  let overlay = $state<HTMLElement | null>(null)
  let prevFocus: HTMLElement | null = null

  const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

  $effect(() => {
    if (show) {
      prevFocus = document.activeElement as HTMLElement
      tick().then(() => {
        if (overlay) {
          const el = overlay.querySelector<HTMLElement>(FOCUSABLE)
          el?.focus()
        }
      })
    } else if (prevFocus) {
      prevFocus.focus()
      prevFocus = null
    }
  })

  function trapKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { onclose(); return }
    if (e.key !== 'Tab' || !overlay) return
    const focusable = [...overlay.querySelectorAll<HTMLElement>(FOCUSABLE)]
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus()
    }
  }
</script>

{#if show}
  {#if side}
    <div class="drawer-overlay" transition:fade={{ duration: 120 }} onclick={onclose} role="presentation"></div>
    <aside bind:this={overlay} class="drawer" transition:slide={{ duration: 200, axis: 'x' }} role="dialog" aria-modal="true" aria-label={title} onkeydown={trapKeydown}>
      <div class="drawer-header">
        <h3>{title}</h3>
        <button class="drawer-close" aria-label="Cerrar" onclick={onclose}>✕</button>
      </div>
      <div class="drawer-body">
        {#if children}
          {@render children()}
        {/if}
      </div>
    </aside>
  {:else}
    <div bind:this={overlay} class="modal-overlay open" transition:fade={{ duration: 120 }} onclick={onclose} role="dialog" aria-modal="true" aria-label={title} tabindex="-1" onkeydown={trapKeydown}>
      <div class="modal-content" onclick={(e) => e.stopPropagation()} role="presentation">
        <div class="modal-header">
          <h3>{title}</h3>
          <button class="modal-close" aria-label="Cerrar" onclick={onclose}>✕</button>
        </div>
        <div class="modal-body">
          {#if children}
            {@render children()}
          {/if}
        </div>
      </div>
    </div>
  {/if}
{/if}

<style>
  .drawer-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 998;
  }
  .drawer {
    position: fixed; top: 0; right: 0; height: 100vh;
    width: min(420px, 92vw);
    background: var(--bg-panel, #1a1a1a);
    border-left: 1px solid var(--gold, #d4af37);
    box-shadow: -8px 0 32px rgba(0,0,0,0.5);
    z-index: 999; display: flex; flex-direction: column;
  }
  .drawer-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 12px; border-bottom: 1px solid var(--border-subtle); flex-shrink: 0;
  }
  .drawer-header h3 { font-size: 0.75rem; color: var(--gold); margin: 0; font-family: var(--font-heading); }
  .drawer-close { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.75rem; }
  .drawer-close:hover { color: var(--horde, #c5365a); }
  .drawer-body { overflow-y: auto; padding: 10px 12px; flex: 1; }
  @media (max-width: 480px) { .drawer { width: 100vw; } }
</style>
