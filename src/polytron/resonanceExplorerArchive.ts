/**
 * Local-only research archive. Explicit v2 schema avoids mixing old 0-10 votes
 * with new pairwise preferences. JSON is portable; nothing is sent to servers.
 */
import {
 KALEIDOSCOPE_FAMILIES,KALEIDOSCOPE_SYMMETRIES,
 generateKaleidoscope,type KaleidoParams
} from "@/polytron/kaleidoscopeGenerator";
import {
 validateExplorerComposition,type ExplorerComposition
} from "@/polytron/resonanceCompositionExplorer";

export const EXPLORER_STORAGE_KEY="mindeleev.resonance-explorer.v2";
export const EXPLORER_ARCHIVE_FORMAT="mindeleev.resonance-explorer";
export type ExplorerPreference="A"|"B"|"pari"|"nessuna"|"incerto";
export type ExplorerVerdict={
 beauty:ExplorerPreference;fit:ExplorerPreference;note:string
};
export type ExplorerComparison={
 id:string;createdAt:string;question:KaleidoParams;
 a:ExplorerComposition;b:ExplorerComposition;verdict:ExplorerVerdict
};
export type ExplorerFavorite={
 id:string;createdAt:string;label:string;
 question:KaleidoParams;composition:ExplorerComposition
};
export type ExplorerArchive={
 format:typeof EXPLORER_ARCHIVE_FORMAT;version:2;
 comparisons:ExplorerComparison[];favorites:ExplorerFavorite[]
};
export const emptyExplorerArchive=():ExplorerArchive=>({
 format:EXPLORER_ARCHIVE_FORMAT,version:2,comparisons:[],favorites:[]
});
const object=(value:unknown):Record<string,unknown>=>{
 if(!value||typeof value!=="object"||Array.isArray(value))
  throw Error("Struttura dell'archivio non valida");
 return value as Record<string,unknown>;
};
const text=(value:unknown,max:number)=>{
 if(typeof value!=="string"||value.length>max)
  throw Error("Testo non valido");
 return value;
};
const date=(v:unknown)=>{
 const s=text(v,80);
 if(!Number.isFinite(Date.parse(s)))throw Error("Data non valida");
 return s;
};
const id=(v:unknown)=>{
 const s=text(v,80);
 if(!/^[a-zA-Z0-9._:-]+$/.test(s))throw Error("Identificativo non valido");
 return s;
};
function question(raw:unknown):KaleidoParams{
 const x=object(raw);
 const radius=x.radius,seed=x.seed,generation=x.generation;
 if(!Number.isInteger(radius)||Number(radius)<2||Number(radius)>5||
  !KALEIDOSCOPE_FAMILIES.includes(x.family as never)||
  !KALEIDOSCOPE_SYMMETRIES.includes(x.symmetry as never)||
  !Number.isSafeInteger(seed)||Number(seed)<0||Number(seed)>2147483647||
  generation!==0)
  throw Error("Ricetta della domanda non valida");
 return {
  radius:radius as number,family:x.family as KaleidoParams["family"],
  symmetry:x.symmetry as KaleidoParams["symmetry"],
  seed:seed as number,generation:0
 };
}
function composition(raw:unknown,params:KaleidoParams):ExplorerComposition{
 const x=object(raw);
 if(!Array.isArray(x.pawns))throw Error("Polytroni non validi");
 const pawns=x.pawns.map(v=>{
  const p=object(v);
  return {key:text(p.key,40),number:p.number as number,
   paletteRow:p.paletteRow as number,paletteCol:p.paletteCol as number};
 });
 const target=generateKaleidoscope(params);
 if(!validateExplorerComposition(target,pawns))
  throw Error("Polytroni fuori dal Mutatron o attributi non validi");
 const style=text(x.style,50);
 const provenance=text(x.provenance,200);
 return {pawns,style:style as ExplorerComposition["style"],provenance};
}
const preference=(v:unknown):ExplorerPreference=>{
 if(v==="A"||v==="B"||v==="pari"||v==="nessuna"||v==="incerto")
  return v;
 throw Error("Preferenza non valida");
};
export function parseExplorerArchive(raw:unknown):ExplorerArchive{
 const x=object(raw);
 if(x.format!==EXPLORER_ARCHIVE_FORMAT||x.version!==2)
  throw Error("Archivio incompatibile: serve il formato Explorer v2");
 if(!Array.isArray(x.comparisons)||!Array.isArray(x.favorites)||
  x.comparisons.length>3000||x.favorites.length>1000)
  throw Error("Collezioni mancanti o troppo grandi");
 const seen=new Set<string>();
 const comparisons:ExplorerComparison[]=x.comparisons.map(item=>{
  const v=object(item),key=id(v.id),q=question(v.question);
  if(seen.has(key))throw Error("ID duplicato");
  seen.add(key);
  const verdict=object(v.verdict);
  return {
   id:key,createdAt:date(v.createdAt),question:q,
   a:composition(v.a,q),b:composition(v.b,q),
   verdict:{beauty:preference(verdict.beauty),fit:preference(verdict.fit),
    note:text(verdict.note,2000)}
  };
 });
 const favorites:ExplorerFavorite[]=x.favorites.map(item=>{
  const v=object(item),key=id(v.id),q=question(v.question);
  if(seen.has(key))throw Error("ID duplicato");
  seen.add(key);
  return {id:key,createdAt:date(v.createdAt),
   label:text(v.label,100),question:q,
   composition:composition(v.composition,q)};
 });
 return {format:EXPLORER_ARCHIVE_FORMAT,version:2,comparisons,favorites};
}
export function archiveExplorerData(
 comparisons:ExplorerComparison[],favorites:ExplorerFavorite[]
):ExplorerArchive{
 return parseExplorerArchive({
  format:EXPLORER_ARCHIVE_FORMAT,version:2,comparisons,favorites
 });
}
