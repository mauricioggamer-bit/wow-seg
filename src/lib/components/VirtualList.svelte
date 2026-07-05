<script lang="ts">
  import type { Snippet } from 'svelte'

  let { items, itemHeight = 32, overscan = 10, children }: {
    items: any[]
    itemHeight?: number
    overscan?: number
    children?: Snippet<[any, number]>
  } = $props()

  let container: HTMLDivElement
  let scrollTop = $state(0)
  let containerHeight = $state(400)

  let totalHeight = $derived(items.length * itemHeight)
  let startIdx = $derived(Math.max(0, Math.floor(scrollTop / itemHeight) - overscan))
  let endIdx = $derived(Math.min(items.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan))
  let visibleItems = $derived(items.slice(startIdx, endIdx))

  function onScroll() {
    scrollTop = container.scrollTop
  }

  $effect(() => {
    if (!container) return
    const ro = new ResizeObserver(() => { containerHeight = container.clientHeight })
    ro.observe(container)
    return () => ro.disconnect()
  })
</script>

<div bind:this={container} class="vl-container" onscroll={onScroll} role="list">
  <div class="vl-spacer" style="height:{totalHeight}px">
    {#each visibleItems as item, i (item.id ?? i)}
      <div class="vl-item" style="top:{(startIdx + i) * itemHeight}px;height:{itemHeight}px" role="listitem">
        {#if children}
          {@render children(item, startIdx + i)}
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .vl-container { overflow-y: auto; overflow-x: hidden; position: relative; height: 100%; }
  .vl-spacer { position: relative; width: 100%; }
  .vl-item { position: absolute; left: 0; right: 0; overflow: hidden; }
</style>
