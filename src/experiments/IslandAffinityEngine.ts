/**
 * Island Affinity Laboratory · Sprint 26
 * Measured Shape-DNA spectra -> invented spring rest-length law.
 * Carried ENERGY is conserved in a separate, finite commodity ledger;
 * kinetic/potential work is not yet part of that ledger.
 */
import {dnaToPoly} from "@/polytron/polytron";
import {surfaceShapeDNA,spectrumDistance,type SurfaceSpectrum} from "./surfaceShapeDNA";
import {SINKS} from "./phaseShiftEngine";
import {makeSetup} from "./musicalReturnEngine";
export type Seed="T"|"C"|"O"|"D"|"I";
export type Physics="party"|"boids"|"hybrid";
export type Scenario="R0"|"R1"|"R2"|"R3"|"R4";
export type Wave="probe"|"radial";
export type Verb="colora"|"combina"|"scinde"|"clona"|"seleziona";
export const VERBS:Record<Seed,Verb>={T:"colora",C:"combina",O:"scinde",D:"clona",I:"seleziona"};
export type Parts={ops:string;palette:number;seed:Seed};
export type Node={id:string;name:string;dna:string;x:number;y:number;reserve:number;known:string[];history:string[];buffer?:string;bufferAt?:number};
export type Walker={id:string;dna:string;x:number;y:number;vx:number;vy:number;energy:number;status:"flying"|"buffered"|"returned"|"escaped"|"retired";touches:number;lastNode?:string;lastAt?:number;trail:{x:number;y:number}[]};
export type EvKind="emit"|"color"|"fuse"|"split"|"clone"|"filter"|"null"|"buffer"|"release"|"learn"|"return"|"escape";
export type Ev={step:number;kind:EvKind;walker:string;node?:string;name?:string;before?:string;after?:string;note:string;x:number;y:number};
export type Ledger={input:number;harvested:number;returned:number;escaped:number;dissipated:number;inField:number;buffered:number;balance:number;unusedReserve:number;walletAfter:number};
export type Frame={step:number;walkers:Walker[];nodes:Node[];events:Ev[];ledger:Ledger};
export type Setup={scenario:Scenario;nodes:Node[];emission:string;returnPalette:number;wave:Wave;count:1|6|12;physics:Physics;seed:number;budget:number};
export type Run={setup:Setup;frames:Frame[];events:Ev[];summary:Ledger;peak:number;returnedCount:number;diversity:number;nullCount:number};
const MAX_OPS=4,STEPS=240,DT=.13,EDGE=245,CONTACT=22,MAX_AGENTS=36,COOLDOWN=15;
const VALID=new Set("d a k g p r c w q n x l u e b o m t j s".split(" "));
const SPECTRA=new Map<string,SurfaceSpectrum|null>();
const VALIDATED=new Map<string,Parts>();
const AFFINITIES=new Map<string,ReturnType<typeof computeAffinity>>();
export function encode(p:Parts):string{return p.ops+String(p.palette).padStart(2,"0")+p.seed;}
export function decode(s:string):Parts{
 const cached=VALIDATED.get(s);if(cached)return cached;
 const m=/^([a-z]*?)(\d{2})?([TOCID])$/.exec(s);
 if(!m||m[1].length>MAX_OPS||![...m[1]].every(x=>VALID.has(x)))throw Error("DNA non valido o operatore non supportato: "+s);
 const p={ops:m[1],palette:Number(m[2]??0),seed:m[3] as Seed};
 dnaToPoly(encode(p));VALIDATED.set(s,p);return p;
}
export function wrapDNA(dna:string,ops:string):string|null{
 try{const d=decode(dna);if(d.ops.length+ops.length>MAX_OPS)return null;
  const out=encode({...d,ops:ops+d.ops});decode(out);return out;
 }catch{return null;}
}
function spectrum(dna:string){
 const d=decode(dna),key=d.ops+d.seed;
 if(!SPECTRA.has(key))SPECTRA.set(key,surfaceShapeDNA(dnaToPoly(dna),80,10));
 return SPECTRA.get(key)??null;
}
function computeAffinity(a:string,b:string){
 const aa=spectrum(a),bb=spectrum(b);
 if(aa&&bb){
  const distance=spectrumDistance(aa,bb);
  if(Number.isFinite(distance)){const similarity=Math.exp(-(distance/.42)**2);
   return {distance,similarity,rest:15+78*(1-similarity),fallback:false};}
 }
 // Explicitly flagged fallback for meshes outside the FEM solver limit.
 const pa=dnaToPoly(a),pb=dnaToPoly(b);
 const distance=Math.abs(Math.log(pa.vertices.length/pb.vertices.length))+
   Math.abs(Math.log(pa.faces.length/pb.faces.length));
 const similarity=Math.exp(-(distance/.6)**2);
 return {distance,similarity,rest:15+78*(1-similarity),fallback:true};
}
export function affinity(a:string,b:string){
 const key=[a.replace(/\d{2}(?=[TOCID]$)/,""),b.replace(/\d{2}(?=[TOCID]$)/,"")].sort().join("|");
 let result=AFFINITIES.get(key);
 if(!result){result=computeAffinity(a,b);AFFINITIES.set(key,result);}return result;
}
export function randomGenerator(seed:number){
 let s=seed|0;return ()=>{s=(s+0x6D2B79F5)|0;
  let t=Math.imul(s^(s>>>15),1|s);
  t=(t+Math.imul(t^(t>>>7),61|t))^t;
  return ((t^(t>>>14))>>>0)/4294967296;};
}
export function cutDNA(dna:string,randomNumber:number):[string,string]|null{
 const p=decode(dna),n=p.ops.length;if(n<2)return null;
 const cut=1+Math.floor(Math.max(0,Math.min(.999999999,randomNumber))*(n-1));
 return [encode({...p,ops:p.ops.slice(0,cut)}),encode({...p,ops:p.ops.slice(cut)})];
}
const cloneNode=(n:Node):Node=>({...n,known:[...n.known],history:[...n.history]});
const cloneWalker=(t:Walker):Walker=>({...t,trail:t.trail.map(x=>({...x}))});
const names=makeSetup(0).stations.map(s=>s.name);
const extraNames=["Elemigin","Mahamarbas","Lelahith"];
const ring=SINKS.filter(x=>x.ring===1);
export function initialIslands(scenario:Scenario="R0"):Setup{
 const seeds:Seed[]=scenario==="R0"||scenario==="R4"?["T","T","T","T","T","T"]:
  scenario==="R1"?["T","I","T","I","T","I"]:
  scenario==="R2"?["O","D","T","C","I","T"]:["T","C","O","D","I","T"];
 const nodes=ring.map((p,i)=>{
  const palette=(scenario==="R1"&&i%2?3:scenario==="R2"&&i===3?1:2);
  const ops=scenario==="R3"&&i===0?"a":"";
  const dna=encode({ops,palette,seed:seeds[i]});
  return {id:"P"+String(i+1).padStart(2,"0"),name:names[i]??extraNames[i-3]??"Individual "+i,
   dna,x:p.x*1.42,y:p.y*1.42,reserve:1.4,known:[dna],history:[]};
 });
 return {scenario,nodes,emission:scenario==="R2"?"ad01C":"01C",returnPalette:2,
  wave:scenario==="R0"?"radial":"probe",count:scenario==="R0"?6:1,
  physics:scenario==="R1"?"boids":"party",seed:227,budget:6};
}
function led(input:number,harvested:number,nodes:Node[],walkers:Walker[],dissipated:number):Ledger{
 const sum=(status:Walker["status"])=>walkers.filter(w=>w.status===status).reduce((a,w)=>a+w.energy,0);
 const returned=sum("returned"),escaped=sum("escaped"),inField=sum("flying"),buffered=sum("buffered");
 return {input,harvested,returned,escaped,dissipated,inField,buffered,
  unusedReserve:nodes.reduce((a,b)=>a+b.reserve,0),
  balance:input+harvested-returned-escaped-dissipated-inField-buffered,
  walletAfter:12-input+returned};
}
function makeChild(base:Walker,id:string,dna:string,side:number,step:number,energy:number):Walker{
 const mag=Math.max(1,Math.hypot(base.vx,base.vy)),tx=-base.vy/mag,ty=base.vx/mag;
 return {...base,id,dna,status:"flying",energy,x:base.x+tx*side*3,y:base.y+ty*side*3,
  vx:base.vx+tx*side*3,vy:base.vy+ty*side*3,lastAt:step,
  trail:[...base.trail.slice(-130),{x:base.x+tx*side*3,y:base.y+ty*side*3}]};
}
export function runIslands(setup:Setup):Run{
 if(setup.nodes.length>71||setup.nodes.some(n=>Math.hypot(n.x,n.y)<36))throw Error("Isole non valide");
 if(new Set(setup.nodes.map(x=>x.id)).size!==setup.nodes.length)throw Error("Identità ripetute");
 if(setup.budget<=0||setup.budget>12)throw Error("Budget fuori limite");
 decode(setup.emission);for(const n of setup.nodes)decode(n.dna);
 const nodes=setup.nodes.map(cloneNode),random=randomGenerator(setup.seed),walkers:Walker[]=[],events:Ev[]=[],frames:Frame[]=[];
 const addEv=(es:Ev[],e:Ev)=>{es.push(e);events.push(e);};
 let nextId=1,harvested=0,dissipated=0,peak=0;
 const count=setup.wave==="probe"?1:setup.count;
 for(let i=0;i<count;i++){
  const angle=Math.PI/6+(setup.wave==="probe"?0:i*2*Math.PI/count);
  const x=28*Math.cos(angle),y=28*Math.sin(angle);
  walkers.push({id:"v"+nextId++,dna:setup.emission,x,y,
   vx:33*Math.cos(angle),vy:33*Math.sin(angle),energy:setup.budget/count,
   status:"flying",touches:0,trail:[{x,y}]});
 }
 for(let step=0;step<=STEPS;step++){
  const es:Ev[]=[];
  if(step===0)for(const w of walkers)addEv(es,{step,kind:"emit",walker:w.id,x:w.x,y:w.y,
   after:w.dna,note:"Sorgente emette "+w.dna});
  for(const n of nodes)if(n.buffer&&n.bufferAt!==undefined&&step-n.bufferAt>=65){
   const w=walkers.find(w=>w.id===n.buffer);
   if(w&&w.status==="buffered"){
    w.status="flying";w.vx+=5;w.lastAt=step;
    addEv(es,{step,kind:"release",walker:w.id,node:n.id,name:n.name,x:w.x,y:w.y,note:"Buffer combinazione scaduto"});
   }
   n.buffer=undefined;n.bufferAt=undefined;
  }
  const moving=walkers.filter(w=>w.status==="flying");
  const F=new Map(moving.map(w=>[w.id,{x:0,y:0}]));
  const force=(id:string,x:number,y:number)=>{const a=F.get(id)!;a.x+=x;a.y+=y;};
  for(const w of moving){
   for(const n of nodes){
    const dx=n.x-w.x,dy=n.y-w.y,r=Math.max(.01,Math.hypot(dx,dy));
    const prop=affinity(w.dna,n.dna);
    const factor=setup.physics==="boids"?.42:1;
    const strength=Math.max(-15,Math.min(15,(r-prop.rest)*.028*(.35+prop.similarity)))*factor;
    force(w.id,dx/r*strength,dy/r*strength);
   }
   // The Source becomes attractive only when the carrier has met a controller
   // and has acquired the selected return palette. No hidden auto-return timer.
   if(w.touches>0&&decode(w.dna).palette===setup.returnPalette){
    const r=Math.max(1,Math.hypot(w.x,w.y)),p=Math.min(26,4+r*.16);
    force(w.id,-w.x/r*p,-w.y/r*p);
   }
  }
  for(let i=0;i<moving.length;i++)for(let j=i+1;j<moving.length;j++){
   const a=moving[i],b=moving[j],dx=b.x-a.x,dy=b.y-a.y,r=Math.max(.01,Math.hypot(dx,dy)),ux=dx/r,uy=dy/r;
   if(setup.physics!=="boids"){
    const rest=affinity(a.dna,b.dna).rest,mag=Math.max(-12,Math.min(12,(r-rest)*.018));
    force(a.id,ux*mag,uy*mag);force(b.id,-ux*mag,-uy*mag);
   }
   if(setup.physics!=="party"&&r<65){
    const sep=Math.max(0,28-r)*.22,coh=.003,align=.014;
    force(a.id,-ux*sep+dx*coh+(b.vx-a.vx)*align,-uy*sep+dy*coh+(b.vy-a.vy)*align);
    force(b.id,ux*sep-dx*coh+(a.vx-b.vx)*align,uy*sep-dy*coh+(a.vy-b.vy)*align);
   }
  }
  for(const w of moving){
   const f=F.get(w.id)!,m=1+decode(w.dna).ops.length*.08;
   w.vx=(w.vx+Math.max(-32,Math.min(32,f.x))*DT/m)*.991;
   w.vy=(w.vy+Math.max(-32,Math.min(32,f.y))*DT/m)*.991;
   const v=Math.hypot(w.vx,w.vy);
   if(v>58){w.vx*=58/v;w.vy*=58/v;}
   const oldRadius=Math.hypot(w.x,w.y);
   w.x+=w.vx*DT;w.y+=w.vy*DT;w.trail.push({x:w.x,y:w.y});
   if(w.trail.length>150)w.trail.shift();
   const loss=Math.min(w.energy,.0025);w.energy-=loss;dissipated+=loss;
   const radius=Math.hypot(w.x,w.y);
   if(radius>EDGE){w.status="escaped";addEv(es,{step,kind:"escape",walker:w.id,x:w.x,y:w.y,note:"Uscita dal campo"});continue;}
   if(oldRadius>25&&radius<=25&&w.touches>0&&decode(w.dna).palette===setup.returnPalette){
    w.status="returned";addEv(es,{step,kind:"return",walker:w.id,x:w.x,y:w.y,
     after:w.dna,note:"Ritorno accolto dall'Architron"});
   }
  }
  // Reactions use stable ordering; newly produced children wait until next tick.
  for(const w of walkers.filter(w=>w.status==="flying").sort((a,b)=>Number(a.id.slice(1))-Number(b.id.slice(1)))){
   if(w.lastAt!==undefined&&step-w.lastAt<COOLDOWN)continue;
   const n=nodes.filter(n=>Math.hypot(w.x-n.x,w.y-n.y)<CONTACT)
    .sort((a,b)=>Math.hypot(w.x-a.x,w.y-a.y)-Math.hypot(w.x-b.x,w.y-b.y)||a.id.localeCompare(b.id))[0];
   if(!n)continue;
   w.lastNode=n.id;w.lastAt=step;w.touches++;
   const before=w.dna,station=decode(n.dna),input=decode(w.dna),created:Walker[]=[];
   let kind:EvKind="null",result=before,note="Trasformazione nulla";
   if(station.seed==="T"){
    const colored=encode({...input,palette:station.palette});
    const output=wrapDNA(colored,station.ops);
    if(output){w.dna=output;result=output;kind=output===before?"null":"color";note="Colora"+(station.ops?" + "+station.ops:"");}
    else note="Modificatore non applicabile";
   }else if(station.seed==="I"){
    if(input.palette===station.palette){
     const output=wrapDNA(before,station.ops);
     if(output){w.dna=output;result=output;kind=output===before?"filter":"filter";note="Filtro ammesso"+(station.ops?" + "+station.ops:"");}
     else note="Filtro valido, ma DNA risultante impossibile";
    }else note="Filtro non corrispondente: palette";
   }else if(station.seed==="O"){
    const split=cutDNA(before,random());
    if(split&&w.energy>.35&&walkers.filter(t=>t.status==="flying").length+1<MAX_AGENTS){
     const left=wrapDNA(split[0],station.ops),right=wrapDNA(split[1],station.ops);
     if(left&&right){
      const e=w.energy/2;
      created.push(makeChild(w,"v"+nextId++,left,-1,step,e),makeChild(w,"v"+nextId++,right,1,step,e));
      w.energy=0;w.status="retired";kind="split";result=left+" + "+right;note="Taglio genetico casuale, riproducibile";
     }else note="Prodotto non valido o profondità massima";
    }else note="Scissione impossibile (DNA corto, limite o energia)";
   }else if(station.seed==="D"){
    if(w.energy>.35&&walkers.filter(t=>t.status==="flying").length+1<MAX_AGENTS){
     const clone=wrapDNA(before,station.ops);
     if(clone){
      const e=w.energy/2;
      created.push(makeChild(w,"v"+nextId++,clone,-1,step,e),makeChild(w,"v"+nextId++,clone,1,step,e));
      w.energy=0;w.status="retired";kind="clone";result=clone+" ×2";note="Clonazione con energia suddivisa";
     }else note="Prodotto genetico non valido";
    }else note="Clonazione impossibile (limite o energia)";
   }else if(station.seed==="C"){
    const partner=n.buffer?walkers.find(t=>t.id===n.buffer):undefined;
    if(!partner||partner.status!=="buffered"){
     n.buffer=w.id;n.bufferAt=step;w.status="buffered";kind="buffer";note="In attesa del secondo viaggiatore";
    }else{
     const p=decode(partner.dna);
     const merged=p.seed===input.seed&&p.palette===input.palette&&p.ops.length+input.ops.length<=MAX_OPS&&
        p.ops.length+input.ops.length>0?wrapDNA(encode({...p,ops:p.ops+input.ops}),station.ops):null;
     if(merged){
      w.dna=merged;w.energy+=partner.energy;partner.energy=0;partner.status="retired";
      kind="fuse";result=merged;note="DNA combinato con "+partner.id;
     }else{
      partner.status="flying";partner.lastAt=step;partner.lastNode=n.id;
      note="Fusione incompatibile: entrambi invariati";
     }
     n.buffer=undefined;n.bufferAt=undefined;
    }
   }
   const receivers=created.length?created:kind==="buffer"||kind==="null"?[]:[w];
   if(receivers.length&&n.reserve>0){
    const gain=Math.min(.04,n.reserve);n.reserve-=gain;harvested+=gain;
    for(const v of receivers)v.energy+=gain/receivers.length;
   }
   const assimilated=created.length?created.map(t=>t.dna):kind==="null"||kind==="buffer"?[]:[w.dna];
   for(const dna of assimilated)if(!n.known.includes(dna)){
    n.known.push(dna);n.history.push("step "+step+": "+dna+" da "+w.id);
    addEv(es,{step,kind:"learn",walker:w.id,node:n.id,name:n.name,x:n.x,y:n.y,
     before:n.dna,after:dna,note:"Controller apprende "+dna+" senza cambiare aspetto"});
   }
   addEv(es,{step,kind,walker:w.id,node:n.id,name:n.name,x:w.x,y:w.y,before,after:result,note});
   walkers.push(...created);
  }
  const state=led(setup.budget,harvested,nodes,walkers,dissipated);
  if(Math.abs(state.balance)>1e-6)throw Error("Ledger ENERGY non conservato al passo "+step+": "+state.balance);
  peak=Math.max(peak,walkers.filter(w=>w.status==="flying").length);
  frames.push({step,walkers:walkers.map(cloneWalker),nodes:nodes.map(cloneNode),events:es,ledger:state});
 }
 return {setup:{...setup,nodes:setup.nodes.map(cloneNode)},events,frames,
  summary:led(setup.budget,harvested,nodes,walkers,dissipated),peak,
  returnedCount:walkers.filter(w=>w.status==="returned").length,
  diversity:new Set(walkers.filter(w=>w.status!=="retired").map(w=>w.dna)).size,
  nullCount:events.filter(e=>e.kind==="null").length};
}
