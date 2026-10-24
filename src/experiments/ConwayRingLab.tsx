import {useMemo,useState} from "react";
import * as THREE from "three";
import { polytronGeometry } from "@/polytron/polytron";
import { recipeToInt } from "@/polytron/mapping";
import { RING_LEVELS,CELLS,initial,step,victory,totalEnergy,near,operators,type Move } from "./ringEngine";
import {useEffect,useRef} from "react";

function PolyPreview({dna}:{dna:string}) {
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const host=ref.current;if(!host)return;
  let geometry;
  try{geometry=polytronGeometry(dna);}catch{return;}
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,0.1,100);
  camera.position.set(0,0,9);camera.lookAt(0,0,0);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setSize(130,130);host.appendChild(renderer.domElement);
  scene.add(new THREE.AmbientLight(0xffffff,1.3));
  const mesh=new THREE.Mesh(geometry.solid,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));
  const line=new THREE.LineSegments(geometry.edges,new THREE.LineBasicMaterial({color:0xb4d9ef,transparent:true,opacity:0.42}));
  const group=new THREE.Group();group.add(mesh,line);scene.add(group);
  let raf=0;const animate=()=>{group.rotation.y+=0.009;group.rotation.x+=0.003;renderer.render(scene,camera);raf=requestAnimationFrame(animate);};animate();
  return ()=>{cancelAnimationFrame(raf);host.removeChild(renderer.domElement);geometry.solid.dispose();geometry.edges.dispose();(mesh.material as THREE.Material).dispose();(line.material as THREE.Material).dispose();renderer.dispose();};
 },[dna]);
 return <div ref={ref} style={{width:130,height:130,flex:"0 0 130px"}} title={dna}/>;
}
const polygon=(x:number,y:number,s:number)=>Array.from({length:6},(_,i)=>{const a=Math.PI/180*(60*i);return `${(x+s*Math.cos(a)).toFixed(2)},${(y+s*Math.sin(a)).toFixed(2)}`;}).join(" ");
export default function ConwayRingLab(){
 const [levelId,setLevelId]=useState(0),[state,setState]=useState(()=>initial(RING_LEVELS[0])),[selection,setSelection]=useState<string[]>([]),[history,setHistory]=useState<ReturnType<typeof initial>[]>([]),[cut,setCut]=useState(1),[info,setInfo]=useState("");
 const level=RING_LEVELS[levelId],won=victory(state,level);
 const total=useMemo(()=>totalEnergy(state),[state]);
 const run=(move:Move)=>{
   if(won)return;
   if(move.kind==="split"&&!level.canSplit){setInfo("La fissione non è disponibile in questo livello.");return;}
   const next=step(state,move);
   if(!next){setInfo("Mossa non valida o energia insufficiente.");return;}
   setHistory(h=>[...h,state]);setState(next);setSelection([]);setCut(1);setInfo(victory(next,level)?"Scoperta completata!":"Trasformazione eseguita.");
 };
 const reset=(i:number)=>{setLevelId(i);setState(initial(RING_LEVELS[i]));setSelection([]);setHistory([]);setInfo("");setCut(1);};
 const a=selection[0],b=selection[1],validPair=a&&b&&near(a,b),hasA=a&&state.pieces[a],hasB=b&&state.pieces[b];
 const fuse=!!(validPair&&hasA&&hasB&&operators(hasA).length+operators(hasB).length<=4);
 const split=!!(validPair&&hasA&&!hasB&&operators(hasA).length>1&&level.canSplit);
 const selectedDna=a&&state.pieces[a]?state.pieces[a]:null;
 return <div style={{minHeight:"100vh",background:"#090f1b",color:"#e6f1fa",fontFamily:"system-ui, sans-serif",padding:"22px max(16px,3vw)"}}>
 <header style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:16,alignItems:"center",marginBottom:24}}>
  <div><div style={{fontSize:12,letterSpacing:3,color:"#7ee2c4"}}>MINDELEEV · SPRINT 03 · EXPERIMENT</div><h1 style={{fontSize:32,margin:"5px 0"}}>Conway Ring Reactor</h1><div style={{color:"#92adc1"}}>DNA di Conway autentico · rotazioni concentriche · energia unica</div></div>
  <a href={import.meta.env.BASE_URL} style={{color:"#9edaca"}}>← Torna al catalogo 3D originale</a>
 </header>
 <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:20}}>
 <label htmlFor="level">Puzzle</label><select id="level" value={levelId} onChange={e=>reset(Number(e.target.value))} style={selectStyle}>{RING_LEVELS.map((l,i)=><option key={i} value={i}>{l.title}</option>)}</select>
 <button style={buttonStyle} onClick={()=>reset(levelId)}>Ricomincia</button>
 <button style={buttonStyle} disabled={!history.length} onClick={()=>{const h=[...history],prev=h.pop();if(prev){setState(prev);setHistory(h);setSelection([]);setInfo("Mossa annullata.");}}}>Annulla</button>
 <strong style={{marginLeft:"auto",color:"#8be7b7"}}>Energia {state.energy} · Mosse {state.turns} · E+U {total}</strong>
 </div>
 <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.7fr) minmax(270px,1fr)",gap:18,alignItems:"start"}}>
  <section style={panelStyle}>
   <h2 style={{fontSize:19}}>{level.title}</h2><p style={{color:"#abc4d4"}}>{level.hint} Obiettivo <b>{level.target}</b> nella cella <b>{level.goal}</b>.</p>
   <svg viewBox="0 0 520 480" style={{width:"100%",maxHeight:540}} aria-label="Mutatron a 19 celle">
   {CELLS.map(c=>{const x=260+61*c.axial.q,y=242+70*(c.axial.r+c.axial.q/2);const dna=state.pieces[c.key],sel=selection.includes(c.key);return <g key={c.key} onClick={()=>setSelection(s=>s.includes(c.key)?s.filter(k=>k!==c.key):s.length>=2?[c.key]:[...s,c.key])} style={{cursor:"pointer"}} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setSelection(s=>s.includes(c.key)?s.filter(k=>k!==c.key):s.length>=2?[c.key]:[...s,c.key]);}}}>
    <polygon points={polygon(x,y,40)} fill={dna?"#315b69":c.ring===0?"#283852":"#17293c"} stroke={sel?"#ffcf77":c.key===level.goal?"#84e8b0":"#345369"} strokeWidth={sel?4:2} />
    <text x={x} y={y+5} textAnchor="middle" fill="#eff9ff" fontWeight="bold" fontSize="18">{dna?.replace("C","")||"·"}</text><text x={x} y={y+24} textAnchor="middle" fontSize="10" fill="#9db4c7">{c.key}</text>
   </g>})}
   </svg>
   {won?<div style={{padding:14,border:"1px solid #50a888",borderRadius:8,color:"#9be7c4"}}>Obiettivo raggiunto · energia residua {state.energy}</div>:null}
  </section>
  <aside style={panelStyle}>
   <h2 style={{fontSize:19}}>Trasmutazioni</h2>
   <p style={{color:"#a2becc",fontSize:14}}>Ruota uno degli anelli (−1 energia). Seleziona due celle nell'ordine desiderato per fondere o scindere.</p>
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
   {[1,2].flatMap(r=>[-1,1].map(d=><button key={r+":"+d} style={buttonStyle} disabled={won||state.energy<1} onClick={()=>run({kind:"rotate",ring:r as 1|2,shift:d as -1|1})}>Anello {r} {d>0?"↻":"↺"}</button>))}
   </div>
   <p>Selezione: {selection.length?selection.join(" → "):"nessuna"}</p>
   <div style={{display:"flex",gap:9,alignItems:"center",flexWrap:"wrap"}}>
    <button style={buttonStyle} disabled={!fuse||won} onClick={()=>run({kind:"fuse",a:a!,b:b!})}>Fusione</button>
    <button style={buttonStyle} disabled={!split||won} onClick={()=>run({kind:"split",a:a!,b:b!,cut})}>Fissione</button>
    {split&&<label>Taglio <select style={selectStyle} value={cut} onChange={e=>setCut(Number(e.target.value))}>{Array.from({length:operators(hasA!).length-1},(_,i)=><option value={i+1} key={i}>{i+1}</option>)}</select></label>}
   </div>
   {info&&<p style={{color:"#a0e7c9"}}>{info}</p>}
   <hr style={{borderColor:"#34475d",margin:"22px 0"}}/>
   <h3>Poliedro reale</h3>
   <div style={{display:"flex",alignItems:"center",gap:12}}>
    {selectedDna?<PolyPreview dna={selectedDna}/>:<div style={{width:130,height:130,display:"grid",placeItems:"center",border:"1px dashed #3b566c",color:"#7a9bb1"}}>Seleziona un Polytrone</div>}
    <div style={{fontSize:14,lineHeight:1.8}}>{selectedDna?<><b>{selectedDna}</b><br/>N. politronico {recipeToInt(selectedDna)}<br/>Operazioni: {operators(selectedDna)}<br/>Seme: C</>:"Il renderer usa il motore Three.js del progetto esistente."}</div>
   </div>
   <p style={{fontSize:13,color:"#95aabe"}}>Le sequenze di Conway producono geometria autentica. Le leggi energetiche e la fusione per concatenazione sono ipotesi ludiche, non fisica reale. Tutti i Polytroni sperimentali partono da C.</p>
  </aside>
 </div>
 <style>{`@media(max-width:760px){body #root >div >div:nth-of-type(2){grid-template-columns:1fr!important}}`}</style>
 </div>;
}
const panelStyle:React.CSSProperties={background:"#132236",border:"1px solid #2e4a60",borderRadius:15,padding:20};
const buttonStyle:React.CSSProperties={background:"#23475d",border:"1px solid #47768a",borderRadius:8,padding:"9px 12px",color:"#effaff",cursor:"pointer"};
const selectStyle:React.CSSProperties={background:"#1b3349",border:"1px solid #527188",borderRadius:8,padding:9,color:"#effaff"};
