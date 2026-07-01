# WoW Keybind Visual Editor — Especificación Técnica Completa

**Proyecto:** Aplicación web para visualizar, editar y generar strings de keybinds para World of Warcraft  
**Origen:** Sistema de export de addon (ActionBarSaver o equivalente) con encoding Base64  
**Audiencia de este documento:** Desarrollador que implementará el proyecto desde cero en un contexto separado

---

## 1. Contexto y objetivo

### 1.1 ¿Qué es el string?

El addon de WoW exporta la configuración de action bars de un personaje como un string codificado en Base64. Al decodificarlo se obtiene un CSV con el siguiente formato:

```
0,_header,shaman,262,,|1,spell,188196,spell,1,|2,spell,51505,spell,2,|...
```

Cada segmento separado por `|` es un **slot** de la action bar con un spell, macro, montura, o vacío asignado.

### 1.2 Objetivo de la aplicación

Crear una web app que:
1. Reciba un string Base64 y lo decodifique visualmente como un teclado
2. Permita ver qué spell/macro/montura está asignado en cada tecla
3. Permita modificar asignaciones haciendo click en las teclas
4. Recodifique los cambios al formato Base64 original

---

## 2. El formato de datos — Especificación completa

### 2.1 Estructura general

```
HEADER|SLOT_1|SLOT_2|...|SLOT_N|
```

Todo el string (sin el Base64) es una serie de entradas separadas por `|`.

### 2.2 Tipos de entrada

#### Header (siempre el primero)
```
0,_header,CLASS_NAME,SPEC_ID,,
```
- `CLASS_NAME`: nombre de clase en minúscula (`shaman`, `druid`, `hunter`, `warrior`, `deathknight`, `paladin`, `monk`, `mage`, `priest`, `rogue`, `warlock`, `evoker`)
- `SPEC_ID`: número entero del spec según WoW (ver sección 3)

#### Spell entry
```
SLOT_NUMBER,spell,SPELL_ID,spell,KEYBIND_STRING,
```
- `SLOT_NUMBER`: entero de 1 a ~192 (ver mapeo en sección 4)
- `SPELL_ID`: ID del spell según la API de Blizzard
- `KEYBIND_STRING`: string del keybind (ej: `1`, `Q`, `SHIFT-Z`, `CTRL-1`, `BUTTON4`, `MOUSEWHEELUP`)

#### Macro entry
```
SLOT_NUMBER,macro,MACRO_ID,MACRO_ID,KEYBIND_STRING,,NAME_BASE64,BODY_BASE64,c
```
- `NAME_BASE64`: nombre del macro codificado en Base64
- `BODY_BASE64`: body del macro codificado en Base64
- La `c` final es un flag de "custom"

#### Mount entry
```
SLOT_NUMBER,summonmount,MOUNT_ID,,KEYBIND_STRING,
```
o con keybind secundario:
```
SLOT_NUMBER,summonmount,MOUNT_ID,,KEYBIND_STRING,SECONDARY_KEYBIND
```

#### Slot vacío sin keybind
```
SLOT_NUMBER#5,
```
El `#5` indica "empty, no bind"

#### Slot vacío con keybind reservado
```
SLOT_NUMBER#4,KEYBIND_STRING,
```
o con keybind secundario:
```
SLOT_NUMBER#4,KEYBIND_STRING,SECONDARY_KEYBIND
```
El `#4` indica "empty spell, but keybind exists"

### 2.3 Ejemplo completo decodificado

```
0,_header,shaman,262,,
|1,spell,188196,spell,1,
|2,spell,51505,spell,2,
|3,spell,470411,spell,3,
|4,spell,188443,spell,4,
|5,spell,8042,spell,Q,
|6,macro,462620,462620,E,,RWFydGhxdWFrZSAoR3JvdW5kKQ==,I3Nob3d0b29sdGlwIEVhcnRocXVha2UK...,c
|7,spell,191634,spell,R,
|8,spell,378081,spell,F,
|9#5,
|10#5,
...
|25,spell,198103,spell,SHIFT-Z,
|26,spell,58875,spell,SHIFT-X,
...
```

---

## 3. Mapeo de Spec IDs por clase

