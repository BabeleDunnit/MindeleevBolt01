import {useEffect,useRef,useState} from "react";
import type {PointerEvent as ReactPointerEvent,KeyboardEvent as ReactKeyboardEvent,
 WheelEvent as ReactWheelEvent} from "react";
import * as THREE from "three";
import {rcHomeContains,type RCBoard,type RCCell,type RCPoint} from "@/polytron/rc01Board";
import {pawnAt,type RCGame,type RCPawn,type RCHomeParity,
 type RCHomeToggleResult} from "@/polytron/rc01Game";
import {RC01RapierFlight,RC_RAPIER_FIXED_STEP}
 from "@/experiments/rc01RapierFlight";
import {createRC3DWorld} from "@/experiments/rc01ThreeScene";
import type {RCViewMode,RCViewSnapshot} from "@/experiments/rc01Camera";
import type {RCMutatronForecastCell} from "@/polytron/rc01Mutatron";
import {rcDragAim,rcIsTouch} from "@/experiments/rc01TouchInput";

const MIN_DRAG_PIXELS=9;
type Press={
 pointerId:number;pointerType:string;startX:number;startY:number;
 cell:RCCell|null;pawn:RCPawn|null;dragging:boolean;
 panning:boolean;orbiting:boolean;last:RCPoint;
};
type ThreeWorld=ReturnType<typeof createRC3DWorld>;
export type RCCameraCommand={id:number;mode:RCViewMode;cellKey?:string};

