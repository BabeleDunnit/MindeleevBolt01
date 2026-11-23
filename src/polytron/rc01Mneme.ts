/**
 * Mneme RC01: completing the five canonical Platonic groups (T,C,O,D,I)
 * of ONE period with ONE Chromatica palette.
 *
 * Perma-Seal history is chronological. A revisit may produce an additional
 * manifestation, but a given (period, Latin, Greek) Mneme can be completed
 * only once per Seal and yields its period number as FIELD energy exactly once.
 */
import type {RCManifestation,RCGame} from "@/polytron/rc01Game";

export type RCMneme={
 period:number;row:number;col:number;
 completedAt:number;
};
export const rcMnemePeriod=(number:number)=>Math.floor((number-1)/5)+1;
export const rcMnemeGroup=(number:number)=>((number-1)%5)+1;
export const rcMnemeKey=(mneme:Pick<RCMneme,"period"|"row"|"col">)=>
 mneme.period+":"+mneme.row+":"+mneme.col;

/** Completed Mnemes, in chronological order of their fifth group. */
export function rcCompletedMnemes(history:readonly RCManifestation[]):RCMneme[]{
 const seen=new Map<string,number>();
 const completed=new Set<string>();
 const result:RCMneme[]=[];
 for(let index=0;index<history.length;index++){
  const {number,row,col}=history[index];
  const period=rcMnemePeriod(number),group=rcMnemeGroup(number);
  const key=rcMnemeKey({period,row,col});
  const mask=(seen.get(key)??0)|(1<<(group-1));
  seen.set(key,mask);
  if(mask===31&&!completed.has(key)){
   completed.add(key);
   result.push({period,row,col,completedAt:index});
  }
 }
 return result;
}

/** Energy minted by completed Mnemes across one committed game transition.
 * Home and board represent one continuous 72-Seal cast.
 */
export function rcNewMnemeEnergy(previous:RCGame,next:RCGame):number{
 const before=new Map([...previous.pawns,...previous.home].map(p=>[
  p.seal,new Set(rcCompletedMnemes(p.manifestations).map(rcMnemeKey))
 ]));
 let earned=0;
 for(const pawn of [...next.pawns,...next.home]){
  const old=before.get(pawn.seal)??new Set<string>();
  for(const mneme of rcCompletedMnemes(pawn.manifestations))
   if(!old.has(rcMnemeKey(mneme)))earned+=mneme.period;
 }
 return earned;
}

/** Mneme is a genuine energy SOURCE; captures / dissociation are transfers. */
export function rcAwardMnemes(previous:RCGame,next:RCGame):RCGame{
 const earned=rcNewMnemeEnergy(previous,next);
 if(!earned)return next;
 return {...next,
  mutatron:{...next.mutatron,
   energyReserve:next.mutatron.energyReserve+earned,
   mnemeGeneratedEnergy:next.mutatron.mnemeGeneratedEnergy+earned},
  lastAction:next.lastAction+" MNEME COMPLETE · +"+earned+" FIELD E."
 };
}
