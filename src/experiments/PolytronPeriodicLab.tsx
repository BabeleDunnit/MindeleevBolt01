import {useEffect,useMemo,useRef,useState,type CSSProperties} from "react";
import * as THREE from "three";
import {polytronGeometry} from "@/polytron/polytron";
import {PALETTES} from "@/polytron/palettes";
import {PALETTE_SETS} from "@/components/HexWorld";
import {SEEDS,OPERATORS} from "@/polytron/mapping";
import {dnaFromPolitronNumber,politronNumberFromDNA,
 rowIndexToOps} from "@/polytron/politronicNumber";
import {PeriodicCatalog,MAX_CATALOG_ROWS,type PeriodicEntry} from "@/polytron/periodicCatalog";
import {faceColorUsage} from "@/polytron/faceColorUsage";

const ink="#e9f8ff",soft="#a6c4d3",mint="#80e3d2",line="#456a7b",bg="#071623",card="#102b3c";
const control:CSSProperties={background:"#153d51",color:ink,border:"1px solid #548195",padding:"9px 11px",borderRadius:9,fontSize:13};
const seedColors:Record<string,string>={T:"#e1acd6",C:"#8acfe7",O:"#edc18d",D:"#b8dc89",I:"#bab3f7"};
const labelNames:Record<string,string>={T:"Tetraedro",C:"Cubo",O:"Ottaedro",D:"Dodecaedro",I:"Icosaedro"};
const clampRows=(x:number)=>Math.min(MAX_CATALOG_ROWS,Math.max(1,Math.trunc(x)));
const fmt=(n:number)=>n.toLocaleString("it-IT");

/**
 * ONE WebGL canvas for the entire table, not hundreds of independent contexts.
 * Its transparent fixed canvas is scissored to only visible 3D viewport boxes.
 * Each viewport contains REAL generated polyhedron geometry, rotated in 3D.
 */
