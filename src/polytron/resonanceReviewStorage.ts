/**
 * Private, device-local human calibration ratings.
 * No database, server or tracking: localStorage plus user-owned JSON exports.
 */
export const RESONANCE_REVIEW_STORAGE_KEY="mindeleev.resonance-review.v1";
export const RESONANCE_REVIEW_FORMAT="mindeleev.resonance-review";
export type ResonanceReviewRating={
 beauty:number|null;
 fit:number|null;
 note:string;
 savedAt:string;
};
export type ResonanceReviewRatings=Record<string,ResonanceReviewRating>;
export type ResonanceReviewArchive={
 format:typeof RESONANCE_REVIEW_FORMAT;
 version:1;
 ratings:ResonanceReviewRatings;
};
const between0and10=(v:unknown)=>typeof v==="number"&&
 Number.isInteger(v)&&v>=0&&v<=10;
const asObject=(x:unknown):Record<string,unknown>=>{
 if(typeof x!=="object"||x===null||Array.isArray(x))
  throw Error("Formato non valido: oggetto atteso");
 return x as Record<string,unknown>;
};
/** Strict import validation: an old or malformed export cannot corrupt votes. */
export function parseResonanceReviewArchive(input:unknown):
 ResonanceReviewArchive{
 const root=asObject(input);
 if(root.format!==RESONANCE_REVIEW_FORMAT||root.version!==1)
  throw Error("File incompatibile con la versione 1 del laboratorio");
 const source=asObject(root.ratings);
 const ratings:ResonanceReviewRatings={};
 for(const [key,value] of Object.entries(source)){
  if(!/^[A-I]-[1-4]$/.test(key))
   throw Error("Identificativo di valutazione sconosciuto: "+key);
  const rating=asObject(value);
  if(rating.beauty!==null&&!between0and10(rating.beauty))
   throw Error("Gradevolezza non valida per "+key);
  if(rating.fit!==null&&!between0and10(rating.fit))
   throw Error("Appropriatezza non valida per "+key);
  if(rating.beauty===null&&rating.fit===null)
   throw Error("Valutazione vuota per "+key);
  if(typeof rating.note!=="string"||rating.note.length>2000)
   throw Error("Nota non valida per "+key);
  if(typeof rating.savedAt!=="string"||rating.savedAt.length>80||
   !Number.isFinite(Date.parse(rating.savedAt)))
   throw Error("Data non valida per "+key);
  ratings[key]={
   beauty:rating.beauty as number|null,
   fit:rating.fit as number|null,
   note:rating.note,
   savedAt:rating.savedAt
  };
 }
 return {format:RESONANCE_REVIEW_FORMAT,version:1,ratings};
}
export function makeResonanceReviewArchive(
 ratings:ResonanceReviewRatings
):ResonanceReviewArchive{
 return parseResonanceReviewArchive({
  format:RESONANCE_REVIEW_FORMAT,version:1,ratings
 });
}