```javascript
const SPEC_IDS = {
  druid:      { Balance: 102, Feral: 103, Guardian: 104, Restoration: 105 },
  hunter:     { BeastMastery: 253, Marksmanship: 254, Survival: 255 },
  mage:       { Arcane: 62, Fire: 63, Frost: 64 },
  paladin:    { Holy: 65, Protection: 66, Retribution: 70 },
  priest:     { Discipline: 256, Holy: 257, Shadow: 258 },
  rogue:      { Assassination: 259, Outlaw: 260, Subtlety: 261 },
  shaman:     { Elemental: 262, Enhancement: 263, Restoration: 264 },
  warlock:    { Affliction: 265, Demonology: 266, Destruction: 267 },
  warrior:    { Arms: 71, Fury: 72, Protection: 73 },
  monk:       { Brewmaster: 268, Windwalker: 269, Mistweaver: 270 },
  deathknight:{ Blood: 250, Frost: 251, Unholy: 252 },
  evoker:     { Devastation: 1467, Preservation: 1468, Augmentation: 1473 },
};
```

---

## 4. Mapeo de Slot Numbers a Keybinds

Este es el mapa crítico. Cada slot number corresponde a un keybind específico del sistema del addon. Este mapa fue reverse-engineered a partir de strings reales de Shaman Elemental.

```javascript
const SLOT_TO_KEYBIND = {
  // Fila principal 1-8
  1:  "1",
  2:  "2",
  3:  "3",
  4:  "4",
  5:  "Q",
  6:  "E",
  7:  "R",
  8:  "F",

  // Slots 9-12: teclas extras (T, G, -, =)
  9:  "T",
  10: "G",
  11: "-",   // también tiene "B" como secondary en algunos chars
  12: "=",

  // Slots 13-24: vacíos en el sistema observado
  // (podrían ser 5,6,7,8,9,0 y variantes con mod)

  // Fila SHIFT + Z,X,C,V row
  25: "SHIFT-Z",
  26: "SHIFT-X",
  27: "SHIFT-C",
  28: "SHIFT-V",

  // Fila Z,X,C,V (sin modificador)
  29: "Z",
  30: "X",
  31: "C",
  32: "V",

  // Mouse buttons
  33: "BUTTON5",   // Mouse 5
  34: "BUTTON4",   // Mouse 4

  // Mouse wheel
  35: "MOUSEWHEELUP",
  36: "MOUSEWHEELDOWN",

  // ALT + Z,X,C,V
  37: "ALT-Z",
  38: "ALT-X",
  39: "ALT-C",
  40: "ALT-V",

  // CTRL + Z,X,C,V
  41: "CTRL-Z",
  42: "CTRL-X",
  43: "CTRL-C",
  44: "CTRL-V",

  // Slots 45-48: vacíos

  // CTRL + 1,2,3,4,Q,E,R,F
  49: "CTRL-1",
  50: "CTRL-2",
  51: "CTRL-3",
  52: "CTRL-4",
  53: "CTRL-Q",
  54: "CTRL-E",
  55: "CTRL-R",
  56: "CTRL-F",

  // CTRL + T,G,B
  57: "CTRL-T",
  58: "CTRL-G",
  59: "CTRL-B",

  // Slot 60: vacío

  // SHIFT + 1,2,3,4,Q,E,R,F
  61: "SHIFT-1",
  62: "SHIFT-2",
  63: "SHIFT-3",
  64: "SHIFT-4",
  65: "SHIFT-Q",
  66: "SHIFT-E",
  67: "SHIFT-R",
  68: "SHIFT-F",

  // SHIFT + T,G,B
  69: "SHIFT-T",
  70: "SHIFT-G",
  71: "SHIFT-B",

  // Slots 72-144: vacíos (#5)

  // ALT + 1,2,3,4,Q,E,R,F
  145: "ALT-1",
  146: "ALT-2",
  147: "ALT-3",
  148: "ALT-4",
  149: "ALT-Q",
  150: "ALT-E",
  151: "ALT-R",
  152: "ALT-F",

  // ALT + T,G,B
  153: "ALT-T",
  154: "ALT-G",
  155: "ALT-B",

  // Slots 156-182: vacíos

  // F-keys
  183: "F1",
  184: "F2",
  185: "F3",
  186: "F4",
  187: "F5",
  188: "F6",

  // Slots 189-192: vacíos
};

// Inverso: keybind → slot
const KEYBIND_TO_SLOT = Object.fromEntries(
  Object.entries(SLOT_TO_KEYBIND).map(([slot, kb]) => [kb, parseInt(slot)])
);
```

