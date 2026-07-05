<script lang="ts">
  import { fade } from 'svelte/transition'
  import { tick } from 'svelte'

  let { show = false, title = '', onclose = () => {}, children }: {
    show?: boolean
    title?: string
    onclose?: () => void
    children?: import('svelte').Snippet
  } = $props()

  let overlay = $state<HTMLDivElement | null>(null)
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
