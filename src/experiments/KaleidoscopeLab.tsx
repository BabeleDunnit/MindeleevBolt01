import {useEffect,useMemo,useState} from "react";
import {SharedPeriodic3D} from "@/experiments/PolytronPeriodicLab";
import ResonancePlayground from "@/experiments/ResonancePlayground";
import ResonanceReviewLab from "@/experiments/ResonanceReviewLab";
import type {ResonanceCalibrationPreset} from "@/polytron/resonanceCalibration";
import {gradientPair,LATIN_SOURCES,GREEK_DESTINATIONS} from "@/polytron/gradientPalettes";
import {rcAxial,rcPolygon} from "@/polytron/rc01Board";
import {
 generateKaleidoscope,kaleidoCellCount,
 KALEIDOSCOPE_FAMILIES,KALEIDOSCOPE_SYMMETRIES,
 type KaleidoFamily,type KaleidoSymmetry,type KaleidoParams,type KaleidoTile
} from "@/polytron/kaleidoscopeGenerator";
import "./KaleidoscopeLab.css";

const FAMILY_LABELS:Record<KaleidoFamily,{name:string;summary:string}>={
 metatron:{name:"Metatron",summary:"Stelle a sei punte, triangoli, connessioni e costellazioni"},
 crystal:{name:"Cristalli",summary:"Crescita cellulare per orbite esagonali e ramificazioni"},
 rosette:{name:"Rosette",summary:"Anelli ritmici e motivi ricorsivi a petali"},
 roots:{name:"Radici",summary:"Reti concentriche ispirate ad A2 e G2"}
};
const SYMMETRY_LABELS:Record<KaleidoSymmetry,string>={
 D6:"D6 · rotazioni + specchi",C6:"C6 · sei bracci",
 C3:"C3 · tre bracci",C2:"C2 · due bracci"
};
const BASE=import.meta.env.BASE_URL;
const DEFAULT_PARAMS:KaleidoParams={
 radius:2,family:"metatron",symmetry:"D6",seed:137,generation:0
};
function paramsFromUrl():KaleidoParams{
 if(typeof window==="undefined")return DEFAULT_PARAMS;
 const url=new URLSearchParams(window.location.search);
 const r=Number(url.get("radius")),s=Number(url.get("seed"));
 const f=url.get("family"),sym=url.get("symmetry");
 return {
  radius:Number.isInteger(r)&&r>=1&&r<=5?r:DEFAULT_PARAMS.radius,
  family:KALEIDOSCOPE_FAMILIES.find(x=>x===f)??DEFAULT_PARAMS.family,
  symmetry:KALEIDOSCOPE_SYMMETRIES.find(x=>x===sym)??DEFAULT_PARAMS.symmetry,
  seed:Number.isSafeInteger(s)&&s>=0?s:DEFAULT_PARAMS.seed,
  generation:0
 };
}
function position(q:number,r:number,radius:number){
 // Entire radius is re-fit to the same preview area, not merely clipped.
 const unit=370/(Math.sqrt(3)*radius+1.12);
 const {x,y}=rcAxial(q,r,unit);
 return {x:400+x,y:400+y,size:unit};
}
export default function KaleidoscopeLab(){
 const [layout,setLayout]=useState(()=>generateKaleidoscope(paramsFromUrl()));
 // A preset load remounts ONLY the response lab, ensuring a clean baseline
 // even when a user reloads the same seed at generation 0.
 const [calibrationSession,setCalibrationSession]=useState(0);
 const [mode,setMode]=useState<"generator"|"resonance"|"review">(()=>{
  if(typeof window==="undefined")return "generator";
  const requested=new URLSearchParams(window.location.search).get("mode");
  return requested==="resonance"||requested==="review"?requested:"generator";
 });
 const [selectedKey,setSelectedKey]=useState<string|null>(null);
 const [showNetwork,setShowNetwork]=useState(true);
 const {radius,family,symmetry,seed,generation}=layout.params;
 const byKey=useMemo(()=>new Map(layout.cells.map(c=>[c.key,c])),[layout.cells]);
 const tileByKey=useMemo(()=>new Map(layout.tiles.map(t=>[t.key,t])),[layout.tiles]);
 const selected=selectedKey?tileByKey.get(selectedKey):undefined;
 const params=layout.params;
 useEffect(()=>{
  const url=new URL(window.location.href);
  url.searchParams.set("experiment","kaleidoscope-lab");
  url.searchParams.set("mode",mode);
  url.searchParams.set("radius",String(radius));
  url.searchParams.set("family",family);
  url.searchParams.set("symmetry",symmetry);
  url.searchParams.set("seed",String(seed));
  url.searchParams.delete("generation");
  window.history.replaceState(null,"",url.toString());
 },[radius,family,symmetry,seed,mode]);
 const configure=(next:Partial<KaleidoParams>)=>{
  setLayout(old=>generateKaleidoscope({...old.params,...next,generation:0}));
  setSelectedKey(null);
 };
 const evolve=()=>{setLayout(old=>generateKaleidoscope(
  {...old.params,generation:old.params.generation+1},old
 ));setSelectedKey(null);};
 const genesis=()=>{configure({seed:seed+1});};
 const loadCalibrationPreset=(preset:ResonanceCalibrationPreset)=>{
  // Same unmodified artistic generator; preset is only a recipe.
  setLayout(generateKaleidoscope({...preset.params,generation:0}));
  setSelectedKey(null);
  setCalibrationSession(old=>old+1);
  setMode("resonance");
 };
 const tileWidth=(370/(Math.sqrt(3)*radius+1.12))*1.5/800*100;
 const focal=position(0,0,radius);
 const familyInfo=FAMILY_LABELS[family];
 return <main className="kaleido-app">
  <SharedPeriodic3D palette={0} rotate={false}
   gradient={{pair:gradientPair(2,4),order:"contrast"}}/>
  <header className="kaleido-header">
   <div>
    <p className="kaleido-eyebrow">MINDELEEV · LABORATORIO GENERATIVO</p>
    <h1>Il caleidoscopio del Mutatron</h1>
    <p>Esplorazione di strutture esagonali simmetriche. Ogni <b>Evolve</b> modifica
     la composizione esistente secondo la grammatica scelta. I Polytroni sono
     rappresentati dalle autentiche proiezioni <b>flat-Z</b> della Tavola Polytronica.</p>
   </div>
   <a className="kaleido-back" href={BASE+"?experiment=polytron-periodic"}>
    Tavola Polytronica ↗
   </a>
  </header>
  <div className="kaleido-mode-switch">
   <button className={mode==="generator"?"active":""}
    aria-pressed={mode==="generator"} onClick={()=>setMode("generator")}>
    Generatore artistico</button>
   <button className={mode==="resonance"?"active":""}
    aria-pressed={mode==="resonance"} onClick={()=>setMode("resonance")}>
    Resonance Playground</button>
   <button className={mode==="review"?"active":""}
    aria-pressed={mode==="review"} onClick={()=>setMode("review")}>
    Valutazione umana</button>
   <small>Tre viste dello stesso progetto · generatore artistico invariato</small>
  </div>
  <div style={{display:mode==="generator"?"block":"none"}}>
  <div className="kaleido-layout">
   <section className="kaleido-stage" aria-label="Mutatron caleidoscopico">
    <div className="kaleido-stage-head">
     <div><strong>{familyInfo.name}</strong><span>{familyInfo.summary}</span></div>
     <div className="kaleido-generation">EVOLUZIONE <b>{generation}</b></div>
    </div>
    <div className="kaleido-artboard">
     <svg className="kaleido-svg" viewBox="0 0 800 800"
      role="img" aria-label={`Caleidoscopio esagonale di raggio ${radius}, ${layout.tiles.length} manifestazioni, simmetria ${symmetry}`}>
      <defs>
       <radialGradient id="kaleido-back-glow">
        <stop offset="0%" stopColor="#244954" stopOpacity=".75"/>
        <stop offset="66%" stopColor="#102838" stopOpacity=".8"/>
        <stop offset="100%" stopColor="#091823" stopOpacity="1"/>
       </radialGradient>
       <radialGradient id="kaleido-nucleus-glow">
        <stop offset="0%" stopColor="#f5dfa2" stopOpacity=".35"/>
        <stop offset="100%" stopColor="#f5dfa2" stopOpacity="0"/>
       </radialGradient>
      </defs>
      <rect width="800" height="800" fill="url(#kaleido-back-glow)"/>
      <g aria-hidden="true">
       {layout.cells.filter(c=>c.ring>0).map(c=>{
        const p=position(c.q,c.r,radius);
        const tile=tileByKey.get(c.key);
        return <polygon key={c.key} points={rcPolygon(p.x,p.y,p.size*.97)}
         fill={tile?LATIN_SOURCES[tile.paletteRow].hex:"#142e3a"}
         fillOpacity={tile?.14:.16}
         stroke={tile?"#688c96":"#375361"}
         strokeWidth={tile?1.6:1} strokeOpacity={tile?.76:.45}/>;
       })}
      </g>
      {family==="metatron"&&radius>=2&&showNetwork&&(()=>{
       const anchors=layout.cells.filter(c=>c.ring===0||c.ring===1||
        c.ring===2&&c.idx%2===0);
       const links=[];
       for(let a=0;a<anchors.length;a++)for(let b=a+1;b<anchors.length;b++){
        const p=position(anchors[a].q,anchors[a].r,radius);
        const q=position(anchors[b].q,anchors[b].r,radius);
        links.push(<line key={a+"-"+b} x1={p.x} y1={p.y}
         x2={q.x} y2={q.y} stroke="#f0cf93" strokeOpacity=".065"
         strokeWidth="1.1"/>);
       }
       return <g aria-hidden="true">{links}</g>;
      })()}
      {showNetwork&&<g aria-hidden="true">
       {layout.edges.map(e=>{
        const a=byKey.get(e.from)!,b=byKey.get(e.to)!;
        const p=position(a.q,a.r,radius),q=position(b.q,b.r,radius);
        return <line key={e.from+"|"+e.to}
         x1={p.x} y1={p.y} x2={q.x} y2={q.y}
         stroke={e.kind==="star"?"#f9c984":e.kind==="spoke"?"#80ddc8":"#64acc4"}
         strokeWidth={e.kind==="star"?2.9:e.kind==="spoke"?2.3:1.4}
         strokeOpacity={e.kind==="star"?.67:e.kind==="spoke"?.55:.36}/>;
       })}
      </g>}
      <circle cx={focal.x} cy={focal.y} r={focal.size*1.2}
       fill="url(#kaleido-nucleus-glow)" pointerEvents="none"/>
      <polygon points={rcPolygon(focal.x,focal.y,focal.size*.82)}
       fill="#17383e" fillOpacity=".85" stroke="#dcc98b" strokeWidth="2.3"/>
      {Array.from({length:6},(_,i)=>{
       const angle=i*Math.PI/3;
       return <line key={i} x1={focal.x} y1={focal.y}
        x2={focal.x+Math.cos(angle)*focal.size*.65}
        y2={focal.y+Math.sin(angle)*focal.size*.65}
        stroke="#e4c886" strokeOpacity=".68"/>;
      })}
      <circle cx={focal.x} cy={focal.y}
       r={Math.max(4,focal.size*.13)} fill="#e9d9a7"/>
     </svg>
     <div className="kaleido-tile-layer">
      {layout.tiles.map(tile=>{
       const p=position(tile.q,tile.r,radius);
       return <div key={tile.key} className="kaleido-polytron"
        data-polytron-viewport="" data-view-kind="flat-z"
        data-dna={tile.dna}
        data-kaleido-row={tile.paletteRow}
        data-kaleido-col={tile.paletteCol}
        data-kaleido-angle={tile.angle}
        data-kaleido-mirror={tile.mirrored?"true":"false"}
        style={{left:p.x/8+"%",top:p.y/8+"%",
         width:tileWidth+"%",height:tileWidth+"%"}}/>;
      })}
     </div>
     <div className="kaleido-select-layer">
      {layout.tiles.map(tile=>{
       const p=position(tile.q,tile.r,radius);
       return <button key={tile.key} className={"kaleido-hotspot"+
        (selectedKey===tile.key?" is-selected":"")}
        style={{left:p.x/8+"%",top:p.y/8+"%",
         width:tileWidth+"%",height:tileWidth+"%"}}
        onClick={()=>setSelectedKey(tile.key===selectedKey?null:tile.key)}
        title={"Manifestazione "+tile.number+" · "+tile.dna}
        aria-label={"Seleziona manifestazione "+tile.number+
         " in posizione "+tile.ring+","+tile.idx}/>;
      })}
     </div>
    </div>
    <div className="kaleido-stage-foot">
     <span>{layout.tiles.length} manifestazioni · {layout.usedManifestations} tipi</span>
     <span>{symmetry} · raggio {radius}</span>
    </div>
   </section>
   <aside className="kaleido-controls">
    <section className="kaleido-control-block">
     <div className="kaleido-section-top">
      <h2>Raggio del caleidoscopio</h2><strong>{radius} / 5</strong>
     </div>
     <p>Numero di anelli entro cui il generatore può collocare manifestazioni.
      La dimensione controlla la complessità effettiva, non soltanto lo zoom.</p>
     <div className="kaleido-radius-picker">
      <button type="button" disabled={radius<=1}
       onClick={()=>configure({radius:radius-1})} aria-label="Riduci raggio">−</button>
      <input aria-label="Raggio del caleidoscopio" type="range"
       min="1" max="5" step="1" value={radius}
       onChange={e=>configure({radius:Number(e.target.value)})}/>
      <button type="button" disabled={radius>=5}
       onClick={()=>configure({radius:radius+1})} aria-label="Aumenta raggio">+</button>
     </div>
     <div className="kaleido-radius-markers">
      {[1,2,3,4,5].map(r=><button key={r}
       onClick={()=>configure({radius:r})} className={radius===r?"active":""}
       aria-pressed={radius===r} title={kaleidoCellCount(r)+" celle"}>
       {r}</button>)}
     </div>
     <div className="kaleido-radius-foot">
      <span>{kaleidoCellCount(radius)} celle disponibili (con Nucleo)</span>
      <span>{layout.tiles.length} occupate</span>
     </div>
    </section>
    <section className="kaleido-control-block">
     <h2>Grammatica generativa</h2>
     <div className="kaleido-family-grid">
      {KALEIDOSCOPE_FAMILIES.map(f=><button
       key={f} type="button" className={family===f?"active":""}
       aria-pressed={family===f} onClick={()=>configure({family:f})}>
       {FAMILY_LABELS[f].name}</button>)}
     </div>
     <p>{familyInfo.summary}.</p>
    </section>
    <section className="kaleido-control-block">
     <label htmlFor="kaleido-symmetry" className="kaleido-field-label">
      Simmetria matematica</label>
     <select id="kaleido-symmetry" value={symmetry}
      onChange={e=>configure({symmetry:e.target.value as KaleidoSymmetry})}>
      {KALEIDOSCOPE_SYMMETRIES.map(sym=><option key={sym} value={sym}>
       {SYMMETRY_LABELS[sym]}</option>)}
     </select>
     <label className="kaleido-check">
      <input type="checkbox" checked={showNetwork}
       onChange={e=>setShowNetwork(e.target.checked)}/>
      Mostra grafo e connessioni
     </label>
    </section>
    <section className="kaleido-actions">
     <button className="kaleido-evolve" onClick={evolve}>
      ✳ Evolve <small>→ generazione {generation+1}</small>
     </button>
     <button className="kaleido-genesis" onClick={genesis}>
      Nuova origine · seed {seed+1}
     </button>
    </section>
    <section className="kaleido-stats">
     <h2>Descrizione della configurazione</h2>
     <div><span>Orbite di simmetria</span><strong>{layout.symmetryOrbits}</strong></div>
     <div><span>Manifestazioni collocate</span><strong>{layout.tiles.length}</strong></div>
     <div><span>DNA distinti</span><strong>{layout.usedManifestations}</strong></div>
     <div><span>Σ energia intrinseca</span><strong>{layout.totalIntrinsicEnergy} E</strong></div>
     <p>La somma delle energie è solo un'indicazione per future regole
      di acquisto. Qui non esistono ancora budget, costi o ricompense.</p>
    </section>
    {selected&&<section className="kaleido-selected">
     <h2>Manifestazione selezionata</h2>
     <div><strong>#{selected.number}</strong><code>{selected.dna}</code></div>
     <p>Ring {selected.ring}, cella {selected.idx} ·
      { " " + LATIN_SOURCES[selected.paletteRow].name+
       " → "+GREEK_DESTINATIONS[selected.paletteCol].name}</p>
     <a href={BASE+"?experiment=polytron-periodic&polytron="+selected.number}>
      Apri nella Tavola Polytronica ↗</a>
    </section>}
   </aside>
  </div>
  </div>
  <div style={{display:mode==="resonance"?"block":"none"}}>
   <ResonancePlayground key={calibrationSession} layout={layout}
    onEvolve={evolve} onGenesis={genesis}
    onLoadPreset={loadCalibrationPreset}/>
  </div>
  {mode==="review"&&<ResonanceReviewLab/>}
  <footer className="kaleido-footer">
   <strong>Esperimento autonomo, non RC02.</strong> Il generatore usa il
   reticolo esagonale reale, orbite C2/C3/C6/D6, connessioni ispirate al
   Cubo di Metatron e le proiezioni piatte Z della Tavola Polytronica.
   Evolve conserva una linea evolutiva deterministica; Nuova origine cambia il seme.
   La simmetria esatta riguarda collocazione e proprietà delle manifestazioni:
   la silhouette interna di ogni tile può avere simmetrie proprie.
   Nel Resonance Playground i tiles sono indizi e i Polytroni acquistati
   costituiscono una composizione distinta; budget, ricompense e analisi della
   difficoltà sono ancora regole sperimentali, non una release candidate.
  </footer>
 </main>;
}
