<script lang="ts">
  import { RACE_PROFESSION_BONUS } from '../../constants'
  import { calculateStrategicValue } from '../../leveling/strategicValue'
  import DetailView from '../leveling/DetailView.svelte'
  import VentajaIndexList from './VentajaIndexList.svelte'
  import type { StrategicIndex, StrategicCategory, EntityType, Personaje, LevelingConfig } from '../../types'

  let { entityType, entityId, entityLabel, indexes, categories, personajeData, levelingCtx, openCharEdit, hideTitle = false }: {
    entityType: EntityType
    entityId: string
    entityLabel: string
    indexes: StrategicIndex[]
    categories: StrategicCategory[]
    personajeData?: Personaje
    levelingCtx?: { config: LevelingConfig; roster: Personaje[]; count90: number }
    openCharEdit?: (name: string) => void
    hideTitle?: boolean
  } = $props()

  let professionRaceBonuses = $derived.by(() => {
    if (entityType !== 'profession') return []
    const result: { race: string; bonus: number; note?: string }[] = []
    for (const [race, bonuses] of Object.entries(RACE_PROFESSION_BONUS)) {
      for (const b of bonuses) {
        if (b.profId === entityId || b.profId === '*') {
          result.push({ race, bonus: b.bonus, note: b.note })
        }
      }
    }
    return result
  })

  let strategicResult = $derived(
    entityType === 'personaje' && personajeData && levelingCtx
      ? calculateStrategicValue(personajeData, levelingCtx.config, levelingCtx.roster, levelingCtx.count90)
      : null
  )
</script>

<div class="ea-root">
  {#if !hideTitle}
    <h3 class="ea-title">{entityLabel}</h3>
  {/if}
  <VentajaIndexList {entityType} {entityId} {indexes} {categories} />

  {#if entityType === 'profession' && professionRaceBonuses.length > 0}
    <div class="ea-bonus-box">
      <h4 class="ea-subheading">Razas que benefician esta profesión</h4>
      <ul class="ea-bonus-list">
        {#each professionRaceBonuses as b}
          <li>{b.race}: +{b.bonus}{b.note ? ` (${b.note})` : ''}</li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if strategicResult && levelingCtx}
    <DetailView
      personaje={personajeData!}
      config={levelingCtx.config}
      roster={levelingCtx.roster}
      count90={levelingCtx.count90}
      onEditChar={openCharEdit}
    />
  {/if}
</div>

<style>
  .ea-root {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .ea-title {
    font-family: var(--font-heading);
    font-size: 0.75rem;
    color: var(--gold);
    margin: 0;
    letter-spacing: 0.04em;
    border-bottom: 1px solid var(--border-subtle);
    padding-bottom: 6px;
  }
  .ea-total {
    font-size: 0.6rem;
    color: var(--text-primary);
    margin: 0;
  }
  .ea-bonus-box {
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 6px;
  }
  .ea-bonus-list {
    margin: 0;
    padding-left: 16px;
    font-size: 0.55rem;
    color: var(--text-muted);
  }
  .ea-subheading {
    font-size: 0.6rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0 0 4px;
  }
  .ea-groups {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 50vh;
    overflow-y: auto;
  }
  .ea-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .ea-rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .ea-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 3px 4px;
    border-bottom: 1px solid var(--border-subtle);
  }
  .ea-row.ea-dim {
    opacity: 0.45;
  }
  .ea-row.ea-dim:focus-within {
    opacity: 1;
  }
  .ea-row-label {
    flex: 1;
    min-width: 0;
    font-size: 0.6rem;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ea-row-spacer {
    width: 18px;
    display: inline-block;
  }
  .ea-icon-btn {
    background: transparent;
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.5rem;
    padding: 3px 6px;
    white-space: nowrap;
  }
  .ea-icon-danger:hover {
    border-color: var(--danger);
    color: var(--danger);
  }

</style>
