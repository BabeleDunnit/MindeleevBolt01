import {useEffect,useMemo,useRef,useState} from "react";
import {makeRCBoard,type RCCell} from "@/polytron/rc01Board";
import {initialRCGame,moveRCPawn,toggleRCParityHome,returnRCPawnHome,rcParity,
 pawnDNA,pawnName,pawnPalette,
 type RCGame,type RCPawn,type RCHomeParity,type RCHomeToggleResult} from "@/polytron/rc01Game";
import RC01ThreeBoard from "@/experiments/RC01ThreeBoard";
import RC01ThreeInspector from "@/experiments/RC01ThreeInspector";
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
 const [physicsBusy,setPhysicsBusy]=useState(false);
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
 const isSelectedHome=selectedPawn!==undefined&&
  (game?.home.some(p=>p.seal===selectedPawn.seal)??false);
 const selectedCell=sheet?.kind==="cell"?cells.get(sheet.key):undefined;
 const select=(cell:RCCell,pawn:RCPawn|null)=>{
  setSheet(pawn?{kind:"polytron",seal:pawn.seal}:{kind:"cell",key:cell.key});
 };
 const commitMove=(from:string,to:string)=>{
  setGame(previous=>{
   if(!previous)return previous;
   return moveRCPawn(previous,from,to,board)?.game??previous;
  });
 };
 const toggleParity=(parity:RCHomeParity):RCHomeToggleResult=>{
  const result=toggleRCParityHome(game??initialRCGame(board),parity,board);
  setGame(result.game);
  return result;
 };
 const returnArrived=(seal:number)=>{
  // Each arrival reads the live game, including any intervening moves.
  setGame(previous=>previous?
   returnRCPawnHome(previous,seal,board)?.game??previous:previous);
 };
 const reset=()=>{
  if(physicsBusy)return;
  setSheet(null);
  setGame(initialRCGame(board));
 };
 return <main className="rc01-page">
  <header className="rc01-header">
   <div className="rc01-brand">
    <span className="rc01-brand-mark">✳</span>
    <div><strong>MINDELEEV</strong><small>RELEASE CANDIDATE 01</small></div>
   </div>
   <div className="rc01-header-actions">
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
    onSelect={select} onCommitMove={commitMove}
    onOpenHome={parity=>setSheet({kind:"home",parity})}
    onToggleParity={toggleParity}
    onReturnArrived={returnArrived}
    onBusyChange={onPhysicsBusy}/>
   <div className="rc01-fusion-notice" role="status">
    {game?.fusions?game.lastAction:
     "INNER RINGS #2 / #3 · OUTER RINGS #1 · RING 3 CLEAR"}
   </div>
   <div className="rc01-board-footer">
    <div className="rc01-scene-count" aria-label="Polytrons on Mutatron">
     <span className="rc01-scene-dot"/> {game?.pawns.length??72} / 72
    </div>
    <button type="button" className="rc01-home-button"
     aria-label={"Home reserve: "+(game?.home.length??0)+" Polytrons"}
     onClick={()=>setSheet({kind:"home"})}>HOME · {game?.home.length??0}</button>
   </div>
   <div className="rc01-home-labels" aria-hidden="true">
    {(["odd","even"] as const).map(parity=>
     <span key={parity} style={{
      left:board.homes[parity].x/board.width*100+"%",
      top:(board.homes[parity].y-board.homeRadius*.98)/board.height*100+"%"
     }}>{parity==="odd"?"ODD":"EVEN"} · {game?.home.filter(
      p=>rcParity(p.seal)===parity).length??0}</span>
    )}
   </div>
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
    {selectedPawn&&<div className="rc01-poly-sheet">
     <RC01ThreeInspector pawn={selectedPawn}/>
     <h2>Polytron - {pawnName(selectedPawn)}</h2>
     {isSelectedHome&&<div className="rc01-home-indicator">AT HOME</div>}
     <dl className="rc01-details">
      <div><dt>Polytronic Number</dt><dd>{selectedPawn.number}</dd></div>
      <div><dt>Conway DNA</dt><dd>{pawnDNA(selectedPawn)}</dd></div>
       <div><dt>Intrinsic Energy</dt><dd>{intrinsicEnergy(selectedPawn.number,0)} E</dd></div>
      <div><dt>Palette · Latin / Greek</dt><dd>{pawnPalette(selectedPawn).name}</dd></div>
      <div><dt>Permanent Identity</dt>
       <dd>{pawnName(selectedPawn)} · {selectedPawn.seal}/72</dd></div>
      <div><dt>Manifestations</dt><dd>{selectedPawn.manifestations.map(n=>"#"+n).join(" → ")}</dd></div>
     </dl>
    </div>}
    {sheet.kind==="home"&&<div className="rc01-home-sheet">
     <div className="rc01-sheet-kicker">PERMANENT IDENTITIES</div>
     <h2>{sheet.parity?(sheet.parity==="odd"?"Odd":"Even")+" Home":"Home"} · {
      game?.home.filter(p=>!sheet.parity||rcParity(p.seal)===sheet.parity).length??0}</h2>
     <p>Double-tap a Home to recall its Polytrons; double-tap again to
       return them physically to their original cells. Occupied cells
       trigger a capture and inheritance. The board remains interactive.</p>
     {!game?.home.length&&<p>All 72 Polytrons are on the Mutatron.</p>}
     <div className="rc01-home-entries">
      {game?.home.filter(p=>!sheet.parity||rcParity(p.seal)===sheet.parity)
       .map(p=><button type="button" key={p.seal}
       onClick={()=>setSheet({kind:"polytron",seal:p.seal})}>
       <span>{pawnName(p)} <small>· {p.seal}/72</small></span>
       <strong>#{p.number}</strong>
      </button>)}
     </div>
    </div>}
    {selectedCell&&<div className="rc01-cell-sheet">
     <div className="rc01-sheet-kicker">MUTATRON GEOMETRY</div>
     <h2>{selectedCell.nucleus?"Nucleus":"Empty cell"}</h2>
     <dl className="rc01-details">
      <div><dt>Axial coordinates (q, r)</dt>
       <dd>({selectedCell.q}, {selectedCell.r})</dd></div>
      <div><dt>Ring</dt><dd>{selectedCell.ring}</dd></div>
      <div><dt>idxInRing</dt><dd>{selectedCell.idxInRing}</dd></div>
     </dl>
    </div>}
   </section>
  </div>}
 </main>;
}
