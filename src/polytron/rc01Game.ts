import {dnaFromPolitronNumber} from "@/polytron/politronicNumber";
import {gradientPair} from "@/polytron/gradientPalettes";
import {sealName} from "@/polytron/spectralFutures";
import {rcKey,rcRingCells,type RCBoard} from "@/polytron/rc01Board";

export const RC01_SEAL_COUNT=72;
export const RC01_OPENING_COUNT=72;
export const RC01_OPENING_RINGS=[1,2,4,5] as const;
export const RC01_OPENING_NUMBER=1; // outer rings 4 and 5
export const RC01_INNER_OPENING_NUMBERS=[2,3] as const;
/** Inner rings 1 and 2 alternate 2,3 from index 0; outer rings stay #1. */
export function rcOpeningNumber(ring:number,idxInRing:number):number{
 if(![1,2,4,5].includes(ring)||!Number.isInteger(idxInRing)||
    idxInRing<0||idxInRing>=6*ring)
  throw Error("Invalid initial ring/index");
 return ring<=2?RC01_INNER_OPENING_NUMBERS[idxInRing%2]:RC01_OPENING_NUMBER;
}
export const RC01_OPENING_PALETTE={row:2,col:4} as const;
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
 homeTestPhase:{odd:"board"|"home";even:"board"|"home"};
};
export const pawnDNA=(p:RCPawn)=>dnaFromPolitronNumber(p.number);
export const pawnPalette=(p:RCPawn)=>gradientPair(p.row,p.col);
export const pawnName=(p:RCPawn)=>sealName(p.seal);
export const pawnAt=(game:RCGame,key:string)=>game.pawns.find(p=>p.cellKey===key);

const appendManifestation=(history:readonly number[],n:number):number[]=>
 history.includes(n)?[...history]:[...history,n];

/**
 * Home regression: decrease period and group together (-6) where possible.
 * On the first period, step back one group; a group-one form returns to #1.
 */
export function rcHomeRegression(n:number):number{
 if(!Number.isSafeInteger(n)||n<1)throw Error("Invalid Polytronic Number");
 const period=Math.floor((n-1)/5)+1;
 const group=((n-1)%5)+1;
 if(group===1)return 1;
 if(period>1)return n-6;
 return n-1;
}

/**
 * Canonical full-cast opening, clockwise from due north:
 * Seals 1..6 -> ring 1; 7..18 -> ring 2;
 * 19..42 -> ring 4; 43..72 -> ring 5.
 * Both the Nucleus and ring 3 are empty, with exactly 19 free cells.
 * Ring 1 (Seals 1..6) and ring 2 (Seals 7..18) alternate
 * Polytronic Numbers #2 and #3 from index 0, clockwise.
 * The 54 Seals on rings 4 and 5 remain #1 tetrahedra.
 * All 72 retain the SAME Chromatica gradient and distinct permanent IDs.
 */
export function initialRCGame(board:RCBoard,_rng:()=>number=Math.random):RCGame{
 const cells=new Set(board.cells.map(c=>c.key));
 const positions=RC01_OPENING_RINGS.flatMap(ring=>
  rcRingCells(ring).map(p=>({...p,ring})));
 if(positions.length!==RC01_OPENING_COUNT||
    positions.some(p=>!cells.has(rcKey(p.q,p.r))))
  throw Error("The Mutatron must contain all five complete rings");
 const pawns=positions.map((pos,i):RCPawn=>{
  const number=rcOpeningNumber(pos.ring,pos.idxInRing);
  return {
   seal:i+1,number,
   row:RC01_OPENING_PALETTE.row,col:RC01_OPENING_PALETTE.col,
   cellKey:rcKey(pos.q,pos.r),
   manifestations:[number]
  };
 });
 return {pawns,home:[],score:RC01_START_SCORE,moves:0,fusions:0,
  homeTestPhase:{odd:"board",even:"board"},
  lastAction:"Metatron opening: rings 1 & 2 alternate #2/#3; rings 4 & 5 are #1, Nucleus and ring 3 empty."};
}

/** Diagnostic fixture, never used for the production opening. */
export function rc01CenterDiagnostic(board:RCBoard):RCGame{
 if(!board.cells.some(c=>c.key==="0,0"&&c.nucleus))
  throw Error("Nucleus (0,0) is not visible");
 return {
  pawns:[{seal:1,number:1,row:2,col:4,cellKey:"0,0",
   manifestations:[1]}],
  home:[],score:RC01_START_SCORE,moves:0,fusions:0,
  homeTestPhase:{odd:"board",even:"board"},
  lastAction:"Centering diagnostic: a single Polytron #1 at the nucleus (0,0)."
 };
}

/**
 * Canonical opening cell of a permanent Seal, independent of its
 * current manifestation, ownership and current board position.
 */
