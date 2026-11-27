import {useEffect,useMemo,useRef,useState} from "react";
import {SharedPeriodic3D} from "@/experiments/PolytronPeriodicLab";
import ResonanceEconomicsPanel from "@/experiments/ResonanceEconomicsPanel";
import {gradientPair,LATIN_SOURCES,GREEK_DESTINATIONS} from "@/polytron/gradientPalettes";
import {rcAxial,rcPolygon} from "@/polytron/rc01Board";
import type {KaleidoLayout,KaleidoTile} from "@/polytron/kaleidoscopeGenerator";
import {
 DEFAULT_RESONANCE_SETTINGS,evaluateResonance,
 resonanceEnergy,resonanceReward,resonanceComplexity,
 type ResonancePawn,type ResonanceSettings,type ResonanceScore
} from "@/polytron/resonanceField";
import type {DifficultyReport} from "@/polytron/resonanceDifficulty";
import {polytronDance,type DanceResult} from "@/polytron/polytronDance";
import {
 RESONANCE_CALIBRATION_PRESETS,calibrationPresetFor,inspectResonanceDensity,
 type ResonanceCalibrationPreset
} from "@/polytron/resonanceCalibration";
import {groupOf,periodOf,GROUP_CODES,GROUP_LABELS} from "@/polytron/mindeleevLife";
import {dnaFromPolitronNumber} from "@/polytron/politronicNumber";
import {sealName} from "@/polytron/spectralFutures";
import "./ResonancePlayground.css";

