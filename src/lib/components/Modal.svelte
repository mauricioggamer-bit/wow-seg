<script lang="ts">
  import { uiStore } from '../stores/ui'

  let { show = false, title = '', onclose = () => {}, children }: {
    show?: boolean
    title?: string
    onclose?: () => void
    children?: import('svelte').Snippet
  } = $props()
</script>

{#if show}
  <div class="modal-overlay open" onclick={onclose} role="dialog" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && onclose()}>
    <div class="modal-content" onclick={(e) => e.stopPropagation()} role="presentation">
      <div class="modal-header">
        <h3>{title}</h3>
        <button class="modal-close" onclick={onclose}>✕</button>
      </div>
      <div class="modal-body">
        {#if children}
          {@render children()}
        {/if}
      </div>
    </div>
  </div>
{/if}
