import {useMemo,useState} from "react";
import {ArrowRight,Check,ChevronLeft,ChevronRight,Eye,FlaskConical,
 Grid3X3,MousePointer2,Move,Play,RotateCcw,Undo2,Wallet,X} from "lucide-react";
import {dnaFromPolitronNumber} from "@/polytron/politronicNumber";
import {gradientPair,gradientCss,LATIN_SOURCES,GREEK_DESTINATIONS,
 perceptualDistance} from "@/polytron/gradientPalettes";
import {gradientSamples,cssSRGB,type GradientOrder} from "@/polytron/gradientFacePalette";
import {allHexes,calculateLife,groupOf,periodOf,hexKey,hexRing,
 paletteEnergyBonus,intrinsicEnergy,recoveryEnergy,makeLifePreset,
 startingBalance,GROUP_LABELS,GROUP_CODES,STARTING_ENERGY,LIFE_RADIUS,
 type LifePreset,type CellPrediction
} from "@/polytron/mindeleevLife";
import "./MindeleevLifeLab.css";

type Action="place"|"inspect"|"move"|"recycle";
type Snapshot={
 board:Map<string,number>;credits:number;generation:number;
 discovered:Set<number>;event:string;
};
type Game=Snapshot&{history:Snapshot[];lastBorn:number;lastDeparted:number};
const GROUP_COLORS=["#e9a6d7","#8dcfec","#ffc08b","#b9dd85","#b5a5f6"] as const;
const POSITIONS=allHexes();
const SIZE=33;
const CX=450,CY=374;
const points=(x:number,y:number,size=SIZE)=>Array.from({length:6},(_,i)=>{
 const a=(Math.PI/180)*(60*i-90);
 return `${(x+size*Math.cos(a)).toFixed(1)},${(y+size*Math.sin(a)).toFixed(1)}`;
}).join(" ");
const coordinates=(q:number,r:number)=>({
 x:CX+Math.sqrt(3)*SIZE*(q+r/2),
 y:CY+1.5*SIZE*r
});
const makeGame=(bonus:number,preset:LifePreset):Game=>{
 const board=makeLifePreset(preset);
 return {board,credits:startingBalance(board,bonus),generation:0,
  discovered:new Set(board.values()),
  event:preset==="empty"?"Griglia vuota. Richiama i primi Polytroni.":
   "Configurazione iniziale pronta. Osserva le previsioni e avanza di una generazione.",
  history:[],lastBorn:0,lastDeparted:0};
};
const snapshot=(game:Game):Snapshot=>({
 board:game.board,credits:game.credits,generation:game.generation,
 discovered:game.discovered,event:game.event
});
const fnum=(v:number)=>v.toLocaleString("it-IT");
const describe=(n:number)=>`#${n} · ${dnaFromPolitronNumber(n)} · gruppo ${GROUP_CODES[groupOf(n)-1]}, periodo ${periodOf(n)}`;

