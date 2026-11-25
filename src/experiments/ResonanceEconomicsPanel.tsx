import type {DifficultyReport,DifficultyScenario} from "@/polytron/resonanceDifficulty";
import type {KaleidoPoint} from "@/polytron/kaleidoscopeGenerator";
import "./ResonanceEconomicsPanel.css";

const fmt=(n:number)=>n.toFixed(1);
const signed=(n:number)=>n>0?"+"+n:String(n);
type Props={
 report:DifficultyReport;selectedId:string;showPlan:boolean;
 onSelect:(id:DifficultyScenario["id"])=>void;
 onToggle:(show:boolean)=>void;
 cells:Map<string,KaleidoPoint>
};
export default function ResonanceEconomicsPanel({
 report,selectedId,showPlan,onSelect,onToggle,cells
}:Props){
 const risk=report.placementRisk;
 const selected=report.scenarios.find(s=>s.id===selectedId)??report.scenarios[0];
 const place=(key:string)=>{
  const cell=cells.get(key);
  return cell?"("+cell.ring+","+cell.idx+")":key;
 };
 return <>
  <h3 className="resonance-econ-title">
   Cinque strategie · capacità {report.budget} E</h3>
  <p className="resonance-econ-copy">
   Confronto fra cinque configurazioni simulate a parità di energia
   totale disponibile. L'energia intrinseca dei Polytroni è
   <b> impegnata, non spesa</b>: torna libera a Home e non si consuma
   con Evolve. La ricompensa dipende soltanto dalla qualità della risposta.
  </p>
  <div className="resonance-econ-scenarios">
   {report.scenarios.map(s=>
    <button type="button" key={s.id}
     className={"resonance-econ-scenario"+
      (selected.id===s.id&&showPlan?" is-selected":"")}
     aria-pressed={selected.id===s.id&&showPlan}
     onClick={()=>onSelect(s.id)}>
     <span className="resonance-econ-scenario-head">
      <strong>{s.name}</strong>
      <span>{s.pieces} Polytroni · {fmt(s.quality)}%</span>
     </span>
     <span className="resonance-econ-values">
      <span><small>Energia impegnata</small><b>{s.energy} E</b></span>
      <span><small>Ricompensa</small><b className="resonance-positive">
       +{s.reward} E</b></span>
      <span><small>Resa</small><b>
       {s.efficiency===null?"—":s.efficiency.toFixed(2)+" E/E"}</b></span>
     </span>
     <span className="resonance-econ-description">{s.description}</span>
    </button>)}
  </div>
  <label className="resonance-econ-show">
   <input type="checkbox" checked={showPlan}
    onChange={e=>onToggle(e.target.checked)}/>
   Mostra sulla plancia lo scenario selezionato
  </label>
  {showPlan&&selected&&<p className="resonance-econ-overlay">
   <b>{selected.name}</b>: gli esagoni tratteggiati indicano
   posizioni simulate, senza consumare energia o aggiungere Polytroni.
  </p>}
  <h3 className="resonance-econ-title">Frontiera: qualità vs energia impegnata</h3>
  <div className="resonance-econ-frontier">
   {report.bands.map(b=>
    <div key={b.budget} className="resonance-econ-frontier-item">
     <strong>Capacità {b.budget} E · Qualità {fmt(b.score)}%</strong>
     <span>{b.pieces} Polytroni · Energia impegnata {b.energy} E</span>
     <span>Ricompensa +{b.reward} E · Resa
      {" "}{b.efficiency===null?"—":b.efficiency.toFixed(2)+" E/E"}</span>
    </div>)}
  </div>
  <h3 className="resonance-econ-title">È possibile piazzare male?</h3>
  <div className="resonance-econ-risks">
   <div>
    <strong>{risk.lowYieldPlacements}/{risk.placementsSampled}</strong>
    <span>piazzamenti con ricompensa aggiuntiva molto bassa
     per unità di energia impegnata</span>
   </div>
   <div>
    <strong>{risk.negligiblePlacements}/{risk.placementsSampled}</strong>
    <span>piazzamenti quasi inutili: variazione di qualità inferiore
     a 0,01 punti</span>
   </div>
   <div>
    <strong>{risk.worseningPlacements}</strong>
    <span>nuovi piazzamenti che peggiorano la qualità globale,
     pur potendo migliorare la risonanza locale</span>
   </div>
   <div>
    <strong>{risk.worseningRelocations}/{risk.relocationsSampled}</strong>
    <span>spostamenti di Polytroni esistenti che peggiorano il punteggio</span>
   </div>
  </div>
  {risk.worstPlacement&&<p className="resonance-econ-example">
   <strong>Esempio poco efficiente:</strong>
   {" "}manifestazione {risk.worstPlacement.pawn.number}
   {" "}in {place(risk.worstPlacement.pawn.key)}.
   Impegna {risk.worstPlacement.energy} E senza spenderli;
   variazione di qualità {fmt(risk.worstPlacement.scoreGain)} punti,
   ricompensa {signed(risk.worstPlacement.rewardGain)} E,
   resa {risk.worstPlacement.yield.toFixed(2)} E/E.
  </p>}
  {risk.worstRelocation&&<p className="resonance-econ-example">
   Spostamento più sfavorevole nel campione:
   {" "}{place(risk.worstRelocation.from)} →
   {" "}{place(risk.worstRelocation.to)},
   {" "}{fmt(risk.worstRelocation.scoreChange)} punti,
   ricompensa {signed(risk.worstRelocation.rewardChange)} E.
  </p>}
  <p className="resonance-econ-disclaimer">
   Il solver è euristico, non garantisce configurazioni ottime.
   Il campione è esplorativo, non una probabilità statistica.
   Questa versione non introduce alcun costo per i Polytroni né
   per le evoluzioni del Mutatron: la progressione economica
   completa verrà bilanciata successivamente.
  </p>
 </>;
}
