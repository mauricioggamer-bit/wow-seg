<script lang="ts">
  import { personajesStore, dataStore } from '../stores/data'
  import { getSessionPref, setSessionPref, getSessionPrefStr, setSessionPrefStr } from '../stores/sessionPrefs'
  import { clsClass } from '../constants'
  import {
    TOKENS,
    TOKEN_TIERS,
    TIER_INFO,
    SLOT_INFO,
    DIFFICULTY_LABEL,
    tokensByTier,
    tokenIdFor,
    defaultDifficulty,
    type TokenDef,
    type TokenTier,
    type TokenDifficulty,
  } from '../data/tokens'

  type Mode = 'tier' | 'global'

  let mode = $state<Mode>(getSessionPrefStr('tokens_mode', 'tier') === 'global' ? 'global' : 'tier')
  let selectedTier = $state<TokenTier>(getSessionPrefStr('tokens_tier', 'T5') as TokenTier)
  let onlyElegibles = $state(getSessionPref('tokens_only_elegibles'))
  let onlyRoster = $state(getSessionPref('tokens_only_roster'))
  let searchQuery = $state(getSessionPrefStr('tokens_search', ''))

  $effect(() => {
    setSessionPrefStr('tokens_mode', mode)
    setSessionPrefStr('tokens_tier', selectedTier)
    setSessionPref('tokens_only_elegibles', onlyElegibles)
    setSessionPref('tokens_only_roster', onlyRoster)
    setSessionPrefStr('tokens_search', searchQuery)
  })

  let rosterClases = $derived([...new Set($personajesStore.map(p => p.clase))].sort())

  let tierTokens = $derived(tokensByTier(selectedTier))

  let difficultyByToken = $state<Record<string, TokenDifficulty>>(
    (() => {
      const m: Record<string, TokenDifficulty> = {}
      for (const t of TOKENS) {
        const d = defaultDifficulty(t)
        if (d) m[t.id] = d
      }
      return m
    })()
  )

  function diffOf(t: TokenDef): TokenDifficulty | undefined {
    return difficultyByToken[t.id] ?? defaultDifficulty(t)
  }

  function activeTokenId(t: TokenDef): string {
    return tokenIdFor(t, diffOf(t))
  }

  let visibleTokens = $derived.by(() => {
    if (mode === 'tier') {
      let list = tierTokens
      if (onlyElegibles && onlyRoster) {
        list = list.filter(t => t.clases.some(c => rosterClases.includes(c)))
      }
      return list
    }
    const q = searchQuery.trim().toLowerCase()
    if (!q) return TOKENS
    return TOKENS.filter(t => {
      const hay = [t.nombre, t.tier, t.grupo, t.slot, SLOT_INFO[t.slot]]
        .join(' ').toLowerCase()
      if (hay.includes(q)) return true
      if (t.clases.some(c => c.toLowerCase().includes(q))) return true
      if (t.fuente.some(f => `${f.raid} ${f.boss ?? ''}`.toLowerCase().includes(q))) return true
      return false
    })
  })

  let counts = $derived($dataStore.tokenCounts ?? {})
  let usedBy = $derived($dataStore.tokenUsedBy ?? {})

  function getCount(t: TokenDef): number {
    return counts[activeTokenId(t)] ?? 0
  }

  function getUsed(t: TokenDef): string[] {
    return usedBy[activeTokenId(t)] ?? []
  }

  function isUsed(t: TokenDef, c: string): boolean {
    return getUsed(t).includes(c)
  }

  function incCount(t: TokenDef, delta: number) {
    dataStore.incTokenCount(activeTokenId(t), delta)
  }

  function toggleUsed(t: TokenDef, c: string) {
    dataStore.toggleTokenUsedBy(activeTokenId(t), c)
  }

  function clearSearch() { searchQuery = '' }

  function resetVisible() {
    if (mode === 'tier') dataStore.resetTokenState(selectedTier.toLowerCase())
    else dataStore.resetTokenState()
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

  function setDiff(t: TokenDef, d: TokenDifficulty) {
    difficultyByToken = { ...difficultyByToken, [t.id]: d }
  }

  function ilvlStr(t: TokenDef, d?: TokenDifficulty): string {
    if (!t.ilvls) return ''
    if (d && t.ilvls[d]) return `ilvl ${t.ilvls[d]}`
    const first = Object.values(t.ilvls)[0]
    return first ? `ilvl ${first}` : ''
  }

  function tierBadgeClass(t: TokenTier): string {
    const exp = TIER_INFO[t].expansion
    return `tier-badge tier-badge--${exp.toLowerCase()}`
  }

  function totalUsed(): { count: number; used: number } {
    let count = 0, used = 0
    for (const t of visibleTokens) {
      count += getCount(t)
      used += getUsed(t).length
    }
    return { count, used }
  }
</script>

<svelte:head>
  <title>Tokens — WoW Seg</title>
</svelte:head>

<div class="tokens-view">
  <header class="tokens-header">
    <h2>Tokens de Tier</h2>
    <p class="text-muted text-xs">
      Contá cuántos tokens tenés y marcá qué clases ya los canjearon. Una fila por
      token (slot × grupo); cuando un tier tiene varias dificultades, elegilas con el
      selector en la fila.
    </p>
  </header>

  <div class="mode-row">
    <label class="mode-radio">
      <input type="radio" name="tokens-mode" value="tier" bind:group={mode} />
      <span>Filtrar por tier</span>
    </label>
    <label class="mode-radio">
      <input type="radio" name="tokens-mode" value="global" bind:group={mode} />
      <span>Buscar en todos</span>
    </label>
  </div>

  <div class="controls">
    {#if mode === 'tier'}
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
          Filtrar irrelevantes
        </label>
      </div>
    {:else}
      <div class="search-row">
        <input
          type="text"
          class="search-input"
          placeholder="Buscar por nombre, raid, boss, clase, grupo o tier..."
          bind:value={searchQuery}
        />
        {#if searchQuery}
          <button class="wow-btn-sm wow-btn-ghost" onclick={clearSearch}>✕</button>
        {/if}
      </div>
    {/if}
    <button class="wow-btn-sm wow-btn-ghost" onclick={resetVisible}>
      Reset {#if mode === 'tier'}{selectedTier}{/if}
    </button>
  </div>

  <div class="tier-summary text-xs text-muted">
    {#if mode === 'tier'}
      <span>{TIER_INFO[selectedTier].label}</span>
      <span>·</span>
      <span>{TIER_INFO[selectedTier].expansion}</span>
      <span>·</span>
      <span>Raids: {TIER_INFO[selectedTier].raids.join(', ')}</span>
    {:else}
      <span>{visibleTokens.length} tokens encontrados</span>
    {/if}
    <span>·</span>
    <span>Tokens disponibles: {totalUsed().count} · Clases que canjearon: {totalUsed().used}</span>
  </div>

  {#if visibleTokens.length === 0}
    <div class="empty">
      <em class="text-muted text-xs">
        {mode === 'tier'
          ? 'Sin tokens elegibles para este tier con el roster actual.'
          : 'Sin resultados. Probá con otro término.'}
      </em>
    </div>
  {:else}
    <div class="table-wrap">
      <table class="tokens-table">
        <thead>
          <tr>
            <th class="col-tier">Tier</th>
            <th class="col-token">Token</th>
            <th class="col-slot">Slot</th>
            <th class="col-grupo">Grupo</th>
            <th class="col-fuente">Fuente</th>
            <th class="col-dif">Dificultad</th>
            <th class="col-count">Tokens</th>
            <th class="col-used">Usado por</th>
          </tr>
        </thead>
        <tbody>
          {#each visibleTokens as t (t.id)}
            <tr>
              <td class="col-tier">
                <span class={tierBadgeClass(t.tier)}>{t.tier}</span>
              </td>
              <td class="col-token">
                <div class="token-name">{t.nombre}</div>
                <span class="text-muted text-xs">{ilvlStr(t, diffOf(t))}</span>
              </td>
              <td class="col-slot">{SLOT_INFO[t.slot]}</td>
              <td class="col-grupo text-muted">{t.grupo}</td>
              <td class="col-fuente text-xs text-muted">{sourcesStr(t)}</td>
              <td class="col-dif">
                {#if t.dificultades.length > 0}
                  <select
                    class="diff-select"
                    value={diffOf(t) ?? t.dificultades[0]}
                    onchange={(e) => setDiff(t, e.currentTarget.value as TokenDifficulty)}
                  >
                    {#each t.dificultades as d}
                      <option value={d}>{DIFFICULTY_LABEL[d]}{t.ilvls?.[d] ? ` (${t.ilvls[d]})` : ''}</option>
                    {/each}
                  </select>
                {:else if t.ilvls?.normal}
                  <span class="text-xs text-muted">ilvl {t.ilvls.normal}</span>
                {:else}
                  <span class="text-muted text-xs">—</span>
                {/if}
              </td>
              <td class="col-count">
                <div class="counter">
                  <button
                    class="counter-btn"
                    disabled={getCount(t) === 0}
                    onclick={() => incCount(t, -1)}
                    title="Decrementar"
                  >−</button>
                  <span class="counter-val" class:zero={getCount(t) === 0}>{getCount(t)}</span>
                  <button
                    class="counter-btn"
                    onclick={() => incCount(t, +1)}
                    title="Incrementar"
                  >+</button>
                </div>
              </td>
              <td class="col-used">
                <div class="used-chips">
                  {#each t.clases as c}
                    <button
                      class="used-chip {clsClass(c)}"
                      class:used={isUsed(t, c)}
                      class:disabled={!getCount(t) && !isUsed(t, c)}
                      title={`${c} — ${isUsed(t, c) ? 'ya canjeó' : 'pendiente'}`}
                      onclick={() => toggleUsed(t, c)}
                    >
                      {isUsed(t, c) ? '✓' : '·'} {c}
                    </button>
                  {/each}
                </div>
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
    gap: 0.5rem;
    padding: 0.25rem 0 2rem;
  }
  .tokens-header h2 {
    margin: 0 0 0.2rem;
    font-size: var(--text-lg);
    font-family: var(--font-heading);
  }
  .text-xs { font-size: var(--text-xs); }
  .text-muted { color: var(--text-muted); }

  .mode-row {
    display: flex;
    gap: 1rem;
    padding: 0.2rem 0;
  }
  .mode-radio {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--text-xs);
    color: var(--text-secondary);
    cursor: pointer;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    justify-content: space-between;
  }
  .tier-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem;
  }
  .tier-pill {
    min-width: 2.2rem;
    padding: 0.15rem 0.4rem;
    border: 1px solid var(--border);
    background: var(--input-bg);
    color: var(--text-muted);
    border-radius: var(--r-sm);
    cursor: pointer;
    font-size: var(--text-xs);
    font-family: var(--font-body);
  }
  .tier-pill.active {
    background: var(--gold);
    color: var(--bg-base);
    border-color: var(--gold);
    font-weight: 600;
  }
  .search-row {
    display: flex;
    gap: 0.4rem;
    flex: 1;
    min-width: 14rem;
  }
  .search-input {
    flex: 1;
    padding: 0.25rem 0.5rem;
    background: var(--input-bg);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    color: var(--text-primary);
    font-size: var(--text-sm);
    font-family: var(--font-body);
  }
  .search-input:focus {
    outline: none;
    border-color: var(--gold);
  }
  .filter-group {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .filter-label {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--text-xs);
    color: var(--text-muted);
    cursor: pointer;
  }

  .tier-summary {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    padding: 0.1rem 0;
  }

  .empty {
    padding: 1.5rem 0;
    text-align: center;
  }

  .table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    background: var(--bg-elevated, var(--bg-mid));
  }
  .tokens-table {
    border-collapse: collapse;
    width: 100%;
    font-size: var(--text-xs);
    font-family: var(--font-body);
  }
  .tokens-table th,
  .tokens-table td {
    padding: 0.2rem 0.4rem;
    border-bottom: 1px solid var(--border);
    text-align: left;
    vertical-align: top;
  }
  .tokens-table thead th {
    background: var(--input-bg);
    font-size: 0.6rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    position: sticky;
    top: 0;
    white-space: nowrap;
  }
  .col-tier { width: 2.5rem; text-align: center; }
  .col-token { min-width: 11rem; max-width: 16rem; }
  .col-slot { min-width: 4.5rem; }
  .col-grupo { min-width: 4rem; }
  .col-fuente { min-width: 12rem; max-width: 18rem; }
  .col-dif { min-width: 5rem; }
  .col-count { min-width: 5rem; }
  .col-used { min-width: 14rem; }

  .token-name { font-weight: 500; color: var(--text-primary); }

  .tier-badge {
    display: inline-block;
    padding: 0.05rem 0.3rem;
    border-radius: var(--r-sm);
    font-size: 0.55rem;
    font-weight: 700;
    color: #fff;
  }
  .tier-badge--tbc { background: #4d6b2a; }
  .tier-badge--wotlk { background: #1f4e7a; }
  .tier-badge--cata { background: #c2541a; }
  .tier-badge--mop { background: #2a7a4d; }

  .diff-select {
    padding: 0.1rem 0.25rem;
    background: var(--input-bg);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    color: var(--text-primary);
    font-size: 0.6rem;
    font-family: var(--font-body);
    max-width: 6rem;
  }

  .counter {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
  }
  .counter-btn {
    width: 1.2rem;
    height: 1.2rem;
    padding: 0;
    border: 1px solid var(--border);
    background: var(--input-bg);
    color: var(--text-primary);
    border-radius: var(--r-sm);
    cursor: pointer;
    font-size: 0.85rem;
    line-height: 1;
    font-family: var(--font-body);
  }
  .counter-btn:hover:not(:disabled) {
    border-color: var(--gold);
    color: var(--gold);
  }
  .counter-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .counter-val {
    min-width: 1.6rem;
    text-align: center;
    font-weight: 600;
    color: var(--text-primary);
    font-size: var(--text-sm);
  }
  .counter-val.zero {
    color: var(--text-muted);
    font-weight: 400;
  }

  .used-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem;
  }
  .used-chip {
    display: inline-flex;
    align-items: center;
    padding: 0.1rem 0.35rem;
    border: 1px solid var(--border);
    background: var(--input-bg);
    border-radius: var(--r-sm);
    cursor: pointer;
    font-size: 0.6rem;
    font-weight: 500;
    font-family: var(--font-body);
    opacity: 0.45;
    transition: opacity 0.1s, border-color 0.1s;
  }
  .used-chip:not(.disabled):hover {
    opacity: 1;
    border-color: var(--gold);
  }
  .used-chip.used {
    opacity: 1;
    border-color: var(--health-green);
  }
  .used-chip.disabled {
    cursor: default;
  }
</style>