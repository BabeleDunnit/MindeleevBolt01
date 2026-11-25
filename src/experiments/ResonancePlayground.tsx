import {useEffect,useMemo,useState} from "react";
import {SharedPeriodic3D} from "@/experiments/PolytronPeriodicLab";
import ResonanceEconomicsPanel from "@/experiments/ResonanceEconomicsPanel";
import {gradientPair,LATIN_SOURCES,GREEK_DESTINATIONS} from "@/polytron/gradientPalettes";
import {rcAxial,rcPolygon} from "@/polytron/rc01Board";
import type {KaleidoLayout,KaleidoTile} from "@/polytron/kaleidoscopeGenerator";
import {
 DEFAULT_RESONANCE_SETTINGS,evaluateResonance,
 resonanceCost,resonanceReward,resonanceComplexity,
 type ResonancePawn,type ResonanceSettings,type ResonanceScore
} from "@/polytron/resonanceField";
import type {DifficultyReport} from "@/polytron/resonanceDifficulty";
import {groupOf,periodOf,GROUP_CODES,GROUP_LABELS} from "@/polytron/mindeleevLife";
import {dnaFromPolitronNumber} from "@/polytron/politronicNumber";
import {sealName} from "@/polytron/spectralFutures";
import "./ResonancePlayground.css";

