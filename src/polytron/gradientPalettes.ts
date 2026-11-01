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
 /** Original descriptive shade name, NOT an official Pantone designation. */
 shadeName:string;
};
export const LATIN_SOURCES:readonly NamedColor[]=[
 {id:"niger",name:"Niger",hex:"#191c2b",italian:"nero",shadeName:"Ebano notturno"},
 {id:"albus",name:"Albus",hex:"#f1eee3",italian:"avorio",shadeName:"Avorio pergamena"},
 {id:"ruber",name:"Ruber",hex:"#c93d50",italian:"rosso cremisi",shadeName:"Rosso cinabro"},
 {id:"fulvus",name:"Fulvus",hex:"#cc7846",italian:"arancio fulvo",shadeName:"Ambra ramata"},
 {id:"aureus",name:"Aureus",hex:"#dfb657",italian:"oro",shadeName:"Oro antico"},
 {id:"flavus",name:"Flavus",hex:"#ecda68",italian:"giallo",shadeName:"Giallo zafferano"},
 {id:"viridis",name:"Viridis",hex:"#37a477",italian:"verde",shadeName:"Verde giada"},
 {id:"caesius",name:"Caesius",hex:"#55b3be",italian:"turchese",shadeName:"Turchese laguna"},
 {id:"caeruleus",name:"Caeruleus",hex:"#3474bd",italian:"blu",shadeName:"Blu lapislazzuli"},
 {id:"purpureus",name:"Purpureus",hex:"#8853ae",italian:"viola",shadeName:"Viola ametista"},
 {id:"roseus",name:"Roseus",hex:"#e98daa",italian:"rosa",shadeName:"Rosa quarzo"},
 {id:"canus",name:"Canus",hex:"#909aa7",italian:"grigio",shadeName:"Grigio ardesia"}
] as const;
export const GREEK_DESTINATIONS:readonly NamedColor[]=[
 {id:"melas",name:"Melas",hex:"#161b2b",italian:"nero",script:"Μέλας",shadeName:"Ossidiana"},
 {id:"leukos",name:"Leukos",hex:"#f7f2e6",italian:"bianco",script:"Λευκός",shadeName:"Porcellana chiara"},
 {id:"erythros",name:"Erythros",hex:"#b72d43",italian:"rosso",script:"Ἐρυθρός",shadeName:"Rosso granato"},
 {id:"pyrrhos",name:"Pyrrhos",hex:"#e78249",italian:"rosso fuoco",script:"Πυρρός",shadeName:"Arancio lava"},
 {id:"chrysos",name:"Chrysos",hex:"#f4c967",italian:"oro",script:"Χρυσός",shadeName:"Oro solare"},
 {id:"xanthos",name:"Xanthos",hex:"#f4e06d",italian:"giallo",script:"Ξανθός",shadeName:"Giallo miele"},
 {id:"chloros",name:"Chloros",hex:"#8bc84d",italian:"gialloverde",script:"Χλωρός",shadeName:"Verde cedro"},
 {id:"glaukos",name:"Glaukos",hex:"#81c7c9",italian:"azzurro mare",script:"Γλαυκός",shadeName:"Azzurro opale"},
 {id:"kyanos",name:"Kyanos",hex:"#285eaa",italian:"blu profondo",script:"Κυανός",shadeName:"Blu cobalto"},
 {id:"porphyra",name:"Porphyra",hex:"#893e9d",italian:"porpora",script:"Πορφύρα",shadeName:"Porpora imperiale"},
 {id:"rhodon",name:"Rhodon",hex:"#de6d96",italian:"rosa",script:"Ῥόδον",shadeName:"Rosa corallo"},
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

/**
 * A perceptual diagnostic in OKLab. ΔE_OK = 100 × Euclidean OKLab distance.
 * This is NOT ΔE2000/CIELAB. Use it to find nearly indistinguishable
 * endpoints before allocating three, five or eight discrete face colors.
 */
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
export const perceptualDistance=(a:string,b:string)=>{
 const x=oklab(a),y=oklab(b);
 return 100*Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2]);
};
/**
 * In an 8-color straight ramp, endpoint ΔE_OK < 18 gives an average
 * step smaller than 2.6 units. This flags a DESIGN risk, not a proven
 * psychophysical detection threshold (display/context dependent).
 */
