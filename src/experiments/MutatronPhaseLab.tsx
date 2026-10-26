import {useEffect,useMemo,useRef,useState,type CSSProperties} from "react";
import * as THREE from "three";
import {polytronGeometry} from "@/polytron/polytron";
import {PRESETS,SINKS,initial,advance,crystallize,release,quantize,stress,parts,desiredDistance,bondRelativeError,rmsSpeed,makeDNA,affinityReason,neighbors,crystalMove,impulse,fuse,split,won,selfTests,type World,type Particle,type Result,type Grab} from "./phaseShiftEngine";

const C={bg:"#091321",panel:"#13273a",border:"#365770",text:"#eaf6fd",muted:"#a3bbc9",mint:"#8ce9c8"};
const button:CSSProperties={background:"#204c62",border:"1px solid #527c92",borderRadius:9,padding:"10px 13px",color:C.text,fontSize:14,cursor:"pointer"};
const panel:CSSProperties={background:C.panel,border:"1px solid "+C.border,borderRadius:16,padding:20};
const selectStyle:CSSProperties={background:"#19374b",border:"1px solid #527c92",borderRadius:8,padding:8,color:C.text};
const polyColor=(dna:string)=>parts(dna).palette===5?"#f4b45c":parts(dna).palette===2?"#b0a0f8":"#7dd8d4";
const hex=(x:number,y:number,rad:number)=>Array.from({length:6},(_,i)=>{
 const a=Math.PI/3*i+Math.PI/6;return (x+rad*Math.cos(a)).toFixed(2)+","+(y+rad*Math.sin(a)).toFixed(2);
}).join(" ");

function PolyhedronPreview({dna}:{dna:string}){
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const root=host.current;if(!root)return;
  let geo:ReturnType<typeof polytronGeometry>|undefined,renderer:THREE.WebGLRenderer|undefined,raf=0;
  let solidMat:THREE.Material|undefined,lineMat:THREE.Material|undefined;
  try{
   geo=polytronGeometry(dna);
   renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
   renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(156,156);
   root.appendChild(renderer.domElement);
   const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,50);
   camera.position.set(0,0,9);scene.add(new THREE.HemisphereLight(0xffffff,0x325b76,2.4));
   solidMat=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
   lineMat=new THREE.LineBasicMaterial({color:0x83b9d1,transparent:true,opacity:.55});
   const group=new THREE.Group();group.add(new THREE.Mesh(geo.solid,solidMat),new THREE.LineSegments(geo.edges,lineMat));scene.add(group);
   const loop=()=>{group.rotation.y+=.007;group.rotation.x+=.003;renderer!.render(scene,camera);raf=requestAnimationFrame(loop);};loop();
  }catch(e){root.textContent="Anteprima 3D non disponibile: "+String(e);}
  return ()=>{cancelAnimationFrame(raf);if(renderer){if(root.contains(renderer.domElement))root.removeChild(renderer.domElement);renderer.dispose();}
   geo?.solid.dispose();geo?.edges.dispose();solidMat?.dispose();lineMat?.dispose();};
 },[dna]);
 return <div ref={host} style={{width:156,height:156}} title={dna}/>;
}

