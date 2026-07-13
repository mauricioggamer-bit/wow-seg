<script lang="ts">
  import { personajesStore, dataStore } from '../stores/data'
  import { uiStore, currentWarband } from '../stores/ui'
  import { getSessionPref, setSessionPref } from '../stores/sessionPrefs'

  function toast(msg: string) { uiStore.setToast(msg) }
  import { CLASS_MAP, PERS_CLASS_ICONS, PERS_CLASS_COLORS } from '../constants'

  let editing = $state<Record<string, string[]>>({})
  let descBuffer = $state<Record<string, string>>({})
  let filterText = $state('')
  let showSinDesc = $state(getSessionPref('sinDesc'))
  let showSinRep1 = $state(getSessionPref('sinRep1'))
  let showSinRep2 = $state(getSessionPref('sinRep2'))
  let showNoActivos = $state(false)

  let activeWarband = $derived($currentWarband && $currentWarband !== '' ? $currentWarband : null)

  let scoped = $derived(
    activeWarband ? $personajesStore.filter(c => c.warband === activeWarband) : $personajesStore
  )

  let sorted = $derived(
    [...scoped]
      .filter(c => showNoActivos || c.planeado_usar)
      .filter(c => !showSinDesc || !c.descripcion)
      .filter(c => !showSinRep1 || !c.parecidos?.[0])
      .filter(c => !showSinRep2 || !c.parecidos?.[1])
      .filter(c => !filterText || c.nombre.toLowerCase().includes(filterText.toLowerCase()) || (c.clase || '').toLowerCase().includes(filterText.toLowerCase()) || (c.raza || '').toLowerCase().includes(filterText.toLowerCase()))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  )

  function saveParecido(charName: string) {
    const vals = editing[charName] !== undefined ? editing[charName] : []
    const cleaned = vals.filter(x => (x || '').trim()).slice(0, 2)
    dataStore.updatePersonaje(charName, { parecidos: cleaned })
  }

  function initEdit(c: { nombre: string; parecidos?: string[] }) {
    const arr = c.parecidos ? [...c.parecidos] : []
    while (arr.length < 2) arr.push('')
    editing[c.nombre] = arr
  }

  function initDesc(c: { nombre: string; descripcion?: string }) {
    if (descBuffer[c.nombre] === undefined) descBuffer[c.nombre] = c.descripcion || ''
  }

  function saveDesc(charName: string) {
    const val = descBuffer[charName] ?? ''
    dataStore.updatePersonaje(charName, { descripcion: val })
    toast('Descripción guardada')
  }

</script>

