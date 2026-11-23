import {useEffect,useMemo,useRef,useState} from "react";
import {makeRCBoard,rcCellCoordinates,type RCCell} from "@/polytron/rc01Board";
import {initialRCGame,moveRCPawn,recallRCParity,
 returnRCPawnToCell,rcHomeCooldown,rcParity,
 pawnDNA,pawnName,pawnPalette,
 type RCGame,type RCPawn,type RCHomeParity} from "@/polytron/rc01Game";
import {gradientCss} from "@/polytron/gradientPalettes";
import {forecastRCMutatron,mutatronCounts} from "@/polytron/rc01Mutatron";
import RC01ThreeBoard,{type RCCameraCommand} from "@/experiments/RC01ThreeBoard";
import type {RCViewMode} from "@/experiments/rc01Camera";
import RC01ThreeInspector from "@/experiments/RC01ThreeInspector";
import RC01ManifestationHistory from "@/experiments/RC01ManifestationHistory";
import RC01MnemeHistory from "@/experiments/RC01MnemeHistory";
import {intrinsicEnergy} from "@/polytron/mindeleevLife";
import "./MindeleevRC01.css";

type Sheet={kind:"polytron";seal:number}|{kind:"cell";key:string}|{kind:"home";parity?:RCHomeParity}|null;
const INITIAL_VIEWPORT={width:390,height:700,ready:false};

