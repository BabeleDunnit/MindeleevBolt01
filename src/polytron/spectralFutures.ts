/**
 * Mindeleev Spectral Futures: each reaction is a conditional change of manifestation,
 * never a creation/destruction of the 72 named individuals.
 *
 * All future candidates are built from the same immutable starting snapshot.
 * Complete configurations (not individual ghosts) conserve B + sum(E), have
 * unique seals, exclusive cell footprints, and one resident per hex.
 * No orientation-dependent tie-breaker determines the realised future: the
 * player selects it. The bounded preview catalogue is not an exhaustive solver.
 */
import {allHexes,HEX_DIRECTIONS,hexKey,withinHex,intrinsicEnergy}
 from "@/polytron/mindeleevLife";

export const SPECTRAL_SEALS=72;
export const SPECTRAL_BUDGET=100;
export type Manifestation={seal:number;number:number};
export type SpectralState={
 board:Map<string,Manifestation>;budget:number;generation:number;
 discovered:Set<number>;
};
export type SpectralPreset="interference"|"corona"|"triade"|"fissione"|"empty";
export type Reaction={
 id:string;kind:"fusion"|"fission";center:string;
 cells:string[];destinations:string[];footprint:string[];
 mask:number[];count:2|3|4|6;input:number;output:number;
 delta:number;reactantEnergy:number;productEnergy:number;
};
export type Journey={key:string;manifestation:Manifestation};
export type SpectralFuture={
 id:string;reactions:Reaction[];board:Map<string,Manifestation>;
 budget:number;delta:number;departures:Journey[];arrivals:Journey[];
 energyBefore:number;energyAfter:number;label:string;
};
export type FuturesCatalog={
 reactions:Reaction[];futures:SpectralFuture[];totalReactions:number;
 truncated:boolean;
};

// Original 72 names and pairs from MindeleevSpatial/PolytronName.cs.
// The original hybrid-name generation is reproduced, not randomised.
const NAME_PAIRS=[
 "Vehuiah|Bael","Jeliel|Agares","Sitael|Vassago","Elemiah|Gamigin",
 "Mahasiah|Marbas","Lelahel|Valefor","Achaiah|Amon","Cahetel|Barbatos",
 "Haziel|Paimon","Aladiah|Buer","Lauviah|Gusion","Hahaiah|Sitri",
 "Iezalel|Beleth","Mebahel|Leraje","Hariel|Eligos","Hakamiah|Zepar",
 "Lauviah II|Botis","Caliel|Bathin","Leuviah|Sallos","Pahaliah|Purson",
 "Nelchael|Marax","Yeyayel|Ipos","Melahel|Aim","Haheuiah|Naberius",
 "Nith-Haiah|Glasya-Labolas","Haaiah|Bune","Ierathel|Ronove",
 "Seheiah|Berith","Reiyel|Astaroth","Omael|Forneus","Lecabel|Foras",
 "Vasariah|Asmoday","Yehuiah|Gaap","Lehahiah|Furfur",
 "Chavakiah|Marchosias","Menadel|Stolas","Aniel|Phenex",
 "Haamiah|Halphas","Rehael|Malphas","Ieiazel|Raum","Hahahel|Focalor",
 "Mikael|Vepar","Veuahiah|Sabnock","Yelahiah|Shax","Sehaliah|Vine",
 "Ariel|Bifrons","Asaliah|Vual","Mihael|Haagenti","Vehuel|Crocell",
 "Daniel|Furcas","Hahasiah|Balam","Imamiah|Alloces","Nanael|Camio",
 "Nithael|Murmur","Mebahiah|Orobas","Poiel|Gremory",
 "Nemamiah|Ose","Yeialel|Amy","Harahel|Orias","Mizrael|Vapula",
 "Umabel|Zagan","Iah-Hel|Valac","Anauel|Andras","Mehiel|Haures",
 "Damabiah|Andrealphus","Manakel|Cimeies","Eyael|Amdusias",
 "Habuhiah|Belial","Rochel|Decarabia","Jabamiah|Seere",
 "Haiaiel|Dantalion","Mumiah|Andromalius"
] as const;
const syllabify=(name:string)=>name.toLowerCase().split(/(?=[aeiouy])/i)
 .map(x=>x.replace(/[^a-z]/g,"")).filter(Boolean);