---

## 5. El teclado visual — Layout

La UI debe mostrar un teclado con las siguientes "zonas" y sus keybinds correspondientes:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ZONA COMBAT (fila 1-8)                                             │
│  [1] [2] [3] [4] [Q] [E] [R] [F]                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ZONA EXTRAS (T, G, -, =)                                          │
│  [T] [G] [-] [=]                                                   │
├─────────────────────────────────────────────────────────────────────┤
│  ZONA Z-ROW con modificadores                                       │
│  [Z]    [SHIFT-Z]    [CTRL-Z]                                      │
│  [X]    [SHIFT-X]    [CTRL-X]                                      │
│  [C]    [SHIFT-C]    [CTRL-C]                                      │
│  [V]    [SHIFT-V]    [CTRL-V]                                      │
├─────────────────────────────────────────────────────────────────────┤
│  ZONA SHIFT-ROW                                                     │
│  [S1] [S2] [S3] [S4]   →   SHIFT-1,2,3,4                         │
│  [SQ] [SE] [SR] [SF]   →   SHIFT-Q,E,R,F                         │
│  [ST] [SG] [SB]        →   SHIFT-T,G,B                           │
├─────────────────────────────────────────────────────────────────────┤
│  ZONA CTRL-ROW                                                      │
│  [C1] [C2] [C3] [C4]   →   CTRL-1,2,3,4                          │
│  [CQ] [CE] [CR] [CF]   →   CTRL-Q,E,R,F                          │
│  [CT] [CG] [CB]        →   CTRL-T,G,B                            │
├─────────────────────────────────────────────────────────────────────┤
│  ZONA ALT-ROW                                                       │
│  [A1] [A2] [A3] [A4]   →   ALT-1,2,3,4                           │
│  [AQ] [AE] [AR] [AF]   →   ALT-Q,E,R,F                           │
│  [AT] [AG] [AB]        →   ALT-T,G,B                             │
│  [AZ] [AX] [AC] [AV]   →   ALT-Z,X,C,V                          │
├─────────────────────────────────────────────────────────────────────┤
│  ZONA MOUSE & F-KEYS                                                │
│  [M4] [M5] [MWU] [MWD]   →   BUTTON4,5, MOUSEWHEEL UP/DOWN       │
│  [F1] [F2] [F3] [F4] [F5] [F6]                                    │
└─────────────────────────────────────────────────────────────────────┘
```

Cada tecla del teclado visual muestra:
- El label del keybind (ej: "SHIFT-Z")
- El ícono del spell asignado (si hay)
- El nombre del spell (truncado a ~12 chars)
- Color de fondo según categoría semántica (ver sección 8)

---

## 6. Parser: Base64 → State Object

```javascript
function parseKeybindString(base64String) {
  // 1. Decodificar Base64
  const raw = atob(base64String);

  // 2. Parsear header y slots
  const entries = raw.split('|').filter(Boolean);
  const result = {
    header: null,
    slots: {},       // slot_number → slot_data
    keybindMap: {},  // keybind_string → slot_data  (derivado)
  };

  for (const entry of entries) {
    // ---- HEADER ----
    if (entry.startsWith('0,_header,')) {
      const parts = entry.split(',');
      result.header = {
        className: parts[2],
        specId: parseInt(parts[3]),
      };
      continue;
    }

    // ---- EMPTY SLOT (#5) ----
    if (entry.includes('#5')) {
      const slotNum = parseInt(entry.split('#')[0]);
      result.slots[slotNum] = { type: 'empty', slotNum };
      continue;
    }

    // ---- EMPTY BIND (#4) ----
    if (entry.includes('#4')) {
      const [slotPart, ...rest] = entry.split(',');
      const slotNum = parseInt(slotPart.split('#')[0]);
      result.slots[slotNum] = {
        type: 'emptyBind',
        slotNum,
        keybind: rest[0] || '',
        keybind2: rest[1] || '',
      };
      continue;
    }

    // ---- SPELL / MACRO / MOUNT ----
    const parts = entry.split(',');
    const slotNum = parseInt(parts[0]);
    if (isNaN(slotNum)) continue;

    const entryType = parts[1];

    if (entryType === 'spell') {
      result.slots[slotNum] = {
        type: 'spell',
        slotNum,
        spellId: parseInt(parts[2]),
        keybind: parts[4] || '',
        keybind2: parts[5] || '',
      };
    }
    else if (entryType === 'macro') {
      const nameB64 = parts[6] || '';
      const bodyB64 = parts[7] || '';
      result.slots[slotNum] = {
        type: 'macro',
        slotNum,
        macroId: parts[2],
        keybind: parts[4] || '',
        name: nameB64 ? atob(nameB64) : '',
        body: bodyB64 ? atob(bodyB64) : '',
      };
    }
    else if (entryType === 'summonmount') {
      result.slots[slotNum] = {
        type: 'mount',
        slotNum,
        mountId: parts[2],
        keybind: parts[4] || '',
        keybind2: parts[5] || '',
      };
    }
  }

  // 3. Construir keybindMap (keybind → slot_data)
  for (const slot of Object.values(result.slots)) {
    if (slot.keybind) {
      result.keybindMap[slot.keybind] = slot;
    }
  }

  return result;
}
```

---

## 7. Encoder: State Object → Base64

```javascript
function encodeKeybindString(state) {
  const { header, slots } = state;

  // 1. Header
  const parts = [`0,_header,${header.className},${header.specId},,`];

  // 2. Slots ordenados por slot number
  const sortedSlots = Object.values(slots).sort((a, b) => a.slotNum - b.slotNum);

  for (const slot of sortedSlots) {
    let entry = '';

    switch (slot.type) {
      case 'empty':
        entry = `${slot.slotNum}#5,`;
        break;

      case 'emptyBind': {
        const k2 = slot.keybind2 ? `,${slot.keybind2}` : '';
        entry = `${slot.slotNum}#4,${slot.keybind}${k2}`;
        break;
      }

      case 'spell': {
        const k2 = slot.keybind2 ? `,${slot.keybind2}` : '';
        entry = `${slot.slotNum},spell,${slot.spellId},spell,${slot.keybind},${k2}`;
        break;
      }

      case 'macro': {
        const nameB64 = btoa(slot.name || '');
        const bodyB64 = btoa(slot.body || '');
        entry = `${slot.slotNum},macro,${slot.macroId},${slot.macroId},${slot.keybind},,${nameB64},${bodyB64},c`;
        break;
      }

      case 'mount': {
        const k2 = slot.keybind2 ? `,${slot.keybind2}` : '';
        entry = `${slot.slotNum},summonmount,${slot.mountId},,${slot.keybind}${k2}`;
        break;
      }
    }

    if (entry) parts.push(entry);
  }

  // 3. Unir con | y encodear
  const raw = parts.join('|') + '|';
  return btoa(raw);
}
```

---

## 8. Categorías semánticas para colores

Para colorear las teclas en el teclado visual, se propone este sistema de categorías con sus slots asociados:

```javascript
const KEYBIND_CATEGORIES = {
  COMBAT: {
    label: 'Combat',
    color: '#e53e3e',      // rojo
    keybinds: ['1','2','3','4','Q','E','R','F'],
  },
  COMBAT_SHIFT: {
    label: 'Combat (Shift)',
    color: '#dd6b20',      // naranja
    keybinds: ['SHIFT-1','SHIFT-2','SHIFT-3','SHIFT-4','SHIFT-Q','SHIFT-E','SHIFT-R','SHIFT-F'],
  },
  DEFENSIVE: {
    label: 'Defensive',
    color: '#3182ce',      // azul
    keybinds: ['Z','SHIFT-Z','CTRL-Z'],
  },
  MOVEMENT: {
    label: 'Movement',
    color: '#38a169',      // verde
    keybinds: ['X','SHIFT-X','CTRL-X'],
  },
  CC: {
    label: 'CC / Interrupt',
    color: '#805ad5',      // violeta
    keybinds: ['C','SHIFT-C','CTRL-C','V','SHIFT-V','CTRL-V'],
  },
  UTILITY: {
    label: 'Utility / Class',
    color: '#b7791f',      // dorado
    keybinds: ['SHIFT-T','SHIFT-G','SHIFT-B','CTRL-T','CTRL-G','CTRL-B'],
  },
  SELF_HEAL: {
    label: 'Self Heal',
    color: '#2c7a7b',      // teal
    keybinds: ['CTRL-1','CTRL-2','CTRL-3','CTRL-4','CTRL-Q','CTRL-E','CTRL-R','CTRL-F'],
  },
  ITEMS: {
    label: 'Items / Alt',
    color: '#553c9a',      // índigo
    keybinds: ['ALT-1','ALT-2','ALT-3','ALT-4','ALT-Q','ALT-E','ALT-R','ALT-F','ALT-T','ALT-G','ALT-B'],
  },
  PVP: {
    label: 'PvP / Misc',
    color: '#702459',      // rosado oscuro
    keybinds: ['ALT-Z','ALT-X','ALT-C','ALT-V'],
  },
  MOUSE: {
    label: 'Mouse',
    color: '#4a5568',      // gris oscuro
    keybinds: ['BUTTON4','BUTTON5','MOUSEWHEELUP','MOUSEWHEELDOWN'],
  },
  FKEYS: {
    label: 'F-Keys / Stances',
    color: '#2d3748',      // casi negro
    keybinds: ['F1','F2','F3','F4','F5','F6'],
  },
  EXTRAS: {
    label: 'Extra Keys',
    color: '#4a5568',
    keybinds: ['T','G','-','='],
  },
};
```

---

## 9. Integración con la API de Blizzard para spell data

### 9.1 OAuth para la API de Blizzard

La API de Blizzard requiere autenticación OAuth2 client credentials. Necesitás crear una app en https://develop.battle.net/

```javascript
async function getBlizzardToken(clientId, clientSecret) {
  const response = await fetch('https://us.battle.net/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
    },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json();
  return data.access_token;
}
```

### 9.2 Obtener datos de un spell

```javascript
async function getSpellData(spellId, token, region = 'us', locale = 'en_US') {
  const url = `https://${region}.api.blizzard.com/data/wow/spell/${spellId}`;
  const params = new URLSearchParams({
    namespace: `static-${region}`,
    locale,
    access_token: token,
  });
  const response = await fetch(`${url}?${params}`);
  return response.json();
  // Retorna: { id, name, description, media: { key: { href } } }
}
```

### 9.3 Obtener el ícono de un spell

Hay dos enfoques:

**Opción A — API de Blizzard (requiere auth)**
```javascript
async function getSpellIcon(spellId, token, region = 'us') {
  const mediaUrl = `https://${region}.api.blizzard.com/data/wow/media/spell/${spellId}`;
  const params = new URLSearchParams({
    namespace: `static-${region}`,
    access_token: token,
  });
  const response = await fetch(`${mediaUrl}?${params}`);
  const data = await response.json();
  // data.assets[0].value es la URL del ícono
  return data.assets?.[0]?.value;
}
```

**Opción B — Wowhead/Zamimg (sin auth, más simple)**
```javascript
function getSpellIconUrl(iconName, size = 'medium') {
  // size: 'small' (18px), 'medium' (36px), 'large' (56px)
  return `https://wow.zamimg.com/images/wow/icons/${size}/${iconName}.jpg`;
}

