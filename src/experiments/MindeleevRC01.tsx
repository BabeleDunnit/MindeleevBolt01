import {useEffect,useMemo,useRef,useState} from "react";
import type {PointerEvent as ReactPointerEvent,KeyboardEvent as ReactKeyboardEvent} from "react";
import {X,Move,Info,RotateCcw} from "lucide-react";
import {makeRCBoard,rcCellAt,rcPolygon,type RCCell,type RCPoint}
 from "@/polytron/rc01Board";
import {initialRCGame,moveRCPawn,pawnAt,pawnDNA,pawnName,pawnPalette,
 RC01_START_SCORE,type RCGame,type RCPawn} from "@/polytron/rc01Game";
import {advanceRCFlight,finishedRCFlight,startRCFlight,
 type RCFlight} from "@/polytron/rc01Physics";
import LifePolytron3D from "@/experiments/LifePolytron3D";
import "./MindeleevRC01.css";

type Sheet={kind:"polytron";seal:number}|{kind:"cell";key:string}|null;
type Press={pointerId:number;startX:number;startY:number;cell:RCCell;pawn:RCPawn|null};
type Drag={seal:number;from:string;point:RCPoint;hover:string|null};
const MIN_GESTURE=9;
const initialViewport={width:390,height:700,ready:false};

