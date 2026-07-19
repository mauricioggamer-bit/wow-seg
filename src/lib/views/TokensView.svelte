<script lang="ts">
  import { personajesStore, dataStore } from '../stores/data'
  import { getSessionPref, setSessionPref, getSessionPrefStr, setSessionPrefStr } from '../stores/sessionPrefs'
  import { clsClass } from '../constants'
  import {
    TOKEN_TIERS,
    TIER_INFO,
    SLOT_INFO,
    tokensByTier,
    type TokenDef,
    type TokenTier,
  } from '../data/tokens'

  let selectedTier = $state<TokenTier>(getSessionPrefStr('tokens_tier', 'T5') as TokenTier)
  let onlyElegibles = $state(getSessionPref('tokens_only_elegibles'))
  let onlyRoster = $state(getSessionPref('tokens_only_roster'))
  $effect(() => { setSessionPrefStr('tokens_tier', selectedTier); setSessionPref('tokens_only_elegibles', onlyElegibles); setSessionPref('tokens_only_roster', onlyRoster) })

  let rosterClases = $derived([...new Set($personajesStore.map(p => p.clase))].sort())

  let tierTokens = $derived(tokensByTier(selectedTier))

  let allClases = $derived(
    Array.from(new Set(tierTokens.flatMap(t => t.clases))).sort()
  )

  let columnClases = $derived(
    onlyRoster ? allClases.filter(c => rosterClases.includes(c)) : allClases
  )

  let visibleTokens = $derived(
    onlyElegibles && onlyRoster
      ? tierTokens.filter(t => t.clases.some(c => rosterClases.includes(c)))
      : tierTokens
  )

  let unlocks = $derived($dataStore.tokenUnlocks ?? {})

  function isUnlocked(t: TokenDef, clase: string): boolean {
    return (unlocks[t.id] ?? []).includes(clase)
  }

  function toggle(t: TokenDef, clase: string) {
    dataStore.toggleTokenUnlocked(t.id, clase)
  }

  function resetTier() {
    dataStore.resetTokenUnlocks(selectedTier.toLowerCase())
  }

  function countUnlocked(t: TokenDef): number {
    return (unlocks[t.id] ?? []).length
  }

  function totalForTier(): number {
    return visibleTokens.reduce((s, t) => s + countUnlocked(t), 0)
  }

  function totalEligibleForTier(): number {
    return visibleTokens.reduce((s, t) => s + columnClases.filter(c => t.clases.includes(c)).length, 0)
  }

  function sourcesStr(t: TokenDef): string {
    const seen = new Set<string>()
    const out: string[] = []
    for (const f of t.fuente) {
      const key = `${f.raid}|${f.boss ?? ''}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(f.boss ? `${f.boss} (${f.raid})` : f.raid)
    }
    return out.join(' · ')
  }

  function tierPct(): number {
    const tot = totalEligibleForTier()
    return tot > 0 ? Math.round(totalForTier() / tot * 100) : 0
  }

  </script>

<svelte:head>
  <title>Tokens — WoW Seg</title>
</svelte:head>

<div class="tokens-view">
  <header class="tokens-header">
    <h2>Tokens de Tier</h2>
    <p class="text-muted text-xs">
      Marcá qué clases ya desbloquearon cada token. Los ítems dropean de raids y se canjean
      por piezas de tier set en el vendor de la ciudad.
    </p>
  </header>

  <div class="tokens-controls">
    <div class="tier-pills">
      {#each TOKEN_TIERS as t}
        <button
          class="wow-btn-sm tier-pill"
          class:active={selectedTier === t}
          onclick={() => selectedTier = t}
        >
          {t}
        </button>
      {/each}
    </div>
    <div class="filter-group">
      <label class="filter-label">
        <input type="checkbox" bind:checked={onlyRoster} />
        Solo roster
      </label>
      <label class="filter-label">
        <input type="checkbox" bind:checked={onlyElegibles} />
        Filtrar tokens irrelevantes
      </label>
      <button class="wow-btn-sm wow-btn-ghost" onclick={resetTier}>
        Reset {selectedTier}
      </button>
    </div>
  </div>

  <div class="tier-summary">
    <span class="text-muted text-xs">{TIER_INFO[selectedTier].label}</span>
    <span class="text-muted text-xs">·</span>
    <span class="text-muted text-xs">{TIER_INFO[selectedTier].expansion}</span>
    <span class="text-muted text-xs">·</span>
    <span class="text-muted text-xs">Raids: {TIER_INFO[selectedTier].raids.join(', ')}</span>
    <span class="text-muted text-xs">·</span>
    <span class="text-xs">Progreso: {totalForTier()} / {totalEligibleForTier()} ({tierPct()}%)</span>
  </div>

  {#if visibleTokens.length === 0}
    <div class="empty">
      <em class="text-muted text-xs">Sin tokens elegibles para este tier con el roster actual.</em>
    </div>
  {:else}
    <div class="table-wrap">
      <table class="tokens-table">
        <thead>
          <tr>
            <th class="col-token">Token</th>
            <th class="col-slot">Slot</th>
            <th class="col-fuente">Fuente</th>
            {#each columnClases as c}
              <th class="col-class" title={c}>
                <span class="class-chip {clsClass(c)}">{c}</span>
              </th>
            {/each}
            <th class="col-prog">Prog.</th>
          </tr>
        </thead>
        <tbody>
          {#each visibleTokens as t (t.id)}
            <tr>
              <td class="col-token">
                <div class="token-name">{t.nombre}</div>
                {#if t.ilvl}<span class="text-muted text-xs">ilvl {t.ilvl}</span>{/if}
              </td>
              <td class="col-slot">{SLOT_INFO[t.slot]}</td>
              <td class="col-fuente text-xs text-muted">{sourcesStr(t)}</td>
              {#each columnClases as c}
                <td class="col-class">
                  {#if t.clases.includes(c)}
                    <button
                      class="cell-check"
                      class:unchecked={!isUnlocked(t, c)}
                      class:checked={isUnlocked(t, c)}
                      title={`${c} — ${isUnlocked(t, c) ? 'desbloqueado' : 'pendiente'}`}
                      onclick={() => toggle(t, c)}
                    >
                      {isUnlocked(t, c) ? '✓' : '·'}
                    </button>
                  {:else}
                    <span class="cell-na" title="No elegible">—</span>
                  {/if}
                </td>
              {/each}
              <td class="col-prog text-xs">
                {countUnlocked(t)}/{t.clases.filter(c => columnClases.includes(c)).length}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .tokens-view {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.5rem 0 2rem;
  }
  .tokens-header h2 {
    margin: 0 0 0.25rem;
    font-size: 1.2rem;
  }
  .tokens-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
  }
  .tier-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  .tier-pill {
    min-width: 2.5rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--border);
    background: var(--input-bg);
    color: var(--text-muted);
    border-radius: var(--r-sm);
    cursor: pointer;
    font-size: 0.8rem;
  }
  .tier-pill.active {
    background: var(--gold);
    color: var(--bg);
    border-color: var(--gold);
    font-weight: 600;
  }
  .filter-group {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .filter-label {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.8rem;
    color: var(--text-muted);
    cursor: pointer;
  }
  .tier-summary {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    padding: 0.25rem 0;
  }
  .empty {
    padding: 2rem 0;
    text-align: center;
  }
  .table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    background: var(--bg-elevated);
  }
  .tokens-table {
    border-collapse: collapse;
    width: 100%;
    font-size: 0.85rem;
  }
  .tokens-table th,
  .tokens-table td {
    padding: 0.4rem 0.55rem;
    border-bottom: 1px solid var(--border);
    text-align: left;
    vertical-align: middle;
  }
  .tokens-table thead th {
    background: var(--input-bg);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    position: sticky;
    top: 0;
  }
  .col-class { text-align: center; min-width: 4rem; }
  .col-token { min-width: 14rem; }
  .col-fuente { max-width: 22rem; }
  .col-prog { text-align: center; color: var(--text-muted); min-width: 4rem; }
  .token-name { font-weight: 500; }
  .class-chip {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
  }
  .cell-check {
    width: 1.8rem;
    height: 1.8rem;
    border: 1px solid var(--border);
    background: var(--input-bg);
    border-radius: var(--r-sm);
    cursor: pointer;
    font-size: 0.95rem;
    line-height: 1;
    padding: 0;
    color: inherit;
    transition: background 0.1s, border-color 0.1s;
  }
  .cell-check.unchecked {
    color: var(--text-muted);
    opacity: 0.5;
  }
  .cell-check.checked {
    background: var(--gold);
    color: var(--bg);
    border-color: var(--gold);
    font-weight: 700;
  }
  .cell-check:hover {
    opacity: 1;
    border-color: var(--gold);
  }
  .cell-na {
    color: var(--text-muted);
    opacity: 0.25;
  }
</style>