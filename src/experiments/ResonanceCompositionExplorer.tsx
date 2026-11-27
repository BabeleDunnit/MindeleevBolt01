import {useMemo,useState,type ChangeEvent} from "react";
import {
 generateKaleidoscope,KALEIDOSCOPE_FAMILIES,KALEIDOSCOPE_SYMMETRIES,
 type KaleidoLayout,type KaleidoParams
} from "@/polytron/kaleidoscopeGenerator";
import {RESONANCE_CALIBRATION_PRESETS} from "@/polytron/resonanceCalibration";
import {rcAxial,rcPolygon} from "@/polytron/rc01Board";
import {dnaFromPolitronNumber} from "@/polytron/politronicNumber";
import {
 LATIN_SOURCES,GREEK_DESTINATIONS
} from "@/polytron/gradientPalettes";
import {scoreResonance} from "@/polytron/resonanceField";
import {
 generateExplorerPair,varyExplorerComposition,inspectExplorerComposition,
 explorerQuestionSignature,type ExplorerComposition,type ExplorerVariation
} from "@/polytron/resonanceCompositionExplorer";
import {
 EXPLORER_STORAGE_KEY,archiveExplorerData,emptyExplorerArchive,
 parseExplorerArchive,type ExplorerArchive,type ExplorerComparison,
 type ExplorerFavorite,type ExplorerPreference,type ExplorerVerdict
} from "@/polytron/resonanceExplorerArchive";
import "./ResonanceCompositionExplorer.css";

