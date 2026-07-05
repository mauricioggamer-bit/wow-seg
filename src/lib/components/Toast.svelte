<script lang="ts">
  import { fade } from 'svelte/transition'
  import { uiStore } from '../stores/ui'
  import { onMount, onDestroy } from 'svelte'

  let text = $state('')
  let visible = $state(false)
  let timeout: ReturnType<typeof setTimeout> | null = null

  function show(msg: string) {
    text = msg
    visible = true
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      visible = false
      uiStore.setToast('')
      timeout = null
    }, 2500)
  }

  let unsub: () => void

  onMount(() => {
    unsub = uiStore.subscribe(s => {
      if (s.toast && s.toast !== text) {
        show(s.toast)
      }
    })
  })

  onDestroy(() => {
    unsub?.()
    if (timeout) clearTimeout(timeout)
  })
</script>

{#if visible}
  <div class="toast" transition:fade={{ duration: 200 }}>
    {text}
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    background: var(--bg-float, #2d2d2d);
    color: var(--gold-light, #e8d48b);
    border: 1px solid var(--gold-dim, #8a7530);
    border-radius: var(--r-md, 3px);
    padding: 8px 18px;
    font-size: 0.7rem;
    font-family: var(--font-heading);
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    pointer-events: none;
  }
</style>
