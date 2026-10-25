import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";
import { polytronGeometry } from "@/polytron/polytron";
import { recipeToInt } from "@/polytron/mapping";
import {
  RING_LEVELS, CELLS, NUCLEUS, initial, applyMove, victory, totalEnergy,
  operators, type Move, type GameState,
} from "./ringEngine";

const COLLECTION_KEY = "mindeleev-conway-ring-discoveries-v1";

function readCollection():string[] {
  try { const stored=JSON.parse(localStorage.getItem(COLLECTION_KEY)||"[]");
    return Array.isArray(stored)?stored.filter((x):x is string=>typeof x==="string"):[];
  } catch { return []; }
}
function saveCollection(items:string[]) {
  try { localStorage.setItem(COLLECTION_KEY,JSON.stringify(items)); } catch { /* Non-persistent browser */ }
}
function PolyPreview({dna}:{dna:string}) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const host=ref.current;if(!host)return;
    let geometry:ReturnType<typeof polytronGeometry>|null=null;
    let renderer:THREE.WebGLRenderer|null=null;
    let material:THREE.MeshLambertMaterial|null=null;
    let edgeMaterial:THREE.LineBasicMaterial|null=null;
    let raf=0;
    try {
      geometry=polytronGeometry(dna);
      const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,0.1,100);
      camera.position.set(0,0,9);camera.lookAt(0,0,0);
      renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setSize(130,130);
      host.appendChild(renderer.domElement);
      scene.add(new THREE.AmbientLight(0xffffff,1.3));
      material=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
      edgeMaterial=new THREE.LineBasicMaterial({color:0xb4d9ef,transparent:true,opacity:0.42});
      const group=new THREE.Group();
      group.add(new THREE.Mesh(geometry.solid,material),new THREE.LineSegments(geometry.edges,edgeMaterial));
      scene.add(group);
      const animate=()=>{group.rotation.y+=0.009;group.rotation.x+=0.003;renderer!.render(scene,camera);raf=requestAnimationFrame(animate);};
      animate();
    }catch(e){ host.textContent="Anteprima 3D non disponibile: "+String(e); }
    return ()=>{
      cancelAnimationFrame(raf);
      if(renderer){if(host.contains(renderer.domElement))host.removeChild(renderer.domElement);renderer.dispose();}
      if(geometry){geometry.solid.dispose();geometry.edges.dispose();}
      material?.dispose();edgeMaterial?.dispose();
    };
  },[dna]);
  return <div ref={ref} style={{width:130,minHeight:130,flex:"0 0 130px"}} title={dna}/>;
}
const polygon=(x:number,y:number,s:number)=>
  Array.from({length:6},(_,i)=>{const a=Math.PI/180*(60*i);return `${(x+s*Math.cos(a)).toFixed(2)},${(y+s*Math.sin(a)).toFixed(2)}`;}).join(" ");

type Notice={text:string;error:boolean};
const panelStyle:CSSProperties={background:"#132236",border:"1px solid #2e4a60",borderRadius:15,padding:20};
const buttonStyle:CSSProperties={background:"#23475d",border:"1px solid #47768a",borderRadius:8,padding:"9px 12px",color:"#effaff",cursor:"pointer"};
const selectStyle:CSSProperties={background:"#1b3349",border:"1px solid #527188",borderRadius:8,padding:9,color:"#effaff"};
const tinyStyle:CSSProperties={fontSize:13,color:"#a8bdcb",lineHeight:1.6};