const BASE=import.meta.env.BASE_URL;
const fromLabel=(p:{ring:number;idx:number})=>"("+p.ring+","+p.idx+")";
const fmt=(x:number)=>x.toFixed(1);
const signed=(x:number)=>(x>0?"+":"")+x;
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
 onGenesis:()=>void;
 onLoadPreset:(preset:ResonanceCalibrationPreset)=>void
};
export default function ResonancePlayground({
 layout,onEvolve,onGenesis,onLoadPreset
}:Props){
 const radius=layout.params.radius;
 const recipeKey=[radius,layout.params.family,layout.params.symmetry,
  layout.params.seed].join("|");
 const [selectedCalibrationId,setSelectedCalibrationId]=
  useState<ResonanceCalibrationPreset["id"]>(
   ()=>calibrationPresetFor(layout.params)?.id??"A");
 const [initialBudget,setInitialBudget]=useState(48);
 const [treasury,setTreasury]=useState(48);
 const [pawns,setPawns]=useState<OwnedPolytron[]>([]);
 const [home,setHome]=useState<OwnedPolytron[]>([]);
 const [returnSeal,setReturnSeal]=useState<number|null>(null);
 const [nextSeal,setNextSeal]=useState(1);
 const [completedRequests,setCompletedRequests]=useState(0);
 const [number,setNumber]=useState(2);
 const [editNumber,setEditNumber]=useState(2);
 const [danceInfo,setDanceInfo]=useState<DanceResult<OwnedPolytron>|null>(null);
 const lastEvolution=useRef({recipe:"",generation:-1});
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
 const density=useMemo(()=>inspectResonanceDensity(
  layout,pawns.map(p=>p.key)),[layout,pawns]);
 const activePreset=calibrationPresetFor(layout.params);
 const selectedCalibration=RESONANCE_CALIBRATION_PRESETS.find(p=>
  p.id===selectedCalibrationId)!;
 const tileByKey=new Map(layout.tiles.map(t=>[t.key,t]));
 // A click pins the trial destination until the user chooses another.
 const activeCell=previewKey??hoverKey;
 const fromHome=home.find(p=>p.seal===returnSeal)??null;
 const existing=moveFrom?pawnByKey.get(moveFrom):fromHome;
 const candidateNumber=existing?.number??number;
 const candidateRow=existing?.paletteRow??paletteRow;
 const candidateCol=existing?.paletteCol??paletteCol;
 // Individual energy limits simultaneous occupancy; it is never consumed.
 const candidateEnergy=moveFrom?0:resonanceEnergy(candidateNumber);
 const committedEnergy=pawns.reduce((sum,p)=>sum+resonanceEnergy(p.number),0);
 const canPlace=moveFrom!==null||committedEnergy+candidateEnergy<=treasury;
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
 const editedEnergy=selectedPawn?resonanceEnergy(editNumber):0;
 const previousEnergy=selectedPawn?resonanceEnergy(selectedPawn.number):0;
 const editFits=Boolean(selectedPawn)&&
  committedEnergy-previousEnergy+editedEnergy<=treasury;
 const editedPawns=useMemo(()=>selectedPawn?pawns.map(p=>p.seal===selectedPawn.seal?
  {...p,number:editNumber}:p):null,[pawns,selectedPawn?.seal,editNumber]);
 const editedScore=useMemo(()=>editedPawns?
  evaluateResonance(layout,editedPawns,settings):null,
  [layout,editedPawns,settings]);
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
 const selectedScenario=difficulty?.scenarios.find(x=>x.id===selectedScenarioId)
  ??difficulty?.scenarios[0];
 const hintsByKey=new Map(visual.hintResults.map(h=>[h.key,h]));
 const occupiedEnergy=planned.totalEnergy;
 const freeEnergy=treasury-occupiedEnergy;
 const isEditPreview=Boolean(selectedPawn&&editNumber!==selectedPawn.number);
 const forecastScore=preview??(isEditPreview?editedScore:null);
 const forecastReward=forecastScore?
  resonanceReward(layout,forecastScore.quality):null;
 const rewardDelta=forecastReward===null?null:forecastReward-currentReward;
 const forecastCommitted=preview&&trialPawns?
  trialPawns.reduce((sum,p)=>sum+resonanceEnergy(p.number),0):
  isEditPreview?committedEnergy-previousEnergy+editedEnergy:occupiedEnergy;
 const forecastFree=treasury-forecastCommitted;
 const forecastValid=preview?canPlace:isEditPreview?editFits:true;
 const pinnedCandidate=Boolean(candidate&&previewKey===candidate.key);
 const plannerBudget=clamp(treasury,2,10000);
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
  setClaimed(false);setLastEvent("");setDanceInfo(null);
 // Intentional: a new recipe is a new research scenario; evolution is not.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[recipeKey]);
 useEffect(()=>{setClaimed(false);},[layout.params.generation]);
 // Target evolves first, then Dance reorganizes the owned board.
 // A new recipe never triggers an inherited Dance.
 useEffect(()=>{
  const previous=lastEvolution.current;
  lastEvolution.current={recipe:recipeKey,generation:layout.params.generation};
  if(previous.recipe!==recipeKey||previous.generation<0||
   previous.generation===layout.params.generation)return;
  const result=polytronDance(layout,pawns,settings);
  setPawns(result.pawns);
  setDanceInfo(result);
  setLastEvent("Polytron Dance: "+result.moved+" spostamenti · simmetria "+
   fmt(result.beforeSymmetry)+"% → "+fmt(result.afterSymmetry)+
   "% · Δ ricompensa "+(result.afterReward-result.beforeReward)+" E.");
 // Only evolution/recipe must trigger Dance, not a reach change.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[layout.params.generation,recipeKey]);

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
   setEditNumber(pawnByKey.get(key)!.number);
   setReturnSeal(null);
   setPreviewKey(null);
  }else setPreviewKey(key);
 };
 const cancelPending=()=>{
  // Discard selection and ghost preview; never change energy or identity.
  setPreviewKey(null);
  setHoverKey(null);
  setMoveFrom(null);
  setReturnSeal(null);
  setNumber(2);
  setPaletteRow(10);
  setPaletteCol(10);
  setLastEvent("Scelta annullata: nessuna collocazione o energia modificata.");
 };
 const commit=()=>{
  if(!candidate||!canPlace)return;
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
  const energy=resonanceEnergy(selectedPawn.number);
  setPawns(old=>old.filter(p=>p.key!==moveFrom));
  setHome(old=>[...old,selectedPawn]);
  setLastEvent("#"+selectedPawn.seal+" · "+selectedPawn.name+
   " torna a Home con "+energy+" E intatti: la capacità si libera.");
  setPreviewKey(null);setHoverKey(null);setMoveFrom(null);
  setReturnSeal(selectedPawn.seal);
 };
 const applyEdit=()=>{
  if(!selectedPawn||!editFits)return;
  setPawns(old=>old.map(p=>p.seal===selectedPawn.seal?
   {...p,number:editNumber}:p));
  setLastEvent("Polytrone #"+selectedPawn.seal+" modificato: "+
   selectedPawn.number+" → "+editNumber+" · energia in plancia "+
   (committedEnergy-previousEnergy+editedEnergy)+" E"+
   " (variazione "+(editedEnergy-previousEnergy)+" E).");
 };
 const reset=()=>{
  setHome(old=>[...old,...pawns]);
  setPawns([]);setMoveFrom(null);
  setReturnSeal(null);setPreviewKey(null);setHoverKey(null);
  setLastEvent("Tutti a Home: l'energia degli individui rimane intatta.");
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
 const advance=(submit:boolean)=>{
  if(claimed)return;
  // No fees: Mutatron Evolve and Polytron movements conserve energy.
  const reward=submit?currentReward:0;
  if(reward)setTreasury(old=>old+reward);
  setClaimed(true);
  if(submit)setCompletedRequests(old=>old+1);
  setLastEvent((submit?"Risposta presentata":"Evolve libero")+
   ": "+(submit?"ricompensa +"+reward+" E. ":"nessun costo. ")+
   "I Polytroni conservano energia e partirà la Dance.");
  setHoverKey(null);setPreviewKey(null);setMoveFrom(null);
  onEvolve();
 };
 const claim=()=>advance(true);
 const suggest=()=>{
  if(!difficulty?.nextMove)return;
  const next=difficulty.nextMove;
  if(pawnByKey.has(next.key)||occupiedEnergy+resonanceEnergy(next.number)>treasury)return;
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
    <div className="resonance-head-main">
     <div className="resonance-head-identity"><b>Campo di risonanza</b>
      <small>{layout.params.family} · {layout.params.symmetry} · raggio {radius}</small>
     </div>
     <div className="resonance-head-reach">
      <label htmlFor="resonance-reach">Portata di risonanza</label>
      <select id="resonance-reach" value={settings.reach}
       onChange={e=>setSettings({reach:Number(e.target.value) as 1|2|3})}
       title="Portata degli effetti sui tiles e del Difficulty Analyzer">
       <option value={1}>1 anello · concentrata</option>
       <option value={2}>2 anelli · equilibrata</option>
       <option value={3}>3 anelli · diffusa</option>
      </select>
     </div>
     <div className="resonance-head-score">
      <strong>{fmt(planned.quality)}%</strong>
      {forecastScore&&<span className={forecastScore.quality>=planned.quality?"resonance-positive":"resonance-negative"}>
       → {fmt(forecastScore.quality)}% ({fmt(forecastScore.quality-planned.quality)} pt)
      </span>}
     </div>
    </div>
    <div className="resonance-head-energy" aria-label="Energia attuale e previsione della mossa">
     <div className="resonance-head-energy-cell">
      <small>Saldo ENERGY attuale</small>
      <strong>{treasury} E</strong>
      <span>Dopo presentazione {treasury+(forecastReward??currentReward)} E
       {forecastReward!==null?" · con anteprima":""}</span>
     </div>
     <div className="resonance-head-energy-cell">
      <small>Energia impegnata in plancia</small>
      <strong>{occupiedEnergy} E
       {forecastScore&&<em> → {forecastCommitted} E</em>}</strong>
      <span>Capacità occupata dai Polytroni</span>
     </div>
     <div className="resonance-head-energy-cell">
      <small>Energia libera</small>
      <strong>{freeEnergy} E
       {forecastScore&&<em> → {forecastFree} E</em>}</strong>
      <span>Capacità per altre manifestazioni</span>
     </div>
     <div className="resonance-head-energy-cell">
      <small>Ricompensa se presenti</small>
      <strong>+{currentReward} E
       {forecastReward!==null&&<em> → +{forecastReward} E</em>}</strong>
      <span className={rewardDelta!==null&&rewardDelta<0?"resonance-negative":rewardDelta!==null&&rewardDelta>0?"resonance-positive":""}>
       {rewardDelta===null?"Stima attuale, non incassata":
        "Δ premio "+signed(rewardDelta)+" E · ipotetico"}
      </span>
     </div>
    </div>
    {forecastScore&&!forecastValid&&<p className="resonance-head-alert">
     Anteprima non confermabile: capacità ENERGY insufficiente.
    </p>}
   </div>
   <div className="kaleido-artboard resonance-artboard">
    <svg className="kaleido-svg" viewBox="0 0 800 800" role="img"
     aria-label={"Campo di "+layout.tiles.length+" indizi, "+
      pawns.length+" Polytroni in plancia"}>
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
      return <line key={"requested-"+edge.from+"|"+edge.to}
       x1={a.x} y1={a.y} x2={b.x} y2={b.y}
       stroke={edge.kind==="star"?"#d2a778":"#559cac"}
       strokeWidth={edge.kind==="star"?1.9:1.1}
       strokeOpacity={.2}/>;
     })}
     {showGraph&&visual.graphResults.map(edge=>{
      const a=circleFor(edge.from),b=circleFor(edge.to);
      return <line key={"player-"+edge.from+"|"+edge.to}
       x1={a.x} y1={a.y} x2={b.x} y2={b.y}
       stroke="#f5dca0" strokeWidth="3.4"
       strokeOpacity=".85"/>;
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
       fill={selectedScenario.quality>=50?"#78d5ab":"#ec927b"}
       fillOpacity=".15" stroke={selectedScenario.quality>=50?"#86c9da":"#f2a293"}
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
       fill={canPlace?"#8bf4b0":"#ff8b83"}
       fillOpacity=".10" stroke={canPlace?"#baf9b4":"#ff8072"}
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
     {candidate&&canPlace&&activePosition&&(()=>{
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
       aria-label={(owned?"Seleziona Polytrone presente":"Valuta collocazione")+
        " in "+fromLabel(cell)+
        (tileByKey.has(cell.key)?", indizio presente":"")}/>
     })}
    </div>
   </div>
   <div className="resonance-stage-foot">
    <span><b>{pawns.length}</b> Polytroni reali · <b>{layout.tiles.length}</b> indizi</span>
    <span>{selectedPawn?
     "Selezionato #"+selectedPawn.seal+": modifica gruppo, periodo o numero qui sotto.":
     "Per posizionare: tocca una cella, controlla l'anteprima, conferma."}</span>
   </div>
    {selectedPawn&&<div className="resonance-edit-panel resonance-board-editor" id="resonance-board-editor" aria-label="Modifica Polytrone selezionato">
     <div className="resonance-edit-heading">
      <h3>Modifica Polytrone #{selectedPawn.seal} · {selectedPawn.name}</h3>
      <button type="button" onClick={cancelPending} aria-label="Chiudi editor Polytrone">Chiudi</button>
     </div>
     <p>La nuova manifestazione aggiorna energia impegnata, risonanza e
      valutazione. L’identità del Polytrone rimane invariata.</p>
     <div className="resonance-edit-grid">
      <label>Gruppo
       <select value={groupOf(editNumber)} onChange={e=>
        setEditNumber((periodOf(editNumber)-1)*5+Number(e.target.value))}>
        {GROUP_LABELS.map((g,i)=><option value={i+1} key={g}>
         {GROUP_CODES[i]} · {g}</option>)}
       </select></label>
      <label>Periodo
       <select value={periodOf(editNumber)} onChange={e=>
        setEditNumber((Number(e.target.value)-1)*5+groupOf(editNumber))}>
        {Array.from({length:100},(_,i)=><option key={i} value={i+1}>
         {i+1}</option>)}
       </select></label>
      <label>Numero polytronico
       <input type="number" min="1" max="500" value={editNumber}
        onChange={e=>setEditNumber(clamp(Math.floor(Number(e.target.value)||1),1,500))}/>
      </label>
     </div>
     <p>Energia {previousEnergy} → <strong>{editedEnergy} E</strong>
      {" · "}Plancia {committedEnergy} →
      {" "}{committedEnergy-previousEnergy+editedEnergy} / {treasury} E
      {" · "}Qualità {fmt(planned.quality)} → {fmt(editedScore?.quality??planned.quality)}%</p>
     {!editFits&&<p className="resonance-warning">Energia disponibile insufficiente:
      scegli una manifestazione meno energetica.</p>}
     <button type="button" className="resonance-confirm"
      disabled={!editFits||editNumber===selectedPawn.number}
      onClick={applyEdit}>Conferma modifica di #{selectedPawn.seal}</button>
    </div>}
   {!moveFrom&&candidate&&activePosition&&<div className="resonance-board-action-panel" aria-label="Anteprima e conferma del piazzamento o richiamo">
    <div className="resonance-board-action-info">
     <b>{fromHome?"Richiama":"Piazza"} Polytrone {candidate.number} in {fromLabel(activePosition)}</b>
     <span>Qualità {fmt(planned.quality)} → {fmt(preview?.quality??planned.quality)}% ·
      premio +{currentReward} → +{previewReward??currentReward} E
      {marginalReward!==null&&" (Δ "+signed(marginalReward)+" E)"}</span>
    </div>
    {pinnedCandidate?
     <div className="resonance-purchase-actions">
      <button type="button" className="resonance-confirm" disabled={!canPlace}
       onClick={commit}>{fromHome?"Conferma richiamo di #"+fromHome.seal:"Conferma piazzamento"}</button>
      <button type="button" className="resonance-cancel-purchase"
       onClick={cancelPending}>{fromHome?"Annulla richiamo":"Cancella piazzamento"}</button>
     </div>:
     <span className="resonance-board-click-hint">Tocca la cella di destinazione per fissare l'anteprima e abilitare la conferma.</span>}
   </div>}
   {selectedPawn&&<div className="resonance-sell-row resonance-board-sell-row">
    <span>#{selectedPawn.seal} · {selectedPawn.name} · numero {selectedPawn.number} · {resonanceEnergy(selectedPawn.number)} E intrinseci</span>
    <button type="button" onClick={sell}>Ritira a Home</button>
    <button type="button" onClick={cancelPending}>Annulla selezione</button>
   </div>}
   <div className="resonance-legend">
    <span><i className="resonance-legend-dot is-hint"/>Indizio</span>
    <span><i className="resonance-legend-dot is-player"/>In plancia</span>
    <span><i className="resonance-legend-dot is-forecast"/>Anteprima</span>
    <span><i className="resonance-legend-dot is-ray"/>Influenza</span>
   </div>
   {lastEvent&&<p className="resonance-action-message resonance-board-status" role="status">
    {lastEvent}</p>}
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
   <section className="kaleido-control-block resonance-calibration">
    <div className="kaleido-section-top">
     <h2>Laboratorio preset</h2>
     <strong>6 casi</strong>
    </div>
    <p>Richieste di riferimento prodotte dal generatore artistico, senza modificarlo.</p>
    <label htmlFor="resonance-calibration-select">Configurazione da confrontare</label>
    <select id="resonance-calibration-select" value={selectedCalibrationId}
     onChange={e=>setSelectedCalibrationId(
      e.target.value as ResonanceCalibrationPreset["id"])}>
     {RESONANCE_CALIBRATION_PRESETS.map(p=><option key={p.id} value={p.id}>
      {p.id} · {p.title} · {p.expectedHints}/{3*p.params.radius*(p.params.radius+1)} indizi
     </option>)}
    </select>
    <p className="resonance-calibration-intention">{selectedCalibration.intention}</p>
    <button className="resonance-calibration-load" type="button"
     onClick={()=>onLoadPreset(selectedCalibration)}>
     Carica {selectedCalibration.id} · riparti da zero
    </button>
    <p className="resonance-calibration-warning">Caricare un preset azzera
     Polytroni, Home, saldo e commissioni del laboratorio.
     Evolve resta disponibile e conserva il suo comportamento.</p>
   </section>
   <section className="kaleido-control-block resonance-calibration resonance-density-panel">
    <div className="resonance-calibration-heading">
     <h3>Densità della richiesta attuale</h3>
     <span>{activePreset?"Preset "+activePreset.id:"Esplorazione libera"} ·
      generazione {layout.params.generation}</span>
    </div>
    <div className="resonance-calibration-metrics">
     <div><small>Indizi</small>
      <strong>{density.hintCells} / {density.playableCells}</strong>
      <span>{fmt(density.hintPercent)}% del campo</span>
     </div>
     <div><small>Senza indizi</small>
      <strong>{density.withoutHintCells}</strong>
      <span>Celle senza richiesta</span>
     </div>
     <div><small>Celle libere</small>
      <strong>{density.freePlacementCells}</strong>
      <span>Disponibili al giocatore</span>
     </div>
     <div><small>Orbite con indizi</small>
      <strong>{density.occupiedOrbits} / {density.availableOrbits}</strong>
      <span>{density.distinctPalettes} palette · {density.distinctGroups} gruppi</span>
     </div>
    </div>
    <details className="resonance-calibration-rings">
     <summary>Distribuzione per anello</summary>
     {density.rings.map(r=><div key={r.ring} className="resonance-calibration-ring">
      <span>R{r.ring}</span>
      <div className="resonance-calibration-track" aria-hidden="true">
       <div style={{width:100*r.hints/r.slots+"%"}}/>
      </div>
      <strong>{r.hints}/{r.slots}</strong>
     </div>)}
    </details>
    <p className="resonance-calibration-note">Gli indizi non bloccano
     il piazzamento: solo i {density.playerOccupiedCells} Polytroni
     presenti occupano celle. {density.playersOnHints} sono sopra indizi.</p>
   </section>
   <section className="kaleido-control-block">
    <div className="kaleido-section-top">
     <h2>Componi una risposta</h2>
     <strong>{treasury} E</strong>
    </div>
    <p>Il caleidoscopio è un campo di indizi. I Polytroni entrano ed escono
     dalla plancia <b>conservando la propria energia</b>: nessun acquisto
     e nessun costo di evoluzione. Ogni individuo ha un nome e una
     identità <strong>#n</strong> permanente.</p>
    <div className="resonance-progress">
     <span>Commissioni soddisfatte <b>{completedRequests}</b></span>
     <span>Nuove identità si rivelano manifestandosi</span>
    </div>
    <div className="resonance-budget-row">
     <label>Energia iniziale
      <input type="number" min="10" max="500" step="5"
       value={initialBudget} onChange={e=>setBudget(Number(e.target.value))}
       aria-label="Energia iniziale, resetta la composizione"/></label>
     <div><small>Energia in plancia</small><b>{occupiedEnergy} E</b><small>Libera: {freeEnergy} E</small></div>
    </div>
    {!selectedPawn&&<div className="resonance-field-row">
     <label htmlFor="resonance-number">Manifestazione · Nº polytronico</label>
     <input id="resonance-number" type="number" min="1" max="500"
      value={number} disabled={moveFrom!==null||fromHome!==null}
      onChange={e=>setNumber(clamp(Math.floor(Number(e.target.value)||1),1,500))}/>
    </div>}
    {!selectedPawn&&<div className="resonance-shortcuts">
     {[1,2,3,4,5].map(n=><button key={n} type="button"
      disabled={moveFrom!==null||fromHome!==null}
      className={number===n?"active":""} onClick={()=>setNumber(n)}>
      {GROUP_CODES[n-1]} · {n}</button>)}
    </div>}
    {!selectedPawn&&<div className="resonance-palette-selects">
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
    </div>}
    {selectedPawn&&<p className="resonance-selected-guidance">Selezionato <strong>#{selectedPawn.seal} · {selectedPawn.name}</strong>. Puoi modificarne il numero, il gruppo e il periodo nel pannello subito sotto il Mutatron; oppure selezionare una casella libera per spostarlo.</p>}
    {pawns.length>0&&<div className="resonance-owned-list">
     <span className="resonance-small-title">Polytroni conosciuti</span>
     {pawns.map(p=><button type="button" key={p.seal}
      onClick={()=>{setMoveFrom(p.key);setEditNumber(p.number);
       setReturnSeal(null);setPreviewKey(null);}}
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
      <span>manifestazione {p.number} · energia intatta {resonanceEnergy(p.number)} E</span>
     </button>)}
    </div>}
    {!selectedPawn&&<p className="resonance-cost-line">
     Energia intrinseca <strong>{resonanceEnergy(number)} E</strong> ·
     Gruppo {GROUP_CODES[groupOf(number)-1]} · Periodo {periodOf(number)}
     {" · "}<a href={BASE+"?experiment=polytron-periodic&polytron="+number}>
      Apri nella Tavola ↗</a>
    </p>}
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
      <p>{moveFrom?"Sposta":fromHome?"Richiama":"Manifesta"} manifestazione
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
       <span>Energia del Polytrone</span>
       <b>{resonanceEnergy(candidate.number)} E · conservata</b>
      </div>
      <div className="resonance-forecast-row">
       <span>Capacità libera dopo il piazzamento</span>
       <b className={canPlace?"resonance-positive":"resonance-negative"}>
        {freeEnergy-candidateEnergy} E</b>
      </div>
      <div className="resonance-forecast-row resonance-net-line">
       <span>Variazione della ricompensa prevista</span>
       <b className={(marginalReward??0)>=0?"resonance-positive":"resonance-negative"}>
        {marginalReward!==null&&marginalReward>0?"+":""}{marginalReward} E
       </b>
      </div>
      <p>La manifestazione impegna capacità senza spenderla.
       {moveFrom?"Conferma o annulla lo spostamento qui sotto.":"Conferma o cancella il piazzamento direttamente sotto il Mutatron."}</p>
      {!canPlace&&<p className="resonance-warning">
       Capacità insufficiente per questa manifestazione:
       manda un individuo a Home o modifica l'energia iniziale
       dello scenario sperimentale.</p>}
     </>:
     <p>Tocca o sorvola una cella libera per vedere dove arrivano le influenze,
      quanto cresce la corrispondenza e quanta energia resta libera.</p>}
    {moveFrom&&<div className="resonance-purchase-actions resonance-move-actions" aria-label="Conferma o annulla spostamento del Polytrone">
     <button type="button" className="resonance-confirm"
      disabled={!pinnedCandidate||!canPlace} onClick={commit}>Conferma spostamento</button>
     <button type="button" className="resonance-cancel-purchase"
      onClick={cancelPending}>Annulla spostamento</button>
    </div>}
   </section>
   <section className="kaleido-control-block resonance-metrics">
    <div className="kaleido-section-top">
     <h2>Valutazione della risposta</h2>
     <strong>{fmt(planned.quality)}%</strong>
    </div>
    <div className="resonance-score-axis">
     <strong>Risonanza locale</strong>
     <span>{fmt(visual.local)}% · peso 78%</span>
    </div>
    {([
     ["Palette",visual.color],["Gruppi",visual.group],
     ["Periodi",visual.period]
    ] as [string,number][]).map(([name,value])=>
     <div className="resonance-meter" key={name}>
      <div><span>{name}</span><b>{fmt(value)}%</b></div>
      <div className="resonance-meter-track">
       <div style={{width:clamp(value,0,100)+"%"}}/>
      </div>
     </div>)}
    <div className="resonance-score-axis">
     <strong>Armonia strutturale</strong>
     <span>{fmt(visual.structural)}% · peso 22%</span>
    </div>
    {([
     ["Grafo dei Polytroni",visual.graph],
     ["Simmetria delle posizioni",visual.symmetry]
    ] as [string,number][]).map(([name,value])=>
     <div className="resonance-meter" key={name}>
      <div><span>{name}</span><b>{fmt(value)}%</b></div>
      <div className="resonance-meter-track">
       <div style={{width:clamp(value,0,100)+"%"}}/>
      </div>
     </div>)}
    <div className="resonance-forecast-row">
     <span>Ricompensa per presentare la commissione</span>
     <b className="resonance-positive">+{currentReward} E</b>
    </div>
    <div className="resonance-forecast-row">
     <span>Energia conservata sulla plancia</span>
     <b>{occupiedEnergy} / {treasury} E</b>
    </div>
    <div className="resonance-forecast-row resonance-net-line">
     <span>Energia libera per altre manifestazioni</span>
     <b>{freeEnergy} E</b>
    </div>
    <p>Non ci sono costi per gli individui né per Evolve.
     L'energia resta legata a ciascun Polytrone e si libera quando
     rientra a Home. Solo la presentazione accredita la ricompensa.</p>
    <button type="button" className="resonance-submit"
     disabled={claimed} onClick={claim}>
     Presenta al Mutatron · +{currentReward} E ed Evolve</button>
    <p>Ogni commissione può essere presentata una sola volta.
     Evolve avvia la Polytron Dance, che conserva l’energia e cerca
     configurazioni simmetriche con resa prevista non positiva.</p>
    {danceInfo&&<p className="resonance-action-message" role="status">
     Ultima Polytron Dance: <strong>{danceInfo.moved} spostamenti</strong> ·
     simmetria visiva {fmt(danceInfo.beforeVisualSymmetry)}% →
     {" "}{fmt(danceInfo.afterVisualSymmetry)}% ·
     {" "}Δ ricompensa prevista {danceInfo.afterReward-danceInfo.beforeReward} E.
     {danceInfo.status==="fallback"&&
      " Nessun candidato ha rispettato completamente il vincolo di resa: il movimento resta gratuito, ma la ricompensa teorica è fuori obiettivo."}
     {danceInfo.status==="relaxed"&&
      " Nessuna disposizione entro −1 E trovata: movimento più sfavorevole."}
     {danceInfo.moved===0&&" Nessun movimento ammissibile trovato."}
    </p>}
    <div className="resonance-two-actions">
     <button type="button" disabled={claimed} onClick={()=>advance(false)}>
      Evolve senza presentare · gratuito</button>
     <button type="button" onClick={reset}>Tutti a Home</button>
    </div>
   </section>
   <section className="kaleido-control-block resonance-analysis resonance-analysis-summary">
    <h2>Difficulty Analyzer · Sintesi</h2>
    <p>Qualità raggiungibile, capacità e difficoltà stimata.
     Le analisi sono euristiche, non ottimi garantiti.</p>
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
      <div><small>70% raggiunto con energia</small>
       <strong>{difficulty.estimatedEnergy70===null?"Non trovato":
        difficulty.estimatedEnergy70+" E"}</strong></div>
     </div>
     <div className="resonance-analysis-detail">
      {difficulty.structural.orbits} orbite occupate ·
      {" "}{difficulty.structural.palettes} palette ·
      {" "}{difficulty.structural.groups} gruppi ·
      {" "}{difficulty.structural.periods} periodi ·
      {" "}{difficulty.structural.edges} archi.
     </div>
     {difficulty.nextMove&&<div className="resonance-suggest">
      <p>Prossima mossa suggerita: manifestazione {difficulty.nextMove.number}
       {" "}in {fromLabel(valid.get(difficulty.nextMove.key)!)}.
       {" "}Qualità prevista {fmt(difficulty.nextMoveQuality??0)}%;
       {" "}Δ premio {difficulty.nextMoveRewardGain!==null&&
         difficulty.nextMoveRewardGain>0?"+":""}
       {difficulty.nextMoveRewardGain} E;
       {" "}impegno {difficulty.nextMoveEnergy} E;
       {" "}resa {difficulty.nextMoveYield?.toFixed(2)} E/E.</p>
      <button type="button" onClick={suggest}
       disabled={occupiedEnergy+resonanceEnergy(difficulty.nextMove.number)>treasury}>
       Prepara la mossa suggerita</button>
     </div>}
    </>}
   </section>
   {difficulty&&<>
    <section className="kaleido-control-block resonance-analysis resonance-analysis-strategies">
     <h2>Difficulty Analyzer · Strategie</h2>
     <ResonanceEconomicsPanel section="strategies"
      report={difficulty} selectedId={selectedScenarioId}
      showPlan={showPlan} onSelect={id=>{
       setSelectedScenarioId(id);setShowPlan(true);
      }}
      onToggle={setShowPlan} cells={valid}/>
    </section>
    <section className="kaleido-control-block resonance-analysis resonance-analysis-frontier">
     <h2>Difficulty Analyzer · Frontiera energetica</h2>
     <ResonanceEconomicsPanel section="frontier"
      report={difficulty} selectedId={selectedScenarioId}
      showPlan={showPlan} onSelect={id=>{
       setSelectedScenarioId(id);setShowPlan(true);
      }}
      onToggle={setShowPlan} cells={valid}/>
    </section>
    <section className="kaleido-control-block resonance-analysis resonance-analysis-risks">
     <h2>Difficulty Analyzer · Rischi e mosse sfavorevoli</h2>
     <ResonanceEconomicsPanel section="risks"
      report={difficulty} selectedId={selectedScenarioId}
      showPlan={showPlan} onSelect={id=>{
       setSelectedScenarioId(id);setShowPlan(true);
      }}
      onToggle={setShowPlan} cells={valid}/>
    </section>
   </>}
  </aside>
 </div>;
}
