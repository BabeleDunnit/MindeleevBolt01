import {useEffect,useMemo,useRef,useState,type CSSProperties} from "react";
import * as THREE from "three";
import {polytronGeometry} from "@/polytron/polytron";
import {measurePoly,scatter,histogramDistance,type Phenotype,type Scatter} from "./phenotypeMetrics";

const FORMS=["T","C","O","D","I","dC","aC","aaC","adC","daC","kC","tC","aT","dT","kD","gT","aI","kI","aD","tD"];
const bg="#081521",surface="#142839",outline="#3c586a",muted="#a1b7c8",mint="#7ce4c7";
const button:CSSProperties={color:"#e9f7ff",background:"#25495b",border:"1px solid #548098",borderRadius:9,padding:"9px 12px",cursor:"pointer"};
const card:CSSProperties={background:surface,border:"1px solid "+outline,borderRadius:14,padding:16};
const fmt=(value:number,d=3)=>Number.isFinite(value)?value.toFixed(d):"—";
const hist=(obj:Record<number,number>)=>Object.keys(obj).sort((a,b)=>Number(a)-Number(b)).map(k=>k+"→"+obj[Number(k)]).join(" · ");
function Viewer({dna}:{dna:string}){
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const host=root.current;if(!host)return;
  let renderer:THREE.WebGLRenderer|undefined,geo:ReturnType<typeof polytronGeometry>|undefined;
  let solid:THREE.Material|undefined,wire:THREE.Material|undefined,raf=0,observer:ResizeObserver|undefined;
  try{
   geo=polytronGeometry(dna);
   const scene=new THREE.Scene(),group=new THREE.Group(),camera=new THREE.PerspectiveCamera(35,1,.1,20);
   camera.position.set(2,1.9,5.8);camera.lookAt(0,0,0);
   solid=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
   wire=new THREE.LineBasicMaterial({color:0xa6cbe2,transparent:true,opacity:.4});
   group.add(new THREE.Mesh(geo.solid,solid),new THREE.LineSegments(geo.edges,wire));
   scene.add(group,new THREE.AmbientLight(0xc9e8ff,1.4));
   const light=new THREE.DirectionalLight(0xffffff,2.3);light.position.set(3,5,5);scene.add(light);
   renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
   renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
   renderer.domElement.style.width="100%";renderer.domElement.style.height="100%";
   host.appendChild(renderer.domElement);
   const resize=()=>{const w=Math.max(120,host.clientWidth),h=Math.max(120,host.clientHeight);renderer?.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
   observer=new ResizeObserver(resize);observer.observe(host);resize();
   const draw=()=>{group.rotation.y+=.008;group.rotation.x=.19;renderer?.render(scene,camera);raf=requestAnimationFrame(draw);};draw();
  }catch(err){host.textContent="Anteprima 3D non disponibile: "+String(err);}
  return ()=>{cancelAnimationFrame(raf);observer?.disconnect();if(renderer&&renderer.domElement.parentElement===host)host.removeChild(renderer.domElement);renderer?.dispose();geo?.solid.dispose();geo?.edges.dispose();solid?.dispose();wire?.dispose();};
 },[dna]);
 return <div ref={root} style={{height:225,width:"100%"}} aria-label={"Poliedro tridimensionale "+dna}/>;
}
function Rose({first,second,incident}:{first:Scatter;second:Scatter|null;incident:number}){
 const max=Math.max(...first.bins,...(second?.bins??[]),.0001);
 const polygon=(bins:number[])=>bins.map((value,i)=>{
   const angle=i*2*Math.PI/bins.length,r=17+105*Math.pow(value/max,.52);
   return (i?"L":"M")+(150+r*Math.cos(angle)).toFixed(1)+" "+(150+r*Math.sin(angle)).toFixed(1);
 }).join(" ")+" Z";
 const a=incident*Math.PI/180;
 return <svg viewBox="0 0 300 300" width="100%" style={{maxHeight:340}} aria-label="Diagramma polare della dispersione energetica">
  {([42,80,122] as const).map(r=><circle key={r} cx="150" cy="150" r={r} fill="none" stroke="#89a9b7" strokeOpacity=".25"/>)}
  {Array.from({length:12},(_,i)=><line key={i} x1="150" y1="150" x2={150+134*Math.cos(i*Math.PI/6)} y2={150+134*Math.sin(i*Math.PI/6)} stroke="#7a9eaf" strokeOpacity=".16"/>)}
  <path d={polygon(first.bins)} fill="#53cbe4" fillOpacity=".15" stroke="#5acee8" strokeWidth="2"/>
  {second&&<path d={polygon(second.bins)} fill="#efad5e" fillOpacity=".08" stroke="#efb75e" strokeDasharray="5 4" strokeWidth="2"/>}
  <line x1={150-140*Math.cos(a)} y1={150-140*Math.sin(a)} x2="150" y2="150" stroke="white" strokeWidth="1.8" strokeDasharray="4 4" opacity=".7"/>
  <circle cx="150" cy="150" r="5" fill="#e6fffd"/>
  <text x="150" y="10" fontSize="10" fill="#bdd8e5" textAnchor="middle">90°</text>
  <text x="293" y="155" fontSize="10" fill="#bdd8e5" textAnchor="end">0°</text>
 </svg>;
}
function Detail({p}:{p:Phenotype}){
 return <div style={{...card,display:"grid",gap:8}}>
  <div style={{fontWeight:700,fontSize:17}}>Anatomia geometrica · {p.dna}</div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:6}}>
   {[["V",p.vertices],["E",p.edges],["F",p.faces],["V−E+F",p.euler]].map(([name,value])=><div key={name} style={{background:"#214055",borderRadius:9,padding:9,textAlign:"center"}}><div style={{fontSize:11,color:muted}}>{name}</div><b style={{fontSize:20}}>{value}</b></div>)}
  </div>
  <div style={{fontSize:13,lineHeight:1.75,color:muted}}>
   <div>Facce per lati: <strong style={{color:"#def7f7"}}>{hist(p.faceSides)}</strong></div>
   <div>Valenze dei vertici: <strong style={{color:"#def7f7"}}>{hist(p.vertexDegrees)}</strong></div>
   <div>Aree delle facce · CV: <strong>{fmt(p.areaVariation)}</strong></div>
   <div>Lunghezze degli spigoli · CV: <strong>{fmt(p.edgeVariation)}</strong></div>
   <div>Momenti della nube di vertici: {p.principalMoments.map(v=>fmt(v,4)).join(" / ")}</div>
   <div>Area: {fmt(p.area)} · Volume stimato: {p.volumeReliable?fmt(p.volume):"non affidabile"}</div>
   <div>Incidenza spigolo/facce: {hist(p.edgeIncidenceHistogram)}</div>
  </div>
  <p style={{fontSize:11,color:muted,margin:0}}>CV = coefficiente di variazione (dispersione relativa). La mesh è normalizzata dal generatore: area e volume NON sono misure fisiche. Invariante topologico Euler solo per mesh valide; non è misura estetica.</p>
 </div>;
}
export default function PhenotypeGeometryLab(){
 const [dna,setDna]=useState("aC"),[secondDna,setSecondDna]=useState("dC"),[compare,setCompare]=useState(true);
 const [incident,setIncident]=useState(0),[orientation,setOrientation]=useState(0),[showSpectrum,setShowSpectrum]=useState(false),[atlasOpen,setAtlasOpen]=useState(false);
 const first=useMemo(()=>{try{return measurePoly(dna,showSpectrum);}catch{return null;}},[dna,showSpectrum]);
 const second=useMemo(()=>{try{return compare?measurePoly(secondDna,showSpectrum):null;}catch{return null;}},[secondDna,compare,showSpectrum]);
 const beam=useMemo(()=>first?scatter(first,incident,orientation):null,[first,incident,orientation]);
 const beam2=useMemo(()=>second?scatter(second,incident,orientation):null,[second,incident,orientation]);
 const atlas=useMemo(()=>atlasOpen?FORMS.map(d=>{try{return measurePoly(d);}catch{return null;}}).filter((x):x is Phenotype=>Boolean(x)):[],[atlasOpen]);
 const exportAtlas=()=>{
  const values=atlasOpen?atlas:FORMS.map(d=>{try{return measurePoly(d);}catch{return null;}}).filter((x):x is Phenotype=>Boolean(x));
  const escape=(v:string|number)=>JSON.stringify(String(v));
  const headers=["dna","V","E","F","Euler","closed","face_sides","vertex_degrees","edge_cv","face_area_cv","total_area","volume_estimate","moment_1","moment_2","moment_3","shape_fingerprint"];
  const rows=values.map(p=>[p.dna,p.vertices,p.edges,p.faces,p.euler,p.closed,JSON.stringify(p.faceSides),JSON.stringify(p.vertexDegrees),p.edgeVariation,p.areaVariation,p.area,p.volume,...p.principalMoments,p.shapeKey]);
  const csv=[headers.map(escape).join(","),...rows.map(row=>row.map(v=>escape(String(v))).join(","))].join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");link.href=url;link.download="mindeleev_phenotype_atlas.csv";document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
 };

 return <main style={{background:bg,color:"#e8f5ff",minHeight:"100vh",padding:"clamp(14px,3vw,30px)",fontFamily:"system-ui,-apple-system,sans-serif"}}>
  <style>{".phen-layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(285px,1fr);gap:14px;align-items:start}.phen-table{width:100%;border-collapse:collapse;font-size:12px}.phen-table td,.phen-table th{padding:9px;border-bottom:1px solid #335267;text-align:left}@media(max-width:820px){.phen-layout{grid-template-columns:1fr}}"}</style>
  <header style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:18}}>
   <div><div style={{fontSize:12,color:mint,letterSpacing:1.6}}>MINDELEEV · RESEARCH LAB</div><h1 style={{fontSize:"clamp(25px,4vw,40px)",margin:"5px 0"}}>Phenotype Geometry Lab</h1>
    <p style={{color:muted,maxWidth:690,margin:"5px 0",lineHeight:1.6}}>Dal DNA alla geometria; dalla geometria alle proprietà; dalle proprietà a un'ipotesi di interazione energetica. <b style={{color:"#edfaff"}}>Nessuna abilità associata arbitrariamente agli operatori.</b></p></div>
   <div style={{display:"flex",gap:12,fontSize:13}}><a href={import.meta.env.BASE_URL+"?experiment=phase-shift"} style={{color:mint}}>Sprint 09</a><a href={import.meta.env.BASE_URL} style={{color:mint}}>Catalogo</a></div>
  </header>
  <section style={{...card,display:"flex",alignItems:"end",gap:14,flexWrap:"wrap",marginBottom:14}}>
   <label style={{display:"grid",gap:6,fontSize:13}}>Forma A<select style={button} value={dna} onChange={e=>setDna(e.target.value)}>{FORMS.map(p=><option key={p}>{p}</option>)}</select></label>
   <label style={{fontSize:13,display:"flex",alignItems:"center",gap:5,paddingBottom:9}}><input type="checkbox" checked={compare} onChange={e=>setCompare(e.target.checked)}/>Confronta</label>
   {compare&&<label style={{display:"grid",gap:6,fontSize:13}}>Forma B<select style={button} value={secondDna} onChange={e=>setSecondDna(e.target.value)}>{FORMS.map(p=><option key={p}>{p}</option>)}</select></label>}
  </section>
  <div className="phen-layout">
   <section style={{...card,display:"grid",gap:10}}>
    <h2 style={{fontSize:18,margin:0}}>Risposta angolare · modello geometrico sperimentale</h2>
    {beam?<><Rose first={beam} second={beam2} incident={incident}/>
     <div style={{textAlign:"center",fontSize:12,color:muted}}> <span style={{color:"#5acee8"}}>● {dna}</span> {compare&&second&&<span style={{color:"#efb75e"}}>　● {secondDna} (tratteggio)</span>}　┄ ingresso</div>
     <label style={{display:"grid",gap:5,fontSize:13}}>Angolo di ingresso: {incident}°<input type="range" min="0" max="355" step="5" value={incident} onChange={e=>setIncident(Number(e.target.value))}/></label>
     <label style={{display:"grid",gap:5,fontSize:13}}>Rotazione delle normali intorno a Z: {orientation}°<input type="range" min="0" max="355" step="5" value={orientation} onChange={e=>setOrientation(Number(e.target.value))}/></label>
     <div style={{fontSize:13,display:"flex",justifyContent:"space-around",gap:8,color:mint}}><span>Ingresso: {fmt(beam.incoming,2)}</span><span>Uscita: {fmt(beam.outgoing,2)}</span><span>Assorbita: {fmt(beam.absorbed,2)}</span></div>
    </>:<p style={{color:"#efb0b0"}}>La geometria non è stata generata. Prova un'altra ricetta.</p>}
    <p style={{margin:0,color:muted,fontSize:12,lineHeight:1.55}}>⚠ <b>Non è ottica reale:</b> un fascio unitario viene distribuito nelle direzioni definite dalle normali di faccia proiettate, pesate per area e incidenza. L'integrale delle uscite resta 1. Questo diagramma polare non è ancora una traiettoria di raggi nel reattore.</p>
    <div style={{display:"grid",gridTemplateColumns:compare?"1fr 1fr":"1fr",gap:8}}>
     <div style={{background:"#091d2b",borderRadius:10}}><Viewer dna={dna}/><div style={{textAlign:"center",color:"#5acee8",paddingBottom:9,fontWeight:700}}>{dna}</div></div>
     {compare&&second&&<div style={{background:"#091d2b",borderRadius:10}}><Viewer dna={secondDna}/><div style={{textAlign:"center",color:"#efb75e",paddingBottom:9,fontWeight:700}}>{secondDna}</div></div>}
    </div>
   </section>
   <aside style={{display:"grid",gap:12}}>
    {first&&<Detail p={first}/>}
    {second&&<Detail p={second}/>}
    {first&&second&&<section style={card}><b>Confronto dei descrittori</b>
      <p style={{fontSize:13,color:muted}}>Istogrammi di facce e valenze: <strong style={{color:mint}}>{first.shapeKey===second.shapeKey?"uguali":"diversi"}</strong>.
      Distanza euristica: <b>{fmt(histogramDistance(first,second))}</b></p>
      <p style={{fontSize:11,color:muted,margin:0}}>Gli istogrammi e gli spettri non sono prove di isomorfismo; poliedri diversi possono condividerli.</p>
     </section>}
    <section style={card}><label style={{display:"flex",gap:7,fontSize:13,alignItems:"center"}}><input type="checkbox" checked={showSpectrum} onChange={e=>setShowSpectrum(e.target.checked)}/>Spettro del grafo (avanzato)</label>
     {showSpectrum&&[first,second].filter((x):x is Phenotype=>Boolean(x)).map(p=><div key={p.dna} style={{marginTop:10,fontSize:12,color:muted}}><b>{p.dna}</b>
       <div style={{overflowWrap:"anywhere",fontFamily:"monospace"}}>{p.graphSpectrum?p.graphSpectrum.map(n=>fmt(n,3)).join(" · "):"Oltre 90 vertici; non calcolato"}</div>
      </div>)}
     <p style={{color:muted,fontSize:11,marginBottom:0}}>Autovalori del Laplaciano normalizzato del grafo dei vertici, <b>non</b> lo Shape-DNA di Laplace–Beltrami della superficie. Calcolo limitato a 90 vertici.</p>
    </section>
   </aside>
  </div>
  <section style={{...card,marginTop:16}}>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}><div><h2 style={{fontSize:18,margin:"0 0 6px"}}>Atlante delle forme</h2><p style={{margin:0,color:muted,fontSize:12}}>Confronto dello stesso algoritmo su semi e trasformazioni.</p></div>
    <div style={{display:"flex",gap:7,flexWrap:"wrap"}}><button style={button} onClick={exportAtlas}>Esporta misure CSV</button><button style={button} onClick={()=>setAtlasOpen(x=>!x)}>{atlasOpen?"Chiudi":"Apri"} atlante · {FORMS.length} geometrie</button></div></div>
   {atlasOpen&&<div style={{overflowX:"auto",marginTop:12}}><table className="phen-table"><thead><tr><th>DNA</th><th>V</th><th>E</th><th>F</th><th>Euler</th><th>Facce per lati</th><th>Valenze</th><th>CV aree</th></tr></thead>
    <tbody>{atlas.map(p=><tr key={p.dna} onClick={()=>setDna(p.dna)} style={{cursor:"pointer",background:p.dna===dna?"#28576a":"transparent"}}><td style={{color:mint,fontWeight:700}}>{p.dna}</td><td>{p.vertices}</td><td>{p.edges}</td><td>{p.faces}</td><td>{p.euler}</td><td>{hist(p.faceSides)}</td><td>{hist(p.vertexDegrees)}</td><td>{fmt(p.areaVariation)}</td></tr>)}</tbody>
    </table></div>}
  </section>
  <p style={{fontSize:12,lineHeight:1.6,maxWidth:920,color:muted}}>Una buona risposta geometrica non è ancora una buona meccanica. Stiamo cercando differenze riproducibili, indizi visivi e invarianti: prima le misure, poi il modello di campo, soltanto dopo ENERGY e gioco. Il Mutatron dello Sprint 09 non viene modificato da questo esperimento.</p>
 </main>;
}
