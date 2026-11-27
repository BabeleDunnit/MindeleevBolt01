/**
 * Three independent economic settlements for one Resonance commission.
 *
 * The artistic request generator, resonance scoring, Dance and conserved
 * Polytron energy are untouched. Only an explicitly submitted commission
 * may alter the treasury. All results are integral ENERGY units.
 */
import type {KaleidoLayout} from "@/polytron/kaleidoscopeGenerator";
import {resonanceReward} from "@/polytron/resonanceField";

export const RESONANCE_ECONOMY_MODE_IDS=[
 "current","threshold","improvement"
] as const;
export type ResonanceEconomyMode=(typeof RESONANCE_ECONOMY_MODE_IDS)[number];
export const ECONOMY_THRESHOLD_QUALITY=50;
export const RESONANCE_ECONOMY_LABELS:Record<ResonanceEconomyMode,string>={
 current:"Attuale · premio non negativo",
 threshold:"Soglia 50% · guadagno o perdita",
 improvement:"Miglioramento · premio sulla differenza"
};
const percentage=(value:number)=>Math.max(0,Math.min(100,value));
const signedRound=(value:number)=>{
 const n=Math.sign(value)*Math.round(Math.abs(value));
 return n===0?0:n;
};
export function commissionEnergyChange(
 layout:KaleidoLayout,mode:ResonanceEconomyMode,
 quality:number,baselineQuality:number
):number{
 if(!Number.isFinite(quality)||!Number.isFinite(baselineQuality))
  throw Error("Invalid quality for commission energy settlement");
 const q=percentage(quality),baseline=percentage(baselineQuality);
 if(mode==="current")return resonanceReward(layout,q);
 const maximum=resonanceReward(layout,100);
 if(mode==="threshold")
  return signedRound(maximum*(q-ECONOMY_THRESHOLD_QUALITY)/100);
 if(mode==="improvement")
  return signedRound(maximum*(q-baseline)/100);
 throw Error("Unknown Resonance economy mode");
}

export type ResonanceSettlement={
 /** Total energy in the player's possession, including active pawns. */
 treasury:number;
 /** Intrinsic Polytron energy reserved on the board, not spent. */
 committed:number;
 /** Energy not currently reserved by Polytrons. */
 free:number;
 /** Signed commission reward or penalty before liquidity validation. */
 change:number;
 /** How much additional free energy is needed to honor a loss. */
 shortage:number;
 canPresent:boolean;
 afterTreasury:number|null;
 afterFree:number|null;
};

/**
 * Penalties debit free ENERGY only: never confiscate or silently destroy
 * a Polytron's intrinsic energy. A commission that cannot pay its negative
 * settlement must first be improved or the player must recall some pawns.
 * No clipping, no implicit debt and no negative free energy.
 */
export function planResonanceSettlement(
 treasury:number,committed:number,change:number
):ResonanceSettlement{
 if(!Number.isSafeInteger(treasury)||treasury<0||
  !Number.isSafeInteger(committed)||committed<0||committed>treasury||
  !Number.isSafeInteger(change))
  throw Error("Invalid Resonance treasury, commitment or change");
 const free=treasury-committed;
 const shortage=Math.max(0,-change-free);
 const canPresent=shortage===0;
 return {
  treasury,committed,free,change,shortage,canPresent,
  afterTreasury:canPresent?treasury+change:null,
  afterFree:canPresent?free+change:null
 };
}
export function signedEnergy(value:number){
 return (value>0?"+":"")+value+" E";
}
