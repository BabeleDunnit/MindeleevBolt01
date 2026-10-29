/**
 * Sprint30 — reaction feasibility is a GENETIC diagnostic, not a force.
 * This deliberately does not gate attraction yet: C0/C1 must reproduce the
 * original universal attraction before testing selective transformer fields.
 */
import {decode,encode,wrapDNA,cutDNA} from "./IslandAffinityEngine";
export type Feasibility={state:"ready"|"waiting"|"blocked"|"pass";reason:string;product?:string};
export function cubeFusion(stationDNA:string,firstDNA:string,secondDNA:string):Feasibility{
 try{
  const s=decode(stationDNA),a=decode(firstDNA),b=decode(secondDNA);
  if(s.seed!=="C")return {state:"blocked",reason:"Il transformer non è un Cubo."};
  if(a.seed!==b.seed)return {state:"blocked",reason:"Semi di origine differenti."};
  if(a.palette!==b.palette)return {state:"blocked",reason:"Palette differenti."};
  const genes=a.ops+b.ops;
  if(genes.length===0)return {state:"blocked",reason:"Entrambi i DNA sono nudi: fusione nulla."};
  if(genes.length+s.ops.length>4)return {state:"blocked",reason:"Oltre il limite di operatori Conway."};
  const product=wrapDNA(encode({...a,ops:genes}),s.ops);
  return product?{state:"ready",reason:"Fusione geneticamente possibile.",product}:
   {state:"blocked",reason:"La ricetta fusa non è realizzabile."};
 }catch(e){return {state:"blocked",reason:"DNA non valido: "+String(e)};}
}
export function analyzeEncounter(stationDNA:string,travelerDNA:string,
 bufferDNA?:string,energy=1,active=6):Feasibility{
 try{
  const s=decode(stationDNA),t=decode(travelerDNA);
  if(s.seed==="C"){
   if(bufferDNA)return cubeFusion(stationDNA,bufferDNA,travelerDNA);
   return {state:"waiting",reason:"Cubo libero: il primo viaggiatore entra nel buffer. Il secondo determinerà la compatibilità."};
  }
  if(s.seed==="T"){
   const result=wrapDNA(encode({...t,palette:s.palette}),s.ops);
   if(!result)return {state:"blocked",reason:"La ricetta Colorа + Conway non è applicabile."};
   return result===travelerDNA?
    {state:"pass",reason:"Palette e DNA già invariati: trasformazione nulla.",product:result}:
    {state:"ready",reason:"Colorа e applica l'eventuale operatore Conway.",product:result};
  }
  if(s.seed==="I"){
   if(s.palette!==t.palette)return {state:"blocked",reason:"Filtro: palette incompatibile."};
   const result=wrapDNA(travelerDNA,s.ops);
   return result?{state:"pass",reason:"Filtro: ammesso; wrapper Conway applicabile.",product:result}:
    {state:"blocked",reason:"Filtro ammesso, ma modificatore Conway impossibile."};
  }
  if(s.seed==="O"){
   if(t.ops.length<2)return {state:"blocked",reason:"DNA con meno di due operatori: nessun taglio interno."};
   if(energy<=.28)return {state:"blocked",reason:"ENERGY insufficiente per la scissione."};
   if(active>=47)return {state:"blocked",reason:"Limite di portatori raggiunto."};
   const sample=cutDNA(travelerDNA,0);
   return sample&&sample.every(x=>wrapDNA(x,s.ops)!==null)?
    {state:"ready",reason:"Scissione possibile; il taglio effettivo sarà pseudocasuale."}:
    {state:"blocked",reason:"Modificatore Conway incompatibile con i prodotti."};
  }
  if(s.seed==="D"){
   if(energy<=.28)return {state:"blocked",reason:"ENERGY insufficiente per clonare."};
   if(active>=47)return {state:"blocked",reason:"Limite di portatori raggiunto."};
   const result=wrapDNA(travelerDNA,s.ops);
   return result?{state:"ready",reason:"Clonazione possibile: due copie con energia ripartita.",product:result}:
    {state:"blocked",reason:"Modificatore Conway impossibile sulle copie."};
  }
  return {state:"blocked",reason:"Seme sconosciuto."};
 }catch(e){return {state:"blocked",reason:"DNA non valido: "+String(e)};}
}
