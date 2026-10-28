import {useEffect,useRef,useState,type CSSProperties} from "react";
import * as THREE from "three";
import {polytronGeometry} from "@/polytron/polytron";
import {PlanarRapierEngine,DEFAULT_PLAN,DEFAULT_DYNAMICS,FIXED_STEP,SINK_HEIGHT,isCollisionEvent,
 type Plan,type Stats,type Impact,type AgentView,type Scenario} from "./PlanarRapierEngine";
import {VERBS,decode} from "./IslandAffinityEngine";
const UI={bg:"#071524",panel:"#102a3a",stroke:"#3e6074",fg:"#ecf8ff",muted:"#acc9d8",mint:"#88ead0",gold:"#f0ca8b"};
const panel:CSSProperties={border:"1px solid "+UI.stroke,background:UI.panel,borderRadius:15,padding:15};
const control:CSSProperties={color:UI.fg,background:"#1e4b61",border:"1px solid #588197",borderRadius:9,padding:"8px 10px",fontSize:13};
const btn:CSSProperties={...control,cursor:"pointer"};
const fmt=(n:number)=>n.toFixed(2).replace(".",",");
const PRESET:{id:Scenario;name:string;desc:string}[]=[
 {id:"color",name:"Sei tetraedri · Colora",desc:"Sei controller T equidistanti. I viaggiatori attraversano il campo in corona radiale e cambiano palette e, se previsto dal DNA della stazione, anche forma."},
 {id:"five",name:"Cinque verbi platonici",desc:"Un percorso sperimentale fra T Colora, C Combina, O Scinde, D Clona, I Seleziona. Le collisioni sono fisiche; la reazione deriva dal DNA."},
 {id:"quiet",name:"Filtro / equilibrio",desc:"Un controllo per osservare distanze preferite, urti, rotazioni e moto senza metamorfosi cromatiche."}
];
const DNA_OPTS=["01T","02T","k02T","a02T","01C","02C","a02C","ad01C","k01C","adk01C",
 "01O","02O","d02O","01D","02D","a02D","01I","02I","d02I"];
