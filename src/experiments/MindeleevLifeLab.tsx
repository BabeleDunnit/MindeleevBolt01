import {useMemo,useRef,useState} from "react";
import {ArrowRight,ChevronLeft,ChevronRight,Eye,FlaskConical,
 Grid3X3,Move,Play,RotateCcw,Undo2,Wallet} from "lucide-react";
import {dnaFromPolitronNumber} from "@/polytron/politronicNumber";
import {gradientPair,gradientCss,LATIN_SOURCES,GREEK_DESTINATIONS,
 perceptualDistance} from "@/polytron/gradientPalettes";
import {gradientSamples,cssSRGB,type GradientOrder} from "@/polytron/gradientFacePalette";
import LifeEnergyPanel from "@/experiments/LifeEnergyPanel";
import LifePolytron3D from "@/experiments/LifePolytron3D";
import {allHexes,calculateLife,lifeEnergyLedger,previewPlacement,groupOf,periodOf,hexKey,hexRing,
 paletteEnergyBonus,intrinsicEnergy,recoveryEnergy,makeLifePreset,
 startingBalance,GROUP_LABELS,GROUP_CODES,STARTING_ENERGY,LIFE_RADIUS,
 type LifePreset
} from "@/polytron/mindeleevLife";
import "./MindeleevLifeLab.css";

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
 const [groupFilter,setGroupFilter]=useState(0);
 const [pickerPage,setPickerPage]=useState(0);
 const [previewNumber,setPreviewNumber]=useState<number|null>(null);
 const dragStart=useRef<{key:string;clientX:number;clientY:number}|null>(null);
 const suppressClick=useRef(false);
 const [dragging,setDragging]=useState<{key:string;x:number;y:number}|null>(null);
 const [selectedKey,setSelectedKey]=useState("0,0");
 const [hovered,setHovered]=useState<{key:string;x:number;y:number}|null>(null);
 const [moveSource,setMoveSource]=useState<string|null>(null);
 const [forecast,setForecast]=useState(true);
 const plan=useMemo(()=>calculateLife(game.board,bonus),[game.board,bonus]);
 const emptySelected=!game.board.has(selectedKey);
 const affordableChoices=useMemo(()=>{
  if(!emptySelected)return [];
  return Array.from({length:250},(_,index)=>index+1)
   .filter(n=>intrinsicEnergy(n,bonus)<=game.credits)
   .map(n=>previewPlacement(game.board,game.credits,selectedKey,n,bonus,plan))
   .sort((a,b)=>b.localBirths.length-a.localBirths.length||
    b.newBirths-a.newBirths||a.cost-b.cost||a.number-b.number);
 },[game.board,game.credits,selectedKey,bonus,emptySelected,plan]);
 const filteredChoices=affordableChoices.filter(x=>
  groupFilter===0||groupOf(x.number)===groupFilter);
 const pageCount=Math.max(1,Math.ceil(filteredChoices.length/12));
 const actualPage=Math.min(pickerPage,pageCount-1);
 const visibleChoices=filteredChoices.slice(actualPage*12,(actualPage+1)*12);
 const previewChoice=previewNumber!==null&&emptySelected?
  affordableChoices.find(x=>x.number===previewNumber):undefined;
 const trialBoard=useMemo(()=>{
  if(!previewChoice)return null;
  const trial=new Map(game.board);trial.set(selectedKey,previewChoice.number);return trial;
 },[game.board,previewChoice?.number,selectedKey]);
 const trialPlan=useMemo(()=>trialBoard?calculateLife(trialBoard,bonus):null,
  [trialBoard,bonus]);
 const displayPlan=trialPlan??plan;
 const chosen=plan.predictions.get(selectedKey);
 const ledger=chosen?lifeEnergyLedger(game.board,plan,selectedKey,bonus):null;
 const hoverCell=hovered?plan.predictions.get(hovered.key):null;
 const hoverLedger=hoverCell?lifeEnergyLedger(game.board,plan,hoverCell.key,bonus):null;
 const onHover=(key:string,clientX:number,clientY:number)=>{
  const x=Math.max(8,Math.min(clientX+18,window.innerWidth-348));
  const y=Math.max(8,Math.min(clientY+18,window.innerHeight-405));
  setHovered(previous=>previous?.key===key&&Math.abs(previous.x-x)<5&&
   Math.abs(previous.y-y)<5?previous:{key,x,y});
 };
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
  setRow(nextRow);setCol(nextCol);setPreviewNumber(null);
 };
 const load=(kind:LifePreset)=>{
  setPreset(kind);setGame(makeGame(bonus,kind));setMoveSource(null);
  setSelectedKey("0,0");setPreviewNumber(null);setPickerPage(0);
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
  setMoveSource(null);setPreviewNumber(null);
 };
 const undo=()=>{
  if(!game.history.length)return;
  const previous=game.history[game.history.length-1];
  setGame({...previous,history:game.history.slice(0,-1),lastBorn:0,lastDeparted:0});
  setMoveSource(null);setPreviewNumber(null);
 };
 const notify=(event:string)=>setGame(g=>({...g,event}));
 const place=(key:string,n:number)=>{
  const allowed=previewPlacement(game.board,game.credits,key,n,bonus,plan);
  if(!allowed.isEmpty||!allowed.affordable){
   notify("Piazzamento non consentito: cella occupata o budget insufficiente.");
   return;
  }
  const board=new Map(game.board);board.set(key,n);
  const discovered=new Set(game.discovered);discovered.add(n);
  commit({...game,board,discovered,credits:game.credits-allowed.cost,
   event:`Richiamato ${describe(n)} (−${allowed.cost} E). ${allowed.localBirths.length?
    "Sintesi sbloccate vicino alla cella: "+allowed.localBirths.join(", "):
    "Nessuna sintesi locale immediata."}`,
   lastBorn:0,lastDeparted:0});
  setPreviewNumber(null);
  setPickerPage(0);
 };
 const recycle=(key:string)=>{
  const n=game.board.get(key);if(n===undefined)return;
  const board=new Map(game.board);board.delete(key);
  const recovered=recoveryEnergy(n,bonus);
  commit({...game,board,credits:game.credits+recovered,
   event:`Polytrone #${n} torna a casa: +${recovered} E nel budget.`,
   lastBorn:0,lastDeparted:0});
  setMoveSource(null);setPreviewNumber(null);
 };
 const move=(source:string,destination:string)=>{
  const n=game.board.get(source);
  if(n===undefined||game.board.has(destination)||source===destination)return;
  const board=new Map(game.board);board.delete(source);board.set(destination,n);
  commit({...game,board,event:`Spostato #${n}: nessun costo energetico.`,
   lastBorn:0,lastDeparted:0});
  setMoveSource(null);setPreviewNumber(null);
  setSelectedKey(destination);setPickerPage(0);
 };
 const onHex=(key:string)=>{
  if(suppressClick.current){suppressClick.current=false;return;}
  if(moveSource&&moveSource!==key&&!game.board.has(key)){
   move(moveSource,key);return;
  }
  setSelectedKey(key);setPreviewNumber(null);setPickerPage(0);
  setMoveSource(null);
  setHovered(null);
 };
 const pointerPosition=(svg:SVGSVGElement,clientX:number,clientY:number)=>{
  const transform=svg.getScreenCTM();
  if(!transform)return null;
  const point=svg.createSVGPoint();point.x=clientX;point.y=clientY;
  return point.matrixTransform(transform.inverse());
 };
 const pointerUp=(key:string,event:React.PointerEvent<SVGGElement>)=>{
  const start=dragStart.current;dragStart.current=null;
  if(!start||start.key!==key)return;
  const distance=Math.hypot(event.clientX-start.clientX,event.clientY-start.clientY);
  setDragging(null);
  if(distance<10)return;
  suppressClick.current=true;
  // A drag may not produce a click event; do not eat the next separate tap.
  window.setTimeout(()=>{suppressClick.current=false;},0);
  const svg=event.currentTarget.ownerSVGElement;
  if(!svg||!game.board.has(key))return;
  const p=pointerPosition(svg,event.clientX,event.clientY);
  if(!p)return;
  const target=POSITIONS.map(hex=>{
   const center=coordinates(hex.q,hex.r);
   return {key:hexKey(hex.q,hex.r),dist:Math.hypot(center.x-p.x,center.y-p.y)};
  }).sort((a,b)=>a.dist-b.dist)[0];
  if(target&&target.dist<SIZE*.94&&!game.board.has(target.key))
   move(key,target.key);
 };
 const emptyHexes=POSITIONS.length-game.board.size;

 return <main className="ml-page">
  <LifePolytron3D row={row} col={col} order={order}/>
  <header className="ml-hero">
   <div className="ml-brand"><span className="ml-brand-dot"/> MINDELEEV / ESPERIMENTO 42
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
       <p>Clicca una cella vuota per vedere soltanto i Polytroni che puoi permetterti. Trascina quelli presenti per spostarli. Ogni scelta anticipa le prossime sintesi.</p>
      </div>
      <label className="ml-forecast-switch">
       <input type="checkbox" checked={forecast} onChange={e=>setForecast(e.target.checked)}/>
       <Eye size={15}/> Previsioni
      </label>
     </div>
     <div className="ml-direct-hint">
      <span><Grid3X3 size={14}/> Cella vuota → scegli un Polytrone</span>
      <span><Move size={14}/> Trascina un Polytrone → spostalo</span>
      <span><Wallet size={14}/> Cella occupata → recupera energia</span>
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
        const shown=displayPlan.predictions.get(key)!;
        const birth=forecast&&shown.outcome==="birth"&&n===undefined;
        const leaving=forecast&&shown.outcome==="depart";
        const unpowered=forecast&&shown.outcome==="no-energy";
        const preview=key===selectedKey&&previewChoice?.number!==undefined&&n===undefined;
        const shownN=n??(preview?previewChoice!.number:undefined);
        const stroke=n!==undefined?GROUP_COLORS[groupOf(n)-1]:"#446375";
        const label=n===undefined?
         `Cella ${key} vuota. ${cell.reason}`:
         `Cella ${key}, Polytrone ${describe(n)}. ${cell.reason}`;
        return <g key={key}
         data-life-polytron={shownN===undefined?undefined:dnaFromPolitronNumber(shownN)}
         className={"ml-hex"+(selected?" ml-selected":"")+
         (birth?" ml-birth":"")+(leaving?" ml-leaving":"")+
         (source?" ml-source":"")}
         role="button" tabIndex={0} aria-label={label}
         onClick={()=>onHex(key)}
         onPointerDown={e=>{
          if(n===undefined||e.button!==0)return;
          dragStart.current={key,clientX:e.clientX,clientY:e.clientY};
          suppressClick.current=false;
          e.currentTarget.setPointerCapture(e.pointerId);
         }}
         onPointerUp={e=>pointerUp(key,e)}
         onPointerCancel={()=>{dragStart.current=null;setDragging(null);}}

         onPointerEnter={e=>{if(e.pointerType!=="touch")onHover(key,e.clientX,e.clientY);}}
         onPointerMove={e=>{
          const start=dragStart.current;
          if(start&&start.key===key&&
           Math.hypot(e.clientX-start.clientX,e.clientY-start.clientY)>10){
           setDragging({key,x:e.clientX,y:e.clientY});
           setHovered(null);
          }else if(e.pointerType!=="touch")onHover(key,e.clientX,e.clientY);
         }}
         onPointerLeave={()=>setHovered(prev=>prev?.key===key?null:prev)}
         onFocus={e=>{const box=e.currentTarget.getBoundingClientRect();
          onHover(key,box.right,box.top);}}
         onBlur={()=>setHovered(prev=>prev?.key===key?null:prev)}
         onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onHex(key);}}}>
         <polygon points={points(x,y,SIZE-1.2)}
          fill={shownN!==undefined?"#173f43":ring%2?"#102b3a":"#132f40"}
          stroke={preview?"#d7efaa":selected?"#eaffd4":birth?"#63f1a1":leaving?"#fa9d98":stroke}
          strokeWidth={selected?3.3:birth?3:1.25}
          strokeDasharray={birth?"4 4":leaving?"3 4":undefined}
          opacity={leaving?.56:1}/>
         {shownN!==undefined?
          <>
           <circle cx={x} cy={y+19} r="3.2" fill={GROUP_COLORS[groupOf(shownN)-1]} stroke="#102130" strokeWidth="1"/>
           <text x={x+9} y={y+23} className="ml-hex-3d-tag" textAnchor="middle">
            #{shownN}</text>
           {preview&&<text x={x} y={y-25} className="ml-hex-preview" textAnchor="middle">ANTEPRIMA</text>}
          </>:
          birth?
           <><text x={x} y={y+5} className="ml-hex-birth" textAnchor="middle">
            +{shown.next}</text><text x={x} y={y+18} className="ml-hex-group" textAnchor="middle">
             SINTESI</text></>:
           unpowered?<text x={x} y={y+5} className="ml-hex-muted" textAnchor="middle">E−</text>:
           <circle cx={x} cy={y} r="1.7" fill="#608296" fillOpacity=".6"/>
         }
         {/* Floating energy tooltip replaces the browser's brief SVG title. */}
        </g>;
       })}
      </svg>
      {dragging&&<div className="ml-drag-preview"
       style={{left:dragging.x+18,top:dragging.y+18}}>
       Sposta #{game.board.get(dragging.key)} → rilascia su una cella vuota
      </div>}
      {hoverCell&&hoverLedger&&hovered&&
       <div id="ml-hover-energy" className="ml-hover-energy" role="tooltip"
        style={{left:hovered.x,top:hovered.y}}>
        <LifeEnergyPanel cell={hoverCell} ledger={hoverLedger} bonus={bonus} compact/>
       </div>}
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
     {chosen&&ledger&&<>
      {chosen.occupant!==undefined&&<div className="ml-context-actions">
       <span>Polytrone #{chosen.occupant} · {dnaFromPolitronNumber(chosen.occupant)}</span>
       <button type="button" onClick={()=>setMoveSource(chosen.key)} aria-label="Sposta questo Polytrone">
        <Move size={15}/> Sposta: scegli destinazione
       </button>
       <button type="button" onClick={()=>recycle(chosen.key)}>
        <RotateCcw size={15}/> Recupera +{recoveryEnergy(chosen.occupant,bonus)} E
       </button>
      </div>}
      <div className="ml-inspector-intro">
       <h2>Cella ({chosen.q}, {chosen.r}) · Anello {chosen.ring}</h2>
       <p>{chosen.reason}</p>
      </div>
      <LifeEnergyPanel cell={chosen} ledger={ledger} bonus={bonus}
       treasury={game.credits}/>
     </>}
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
    <section className="ml-side-card ml-context-picker" aria-label="Piazzamento diretto dei Polytroni">
     <div className="ml-eyebrow">02 / PIAZZAMENTO WYSIWYG</div>
     <h2>{emptySelected?"Scegli chi richiamare":"Polytrone selezionato"}</h2>
     {emptySelected?<>
      <p>Cella {selectedKey} · <strong>{affordableChoices.length}</strong> Polytroni richiamabili
       con il budget attuale di <strong>{game.credits} E</strong>. Le scelte sono ordinate
       per sintesi locale prevista e poi per costo. Passa sopra una carta per
       <b> vedere l'esito sulla griglia prima di spendere.</b></p>
      <div className="ml-group-quick" role="group" aria-label="Filtra per gruppo">
       {[0,1,2,3,4,5].map(group=><button key={group}
        aria-pressed={groupFilter===group}
        className={groupFilter===group?"ml-current":""}
        onClick={()=>{setGroupFilter(group);setPickerPage(0);setPreviewNumber(null);}}>
        {group===0?"Tutti":GROUP_CODES[group-1]}
       </button>)}
      </div>
      {visibleChoices.length?<>
       <div className="ml-choice-grid">
        {visibleChoices.map(item=><button key={item.number} type="button"
         className={"ml-choice"+(previewNumber===item.number?" ml-choice-preview":"")}
         onPointerEnter={()=>setPreviewNumber(item.number)}
         onPointerLeave={()=>setPreviewNumber(n=>n===item.number?null:n)}
         onFocus={()=>setPreviewNumber(item.number)}
         onBlur={()=>setPreviewNumber(n=>n===item.number?null:n)}
         onClick={()=>place(selectedKey,item.number)}
         aria-label={`Richiama Polytrone #${item.number}, costo ${item.cost} energia; ${item.localBirths.length} sintesi locali previste`}>
         <span data-life-polytron={dnaFromPolitronNumber(item.number)}
          data-life-kind="card" className="ml-choice-view"/>
         <strong>#{item.number}<small>{dnaFromPolitronNumber(item.number)}</small></strong>
         <span className="ml-choice-cost">−{item.cost} E</span>
         <em className={item.localBirths.length?"ml-choice-gain":"ml-choice-neutral"}>
          {item.localBirths.length?
           `+${item.localBirths.length} sintesi locale${item.localBirths.length>1?"i":""}`:
           item.newBirths?`+${item.newBirths} sintesi altrove`:
           item.localDeficits.length?`Mancano ${Math.min(...item.localDeficits)} E`:
           "Nessuna sintesi immediata"}
         </em>
        </button>)}
       </div>
       <div className="ml-choice-pagination">
        <button disabled={actualPage===0} onClick={()=>{setPickerPage(x=>Math.max(0,x-1));setPreviewNumber(null);}}>
         <ChevronLeft size={15}/> Prima
        </button>
        <span>{actualPage+1} / {pageCount} · {filteredChoices.length} ammissibili</span>
        <button disabled={actualPage>=pageCount-1} onClick={()=>{setPickerPage(x=>x+1);setPreviewNumber(null);}}>
         Dopo <ChevronRight size={15}/>
        </button>
       </div>
      </>:<p className="ml-no-choices">Nessun Polytrone acquistabile con il budget disponibile.</p>}
      {previewChoice&&<div className="ml-choice-preflight" role="status">
       <strong>Anteprima #{previewChoice.number} · −{previewChoice.cost} E</strong>
       <span>{previewChoice.localBirths.length?
        `Sblocca sintesi locali: ${previewChoice.localBirths.join(", ")}`:
        previewChoice.localDeficits.length?
        `Sintesi ancora bloccata: mancano ${previewChoice.localDeficits.join(", ")} E`:
        "Nessuna nuova sintesi locale con questo piazzamento."}</span>
       <small>La disposizione, i costi e le nascite sono simulati senza modificare il turno.</small>
      </div>}
     </>:<>
      <p>Il Polytrone è già presente sul Mutatron. Puoi trascinarlo direttamente
       su una cella vuota o usare i comandi contestuali sotto la griglia.
       Non serve scegliere prima uno strumento.</p>
      <div className="ml-selected-poly" data-life-polytron={
       dnaFromPolitronNumber(game.board.get(selectedKey)!)} data-life-kind="card"/>
      <div className="ml-poly-readout">
       <div><span>CONWAYDNA</span><strong>{dnaFromPolitronNumber(game.board.get(selectedKey)!)}</strong></div>
       <div><span>ENERGIA</span><strong>{intrinsicEnergy(game.board.get(selectedKey)!,bonus)} E</strong></div>
       <div><span>RECUPERO POSSIBILE</span>
        <strong>+{recoveryEnergy(game.board.get(selectedKey)!,bonus)} E</strong></div>
      </div>
     </>}
    </section>
    <section className="ml-side-card">
     <div className="ml-eyebrow">03 / CHROMATICA</div>
     <h2>Palette · solo aspetto</h2>
     <p>Chromatica è <b>puramente visiva</b>: contributo energetico
      fissato a zero. Puoi cambiare colori senza alterare budget,
      sintesi o disposizione del Mutatron.</p>
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
     <div><b>Energia locale</b><p>La somma di E dei 3 vicini deve essere almeno il doppio di E del figlio.
      In questo prototipo la somma è un requisito, non un trasferimento: i vicini cedono 0 E.</p></div>
     <div><b>Sopravvivenza · S23</b><p>Un Polytrone resta con 2 o 3 vicini; altrimenti torna a casa.</p></div>
     <div><b>Energia intrinseca</b><p>E = 2 + (periodo − 1) + (gruppo − 1). Il contributo Chromatica è sempre 0.</p></div>
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