const hybridName=(pair:string):string=>{
 const [angel,demon]=pair.split("|");
 const a=syllabify(angel),d=syllabify(demon);
 const front=a.length===1?a[0].slice(0,3):(a[0]+a[1]).slice(0,5);
 const end=d.length===1?d[0].slice(-3):
  ((d[d.length-2].length<=2?d[d.length-2]:d[d.length-2].slice(-2))+d[d.length-1]).slice(-5);
 const vowels="aeiouy";
 const joined=front+(!vowels.includes(front.slice(-1))&&!vowels.includes(end[0])?"a":"")+end;
 const clean=joined.replace(/[^a-z]/g,"").slice(0,10);
 return clean.charAt(0).toUpperCase()+clean.slice(1);
};
export const SEAL_NAMES=NAME_PAIRS.map(hybridName);
export const sealName=(seal:number)=>SEAL_NAMES[seal-1]??"—";

export const PATTERNS=[
 ...[0,1,2].map(i=>[i,i+3]),
 [0,2,4],[1,3,5],
 ...[0,1,2].map(i=>[0,1,2,3,4,5].filter(k=>k!==i&&k!==i+3)),
 [0,1,2,3,4,5]
] as readonly number[][];
const isCount=(n:number):n is Reaction["count"]=>[2,3,4,6].includes(n);
const energy=(n:number)=>intrinsicEnergy(n,0);
export const boardEnergy=(board:ReadonlyMap<string,Manifestation>)=>
 [...board.values()].reduce((s,v)=>s+energy(v.number),0);
export const invariantTotal=(state:SpectralState)=>state.budget+boardEnergy(state.board);
export function populationInvariant(state:SpectralState):boolean{
 if(state.board.size>SPECTRAL_SEALS||state.board.size>allHexes().length)return false;
 const seals=new Set<number>();
 for(const [key,v] of state.board){
  const [q,r]=key.split(",").map(Number);
  if(!Number.isInteger(q)||!Number.isInteger(r)||!withinHex(q,r)||
   !Number.isInteger(v.seal)||v.seal<1||v.seal>SPECTRAL_SEALS||
   !Number.isSafeInteger(v.number)||v.number<1||seals.has(v.seal))return false;
  seals.add(v.seal);
 }
 return Number.isInteger(state.budget)&&state.budget>=0&&
  SPECTRAL_SEALS-seals.size>=0;
}
export const availableSeals=(state:SpectralState):number[]=>{
 const used=new Set([...state.board.values()].map(v=>v.seal));
 return Array.from({length:SPECTRAL_SEALS},(_,i)=>i+1).filter(i=>!used.has(i));
};
const ringKeys=(q:number,r:number)=>
 HEX_DIRECTIONS.map(d=>hexKey(q+d.q,r+d.r));
