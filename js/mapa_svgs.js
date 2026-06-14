const MAPA_SVGS = {  classic: `
<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g1" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#1a2a3a"/>
      <stop offset="100%" stop-color="#0a1018"/>
    </radialGradient>
    <filter id="glow1"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="320" height="220" fill="url(#g1)"/>
  <circle cx="20" cy="20" r="1" fill="#1e3a5a" opacity="0.5"/>
  <circle cx="300" cy="180" r="1" fill="#1e3a5a" opacity="0.5"/>
  <circle cx="160" cy="110" r="80" fill="#1a3050" opacity="0.1"/>
  <g fill="#2d4a20" stroke="#4a7030" stroke-width="0.8">
    <path d="M40,30 Q50,25 65,28 Q80,20 90,30 Q100,25 110,35 Q115,45 108,60 Q115,70 110,85 Q118,95 112,110 Q120,125 108,140 Q115,155 105,170 Q95,185 80,190 Q65,195 55,185 Q40,180 35,165 Q25,150 30,135 Q20,120 28,105 Q18,90 25,75 Q15,60 25,45 Z" fill="#2d5a1e"/>
    <ellipse cx="52" cy="22" rx="12" ry="7" fill="#1e4515"/>
    <path d="M65,60 L72,45 L79,60 L86,42 L93,58 L88,65 L72,62 Z" fill="#4a3a20" opacity="0.7"/>
    <rect x="55" y="100" width="40" height="20" fill="#3a5a1a" opacity="0.5" rx="2"/>
    <ellipse cx="68" cy="130" rx="8" ry="5" fill="#1a3a5a" opacity="0.6"/>
    <ellipse cx="90" cy="85" rx="5" ry="3" fill="#1a3a5a" opacity="0.5"/>
  </g>
  <g fill="#2d4820" stroke="#4a6830" stroke-width="0.8">
    <path d="M195,18 Q210,15 225,22 Q238,18 248,28 Q255,38 250,52 Q260,62 255,78 Q265,90 258,105 Q268,118 260,133 Q265,148 255,162 Q245,178 230,185 Q215,192 200,185 Q185,180 180,165 Q172,150 178,135 Q168,120 175,105 Q165,90 172,75 Q162,60 170,45 Q175,30 195,18 Z" fill="#2a5018"/>
    <path d="M200,25 Q220,22 235,30 Q230,45 215,48 Q200,45 195,30 Z" fill="#3a5a25"/>
    <ellipse cx="218" cy="70" rx="22" ry="18" fill="#3a4a15" opacity="0.6"/>
    <path d="M205,160 Q210,170 205,185 Q200,195 195,185 Q190,175 195,162 Z" fill="#1e5a18"/>
    <path d="M222,88 L228,75 L234,88 L240,78 L246,90 L238,96 L228,93 Z" fill="#4a3a20" opacity="0.6"/>
    <rect x="215" y="105" width="25" height="15" fill="#3a4a20" opacity="0.4" rx="2"/>
  </g>
  <ellipse cx="160" cy="18" rx="35" ry="12" fill="#3a4858" stroke="#5a6878" stroke-width="0.6"/>
  <path d="M140,15 L148,8 L155,15 L162,7 L168,15 L160,20 L148,18 Z" fill="#6a7888" opacity="0.7"/>
  <text x="152" y="115" font-family="serif" font-size="7" fill="#3a6a8a" opacity="0.8" text-anchor="middle">Gran Mar</text>
  <text x="152" y="123" font-family="serif" font-size="6" fill="#3a6a8a" opacity="0.6" text-anchor="middle">del Maelstrom</text>
  <circle cx="152" cy="130" r="18" fill="none" stroke="#2a5a7a" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.5"/>
  <circle cx="152" cy="130" r="10" fill="none" stroke="#1a4a6a" stroke-width="1" stroke-dasharray="3,2" opacity="0.4"/>
  <circle cx="152" cy="130" r="4" fill="#1a3a5a" opacity="0.6"/>
  <text x="72" y="115" font-family="serif" font-size="8" fill="#a0c870" opacity="0.9" text-anchor="middle" transform="rotate(-5,72,115)">Kalimdor</text>
  <text x="218" y="108" font-family="serif" font-size="7" fill="#a0c870" opacity="0.9" text-anchor="middle" transform="rotate(5,218,108)">Reinos del Este</text>
  <text x="160" y="21" font-family="serif" font-size="6" fill="#c0d0e0" opacity="0.8" text-anchor="middle">Rasganorte</text>
  <rect x="0" y="195" width="320" height="25" fill="#060408" opacity="0.8"/>
  <text x="160" y="211" font-family="serif" font-size="9" fill="#c89b3c" text-anchor="middle" letter-spacing="2">AZEROTH CLÁSICO</text>
</svg>
`,
,
  outland: `
<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g2" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#2a1520"/>
      <stop offset="100%" stop-color="#100810"/>
    </radialGradient>
  </defs>
  <rect width="320" height="220" fill="url(#g2)"/>
  <circle cx="15" cy="25" r="1.5" fill="#3a1a5a" opacity="0.6"/>
  <circle cx="290" cy="40" r="1" fill="#4a2060" opacity="0.5"/>
  <circle cx="50" cy="180" r="1.5" fill="#2a1040" opacity="0.6"/>
  <circle cx="280" cy="160" r="1" fill="#3a1850" opacity="0.5"/>
  <circle cx="160" cy="10" r="1" fill="#5a2070" opacity="0.4"/>
  <ellipse cx="30" cy="90" rx="18" ry="10" fill="#2a1808" stroke="#4a2010" stroke-width="0.5" opacity="0.6"/>
  <ellipse cx="290" cy="70" rx="15" ry="8" fill="#2a1808" opacity="0.5"/>
  <ellipse cx="160" cy="195" rx="20" ry="8" fill="#1a1008" opacity="0.4"/>
  <g>
    <path d="M195,50 Q225,40 255,55 Q275,65 270,90 Q280,100 268,115 Q275,128 262,140 Q250,155 230,158 Q210,162 198,150 Q185,140 188,125 Q178,112 185,98 Q175,85 182,70 Z" fill="#5a2010" stroke="#7a3018" stroke-width="0.8"/>
    <path d="M230,65 Q240,58 250,68 L248,75 L235,72 Z" fill="#7a3520" opacity="0.7"/>
    <path d="M110,70 Q135,58 160,65 Q180,72 182,90 Q188,108 175,120 Q162,132 142,135 Q122,138 108,128 Q92,118 95,100 Q88,85 98,75 Z" fill="#1a4a2a" stroke="#2a6a3a" stroke-width="0.8"/>
    <ellipse cx="130" cy="100" rx="5" ry="8" fill="#5a8a3a" opacity="0.7"/>
    <ellipse cx="148" cy="95" rx="4" ry="7" fill="#4a7a2a" opacity="0.6"/>
    <ellipse cx="160" cy="105" rx="4" ry="6" fill="#5a8a3a" opacity="0.5"/>
    <path d="M98,25 Q128,15 158,22 Q175,30 173,50 Q178,65 163,73 Q148,80 128,77 Q108,73 98,62 Q85,52 88,38 Z" fill="#3a6a18" stroke="#5a8a28" stroke-width="0.8"/>
    <ellipse cx="118" cy="35" rx="10" ry="5" fill="#4a7a20"/>
    <ellipse cx="148" cy="30" rx="8" ry="4" fill="#4a7a20"/>
    <path d="M55,45 Q80,30 100,38 Q108,50 100,65 Q88,75 68,75 Q48,70 45,58 Z" fill="#4a3820" stroke="#6a5030" stroke-width="0.8"/>
    <path d="M65,52 L72,38 L79,52 L85,42 L90,55 L78,60 L65,58 Z" fill="#6a5025" opacity="0.8"/>
    <path d="M170,148 Q200,140 225,152 Q240,165 232,182 Q220,195 200,198 Q180,200 168,190 Q155,178 158,165 Z" fill="#1a0a28" stroke="#3a1848" stroke-width="0.8"/>
    <circle cx="198" cy="172" r="20" fill="#0a3a08" opacity="0.4"/>
    <ellipse cx="198" cy="172" rx="10" ry="8" fill="#1a6a10" opacity="0.5"/>
    <path d="M120,132 Q145,125 165,132 Q175,145 168,162 Q155,175 135,177 Q115,178 105,165 Q95,152 100,140 Z" fill="#2a3818" stroke="#3a5025" stroke-width="0.7"/>
    <ellipse cx="252" cy="38" rx="35" ry="22" fill="#1a1840" stroke="#2a2860" stroke-width="0.8" opacity="0.9"/>
    <circle cx="252" cy="38" r="15" fill="#0a0a30" opacity="0.7"/>
    <circle cx="252" cy="38" r="8" fill="none" stroke="#5a40a0" stroke-width="1.5" stroke-dasharray="3,2" opacity="0.8"/>
    <circle cx="252" cy="38" r="4" fill="#3a2070" opacity="0.6"/>
  </g>
  <circle cx="160" cy="110" r="120" fill="#002200" opacity="0.08"/>
  <text x="230" y="105" font-family="serif" font-size="7" fill="#e05030" text-anchor="middle">Peninsula del Fuego Infernal</text>
  <text x="140" y="100" font-family="serif" font-size="6.5" fill="#30a060" text-anchor="middle">Zangarmarsh</text>
  <text x="130" y="48" font-family="serif" font-size="7" fill="#80c040" text-anchor="middle">Nagrand</text>
  <text x="72" y="57" font-family="serif" font-size="6" fill="#a08060" text-anchor="middle">Montanas Filos</text>
  <text x="197" y="172" font-family="serif" font-size="6.5" fill="#8040c0" text-anchor="middle">Valle Luna de Sombra</text>
  <text x="137" y="155" font-family="serif" font-size="6" fill="#506030" text-anchor="middle">Bosque Terokkar</text>
  <text x="252" y="40" font-family="serif" font-size="6" fill="#8060e0" text-anchor="middle">Tormenteria</text>
  <rect x="0" y="195" width="320" height="25" fill="#060408" opacity="0.8"/>
  <text x="160" y="211" font-family="serif" font-size="9" fill="#c89b3c" text-anchor="middle" letter-spacing="2">TERRALLENDE - The Burning Crusade</text>
</svg>
``
,
  wotlk: `
<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g3" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0a1828"/><stop offset="100%" stop-color="#05080f"/></linearGradient>
    <radialGradient id="ice3" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#a0c8e0" stop-opacity="0.15"/><stop offset="100%" stop-color="transparent"/></radialGradient>
  </defs>
  <rect width="320" height="220" fill="url(#g3)"/>
  <circle cx="160" cy="110" r="140" fill="url(#ice3)"/>
  <path d="M215,125 Q245,118 268,132 Q280,145 272,165 Q258,180 238,185 Q218,188 205,175 Q192,162 196,145 Z" fill="#2a3a4a" stroke="#3a5060" stroke-width="0.8"/>
  <path d="M220,128 L228,118 L234,128 L240,120 L246,130" fill="none" stroke="#4a5a6a" stroke-width="1.5" opacity="0.8"/>
  <path d="M52,130 Q80,118 108,125 Q125,135 122,155 Q118,172 100,180 Q80,186 60,180 Q40,173 38,158 Q35,142 48,132 Z" fill="#2a3838" stroke="#3a5050" stroke-width="0.8"/>
  <path d="M108,108 Q140,95 172,100 Q195,108 198,128 Q200,148 182,158 Q162,168 138,165 Q115,162 102,148 Q88,134 92,118 Z" fill="#283040" stroke="#384258" stroke-width="0.8"/>
  <path d="M130,130 Q140,125 155,130 Q160,138 150,143 Q138,145 130,140 Z" fill="#5a5a4a" opacity="0.5"/>
  <ellipse cx="143" cy="135" rx="3" ry="5" fill="#6a6a5a" opacity="0.4"/>
  <path d="M188,95 Q215,85 242,92 Q258,102 255,122 Q250,138 233,143 Q215,148 200,138 Q185,128 184,112 Z" fill="#1a3818" stroke="#285028" stroke-width="0.8"/>
  <path d="M202,108 L206,98 L210,108 Z" fill="#2a5a20"/><path d="M215,104 L219,94 L223,104 Z" fill="#2a5a20"/><path d="M230,110 L234,100 L238,110 Z" fill="#2a5a20"/>
  <path d="M228,55 Q255,45 278,55 Q292,68 284,85 Q272,100 252,103 Q232,105 220,93 Q208,80 212,65 Z" fill="#3a2818" stroke="#5a3a28" stroke-width="0.8"/>
  <path d="M245,72 L250,60 L255,72 Z" fill="#5a4030"/><path d="M260,78 L264,68 L268,78 Z" fill="#5a4030"/>
  <path d="M148,42 Q178,25 208,32 Q228,42 226,62 Q222,78 205,83 Q185,88 165,80 Q145,72 142,58 Z" fill="#404858" stroke="#585870" stroke-width="0.8"/>
  <path d="M158,62 L168,38 L178,62 L186,45 L196,62 L190,68 L168,65 Z" fill="#686878" opacity="0.8"/>
  <circle cx="172" cy="42" r="5" fill="#8090a0" opacity="0.4"/>
  <path d="M115,18 Q148,5 182,12 Q200,22 198,42 Q195,55 178,60 Q158,65 138,58 Q118,50 112,35 Z" fill="#182030" stroke="#283848" stroke-width="0.8"/>
  <path d="M148,38 L152,18 L156,38" fill="none" stroke="#a0c0e0" stroke-width="1.5" opacity="0.8"/>
  <path d="M155,40 L158,22 L161,40" fill="none" stroke="#90b0d0" stroke-width="1.2" opacity="0.7"/>
  <circle cx="152" cy="18" r="3" fill="#c0e0ff" opacity="0.7"/>
  <path d="M112,80 Q140,72 162,78 Q170,88 165,100 Q155,110 138,112 Q120,113 110,103 Q100,92 102,82 Z" fill="#1a2838" stroke="#2a3a50" stroke-width="0.6"/>
  <circle cx="137" cy="93" r="6" fill="#2a4060" opacity="0.5"/>
  <path d="M58,55 Q85,42 112,50 Q125,62 120,80 Q115,94 97,98 Q77,100 60,90 Q44,78 45,65 Z" fill="#1a4018" stroke="#2a5828" stroke-width="0.8"/>
  <text x="80" y="158" font-family="serif" font-size="6.5" fill="#80b0c0" text-anchor="middle">Tundra Aullante</text>
  <text x="150" y="138" font-family="serif" font-size="6.5" fill="#a0b0c0" text-anchor="middle">Vuelo del Dragon</text>
  <text x="220" y="155" font-family="serif" font-size="6.5" fill="#8090a0" text-anchor="middle">Fiordo Aullante</text>
  <text x="220" y="118" font-family="serif" font-size="6" fill="#60a060" text-anchor="middle">Colinas Grizzly</text>
  <text x="253" y="78" font-family="serif" font-size="6" fill="#a07050" text-anchor="middle">Zul'Drak</text>
  <text x="183" y="58" font-family="serif" font-size="6.5" fill="#9090b0" text-anchor="middle">Cumbres Tormentosas</text>
  <text x="153" y="38" font-family="serif" font-size="7" fill="#c0d8f0" text-anchor="middle">Rasganorte</text>
  <text x="85" y="72" font-family="serif" font-size="6" fill="#60a060" text-anchor="middle">Sholazar</text>
  <text x="137" y="95" font-family="serif" font-size="5.5" fill="#5080a0" text-anchor="middle">Crystalsong</text>
  <rect x="0" y="195" width="320" height="25" fill="#060408" opacity="0.8"/>
  <text x="160" y="211" font-family="serif" font-size="8.5" fill="#c89b3c" text-anchor="middle" letter-spacing="1.5">RASGANORTE - Wrath of the Lich King</text>
</svg>
``
,
  cata: `
<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g4" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#1a0808"/><stop offset="100%" stop-color="#080404"/></radialGradient>
    <radialGradient id="lava4" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#c83000" stop-opacity="0.3"/><stop offset="100%" stop-color="transparent"/></radialGradient>
  </defs>
  <rect width="320" height="220" fill="url(#g4)"/>
  <circle cx="160" cy="110" r="130" fill="url(#lava4)" opacity="0.5"/>
  <path d="M160,10 Q165,50 155,90 Q162,130 158,170 Q163,190 160,210" fill="none" stroke="#c84020" stroke-width="2" opacity="0.4" stroke-dasharray="5,3"/>
  <path d="M20,110 Q70,105 110,112 Q150,118 200,108 Q240,100 300,112" fill="none" stroke="#c84020" stroke-width="1.5" opacity="0.3" stroke-dasharray="4,3"/>
  <path d="M45,25 Q75,12 100,22 Q115,35 108,55 Q100,70 80,75 Q58,77 44,65 Q32,52 35,38 Z" fill="#1a4018" stroke="#2a6028" stroke-width="0.8"/>
  <path d="M72,40 L78,22 L84,40 Z" fill="#3a6028" opacity="0.9"/>
  <circle cx="78" cy="20" r="8" fill="#1a5018" stroke="#3a8028" stroke-width="1" opacity="0.8"/>
  <ellipse cx="80" cy="175" rx="55" ry="30" fill="#082840" stroke="#0a3858" stroke-width="0.8"/>
  <circle cx="70" cy="170" r="4" fill="#0a4060" opacity="0.6"/><circle cx="95" cy="178" r="3" fill="#0a4060" opacity="0.5"/>
  <path d="M60,165 Q63,158 60,152" fill="none" stroke="#1a6080" stroke-width="2" opacity="0.7"/>
  <path d="M85,168 Q88,160 85,153" fill="none" stroke="#1a6080" stroke-width="2" opacity="0.6"/>
  <ellipse cx="160" cy="112" rx="55" ry="38" fill="#1a1220" stroke="#2a1a30" stroke-width="1"/>
  <ellipse cx="160" cy="112" rx="35" ry="22" fill="#100a18" stroke="#1a1228" stroke-width="0.6"/>
  <rect x="155" y="90" width="10" height="44" fill="#3a2a48" stroke="#5a3a68" stroke-width="0.8"/>
  <path d="M152,90 L160,78 L168,90 Z" fill="#5a3a68"/>
  <path d="M135,105 L130,95 L140,100 Z" fill="#4a3060"/><path d="M185,108 L190,98 L180,103 Z" fill="#4a3060"/>
  <path d="M215,145 Q248,135 272,148 Q285,162 275,180 Q262,195 240,198 Q218,200 206,188 Q194,175 198,160 Z" fill="#4a3a10" stroke="#6a5a20" stroke-width="0.8"/>
  <path d="M238,155 L248,140 L258,155 Z" fill="#7a6820" opacity="0.8"/><path d="M220,162 L228,150 L236,162 Z" fill="#7a6820" opacity="0.7"/>
  <path d="M210,28 Q240,18 270,28 Q285,40 278,60 Q268,75 248,78 Q228,80 215,68 Q202,55 205,40 Z" fill="#3a2010" stroke="#5a3018" stroke-width="0.8"/>
  <ellipse cx="245" cy="52" rx="12" ry="8" fill="#4a2808" opacity="0.7"/>
  <ellipse cx="48" cy="112" rx="25" ry="15" fill="#1e3a10" stroke="#2a5018" stroke-width="0.6"/>
  <path d="M40,112 L48,98 L56,112 Z" fill="#8a2808" opacity="0.8"/><circle cx="48" cy="98" r="3" fill="#c84020" opacity="0.7"/>
  <circle cx="160" cy="112" r="15" fill="none" stroke="#c84020" stroke-width="2" stroke-dasharray="3,2" opacity="0.7"/>
  <circle cx="160" cy="112" r="8" fill="none" stroke="#e86030" stroke-width="1.5" opacity="0.6"/>
  <text x="73" y="47" font-family="serif" font-size="7" fill="#70c050" text-anchor="middle">Hyjal</text>
  <text x="80" y="177" font-family="serif" font-size="7" fill="#30a0c0" text-anchor="middle">Vashj'ir</text>
  <text x="160" y="114" font-family="serif" font-size="7" fill="#a080d0" text-anchor="middle">Tierras Profundas</text>
  <text x="242" y="168" font-family="serif" font-size="7" fill="#c0a030" text-anchor="middle">Uldum</text>
  <text x="244" y="50" font-family="serif" font-size="6.5" fill="#a06040" text-anchor="middle">Tierras Crepusculo</text>
  <text x="48" y="113" font-family="serif" font-size="6" fill="#80a050" text-anchor="middle">Kezan</text>
  <rect x="0" y="195" width="320" height="25" fill="#060408" opacity="0.8"/>
  <text x="160" y="211" font-family="serif" font-size="9" fill="#c89b3c" text-anchor="middle" letter-spacing="2">CATACLISMO - Cataclysm</text>
</svg>
``
,
  mop: `
<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#081208"/><stop offset="100%" stop-color="#0a1010"/></linearGradient>
    <radialGradient id="mist5" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#c8e0c0" stop-opacity="0.1"/><stop offset="100%" stop-color="transparent"/></radialGradient>
  </defs>
  <rect width="320" height="220" fill="url(#g5)"/><circle cx="160" cy="110" r="130" fill="url(#mist5)"/>
  <path d="M200,35 Q232,25 260,38 Q278,52 272,75 Q265,95 244,103 Q222,110 204,100 Q185,90 184,70 Q183,50 196,38 Z" fill="#1a4a18" stroke="#2a6a28" stroke-width="0.8"/>
  <path d="M230,55 L235,42 L240,55 L238,58 L232,58 Z" fill="#5a8a3a"/><rect x="231" y="58" width="9" height="8" fill="#4a7a2a"/>
  <path d="M118,130 Q148,118 178,126 Q195,138 190,158 Q182,175 160,180 Q138,183 120,172 Q102,160 104,143 Z" fill="#2a5018" stroke="#3a7028" stroke-width="0.8"/>
  <path d="M135,145 Q137,135 135,125" fill="none" stroke="#4a7030" stroke-width="2"/>
  <path d="M148,148 Q150,138 148,128" fill="none" stroke="#4a7030" stroke-width="2"/>
  <path d="M162,144 Q164,134 162,124" fill="none" stroke="#4a7030" stroke-width="2"/>
  <path d="M108,22 Q140,8 170,16 Q188,26 185,48 Q180,65 160,72 Q138,78 118,68 Q100,58 100,40 Z" fill="#304840" stroke="#405860" stroke-width="0.8"/>
  <path d="M118,48 L128,28 L138,48 L145,35 L155,52 L148,60 L128,56 Z" fill="#506070" opacity="0.8"/>
  <circle cx="130" cy="28" r="5" fill="#708090" opacity="0.5"/><circle cx="147" cy="35" r="4" fill="#708090" opacity="0.4"/>
  <path d="M48,80 Q80,68 108,78 Q122,90 118,110 Q113,128 95,133 Q73,136 55,125 Q35,113 35,97 Z" fill="#283828" stroke="#384828" stroke-width="0.8"/>
  <ellipse cx="75" cy="108" rx="15" ry="10" fill="#181020" opacity="0.7"/><circle cx="75" cy="108" r="5" fill="#080810" opacity="0.8"/>
  <path d="M170,162 Q200,155 228,165 Q242,178 235,195 Q222,208 202,210 Q182,212 168,200 Q155,188 158,173 Z" fill="#1a3a18" stroke="#285028" stroke-width="0.7"/>
  <ellipse cx="290" cy="78" rx="20" ry="14" fill="#2a3820" stroke="#3a5030" stroke-width="0.6"/>
  <path d="M282,78 L288,65 L294,78 Z" fill="#4a5a30"/>
  <ellipse cx="282" cy="165" rx="18" ry="12" fill="#3a2818" stroke="#5a3828" stroke-width="0.6"/>
  <path d="M52,48 Q68,35 82,42 Q88,52 80,60 Q68,65 55,60 Z" fill="#382818" stroke="#504030" stroke-width="0.6"/>
  <path d="M62,48 L66,38 L70,48 Z" fill="#605040"/>
  <path d="M30,110 Q80,100 130,108 Q180,116 230,105" fill="none" stroke="#a0c8a0" stroke-width="1" opacity="0.2" stroke-dasharray="8,4"/>
  <path d="M50,140 Q100,130 150,138" fill="none" stroke="#a0c8a0" stroke-width="1" opacity="0.15" stroke-dasharray="6,3"/>
  <text x="230" y="72" font-family="serif" font-size="7" fill="#70c060" text-anchor="middle">Bosque de Jade</text>
  <text x="150" y="152" font-family="serif" font-size="7" fill="#90c860" text-anchor="middle">Valle Cuatro Vientos</text>
  <text x="140" y="45" font-family="serif" font-size="7" fill="#90b0a0" text-anchor="middle">Cima Kun-Lai</text>
  <text x="78" y="103" font-family="serif" font-size="6.5" fill="#507048" text-anchor="middle">Estepas Townlong</text>
  <text x="200" y="183" font-family="serif" font-size="6.5" fill="#508050" text-anchor="middle">Marismas Krasarang</text>
  <text x="67" y="52" font-family="serif" font-size="6" fill="#705040" text-anchor="middle">Pandaria</text>
  <rect x="0" y="195" width="320" height="25" fill="#060408" opacity="0.8"/>
  <text x="160" y="211" font-family="serif" font-size="9" fill="#c89b3c" text-anchor="middle" letter-spacing="2">PANDARIA - Mists of Pandaria</text>
</svg>
``
,
  draenor: `
<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#180c08"/><stop offset="100%" stop-color="#100808"/></linearGradient></defs>
  <rect width="320" height="220" fill="url(#g6)"/>
  <path d="M35,22 Q65,10 92,20 Q105,32 100,52 Q92,68 72,72 Q50,74 36,62 Q22,50 25,35 Z" fill="#282838" stroke="#383850" stroke-width="0.8"/>
  <path d="M50,40 L58,22 L66,40 L72,30 L78,42 L70,48 L58,45 Z" fill="#484858" opacity="0.8"/>
  <path d="M82,45 L88,32 L94,45 Z" fill="#8a2010"/><circle cx="88" cy="32" r="4" fill="#c83010" opacity="0.8"/>
  <path d="M100,30 Q130,18 160,25 Q175,36 172,55 Q168,70 150,76 Q130,80 112,72 Q95,63 95,48 Z" fill="#2a3a18" stroke="#3a5228" stroke-width="0.8"/>
  <path d="M125,48 L130,35 L135,48" fill="none" stroke="#5a4a30" stroke-width="2" opacity="0.7"/>
  <path d="M145,52 L150,40 L155,52" fill="none" stroke="#5a4a30" stroke-width="1.5" opacity="0.6"/>
  <path d="M155,60 Q182,50 205,60 Q218,72 212,92 Q205,108 186,112 Q165,115 152,103 Q138,90 140,75 Z" fill="#382818" stroke="#504030" stroke-width="0.8"/>
  <circle cx="180" cy="85" r="12" fill="#281820" stroke="#401828" stroke-width="1"/>
  <path d="M174,80 L180,70 L186,80" fill="none" stroke="#602030" stroke-width="1.5" opacity="0.8"/>
  <path d="M200,108 Q228,98 255,108 Q268,120 262,142 Q254,160 235,165 Q215,168 200,158 Q185,147 186,130 Z" fill="#3a2818" stroke="#5a3828" stroke-width="0.8"/>
  <path d="M215,120 L220,105 L225,120 Z" fill="#5a4030"/><path d="M232,118 L237,104 L242,118 Z" fill="#5a4030"/><path d="M248,125 L252,112 L256,125 Z" fill="#5a4030"/>
  <path d="M42,88 Q72,76 102,84 Q118,96 115,118 Q110,136 90,142 Q68,147 50,136 Q30,124 30,108 Z" fill="#2a5018" stroke="#3a7028" stroke-width="0.8"/>
  <ellipse cx="62" cy="90" rx="12" ry="5" fill="#3a6020" stroke="#4a7830" stroke-width="0.5"/>
  <ellipse cx="88" cy="86" rx="10" ry="4" fill="#3a6020"/><ellipse cx="100" cy="92" rx="8" ry="3.5" fill="#3a6020"/>
  <ellipse cx="75" cy="118" rx="10" ry="8" fill="#706080" stroke="#907890" stroke-width="0.8" opacity="0.8"/>
  <path d="M110,148 Q142,138 168,148 Q182,162 175,180 Q163,195 143,198 Q122,200 108,188 Q92,175 95,162 Z" fill="#1a0a28" stroke="#2a1238" stroke-width="0.8"/>
  <circle cx="138" cy="168" r="3" fill="#5a30a0" opacity="0.7"/><circle cx="152" cy="158" r="2" fill="#7040b0" opacity="0.6"/><circle cx="128" cy="178" r="2" fill="#4020a0" opacity="0.5"/>
  <path d="M140,162 L145,150 L150,162 L147,165 L143,165 Z" fill="#6040a0" opacity="0.8"/>
  <text x="62" y="45" font-family="serif" font-size="7" fill="#9090c0" text-anchor="middle">Cresta Frostfire</text>
  <text x="132" y="52" font-family="serif" font-size="6.5" fill="#70a050" text-anchor="middle">Gorgrond</text>
  <text x="180" y="85" font-family="serif" font-size="6.5" fill="#a07050" text-anchor="middle">Talador</text>
  <text x="230" y="133" font-family="serif" font-size="6.5" fill="#a08060" text-anchor="middle">Aguijones de Arak</text>
  <text x="73" y="115" font-family="serif" font-size="7" fill="#80c050" text-anchor="middle">Nagrand</text>
  <text x="138" y="170" font-family="serif" font-size="7" fill="#9050d0" text-anchor="middle">Valle Luna Sombra</text>
  <rect x="0" y="195" width="320" height="25" fill="#060408" opacity="0.8"/>
  <text x="160" y="211" font-family="serif" font-size="9" fill="#c89b3c" text-anchor="middle" letter-spacing="2">DRAENOR - Warlords of Draenor</text>
</svg>
``
,
  legion: `
<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g7" cx="50%" cy="40%" r="65%"><stop offset="0%" stop-color="#10080a"/><stop offset="100%" stop-color="#080408"/></radialGradient>
    <radialGradient id="fel7" cx="50%" cy="50%" r="40%"><stop offset="0%" stop-color="#008800" stop-opacity="0.15"/><stop offset="100%" stop-color="transparent"/></radialGradient>
  </defs>
  <rect width="320" height="220" fill="url(#g7)"/><circle cx="160" cy="110" r="100" fill="url(#fel7)"/>
  <path d="M205,18 Q235,10 260,22 Q275,34 268,55 Q258,72 238,77 Q218,80 205,68 Q192,56 194,40 Z" fill="#282838" stroke="#384858" stroke-width="0.8"/>
  <rect x="222" y="42" width="6" height="14" fill="#404858" rx="1"/><rect x="234" y="40" width="6" height="16" fill="#404858" rx="1"/>
  <path d="M218,50 L218,42 L224,42" fill="none" stroke="#606878" stroke-width="1.5"/>
  <path d="M125,15 Q155,5 182,15 Q195,28 190,50 Q183,65 163,70 Q143,73 128,62 Q113,50 115,32 Z" fill="#303828" stroke="#425248" stroke-width="0.8"/>
  <path d="M138,45 L148,22 L158,45 L163,35 L170,48 L162,55 L148,50 Z" fill="#505840" opacity="0.9"/>
  <circle cx="148" cy="22" r="5" fill="#787870" opacity="0.6"/>
  <path d="M60,48 Q88,35 115,45 Q128,58 123,80 Q116,96 95,100 Q74,103 58,91 Q42,78 44,62 Z" fill="#1a3818" stroke="#285028" stroke-width="0.8"/>
  <path d="M85,60 Q88,48 85,38" fill="none" stroke="#2a6020" stroke-width="3"/><circle cx="85" cy="38" r="10" fill="#1a5018" stroke="#2a7028" stroke-width="1.2"/>
  <circle cx="78" cy="45" r="6" fill="#1a5018" opacity="0.7"/><circle cx="92" cy="43" r="7" fill="#1a5018" opacity="0.7"/>
  <path d="M180,95 Q210,85 238,95 Q252,108 245,128 Q236,145 215,148 Q193,150 180,138 Q166,125 168,110 Z" fill="#182038" stroke="#283048" stroke-width="0.8"/>
  <path d="M198,110 L202,98 L206,110 L204,112 L200,112 Z" fill="#304870" opacity="0.7"/>
  <path d="M218,108 L222,97 L226,108 L224,110 L220,110 Z" fill="#304870" opacity="0.6"/>
  <path d="M95,118 Q128,108 158,115 Q175,126 170,148 Q163,165 143,170 Q122,174 104,163 Q86,150 87,133 Z" fill="#1a1830" stroke="#282848" stroke-width="0.8"/>
  <ellipse cx="130" cy="140" rx="22" ry="15" fill="#0a0820" stroke="#382858" stroke-width="1.2"/>
  <ellipse cx="130" cy="140" rx="14" ry="9" fill="#080618" stroke="#4a3068" stroke-width="0.8"/>
  <path d="M122,128 L125,118 L128,128" fill="none" stroke="#6040a0" stroke-width="1.5" opacity="0.8"/>
  <path d="M132,126 L135,116 L138,126" fill="none" stroke="#6040a0" stroke-width="1.5" opacity="0.7"/>
  <ellipse cx="160" cy="72" rx="20" ry="12" fill="#303860" stroke="#485880" stroke-width="1"/>
  <path d="M154,65 L160,55 L166,65" fill="none" stroke="#8090c0" stroke-width="2" opacity="0.8"/>
  <circle cx="160" cy="63" r="4" fill="#9090d0" opacity="0.6"/>
  <circle cx="240" cy="52" r="8" fill="#00aa00" opacity="0.1"/><circle cx="200" cy="120" r="6" fill="#00aa00" opacity="0.08"/>
  <ellipse cx="200" cy="185" rx="28" ry="16" fill="#180c20" stroke="#280c30" stroke-width="0.8"/>
  <path d="M192,178 L200,165 L208,178 Z" fill="#280c30" opacity="0.8"/>
  <text x="233" y="47" font-family="serif" font-size="7" fill="#8090b0" text-anchor="middle">Stormheim</text>
  <text x="154" y="38" font-family="serif" font-size="7" fill="#9090a0" text-anchor="middle">Alta Montana</text>
  <text x="84" y="72" font-family="serif" font-size="7" fill="#60a050" text-anchor="middle">Val'sharah</text>
  <text x="212" y="120" font-family="serif" font-size="7" fill="#5070a0" text-anchor="middle">Azsuna</text>
  <text x="128" y="142" font-family="serif" font-size="7" fill="#8060c0" text-anchor="middle">Suramar</text>
  <text x="160" y="69" font-family="serif" font-size="6" fill="#c0c0e0" text-anchor="middle">Dalaran</text>
  <text x="200" y="185" font-family="serif" font-size="6" fill="#8050a0" text-anchor="middle">Tumba de Sargeras</text>
  <rect x="0" y="195" width="320" height="25" fill="#060408" opacity="0.8"/>
  <text x="160" y="211" font-family="serif" font-size="9" fill="#c89b3c" text-anchor="middle" letter-spacing="2">ISLAS ROTAS - Legion</text>
</svg>
``
,
  bfa: `
<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g8" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#080c18"/><stop offset="100%" stop-color="#050810"/></linearGradient>
    <radialGradient id="ocean8" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#0a2040" stop-opacity="0.3"/><stop offset="100%" stop-color="transparent"/></radialGradient>
  </defs>
  <rect width="320" height="220" fill="url(#g8)"/><circle cx="160" cy="110" r="130" fill="url(#ocean8)"/>
  <path d="M42,75 Q72,62 98,72 Q112,85 108,108 Q102,126 80,132 Q58,136 42,123 Q26,110 28,92 Z" fill="#2a3040" stroke="#3a4258" stroke-width="0.8"/>
  <path d="M58,108 L62,100 L66,108" fill="none" stroke="#5a6878" stroke-width="1.5"/><ellipse cx="62" cy="110" rx="6" ry="3" fill="#3a4a5a" opacity="0.7"/>
  <path d="M28,135 Q55,125 80,135 Q92,148 85,168 Q74,182 55,185 Q35,187 22,175 Q10,162 13,148 Z" fill="#251828" stroke="#352038" stroke-width="0.8"/>
  <path d="M42,148 L46,132 L50,148 Z" fill="#403048"/><path d="M62,150 L66,135 L70,150 Z" fill="#403048"/>
  <circle cx="52" cy="162" r="6" fill="none" stroke="#804080" stroke-width="1" opacity="0.6"/>
  <path d="M35,42 Q65,28 92,38 Q108,50 103,72 Q96,88 75,92 Q52,94 38,82 Q22,68 25,53 Z" fill="#1a2a38" stroke="#283848" stroke-width="0.8"/>
  <rect x="60" y="50" width="8" height="22" fill="#304050" rx="1"/><path d="M56,50 L64,42 L72,50 Z" fill="#405060"/>
  <path d="M195,50 Q228,38 255,50 Q272,65 267,90 Q258,110 235,118 Q212,124 195,112 Q178,98 180,78 Z" fill="#3a2808" stroke="#5a3a10" stroke-width="0.8"/>
  <path d="M218,80 L232,52 L246,80 L244,85 L220,85 Z" fill="#6a4818"/><path d="M225,85 L232,52 L239,85" fill="#7a5820" opacity="0.6"/><rect x="230" y="80" width="4" height="10" fill="#8a6828"/>
  <path d="M162,118 Q188,108 210,118 Q222,132 216,152 Q206,168 186,172 Q165,174 153,162 Q140,148 142,133 Z" fill="#1a2818" stroke="#253520" stroke-width="0.8"/>
  <ellipse cx="182" cy="145" rx="14" ry="10" fill="#280808" opacity="0.7"/><circle cx="182" cy="145" r="6" fill="#400808" opacity="0.6"/><circle cx="182" cy="145" r="3" fill="#600808" opacity="0.5"/>
  <path d="M218,148 Q248,138 272,150 Q285,165 276,185 Q264,200 244,202 Q223,203 210,190 Q197,177 200,163 Z" fill="#4a3a18" stroke="#6a5228" stroke-width="0.8"/>
  <path d="M225,165 Q235,158 245,165 Q240,170 230,170 Z" fill="#6a5228" opacity="0.6"/>
  <path d="M248,168 Q258,162 268,168 Q262,173 252,173 Z" fill="#6a5228" opacity="0.5"/>
  <path d="M240,175 L245,165 L250,175 Z" fill="#805a30"/>
  <ellipse cx="115" cy="45" rx="18" ry="12" fill="#304040" stroke="#405050" stroke-width="0.7"/>
  <circle cx="115" cy="45" r="7" fill="none" stroke="#508080" stroke-width="1.5"/><circle cx="115" cy="45" r="3" fill="#406070"/>
  <ellipse cx="160" cy="110" rx="25" ry="18" fill="#080820" stroke="#101838" stroke-width="0.8" opacity="0.9"/>
  <circle cx="160" cy="110" r="10" fill="#050510" opacity="0.8"/>
  <path d="M155,106 L160,98 L165,106" fill="none" stroke="#204060" stroke-width="1.5" opacity="0.7"/>
  <text x="68" y="103" font-family="serif" font-size="7" fill="#8090a8" text-anchor="middle">Tiragarde</text>
  <text x="52" y="155" font-family="serif" font-size="7" fill="#906090" text-anchor="middle">Drustvar</text>
  <text x="62" y="65" font-family="serif" font-size="7" fill="#6080a0" text-anchor="middle">Stormsong</text>
  <text x="225" y="83" font-family="serif" font-size="7" fill="#c09050" text-anchor="middle">Zuldazar</text>
  <text x="185" y="143" font-family="serif" font-size="7" fill="#907050" text-anchor="middle">Nazmir</text>
  <text x="243" y="172" font-family="serif" font-size="7" fill="#c0a060" text-anchor="middle">Vol'dun</text>
  <text x="115" y="47" font-family="serif" font-size="6" fill="#70c0b0" text-anchor="middle">Mechagon</text>
  <text x="160" y="112" font-family="serif" font-size="6" fill="#305080" text-anchor="middle">Nazjatar</text>
  <rect x="0" y="195" width="320" height="25" fill="#060408" opacity="0.8"/>
  <text x="160" y="211" font-family="serif" font-size="8.5" fill="#c89b3c" text-anchor="middle" letter-spacing="1.5">KUL TIRAS & ZANDALAR - Battle for Azeroth</text>
</svg>
``
,
  shadowlands: `
<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g9" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="#0a0818"/><stop offset="100%" stop-color="#050408"/></radialGradient>
    <radialGradient id="maw9" cx="50%" cy="50%" r="40%"><stop offset="0%" stop-color="#080018" stop-opacity="0.8"/><stop offset="100%" stop-color="transparent"/></radialGradient>
  </defs>
  <rect width="320" height="220" fill="url(#g9)"/>
  <circle cx="25" cy="20" r="1" fill="#8060c0" opacity="0.5"/><circle cx="295" cy="30" r="1" fill="#9070d0" opacity="0.4"/>
  <circle cx="50" cy="170" r="1" fill="#7050b0" opacity="0.5"/><circle cx="270" cy="175" r="1.5" fill="#8060c0" opacity="0.4"/>
  <circle cx="160" cy="5" r="1" fill="#a080e0" opacity="0.6"/><circle cx="80" cy="80" r="1" fill="#6050a0" opacity="0.3"/><circle cx="240" cy="140" r="1" fill="#7060b0" opacity="0.4"/>
  <path d="M35,25 Q68,12 95,25 Q112,38 107,62 Q100,78 78,83 Q55,86 38,73 Q22,58 25,42 Z" fill="#0a2818" stroke="#102818" stroke-width="0.8"/>
  <circle cx="58" cy="48" r="8" fill="#0a4018" opacity="0.8"/><circle cx="75" cy="42" r="6" fill="#0a4018" opacity="0.7"/><circle cx="90" cy="52" r="5" fill="#0a4018" opacity="0.6"/>
  <circle cx="52" cy="58" r="2" fill="#30a040" opacity="0.7"/><circle cx="78" cy="62" r="2" fill="#20c030" opacity="0.6"/><circle cx="65" cy="38" r="1.5" fill="#40d050" opacity="0.8"/>
  <path d="M60,42 Q62,36 60,30" fill="none" stroke="#208030" stroke-width="2"/><circle cx="60" cy="30" r="7" fill="#104028" stroke="#208030" stroke-width="1"/>
  <path d="M195,15 Q228,5 255,18 Q270,30 265,52 Q257,68 236,73 Q215,77 200,64 Q184,50 186,33 Z" fill="#282838" stroke="#485870" stroke-width="0.8"/>
  <ellipse cx="218" cy="35" rx="12" ry="5" fill="#3a4858" stroke="#5a6878" stroke-width="0.5"/>
  <ellipse cx="238" cy="28" rx="10" ry="4" fill="#3a4858" opacity="0.8"/><ellipse cx="250" cy="40" rx="8" ry="3.5" fill="#404858" opacity="0.7"/>
  <circle cx="228" cy="33" r="3" fill="#c8a840" opacity="0.6"/><circle cx="248" cy="38" r="2" fill="#c8a840" opacity="0.5"/>
  <path d="M55,102 Q88,90 115,100 Q130,114 124,136 Q116,152 94,157 Q70,160 52,148 Q34,134 36,118 Z" fill="#1a1808" stroke="#2a2808" stroke-width="0.8"/>
  <ellipse cx="88" cy="128" rx="18" ry="12" fill="#003800" opacity="0.5"/>
  <path d="M75,118 L80,108 L85,118" fill="none" stroke="#5a5a28" stroke-width="1.5"/>
  <path d="M95,115 L100,105 L105,115" fill="none" stroke="#5a5a28" stroke-width="1.5"/>
  <path d="M195,130 Q228,120 255,132 Q268,145 260,167 Q250,182 228,186 Q205,189 192,177 Q178,162 180,147 Z" fill="#200818" stroke="#301020" stroke-width="0.8"/>
  <path d="M215,142 L219,125 L223,142 L221,144 L217,144 Z" fill="#401820"/>
  <path d="M228,140 L232,122 L236,140 L234,142 L230,142 Z" fill="#401820"/>
  <path d="M240,143 L244,128 L248,143 L246,145 L242,145 Z" fill="#401820"/>
  <path d="M210,115 Q215,110 218,115 Q215,118 212,118 Z" fill="#200810" opacity="0.7"/>
  <path d="M235,112 Q240,108 243,112 Q240,115 237,115 Z" fill="#200810" opacity="0.6"/>
  <circle cx="160" cy="112" r="35" fill="#020108" stroke="#100808" stroke-width="1.5"/>
  <circle cx="160" cy="112" r="22" fill="#010106" stroke="#080406" stroke-width="1"/>
  <circle cx="160" cy="112" r="12" fill="#000004" stroke="#060208" stroke-width="0.8"/>
  <ellipse cx="160" cy="112" rx="8" ry="5" fill="#080008" stroke="#200020" stroke-width="0.8"/>
  <ellipse cx="160" cy="112" rx="4" ry="2.5" fill="#300030" opacity="0.8"/>
  <path d="M160,77 Q163,90 160,105" fill="none" stroke="#300030" stroke-width="1" opacity="0.5"/>
  <path d="M125,112 Q138,110 148,112" fill="none" stroke="#300030" stroke-width="1" opacity="0.5"/>
  <path d="M172,112 Q182,110 195,112" fill="none" stroke="#300030" stroke-width="1" opacity="0.4"/>
  <circle cx="160" cy="70" r="12" fill="#303030" stroke="#505050" stroke-width="1.2"/>
  <circle cx="160" cy="70" r="7" fill="#202020" stroke="#404040" stroke-width="0.8"/>
  <path d="M157,63 L160,57 L163,63" fill="none" stroke="#707070" stroke-width="1.5" opacity="0.8"/>
  <text x="65" y="52" font-family="serif" font-size="7" fill="#30b050" text-anchor="middle">Ardenweald</text>
  <text x="225" y="43" font-family="serif" font-size="7" fill="#8090b8" text-anchor="middle">Bastion</text>
  <text x="85" y="128" font-family="serif" font-size="7" fill="#90a030" text-anchor="middle">Maldraxxus</text>
  <text x="225" y="155" font-family="serif" font-size="7" fill="#c05060" text-anchor="middle">Revendreth</text>
  <text x="160" y="114" font-family="serif" font-size="6.5" fill="#600060" text-anchor="middle">La Fauces</text>
  <text x="160" y="72" font-family="serif" font-size="6" fill="#909090" text-anchor="middle">Oribos</text>
  <rect x="0" y="195" width="320" height="25" fill="#060408" opacity="0.8"/>
  <text x="160" y="211" font-family="serif" font-size="9" fill="#c89b3c" text-anchor="middle" letter-spacing="2">SHADOWLANDS - Shadowlands</text>
</svg>
``
,
  dragonflight: `
<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g10" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0a0c08"/><stop offset="100%" stop-color="#080a06"/></linearGradient>
    <radialGradient id="drag10" cx="50%" cy="40%" r="55%"><stop offset="0%" stop-color="#e86000" stop-opacity="0.12"/><stop offset="100%" stop-color="transparent"/></radialGradient>
  </defs>
  <rect width="320" height="220" fill="url(#g10)"/><circle cx="160" cy="100" r="120" fill="url(#drag10)"/>
  <path d="M50,148 Q90,135 130,142 Q150,152 148,172 Q142,188 120,194 Q98,198 75,192 Q52,185 40,172 Q28,158 35,148 Z" fill="#3a1808" stroke="#5a2810" stroke-width="0.8"/>
  <path d="M75,155 L82,140 L89,155 Z" fill="#8a2808" opacity="0.9"/><circle cx="82" cy="140" r="4" fill="#c83010" opacity="0.8"/>
  <ellipse cx="108" cy="165" rx="6" ry="8" fill="#802808" stroke="#c04010" stroke-width="0.8"/><ellipse cx="120" cy="170" rx="5" ry="7" fill="#6a2008"/>
  <path d="M142,130 Q175,118 208,128 Q222,140 218,162 Q210,178 188,183 Q165,187 146,177 Q127,165 126,148 Z" fill="#2a4818" stroke="#3a6828" stroke-width="0.8"/>
  <path d="M155,145 Q170,140 185,145 Q182,155 168,157 Q154,155 155,145 Z" fill="#3a5820" opacity="0.5"/>
  <path d="M180,138 Q195,134 210,138 Q208,148 195,150 Q181,148 180,138 Z" fill="#3a5820" opacity="0.4"/>
  <path d="M35,62 Q68,48 98,58 Q115,72 110,95 Q102,112 80,117 Q57,120 40,108 Q23,95 25,78 Z" fill="#182838" stroke="#284858" stroke-width="0.8"/>
  <path d="M55,80 L62,65 L69,80 L66,84 L58,84 Z" fill="#304858"/><ellipse cx="85" cy="95" rx="10" ry="6" fill="#1a3848" opacity="0.7"/>
  <path d="M198,55 Q232,42 260,55 Q275,68 270,92 Q262,108 240,115 Q218,118 202,106 Q186,92 188,75 Z" fill="#282010" stroke="#403808" stroke-width="0.8"/>
  <path d="M222,78 L228,62 L234,78 L232,82 L224,82 Z" fill="#504830"/>
  <path d="M240,75 L246,60 L252,75 L250,79 L242,79 Z" fill="#504830"/>
  <circle cx="225" cy="95" r="10" fill="none" stroke="#806040" stroke-width="1.5" opacity="0.7"/>
  <circle cx="225" cy="95" r="5" fill="#403020" stroke="#604828" stroke-width="1"/>
  <ellipse cx="280" cy="165" rx="28" ry="18" fill="#201808" stroke="#302808" stroke-width="0.7"/>
  <path d="M272,158 L280,145 L288,158 Z" fill="#402808" opacity="0.8"/>
  <ellipse cx="160" cy="105" rx="30" ry="20" fill="#100c08" stroke="#201408" stroke-width="0.8" opacity="0.9"/>
  <circle cx="145" cy="105" r="3" fill="#4a8040" opacity="0.6"/><circle cx="160" cy="100" r="4" fill="#3a7050" opacity="0.5"/><circle cx="175" cy="108" r="3" fill="#4a8040" opacity="0.6"/>
  <ellipse cx="95" cy="42" rx="30" ry="18" fill="#082008" stroke="#0a3010" stroke-width="0.7" opacity="0.8"/>
  <circle cx="82" cy="40" r="5" fill="#0a3010" opacity="0.7"/><circle cx="98" cy="35" r="4" fill="#0a3010" opacity="0.6"/><circle cx="112" cy="42" r="5" fill="#0a3010" opacity="0.7"/>
  <path d="M95,42 Q97,34 95,26" fill="none" stroke="#105028" stroke-width="2.5"/><circle cx="95" cy="26" r="8" fill="#082818" stroke="#104820" stroke-width="1.2"/>
  <path d="M48,128 Q55,120 62,125 Q58,130 52,132 Z" fill="#602008" opacity="0.5"/>
  <path d="M230,130 Q237,122 244,127 Q240,132 234,134 Z" fill="#604010" opacity="0.4"/>
  <text x="95" y="165" font-family="serif" font-size="7" fill="#c06030" text-anchor="middle">Costas del Despertar</text>
  <text x="180" y="158" font-family="serif" font-size="7" fill="#70c050" text-anchor="middle">Llanuras Ohn'ahran</text>
  <text x="65" y="88" font-family="serif" font-size="7" fill="#5080a0" text-anchor="middle">La Extension Azur</text>
  <text x="228" y="82" font-family="serif" font-size="7" fill="#a09060" text-anchor="middle">Thaldraszus</text>
  <text x="160" y="106" font-family="serif" font-size="6" fill="#60a060" text-anchor="middle">Cav. Zaralek</text>
  <text x="95" y="40" font-family="serif" font-size="6.5" fill="#30a050" text-anchor="middle">Sueno Esmeralda</text>
  <text x="280" y="165" font-family="serif" font-size="6" fill="#906040" text-anchor="middle">Alcance Prohibido</text>
  <rect x="0" y="195" width="320" height="25" fill="#060408" opacity="0.8"/>
  <text x="160" y="211" font-family="serif" font-size="9" fill="#c89b3c" text-anchor="middle" letter-spacing="2">ISLAS DRAGON - Dragonflight</text>
</svg>
``
,
  tww: `
<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g11" cx="50%" cy="50%" r="65%"><stop offset="0%" stop-color="#080a10"/><stop offset="100%" stop-color="#040608"/></radialGradient>
    <radialGradient id="nerub11" cx="50%" cy="60%" r="50%"><stop offset="0%" stop-color="#102030" stop-opacity="0.4"/><stop offset="100%" stop-color="transparent"/></radialGradient>
  </defs>
  <rect width="320" height="220" fill="url(#g11)"/><circle cx="160" cy="120" r="110" fill="url(#nerub11)"/>
  <path d="M65,18 Q105,5 150,12 Q185,20 195,42 Q200,62 185,78 Q168,92 145,95 Q118,98 95,88 Q72,77 62,58 Q52,40 62,25 Z" fill="#2a3828" stroke="#3a5038" stroke-width="0.8"/>
  <path d="M112,52 L118,40 L124,52 L122,56 L114,56 Z" fill="#506048"/><rect x="110" y="56" width="16" height="10" fill="#405038" rx="1"/>
  <path d="M140,60 L148,42 L156,60 L160,52 L168,65 L160,70 L148,67 Z" fill="#485850" opacity="0.9"/>
  <circle cx="148" cy="42" r="5" fill="#708080" opacity="0.5"/>
  <path d="M50,110 Q88,97 125,105 Q142,118 138,142 Q130,160 108,165 Q83,168 62,157 Q40,145 38,128 Z" fill="#181c20" stroke="#252830" stroke-width="0.8"/>
  <circle cx="88" cy="132" r="15" fill="none" stroke="#304860" stroke-width="1.5"/><circle cx="88" cy="132" r="8" fill="#1a2830" stroke="#253848" stroke-width="1"/><circle cx="88" cy="132" r="3" fill="#203040"/>
  <path d="M88,117 L90,112 L88,113 L86,112 Z" fill="#304050"/><path d="M103,132 L108,130 L107,132 L108,134 Z" fill="#304050"/>
  <path d="M88,147 L90,152 L88,151 L86,152 Z" fill="#304050"/><path d="M73,132 L68,130 L69,132 L68,134 Z" fill="#304050"/>
  <path d="M142,108 Q175,97 205,108 Q218,122 212,145 Q203,162 182,167 Q160,171 143,159 Q126,146 128,130 Z" fill="#101420" stroke="#181a28" stroke-width="0.8"/>
  <line x1="175" y1="110" x2="175" y2="165" stroke="#c0a840" stroke-width="3" opacity="0.3"/>
  <ellipse cx="175" cy="138" rx="20" ry="25" fill="#c0a840" opacity="0.05"/>
  <path d="M168,128 L175,115 L182,128 L180,132 L170,132 Z" fill="#303048" stroke="#404060" stroke-width="0.5"/>
  <rect x="170" y="132" width="10" height="14" fill="#282840" rx="1"/><circle cx="175" cy="118" r="5" fill="#c8a840" opacity="0.4"/>
  <path d="M60,172 Q95,160 130,170 Q148,183 143,200 Q133,215 108,217 Q82,218 62,205 Q42,192 42,178 Z" fill="#0c0810" stroke="#180c18" stroke-width="0.8"/>
  <path d="M75,185 Q90,178 105,185 Q100,192 88,193 Q75,192 75,185 Z" fill="#180c20" opacity="0.7"/>
  <path d="M88,180 L88,175 M82,182 L78,178 M94,182 L98,178 M80,188 L75,188 M96,188 L101,188" fill="none" stroke="#2a1030" stroke-width="0.8" opacity="0.7"/>
  <circle cx="88" cy="185" r="12" fill="none" stroke="#200c28" stroke-width="0.8" stroke-dasharray="2,2" opacity="0.6"/>
  <ellipse cx="108" cy="188" rx="6" ry="4" fill="#0a0015" stroke="#200028" stroke-width="0.8" opacity="0.8"/>
  <circle cx="108" cy="188" r="2.5" fill="#400050" opacity="0.7"/>
  <path d="M165,170 Q195,162 225,172 Q238,185 230,200 Q218,212 198,213 Q178,214 165,202 Q152,190 154,178 Z" fill="#0e0c18" stroke="#181020" stroke-width="0.7"/>
  <path d="M178,178 L182,165 L186,178 Z" fill="#200c28"/><path d="M195,176 L199,162 L203,176 Z" fill="#200c28"/><path d="M210,180 L214,167 L218,180 Z" fill="#200c28"/>
  <ellipse cx="160" cy="78" rx="18" ry="10" fill="#302818" stroke="#403820" stroke-width="0.6"/>
  <path d="M148,78 Q152,74 156,78 Q160,82 164,78 Q168,74 172,78" fill="none" stroke="#504030" stroke-width="1" opacity="0.6"/>
  <text x="120" y="55" font-family="serif" font-size="7" fill="#80a080" text-anchor="middle">Isla de Dorn</text>
  <text x="85" y="132" font-family="serif" font-size="7" fill="#6090b0" text-anchor="middle">Las Profundidades</text>
  <text x="172" y="138" font-family="serif" font-size="7" fill="#c8a840" text-anchor="middle">Hallowfall</text>
  <text x="92" y="188" font-family="serif" font-size="7" fill="#8050a0" text-anchor="middle">Azj-Kahet</text>
  <text x="196" y="188" font-family="serif" font-size="6.5" fill="#6040a0" text-anchor="middle">Nerubia</text>
  <text x="160" y="79" font-family="serif" font-size="6" fill="#a08060" text-anchor="middle">Los Terrenios</text>
  <rect x="0" y="195" width="320" height="25" fill="#060408" opacity="0.8"/>
  <text x="160" y="211" font-family="serif" font-size="9" fill="#c89b3c" text-anchor="middle" letter-spacing="1.5">KHAZ ALGAR - The War Within</text>
</svg>
``

};
