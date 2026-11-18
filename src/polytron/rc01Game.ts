import {dnaFromPolitronNumber} from "@/polytron/politronicNumber";
import {gradientPair} from "@/polytron/gradientPalettes";
import {sealName} from "@/polytron/spectralFutures";
import {rcKey,rcRingCells,type RCBoard} from "@/polytron/rc01Board";

export const RC01_SEAL_COUNT=72;
export const RC01_OPENING_COUNT=72;
export const RC01_OPENING_RINGS=[1,2,4,5] as const;
export const RC01_OPENING_NUMBER=1;
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
};
export const pawnDNA=(p:RCPawn)=>dnaFromPolitronNumber(p.number);
export const pawnPalette=(p:RCPawn)=>gradientPair(p.row,p.col);
export const pawnName=(p:RCPawn)=>sealName(p.seal);
export const pawnAt=(game:RCGame,key:string)=>game.pawns.find(p=>p.cellKey===key);

/**
 * Canonical full-cast opening, clockwise from due north:
 * Seals 1..6 -> ring 1; 7..18 -> ring 2;
 * 19..42 -> ring 4; 43..72 -> ring 5.
 * Both the Nucleus and ring 3 are empty, with exactly 19 free cells.
 * Every Seal starts as the SAME tetrahedron (Polytronic Number #1) with
 * the SAME Chromatica gradient. Different permanent identities remain.
 */
export function initialRCGame(board:RCBoard,_rng:()=>number=Math.random):RCGame{
 const cells=new Set(board.cells.map(c=>c.key));
 const positions=RC01_OPENING_RINGS.flatMap(ring=>
  rcRingCells(ring).map(p=>({...p,ring})));
 if(positions.length!==RC01_OPENING_COUNT||
    positions.some(p=>!cells.has(rcKey(p.q,p.r))))
  throw Error("The Mutatron must contain all five complete rings");
 const pawns=positions.map((pos,i):RCPawn=>({
  seal:i+1,number:RC01_OPENING_NUMBER,
  row:RC01_OPENING_PALETTE.row,col:RC01_OPENING_PALETTE.col,
  cellKey:rcKey(pos.q,pos.r),
  manifestations:[RC01_OPENING_NUMBER]
 }));
 return {pawns,home:[],score:RC01_START_SCORE,moves:0,fusions:0,
  lastAction:"Metatron opening: 72 tetrahedral Polytrons, third ring and Nucleus empty."};
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
