import {useEffect,useRef} from "react";
import type {PointerEvent as ReactPointerEvent,KeyboardEvent as ReactKeyboardEvent} from "react";
import * as THREE from "three";
import {rcHomeContains,type RCBoard,type RCCell,type RCPoint} from "@/polytron/rc01Board";
import {pawnAt,type RCGame,type RCPawn,type RCHomeParity,
 type RCHomeToggleResult} from "@/polytron/rc01Game";
import {RC01RapierFlight,RC_RAPIER_FIXED_STEP}
 from "@/experiments/rc01RapierFlight";
import {createRC3DWorld} from "@/experiments/rc01ThreeScene";

const MIN_DRAG_PIXELS=9;
type Press={
 pointerId:number;startX:number;startY:number;
 cell:RCCell;pawn:RCPawn|null;dragging:boolean;
};
type ThreeWorld=ReturnType<typeof createRC3DWorld>;

export default function RC01ThreeBoard({
 board,game,onSelect,onCommitMove,onOpenHome,onToggleParity,onReturnArrived,onBusyChange
}:{
 board:RCBoard;game:RCGame|null;
 onSelect:(cell:RCCell,pawn:RCPawn|null)=>void;
 onCommitMove:(source:string,target:string)=>void;
 onOpenHome:(parity?:RCHomeParity)=>void;
 onToggleParity:(parity:RCHomeParity)=>RCHomeToggleResult;
  onReturnArrived:(seal:number)=>void;
 onBusyChange?:(busy:boolean)=>void;
}){
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const worldRef=useRef<ThreeWorld|null>(null);
 const gameRef=useRef(game);
 const selectRef=useRef(onSelect);
 const commitRef=useRef(onCommitMove);
 const homeRef=useRef(onOpenHome);
 const toggleRef=useRef(onToggleParity);
 const arrivalRef=useRef(onReturnArrived);
 const doubleTapRef=useRef<{parity:RCHomeParity;at:number}|null>(null);
 // Reconstruct active returns after browser-chrome viewport resizes.
 const activeReturnsRef=useRef<Set<number>>(new Set());
 const lastMutationGenerationRef=useRef(0);
 const pendingVictimRef=useRef<RCPawn|null>(null);
 const busyRef=useRef(onBusyChange);
 const pressRef=useRef<Press|null>(null);
 const flightRef=useRef<RC01RapierFlight|null>(null);
 const launchingRef=useRef(false);
 const epochRef=useRef(0);
 const focusKey=useRef("0,0");
 gameRef.current=game;
 selectRef.current=onSelect;
 commitRef.current=onCommitMove;
 homeRef.current=onOpenHome;
 toggleRef.current=onToggleParity;
 arrivalRef.current=onReturnArrived;
 busyRef.current=onBusyChange;
 const isBusy=()=>launchingRef.current||flightRef.current!==null;
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
  // Cancel only the translucent selection proxy. The real pawn was never
  // moved, so there is no teleport-back or visual reset.
  worldRef.current?.dragPreview(null);
  pressRef.current=null;
  worldRef.current?.hover(null,false);
 };
 const onPointerDown=(e:ReactPointerEvent<HTMLCanvasElement>)=>{
  if(e.button!==0||isBusy()||!gameRef.current)return;
  const world=worldRef.current,point=screenPoint(e);
  if(!world||!point)return;
  // Hex hit-test matches the actual flat-top Home shapes, not a
  // circular proxy. A second tap of the SAME parity triggers the
  // high-density stress test without ever pausing board interaction.
  const parity=(["odd","even"] as const).find(side=>{
   return rcHomeContains(board,side,point);
  });
  if(parity){
   const now=performance.now(),previous=doubleTapRef.current;
   if(previous?.parity===parity&&now-previous.at<390){
    doubleTapRef.current=null;
    const outcome=toggleRef.current(parity);
    if(outcome.action==="recall"){
     for(const seal of activeReturnsRef.current)
      if((seal%2===0?"even":"odd")===parity)
       activeReturnsRef.current.delete(seal);
     world.cancelHomeReturns(parity);
     world.transferParityToHome(outcome.pawns);
    }else{
     for(const pawn of outcome.pawns)activeReturnsRef.current.add(pawn.seal);
     world.startHomeReturns(outcome.pawns);
    }
   }else doubleTapRef.current={parity,at:now};
   e.preventDefault();
   return;
  }
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
  if(!press||press.pointerId!==e.pointerId||!world||isBusy())return;
  if(!press.pawn)return;
  const distance=Math.hypot(e.clientX-press.startX,e.clientY-press.startY);
  if(distance<MIN_DRAG_PIXELS&&!press.dragging)return;
  press.dragging=true;
  const point=screenPoint(e);if(!point)return;
  const worldPoint=world.raycastBoardPlane(point.x,point.y);
  world.dragPreview(worldPoint);
  const target=world.raycastCell(point.x,point.y);
  const occupied=!!(target&&gameRef.current&&
   pawnAt(gameRef.current,target.key));
  world.hover(target?.key??null,occupied,
   !!target&&target.key!==press.cell.key);
 };
 const launchPhysicalMove=(press:Press,target:RCCell)=>{
  if(!press.pawn||isBusy()||!gameRef.current)return;
  const world=worldRef.current;if(!world)return;
  const victim=pawnAt(gameRef.current,target.key)??null;
  pendingVictimRef.current=victim;
  // The first frame of *actual* Polytron movement is strictly AFTER drop.
  world.dragPreview(null);
  const startedEpoch=epochRef.current;
  launchingRef.current=true;
  busyRef.current?.(true);
  // Bring ALL other pawns into this same Rapier world. A fleeing victim
  // can now strike neighbors, which can strike further neighbors in turn.
  // They remain in the game and are physically attracted back to their tiles.
  const others=gameRef.current.pawns
   .filter(pawn=>pawn.seal!==press.pawn!.seal&&pawn.seal!==victim?.seal)
   .map(pawn=>({
    pawn,cell:world.cellsByKey.get(pawn.cellKey)!,
    rotation:world.actorOrientation(pawn.seal)
   }))
   .filter(other=>other.cell!==undefined);
  const args={
   board,from:press.cell,to:target,attacker:press.pawn,victim,others,
   attackerRotation:world.actorOrientation(press.pawn.seal),
   victimRotation:victim?world.actorOrientation(victim.seal):undefined
  };
  void RC01RapierFlight.create(args).then(flight=>{
   if(epochRef.current!==startedEpoch||worldRef.current!==world){
    flight.dispose();
    return;
   }
   launchingRef.current=false;
   flightRef.current=flight;
  }).catch(error=>{
   if(epochRef.current!==startedEpoch)return;
   launchingRef.current=false;
   busyRef.current?.(false);
   world.setPawns(gameRef.current?.pawns??[],gameRef.current?.home??[]);
   console.error("Rapier RC01 physics initialization failed",error);
  });
 };
 const onPointerUp=(e:ReactPointerEvent<HTMLCanvasElement>)=>{
  const press=pressRef.current,world=worldRef.current;
  if(!press||press.pointerId!==e.pointerId||!world)return;
  const point=screenPoint(e);
  const target=point?world.raycastCell(point.x,point.y):null;
  const wasDragging=press.dragging||
   Math.hypot(e.clientX-press.startX,e.clientY-press.startY)>=MIN_DRAG_PIXELS;
  cancelPointer(e.currentTarget,e.pointerId);
  if(isBusy())return;
  if(!wasDragging){
   selectRef.current(press.cell,press.pawn);
   return;
  }
  if(!press.pawn||!target||target.key===press.cell.key)return;
  launchPhysicalMove(press,target);
 };
 const onPointerCancel=(e:ReactPointerEvent<HTMLCanvasElement>)=>
  cancelPointer(e.currentTarget,e.pointerId);
 const onKeyDown=(e:ReactKeyboardEvent<HTMLCanvasElement>)=>{
  const world=worldRef.current;
  if(!world||isBusy())return;
  const active=world.cellsByKey.get(focusKey.current)??world.cellsByKey.get("0,0");
  if(!active)return;
  const dir=e.key==="ArrowRight"?[0,1]:
   e.key==="ArrowLeft"?[0,-1]:
   e.key==="ArrowUp"?[1,0]:
   e.key==="ArrowDown"?[-1,0]:null;
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
  void world.initHomePhysics().catch(error=>
   console.error("Home Rapier initialization failed",error));
  world.setPawns(gameRef.current?.pawns??[],gameRef.current?.home??[]);
  const resumed=(gameRef.current?.home??[]).filter(
   pawn=>activeReturnsRef.current.has(pawn.seal));
  if(resumed.length)world.startHomeReturns(resumed);
  const epoch=++epochRef.current;
  let alive=true,raf=0,last=performance.now(),accumulator=0;
  const frame=(now:number)=>{
   if(!alive)return;
   raf=requestAnimationFrame(frame);
   const dt=Math.max(0,Math.min(.06,(now-last)/1000));last=now;
   const flight=flightRef.current;
   if(flight){
    accumulator+=dt;
    let steps=0,physical=flight.snapshot();
    // Stable integration regardless of the phone's rendering framerate.
    while(accumulator>=RC_RAPIER_FIXED_STEP&&steps++<8){
     physical=flight.step();
     accumulator-=RC_RAPIER_FIXED_STEP;
     if(physical.done)break;
    }
    world.physicalPose(physical.attacker.seal,physical.attacker);
    if(physical.victim)
     world.physicalPose(physical.victim.seal,physical.victim);
    // The FIRST Rapier contact transfers the untouched full-size actor
    // into Home's separate physics simulation. No offscreen excursion.
    const victim=pendingVictimRef.current;
    if(victim&&physical.collided&&physical.victim&&
     physical.victim.seal===victim.seal){
     world.transferToHome(victim,physical.victim);
     flight.detachVictimToHome();
     pendingVictimRef.current=null;
    }
    for(const other of physical.bystanders)
     world.physicalPose(other.seal,other);
    if(physical.done){
     flightRef.current=null;
     flight.dispose();
     // Commit the destination BEFORE unlocking viewport measurements:
     // a mobile browser chrome resize must not recreate the scene with the
     // old source cell after a long physical flight.
     if(physical.success)commitRef.current(flight.from,flight.to);
     else console.error("RC01: physics stopped without a completed move");
     busyRef.current?.(false);
     accumulator=0;
    }
   }else accumulator=0;
   const running=flightRef.current;
   const active=new Set<number>();
   if(running){
    active.add(running.attackerSeal);
    if(running.victimSeal!==null)active.add(running.victimSeal);
    for(const seal of running.otherSeals)active.add(seal);
   }
   world.rotateModels(now,active);
   world.stepMutationHalos(dt);
   const arrived=world.stepHome(dt,!isBusy());
   for(const seal of arrived){
    activeReturnsRef.current.delete(seal);
    arrivalRef.current(seal);
   }
   renderer.render(world.scene,world.camera);
  };
  raf=requestAnimationFrame(frame);
  return ()=>{
   alive=false;cancelAnimationFrame(raf);
   epochRef.current=epoch+1;
   pressRef.current=null;launchingRef.current=false;
   pendingVictimRef.current=null;doubleTapRef.current=null;
   flightRef.current?.dispose();flightRef.current=null;
   worldRef.current=null;
   world.dispose();renderer.dispose();
  };
 },[board]);
 useEffect(()=>{
  // Game changes only after a completed, physically evaluated move.
  if(game?.pawns.length===72&&game.home.length===0)
   activeReturnsRef.current.clear();
  if(!isBusy())worldRef.current?.setPawns(game?.pawns??[],game?.home??[]);
  const generation=game?.mutatron.generation??0;
  if(generation!==lastMutationGenerationRef.current){
   lastMutationGenerationRef.current=generation;
   if(game?.mutatron.changes.length)
    worldRef.current?.pulseMutations(game.mutatron.changes);
  }
 },[game]);
 return <canvas ref={canvasRef} className="rc01-three-board"
  role="img" aria-label="3D Mutatron: 72 Polytrons across five hexagonal rings. Drag to move or fuse; captures return Home. Double-tap an odd/even Home to recall its Polytrons; double-tap again to return them to their opening cells with capture on occupation."
  tabIndex={0} onPointerDown={onPointerDown} onPointerMove={onPointerMove}
  onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}
  onLostPointerCapture={()=>{if(pressRef.current)cancelPointer();}}
  onKeyDown={onKeyDown}/>;
}
