import {dnaFromPolitronNumber} from "@/polytron/politronicNumber";
import {gradientPair,mixColors,perceptualDistance} from "@/polytron/gradientPalettes";
import {sealName} from "@/polytron/spectralFutures";
import {rcKey,rcRing,rcRingCells,rcCellCoordinatesForKey,type RCBoard} from "@/polytron/rc01Board";
import {intrinsicEnergy} from "@/polytron/mindeleevLife";

export const RC01_SEAL_COUNT=72;
export const RC01_OPENING_COUNT=72;
export const RC01_OPENING_RINGS=[1,2,4,5] as const;
export const RC01_OPENING_NUMBER=1; // outer rings 4 and 5
/**
 * Canonical opening transcribed from the hand-drawn pointy-top sketch,
 * rotated counterclockwise 30° into the CURRENT north-first board frame.
 * In particular (ring 1,index 0) and (ring 2,index 0) are both cubes (#2).
 * Tetrahedron T = #1; Cube C = #2; Octahedron O = #3.
 */
export const RC01_OPENING_RING_1=[2,3,2,3,2,3] as const;
export const RC01_OPENING_RING_2=[
 2,1,3,1,2,1,3,1,2,1,3,1
] as const;
export function rcOpeningNumber(ring:number,idxInRing:number):number{
 if(![1,2,4,5].includes(ring)||!Number.isInteger(idxInRing)||
    idxInRing<0||idxInRing>=6*ring)
  throw Error("Invalid initial ring/index");
 if(ring===1)return RC01_OPENING_RING_1[idxInRing];
 if(ring===2)return RC01_OPENING_RING_2[idxInRing];
 return RC01_OPENING_NUMBER;
}
export const RC01_OPENING_PALETTE={row:2,col:4} as const;
/** Twelve diagonal Chromatica seeds on the outer-ring vertices.
 * Coordinates are (ring, clockwise index from north).
 * All other Seals keep their previous RC01 palette until new rules exist.
 */
export const RC01_DIAGONAL_PALETTE_VERTICES=[
 {ring:5,idxInRing:0,paletteIndex:1},  // Albus Leukos — north
 {ring:5,idxInRing:5,paletteIndex:2},  // Ruber Erythros
 {ring:5,idxInRing:10,paletteIndex:3}, // Fulvus Pyrrhos
 {ring:5,idxInRing:15,paletteIndex:0}, // Niger Melas — south
 {ring:5,idxInRing:20,paletteIndex:4}, // Aureus Chrysos
 {ring:5,idxInRing:25,paletteIndex:5}, // Flavus Xanthos
 {ring:4,idxInRing:0,paletteIndex:6},  // Viridis Chloros
 {ring:4,idxInRing:4,paletteIndex:7},  // Caesius Glaukos
 {ring:4,idxInRing:8,paletteIndex:8},  // Caeruleus Kyanos
 {ring:4,idxInRing:12,paletteIndex:9}, // Purpureus Porphyra
 {ring:4,idxInRing:16,paletteIndex:10},// Roseus Rhodon
 {ring:4,idxInRing:20,paletteIndex:11} // Canus Phaios
] as const;
export const RC01_START_SCORE=100;

/**
 * Each Seal retains its identity and personal Mindeleev history forever.
 * `number` is its CURRENT Conway manifestation; `manifestations` is
 * a chronological seed of Mneme: snapshots of number AND palette, including
 * revisits to an earlier number. Home transfers never erase its history.
 */
