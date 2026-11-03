import {useEffect,useMemo,useRef,useState} from "react";
import {ArrowRight,Atom,Check,ChevronLeft,ChevronRight,
 Home,Move,RotateCcw,Search,Undo2} from "lucide-react";
import {dnaFromPolitronNumber} from "@/polytron/politronicNumber";
import LifePolytron3D from "@/experiments/LifePolytron3D";
import {allHexes,groupOf,hexKey,intrinsicEnergy}
 from "@/polytron/mindeleevLife";
import {availableSeals,boardEnergy,commitSpectralFuture,
 enumerateSpectralFutures,invariantTotal,makeSpectralPreset,
 populationInvariant,relocate,sealName,sendHome,summon,
 SPECTRAL_SEALS,type Journey,type SpectralFuture,type SpectralPreset,
 type SpectralState} from "@/polytron/spectralFutures";
import "./MindeleevLifeLab.css";
import "./MindeleevSpectralLab.css";

const POINTS=allHexes(),SIZE=33,CX=450,CY=374;
const hues=["#e5a6d9","#86d6eb","#efbc8a","#b9dd8a","#b4a8f6"];
const fmt=(n:number)=>n.toLocaleString("it-IT");
const xy=(q:number,r:number)=>({
 x:CX+Math.sqrt(3)*SIZE*(q+r/2),y:CY+1.5*SIZE*r
});
const pointFor=(key:string)=>{
 const [q,r]=key.split(",").map(Number);return xy(q,r);
};
const homeFor=(seal:number)=>{
 const angle=Math.PI*2*(seal-1)/SPECTRAL_SEALS-Math.PI/2;
 return {x:CX+395*Math.cos(angle),y:CY+333*Math.sin(angle)};
};
const polygon=(x:number,y:number,size=SIZE-1.2)=>Array.from({length:6},(_,i)=>{
 const a=(Math.PI/180)*(60*i-90);
 return (x+size*Math.cos(a)).toFixed(1)+","+(y+size*Math.sin(a)).toFixed(1);
}).join(" ");
const presets:{id:SpectralPreset;label:string;detail:string}[]=[
 {id:"interference",label:"Interferenza",detail:"Un individuo, più fusioni alternative"},
 {id:"corona",label:"Corona 6",detail:"Sei Polytroni identici, fusione esagonale"},
 {id:"triade",label:"Triade",detail:"Simmetria rotazionale d'ordine 3"},
 {id:"fissione",label:"Fissione",detail:"Dal #31 fino a sei figli #6"},
 {id:"empty",label:"Tabula rasa",detail:"Costruisci liberamente un esperimento"}
];
type Dance={future:SpectralFuture};
const story=(future:SpectralFuture)=>{
 const kind=future.reactions.map(r=>r.kind==="fusion"?"fusione":"fissione");
 return `${future.reactions.length} reazione/i (${kind.join(", ")}); ${future.departures.length} ritorni, ${future.arrivals.length} richiami; budget ${future.delta>=0?"+":""}${future.delta} E.`;
};
function Flight({trip,kind}:{trip:Journey;kind:"return"|"summon"}){
 const cell=pointFor(trip.key),home=homeFor(trip.manifestation.seal);
 const from=kind==="return"?cell:home,to=kind==="return"?home:cell;
 return <g className={"ms-flight ms-"+kind}>
  <path d={`M ${from.x} ${from.y} Q ${(from.x+to.x)/2} ${(from.y+to.y)/2-75} ${to.x} ${to.y}`}
   fill="none" stroke={kind==="return"?"#ffa796":"#9cf5cb"} strokeOpacity=".35"
   strokeWidth="1.8" strokeDasharray="5 7"/>
  <circle cx={from.x} cy={from.y} r="10"
   fill={kind==="return"?"#ffab91":"#a5f4c6"} opacity=".9">
   <animate attributeName="cx" from={String(from.x)} to={String(to.x)} dur="1.55s" fill="freeze"/>
   <animate attributeName="cy" from={String(from.y)} to={String(to.y)} dur="1.55s" fill="freeze"/>
   <animate attributeName="r" values="10;15;7" dur="1.55s" fill="freeze"/>
  </circle>
 </g>;
}
export default function MindeleevSpectralLab(){
 const [preset,setPreset]=useState<SpectralPreset>("interference");
 const [game,setGame]=useState<SpectralState>(()=>makeSpectralPreset("interference"));
 const [history,setHistory]=useState<SpectralState[]>([]);
 const [selectedKey,setSelectedKey]=useState("0,0");
 const [selectedFutureId,setSelectedFutureId]=useState<string|null>(null);
 const [focusOnly,setFocusOnly]=useState(true);
 const [numberInput,setNumberInput]=useState("6");
 const [moveSource,setMoveSource]=useState<string|null>(null);
 const [dance,setDance]=useState<Dance|null>(null);
 const [notice,setNotice]=useState("Il Mutatron ha più futuri possibili. Scegline uno prima della danza.");
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(timer.current!==null)clearTimeout(timer.current);},[]);
 const catalog=useMemo(()=>enumerateSpectralFutures(game,focusOnly?selectedKey:null,24),
  [game,focusOnly,selectedKey]);
 const active=useMemo(()=>catalog.futures.find(f=>f.id===selectedFutureId)??
  catalog.futures[0]??null,[catalog,selectedFutureId]);
 const activeIndex=active?catalog.futures.findIndex(f=>f.id===active.id):0;
 const boardPreview=active?.board??game.board;
 const home=availableSeals(game);
 const chosen=game.board.get(selectedKey);
 const energyBefore=boardEnergy(game.board);
 const conserved=invariantTotal(game);
 const changedKeys=useMemo(()=>{
  const keys=new Set<string>();
  if(active){
   for(const x of active.departures)keys.add(x.key);
   for(const x of active.arrivals)keys.add(x.key);
  }
  return keys;
 },[active]);
 const record=(next:SpectralState,message:string)=>{
  if(dance)return;
  setHistory(h=>[...h,game].slice(-50));
  setGame(next);setSelectedFutureId(null);setNotice(message);
 };
 const reset=(id:SpectralPreset)=>{
  if(dance)return;
  setPreset(id);setGame(makeSpectralPreset(id));setHistory([]);
  setSelectedKey("0,0");setSelectedFutureId(null);setMoveSource(null);
  setNotice("Nuova configurazione caricata. Esplora i futuri spettrali.");
 };
 const selectHex=(key:string)=>{
  if(dance)return;
  if(moveSource&&!game.board.has(key)){
   const next=relocate(game,moveSource,key);
   if(next)record(next,"Spostato "+sealName(game.board.get(moveSource)!.seal)+
    " senza spesa energetica.");
   setMoveSource(null);
  }
  setSelectedKey(key);setSelectedFutureId(null);
 };
 const manualSummon=()=>{
  const n=Number(numberInput);
  if(!Number.isSafeInteger(n)||n<1||n>250){
   setNotice("Inserisci un numero politronico fra 1 e 250.");return;
  }
  const next=summon(game,selectedKey,n);
  if(!next){setNotice("Richiamo non possibile: cella occupata, energia o individui insufficienti.");return;}
  const p=next.board.get(selectedKey)!;
  record(next,sealName(p.seal)+" (#"+p.seal+") richiamato come Polytrone #"+n+
   " (−"+intrinsicEnergy(n,0)+" E).");
 };
 const manualHome=()=>{
  const x=game.board.get(selectedKey);if(!x)return;
  const next=sendHome(game,selectedKey);if(!next)return;
  record(next,sealName(x.seal)+" torna a casa (+"+intrinsicEnergy(x.number,0)+" E).");
 };
 const danceNow=()=>{
  if(!active||dance)return;
  let next:SpectralState;
  try{next=commitSpectralFuture(game,active);}
  catch{setNotice("Anteprima scaduta: seleziona nuovamente un futuro.");return;}
  const future=active;
  setDance({future});
  setNotice("Collapse scelto: PolytronsDance() esegue una sola coreografia reale.");
  timer.current=setTimeout(()=>{
   setHistory(h=>[...h,game].slice(-50));
   setGame(next);
   setDance(null);setSelectedFutureId(null);setMoveSource(null);
   setNotice("Generazione "+next.generation+" · "+story(future));
   timer.current=null;
  },1650);
 };
 const undo=()=>{
  if(dance||!history.length)return;
  setGame(history[history.length-1]);setHistory(h=>h.slice(0,-1));
  setSelectedFutureId(null);setNotice("Ultima trasformazione annullata.");
 };
 const previewNumber=Number(numberInput);
 const cost=Number.isSafeInteger(previewNumber)&&previewNumber>=1&&previewNumber<=250?
  intrinsicEnergy(previewNumber,0):null;
 return <main className="ml-page ms-page">
  <LifePolytron3D row={2} col={4} order="contrast"/>
  <header className="ml-hero ms-hero">
   <div className="ml-brand"><span className="ml-brand-dot"/> MINDELEEV / ESPERIMENTO 43
    <span className="ml-brand-sep">·</span> SPECTRAL FUTURES</div>
   <div className="ml-hero-grid">
    <div>
     <h1>Mindeleev <em>Spectral</em></h1>
     <p>Le simmetrie generano futuri alternativi. <strong>Il giocatore sceglie quale
      rendere reale.</strong> I 72 Polytroni conservano nome e identità:
      cambiano soltanto manifestazione e posizione.</p>
     <div className="ml-links">
      <a href={import.meta.env.BASE_URL+"?experiment=polytron-periodic"}>
       Tavola periodica <ArrowRight size={14}/></a>
      <a href={import.meta.env.BASE_URL+"?experiment=mindeleev-life"}>
       Mindeleev Life originale <ArrowRight size={14}/></a>
     </div>
    </div>
    <div className="ml-hero-equation ms-equation">
     <small>LEGGE FONDAMENTALE</small>
     <div>72 <span>≡</span> 72</div>
     <p>Individui permanenti.<br/>Budget + energia sulla griglia = {conserved} E.</p>
    </div>
   </div>
  </header>
  <section className="ml-overview" aria-label="Popolazione permanente e bilancio">
   <div className="ml-stat"><span>GENERAZIONE</span><strong>{game.generation}</strong></div>
   <div className="ml-stat ml-stat-energy"><span>BUDGET DEL GIOCATORE</span>
    <strong>{fmt(game.budget)} E</strong></div>
   <div className="ml-stat"><span>SUL MUTATRON</span><strong>{game.board.size}</strong></div>
   <div className="ml-stat"><span>INDIVIDUI A CASA</span><strong>{home.length}</strong></div>
   <div className="ml-stat"><span>ENERGIA TOTALE CONSERVATA</span>
    <strong>{fmt(conserved)} E</strong></div>
  </section>
  <div className="ml-layout ms-layout">
   <div className="ml-main">
    <section className="ml-board-panel">
     <div className="ml-panel-top">
      <div>
       <div className="ml-eyebrow">MUTATRON / SOVRAPPOSIZIONE INTERATTIVA</div>
       <h2>Esplora i futuri possibili</h2>
       <p>Le manifestazioni spettrali hanno opacità 0,5. Le partenze sono attenuate,
        i Polytroni immutati restano solidi. Nessuna coreografia viene anticipata.</p>
      </div>
      <div className="ms-seal-count"><Atom size={15}/> 72 individui</div>
     </div>
     <div className="ms-legend">
      <span><i className="ms-ghost-swatch"/> Manifestazione futura · α 0,5</span>
      <span><i className="ms-exit-swatch"/> Rientro a casa</span>
      <span><i className="ms-stable-swatch"/> Identità invariata</span>
     </div>
     <div className="ml-board-frame ms-board-frame">
      <svg className="ml-board ms-board" viewBox="0 0 900 745"
       role="group" aria-label="Mutatron esagonale: seleziona una cella per filtrare i futuri">
       <defs>
        <radialGradient id="ms-halo"><stop stopColor="#548c91" stopOpacity=".24"/>
         <stop offset="100%" stopColor="#548c91" stopOpacity="0"/></radialGradient>
       </defs>
       <circle cx={CX} cy={CY} r="220" fill="url(#ms-halo)"/>
       {POINTS.map(({q,r})=>{
        const key=hexKey(q,r),now=game.board.get(key),projection=boardPreview.get(key);
        const changed=changedKeys.has(key),leaving=changed&&now&&!projection;
        const arriving=changed&&projection&&(!now||now.seal!==projection.seal);
        const displayed=leaving?now:projection??now;
        const alpha=dance?1:arriving?.5:leaving?.23:1;
        const selected=selectedKey===key;
        const {x,y}=xy(q,r),color=displayed?hues[groupOf(displayed.number)-1]:"#3f5b71";
        return <g key={key} className={"ml-hex ms-hex"+(selected?" ms-picked":"")+
          (arriving?" ms-arriving":"")+(leaving?" ms-leaving":"")}
         role="button" tabIndex={dance?-1:0}
         aria-label={`Cella ${key}. ${now?"Polytrone #"+now.number+" "+sealName(now.seal):"Vuota"}.${
          projection?" Futuro #"+projection.number:""}`}
         data-life-polytron={displayed?dnaFromPolitronNumber(displayed.number):undefined}
         data-life-alpha={alpha}
         onClick={()=>selectHex(key)}
         onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();selectHex(key);}}}>
         <polygon points={polygon(x,y)} fill={displayed?"#163a42":"#102736"}
          stroke={selected?"#ebf7d0":arriving?"#9de7c6":leaving?"#f2b3ae":color}
          strokeWidth={selected?3.4:changed?2.4:1.15}
          strokeDasharray={arriving?"5 4":leaving?"3 5":undefined}
          fillOpacity={displayed?.8:.75}/>
         {displayed&&<text className="ms-cell-number" x={x+7} y={y+24}
          textAnchor="middle" fillOpacity={alpha}>
          #{displayed.number}</text>}
         {arriving&&<circle cx={x} cy={y} r="25" fill="none" stroke="#a9efcd"
          strokeDasharray="4 4" strokeOpacity=".5"/>}
         {leaving&&<path d={`M${x-13} ${y-13} L${x+13} ${y+13}`}
          stroke="#faac99" strokeWidth="2.5" strokeOpacity=".65"/>}
         {!displayed&&<circle cx={x} cy={y} r="1.6" fill="#789daa" opacity=".55"/>}
        </g>;
       })}
       {dance&&<g aria-label="PolytronsDance: ritorni e richiami reali">
        {dance.future.departures.map(j=><Flight key={"D"+j.manifestation.seal} trip={j} kind="return"/>)}
        {dance.future.arrivals.map(j=><Flight key={"A"+j.manifestation.seal} trip={j} kind="summon"/>)}
       </g>}
      </svg>
     </div>
     <div className="ms-futures">
      <div className="ms-future-heading">
       <div>
        <div className="ml-eyebrow">SUPERPOSITION → SPECTRAL PREVIEW → COLLAPSE</div>
        <h2>Seleziona un futuro</h2>
       </div>
       <label className="ms-focus"><input type="checkbox" checked={focusOnly}
        disabled={!!dance} onChange={e=>{setFocusOnly(e.target.checked);setSelectedFutureId(null);}}/>
        Solo reazioni della cella selezionata</label>
      </div>
      <p className="ms-hint">Riconosciute {catalog.totalReactions} reazioni ammissibili.
       Visualizzate {catalog.futures.length} configurazioni complete e compatibili.
       {catalog.truncated?" Catalogo limitato a 24: seleziona un'altra cella per esplorare.":""}
       Le trasformazioni concorrenti non consumano mai due volte lo stesso individuo.</p>
      {active?<div className="ms-future-active">
       <button type="button" disabled={!!dance} aria-label="Futuro precedente"
        onClick={()=>setSelectedFutureId(catalog.futures[(activeIndex-1+catalog.futures.length)%catalog.futures.length].id)}>
        <ChevronLeft size={22}/></button>
       <div className="ms-future-title">
        <strong>{active.label}</strong>
        <span>Futuro {activeIndex+1} di {catalog.futures.length}</span>
       </div>
       <button type="button" disabled={!!dance} aria-label="Futuro successivo"
        onClick={()=>setSelectedFutureId(catalog.futures[(activeIndex+1)%catalog.futures.length].id)}>
        <ChevronRight size={22}/></button>
      </div>:<p className="ms-empty">Nessuna trasformazione ammissibile.
       Cambia configurazione o richiama un Polytrone in una cella libera.</p>}
      <div className="ms-future-pills" role="group" aria-label="Futuri disponibili">
       {catalog.futures.map((f,i)=><button type="button" key={f.id}
        disabled={!!dance} aria-pressed={active?.id===f.id}
        className={active?.id===f.id?"ms-active":""}
        onClick={()=>setSelectedFutureId(f.id)}
        title={f.label+" · "+(f.delta>=0?"+":"")+f.delta+" E"}>{i+1}</button>)}
      </div>
      {active&&<div className="ms-energy-sheet">
       <div className="ms-energy-item"><span>Energia prima (Mutatron)</span><strong>{energyBefore} E</strong></div>
       <div className="ms-energy-item"><span>Energia dopo (Mutatron)</span><strong>{active.energyAfter} E</strong></div>
       <div className="ms-energy-item"><span>Variazione budget</span>
        <strong className={active.delta>=0?"ms-positive":"ms-negative"}>
         {active.delta>=0?"+":""}{active.delta} E</strong></div>
       <div className="ms-energy-item"><span>Budget finale</span><strong>{active.budget} E</strong></div>
       <div className="ms-energy-item"><span>Rientri / Richiami</span>
        <strong>{active.departures.length} / {active.arrivals.length}</strong></div>
       <div className="ms-energy-item"><span>Energia totale</span><strong>{conserved} E</strong></div>
      </div>}
      <div className="ms-collapse-actions">
       <button className="ml-step-primary" type="button" disabled={!active||!!dance}
        onClick={danceNow}><Check size={17}/>
        {dance?"PolytronsDance in corso…":"Seleziona questo futuro · Collapse"}
       </button>
       <button className="ml-step-secondary" type="button"
        onClick={undo} disabled={!history.length||!!dance}><Undo2 size={16}/> Annulla</button>
      </div>
      <p className="ml-event" role="status" aria-live="polite">{notice}</p>
     </div>
    </section>
    <section className="ml-inspector ms-inspector">
     <div className="ml-eyebrow">INSPECTOR / BILANCIO ENERGETICO COMPLETO</div>
     {active?<div>
      <h2>{active.label}</h2>
      {active.reactions.map((r,i)=><div className="ms-reaction" key={r.id}>
       <div><b>{i+1}. {r.kind==="fusion"?"Fusione":"Fissione"} · {r.count}
        {r.kind==="fusion"?" → 1":" ← 1"}</b>
        <span> Centro {r.center} · pattern simmetrico di ordine {r.count===4?2:r.count}</span></div>
       <code>#{r.input} → #{r.output}</code>
       <div className="ms-reaction-ledger">
        <span>Genitori {r.reactantEnergy} E</span><span>Prodotti {r.productEnergy} E</span>
        <strong className={r.delta>=0?"ms-positive":"ms-negative"}>
         {r.delta>=0?"+":""}{r.delta} E</strong>
       </div>
      </div>)}
      <p className="ms-identity-note">Partenze: {active.departures.map(x=>
       sealName(x.manifestation.seal)+" (#"+x.manifestation.seal+")").join(", ")}.</p>
      <p className="ms-identity-note">Arrivi: {active.arrivals.map(x=>
       sealName(x.manifestation.seal)+" (#"+x.manifestation.seal+")").join(", ")}.</p>
      <p className="ms-identity-note"><b>Conservazione verificata:</b> {game.budget} +
       {active.energyBefore} = {active.budget} + {active.energyAfter} = {conserved} E.</p>
     </div>:<p>Seleziona una configurazione iniziale per esplorare le trasformazioni.</p>}
    </section>
   </div>
   <aside className="ml-sidebar ms-sidebar">
    <section className="ml-side-card">
     <div className="ml-eyebrow">01 / LABORATORIO DI SIMMETRIA</div>
     <h2>Configurazioni iniziali</h2>
     <p>I pattern sono invarianti per rotazioni di 60°.
      Coppia: 3 orientazioni, triade: 2, doppia coppia: 3, corona: 1.</p>
     <div className="ms-presets">{presets.map(p=><button key={p.id}
      type="button" disabled={!!dance} onClick={()=>reset(p.id)}
      className={preset===p.id?"ms-active":""}>
      <strong>{p.label}</strong><span>{p.detail}</span>
     </button>)}</div>
    </section>
    <section className="ml-side-card">
     <div className="ml-eyebrow">02 / INTERVENTO WYSIWYG</div>
     <h2>Cella {selectedKey}</h2>
     {chosen?<div className="ms-occupant">
      <strong>{sealName(chosen.seal)} · individuo {chosen.seal}/72</strong>
      <span>Polytrone #{chosen.number} · {dnaFromPolitronNumber(chosen.number)}</span>
      <span>Energia intrinseca: {intrinsicEnergy(chosen.number,0)} E</span>
      <div className="ms-actions">
       <button type="button" disabled={!!dance}
        onClick={()=>setMoveSource(selectedKey)}><Move size={14}/> Sposta</button>
       <button type="button" disabled={!!dance}
        onClick={manualHome}><Home size={14}/> A casa (+{intrinsicEnergy(chosen.number,0)} E)</button>
      </div>
      {moveSource&&<p>Seleziona una cella vuota per spostare
       {sealName(game.board.get(moveSource)?.seal??0)} senza consumo di energia.</p>}
     </div>:<div className="ms-summon">
      <label htmlFor="ms-poly-number">Numero politronico da richiamare (1–250)</label>
      <input id="ms-poly-number" type="number" min="1" max="250" step="1"
       value={numberInput} disabled={!!dance} onChange={e=>setNumberInput(e.target.value)}/>
      <span>Energia intrinseca: <b>{cost===null?"—":cost+" E"}</b></span>
      <span>Prossimo individuo disponibile: <b>{home.length?sealName(home[0]):"nessuno"}</b></span>
      <button type="button" disabled={!!dance||cost===null||cost>game.budget||!home.length}
       onClick={manualSummon}><ArrowRight size={15}/> Richiama da casa</button>
     </div>}
     <div className="ms-source-note">
      <Search size={14}/> Seleziona una cella o cambia il futuro nella lista.
      Tutti i cambi manuali conservano il bilancio energetico.
     </div>
    </section>
    <section className="ml-side-card ms-rules">
     <div className="ml-eyebrow">03 / LEGGI DEL MUTATRON</div>
     <h2>Fusione e fissione reali</h2>
     <div><b>Geometria</b><p>2, 3, 4 o 6 vicini nelle rispettive
      configurazioni simmetriche. Le reazioni 4→1 hanno simmetria rotazionale 2.</p></div>
     <div><b>Numerazione</b><p>Per m Polytroni identici,
      fusione #N → #N+5(m−1); fissione esattamente inversa.</p></div>
     <div><b>Energia</b><p>Δ budget = ΣE(uscite) − ΣE(entrate).
      Nessun costo di bootstrap; Chromatica contribuisce 0.</p></div>
     <div><b>Identità</b><p>Il totale è sempre 72 individui con nome e casa.
      Una manifestazione consuma uno slot, mai un'identità.</p></div>
     <div><b>Sovrapposizione</b><p>L'inspector mostra futuri validi, non
      coreografie alternative. Solo dopo il Collapse parte una PolytronsDance.</p></div>
     <div><b>Limite sperimentale</b><p>Il catalogo mostra al massimo 24 futuri,
      inclusi alcuni insiemi simultanei. Non enumera ancora ogni combinazione
      globale possibile. Seleziona una cella per esplorare altri conflitti.</p></div>
    </section>
   </aside>
  </div>
  <footer className="ml-footer"><span><RotateCcw size={16}/>
   72 POLYTRONI · UN SOLO FUTURO REALE</span>
   <p>Superposition → Spectral Preview (α 0,5) → Player Collapse → PolytronsDance.
    {populationInvariant(game)?" Identità e budget validi.":" ATTENZIONE: stato non valido."}
    {" "}L'energia della configurazione iniziale e del budget è conservata in ogni step.</p>
  </footer>
 </main>;
}
