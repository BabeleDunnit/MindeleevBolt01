import {dnaFromPolitronNumber} from "@/polytron/politronicNumber";
import {gradientPair} from "@/polytron/gradientPalettes";
import {sealName} from "@/polytron/spectralFutures";
import type {RCBoard} from "@/polytron/rc01Board";

export const RC01_SEAL_COUNT=72;
export const RC01_START_SCORE=100;
export type RCPawn={
 seal:number;number:number;row:number;col:number;cellKey:string;
};
export type RCGame={pawns:RCPawn[];score:number;moves:number;lastAction:string};
export const pawnDNA=(p:RCPawn)=>dnaFromPolitronNumber(p.number);
export const pawnPalette=(p:RCPawn)=>gradientPair(p.row,p.col);
export const pawnName=(p:RCPawn)=>sealName(p.seal);
export const pawnAt=(game:RCGame,key:string)=>game.pawns.find(p=>p.cellKey===key);
const randomInteger=(exclusive:number,rng:()=>number)=>Math.floor(Math.min(.999999999,Math.max(0,rng()))*exclusive);
const shuffle=<T,>(list:readonly T[],rng:()=>number):T[]=>{
 const copy=[...list];
 for(let i=copy.length-1;i>0;i--){
  const j=randomInteger(i+1,rng);
  [copy[i],copy[j]]=[copy[j],copy[i]];
 }
 return copy;
};
export function initialRCGame(board:RCBoard,rng:()=>number=Math.random):RCGame{
 const candidates=board.cells.filter(c=>c.ring>0&&c.ring<=3);
 const eligible=candidates.length>=5?candidates:board.cells.filter(c=>!c.nucleus);
 if(eligible.length<5)throw Error("Viewport too small for five complete cells");
 const homes=shuffle(Array.from({length:RC01_SEAL_COUNT},(_,i)=>i+1),rng);
 const placements=shuffle(eligible,rng).slice(0,5);
 const pawns=placements.map((cell,i):RCPawn=>({
  seal:homes[i],number:1+randomInteger(22,rng),
  row:randomInteger(12,rng),col:randomInteger(12,rng),cellKey:cell.key
 }));
 return {pawns,score:RC01_START_SCORE,moves:0,
  lastAction:"Five Polytrons have been summoned to the Mutatron."};
}
/**
 * Temporary screenshot fixture: one unambiguous Polytron fixed at the
 * mathematical nucleus. Keep the original five-actor initializer intact
 * for restoring RC01 gameplay after viewport diagnostics.
 */
export function rc01CenterDiagnostic(board:RCBoard):RCGame{
 if(!board.cells.some(c=>c.key==="0,0"&&c.nucleus))
  throw Error("Nucleus (0,0) is not visible");
 return {
  pawns:[{seal:1,number:1,row:2,col:4,cellKey:"0,0"}],
  score:RC01_START_SCORE,moves:0,
  lastAction:"Centering diagnostic: a single Polytron #1 at the nucleus (0,0)."
 };
}
export type RCMoveResult={game:RCGame;captured:RCPawn|null;attacker:RCPawn};
export function moveRCPawn(game:RCGame,source:string,target:string,board:RCBoard):RCMoveResult|null{
 if(source===target||!board.cells.some(c=>c.key===target))return null;
 const attacker=pawnAt(game,source);if(!attacker)return null;
 const captured=pawnAt(game,target)??null;
 if(captured?.seal===attacker.seal)return null;
 const pawns=game.pawns.filter(p=>p.seal!==captured?.seal)
  .map(p=>p.seal===attacker.seal?{...p,cellKey:target}:p);
 const updated={...game,pawns,moves:game.moves+1,
  lastAction:captured?
   pawnName(attacker)+" captures "+pawnName(captured)+
   ". "+pawnName(captured)+" returns home.":
   pawnName(attacker)+" moves to cell "+target+"."};
 if(!validateRCGame(updated,board))throw Error("Movement violates the 72 identities or grid exclusivity");
 return {game:updated,captured,attacker};
}
export function validateRCGame(game:RCGame,board:RCBoard):boolean{
 const cells=new Set(board.cells.map(c=>c.key));
 const occupied=new Set<string>(),seals=new Set<number>();
 for(const p of game.pawns){
  if(!cells.has(p.cellKey)||occupied.has(p.cellKey)||
   seals.has(p.seal)||p.seal<1||p.seal>RC01_SEAL_COUNT||
   !Number.isSafeInteger(p.number)||p.number<1||
   !Number.isInteger(p.row)||p.row<0||p.row>=12||
   !Number.isInteger(p.col)||p.col<0||p.col>=12)return false;
  occupied.add(p.cellKey);seals.add(p.seal);
 }
 return game.pawns.length<=RC01_SEAL_COUNT&&game.score===RC01_START_SCORE;
}