export default function MindeleevRC01(){
 const stageRef=useRef<HTMLDivElement>(null);
 const [viewport,setViewport]=useState(INITIAL_VIEWPORT);
 const board=useMemo(()=>makeRCBoard(viewport.width,viewport.height),
  [viewport.width,viewport.height]);
 const [game,setGame]=useState<RCGame|null>(null);
 const [sheet,setSheet]=useState<Sheet>(null);
 const [manifestationIndex,setManifestationIndex]=useState<number|null>(null);
 // Touch selection is persistent; only Info opens the modal. Mouse clicks
 // keep their existing inspector behaviour.
 const [selectedSeal,setSelectedSeal]=useState<number|null>(null);
 const [physicsBusy,setPhysicsBusy]=useState(false);
 const [cameraCommand,setCameraCommand]=useState<RCCameraCommand|null>(null);
 const [viewMode,setViewMode]=useState<RCViewMode>("map");
 const physicsBusyRef=useRef(false);
 const measureRef=useRef<(()=>void)|null>(null);
 const onPhysicsBusy=(busy:boolean)=>{
  physicsBusyRef.current=busy;
  setPhysicsBusy(busy);
  // Mobile browser viewport changes must never replace the physics scene
  // mid-flight. Reconcile the final size after the committed game update.
  if(!busy)requestAnimationFrame(()=>measureRef.current?.());
 };
 useEffect(()=>{
  const node=stageRef.current;if(!node)return;
  const measure=()=>{
   if(physicsBusyRef.current)return;
   const bounds=node.getBoundingClientRect();
   const width=Math.round(bounds.width),height=Math.round(bounds.height);
   if(width>=280&&height>=350)setViewport(previous=>
    previous.width===width&&previous.height===height&&previous.ready?
     previous:{width,height,ready:true});
  };
  measureRef.current=measure;
  measure();
  if(typeof ResizeObserver!=="undefined"){
   const observer=new ResizeObserver(measure);observer.observe(node);
   return ()=>{measureRef.current=null;observer.disconnect();};
  }
  window.addEventListener("resize",measure);
  return ()=>{measureRef.current=null;window.removeEventListener("resize",measure);};
 },[]);
 useEffect(()=>{
  if(viewport.ready&&game===null)setGame(initialRCGame(board));
 },[viewport.ready,board,game]);
 const cells=useMemo(()=>new Map(board.cells.map(c=>[c.key,c])),[board]);
 const selectedPawn=sheet?.kind==="polytron"?
  [...(game?.pawns??[]),...(game?.home??[])].find(p=>p.seal===sheet.seal):undefined;
 const selectedCell=sheet?.kind==="cell"?cells.get(sheet.key):undefined;
 const occupiedCell=selectedPawn?.cellKey?cells.get(selectedPawn.cellKey):undefined;
 // Read-only historic lens: the live game and board are never mutated.
 const historical=selectedPawn&&manifestationIndex!==null?
  selectedPawn.manifestations[manifestationIndex]:undefined;
 const inspectedPawn=selectedPawn&&historical?
  {...selectedPawn,...historical}:selectedPawn;
 const inspectingHistory=!!selectedPawn&&!!historical&&
  manifestationIndex!==selectedPawn.manifestations.length-1;
 useEffect(()=>{setManifestationIndex(null);},
  [sheet?.kind,sheet?.kind==="polytron"?sheet.seal:null]);
 const touchSelectedPawn=game?.pawns.find(p=>p.seal===selectedSeal);
 useEffect(()=>{
  if(selectedSeal!==null&&game&&!touchSelectedPawn)setSelectedSeal(null);
 },[game,selectedSeal,touchSelectedPawn]);
 const forecast=useMemo(()=>game?forecastRCMutatron(game,board):null,[game,board]);
 const selectedForecast=forecast?.cells.find(p=>p.key===
  (selectedPawn?.cellKey||selectedCell?.key));
 const select=(cell:RCCell,pawn:RCPawn|null)=>{
  setSheet(pawn?{kind:"polytron",seal:pawn.seal}:{kind:"cell",key:cell.key});
 };
 const commitMove=(from:string,to:string)=>{
  setGame(previous=>{
   if(!previous)return previous;
   return moveRCPawn(previous,from,to,board)?.game??previous;
  });
 };
 const recallParity=(parity:RCHomeParity):RCPawn[]=>{
  const recalled=game?.pawns.filter(p=>rcParity(p.seal)===parity)??[];
  if(recalled.length)setGame(previous=>previous?
   recallRCParity(previous,parity,board):previous);
  return recalled;
 };
 const returnArrived=(seal:number,target:string)=>{
  setGame(previous=>previous?
   returnRCPawnToCell(previous,seal,target,board)?.game??previous:previous);
 };
 const evolve=()=>{
  if(physicsBusyRef.current||!game?.mutatron.energyReserve)return;
  setGame(previous=>previous?forecastRCMutatron(previous,board).next:previous);
 };
 const groups=game?mutatronCounts(game):[0,0,0,0,0];
 const setView=(mode:RCViewMode,cellKey?:string)=>{
  setCameraCommand(prev=>({id:(prev?.id??0)+1,mode,cellKey}));
  setViewMode(mode);
  setSheet(null);
 };
 const reset=()=>{
  if(physicsBusy)return;
  setSheet(null);
  setSelectedSeal(null);
  setGame(initialRCGame(board));
 };
 return <main className="rc01-page">
  <header className="rc01-header">
   <div className="rc01-brand">
    <span className="rc01-brand-mark">✳</span>
    <div><strong>MINDELEEV</strong><small>RELEASE CANDIDATE 01</small></div>
   </div>
   <div className="rc01-header-actions">
    <a className="rc01-periodic-shortcut"
     href="https://babeledunnit.github.io/MindeleevBolt01/?experiment=polytron-periodic"
     target="_blank" rel="noopener noreferrer"
     aria-label="Open the Polytronic Periodic Table in a new tab"
     title="Polytronic Periodic Table · new tab">TABLE ↗</a>
    <div className="rc01-score" aria-label={"Fusions: "+(game?.fusions??0)}>
     <span>FUSIONS</span><strong>{game?.fusions??0}</strong>
    </div>
    <button type="button" className="rc01-reset" aria-label="Reset fixed Metatron opening"
     disabled={physicsBusy} onClick={reset}>↻</button>
   </div>
  </header>
  <section className="rc01-board-stage" ref={stageRef}
   aria-label="3D Mutatron board">
   <RC01ThreeBoard board={board} game={game}
    selectedSeal={selectedSeal} onTouchSelect={setSelectedSeal}
    preview={forecast?.cells??[]}
    cameraCommand={cameraCommand} onViewModeChange={setViewMode}
    onSelect={select} onCommitMove={commitMove}
    onOpenHome={parity=>setSheet({kind:"home",parity})}
    onRecallParity={recallParity}
    onReturnArrived={returnArrived}
    onBusyChange={onPhysicsBusy}/>
   <div className="rc01-fusion-notice" role="status">
    {game&&(game.moves||game.mutatron.generation)?game.lastAction:
     "RING 1: C/O ×3 · RING 2: C/T/O/T ×3 · OUTER: T"}
   </div>
   <div className="rc01-camera-controls" role="group" aria-label="Camera navigation">
    {(["map","area","subjective"] as const).map(mode=>
     <button type="button" key={mode}
      className={"rc01-camera-option"+(viewMode===mode?" is-active":"")}
      aria-pressed={viewMode===mode}
      aria-label={mode==="map"?"View entire Mutatron":
       mode==="area"?"Zoom to tactical area":"View Polytron in subjective 3D"}
      onClick={()=>setView(mode)}>
      {mode==="map"?"MAP":mode==="area"?"AREA":"3D"}
     </button>
    )}
    <span className="rc01-camera-hint" aria-live="polite">
     {viewMode==="subjective"?"Drag to orbit · pinch to zoom":
      viewMode==="area"?"Touch pawn · drag with offset":
      "Touch pawn to select · drag above finger"}
    </span>
   </div>
   {touchSelectedPawn&&<div className="rc01-touch-selection"
    role="group" aria-label="Selected Polytron for touch drag">
    <span className="rc01-selection-hex" aria-hidden="true">⬡</span>
    <span className="rc01-selection-name">
     <strong>{pawnName(touchSelectedPawn)}</strong>
     <small>#{touchSelectedPawn.number} · selected</small>
    </span>
    <button type="button" className="rc01-selection-info"
     aria-label={"Inspect Polytron "+pawnName(touchSelectedPawn)}
     onClick={()=>setSheet({kind:"polytron",seal:touchSelectedPawn.seal})}>Info</button>
    <button type="button" className="rc01-selection-clear"
     aria-label="Clear Polytron selection"
     onClick={()=>setSelectedSeal(null)}>×</button>
   </div>}
   <div className="rc01-evolve-panel">
    <button type="button" className="rc01-evolve-button"
     disabled={!game||physicsBusy||game.mutatron.energyReserve<1}
     onClick={evolve} aria-label="Evolve Mutatron one generation">
     <span aria-hidden="true">✳</span> Evolve Mutatron
    </button>
    <span className="rc01-evolve-meta" aria-live="polite">
     GEN {game?.mutatron.generation??0} · SYM {game?game.mutatron.symmetry+"%":"—"}
     {' · '} D {groups[3]} · I {groups[4]}
     {' · '} FIELD {game?.mutatron.energyReserve??48} E
     {' · '} MNEME +{game?.mutatron.mnemeGeneratedEnergy??0} E
     {' · '} HEAT {game?.mutatron.dissipatedEnergy??0} E
    </span>
    <div className="rc01-preview-legend" aria-label="Next-evolution forecast">
     <span><i className="rc01-legend-gold"/> Next mutation</span>
     <span><i className="rc01-legend-teal"/> Resonating</span>
     <span><i className="rc01-legend-orange"/> Energy blocked</span>
    </div>
    <span className="rc01-forecast-outcome" aria-live="polite">
     {forecast?.summary??"Reading the Mutatron…"} · Invocation: 1 E
    </span>
   </div>
   <div className="rc01-board-footer">
    <div className="rc01-scene-count" aria-label="Polytrons on Mutatron">
     <span className="rc01-scene-dot"/> {game?.pawns.length??72} / 72
    </div>
    <button type="button" className="rc01-home-button"
     aria-label={"Home reserve: "+(game?.home.length??0)+" Polytrons"}
     onClick={()=>setSheet({kind:"home"})}>HOME · {game?.home.length??0}</button>
   </div>
   {viewMode==="map"&&<div className="rc01-home-labels" aria-hidden="true">
    {(["odd","even"] as const).map(parity=>
     <span key={parity} style={{
      left:board.homes[parity].x/board.width*100+"%",
      top:(board.homes[parity].y-board.homeRadius*.98)/board.height*100+"%"
     }}>{parity==="odd"?"ODD":"EVEN"} · {game?.home.filter(
      p=>rcParity(p.seal)===parity).length??0}</span>
    )}
   </div>}
  </section>
  {/* Announcement for assistive technologies, not a visible status strip. */}
  <p className="rc01-visually-hidden" role="status" aria-live="polite">
   {game?.lastAction??"Loading 3D board."}
  </p>
  {sheet&&<div className="rc01-modal-layer">
   <button type="button" className="rc01-scrim"
    aria-label="Close panel" onClick={()=>setSheet(null)}/>
   <section role="dialog" aria-modal="true"
    aria-label={sheet.kind==="polytron"?"Polytron details":
     sheet.kind==="home"?"Home reserve":"Cell details"}
    className="rc01-sheet">
    <div className="rc01-sheet-handle"/>
    <button className="rc01-close" type="button" aria-label="Close"
     onClick={()=>setSheet(null)}>×</button>
    {selectedPawn&&inspectedPawn&&<div className="rc01-poly-sheet">
     <RC01ThreeInspector pawn={inspectedPawn}/>
     <h2>Polytron - {pawnName(selectedPawn)}</h2>
     {inspectingHistory&&<div className="rc01-history-lens">
      Historical manifestation · inspection only
      <button type="button" onClick={()=>setManifestationIndex(null)}>
       Back to present
      </button>
     </div>}
     {!inspectingHistory&&selectedPawn.cellKey&&<button type="button"
      className="rc01-inspect-3d"
      onClick={()=>setView("subjective",selectedPawn.cellKey)}>
      View this Polytron in 3D
     </button>}
     <dl className="rc01-details">
      <div><dt>Polytronic Number</dt><dd>{inspectedPawn.number}</dd></div>
      <div><dt>Conway DNA</dt><dd>{pawnDNA(inspectedPawn)}</dd></div>
      <div><dt>Intrinsic Energy</dt><dd>{intrinsicEnergy(inspectedPawn.number,0)} E</dd></div>
      <div className="rc01-palette-detail"><dt>Palette · Latin / Greek</dt>
       <dd><span>{pawnPalette(inspectedPawn).name}</span>
        <span className="rc01-palette-continuous" role="img"
         aria-label={"Continuous palette from "+pawnPalette(inspectedPawn).primary.name+
          " to "+pawnPalette(inspectedPawn).secondary.name}
         style={{background:gradientCss(pawnPalette(inspectedPawn).primary.hex,
          pawnPalette(inspectedPawn).secondary.hex)}}/>
       </dd>
      </div>
      <div><dt>Permanent Identity</dt>
       <dd>{pawnName(selectedPawn)} · {selectedPawn.seal}/72</dd></div>
      <div><dt>Current cell (ring, idxInRing)</dt>
       <dd>{occupiedCell?rcCellCoordinates(occupiedCell):"Home"}</dd></div>
      {!inspectingHistory&&selectedForecast&&<div><dt>Mutatron Forecast</dt>
       <dd>{selectedForecast.status.toUpperCase()} · #{
        selectedForecast.number} → #{selectedForecast.target}
        {' · '}{selectedForecast.neighbours}/6 neighbours
        {' · '}{selectedForecast.axes}/3 balanced axes
        {' · '}{selectedForecast.groups} groups
        {' · '}next charge {selectedForecast.charge} / 6
        {' · '}threshold {selectedForecast.needed}
        {' · '}{selectedForecast.status==="energy"?
         "insufficient Field E":
         selectedForecast.status==="blocked"?"requirements not met":
         selectedForecast.status==="evolve"?"selected for next mutation":
         selectedForecast.charge>=selectedForecast.needed?
          "ready · awaiting priority":"charging"}
        {' · '}cost {selectedForecast.energyCost} E</dd>
      </div>}
     </dl>
     <RC01ManifestationHistory pawn={selectedPawn}
      selectedIndex={manifestationIndex} onSelect={setManifestationIndex}/>
     <RC01MnemeHistory pawn={selectedPawn}/>
    </div>}
    {sheet.kind==="home"&&<div className="rc01-home-sheet">
     <div className="rc01-sheet-kicker">PERMANENT IDENTITIES</div>
     <h2>{sheet.parity?(sheet.parity==="odd"?"Odd":"Even")+" Home":"Home"} · {
      game?.home.filter(p=>!sheet.parity||rcParity(p.seal)===sheet.parity).length??0}</h2>
     <p>Polytrons return automatically after two action cycles: each board
       move or paid Mutatron invocation counts. Return destinations are
       empty cells, searched from the outermost ring clockwise. Double-tap
       a Home to recall its on-board parity group for the physics test.</p>
     {!game?.home.length&&<p>All 72 Polytrons are on the Mutatron.</p>}
     <div className="rc01-home-entries">
      {game?.home.filter(p=>!sheet.parity||rcParity(p.seal)===sheet.parity)
       .map(p=><div className="rc01-home-entry" key={p.seal}>
       <span>{pawnName(p)} <small>· {p.seal}/72</small></span>
       <strong>#{p.number}{rcHomeCooldown(game!,p.seal)>0?
        " · "+rcHomeCooldown(game!,p.seal)+" cycles":" · returning"}</strong>
      </div>)}
     </div>
    </div>}
    {selectedCell&&<div className="rc01-cell-sheet">
     <div className="rc01-sheet-kicker">MUTATRON GEOMETRY</div>
     <h2>{selectedCell.nucleus?"Nucleus":"Empty cell"}</h2>
     {selectedCell.nucleus&&<p>
      Dissociate a Polytron above #1 here to recover 1 Field E.
      It returns Home for two valid moves. A current #1 cannot enter.
     </p>}
     <dl className="rc01-details">
      <div><dt>Cell (ring, idxInRing)</dt>
       <dd>{rcCellCoordinates(selectedCell)}</dd></div>
     </dl>
    </div>}
   </section>
  </div>}
 </main>;
}
