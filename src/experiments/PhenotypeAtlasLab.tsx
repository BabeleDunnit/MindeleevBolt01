import {useEffect,useMemo,useRef,useState,type CSSProperties} from "react";
import * as THREE from "three";
import {polytronGeometry} from "@/polytron/polytron";
import {SYNTHESIS_PRESETS,synthesisPlan} from "./synthesisPlanner";

type Species={id:string;primary:string;seed:string;recipes:string[];aliases:number;signature:number[];
 vertices:number;edges:number;faces:number;nearestDistance:number;shapeKey:string;
 faceSides:Record<number,number>;vertexDegrees:Record<number,number>};
type Atlas={version:number;method:string;equivalence:string;selection:string;
 stats:{recipesAttempted:number;eligible:number;provisionalForms:number;selected:number;rejected:Record<string,number>};
 forms:Species[]};
const fg="#eaf7ff",muted="#a8bfcb",bg="#081623",panel="#142a3a",border="#335a6a",mint="#8ce6d0";
const btn:CSSProperties={cursor:"pointer",background:"#23495b",color:fg,border:"1px solid #527c91",borderRadius:9,padding:"9px 12px"};
const card:CSSProperties={background:panel,border:"1px solid "+border,borderRadius:12,padding:15};
const distance=(a:number[],b:number[])=>Math.hypot(...a.map((v,i)=>v-b[i]));
const fmt=(x:number)=>Number.isFinite(x)?x.toFixed(3):"—";
const seedColors:Record<string,string>={T:"#d49adc",C:"#58bed8",O:"#e9b166",D:"#a7d27b",I:"#b2a3f4"};
function Model({dna}:{dna:string}){
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const root=ref.current;if(!root)return;
  let renderer:THREE.WebGLRenderer|undefined,geometry:ReturnType<typeof polytronGeometry>|undefined,
      material:THREE.Material|undefined,lines:THREE.Material|undefined,observer:ResizeObserver|undefined;
  try{
   geometry=polytronGeometry(dna);
   const scene=new THREE.Scene(),group=new THREE.Group(),camera=new THREE.PerspectiveCamera(32,1,.1,20);
   camera.position.set(2.3,1.65,6.1);camera.lookAt(0,0,0);
   material=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
   lines=new THREE.LineBasicMaterial({color:0xbfe2f0,transparent:true,opacity:.45});
   group.add(new THREE.Mesh(geometry.solid,material),new THREE.LineSegments(geometry.edges,lines));
   scene.add(group,new THREE.AmbientLight(0xc8e8ff,1.5));
   const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(4,4,5);scene.add(light);
   renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
   renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
   renderer.domElement.style.width="100%";renderer.domElement.style.height="100%";
   root.appendChild(renderer.domElement);
   observer=new ResizeObserver(()=>{const w=Math.max(1,root.clientWidth),h=Math.max(1,root.clientHeight);renderer?.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();renderer?.render(scene,camera);});
   observer.observe(root);
  }catch(e){root.textContent="Viewer WebGL non disponibile: "+String(e);}
  return ()=>{observer?.disconnect();if(renderer?.domElement.parentElement===root)root.removeChild(renderer.domElement);renderer?.dispose();geometry?.solid.dispose();geometry?.edges.dispose();material?.dispose();lines?.dispose();};
 },[dna]);
 return <div ref={ref} style={{height:245,width:"100%"}} aria-label={"Fenotipo 3D "+dna}/>;
}
function ScatterMap({forms,selected,onSelect}:{forms:Species[];selected:string;onSelect:(id:string)=>void}){
 if(!forms.length)return null;
 const points=forms.map(p=>({p,x:p.signature[0],y:p.signature[1]}));
 const xs=points.map(x=>x.x),ys=points.map(x=>x.y);
 const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
 const rx=(x:number)=>34+(x-xmin)/Math.max(.001,xmax-xmin)*370;
 const ry=(y:number)=>230-(y-ymin)/Math.max(.001,ymax-ymin)*185;
 return <svg viewBox="0 0 440 260" width="100%" aria-label="Proiezione 2D dello Shape-DNA; seleziona una specie">
   {[0,1,2,3,4].map(i=><g key={i}><line x1="30" x2="418" y1={40+i*45} y2={40+i*45} stroke="#7394a6" strokeOpacity=".13"/><line y1="30" y2="240" x1={45+i*88} x2={45+i*88} stroke="#7394a6" strokeOpacity=".13"/></g>)}
   {points.map(({p,x,y})=><g key={p.id} style={{cursor:"pointer"}} onClick={()=>onSelect(p.id)} role="button" tabIndex={0}
     onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onSelect(p.id);}}}>
     <circle cx={rx(x)} cy={ry(y)} r={p.id===selected?10:6} fill={seedColors[p.seed]||mint} stroke={p.id===selected?"#fff":"#0c2133"} strokeWidth={p.id===selected?3:1.4} opacity={p.id===selected?1:.83}/>
     <title>{p.primary} · λ₁ {fmt(x)} · λ₂ {fmt(y)}</title>
   </g>)}
   <text x="225" y="255" textAnchor="middle" fontSize="12" fill={muted}>λ₁ · area normalizzata</text>
   <text x="12" y="132" textAnchor="middle" fontSize="12" fill={muted} transform="rotate(-90 12 132)">λ₂</text>
  </svg>;
}
function Properties({p}:{p:Species}){
 return <div style={{color:muted,fontSize:13,lineHeight:1.8}}>
  <div><b style={{color:fg}}>V / E / F:</b> {p.vertices} / {p.edges} / {p.faces}</div>
  <div><b style={{color:fg}}>Signature:</b> {p.signature.map(fmt).join(" · ")}</div>
  <div><b style={{color:fg}}>Istogrammi:</b> {p.shapeKey.slice(0,140)}</div>
  <div><b style={{color:fg}}>Alias di ricetta:</b> {p.recipes.join(" · ")}</div>
  <div><b style={{color:fg}}>Distanza nearest (nel campione selezionato):</b> {fmt(p.nearestDistance)}</div>
 </div>;
}
export default function PhenotypeAtlasLab(){
 const [atlas,setAtlas]=useState<Atlas|null>(null),[error,setError]=useState("");
 const [selected,setSelected]=useState(""),[query,setQuery]=useState(""),[preset,setPreset]=useState("six");
 const [count,setCount]=useState(24),[showAll,setShowAll]=useState(false);
 useEffect(()=>{
  let active=true;
  fetch(import.meta.env.BASE_URL+"phenotype-atlas.json").then(async r=>{if(!r.ok)throw Error("HTTP "+r.status);
   return await r.json() as Atlas;}).then(data=>{if(active){setAtlas(data);setSelected(data.forms[0]?.id??"");}})
   .catch(e=>{if(active)setError("Impossibile caricare l'atlante precomputato: "+String(e));});
  return ()=>{active=false;};
 },[]);
 const visible=useMemo(()=>{
  if(!atlas)return [];
  const all=atlas.forms;
  if(showAll)return all;
  // Resample the offline diversity-selected species using farthest-point selection.
  const chosen:Species[]=[],remaining=[...all];
  for(const seed of ["T","C","O","D","I"]){
   const idx=remaining.findIndex(p=>p.seed===seed);
   if(idx>=0){chosen.push(remaining[idx]);remaining.splice(idx,1);}
  }
  while(chosen.length<Math.min(count,all.length)&&remaining.length){
   let idx=0,best=-Infinity;
   for(let i=0;i<remaining.length;i++){
    const novelty=Math.min(...chosen.map(p=>distance(p.signature,remaining[i].signature)));
    if(novelty>best){best=novelty;idx=i;}
   }
   chosen.push(remaining[idx]);remaining.splice(idx,1);
  }
  return chosen;
 },[atlas,count,showAll]);
 const searched=visible.filter(p=>(p.primary+" "+p.recipes.join(" ")).toLowerCase().includes(query.toLowerCase()));
 const current=(atlas?.forms.find(p=>p.id===selected)||searched[0]);
 const neighbors=useMemo(()=>atlas&&current?atlas.forms.filter(p=>p.id!==current.id)
  .map(p=>({p,d:distance(p.signature,current.signature)})).sort((a,b)=>a.d-b.d).slice(0,5):[],[atlas,current]);
 const recipeCase=SYNTHESIS_PRESETS.find(x=>x.id===preset)||SYNTHESIS_PRESETS[0];
 const plan=useMemo(()=>current?synthesisPlan(recipeCase.dna,current.recipes,3,1100):null,[current,recipeCase]);
 return <main style={{minHeight:"100vh",background:bg,color:fg,fontFamily:"system-ui,-apple-system,sans-serif",padding:"clamp(14px,3vw,26px)"}}>
  <style>{".atlas-layout{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(300px,.85fr);gap:14px;align-items:start}@media(max-width:880px){.atlas-layout{grid-template-columns:1fr}}.atlas-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(124px,1fr));gap:8px}.atlas-cards button{font:inherit;color:inherit}"}</style>
  <header style={{marginBottom:16}}>
   <div style={{fontSize:12,letterSpacing:2,color:mint}}>MINDELEEV · MATHEMATICAL RESEARCH / SPRINT 15</div>
   <h1 style={{fontSize:"clamp(27px,4vw,40px)",margin:"6px 0"}}>Phenotype Atlas</h1>
   <p style={{color:muted,lineHeight:1.6,maxWidth:860}}>Il DNA genera le forme. Lo Shape-DNA confronta la loro geometria. L'atlante seleziona specie diverse e conserva <b style={{color:fg}}>tutte le ricette alternative conosciute</b> per ciascuna, senza confonderle con le identità dei 72 individui.</p>
   <div style={{display:"flex",gap:18,fontSize:13}}><a style={{color:mint}} href={import.meta.env.BASE_URL+"?experiment=phenotype"}>Laboratorio spettroscopico</a><a style={{color:mint}} href={import.meta.env.BASE_URL+"?experiment=phase-shift"}>Mutatron Sprint 09</a></div>
  </header>
  {error&&<p style={{...card,borderColor:"#a44b55",color:"#ffd3d3"}} role="alert">{error}</p>}
  {!atlas&&!error&&<p style={card}>Caricamento del catalogo precomputato…</p>}
  {atlas&&<>
   <section style={{...card,marginBottom:14}}>
    <div style={{display:"flex",gap:18,flexWrap:"wrap",alignItems:"center",justifyContent:"space-between"}}>
     <div style={{display:"flex",gap:18,flexWrap:"wrap"}}>
      {[["Ricette esplorate",atlas.stats.recipesAttempted],["Mesh ammesse",atlas.stats.eligible],["Specie provvisorie",atlas.stats.provisionalForms],["Atlante",atlas.stats.selected]].map(([title,value])=><div key={title}><div style={{fontSize:12,color:muted}}>{title}</div><b style={{fontSize:22}}>{value}</b></div>)}
     </div>
     <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      <a style={{...btn,textDecoration:"none"}} href={import.meta.env.BASE_URL+"phenotype-atlas.json"} download>Esporta JSON</a>
      <a style={{...btn,textDecoration:"none"}} href={import.meta.env.BASE_URL+"phenotype-atlas.csv"} download>Esporta CSV</a>
     </div>
    </div>
    <p style={{margin:"10px 0 0",fontSize:12,color:muted}}>Campione pilota: tre autovalori positivi del Laplaciano di superficie approssimato FEM, normalizzati per area. Equivalenza delle mesh <b>provvisoria</b>; distanza spettrale euclidea ≠ prova di identità.</p>
   </section>
   <div className="atlas-layout">
    <section style={{display:"grid",gap:12}}>
     <section style={card}>
      <h2 style={{fontSize:18,margin:"0 0 6px"}}>Paesaggio spettrale</h2>
      <ScatterMap forms={visible} selected={selected} onSelect={setSelected}/>
      <p style={{color:muted,fontSize:12,lineHeight:1.5,margin:0}}>Proiezione dei primi due autovalori; la selezione avviene in tre dimensioni. Ogni punto è una forma distinta nel nostro catalogo pilota, non un individuo.</p>
     </section>
     <section style={card}>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",marginBottom:13}}>
       <h2 style={{fontSize:18,margin:0}}>Specie selezionate</h2>
       <label style={{fontSize:12}}>Forme mostrate <select value={count} onChange={e=>setCount(Number(e.target.value))} style={btn} disabled={showAll}><option value={12}>12</option><option value={24}>24</option><option value={36}>36</option></select></label>
       <label style={{fontSize:12}}><input type="checkbox" checked={showAll} onChange={e=>setShowAll(e.target.checked)}/> Tutte le selezionate</label>
       <input aria-label="Filtra DNA" placeholder="Filtra per ricetta..." value={query} onChange={e=>setQuery(e.target.value)} style={{...btn,maxWidth:170}}/>
      </div>
      <div className="atlas-cards">{searched.map(p=><button key={p.id} onClick={()=>setSelected(p.id)}
       style={{background:p.id===current?.id?"#2b5b66":"#1e3b4d",border:"1px solid "+(p.id===current?.id?mint:"#44657a"),padding:11,borderRadius:10,cursor:"pointer",textAlign:"left"}}>
       <div style={{fontWeight:700,color:seedColors[p.seed]||fg,fontSize:18}}>{p.primary}</div>
       <div style={{color:muted,fontSize:11}}>V {p.vertices} · F {p.faces}</div>
       <div style={{color:muted,fontSize:11}}>{p.aliases} ricett{p.aliases===1?"a":"e"}</div>
      </button>)}</div>
     </section>
    </section>
    <aside style={{display:"grid",gap:12}}>
     {current&&<><section style={card}>
      <h2 style={{fontSize:19,margin:0}}>Specie {current.primary}</h2>
      <Model dna={current.primary}/>
      <Properties p={current}/>
     </section>
     <section style={card}>
      <h3 style={{fontSize:16,margin:"0 0 8px"}}>Parenti nello spazio Shape-DNA</h3>
      {neighbors.map(({p,d})=><button key={p.id} style={{...btn,width:"100%",textAlign:"left",marginBottom:5,display:"flex",justifyContent:"space-between"}}
       onClick={()=>{setSelected(p.id);setShowAll(true);}}><span>{p.primary} <span style={{color:muted}}>({p.seed})</span></span><span>{fmt(d)}</span></button>)}
      <p style={{fontSize:11,color:muted,margin:"7px 0 0"}}>Vicinanza spettrale non equivale a parentela genetica né a comportamento energetico uguale.</p>
     </section>
     <section style={card}>
      <h3 style={{fontSize:16,margin:"0 0 8px"}}>Vie di sintesi genetica</h3>
      <p style={{fontSize:12,color:muted}}>Troviamo una sequenza di fusione/fissione che realizzi almeno una ricetta della specie, a partire da uno degli inventari già usati nello Sprint 09.</p>
      <select value={preset} onChange={e=>setPreset(e.target.value)} style={{...btn,width:"100%"}}>
       {SYNTHESIS_PRESETS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
      <p style={{fontSize:12,color:muted}}>Disponibili: {recipeCase.dna.join(" · ")}</p>
      {plan&&<div style={{marginTop:8,fontSize:13}}>
       <strong style={{color:plan.status==="found"?mint:"#e7c18e"}}>{plan.status==="found"?"Via trovata verso "+plan.recipe:plan.status==="limited"?"Ricerca limitata":"Via non trovata entro il limite"}</strong>
       {plan.steps.map((step,i)=><div key={i} style={{marginTop:7,padding:8,borderLeft:"2px solid "+mint,background:"#1b3b49"}}>{i+1}. {step.label}</div>)}
       <p style={{fontSize:11,lineHeight:1.6,color:muted}}>{plan.note} ({plan.visited} stati visitati)</p>
      </div>}
     </section></>}
    </aside>
   </div>
   <p style={{color:muted,fontSize:12,lineHeight:1.6,maxWidth:1050,marginTop:20}}>Distinzioni: <b>specie</b> = classe geometrica provvisoria; <b>ricetta</b> = sequenza di operatori che la genera; <b>individuo</b> = essere con nome e identità persistente (non creato da questo atlante). Il solver genetico ignora per ora la topologia dei sink, la posizione sul board, il budget e le mutazioni del seme. Non confondere una via astrattamente possibile con una mossa già eseguibile nel gioco.</p>
  </>}
 </main>;
}
