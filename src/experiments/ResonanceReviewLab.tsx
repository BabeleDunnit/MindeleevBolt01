import {useMemo,useState,type ChangeEvent} from "react";
import {
 generateKaleidoscope,type KaleidoLayout
} from "@/polytron/kaleidoscopeGenerator";
import {RESONANCE_CALIBRATION_PRESETS} from "@/polytron/resonanceCalibration";
import {
 buildResonanceReviewAnswers,reviewCaseId,
 type ReviewAnswerId
} from "@/polytron/resonanceReviewCases";
import {
 makeResonanceReviewArchive,parseResonanceReviewArchive,
 RESONANCE_REVIEW_STORAGE_KEY,
 type ResonanceReviewRating,type ResonanceReviewRatings
} from "@/polytron/resonanceReviewStorage";
import {
 evaluateResonance,DEFAULT_RESONANCE_SETTINGS,
 type ResonancePawn
} from "@/polytron/resonanceField";
import {rcAxial,rcPolygon} from "@/polytron/rc01Board";
import {dnaFromPolitronNumber} from "@/polytron/politronicNumber";
import "./ResonanceReviewLab.css";

type PresetId=(typeof RESONANCE_CALIBRATION_PRESETS)[number]["id"];
type Draft={
 beauty:number|null;fit:number|null;fitUnknown:boolean;note:string
};
const ANSWER_IDS:readonly ReviewAnswerId[]=["1","2","3","4"];
const fmt=(n:number)=>n.toFixed(1);
const freshDraft=(value?:ResonanceReviewRating):Draft=>({
 beauty:value?.beauty??null,
 fit:value?.fit??null,
 fitUnknown:Boolean(value&&value.fit===null),
 note:value?.note??""
});
function readLocalRatings():ResonanceReviewRatings{
 try{
  const raw=window.localStorage.getItem(RESONANCE_REVIEW_STORAGE_KEY);
  return raw?parseResonanceReviewArchive(JSON.parse(raw)).ratings:{};
 }catch{return {};}
}
function writeLocalRatings(ratings:ResonanceReviewRatings){
 window.localStorage.setItem(RESONANCE_REVIEW_STORAGE_KEY,
  JSON.stringify(makeResonanceReviewArchive(ratings)));
}
function position(q:number,r:number,radius:number){
 const size=370/(Math.sqrt(3)*radius+1.12);
 const xy=rcAxial(q,r,size);
 return {x:400+xy.x,y:400+xy.y,size};
}
function ReviewBoard({
 layout,pawns,title
}:{
 layout:KaleidoLayout;pawns:readonly ResonancePawn[];title:string
}){
 const radius=layout.params.radius;
 const width=(370/(Math.sqrt(3)*radius+1.12))*1.5/800*100+"%";
 const occupied=new Set(pawns.map(p=>p.key));
 return <div className="review-board">
  <h3>{title}</h3>
  <div className="review-board-surface" aria-label={title}>
   <svg className="kaleido-svg" viewBox="0 0 800 800" role="img"
    aria-label={layout.tiles.length+" indizi e "+pawns.length+" Polytroni"}>
    <defs>
     <radialGradient id={pawns.length?"review-answer-bg":"review-request-bg"}>
      <stop offset="0%" stopColor="#284752"/>
      <stop offset="100%" stopColor="#081925"/>
     </radialGradient>
    </defs>
    <rect width="800" height="800"
     fill={"url(#"+(pawns.length?"review-answer-bg":"review-request-bg")+")"}/>
    {layout.cells.map(cell=>{
     const xy=position(cell.q,cell.r,radius);
     const hasHint=layout.tiles.some(t=>t.key===cell.key);
     return <polygon key={cell.key}
      points={rcPolygon(xy.x,xy.y,xy.size*.97)}
      stroke={occupied.has(cell.key)?"#f5d9a1":hasHint?"#8b8ba3":"#335464"}
      strokeWidth={occupied.has(cell.key)?2.7:1.15}
      fill={hasHint?"#40334b":"#12313c"} fillOpacity=".42"/>;
    })}
    {layout.cells.filter(c=>c.ring===0).map(cell=>{
     const xy=position(cell.q,cell.r,radius);
     return <g key={cell.key}>
      <polygon points={rcPolygon(xy.x,xy.y,xy.size*.82)}
       fill="#193e3e" stroke="#d7bb80" strokeWidth="2"/>
      <circle cx={xy.x} cy={xy.y} r={Math.max(4,xy.size*.12)}
       fill="#efdda9"/>
     </g>;
    })}
   </svg>
   <div className="kaleido-tile-layer review-hints">
    {layout.tiles.map(tile=>{
     const p=position(tile.q,tile.r,radius);
     return <div key={tile.key} className="kaleido-polytron"
      data-polytron-viewport="" data-view-kind="flat-z"
      data-dna={tile.dna} data-kaleido-opacity=".43"
      data-kaleido-row={tile.paletteRow} data-kaleido-col={tile.paletteCol}
      data-kaleido-angle={tile.angle}
      data-kaleido-mirror={tile.mirrored?"true":"false"}
      style={{left:p.x/8+"%",top:p.y/8+"%",width,height:width}}/>;
    })}
   </div>
   <div className="kaleido-tile-layer review-pawns">
    {pawns.map(pawn=>{
     const cell=layout.cells.find(c=>c.key===pawn.key)!;
     const p=position(cell.q,cell.r,radius);
     return <div key={pawn.key} className="kaleido-polytron"
      data-polytron-viewport="" data-view-kind="solid"
      data-dna={dnaFromPolitronNumber(pawn.number)}
      data-kaleido-row={pawn.paletteRow} data-kaleido-col={pawn.paletteCol}
      style={{left:p.x/8+"%",top:p.y/8+"%",width,height:width}}/>;
    })}
   </div>
  </div>
  <p>{pawns.length?
   pawns.length+" Polytroni della risposta sopra gli indizi del Mutatron":
   layout.tiles.length+" indizi · nessun Polytrone del giocatore"}</p>
 </div>;
}
function RatingScale({
 label,value,onChange
}:{label:string;value:number|null;onChange:(n:number)=>void}){
 return <fieldset className="review-rating-scale">
  <legend>{label}</legend>
  <div className="review-rating-buttons">
   {Array.from({length:11},(_,n)=><button type="button" key={n}
    className={value===n?"selected":""}
    aria-pressed={value===n} onClick={()=>onChange(n)}>{n}</button>)}
  </div>
  <small>0 = per niente · 10 = moltissimo</small>
 </fieldset>;
}
export default function ResonanceReviewLab(){
 const [ratings,setRatings]=useState<ResonanceReviewRatings>(readLocalRatings);
 const [presetId,setPresetId]=useState<PresetId>("A");
 const [answerId,setAnswerId]=useState<ReviewAnswerId>("1");
 const [draft,setDraft]=useState<Draft>(()=>freshDraft(readLocalRatings()["A-1"]));
 const [dirty,setDirty]=useState(false);
 const [showEngine,setShowEngine]=useState(false);
 const [message,setMessage]=useState("");
 const [storageWarning,setStorageWarning]=useState("");
 const preset=RESONANCE_CALIBRATION_PRESETS.find(p=>p.id===presetId)!;
 // Review uses its own generator instance: changing a review does not modify
 // the generative experience, a player's game state, or scoring weights.
 const layout=useMemo(()=>generateKaleidoscope({
  ...preset.params,generation:0
 }),[preset]);
 const answers=useMemo(()=>buildResonanceReviewAnswers(layout),[layout]);
 const active=answers.find(a=>a.id===answerId)!;
 const caseId=reviewCaseId(presetId,answerId);
 const saved=ratings[caseId];
 const score=useMemo(()=>evaluateResonance(
  layout,active.pawns,DEFAULT_RESONANCE_SETTINGS
 ),[layout,active]);
 const ratedCount=Object.keys(ratings).length;
 const totalCount=RESONANCE_CALIBRATION_PRESETS.length*ANSWER_IDS.length;
 const pick=(nextPreset:PresetId,nextAnswer:ReviewAnswerId)=>{
  if(dirty&&!window.confirm("Valutazione non salvata. Cambiare esempio?"))return;
  const previous=ratings[reviewCaseId(nextPreset,nextAnswer)];
  setPresetId(nextPreset);setAnswerId(nextAnswer);
  setDraft(freshDraft(previous));setDirty(false);
  setShowEngine(false);setMessage("");
 };
 const editDraft=(changes:Partial<Draft>)=>{
  setDraft(prev=>({...prev,...changes}));setDirty(true);setMessage("");
 };
 const save=()=>{
  if(draft.beauty===null||(!draft.fitUnknown&&draft.fit===null))return;
  const entry:ResonanceReviewRating={
   beauty:draft.beauty,
   fit:draft.fitUnknown?null:draft.fit,
   note:draft.note.slice(0,2000),
   savedAt:new Date().toISOString()
  };
  const next={...ratings,[caseId]:entry};
  setRatings(next);setDirty(false);
  try{
   writeLocalRatings(next);
   setStorageWarning("");setMessage("Valutazione "+caseId+" salvata nel browser.");
  }catch{
   setStorageWarning("Il browser non consente il salvataggio locale. Esporta subito il JSON per non perdere i voti.");
   setMessage("Valutazione presente soltanto in questa sessione.");
  }
 };
 const next=()=>{
  const idx=ANSWER_IDS.indexOf(answerId);
  if(idx<ANSWER_IDS.length-1)pick(presetId,ANSWER_IDS[idx+1]);
  else{
   const pIdx=RESONANCE_CALIBRATION_PRESETS.findIndex(p=>p.id===presetId);
   if(pIdx<RESONANCE_CALIBRATION_PRESETS.length-1)
    pick(RESONANCE_CALIBRATION_PRESETS[pIdx+1].id,"1");
  }
 };
 const prev=()=>{
  const idx=ANSWER_IDS.indexOf(answerId);
  if(idx>0)pick(presetId,ANSWER_IDS[idx-1]);
  else{
   const pIdx=RESONANCE_CALIBRATION_PRESETS.findIndex(p=>p.id===presetId);
   if(pIdx>0)pick(RESONANCE_CALIBRATION_PRESETS[pIdx-1].id,"4");
  }
 };
 const exportJSON=()=>{
  try{
   const blob=new Blob([JSON.stringify(
    makeResonanceReviewArchive(ratings),null,2
   )],{type:"application/json"});
   const url=URL.createObjectURL(blob);
   const anchor=document.createElement("a");
   anchor.href=url;anchor.download="mindeleev-review-v1.json";
   document.body.appendChild(anchor);anchor.click();anchor.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),2000);
   setMessage("Esportate "+ratedCount+" valutazioni in JSON.");
  }catch(error){setMessage("Impossibile esportare: "+String(error));}
 };
 const importJSON=async(event:ChangeEvent<HTMLInputElement>)=>{
  const file=event.target.files?.[0];
  event.target.value="";
  if(!file)return;
  try{
   if(file.size>500000)throw Error("Il file supera il limite di 500 KB");
   const imported=parseResonanceReviewArchive(JSON.parse(await file.text()));
   if(!window.confirm("Importare "+Object.keys(imported.ratings).length+
    " valutazioni? Quelle con lo stesso ID sostituiranno i voti salvati qui."))return;
   const merged={...ratings,...imported.ratings};
   writeLocalRatings(merged);
   setRatings(merged);setDraft(freshDraft(merged[caseId]));
   setDirty(false);setShowEngine(false);setStorageWarning("");
   setMessage("Importate "+Object.keys(imported.ratings).length+" valutazioni.");
  }catch(error){
   setMessage("Importazione non riuscita: "+String(error));
  }
 };
 const index=RESONANCE_CALIBRATION_PRESETS.findIndex(p=>p.id===presetId)*
  ANSWER_IDS.length+ANSWER_IDS.indexOf(answerId);
 const canSave=draft.beauty!==null&&(draft.fit!==null||draft.fitUnknown);
 return <section className="review-lab" aria-label="Valutazione umana delle risposte">
  <div className="review-heading">
   <div>
    <p className="kaleido-eyebrow">LABORATORIO DI CALIBRAZIONE · GIUDIZIO UMANO</p>
    <h2>Quale risposta è bella e appropriata?</h2>
    <p>La richiesta del Mutatron è già completa. Confronta la sua figura
     con la risposta preconfigurata, poi assegna due voti indipendenti.
     Non devi piazzare o spostare nulla.</p>
   </div>
   <div className="review-progress">
    <strong>{ratedCount} / {totalCount}</strong>
    <span>risposte valutate</span>
   </div>
  </div>
  <div className="review-toolbar">
   <label>Richiesta
    <select value={presetId} onChange={e=>pick(e.target.value as PresetId,"1")}>
     {RESONANCE_CALIBRATION_PRESETS.map(p=><option key={p.id} value={p.id}>
      {p.id} · {p.title} · {p.params.symmetry} · {p.params.radius} ring
     </option>)}
    </select>
   </label>
   <label>Risposta
    <select value={answerId} onChange={e=>pick(presetId,e.target.value as ReviewAnswerId)}>
     {ANSWER_IDS.map(a=><option key={a} value={a}>
      Risposta {a}{ratings[reviewCaseId(presetId,a)]?" ✓":""}
     </option>)}
    </select>
   </label>
   <div className="review-toolbar-buttons">
    <button type="button" onClick={prev} disabled={index===0}>← Precedente</button>
    <button type="button" onClick={next}
     disabled={index===totalCount-1}>Successiva →</button>
   </div>
  </div>
  <div className="review-meta">
   <strong>Caso {caseId}</strong>
   <span>{preset.params.family} · {preset.params.symmetry} · raggio {preset.params.radius}
    {" "}· seed {preset.params.seed} · {layout.tiles.length} indizi</span>
   {saved&&<span className="review-saved">Già valutato</span>}
   {dirty&&<span className="review-unsaved">Modifiche da salvare</span>}
  </div>
  <div className="review-boards">
   <ReviewBoard layout={layout} pawns={[]} title="Domanda · solo indizi"/>
   <ReviewBoard layout={layout} pawns={active.pawns}
    title={"Risposta "+answerId+" · indizi + Polytroni"}/>
  </div>
  <div className="review-vote-card">
   <div className="review-vote-intro">
    <h3>Il tuo giudizio</h3>
    <p>Valuta secondo la tua percezione, anche se il risultato non è simmetrico.
     Il punteggio calcolato dall'algoritmo è nascosto fino al salvataggio.</p>
   </div>
   <RatingScale label="1. Gradevolezza · Quanto ti piace questa composizione?"
    value={draft.beauty} onChange={n=>editDraft({beauty:n})}/>
   <RatingScale label="2. Appropriatezza · Quanto risponde bene alla richiesta?"
    value={draft.fitUnknown?null:draft.fit}
    onChange={n=>editDraft({fit:n,fitUnknown:false})}/>
   <label className="review-unknown">
    <input type="checkbox" checked={draft.fitUnknown}
     onChange={e=>editDraft({fitUnknown:e.target.checked,fit:null})}/>
    Non riesco ancora a giudicare l'appropriatezza
   </label>
   <label className="review-note-label">Osservazioni (facoltative)
    <textarea rows={2} maxLength={2000} value={draft.note}
     onChange={e=>editDraft({note:e.target.value})}
     placeholder="Cosa rende la risposta bella, confusa, convincente o fuori luogo?"/>
   </label>
   <div className="review-vote-actions">
    <button className="review-save" type="button" onClick={save}
     disabled={!canSave}>Salva valutazione {caseId}</button>
    <button type="button" onClick={next}
     disabled={index===totalCount-1}>Prossimo esempio</button>
   </div>
   {message&&<p className="review-message" role="status">{message}</p>}
   {storageWarning&&<p className="review-warning" role="alert">{storageWarning}</p>}
  </div>
  <div className="review-reveal">
   <button type="button" disabled={!saved||dirty}
    onClick={()=>setShowEngine(prev=>!prev)}>
    {showEngine?"Nascondi analisi":"Mostra algoritmo e metodo dopo il voto"}
   </button>
   {showEngine&&saved&&!dirty&&<div className="review-engine">
    <div><small>Risonanza attuale</small><strong>{fmt(score.quality)}%</strong></div>
    <div><small>Locale</small><strong>{fmt(score.local)}%</strong></div>
    <div><small>Armonia</small><strong>{fmt(score.structural)}%</strong></div>
    <p>{active.method} Valutazione calcolata con il valutatore attuale e
     portata di risonanza 2. Questa stima non influenza i tuoi voti.</p>
   </div>}
  </div>
  <div className="review-data">
   <div>
    <h3>Conservazione dei giudizi</h3>
    <p>I voti sono salvati <b>solo in questo browser e su questo dispositivo</b>
     tramite localStorage, senza server o database. Esporta regolarmente una copia
     JSON; cancellare i dati del sito o usare un altro dispositivo non trasferisce i voti.</p>
   </div>
   <div className="review-data-buttons">
    <button type="button" onClick={exportJSON}>Esporta JSON</button>
    <label className="review-import">Importa JSON
     <input type="file" accept=".json,application/json" onChange={importJSON}/>
    </label>
   </div>
  </div>
  <p className="review-disclaimer">Esperimento di ricerca: nessuna modifica al generatore
   artistico, all'economia o allo scoring. I voti descrivono il tuo gusto;
   non sono ancora dati sufficienti per validare una rete neurale.</p>
 </section>;
}
