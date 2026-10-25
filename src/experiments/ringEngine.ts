import { ringIdxToAxial, axialToRingIdx, type RingCoord } from "@/hex/hexGrid";
import { recipeToInt } from "@/polytron/mapping";

export type Pieces = Record<string, string>;
export type GameState = {
  pieces: Pieces;
  /** A new DNA has been produced in this session at this position. */
  born: Record<string, boolean>;
  energy: number;
  turns: number;
};
export type RingLevel = {
  title: string; target: string; energy: number; pieces: Pieces; hint: string;
};
export const NUCLEUS = "0:0";
export const RING_LEVELS: RingLevel[] = [
  { title:"A1 · Primo legame", target:"adC", energy:6,
    pieces:{"1:0":"aC","2:7":"dC"},
    hint:"Crea adC con una fusione. Poi trasferiscilo nel Nucleo per registrarlo." },
  { title:"A2 · Ordine necessario", target:"adkC", energy:10,
    pieces:{"1:0":"aC","2:3":"dC","1:3":"kC"},
    hint:"Costruisci adkC: l'ordine degli operatori Conway è importante. Registra il prodotto nel Nucleo." },
  { title:"A3 · Solve et coagula", target:"adkC", energy:12,
    pieces:{"1:0":"daC","2:7":"kC"},
    hint:"Parti da daC: puoi fare fissione in qualunque puzzle per ricomporre il DNA nell'ordine corretto." }
];
export const RINGS=[0,1,2] as const;
export const CELLS=RINGS.flatMap(r=>Array.from({length:r===0?1:r*6},(_,idx)=>({
  ring:r,idx,key:`${r}:${idx}`,axial:ringIdxToAxial({ring:r,idx})
})));
export function keyOf(coord:RingCoord){return `${coord.ring}:${coord.idx}`;}
export function near(a:string,b:string):boolean {
  const pa=CELLS.find(c=>c.key===a),pb=CELLS.find(c=>c.key===b);
  if(!pa||!pb)return false;
  const dq=pa.axial.q-pb.axial.q,dr=pa.axial.r-pb.axial.r;
  return Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr))===1;
}
const BONDS:Record<string,number>={ad:-3,da:1,ak:-1,ka:2,dk:-2,kd:1,aa:0,dd:0,kk:0};
export function operators(dna:string):string {
  if(!/^[adk]{1,4}C$/.test(dna))throw Error("DNA non supportato dal prototipo: "+dna);
  return dna.slice(0,-1);
}
export function potential(dna:string):number {
  const ops=operators(dna);let u=4*ops.length;
  for(let i=1;i<ops.length;i++)u+=BONDS[ops.slice(i-1,i+1)]??0;
  return u;
}
export function initial(level:RingLevel):GameState{
  return {pieces:{...level.pieces},born:{},energy:level.energy,turns:0};
}
export function totalEnergy(s:GameState):number {
  return s.energy+Object.values(s.pieces).reduce((sum,dna)=>sum+potential(dna),0);
}
export function victory(s:GameState,l:RingLevel):boolean {
  return s.pieces[NUCLEUS]===l.target && !!s.born[NUCLEUS];
}
export type Move =
 | {kind:"rotate";ring:1|2;shift:-1|1}
 | {kind:"fuse";a:string;b:string}
 | {kind:"split";a:string;b:string;cut:number}
 | {kind:"enter";from:string}
 | {kind:"extract";to:string};