function BodyView({pawn,point,size,hidden}:{pawn:RCPawn;point:RCPoint;
 size:number;hidden:boolean}){
 return <g transform={`translate(${point.x} ${point.y})`}
  className="rc01-pawn" aria-hidden="true">
  <circle r={size*.49} fill="#c9d2ce" fillOpacity=".17"/>
  <circle r={size*.53} fill="transparent" pointerEvents="none"
   data-life-polytron={hidden?undefined:pawnDNA(pawn)}
   data-life-palette-row={pawn.row}
   data-life-palette-col={pawn.col}
   data-life-scale="1.14"/>
  <text x={0} y={size*.78} textAnchor="middle" className="rc01-pawn-number"
   pointerEvents="none">#{pawn.number}</text>
 </g>;
}
export default function MindeleevRC01(){
 const stageRef=useRef<HTMLDivElement>(null);
 const svgRef=useRef<SVGSVGElement>(null);
 const gesture=useRef<Press|null>(null);
 const frameId=useRef<number|null>(null);
 const [viewport,setViewport]=useState(initialViewport);
 const board=useMemo(()=>makeRCBoard(viewport.width,viewport.height),
  [viewport.width,viewport.height]);
 const [game,setGame]=useState<RCGame|null>(null);
 const [sheet,setSheet]=useState<Sheet>(null);
 const [drag,setDrag]=useState<Drag|null>(null);
 const [flight,setFlight]=useState<RCFlight|null>(null);
 const [status,setStatus]=useState("Tocca un Polytrone o trascinalo su un'altra casella.");
 const locked=flight!==null;
 useEffect(()=>{
  const node=stageRef.current;if(!node)return;
  const measure=()=>{
   const box=node.getBoundingClientRect();
   const width=Math.round(box.width),height=Math.round(box.height);
   if(width>=280&&height>=350)setViewport(prev=>
    prev.width===width&&prev.height===height&&prev.ready?prev:
     {width,height,ready:true});
  };
  measure();
  if(typeof ResizeObserver==="undefined"){
   window.addEventListener("resize",measure);
   return ()=>window.removeEventListener("resize",measure);
  }
  const observer=new ResizeObserver(measure);observer.observe(node);
  return ()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  if(!viewport.ready||game!==null)return;
  setGame(initialRCGame(board));
 },[viewport.ready,board,game]);
 useEffect(()=>()=>{if(frameId.current!==null)cancelAnimationFrame(frameId.current);},[]);
 const cellMap=useMemo(()=>new Map(board.cells.map(c=>[c.key,c])),[board]);
 const selectedPawn=sheet?.kind==="polytron"?
  game?.pawns.find(p=>p.seal===sheet.seal):undefined;
 const selectedCell=sheet?.kind==="cell"?cellMap.get(sheet.key):undefined;
 const viewPoint=(e:ReactPointerEvent):RCPoint|null=>{
  const node=svgRef.current;if(!node)return null;
  const matrix=node.getScreenCTM();if(!matrix)return null;
  const point=node.createSVGPoint();point.x=e.clientX;point.y=e.clientY;
  const mapped=point.matrixTransform(matrix.inverse());
  return {x:mapped.x,y:mapped.y};
 };
 const clearGesture=()=>{
  gesture.current=null;setDrag(null);
 };
 const down=(e:ReactPointerEvent<SVGGElement>,cell:RCCell)=>{
  if(locked||sheet||!game||e.button!==0)return;
  gesture.current={pointerId:e.pointerId,startX:e.clientX,
   startY:e.clientY,cell,pawn:pawnAt(game,cell.key)??null};
  svgRef.current?.setPointerCapture(e.pointerId);
  e.preventDefault();
 };
 const moved=(e:ReactPointerEvent<SVGSVGElement>)=>{
  const active=gesture.current;
  if(!active||active.pointerId!==e.pointerId||!active.pawn)return;
  const dist=Math.hypot(e.clientX-active.startX,e.clientY-active.startY);
  if(dist<MIN_GESTURE)return;
  const point=viewPoint(e);if(!point)return;
  const hover=rcCellAt(board,point.x,point.y);
  setDrag({seal:active.pawn.seal,from:active.cell.key,
   point,hover:hover?.key??null});
 };
 const beginMotion=(attacker:RCPawn,from:RCCell,to:RCCell)=>{
  if(!game)return;
  const victim=pawnAt(game,to.key)??null;
  const initial=startRCFlight({kind:victim?"capture":"move",
   attackerSeal:attacker.seal,victimSeal:victim?.seal??null,
   sourceKey:from.key,targetKey:to.key,
   from:{x:from.x,y:from.y},to:{x:to.x,y:to.y},size:board.size});
  setFlight(initial);setStatus(victim?"Presa! Collisione e ritorno a casa.":"Spostamento fisico in corso.");
  let current=initial,last=performance.now();
  const tick=(now:number)=>{
   const dt=Math.max(0,Math.min(.04,(now-last)/1000));last=now;
   current=advanceRCFlight(current,dt);
   if(finishedRCFlight(current)){
    setGame(previous=>{
     if(!previous)return previous;
     const result=moveRCPawn(previous,from.key,to.key,board);
     if(result)setStatus(result.game.lastAction);
     return result?.game??previous;
    });
    setFlight(null);frameId.current=null;return;
   }
   setFlight(current);
   frameId.current=requestAnimationFrame(tick);
  };
  frameId.current=requestAnimationFrame(tick);
 };
 const up=(e:ReactPointerEvent<SVGSVGElement>)=>{
  const active=gesture.current;
  if(!active||active.pointerId!==e.pointerId)return;
  gesture.current=null;setDrag(null);
  if(svgRef.current?.hasPointerCapture(e.pointerId))
   svgRef.current.releasePointerCapture(e.pointerId);
  if(locked||!game)return;
  const distance=Math.hypot(e.clientX-active.startX,e.clientY-active.startY);
  if(distance<MIN_GESTURE){
   if(active.pawn)setSheet({kind:"polytron",seal:active.pawn.seal});
   else setSheet({kind:"cell",key:active.cell.key});
   return;
  }
  if(!active.pawn)return;
  const point=viewPoint(e);if(!point)return;
  const target=rcCellAt(board,point.x,point.y);
  if(!target||target.key===active.cell.key)return;
  beginMotion(active.pawn,active.cell,target);
 };
 const keyboard=(e:ReactKeyboardEvent<SVGGElement>,cell:RCCell)=>{
  if((e.key!=="Enter"&&e.key!==" ")||locked||!game)return;
  e.preventDefault();
  const pawn=pawnAt(game,cell.key);
  setSheet(pawn?{kind:"polytron",seal:pawn.seal}:{kind:"cell",key:cell.key});
 };
 const reset=()=>{
  if(locked)return;
  setGame(initialRCGame(board));setSheet(null);
  setStatus("Nuova partita con cinque Polytroni casuali.");
 };
 return <main className="rc01-page">
  <LifePolytron3D row={2} col={4} order="contrast"/>
  <header className="rc01-header">
   <div className="rc01-brand">
    <span className="rc01-brand-mark">✳</span>
    <div><strong>MINDELEEV</strong><small>RELEASE CANDIDATE 01</small></div>
   </div>
   <div className="rc01-score" aria-label="Energia: 100">
    <span>ENERGIA</span><strong>{game?.score??RC01_START_SCORE}</strong>
   </div>
  </header>
  <div className="rc01-board-stage" ref={stageRef}>
   <svg ref={svgRef} className="rc01-board" viewBox={`0 0 ${board.width} ${board.height}`}
    role="group" aria-label="Scacchiera esagonale di Mindeleev. Tocca per informazioni, trascina per muovere o prendere."
    onPointerMove={moved} onPointerUp={up} onPointerCancel={clearGesture}>
    <defs>
     <radialGradient id="rc01-core-gradient">
      <stop stopColor="#b9dacf"/><stop offset="100%" stopColor="#e5ece7"/>
     </radialGradient>
    </defs>
    {board.cells.map(cell=>{
     const current=game?pawnAt(game,cell.key):null;
     const hover=drag?.hover===cell.key&&drag.from!==cell.key;
     return <g key={cell.key} role="button" tabIndex={locked?-1:0}
      className={"rc01-cell"+(cell.nucleus?" rc01-nucleus":"")+
       (hover?" rc01-target":"")+(hover&&current?" rc01-capture-target":"")}
      aria-label={`Cella ${cell.key}, anello ${cell.ring}, indice ${cell.idxInRing}. ${current?
       "Polytrone "+current.number+", "+pawnName(current):"Libera"}`}
      onPointerDown={e=>down(e,cell)}
      onKeyDown={e=>keyboard(e,cell)}>
      <polygon points={rcPolygon(cell.x,cell.y,board.size-1.25)}
       fill={cell.nucleus?"url(#rc01-core-gradient)":"#f2f3f1"}
       strokeWidth={cell.nucleus?2.35:1.75}/>
      {cell.nucleus&&<circle cx={cell.x} cy={cell.y} r={board.size*.82}
       fill="none" stroke="#54917b" strokeOpacity=".4"
       strokeWidth="2" strokeDasharray="4 5" pointerEvents="none"/>}
     </g>;
    })}
    {game?.pawns.map(pawn=>{
     const cell=cellMap.get(pawn.cellKey);if(!cell)return null;
     const point=flight?.attackerSeal===pawn.seal?
      flight.attacker:flight?.victimSeal===pawn.seal&&flight.victim?
       flight.victim:drag?.seal===pawn.seal?drag.point:cell;
     return <BodyView key={pawn.seal} pawn={pawn} point={point}
      size={board.size} hidden={sheet!==null}/>;
    })}
    {drag?.hover&&(()=>{
     const cell=cellMap.get(drag.hover);if(!cell)return null;
     return <circle cx={cell.x} cy={cell.y} r={board.size*.63}
      fill="none" stroke="#1e8662" strokeWidth="3.3" strokeDasharray="6 5"
      pointerEvents="none"/>;
    })()}
    {flight?.impacted&&flight.kind==="capture"&&
     <circle cx={flight.target.x} cy={flight.target.y} r={board.size*.65}
      fill="#ffca9d" opacity=".3" pointerEvents="none"/>}
   </svg>
   <div className="rc01-stage-caption" aria-hidden="true">
    <span className="rc01-core-dot"/> NUCLEO (0,0)
    <span>·</span> {game?.pawns.length??5} / 72 IN SCENA
   </div>
  </div>
  <footer className="rc01-footer">
   <div className="rc01-help"><Move size={16}/>
    <span>Tocca per esplorare · Trascina per muovere o prendere</span></div>
   <button type="button" onClick={reset} disabled={locked}
    aria-label="Nuova disposizione casuale"><RotateCcw size={16}/></button>
  </footer>
  <p className="rc01-status" role="status" aria-live="polite">{status}</p>
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
     <div className="rc01-hero-model" data-life-polytron={pawnDNA(selectedPawn)}
      data-life-palette-row={selectedPawn.row}
      data-life-palette-col={selectedPawn.col}
      data-life-kind="card" data-life-scale="1.06"/>
     <div className="rc01-sheet-kicker">POLYTRONE · {pawnName(selectedPawn)}</div>
     <h2>#{selectedPawn.number}</h2>
     <dl className="rc01-details">
      <div><dt>Conway DNA</dt><dd>{pawnDNA(selectedPawn)}</dd></div>
      <div><dt>Palette · Latin / Greek</dt>
       <dd>{pawnPalette(selectedPawn).name}</dd></div>
      <div><dt>Identità permanente</dt>
       <dd>{pawnName(selectedPawn)} · {selectedPawn.seal}/72</dd></div>
     </dl>
    </div>}
    {selectedCell&&<div className="rc01-cell-sheet">
     <div className="rc01-sheet-kicker"><Info size={15}/> GEOMETRIA DEL MUTATRON</div>
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
