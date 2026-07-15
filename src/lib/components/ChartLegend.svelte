<script lang="ts">
  let { items }: { items: { color: string; label: string }[] } = $props()
</script>

<div class="chart-legend">
  {#each items as item}
    <span class="chart-legend-item">
      <span class="chart-legend-dot" style="background:{item.color}"></span>
      {item.label}
    </span>
  {/each}
</div>

<style>
  .chart-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    margin-bottom: 6px;
    font-size: 0.65rem;
    color: var(--text-secondary, #aaa);
  }
  .chart-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .chart-legend-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
</style>