const PLATONIC_LEGEND=[
 ["T","Tetraedro","Colora","Assegna palette; eventuali operatori Conway modificano anche la forma."],
 ["C","Cubo","Combina","Unisce DNA compatibili; attende un secondo viaggiatore."],
 ["O","Ottaedro","Scinde","Taglia casualmente i geni Conway: DNA non tagliabili → nulla."],
 ["D","Dodecaedro","Clona","Produce due portatori dello stesso DNA, ripartendo le risorse."],
 ["I","Icosaedro","Seleziona","Filtra per palette; i portatori respinti non spariscono."]
] as const;
function makeGroup(dna:string,type:"traveler"|"controller",scale:number,id?:string){
 const geom=polytronGeometry(dna),group=new THREE.Group();
 const shape=new THREE.Mesh(geom.solid,new THREE.MeshStandardMaterial({
  vertexColors:true,roughness:.38,metalness:.12,flatShading:true,side:THREE.DoubleSide}));
 shape.castShadow=true;shape.receiveShadow=true;
 const edge=new THREE.LineSegments(geom.edges,new THREE.LineBasicMaterial({color:0xdcefff,transparent:true,opacity:.48}));
 group.add(shape,edge);
 group.scale.setScalar(scale);
 group.userData.dna=dna;
 group.userData.agentId=id??"";
 return group;
}
function disposeGroup(group:THREE.Group){
 group.traverse(child=>{
  if(child instanceof THREE.Mesh||child instanceof THREE.LineSegments){
   child.geometry.dispose();
   if(Array.isArray(child.material))child.material.forEach(m=>m.dispose());else child.material.dispose();
  }
 });
}
type DNAManualEdit={id:string;dna:string;seq:number};
function IslandScene({plan,playing,view,onReport,onSelect,selectedId,pauseOnCollision,onCollision,manualEdit}:{
 plan:Plan;playing:boolean;view:"top"|"zoom";
 onReport:(stats:Stats,agents:AgentView[],events:Impact[])=>void;
 onSelect:(id:string)=>void;selectedId:string|null;
 pauseOnCollision:boolean;onCollision:(e:Impact)=>void;manualEdit:DNAManualEdit|null;
}){
 const mount=useRef<HTMLDivElement>(null),playingRef=useRef(playing),viewRef=useRef(view),report=useRef(onReport);
 const pick=useRef(onSelect),collision=useRef(onCollision),pauseOn=useRef(pauseOnCollision),selected=useRef(selectedId);
 const engineRef=useRef<PlanarRapierEngine|null>(null);
 useEffect(()=>{playingRef.current=playing;},[playing]);
 useEffect(()=>{viewRef.current=view;},[view]);
 useEffect(()=>{report.current=onReport;},[onReport]);
 useEffect(()=>{pick.current=onSelect;},[onSelect]);
 useEffect(()=>{collision.current=onCollision;},[onCollision]);
 useEffect(()=>{pauseOn.current=pauseOnCollision;},[pauseOnCollision]);
 useEffect(()=>{selected.current=selectedId;},[selectedId]);
 useEffect(()=>{
  if(!manualEdit||!engineRef.current)return;
  try{
   if(engineRef.current.editDNA(manualEdit.id,manualEdit.dna)){
    report.current(engineRef.current.stats(),engineRef.current.agentsView(),
      engineRef.current.events.slice(-1));
   }
  }catch(e){console.warn("DNA edit rejected",e);}
 },[manualEdit]);
 useEffect(()=>{
  const root=mount.current;if(!root)return;
  let alive=true,raf=0,engine:PlanarRapierEngine|undefined,renderer:THREE.WebGLRenderer|undefined,observer:ResizeObserver|undefined;
  let removePick:(()=>void)|undefined;
  let accumulator=0,last=0,reportedEvents=0,lastSnapshot=0;
  const objects=new Map<string,THREE.Group>(),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const selectedRing=new THREE.Mesh(new THREE.RingGeometry(.32,.37,40),
   new THREE.MeshBasicMaterial({color:0xf4d08b,transparent:true,opacity:.85,side:THREE.DoubleSide}));
  selectedRing.rotation.x=-Math.PI/2;selectedRing.visible=false;
  const scene=new THREE.Scene();scene.background=new THREE.Color("#071a29");
  scene.fog=new THREE.FogExp2(0x071a29,.018);scene.add(selectedRing);
  const top=new THREE.OrthographicCamera(-9.3,9.3,9.3,-9.3,.1,90);
  top.position.set(0,28,.001);top.up.set(0,0,-1);top.lookAt(0,0,0);
  const orbit=new THREE.PerspectiveCamera(42,1,.1,90);
  orbit.position.set(0,11,15);orbit.lookAt(0,.8,0);
  scene.add(new THREE.HemisphereLight(0xbde9ff,0x19303d,2.1));
  const light=new THREE.DirectionalLight(0xffffff,3.5);light.position.set(5,11,6);scene.add(light);
  const fill=new THREE.PointLight(0x75e9d2,35,14);fill.position.set(-3,4,0);scene.add(fill);
  const disk=new THREE.Mesh(new THREE.CylinderGeometry(8.3,8.3,.10,96),
   new THREE.MeshStandardMaterial({color:0x153549,roughness:.95,metalness:.12}));
  disk.position.y=-.16;scene.add(disk);
  for(let radius=1;radius<8;radius+=1.5){
   const pts=Array.from({length:121},(_,i)=>{const a=i*Math.PI/60;return new THREE.Vector3(Math.cos(a)*radius,-.095,Math.sin(a)*radius);});
   const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({color:0x3e6e81,transparent:true,opacity:.25}));
   scene.add(l);
  }
  const source=new THREE.Group();
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.53,.045,8,64),
   new THREE.MeshStandardMaterial({color:0x7ae7c2,emissive:0x3aa889,emissiveIntensity:1.4,metalness:.25}));
  ring.rotation.x=Math.PI/2;source.add(ring);
  const core=makeGroup("02I","controller",.31);core.position.y=.95;source.add(core);
  source.position.y=.12;scene.add(source);
  const trackers:THREE.Group[]=[];
  const boot=async()=>{
   try{
    const next=await PlanarRapierEngine.create(plan);
    if(!alive){next.dispose();return;}engine=next;engineRef.current=next;
    renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
    renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.shadowMap.enabled=false;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.domElement.style.width="100%";renderer.domElement.style.height="100%";renderer.domElement.style.display="block";
    root.appendChild(renderer.domElement);
    const onPick=(evt:PointerEvent)=>{
     if(!renderer)return;
     const box=renderer.domElement.getBoundingClientRect();
     pointer.set((evt.clientX-box.left)/box.width*2-1,-(evt.clientY-box.top)/box.height*2+1);
     raycaster.setFromCamera(pointer,viewRef.current==="top"?top:orbit);
     const hits=raycaster.intersectObjects([...objects.values()],true);
     for(const hit of hits){
      let o:THREE.Object3D|null=hit.object;
      while(o&&!(o.userData.agentId as string|undefined))o=o.parent;
      if(o?.userData.agentId){pick.current(String(o.userData.agentId));return;}
     }
    };
    renderer.domElement.addEventListener("pointerdown",onPick);
    removePick=()=>renderer?.domElement.removeEventListener("pointerdown",onPick);
    const resize=()=>{
     if(!renderer)return;
     const w=Math.max(1,root.clientWidth),h=Math.max(1,root.clientHeight);
     renderer.setSize(w,h,false);
     top.left=-9.3*w/h;top.right=9.3*w/h;top.top=9.3;top.bottom=-9.3;top.updateProjectionMatrix();
     orbit.aspect=w/h;orbit.updateProjectionMatrix();
    };
    observer=new ResizeObserver(resize);observer.observe(root);resize();
    last=performance.now();
    const animate=(now:number)=>{
     if(!alive||!renderer||!engine)return;
     const seconds=Math.min(.1,(now-last)/1000);last=now;
     if(playingRef.current)accumulator+=seconds;
     else accumulator=0;
     let loops=0;
     while(accumulator>=FIXED_STEP&&loops++<10){
      const before=engine.events.length;
      engine.tick();accumulator-=FIXED_STEP;
      const collisionEvent=pauseOn.current?engine.events.slice(before).find(isCollisionEvent):undefined;
      if(collisionEvent){
       // Exactly ONE physics step ends at the collision. The parent immediately
       // pauses before the next frame; preserve the complete event and select
       // its traveling subject for the inspector.
       accumulator=0;playingRef.current=false;
       report.current(engine.stats(),engine.agentsView(),engine.events.slice(reportedEvents));
       reportedEvents=engine.events.length;
       collision.current(collisionEvent);
       break;
      }
     }
     if(loops>=10)accumulator=0;
     const agents=engine.agentsView(),seen=new Set<string>();
     for(const a of agents){
      seen.add(a.id);let group=objects.get(a.id);
      if(!group||group.userData.dna!==a.dna){
       if(group){scene.remove(group);disposeGroup(group);}
       group=makeGroup(a.dna,a.type,plan.sizes[a.type],a.id);
       objects.set(a.id,group);scene.add(group);
      }
      group.position.set(a.x,a.y,a.z);
      group.quaternion.set(a.qx,a.qy,a.qz,a.qw);
     }
     for(const [id,g] of objects)if(!seen.has(id)){scene.remove(g);disposeGroup(g);objects.delete(id);}
     const chosen=agents.find(a=>a.id===selected.current);
     selectedRing.visible=!!chosen;
     if(chosen){selectedRing.position.set(chosen.x,.11,chosen.z);}
     source.rotation.y+=seconds*.08;
     renderer.render(scene,viewRef.current==="top"?top:orbit);
     if(now-lastSnapshot>160){
      lastSnapshot=now;
       report.current(engine.stats(),agents,engine.events.slice(reportedEvents));
      reportedEvents=engine.events.length;
     }
     raf=requestAnimationFrame(animate);
    };
    raf=requestAnimationFrame(animate);
   }catch(e){if(alive)root.textContent="Rapier/WebGL non disponibile: "+String(e);}
  };
  void boot();
  return ()=>{
   alive=false;cancelAnimationFrame(raf);observer?.disconnect();engineRef.current=null;
   removePick?.();
   if(renderer&&renderer.domElement.parentElement===root)root.removeChild(renderer.domElement);
   objects.forEach(g=>{scene.remove(g);disposeGroup(g);});
   selectedRing.geometry.dispose();(selectedRing.material as THREE.Material).dispose();
   trackers.forEach(g=>disposeGroup(g));disposeGroup(core);
   source.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(o.material as THREE.Material).dispose();}});
   for(const child of scene.children)if(child instanceof THREE.Line){
    child.geometry.dispose();(child.material as THREE.Material).dispose();
   }
   disk.geometry.dispose();(disk.material as THREE.Material).dispose();
   renderer?.dispose();engine?.dispose();
  };
 },[plan]);
 return <div ref={mount} style={{width:"100%",height:"clamp(370px,59vw,645px)",background:"#071827",borderRadius:13,overflow:"hidden"}} aria-label="Mutatron planare con corpi rigidi 3D e vera fisica Rapier"/>;
}
function NumberSlider({label,value,min,max,step,onChange,unit=""}:{label:string;value:number;min:number;max:number;step:number;onChange:(v:number)=>void;unit?:string}){
 return <label style={{display:"grid",gap:5,fontSize:12,color:UI.muted}}>
  <span style={{display:"flex",justifyContent:"space-between",gap:8}}><span>{label}</span><b style={{color:UI.fg}}>{value.toFixed(step<.1?2:1)}{unit}</b></span>
  <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>
 </label>;
}
export default function PlanarRapierLab(){
 const [draft,setDraft]=useState<Plan>(DEFAULT_PLAN),[plan,setPlan]=useState<Plan>(DEFAULT_PLAN);
 const [playing,setPlaying]=useState(true),[view,setView]=useState<"top"|"zoom">("top");
 const [stats,setStats]=useState<Stats|null>(null),[agents,setAgents]=useState<AgentView[]>([]);
 const [events,setEvents]=useState<Impact[]>([]);
 const update=(p:Partial<Plan>)=>setDraft(s=>({...s,...p}));
 const dyn=(key:keyof Plan["dynamics"],value:number)=>setDraft(s=>({...s,dynamics:{...s.dynamics,[key]:value}}));
 const report=(s:Stats,a:AgentView[],e:Impact[])=>{
  setStats(s);setAgents(a);if(e.length)setEvents(previous=>[...e,...previous].slice(0,60));
 };
 const launch=()=>{
  setStats(null);setAgents([]);setEvents([]);
  setPlan({...draft,dynamics:{...draft.dynamics}});
  setPlaying(true);
 };
 const changed=JSON.stringify(draft)!==JSON.stringify(plan);
 return <main style={{background:UI.bg,color:UI.fg,minHeight:"100vh",padding:"clamp(12px,2vw,24px)",fontFamily:"system-ui,sans-serif"}}>
  <style>{".rapier-cols{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(300px,.78fr);gap:14px;align-items:start}.rapier-controls{display:flex;flex-wrap:wrap;align-items:center;gap:10px}@media(max-width:1000px){.rapier-cols{grid-template-columns:1fr}}"}</style>
  <header style={{maxWidth:970,marginBottom:15}}>
   <div style={{fontSize:11,color:UI.mint,letterSpacing:2}}>MINDELEEV · SPRINT 27 · 2.5D PHYSICS LAB</div>
   <h1 style={{fontSize:"clamp(24px,3vw,37px)",margin:"7px 0"}}>Planar Rapier Mutatron</h1>
   <p style={{fontSize:14,color:UI.muted,lineHeight:1.6,margin:0}}>Il campo rimane orizzontale e l'emissione è radiale. I poliedri sono corpi rigidi tridimensionali: possono urtarsi, ruotare e sollevarsi temporaneamente, ma ritornano verso la quota dei PolytronSink. Il cambio camera non cambia le regole fisiche.</p>
   <div style={{marginTop:9,fontSize:12,display:"flex",gap:15}}>
    <a style={{color:UI.mint}} href={import.meta.env.BASE_URL+"?experiment=island-affinity"}>Island Affinity precedente</a>
    <a style={{color:UI.mint}} href={import.meta.env.BASE_URL+"?experiment=musical-return"}>Musical Return</a>
   </div>
  </header>
  <div className="rapier-cols">
   <div style={{display:"grid",gap:14}}>
    <section style={panel}>
     <div className="rapier-controls" style={{justifyContent:"space-between",marginBottom:10}}>
      <strong>Il caleidoscopio visto dall'alto</strong>
      <div className="rapier-controls">
       <button style={{...btn,background:view==="top"?"#2b7368":"#245065"}} onClick={()=>setView("top")}>Vista dall'alto</button>
       <button style={{...btn,background:view==="zoom"?"#2b7368":"#245065"}} onClick={()=>setView("zoom")}>Zoom-to-3D · osservazione</button>
      </div>
     </div>
     <IslandScene plan={plan} playing={playing} view={view} onReport={report}/>
     <div className="rapier-controls" style={{marginTop:12}}>
      <button style={{...btn,background:"#2d7867"}} onClick={()=>setPlaying(s=>!s)}>{playing?"Pausa":"Riprendi"}</button>
      <button style={btn} onClick={launch}>Rilancia / Ripeti</button>
      {changed&&<span style={{fontSize:12,color:UI.gold}}>Parametri modificati: premi Rilancia per applicarli.</span>}
     </div>
    </section>
    <section style={panel}>
     <h3 style={{fontSize:16,margin:"0 0 9px"}}>Eventi delle collisioni Rapier</h3>
     <div style={{maxHeight:190,overflowY:"auto",display:"grid",gap:5}}>
      {events.length?events.map((e,i)=><div key={e.step+"-"+e.subject+"-"+i} style={{background:"#1d3a4d",borderLeft:"3px solid "+(e.kind==="return"?UI.mint:e.kind==="null"?"#e1a382":"#8db4cb"),padding:8,fontSize:12}}>
       <b>{e.kind.toUpperCase()}</b> · {e.subject}{e.station?" ↔ "+e.station:""} · passo {e.step}
       <div style={{fontSize:11,color:UI.muted,marginTop:3}}>{e.note}{e.before&&e.after&&e.before!==e.after?" · "+e.before+" → "+e.after:""}</div>
      </div>):<p style={{fontSize:12,color:UI.muted}}>Gli eventi appariranno al primo contatto reale fra collider tridimensionali.</p>}
     </div>
    </section>
   </div>
   <aside style={{display:"grid",gap:14}}>
    <section style={panel}>
     <h3 style={{fontSize:16,margin:"0 0 11px"}}>Protocollo di emissione</h3>
     <label style={{fontSize:12,color:UI.muted,display:"grid",gap:5}}>Disposizione isole<select style={control} value={draft.scenario} onChange={e=>update({scenario:e.target.value as Scenario})}>
      {PRESET.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
     </select></label>
     <p style={{fontSize:12,color:UI.muted,lineHeight:1.5}}>{PRESET.find(p=>p.id===draft.scenario)?.desc}</p>
     <div className="rapier-controls" style={{marginBottom:10}}>
      <label style={{fontSize:12,color:UI.muted}}>Emissione <select style={{...control,marginLeft:5}} value={draft.count} onChange={e=>update({count:Number(e.target.value) as 1|6|12})}>
       <option value={1}>Una sonda</option><option value={6}>Sei radiali</option><option value={12}>Dodici radiali</option>
      </select></label>
      <label style={{fontSize:12,color:UI.muted}}>DNA <select style={{...control,marginLeft:5}} value={draft.dna} onChange={e=>update({dna:e.target.value})}>
       {DNA_OPTS.map(d=><option key={d} value={d}>{d}</option>)}
      </select></label>
     </div>
     <div className="rapier-controls">
      <label style={{fontSize:12,color:UI.muted}}>Filtro Sorgente <select value={draft.returnPalette} style={{...control,marginLeft:5}}
       onChange={e=>update({returnPalette:Number(e.target.value)})}>{[0,1,2,3,4].map(n=><option key={n} value={n}>Palette {n}</option>)}</select></label>
      <label style={{fontSize:12,color:UI.muted}}>Forze Shape-DNA <select style={{...control,marginLeft:5}} value={draft.physics} onChange={e=>update({physics:e.target.value as Plan["physics"]})}>
       <option value="shape">Attive</option><option value="off">Spente (controllo)</option></select></label>
     </div>
    </section>
    <section style={panel}>
     <h3 style={{fontSize:16,margin:"0 0 12px"}}>Calibrazione fisica</h3>
     <div style={{display:"grid",gap:10}}>
      <NumberSlider label="Periodo naturale del ritorno al piano" value={draft.dynamics.period} min={.7} max={6} step={.1} unit=" s" onChange={v=>dyn("period",v)}/>
      <NumberSlider label="Smorzamento ζ" value={draft.dynamics.dampingRatio} min={0} max={1.3} step={.05} onChange={v=>dyn("dampingRatio",v)}/>
      <NumberSlider label="Impulso iniziale radiale" value={draft.dynamics.launchSpeed} min={.5} max={9} step={.25} unit=" m/s" onChange={v=>dyn("launchSpeed",v)}/>
      <NumberSlider label="Attrazione fra forme" value={draft.dynamics.attraction} min={0} max={3} step={.1} onChange={v=>dyn("attraction",v)}/>
      <NumberSlider label="Restituzione degli urti" value={draft.dynamics.restitution} min={0} max={1} step={.05} onChange={v=>dyn("restitution",v)}/>
      <NumberSlider label="Accoppiamento fra viaggiatori" value={draft.dynamics.pairSpring} min={0} max={2} step={.05} onChange={v=>dyn("pairSpring",v)}/>
      <NumberSlider label="Damping angolare" value={draft.dynamics.angularDamping} min={0} max={1.5} step={.05} onChange={v=>dyn("angularDamping",v)}/>
      <NumberSlider label="Quota di equilibrio PolytronSink" value={draft.dynamics.hoverHeight} min={.75} max={1.7} step={.05} unit=" m" onChange={v=>dyn("hoverHeight",v)}/>
     </div>
     <div className="rapier-controls" style={{marginTop:12}}>
      <button style={btn} onClick={()=>setDraft(s=>({...s,dynamics:{...DEFAULT_DYNAMICS}}))}>Ripristina valori iniziali</button>
      <button style={{...btn,background:"#25776c"}} onClick={launch}>Applica e rilancia</button>
     </div>
    </section>
    <section style={panel}>
     <h3 style={{fontSize:16,margin:"0 0 9px"}}>Telemetria Rapier</h3>
     <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
      {([["Passi fisici",stats?.step??0],["Collisioni",stats?.impacts??0],
       ["Metamorfosi",stats?.geneticChanges??0],["Rientri",stats?.returns??0],
       ["Quota massima",stats?.peakHeight??SINK_HEIGHT],["Velocità massima",stats?.peakSpeed??0],
       ["Viaggiatori in volo",stats?.active??plan.count],["ENERGY rientrata",stats?.returnedEnergy??0]] as [string,number][]).map(([k,v])=>
        <div key={k} style={{background:"#1e3c4e",borderRadius:9,padding:9}}>
         <div style={{fontSize:11,color:UI.muted}}>{k}</div>
         <strong style={{fontSize:18}}>{typeof v==="number"?fmt(v):v}</strong>
        </div>)}
     </div>
     <p style={{fontSize:11,color:UI.muted,lineHeight:1.55}}>Passo fisso {FIXED_STEP.toFixed(4)} s (120 Hz). Controller statici a y≈1, viaggiatori con piena rotazione 3D, salto breve e richiamo elastico alla stessa quota. Nessuna emissione sferica e nessuna migrazione permanente in altezza.</p>
     {agents.length>0&&<div style={{fontSize:11,color:UI.muted}}>DNA nel campo: {[...new Set(agents.filter(a=>a.type==="traveler").map(a=>a.dna))].join(" · ")||"nessuno"}</div>}
    </section>
    <section style={panel}>
     <h3 style={{fontSize:16,margin:"0 0 8px"}}>Che cosa è e non è questo laboratorio</h3>
     <p style={{fontSize:12,color:UI.muted,lineHeight:1.65}}>I corpi rigidi, i collider convessi, gli impulsi e le rotazioni sono realmente calcolati da Rapier 3D. Le forme e le palette arrivano dal generatore Conway/Polyhedronisme. Le forze a distanza sono parametrizzate da Shape-DNA, ma la legge che le lega alla forza è una nostra scelta progettuale.</p>
     <p style={{fontSize:12,color:UI.gold,lineHeight:1.65}}>La quantità di moto non è conservata nel solo insieme dei viaggiatori perché urtano controller fissi. La metamorfosi ricostruisce l'inerzia del collider, e il lavoro del richiamo al piano non è ancora contabilizzato in una conservazione energetica globale. Queste sono ricerche fisiche successive, non capacità già risolte.</p>
    </section>
   </aside>
  </div>
 </main>;
}