type Side="A"|"B";
type Mode="add"|"move";
const DEFAULT_PARAMS:KaleidoParams={
 radius:4,family:"crystal",symmetry:"C3",seed:17,generation:0
};
const NO_VOTE:ExplorerVerdict={beauty:"incerto",fit:"incerto",note:""};
const PREFERENCE_OPTIONS:readonly {
 id:ExplorerPreference;label:string
}[]=[
 {id:"A",label:"Preferisco A"},
 {id:"B",label:"Preferisco B"},
 {id:"pari",label:"Equivalenti"},
 {id:"nessuna",label:"Nessuna"},
 {id:"incerto",label:"Non so"}
];
function newId(prefix:string){
 return prefix+"-"+Date.now().toString(36)+"-"+
  Math.random().toString(36).slice(2,10);
}
function storedArchive(){
 if(typeof window==="undefined")return emptyExplorerArchive();
 try{
  const raw=window.localStorage.getItem(EXPLORER_STORAGE_KEY);
  return raw?parseExplorerArchive(JSON.parse(raw)):emptyExplorerArchive();
 }catch{return emptyExplorerArchive();}
}
function position(q:number,r:number,radius:number){
 const unit=370/(Math.sqrt(3)*radius+1.12);
 const xy=rcAxial(q,r,unit);
 return {x:400+xy.x,y:400+xy.y,size:unit};
}
function Board({
 layout,composition,title,selected,onCell,kind
}:{
 layout:KaleidoLayout;composition:ExplorerComposition|null;title:string;
 selected?:string|null;onCell?:(key:string)=>void;kind:"question"|"response"
}){
 const radius=layout.params.radius;
 const width=370/(Math.sqrt(3)*radius+1.12)*1.5/8+"%";
 const occupied=new Set(composition?.pawns.map(p=>p.key)??[]);
 return <div className={"explorer-board "+(kind==="question"?"is-question":"is-response")}>
  <h3>{title}</h3>
  <div className="explorer-surface">
   <svg className="kaleido-svg" viewBox="0 0 800 800" role="img"
    aria-label={layout.tiles.length+" indizi e "+occupied.size+" Polytroni"}>
    <defs>
     <radialGradient id={kind==="question"?"explorer-question-bg":"explorer-response-bg"}>
      <stop offset="0%" stopColor="#284c55"/>
      <stop offset="100%" stopColor="#091925"/>
     </radialGradient>
    </defs>
    <rect width="800" height="800"
     fill={"url(#"+(kind==="question"?"explorer-question-bg":"explorer-response-bg")+")"}/>
    {layout.cells.map(cell=>{
     const xy=position(cell.q,cell.r,radius);
     const hint=layout.tiles.some(t=>t.key===cell.key);
     return <polygon key={cell.key}
      points={rcPolygon(xy.x,xy.y,xy.size*.98)}
      fill={hint?"#4a3651":"#142f39"} fillOpacity=".45"
      stroke={selected===cell.key?"#baffcd":occupied.has(cell.key)?"#e8c994":
       hint?"#856e94":"#345763"}
      strokeWidth={selected===cell.key?4:occupied.has(cell.key)?2.6:1.2}/>;
    })}
    {layout.cells.filter(c=>c.ring===0).map(cell=>{
     const xy=position(cell.q,cell.r,radius);
     return <g key={cell.key}>
      <polygon points={rcPolygon(xy.x,xy.y,xy.size*.84)}
       fill="#1e4542" stroke="#e0c58b" strokeWidth="2"/>
      <circle cx={xy.x} cy={xy.y} r={Math.max(4,xy.size*.12)}
       fill="#f3d9a1"/>
     </g>;
    })}
   </svg>
   <div className="kaleido-tile-layer explorer-hint-layer">
    {layout.tiles.map(tile=>{
     const xy=position(tile.q,tile.r,radius);
     return <div key={tile.key} className="kaleido-polytron"
      data-polytron-viewport="" data-view-kind="flat-z"
      data-dna={tile.dna} data-kaleido-opacity=".35"
      data-kaleido-row={tile.paletteRow} data-kaleido-col={tile.paletteCol}
      data-kaleido-angle={tile.angle}
      data-kaleido-mirror={tile.mirrored?"true":"false"}
      style={{left:xy.x/8+"%",top:xy.y/8+"%",width,height:width}}/>;
    })}
   </div>
   {composition&&<div className="kaleido-tile-layer explorer-pawn-layer">
    {composition.pawns.map(pawn=>{
     const cell=layout.cells.find(c=>c.key===pawn.key)!;
     const xy=position(cell.q,cell.r,radius);
     return <div key={pawn.key} className="kaleido-polytron"
      data-polytron-viewport="" data-view-kind="solid"
      data-dna={dnaFromPolitronNumber(pawn.number)}
      data-kaleido-row={pawn.paletteRow} data-kaleido-col={pawn.paletteCol}
      style={{left:xy.x/8+"%",top:xy.y/8+"%",width,height:width}}/>;
    })}
   </div>}
   {onCell&&<div className="kaleido-select-layer explorer-hit-layer">
    {layout.cells.filter(c=>c.ring>0).map(cell=>{
     const xy=position(cell.q,cell.r,radius);
     return <button type="button" key={cell.key}
      className={"explorer-hit "+(selected===cell.key?"is-selected":"")}
      onClick={()=>onCell(cell.key)}
      aria-label={(occupied.has(cell.key)?"Seleziona Polytrone":"Piazza Polytrone")+
       " in "+cell.key}
      style={{left:xy.x/8+"%",top:xy.y/8+"%",width,height:width}}/>;
    })}
   </div>}
  </div>
  {composition?(()=>{
   const metrics=inspectExplorerComposition(composition.pawns);
   return <div className="explorer-board-metrics">
    <span><b>{metrics.pieces}</b> Polytroni</span>
    <span><b>{metrics.palettes}</b> palette</span>
    <span><b>{metrics.groups}</b> gruppi</span>
    <span><b>{metrics.energy}</b> E impegnate</span>
   </div>;
  })():<p className="explorer-board-caption">
   Richiesta completa · {layout.tiles.length} indizi, nessun Polytrone
  </p>}
 </div>;
}
function Votes({
 title,value,onChange
}:{
 title:string;value:ExplorerPreference|null;
 onChange:(v:ExplorerPreference)=>void
}){
 return <fieldset className="explorer-votes">
  <legend>{title}</legend>
  <div>
   {PREFERENCE_OPTIONS.map(option=><button type="button"
    key={option.id} className={value===option.id?"is-chosen":""}
    aria-pressed={value===option.id} onClick={()=>onChange(option.id)}>
    {option.label}</button>)}
  </div>
 </fieldset>;
}
type Props={
 rotatePolytrons:boolean;
 onRotatePolytronsChange:(rotate:boolean)=>void
};
export default function ResonanceCompositionExplorer({
 rotatePolytrons,onRotatePolytronsChange
}:Props){
 const [question,setQuestion]=useState<KaleidoParams>(DEFAULT_PARAMS);
 const [pending,setPending]=useState<KaleidoParams>(DEFAULT_PARAMS);
 const [count,setCount]=useState(10);
 const [pairSeed,setPairSeed]=useState(41);
 const layout=useMemo(()=>generateKaleidoscope(question),[question]);
 const [pair,setPair]=useState<[ExplorerComposition,ExplorerComposition]>(()=>{
  return generateExplorerPair(generateKaleidoscope(DEFAULT_PARAMS),10,41);
 });
 const [variation,setVariation]=useState<ExplorerVariation>("geometria");
 const [side,setSide]=useState<Side>("A");
 const [selected,setSelected]=useState<string|null>(null);
 const [editMode,setEditMode]=useState<Mode>("add");
 const [number,setNumber]=useState(4);
 const [paletteRow,setPaletteRow]=useState(2);
 const [paletteCol,setPaletteCol]=useState(4);
 const [beauty,setBeauty]=useState<ExplorerPreference|null>(null);
 const [fit,setFit]=useState<ExplorerPreference|null>(null);
 const [note,setNote]=useState("");
 const [revealed,setRevealed]=useState(false);
 const [archive,setArchive]=useState<ExplorerArchive>(storedArchive);
 const [storageWarning,setStorageWarning]=useState("");
 const [message,setMessage]=useState("");
 const [favoriteLabel,setFavoriteLabel]=useState("");
 const [favoriteId,setFavoriteId]=useState("");
 const active=pair[side==="A"?0:1];
 const selectedPawn=active.pawns.find(p=>p.key===selected);
 const clearAssessment=()=>{
  setBeauty(null);setFit(null);setNote("");setRevealed(false);
  setMessage("");
 };
 const resetEditor=()=>{
  setSelected(null);setEditMode("add");
 };
 const askDiscard=()=>!(beauty||fit)||
  window.confirm("Preferenza non salvata. Proseguire senza registrarla?");
 const persist=(next:ExplorerArchive)=>{
  setArchive(next);
  try{
   window.localStorage.setItem(EXPLORER_STORAGE_KEY,JSON.stringify(next));
   setStorageWarning("");return true;
  }catch{
   setStorageWarning("Salvataggio locale non disponibile. Esporta JSON "+
    "prima di chiudere questa scheda.");return false;
  }
 };
 const updateSide=(which:Side,next:ExplorerComposition)=>{
  if(!("pawns" in next))return;
  setPair(old=>which==="A"?[next,old[1]]:[old[0],next]);
  clearAssessment();
 };
 const changeQuestion=(params:KaleidoParams)=>{
  if(!askDiscard())return;
  const target=generateKaleidoscope(params);
  const next=pairSeed+1;
  setQuestion(params);setPending(params);setPairSeed(next);
  setPair(generateExplorerPair(target,count,next));
  resetEditor();clearAssessment();
 };
 const newPair=()=>{
  if(!askDiscard())return;
  const next=pairSeed+1;
  setPair(generateExplorerPair(layout,count,next));setPairSeed(next);
  resetEditor();clearAssessment();
 };
 const varyB=()=>{
  if(!askDiscard())return;
  const next=pairSeed+1;
  updateSide("B",varyExplorerComposition(layout,pair[0],next,variation));
  setPairSeed(next);setSide("B");resetEditor();
 };
 const switchSide=(next:Side)=>{
  setSide(next);resetEditor();
 };
 const editCell=(which:Side,key:string)=>{
  switchSide(which);
  const composition=pair[which==="A"?0:1];
  const pawn=composition.pawns.find(p=>p.key===key);
  if(pawn){
   setSelected(key);setNumber(pawn.number);
   setPaletteRow(pawn.paletteRow);setPaletteCol(pawn.paletteCol);
   return;
  }
  if(editMode==="move"&&which===side&&selected&&
   composition.pawns.some(p=>p.key===selected)){
   updateSide(which,{style:"manuale",provenance:"Modificata dal giocatore",
    pawns:composition.pawns.map(p=>p.key===selected?{...p,key}:p)});
   setSelected(key);return;
  }
  if(composition.pawns.length>=Math.min(30,layout.cells.length-1)){
   setMessage("Limite di 30 Polytroni in questa composizione.");return;
  }
  updateSide(which,{style:"manuale",provenance:"Modificata dal giocatore",
   pawns:[...composition.pawns,{key,number,paletteRow,paletteCol}]});
  setSelected(key);
 };
 const editProperties=()=>{
  if(!selectedPawn)return;
  updateSide(side,{style:"manuale",provenance:"Modificata dal giocatore",
   pawns:active.pawns.map(p=>p.key===selected?
    {...p,number,paletteRow,paletteCol}:p)});
 };
 const removeSelected=()=>{
  if(!selectedPawn)return;
  updateSide(side,{style:"manuale",provenance:"Modificata dal giocatore",
   pawns:active.pawns.filter(p=>p.key!==selected)});
  resetEditor();
 };
 const cloneA=()=>{
  if(!askDiscard())return;
  updateSide("B",{...pair[0],
   pawns:pair[0].pawns.map(p=>({...p})),
   provenance:"Copia manuale della risposta A"});
  switchSide("B");
 };
 const record=()=>{
  if(!beauty||!fit)return;
  const entry:ExplorerComparison={
   id:newId("compare"),createdAt:new Date().toISOString(),
   question:{...question},
   a:{...pair[0],pawns:pair[0].pawns.map(p=>({...p}))},
   b:{...pair[1],pawns:pair[1].pawns.map(p=>({...p}))},
   verdict:{beauty,fit,note:note.slice(0,2000)}
  };
  const next=archiveExplorerData([...archive.comparisons,entry],
   archive.favorites);
  const stored=persist(next);
  setRevealed(true);
  setBeauty(null);setFit(null);setNote("");
  setMessage(stored?"Confronto salvato: "+next.comparisons.length+
   " valutazioni totali.":"Confronto conservato solo in questa sessione.");
 };
 const saveFavorite=()=>{
  if(active.pawns.length===0)return;
  const entry:ExplorerFavorite={
   id:newId("favorite"),createdAt:new Date().toISOString(),
   label:(favoriteLabel.trim()||"Composizione "+side+
    " · "+explorerQuestionSignature(layout)).slice(0,100),
   question:{...question},composition:{
    ...active,pawns:active.pawns.map(p=>({...p}))
   }
  };
  persist(archiveExplorerData(archive.comparisons,
   [...archive.favorites,entry]));
  setFavoriteId(entry.id);setFavoriteLabel("");
  setMessage("Composizione "+side+" salvata nella raccolta.");
 };
 const loadFavorite=()=>{
  const item=archive.favorites.find(f=>f.id===favoriteId);
  if(!item||!askDiscard())return;
  const target=generateKaleidoscope(item.question);
  const next=pairSeed+1;
  const original:ExplorerComposition={
   ...item.composition,pawns:item.composition.pawns.map(p=>({...p}))
  };
  const variant=varyExplorerComposition(target,original,next,"geometria");
  setQuestion(item.question);setPending(item.question);
  setPair([original,variant]);setPairSeed(next);setSide("A");
  resetEditor();clearAssessment();
  setMessage("Preferita caricata in A; B è una variazione spaziale.");
 };
 const exportJSON=()=>{
  try{
   const blob=new Blob([JSON.stringify(archive,null,2)],
    {type:"application/json"});
   const url=URL.createObjectURL(blob);
   const anchor=document.createElement("a");
   anchor.href=url;anchor.download="mindeleev-explorer-v2.json";
   document.body.appendChild(anchor);anchor.click();anchor.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),2000);
   setMessage("Esportate "+archive.comparisons.length+
    " preferenze e "+archive.favorites.length+" composizioni.");
  }catch(error){setMessage("Esportazione non riuscita: "+String(error));}
 };
 const importJSON=async(event:ChangeEvent<HTMLInputElement>)=>{
  const file=event.target.files?.[0];event.target.value="";
  if(!file)return;
  try{
   if(file.size>5_000_000)throw Error("File troppo grande (massimo 5 MB)");
   const imported=parseExplorerArchive(JSON.parse(await file.text()));
   if(!window.confirm("Importare "+imported.comparisons.length+
    " confronti e "+imported.favorites.length+
    " composizioni? Gli ID uguali saranno sostituiti."))return;
   const comparisons=new Map(archive.comparisons.map(c=>[c.id,c]));
   const favorites=new Map(archive.favorites.map(f=>[f.id,f]));
   for(const c of imported.comparisons)comparisons.set(c.id,c);
   for(const f of imported.favorites)favorites.set(f.id,f);
   persist(archiveExplorerData([...comparisons.values()],
    [...favorites.values()]));
   setMessage("Archivio JSON importato e verificato.");
  }catch(error){setMessage("Importazione rifiutata: "+String(error));}
 };
 const shown=useMemo(()=>revealed?[
  scoreResonance(layout,pair[0].pawns),
  scoreResonance(layout,pair[1].pawns)
 ]:null,[revealed,layout,pair]);
 return <section className="explorer-lab">
  <header className="explorer-intro">
   <div>
    <p className="kaleido-eyebrow">MINDELEEV · ESPLORAZIONE COMPOSITIVA</p>
    <h2>Cerca risposte interessanti, poi confrontale</h2>
    <p>Il Mutatron propone una domanda completa. Qui puoi generare,
     trasformare e salvare risposte con molti Polytroni e palette.
     <b> Non esistono risposte pre-etichettate come belle o corrette.</b></p>
   </div>
   <div className="explorer-counter">
    <strong>{archive.comparisons.length}</strong><span>confronti salvati</span>
    <strong>{archive.favorites.length}</strong><span>composizioni salvate</span>
   </div>
  </header>
  <div className="explorer-request-controls">
   <div className="explorer-control-title">
    <h3>1 · Scegli la domanda del Mutatron</h3>
    <p>Le richieste provengono sempre dal generatore artistico originale.</p>
   </div>
   <label>Biblioteca iniziale
    <select value={RESONANCE_CALIBRATION_PRESETS.find(p=>
     p.params.family===pending.family&&p.params.symmetry===pending.symmetry&&
     p.params.radius===pending.radius&&p.params.seed===pending.seed
    )?.id??"custom"} onChange={e=>{
     const preset=RESONANCE_CALIBRATION_PRESETS.find(p=>p.id===e.target.value);
     if(preset)setPending({...preset.params,generation:0});
    }}>
     <option value="custom">Ricetta libera</option>
     {RESONANCE_CALIBRATION_PRESETS.map(p=><option key={p.id} value={p.id}>
      {p.id} · {p.title} · {p.params.symmetry}
     </option>)}
    </select>
   </label>
   <label>Grammatica
    <select value={pending.family} onChange={e=>setPending(p=>({
     ...p,family:e.target.value as KaleidoParams["family"]
    }))}>
     {KALEIDOSCOPE_FAMILIES.map(f=><option key={f} value={f}>{f}</option>)}
    </select>
   </label>
   <label>Simmetria
    <select value={pending.symmetry} onChange={e=>setPending(p=>({
     ...p,symmetry:e.target.value as KaleidoParams["symmetry"]
    }))}>
     {KALEIDOSCOPE_SYMMETRIES.map(s=><option key={s}>{s}</option>)}
    </select>
   </label>
   <label>Raggio
    <select value={pending.radius} onChange={e=>setPending(p=>({
     ...p,radius:Number(e.target.value)
    }))}>
     {[2,3,4,5].map(r=><option key={r} value={r}>{r}</option>)}
    </select>
   </label>
   <label>Seed
    <input type="number" min="0" max="2147483647" value={pending.seed}
     onChange={e=>setPending(p=>({...p,seed:Math.max(0,
      Math.min(2147483647,Math.floor(Number(e.target.value)||0)))}))}/>
   </label>
   <div className="explorer-request-buttons">
    <button type="button" onClick={()=>changeQuestion({...pending,generation:0})}>
     Carica domanda
    </button>
    <button type="button" onClick={()=>changeQuestion({
     ...pending,seed:(pending.seed+1)%2147483647,generation:0
    })}>Nuova origine +1</button>
   </div>
  </div>
  <div className="explorer-generative-controls">
   <div>
    <h3>2 · Esplora due risposte diverse</h3>
    <p>Il campionatore non usa il punteggio attuale per scegliere cosa mostrarti.</p>
   </div>
   <label>Polytroni iniziali per risposta
    <select value={count} onChange={e=>setCount(Number(e.target.value))}>
     {[5,7,9,10,12,15].map(n=><option key={n} value={n}>{n}</option>)}
    </select>
   </label>
   <button type="button" onClick={newPair} className="explorer-primary">
    Genera nuova coppia
   </button>
   <label>Variazione controllata
    <select value={variation} onChange={e=>setVariation(
     e.target.value as ExplorerVariation)}>
     <option value="geometria">Solo posizioni</option>
     <option value="palette">Solo palette</option>
     <option value="libera">Composizione libera</option>
    </select>
   </label>
   <button type="button" onClick={varyB}>Varia B partendo da A</button>
   <button type="button" onClick={cloneA}>Copia A in B per modificarla</button>
   <label className="explorer-rotation-toggle">
    <input type="checkbox" checked={rotatePolytrons}
     onChange={e=>onRotatePolytronsChange(e.target.checked)}/>
    <span>Ruota i Polytroni
     <small>Solo i solidi delle risposte · tile-indizio fermi e invariati</small>
    </span>
   </label>
  </div>
  <div className="explorer-boards">
   <Board layout={layout} composition={null}
    title={"Domanda · "+question.symmetry+" · "+layout.tiles.length+" indizi"}
    kind="question"/>
   <div className={"explorer-response-wrap "+(side==="A"?"is-active":"")}>
    <Board layout={layout} composition={pair[0]} title="Risposta A"
     kind="response" selected={side==="A"?selected:null}
     onCell={key=>editCell("A",key)}/>
    <button type="button" className="explorer-activate"
     onClick={()=>switchSide("A")} aria-pressed={side==="A"}>
     {side==="A"?"Stai modificando A":"Modifica A"}
    </button>
   </div>
   <div className={"explorer-response-wrap "+(side==="B"?"is-active":"")}>
    <Board layout={layout} composition={pair[1]} title="Risposta B"
     kind="response" selected={side==="B"?selected:null}
     onCell={key=>editCell("B",key)}/>
    <button type="button" className="explorer-activate"
     onClick={()=>switchSide("B")} aria-pressed={side==="B"}>
     {side==="B"?"Stai modificando B":"Modifica B"}
    </button>
   </div>
  </div>
  <section className="explorer-editor">
   <div>
    <h3>3 · Modifica una risposta</h3>
    <p>Seleziona un Polytrone nella plancia {side} per cambiarlo.
     Tocca una cella vuota per aggiungerne uno o spostare quello selezionato.</p>
   </div>
   <div className="explorer-editor-fields">
    <label>Manifestazione
     <input type="number" min="1" max="500" value={number}
      onChange={e=>setNumber(Math.max(1,Math.min(500,Math.floor(
       Number(e.target.value)||1))))}/>
    </label>
    <label>Palette iniziale
     <select value={paletteRow} onChange={e=>setPaletteRow(Number(e.target.value))}>
      {LATIN_SOURCES.map((p,i)=><option value={i} key={p.id}>{p.name}</option>)}
     </select>
    </label>
    <label>Palette finale
     <select value={paletteCol} onChange={e=>setPaletteCol(Number(e.target.value))}>
      {GREEK_DESTINATIONS.map((p,i)=><option value={i} key={p.id}>{p.name}</option>)}
     </select>
    </label>
    <label>Strumento
     <select value={editMode} onChange={e=>setEditMode(e.target.value as Mode)}>
      <option value="add">Aggiungi / seleziona</option>
      <option value="move">Sposta il selezionato</option>
     </select>
    </label>
   </div>
   <div className="explorer-editor-actions">
    <button type="button" disabled={!selectedPawn}
     onClick={editProperties}>Applica proprietà al Polytrone selezionato</button>
    <button type="button" disabled={!selectedPawn}
     onClick={removeSelected}>Rimuovi selezionato</button>
    <span>{selectedPawn?"Cella "+selectedPawn.key:
     "Nessun Polytrone selezionato"} · risposta {side}</span>
   </div>
  </section>
  <section className="explorer-evaluation">
   <div>
    <h3>4 · Quale risposta preferisci?</h3>
    <p>Giudica prima di vedere il punteggio automatico.
     «Nessuna» e «Non so» sono risposte utili.
     La domanda è la stessa per A e B.</p>
   </div>
   <Votes title="Gradevolezza · quale composizione ti piace di più?"
    value={beauty} onChange={v=>{setBeauty(v);setRevealed(false);}}/>
   <Votes title="Appropriatezza · quale risponde meglio al Mutatron?"
    value={fit} onChange={v=>{setFit(v);setRevealed(false);}}/>
   <label className="explorer-note">Perché? (facoltativo)
    <textarea rows={2} maxLength={2000} value={note}
     onChange={e=>setNote(e.target.value)}
     placeholder="Cosa noti? Armonia, contrasto, ripetizioni, squilibri…"/>
   </label>
   <button type="button" className="explorer-primary explorer-submit"
    disabled={!beauty||!fit} onClick={record}>
    Salva confronto e mostra analisi
   </button>
   {revealed&&shown&&<div className="explorer-post-analysis">
    <strong>Il valutatore attuale (non usato per scegliere gli esempi)</strong>
    <div><span>Qualità A · {shown[0].quality.toFixed(1)}%</span>
     <span>Qualità B · {shown[1].quality.toFixed(1)}%</span></div>
    <p>A: {pair[0].provenance}. B: {pair[1].provenance}.
     Il tuo giudizio è già stato salvato e non è stato influenzato dal motore.</p>
   </div>}
  </section>
  <section className="explorer-library">
   <div>
    <h3>5 · Conserva le composizioni promettenti</h3>
    <p>Salva una risposta che ti interessa, anche prima di valutarla.
     Puoi poi riaprirla e generare varianti anziché ripartire da zero.</p>
   </div>
   <div className="explorer-library-controls">
    <label>Nome facoltativo
     <input value={favoriteLabel} maxLength={100}
      onChange={e=>setFavoriteLabel(e.target.value)}
      placeholder="Es. Arcipelago cromatico"/>
    </label>
    <button type="button" disabled={active.pawns.length===0}
     onClick={saveFavorite}>Salva risposta {side} nella raccolta</button>
   </div>
   {archive.favorites.length>0&&<div className="explorer-library-controls">
    <label>Composizioni salvate
     <select value={favoriteId} onChange={e=>setFavoriteId(e.target.value)}>
      <option value="">Scegli una composizione</option>
      {archive.favorites.map(item=><option key={item.id} value={item.id}>
       {item.label}
      </option>)}
     </select>
    </label>
    <button type="button" disabled={!favoriteId} onClick={loadFavorite}>
     Riapri in A e genera variazione B
    </button>
   </div>}
  </section>
  <section className="explorer-storage">
   <div>
    <h3>I tuoi dati restano su questo dispositivo</h3>
    <p>Archivio locale distinto dalle 15 votazioni del primo laboratorio:
     qui conserviamo domande, entrambe le risposte complete, preferenze e note.
     Nessun database, nessun invio al server. Fai periodicamente un backup JSON.</p>
   </div>
   <div className="explorer-storage-actions">
    <button type="button" onClick={exportJSON}>Esporta JSON</button>
    <label className="explorer-import">Importa JSON
     <input type="file" accept=".json,application/json" onChange={importJSON}/>
    </label>
   </div>
   {message&&<p role="status" className="explorer-status">{message}</p>}
   {storageWarning&&<p role="alert" className="explorer-warning">{storageWarning}</p>}
  </section>
  <p className="explorer-disclaimer">Questo laboratorio genera ipotesi e campioni
   compositivi, non risultati già validati del Design Team. Nessuna modifica
   allo scoring, al generatore artistico o all'economia di gioco.</p>
 </section>;
}