export const LOW_CONTRAST_LIMIT=18;
export const CRITICAL_CONTRAST_LIMIT=10;
export type ContrastGrade="critical"|"soft"|"clear";
export function contrastGrade(start:string,end:string):ContrastGrade{
 const delta=perceptualDistance(start,end);
 return delta<CRITICAL_CONTRAST_LIMIT?"critical":
  delta<LOW_CONTRAST_LIMIT?"soft":"clear";
}
/**
 * Chromatica's optional "movement" is a curved lightness excursion.
 * Unlike replacing the named endpoints, this keeps both endpoints EXACT:
 * the midpoint gently moves towards white (dark inks) or black (light
 * pigments), returning to the destination at t=1.
 *
 * For pairs ΔE_OK >= 18 it is identically the original linear gradient.
 * The curved path is an artistic experiment, NOT a claim that each of its
 * 8 adjacent steps is distinguishable in every viewing condition.
 */
export function adaptiveGradientColor(start:string,end:string,t:number):string{
 const base=mixColors(start,end,t);
 const delta=perceptualDistance(start,end);
 if(delta>=LOW_CONTRAST_LIMIT||t<=0||t>=1)return base;
 const l=(oklab(start)[0]+oklab(end)[0])/2;
 const target=l>=.64?"#101010":"#ffffff";
 const influence=.28*Math.pow((LOW_CONTRAST_LIMIT-delta)/LOW_CONTRAST_LIMIT,.65)*Math.sin(Math.PI*t);
 return mixColors(base,target,influence);
}
export const adaptiveQuantization=(start:string,end:string,steps:number,enabled=true):string[]=>{
 if(!Number.isInteger(steps)||steps<2||steps>256)
  throw new Error("Quantization requires 2–256 steps");
 return Array.from({length:steps},(_,i)=>enabled?
  adaptiveGradientColor(start,end,i/(steps-1)):
  mixColors(start,end,i/(steps-1)));
};
export const adaptiveFlipped=(start:string,end:string,steps:QuantizationSteps=8,enabled=true):string[]=>
 HIGH_CONTRAST_POSITIONS.slice(0,steps).map(t=>enabled?
  adaptiveGradientColor(start,end,t):mixColors(start,end,t));
export const adaptiveGradientCss=(start:string,end:string,enabled=true):string=>{
 if(!enabled||contrastGrade(start,end)==="clear")return gradientCss(start,end);
 return "linear-gradient(90deg, "+
  Array.from({length:17},(_,i)=>{
   const t=i/16;return adaptiveGradientColor(start,end,t)+" "+(t*100).toFixed(2)+"%";
  }).join(", ")+")";
};
export const gradientAudit=()=>{
 const rows=ALL_GRADIENTS.map(pair=>({
  id:pair.id,name:pair.name,
  distance:perceptualDistance(pair.primary.hex,pair.secondary.hex),
  grade:contrastGrade(pair.primary.hex,pair.secondary.hex)
 }));
 return {
  total:rows.length,
  critical:rows.filter(r=>r.grade==="critical").length,
  soft:rows.filter(r=>r.grade==="soft").length,
  clear:rows.filter(r=>r.grade==="clear").length,
  closest:[...rows].sort((a,b)=>a.distance-b.distance)
 };
};

export function gradientPaletteExport(pair:GradientPair,highContrastSteps:QuantizationSteps=8,adaptive=false){
 const {hex:start}=pair.primary,{hex:end}=pair.secondary;
 return {id:pair.id,name:pair.name,
  primary:{name:pair.primary.name,shadeName:pair.primary.shadeName,hex:start},
  secondary:{name:pair.secondary.name,shadeName:pair.secondary.shadeName,hex:end},
  contrast:{metric:"OKLab Euclidean × 100",distance:perceptualDistance(start,end),grade:contrastGrade(start,end)},
  adaptive,
  continuous:{from:start,to:end,css:adaptiveGradientCss(start,end,adaptive)},
  steps3:adaptiveQuantization(start,end,3,adaptive),
  steps5:adaptiveQuantization(start,end,5,adaptive),
  steps8:adaptiveQuantization(start,end,8,adaptive),
  flipped:{steps:highContrastSteps,
   positions:HIGH_CONTRAST_POSITIONS.slice(0,highContrastSteps),
   colors:adaptiveFlipped(start,end,highContrastSteps,adaptive)}};
}
export const exportGradientMatrix=(highContrastSteps:QuantizationSteps=8,adaptive=false)=>
 ({version:2,method:"sRGB channel interpolation",contrastMethod:"OKLab Euclidean × 100",adaptive,
  contrastAudit:gradientAudit(),orientation:{
  rows:"Latin source",columns:"Greek destination"},
  highContrastOrder:"start, end, 80% start, 80% end, 60% start, 60% end, 90% start, 90% end",
  sources:LATIN_SOURCES,destinations:GREEK_DESTINATIONS,
  palettes:ALL_GRADIENTS.map(pair=>gradientPaletteExport(pair,highContrastSteps,adaptive))});