export default function RC01ThreeBoard({
 board,game,preview,cameraCommand,onViewModeChange,
 selectedSeal,onTouchSelect,
 onSelect,onCommitMove,onOpenHome,onToggleParity,onReturnArrived,onBusyChange
}:{
 board:RCBoard;game:RCGame|null;
 preview:readonly RCMutatronForecastCell[];
 cameraCommand:RCCameraCommand|null;
 onViewModeChange:(mode:RCViewMode)=>void;
 selectedSeal:number|null;
 onTouchSelect:(seal:number|null)=>void;
 onSelect:(cell:RCCell,pawn:RCPawn|null)=>void;
 onCommitMove:(source:string,target:string)=>void;
 onOpenHome:(parity?:RCHomeParity)=>void;
 onToggleParity:(parity:RCHomeParity)=>RCHomeToggleResult;
  onReturnArrived:(seal:number)=>void;
 onBusyChange?:(busy:boolean)=>void;
}){
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const [dragHint,setDragHint]=useState<string|null>(null);
 const touchSelectRef=useRef(onTouchSelect);
 const selectedSealRef=useRef(selectedSeal);
 const viewSavedRef=useRef<RCViewSnapshot|null>(null);
 const modeRef=useRef(onViewModeChange);
 const pointersRef=useRef(new Map<number,RCPoint>());
 const gestureRef=useRef<{mid:RCPoint;distance:number}|null>(null);
 const suppressTapRef=useRef(false);
 const worldRef=useRef<ThreeWorld|null>(null);
 const gameRef=useRef(game);
 const previewRef=useRef(preview);
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
 // Subjective view defaults to the opening cube, never an empty Nucleus.
 const focusKey=useRef("1,0");
 gameRef.current=game;
 previewRef.current=preview;
 selectRef.current=onSelect;
 touchSelectRef.current=onTouchSelect;
 selectedSealRef.current=selectedSeal;
 commitRef.current=onCommitMove;
 homeRef.current=onOpenHome;
 toggleRef.current=onToggleParity;
 arrivalRef.current=onReturnArrived;
 busyRef.current=onBusyChange;
 modeRef.current=onViewModeChange;
 const isBusy=()=>launchingRef.current||flightRef.current!==null;
 const screenPoint=(e:{clientX:number;clientY:number;currentTarget:HTMLCanvasElement}):RCPoint|null=>{
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
  setDragHint(null);
  pressRef.current=null;
  worldRef.current?.hover(null,false);
 };
 const notifyView=()=>{
  const mode=worldRef.current?.view.getMode();
  if(mode)modeRef.current(mode);
 };
 const panBetween=(from:RCPoint,to:RCPoint)=>{
  const world=worldRef.current;if(!world)return;
  const a=world.raycastBoardPlane(from.x,from.y);
  const b=world.raycastBoardPlane(to.x,to.y);
  if(a&&b)world.view.panWorld(a.x-b.x,b.y-a.y);
 };
 const onPointerDown=(e:ReactPointerEvent<HTMLCanvasElement>)=>{
  if(e.pointerType==="mouse"&&e.button!==0)return;
  const world=worldRef.current,point=screenPoint(e);
  if(!world||!point)return;
  pointersRef.current.set(e.pointerId,point);
  e.currentTarget.setPointerCapture(e.pointerId);
  if(pointersRef.current.size>=2){
   cancelPointer();doubleTapRef.current=null;
   suppressTapRef.current=true;
   const ps=[...pointersRef.current.values()].slice(0,2);
   gestureRef.current={
    mid:{x:(ps[0].x+ps[1].x)/2,y:(ps[0].y+ps[1].y)/2},
    distance:Math.max(1,Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y))
   };
   e.preventDefault();return;
  }
  // A second touch is NOT a second tap of the parity Home.
  if(suppressTapRef.current)return;
  const boardPoint=world.raycastBoardPlane(point.x,point.y);
  const parity=boardPoint?(["odd","even"] as const).find(side=>
   rcHomeContains(board,side,boardPoint)):undefined;
  if(parity&&gameRef.current&&!isBusy()&&world.view.getMode()!=="subjective"){
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
   e.preventDefault();return;
  }
  const orbiting=world.view.getMode()==="subjective";
  const picked=!orbiting&&!isBusy()?
   world.raycastPawn(point.x,point.y):null;
  const cell=picked?.cell??world.raycastCell(point.x,point.y);
  if(cell)focusKey.current=cell.key;
  pressRef.current={
   pointerId:e.pointerId,pointerType:e.pointerType,
   startX:e.clientX,startY:e.clientY,
   cell,pawn:!orbiting&&!isBusy()&&cell&&gameRef.current?
    picked?.pawn??pawnAt(gameRef.current,cell.key)??null:null,
   dragging:false,panning:false,orbiting,last:point
  };
  e.preventDefault();
 };
 const onPointerMove=(e:ReactPointerEvent<HTMLCanvasElement>)=>{
  const world=worldRef.current,point=screenPoint(e);
  if(!world||!point||!pointersRef.current.has(e.pointerId))return;
  pointersRef.current.set(e.pointerId,point);
  const ps=[...pointersRef.current.values()];
  if(ps.length>=2){
   const [a,b]=ps;
   const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
   const distance=Math.max(1,Math.hypot(a.x-b.x,a.y-b.y));
   const last=gestureRef.current;
   if(last){
    // Two fingers always pan/zoom -- never initiate a Polytron move.
    panBetween(last.mid,mid);
    const at=world.raycastBoardPlane(mid.x,mid.y);
    world.view.zoomAt(distance/last.distance,at??undefined);
    notifyView();
   }
   gestureRef.current={mid,distance};
   e.preventDefault();return;
  }
  if(suppressTapRef.current)return;
  const press=pressRef.current;
  if(!press||press.pointerId!==e.pointerId)return;
  const distance=Math.hypot(e.clientX-press.startX,e.clientY-press.startY);
  if(distance<MIN_DRAG_PIXELS&&!press.dragging)return;
  const previous=press.last;
  press.last=point;press.dragging=true;
  if(press.orbiting){
   world.view.orbit(point.x-previous.x,point.y-previous.y);
   e.preventDefault();return;
  }
  if(!press.pawn){
   press.panning=true;
   panBetween(previous,point);
   notifyView();
   e.preventDefault();return;
  }
  if(isBusy()||!press.cell)return;
  // A TOUCH pointer aims ABOVE the finger. Mouse/pen stay exact.
  // The same 'aim' will be used on pointer-up, preventing a mismatch
  // between the highlighted target and the actual Rapier destination.
  const aim=rcDragAim(point,press.pointerType,board.height,
   e.currentTarget.getBoundingClientRect().height);
  const worldPoint=world.raycastBoardPlane(aim.x,aim.y);
  world.dragPreview(worldPoint);
  const target=world.raycastCell(aim.x,aim.y);
  const valid=!!target&&target.key!==press.cell.key;
  const occupied=!!(valid&&gameRef.current&&
   pawnAt(gameRef.current,target!.key));
  world.hover(valid?target!.key:null,occupied,valid);
  if(rcIsTouch(press.pointerType)){
   touchSelectRef.current(press.pawn.seal);
   const text=valid?
    (occupied?"FUSE":"MOVE")+" · ring "+target!.ring+
    " / "+target!.idxInRing:
    "Move finger to aim · release on highlighted cell";
   setDragHint(last=>last===text?last:text);
  }
  e.preventDefault();
 };
 const launchPhysicalMove=(press:Press,target:RCCell)=>{
  if(!press.pawn||!press.cell||isBusy()||!gameRef.current)return;
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
  pointersRef.current.delete(e.pointerId);
  if(pointersRef.current.size<2)gestureRef.current=null;
  if(suppressTapRef.current){
   cancelPointer();
   if(!pointersRef.current.size)suppressTapRef.current=false;
   return;
  }
  const press=pressRef.current,world=worldRef.current;
  if(!press||press.pointerId!==e.pointerId||!world)return;
  const point=screenPoint(e);
  const aim=point?rcDragAim(point,press.pointerType,board.height,
   e.currentTarget.getBoundingClientRect().height):null;
  const target=aim?world.raycastCell(aim.x,aim.y):null;
  const wasDragging=press.dragging||
   Math.hypot(e.clientX-press.startX,e.clientY-press.startY)>=MIN_DRAG_PIXELS;
  cancelPointer(e.currentTarget,e.pointerId);
  if(isBusy()||press.orbiting)return;
  if(!wasDragging){
   if(rcIsTouch(press.pointerType)){
    // Touch tap selects without opening the modal; explicit Info is the
    // only path to inspector. A tap on an empty tile clears selection.
    touchSelectRef.current(press.pawn?.seal??null);
   }else if(press.cell)selectRef.current(press.cell,
    gameRef.current?pawnAt(gameRef.current,press.cell.key)??null:null);
   return;
  }
  if(!press.pawn||!press.cell||press.panning||
   !target||target.key===press.cell.key)return;
  launchPhysicalMove(press,target);
 };
 const onPointerCancel=(e:ReactPointerEvent<HTMLCanvasElement>)=>{
  pointersRef.current.delete(e.pointerId);
  if(pointersRef.current.size<2)gestureRef.current=null;
  if(!pointersRef.current.size)suppressTapRef.current=false;
  if(pressRef.current?.pointerId===e.pointerId)cancelPointer();
 };
 const onWheel=(e:ReactWheelEvent<HTMLCanvasElement>)=>{
  const world=worldRef.current,point=screenPoint(e);
  if(!world)return;
  const anchor=point?world.raycastBoardPlane(point.x,point.y):null;
  world.view.zoomAt(Math.exp(-Math.max(-180,Math.min(180,e.deltaY))*.002),
   anchor??undefined);
  notifyView();e.preventDefault();
 };
 const onKeyDown=(e:ReactKeyboardEvent<HTMLCanvasElement>)=>{
  const world=worldRef.current;
  if(!world)return;
  if(e.key==="0"||e.key==="Home"||e.key==="Escape"){
   e.preventDefault();world.view.overview();notifyView();return;
  }
  if(e.key==="+"||e.key==="="||e.key==="-"){
   e.preventDefault();
   world.view.zoomAt(e.key==="-"?1/1.3:1.3);
   notifyView();return;
  }
  if(e.key.toLowerCase()==="v"){
   e.preventDefault();
   const focus=world.cellsByKey.get(focusKey.current)??world.cellsByKey.get("0,0");
   if(focus)world.view.focusOnCell(focus,"subjective");
   notifyView();return;
  }
  if(isBusy())return;
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
  const world=createRC3DWorld(board,viewSavedRef.current??undefined);
  worldRef.current=world;
  modeRef.current(world.view.getMode());
  void world.initHomePhysics().catch(error=>
   console.error("Home Rapier initialization failed",error));
  world.setPawns(gameRef.current?.pawns??[],gameRef.current?.home??[]);
  world.setSelectedCell(gameRef.current?.pawns.find(
   pawn=>pawn.seal===selectedSealRef.current)?.cellKey??null);
  world.setEvolutionPreview(previewRef.current);
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
   world.view.step(dt);
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
   viewSavedRef.current=world.view.snapshot();
   pointersRef.current.clear();gestureRef.current=null;
   suppressTapRef.current=false;
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
  worldRef.current?.setSelectedCell(game?.pawns.find(
   pawn=>pawn.seal===selectedSealRef.current)?.cellKey??null);
  const generation=game?.mutatron.generation??0;
  if(generation!==lastMutationGenerationRef.current){
   lastMutationGenerationRef.current=generation;
   if(game?.mutatron.changes.length)
    worldRef.current?.pulseMutations(game.mutatron.changes);
  }
 },[game]);
 useEffect(()=>{
  worldRef.current?.setEvolutionPreview(preview);
 },[preview]);
 useEffect(()=>{
  worldRef.current?.setSelectedCell(gameRef.current?.pawns.find(
   pawn=>pawn.seal===selectedSeal)?.cellKey??null);
 },[selectedSeal]);
 useEffect(()=>{
  if(!cameraCommand)return;
  const world=worldRef.current;
  if(!world)return;
  if(cameraCommand.mode==="map")world.view.overview();
  else{
   const target=world.cellsByKey.get(cameraCommand.cellKey??focusKey.current)
    ??world.cellsByKey.get("0,0");
   if(target){
    focusKey.current=target.key;
    world.view.focusOnCell(target,cameraCommand.mode==="subjective"?
     "subjective":"area");
   }
  }
  notifyView();
 },[cameraCommand]);
 return <>
 <canvas ref={canvasRef} className="rc01-three-board"
  role="img" aria-label="3D Mutatron with MAP, AREA and subjective 3D views. Use two fingers to pinch and pan. Drag empty tiles to navigate while zoomed; drag occupied tiles to move or fuse. In subjective view drag to orbit the selected Polytron. Double-tap a Home to recall or return its Polytrons."
  tabIndex={0} onPointerDown={onPointerDown} onPointerMove={onPointerMove}
  onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}
  onLostPointerCapture={e=>{
   if(pressRef.current?.pointerId===e.pointerId)cancelPointer();
   pointersRef.current.delete(e.pointerId);
   if(pointersRef.current.size<2)gestureRef.current=null;
   if(!pointersRef.current.size)suppressTapRef.current=false;
  }}
  onWheel={onWheel} onKeyDown={onKeyDown}/>
 {dragHint&&<div className="rc01-touch-drag-hint" role="status"
  aria-live="polite">{dragHint}</div>}
 </>;
}