export function makeSpectralPreset(preset:SpectralPreset):SpectralState{
 const board=new Map<string,Manifestation>();
 let seal=1;
 const put=(q:number,r:number,number:number)=>{
  board.set(hexKey(q,r),{seal:seal++,number});
 };
 switch(preset){
  case "interference":
   // A shared participant at (0,0) can fuse with either partner.
   put(0,0,6);put(2,0,6);put(0,2,6);
   break;
  case "corona":
   HEX_DIRECTIONS.forEach(d=>put(d.q,d.r,6));
   break;
  case "triade":
   [0,2,4].forEach(i=>put(HEX_DIRECTIONS[i].q,HEX_DIRECTIONS[i].r,6));
   break;
  case "fissione":put(0,0,31);break;
  case "empty":break;
 }
 const budget=SPECTRAL_BUDGET-boardEnergy(board);
 const state={board,budget,generation:0,discovered:new Set([...board.values()].map(v=>v.number))};
 if(!populationInvariant(state))throw Error("Invalid initial 72-seal population");
 return state;
}
export function summon(state:SpectralState,key:string,number:number):SpectralState|null{
 const [q,r]=key.split(",").map(Number),cost=energy(number);
 const seal=availableSeals(state)[0];
 if(!withinHex(q,r)||state.board.has(key)||seal===undefined||state.budget<cost)return null;
 const board=new Map(state.board);board.set(key,{seal,number});
 return {...state,board,budget:state.budget-cost,
  discovered:new Set([...state.discovered,number])};
}
export function sendHome(state:SpectralState,key:string):SpectralState|null{
 const old=state.board.get(key);if(!old)return null;
 const board=new Map(state.board);board.delete(key);
 return {...state,board,budget:state.budget+energy(old.number)};
}
export function relocate(state:SpectralState,from:string,to:string):SpectralState|null{
 if(from===to||!state.board.has(from)||state.board.has(to))return null;
 const [q,r]=to.split(",").map(Number);if(!withinHex(q,r))return null;
 const board=new Map(state.board),manifestation=board.get(from)!;
 board.delete(from);board.set(to,manifestation);
 return {...state,board};
}

/** Every translated/rotated pattern is considered. No grid direction wins a tie. */
export function findSpectralReactions(state:SpectralState):Reaction[]{
 const board=state.board,homeCount=availableSeals(state).length;
 const found:Reaction[]=[];
 for(const {q,r} of allHexes()){
  const center=hexKey(q,r),occupant=board.get(center);
  const neighbours=ringKeys(q,r);
  for(const mask of PATTERNS){
   if(!isCount(mask.length))continue;
   const count=mask.length,places=mask.map(i=>neighbours[i]);
   if(places.some(k=>{
    const [nq,nr]=k.split(",").map(Number);
    return !withinHex(nq,nr);
   }))continue;
   if(occupant===undefined){
    if(homeCount<1)continue;
    const sources=places.map(k=>board.get(k));
    if(sources.some(v=>!v)||sources.some(v=>v!.number!==sources[0]!.number))continue;
    const input=sources[0]!.number,output=input+5*(count-1);
    const reactantEnergy=count*energy(input),productEnergy=energy(output);
    const delta=reactantEnergy-productEnergy;
    found.push({id:"F:"+center+":"+mask.join(""),kind:"fusion",center,
     cells:places,destinations:[center],footprint:[center,...places],
     mask:[...mask],count,input,output,delta,reactantEnergy,productEnergy});
   }else{
    if(homeCount<count||places.some(k=>board.has(k)))continue;
    const input=occupant.number,output=input-5*(count-1);
    if(output<1)continue;
    const reactantEnergy=energy(input),productEnergy=count*energy(output);
    const delta=reactantEnergy-productEnergy;
    // Fission cannot borrow against a hypothetical future fusion in isolation.
    if(state.budget+delta<0)continue;
    found.push({id:"S:"+center+":"+mask.join(""),kind:"fission",center,
     cells:[center],destinations:places,footprint:[center,...places],
     mask:[...mask],count,input,output,delta,reactantEnergy,productEnergy});
   }
  }
 }
 return found.sort((a,b)=>b.count-a.count||
  (a.kind===b.kind?0:a.kind==="fusion"?-1:1)||
  a.id.localeCompare(b.id));
}
const keyset=(items:readonly Reaction[])=>new Set(items.flatMap(x=>x.footprint));
const reactionCompatible=(taken:Set<string>,reaction:Reaction)=>
 reaction.footprint.every(k=>!taken.has(k));
/**
 * Atomic projection; the returned and newly summoned individuals are disjoint
 * because arrivals are assigned only from the BEFORE-generation home pool.
 */
