/**
 * Mindeleev Life · Sprint 40, intentionally small and transparent.
 *
 * Hexagonal B3/S23 cellular automaton, *not* the physics of MindeleevSpatial.
 * Each occupied cell holds ONE politronic number, independent of Chromatica.
 *
 * Birth: exactly three occupied neighbours, at least two from the same
 * Platonic group; child = maximum N in that group + 5 (same column).
 * Birth energy: sum of all three neighbouring intrinsic energies >= 2E(child).
 * Survival: occupied cells with 2 or 3 neighbours survive; others depart.
 * All states are evaluated against the SAME frozen generation.
 *
 * The player's treasury pays for manually summoned Polytrons, not births.
 * Departures and recycling return floor(E/2) to that treasury. No hidden
 * energy transfer and no random outcomes or spatial-direction priority.
 */
export type Hex={q:number;r:number};
export type Board=ReadonlyMap<string,number>;
export type CellOutcome="empty"|"survive"|"depart"|"birth"|"no-majority"|"no-energy";
export type CellPrediction={
 key:string;q:number;r:number;ring:number;occupant?:number;next?:number;
 neighbours:number[];reason:string;outcome:CellOutcome;
 sumEnergy:number;requiredEnergy:number;
};
export type LifePlan={
 predictions:Map<string,CellPrediction>;
 next:Map<string,number>;
 born:{key:string;n:number}[];
 departed:{key:string;n:number}[];
 survivors:number;
 recovery:number;
};
export const LIFE_RADIUS=6;
export const STARTING_ENERGY=100;
export const HEX_DIRECTIONS:readonly Hex[]=[
 {q:1,r:0},{q:1,r:-1},{q:0,r:-1},
 {q:-1,r:0},{q:-1,r:1},{q:0,r:1}
];
export const hexKey=(q:number,r:number):string=>`${q},${r}`;
export const hexRing=(q:number,r:number):number=>Math.max(Math.abs(q),Math.abs(r),Math.abs(-q-r));
export const withinHex=(q:number,r:number,radius=LIFE_RADIUS)=>hexRing(q,r)<=radius;
export const groupOf=(n:number)=>((n-1)%5)+1;
export const periodOf=(n:number)=>Math.floor((n-1)/5)+1;
export const GROUP_LABELS=["Tetraedri","Cubi","Ottaedri","Dodecaedri","Icosaedri"] as const;
export const GROUP_CODES=["T","C","O","D","I"] as const;
/**
 * Palette is a GLOBAL ruleset per game. Contrast is the OKLab distance
 * between the 2 fixed endpoints. A flipped gradient changes appearance only.
 */
export function paletteEnergyBonus(distance:number):number{
 if(!Number.isFinite(distance)||distance<0)throw Error("Invalid palette distance");
 return Math.min(3,Math.floor(distance/20));
}
export function intrinsicEnergy(n:number,bonus:number):number{
 if(!Number.isSafeInteger(n)||n<1)throw Error("Invalid politronic number: "+n);
 if(!Number.isInteger(bonus)||bonus<0||bonus>3)throw Error("Invalid palette bonus");
 return 2+(periodOf(n)-1)+(groupOf(n)-1)+bonus;
}
export const recoveryEnergy=(n:number,bonus:number)=>Math.floor(intrinsicEnergy(n,bonus)/2);
export function allHexes(radius=LIFE_RADIUS):Hex[]{
 const result:Hex[]=[];
 for(let r=-radius;r<=radius;r++)
  for(let q=-radius;q<=radius;q++)
   if(withinHex(q,r,radius))result.push({q,r});
 return result;
}
export function neighboursOf(board:Board,q:number,r:number):number[]{
 return HEX_DIRECTIONS.map(d=>board.get(hexKey(q+d.q,r+d.r)))
  .filter((n):n is number=>n!==undefined);
}
export function calculateLife(board:Board,bonus:number,radius=LIFE_RADIUS):LifePlan{
 const predictions=new Map<string,CellPrediction>();
 const next=new Map<string,number>();
 const born:{key:string;n:number}[]=[];
 const departed:{key:string;n:number}[]=[];
 let survivors=0,recovery=0;
 for(const {q,r} of allHexes(radius)){
  const key=hexKey(q,r),occupant=board.get(key);
  const neighbours=neighboursOf(board,q,r);
  let outcome:CellOutcome="empty",reason="",future: number|undefined;
  let sumEnergy=0,requiredEnergy=0;
  if(occupant!==undefined){
   if(neighbours.length===2||neighbours.length===3){
    outcome="survive";future=occupant;survivors++;
    reason=`Sopravvive: ${neighbours.length} vicini (regola S2/S3).`;
   }else{
    outcome="depart";departed.push({key,n:occupant});
    recovery+=recoveryEnergy(occupant,bonus);
    reason=`Torna a casa: ${neighbours.length} vicini (ne servono 2 o 3).`;
   }
  }else if(neighbours.length===3){
   const groups=new Map<number,number[]>();
   for(const n of neighbours){
    const group=groupOf(n);
    groups.set(group,[...(groups.get(group)??[]),n]);
   }
   const majority=[...groups].find(([,members])=>members.length>=2);
   if(!majority){
    outcome="no-majority";
    reason="Tre vicini, ma tutti di gruppi diversi: nessuna sintesi.";
   }else{
    const [,sameGroup]=majority;
    const parent=Math.max(...sameGroup);
    const child=parent+5;
    sumEnergy=neighbours.reduce((sum,n)=>sum+intrinsicEnergy(n,bonus),0);
    requiredEnergy=2*intrinsicEnergy(child,bonus);
    if(sumEnergy>=requiredEnergy){
     outcome="birth";future=child;
     born.push({key,n:child});
     reason=`Sintesi: maggioranza ${GROUP_CODES[groupOf(child)-1]}, maggiore ${parent} + 5 = ${child}. Energia ${sumEnergy}/${requiredEnergy}.`;
    }else{
     outcome="no-energy";
     reason=`Gruppo compatibile (${GROUP_CODES[groupOf(child)-1]}), ma energia ${sumEnergy}/${requiredEnergy}: sintesi impossibile.`;
    }
   }
  }else reason=`Cella vuota: ${neighbours.length} vicini; la sintesi ne richiede esattamente 3.`;
  if(future!==undefined)next.set(key,future);
  predictions.set(key,{key,q,r,ring:hexRing(q,r),occupant,next:future,
   neighbours,outcome,reason,sumEnergy,requiredEnergy});
 }
 return {predictions,next,born,departed,survivors,recovery};
}
export type LifePreset="nucleus"|"ring"|"constellation"|"empty";
export function makeLifePreset(kind:LifePreset):Map<string,number>{
 const board=new Map<string,number>();
 const add=(q:number,r:number,n:number)=>board.set(hexKey(q,r),n);
 if(kind==="nucleus"){
  // Centre (0,0) is empty; three neighbours synthesize T #11.
  add(1,0,1);add(-1,0,6);add(0,1,2);
 }else if(kind==="ring"){
  HEX_DIRECTIONS.forEach((d,i)=>add(d.q,d.r,1+5*i));
 }else if(kind==="constellation"){
  add(-3,0,1);add(-2,0,6);add(-2,-1,2);
  add(2,-2,3);add(3,-2,8);add(2,-1,4);
  add(-1,3,5);add(0,3,10);add(0,2,15);
  add(1,1,11);add(2,1,16);add(1,2,12);
 }
 return board;
}
export const startingBalance=(board:Board,bonus:number):number=>
 STARTING_ENERGY-[...board.values()].reduce((sum,n)=>sum+intrinsicEnergy(n,bonus),0);