export type RCManifestation={number:number;row:number;col:number};
export type RCPawn={
 seal:number;number:number;row:number;col:number;cellKey:string;
 manifestations:RCManifestation[];
};
export type RCMutatronChange={
 seal:number;cellKey:string;from:number;to:number;
 kind:"emergence"|"symmetry";
};
export type RCMutatronState={
 generation:number;
 /** Finite intrinsic-energy reserve: evolutions transfer E from here to
  * Polytrons. The sum of intrinsic energies + reserve is unchanged per tick. */
 energyReserve:number;
 dissipatedEnergy:number; // cumulative invocation heat, never recycled
 /** Pair-coherence is stored on the GRID, never on a permanent identity. */
 resonance:Record<string,number>;
 symmetry:number;
 changes:RCMutatronChange[];
 lastNote:string;
};
export type RCGame={
 pawns:RCPawn[];home:RCPawn[];score:number;moves:number;
 /** Every committed board move and paid explicit Mutatron invocation advances Home cooldown. */
 homeCycles:number;
 fusions:number;lastAction:string;
 homeTestPhase:{odd:"board"|"home";even:"board"|"home"};
 homeCooling:Record<string,number>; // seal -> ready when homeCycles >= value
 mutatron:RCMutatronState;
};
export const pawnDNA=(p:RCPawn)=>dnaFromPolitronNumber(p.number);
export const pawnPalette=(p:RCPawn)=>gradientPair(p.row,p.col);
export const pawnName=(p:RCPawn)=>sealName(p.seal);
export const pawnAt=(game:RCGame,key:string)=>game.pawns.find(p=>p.cellKey===key);

/** One canonical bilateral-symmetry metric, recalculated after EVERY
 * action (drag, capture, Home recall/return and Mutatron evolution).
 * Both occupied equal pairs and symmetrical empty pairs count; the Nucleus
 * has no diametrically opposed partner and is excluded.
 */
export function rcBoardSymmetry(pawns:readonly RCPawn[],board:RCBoard):number{
 const occupied=new Map(pawns.map(p=>[p.cellKey,p]));
 let total=0,matching=0;
 for(const cell of board.cells){
  if(cell.nucleus)continue;
  const oppositeKey=rcKey(-cell.q,-cell.r);
  if(cell.key>=oppositeKey)continue;
  total++;
  const a=occupied.get(cell.key),b=occupied.get(oppositeKey);
  if((!a&&!b)||(!!a&&!!b&&a.number===b.number&&
   a.row===b.row&&a.col===b.col))matching++;
 }
 return total?Math.round(100*matching/total):100;
}

/** Record a new manifestation only when number or palette changes. */
export function rcRecordManifestation(
 history:readonly RCManifestation[],state:RCManifestation
):RCManifestation[]{
 const last=history[history.length-1];
 if(last&&last.number===state.number&&
    last.row===state.row&&last.col===state.col)return [...history];
 return [...history,{number:state.number,row:state.row,col:state.col}];
}

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
 * Ring 1 (Seals 1..6): C O C O C O, clockwise from due north.
 * Ring 2 (Seals 7..18): C T O T C T O T C T O T.
 * Together these make six cubes (#2), six octahedra (#3), and six
 * tetrahedra (#1). Rings 4 and 5 add 54 tetrahedra (#1).
 * Twelve vertices seed distinct diagonal Chromatica pairs; the other
 * 60 retain the prior RC01 palette. All 72 keep distinct permanent IDs.
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
  const diagonal=RC01_DIAGONAL_PALETTE_VERTICES.find(v=>
   v.ring===pos.ring&&v.idxInRing===pos.idxInRing);
  const row=diagonal?.paletteIndex??RC01_OPENING_PALETTE.row;
  const col=diagonal?.paletteIndex??RC01_OPENING_PALETTE.col;
  return {
   seal:i+1,number,row,col,
   cellKey:rcKey(pos.q,pos.r),
   manifestations:[{number,row,col}]
  };
 });
 return {pawns,home:[],score:RC01_START_SCORE,moves:0,homeCycles:0,fusions:0,
  homeTestPhase:{odd:"board",even:"board"},homeCooling:{},
  mutatron:{generation:0,energyReserve:48,dissipatedEnergy:0,resonance:{},
   symmetry:rcBoardSymmetry(pawns,board),changes:[],
   lastNote:"The symmetry field is at rest; evolve to test geometrical resonance."},
  lastAction:"Metatron opening: Ring 1 C/O alternating, Ring 2 C-T-O-T repeating; all outer Polytrons #1."};
}

