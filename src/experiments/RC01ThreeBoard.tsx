import {useEffect,useRef} from "react";
import type {PointerEvent as ReactPointerEvent,KeyboardEvent as ReactKeyboardEvent} from "react";
import * as THREE from "three";
import type {RCBoard,RCCell,RCPoint} from "@/polytron/rc01Board";
import {pawnAt,type RCGame,type RCPawn} from "@/polytron/rc01Game";
import {advanceRCFlight,finishedRCFlight,startRCFlight,type RCFlight}
 from "@/polytron/rc01Physics";
import {createRC3DWorld} from "@/experiments/rc01ThreeScene";

const MIN_DRAG_PIXELS=9;
type Press={
 pointerId:number;startX:number;startY:number;
 cell:RCCell;pawn:RCPawn|null;dragging:boolean;
};
type ThreeWorld=ReturnType<typeof createRC3DWorld>;

export default function RC01ThreeBoard({
 board,game,onSelect,onCommitMove
}:{
 board:RCBoard;game:RCGame|null;
 onSelect:(cell:RCCell,pawn:RCPawn|null)=>void;
 onCommitMove:(source:string,target:string)=>void;
}){
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const worldRef=useRef<ThreeWorld|null>(null);
 const gameRef=useRef(game);
 const selectRef=useRef(onSelect);
 const commitRef=useRef(onCommitMove);
 const pressRef=useRef<Press|null>(null);
 const flightRef=useRef<RCFlight|null>(null);
 const focusKey=useRef("0,0");
 gameRef.current=game;
 selectRef.current=onSelect;
 commitRef.current=onCommitMove;
 const screenPoint=(e:ReactPointerEvent<HTMLCanvasElement>):RCPoint|null=>{
  const rect=e.currentTarget.getBoundingClientRect();
  if(rect.width<=0||rect.height<=0)return null;
  return {
   x:(e.clientX-rect.left)/rect.width*board.width,
   y:(e.clientY-rect.top)/rect.height*board.height
  };
 };
 const cancelPointer=(canvas?:HTMLCanvasElement,pointerId?:number)=>{
  const press=pressRef.current;
  if(press&&canvas&&pointerId!==undefined&&canvas.hasPointerCapture(pointerId))
   canvas.releasePointerCapture(pointerId);
  if(press?.dragging&&press.pawn){
   const world=worldRef.current;
   world?.moveActor(press.pawn.seal,press.cell);
  }
  pressRef.current=null;
  worldRef.current?.hover(null,false);
 };
 const onPointerDown=(e:ReactPointerEvent<HTMLCanvasElement>)=>{
  if(e.button!==0||flightRef.current||!gameRef.current)return;
  const world=worldRef.current,point=screenPoint(e);
  if(!world||!point)return;
  const cell=world.raycastCell(point.x,point.y);
  if(!cell)return;
  pressRef.current={pointerId:e.pointerId,startX:e.clientX,
   startY:e.clientY,cell,
   pawn:pawnAt(gameRef.current,cell.key)??null,dragging:false};
  focusKey.current=cell.key;
  e.currentTarget.setPointerCapture(e.pointerId);
  e.preventDefault();
 };
 const onPointerMove=(e:ReactPointerEvent<HTMLCanvasElement>)=>{
  const press=pressRef.current,world=worldRef.current;
  if(!press||press.pointerId!==e.pointerId||!world||flightRef.current)return;
  if(!press.pawn)return;
  const distance=Math.hypot(e.clientX-press.startX,e.clientY-press.startY);
  if(distance<MIN_DRAG_PIXELS&&!press.dragging)return;
  press.dragging=true;
  const point=screenPoint(e);if(!point)return;
  const worldPoint=world.raycastBoardPlane(point.x,point.y);
  if(worldPoint)world.moveActor(press.pawn.seal,worldPoint,24);
  const target=world.raycastCell(point.x,point.y);
  world.hover(target?.key??null,!!(target&&gameRef.current&&
   pawnAt(gameRef.current,target.key)));
 };
 const onPointerUp=(e:ReactPointerEvent<HTMLCanvasElement>)=>{
  const press=pressRef.current,world=worldRef.current;
  if(!press||press.pointerId!==e.pointerId||!world)return;
  const point=screenPoint(e);
  const target=point?world.raycastCell(point.x,point.y):null;
  const wasDragging=press.dragging||
   Math.hypot(e.clientX-press.startX,e.clientY-press.startY)>=MIN_DRAG_PIXELS;
  cancelPointer(e.currentTarget,e.pointerId);
  if(flightRef.current)return;
  if(!wasDragging){
   selectRef.current(press.cell,press.pawn);
   return;
  }
  if(!press.pawn||!target||target.key===press.cell.key)return;
  const snapshot=gameRef.current;
  if(!snapshot)return;
  const victim=pawnAt(snapshot,target.key)??null;
  flightRef.current=startRCFlight({
   kind:victim?"capture":"move",
   attackerSeal:press.pawn.seal,victimSeal:victim?.seal??null,
   sourceKey:press.cell.key,targetKey:target.key,
   from:press.cell,to:target,size:board.size
  });
 };
 const onPointerCancel=(e:ReactPointerEvent<HTMLCanvasElement>)=>
  cancelPointer(e.currentTarget,e.pointerId);
 const onKeyDown=(e:ReactKeyboardEvent<HTMLCanvasElement>)=>{
  const world=worldRef.current;
  if(!world||flightRef.current)return;
  const active=world.cellsByKey.get(focusKey.current)??world.cellsByKey.get("0,0");
  if(!active)return;
  const dir=e.key==="ArrowRight"?[1,0]:
   e.key==="ArrowLeft"?[-1,0]:
   e.key==="ArrowUp"?[0,-1]:
   e.key==="ArrowDown"?[0,1]:null;
  if(dir){
   e.preventDefault();
   const key=(active.q+dir[0])+","+(active.r+dir[1]);
   if(world.cellsByKey.has(key))focusKey.current=key;
   world.hover(focusKey.current,!!(gameRef.current&&
    pawnAt(gameRef.current,focusKey.current)));
  }else if(e.key==="Enter"||e.key===" "){
   e.preventDefault();
   selectRef.current(active,gameRef.current?
    pawnAt(gameRef.current,active.key)??null:null);
  }
 };
 useEffect(()=>{
  const canvas=canvasRef.current;
  if(!canvas)return;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({
   canvas,antialias:true,alpha:false,powerPreference:"high-performance"
  });}catch{return;}
  renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));
  renderer.setSize(board.width,board.height,false);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const world=createRC3DWorld(board);
  worldRef.current=world;
  world.setPawns(gameRef.current?.pawns??[]);
  let alive=true,raf=0,last=performance.now();
  const frame=(now:number)=>{
   if(!alive)return;
   raf=requestAnimationFrame(frame);
   const dt=Math.max(0,Math.min(.04,(now-last)/1000));last=now;
   const flight=flightRef.current;
   if(flight){
    const next=advanceRCFlight(flight,dt);
    flightRef.current=next;
    world.moveActor(next.attackerSeal,next.attacker,12);
    if(next.victimSeal!==null&&next.victim)
     world.moveActor(next.victimSeal,next.victim,14+(next.impacted?18:0));
    if(finishedRCFlight(next)){
     flightRef.current=null;
     commitRef.current(next.sourceKey,next.targetKey);
    }
   }
   world.rotateModels(now);
   renderer.render(world.scene,world.camera);
  };
  raf=requestAnimationFrame(frame);
  return ()=>{
   alive=false;cancelAnimationFrame(raf);
   pressRef.current=null;flightRef.current=null;
   worldRef.current=null;
   world.dispose();renderer.dispose();
  };
 },[board]);
 useEffect(()=>{
  worldRef.current?.setPawns(game?.pawns??[]);
 },[game]);
 return <canvas ref={canvasRef} className="rc01-three-board"
  role="img" aria-label="Scacchiera 3D esagonale. Tocca una cella per i dettagli; trascina un Polytrone per spostarlo o effettuare una presa."
  tabIndex={0} onPointerDown={onPointerDown} onPointerMove={onPointerMove}
  onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}
  onLostPointerCapture={()=>{if(pressRef.current)cancelPointer();}}
  onKeyDown={onKeyDown}/>;
}
