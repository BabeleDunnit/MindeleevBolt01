import {useEffect,useMemo,useRef,useState,type CSSProperties} from "react";
import {SINKS} from "./phaseShiftEngine";
import {simulate,makeSetup,STATION_DNAS,SCENARIOS,centerKey,shapeResponse,WALLET,
 type Mode,type Setup,type Station,type Event} from "./musicalReturnEngine";
import {soundEvents} from "./musicalReturnAudio";
import {PolytronGlyph,glyphModel} from "./PolytronMeshGlyph";

const COL={bg:"#08131f",surface:"#12283a",line:"#355970",text:"#e8f7ff",muted:"#a7bfce",mint:"#7de8c9",gold:"#eabe80"};
const card:CSSProperties={background:COL.surface,border:"1px solid "+COL.line,borderRadius:15,padding:15};
const button:CSSProperties={background:"#214c60",border:"1px solid #568499",color:COL.text,borderRadius:10,padding:"9px 12px",cursor:"pointer",fontSize:13};
const MODE_DATA:{mode:Mode;title:string;hint:string}[]=[
 {mode:"M0",title:"M0 · Ritorno",hint:"Due viaggiatori con DNA attraversano la scacchiera; le stazioni non mutano."},
 {mode:"M1",title:"M1 · Ricombina",hint:"Al primo incontro ogni stazione cambia forma; i viaggiatori successivi incontrano un campo nuovo."},
 {mode:"M2",title:"M2 · Musical Return",hint:"Stessa fisica di M1, ma lo stesso log di eventi diventa un sequencer generativo."},
 {mode:"PHOTON",title:"Photon Return",hint:"Controllo: raggi sul piano continuo, stessa geometria di risposta, nessuna mutazione di DNA."}
];
const shape=(x:number,y:number,r:number)=>Array.from({length:6},(_,i)=>{
 const a=Math.PI/6+i*Math.PI/3;return (x+r*Math.cos(a)).toFixed(1)+","+(y+r*Math.sin(a)).toFixed(1);
}).join(" ");
const nice=(x:number)=>x.toFixed(2).replace(".",",");
const COLORS=["#64cce7","#f3bf80","#cb9bf4","#85d7a3"];
const eventNames:Record<Event["kind"],string>={emit:"Emissione",travel:"Movimento",encounter:"Interazione",mutate:"Metamorfosi",return:"Ritorno",escape:"Perdita"};
export default function MusicalReturnLab(){
 const [mode,setMode]=useState<Mode>("M0");
 const [scenario,setScenario]=useState(0);
 const [setup,setSetup]=useState<Setup>(()=>makeSetup(0));
 const [selected,setSelected]=useState("P01");
 const [architronId,setArchitronId]=useState("P01");
 const [visualStyle,setVisualStyle]=useState<"polyhedra"|"schematic">("polyhedra");
 const [frameIndex,setFrameIndex]=useState(0);
 const [playing,setPlaying]=useState(false);
 const [speed,setSpeed]=useState(1);
 const [audioEnabled,setAudioEnabled]=useState(false);
 const [message,setMessage]=useState("Seleziona un individuo e poi una cella per spostarlo. Premi Esegui per osservare gli esperimenti.");
 const ctx=useRef<AudioContext|null>(null);
 const result=useMemo(()=>{try{return {run:simulate(setup,mode),error:""};}catch(e){return {run:null,error:String(e)};}},[setup,mode]);
 const run=result.run;
 const safeIndex=Math.min(frameIndex,Math.max(0,(run?.frames.length??1)-1));
 const frame=run?.frames[safeIndex];
 const currentStation=setup.stations.find(s=>s.id===selected);
 const update=(f:(s:Setup)=>Setup)=>{setPlaying(false);setFrameIndex(0);setSetup(s=>f(s));};
 const changeScenario=(i:number)=>{setScenario(i);setSetup(makeSetup(i));setPlaying(false);setFrameIndex(0);setSelected("P01");setArchitronId("P01");};
 const reset=()=>{setPlaying(false);setFrameIndex(0);setMessage("Simulazione riavvolta. Le riserve del laboratorio sono di nuovo nello stato di prova.");};
 const onSite=(key:string)=>{
  if(key===centerKey())return;
  const stationAt=setup.stations.find(s=>s.sink===key);
  if(stationAt){setSelected(stationAt.id);return;}
  if(!currentStation)return;
  update(s=>({...s,stations:s.stations.map(p=>p.id===selected?{...p,sink:key}:p)}));
 };
 useEffect(()=>()=>{void ctx.current?.close();ctx.current=null;},[]);
 useEffect(()=>{
  if(!playing||!run)return;
  const interval=window.setInterval(()=>setFrameIndex(i=>Math.min(i+1,run.frames.length-1)),Math.round(550/speed));
  return ()=>window.clearInterval(interval);
 },[playing,run,speed]);
 useEffect(()=>{
  if(!playing||!frame)return;
  if(audioEnabled&&ctx.current)try{soundEvents(ctx.current,frame.events,mode==="M2");}catch{}
  if(run&&safeIndex>=run.frames.length-1)setPlaying(false);
 },[playing,safeIndex,audioEnabled,mode,run,frame]);
 const toggleAudio=async ()=>{
  if(audioEnabled){setAudioEnabled(false);return;}
  try{
   if(!ctx.current)ctx.current=new AudioContext();
   await ctx.current.resume();
   setAudioEnabled(true);
   setMessage("Audio abilitato: gli eventi della simulazione generano suoni originali.");
  }catch(e){setMessage("Audio non disponibile su questo browser: "+String(e));}
 };
 const togglePlay=()=>{
  if(!run)return;
  if(playing){setPlaying(false);return;}
  if(safeIndex>=run.frames.length-1)setFrameIndex(0);
  setPlaying(true);
 };
 const actualStations=frame?.stations??setup.stations;
 const liveEvents=(frame?.events??[]).filter(e=>e.kind!=="travel");
 const drawColor=(id:string)=>COLORS[Math.max(0,parseInt(id.replace(/\D/g,""),10)-1)%COLORS.length];
 return <main style={{background:COL.bg,color:COL.text,minHeight:"100vh",fontFamily:"system-ui,-apple-system,sans-serif",padding:"clamp(12px,2vw,25px)"}}>
  <style>{".return-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(310px,.86fr);align-items:start;gap:15px}.return-options{display:flex;gap:7px;flex-wrap:wrap}.return-btn:hover{filter:brightness(1.18)}.return-btn:focus-visible,.return-cell:focus-visible{outline:2px solid #a7ffcf;outline-offset:3px}@media(max-width:900px){.return-layout{grid-template-columns:1fr}}"}</style>
  <header style={{display:"flex",flexWrap:"wrap",justifyContent:"space-between",gap:14,marginBottom:17}}>
   <div style={{maxWidth:800}}>
    <div style={{fontSize:12,color:COL.mint,letterSpacing:2}}>MINDELEEV · SPRINT 18 / FOUR COMPARABLE EXPERIMENTS</div>
    <h1 style={{fontSize:"clamp(27px,3.5vw,40px)",margin:"5px 0"}}>Musical Return Reactor</h1>
    <p style={{margin:0,color:COL.muted,lineHeight:1.6}}>La Sorgente emette energia e cerca di recuperarla. I Polytroni fissi hanno identità permanente e DNA Conway; i viaggiatori possono trasportare e ricombinare DNA. Lo stesso evento governa <strong style={{color:COL.text}}>percorso, bilancio e musica</strong>.</p>
   </div>
   <nav style={{display:"flex",gap:12,fontSize:13,alignSelf:"start"}}>
    <a style={{color:COL.mint}} href={import.meta.env.BASE_URL+"?experiment=atlas"}>Phenotype Atlas</a>
    <a style={{color:COL.mint}} href={import.meta.env.BASE_URL+"?experiment=phase-shift"}>Phase Shift</a>
   </nav>
  </header>
  <section style={{...card,marginBottom:13,display:"grid",gap:12}}>
   <div className="return-options">{MODE_DATA.map(item=><button key={item.mode} className="return-btn" style={{...button,background:mode===item.mode?"#286b67":"#214659",borderColor:mode===item.mode?COL.mint:"#568499"}}
    onClick={()=>{setMode(item.mode);setPlaying(false);setFrameIndex(0);}}>{item.title}</button>)}</div>
   <p style={{margin:0,color:COL.muted,fontSize:13}}>{MODE_DATA.find(m=>m.mode===mode)?.hint}</p>
   <div className="return-options" style={{alignItems:"center"}}>
    <label style={{fontSize:12,color:COL.muted}}>Configurazione <select value={scenario} onChange={e=>changeScenario(Number(e.target.value))} style={{...button,marginLeft:5}}>{SCENARIOS.map((s,i)=><option key={i} value={i}>{s.name}</option>)}</select></label>
    <label style={{fontSize:12,color:COL.muted}}>Impulso <select value={setup.injection} onChange={e=>update(s=>({...s,injection:Number(e.target.value)}))} style={{...button,marginLeft:5}}>{[1,2,3].map(x=><option key={x} value={x}>{x} ENERGY</option>)}</select></label>
    <label style={{fontSize:12,color:COL.muted}}>Emissioni <select value={setup.pulses} onChange={e=>update(s=>({...s,pulses:Number(e.target.value) as 2|3}))} style={{...button,marginLeft:5}}>
     <option value={2}>2 · E(2,8)</option><option value={3}>3 · E(3,8)</option></select></label>
    <label style={{fontSize:12,color:COL.muted}}>Velocità <select value={speed} onChange={e=>setSpeed(Number(e.target.value))} style={{...button,marginLeft:5}}>
     <option value={0.5}>½×</option><option value={1}>1×</option><option value={2}>2×</option></select></label>
   </div>
  </section>
  <div className="return-layout">
   <section style={{display:"grid",gap:13}}>
    <section style={card}>
     <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}>
      <h2 style={{fontSize:18,margin:0}}>Mutatron · la Sorgente al centro</h2>
      <label style={{color:COL.muted,fontSize:12}}>Vista <select style={{...button,marginLeft:6}} value={visualStyle} onChange={e=>setVisualStyle(e.target.value as "polyhedra"|"schematic")}>
       <option value="polyhedra">Poliedri reali</option><option value="schematic">Schematica (controllo)</option>
      </select></label>
      <div style={{color:COL.muted,fontSize:12}}>Passo {safeIndex+1}/{run?.frames.length??0}</div>
     </div>
     <svg viewBox="-205 -201 410 402" width="100%" role="img" aria-label="Mutatron esagonale: clicca una stazione, poi una cella libera" style={{maxHeight:530,marginTop:3}}>
      <defs>
       <radialGradient id="reactor-core"><stop stopColor="#d9fff6"/><stop offset=".35" stopColor="#57dbc1"/><stop offset="1" stopColor="#0a6f82"/></radialGradient>
       <filter id="reactor-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5"/></filter>
      </defs>
      <circle cx="0" cy="0" r="187" fill="none" stroke="#385e74" strokeDasharray="3 7" strokeOpacity=".6"/>
      {SINKS.map(s=><g key={s.key} className="return-cell" tabIndex={s.key===centerKey()?-1:0} role="button" aria-label={s.key===centerKey()?"Sorgente":"Cella "+s.key}
       style={{cursor:s.key===centerKey()?"default":"pointer"}} onClick={()=>onSite(s.key)}
       onKeyDown={e=>{if((e.key==="Enter"||e.key===" ")&&s.key!==centerKey()){e.preventDefault();onSite(s.key);}}}>
       <polygon points={shape(s.x,s.y,42)} fill={s.key===centerKey()?"#103d4d":setup.stations.some(p=>p.sink===s.key)?"#1a3d4c":"#122c3a"}
        stroke="#41677b" strokeWidth="1.1" strokeOpacity=".83"/>
       {s.key!==centerKey()&&!setup.stations.some(p=>p.sink===s.key)&&<circle cx={s.x} cy={s.y} r="3" fill="#65889b" opacity=".5"/>}
      </g>)}
      {frame?.travelers.map(c=><polyline key={"line-"+c.id} points={c.path.map(p=>p.x+","+p.y).join(" ")} fill="none"
       stroke={drawColor(c.id)} strokeWidth={c.kind==="photon"?2.2:3.2} strokeOpacity=".74" strokeDasharray={c.kind==="photon"?"4 3":undefined}
       strokeLinecap="round" strokeLinejoin="round"/>)}
      {actualStations.map(s=>{
       const p=SINKS.find(x=>x.key===s.sink)!;
       const feature=shapeResponse(s.dna);
       return <g key={s.id} onClick={()=>setSelected(s.id)} style={{cursor:"pointer"}}>
        {s.id===architronId&&<circle cx={p.x} cy={p.y} r="34" fill="#f2c47c" fillOpacity=".13" stroke="#f2c47c" strokeWidth="2.4"/>}
        {s.id===selected&&<circle cx={p.x} cy={p.y} r="38" fill="none" stroke={COL.mint} strokeWidth="1.7" strokeDasharray="5 4"/>}
        <circle cx={p.x} cy={p.y} r="24" fill={s.mutated?"#553758":"#173b50"} stroke={s.id===architronId?"#f2c47c":s.mutated?"#f1ace8":"#8dbcd2"} strokeWidth="1.7"/>
        {visualStyle==="polyhedra"?<PolytronGlyph dna={s.dna} x={p.x} y={p.y} size={19}/>:
         <polygon points={Array.from({length:feature.sides},(_,i)=>{
          const ang=2*Math.PI*i/feature.sides-Math.PI/2;return (p.x+13*Math.cos(ang))+","+(p.y+13*Math.sin(ang));
         }).join(" ")} fill="none" stroke="#edfff9" strokeWidth="2"/>}
        {s.id===architronId&&<text x={p.x+24} y={p.y-20} fill="#ffe4a9" fontSize="13" fontWeight="bold">✦</text>}
        <text x={p.x} y={p.y+39} textAnchor="middle" fill={s.id===architronId?"#ffe6bd":"#dceff8"} fontSize="10" fontWeight={s.id===architronId?"bold":"normal"}>{s.name}</text>
        <text x={p.x} y={p.y-29} textAnchor="middle" fill="#e9fff5" fontSize="11" fontWeight="bold">{s.dna}</text>
       </g>;
      })}
      <circle cx="0" cy="0" r="33" fill="#4edec2" opacity=".25" filter="url(#reactor-glow)"/>
      <circle cx="0" cy="0" r="20" fill="url(#reactor-core)" stroke="#d7fff2" strokeWidth="1.5"/>
      <circle cx="0" cy="0" r="5" fill="#f5ffff"/>
      <text x="0" y="37" textAnchor="middle" fill="#cbfff2" fontSize="10" fontWeight="bold">SORGENTE</text>
      {frame?.travelers.filter(c=>c.status==="flying").map(c=><g key={c.id}>
       <circle cx={c.x} cy={c.y} r={c.kind==="photon"?7:10} fill={drawColor(c.id)} stroke="#fff" strokeWidth="1.5"/>
       {c.kind==="carrier"&&(visualStyle==="polyhedra"?<PolytronGlyph dna={c.dna} x={c.x} y={c.y} size={8} outline="#f3fbff"/>:
         <text x={c.x} y={c.y+3.5} fontSize="9" textAnchor="middle" fill="#112a37" fontWeight="bold">{c.id}</text>)}
      </g>)}
     </svg>
     <div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:5}}>
      <button className="return-btn" onClick={togglePlay} style={{...button,background:"#286c63"}}>{playing?"Pausa":safeIndex===run?.frames.length!-1?"Riesegui":"Esegui"}</button>
      <button className="return-btn" onClick={reset} style={button}>Riavvolgi</button>
      <button className="return-btn" onClick={()=>{setPlaying(false);setFrameIndex(i=>Math.max(0,i-1));}} style={button}>− passo</button>
      <button className="return-btn" onClick={()=>{setPlaying(false);setFrameIndex(i=>Math.min((run?.frames.length??1)-1,i+1));}} style={button}>+ passo</button>
      <button className="return-btn" onClick={()=>void toggleAudio()} style={{...button,background:audioEnabled?"#36614f":"#294458"}}>{audioEnabled?"Suono attivo":"Attiva suono"}</button>
     </div>
     <input aria-label="Timeline di simulazione" type="range" min={0} max={Math.max(0,(run?.frames.length??1)-1)} value={safeIndex}
      onChange={e=>{setPlaying(false);setFrameIndex(Number(e.target.value));}} style={{width:"100%",accentColor:COL.mint,marginTop:10}}/>
     <p role="status" style={{fontSize:12,color:COL.muted,margin:"9px 0 0",lineHeight:1.5}}>{message}</p>
    </section>
    <section style={card}>
     <h3 style={{fontSize:16,margin:"0 0 9px"}}>Eventi del passo {safeIndex+1}</h3>
     {liveEvents.length?<div style={{display:"grid",gap:7}}>{liveEvents.map((e,i)=><div key={i} style={{borderLeft:"3px solid "+(e.kind==="return"?COL.mint:e.kind==="escape"?"#f09390":"#8fcae5"),padding:"5px 9px",background:"#183548",fontSize:12}}>
      <b>{eventNames[e.kind]}</b> · {e.carrierId}{e.stationName?" / "+e.stationName:""}
      <div style={{color:COL.muted,marginTop:2}}>{e.note}</div>
      {e.kind==="mutate"&&e.before&&e.after&&<div style={{display:"flex",alignItems:"center",gap:12,marginTop:8}}>
        <svg viewBox="-26 -26 52 52" width="75" height="75"><PolytronGlyph dna={e.before} x={0} y={0} size={19}/></svg>
        <span style={{color:COL.gold}}>→</span>
        <svg viewBox="-26 -26 52 52" width="75" height="75"><PolytronGlyph dna={e.after} x={0} y={0} size={19}/></svg>
        <span style={{fontSize:11,color:COL.muted}}>{e.before} → {e.after}</span>
       </div>}
     </div>)}</div>:<p style={{fontSize:13,color:COL.muted}}>Nessun evento significativo in questo passo.</p>}
    </section>
   </section>
   <aside style={{display:"grid",gap:13}}>
    <section style={card}>
     <h2 style={{margin:"0 0 10px",fontSize:18}}>Contabilità di ENERGY</h2>
     {result.error&&<p role="alert" style={{color:"#ffb3b3"}}>{result.error}</p>}
     {frame&&<><div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:7}}>
      {[
       ["Iniettata",frame.ledger.input],["Prelevata dalle riserve",frame.ledger.fromReserve],
       ["Rientrata",frame.ledger.returned],["Persa al bordo",frame.ledger.escaped],
       ["Dissipata",frame.ledger.dissipated],["Ancora in viaggio",frame.ledger.inFlight]
      ].map(([label,value])=><div key={label} style={{background:"#1b394a",padding:10,borderRadius:9}}>
       <div style={{fontSize:11,color:COL.muted}}>{label}</div><b style={{fontSize:19}}>{nice(value as number)}</b>
      </div>)}
     </div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}>
      <div style={{fontSize:13}}>Saldo wallet nel test: <b style={{color:COL.mint}}>{nice(frame.ledger.walletAfter)}</b> / {WALLET}</div>
      <span style={{fontSize:11,color:Math.abs(frame.ledger.balance)<1e-6?COL.mint:"#f5a09d"}}>Bilancio {nice(frame.ledger.balance)}</span>
     </div></>}
     <p style={{fontSize:11,color:COL.muted,lineHeight:1.6,marginBottom:0}}>Laboratorio non persistente: ogni replay ripristina le riserve di prova. Il guadagno NON viene accreditato al gioco. Ogni stazione parte con 2,10 unità finite: il percorso lungo non genera energia dal nulla.</p>
    </section>
    <section style={card}>
     <h3 style={{margin:"0 0 8px",fontSize:17}}>Individui permanenti</h3>
     <label style={{display:"grid",gap:5,fontSize:12,color:COL.gold,marginBottom:10}}>Architron · il compagno privilegiato
      <select aria-label="Seleziona Architron" style={button} value={architronId}
       onChange={e=>{setArchitronId(e.target.value);setSelected(e.target.value);}}>
       {setup.stations.map(s=><option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
      </select>
     </label>
     <p style={{fontSize:11,color:COL.muted,lineHeight:1.5}}>✦ L'Architron è uno dei 72 individui, evidenziato visivamente; cambiarlo non trasferisce né altera DNA, memoria o proprietà fisiche. La Sorgente è invece il centro.</p>
     <p style={{fontSize:12,color:COL.muted}}>Tre identità su 72 potenziali. Clicca un individuo e poi una cella libera per riposizionarlo. Non è necessario ruotarlo.</p>
     {setup.stations.map(s=><button key={s.id} className="return-btn" onClick={()=>setSelected(s.id)} style={{...button,width:"100%",display:"flex",justifyContent:"space-between",textAlign:"left",marginBottom:5,background:s.id===selected?"#2b6969":"#214659"}}>
      <span><b>{s.id===architronId?"✦ ":""}{s.name}</b> <span style={{fontSize:11,color:COL.muted}}>{s.id}</span></span><span>{s.dna}</span>
     </button>)}
     {currentStation&&<label style={{display:"grid",gap:6,fontSize:12,color:COL.muted,marginTop:11}}>Modifica fenotipo iniziale di {currentStation.name}
      <select value={currentStation.dna} style={button} onChange={e=>update(s=>({...s,stations:s.stations.map(p=>p.id===selected?{...p,dna:e.target.value}:p)}))}>
       {STATION_DNAS.map(x=><option key={x} value={x}>{x} · {shapeResponse(x).sides} lati prevalenti, svolta {shapeResponse(x).turn*60}°</option>)}
      </select>
     </label>}
     {currentStation&&<div style={{border:"1px solid "+COL.line,borderRadius:12,background:"#0d2334",padding:10,marginTop:10}}>
      <div style={{fontSize:12,color:COL.mint}}>Fenotipo reale · {currentStation.dna}</div>
      <svg viewBox="-44 -44 88 88" style={{width:"100%",height:175}}>
       <PolytronGlyph dna={(frame?.stations.find(s=>s.id===selected)?.dna??currentStation.dna)} x={0} y={0} size={31}/>
      </svg>
      <div style={{fontSize:11,color:COL.muted}}>Mesh Conway: {glyphModel(frame?.stations.find(s=>s.id===selected)?.dna??currentStation.dna).vertices} vertici · {glyphModel(frame?.stations.find(s=>s.id===selected)?.dna??currentStation.dna).facets} facce · orientamento fisso</div>
     </div>}
     <p style={{fontSize:11,color:COL.muted,lineHeight:1.55}}>Regola sperimentale dichiarata: il numero prevalente di lati delle facce della mesh determina la svolta. In M1/M2 il primo incontro applica <code>ambo</code> alla stazione dopo aver calcolato la svolta; è una reazione-proxy, non una legge fisica.</p>
    </section>
    <section style={card}>
     <h3 style={{margin:"0 0 8px",fontSize:17}}>Cosa confrontiamo davvero</h3>
     <p style={{fontSize:12,color:COL.muted,lineHeight:1.6}}>La vista «Poliedri reali» disegna i vertici e le facce effettivi di Polyhedronisme con le palette del catalogo. La vista schematica serve come controllo: **la simulazione è identica**. La forma è più ricca della nostra attuale legge di svolta, ancora basata sul numero di lati prevalente.</p>
     <p style={{fontSize:12,color:COL.muted,lineHeight:1.6}}>M0: routing senza mutazioni. M1: due emissioni possono incontrare stati genetici diversi. M2: stesso motore di M1 e audio causale. Photon: raggi in un piano continuo che interagiscono con dischi di influenza; nessun DNA mobile.</p>
     <p style={{fontSize:12,color:COL.gold,lineHeight:1.55}}>Non è ottica realistica, né una legge definitiva del fenotipo. Suoni e percorsi sono prototipi riproducibili, non una composizione Tonnetz completa.</p>
     <p style={{fontSize:12,color:COL.muted,lineHeight:1.6,marginBottom:0}}>Simulazione deterministica per configurazione fissa, tempo logico separato dalla velocità di riproduzione. Nessun gioco di riflessi; puoi interrompere o ispezionare ogni passo.</p>
    </section>
   </aside>
  </div>
 </main>;
}