/** Diagnostic fixture, never used for the production opening. */
export function rc01CenterDiagnostic(board:RCBoard):RCGame{
 if(!board.cells.some(c=>c.key==="0,0"&&c.nucleus))
  throw Error("Nucleus (0,0) is not visible");
 return {
  pawns:[{seal:1,number:1,row:2,col:4,cellKey:"0,0",
   manifestations:[{number:1,row:2,col:4}]}],
  home:[],score:RC01_START_SCORE,moves:0,homeCycles:0,fusions:0,
  homeTestPhase:{odd:"board",even:"board"},homeCooling:{},
  mutatron:{generation:0,energyReserve:48,dissipatedEnergy:0,resonance:{},symmetry:100,changes:[],
   lastNote:"Single-body centering diagnostic."},
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
/** Actual energy only; Mneme and past manifestations are NOT liquid. */
export const rcIntrinsic=(n:number)=>intrinsicEnergy(n,0);
export const rcTotalEnergy=(game:RCGame)=>
 [...game.pawns,...game.home].reduce((sum,p)=>sum+rcIntrinsic(p.number),
 game.mutatron.energyReserve+game.mutatron.dissipatedEnergy);
export const RC_NUCLEUS_COOLING_MOVES=2;
/** One level of intrinsic energy, not necessarily one polytronic number. */
export function rcNucleusRegression(n:number):number|null{
 if(!Number.isSafeInteger(n)||n<1)throw Error("Invalid number");
 if(n===1)return null;
 return (n-1)%5===0?n-5:n-1;
}
export function rcNucleusRecovery(n:number):number{
 const lower=rcNucleusRegression(n);
 return lower===null?0:rcIntrinsic(n)-rcIntrinsic(lower);
}
export type RCMoveAssessment={
 allowed:boolean;kind:"move"|"capture"|"nucleus"|"invalid";
 fieldDelta:number;reason:string
};
/** Shared pre-flight and commit predicate: no unaffordable physics flights. */
export function assessRCMove(
 game:RCGame,source:string,target:string,board:RCBoard
):RCMoveAssessment{
 const invalid=(reason:string):RCMoveAssessment=>({
  allowed:false,kind:"invalid",fieldDelta:0,reason});
 if(source===target||!board.cells.some(c=>c.key===target))
  return invalid("Choose a different tile.");
 const attacker=pawnAt(game,source);
 if(!attacker)return invalid("No Polytron at source.");
 const defender=pawnAt(game,target);
 if(target==="0,0"){
  if(defender)return invalid("The Nucleus must be empty.");
  const gain=rcNucleusRecovery(attacker.number);
  return gain?{allowed:true,kind:"nucleus",fieldDelta:gain,
   reason:"Nucleus: +"+gain+" E; two moves cooling."}:
   invalid("A Polytron #1 cannot enter the Nucleus.");
 }
 if(!defender)return {allowed:true,kind:"move",fieldDelta:0,
  reason:"Empty tile."};
 // Attacker adopts defender's number: the defender's original E
 // cancels against the attacker's new E. Only attacker-before minus
 // defender-regressed remains as recoverable/spendable Field energy.
 const delta=rcIntrinsic(attacker.number)-
  rcIntrinsic(rcHomeRegression(defender.number));
 if(game.mutatron.energyReserve+delta<0)
  return invalid("Capture needs "+(-delta)+" E; available "+
   game.mutatron.energyReserve+" E.");
 return {allowed:true,kind:"capture",fieldDelta:delta,
  reason:delta>=0?"Capture returns "+delta+" E.":
   "Capture costs "+(-delta)+" E."};
}
export function rcHomeCooldown(game:RCGame,seal:number):number{
 return Math.max(0,(game.homeCooling[String(seal)]??0)-game.homeCycles);
}
/** Ready Home Seals return to free tiles, starting at the outermost ring
 * and proceeding clockwise from north. In-flight destinations are reserved.
 * Stable Seal ordering makes concurrent returns reproducible.
 */
export function rcAutomaticHomeDestinations(
 game:RCGame,board:RCBoard,reserved:Iterable<string>=[],
 alreadyReturning:Iterable<number>=[]
):{seal:number;target:string}[]{
 const occupied=new Set([...game.pawns.map(p=>p.cellKey),...reserved]);
 const pending=new Set(alreadyReturning);
 const open=[...board.cells].filter(c=>!c.nucleus)
  .sort((a,b)=>b.ring-a.ring||a.idxInRing-b.idxInRing);
 const results:{seal:number;target:string}[]=[];
 for(const pawn of [...game.home].sort((a,b)=>a.seal-b.seal)){
  if(pending.has(pawn.seal)||rcHomeCooldown(game,pawn.seal)>0)continue;
  const cell=open.find(c=>!occupied.has(c.key));
  if(!cell)continue;
  occupied.add(cell.key);
  results.push({seal:pawn.seal,target:cell.key});
 }
 return results;
}
export function canRCReenter(game:RCGame,seal:number,target:string,board:RCBoard){
 return target!=="0,0"&&game.home.some(p=>p.seal===seal)&&
  rcHomeCooldown(game,seal)===0&&
  board.cells.some(c=>c.key===target)&&!pawnAt(game,target);
}
export function returnRCPawnToCell(
 game:RCGame,seal:number,target:string,board:RCBoard
):RCHomeArrivalResult|null{
 if(!canRCReenter(game,seal,target,board))return null;
 const incoming=game.home.find(p=>p.seal===seal)!;
 const updated:RCGame={...game,
  pawns:[...game.pawns,{...incoming,cellKey:target}],
  home:game.home.filter(p=>p.seal!==seal),
  homeCooling:Object.fromEntries(Object.entries(game.homeCooling)
   .filter(([key])=>key!==String(seal))),
  lastAction:"HOME REENTRY · "+pawnName(incoming)+" returns to "+
   rcCellCoordinatesForKey(board,target)+" without capture or energy cost."
 };
 updated.mutatron={...updated.mutatron,
  symmetry:rcBoardSymmetry(updated.pawns,board)};
 if(!validateRCGame(updated,board)||
    rcTotalEnergy(updated)!==rcTotalEnergy(game))
  throw Error("Invalid voluntary Home return");
 return {game:updated,attacker:{...incoming,cellKey:target},
  captured:null,target};
}
/**
 * Chromatica genetics: a palette has two independent alleles, Latin (row)
 * and Greek (col). Capture creates the two reciprocal recombinants;
 * selection favours the one best distinguished from the six immediate
 * neighbours of the capture cell (excluding both parents). Without
 * neighbours, the more contrasted two-endpoint gradient wins. Ties are
 * resolved by canonical palette index; the drop direction is irrelevant.
 */
export function rcSelectCapturedPalette(
 game:RCGame,attacker:RCPawn,defender:RCPawn,board:RCBoard
):{row:number;col:number}{
 const cell=board.cells.find(c=>c.key===defender.cellKey);
 if(!cell)throw Error("Missing capture cell");
 const neighbours=game.pawns.filter(p=>{
  if(p.seal===attacker.seal||p.seal===defender.seal)return false;
  const other=board.cells.find(c=>c.key===p.cellKey);
  return !!other&&rcRing(other.q-cell.q,other.r-cell.r)===1;
 });
 const midpoint=(row:number,col:number)=>{
  const pair=gradientPair(row,col);
  return mixColors(pair.primary.hex,pair.secondary.hex,.5);
 };
 const options=[{row:attacker.row,col:defender.col},
  {row:defender.row,col:attacker.col}];
 const ranked=options.map(candidate=>{
  const pair=gradientPair(candidate.row,candidate.col);
  const contrast=perceptualDistance(pair.primary.hex,pair.secondary.hex);
  const color=midpoint(candidate.row,candidate.col);
  const fitness=neighbours.length?
   neighbours.reduce((score,p)=>score+
    perceptualDistance(color,midpoint(p.row,p.col)),0)/neighbours.length:
   contrast;
  return {...candidate,fitness,contrast};
 }).sort((a,b)=>b.fitness-a.fitness||
  b.contrast-a.contrast||a.row-b.row||a.col-b.col);
 return {row:ranked[0].row,col:ranked[0].col};
}

/** One fusion rule shared by drag captures and Home return captures. */
function inheritManifestation(attacker:RCPawn,captured:RCPawn,target:string,
 game:RCGame,board:RCBoard){
 const regressed=rcHomeRegression(captured.number);
 const palette=rcSelectCapturedPalette(game,attacker,captured,board);
 const nextAttacker={...attacker,...palette,cellKey:target,number:captured.number};
 const nextDefender={...captured,cellKey:"",number:regressed};
 return {
  attacker:{...nextAttacker,manifestations:
   rcRecordManifestation(attacker.manifestations,nextAttacker)},
  defender:{...nextDefender,manifestations:
   rcRecordManifestation(captured.manifestations,nextDefender)}
 };
}
export type RCMoveResult={game:RCGame;captured:RCPawn|null;attacker:RCPawn};

/**
 * The physics layer resolves the same capture as before. ONLY after the
 * attacker has physically settled does this deterministic state transition
 * commit the fusion. No energy costs or ConwayDNA concatenation.
 */
export function moveRCPawn(
 game:RCGame,source:string,target:string,board:RCBoard
):RCMoveResult|null{
 const check=assessRCMove(game,source,target,board);
 if(!check.allowed)return null;
 const attacker=pawnAt(game,source)!;
 if(check.kind==="nucleus"){
  const lower=rcNucleusRegression(attacker.number)!;
  const cooled={...attacker,cellKey:"",number:lower,
   manifestations:rcRecordManifestation(attacker.manifestations,
    {...attacker,number:lower})};
  const updated:RCGame={...game,
   pawns:game.pawns.filter(p=>p.seal!==attacker.seal),
   home:[...game.home,cooled],
   homeCooling:{...game.homeCooling,
    [attacker.seal]:game.homeCycles+1+RC_NUCLEUS_COOLING_MOVES},
   moves:game.moves+1,homeCycles:game.homeCycles+1,
   mutatron:{...game.mutatron,
    energyReserve:game.mutatron.energyReserve+check.fieldDelta,
    symmetry:0},
   lastAction:"NUCLEUS · "+pawnName(attacker)+" #"+attacker.number+
    " → #"+lower+"; +"+check.fieldDelta+" field E; cool for two moves."
  };
  updated.mutatron.symmetry=rcBoardSymmetry(updated.pawns,board);
  if(!validateRCGame(updated,board)||
     rcTotalEnergy(updated)!==rcTotalEnergy(game))
   throw Error("Non-conservative nuclear dissociation");
  return {game:updated,captured:null,attacker};
 }
 const captured=pawnAt(game,target)??null;
 const fused=captured?inheritManifestation(attacker,captured,target,game,board):null;
 const pawns=game.pawns.filter(p=>p.seal!==captured?.seal)
  .map(p=>p.seal===attacker.seal?
   fused?.attacker??{...p,cellKey:target}:p);
 const home=fused?[...game.home,fused.defender]:game.home;
 const updated:RCGame={...game,pawns,home,
  homeCooling:captured?{...game.homeCooling,
   [captured.seal]:game.homeCycles+1+RC_NUCLEUS_COOLING_MOVES}:
   game.homeCooling,
  moves:game.moves+1,homeCycles:game.homeCycles+1,fusions:game.fusions+(captured?1:0),
  mutatron:{...game.mutatron,
   energyReserve:game.mutatron.energyReserve+check.fieldDelta,
   symmetry:0},
  lastAction:captured?
   "FUSION · "+pawnName(attacker)+" inherits #"+captured.number+
   " and palette "+pawnPalette(fused!.attacker).name+
   ". "+pawnName(captured)+" returns Home as #"+fused?.defender.number+
   ". Field "+(check.fieldDelta>=0?"+":"")+check.fieldDelta+" E.":
   pawnName(attacker)+" moves to cell "+rcCellCoordinatesForKey(board,target)+"."};
 updated.mutatron.symmetry=rcBoardSymmetry(updated.pawns,board);
 if(!validateRCGame(updated,board)||
    rcTotalEnergy(updated)!==rcTotalEnergy(game))
  throw Error("Non-conservative fusion");
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
  homeCooling:{...game.homeCooling,...Object.fromEntries(recalled.map(
   p=>[p.seal,game.homeCycles+RC_NUCLEUS_COOLING_MOVES]))},
  lastAction:"HOME TEST · "+recalled.length+" "+parity+
   " Polytrons recalled into their Home."
 };
 updated.mutatron={...updated.mutatron,
  symmetry:rcBoardSymmetry(updated.pawns,board)};
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
  .filter(p=>rcParity(p.seal)===parity&&
    (!returning||rcHomeCooldown(game,p.seal)===0))
   .sort((a,b)=>a.seal-b.seal);
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
 if(!incoming||rcHomeCooldown(game,seal)>0)return null;
 const target=openingCellKeyForSeal(seal);
 if(!board.cells.some(c=>c.key===target))return null;
 const captured=pawnAt(game,target)??null;
 const delta=captured?rcIntrinsic(incoming.number)-
  rcIntrinsic(rcHomeRegression(captured.number)):0;
 if(game.mutatron.energyReserve+delta<0)return null;
 const fused=captured?inheritManifestation(incoming,captured,target,game,board):null;
 const attacker=fused?.attacker??{...incoming,cellKey:target};
 const updated:RCGame={...game,
  pawns:[...game.pawns.filter(p=>p.seal!==captured?.seal),attacker],
  home:[...game.home.filter(p=>p.seal!==seal),
   ...(fused?[fused.defender]:[])],
  homeCooling:Object.fromEntries(Object.entries(game.homeCooling)
   .filter(([key])=>key!==String(seal)&&key!==String(captured?.seal))),
  moves:game.moves+1,homeCycles:game.homeCycles+1,
  fusions:game.fusions+(captured?1:0),
  mutatron:{...game.mutatron,
   energyReserve:game.mutatron.energyReserve+delta,symmetry:0},
  lastAction:captured?
   "HOME FUSION · "+pawnName(incoming)+" inherits #"+captured.number+
   " from "+pawnName(captured)+". Field "+
   (delta>=0?"+":"")+delta+" E.":
   "HOME RETURN · "+pawnName(incoming)+" returns to "+
    rcCellCoordinatesForKey(board,target)+"."
 };
 updated.mutatron.symmetry=rcBoardSymmetry(updated.pawns,board);
 if(!validateRCGame(updated,board)||
    rcTotalEnergy(updated)!==rcTotalEnergy(game))
  throw Error("Invalid or non-conservative Home arrival");
 return {game:updated,attacker,captured,target};
}

export function validateRCGame(game:RCGame,board:RCBoard):boolean{
 const cells=new Set(board.cells.map(c=>c.key));
 const occupied=new Set<string>(),seals=new Set<number>();
 if(!Array.isArray(game.pawns)||!Array.isArray(game.home)||
    !Number.isInteger(game.moves)||game.moves<0||
    !Number.isInteger(game.homeCycles)||game.homeCycles<0||
    !Number.isInteger(game.fusions)||game.fusions<0||
    game.fusions>game.moves||
    !game.mutatron||!Number.isSafeInteger(game.mutatron.generation)||
    !Number.isSafeInteger(game.mutatron.energyReserve)||
    game.mutatron.energyReserve<0||
    !Number.isSafeInteger(game.mutatron.dissipatedEnergy)||
    game.mutatron.dissipatedEnergy<0||
    !game.homeCooling||!Object.entries(game.homeCooling).every(
     ([seal,m])=>Number.isInteger(Number(seal))&&
      Number.isInteger(m)&&m>=0&&
      game.home.some(p=>p.seal===Number(seal)))||
    game.mutatron.generation<0||
    !Number.isFinite(game.mutatron.symmetry)||
    game.mutatron.symmetry<0||game.mutatron.symmetry>100||
    !game.mutatron.resonance||!Array.isArray(game.mutatron.changes)||
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
      !p.manifestations.every(m=>m&&
       Number.isSafeInteger(m.number)&&m.number>0&&
       Number.isInteger(m.row)&&m.row>=0&&m.row<12&&
       Number.isInteger(m.col)&&m.col>=0&&m.col<12)||
      p.manifestations.some((m,i)=>i>0&&
       m.number===p.manifestations[i-1].number&&
       m.row===p.manifestations[i-1].row&&
       m.col===p.manifestations[i-1].col)||
      p.manifestations[p.manifestations.length-1].number!==p.number||
      p.manifestations[p.manifestations.length-1].row!==p.row||
      p.manifestations[p.manifestations.length-1].col!==p.col)return false;
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