function MiniStat({label,value,kind}:{label:string;value:string|number;kind?:string}){
 return <div className={"ml-stat "+(kind??"")}>
  <span>{label}</span><strong>{value}</strong>
 </div>;
}
export default function MindeleevLifeLab(){
 const [row,setRow]=useState(2),[col,setCol]=useState(4);
 const [order,setOrder]=useState<GradientOrder>("contrast");
 const [preset,setPreset]=useState<LifePreset>("nucleus");
 const pair=gradientPair(row,col);
 const distance=perceptualDistance(pair.primary.hex,pair.secondary.hex);
 const bonus=paletteEnergyBonus(distance);
 const [game,setGame]=useState<Game>(()=>makeGame(bonus,"nucleus"));
 const [pickNumber,setPickNumber]=useState(1);
 const [action,setAction]=useState<Action>("place");
 const [selectedKey,setSelectedKey]=useState("0,0");
 const [moveSource,setMoveSource]=useState<string|null>(null);
 const [forecast,setForecast]=useState(true);
 const plan=useMemo(()=>calculateLife(game.board,bonus),[game.board,bonus]);
 const chosen=plan.predictions.get(selectedKey);
 const previewColors=gradientSamples(pair.primary.hex,pair.secondary.hex,6,order).map(cssSRGB);
 const gradientStops=order==="linear"?
  <><stop offset="0%" stopColor={pair.primary.hex}/><stop offset="100%" stopColor={pair.secondary.hex}/></>:
  previewColors.flatMap((color,i)=>[
   <stop key={i+"a"} offset={(i/previewColors.length*100)+"%"} stopColor={color}/>,
   <stop key={i+"b"} offset={((i+1)/previewColors.length*100)+"%"} stopColor={color}/>
  ]);
 const changePalette=(nextRow:number,nextCol:number)=>{
  if(row===nextRow&&col===nextCol)return;
  const next=gradientPair(nextRow,nextCol);
  const nextBonus=paletteEnergyBonus(perceptualDistance(next.primary.hex,next.secondary.hex));
  setRow(nextRow);setCol(nextCol);
  setGame(makeGame(nextBonus,preset));setMoveSource(null);setSelectedKey("0,0");
 };
 const load=(kind:LifePreset)=>{
  setPreset(kind);setGame(makeGame(bonus,kind));setMoveSource(null);
  setSelectedKey("0,0");
 };
 const commit=(next:Omit<Game,"history">)=>{
  setGame({...next,history:[...game.history,snapshot(game)].slice(-40)});
 };
 const step=()=>{
  const discovered=new Set(game.discovered);
  for(const p of plan.born)discovered.add(p.n);
  commit({board:plan.next,credits:game.credits+plan.recovery,
   generation:game.generation+1,discovered,
   lastBorn:plan.born.length,lastDeparted:plan.departed.length,
   event:`Generazione ${game.generation+1}: ${plan.born.length} sintesi,
    ${plan.departed.length} ritorni, +${plan.recovery} energia recuperata.`});
  setMoveSource(null);
 };
 const undo=()=>{
  if(!game.history.length)return;
  const previous=game.history[game.history.length-1];
  setGame({...previous,history:game.history.slice(0,-1),lastBorn:0,lastDeparted:0});
  setMoveSource(null);
 };
 const notify=(event:string)=>setGame(g=>({...g,event}));
 const onHex=(key:string)=>{
  const n=game.board.get(key);
  setSelectedKey(key);
  if(action==="inspect")return;
  if(action==="place"){
   if(n!==undefined){notify("Cella occupata: scegli una cella libera oppure usa Recupera.");return;}
   const cost=intrinsicEnergy(pickNumber,bonus);
   if(game.credits<cost){notify(`Energia insufficiente: servono ${cost} unità, ne hai ${game.credits}.`);return;}
   const board=new Map(game.board);board.set(key,pickNumber);
   const discovered=new Set(game.discovered);discovered.add(pickNumber);
   commit({...game,board,discovered,credits:game.credits-cost,
    event:`Richiamato ${describe(pickNumber)} (−${cost} energia).`,
    lastBorn:0,lastDeparted:0});
  }else if(action==="recycle"){
   if(n===undefined){notify("Nessun Polytrone da recuperare in questa cella.");return;}
   const board=new Map(game.board);board.delete(key);
   const recovered=recoveryEnergy(n,bonus);
   commit({...game,board,credits:game.credits+recovered,
    event:`#${n} torna a casa: +${recovered} energia.`,
    lastBorn:0,lastDeparted:0});
  }else if(action==="move"){
   if(moveSource===null){
    if(n===undefined){notify("Scegli prima un Polytrone da spostare.");return;}
    setMoveSource(key);notify(`Selezionato #${n}. Scegli una cella libera di destinazione.`);
   }else if(moveSource===key){
    setMoveSource(null);notify("Spostamento annullato.");
   }else if(n!==undefined){
    setMoveSource(key);notify(`Selezionato invece #${n}. Scegli una cella libera.`);
   }else{
    const sourceN=game.board.get(moveSource);
    if(sourceN===undefined){setMoveSource(null);return;}
    const board=new Map(game.board);board.delete(moveSource);board.set(key,sourceN);
    commit({...game,board,event:`Spostato #${sourceN}, senza costo energetico.`,
     lastBorn:0,lastDeparted:0});
    setMoveSource(null);
   }
  }
 };
 const selectAction=(next:Action)=>{setAction(next);setMoveSource(null);};
 const statusName=(cell:CellPrediction)=>({
  empty:"Nessuna nascita",survive:"Sopravvivenza",depart:"Ritorno a casa",
  birth:"Nuova sintesi", "no-majority":"Gruppi incompatibili",
  "no-energy":"Energia insufficiente"
 }[cell.outcome]);
 const emptyHexes=POSITIONS.length-game.board.size;
 return <main className="ml-page">
  <header className="ml-hero">
   <div className="ml-brand"><span className="ml-brand-dot"/> MINDELEEV / ESPERIMENTO 40
    <span className="ml-brand-sep">·</span> AUTOMI CELLULARI</div>
   <div className="ml-hero-grid">
    <div>
     <h1>Mindeleev <em>Life</em></h1>
     <p>Un automa esagonale in cui i Polytroni nascono, sopravvivono e tornano a casa.
      <strong> Sei vicini, regole visibili, sintesi per +5.</strong></p>
     <div className="ml-links">
      <a href={import.meta.env.BASE_URL+"?experiment=polytron-periodic"}>Tavola periodica <ArrowRight size={14}/></a>
      <a href={import.meta.env.BASE_URL+"?experiment=gradient-palettes"}>Chromatica <ArrowRight size={14}/></a>
     </div>
    </div>
    <div className="ml-hero-equation"><small>LEGGE DI SINTESI</small>
     <div>Ν <span>→</span> Ν + 5</div>
     <p>Il gruppo resta invariato.<br/>Il periodo aumenta di uno.</p>
    </div>
   </div>
  </header>
  <section className="ml-overview" aria-label="Stato della simulazione">
   <MiniStat label="GENERAZIONE" value={game.generation}/>
   <MiniStat label="ENERGIA DISPONIBILE" value={fnum(game.credits)} kind="ml-stat-energy"/>
   <MiniStat label="POLYTRONI SUL MUTATRON" value={game.board.size}/>
   <MiniStat label="CELLE LIBERE" value={emptyHexes}/>
   <MiniStat label="SCOPERTI NELLA SESSIONE" value={game.discovered.size}/>
  </section>
  <div className="ml-layout">
   <div className="ml-main">
    <section className="ml-board-panel">
     <div className="ml-panel-top">
      <div><div className="ml-eyebrow">MUTATRON / GRIGLIA ESAGONALE</div>
       <h2>La prossima generazione</h2>
       <p>Seleziona una cella per leggere il calcolo. Le anteprime mostrano che cosa accadrà premendo <b>Avanza</b>.</p>
      </div>
      <label className="ml-forecast-switch">
       <input type="checkbox" checked={forecast} onChange={e=>setForecast(e.target.checked)}/>
       <Eye size={15}/> Previsioni
      </label>
     </div>
     <div className="ml-toolbar" role="group" aria-label="Interazione con il Mutatron">
      <button className={action==="place"?"ml-active":""} onClick={()=>selectAction("place")}><MousePointer2 size={15}/> Richiama</button>
      <button className={action==="move"?"ml-active":""} onClick={()=>selectAction("move")}><Move size={15}/> Sposta</button>
      <button className={action==="recycle"?"ml-active":""} onClick={()=>selectAction("recycle")}><RotateCcw size={15}/> Recupera</button>
      <button className={action==="inspect"?"ml-active":""} onClick={()=>selectAction("inspect")}><Eye size={15}/> Esamina</button>
     </div>
     <div className="ml-board-frame">
      <svg className="ml-board" viewBox="0 0 900 745" role="group"
       aria-label="Mutatron: 127 celle esagonali selezionabili, con sei vicini">
       <defs>
        <linearGradient id="ml-poly-fill" x1="0%" y1="0%" x2="100%" y2="100%">{gradientStops}</linearGradient>
        <radialGradient id="ml-center-halo"><stop stopColor="#2f796e" stopOpacity=".32"/>
         <stop offset="100%" stopColor="#2f796e" stopOpacity="0"/></radialGradient>
       </defs>
       <circle cx={CX} cy={CY} r="185" fill="url(#ml-center-halo)"/>
       {POSITIONS.map(({q,r})=>{
        const key=hexKey(q,r),cell=plan.predictions.get(key)!;
        const n=cell.occupant,ring=hexRing(q,r);
        const {x,y}=coordinates(q,r);
        const selected=selectedKey===key,source=moveSource===key;
        const birth=forecast&&cell.outcome==="birth"&&n===undefined;
        const leaving=forecast&&cell.outcome==="depart";
        const unpowered=forecast&&cell.outcome==="no-energy";
        const stroke=n!==undefined?GROUP_COLORS[groupOf(n)-1]:"#446375";
        const label=n===undefined?
         `Cella ${key} vuota. ${cell.reason}`:
         `Cella ${key}, Polytrone ${describe(n)}. ${cell.reason}`;
        return <g key={key} className={"ml-hex"+(selected?" ml-selected":"")+
         (birth?" ml-birth":"")+(leaving?" ml-leaving":"")+
         (source?" ml-source":"")}
         role="button" tabIndex={0} aria-label={label}
         onClick={()=>onHex(key)}
         onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onHex(key);}}}>
         <polygon points={points(x,y,SIZE-1.2)}
          fill={n!==undefined?"url(#ml-poly-fill)":ring%2?"#102b3a":"#132f40"}
          stroke={selected?"#eaffd4":birth?"#63f1a1":leaving?"#fa9d98":stroke}
          strokeWidth={selected?3.3:birth?3:1.25}
          strokeDasharray={birth?"4 4":leaving?"3 4":undefined}
          opacity={leaving?.56:1}/>
         {n!==undefined?
          <>
           <circle cx={x} cy={y-15} r="4" fill={GROUP_COLORS[groupOf(n)-1]} stroke="#102130" strokeWidth="1"/>
           <text x={x} y={y+8} className="ml-hex-number" textAnchor="middle">{n}</text>
           <text x={x} y={y+21} className="ml-hex-group" textAnchor="middle">
            {GROUP_CODES[groupOf(n)-1]} · P{periodOf(n)}</text>
          </>:
          birth?
           <><text x={x} y={y+5} className="ml-hex-birth" textAnchor="middle">
            +{cell.next}</text><text x={x} y={y+18} className="ml-hex-group" textAnchor="middle">
             SINTESI</text></>:
           unpowered?<text x={x} y={y+5} className="ml-hex-muted" textAnchor="middle">E−</text>:
           <circle cx={x} cy={y} r="1.7" fill="#608296" fillOpacity=".6"/>
         }
         <title>{label}</title>
        </g>;
       })}
      </svg>
      <div className="ml-board-legend">
       <span><i className="ml-legend-birth"/> Sintesi prevista</span>
       <span><i className="ml-legend-leave"/> Torna a casa</span>
       <span><i className="ml-legend-stay"/> Sopravvive</span>
       <span><i className="ml-legend-block"/> Energia insufficiente</span>
      </div>
     </div>
     <div className="ml-stepbar">
      <button className="ml-step-primary" type="button" onClick={step}>
       <Play size={17} fill="currentColor"/> Avanza di una generazione <ArrowRight size={16}/>
      </button>
      <button className="ml-step-secondary" type="button" onClick={undo} disabled={!game.history.length}>
       <Undo2 size={16}/> Annulla</button>
      <div className="ml-step-forecast">
       <strong>Prossimo turno:</strong>
       <span className="ml-positive">+{plan.born.length} sintesi</span>
       <span className="ml-negative">−{plan.departed.length} partenze</span>
       <span>+{plan.recovery} energia recuperata</span>
      </div>
     </div>
     <p className="ml-event" role="status" aria-live="polite">{game.event}</p>
    </section>
    <section className="ml-inspector">
     <div className="ml-eyebrow">SPIEGAZIONE / CELLA SELEZIONATA</div>
     {chosen&&<div className="ml-inspector-grid">
      <div>
       <h2>Cella ({chosen.q}, {chosen.r}) <span>· anello {chosen.ring}</span></h2>
       <div className={"ml-result ml-result-"+chosen.outcome}>
        {chosen.outcome==="birth"?<FlaskConical size={17}/>:
         chosen.outcome==="survive"?<Check size={17}/>:<X size={16}/>}
        <strong>{statusName(chosen)}</strong>
       </div>
       <p>{chosen.reason}</p>
      </div>
      <div className="ml-neighbor-inspector">
       <span>VICINI OCCUPATI ({chosen.neighbours.length}/6)</span>
       <div className="ml-neighbor-list">
        {chosen.neighbours.length?
         chosen.neighbours.map((n,i)=><span key={i} title={describe(n)}>
          <i style={{background:GROUP_COLORS[groupOf(n)-1]}}/> #{n} · {GROUP_CODES[groupOf(n)-1]}
         </span>):<em>Nessuno</em>}
       </div>
       {chosen.outcome==="birth"&&<small>Il Polytrone #{chosen.next} viene sintetizzato nella cella.</small>}
       {chosen.outcome==="no-energy"&&
        <small>Energia locale: {chosen.sumEnergy}/{chosen.requiredEnergy} necessaria.</small>}
      </div>
     </div>}
    </section>
   </div>
   <aside className="ml-sidebar">
    <section className="ml-side-card">
     <div className="ml-eyebrow">01 / ESPERIMENTI</div>
     <h2>Configurazione iniziale</h2>
     <p>Scegli una disposizione, poi modifica le celle e osserva come evolve.</p>
     <div className="ml-preset-grid">
      {([{id:"nucleus",name:"Sintesi +5",detail:"Tre vicini → #11"},
       {id:"ring",name:"Anello stabile",detail:"Sei Polytroni"},
       {id:"constellation",name:"Costellazione",detail:"Più colonie"},
       {id:"empty",name:"Tabula rasa",detail:"Parti da zero"}] as const).map(opt=>
       <button key={opt.id} type="button" onClick={()=>load(opt.id)}
        aria-pressed={preset===opt.id} className={preset===opt.id?"ml-current":""}>
        <strong>{opt.name}</strong><span>{opt.detail}</span>
       </button>)}
     </div>
     <div className="ml-note"><Grid3X3 size={15}/> La griglia contiene {POSITIONS.length} celle,
      distribuite in {LIFE_RADIUS} anelli intorno al centro.</div>
    </section>
    <section className="ml-side-card">
     <div className="ml-eyebrow">02 / ECONOMIA</div>
     <h2>Richiama un Polytrone</h2>
     <p>Seleziona il numero nella Tavola Periodica; poi clicca una cella vuota.</p>
     <div className="ml-num-select">
      <button onClick={()=>setPickNumber(n=>Math.max(1,n-5))} title="Periodo precedente" aria-label="Periodo precedente"><ChevronLeft size={19}/></button>
      <label htmlFor="ml-number">N°
       <input id="ml-number" type="number" min={1} max={250} value={pickNumber}
        onChange={e=>{const n=Number(e.target.value);
         if(Number.isSafeInteger(n)&&n>=1&&n<=250)setPickNumber(n);}}/>
      </label>
      <button onClick={()=>setPickNumber(n=>Math.min(250,n+5))} title="Periodo successivo" aria-label="Periodo successivo"><ChevronRight size={19}/></button>
     </div>
     <div className="ml-group-quick" role="group" aria-label="Seleziona gruppo">
      {GROUP_CODES.map((code,i)=><button key={code}
       className={groupOf(pickNumber)===i+1?"ml-current":""}
       onClick={()=>setPickNumber(5*(periodOf(pickNumber)-1)+i+1)}
       title={GROUP_LABELS[i]}
       style={{"--ml-group-accent":GROUP_COLORS[i]} as React.CSSProperties}>{code}</button>)}
     </div>
     <div className="ml-poly-readout">
      <div><span>CONWAYDNA</span><strong>{dnaFromPolitronNumber(pickNumber)}</strong></div>
      <div><span>GRUPPO</span><strong>{GROUP_LABELS[groupOf(pickNumber)-1]}</strong></div>
      <div><span>PERIODO</span><strong>{periodOf(pickNumber)}</strong></div>
     </div>
     <div className="ml-cost-box">
      <Wallet size={19}/>
      <div><small>Energia per richiamarlo</small>
       <strong>{intrinsicEnergy(pickNumber,bonus)} <span>unità</span></strong></div>
      <span className={game.credits>=intrinsicEnergy(pickNumber,bonus)?"ml-affordable":"ml-unaffordable"}>
       {game.credits>=intrinsicEnergy(pickNumber,bonus)?"Disponibile":"Insufficiente"}
      </span>
     </div>
     <p className="ml-minitext">Richiamare costa E; recuperare volontariamente o perdere un Polytrone restituisce ⌊E/2⌋.
      La sintesi automatica usa invece l'energia dei vicini.</p>
    </section>
    <section className="ml-side-card">
     <div className="ml-eyebrow">03 / CHROMATICA</div>
     <h2>Energia e palette</h2>
     <p>La palette modifica l'energia di <b>tutti</b> i Polytroni.
      Cambiarla avvia una nuova simulazione; l'ordine a salti è solo visivo.</p>
     <label className="ml-field">Materia · colore di partenza
      <select value={row} onChange={e=>changePalette(Number(e.target.value),col)}>
       {LATIN_SOURCES.map((x,i)=><option key={x.id} value={i}>{x.name} · {x.shadeName}</option>)}
      </select>
     </label>
     <label className="ml-field">Eidos · colore di arrivo
      <select value={col} onChange={e=>changePalette(row,Number(e.target.value))}>
       {GREEK_DESTINATIONS.map((x,i)=><option key={x.id} value={i}>{x.name} · {x.shadeName}</option>)}
      </select>
     </label>
     <div className="ml-gradient" style={{background:gradientCss(pair.primary.hex,pair.secondary.hex)}}
      aria-label={pair.primary.name+" verso "+pair.secondary.name}/>
     <div className="ml-order-switch" role="group" aria-label="Rappresentazione Chromatica">
      <button className={order==="linear"?"ml-current":""} onClick={()=>setOrder("linear")}>Dritta</button>
      <button className={order==="contrast"?"ml-current":""} onClick={()=>setOrder("contrast")}>A salti</button>
     </div>
     <div className="ml-palette-metrics"><span>ΔE OK <b>{distance.toFixed(1)}</b></span>
      <span>Bonus energia <strong>+{bonus}</strong></span></div>
    </section>
    <section className="ml-side-card ml-rules">
     <div className="ml-eyebrow">04 / LE REGOLE</div>
     <h2>Tutto è verificabile</h2>
     <div><b>Nascita · B3</b><p>Una cella vuota ha esattamente 3 vicini; almeno 2 sono dello stesso gruppo.</p></div>
     <div><b>Sintesi · +5</b><p>Il figlio è il maggiore dei vicini del gruppo maggioritario, più cinque.</p></div>
     <div><b>Energia locale</b><p>La somma di E dei 3 vicini deve essere almeno il doppio di E del figlio.</p></div>
     <div><b>Sopravvivenza · S23</b><p>Un Polytrone resta con 2 o 3 vicini; altrimenti torna a casa.</p></div>
     <div><b>Energia intrinseca</b><p>E = 2 + (periodo − 1) + (gruppo − 1) + bonus Chromatica (0–3).</p></div>
     <div><b>Calcolo simultaneo</b><p>Tutti gli esiti sono calcolati dalla stessa configurazione, senza dipendere dall'ordine delle celle.</p></div>
    </section>
   </aside>
  </div>
  <footer className="ml-footer">
   <span><FlaskConical size={17}/> PROTOTIPO SPERIMENTALE · LE REGOLE POSSONO CAMBIARE</span>
   <p>Questo esperimento esplora soltanto la crescita e la leggibilità dell'automa.
    Gli anelli energetici, gli Archytron, i Viaggiatori e la collezione persistente
    non sono ancora implementati. Il numero politronico e il ConwayDNA restano
    quelli canonici della Tavola Periodica.</p>
   <button type="button" onClick={()=>load(preset)}><RotateCcw size={15}/> Riavvia esperimento</button>
  </footer>
 </main>;
}
