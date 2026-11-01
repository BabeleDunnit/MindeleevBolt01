import {useMemo,useState,type CSSProperties} from "react";
import {ALL_GRADIENTS,GREEK_DESTINATIONS,LATIN_SOURCES,QUANTIZATION_STEPS,
 gradientCss,gradientPair,quantizedGradient,flippedGradient,
 adaptiveGradientCss,adaptiveQuantization,adaptiveFlipped,perceptualDistance,
 contrastGrade,gradientAudit,gradientPaletteExport,exportGradientMatrix,
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
 kind:"continuous"|"quantized"|"flipped";steps?:number;wide?:boolean;adaptive?:boolean;
}){
 const colors=kind==="flipped"?
  adaptive?adaptiveFlipped(start,end,steps as QuantizationSteps):flippedGradient(start,end,steps as QuantizationSteps):
  kind==="quantized"?(adaptive?adaptiveQuantization(start,end,steps):quantizedGradient(start,end,steps)):null;
 return <div className={"gp-bar"+(wide?" gp-bar-wide":"")}>
  <span className="gp-bar-label">{label}</span>
  {colors?<DiscreteStrip colors={colors}/>:
   <span className="gp-continuous" style={{background:adaptive?
    adaptiveGradientCss(start,end):gradientCss(start,end)}}/>}
 </div>;
}
function PaletteCell({pair,selected,highSteps,adaptive,onChoose}:{pair:GradientPair;
 selected:boolean;highSteps:QuantizationSteps;adaptive:boolean;onChoose:()=>void}){
 const a=pair.primary.hex,b=pair.secondary.hex;
 const grade=contrastGrade(a,b);
 return <button type="button"
  className={"gp-cell-button"+(selected?" gp-cell-selected":"")+
   (grade==="clear"?"":" gp-cell-low")}
  onClick={onChoose} aria-pressed={selected}
  aria-label={pair.name+" · gradiente continuo, 3, 5, 8 e capovolto in "+highSteps+" colori"}
  title={pair.name+" · "+pair.primary.shadeName+" → "+pair.secondary.shadeName+
   " · distanza OKLab "+perceptualDistance(a,b).toFixed(1)}>
  <Bar label="∞" kind="continuous" start={a} end={b} adaptive={adaptive}/>
  <Bar label="3" kind="quantized" steps={3} start={a} end={b} adaptive={adaptive}/>
  <Bar label="5" kind="quantized" steps={5} start={a} end={b} adaptive={adaptive}/>
  <Bar label="8" kind="quantized" steps={8} start={a} end={b} adaptive={adaptive}/>
  <Bar label={"↯"+highSteps} kind="flipped" steps={highSteps} start={a} end={b} adaptive={adaptive}/>
 </button>;
}
function downloadMatrix(steps:QuantizationSteps,adaptive:boolean){
 const payload=exportGradientMatrix(steps,adaptive);
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob);
 const a=document.createElement("a");
 a.href=url;a.download="mindeleev-gradient-palettes-144.json";
 document.body.appendChild(a);a.click();a.remove();
 URL.revokeObjectURL(url);
}
function PaletteInspector({pair,highSteps,adaptive}:{pair:GradientPair;highSteps:QuantizationSteps;adaptive:boolean}){
 const a=pair.primary.hex,b=pair.secondary.hex;
 const blocks=gradientPaletteExport(pair,highSteps,adaptive);
 const delta=perceptualDistance(a,b);
 const grade=contrastGrade(a,b);
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
    <p className="gp-contrast-detail">Distanza OKLab × 100: <strong>{delta.toFixed(2)}</strong>
     {grade!=="clear"&&<span className="gp-warn"> · Poco contrasto {adaptive?"· movimento attivo":"· lineare"}</span>}</p>
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
   <Bar label="Continuo" start={a} end={b} kind="continuous" adaptive={adaptive} wide/>
   <Bar label="3 colori" start={a} end={b} kind="quantized" steps={3} adaptive={adaptive} wide/>
   <Bar label="5 colori" start={a} end={b} kind="quantized" steps={5} adaptive={adaptive} wide/>
   <Bar label="8 colori" start={a} end={b} kind="quantized" steps={8} adaptive={adaptive} wide/>
   <Bar label={"Capovolto "+highSteps} start={a} end={b} kind="flipped" steps={highSteps} adaptive={adaptive} wide/>
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
 const [adaptive,setAdaptive]=useState(true);
 const audit=useMemo(()=>gradientAudit(),[]);
 const [highlight,setHighlight]=useState<"all"|"same"|"contrast"|"critical">("all");
 const selected=gradientPair(row,column);
 const filter=(a:string,b:string)=>{
  const grade=contrastGrade(a,b);
  if(highlight==="all")return true;
  if(highlight==="critical")return grade==="critical";
  if(highlight==="same")return grade!=="clear";
  return perceptualDistance(a,b)>=32;
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
     onClick={()=>downloadMatrix(highSteps,adaptive)}>Esporta JSON · 144 palette</button>
   </div>
  </div>
  <div className="gp-audit-panel">
   <div><span className="gp-eyebrow">AUDIT PERCETTIVO · OKLab</span>
    <p><b>{audit.soft+audit.critical}</b> gradienti poco contrastati su 144.
     Di questi, <b>{audit.critical}</b> hanno estremi quasi identici (ΔE OK sotto 10).</p></div>
   <label className="gp-motion-toggle">
    <input type="checkbox" checked={adaptive} onChange={e=>setAdaptive(e.target.checked)}/>
    Movimento sui gradienti quasi monocromatici
   </label>
   <p className="gp-audit-help">La curva aggiunge una delicata variazione di luminosità ai colori
    intermedi; i due estremi originali restano invariati. Disattiva per confrontare
    l'interpolazione lineare. La misura è ΔE OK × 100, non ΔE2000.</p>
   <div className="gp-audit-examples">
    {audit.closest.slice(0,12).map(candidate=><button key={candidate.id} type="button"
     onClick={()=>{const target=ALL_GRADIENTS.findIndex(p=>p.id===candidate.id);
      setRow(Math.floor(target/12));setColumn(target%12);}}
     className={selected.id===candidate.id?"gp-chip gp-chip-active":"gp-chip"}>
     {candidate.name} · {candidate.distance.toFixed(1)}
    </button>)}
   </div>
  </div>
  <PaletteInspector pair={selected} highSteps={highSteps} adaptive={adaptive}/>
  <div className="gp-section-head">
   <div>
    <span className="gp-eyebrow">LA MATRICE</span>
    <h2>Origine <span className="gp-muted">×</span> Destinazione</h2>
    <p>Scorri la tabella in orizzontale e verticale, poi seleziona una cella per ingrandire
     i cinque trattamenti. Le intestazioni rimangono visibili durante lo scorrimento.</p>
   </div>
   <div className="gp-filters" role="group" aria-label="Filtra per distanza percettiva OKLab">
    {([["all","Tutte"],["critical","Quasi identiche"],["same","Poco contrasto"],["contrast","Alto contrasto"]] as const).map(([value,label])=>
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
        adaptive={adaptive} onChoose={()=>{setRow(i);setColumn(j);}}/>
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
   <p><b>Contrasto adattivo:</b> l'escursione di luminosità viene applicata solamente
    alle coppie con distanza OKLab inferiore a 18. Mantiene gli estremi esatti;
    quindi nella versione capovolta i primi due colori possono comunque essere
    quasi identici. I valori intermedi sono derivati sperimentalmente.</p>
   <p><b>Nomenclatura:</b> i nomi come «Avorio pergamena» e «Porcellana chiara»
    sono descrizioni originali dei colori, non nomi o corrispondenze Pantone
    ufficiali. Le scritte greche originali sono conservate.</p>
   <p><b>Stato del prototipo:</b> nessuna modifica alla tavola periodica o alle
    palette attualmente in uso nei Polytroni. L'interpolazione avviene nei canali sRGB.</p>
  </footer>
 </main>;
}
