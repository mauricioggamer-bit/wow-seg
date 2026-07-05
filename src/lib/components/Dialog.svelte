<script lang="ts">
  import { fade } from 'svelte/transition'

  let { show = false, title = '', onclose = () => {}, children }: {
    show?: boolean
    title?: string
    onclose?: () => void
    children?: import('svelte').Snippet
  } = $props()
</script>

{#if show}
  <div class="modal-overlay open" transition:fade={{ duration: 120 }} onclick={onclose} role="dialog" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && onclose()}>
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