function SharedPeriodic3D({palette,rotate}:{palette:number;rotate:boolean}){
 const root=useRef<HTMLCanvasElement>(null);
 const rotateRef=useRef(rotate);rotateRef.current=rotate;
 useEffect(()=>{
  const canvas=root.current;if(!canvas)return;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"});}
  catch{return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.setClearColor(0x000000,0);
  renderer.autoClear=false;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();
  const group=new THREE.Group();
  scene.add(group);
  const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.53,
   metalness:.08,flatShading:true,side:THREE.DoubleSide});
  const edgeMat=new THREE.LineBasicMaterial({color:0xb7dce7,transparent:true,opacity:.35});
  const mesh=new THREE.Mesh(new THREE.BufferGeometry(),mat);
  const edges=new THREE.LineSegments(new THREE.BufferGeometry(),edgeMat);
  group.add(mesh,edges);
  scene.add(new THREE.HemisphereLight(0xd7f0ff,0x28485b,2.4));
  const lamp=new THREE.DirectionalLight(0xffffff,2.6);
  lamp.position.set(4,6,8);scene.add(lamp);
  const camera=new THREE.PerspectiveCamera(38,1,.05,60);
  camera.position.set(3,2.1,6.5);camera.lookAt(0,0,0);
  const cache=new Map<string,{solid:THREE.BufferGeometry;edges:THREE.BufferGeometry;scale:number}>();
  const CACHE_MAX=100;
  const getGeo=(dna:string)=>{
   let value=cache.get(dna);
   if(value){cache.delete(dna);cache.set(dna,value);return value;}
   const geos=polytronGeometry(dna,()=>palette);
   geos.solid.computeBoundingSphere();
   const radius=geos.solid.boundingSphere?.radius??2;
   value={...geos,scale:1.33/Math.max(.2,radius)};
   cache.set(dna,value);
   if(cache.size>CACHE_MAX){
    const first=cache.keys().next().value;
    if(first!==undefined){
     const expired=cache.get(first)!;
     cache.delete(first);
     expired.solid.dispose();expired.edges.dispose();
    }
   }
   return value;
  };
  let raf=0,alive=true,lastWidth=0,lastHeight=0;
  const frame=(time:number)=>{
   if(!alive)return;
   if(document.hidden){raf=requestAnimationFrame(frame);return;}
   const w=window.innerWidth,h=window.innerHeight;
   if(w!==lastWidth||h!==lastHeight){
    lastWidth=w;lastHeight=h;renderer.setSize(w,h,false);
   }
   renderer.setScissorTest(true);
   // Transparent full-frame clear; cells are individually rendered using scissors.
   renderer.setScissor(0,0,w,h);renderer.setViewport(0,0,w,h);
   renderer.clear(true,true,true);
   const cells=document.querySelectorAll<HTMLElement>("[data-polytron-viewport]");
   for(const cell of cells){
    const rect=cell.getBoundingClientRect();
    if(rect.bottom<=0||rect.top>=h||rect.right<=0||rect.left>=w)continue;
    const dna=cell.dataset.dna;
    if(!dna)continue;
    const x=Math.max(0,Math.round(rect.left));
    const y=Math.max(0,Math.round(h-rect.bottom));
    const right=Math.min(w,Math.round(rect.right));
    const top=Math.min(h,Math.round(h-rect.top));
    const width=right-x,height=top-y;
    if(width<12||height<12)continue;
    let geo;
    try{geo=getGeo(dna);}
    catch{continue;}
    mesh.geometry=geo.solid;edges.geometry=geo.edges;
    group.scale.setScalar(geo.scale);
    group.rotation.y=rotateRef.current?time*.00034:.42;
    group.rotation.x=rotateRef.current ? .23+Math.sin(time*.00024)*.09 : .23;
    camera.aspect=width/height;camera.updateProjectionMatrix();
    renderer.setViewport(x,y,width,height);renderer.setScissor(x,y,width,height);
    renderer.render(scene,camera);
   }
   raf=requestAnimationFrame(frame);
  };
  raf=requestAnimationFrame(frame);
  return ()=>{
   alive=false;cancelAnimationFrame(raf);
   for(const geo of cache.values()){geo.solid.dispose();geo.edges.dispose();}
   mesh.geometry=new THREE.BufferGeometry();edges.geometry=new THREE.BufferGeometry();
   mesh.geometry.dispose();edges.geometry.dispose();
   mat.dispose();edgeMat.dispose();renderer.dispose();
  };
 },[palette]);
 return <canvas ref={root} aria-hidden="true" style={{
  position:"fixed",inset:0,width:"100vw",height:"100vh",
  pointerEvents:"none",zIndex:100,background:"transparent"
 }}/>;
}

