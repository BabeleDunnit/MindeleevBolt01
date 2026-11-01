import {useMemo,useState,type CSSProperties} from "react";
import {ALL_GRADIENTS,GREEK_DESTINATIONS,LATIN_SOURCES,QUANTIZATION_STEPS,
 gradientCss,gradientPair,quantizedGradient,flippedGradient,
 gradientPaletteExport,exportGradientMatrix,perceptualDistance,
 auditGradientMatrix,MIN_ENDPOINT_DISTANCE,
 type GradientPair,type QuantizationSteps} from "@/polytron/gradientPalettes";
import "./GradientPaletteLab.css";

const colorChip=(color:string):CSSProperties=>({backgroundColor:color});
function DiscreteStrip({colors}:{colors:readonly string[]}){
 return <span className="gp-discrete" aria-hidden="true">
  {colors.map((color,index)=><span key={index} style={colorChip(color)}/>)}
 </span>;
}
function Bar({label,start,end,kind,steps=8,wide=false}:{
 label:string;start:string;end:string;
 kind:"continuous"|"quantized"|"flipped";steps?:number;wide?:boolean;
}){
 const colors=kind==="flipped"?
  flippedGradient(start,end,steps as QuantizationSteps):
  kind==="quantized"?quantizedGradient(start,end,steps):null;
 return <div className={"gp-bar"+(wide?" gp-bar-wide":"")}>
  <span className="gp-bar-label">{label}</span>
  {colors?<DiscreteStrip colors={colors}/>:
   <span className="gp-continuous" style={{background:gradientCss(start,end)}}/>}
 </div>;
}
function PaletteCell({pair,selected,highSteps,onChoose}:{pair:GradientPair;
 selected:boolean;highSteps:QuantizationSteps;onChoose:()=>void}){
 const a=pair.primary.hex,b=pair.secondary.hex;
 return <button type="button"
  className={"gp-cell-button"+(selected?" gp-cell-selected":"")}
  onClick={onChoose} aria-pressed={selected}
  aria-label={pair.name+" · gradiente continuo, 3, 5, 8 e capovolto in "+highSteps+" colori"}
  title={pair.name+" · "+pair.primary.shadeName+" → "+pair.secondary.shadeName+
   " · distanza OKLab "+perceptualDistance(a,b).toFixed(2)}>
  <Bar label="∞" kind="continuous" start={a} end={b}/>
  <Bar label="3" kind="quantized" steps={3} start={a} end={b}/>
  <Bar label="5" kind="quantized" steps={5} start={a} end={b}/>
  <Bar label="8" kind="quantized" steps={8} start={a} end={b}/>
  <Bar label={"↯"+highSteps} kind="flipped" steps={highSteps} start={a} end={b}/>
 </button>;
}
function downloadMatrix(steps:QuantizationSteps){
 const payload=exportGradientMatrix(steps);
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob);
 const a=document.createElement("a");
 a.href=url;a.download="mindeleev-gradient-palettes-144.json";
 document.body.appendChild(a);a.click();a.remove();
 URL.revokeObjectURL(url);
}
function PaletteInspector({pair,highSteps}:{pair:GradientPair;highSteps:QuantizationSteps}){
 const a=pair.primary.hex,b=pair.secondary.hex;
 const blocks=gradientPaletteExport(pair,highSteps);
 const perceptual=perceptualDistance(a,b);
 const [copied,setCopied]=useState(false);
 const copy=()=>{
  void navigator.clipboard?.writeText(JSON.stringify(blocks,null,2))
   .then(()=>setCopied(true)).catch(()=>setCopied(false));
 };
 return <section className="gp-inspector" aria-label="Palette selezionata" key={pair.id}>
  <div className="gp-inspector-top">
   <div>
    <span className="gp-eyebrow">PALETTE SELEZIONATA</span>
    <h2>{pair.name}</h2>
    <p>Materia <b>{pair.primary.name}</b> <span aria-hidden="true">→</span> Eidos <b>{pair.secondary.name}</b></p>
    <p>Distanza percettiva <strong>ΔE OK × 100: {perceptual.toFixed(2)}</strong>
     {" "}· soglia minima {MIN_ENDPOINT_DISTANCE} · interpolazione rigorosamente lineare.</p>
   </div>
   <button className="gp-outline-button" type="button" onClick={copy}>Copia JSON</button>
  </div>
  <div className="gp-endpoints">
   <div><span className="gp-color-dot" style={colorChip(a)}/> <span>{pair.primary.shadeName}</span>
    <code>{a.toUpperCase()}</code></div>
   <span className="gp-arrow">→</span>
   <div><span className="gp-color-dot" style={colorChip(b)}/> <span>{pair.secondary.shadeName}</span>
    <code>{b.toUpperCase()}</code></div>
  </div>
  <div className="gp-big-bars">
   <Bar label="Continuo" start={a} end={b} kind="continuous" wide/>
   <Bar label="3 colori" start={a} end={b} kind="quantized" steps={3} wide/>
   <Bar label="5 colori" start={a} end={b} kind="quantized" steps={5} wide/>
   <Bar label="8 colori" start={a} end={b} kind="quantized" steps={8} wide/>
   <Bar label={"Capovolto "+highSteps} start={a} end={b} kind="flipped" steps={highSteps} wide/>
  </div>
  <div className="gp-color-values">
   <b>Capovolto ({highSteps}):</b>
   {blocks.flipped.colors.map((hex,i)=><div key={i}>
    <span style={colorChip(hex)}/>
    <small>{hex}</small>
   </div>)}
  </div>
  {copied&&<p className="gp-success" role="status">Palette copiata negli appunti.</p>}
 </section>;
}
export default function GradientPaletteLab(){
 const [row,setRow]=useState(2);
 const [column,setColumn]=useState(4);
 const [highSteps,setHighSteps]=useState<QuantizationSteps>(8);
 const [highlight,setHighlight]=useState<"all"|"same"|"contrast">("all");
 const audit=useMemo(()=>auditGradientMatrix(),[]);
 const selected=gradientPair(row,column);
 const filter=(a:string,b:string)=>{
  const distance=perceptualDistance(a,b);
  return highlight==="all"?true:highlight==="contrast"?distance>=30:distance<15;
 };
 const shown=useMemo(()=>ALL_GRADIENTS.filter(p=>filter(p.primary.hex,p.secondary.hex)).length,[highlight]);
 return <main className="gp-lab">
  <div className="gp-head">
   <div>
    <span className="gp-eyebrow">MINDELEEV / RICERCA CROMATICA · LAB 37</span>
    <h1>Chromatica</h1>
    <p className="gp-lede">Una matrice di 144 gradazioni tra <strong>Materia</strong> e <strong>Eidos</strong>.
     Dodici colori di partenza in latino, dodici colori di arrivo in greco.
     Ogni incontro esplora una palette continua, tre campionamenti ordinati
     e una versione capovolta ad alto contrasto.</p>
   </div>
   <div className="gp-metrics">
    <div><strong>12 × 12</strong><span>incroci cromatici</span></div>
    <div><strong>144</strong><span>palette</span></div>
    <div><strong>5</strong><span>interpretazioni</span></div>
   </div>
  </div>
  <div className="gp-top-actions">
   <a href={import.meta.env.BASE_URL+"?experiment=polytron-periodic"}>← Tavola periodica</a>
   <div className="gp-top-options">
    <label htmlFor="high-contrast-steps">Capovolto</label>
    <select id="high-contrast-steps" value={highSteps}
     onChange={e=>setHighSteps(Number(e.target.value) as QuantizationSteps)}>
     {QUANTIZATION_STEPS.map(n=><option key={n} value={n}>{n} colori</option>)}
    </select>
    <button className="gp-primary-button" type="button"
     onClick={()=>downloadMatrix(highSteps)}>Esporta JSON · 144 palette</button>
   </div>
  </div>
  <section className="gp-distance-audit" aria-label="Audit percettivo delle palette">
   <div><span className="gp-eyebrow">CONTROLLO DI DISTANZA · OKLab</span>
    <p>Tutte le <strong>{audit.total} palette</strong> rispettano la soglia minima
     <strong> ΔE OK ≥ {audit.threshold}</strong>. Minimo effettivo:
     <strong> {audit.minimum.toFixed(2)}</strong>.</p>
   </div>
   <div className="gp-audit-metrics">
    <span><b>{audit.belowThreshold}</b> sotto soglia</span>
    <span><b>{audit.closest.filter(p=>p.distance<15).length}</b> toni vicini</span>
   </div>
   <p className="gp-audit-note">I 24 colori di base sono stati ricalibrati
    una sola volta per l'intera matrice 12 × 12, non per singola cella.
    Nessuna curvatura: le palette continue, quantizzate e capovolte campionano
    sempre la stessa interpolazione lineare.</p>
   <div className="gp-audit-nearest" aria-label="Palette con estremi più vicini">
    {audit.closest.slice(0,11).map(pair=><button key={pair.id} type="button"
     className={pair.id===selected.id?"gp-chip gp-chip-active":"gp-chip"}
     onClick={()=>{
      const index=ALL_GRADIENTS.findIndex(p=>p.id===pair.id);
      setRow(Math.floor(index/12));setColumn(index%12);
     }}>{pair.name} · {pair.distance.toFixed(1)}</button>)}
   </div>
  </section>
  <PaletteInspector pair={selected} highSteps={highSteps}/>
  <div className="gp-section-head">
   <div>
    <span className="gp-eyebrow">LA MATRICE</span>
    <h2>Origine <span className="gp-muted">×</span> Destinazione</h2>
    <p>Scorri la tabella in orizzontale e verticale, poi seleziona una cella per ingrandire
     i cinque trattamenti. Le intestazioni rimangono visibili durante lo scorrimento.</p>
   </div>
   <div className="gp-filters" role="group" aria-label="Filtra per distanza percettiva OKLab">
    {([["all","Tutte"],["contrast","Alto contrasto"],["same","Toni vicini"]] as const).map(([value,label])=>
     <button key={value} className={highlight===value?"gp-chip gp-chip-active":"gp-chip"}
      aria-pressed={highlight===value}
      type="button" onClick={()=>setHighlight(value)}>{label}</button>)}
    <span>{shown}/144</span>
   </div>
  </div>
  <div className="gp-legend" aria-label="Legenda delle cinque strisce">
   <span><b>∞</b> Continuo</span>
   <span><b>3</b> Tre colori</span>
   <span><b>5</b> Cinque colori</span>
   <span><b>8</b> Otto colori</span>
   <span><b>↯</b> Capovolto: estremi alternati</span>
  </div>
  <div className="gp-table-frame" role="region" aria-label="Matrice di 144 gradienti" tabIndex={0}>
   <table className="gp-table">
    <thead>
     <tr>
      <th scope="col" className="gp-corner">
       <span>MATERIA ↓</span><span>EIDOS →</span>
      </th>
      {GREEK_DESTINATIONS.map((c,i)=><th scope="col" key={c.id}
       className={"gp-colhead"+(column===i?" gp-selected-head":"")}>
       <span className="gp-column-swatch" style={colorChip(c.hex)}/>
       <strong>{c.name}</strong>
       <small>{c.script}</small>
       <span className="gp-shade-name">{c.shadeName}</span>
      </th>)}
     </tr>
    </thead>
    <tbody>
     {LATIN_SOURCES.map((source,i)=><tr key={source.id}>
      <th scope="row" className={"gp-rowhead"+(row===i?" gp-selected-head":"")}>
       <div><span className="gp-row-swatch" style={colorChip(source.hex)}/>
        <strong>{source.name}</strong></div>
       <small>{source.shadeName}</small>
      </th>
      {GREEK_DESTINATIONS.map((destination,j)=>{
       const pair=gradientPair(i,j);
       const active=filter(source.hex,destination.hex);
       return <td key={destination.id} className={active?"":"gp-faded"}>
        <PaletteCell pair={pair} selected={i===row&&j===column} highSteps={highSteps}
         onChoose={()=>{setRow(i);setColumn(j);}}/>
       </td>;
      })}
     </tr>)}
    </tbody>
   </table>
  </div>
  <footer className="gp-footer">
   <p><b>Come funziona il capovolto:</b> i primi colori sono 100% partenza e 100% arrivo;
    il terzo è 80% partenza / 20% arrivo, il quarto 20% partenza / 80% arrivo.
    Proseguono le coppie 60/40 e 40/60, poi 90/10 e 10/90 (nella versione a 8).</p>
   <p><b>Distanza percettiva:</b> usiamo ΔE OK = 100 volte la distanza euclidea
    nello spazio OKLab; 8 è il minimo progettuale fra gli estremi, non una
    garanzia di distinguibilità di ogni passaggio negli otto colori.</p>
   <p><b>Nomenclatura:</b> i nomi descrittivi sono originali, non sono nomi né
    codici Pantone ufficiali. Manteniamo nomi latini e scritte greche.</p>
   <p><b>Stato del prototipo:</b> la tavola periodica e le palette oggi usate
    dai Polytroni restano intatte. L'interpolazione sui canali sRGB è lineare,
    anche nella versione capovolta.</p>
  </footer>
 </main>;
}