export function openingCellKeyForSeal(seal:number):string{
 if(!Number.isInteger(seal)||seal<1||seal>RC01_SEAL_COUNT)
  throw Error("Invalid permanent Seal ID");
 const ring=seal<=6?1:seal<=18?2:seal<=42?4:5;
 const start=ring===1?1:ring===2?7:ring===4?19:43;
 const {q,r}=rcRingCells(ring)[seal-start];
 return rcKey(q,r);
}
/** One fusion rule shared by drag captures and Home return captures. */
function inheritManifestation(attacker:RCPawn,captured:RCPawn,target:string){
 const regressed=rcHomeRegression(captured.number);
 return {
  attacker:{...attacker,cellKey:target,number:captured.number,
   manifestations:appendManifestation(attacker.manifestations,captured.number)},
  defender:{...captured,cellKey:"",number:regressed,
   manifestations:appendManifestation(captured.manifestations,regressed)}
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
 const fused=captured?inheritManifestation(attacker,captured,target):null;
 const pawns=game.pawns.filter(p=>p.seal!==captured?.seal)
  .map(p=>p.seal===attacker.seal?
   fused?.attacker??{...p,cellKey:target}:p);
 const regressed=fused?.defender.number??null;
 const home=fused?[...game.home,fused.defender]:game.home;
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

/**
 * Interactive Home stress test. On double-tap, recall ALL on-board Seals
 * of the requested permanent-ID parity into their corresponding Home.
 * This is a diagnostic move, NOT a Fusion and does not change identity,
 * number, palette, history, or Fusion counter.
 */
export type RCHomeParity="odd"|"even";
export const rcParity=(seal:number):RCHomeParity=>
 seal%2===0?"even":"odd";
export function recallRCParity(game:RCGame,parity:RCHomeParity,board:RCBoard):RCGame{
 const recalled=game.pawns.filter(p=>rcParity(p.seal)===parity);
 if(!recalled.length)return game;
 const updated:RCGame={
  ...game,
  pawns:game.pawns.filter(p=>rcParity(p.seal)!==parity),
  home:[...game.home,...recalled.map(p=>({...p,cellKey:""}))],
  lastAction:"HOME TEST · "+recalled.length+" "+parity+
   " Polytrons recalled into their Home."
 };
 if(!validateRCGame(updated,board))throw Error("Home recall changed permanent identities");
 return updated;
}

export type RCHomeToggleResult={
 game:RCGame;action:"recall"|"return";pawns:RCPawn[]
};
/**
 * Alternate on each double tap. In the return phase the game only records
 * the intent; each arrival is committed independently by returnRCPawnHome.
 */
export function toggleRCParityHome(
 game:RCGame,parity:RCHomeParity,board:RCBoard
):RCHomeToggleResult{
 const returning=game.homeTestPhase[parity]==="home";
 const pawns=(returning?game.home:game.pawns)
  .filter(p=>rcParity(p.seal)===parity).sort((a,b)=>a.seal-b.seal);
 const next=returning?game:recallRCParity(game,parity,board);
 const updated:RCGame={
  ...next,homeTestPhase:{...game.homeTestPhase,[parity]:returning?"board":"home"},
  lastAction:returning?
   "HOME TEST · "+pawns.length+" "+parity+" Polytrons returning to their opening cells.":
   next.lastAction
 };
 if(!validateRCGame(updated,board))throw Error("Invalid Home toggle");
 return {game:updated,action:returning?"return":"recall",pawns};
}
export type RCHomeArrivalResult={
 game:RCGame;attacker:RCPawn;captured:RCPawn|null;target:string
};
/** Resolve each animated return against the LIVE board on arrival. */
export function returnRCPawnHome(
 game:RCGame,seal:number,board:RCBoard
):RCHomeArrivalResult|null{
 const incoming=game.home.find(p=>p.seal===seal);
 if(!incoming)return null;
 const target=openingCellKeyForSeal(seal);
 if(!board.cells.some(c=>c.key===target))return null;
 const captured=pawnAt(game,target)??null;
 const fused=captured?inheritManifestation(incoming,captured,target):null;
 const attacker=fused?.attacker??{...incoming,cellKey:target};
 const updated:RCGame={
  ...game,
  pawns:[...game.pawns.filter(p=>p.seal!==captured?.seal),attacker],
  home:[...game.home.filter(p=>p.seal!==incoming.seal),
   ...(fused?[fused.defender]:[])],
  moves:game.moves+1,fusions:game.fusions+(captured?1:0),
  lastAction:captured?
   "HOME FUSION · "+pawnName(incoming)+" inherits #"+captured.number+
   " from "+pawnName(captured)+". "+pawnName(captured)+
   " returns Home as #"+fused?.defender.number+".":
   "HOME RETURN · "+pawnName(incoming)+" returns to "+target+"."
 };
 if(!validateRCGame(updated,board))throw Error("Invalid Home arrival");
 return {game:updated,attacker,captured,target};
}

export function validateRCGame(game:RCGame,board:RCBoard):boolean{
 const cells=new Set(board.cells.map(c=>c.key));
 const occupied=new Set<string>(),seals=new Set<number>();
 if(!Array.isArray(game.pawns)||!Array.isArray(game.home)||
    !Number.isInteger(game.moves)||game.moves<0||
    !Number.isInteger(game.fusions)||game.fusions<0||
    game.fusions>game.moves||
    !game.homeTestPhase||
    !["board","home"].includes(game.homeTestPhase.odd)||
    !["board","home"].includes(game.homeTestPhase.even))return false;
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