const BASE=import.meta.env.BASE_URL;
const fromLabel=(p:{ring:number;idx:number})=>"("+p.ring+","+p.idx+")";
const fmt=(x:number)=>x.toFixed(1);
const clamp=(x:number,min:number,max:number)=>Math.max(min,Math.min(max,x));
const coord=(q:number,r:number,radius:number)=>{
 const size=370/(Math.sqrt(3)*radius+1.12);
 const p=rcAxial(q,r,size);
 return {x:400+p.x,y:400+p.y,size};
};
type OwnedPolytron=ResonancePawn&{seal:number;name:string};
type Props={
 layout:KaleidoLayout;
 onEvolve:()=>void;
 onGenesis:()=>void
};
export default function ResonancePlayground({layout,onEvolve,onGenesis}:Props){
 const radius=layout.params.radius;
 const recipeKey=[radius,layout.params.family,layout.params.symmetry,
  layout.params.seed].join("|");
 const [initialBudget,setInitialBudget]=useState(48);
 const [treasury,setTreasury]=useState(48);
 const [pawns,setPawns]=useState<OwnedPolytron[]>([]);
 const [home,setHome]=useState<OwnedPolytron[]>([]);
 const [returnSeal,setReturnSeal]=useState<number|null>(null);
 const [nextSeal,setNextSeal]=useState(1);
 const [completedRequests,setCompletedRequests]=useState(0);
 const [number,setNumber]=useState(2);
 const [paletteRow,setPaletteRow]=useState(10);
 const [paletteCol,setPaletteCol]=useState(10);
 const [settings,setSettings]=useState<ResonanceSettings>(DEFAULT_RESONANCE_SETTINGS);
 const [hoverKey,setHoverKey]=useState<string|null>(null);
 const [previewKey,setPreviewKey]=useState<string|null>(null);
 const [moveFrom,setMoveFrom]=useState<string|null>(null);
 const [showRays,setShowRays]=useState(true);
 const [showHeat,setShowHeat]=useState(true);
 const [showPlan,setShowPlan]=useState(false);
 const [selectedScenarioId,setSelectedScenarioId]=useState("quality");
 const [showGraph,setShowGraph]=useState(true);
 const [difficulty,setDifficulty]=useState<DifficultyReport|null>(null);
 const [analyzerState,setAnalyzerState]=useState("Analisi in preparazione");
 const [claimed,setClaimed]=useState(false);
 const [lastEvent,setLastEvent]=useState("");
 const valid=new Map(layout.cells.map(c=>[c.key,c]));
 const pawnByKey=new Map(pawns.map(p=>[p.key,p]));
 const tileByKey=new Map(layout.tiles.map(t=>[t.key,t]));
 const activeCell=hoverKey??previewKey;
 const fromHome=home.find(p=>p.seal===returnSeal)??null;
 const existing=moveFrom?pawnByKey.get(moveFrom):fromHome;
 const candidateNumber=existing?.number??number;
 const candidateRow=existing?.paletteRow??paletteRow;
 const candidateCol=existing?.paletteCol??paletteCol;
 const candidateCost=moveFrom?0:resonanceCost(candidateNumber);
 const canPurchase=moveFrom!==null||treasury>=candidateCost;
 const canPreview=activeCell!==null&&valid.has(activeCell)&&
  activeCell!=="0,0"&&!pawnByKey.has(activeCell)&&
  candidateNumber!==undefined&&candidateRow!==undefined&&candidateCol!==undefined;
 const candidate:ResonancePawn|null=canPreview?{
  key:activeCell!,number:candidateNumber!,
  paletteRow:candidateRow!,paletteCol:candidateCol!
 }:null;
 const planned=useMemo(()=>evaluateResonance(layout,pawns,settings),
  [layout,pawns,settings]);
 const trialPawns=useMemo(()=>{
  if(!candidate)return null;
  return [...pawns.filter(p=>p.key!==moveFrom),candidate];
 },[pawns,candidate?.key,candidate?.number,candidate?.paletteRow,
  candidate?.paletteCol,moveFrom]);
 const preview=useMemo(()=>trialPawns?
  evaluateResonance(layout,trialPawns,settings):null,
  [layout,trialPawns,settings]);
 const visual=preview??planned;
 const selectedPawn=moveFrom?pawnByKey.get(moveFrom):null;
 const activePosition=candidate?valid.get(candidate.key):null;
 // Kaleidoscope tiles are *hints*, not player-owned Polytron identities.
 // Their polytronic number is a manifestation, never a Seal #.
 const activeHint=candidate?tileByKey.get(candidate.key):undefined;
 const sortedRays=useMemo(()=>{
  if(!showRays)return [];
  if(candidate&&preview)return preview.contributions.filter(c=>
   c.pawnKey===candidate.key).sort((a,b)=>b.strength-a.strength).slice(0,28);
  if(moveFrom)return planned.contributions.filter(c=>c.pawnKey===moveFrom)
   .sort((a,b)=>b.strength-a.strength).slice(0,28);
  return planned.contributions.filter(c=>c.strength>=.40)
   .sort((a,b)=>b.strength-a.strength).slice(0,20);
 },[showRays,planned,preview,candidate?.key,moveFrom]);
 const currentReward=resonanceReward(layout,planned.quality);
 const previewReward=preview?resonanceReward(layout,preview.quality):null;
 const marginalReward=previewReward===null?null:previewReward-currentReward;
 const marginalNet=marginalReward===null?null:marginalReward-candidateCost;
 const fullNet=currentReward-planned.totalCost;
 const selectedScenario=difficulty?.scenarios.find(x=>x.id===selectedScenarioId)
  ??difficulty?.scenarios[0];
 const hintsByKey=new Map(visual.hintResults.map(h=>[h.key,h]));
 const occupiedCost=planned.totalCost;
 const plannerBudget=clamp(treasury+occupiedCost,2,10000);
 const targetPalettes=useMemo(()=>{
  const map=new Map<string,{row:number;col:number;count:number}>();
  for(const t of layout.tiles){
   const key=t.paletteRow+","+t.paletteCol;
   const val=map.get(key)??{row:t.paletteRow,col:t.paletteCol,count:0};
   val.count++;map.set(key,val);
  }
  return [...map.values()].sort((a,b)=>b.count-a.count).slice(0,10);
 },[layout]);
 const scoreDelta=(preview?.quality??planned.quality)-planned.quality;

 // Keep the economical experiment alive when Evolve changes the request;
 // reset only if the scenario's structure/seed is explicitly replaced.
 useEffect(()=>{
  setPawns([]);setHome([]);setTreasury(initialBudget);
  setReturnSeal(null);setNextSeal(1);
  setPreviewKey(null);setHoverKey(null);setMoveFrom(null);
  setClaimed(false);setLastEvent("");
 // Intentional: a new recipe is a new research scenario; evolution is not.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[recipeKey]);
 useEffect(()=>{setClaimed(false);},[layout.params.generation]);

 useEffect(()=>{
  let active=true;
  let worker:Worker|undefined;
  setDifficulty(null);setAnalyzerState("Analisi euristica in corso…");
  try{
   worker=new Worker(new URL("../polytron/resonanceDifficulty.worker.ts",import.meta.url),
    {type:"module"});
   worker.onmessage=(e:MessageEvent<{result?:DifficultyReport;error?:string}>)=>{
    if(!active)return;
    if(e.data.error){setAnalyzerState("Analisi non disponibile: "+e.data.error);return;}
    if(e.data.result){
     setDifficulty(e.data.result);setAnalyzerState("");
    }
   };
   worker.onerror=()=>{if(active)setAnalyzerState("Worker di analisi non disponibile");};
   worker.postMessage({id:1,layout,budget:plannerBudget,settings,pawns});
  }catch(error){
   setAnalyzerState("Analisi non disponibile: "+String(error));
  }
  return ()=>{active=false;worker?.terminate();};
 },[layout,plannerBudget,settings,pawns]);

 const chooseTargetPalette=(row:number,col:number)=>{
  setPaletteRow(row);setPaletteCol(col);setMoveFrom(null);setReturnSeal(null);
 };
 const chooseCell=(key:string)=>{
  if(key==="0,0")return;
  if(pawnByKey.has(key)){
   setMoveFrom(prev=>prev===key?null:key);
   setReturnSeal(null);
   setPreviewKey(null);
  }else setPreviewKey(key);
 };
 const cancelPending=()=>{
  // Nothing was purchased yet: discard ONLY the selection and ghost
  // placement, leaving treasury, board and existing Seal identities intact.
  setPreviewKey(null);
  setHoverKey(null);
  setMoveFrom(null);
  setReturnSeal(null);
  setNumber(2);
  setPaletteRow(10);
  setPaletteCol(10);
  setLastEvent("Scelta annullata: nessun acquisto o spostamento effettuato.");
 };
 const commit=()=>{
  if(!candidate||!canPurchase)return;
  if(!moveFrom&&!fromHome&&sealName(nextSeal)==="—"){
   setLastEvent("Nessuna nuova identità disponibile in questa fase.");
   return;
  }
  const wasMove=moveFrom!==null;
  const newPawn:OwnedPolytron=wasMove?{
   ...candidate,seal:selectedPawn!.seal,name:selectedPawn!.name
  }:fromHome?{
   ...candidate,seal:fromHome.seal,name:fromHome.name
  }:{
   ...candidate,seal:nextSeal,name:sealName(nextSeal)
  };
  setPawns(old=>[...old.filter(p=>p.key!==moveFrom),newPawn]);
  if(!wasMove)setTreasury(old=>old-resonanceCost(newPawn.number));
  if(fromHome){
   setHome(old=>old.filter(p=>p.seal!==fromHome.seal));
   setReturnSeal(null);
  }else if(!wasMove)setNextSeal(old=>old+1);
  setLastEvent((wasMove?"Spostato ":fromHome?"Richiamato da Home ":"Si presenta ")+
   "Polytrone #"+newPawn.seal+" · "+newPawn.name+
   " — manifestazione "+newPawn.number+
   " in "+fromLabel(valid.get(newPawn.key)!));
  setPreviewKey(null);setHoverKey(null);setMoveFrom(null);
 };
 const sell=()=>{
  if(!moveFrom||!selectedPawn)return;
  const refund=Math.floor(resonanceCost(selectedPawn.number)/2);
  setPawns(old=>old.filter(p=>p.key!==moveFrom));
  setHome(old=>[...old,selectedPawn]);
  setTreasury(old=>old+refund);
  setLastEvent("#"+selectedPawn.seal+" · "+selectedPawn.name+
   " riposa a Home; recuperati "+refund+" E");
  setPreviewKey(null);setHoverKey(null);setMoveFrom(null);
  setReturnSeal(selectedPawn.seal);
 };
 const reset=()=>{
  setHome(old=>[...old,...pawns]);
  setPawns([]);setTreasury(initialBudget);setMoveFrom(null);
  setReturnSeal(null);
  setPreviewKey(null);setHoverKey(null);setLastEvent("Composizione azzerata");
 };
 const setBudget=(n:number)=>{
  const next=clamp(Math.round(n)||10,10,500);
  setInitialBudget(next);setTreasury(next);setPawns([]);
  setHome([]);setReturnSeal(null);setNextSeal(1);
  setCompletedRequests(0);
  setPreviewKey(null);setMoveFrom(null);setLastEvent("");
 };
 const selectHint=(tile:KaleidoTile)=>{
  setNumber(tile.number);setPaletteRow(tile.paletteRow);setPaletteCol(tile.paletteCol);
  setMoveFrom(null);setReturnSeal(null);setPreviewKey(tile.key);
 };
 const claim=()=>{
  if(claimed)return;
  const reward=currentReward;
  setTreasury(old=>old+reward);
  setClaimed(true);
  setCompletedRequests(old=>old+1);
  setLastEvent("Risposta presentata: +"+reward+" E. La composizione rimane per la prossima richiesta.");
  setHoverKey(null);setPreviewKey(null);setMoveFrom(null);
  onEvolve();
 };
 const suggest=()=>{
  if(!difficulty?.nextMove)return;
  const next=difficulty.nextMove;
  if(pawnByKey.has(next.key)||treasury<resonanceCost(next.number))return;
  setNumber(next.number);setPaletteRow(next.paletteRow);
  setPaletteCol(next.paletteCol);setMoveFrom(null);
  setReturnSeal(null);setPreviewKey(next.key);
  setShowPlan(false);
 };
 const cellSize=370/(Math.sqrt(3)*radius+1.12);
 const tileWidth=(cellSize*1.5/800*100)+"%";
 const circleFor=(key:string)=>{
  const cell=valid.get(key)!;
  return coord(cell.q,cell.r,radius);
 };
 return <div className="kaleido-layout resonance-lab">
  <section className="kaleido-stage">
   <div className="resonance-stage-head">
    <div><b>Campo di risonanza</b><small>{layout.params.family} · {layout.params.symmetry} · raggio {radius}</small></div>
    <div className="resonance-head-score">
     <strong>{fmt(planned.quality)}%</strong>
     {preview&&<span className={scoreDelta>=0?"resonance-positive":"resonance-negative"}>
      {scoreDelta>=0?"+":""}{fmt(scoreDelta)} anteprima
     </span>}
    </div>
   </div>
   <div className="kaleido-artboard resonance-artboard">
    <svg className="kaleido-svg" viewBox="0 0 800 800" role="img"
     aria-label={"Campo di "+layout.tiles.length+" indizi, "+
      pawns.length+" Polytroni acquistati"}>
     <defs>
      <radialGradient id="resonance-background">
       <stop offset="0%" stopColor="#193a43"/>
       <stop offset="100%" stopColor="#091923"/>
      </radialGradient>
     </defs>
     <rect width="800" height="800" fill="url(#resonance-background)"/>
     {layout.cells.map(cell=>{
      const p=coord(cell.q,cell.r,radius);
      const hint=hintsByKey.get(cell.key);
      const sat=hint?.overall??0;
      const purchased=pawnByKey.has(cell.key);
      const isTest=candidate?.key===cell.key;
      return <polygon key={cell.key}
       points={rcPolygon(p.x,p.y,p.size*.97)}
       stroke={isTest?"#c3ffb4":purchased?"#efd49e":hint?"#d7ac8d":"#355766"}
       strokeWidth={isTest||purchased?3:hint?1.45:.9}
       fill={hint&&showHeat?
        sat>.72?"#348d6f":sat>.4?"#648670":"#642e51":
        hint?"#44344e":"#15323e"}
       fillOpacity={hint?(showHeat?.28+.46*sat:.22):.22}/>;
     })}
     {showGraph&&layout.edges.map(edge=>{
      const a=circleFor(edge.from),b=circleFor(edge.to);
      const score=visual.graphResults.find(e=>
       e.from===edge.from&&e.to===edge.to)?.coverage??0;
      return <line key={edge.from+"|"+edge.to}
       x1={a.x} y1={a.y} x2={b.x} y2={b.y}
       stroke={score>.5?"#a8f7cb":edge.kind==="star"?"#d2a778":"#559cac"}
       strokeWidth={edge.kind==="star"?2.3:1.5}
       strokeOpacity={.18+.58*score}/>;
     })}
     {sortedRays.map(ray=>{
      const a=circleFor(ray.pawnKey),b=circleFor(ray.hintKey);
      return <line key={ray.pawnKey+"-"+ray.hintKey}
       x1={a.x} y1={a.y} x2={b.x} y2={b.y}
       stroke="#a3e9cb" strokeWidth={1+ray.strength*4}
       strokeOpacity={.2+ray.strength*.67}
       strokeDasharray={ray.distance>0?"7 5":undefined}/>;
     })}
     {layout.cells.filter(c=>c.ring===0).map(c=>{
      const p=coord(c.q,c.r,radius);
      return <g key={c.key}>
       <polygon points={rcPolygon(p.x,p.y,p.size*.84)}
        fill="#173b3a" stroke="#d4bb80" strokeWidth="2"/>
       <circle cx={p.x} cy={p.y} r={Math.max(5,p.size*.13)} fill="#ead5a0"/>
      </g>;
     })}
     {showPlan&&selectedScenario?.placements.map(pawn=>{
      const p=circleFor(pawn.key);
      return <polygon key={pawn.key}
       points={rcPolygon(p.x,p.y,p.size*.72)}
       fill={selectedScenario.net>=0?"#78d5ab":"#ec927b"}
       fillOpacity=".15" stroke={selectedScenario.net>=0?"#86c9da":"#f2a293"}
       strokeWidth="2" strokeDasharray="7 4"/>;
     })}
     {pawns.map(pawn=>{
      const p=circleFor(pawn.key);
      return <polygon key={pawn.key}
       points={rcPolygon(p.x,p.y,p.size*.78)}
       fill="none" stroke={pawn.key===moveFrom?"#f6ffbb":"#e6d49e"}
       strokeWidth={pawn.key===moveFrom?4:2.9}/>;
     })}
     {candidate&&activePosition&&(()=>{
      const p=coord(activePosition.q,activePosition.r,radius);
      return <polygon points={rcPolygon(p.x,p.y,p.size*.9)}
       fill={canPurchase?"#8bf4b0":"#ff8b83"}
       fillOpacity=".10" stroke={canPurchase?"#baf9b4":"#ff8072"}
       strokeWidth="3.5" strokeDasharray="7 5"/>;
     })()}
    </svg>
    <div className="kaleido-tile-layer resonance-target-tiles">
     {layout.tiles.map(tile=>{
      const p=coord(tile.q,tile.r,radius);
      return <div key={tile.key} className="kaleido-polytron"
       data-polytron-viewport="" data-view-kind="flat-z"
       data-dna={tile.dna} data-kaleido-opacity=".42"
       data-kaleido-row={tile.paletteRow} data-kaleido-col={tile.paletteCol}
       data-kaleido-angle={tile.angle}
       data-kaleido-mirror={tile.mirrored?"true":"false"}
       style={{left:p.x/8+"%",top:p.y/8+"%",
        width:tileWidth,height:tileWidth}}/>;
     })}
    </div>
    <div className="kaleido-tile-layer resonance-player-tiles">
     {pawns.map(pawn=>{
      const cell=valid.get(pawn.key)!;
      const p=coord(cell.q,cell.r,radius);
      return <div key={pawn.key} className="kaleido-polytron"
       data-polytron-viewport="" data-view-kind="solid"
       data-dna={dnaFromPolitronNumber(pawn.number)}
       data-kaleido-row={pawn.paletteRow} data-kaleido-col={pawn.paletteCol}
       style={{left:p.x/8+"%",top:p.y/8+"%",width:tileWidth,
        height:tileWidth}}/>;
     })}
     {candidate&&canPurchase&&activePosition&&(()=>{
      const p=coord(activePosition.q,activePosition.r,radius);
      return <div className="kaleido-polytron" data-polytron-viewport=""
       data-view-kind="solid" data-kaleido-opacity=".7"
       data-dna={dnaFromPolitronNumber(candidate.number)}
       data-kaleido-row={candidate.paletteRow} data-kaleido-col={candidate.paletteCol}
       style={{left:p.x/8+"%",top:p.y/8+"%",width:tileWidth,
        height:tileWidth}}/>;
     })()}
    </div>
    <div className="resonance-identity-layer" aria-hidden="true">
     {pawns.map(pawn=>{
      const p=circleFor(pawn.key);
      return <div key={pawn.seal} className="resonance-seal-label"
       style={{left:p.x/8+"%",top:(p.y+cellSize*.68)/8+"%"}}>
       #{pawn.seal}</div>;
     })}
    </div>
    <div className="kaleido-select-layer">
     {layout.cells.filter(cell=>cell.ring>0).map(cell=>{
      const p=coord(cell.q,cell.r,radius);
      const owned=pawnByKey.has(cell.key);
      return <button key={cell.key}
       className={"kaleido-hotspot resonance-cell-hit"+
        (previewKey===cell.key?" is-selected":"")+
        (owned?" is-owned":"")}
       style={{left:p.x/8+"%",top:p.y/8+"%",width:tileWidth,height:tileWidth}}
       onMouseEnter={()=>setHoverKey(cell.key)}
       onMouseLeave={()=>setHoverKey(null)}
       onFocus={()=>setHoverKey(cell.key)}
       onBlur={()=>setHoverKey(null)}
       onClick={()=>chooseCell(cell.key)}
       aria-label={(owned?"Seleziona Polytrone acquistato":"Valuta collocazione")+
        " in "+fromLabel(cell)+
        (tileByKey.has(cell.key)?", indizio presente":"")}/>
     })}
    </div>
   </div>
   <div className="resonance-stage-foot">
    <span><b>{pawns.length}</b> Polytroni reali · <b>{layout.tiles.length}</b> indizi</span>
    <span>Per posizionare: tocca una cella, controlla l'anteprima, conferma.</span>
   </div>
   <div className="resonance-legend">
    <span><i className="resonance-legend-dot is-hint"/>Indizio</span>
    <span><i className="resonance-legend-dot is-player"/>Acquistato</span>
    <span><i className="resonance-legend-dot is-forecast"/>Anteprima</span>
    <span><i className="resonance-legend-dot is-ray"/>Influenza</span>
   </div>
   <div className="resonance-display-toggles">
    <label><input type="checkbox" checked={showHeat}
     onChange={e=>setShowHeat(e.target.checked)}/>Soddisfazione degli indizi</label>
    <label><input type="checkbox" checked={showRays}
     onChange={e=>setShowRays(e.target.checked)}/>Legami di risonanza</label>
    <label><input type="checkbox" checked={showGraph}
     onChange={e=>setShowGraph(e.target.checked)}/>Grafo del Mutatron</label>
   </div>
  </section>
  <aside className="kaleido-controls resonance-sidebar">
   <section className="kaleido-control-block">
    <div className="kaleido-section-top">
     <h2>Componi una risposta</h2>
     <strong>{treasury} E</strong>
    </div>
    <p>Il caleidoscopio è un campo di indizi, non un elenco di acquisti.
     Ogni Polytrone può soddisfarne diversi, anche senza occupare le loro celle.
     Ogni nuovo individuo riceve un nome e un'identità <strong>#n</strong>
     permanente, distinta dal numero della manifestazione.</p>
    <div className="resonance-progress">
     <span>Commissioni soddisfatte <b>{completedRequests}</b></span>
     <span>Nuove identità si rivelano acquistando Polytroni</span>
    </div>
    <div className="resonance-budget-row">
     <label>Budget iniziale
      <input type="number" min="10" max="500" step="5"
       value={initialBudget} onChange={e=>setBudget(Number(e.target.value))}
       aria-label="Budget iniziale, resetta la composizione"/></label>
     <div><small>Valore collocato</small><b>{occupiedCost} E</b></div>
    </div>
    <div className="resonance-field-row">
     <label htmlFor="resonance-number">Manifestazione · Nº polytronico</label>
     <input id="resonance-number" type="number" min="1" max="500"
      value={number} disabled={moveFrom!==null||fromHome!==null}
      onChange={e=>setNumber(clamp(Math.floor(Number(e.target.value)||1),1,500))}/>
    </div>
    <div className="resonance-shortcuts">
     {[1,2,3,4,5].map(n=><button key={n} type="button"
      disabled={moveFrom!==null||fromHome!==null}
      className={number===n?"active":""} onClick={()=>setNumber(n)}>
      {GROUP_CODES[n-1]} · {n}</button>)}
    </div>
    <div className="resonance-palette-selects">
     <label>Colore iniziale
      <select value={paletteRow} disabled={moveFrom!==null||fromHome!==null}
       onChange={e=>setPaletteRow(Number(e.target.value))}>
       {LATIN_SOURCES.map((c,i)=><option key={c.id} value={i}>
        {c.name}</option>)}
      </select></label>
     <label>Colore finale
      <select value={paletteCol} disabled={moveFrom!==null||fromHome!==null}
       onChange={e=>setPaletteCol(Number(e.target.value))}>
       {GREEK_DESTINATIONS.map((c,i)=><option key={c.id} value={i}>
        {c.name}</option>)}
      </select></label>
    </div>
    {pawns.length>0&&<div className="resonance-owned-list">
     <span className="resonance-small-title">Polytroni conosciuti</span>
     {pawns.map(p=><button type="button" key={p.seal}
      onClick={()=>{setMoveFrom(p.key);setReturnSeal(null);setPreviewKey(null);}}
      className={moveFrom===p.key?"active":""}>
      <b>#{p.seal} · {p.name}</b>
      <span>manifestazione {p.number} · {GROUP_CODES[groupOf(p.number)-1]}
       {" · "}{valid.get(p.key)?fromLabel(valid.get(p.key)!):p.key}</span>
     </button>)}
    </div>}
    {home.length>0&&<div className="resonance-owned-list">
     <span className="resonance-small-title">
      Identità a Home · ancora disponibili</span>
     {home.map(p=><button type="button" key={p.seal}
      className={returnSeal===p.seal?"active":""}
      onClick={()=>{setReturnSeal(p.seal);setMoveFrom(null);
       setPreviewKey(null);}}>
      <b>#{p.seal} · {p.name}</b>
      <span>manifestazione {p.number} · richiamo {resonanceCost(p.number)} E</span>
     </button>)}
    </div>}
    <p className="resonance-cost-line">
     Costo <strong>{resonanceCost(number)} E</strong> ·
     Gruppo {GROUP_CODES[groupOf(number)-1]} · Periodo {periodOf(number)}
     {" · "}<a href={BASE+"?experiment=polytron-periodic&polytron="+number}>
      Apri nella Tavola ↗</a>
    </p>
    <span className="resonance-small-title">Palette richieste più frequenti</span>
    <div className="resonance-palette-swatches">
     {targetPalettes.map(p=>{
      const a=LATIN_SOURCES[p.row],b=GREEK_DESTINATIONS[p.col];
      return <button key={p.row+","+p.col}
       disabled={moveFrom!==null}
       className={paletteRow===p.row&&paletteCol===p.col?"active":""}
       title={a.name+" → "+b.name+" ("+p.count+" indizi)"}
       aria-label={"Scegli palette "+a.name+" "+b.name}
       onClick={()=>chooseTargetPalette(p.row,p.col)}
       style={{background:"linear-gradient(120deg,"+a.hex+","+b.hex+")"}}/>;
     })}
    </div>
   </section>
   <section className="kaleido-control-block resonance-forecast">
    <h2>{moveFrom?"Spostamento di un Polytrone":
     fromHome?"Richiamo di un'identità da Home":"Anteprima del piazzamento"}</h2>
    {candidate&&activePosition?
     <>
      <p>{moveFrom?"Sposta":fromHome?"Richiama":"Acquista"} manifestazione
       <b> {candidate.number}</b>
       {" "}in {fromLabel(activePosition)}.
       {activeHint?" Cella con indizio del Mutatron.":" Cella senza indizio."}
      </p>
      {activeHint&&<div className="resonance-target-details"
       aria-label="Proprietà del tile richiesto dal Mutatron">
       <div className="resonance-target-title">
        <strong>Tile richiesto dal Mutatron</strong>
        <span>Indizio nella cella {fromLabel(activeHint)}</span>
       </div>
       <div className="resonance-target-palette">
        <span className="resonance-target-swatch" aria-hidden="true"
         style={{background:"linear-gradient(115deg,"+
          LATIN_SOURCES[activeHint.paletteRow].hex+","+
          GREEK_DESTINATIONS[activeHint.paletteCol].hex+")"}}/>
        <span>Palette</span>
        <strong>{LATIN_SOURCES[activeHint.paletteRow].name}
         {" → "}{GREEK_DESTINATIONS[activeHint.paletteCol].name}</strong>
       </div>
       <div className="resonance-target-grid">
        <div><span>Numero polytronico</span>
         <strong>{activeHint.number}</strong></div>
        <div><span>Periodo</span>
         <strong>{periodOf(activeHint.number)}</strong></div>
        <div><span>Gruppo</span>
         <strong>{GROUP_LABELS[groupOf(activeHint.number)-1]}
          {" ("}{GROUP_CODES[groupOf(activeHint.number)-1]}{")"}</strong>
        </div>
       </div>
      </div>}
      <div className="resonance-forecast-row">
       <span>Qualità attuale</span><b>{fmt(planned.quality)}%</b>
      </div>
      <div className="resonance-forecast-row">
       <span>Qualità prevista</span><b>{fmt(preview!.quality)}%</b>
      </div>
      <div className="resonance-forecast-row">
       <span>Variazione</span>
       <b className={scoreDelta>=0?"resonance-positive":"resonance-negative"}>
        {scoreDelta>=0?"+":""}{fmt(scoreDelta)} punti</b>
      </div>
      <div className="resonance-forecast-row">
       <span>Costo adesso</span>
       <b>{moveFrom?"0 (spostamento)":candidateCost+" E"}</b>
      </div>
      <div className="resonance-forecast-row">
       <span>Incremento della ricompensa</span>
       <b className={(marginalReward??0)>0?"resonance-positive":
        (marginalReward??0)<0?"resonance-negative":""}>
        {marginalReward!==null&&marginalReward>0?"+":""}{marginalReward} E</b>
      </div>
      <div className="resonance-forecast-row resonance-net-line">
       <span>Saldo marginale (ricavo aggiuntivo − costo)</span>
       <b className={(marginalNet??0)>=0?"resonance-positive":"resonance-negative"}>
        {marginalNet!==null&&marginalNet>0?"+":""}{marginalNet} E</b>
      </div>
      {marginalNet!==null&&marginalNet<0&&
       <p className="resonance-warning">
        Questo piazzamento non recupera la spesa con la ricompensa
        di questa commissione.</p>}
      {!canPurchase&&<p className="resonance-warning">
       Energia insufficiente per acquistare questa manifestazione.</p>}
      <div className="resonance-purchase-actions">
       <button type="button" className="resonance-confirm" disabled={!canPurchase}
        onClick={commit}>{moveFrom?"Conferma spostamento":
         fromHome?"Conferma richiamo di #"+fromHome.seal:"Conferma acquisto"}</button>
       <button type="button" className="resonance-cancel-purchase"
        onClick={cancelPending}>
        {moveFrom?"Annulla spostamento":
         fromHome?"Annulla richiamo":"Cancella acquisto"}
       </button>
      </div>
     </>:
     <p>Tocca o sorvola una cella libera per vedere dove arrivano le influenze,
      quanto cresce la corrispondenza e quanto costa il Polytrone scelto.</p>}
    {selectedPawn&&<div className="resonance-sell-row">
     <span>#{selectedPawn.seal} · {selectedPawn.name} · manifestazione {selectedPawn.number} ·
      recupero {Math.floor(resonanceCost(selectedPawn.number)/2)} E</span>
     <button type="button" onClick={sell}>Ritira</button>
     <button type="button" onClick={cancelPending}>Annulla</button>
    </div>}
    {lastEvent&&<p className="resonance-action-message" aria-live="polite">
     {lastEvent}</p>}
   </section>
   <section className="kaleido-control-block resonance-metrics">
    <div className="kaleido-section-top">
     <h2>Valutazione della risposta</h2>
     <strong>{fmt(planned.quality)}%</strong>
    </div>
    {([
     ["Palette",visual.color],["Gruppi",visual.group],
     ["Periodi",visual.period],["Grafo",visual.graph],
     ["Simmetria della risposta",visual.symmetry]
    ] as [string,number][]).map(([name,value])=>
     <div className="resonance-meter" key={name}>
      <div><span>{name}</span><b>{fmt(value)}%</b></div>
      <div className="resonance-meter-track">
       <div style={{width:clamp(value,0,100)+"%"}}/>
      </div>
     </div>)}
    <div className="resonance-forecast-row">
     <span>Ricompensa per presentare ora</span>
     <b className="resonance-positive">+{currentReward} E</b>
    </div>
    <div className="resonance-forecast-row">
     <span>Capitale acquistato sulla plancia</span>
     <b>−{occupiedCost} E</b>
    </div>
    <div className="resonance-forecast-row resonance-net-line">
     <span>Saldo teorico da zero (una commissione)</span>
     <b className={fullNet>=0?"resonance-positive":"resonance-negative"}>
      {fullNet>0?"+":""}{fullNet} E</b>
    </div>
    <p>Il capitale già acquistato può essere riutilizzato nelle commissioni
     successive: questo saldo da zero non si ripete a ogni Evolve.</p>
    <button type="button" className="resonance-submit"
     disabled={claimed} onClick={claim}>
     Presenta al Mutatron · +{currentReward} E e prossima richiesta</button>
    <p>La risposta si può presentare una sola volta per commissione.
     I Polytroni acquistati restano sul Mutatron per la successiva.</p>
    <div className="resonance-two-actions">
     <button type="button" onClick={()=>{onEvolve();setPreviewKey(null);}}>
      Evolve senza ricompensa</button>
     <button type="button" onClick={reset}>Azzera risposta</button>
    </div>
   </section>
   <section className="kaleido-control-block resonance-analysis">
    <h2>Difficulty Analyzer</h2>
    <p>Stima la qualità ottenibile con budget differenti, cercando
     collocazioni convenienti per questo specifico caleidoscopio.</p>
    <div className="resonance-field-row">
     <label htmlFor="resonance-reach">Portata di risonanza</label>
     <select id="resonance-reach" value={settings.reach}
      onChange={e=>setSettings({reach:Number(e.target.value) as 1|2|3})}>
      <option value={1}>1 anello · concentrata</option>
      <option value={2}>2 anelli · equilibrata</option>
      <option value={3}>3 anelli · diffusa</option>
     </select>
    </div>
    <p className="resonance-analysis-status" aria-live="polite">
     {analyzerState||"Stima euristica pronta"}
    </p>
    {difficulty&&<>
     <div className="resonance-analysis-grid">
      <div><small>Indice strutturale</small>
       <strong>{difficulty.structural.index.toFixed(1)}</strong></div>
      <div><small>Difficoltà con {difficulty.budget} E</small>
       <strong>{difficulty.rating}</strong></div>
      <div><small>Qualità stimata</small>
       <strong>{fmt(difficulty.expectedScore)}%</strong></div>
      <div><small>70% trovato spendendo</small>
       <strong>{difficulty.estimatedCost70===null?"Non trovato":
        difficulty.estimatedCost70+" E"}</strong></div>
     </div>
     <ResonanceEconomicsPanel
      report={difficulty} selectedId={selectedScenarioId}
      showPlan={showPlan} onSelect={id=>{
       setSelectedScenarioId(id);setShowPlan(true);
      }}
      onToggle={setShowPlan} cells={valid}/>
     <div className="resonance-analysis-detail">
      {difficulty.structural.orbits} orbite occupate ·
      {" "}{difficulty.structural.palettes} palette ·
      {" "}{difficulty.structural.groups} gruppi ·
      {" "}{difficulty.structural.periods} periodi ·
      {" "}{difficulty.structural.edges} archi.
     </div>
     {difficulty.nextMove&&<div className="resonance-suggest">
      <p>Possibile prossima mossa: manifestazione {difficulty.nextMove.number}
       {" "}in {fromLabel(valid.get(difficulty.nextMove.key)!)}.
       {" "}Corrispondenza prevista {fmt(difficulty.nextMoveQuality??0)}%.
       {" "}Ricavo aggiuntivo
       {" "}{difficulty.nextMoveRewardGain!==null&&difficulty.nextMoveRewardGain>0?"+":""}
       {difficulty.nextMoveRewardGain} E;
       {" "}saldo marginale
       {" "}<b className={(difficulty.nextMoveNetGain??0)>=0?
        "resonance-positive":"resonance-negative"}>
        {difficulty.nextMoveNetGain!==null&&difficulty.nextMoveNetGain>0?"+":""}
        {difficulty.nextMoveNetGain} E</b>.</p>
      <button type="button" onClick={suggest}
       disabled={treasury<resonanceCost(difficulty.nextMove.number)}>
       Prepara la mossa suggerita</button>
     </div>}
    </>}
    <p className="resonance-method-note">
     Metodo: ricerca greedy limitata, non ottimo matematico garantito.
     Le configurazioni sono esempi fattibili, non tutte le possibilità.
     Il costo minimo e la difficoltà sono stime; gli importi
     sono invece calcolati con le regole economiche correnti.
    </p>
   </section>
  </aside>
 </div>;
}