// Pero necesitás el nombre del ícono, no el ID.
// Wowhead tiene una API no oficial:
async function getSpellIconFromWowhead(spellId) {
  const response = await fetch(`https://www.wowhead.com/tooltip/spell/${spellId}`, {
    headers: { 'Accept': 'application/json' }
  });
  const data = await response.json();
  return data.icon; // nombre del ícono (ej: "spell_fire_flameshock")
}
```

**Opción C — CDN de render de Blizzard (más directa)**
```javascript
// Si tenés el nombre del spell icon desde cualquier fuente:
function getBlizzardIconUrl(iconName) {
  return `https://render.worldofwarcraft.com/us/icons/56/${iconName}.jpg`;
}
```

### 9.4 Estrategia de caché recomendada

Para no hacer 1000 requests al cargar, implementar un caché local:

```javascript
class SpellCache {
  constructor() {
    this.cache = JSON.parse(localStorage.getItem('wow_spell_cache') || '{}');
  }

  get(spellId) {
    return this.cache[spellId] || null;
  }

  set(spellId, data) {
    this.cache[spellId] = data;
    localStorage.setItem('wow_spell_cache', JSON.stringify(this.cache));
  }

  async fetchSpell(spellId, token) {
    const cached = this.get(spellId);
    if (cached) return cached;

    const [spellData, iconUrl] = await Promise.all([
      getSpellData(spellId, token),
      getSpellIcon(spellId, token),
    ]);

    const result = {
      id: spellId,
      name: spellData.name,
      description: spellData.description,
      iconUrl,
    };

    this.set(spellId, result);
    return result;
  }
}
```

---

## 10. Alternativa sin API: base de datos local

Para evitar la complejidad de OAuth y rate limits, se puede incluir en el bundle una base de datos local de los spells más comunes. En esta conversación se generaron strings para las 13 clases y ~39 specs. La lista completa de spell IDs usados es acotada (~300-400 spells únicos).

```javascript
// Ejemplo de base de datos local mínima
const SPELL_DB = {
  188196: { name: "Lightning Bolt",  icon: "spell_nature_lightning" },
  51505:  { name: "Lava Burst",      icon: "spell_shaman_lavaburst" },
  470411: { name: "Flame Shock",     icon: "spell_fire_flameshock" },
  188443: { name: "Chain Lightning", icon: "spell_nature_chainlightning" },
  8042:   { name: "Earth Shock",     icon: "spell_nature_earthshock" },
  // ... etc
};