<div class="fantasia-panel">
  <div class="fantasia-editor">
    <div class="fantasia-editor-header">
      <span class="fantasia-editor-title">✏️ {activeWarband ? activeWarband : 'Todas'} ({sorted.length})</span>
      <label class="fantasia-toggle"><input type="checkbox" bind:checked={showSinDesc} onchange={() => setSessionPref('sinDesc', showSinDesc)} /> Sin descripción</label>
      <label class="fantasia-toggle"><input type="checkbox" bind:checked={showSinRep1} onchange={() => setSessionPref('sinRep1', showSinRep1)} /> Sin rep. 1</label>
      <label class="fantasia-toggle"><input type="checkbox" bind:checked={showSinRep2} onchange={() => setSessionPref('sinRep2', showSinRep2)} /> Sin rep. 2</label>
      <label class="fantasia-toggle"><input type="checkbox" bind:checked={showNoActivos} /> No activos</label>
      <input class="fantasia-search" type="text" placeholder="Filtrar personajes..." bind:value={filterText} />
    </div>
    <div class="fantasia-list">
      {#each sorted as c (c.nombre)}
        {@const clsKey = CLASS_MAP[c.clase] || 'warrior'}
        {@const color = PERS_CLASS_COLORS[clsKey] || '#c9a84c'}
        <div class="fantasia-row">
          <div class="fantasia-row-main">
            <span class="fantasia-row-icon">{PERS_CLASS_ICONS[clsKey] || '?'}</span>
            <span class="fantasia-row-name" style="color:{color}">{c.nombre}</span>
            <span class="fantasia-row-info">Nv.{c.nivel} · {c.raza}</span>
            {#each [0, 1] as idx}
              <input class="fantasia-row-input" type="text"
                placeholder={`Representante ${idx + 1}...`}
                value={(editing[c.nombre] ?? c.parecidos ?? ['', ''])[idx] ?? ''}
                onfocus={() => initEdit(c)}
                oninput={(e) => {
                  if (!editing[c.nombre]) initEdit(c)
                  editing[c.nombre][idx] = (e.target as HTMLInputElement).value
                }}
                onblur={() => saveParecido(c.nombre)}
                onkeydown={(e) => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur() } }} />
            {/each}
            </div>
          <div class="fantasia-row-desc-row">
            <input
              class="fantasia-row-desc"
              type="text"
              placeholder="Descripción del personaje..."
              value={descBuffer[c.nombre] ?? c.descripcion ?? ''}
              onfocus={() => initDesc(c)}
              oninput={(e) => { if (!descBuffer[c.nombre]) initDesc(c); descBuffer[c.nombre] = (e.target as HTMLInputElement).value }}
              onblur={() => saveDesc(c.nombre)}
              onkeydown={(e) => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur() } }}
            />
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .fantasia-panel { height:calc(100vh - 100px); margin-top:6px; border:1px solid var(--border-subtle); border-radius:var(--r-md); overflow:hidden; background:var(--bg-base); display:flex; flex-direction:column; }
  .fantasia-editor { flex:1; display:flex; flex-direction:column; overflow:hidden; }
  .fantasia-editor-header { display:flex; align-items:center; gap:8px; padding:6px 10px; border-bottom:1px solid var(--border-subtle); flex-shrink:0; }
  .fantasia-editor-title { font-size:0.6rem; color:var(--gold-light); font-weight:700; text-transform:uppercase; letter-spacing:1px; }
  .fantasia-search { margin-left:auto; background:var(--input-bg); border:1px solid var(--border-subtle); border-radius:var(--r-sm); padding:3px 8px; color:var(--text-primary); font-size:0.5rem; font-family:var(--font-body); width:180px; }
  .fantasia-search:focus { outline:none; border-color:var(--gold-dim); }
  .fantasia-search::placeholder { color:var(--text-dim); }
  .fantasia-toggle { display:flex; align-items:center; gap:3px; font-size:0.5rem; color:var(--text-secondary); cursor:pointer; }
  .fantasia-toggle input { width:auto; }
  .fantasia-list { flex:1; overflow-y:auto; padding:4px 8px; }
  .fantasia-row { display:flex; flex-direction:column; padding:4px 6px; border-bottom:1px solid var(--border-subtle); border-left:2px solid transparent; transition:background var(--t-fast); }
  .fantasia-row:hover { background:var(--bg-raised); border-radius:2px; }
  .fantasia-row-main { display:flex; align-items:center; gap:6px; }
  .fantasia-row-desc-row { margin-top:2px; padding-left:26px; }
  .fantasia-row-icon { font-size:0.7rem; width:20px; text-align:center; flex-shrink:0; }
  .fantasia-row-name { font-size:0.55rem; font-weight:600; min-width:120px; }
  .fantasia-row-info { font-size:0.45rem; color:var(--text-muted); min-width:90px; }
  .fantasia-row-input { flex:1; background:var(--input-bg); border:1px solid var(--border-subtle); border-radius:var(--r-sm); padding:3px 6px; color:var(--text-primary); font-size:0.5rem; font-family:var(--font-body); min-width:0; }
  .fantasia-row-input:focus { outline:none; border-color:var(--gold-dim); }
  .fantasia-row-input::placeholder { color:var(--text-dim); }
  .fantasia-row-desc { width:100%; background:var(--input-bg); border:1px dashed var(--border-subtle); border-radius:var(--r-sm); padding:2px 6px; color:var(--text-muted); font-size:0.45rem; font-family:var(--font-body); }
  .fantasia-row-desc:focus { outline:none; border-color:var(--gold-dim); border-style:solid; }
  .fantasia-row-desc::placeholder { color:var(--text-dim); }
  @media (max-width:768px) { .fantasia-row-name { min-width:80px; } .fantasia-row-info { display:none; } }
</style>
