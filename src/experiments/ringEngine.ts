import { ringIdxToAxial, axialToRingIdx, type RingCoord } from "@/hex/hexGrid";
import { recipeToInt } from "@/polytron/mapping";

export type Pieces = Record<string, string>;
export type GameState = { pieces: Pieces; energy: number; turns: number };
export type RingLevel = { title: string; target: string; goal: string; energy: number; pieces: Pieces; canSplit: boolean; hint: string };
export const RING_LEVELS: RingLevel[] = [
 { title: "A1 · Primo legame", target: "adC", goal: "1:0", energy: 5, pieces: {"1:0":"aC","2:7":"dC"}, canSplit: false, hint: "Porta due precursori adiacenti e ricomponi l'anello." },
 { title: "A2 · Ordine necessario", target: "adkC", goal: "1:0", energy: 8, pieces: {"1:0":"aC","2:3":"dC","1:3":"kC"}, canSplit: false, hint: "Il DNA è ordinato: adk non equivale a dak." },
 { title: "A3 · Solve et coagula", target: "adkC", goal: "1:0", energy: 9, pieces: {"1:0":"daC","2:7":"kC"}, canSplit: true, hint: "Serve spezzare la sequenza e ricombinarla." }
];
export const RINGS = [0,1,2];
export const CELLS = RINGS.flatMap(r => Array.from({length:r===0?1:r*6}, (_,idx)=>({ring:r,idx,key:`${r}:${idx}`,axial:ringIdxToAxial({ring:r,idx})})));
export function keyOf(coord: RingCoord) {return `${coord.ring}:${coord.idx}`;}
export function near(a:string,b:string):boolean {
 const [ar,ai]=a.split(":").map(Number), [br,bi]=b.split(":").map(Number);
 if([ar,ai,br,bi].some(x=>!Number.isInteger(x)))return false;
 const x=ringIdxToAxial({ring:ar,idx:ai}),y=ringIdxToAxial({ring:br,idx:bi});
 const dq=x.q-y.q,dr=x.r-y.r;
 return Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr))===1;
}
const BONDS:Record<string,number>={ad:-3,da:1,ak:-1,ka:2,dk:-2,kd:1,aa:0,dd:0,kk:0};
export function operators(dna:string):string {if(!/^[adk]{1,4}C$/.test(dna))throw Error("DNA non supportato: "+dna);return dna.slice(0,-1);}
export function potential(dna:string):number {
 const ops=operators(dna);let v=4*ops.length;
 for(let i=1;i<ops.length;i++)v+=BONDS[ops.slice(i-1,i+1)]??0;
 return v;
}
export function initial(level:RingLevel):GameState {return {pieces:{...level.pieces},energy:level.energy,turns:0};}
export function totalEnergy(s:GameState):number {return s.energy+Object.values(s.pieces).reduce((t,d)=>t+potential(d),0);}
export function victory(s:GameState,l:RingLevel):boolean {return s.pieces[l.goal]===l.target;}
export type Move = {kind:"rotate";ring:1|2;shift:-1|1}|{kind:"fuse";a:string;b:string}|{kind:"split";a:string;b:string;cut:number};
export function step(state:GameState,m:Move):GameState|null {
 const pieces={...state.pieces};let energy=state.energy;
 if(m.kind==="rotate"){
   const n=m.ring*6;const original={...pieces};
   for(let i=0;i<n;i++)delete pieces[`${m.ring}:${i}`];
   for(let i=0;i<n;i++){
      const from=`${m.ring}:${(i-m.shift+n)%n}`;
      if(original[from])pieces[`${m.ring}:${i}`]=original[from];
   }
   energy--;
 } else if(m.kind==="fuse"){
   if(!near(m.a,m.b)||!pieces[m.a]||!pieces[m.b])return null;
   const joined=operators(pieces[m.a])+operators(pieces[m.b])+"C";
   if(operators(pieces[m.a]).length+operators(pieces[m.b]).length>4)return null;
   try{recipeToInt(joined);}catch{return null;}
   energy+=potential(pieces[m.a])+potential(pieces[m.b])-potential(joined)-1;
   pieces[m.a]=joined;delete pieces[m.b];
 } else {
   const dna=pieces[m.a];if(!dna||pieces[m.b]||!near(m.a,m.b))return null;
   const ops=operators(dna);if(m.cut<=0||m.cut>=ops.length||!Number.isInteger(m.cut))return null;
   const x=ops.slice(0,m.cut)+"C",y=ops.slice(m.cut)+"C";
   energy+=potential(dna)-potential(x)-potential(y)-1;
   pieces[m.a]=x;pieces[m.b]=y;
 }
 return energy<0?null:{pieces,energy,turns:state.turns+1};
}
export function isRealPolytron(dna:string):boolean {try{recipeToInt(dna);return true;}catch{return false;}}
export function axialOf(key:string){const [ring,idx]=key.split(":").map(Number);return ringIdxToAxial({ring,idx});}
export function neighborKeys(key:string):string[] {
 const xy=axialOf(key);
 return ([[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]] as const)
 .map(([dq,dr])=>({q:xy.q+dq,r:xy.r+dr}))
 .filter(a=>Math.max(Math.abs(a.q),Math.abs(a.r),Math.abs(a.q+a.r))<=2)
 .map(a=>keyOf(axialToRingIdx(a)));
}
