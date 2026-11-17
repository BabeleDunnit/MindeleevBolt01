import {useEffect,useMemo,useRef,useState} from "react";
import {makeRCBoard,type RCCell} from "@/polytron/rc01Board";
import {initialRCGame,moveRCPawn,pawnDNA,pawnName,pawnPalette,
 RC01_START_SCORE,type RCGame,type RCPawn} from "@/polytron/rc01Game";
import RC01ThreeBoard from "@/experiments/RC01ThreeBoard";
import RC01ThreeInspector from "@/experiments/RC01ThreeInspector";
import {intrinsicEnergy} from "@/polytron/mindeleevLife";
import "./MindeleevRC01.css";

type Sheet={kind:"polytron";seal:number}|{kind:"cell";key:string}|null;
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
  game?.pawns.find(p=>p.seal===sheet.seal):undefined;
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
   <div className="rc01-score" aria-label={"Energy: "+(game?.score??RC01_START_SCORE)}>
    <span>ENERGY</span><strong>{game?.score??RC01_START_SCORE}</strong>
   </div>
  </header>
  <section className="rc01-board-stage" ref={stageRef}
   aria-label="3D Mutatron board">
   <RC01ThreeBoard board={board} game={game}
    onSelect={select} onCommitMove={commitMove}
    onBusyChange={onPhysicsBusy}/>
   <div className="rc01-scene-count" aria-hidden="true">
    <span className="rc01-scene-dot"/> {game?.pawns.length??5} / 72 ON BOARD
   </div>
   <button type="button" className="rc01-reset" aria-label="Start a new random game"
    disabled={physicsBusy} onClick={reset}>↻</button>
  </section>
  {/* Announcement for assistive technologies, not a visible status strip. */}
  <p className="rc01-visually-hidden" role="status" aria-live="polite">
   {game?.lastAction??"Loading 3D board."}
  </p>
  {sheet&&<div className="rc01-modal-layer">
   <button type="button" className="rc01-scrim"
    aria-label="Close panel" onClick={()=>setSheet(null)}/>
   <section role="dialog" aria-modal="true"
    aria-label={sheet.kind==="polytron"?"Polytron details":"Cell details"}
    className="rc01-sheet">
    <div className="rc01-sheet-handle"/>
    <button className="rc01-close" type="button" aria-label="Close"
     onClick={()=>setSheet(null)}>×</button>
    {selectedPawn&&<div className="rc01-poly-sheet">
     <RC01ThreeInspector pawn={selectedPawn}/>
     <div className="rc01-sheet-kicker">POLYTRON · {pawnName(selectedPawn)}</div>
     <h2>Polytronic Number: {selectedPawn.number}</h2>
     <dl className="rc01-details">
      <div><dt>Conway DNA</dt><dd>{pawnDNA(selectedPawn)}</dd></div>
       <div><dt>Intrinsic Energy</dt><dd>{intrinsicEnergy(selectedPawn.number,0)} E</dd></div>
      <div><dt>Palette · Latin / Greek</dt><dd>{pawnPalette(selectedPawn).name}</dd></div>
      <div><dt>Permanent Identity</dt>
       <dd>{pawnName(selectedPawn)} · {selectedPawn.seal}/72</dd></div>
     </dl>
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
