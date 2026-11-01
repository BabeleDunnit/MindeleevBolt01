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
 /** Original descriptive name, not an official Pantone designation. */
 shadeName:string;
};
export const LATIN_SOURCES:readonly NamedColor[]=[
 {id:"niger",name:"Niger",hex:"#28232b",italian:"nero",shadeName:"Ebano notturno"},
 {id:"albus",name:"Albus",hex:"#e6e0da",italian:"avorio",shadeName:"Avorio pergamena"},
 {id:"ruber",name:"Ruber",hex:"#d04355",italian:"rosso cremisi",shadeName:"Rosso cinabro"},
 {id:"fulvus",name:"Fulvus",hex:"#c57545",italian:"arancio fulvo",shadeName:"Ambra ramata"},
 {id:"aureus",name:"Aureus",hex:"#d8b44e",italian:"oro",shadeName:"Oro antico"},
 {id:"flavus",name:"Flavus",hex:"#e6d85d",italian:"giallo",shadeName:"Giallo zafferano"},
 {id:"viridis",name:"Viridis",hex:"#37a477",italian:"verde",shadeName:"Verde giada"},
 {id:"caesius",name:"Caesius",hex:"#51b1bd",italian:"turchese",shadeName:"Turchese laguna"},
 {id:"caeruleus",name:"Caeruleus",hex:"#3677c0",italian:"blu",shadeName:"Blu lapislazzuli"},
 {id:"purpureus",name:"Purpureus",hex:"#875ab4",italian:"viola",shadeName:"Viola ametista"},
 {id:"roseus",name:"Roseus",hex:"#ea8fab",italian:"rosa",shadeName:"Rosa quarzo"},
 {id:"canus",name:"Canus",hex:"#909aa7",italian:"grigio",shadeName:"Grigio ardesia"}
] as const;
export const GREEK_DESTINATIONS:readonly NamedColor[]=[
 {id:"melas",name:"Melas",hex:"#06132a",italian:"nero",script:"Μέλας",shadeName:"Ossidiana"},
 {id:"leukos",name:"Leukos",hex:"#ffffef",italian:"bianco",script:"Λευκός",shadeName:"Porcellana chiara"},
 {id:"erythros",name:"Erythros",hex:"#b0273f",italian:"rosso",script:"Ἐρυθρός",shadeName:"Rosso granato"},
 {id:"pyrrhos",name:"Pyrrhos",hex:"#ee854a",italian:"rosso fuoco",script:"Πυρρός",shadeName:"Arancio lava"},
 {id:"chrysos",name:"Chrysos",hex:"#ffc17f",italian:"oro",script:"Χρυσός",shadeName:"Oro solare"},
 {id:"xanthos",name:"Xanthos",hex:"#fff48f",italian:"giallo",script:"Ξανθός",shadeName:"Giallo miele"},
 {id:"chloros",name:"Chloros",hex:"#8bc84d",italian:"gialloverde",script:"Χλωρός",shadeName:"Verde cedro"},
 {id:"glaukos",name:"Glaukos",hex:"#84c9ca",italian:"azzurro mare",script:"Γλαυκός",shadeName:"Azzurro opale"},
 {id:"kyanos",name:"Kyanos",hex:"#275ba7",italian:"blu profondo",script:"Κυανός",shadeName:"Blu cobalto"},
 {id:"porphyra",name:"Porphyra",hex:"#893597",italian:"porpora",script:"Πορφύρα",shadeName:"Porpora imperiale"},
 {id:"rhodon",name:"Rhodon",hex:"#dd6b95",italian:"rosa",script:"Ῥόδον",shadeName:"Rosa corallo"},
 {id:"phaios",name:"Phaios",hex:"#747c8a",italian:"grigio",script:"Φαιός",shadeName:"Grigio fumo"}
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

/** Threshold in ΔE_OK = 100 × Euclidean distance in OKLab (not CIEDE2000). */
export const MIN_ENDPOINT_DISTANCE=8;

/** Convert an sRGB hex endpoint to OKLab (D65). */
const srgbLinear=(v:number)=>{
 const c=v/255;
 return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;
};
export function oklab(hex:string):readonly [number,number,number]{
 const [r,g,b]=components(hex).map(srgbLinear);
 const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b);
 const m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b);
 const s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
 return [
  .2104542553*l+.793617785*m-.0040720468*s,
  1.9779984951*l-2.428592205*m+.4505937099*s,
  .0259040371*l+.7827717662*m-.808675766*s
 ];
}
export const perceptualDistance=(start:string,end:string):number=>{
 const a=oklab(start),b=oklab(end);
 return 100*Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
};

/**
 * This is a REPORT, not a runtime endpoint correction: all 24 named endpoint
 * colors are preselected so all 12 × 12 pairs meet the minimum 8-unit
 * perceptual distance. The actual palette stays EXACTLY on the line joining
 * its two endpoints: no bending, lightness bumps, or hidden adaptations.
 */
export function auditGradientMatrix(){
 const combinations=ALL_GRADIENTS.map(pair=>({
  id:pair.id,
  name:pair.name,
  distance:perceptualDistance(pair.primary.hex,pair.secondary.hex)
 }));
 const sorted=[...combinations].sort((a,b)=>a.distance-b.distance);
 return {
  total:combinations.length,
  threshold:MIN_ENDPOINT_DISTANCE,
  minimum:sorted[0]?.distance??NaN,
  belowThreshold:combinations.filter(p=>p.distance<MIN_ENDPOINT_DISTANCE).length,
  closest:sorted
 };
}

export function gradientPaletteExport(pair:GradientPair,highContrastSteps:QuantizationSteps=8){
 const {hex:start}=pair.primary,{hex:end}=pair.secondary;
 return {id:pair.id,name:pair.name,
  primary:{name:pair.primary.name,shadeName:pair.primary.shadeName,hex:start},
  secondary:{name:pair.secondary.name,shadeName:pair.secondary.shadeName,hex:end},
  perceptualDistance:perceptualDistance(start,end),
  continuous:{from:start,to:end},
  steps3:quantizedGradient(start,end,3),
  steps5:quantizedGradient(start,end,5),
  steps8:quantizedGradient(start,end,8),
  flipped:{steps:highContrastSteps,
   positions:HIGH_CONTRAST_POSITIONS.slice(0,highContrastSteps),
   colors:flippedGradient(start,end,highContrastSteps)}};
}
export const exportGradientMatrix=(highContrastSteps:QuantizationSteps=8)=>
 ({version:2,method:"sRGB channel interpolation",metric:"ΔE_OK × 100",
  minimumEndpointDistance:MIN_ENDPOINT_DISTANCE,
  audit:auditGradientMatrix(),orientation:{
  rows:"Latin source",columns:"Greek destination"},
  highContrastOrder:"start, end, 80% start, 80% end, 60% start, 60% end, 90% start, 90% end",
  sources:LATIN_SOURCES,destinations:GREEK_DESTINATIONS,
  palettes:ALL_GRADIENTS.map(pair=>gradientPaletteExport(pair,highContrastSteps))});