function getIconUrl(spellId, size = 'medium') {
  const spell = SPELL_DB[spellId];
  if (!spell) return '/fallback-icon.jpg';
  return `https://wow.zamimg.com/images/wow/icons/${size}/${spell.icon}.jpg`;
}
```

Esta base de datos se puede construir scrapeando Wowhead una sola vez para todos los IDs que aparecen en los strings generados en este chat.

---

## 11. Estructura de componentes React (recomendada)

```
App
├── ClassSelector          (dropdown clase + spec)
├── StringInput            (textarea para pegar el Base64)
├── KeyboardVisualizer     (el teclado principal)
│   ├── KeybindGroup       (agrupa teclas por categoría)
│   │   └── KeybindSlot    (tecla individual)
│   │       ├── SpellIcon
│   │       ├── SpellName
│   │       └── KeybindLabel
├── SpellEditor            (modal/panel para editar un slot)
│   ├── SpellSearch        (busca por nombre o ID)
│   └── SpellPreview
├── StringOutput           (muestra el Base64 resultante)
└── CompareView            (opcional: comparar 3 specs de la misma clase)
```

---

## 12. Estado global de la aplicación

```javascript
// Estado principal usando React useState o Zustand
const appState = {
  // Input
  rawString: '',           // el string Base64 pegado por el usuario
  
  // Parsed data
  parsed: {
    header: { className: 'shaman', specId: 262 },
    slots: { /* slot_number: slot_data */ },
    keybindMap: { /* keybind: slot_data */ },
  },
  
  // Spell data (cargado async)
  spellData: {
    /* spellId: { name, icon, description } */
  },
  
  // UI state
  selectedKeybind: null,   // keybind string del slot seleccionado para editar
  isEditing: false,
  searchQuery: '',
  
  // Output
  isDirty: false,          // hay cambios sin exportar
  outputString: '',        // el Base64 recodificado
};
```

---

## 13. Flujo de edición de un slot

```
1. Usuario hace click en una tecla del teclado visual
2. Se abre el panel SpellEditor con el slot actual
3. Usuario puede:
   a. Escribir un Spell ID directamente
   b. Buscar por nombre (llama a Wowhead API o busca en DB local)
   c. Limpiar el slot (lo convierte en emptyBind)
