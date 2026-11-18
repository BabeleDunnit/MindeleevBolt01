import {dnaFromPolitronNumber} from "@/polytron/politronicNumber";
import {gradientPair} from "@/polytron/gradientPalettes";
import {sealName} from "@/polytron/spectralFutures";
import {rcKey,rcRingCells,type RCBoard} from "@/polytron/rc01Board";

export const RC01_SEAL_COUNT=72;
export const RC01_OPENING_COUNT=18;
export const RC01_START_SCORE=100;

/**
 * Each Seal retains its identity and personal Mindeleev history forever.
 * `number` is its CURRENT Conway manifestation; `manifestations` records
 * every distinct form it has ever manifested, in order of first appearance.
 * A Polytron sent Home remains a real member of the 72-person cast.
 */
export type RCPawn={
 seal:number;number:number;row:number;col:number;cellKey:string;
 manifestations:number[];
};
export type RCGame={
 pawns:RCPawn[];home:RCPawn[];score:number;moves:number;
 fusions:number;lastAction:string;
};
export const pawnDNA=(p:RCPawn)=>dnaFromPolitronNumber(p.number);
export const pawnPalette=(p:RCPawn)=>gradientPair(p.row,p.col);
export const pawnName=(p:RCPawn)=>sealName(p.seal);
export const pawnAt=(game:RCGame,key:string)=>game.pawns.find(p=>p.cellKey===key);

/**
 * Symmetric Metatron-inspired opening: three paired axes on the inner
 * hexagonal ring, six paired spokes on the outer ring. All five Platonic
 * manifestations (T,C,O,D,I => #1..#5) occur; opposite cells have
 * matching manifests. The Nucleus remains EMPTY.
 *
 * First 18 of the 72 permanent Seals participate, always in this order.
 */
export const RC01_OPENING_NUMBERS={
 inner:[1,2,3,1,2,3],
 outer:[4,5,1,2,3,4,4,5,1,2,3,4]
} as const;

const appendManifestation=(history:readonly number[],n:number):number[]=>
 history.includes(n)?[...history]:[...history,n];

/**
 * The captured Polytron loses its CURRENT manifestation.
 * Prefer a diagonal step to the previous period AND previous group (-6).
 * On the first period, fall back to the previous group (-1).
 * A group-1 Polytron cannot decrease its group: it returns to the #1 floor.
 * This also avoids a discontinuous wrap from group T to group I.
 */
export function rcHomeRegression(n:number):number{
 if(!Number.isSafeInteger(n)||n<1)throw Error("Invalid Polytronic Number");
 const period=Math.floor((n-1)/5)+1;
 const group=((n-1)%5)+1;
 if(group===1)return 1;
 if(period>1)return n-6;
 return n-1;
}

export function initialRCGame(board:RCBoard,_rng:()=>number=Math.random):RCGame{
 const cells=new Map(board.cells.map(c=>[c.key,c]));
 const rings=[
  ...rcRingCells(1).map((cell,i)=>({...cell,number:RC01_OPENING_NUMBERS.inner[i]})),
  ...rcRingCells(2).map((cell,i)=>({...cell,number:RC01_OPENING_NUMBERS.outer[i]}))
 ];
 if(rings.length!==RC01_OPENING_COUNT||rings.some(c=>!cells.has(rcKey(c.q,c.r))))
  throw Error("The full first two Mutatron rings must fit inside the board");
 const pawns=rings.map((c,i):RCPawn=>{
  const seal=i+1;
  // Stable Chromatica coordinates tied to the identity, not the shape.
  return {seal,number:c.number,row:(seal*7+2)%12,
   col:(seal*5+3)%12,cellKey:rcKey(c.q,c.r),
   manifestations:[c.number]};
 });
 return {pawns,home:[],score:RC01_START_SCORE,moves:0,fusions:0,
  lastAction:"Metatron opening: 18 Polytrons on two rings. The Nucleus is empty."};
}

