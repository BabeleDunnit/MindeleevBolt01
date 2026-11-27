/**
 * Curated, reproducible requests and responses for blinded human assessment.
 *
 * The six questions come unmodified from the artistic Kaleidoscope generator.
 * Four two-dimensional placement grammars are compared within each question.
 * They all use three Polytrons of identical polytronic number (hence identical
 * committed ENERGY); the fourth changes ONLY their palette.
 *
 * Human grades must NEVER be used to change the current scoring algorithm here.
 */
import type {KaleidoLayout,KaleidoPoint} from "@/polytron/kaleidoscopeGenerator";
import type {ResonancePawn} from "@/polytron/resonanceField";
import {rcRingCells,rcKey} from "@/polytron/rc01Board";

export const RESONANCE_REVIEW_VERSION=1 as const;
export type ReviewAnswerId="1"|"2"|"3"|"4";
export type ResonanceReviewAnswer={
 id:ReviewAnswerId;
 /** Methodological explanation, deliberately NOT shown before voting. */
 method:string;
 pawns:ResonancePawn[];
};
const ringKey=(ring:number,index:number)=>{
 const cells=rcRingCells(ring);
 const cell=cells[index];
 if(!cell)throw Error("Invalid resonance review ring index");
 return rcKey(cell.q,cell.r);
};
export function buildResonanceReviewAnswers(layout:KaleidoLayout):
 ResonanceReviewAnswer[]{
 const radius=layout.params.radius;
 if(radius<2)throw Error("Calibration answers require a radius of at least two");
 const ring=radius>=4?3:radius===3?2:1;
 const hint=layout.tiles.find(t=>t.ring===ring)??layout.tiles[0];
 if(!hint)throw Error("Calibration question has no hints");
 const number=hint.number;
 const row=hint.paletteRow,col=hint.paletteCol;
 const triplet=[0,2*ring,4*ring].map(i=>ringKey(ring,i));
 const offset=[triplet[0],triplet[1],ringKey(ring+1,4*(ring+1))];
 const clustered=[0,1,2].map(i=>ringKey(ring,i));
 const toPawns=(keys:string[],paletteRow=row,paletteCol=col):
  ResonancePawn[]=>keys.map(key=>({
   key,number,paletteRow,paletteCol
  }));
 const answers:ResonanceReviewAnswer[]=[
  {
   id:"1",method:"Tre Polytroni distribuiti ogni 120° sullo stesso anello.",
   pawns:toPawns(triplet)
  },
  {
   id:"2",method:"Stessi Polytroni: uno spostato su un anello più esterno.",
   pawns:toPawns(offset)
  },
  {
   id:"3",method:"Stessi Polytroni: tre posizioni consecutive, ravvicinate.",
   pawns:toPawns(clustered)
  },
  {
   id:"4",method:"Stesse posizioni simmetriche della risposta 1, con palette alternativa.",
   pawns:toPawns(triplet,(row+6)%12,(col+6)%12)
  }
 ];
 const playable=new Set(layout.cells.filter(c=>c.ring>0).map(c=>c.key));
 for(const answer of answers){
  if(answer.pawns.length!==3||new Set(answer.pawns.map(p=>p.key)).size!==3||
   answer.pawns.some(p=>!playable.has(p.key)))
   throw Error("Invalid sample response "+answer.id);
 }
 return answers;
}
/** Use a stable 1-based ID; keep old recordings interpretable. */
export function reviewCaseId(presetId:string,answerId:ReviewAnswerId){
 return presetId+"-"+answerId;
}