export function projectSpectralFuture(
 state:SpectralState,reactions:readonly Reaction[]
):SpectralFuture|null{
 if(!reactions.length||!populationInvariant(state))return null;
 const uniqueIds=new Set(reactions.map(r=>r.id));
 if(uniqueIds.size!==reactions.length)return null;
 const footprints=keyset(reactions);
 if(footprints.size!==reactions.reduce((n,r)=>n+r.footprint.length,0))return null;
 const exits:Journey[]=[],arrivals:Journey[]=[];
 const board=new Map(state.board);
 for(const reaction of reactions){
  for(const key of reaction.cells){
   const original=state.board.get(key);
   if(!original||original.number!==reaction.input)return null;
   exits.push({key,manifestation:original});
   board.delete(key);
  }
  for(const key of reaction.destinations){
   if(state.board.has(key))return null;
  }
 }
 const home=availableSeals(state);
 const numberOfArrivals=reactions.reduce((s,r)=>s+r.destinations.length,0);
 if(numberOfArrivals>home.length)return null;
 // Sorting removes any dependency on the selection/enumeration order.
 const ordered=[...reactions].sort((a,b)=>a.id.localeCompare(b.id));
 let offset=0;
 for(const r of ordered)for(const key of r.destinations){
  if(board.has(key))return null;
  const manifestation={seal:home[offset++],number:r.output};
  board.set(key,manifestation);
  arrivals.push({key,manifestation});
 }
 const delta=reactions.reduce((s,r)=>s+r.delta,0);
 const budget=state.budget+delta;
 if(budget<0)return null;
 const next={...state,board,budget};
 if(!populationInvariant(next)||invariantTotal(next)!==invariantTotal(state))return null;
 const energyBefore=boardEnergy(state.board),energyAfter=boardEnergy(board);
 const label=reactions.length===1?
  (reactions[0].kind==="fusion"?"Fusione ":"Fissione ")+
  reactions[0].count+(reactions[0].kind==="fusion"?" → 1":" ← 1")+
  " · #"+reactions[0].input+" → #"+reactions[0].output:
  reactions.length+" reazioni simultanee";
 return {id:ordered.map(r=>r.id).join("|"),reactions:ordered,board,budget,delta,
  departures:exits,arrivals,energyBefore,energyAfter,label};
}
/**
 * Bounded, inspectable menu of futures, not a claim of complete enumeration of
 * the exponentially large space of mutually compatible global transitions.
 * User focus determines which locally competing reactions are shown.
 * Single-reaction projections are shown first; multiple independent reactions
 * can also be combined atomically with no orientation-priority on execution.
 */
export function enumerateSpectralFutures(
 state:SpectralState,focus:string|null=null,limit=24
):FuturesCatalog{
 const reactions=findSpectralReactions(state);
 const candidates=focus===null?reactions:
  reactions.filter(r=>r.footprint.includes(focus));
 const futures:SpectralFuture[]=[],seen=new Set<string>();
 const append=(choice:Reaction[])=>{
  const future=projectSpectralFuture(state,choice);
  if(!future||seen.has(future.id))return;
  seen.add(future.id);futures.push(future);
 };
 for(const r of candidates.slice(0,Math.max(1,limit)))append([r]);
 // Include compatible simultaneous transformations without double-consuming any
 // seal, cell, or future home slot; never silently choose them for the player.
 for(const seed of candidates.slice(0,Math.max(1,limit))){
  if(futures.length>=limit)break;
  const batch:Reaction[]=[seed],used=new Set(seed.footprint);
  for(const r of reactions){
   if(r.id===seed.id||!reactionCompatible(used,r))continue;
   const next=[...batch,r];
   if(projectSpectralFuture(state,next)){
    batch.push(r);
    r.footprint.forEach(k=>used.add(k));
   }
  }
  if(batch.length>1)append(batch);
 }
 return {reactions,futures:futures.slice(0,limit),totalReactions:reactions.length,
  truncated:candidates.length>limit||futures.length>limit};
}
export function commitSpectralFuture(state:SpectralState,future:SpectralFuture):SpectralState{
 const canonical=projectSpectralFuture(state,future.reactions);
 if(!canonical||canonical.id!==future.id)throw Error("Stale/invalid spectral future");
 return {...state,board:canonical.board,budget:canonical.budget,
  generation:state.generation+1,
  discovered:new Set([...state.discovered,...canonical.arrivals.map(a=>a.manifestation.number)])};
}