export default function ConwayRingLab(){
  const [levelId,setLevelId]=useState(0);
  const [state,setState]=useState<GameState>(()=>initial(RING_LEVELS[0]));
  const [selection,setSelection]=useState<string[]>([]);
  const [history,setHistory]=useState<GameState[]>([]);
  const [cut,setCut]=useState(1);
  const [notice,setNotice]=useState<Notice>({text:"Seleziona due celle nell'ordine indicato. Ogni azione può essere tentata: se non è possibile, viene spiegato il motivo.",error:false});
  const [collection,setCollection]=useState<string[]>(readCollection);
  const level=RING_LEVELS[levelId],won=victory(state,level);
  const total=useMemo(()=>totalEnergy(state),[state]);
  const a=selection[0]||"",b=selection[1]||"";
  const selectedDna=a?state.pieces[a]:undefined;
  const maxCut=selectedDna?Math.max(0,operators(selectedDna).length-1):0;
  const safeCut=Math.max(1,Math.min(cut,maxCut));
  function selectCell(key:string){
    setSelection(cur=>cur.includes(key)?cur.filter(k=>k!==key):cur.length>=2?[key]:[...cur,key]);
  }
  function run(move:Move){
    const result=applyMove(state,move);
    if(!result.ok){setNotice({text:result.reason,error:true});return;}
    const next=result.state;
    let detail=result.detail;
    const nucleusDna=next.pieces[NUCLEUS];
    if(nucleusDna && next.born[NUCLEUS] && !collection.includes(nucleusDna)){
      const updated=[...collection,nucleusDna];
      setCollection(updated);saveCollection(updated);
      detail+=` Prima scoperta: ${nucleusDna} aggiunto alla Tavola!`;
    } else if(nucleusDna && next.born[NUCLEUS] && move.kind==="enter"){
      detail+=` ${nucleusDna} era già presente nella Tavola.`;
    }
    if(victory(next,level))detail+=" Obiettivo di questo puzzle raggiunto. Puoi continuare a sperimentare oppure passare al successivo.";
    setHistory(h=>[...h,state]);setState(next);setSelection([]);setCut(1);
    setNotice({text:detail,error:false});
  }
  function reset(i:number){
    setLevelId(i);setState(initial(RING_LEVELS[i]));setSelection([]);setHistory([]);setCut(1);
    setNotice({text:"Nuovo esperimento: tutte le operazioni sono disponibili, purché siano rispettati i vincoli.",error:false});
  }
  const selectedDescription=selection.length===0
    ?"Seleziona prima un Polytrone e poi, se necessario, la sua seconda cella."
    :selection.length===1
    ?`Prima cella: ${a} (${state.pieces[a]||"vuota"}). Per fondere o dividere, seleziona una seconda cella.`
    :`Prima: ${a} (${state.pieces[a]||"vuota"}) → Seconda: ${b} (${state.pieces[b]||"vuota"}).`;

  return <div style={{minHeight:"100vh",background:"#090f1b",color:"#e6f1fa",fontFamily:"system-ui,sans-serif",padding:"22px max(16px,3vw)"}}>
    <header style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:16,alignItems:"center",marginBottom:24}}>
      <div>
        <div style={{fontSize:12,letterSpacing:2.1,color:"#7ee2c4"}}>MINDELEEV · GAME DESIGN LAB · SPRINT 04</div>
        <h1 style={{fontSize:32,margin:"5px 0"}}>Conway Ring Reactor</h1>
        <div style={{color:"#92adc1"}}>DNA di Conway autentico · Nucleo · trasmutazioni reversibili</div>
      </div>
      <div><a href={import.meta.env.BASE_URL} style={{color:"#9edaca"}}>Catalogo originale</a> · <a href={import.meta.env.BASE_URL+"discovery/"} style={{color:"#9edaca"}}>Discovery Lab</a></div>
    </header>
    <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:20}}>
      <label htmlFor="level">Puzzle</label>
      <select id="level" value={levelId} onChange={e=>reset(Number(e.target.value))} style={selectStyle}>
        {RING_LEVELS.map((l,i)=><option key={i} value={i}>{l.title}</option>)}
      </select>
      <button style={buttonStyle} onClick={()=>reset(levelId)}>Ricomincia</button>
      <button style={buttonStyle} disabled={!history.length} onClick={()=>{
        const h=[...history],prev=h.pop();if(!prev)return;
        setState(prev);setHistory(h);setSelection([]);setNotice({text:"Ultima mossa annullata. Le scoperte già registrate nella Tavola rimangono.",error:false});
      }}>Annulla</button>
      <strong style={{marginLeft:"auto",color:"#8be7b7"}}>⚡ Energia disponibile: {state.energy} · Mosse: {state.turns}</strong>
    </div>
    <div className="ring-layout" style={{display:"grid",gridTemplateColumns:"minmax(0,1.7fr) minmax(280px,1fr)",gap:18,alignItems:"start"}}>
      <section style={panelStyle}>
        <h2 style={{fontSize:19,marginTop:0}}>{level.title}</h2>
        <p style={{color:"#abc4d4"}}>{level.hint} Obiettivo: portare un <b>{level.target}</b> appena sintetizzato nel <b>Nucleo</b>.</p>
        <svg viewBox="0 0 520 480" style={{width:"100%",maxHeight:540}} aria-label="Mutatron: 19 celle e Nucleo centrale">
          {CELLS.map(c=>{
            const x=260+61*c.axial.q,y=242+70*(c.axial.r+c.axial.q/2);
            const dna=state.pieces[c.key],selected=selection.includes(c.key),isNucleus=c.key===NUCLEUS;
            return <g key={c.key} onClick={()=>selectCell(c.key)} role="button" tabIndex={0}
              aria-label={`Cella ${c.key}: ${dna||"vuota"}`}
              onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();selectCell(c.key);}}}
              style={{cursor:"pointer"}}>
              <polygon points={polygon(x,y,40)} fill={isNucleus?"#584321":dna?"#315b69":"#17293c"}
                stroke={selected?"#ffcf77":isNucleus?"#e4aa49":"#345369"} strokeWidth={selected?4:isNucleus?3:2}/>
              <text x={x} y={y+(isNucleus&&!dna?3:5)} textAnchor="middle" fill="#eff9ff" fontWeight="bold" fontSize={isNucleus&&!dna?12:18}>
                {dna?.replace("C","")||(isNucleus?"NUCLEO":"·")}
              </text>
              <text x={x} y={y+24} textAnchor="middle" fontSize="10" fill={isNucleus?"#f6d69c":"#9db4c7"}>{c.key}{state.born[c.key]?" ✦":""}</text>
            </g>;
          })}
        </svg>
        {won&&<div style={{padding:14,border:"1px solid #50a888",borderRadius:8,color:"#9be7c4"}}>Puzzle risolto. {level.target} nel Nucleo, energia residua: {state.energy}. Le mosse restano disponibili.</div>}
        <p style={tinyStyle}>✦ = Polytrone generato da fusione o fissione. Per registrarlo nella Tavola, portalo nel Nucleo. Il Nucleo può essere liberato con «Estrai».</p>
      </section>
      <aside style={panelStyle}>
        <h2 style={{fontSize:19,marginTop:0}}>Laboratorio di trasmutazione</h2>
        <p style={tinyStyle}>Ruotare un anello costa 1 energia. La fissione è disponibile in tutti i puzzle, anche immediatamente dopo una fusione.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[1,2].flatMap(r=>[-1,1].map(d=>
            <button key={r+":"+d} style={buttonStyle} onClick={()=>run({kind:"rotate",ring:r as 1|2,shift:d as -1|1})}>
              Anello {r} {d>0?"↻":"↺"}
            </button>
          ))}
        </div>
        <p style={tinyStyle}>{selectedDescription}</p>
        <div style={{display:"flex",gap:9,alignItems:"center",flexWrap:"wrap"}}>
          <button style={buttonStyle} onClick={()=>run({kind:"fuse",a,b})}>Fusione</button>
          <button style={buttonStyle} onClick={()=>run({kind:"split",a,b,cut:safeCut})}>Fissione</button>
          <label style={{fontSize:13}}>Taglio{" "}
            <select style={selectStyle} value={safeCut} onChange={e=>setCut(Number(e.target.value))}>
              {Array.from({length:Math.max(1,maxCut)},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}
            </select>
          </label>
        </div>
        <hr style={{borderColor:"#34475d",margin:"20px 0"}}/>
        <h3 style={{margin:"0 0 10px"}}>Nucleo · Tavola Mindeleev</h3>
        <p style={tinyStyle}>Seleziona un Polytrone appena creato nell'anello 1 e premi «Stabilizza». Solo nel Nucleo viene catalogato. «Estrai» lo riporta a una cella libera selezionata.</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button style={buttonStyle} onClick={()=>run({kind:"enter",from:a})}>Stabilizza nel Nucleo</button>
          <button style={buttonStyle} onClick={()=>run({kind:"extract",to:a})}>Estrai dal Nucleo</button>
        </div>
        <p style={{...tinyStyle,color:"#92e1c3"}}>Tavola persistente: <b>{collection.length}</b> DNA distinti.</p>
        {collection.length>0&&<p style={{...tinyStyle,wordBreak:"break-word"}}>{collection.map(d=><span key={d} style={{display:"inline-block",margin:3,padding:"3px 7px",background:"#254259",borderRadius:5}} title={`Numero politronico ${recipeToInt(d)}`}>{d}</span>)}</p>}
        <div aria-live="polite" role="status" style={{background:notice.error?"#4b2931":"#214c4a",padding:13,borderRadius:9,marginTop:16,border:`1px solid ${notice.error?"#c87d88":"#3d867e"}`,fontSize:14,lineHeight:1.55}}>
          {notice.error?"⚠ ":""}{notice.text}
        </div>
        <hr style={{borderColor:"#34475d",margin:"20px 0"}}/>
        <h3 style={{margin:"0 0 10px"}}>Poliedro reale</h3>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          {selectedDna?<PolyPreview dna={selectedDna}/>:<div style={{width:130,height:130,display:"grid",placeItems:"center",border:"1px dashed #3b566c",color:"#7a9bb1"}}>Seleziona un Polytrone</div>}
          <div style={{fontSize:14,lineHeight:1.8}}>{selectedDna?<><b>{selectedDna}</b><br/>Numero {recipeToInt(selectedDna)}<br/>Operatori: {operators(selectedDna)}<br/>Seme C</>:"Geometria generata dal motore originale Three.js."}</div>
        </div>
        <details style={{marginTop:18,color:"#c4d5e1",fontSize:13,lineHeight:1.65}}>
          <summary style={{cursor:"pointer"}}>Approfondimento · Bilancio energetico E+U</summary>
          <p><b>E = {state.energy}</b> energia spendibile. <b>U = {total-state.energy}</b> energia potenziale interna delle forme. <b>E+U = {total}</b>: si conserva attraverso le sole trasformazioni ideali, diminuisce con il costo delle mosse. Non è il punteggio.</p>
          <p>Il potenziale U è un'ipotesi matematica di gameplay, non una grandezza fisica misurata. Anche la concatenazione del DNA è una regola sperimentale; i poliedri sono invece generati realmente dagli operatori Conway.</p>
        </details>
      </aside>
    </div>
    <style>{`@media(max-width:800px){.ring-layout{grid-template-columns:1fr!important}}`}</style>
  </div>;
}
