import {useEffect,useMemo,useRef,useState,type CSSProperties} from "react";
import {PolytronGlyph} from "./PolytronMeshGlyph";
import {runIslands,initialIslands,decode,VERBS,affinity,type Setup,type Node,type Scenario,type Physics,type Ev} from "./IslandAffinityEngine";
import {SINKS} from "./phaseShiftEngine";
const C={bg:"#081722",panel:"#142b3c",line:"#3b6276",text:"#ebf9ff",dim:"#adc8d7",mint:"#81ebc4",amber:"#f6cb88"};
const card:CSSProperties={background:C.panel,border:"1px solid "+C.line,borderRadius:15,padding:14};
const btn:CSSProperties={background:"#275267",border:"1px solid #5c8699",borderRadius:9,color:C.text,padding:"7px 11px",cursor:"pointer",fontSize:12};
const hex=(x:number,y:number,r:number)=>Array.from({length:6},(_,i)=>
 (x+r*Math.cos(i*Math.PI/3)).toFixed(1)+","+(y+r*Math.sin(i*Math.PI/3)).toFixed(1)).join(" ");
const palettes=["#ae88d8","#5bcb90","#5698ee","#ddba64","#e5a5bc","#46c9d1"];
const col=(p:number)=>palettes[p%palettes.length];
const fmt=(x:number)=>x.toFixed(2).replace(".",",");
const OPTIONS=["01C","02T","a02T","k02T","02C","a02C","02O","d02O","02D","02I","01I","ad01C","k01C","adk01C"];
const trials:[Scenario,string][]=[["R0","R0 · Simmetria radiale"],["R1","R1 · Party Planner / Boids"],["R2","R2 · Fissione / clonazione"],["R3","R3 · Cinque verbi"],["R4","R4 · Ritorno alla Sorgente"]];
const names:Record<Ev["kind"],string>={emit:"Emissione",color:"Colora",fuse:"Combina",split:"Scinde",clone:"Clona",filter:"Seleziona",null:"Trasformazione nulla",buffer:"In attesa",release:"Rilascio",learn:"Apprende",return:"Rientro",escape:"Perdita"};
function sound(ctx:AudioContext,events:Ev[]){
 const pitches:Record<Ev["kind"],number>={emit:164,color:294,fuse:196,split:392,clone:494,filter:349,null:130,
  buffer:174,release:220,learn:270,return:440,escape:92};
 events.filter(e=>e.kind!=="learn").slice(0,12).forEach((e,i)=>{
  const osc=ctx.createOscillator(),gain=ctx.createGain(),at=ctx.currentTime+.01+i*.012;
  osc.type=e.kind==="split"?"triangle":"sine";osc.frequency.value=pitches[e.kind];
  gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.012,at+.014);
  gain.gain.exponentialRampToValueAtTime(.0001,at+.12);
  osc.connect(gain);gain.connect(ctx.destination);osc.start(at);osc.stop(at+.14);
 });
}
export default function IslandAffinityLab(){
 const [setup,setSetup]=useState<Setup>(()=>initialIslands("R0"));
 const [view,setView]=useState<"setup"|"run">("setup");
 const [step,setStep]=useState(0),[playing,setPlaying]=useState(false);
 const [speed,setSpeed]=useState(2),[chosen,setChosen]=useState("P01"),[focus,setFocus]=useState("v1");
 const [audio,setAudio]=useState(false),ctx=useRef<AudioContext|null>(null);
 const data=useMemo(()=>{try{return {run:runIslands(setup),error:""};}catch(e){return {run:null,error:String(e)};}},[setup]);
 const run=data.run,frame=run?.frames[Math.min(step,240)];
 const selected=frame?.nodes.find(n=>n.id===chosen);
 const traveler=frame?.walkers.find(t=>t.id===focus);
 const change=(s:Setup)=>{setSetup(s);setStep(0);setView("setup");setPlaying(false);};
 const patch=(p:Partial<Setup>)=>change({...setup,...p});
 const patchNode=(f:(n:Node)=>Node)=>change({...setup,nodes:setup.nodes.map(n=>n.id===chosen?f(n):n)});
 useEffect(()=>()=>{void ctx.current?.close();ctx.current=null;},[]);
 useEffect(()=>{
  if(!playing||!run)return;
  const id=window.setInterval(()=>setStep(i=>Math.min(240,i+1)),Math.round(125/speed));
  return ()=>window.clearInterval(id);
 },[playing,run,speed]);
 useEffect(()=>{
  if(!playing||!frame)return;
  if(audio&&ctx.current)try{sound(ctx.current,frame.events);}catch{}
  if(step>=240)setPlaying(false);
 },[step,playing,frame,audio]);
 const start=()=>{if(!run)return;if(step>=240)setStep(0);setView("run");setPlaying(true);};
 const toggleAudio=async()=>{if(audio){setAudio(false);return;}
  try{ctx.current??=new AudioContext();await ctx.current.resume();setAudio(true);}catch{}
 };
 const projected=view==="setup"?.67:1;
 return <main style={{background:C.bg,minHeight:"100vh",color:C.text,padding:"clamp(12px,2vw,23px)",fontFamily:"system-ui,-apple-system,sans-serif"}}>
  <style>{".island-two{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(300px,.85fr);gap:14px;align-items:start}.island-row{display:flex;flex-wrap:wrap;align-items:center;gap:9px}@media(max-width:910px){.island-two{grid-template-columns:1fr}}"}</style>
  <header style={{marginBottom:15}}>
   <div style={{fontSize:11,letterSpacing:2,color:C.mint}}>MINDELEEV · SPRINT 26 · RESEARCH MODEL</div>
   <h1 style={{fontSize:"clamp(25px,3vw,38px)",margin:"6px 0"}}>Island Affinity Reactor</h1>
   <p style={{maxWidth:900,fontSize:13,color:C.dim,lineHeight:1.65,margin:0}}>L'Architron-Sorgente emette una sonda o una corona radiale. Sei individui nominati controllano isole: vere forme Conway, cinque verbi genetici, attrazioni Shape-DNA e moto continuo. <a style={{color:C.mint}} href={import.meta.env.BASE_URL+"?experiment=musical-return"}>Musical Return (controllo)</a></p>
  </header>
  <section style={{...card,marginBottom:14,display:"grid",gap:10}}>
   <div className="island-row">
    <label style={{fontSize:12,color:C.dim}}>Prova <select style={{...btn,marginLeft:5}} value={setup.scenario} onChange={e=>{change(initialIslands(e.target.value as Scenario));setChosen("P01");}}>
      {trials.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
    <label style={{fontSize:12,color:C.dim}}>Moto <select style={{...btn,marginLeft:5}} value={setup.physics} onChange={e=>patch({physics:e.target.value as Physics})}>
     <option value="party">Party Planner</option><option value="boids">Boids</option><option value="hybrid">Ibrido</option></select></label>
    <label style={{fontSize:12,color:C.dim}}>Emissione <select style={{...btn,marginLeft:5}} value={setup.wave} onChange={e=>patch({wave:e.target.value as Setup["wave"],count:e.target.value==="probe"?1:6})}>
     <option value="probe">Sonda singola</option><option value="radial">Scarica radiale</option></select></label>
    {setup.wave==="radial"&&<label style={{fontSize:12,color:C.dim}}>N <select style={{...btn,marginLeft:5}} value={setup.count}
     onChange={e=>patch({count:Number(e.target.value) as 1|6|12})}><option value={6}>6</option><option value={12}>12</option></select></label>}
   </div>
   <div className="island-row">
    <label style={{fontSize:12,color:C.dim}}>DNA emesso <select style={{...btn,marginLeft:5}} value={setup.emission} onChange={e=>patch({emission:e.target.value})}>
     {OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
    <label style={{fontSize:12,color:C.dim}}>Palette di rientro <select style={{...btn,marginLeft:5}} value={setup.returnPalette}
     onChange={e=>patch({returnPalette:Number(e.target.value)})}>{[0,1,2,3,4,5].map(i=><option key={i} value={i}>{String(i).padStart(2,"0")}</option>)}</select></label>
    <label style={{fontSize:12,color:C.dim}}>ENERGY <select style={{...btn,marginLeft:5}} value={setup.budget} onChange={e=>patch({budget:Number(e.target.value)})}>
      {[3,6,9,12].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
    <label style={{fontSize:12,color:C.dim}}>Seed casuale <input type="number" style={{...btn,width:87,marginLeft:5}} value={setup.seed}
     onChange={e=>patch({seed:Number(e.target.value)||1})}/></label>
    <button style={btn} onClick={()=>patch({seed:setup.seed+1})}>Nuova variazione</button>
   </div>
  </section>
  <div className="island-two">
   <div style={{display:"grid",gap:14}}>
    <section style={card}>
     <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
      <strong>{view==="setup"?"Preparazione · esagoni raccolti":"Esperimento · isole separate"}</strong>
      <span style={{fontSize:12,color:C.dim}}>Passo {step}/240</span>
     </div>
     <svg viewBox="-265 -265 530 530" width="100%" role="img" aria-label="Mutatron con isole e viaggiatori"
      style={{maxHeight:575}}>
      <circle r="241" fill="none" stroke="#7294a6" strokeOpacity=".5" strokeDasharray="3 7"/>
      {view==="setup"&&SINKS.map(s=><polygon key={s.key} points={hex(s.x*.8,s.y*.8,22)} fill="#1c3b4e" fillOpacity=".4" stroke="#638ba5" strokeOpacity=".25"/>)}
      {view==="run"&&frame?.walkers.map(w=><polyline key={w.id} points={w.trail.map(p=>p.x+","+p.y).join(" ")}
       fill="none" stroke={col(decode(w.dna).palette)} strokeOpacity={w.status==="flying"?.7:.2} strokeWidth={w.id===focus?2.5:1.3}/>)}
      {frame?.nodes.map(n=><g key={n.id} tabIndex={0} role="button" aria-label={"Controller "+n.name}
       style={{cursor:"pointer"}} transform={"translate("+n.x*projected+" "+n.y*projected+")"}
       onClick={()=>setChosen(n.id)} onKeyDown={e=>{if(e.key==="Enter"){setChosen(n.id);}}}>
       <circle r={n.id===chosen?35:27} fill="#174050" stroke={n.id===chosen?C.mint:"#75a0b7"}
        strokeWidth={n.id===chosen?2.3:1.3}/>
       <PolytronGlyph dna={n.dna} x={0} y={0} size={20}/>
       <text x={0} y={42} textAnchor="middle" fontSize="11" fill="#f0f9ff">{n.name}</text>
       <text x={0} y={-32} textAnchor="middle" fontSize="10" fill={col(decode(n.dna).palette)}>{decode(n.dna).seed} · {VERBS[decode(n.dna).seed]}</text>
       <text x={0} y={55} textAnchor="middle" fontSize="9" fill="#c7d9e4">{n.dna}</text>
      </g>)}
      <circle r="24" fill="#267d7b" fillOpacity=".4" stroke="#86f4d6" strokeWidth="1.8"/>
      <circle r="7" fill="#b6f5e5"/>
      <text x="0" y="40" textAnchor="middle" fontSize="11" fill="#ecfff7" fontWeight="bold">ARCHITRON</text>
      <text x="0" y="54" textAnchor="middle" fontSize="9" fill="#96e9ce">SORGENTE</text>
      {view==="run"&&frame?.walkers.filter(w=>w.status==="flying").map(w=><g key={w.id} onClick={()=>setFocus(w.id)} style={{cursor:"pointer"}}>
       {w.id===focus&&<circle cx={w.x} cy={w.y} r="13" fill="none" stroke={C.amber} strokeWidth="1.5"/>}
       <circle cx={w.x} cy={w.y} r="9" fill={col(decode(w.dna).palette)} stroke="#eafaff" strokeWidth="1"/>
       <PolytronGlyph dna={w.dna} x={w.x} y={w.y} size={6.5}/>
      </g>)}
     </svg>
     {data.error&&<p role="alert" style={{color:"#ffa9a9"}}>{data.error}</p>}
     <div className="island-row">
      <button style={{...btn,background:"#25766b"}} onClick={playing?()=>setPlaying(false):start}>{playing?"Pausa":step>=240?"Riesegui":"Avvia"}</button>
      <button style={btn} onClick={()=>{setPlaying(false);setView("setup");setStep(0);}}>Ripeti identico</button>
      <button style={btn} onClick={()=>{setPlaying(false);setView("run");setStep(Math.max(0,step-1));}}>− passo</button>
      <button style={btn} onClick={()=>{setPlaying(false);setView("run");setStep(Math.min(240,step+1));}}>+ passo</button>
      <button style={btn} onClick={()=>void toggleAudio()}>{audio?"Suono attivo":"Attiva suono"}</button>
      <label style={{fontSize:12,color:C.dim}}>Velocità <select style={{...btn,marginLeft:5}} value={speed} onChange={e=>setSpeed(Number(e.target.value))}>
       <option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option></select></label>
     </div>
     <input type="range" min={0} max={240} value={step} aria-label="Timeline di simulazione"
      onChange={e=>{setPlaying(false);setView("run");setStep(Number(e.target.value));}} style={{width:"100%",marginTop:11}}/>
    </section>
    <section style={card}>
     <h3 style={{margin:"0 0 9px",fontSize:16}}>Eventi del passo {step}</h3>
     <div style={{maxHeight:230,overflowY:"auto",display:"grid",gap:6}}>
      {frame?.events.length?frame.events.map((e,i)=><div key={i} style={{background:"#1d3a4d",borderLeft:"3px solid "+(e.kind==="return"?C.mint:e.kind==="null"?C.amber:"#86b3cc"),padding:"8px 9px",fontSize:12}}>
       <b>{names[e.kind]}</b> · {e.walker}{e.name?" / "+e.name:""}
       <div style={{color:C.dim,marginTop:3}}>{e.note}{e.before&&e.after&&e.before!==e.after?" · "+e.before+" → "+e.after:""}</div>
      </div>):<span style={{fontSize:12,color:C.dim}}>Nessun incontro in questo passo.</span>}
     </div>
    </section>
   </div>
   <aside style={{display:"grid",gap:14}}>
    <section style={card}>
     <h3 style={{margin:"0 0 10px",fontSize:17}}>Bilancio ENERGY trasportata</h3>
     {frame&&<><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
      {([["Iniettata",frame.ledger.input],["Prelevata dalle isole",frame.ledger.harvested],["Rientrata",frame.ledger.returned],
       ["Uscita dal bordo",frame.ledger.escaped],["Dissipata",frame.ledger.dissipated],
       ["Ancora nel campo",frame.ledger.inField+frame.ledger.buffered]] as [string,number][]).map(([label,value])=><div key={label} style={{padding:8,background:"#1b3c4d",borderRadius:8}}>
        <div style={{fontSize:11,color:C.dim}}>{label}</div><b style={{fontSize:19}}>{fmt(value)}</b>
      </div>)}
     </div><p style={{fontSize:12}}>Saldo teorico: <b style={{color:C.mint}}>{fmt(frame.ledger.walletAfter)}</b> · Errore bilancio: {frame.ledger.balance.toExponential(1)}</p></>}
     {run&&<p style={{fontSize:12,color:C.dim}}>Picco in volo: {run.peak} · Rientri: {run.returnedCount} · DNA distinti: {run.diversity} · Nulli: {run.nullCount}</p>}
     <p style={{fontSize:11,color:C.amber,lineHeight:1.6}}>Contabilità della ENERGY trasportata, non bilancio meccanico completo di lavoro, energia cinetica e potenziale. Le riserve sono finite. Replay senza accreditamento persistente.</p>
    </section>
    <section style={card}>
     <h3 style={{margin:"0 0 9px",fontSize:16}}>Inspector · controller nominato</h3>
     <select style={{...btn,width:"100%"}} value={chosen} onChange={e=>setChosen(e.target.value)}>
      {setup.nodes.map(n=><option key={n.id} value={n.id}>{n.name} · {n.id}</option>)}</select>
     {selected&&<><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",alignItems:"center",gap:8}}>
       <svg viewBox="-40 -40 80 80" width="100%" style={{maxHeight:140}}><PolytronGlyph dna={selected.dna} x={0} y={0} size={28}/></svg>
       <div style={{fontSize:12,lineHeight:1.85}}>
        DNA <code>{selected.dna}</code><div>Seme: {decode(selected.dna).seed}</div>
        <div>Verbo: <b>{VERBS[decode(selected.dna).seed]}</b></div>
        <div>Operatori: {decode(selected.dna).ops||"nessuno"}</div>
        <div>Palette: {decode(selected.dna).palette}</div>
       </div>
      </div>
      <label style={{display:"grid",gap:5,fontSize:12,color:C.dim}}>Ricetta della stazione
       <select style={btn} value={setup.nodes.find(n=>n.id===chosen)?.dna}
        onChange={e=>patchNode(n=>({...n,dna:e.target.value,known:[...new Set([...n.known,e.target.value])]}))}>
        {OPTIONS.map(x=><option key={x} value={x}>{x} · {VERBS[decode(x).seed]}</option>)}
       </select>
      </label>
      <div className="island-row" style={{marginTop:9}}>
       <label style={{fontSize:11,color:C.dim}}>X <input type="range" min={-165} max={165} step={5} value={setup.nodes.find(n=>n.id===chosen)?.x??0}
        onChange={e=>patchNode(n=>({...n,x:Number(e.target.value)}))}/></label>
       <label style={{fontSize:11,color:C.dim}}>Y <input type="range" min={-165} max={165} step={5} value={setup.nodes.find(n=>n.id===chosen)?.y??0}
        onChange={e=>patchNode(n=>({...n,y:Number(e.target.value)}))}/></label>
      </div>
      <p style={{fontSize:12,color:C.dim}}>MindeleevTable: {selected.known.length} forme conosciute. Il corpo del controller resta invariato mentre impara.</p>
      <div style={{fontSize:11,color:C.dim,maxHeight:62,overflowY:"auto"}}>{selected.history.length?selected.history.slice(-4).join(" · "):"Nessun incontro assimilato in questo passo."}</div>
     </>}
    </section>
    <section style={card}>
     <h3 style={{margin:"0 0 8px",fontSize:16}}>Analisi viaggiatore</h3>
     <select style={{...btn,width:"100%"}} value={traveler?.id??focus} onChange={e=>setFocus(e.target.value)}>
      {frame?.walkers.map(w=><option key={w.id} value={w.id}>{w.id}: {w.dna} · {w.status}</option>)}</select>
     {traveler&&<div style={{fontSize:12,color:C.dim,lineHeight:1.9,marginTop:8}}>DNA: {traveler.dna} · {traveler.status}<div>ENERGY: {fmt(traveler.energy)} · Incontri: {traveler.touches}</div>
      {selected&&<><div>Distanza Shape-DNA: {affinity(traveler.dna,selected.dna).distance.toFixed(3)}</div>
       <div>Equilibrio preferito: {affinity(traveler.dna,selected.dna).rest.toFixed(1)} unità</div>
       {affinity(traveler.dna,selected.dna).fallback&&<div>Descrittore approssimato (limite di mesh)</div>}</>}
     </div>}
    </section>
    <section style={card}>
     <h3 style={{margin:"0 0 8px",fontSize:16}}>Note sperimentali</h3>
     <p style={{fontSize:12,color:C.dim,lineHeight:1.65}}>R0 emissione singola/radiale · R1 Party Planner vs Boids · R2 scissione/clonazione · R3 cinque verbi · R4 accoglienza alla Sorgente. Passo fisico fisso e seme pseudocasuale fissabile.</p>
     <p style={{fontSize:12,color:C.amber,lineHeight:1.6}}>Le leggi di trasformazione sono convenzioni di gioco. Le distanze Shape-DNA sono misurate sulle mesh reali, ma il loro impiego come forze elastiche è un'ipotesi, non una proprietà naturale dei solidi platonici.</p>
    </section>
   </aside>
  </div>
 </main>;
}
