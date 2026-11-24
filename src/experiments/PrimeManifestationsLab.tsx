import {useEffect,useMemo,useState} from "react";
import {SharedPeriodic3D} from "@/experiments/PolytronPeriodicLab";
import {gradientPair} from "@/polytron/gradientPalettes";
import type {PeriodicEntry} from "@/polytron/periodicCatalog";
import {PRIME_MANIFESTATIONS,PRIME_CATALOG_PERIODS,
 polytronPeriodicUrl} from "@/polytron/primeManifestations";
import "./PrimeManifestationsLab.css";

const GROUP_NAMES=["Tetraedri","Cubi","Ottaedri","Dodecaedri","Icosaedri"] as const;
const GROUP_COLORS=["#e1acd6","#8acfe7","#edc18d","#b8dc89","#bab3f7"] as const;
const primeNumbers=new Set(PRIME_MANIFESTATIONS.map(p=>p.prime));

/**
 * Mobile-first research reference: one shared periodic-table WebGL renderer,
 * 72 real Conway forms, and deep links back to the canonical periodic cells.
 * A worker generates/validates the geometry without blocking board gestures.
 */
export default function PrimeManifestationsLab(){
 const [entries,setEntries]=useState<Record<number,PeriodicEntry>>({});
 const [generatedRows,setGeneratedRows]=useState(0);
 const [error,setError]=useState("");
 const gradient=useMemo(()=>({pair:gradientPair(2,4),order:"contrast" as const}),[]);
 useEffect(()=>{
  let worker:Worker;
  try{
   worker=new Worker(new URL("../polytron/periodicCatalog.worker.ts",import.meta.url),
    {type:"module"});
   worker.onmessage=(event:MessageEvent<{kind:string;entries?:PeriodicEntry[];
     generatedRows?:number;error?:string}>)=>{
    if(event.data.kind==="error"){
     setError(event.data.error??"Catalog generation failed");return;
    }
    if(event.data.kind!=="rows")return;
    setGeneratedRows(event.data.generatedRows??0);
    const relevant=event.data.entries?.filter(e=>primeNumbers.has(e.number))??[];
    if(relevant.length)setEntries(previous=>{
     const updated={...previous};
     for(const entry of relevant)updated[entry.number]=entry;
     return updated;
    });
   };
   worker.onerror=()=>setError("Catalog worker unavailable");
   worker.postMessage({kind:"target",rows:PRIME_CATALOG_PERIODS});
  }catch(err){
   setError("Unable to start geometry catalog: "+String(err));
   return;
  }
  return ()=>worker.terminate();
 },[]);
 const available=PRIME_MANIFESTATIONS.filter(p=>entries[p.prime]).length;
 return <main className="prime-lab">
  <SharedPeriodic3D palette={0} rotate={true} gradient={gradient}/>
  <header className="prime-lab-header">
   <p className="prime-lab-kicker">MINDELEEV · POLYTRONIC PERIODIC TABLE</p>
   <h1>Le prime 72 manifestazioni prime</h1>
   <p>Una manifestazione per ciascuno dei primi 72 numeri primi.
    Il numero primo è anche il <strong>numero polytronico</strong> della manifestazione,
    non l'identità del Polytrone. Tutte le preview 3D usano la geometria Conway
    della Tavola Polytronica, con la medesima palette Chromatica di riferimento
    (Ruber → Chrysos).</p>
   <div className="prime-lab-links">
    <a href={import.meta.env.BASE_URL+"?experiment=polytron-periodic"}>
     Tavola Polytronica completa ↗
    </a>
    <span>{available} / 72 anteprime elaborate
     {generatedRows<PRIME_CATALOG_PERIODS?
      " · Periodi analizzati: "+generatedRows+"/"+PRIME_CATALOG_PERIODS:" · Catalogo completo"}
    </span>
   </div>
   {error&&<p role="alert" className="prime-lab-error">{error}</p>}
  </header>
  <div className="prime-lab-scroll">
   <table className="prime-lab-table">
    <thead>
     <tr>
      <th scope="col">Indice</th>
      <th scope="col">Nº primo</th>
      <th scope="col">Preview · manifestazione</th>
      <th scope="col">Gruppo</th>
      <th scope="col">Periodo</th>
      <th scope="col">Energia intrinseca</th>
      <th scope="col">Tavola</th>
     </tr>
    </thead>
    <tbody>{PRIME_MANIFESTATIONS.map(item=>{
     const catalog=entries[item.prime];
     return <tr key={item.index} id={"prime-"+item.index}>
      <td className="prime-lab-index">{item.index}</td>
      <td className="prime-lab-number"><strong>{item.prime}</strong></td>
      <td className="prime-lab-preview-cell">
       {catalog?.renderable?
        <div className="prime-lab-preview" data-polytron-viewport=""
         data-view-kind="solid" data-dna={item.dna}
         aria-label={"Manifestazione 3D "+item.dna+", numero polytronico "+item.prime}/>:
        <div className="prime-lab-preview prime-lab-preview-fallback" aria-live="off">
         {catalog?"Geometria non renderizzabile":"Preparazione 3D…"}
        </div>}
       <code className="prime-lab-dna">{item.dna}</code>
      </td>
      <td>
       <span className="prime-lab-group"
        style={{borderColor:GROUP_COLORS[item.group-1],
         color:GROUP_COLORS[item.group-1]}}>
        {item.groupCode}
       </span>
       <span className="prime-lab-group-name">{GROUP_NAMES[item.group-1]}</span>
      </td>
      <td className="prime-lab-numeric">{item.period}</td>
      <td className="prime-lab-energy">{item.energy} E</td>
      <td>
       <a className="prime-lab-open"
        href={import.meta.env.BASE_URL+polytronPeriodicUrl(item.prime)}
        aria-label={"Apri manifestazione "+item.prime+" nella Tavola Polytronica"}
        title={"Apri casella "+item.prime+" · "+item.dna+" nella Tavola Polytronica"}>
        Apri ↗
       </a>
      </td>
     </tr>;
    })}</tbody>
   </table>
  </div>
  <footer className="prime-lab-footer">
   <p><strong>Numerazione:</strong> gruppo = ((N − 1) mod 5) + 1;
    periodo = ⌊(N − 1)/5⌋ + 1;
    energia intrinseca = 2 + (periodo − 1) + (gruppo − 1) E.
    La palette non aggiunge energia.</p>
   <p>Le caselle il cui modello supera il budget geometrico rimangono elencate
    e apribili nella Tavola Polytronica. Le preview condividono un solo renderer WebGL
    e vengono disegnate soltanto quando sono visibili.</p>
  </footer>
 </main>;
}
