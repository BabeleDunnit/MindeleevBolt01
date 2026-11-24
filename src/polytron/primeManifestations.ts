/**
 * The first 72 prime numbers select 72 existing Polytronic Numbers.
 * These are NOT new forms or Seals: each p(n) is looked up in the canonical
 * five-group periodic enumeration, preserving its Conway DNA and energy.
 */
import {dnaFromPolitronNumber,PERIODIC_SEEDS} from "@/polytron/politronicNumber";
import {intrinsicEnergy} from "@/polytron/mindeleevLife";

export const PRIME_MANIFESTATION_COUNT=72;
export type PrimeManifestation={
 index:number;prime:number;dna:string;group:number;
 groupCode:"T"|"C"|"O"|"D"|"I";period:number;energy:number;
};
function firstPrimes(count:number):number[]{
 const result:number[]=[];
 for(let candidate=2;result.length<count;candidate++){
  let prime=true;
  for(let d=2;d*d<=candidate;d++){
   if(candidate%d===0){prime=false;break;}
  }
  if(prime)result.push(candidate);
 }
 return result;
}
export const PRIME_MANIFESTATIONS:readonly PrimeManifestation[]=
 firstPrimes(PRIME_MANIFESTATION_COUNT).map((prime,i)=>{
  const group=(prime-1)%5+1;
  const period=Math.floor((prime-1)/5)+1;
  return {
   index:i+1,prime,dna:dnaFromPolitronNumber(prime),
   group,groupCode:PERIODIC_SEEDS[group-1],
   period,energy:intrinsicEnergy(prime,0)
  };
 });
export const LARGEST_PRIME_MANIFESTATION=
 PRIME_MANIFESTATIONS[PRIME_MANIFESTATIONS.length-1].prime;
export const PRIME_CATALOG_PERIODS=
 Math.ceil(LARGEST_PRIME_MANIFESTATION/5);
export function polytronPeriodicUrl(number:number):string{
 if(!Number.isSafeInteger(number)||number<1)throw Error("Invalid Polytronic Number");
 return "?experiment=polytron-periodic&polytron="+number;
}