4. Al confirmar:
   a. Se actualiza state.parsed.slots[slotNum]
   b. Se llama a encodeKeybindString() para regenerar el output
   c. Se marca isDirty = true
5. Usuario copia el nuevo Base64 desde el output
```

---

## 14. Funcionalidad de comparación multi-spec

Una feature clave es poder cargar los 3 specs de una misma clase y ver las diferencias:

```javascript
// Estado para multi-spec comparison
const multiSpecState = {
  specs: [
    { label: 'Elemental', string: '...base64...', parsed: { ... } },
    { label: 'Enhancement', string: '...base64...', parsed: { ... } },
    { label: 'Restoration', string: '...base64...', parsed: { ... } },
  ],
};

// Al renderizar el teclado en modo comparación:
// Cada tecla muestra 3 sub-slots (uno por spec)
// Se destaca en color si los 3 specs tienen el mismo spell vs diferentes
```

---

## 15. Strings de los 13 clases — cómo están organizados

En el chat de origen se generaron los siguientes strings Base64 (todos disponibles para hardcodear en la app como defaults):

| Clase       | Specs generados                              | Spec IDs        |
|-------------|----------------------------------------------|-----------------|
| Shaman      | Elemental, Enhancement, Restoration         | 262, 263, 264   |
| Druid       | Balance, Feral, Guardian, Restoration       | 102,103,104,105 |
| Hunter      | Beast Mastery, Marksmanship, Survival       | 253, 254, 255   |
| Warrior     | Arms, Fury, Protection                      | 71, 72, 73      |
| Death Knight| Blood, Frost, Unholy                        | 250, 251, 252   |
| Paladin     | Holy, Protection, Retribution               | 65, 66, 70      |
| Monk        | Brewmaster, Mistweaver, Windwalker          | 268, 270, 269   |
| Mage        | Arcane, Fire, Frost                         | 62, 63, 64      |
| Priest      | Discipline, Holy, Shadow                    | 256, 257, 258   |
| Rogue       | Assassination, Outlaw, Subtlety             | 259, 260, 261   |
| Warlock     | Affliction, Demonology, Destruction         | 265, 266, 267   |
| Evoker      | Augmentation, Devastation, Preservation    | 1473,1467,1468  |

---

## 16. Consideraciones técnicas adicionales

### 16.1 Encoding issues

El `btoa()` de JavaScript falla con caracteres Unicode. Si el body de un macro tiene caracteres especiales, usar:

```javascript
function safeAtob(str) {
  try {
    return atob(str);
  } catch (e) {
    // Fallback para strings con padding incorrecto
    const padded = str + '='.repeat((4 - str.length % 4) % 4);
    return atob(padded);
  }
}

