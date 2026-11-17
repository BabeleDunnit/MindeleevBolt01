import type {CSSProperties} from "react";
import {GREEK_DESTINATIONS,LATIN_SOURCES,gradientPair,
 type NamedColor,
 gradientCss,quantizedGradient,flippedGradient,perceptualDistance
} from "@/polytron/gradientPalettes";
import {gradientSamples,gradientPositions,cssSRGB,
 type GradientOrder} from "@/polytron/gradientFacePalette";
import "./PeriodicGradientPicker.css";

type Props={
 row:number;column:number;order:GradientOrder;
 onPairChange:(row:number,column:number)=>void;
 onOrderChange:(order:GradientOrder)=>void;
 exampleFaceTypes:number;
};

// Presentation-only translations: keep canonical color IDs and sRGB values.
const ENGLISH_SHADES:Record<string,string>={
 niger:"Midnight Ebony",albus:"Parchment Ivory",ruber:"Cinnabar Red",
 fulvus:"Copper Amber",aureus:"Antique Gold",flavus:"Saffron Yellow",
 viridis:"Jade Green",caesius:"Lagoon Turquoise",caeruleus:"Lapis Blue",
 purpureus:"Amethyst Violet",roseus:"Rose Quartz",canus:"Slate Gray",
 melas:"Obsidian",leukos:"Pale Porcelain",erythros:"Garnet Red",
 pyrrhos:"Lava Orange",chrysos:"Solar Gold",xanthos:"Honey Yellow",
 chloros:"Cedar Green",glaukos:"Opal Blue",kyanos:"Cobalt Blue",
 porphyra:"Imperial Purple",rhodon:"Coral Pink",phaios:"Smoke Gray"
};
const englishShade=(color:NamedColor)=>ENGLISH_SHADES[color.id]??color.shadeName;
const swatch=(color:string):CSSProperties=>({background:color});
function Discrete({colors}:{colors:readonly string[]}){
 return <span className="cpm-discrete" aria-hidden="true">
  {colors.map((c,i)=><span key={i} style={swatch(c)}/>)}
 </span>;
}

/** Compact Chromatica-like 12×12 explorer embedded in periodic controls. */
export default function PeriodicGradientPicker({row,column,order,onPairChange,
 onOrderChange,exampleFaceTypes}:Props){
 const selected=gradientPair(row,column);
 const start=selected.primary.hex,end=selected.secondary.hex;
 const example=Math.max(1,Math.min(200,exampleFaceTypes));
 const exampleStraight=gradientSamples(start,end,example,"linear").map(cssSRGB);
 const exampleContrast=gradientSamples(start,end,example,"contrast").map(cssSRGB);
 return <section className="cpm-root" aria-label="Chromatica 12-by-12 matrix">
  <div className="cpm-head">
   <div>
    <span className="cpm-kicker">CHROMATICA · MATERIA × EIDOS</span>
    <h3>144 gradients · 12 Latin colors × 12 Greek colors</h3>
    <p>Choose a color pair in the matrix and apply it to every Polytron.
     Face classes automatically determine how many colors are used.</p>
   </div>
   <div className="cpm-mode" role="group" aria-label="Chromatica ordering">
    <button type="button" aria-pressed={order==="linear"}
     className={order==="linear"?"cpm-active":""}
     onClick={()=>onOrderChange("linear")}>Linear</button>
    <button type="button" aria-pressed={order==="contrast"}
     className={order==="contrast"?"cpm-active":""}
     onClick={()=>onOrderChange("contrast")}>Interleaved · high contrast</button>
   </div>
  </div>
  <div className="cpm-selection">
   <div>
    <strong>{selected.name}</strong>
    <span>{englishShade(selected.primary)} → {englishShade(selected.secondary)}</span>
    <small>ΔE OK × 100: {perceptualDistance(start,end).toFixed(2)}</small>
   </div>
   <div className="cpm-comparison" aria-label="Selected palette preview">
    <span>Continuous</span>
    <div className="cpm-continuous" style={{background:gradientCss(start,end)}}/>
    <span>Linear · {example} colors</span><Discrete colors={exampleStraight}/>
    <span>Interleaved · {example} colors</span><Discrete colors={exampleContrast}/>
   </div>
  </div>
  <p className="cpm-explainer">Preview with {example} {example===1?"face class":"face classes"}.
   Every Polytron palette contains <b>exactly one color per face type</b>.
   High-contrast ordering starts at both endpoints, then visits 80/20, 20/80,
   and continues without repeating positions or wrapping indices.</p>
  <div className="cpm-scroller" role="region" tabIndex={0} aria-label="Choose one of 144 gradients">
   <table className="cpm-matrix">
    <thead><tr>
     <th className="cpm-corner" scope="col">Materia ↓ Eidos →</th>
     {GREEK_DESTINATIONS.map((c,j)=><th key={c.id} scope="col"
      className={j===column?"cpm-marked":""}>
      <span className="cpm-dot" style={swatch(c.hex)}/>
      <strong>{c.name}</strong><small>{c.script}</small>
      <small>{englishShade(c)}</small>
     </th>)}
    </tr></thead>
    <tbody>{LATIN_SOURCES.map((p,i)=><tr key={p.id}>
     <th scope="row" className={i===row?"cpm-marked":""}>
      <span className="cpm-dot" style={swatch(p.hex)}/>
      <strong>{p.name}</strong><small>{englishShade(p)}</small>
     </th>
     {GREEK_DESTINATIONS.map((q,j)=><td key={q.id}>
      <button type="button" className={"cpm-cell"+(i===row&&j===column?" cpm-picked":"")}
       aria-pressed={i===row&&j===column}
       aria-label={p.name+" "+q.name+" · "+englishShade(p)+" / "+englishShade(q)}
       title={p.name+" "+q.name} onClick={()=>onPairChange(i,j)}>
       <span className="cpm-continuous"
        style={{background:gradientCss(p.hex,q.hex)}}/>
       <Discrete colors={quantizedGradient(p.hex,q.hex,5)}/>
       <Discrete colors={flippedGradient(p.hex,q.hex,5)}/>
      </button>
     </td>)}
    </tr>)}</tbody>
   </table>
  </div>
  <div className="cpm-footer">
   <span>Every cell: continuous · 5 linear colors · 5 interleaved colors</span>
   <span>Selected ordering: <b>{order==="linear"?"Linear":"High contrast"}</b></span>
   <span>Preview positions: {gradientPositions(Math.min(example,8),order).map(x=>
    Math.round(x*100)+"%").join(" · ")}</span>
  </div>
 </section>;
}