export type MoveResult={ok:true;state:GameState;detail:string}|{ok:false;reason:string};
export function applyMove(s:GameState,m:Move):MoveResult {
  const pieces={...s.pieces},born={...s.born};let energy=s.energy;
  let detail="";
  if(m.kind==="rotate"){
    if(m.ring!==1&&m.ring!==2)return {ok:false,reason:"Puoi ruotare solo gli anelli 1 e 2; il Nucleo rimane fermo."};
    if(energy<1)return {ok:false,reason:"Rotazione impossibile: serve 1 unità di energia disponibile."};
    const n=m.ring*6,oldPieces={...pieces},oldBorn={...born};
    for(let i=0;i<n;i++){delete pieces[`${m.ring}:${i}`];delete born[`${m.ring}:${i}`];}
    for(let i=0;i<n;i++){
      const src=`${m.ring}:${(i-m.shift+n)%n}`,dest=`${m.ring}:${i}`;
      if(oldPieces[src])pieces[dest]=oldPieces[src];
      if(oldBorn[src])born[dest]=true;
    }
    energy--;detail=`Anello ${m.ring} ruotato: −1 energia.`;
  }else if(m.kind==="fuse"){
    if(!m.a||!m.b)return {ok:false,reason:"Fusione: seleziona due celle in ordine. La prima riceverà il DNA risultante."};
    if(m.a===m.b)return {ok:false,reason:"Fusione: seleziona due celle diverse."};
    if(!pieces[m.a])return {ok:false,reason:`Fusione: la prima cella (${m.a}) è vuota.`};
    if(!pieces[m.b])return {ok:false,reason:`Fusione: la seconda cella (${m.b}) è vuota.`};
    if(!near(m.a,m.b))return {ok:false,reason:"Fusione: le due celle selezionate non sono confinanti nella griglia esagonale."};
    const p=pieces[m.a],q=pieces[m.b],ops=operators(p)+operators(q);
    if(ops.length>4)return {ok:false,reason:`Fusione: ${ops.length} operatori superano il limite sperimentale di 4.`};
    const joined=ops+"C";
    try{recipeToInt(joined);}catch{return {ok:false,reason:`Fusione: il DNA ${joined} non è enumerabile nel mapping attuale.`};}
    const delta=potential(p)+potential(q)-potential(joined)-1;
    if(energy+delta<0)return {ok:false,reason:`Fusione ${p} + ${q}: servono ${-delta} unità, ma ne hai ${energy}.`};
    energy+=delta;pieces[m.a]=joined;delete pieces[m.b];born[m.a]=true;delete born[m.b];
    detail=`Fusione ${p} + ${q} → ${joined}. Bilancio: ${delta>=0?"+":""}${delta} energia.`;
  }else if(m.kind==="split"){
    if(!m.a||!m.b)return {ok:false,reason:"Fissione: scegli prima un Polytrone, poi una cella adiacente vuota per il frammento."};
    if(!pieces[m.a])return {ok:false,reason:`Fissione: la cella sorgente ${m.a} è vuota. Seleziona prima un Polytrone.`};
    if(pieces[m.b])return {ok:false,reason:`Fissione: la cella ${m.b} è occupata. Serve una cella di destinazione libera.`};
    if(!near(m.a,m.b))return {ok:false,reason:"Fissione: la destinazione deve essere adiacente al Polytrone sorgente."};
    const dna=pieces[m.a],ops=operators(dna);
    if(ops.length<2)return {ok:false,reason:`Fissione: ${dna} ha un solo operatore. Non può essere suddiviso in due DNA non vuoti.`};
    if(!Number.isInteger(m.cut)||m.cut<1||m.cut>=ops.length)return {ok:false,reason:`Fissione: il punto di taglio deve essere compreso tra 1 e ${ops.length-1}.`};
    const a=ops.slice(0,m.cut)+"C",b=ops.slice(m.cut)+"C";
    const delta=potential(dna)-potential(a)-potential(b)-1;
    if(energy+delta<0)return {ok:false,reason:`Fissione ${dna}: servono ${-delta} unità di energia, disponibili ${energy}.`};
    energy+=delta;pieces[m.a]=a;pieces[m.b]=b;born[m.a]=true;born[m.b]=true;
    detail=`Fissione ${dna} → ${a} + ${b}. Bilancio: ${delta>=0?"+":""}${delta} energia.`;
  }else if(m.kind==="enter"){
    if(!m.from)return {ok:false,reason:"Nucleo: seleziona un Polytrone nell'anello interno (ring 1)."};
    if(!pieces[m.from])return {ok:false,reason:`Nucleo: la cella ${m.from} è vuota.`};
    if(!near(m.from,NUCLEUS))return {ok:false,reason:"Nucleo: soltanto le 6 celle dell'anello interno confinano con il centro."};
    if(pieces[NUCLEUS])return {ok:false,reason:"Il Nucleo è occupato: devi prima estrarre il Polytrone già presente."};
    if(!born[m.from])return {ok:false,reason:"Il Nucleo registra solo Polytroni sintetizzati in questa partita. Prima esegui una fusione o una fissione."};
    if(energy<1)return {ok:false,reason:"Stabilizzare un Polytrone nel Nucleo costa 1 unità di energia."};
    pieces[NUCLEUS]=pieces[m.from];born[NUCLEUS]=true;delete pieces[m.from];delete born[m.from];energy--;
    detail=`Polytrone ${pieces[NUCLEUS]} stabilizzato nel Nucleo (−1 energia). Se è nuovo, entra nella Tavola.`;
  }else{
    if(!pieces[NUCLEUS])return {ok:false,reason:"Estrazione: il Nucleo è vuoto."};
    if(!m.to)return {ok:false,reason:"Estrazione: seleziona una cella vuota dell'anello interno."};
    if(!near(NUCLEUS,m.to))return {ok:false,reason:"Estrazione: scegli una cella nell'anello interno, confinante con il Nucleo."};
    if(pieces[m.to])return {ok:false,reason:`Estrazione: la cella ${m.to} è occupata.`};
    if(energy<1)return {ok:false,reason:"Estrazione: serve 1 unità di energia."};
    pieces[m.to]=pieces[NUCLEUS];born[m.to]=!!born[NUCLEUS];
    delete pieces[NUCLEUS];delete born[NUCLEUS];energy--;
    detail="Polytrone estratto dal Nucleo (−1 energia).";
  }
  return {ok:true,state:{pieces,born,energy,turns:s.turns+1},detail};
}
export function step(s:GameState,m:Move):GameState|null {
  const result=applyMove(s,m);return result.ok?result.state:null;
}
export function neighborKeys(key:string):string[]{
  const xy=CELLS.find(c=>c.key===key)?.axial;if(!xy)return [];
  return ([[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]] as const)
    .map(([dq,dr])=>({q:xy.q+dq,r:xy.r+dr}))
    .filter(a=>Math.max(Math.abs(a.q),Math.abs(a.r),Math.abs(a.q+a.r))<=2)
    .map(a=>keyOf(axialToRingIdx(a)));
}
