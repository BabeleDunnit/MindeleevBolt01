import {useEffect,useMemo,useRef,useState} from "react";
import {RotateCcw,X} from "lucide-react";
import {makeRCBoard,type RCCell} from "@/polytron/rc01Board";
import {initialRCGame,moveRCPawn,pawnDNA,pawnName,pawnPalette,
 RC01_START_SCORE,type RCGame,type RCPawn} from "@/polytron/rc01Game";
import RC01ThreeBoard from "@/experiments/RC01ThreeBoard";
import RC01ThreeInspector from "@/experiments/RC01ThreeInspector";
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
 useEffect(()=>{
  const node=stageRef.current;if(!node)return;
  const measure=()=>{
   const bounds=node.getBoundingClientRect();
   const width=Math.round(bounds.width),height=Math.round(bounds.height);
   if(width>=280&&height>=350)setViewport(previous=>
    previous.width===width&&previous.height===height&&previous.ready?
     previous:{width,height,ready:true});
  };
  measure();
  if(typeof ResizeObserver!=="undefined"){
   const observer=new ResizeObserver(measure);observer.observe(node);
   return ()=>observer.disconnect();
  }
  window.addEventListener("resize",measure);
  return ()=>window.removeEventListener("resize",measure);
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
  setSheet(null);
  setGame(initialRCGame(board));
 };
 return <main className="rc01-page">
  <header className="rc01-header">
   <div className="rc01-brand">
    <span className="rc01-brand-mark">✳</span>
    <div><strong>MINDELEEV</strong><small>RELEASE CANDIDATE 01</small></div>
   </div>
   <div className="rc01-score" aria-label={"Energia: "+(game?.score??RC01_START_SCORE)}>
    <span>ENERGIA</span><strong>{game?.score??RC01_START_SCORE}</strong>
   </div>
  </header>
  <section className="rc01-board-stage" ref={stageRef}
   aria-label="Mutatron 3D, scacchiera tattile">
   <RC01ThreeBoard board={board} game={game}
    onSelect={select} onCommitMove={commitMove}/>
   <div className="rc01-scene-count" aria-hidden="true">
    <span className="rc01-scene-dot"/> {game?.pawns.length??5} / 72 IN SCENA
   </div>
   <button type="button" className="rc01-reset" aria-label="Nuova partita casuale"
    onClick={reset}><RotateCcw size={18}/></button>
  </section>
  {/* Announcement for assistive technologies, not a visible status strip. */}
  <p className="rc01-visually-hidden" role="status" aria-live="polite">
   {game?.lastAction??"Caricamento scacchiera tridimensionale."}
  </p>
  {sheet&&<div className="rc01-modal-layer">
   <button type="button" className="rc01-scrim"
    aria-label="Chiudi pannello" onClick={()=>setSheet(null)}/>
   <section role="dialog" aria-modal="true"
    aria-label={sheet.kind==="polytron"?"Dettagli del Polytrone":"Dettagli della casella"}
    className="rc01-sheet">
    <div className="rc01-sheet-handle"/>
    <button className="rc01-close" type="button" aria-label="Chiudi"
     onClick={()=>setSheet(null)}><X size={20}/></button>
    {selectedPawn&&<div className="rc01-poly-sheet">
     <RC01ThreeInspector pawn={selectedPawn}/>
     <div className="rc01-sheet-kicker">POLYTRONE · {pawnName(selectedPawn)}</div>
     <h2>#{selectedPawn.number}</h2>
     <dl className="rc01-details">
      <div><dt>Conway DNA</dt><dd>{pawnDNA(selectedPawn)}</dd></div>
      <div><dt>Palette · Latin / Greek</dt><dd>{pawnPalette(selectedPawn).name}</dd></div>
      <div><dt>Identità permanente</dt>
       <dd>{pawnName(selectedPawn)} · {selectedPawn.seal}/72</dd></div>
     </dl>
    </div>}
    {selectedCell&&<div className="rc01-cell-sheet">
     <div className="rc01-sheet-kicker">GEOMETRIA DEL MUTATRON</div>
     <h2>{selectedCell.nucleus?"Nucleo":"Casella libera"}</h2>
     <dl className="rc01-details">
      <div><dt>Coordinate assiali (q, r)</dt>
       <dd>({selectedCell.q}, {selectedCell.r})</dd></div>
      <div><dt>Ring</dt><dd>{selectedCell.ring}</dd></div>
      <div><dt>idxInRing</dt><dd>{selectedCell.idxInRing}</dd></div>
     </dl>
    </div>}
   </section>
  </div>}
 </main>;
}
