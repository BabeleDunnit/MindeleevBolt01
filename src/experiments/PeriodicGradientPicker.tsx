import type {CSSProperties} from "react";
import {GREEK_DESTINATIONS,LATIN_SOURCES,gradientPair,
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
 return <section className="cpm-root" aria-label="Matrice Chromatica 12 per 12">
  <div className="cpm-head">
   <div>
    <span className="cpm-kicker">CHROMATICA · MATERIA × EIDOS</span>
    <h3>144 gradienti · 12 colori latini × 12 greci</h3>
    <p>Scegli un incrocio nella matrice e applicalo a tutti i Polytroni.
     Le classi delle facce determinano automaticamente il numero di colori.</p>
   </div>
   <div className="cpm-mode" role="group" aria-label="Ordine Chromatica">
    <button type="button" aria-pressed={order==="linear"}
     className={order==="linear"?"cpm-active":""}
     onClick={()=>onOrderChange("linear")}>Dritta</button>
    <button type="button" aria-pressed={order==="contrast"}
     className={order==="contrast"?"cpm-active":""}
     onClick={()=>onOrderChange("contrast")}>A salti · alto contrasto</button>
   </div>
  </div>
  <div className="cpm-selection">
   <div>
    <strong>{selected.name}</strong>
    <span>{selected.primary.shadeName} → {selected.secondary.shadeName}</span>
    <small>ΔE OK × 100: {perceptualDistance(start,end).toFixed(2)}</small>
   </div>
   <div className="cpm-comparison" aria-label="Anteprima palette selezionata">
    <span>Continuo</span>
    <div className="cpm-continuous" style={{background:gradientCss(start,end)}}/>
    <span>Dritta · {example} colori</span><Discrete colors={exampleStraight}/>
    <span>Salti · {example} colori</span><Discrete colors={exampleContrast}/>
   </div>
  </div>
  <p className="cpm-explainer">Anteprima con {example} {example===1?"classe":"classi"} di facce.
   In ogni Polytrone la palette avrà <b>esattamente tante voci quanti sono i suoi tipi di facce</b>.
   La modalità a salti inizia con partenza, arrivo, 80/20, 20/80 e continua
   senza ripetere indici; non utilizza alcun wrapping.</p>
  <div className="cpm-scroller" role="region" tabIndex={0} aria-label="Scegli uno dei 144 gradienti">
   <table className="cpm-matrix">
    <thead><tr>
     <th className="cpm-corner" scope="col">Materia ↓ Eidos →</th>
     {GREEK_DESTINATIONS.map((c,j)=><th key={c.id} scope="col"
      className={j===column?"cpm-marked":""}>
      <span className="cpm-dot" style={swatch(c.hex)}/>
      <strong>{c.name}</strong><small>{c.script}</small>
      <small>{c.shadeName}</small>
     </th>)}
    </tr></thead>
    <tbody>{LATIN_SOURCES.map((p,i)=><tr key={p.id}>
     <th scope="row" className={i===row?"cpm-marked":""}>
      <span className="cpm-dot" style={swatch(p.hex)}/>
      <strong>{p.name}</strong><small>{p.shadeName}</small>
     </th>
     {GREEK_DESTINATIONS.map((q,j)=><td key={q.id}>
      <button type="button" className={"cpm-cell"+(i===row&&j===column?" cpm-picked":"")}
       aria-pressed={i===row&&j===column}
       aria-label={p.name+" "+q.name+" · "+p.shadeName+" / "+q.shadeName}
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
   <span>Ogni casella: continuo · 5 colori lineari · 5 colori a salti</span>
   <span>Ordine selezionato: <b>{order==="linear"?"Dritto":"Alto contrasto"}</b></span>
   <span>Posizioni anteprima: {gradientPositions(Math.min(example,8),order).map(x=>
    Math.round(x*100)+"%").join(" · ")}</span>
  </div>
 </section>;
}
