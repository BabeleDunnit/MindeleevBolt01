/**
 * Sprint 37 · Standalone gradient-palette research.
 *
 * These are twelve artist-curated RGB endpoints on each axis, with evocative
 * Latin (source) and transliterated Greek (destination) color names.
 * Spellings are design nomenclature rather than a claim of philological
 * one-to-one equivalence. Nothing here changes the Polytron palette codec.
 *
 * Interpolation is in gamma-encoded sRGB, matching CSS linear-gradient's
 * default color interpolation. All quantizations sample the SAME line.
 */
export type NamedColor={
 id:string;name:string;hex:`#${string}`;italian:string;script?:string;
};
export const LATIN_SOURCES:readonly NamedColor[]=[
 {id:"niger",name:"Niger",hex:"#191c2b",italian:"nero"},
 {id:"albus",name:"Albus",hex:"#f1eee3",italian:"avorio"},
 {id:"ruber",name:"Ruber",hex:"#c93d50",italian:"rosso cremisi"},
 {id:"fulvus",name:"Fulvus",hex:"#cc7846",italian:"arancio fulvo"},
 {id:"aureus",name:"Aureus",hex:"#dfb657",italian:"oro"},
 {id:"flavus",name:"Flavus",hex:"#ecda68",italian:"giallo"},
 {id:"viridis",name:"Viridis",hex:"#37a477",italian:"verde"},
 {id:"caesius",name:"Caesius",hex:"#55b3be",italian:"turchese"},
 {id:"caeruleus",name:"Caeruleus",hex:"#3474bd",italian:"blu"},
 {id:"purpureus",name:"Purpureus",hex:"#8853ae",italian:"viola"},
 {id:"roseus",name:"Roseus",hex:"#e98daa",italian:"rosa"},
 {id:"canus",name:"Canus",hex:"#909aa7",italian:"grigio"}
] as const;
export const GREEK_DESTINATIONS:readonly NamedColor[]=[
 {id:"melas",name:"Melas",hex:"#161b2b",italian:"nero",script:"Μέλας"},
 {id:"leukos",name:"Leukos",hex:"#f7f2e6",italian:"bianco",script:"Λευκός"},
 {id:"erythros",name:"Erythros",hex:"#b72d43",italian:"rosso",script:"Ἐρυθρός"},
 {id:"pyrrhos",name:"Pyrrhos",hex:"#e78249",italian:"rosso fuoco",script:"Πυρρός"},
 {id:"chrysos",name:"Chrysos",hex:"#f4c967",italian:"oro",script:"Χρυσός"},
 {id:"xanthos",name:"Xanthos",hex:"#f4e06d",italian:"giallo",script:"Ξανθός"},
 {id:"chloros",name:"Chloros",hex:"#8bc84d",italian:"gialloverde",script:"Χλωρός"},
 {id:"glaukos",name:"Glaukos",hex:"#81c7c9",italian:"azzurro mare",script:"Γλαυκός"},
 {id:"kyanos",name:"Kyanos",hex:"#285eaa",italian:"blu profondo",script:"Κυανός"},
 {id:"porphyra",name:"Porphyra",hex:"#893e9d",italian:"porpora",script:"Πορφύρα"},
 {id:"rhodon",name:"Rhodon",hex:"#de6d96",italian:"rosa",script:"Ῥόδον"},
 {id:"phaios",name:"Phaios",hex:"#747c8a",italian:"grigio",script:"Φαιός"}
] as const;
export const QUANTIZATION_STEPS=[3,5,8] as const;
export type QuantizationSteps=3|5|8;
export type GradientPair={
 id:string;name:string;primary:NamedColor;secondary:NamedColor;
};
const validHex=(value:string)=>/^#[0-9a-f]{6}$/i.test(value);
const asHex=(rgb:number[])=>"#"+rgb.map(v=>Math.round(v).toString(16).padStart(2,"0")).join("");
const components=(hex:string):number[]=>{
 if(!validHex(hex))throw new Error("Expected #rrggbb: "+hex);
 return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
};
export const mixColors=(start:string,end:string,t:number):string=>{
 if(!Number.isFinite(t)||t<0||t>1)throw new Error("Mix percentage must be between 0 and 1");
 const a=components(start),b=components(end);
 return asHex(a.map((value,i)=>value+(b[i]-value)*t));
};
export const gradientCss=(start:string,end:string):string=>{
 if(!validHex(start)||!validHex(end))throw new Error("Invalid gradient endpoints");
 return `linear-gradient(90deg, ${start} 0%, ${end} 100%)`;
};
/** N equal-width color blocks, containing both endpoints. */
export const quantizedGradient=(start:string,end:string,steps:number):string[]=>{
 if(!Number.isInteger(steps)||steps<2||steps>256)
  throw new Error("Quantization requires 2–256 steps");
 return Array.from({length:steps},(_,i)=>mixColors(start,end,i/(steps-1)));
};
/**
 * High-contrast alternating band order:
 * 8 slots = [source, destination, 80/20, 20/80, 60/40, 40/60,
 *            90/10, 10/90].
 * The first two always expose the endpoints; the next two are exactly the
 * 80%-20% pair requested. A 3- or 5-slot version uses the same prefix.
 */
export const HIGH_CONTRAST_POSITIONS=[0,1,.2,.8,.4,.6,.1,.9] as const;
export const flippedGradient=(start:string,end:string,steps:QuantizationSteps=8):string[]=>{
 return HIGH_CONTRAST_POSITIONS.slice(0,steps).map(t=>mixColors(start,end,t));
};
export const gradientPair=(row:number,column:number):GradientPair=>{
 const primary=LATIN_SOURCES[row],secondary=GREEK_DESTINATIONS[column];
 if(!primary||!secondary)throw new Error("Invalid gradient position");
 return {id:`${primary.id}-${secondary.id}`,
  name:`${primary.name} ${secondary.name}`,primary,secondary};
};
export const ALL_GRADIENTS:readonly GradientPair[]=LATIN_SOURCES.flatMap((_,row)=>
 GREEK_DESTINATIONS.map((_,column)=>gradientPair(row,column)));
export function gradientPaletteExport(pair:GradientPair,highContrastSteps:QuantizationSteps=8){
 const {hex:start}=pair.primary,{hex:end}=pair.secondary;
 return {id:pair.id,name:pair.name,
  primary:{name:pair.primary.name,hex:start},
  secondary:{name:pair.secondary.name,hex:end},
  continuous:{from:start,to:end},
  steps3:quantizedGradient(start,end,3),
  steps5:quantizedGradient(start,end,5),
  steps8:quantizedGradient(start,end,8),
  flipped:{steps:highContrastSteps,
   positions:HIGH_CONTRAST_POSITIONS.slice(0,highContrastSteps),
   colors:flippedGradient(start,end,highContrastSteps)}};
}
export const exportGradientMatrix=(highContrastSteps:QuantizationSteps=8)=>
 ({version:1,method:"sRGB channel interpolation",orientation:{
  rows:"Latin source",columns:"Greek destination"},
  highContrastOrder:"start, end, 80% start, 80% end, 60% start, 60% end, 90% start, 90% end",
  sources:LATIN_SOURCES,destinations:GREEK_DESTINATIONS,
  palettes:ALL_GRADIENTS.map(pair=>gradientPaletteExport(pair,highContrastSteps))});
