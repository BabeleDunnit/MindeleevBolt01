/**
 * An independent research sampler, NOT a response solver.
 * Builds plausible, varied Polytron compositions without calling scoring,
 * without choosing high-reward positions, and without editing the Kaleidoscope.
 * No artistic or aesthetic quality claim is attached to these heuristics.
 */
import type {KaleidoLayout,KaleidoPoint} from "@/polytron/kaleidoscopeGenerator";
import type {ResonancePawn} from "@/polytron/resonanceField";
import {resonanceEnergy,resonanceHexDistance} from "@/polytron/resonanceField";

export const EXPLORER_STYLES=[
 "costellazione","filamenti","arcipelago","anelli","radici","frattura","mosaico"
] as const;
export type ExplorerStyle=(typeof EXPLORER_STYLES)[number];
export type ExplorerVariation="geometria"|"palette"|"libera";
export type ExplorerComposition={
 pawns:ResonancePawn[];
 style:ExplorerStyle|"manuale";
 provenance:string;
};
const between=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const rng=(seed:number)=>{
 let state=(seed>>>0)||0x9e3779b9;
 return ()=>{
  state^=state<<13;state^=state>>>17;state^=state<<5;
  return (state>>>0)/4294967296;
 };
};
const choice=<T,>(items:readonly T[],random:()=>number)=>items[
 Math.floor(random()*items.length)
];
const dist=(a:KaleidoPoint,b:KaleidoPoint)=>resonanceHexDistance(a,b);
export function explorerQuestionSignature(layout:KaleidoLayout):string{
 const {radius,family,symmetry,seed,generation}=layout.params;
 return [radius,family,symmetry,seed,generation].join("|");
}
function samplePositions(
 layout:KaleidoLayout,count:number,seed:number,style:ExplorerStyle
):string[]{
 const random=rng(seed);
 const pool=layout.cells.filter(c=>c.ring>0);
 const total=between(Math.floor(count)||8,1,pool.length);
 const chosen:KaleidoPoint[]=[];
 const ring=layout.params.radius;
 const anchors=Array.from({length:3},()=>choice(pool,random));
 const requested=new Set(layout.tiles.map(t=>t.key));
 while(chosen.length<total){
  let best:KaleidoPoint|null=null,bestValue=-Infinity;
  for(const candidate of pool){
   if(chosen.some(p=>p.key===candidate.key))continue;
   const near=chosen.length?
    Math.min(...chosen.map(p=>dist(p,candidate))):ring;
   const touches=chosen.filter(p=>dist(p,candidate)===1).length;
   const last=chosen.length?dist(chosen[chosen.length-1],candidate):ring;
   const anchor=Math.min(...anchors.map(p=>dist(p,candidate)));
   const angle=candidate.idx/Math.max(1,candidate.ring*6);
   // Diversity targets, not a surrogate "beauty" or resonance formula.
   let value=0;
   switch(style){
    case "costellazione":
     value=near*2.7+.35*candidate.ring-(touches*.7);break;
    case "filamenti":
     value=chosen.length?5-Math.abs(last-1)*3+touches*.35:
      candidate.ring*.6;break;
    case "arcipelago":
     value=4.5-2.0*anchor+(touches?1.5:0)+near*.15;break;
    case "anelli":
     value=3.0-Math.abs(candidate.ring-Math.max(1,ring-1))*1.6+
      near*.55;break;
    case "radici":
     value=(candidate.idx%candidate.ring===0?4.5:0)+
      (chosen.length?2.5-Math.abs(last-1)*1.7:0)+
      candidate.ring*.35;break;
    case "frattura":
     value=(((angle<.30||angle>.77)?3:-.7)+
      (chosen.length?near*.4:0)+
      (candidate.ring>1?1:0));break;
    case "mosaico":
     value=near*1.35+(requested.has(candidate.key)?1.0:0)+
      (candidate.ring%2?1:0);break;
   }
   value+=(random()-.5)*5.5;
   if(value>bestValue){best=candidate;bestValue=value;}
  }
  if(!best)break;
  chosen.push(best);
 }
 return chosen.map(p=>p.key);
}
function sampleInventory(layout:KaleidoLayout,count:number,seed:number):
 Omit<ResonancePawn,"key">[]{
 const random=rng(seed);
 const hints=layout.tiles;
 return Array.from({length:count},(_,index)=>{
  const hint=choice(hints,random);
  const number=random()<.62?hint.number:1+Math.floor(random()*36);
  const how=random();
  let paletteRow=hint.paletteRow,paletteCol=hint.paletteCol;
  if(how>.69&&how<=.86){
   paletteRow=(paletteRow+1+Math.floor(random()*2))%12;
   paletteCol=(paletteCol+1+Math.floor(random()*2))%12;
  }else if(how>.86){
   paletteRow=(paletteRow+4+Math.floor(random()*5))%12;
   paletteCol=(paletteCol+4+Math.floor(random()*5))%12;
  }
  // Ensure variety even when the request uses one or two orbits.
  if(index%5===4){
   paletteRow=(paletteRow+3+index)%12;
   paletteCol=(paletteCol+6+index)%12;
  }
  return {number,paletteRow,paletteCol};
 });
}
export function generateExplorerComposition(
 layout:KaleidoLayout,count:number,seed:number,
 style:ExplorerStyle,inventory?:readonly Omit<ResonancePawn,"key">[]
):ExplorerComposition{
 const size=between(Math.floor(count)||8,1,layout.cells.length-1);
 const keys=samplePositions(layout,size,seed,style);
 const items=inventory??sampleInventory(layout,size,seed^0x6d2b79f5);
 if(items.length!==keys.length)throw Error("Inventory size mismatch");
 return {style,provenance:"Campionamento strutturale · "+style,
  pawns:keys.map((key,i)=>({...items[i],key}))
 };
}
export function generateExplorerPair(
 layout:KaleidoLayout,count:number,seed:number
):[ExplorerComposition,ExplorerComposition]{
 const styles=EXPLORER_STYLES;
 const first=styles[(seed>>>0)%styles.length];
 const second=styles[((seed>>>0)+3)%styles.length];
 const a=generateExplorerComposition(layout,count,seed*37+11,first);
 const inventory=a.pawns.map(({number,paletteRow,paletteCol})=>({
  number,paletteRow,paletteCol
 }));
 let b=generateExplorerComposition(layout,a.pawns.length,seed*37+97,
  second,inventory);
 if(b.pawns.every((p,i)=>p.key===a.pawns[i].key))
  b=varyExplorerComposition(layout,a,seed+29,"geometria");
 return [a,b];
}
export function varyExplorerComposition(
 layout:KaleidoLayout,base:ExplorerComposition,seed:number,
 kind:ExplorerVariation
):ExplorerComposition{
 const random=rng(seed^0x718d2a4b);
 if(kind==="libera"){
  const style=EXPLORER_STYLES[(seed>>>0)%EXPLORER_STYLES.length];
  const count=between(base.pawns.length+
   Math.floor(random()*5)-2,1,layout.cells.length-1);
  return generateExplorerComposition(layout,count,seed+17,style);
 }
 const pawns=base.pawns.map(p=>({...p}));
 const edits=Math.max(2,Math.ceil(pawns.length*.35));
 const selected=new Set<number>();
 while(selected.size<Math.min(edits,pawns.length))
  selected.add(Math.floor(random()*pawns.length));
 if(kind==="palette"){
  for(const i of selected){
   const hint=choice(layout.tiles,random);
   const shift=random()<.5?0:4;
   pawns[i].paletteRow=(hint.paletteRow+shift)%12;
   pawns[i].paletteCol=(hint.paletteCol+shift)%12;
   if(pawns[i].paletteRow===base.pawns[i].paletteRow&&
    pawns[i].paletteCol===base.pawns[i].paletteCol)
    pawns[i].paletteRow=(pawns[i].paletteRow+5)%12;
  }
 }else{
  const valid=layout.cells.filter(c=>c.ring>0);
  for(const i of selected){
   const free=valid.filter(c=>!pawns.some((p,j)=>j!==i&&p.key===c.key)&&
    c.key!==pawns[i].key);
   if(free.length)pawns[i].key=choice(free,random).key;
  }
 }
 return {
  style:"manuale",
  provenance:kind==="palette"?"Variazione cromatica": "Variazione spaziale",
  pawns
 };
}
export function inspectExplorerComposition(pawns:readonly ResonancePawn[]){
 const palettes=new Set(pawns.map(p=>p.paletteRow+","+p.paletteCol));
 const groups=new Set(pawns.map(p=>(p.number-1)%5));
 const occupied=new Set(pawns.map(p=>p.key));
 return {
  pieces:pawns.length,
  palettes:palettes.size,
  groups:groups.size,
  energy:pawns.reduce((sum,p)=>sum+resonanceEnergy(p.number),0),
  occupied:occupied.size
 };
}
export function validateExplorerComposition(
 layout:KaleidoLayout,pawns:readonly ResonancePawn[]
):boolean{
 const valid=new Set(layout.cells.filter(c=>c.ring>0).map(c=>c.key));
 return pawns.length<=valid.size&&
  pawns.every(p=>valid.has(p.key)&&Number.isInteger(p.number)&&
   p.number>=1&&p.number<=500&&
   Number.isInteger(p.paletteRow)&&p.paletteRow>=0&&p.paletteRow<12&&
   Number.isInteger(p.paletteCol)&&p.paletteCol>=0&&p.paletteCol<12)&&
  new Set(pawns.map(p=>p.key)).size===pawns.length;
}
