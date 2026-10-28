import {SINKS} from "./phaseShiftEngine";
import {measurePoly} from "./phenotypeMetrics";

/** Sprint 18: deterministic laboratory simulation, NOT a real physical optics model. */
export type Mode="M0"|"M1"|"M2"|"PHOTON";
export type Station={id:string;name:string;dna:string;sink:string;reserve:number;mutated?:boolean};
export type Setup={stations:Station[];injection:number;pulses:2|3};
export type Traveler={id:string;kind:"carrier"|"photon";dna:string;x:number;y:number;q:number;r:number;direction:number;energy:number;alive:boolean;status:"flying"|"returned"|"escaped";path:{x:number;y:number}[]};
export type Event={step:number;kind:"emit"|"travel"|"encounter"|"mutate"|"return"|"escape";carrierId:string;stationId?:string;stationName?:string;before?:string;after?:string;x:number;y:number;energy:number;note:string};
export type Ledger={input:number;fromReserve:number;returned:number;escaped:number;dissipated:number;inFlight:number;unusedReserve:number;balance:number;walletAfter:number};
export type Frame={step:number;travelers:Traveler[];stations:Station[];events:Event[];ledger:Ledger};
export type Run={mode:Mode;frames:Frame[];events:Event[];summary:Ledger;setup:Setup;totalSteps:number};
export const DIRECTIONS=[{q:1,r:0},{q:0,r:1},{q:-1,r:1},{q:-1,r:0},{q:0,r:-1},{q:1,r:-1}] as const;
export const STATION_DNAS=["C","T","D","aC","O","aT","dC","I"];
export const WALLET=12;
const CENTER=SINKS.find(s=>s.axial.q===0&&s.axial.r===0)!;
const BY_KEY=new Map(SINKS.map(s=>[s.key,s]));
const BY_AXIAL=new Map(SINKS.map(s=>[s.axial.q+","+s.axial.r,s]));
const LIMIT=24,STEP=77.94228634059948;
const asPoint=(q:number,r:number)=>BY_AXIAL.get(q+","+r)??{x:67.5*q,y:STEP*(r+q/2)};
const cloneStations=(s:Station[])=>s.map(x=>({...x}));
const cloneTraveler=(c:Traveler):Traveler=>({...c,path:c.path.map(x=>({...x}))});
export const SCENARIOS=[
 {name:"Circuito iniziale",hint:"Due cubi guidano il viaggiatore lungo un triangolo fino al centro.",dna:["C","C","T"],coords:[[1,0],[0,1],[-1,0]]},
 {name:"Anello interrotto",hint:"La geometria modificata può far perdere un viaggiatore al bordo.",dna:["C","T","D"],coords:[[1,0],[0,1],[-1,0]]},
 {name:"Mutazione in cascata",hint:"Il primo viaggiatore trasforma la prima stazione: il secondo incontra regole nuove.",dna:["C","C","T"],coords:[[1,0],[0,1],[-1,0]]}
] as const;
const pairNames=[["Vehuiah","Bael"],["Jeliel","Agares"],["Sitael","Vassago"]];
const syllables=(s:string)=>s.toLowerCase().split(/(?=[aeiouy])/).map(x=>x.replace(/[^a-z]/g,"")).filter(Boolean);
function individualName(a:string,d:string){
 const as=syllables(a),ds=syllables(d);
 const first=(as.length===1?as[0].slice(0,3):as.slice(0,2).join("").slice(0,5));
 const prev=ds.at(-2)??"",last=ds.at(-1)??"";
 const tail=(ds.length===1?last.slice(-3):(prev.length<=2?prev:prev.slice(-2))+last).slice(-5);
 const mid=!"aeiouy".includes(first.slice(-1))&&!"aeiouy".includes(tail[0])?"a":"";
 const result=(first+mid+tail).slice(0,10);
 return result[0].toUpperCase()+result.slice(1);
}
export function makeSetup(index=0):Setup{
 const p=SCENARIOS[index]??SCENARIOS[0];
 return {injection:3,pulses:2,stations:p.coords.map((coord,i)=>({
  id:"P"+String(i+1).padStart(2,"0"),name:individualName(pairNames[i][0],pairNames[i][1]),
  dna:p.dna[i],sink:BY_AXIAL.get(coord[0]+","+coord[1])!.key,reserve:2.1
 }))};
}
export function centerKey(){return CENTER.key;}
export function siteByKey(key:string){return BY_KEY.get(key);}
export function isOnBoard(q:number,r:number){return Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r))<=2;}
export function position(q:number,r:number){return asPoint(q,r);}
const phi=(dir:number)=>Math.PI/6+dir*Math.PI/3;
const vector=(dir:number)=>({x:Math.cos(phi(dir)),y:Math.sin(phi(dir))});
const shapeCache=new Map<string,{sides:number;faces:number;vertices:number;turn:number}>();
export function shapeResponse(dna:string){
 const cached=shapeCache.get(dna);if(cached)return cached;
 const p=measurePoly(dna);
 const sides=Object.entries(p.faceSides).map(([size,count])=>({size:Number(size),count}))
  .sort((a,b)=>b.count-a.count||a.size-b.size)[0]?.size??3;
 // Deliberate research hypothesis: dominant polygon sidedness maps to
 // discrete turning. It is derived from mesh, not from operator-letter skills.
 const result={sides,faces:p.faces,vertices:p.vertices,turn:Math.max(1,Math.min(3,sides-2))};
 shapeCache.set(dna,result);return result;
}
export function euclideanEmissions(k:2|3,n=8){
 return Array.from({length:n},(_,i)=>i).filter(i=>(i*k)%n<k);
}
function rayDistance(x:number,y:number,dx:number,dy:number,cx:number,cy:number,radius:number){
 const ox=x-cx,oy=y-cy,b=ox*dx+oy*dy,disc=b*b-(ox*ox+oy*oy-radius*radius);
 if(disc<0)return Infinity;
 const rt=Math.sqrt(disc),near=-b-rt,far=-b+rt;
 return near>.001?near:far>.001?far:Infinity;
}
function nextRayHit(c:Traveler,stations:Station[]){
 const dir=vector(c.direction);
 const list:{distance:number;type:"station"|"center"|"edge";station?:Station}[]=[];
 for(const s of stations){
  const p=BY_KEY.get(s.sink)!;
  const distance=rayDistance(c.x,c.y,dir.x,dir.y,p.x,p.y,18);
  if(Number.isFinite(distance))list.push({distance,type:"station",station:s});
 }
 if(c.path.length>1){
  const distance=rayDistance(c.x,c.y,dir.x,dir.y,0,0,22);
  if(Number.isFinite(distance))list.push({distance,type:"center"});
 }
 list.push({distance:rayDistance(c.x,c.y,dir.x,dir.y,0,0,190),type:"edge"});
 list.sort((a,b)=>a.distance-b.distance);
 return {hit:list[0],dir};
}
function ledger(input:number,fromReserve:number,travelers:Traveler[],dissipated:number,stations:Station[]):Ledger{
 const sum=(status:Traveler["status"])=>travelers.filter(x=>x.status===status).reduce((a,b)=>a+b.energy,0);
 const returned=sum("returned"),escaped=sum("escaped"),inFlight=sum("flying");
 return {input,fromReserve,returned,escaped,dissipated,inFlight,
  unusedReserve:stations.reduce((a,b)=>a+b.reserve,0),
  balance:input+fromReserve-returned-escaped-inFlight-dissipated,
  walletAfter:WALLET-input+returned};
}
export function simulate(setup:Setup,mode:Mode):Run{
 if(setup.stations.length>72)throw Error("Oltre 72 Polytroni permanenti.");
 if(setup.injection<=0||setup.injection>3||setup.pulses*setup.injection>WALLET)throw Error("Iniezione fuori budget.");
 if(setup.stations.some(s=>!BY_KEY.has(s.sink)||s.sink===CENTER.key))throw Error("Posizione non valida.");
 if(new Set(setup.stations.map(s=>s.sink)).size!==setup.stations.length)throw Error("Una cella non può ospitare due Polytroni.");
 const stations=cloneStations(setup.stations),travelers:Traveler[]=[],events:Event[]=[],frames:Frame[]=[];
 const emissions=euclideanEmissions(setup.pulses);
 let input=0,fromReserve=0,dissipated=0;
 const log=(to:Event[],e:Event)=>{to.push(e);events.push(e);};
 for(let step=0;step<=LIMIT;step++){
  const atStep:Event[]=[];
  if(emissions.includes(step)){
   const id="v"+(travelers.length+1);
   const c:Traveler={id,kind:mode==="PHOTON"?"photon":"carrier",dna:"T",
    x:0,y:0,q:0,r:0,direction:0,energy:setup.injection,alive:true,status:"flying",path:[{x:0,y:0}]};
   travelers.push(c);input+=setup.injection;
   log(atStep,{step,kind:"emit",carrierId:id,x:0,y:0,energy:c.energy,note:"Architron emette "+id});
  }
  for(const c of travelers){
   if(!c.alive)continue;
   if(c.kind==="carrier"){
    const dir=DIRECTIONS[c.direction],q=c.q+dir.q,r=c.r+dir.r,p=asPoint(q,r);
    const loss=Math.min(c.energy,.16);c.energy-=loss;dissipated+=loss;
    c.q=q;c.r=r;c.x=p.x;c.y=p.y;c.path.push({x:p.x,y:p.y});
    log(atStep,{step,kind:"travel",carrierId:c.id,x:c.x,y:c.y,energy:c.energy,note:"Passo"});
    if(!isOnBoard(q,r)||q===0&&r===0){
     c.alive=false;c.status=isOnBoard(q,r)?"returned":"escaped";
     log(atStep,{step,kind:c.status==="returned"?"return":"escape",carrierId:c.id,x:c.x,y:c.y,energy:c.energy,
      note:c.status==="returned"?"Energia ritornata":"Uscita dal Mutatron"});
     continue;
    }
    const station=stations.find(s=>s.sink===BY_AXIAL.get(q+","+r)?.key);
    if(station){
     const old=station.dna,response=shapeResponse(old);
     const transfer=Math.min(1.05,station.reserve);
     station.reserve-=transfer;c.energy+=transfer;fromReserve+=transfer;
     c.direction=(c.direction+response.turn)%6;
     log(atStep,{step,kind:"encounter",carrierId:c.id,stationId:station.id,stationName:station.name,before:old,after:old,
      x:c.x,y:c.y,energy:transfer,note:station.name+": facce "+response.sides+" lati → "+response.turn*60+"°"});
     if((mode==="M1"||mode==="M2")&&!station.mutated&&station.dna.length<5){
      station.dna="a"+station.dna;station.mutated=true;
      const travelerDNA=c.dna;c.dna="a"+c.dna;
      log(atStep,{step,kind:"mutate",carrierId:c.id,stationId:station.id,stationName:station.name,
       before:old,after:station.dna,x:c.x,y:c.y,energy:0,
       note:station.name+" "+old+"→"+station.dna+"; "+c.id+" "+travelerDNA+"→"+c.dna});
     }
    }
   }else{
    // Continuous planar ray (not a hex-step walker); circular interaction
    // regions are a *proxy* for scattering, not actual polygon ray tracing.
    const {hit,dir}=nextRayHit(c,stations);
    if(!Number.isFinite(hit.distance))throw Error("Raggio senza bordo.");
    const loss=Math.min(c.energy,.16*hit.distance/STEP);c.energy-=loss;dissipated+=loss;
    c.x+=dir.x*hit.distance;c.y+=dir.y*hit.distance;c.path.push({x:c.x,y:c.y});
    log(atStep,{step,kind:"travel",carrierId:c.id,x:c.x,y:c.y,energy:c.energy,note:"Raggio continuo"});
    if(hit.type!=="station"){
     c.alive=false;c.status=hit.type==="center"?"returned":"escaped";
     log(atStep,{step,kind:c.status==="returned"?"return":"escape",carrierId:c.id,x:c.x,y:c.y,energy:c.energy,
      note:hit.type==="center"?"Raggio raccolto":"Raggio oltre il bordo"});
    }else if(hit.station){
     const s=hit.station,response=shapeResponse(s.dna),transfer=Math.min(1.05,s.reserve);
     s.reserve-=transfer;c.energy+=transfer;fromReserve+=transfer;
     c.direction=(c.direction+response.turn)%6;
     // Clear collision boundary in direction of new outgoing ray.
     const heading=vector(c.direction);c.x+=heading.x*.15;c.y+=heading.y*.15;
     log(atStep,{step,kind:"encounter",carrierId:c.id,stationId:s.id,stationName:s.name,before:s.dna,after:s.dna,
      x:c.x,y:c.y,energy:transfer,note:"Raggio deviato da "+s.name});
    }
   }
  }
  if(step===LIMIT)for(const c of travelers)if(c.alive){
   c.alive=false;c.status="escaped";
   log(atStep,{step,kind:"escape",carrierId:c.id,x:c.x,y:c.y,energy:c.energy,note:"Fine esperimento: energia non raccolta"});
  }
  const balance=ledger(input,fromReserve,travelers,dissipated,stations);
  if(Math.abs(balance.balance)>1e-6)throw Error("Violazione conservazione ENERGY: "+balance.balance);
  frames.push({step,travelers:travelers.map(cloneTraveler),stations:cloneStations(stations),events:atStep,ledger:balance});
  if(step>=7&&travelers.every(c=>!c.alive))break;
 }
 return {mode,frames,events,summary:ledger(input,fromReserve,travelers,dissipated,stations),
  setup:{...setup,stations:cloneStations(setup.stations)},totalSteps:frames.length};
}