export default function MutatronPhaseLab(){
 const [preset,setPreset]=useState(0),[world,setWorld]=useState<World>(()=>initial(0));
 const [history,setHistory]=useState<World[]>([]),[chosen,setChosen]=useState<string[]>([]),[destination,setDestination]=useState("");
 const [cut,setCut]=useState(1),[notice,setNotice]=useState("Il campo è in movimento. Puoi mettere in pausa, trascinare un Polytrone o cristallizzare quando vuoi.");
 const [paused,setPaused]=useState(false);
 const [crystalMode,setCrystalMode]=useState<"move"|"react">("move");
 const [showIdeal,setShowIdeal]=useState(true);
 const svgRef=useRef<SVGSVGElement>(null);
 const dragRef=useRef<(Grab & {pointerId:number;startX:number;startY:number;moved:boolean;before:World})|null>(null);
 const [showPreview,setShowPreview]=useState(true),[showLinks,setShowLinks]=useState(true);
 const testErrors=useMemo(()=>selfTests(),[]);
 // Interactive, real-time fluid phase. No action is scored by reaction speed.
 // Physics uses a fixed 0.05 model timestep, independent of rendering framerate.
 useEffect(()=>{
  if(paused||world.phase!=="fluid")return;
  let raf=0,last=0,acc=0;
  const loop=(now:number)=>{
   if(last===0)last=now;
   if(!document.hidden){
    acc+=Math.min(66,now-last);
    const frames=Math.min(3,Math.floor(acc/(1000/60)));
    if(frames>0){acc-=frames*(1000/60);setWorld(w=>w.phase==="fluid"?advance(w,frames*3,dragRef.current??undefined):w);}
   }
   last=now;raf=requestAnimationFrame(loop);
  };
  raf=requestAnimationFrame(loop);
  return ()=>cancelAnimationFrame(raf);
 },[paused,world.phase]);
 const assignment=useMemo(()=>world.phase==="fluid"?quantize(world.nodes):{},[world]);
 const selected=world.nodes.find(p=>p.id===chosen[0]);
 const target=world.nodes.find(p=>p.id===chosen[1]);
 const logicalStress=stress(world);
 const speed=rmsSpeed(world);
 const victory=won(world);
 const save=(next:World,message:string)=>{
  if(next===world)return;setHistory(h=>[...h,world]);setWorld(next);setChosen([]);setDestination("");setNotice(message);
 };
 const handle=(r:Result)=>{if(!r.ok){setNotice(r.reason);return;}save(r.world,r.explanation);};
 const reset=(which:number)=>{dragRef.current=null;setCrystalMode("move");setPaused(false);setPreset(which);setWorld(initial(which));setHistory([]);setChosen([]);setDestination("");setCut(1);setNotice("Nuovo scenario: la fase fluida riparte automaticamente.");};
 function choose(id:string){
  if(world.phase==="crystal"&&crystalMode==="move"&&chosen.length===1&&chosen[0]!==id){
   const target=world.nodes.find(p=>p.id===id),start=world.nodes.find(p=>p.id===chosen[0]);
   if(start?.sink&&target?.sink&&neighbors(start.sink,target.sink)){
    handle(crystalMove(world,start.id,target.sink));return;
   }
  }
  setChosen(old=>old.includes(id)?old.filter(x=>x!==id):crystalMode==="move"?[id]:old.length===2?[id]:[...old,id]);setDestination("");
 }
 function pointerToWorld(e:React.PointerEvent<SVGGElement>){
  const svg=svgRef.current;if(!svg)return {x:0,y:0};
  const rect=svg.getBoundingClientRect();
  return {x:(e.clientX-rect.left)/rect.width*470-235,y:(e.clientY-rect.top)/rect.height*410-205};
 }
 const centerOf=(p:Particle)=>({x:p.x,y:p.y});
 const previewFusion=world.phase==="crystal"&&chosen.length===2?fuse(world,chosen[0],chosen[1]):null;
 const previewSplit=world.phase==="crystal"&&selected&&destination?split(world,selected.id,destination,cut):null;
 const splitOptions=selected&&parts(selected.dna).ops.length>1?Array.from({length:parts(selected.dna).ops.length-1},(_,i)=>{
  const dna=parts(selected.dna),k=i+1;return {cut:k,a:makeDNA(dna.ops.slice(0,k),dna.palette,dna.seed),b:makeDNA(dna.ops.slice(k),dna.palette,dna.seed)};
 }):[];
 const bySink=new Map(world.nodes.filter(p=>p.sink).map(p=>[p.sink!,p]));
 const selectedSink=world.phase==="crystal"&&selected?.sink||undefined;
 const chosenRelation=selected&&target?affinityReason(selected,target):null;
 return <div style={{background:C.bg,color:C.text,minHeight:"100vh",padding:"22px clamp(14px,3vw,34px)",fontFamily:"system-ui,sans-serif"}}>
  <style>{".phase-grid{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(290px,1fr);gap:18px;align-items:start}.phase-button:disabled{opacity:.35;cursor:not-allowed}.phase-button:hover:not(:disabled){filter:brightness(1.25)}.phase-poly:focus{outline:none}.phase-poly:focus-visible .focus-ring{opacity:1}@media(max-width:850px){.phase-grid{grid-template-columns:1fr}}"} </style>
  <header style={{display:"flex",justifyContent:"space-between",alignItems:"start",gap:15,flexWrap:"wrap",marginBottom:20}}>
   <div><div style={{fontSize:12,letterSpacing:2.2,color:C.mint}}>MINDELEEV · PROTOTIPO DI RICERCA · SPRINT 08</div>
    <h1 style={{margin:"5px 0",fontSize:"clamp(26px,3.8vw,40px)"}}>Mutatron · Phase Shift</h1>
    <p style={{color:C.muted,maxWidth:780,margin:"4px 0"}}>Un universo, due fasi: equilibrio fluido e cristallizzazione esagonale. Fisica in tempo reale, pausa libera e nessun riflesso richiesto.</p></div>
   <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:13}}>
    <a style={{color:C.mint}} href={import.meta.env.BASE_URL+"?experiment=conway-ring"}>Ring Reactor</a>
    <a style={{color:C.mint}} href={import.meta.env.BASE_URL+"discovery/"}>Discovery Lab</a>
    <a style={{color:C.mint}} href={import.meta.env.BASE_URL}>Catalogo originale</a>
   </div>
  </header>
  <div style={{display:"flex",gap:10,alignItems:"end",flexWrap:"wrap",marginBottom:18}}>
   <label style={{display:"grid",gap:5,fontSize:13,color:C.muted}}>Scenario
    <select value={preset} onChange={e=>reset(Number(e.target.value))} style={selectStyle}>{PRESETS.map((p,i)=><option key={i} value={i}>{p.name}</option>)}</select>
   </label>
   <button className="phase-button" style={button} onClick={()=>reset(preset)}>Ricomincia</button>
   <button className="phase-button" style={button} disabled={!history.length} onClick={()=>{
    const h=history.slice(),w=h.pop();if(w){setWorld(w);setHistory(h);setChosen([]);setDestination("");setNotice("Azione annullata.");}
   }}>Annulla</button>
   <div style={{marginLeft:"auto",fontSize:14,color:C.mint,paddingBottom:9}}>ENERGY <b>{world.energy}</b> · Azioni <b>{world.actions}</b> · Tempo simulato <b>{world.steps}</b></div>
  </div>
  <div className="phase-grid">
   <section style={panel}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
     <div><div style={{fontSize:12,letterSpacing:1.6,color:C.mint}}>FASE ATTIVA</div>
     <h2 style={{margin:"4px 0 8px"}}>{world.phase==="fluid"?"FLUIDO · campo libero":"CRISTALLO · sink esagonali"}</h2></div>
     <div style={{background:world.phase==="fluid"?"#23475b":"#554128",padding:"9px 13px",borderRadius:10,fontWeight:650}}>Stress: {logicalStress} · Moto: {speed.toFixed(1)}</div>
    </div>
    <p style={{fontSize:13,color:C.muted}}>{PRESETS[preset].hint}</p>
    <svg ref={svgRef} viewBox="-235 -205 470 410" style={{width:"100%",height:"auto",maxHeight:570,background:"radial-gradient(circle, #18354b, #0b1727 72%)",borderRadius:14}} aria-label="Campo di movimento e griglia del Mutatron">
     <circle cx="0" cy="0" r="106" fill="none" stroke="#568ea1" opacity=".16" strokeDasharray="3 6"/>
     <circle cx="0" cy="0" r="147" fill="none" stroke="#568ea1" opacity=".1" strokeDasharray="3 9"/>
     {SINKS.map(s=><g key={s.key} onClick={()=>{
       if(world.phase!=="crystal"||bySink.has(s.key))return;
       if(crystalMode==="move"&&selected){handle(crystalMove(world,selected.id,s.key));return;}
       setDestination(s.key);
      }} style={{cursor:world.phase==="crystal"?"pointer":"default"}}>
       <polygon points={hex(s.x,s.y,42)} fill={destination===s.key?"#705339":world.phase==="crystal"?"#2b4150":"transparent"}
        stroke={destination===s.key?"#ffd08d":selectedSink&&crystalMode==="move"&&neighbors(selectedSink,s.key)?"#87d5b5":"#6f97a7"} strokeWidth={destination===s.key?2.5:selectedSink&&crystalMode==="move"&&neighbors(selectedSink,s.key)?2.3:1} opacity={world.phase==="crystal"?.78:.25}/>
       {world.phase==="crystal"&&<text x={s.x} y={s.y+28} textAnchor="middle" fontSize="9" fill="#849cab">{s.key}</text>}
      </g>)}
     {showLinks&&world.nodes.flatMap((a,i)=>world.nodes.slice(i+1).map(b=>{
       const d=Math.hypot(a.x-b.x,a.y-b.y),aim=desiredDistance(a,b);
       const error=bondRelativeError(a,b),severity=Math.min(1,error/.6);
       const engaged=chosen.includes(a.id)||chosen.includes(b.id);
       const hue=Math.round(138*(1-severity));
       const opacity=Math.min(1,.035+.92*Math.pow(severity,.85)+(engaged?.12:0));
       const width=.35+5*Math.pow(severity,1.15)+(engaged?.3:0);
       return <line key={a.id+b.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
        stroke={`hsl(${hue},88%,50%)`} strokeWidth={width} strokeOpacity={opacity} strokeLinecap="round">
         <title>{a.id}–{b.id}: distanza {d.toFixed(1)}, ideale {aim.toFixed(1)}, errore {(error*100).toFixed(0)}%</title>
        </line>;
     }))}
     {world.phase==="fluid"&&showPreview&&world.nodes.map(p=>{
      const s=SINKS.find(x=>x.key===assignment[p.id]);if(!s)return null;
      return <g key={"preview-"+p.id}><path d={"M "+p.x+" "+p.y+" L "+s.x+" "+s.y} stroke={polyColor(p.dna)} strokeWidth="1.4" opacity=".62" strokeDasharray="4 4"/>
       <circle cx={s.x} cy={s.y} r="19" fill="none" stroke={polyColor(p.dna)} opacity=".45" strokeWidth="2"/></g>;
     })}
     {world.nodes.map(p=>{
       const pt=centerOf(p),picked=chosen.includes(p.id),col=polyColor(p.dna);
       return <g key={p.id} className="phase-poly" transform={"translate("+pt.x+" "+pt.y+")"} role="button" tabIndex={0} aria-label={"Polytrone "+p.id+" "+p.dna}
        onPointerDown={e=>{
         if(world.phase==="fluid"){
          e.currentTarget.setPointerCapture(e.pointerId);
          dragRef.current={id:p.id,x:p.x,y:p.y,startX:e.clientX,startY:e.clientY,pointerId:e.pointerId,moved:false,before:world};
         }
        }}
        onPointerMove={e=>{
         const dr=dragRef.current;if(!dr||dr.id!==p.id||dr.pointerId!==e.pointerId)return;
         const pt=pointerToWorld(e);dr.x=pt.x;dr.y=pt.y;
         if(!dr.moved&&Math.hypot(e.clientX-dr.startX,e.clientY-dr.startY)>6){dr.moved=true;setChosen([p.id]);}
        }}
        onPointerUp={e=>{
         const dr=dragRef.current;
         if(dr&&dr.id===p.id&&dr.pointerId===e.pointerId){
          dragRef.current=null;
          if(dr.moved){setChosen([p.id]);setHistory(h=>[...h,dr.before]);setNotice("Polytrone trascinato: le altre particelle seguono le forze reciproche. Trascinamento gratuito soltanto nel laboratorio.");}
          else choose(p.id);
          if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
         }else choose(p.id);
         e.currentTarget.blur();e.stopPropagation();
        }}
        onPointerCancel={()=>{dragRef.current=null;}}
        onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();choose(p.id);}}}
        style={{cursor:world.phase==="fluid"?"grab":"pointer",touchAction:"none",filter:picked?"drop-shadow(0px 0px 8px #ffd37d)":"none"}}>
         <circle className="focus-ring" r="30" fill="none" stroke="#d7f7ff" strokeWidth="1.8" strokeDasharray="3 3" opacity="0"/>
         <circle r={picked?25:22} fill="#0a1828" stroke={picked?"#ffe3a0":col} strokeWidth={picked?3:1.8}/>
         <polygon points={hex(0,0,14)} fill={col} opacity=".78" stroke={col} strokeWidth="1"/>
         <text y="4" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#10202d">{p.id}</text>
         <text y="35" textAnchor="middle" fontSize="12" fontWeight="bold" fill={col}>{p.dna}</text>
        </g>;
     })}
    </svg>
    <div style={{display:"flex",gap:16,flexWrap:"wrap",marginTop:12,fontSize:12,color:C.muted}}>
     <label><input type="checkbox" checked={showPreview} onChange={e=>setShowPreview(e.target.checked)}/> Anteprima sink</label>
     <label><input type="checkbox" checked={showLinks} onChange={e=>setShowLinks(e.target.checked)}/> Legami e tensioni</label>
     <label><input type="checkbox" checked={showIdeal} onChange={e=>setShowIdeal(e.target.checked)}/> Dove vorrebbero stare</label>
     <span style={{marginLeft:"auto"}}>La cattura usa assegnazione globale senza sovrapposizioni.</span>
     <div style={{width:"100%",display:"flex",alignItems:"center",gap:8,color:C.muted}}>
       <span style={{fontSize:12}}>Legami:</span>
       <div style={{width:105,height:8,borderRadius:8,background:"linear-gradient(90deg,rgba(38,195,103,.18),#d7ad36,#f04439)"}}/>
       <span style={{fontSize:12}}>verde sottile = distanza ideale · rosso spesso = forte errore. I cerchietti con * mostrano le posizioni ideali rispetto al Polytrone selezionato.</span>
     </div>
    </div>
    {victory&&<p style={{border:"1px solid #39876e",borderRadius:9,padding:12,color:C.mint}}>Scoperta: ad05C sintetizzato! Ora rilascia il sistema e confronta il nuovo equilibrio.</p>}
    {testErrors.length>0&&<p style={{color:"#ffb6a9"}}>Autoverifica fallita: {testErrors.join(", ")}</p>}
   </section>
   <aside style={{...panel,display:"grid",gap:14}}>
    <div>
     <h2 style={{margin:"0 0 5px",fontSize:19}}>Controllo del reattore</h2>
     <p style={{color:C.muted,fontSize:13,lineHeight:1.55,margin:"0 0 10px"}}>La fase fluida evolve automaticamente. Pausa quando vuoi per esaminare un legame o avanzare per passi: non serve alcun riflesso.</p>
     {world.phase==="fluid"?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      <button className="phase-button" style={{...button,gridColumn:"1 / -1",background:paused?"#2a665c":"#3a536f",fontWeight:700}}
       onClick={()=>{setPaused(v=>!v);setNotice(paused?"Dinamica ripresa.":"Simulazione in pausa: ora puoi leggere con calma i legami.");}}>
       {paused?"▶ Riprendi realtime":"Ⅱ Pausa"}
      </button>
      {paused&&<>
       <button className="phase-button" style={button} onClick={()=>save(advance(world,1),"Avanzato un passo di simulazione.")}>+1 passo</button>
       <button className="phase-button" style={button} onClick={()=>save(advance(world,60),"Avanzati 60 passi di simulazione.")}>+60 passi</button>
      </>}
      <button className="phase-button" style={{...button,gridColumn:"1 / -1",background:"#2a665c",fontWeight:700}}
       onClick={()=>save(crystallize(world),"Cristallizzato: la previsione dei sink coincide con la cattura. Ora puoi fondere o scindere.")}>Cristallizza sui sink</button>
     </div>:<button className="phase-button" style={{...button,background:"#2a665c"}}
       onClick={()=>{setPaused(false);save(release(world),"Rilasciati i Polytroni: la dinamica riparte automaticamente con le nuove affinità.");}}>Rilascia nel campo fluido ▶</button>}
    </div>
    <div style={{borderTop:"1px solid "+C.border,paddingTop:12}}>
     <h3 style={{fontSize:16,margin:"0 0 7px"}}>Causa → effetto</h3>
     {world.phase==="crystal"&&<div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
       <button style={{...button,background:crystalMode==="move"?"#387e68":"#244e64"}} onClick={()=>{setCrystalMode("move");setChosen([]);setDestination("");}}>Muovi / Scambia</button>
       <button style={{...button,background:crystalMode==="react"?"#387e68":"#244e64"}} onClick={()=>{setCrystalMode("react");setChosen([]);setDestination("");}}>Fondi / Scindi</button>
      </div>}
     <p style={{fontSize:13,color:C.muted,margin:"0 0 9px"}}>Selezione: {chosen.length?chosen.join(" → "):"nessuna"}{destination?" · sink libero "+destination:""}</p>
     {world.phase==="fluid"?<div style={{display:"grid",gap:8}}>
      <p style={{fontSize:13,color:C.muted,margin:0}}>Il cannone applica un impulso (−1 ENERGY). Per esplorare il sistema puoi anche trascinare direttamente un Polytrone, osservando gli altri reagire in realtime.</p>
      <div style={{display:"flex",justifyContent:"center"}}><button className="phase-button" style={button} onClick={()=>handle(impulse(world,chosen[0]||"",0,-1))}>↑</button></div>
      <div style={{display:"flex",justifyContent:"center",gap:8}}>
       <button className="phase-button" style={button} onClick={()=>handle(impulse(world,chosen[0]||"",-1,0))}>←</button>
       <button className="phase-button" style={button} onClick={()=>handle(impulse(world,chosen[0]||"",0,1))}>↓</button>
       <button className="phase-button" style={button} onClick={()=>handle(impulse(world,chosen[0]||"",1,0))}>→</button>
      </div>
     </div>:crystalMode==="move"?<div style={{display:"grid",gap:8}}>
      <p style={{fontSize:13,color:C.muted,margin:0}}>Seleziona un Polytrone e poi un esagono adiacente libero: lo sposti. Se selezioni un Polytrone vicino, li scambi. Ogni movimento costa 1 ENERGY.</p>
     </div>:<div style={{display:"grid",gap:8}}>
      <p style={{fontSize:13,color:C.muted,margin:0}}>Fusione: seleziona due Polytroni adiacenti nell'ordine. Fissione: seleziona un Polytrone, poi un sink vuoto confinante, e indica dove tagliare.</p>
      <button className="phase-button" style={button} onClick={()=>handle(fuse(world,chosen[0]||"",chosen[1]||""))}>Fondi (−2 ENERGY)</button>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
       <label style={{fontSize:13,color:C.muted}}>Taglio dopo
        <select style={{...selectStyle,marginLeft:7}} value={cut} onChange={e=>setCut(Number(e.target.value))}>
         {Array.from({length:Math.max(1,selected?parts(selected.dna).ops.length-1:1)},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}
        </select>
       </label>
       <button className="phase-button" style={button} onClick={()=>handle(split(world,chosen[0]||"",destination,cut))}>Scindi (−2 ENERGY)</button>
      </div>
     </div>}
    </div>
    <div style={{borderTop:"1px solid "+C.border,paddingTop:12}}>
     <h3 style={{fontSize:16,margin:"0 0 8px"}}>Identità geometrica</h3>
     {selected?<div style={{display:"flex",gap:9,alignItems:"center",flexWrap:"wrap"}}>
      <PolyhedronPreview dna={selected.dna}/>
      <div style={{fontSize:13,lineHeight:1.8,color:C.muted}}>
       <b style={{color:C.text}}>{selected.dna}</b><div>Seme: {parts(selected.dna).seed}</div>
       <div>Palette: {parts(selected.dna).palette}</div>
       <div>Operatori: {parts(selected.dna).ops||"(nessuno)"}</div>
      </div>
     </div>:<p style={{fontSize:13,color:C.muted}}>Seleziona un Polytrone per vedere il poliedro 3D prodotto dal motore Conway originale.</p>}
     {target&&<p style={{fontSize:13,color:C.muted}}>Secondo reagente: {target.dna}. Affinità di coppia: distanza preferita {Math.round(desiredDistance(selected!,target))}.</p>}
    </div>
    {world.phase==="crystal"&&<div style={{borderTop:"1px solid "+C.border,paddingTop:12}}>
     <h3 style={{fontSize:16,margin:"0 0 8px"}}>Anteprima delle trasmutazioni</h3>
     {previewFusion&&<div style={{border:"1px solid #4b7182",borderRadius:8,padding:10,fontSize:13,lineHeight:1.6,marginBottom:9}}>
       <b>Fusione {chosen.join(" + ")}</b>
       {previewFusion.ok?<><div style={{color:C.mint}}>{selected?.dna} + {target?.dna} → <b>{previewFusion.world.nodes.find(n=>n.id===chosen[0])?.dna}</b></div>
        <div>Stress subito dopo: {stress(previewFusion.world)} (prima {logicalStress})</div>
        <div style={{color:C.muted}}>Distanze e colori dei legami cambieranno dopo il rilascio; questa NON è una previsione dell'equilibrio finale.</div>
       </>:<div style={{color:"#f1b9ab"}}>{previewFusion.reason}</div>}
      </div>}
     {selected&&splitOptions.length>0&&<div style={{border:"1px solid #4b7182",borderRadius:8,padding:10,fontSize:13,lineHeight:1.6}}>
      <b>Tagli possibili di {selected.dna}</b>
      {splitOptions.map(option=><button key={option.cut} style={{...button,padding:"5px 9px",margin:"5px 5px 0 0",fontSize:12,
       background:cut===option.cut?"#376f63":"#254257"}}
       onClick={()=>setCut(option.cut)}>dopo {option.cut}: {option.a} + {option.b}</button>)}
      <div style={{color:C.muted,marginTop:8}}>Scegli un sink vuoto adiacente sulla mappa per verificare la fissione prima di confermarla.</div>
      {previewSplit&&(previewSplit.ok?<div style={{color:C.mint}}>Risultato valido · stress subito dopo: {stress(previewSplit.world)} (prima {logicalStress})</div>
       :<div style={{color:"#f1b9ab"}}>{previewSplit.reason}</div>)}
     </div>}
     {!previewFusion&&splitOptions.length===0&&<p style={{fontSize:13,color:C.muted}}>Seleziona un Polytrone per vedere le possibilità di fissione, oppure due per vedere la fusione prima di applicarla.</p>}
    </div>}
    <div role="status" aria-live="polite" style={{background:"#1d4554",padding:13,borderRadius:10,fontSize:13,lineHeight:1.6}}>{notice}</div>
    <p style={{color:C.muted,fontSize:12,lineHeight:1.5,margin:0}}>Esperimento di game design: lo stress misura gli scarti dalle distanze preferite, mentre il moto misura la velocità residua: un sistema fermo non è necessariamente poco stressato. Il trascinamento è gratuito solo in questo laboratorio. Le probabilità genetiche e la produzione di ENERGY non sono ancora attive. Obiettivo tutorial: creare <b>ad05C</b>; non è un puzzle bilanciato né una simulazione quantistica.</p>
   </aside>
  </div>
 </div>;
}