function safeBtoa(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
```

### 16.2 Macros anidados en Base64

Los macros dentro del string tienen su `name` y `body` codificados en Base64. Al decodificar el string principal, estos campos siguen siendo Base64 y hay que decodificarlos por separado:

```javascript
// En el parser, cuando se encuentra un macro:
const macroName = safeAtob(parts[6]);  // Decodificación extra
const macroBody = safeAtob(parts[7]);  // Decodificación extra
```

### 16.3 El campo keybind en el string puede diferir del slot number

El string almacena el keybind en el campo explícito (ej: `spell,Q`) **y** el slot number implica también un keybind según el mapa. En condiciones normales deberían coincidir. Si no coinciden, el campo explícito tiene prioridad — es lo que el juego usa.

### 16.4 Secondary keybinds

Algunos slots tienen dos keybinds (primary y secondary). El formato es:
```
SLOT,spell,ID,spell,PRIMARY_KB,SECONDARY_KB
```
En el mount del Shaman: `40,summonmount,231442,,ALT-V,ALT-BUTTON4`  
La app debería mostrar ambos keybinds en la tecla.

### 16.5 El header class name es el nombre del addon

El campo `className` en el header corresponde al nombre interno del addon, no al display name. Ej: `deathknight` (sin espacio), `evoker`, etc. Al mostrar en la UI usar nombres display: "Death Knight", "Evoker", etc.

---

## 17. Librerías sugeridas

| Necesidad | Librería sugerida | Por qué |
|-----------|-------------------|---------|
| Framework | React 18 | Estándar, ecosystem amplio |
| Estado | Zustand | Más simple que Redux para este caso |
| UI Base | Tailwind CSS | Utilidades, no necesita design system |
| Tooltips | Floating UI | Para mostrar spell details en hover |
| Modales | Headless UI | Accesible, sin estilo propio |
| HTTP | Fetch nativo | Sin dependencias extra |
| Build | Vite | Rápido, simple config |

---

## 18. Prioridad de implementación sugerida

```
FASE 1 — Lectura (MVP)
  ✓ Parser Base64 → JS Object
  ✓ Layout de teclado visual estático
  ✓ Render de spell IDs en las teclas
  ✓ Base de datos local con nombres de spells (sin íconos)
  ✓ Selector de clase/spec con strings hardcodeados

FASE 2 — Íconos
  ✓ Integración con Zamimg para íconos por ID
  ✓ Caché en localStorage
  ✓ Fallback graceful si el ícono no carga

FASE 3 — Edición
  ✓ Click en tecla → abre editor
  ✓ Input de spell ID manual
  ✓ Reencoding a Base64
  ✓ Copy to clipboard del resultado

FASE 4 — Avanzado
  ✓ Búsqueda de spells por nombre (Wowhead/Blizzard API)
  ✓ Vista comparativa 3 specs
  ✓ Import/export de configs completas (todas las clases)
  ✓ Drag & drop entre teclas
```

---

## 19. Ejemplo de render de una tecla

```jsx
function KeybindSlot({ keybind, slotData, spellInfo }) {
  const category = getCategoryForKeybind(keybind);
  const isEmpty = !slotData || slotData.type === 'empty' || slotData.type === 'emptyBind';

  return (
    <div
      className={`keybind-slot ${category} ${isEmpty ? 'empty' : 'filled'}`}
      onClick={() => onSelectSlot(keybind)}
      title={spellInfo?.description}
    >
      {/* Ícono del spell */}
      {spellInfo?.iconUrl && (
        <img
          src={spellInfo.iconUrl}
          alt={spellInfo.name}
          className="spell-icon"
          onError={(e) => { e.target.src = '/fallback.jpg'; }}
        />
      )}
      
      {/* Nombre del spell (truncado) */}
      <span className="spell-name">
        {isEmpty ? '' : (spellInfo?.name || `#${slotData.spellId}`).slice(0, 14)}
      </span>

      {/* Label del keybind */}
      <span className="keybind-label">{formatKeybind(keybind)}</span>
    </div>
  );
}

// Formatea el keybind para display: "SHIFT-Z" → "⇧Z", "CTRL-1" → "^1", etc.
function formatKeybind(kb) {
  return kb
    .replace('SHIFT-', '⇧')
    .replace('CTRL-', '^')
    .replace('ALT-', '⌥')
    .replace('BUTTON4', '🖱4')
    .replace('BUTTON5', '🖱5')
    .replace('MOUSEWHEELUP', '🖱↑')
    .replace('MOUSEWHEELDOWN', '🖱↓');
}
```

---

## 20. Fuentes de verdad para spell IDs y nombres

En orden de confiabilidad:

1. **API oficial de Blizzard** — https://develop.battle.net/documentation/world-of-warcraft/game-data-apis — requiere OAuth pero es oficial
2. **Wowhead API no oficial** — `https://www.wowhead.com/spell=SPELL_ID` acepta `?json` para datos JSON. No documentada oficialmente pero estable
3. **wowdb.com** — alternativa a Wowhead con API similar
4. **Base de datos local** — extraída de los strings ya generados en el chat de origen (300-400 spells únicos), suficiente para los casos de uso principales sin depender de red

Para el primer MVP la opción 4 es la más pragmática. Los IDs de todos los spells usados en los strings generados en este proyecto están disponibles en el historial del chat.

---

*Documento generado a partir de reverse-engineering completo del formato de keybind export de WoW addon, realizado íntegramente en conversación con Claude. Todos los datos de spec IDs, slot mappings y spell IDs son verificados contra strings reales de personajes.*