export function PeriodicCell({entry,showSpectrum,showEquivalent,palette}:{entry:PeriodicEntry;
 showSpectrum:boolean;showEquivalent:boolean;palette:number}){
 const usage=entry.faceClassIds?faceColorUsage(entry.faceClassIds,palette):null;
 return <article aria-label={"Polytrone "+entry.number+" · "+entry.dna}
  style={{border:"1px solid "+(entry.equivalents.length?"#7aaead":line),
   background:card,borderRadius:10,minWidth:0,overflow:"hidden",
   display:"grid",gridTemplateRows:"auto 140px auto",boxShadow:"0 3px 12px #0002"}}>
  <div style={{padding:"10px 11px 5px",display:"flex",alignItems:"baseline",
   justifyContent:"space-between",gap:5}}>
   <strong style={{fontSize:21,fontVariantNumeric:"tabular-nums",color:ink}}>{fmt(entry.number)}</strong>
   <b style={{color:seedColors[entry.seed],fontSize:12}}>{entry.seed}</b>
  </div>
  {entry.status==="ready"?
   <div data-polytron-viewport="" data-dna={entry.dna}
    style={{width:"100%",height:140,position:"relative",
     background:"radial-gradient(ellipse at center, #21495c 0%, #102b3c 70%)"}}
    aria-label={"Poliedro 3D rotante "+entry.dna}/>:
   <div style={{height:140,display:"flex",alignItems:"center",justifyContent:"center",
    fontSize:12,color:"#f2c3ad",textAlign:"center",padding:8}}>
    {entry.status==="too-complex"?"Geometria troppo complessa":"Operazione non realizzabile"}
   </div>}
  <div style={{padding:"5px 11px 10px",display:"grid",gap:4,minHeight:65}}>
   <code style={{fontSize:14,fontWeight:700,color:ink}}>{entry.dna}</code>
   <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}
    title="Classi di facce distinte (lati e angoli), colorate ciclicamente con la palette selezionata">
    <strong style={{fontSize:12,color:usage&&usage.colorsUsed>1?mint:ink}}>
     Colori usati: {usage?usage.colorsUsed:"—"}
    </strong>
    <span style={{fontSize:10,color:soft}}>
     · Tipi facce: {entry.faceTypeCount??"—"}
    </span>
   </div>
   {usage&&<div style={{display:"flex",gap:3,alignItems:"center"}}
    aria-label={"Colori effettivamente utilizzati: "+usage.colorsUsed}>
    {usage.colors.map(color=><span key={color} title={"#"+color.toString(16).padStart(6,"0")}
     style={{width:13,height:9,borderRadius:2,display:"inline-block",
      border:"1px solid #ffffff30",background:"#"+color.toString(16).padStart(6,"0")}}/>)}
   </div>}
   {showEquivalent&&<div style={{fontSize:11,color:entry.equivalents.length?mint:soft,
    wordBreak:"break-word"}}>
    {entry.equivalents.length?
     <>≡ predecessori: {entry.equivalents.map((id,i)=><span key={id}>
      {i?", ":""}<a style={{color:mint,textDecoration:"underline"}}
       href={"#polytron-"+id}>{id}</a></span>)}</>:
     entry.shapeStatus==="unmeasured"?"ShapeDNA: non misurato":"Equivalenti: —"}
   </div>}
   {showSpectrum&&<div style={{fontSize:10,color:soft,wordBreak:"break-word",
    maxHeight:46,overflow:"auto"}}>
    ShapeDNA: {entry.shapeDNA?.slice(1,6).map(x=>x.toFixed(2)).join(" · ")??"—"}
   </div>}
   {entry.error&&<span title={entry.error} style={{fontSize:10,color:"#dfab96"}}>
    {entry.error.length>70?entry.error.slice(0,70)+"…":entry.error}
   </span>}
  </div>
 </article>;
}
export default function PolytronPeriodicLab(){
 const catalog=useRef(new PeriodicCatalog());
 const [rows,setRows]=useState(12);
 const [rowInput,setRowInput]=useState("12");
 const [entries,setEntries]=useState<PeriodicEntry[]>([]);
 const [paletteGroup,setPaletteGroup]=useState(0);
 const [paletteSlot,setPaletteSlot]=useState(2);
 const [rotate,setRotate]=useState(true);
 const [showEquivalent,setShowEquivalent]=useState(true);
 const [showSpectrum,setShowSpectrum]=useState(false);
 const [lookup,setLookup]=useState("");
 const [lookupMessage,setLookupMessage]=useState("");
 const [currentFocus,setCurrentFocus]=useState<number|null>(null);
 const palette=PALETTE_SETS[paletteGroup].offset+paletteSlot;
 const rowTarget=Math.min(rows*5,MAX_CATALOG_ROWS*5);
 useEffect(()=>{
  let stopped=false,timer:ReturnType<typeof setTimeout>|undefined;
  const work=()=>{
   if(stopped)return;
   const start=performance.now();
   let processed=0;
   while(catalog.current.entries.length<rowTarget&&processed<2){
    catalog.current.appendRow();processed++;
    if(performance.now()-start>15)break;
   }
   if(processed)setEntries([...catalog.current.entries]);
   if(catalog.current.entries.length<rowTarget&&!stopped)timer=setTimeout(work,5);
  };
  timer=setTimeout(work,0);
  return ()=>{stopped=true;if(timer!==undefined)clearTimeout(timer);};
 },[rowTarget]);
 const visible=useMemo(()=>entries.slice(0,rowTarget),[entries,rowTarget]);
 // A number search may extend the catalog asynchronously. Navigate once the
 // requested cell has actually been generated and mounted in the document.
 useEffect(()=>{
  if(currentFocus!==null&&entries.length>=currentFocus&&currentFocus<=rowTarget){
   document.getElementById("polytron-"+currentFocus)
    ?.scrollIntoView({behavior:"smooth",block:"center"});
  }
 },[currentFocus,entries.length,rowTarget]);
 const stats=useMemo(()=>{
  const distribution=[0,0,0,0,0,0];
  let maxFaceTypes=0,maxColors=0,classified=0;
  for(const entry of visible)if(entry.faceClassIds){
   const usage=faceColorUsage(entry.faceClassIds,palette);
   distribution[Math.min(5,usage.colorsUsed)]++;
   maxFaceTypes=Math.max(maxFaceTypes,usage.faceTypes);
   maxColors=Math.max(maxColors,usage.colorsUsed);
   classified++;
  }
  return {
   measured:visible.filter(e=>e.shapeStatus==="measured").length,
   duplicates:visible.filter(e=>e.equivalents.length>0).length,
   unknown:visible.filter(e=>e.shapeStatus==="unmeasured").length,
   skipped:visible.filter(e=>e.status!=="ready").length,
   classified,maxFaceTypes,maxColors,distribution
  };
 },[visible,palette]);
 const changeRows=(value:string)=>{
  setRowInput(value);
  if(/^\d+$/.test(value)&&Number(value)>0)setRows(clampRows(Number(value)));
 };
 const applyLookup=()=>{
  try{
   let number:bigint;
   if(/^\d+$/.test(lookup.trim())){
    number=BigInt(lookup.trim());
    const dna=dnaFromPolitronNumber(number);
    setLookupMessage("Numero "+number.toString()+" → ConwayDNA "+dna);
   }else{
    number=politronNumberFromDNA(lookup.trim());
    setLookupMessage("ConwayDNA "+lookup.trim()+" → numero "+number.toString());
   }
   if(number<=BigInt(rowTarget)){
    const n=Number(number);
    setCurrentFocus(n);
    document.getElementById("polytron-"+n)?.scrollIntoView({behavior:"smooth",block:"center"});
   }else{
    const targetRows=Number((number+4n)/5n);
    if(targetRows<=MAX_CATALOG_ROWS){
     setRows(targetRows);setRowInput(String(targetRows));setCurrentFocus(Number(number));
     setLookupMessage(old=>old+" · estensione a "+targetRows+" righe");
    }else setLookupMessage(old=>old+" · oltre il limite di visualizzazione ("+MAX_CATALOG_ROWS+" righe)");
   }
  }catch(e){setLookupMessage(String(e));}
 };
 return <main style={{background:bg,color:ink,minHeight:"100vh",
  fontFamily:"system-ui,sans-serif",padding:"clamp(10px,2vw,24px)"}}>
  <SharedPeriodic3D palette={palette} rotate={rotate}/>
  <header style={{maxWidth:1050,marginBottom:18}}>
   <div style={{color:mint,letterSpacing:2,fontSize:11}}>MINDELEEV · SPRINT 35 · CONWAY × SHAPEDNA</div>
   <h1 style={{fontSize:"clamp(26px,4vw,42px)",margin:"6px 0 9px"}}>
    Tavola periodica dei Polytroni
   </h1>
   <p style={{maxWidth:880,color:soft,fontSize:14,lineHeight:1.6,marginTop:0}}>
    Cinque poliedri fondamentali e sequenze Conway ordinate per lunghezza crescente.
    Ogni numero politronico identifica una ricetta geometrica, mai una palette.
    Le equivalenze sono confrontate mediante ShapeDNA v2 spettrale e geometria,
    non semplicemente per somiglianza di nome.
   </p>
   <div style={{display:"flex",gap:15,fontSize:12,flexWrap:"wrap"}}>
    <a style={{color:mint}} href={import.meta.env.BASE_URL+"?experiment=orbital-mut"}>Orbital Mutatron</a>
    <a style={{color:mint}} href={import.meta.env.BASE_URL}>Catalogo esagonale originale</a>
    <a style={{color:mint}} href={import.meta.env.BASE_URL+"?experiment=phenotype"}>Laboratorio ShapeDNA</a>
   </div>
  </header>
  <section style={{padding:14,background:card,border:"1px solid "+line,
   borderRadius:13,display:"grid",gap:13,marginBottom:14}}>
   <div style={{display:"flex",gap:15,flexWrap:"wrap",alignItems:"end"}}>
    <label style={{display:"grid",gap:5,color:soft,fontSize:12}}>
     Righe da enumerare (1–{fmt(MAX_CATALOG_ROWS)})
     <input type="number" min={1} max={MAX_CATALOG_ROWS} step={1} value={rowInput}
      onChange={e=>changeRows(e.target.value)}
      onBlur={()=>setRowInput(String(rows))}
      style={{...control,width:106,fontVariantNumeric:"tabular-nums"}}/>
    </label>
    <label style={{display:"grid",gap:5,color:soft,fontSize:12}}>
     Famiglia di palette · catalogo originale
     <select style={control} aria-label="Famiglia palette" value={paletteGroup}
      onChange={e=>setPaletteGroup(Number(e.target.value))}>
      {PALETTE_SETS.map((set,i)=><option key={set.id} value={i}>{set.label}</option>)}
     </select>
    </label>
    <label style={{display:"flex",gap:7,color:soft,fontSize:12,alignItems:"center",paddingBottom:8}}>
     <input type="checkbox" checked={rotate} onChange={e=>setRotate(e.target.checked)}/>
     Rotazione 3D
    </label>
    <label style={{display:"flex",gap:7,color:soft,fontSize:12,alignItems:"center",paddingBottom:8}}>
     <input type="checkbox" checked={showEquivalent}
      onChange={e=>setShowEquivalent(e.target.checked)}/> Equivalenti
    </label>
    <label style={{display:"flex",gap:7,color:soft,fontSize:12,alignItems:"center",paddingBottom:8}}>
     <input type="checkbox" checked={showSpectrum}
      onChange={e=>setShowSpectrum(e.target.checked)}/> ShapeDNA
    </label>
   </div>
   <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
    {Array.from({length:10},(_,i)=>{
     const colors=PALETTES[PALETTE_SETS[paletteGroup].offset+i]??[];
     return <button key={i} onClick={()=>setPaletteSlot(i)}
      aria-label={"Palette "+String(PALETTE_SETS[paletteGroup].offset+i).padStart(2,"0")}
      title={"Palette "+String(PALETTE_SETS[paletteGroup].offset+i).padStart(2,"0")}
      style={{background:"#152d3c",padding:3,borderRadius:6,
       border:"2px solid "+(i===paletteSlot?mint:"#28485d"),cursor:"pointer"}}>
      <span style={{display:"flex",width:48,height:23,borderRadius:3,overflow:"hidden"}}>
       {colors.slice(0,5).map((c,j)=><span key={j}
        style={{background:"#"+c.toString(16).padStart(6,"0"),flex:1}}/>)}
      </span>
     </button>;
    })}
   </div>
   <div style={{display:"flex",gap:9,alignItems:"center",flexWrap:"wrap"}}>
    <label style={{fontSize:12,color:soft}} htmlFor="periodic-search">Trova numero o ConwayDNA</label>
    <input id="periodic-search" value={lookup} onChange={e=>setLookup(e.target.value)}
     onKeyDown={e=>{if(e.key==="Enter")applyLookup();}}
     placeholder="es. 137 oppure akT" style={{...control,width:205}}/>
    <button style={{...control,cursor:"pointer",background:"#257464"}}
     onClick={applyLookup}>Trova</button>
    {lookupMessage&&<span style={{fontSize:12,color:mint}} role="status">{lookupMessage}</span>}
   </div>
   <div style={{fontSize:12,color:soft,display:"flex",gap:13,flexWrap:"wrap"}}>
    <span>Righe generate: <b style={{color:ink}}>{Math.min(rows,Math.floor(entries.length/5))}/{rows}</b></span>
    <span>Celle: <b style={{color:ink}}>{fmt(visible.length)}/{fmt(rowTarget)}</b></span>
    <span>ShapeDNA: <b style={{color:ink}}>{fmt(stats.measured)}</b></span>
    <span>Equivalenze: <b style={{color:mint}}>{fmt(stats.duplicates)}</b></span>
    <span>Non misurabili: <b>{fmt(stats.unknown)}</b></span>
    <span>Omesse/invalide: <b>{fmt(stats.skipped)}</b></span>
   </div>
   <div style={{display:"flex",gap:13,flexWrap:"wrap",fontSize:12,color:soft,
    borderTop:"1px solid "+line,paddingTop:11}}>
    <span>Colori usati (max): <b style={{color:mint}}>{stats.maxColors||"—"}</b></span>
    <span>Tipi di facce (max): <b style={{color:ink}}>{stats.maxFaceTypes||"—"}</b></span>
    <span>Palette attuale: <b style={{color:ink}}>{PALETTES[palette]?.length??0} colori</b></span>
    <span>Mono-colore: <b style={{color:ink}}>{fmt(stats.distribution[1])}</b></span>
    <span>Multi-colore: <b style={{color:ink}}>
     {fmt(stats.classified-stats.distribution[1])}
    </b></span>
   </div>
   <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:11,color:soft}}>
    {([1,2,3,4,5] as const).map(count=><span key={count}>
     {count===5?"5+":count} colori: <b style={{color:ink}}>
      {fmt(stats.distribution[count])}</b>
    </span>)}
    <span style={{opacity:.85}}>I tipi di facce sono indipendenti dalla palette;
     i colori effettivi dipendono dai valori RGB selezionati.</span>
   </div>
  </section>
  <div style={{overflowX:"auto",paddingBottom:30}}>
   <div style={{minWidth:760}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,minmax(0,1fr))",gap:7,
     marginBottom:8,position:"sticky",top:0,zIndex:110,background:bg,padding:"7px 0"}}>
     {SEEDS.map(seed=><div key={seed}
      style={{textAlign:"center",borderTop:"3px solid "+seedColors[seed],
       background:"#193b4c",borderRadius:8,padding:"8px 2px"}}>
      <strong style={{color:seedColors[seed],fontSize:22}}>{seed}</strong>
      <div style={{fontSize:11,color:soft}}>{labelNames[seed]}</div>
     </div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,minmax(0,1fr))",
     gap:7,alignItems:"stretch"}}>
     {visible.map(entry=><div key={entry.number} id={"polytron-"+entry.number}
      style={{outline:currentFocus===entry.number?"2px solid "+mint:"none",
       outlineOffset:2,borderRadius:10,scrollMarginTop:75}}>
      <PeriodicCell entry={entry} showSpectrum={showSpectrum}
       showEquivalent={showEquivalent} palette={palette}/>
     </div>)}
    </div>
   </div>
  </div>
  <footer style={{maxWidth:1000,fontSize:12,color:soft,lineHeight:1.65,
   borderTop:"1px solid "+line,paddingTop:15}}>
   <p>Ordine Conway: <code>{OPERATORS.join(" ")}</code>. Prima la stringa vuota,
    poi tutte quelle di lunghezza 1, 2, 3 e così via, in base {OPERATORS.length}.
    Le operazioni sono composte nell'ordine convenzionale di Polyhedronisme
    (applicazione da destra a sinistra). Il numero politronico è un intero
    reversibile anche per DNA molto lunghi.</p>
   <p>Colorazione: Polyhedronisme distingue le classi delle facce tramite
    lunghezze dei lati e angoli, con una tolleranza per gli arrotondamenti.
    La palette assegna i colori alle classi ciclicamente: il numero di tipi
    di facce può superare il numero di colori realmente visibili.
    La misura «Colori usati» conta gli RGB distinti applicati alle facce,
    non quanti colori sono disponibili nella palette.</p>
   <p>Equivalenza ShapeDNA v2: <b>numerica</b>. Confrontiamo gli autovalori
    del Laplaciano FEM poligonale corretto, normalizzati per area, e una firma
    delle distanze tra vertici con uguale distribuzione di facce.
    Non è una prova matematica di congruenza. Mesh oltre 60
    vertici non ricevono un confronto spettrale e alcune ricette
    troppo costose mantengono la propria cella numerata ma non vengono generate.</p>
  </footer>
 </main>;
}
