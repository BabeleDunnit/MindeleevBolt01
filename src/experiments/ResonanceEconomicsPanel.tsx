import type {DifficultyReport,DifficultyScenario} from "@/polytron/resonanceDifficulty";
import type {KaleidoLayout,KaleidoPoint} from "@/polytron/kaleidoscopeGenerator";
import {
 commissionEnergyChange,signedEnergy,type ResonanceEconomyMode
} from "@/polytron/resonanceEconomyModels";
import "./ResonanceEconomicsPanel.css";

const fmt=(n:number)=>n.toFixed(1);
const signed=(n:number)=>n>0?"+"+n:String(n);
type Props={
 report:DifficultyReport;selectedId:string;showPlan:boolean;
 layout:KaleidoLayout;mode:ResonanceEconomyMode;baselineQuality:number;
 onSelect:(id:DifficultyScenario["id"])=>void;
 onToggle:(show:boolean)=>void;
 cells:Map<string,KaleidoPoint>;
 section:"strategies"|"frontier"|"risks"
};
export default function ResonanceEconomicsPanel({
 report,selectedId,showPlan,onSelect,onToggle,cells,section,
 layout,mode,baselineQuality
}:Props){
 const risk=report.placementRisk;
 const amount=(quality:number)=>commissionEnergyChange(
  layout,mode,quality,baselineQuality);
 const modeLabel=mode==="current"?"Attuale":mode==="threshold"?
  "Soglia 50%":"Miglioramento";
 const selected=report.scenarios.find(s=>s.id===selectedId)??report.scenarios[0];
 const place=(key:string)=>{
  const cell=cells.get(key);
  return cell?"("+cell.ring+","+cell.idx+")":key;
 };
 return <>
  {section==="strategies"&&<>
  <h3 className="resonance-econ-title">
   Cinque strategie · capacità {report.budget} E</h3>
  <p className="resonance-econ-copy">
   Confronto fra cinque configurazioni simulate a parità di energia
   totale disponibile. L'energia intrinseca dei Polytroni è
   <b> impegnata, non spesa</b>: torna libera a Home e non si consuma
   con Evolve. Gli esiti mostrati seguono il modello <b>{modeLabel}</b>
   selezionato, ma il solver propone ancora le stesse strategie euristiche
   basate sulla qualità, senza ottimizzarle nuovamente per ogni economia.
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
      <span><small>Esito · {modeLabel}</small>
       <b className={amount(s.quality)<0?
        "resonance-negative":amount(s.quality)>0?"resonance-positive":""}>
        {signedEnergy(amount(s.quality))}</b></span>
      <span><small>Resa teorica</small><b>
       {s.energy?(amount(s.quality)/s.energy).toFixed(2)+" E/E":"—"}
       </b></span>
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
  </>}
  {section==="frontier"&&<>
  <h3 className="resonance-econ-title">Frontiera: qualità vs energia impegnata</h3>
  <div className="resonance-econ-frontier">
   {report.bands.map(b=>
    <div key={b.budget} className="resonance-econ-frontier-item">
     <strong>Capacità {b.budget} E · Qualità {fmt(b.score)}%</strong>
     <span>{b.pieces} Polytroni · Energia impegnata {b.energy} E</span>
     <span>Esito {modeLabel}: {signedEnergy(amount(b.score))} · Resa
      {" "}{b.energy?(amount(b.score)/b.energy).toFixed(2)+" E/E":"—"}</span>
    </div>)}
  </div>
  </>}
  {section==="risks"&&<>
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
   Δ premio base {signed(risk.worstPlacement.rewardGain)} E,
   resa {risk.worstPlacement.yield.toFixed(2)} E/E.
  </p>}
  {risk.worstRelocation&&<p className="resonance-econ-example">
   Spostamento più sfavorevole nel campione:
   {" "}{place(risk.worstRelocation.from)} →
   {" "}{place(risk.worstRelocation.to)},
   {" "}{fmt(risk.worstRelocation.scoreChange)} punti,
   Δ premio base {signed(risk.worstRelocation.rewardChange)} E.
  </p>}
  <p className="resonance-econ-disclaimer">
   Il solver è euristico, non garantisce configurazioni ottime.
   Il campione è esplorativo, non una probabilità statistica.
   Le variazioni marginali di premio sopra sono misurate nella scala
   storica e non rappresentano necessariamente il saldo del modello attivo.
   Nessun costo per i Polytroni o per l'evoluzione del Mutatron.
  </p>
  </>}
 </>;
}