/** Diagnostic fixture, never used for the production opening. */
export function rc01CenterDiagnostic(board:RCBoard):RCGame{
 if(!board.cells.some(c=>c.key==="0,0"&&c.nucleus))
  throw Error("Nucleus (0,0) is not visible");
 return {
  pawns:[{seal:1,number:1,row:2,col:4,cellKey:"0,0",
   manifestations:[1]}],
  home:[],score:RC01_START_SCORE,moves:0,fusions:0,
  lastAction:"Centering diagnostic: a single Polytron #1 at the nucleus (0,0)."
 };
}

export type RCMoveResult={game:RCGame;captured:RCPawn|null;attacker:RCPawn};

/**
 * The physics layer resolves the same capture as before. ONLY after the
 * attacker has physically settled does this deterministic state transition
 * commit the fusion. No energy costs or ConwayDNA concatenation.
 */
export function moveRCPawn(game:RCGame,source:string,target:string,board:RCBoard):RCMoveResult|null{
 if(source===target||!board.cells.some(c=>c.key===target))return null;
 const attacker=pawnAt(game,source);if(!attacker)return null;
 const captured=pawnAt(game,target)??null;
 if(captured?.seal===attacker.seal)return null;
 const inherited=captured?.number;
 const pawns=game.pawns.filter(p=>p.seal!==captured?.seal)
  .map(p=>p.seal===attacker.seal?{
   ...p,cellKey:target,
   number:inherited??p.number,
   manifestations:inherited===undefined?p.manifestations:
    appendManifestation(p.manifestations,inherited)
  }:p);
 const regressed=captured?rcHomeRegression(captured.number):null;
 const home=captured&&regressed!==null?[...game.home,{
  ...captured,cellKey:"",number:regressed,
  manifestations:appendManifestation(captured.manifestations,regressed)
 }]:game.home;
 const updated:RCGame={...game,pawns,home,
  moves:game.moves+1,fusions:game.fusions+(captured?1:0),
  lastAction:captured?
   "FUSION · "+pawnName(attacker)+" inherits #"+captured.number+
   " (from #"+attacker.number+"). "+pawnName(captured)+
   " returns Home as #"+regressed+".":
   pawnName(attacker)+" moves to cell "+target+"."};
 if(!validateRCGame(updated,board))
  throw Error("Fusion violates permanent identities, history or board exclusivity");
 return {game:updated,captured,attacker};
}

export function validateRCGame(game:RCGame,board:RCBoard):boolean{
 const cells=new Set(board.cells.map(c=>c.key));
 const occupied=new Set<string>(),seals=new Set<number>();
 if(!Array.isArray(game.pawns)||!Array.isArray(game.home)||
    !Number.isInteger(game.moves)||game.moves<0||
    !Number.isInteger(game.fusions)||game.fusions<0||
    game.fusions>game.moves)return false;
 for(const [location,list] of [["board",game.pawns],["home",game.home]] as const){
  for(const p of list){
   if(seals.has(p.seal)||p.seal<1||p.seal>RC01_SEAL_COUNT||
      !Number.isInteger(p.seal)||!Number.isSafeInteger(p.number)||p.number<1||
      !Number.isInteger(p.row)||p.row<0||p.row>=12||
      !Number.isInteger(p.col)||p.col<0||p.col>=12||
      !Array.isArray(p.manifestations)||!p.manifestations.length||
      !p.manifestations.every(n=>Number.isSafeInteger(n)&&n>0)||
      new Set(p.manifestations).size!==p.manifestations.length||
      !p.manifestations.includes(p.number))return false;
   seals.add(p.seal);
   if(location==="board"){
    if(!cells.has(p.cellKey)||occupied.has(p.cellKey))return false;
    occupied.add(p.cellKey);
   }else if(p.cellKey!=="")return false;
  }
 }
 return game.pawns.length+game.home.length<=RC01_SEAL_COUNT&&
  game.score===RC01_START_SCORE;
}
