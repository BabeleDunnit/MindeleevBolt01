import type {
 DifficultyReport,DifficultyScenario
} from "@/polytron/resonanceDifficulty";
import type {KaleidoPoint} from "@/polytron/kaleidoscopeGenerator";
import "./ResonanceEconomicsPanel.css";

const fmt=(value:number)=>value.toFixed(1);
const signed=(value:number)=>value>0?"+"+value:String(value);
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
  <h3 className="resonance-econ-title">Cinque strategie · budget {report.budget} E</h3>
  <p className="resonance-econ-copy">
   Queste sono <strong>configurazioni complete simulate da zero</strong>:
   puoi confrontare strategie ottimizzate, copiate, improvvisate e
   volutamente sfavorevoli. Per ciascuna il saldo è il
   <strong> ricavo della commissione − costo di ogni Evolve</strong>.
   Sono riportati anche gli acquisti iniziali: ogni Polytrone in plancia
   costa nuovamente a ogni evoluzione, mentre a Home non costa.
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
      <span><small>Acquisti iniziali</small><b>−{s.spent} E</b></span>
      <span><small>Costo ogni Evolve</small><b>−{s.upkeep} E</b></span>
      <span><small>Ricavo</small><b>+{s.reward} E</b></span>
      <span><small>Saldo per ciclo</small>
       <b className={s.cycleNet>=0?"resonance-positive":"resonance-negative"}>
        {signed(s.cycleNet)} E</b></span>
      <span><small>Primo ciclo, inclusi acquisti</small>
       <b className={s.net>=0?"resonance-positive":"resonance-negative"}>
        {signed(s.net)} E</b></span>
     </span>
     <span className="resonance-econ-description">{s.description}</span>
    </button>)}
  </div>
  <label className="resonance-econ-show">
   <input type="checkbox" checked={showPlan}
    onChange={e=>onToggle(e.target.checked)}/>
   Mostra sulla plancia lo scenario selezionato
  </label>
  {showPlan&&selected&&
   <p className="resonance-econ-overlay">
    <b>{selected.name}</b>: gli esagoni tratteggiati mostrano
    una soluzione simulata, non Polytroni già acquistati.
   </p>}
  <h3 className="resonance-econ-title">Frontiera: qualità vs energia</h3>
  <div className="resonance-econ-frontier">
   {report.bands.map(b=>
    <div key={b.budget} className="resonance-econ-frontier-item">
     <strong>Budget {b.budget} E · {fmt(b.score)}%</strong>
     <span>{b.pieces} Polytroni · Acquisto iniziale −{b.spent} E</span>
     <span>Ricavo +{b.reward} E · Evoluzione −{b.upkeep} E</span>
     <span><b className={b.cycleNet>=0?"resonance-positive":"resonance-negative"}>
       Ciclo {signed(b.cycleNet)} E</b> ·
      {" "}<b className={b.net>=0?"resonance-positive":"resonance-negative"}>
       Primo ciclo {signed(b.net)} E</b>
     </span>
    </div>)}
  </div>
  <h3 className="resonance-econ-title">Si può sbagliare?</h3>
  <div className="resonance-econ-risks">
   <div>
    <strong>{risk.uneconomicPurchases}/{risk.purchasesSampled}</strong>
    <span>acquisti in perdita nel campione: incremento della
     ricompensa inferiore a acquisto + costo della prossima evoluzione</span>
   </div>
   <div>
    <strong>{risk.negligiblePurchases}/{risk.purchasesSampled}</strong>
    <span>acquisti quasi inutili (incremento inferiore a 0,01 punti)</span>
   </div>
   <div>
    <strong>{risk.worseningPurchases}</strong>
    <span>acquisti che riducono la qualità globale: l'armonia
     geometrica può peggiorare, anche se la risonanza locale cresce</span>
   </div>
   <div>
    <strong>{risk.worseningRelocations}/{risk.relocationsSampled}</strong>
    <span>spostamenti che peggiorano il punteggio</span>
   </div>
  </div>
  {risk.worstPurchase&&
   <p className="resonance-econ-example">
    <strong>Esempio di acquisto dannoso al budget:</strong>
    {" "}manifestazione {risk.worstPurchase.pawn.number}
    {" "}in {place(risk.worstPurchase.pawn.key)}.
    Acquisto {risk.worstPurchase.cost} E,
    evoluzione aggiuntiva {risk.worstPurchase.cost} E,
    ricavo aggiuntivo {signed(risk.worstPurchase.rewardGain)} E,
    saldo dei prossimi cicli {signed(risk.worstPurchase.cycleNetGain)} E,
    <b className={risk.worstPurchase.netGain>=0?
     "resonance-positive":"resonance-negative"}>
     {" "}saldo {signed(risk.worstPurchase.netGain)} E</b>.
   </p>}
  {risk.worstRelocation&&
   <p className="resonance-econ-example">
    Spostamento più svantaggioso del campione:
    {" "}{place(risk.worstRelocation.from)} → {place(risk.worstRelocation.to)},
    {" "}{fmt(risk.worstRelocation.scoreChange)} punti,
    {" "}{signed(risk.worstRelocation.rewardChange)} E.
   </p>}
  <p className="resonance-econ-disclaimer">
   Confronti euristici, non ottimi globali garantiti. I singoli punteggi
   e saldi sono esatti secondo l'evaluator e la ricompensa sperimentale.
   Il campione di acquisti e spostamenti è deterministico ed esplorativo,
   non una probabilità statistica di errore. Il costo di ogni Evolve
   è incluso; non sono inclusi rivendite o profitti di commissioni future.
  </p>
 </>;
}
