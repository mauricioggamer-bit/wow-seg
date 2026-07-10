<script lang="ts">
  let {
    value,
    onConfirm,
    min = 0,
    max = 100,
    step = 5,
    highlight = false,
  }: {
    value: number | undefined
    onConfirm: (v: number | undefined) => void
    min?: number
    max?: number
    step?: number
    highlight?: boolean
  } = $props()

  let editing = $state(false)
  let draft = $state('')

  function startEdit(delta = 0) {
    const base = value ?? 0
    draft = String(Math.max(min, Math.min(max, base + delta)))
    editing = true
  }

  function adjustDraft(delta: number) {
    const n = parseInt(draft)
    const base = isNaN(n) ? (value ?? 0) : n
    draft = String(Math.max(min, Math.min(max, base + delta)))
  }

  function confirm() {
    const trimmed = draft.trim()
    if (trimmed === '') {
      onConfirm(undefined)
    } else {
      const v = parseInt(trimmed)
      if (!isNaN(v)) onConfirm(Math.max(min, Math.min(max, v)))
    }
    editing = false
  }

  function cancel() {
    editing = false
  }
</script>

<div class="ps-root" onclick={(e) => e.stopPropagation()}>
  {#if editing}
    <button class="ps-btn" onclick={() => adjustDraft(-step)}>−</button>
    <input type="text" bind:value={draft} class="ps-input"
      onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirm() } else if (e.key === 'Escape') { e.preventDefault(); cancel() } }} />
    <button class="ps-btn" onclick={() => adjustDraft(step)}>+</button>
    <button class="ps-yes" onclick={confirm}>✓</button>
    <button class="ps-no" onclick={cancel}>✗</button>
  {:else}
    <button class="ps-btn" onclick={() => startEdit(-step)} disabled={(value ?? 0) <= min}>−</button>
    <span class="ps-val" class:ps-assigned={highlight} onclick={() => startEdit(0)}>{value ?? '—'}</span>
    <button class="ps-btn" onclick={() => startEdit(step)} disabled={(value ?? 0) >= max}>+</button>
  {/if}
</div>

<style>
  .ps-root {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .ps-btn {
    background: transparent;
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.55rem;
    width: 16px;
    height: 16px;
    line-height: 1;
    padding: 0;
  }
  .ps-btn:hover:not(:disabled) {
    border-color: var(--gold);
    color: var(--gold);
  }
  .ps-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .ps-val {
    display: inline-block;
    min-width: 24px;
    text-align: center;
    font-size: 0.6rem;
    color: var(--text-primary);
    cursor: pointer;
    padding: 1px 2px;
  }
  .ps-val:hover {
    color: var(--gold);
  }
  .ps-val.ps-assigned {
    color: var(--gold);
    font-weight: bold;
  }
  .ps-input {
    width: 40px;
    padding: 1px 3px;
    border: 1px solid var(--gold);
    border-radius: var(--r-sm);
    background: var(--input-bg);
    color: var(--text-primary);
    font-size: 0.6rem;
    text-align: center;
  }
  .ps-yes, .ps-no {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 0.6rem;
    padding: 0 2px;
  }
  .ps-yes {
    color: var(--gold);
  }
  .ps-no {
    color: var(--danger);
  }
</style>
