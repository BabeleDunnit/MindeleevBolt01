import {dnaFromPolitronNumber} from "@/polytron/politronicNumber";
import {GROUP_CODES,groupOf,periodOf,type CellPrediction,
 type LifeEnergyLedger} from "@/polytron/mindeleevLife";
import "./LifeEnergyPanel.css";

type Props={
 cell:CellPrediction;ledger:LifeEnergyLedger;
 bonus:number;compact?:boolean;treasury?:number;
};
const show=(value:number)=>value.toLocaleString("it-IT");
const stateNames={
 empty:"Cella vuota",survive:"Sopravvivenza",depart:"Ritorno a casa",
 birth:"Sintesi possibile","no-majority":"Nessuna maggioranza",
 "no-energy":"Energia insufficiente"
};
function Value({label,value,tone}:{label:string;value:string|number;tone?:string}){
 return <div className={"le-value "+(tone??"")}>
  <span>{label}</span><strong>{value}</strong>
 </div>;
}
export default function LifeEnergyPanel({cell,ledger,bonus,compact=false,treasury}:Props){
 const occupant=cell.occupant;
 const isCandidate=cell.candidate!==undefined;
 const canBirth=cell.outcome==="birth";
 const related=ledger.supportedBirths;
 const localRefund=ledger.returnedToTreasury;
 const neighbours=ledger.neighbourContributions;
 return <section className={"le-account"+(compact?" le-compact":"")}
  aria-label={"Bilancio energetico locale della cella "+cell.key}>
  <div className="le-heading">
   <div>
    <span className="le-kicker">{compact?"BILANCIO LOCALE":"ENERGIA / BILANCIO LOCALE"}</span>
    <h3>{occupant!==undefined?<>Polytrone #{occupant}
      <small>{dnaFromPolitronNumber(occupant)} · {GROUP_CODES[groupOf(occupant)-1]} / P{periodOf(occupant)}</small></>:
      <>Cella ({cell.q}, {cell.r}) <small>Anello {cell.ring}</small></>}</h3>
   </div>
   <span className={"le-state le-state-"+cell.outcome}>{stateNames[cell.outcome]}</span>
  </div>
  <div className="le-values">
   <Value label={compact?"E adesso":"Energia attuale"} value={ledger.currentEnergy}/>
   <Value label={compact?"E dopo turno":"Energia prossimo turno"}
    value={ledger.projectedEnergy} tone={canBirth?"le-available":""}/>
   <Value label="Energia ceduta" value={ledger.actualEnergyCeded}/>
   <Value label={compact?"Al budget":"Restituita al budget"}
    value={"+"+show(localRefund)} tone={localRefund?"le-available":""}/>
  </div>
  {isCandidate&&<div className="le-synthesis">
   <div className="le-synthesis-title">
    <strong>Candidato #{cell.candidate} <span>{dnaFromPolitronNumber(cell.candidate!)}</span></strong>
    <span>E propria = {ledger.candidateEnergy}</span>
   </div>
   <div className="le-synthesis-numbers">
    <Value label="Energia dai 3 vicini" value={ledger.neighbourTotal} tone="le-available"/>
    <Value label="Soglia richiesta · 2 × E" value={ledger.requiredEnergy}/>
    <Value label={ledger.deficit?"Energia mancante":"Margine disponibile"}
     value={ledger.deficit?"−"+ledger.deficit:"+"+ledger.surplus}
     tone={ledger.deficit?"le-insufficient":"le-available"}/>
   </div>
   <div className="le-energy-meter" role="meter"
    aria-label="Energia locale rispetto alla soglia di sintesi"
    aria-valuemin={0} aria-valuemax={ledger.requiredEnergy}
    aria-valuenow={Math.min(ledger.neighbourTotal,ledger.requiredEnergy)}>
    <span style={{width:(ledger.requiredEnergy?
     Math.min(100,ledger.neighbourTotal/ledger.requiredEnergy*100):0)+"%"}}/>
   </div>
  </div>}
  {neighbours.length>0&&<div className="le-neighbours">
   <div className="le-list-head"><strong>Energia dei vicini</strong>
    <span>Totale {ledger.neighbourTotal}</span></div>
   <div className="le-neighbour-list">
    {neighbours.map(n=><div key={n.key} className="le-neighbour">
     <span>#{n.number} <small>{GROUP_CODES[n.group-1]} · P{n.period}</small></span>
     <strong>+{n.energy} E</strong>
    </div>)}
   </div>
  </div>}
  {occupant!==undefined&&related.length>0&&<div className="le-support">
   <strong>Può contribuire a {related.length} {related.length===1?"sintesi":"sintesi"}</strong>
   <div>{related.map(b=><span key={b.key}>
    Cella {b.key} → #{b.number}: <b>{b.potential} E conteggiate</b>
   </span>)}</div>
   <small>Il contributo viene conteggiato nella soglia, ma non sottratto al Polytrone.</small>
  </div>}
  {occupant!==undefined&&<div className="le-manual-refund">
    <span>Se usi «Recupera» adesso</span>
    <strong>+{ledger.manualRecovery} E al budget</strong>
   </div>}
  {compact?
   <p className="le-caption">
    {isCandidate?
     (canBirth?"Soglia raggiunta.":"Soglia non raggiunta.")+" I vicini non spendono E.":
     cell.outcome==="depart"?"Ritorna a casa e accredita energia al giocatore.":
     cell.outcome==="survive"?"Energia invariata: la sopravvivenza dipende dai vicini.":
     "Nessuna sintesi e nessun trasferimento."}
   </p>:
   <>
    <div className="le-formula">
     <span>Energia intrinseca</span>
     <strong>{(occupant??cell.candidate)!==undefined?
      <>E(#{occupant??cell.candidate}) = 2 + {periodOf((occupant??cell.candidate)!)-1}
       {" + "}{groupOf((occupant??cell.candidate)!)-1} + {bonus}
       {" = "}{occupant!==undefined?ledger.currentEnergy:ledger.candidateEnergy}</>:
      <>E = 2 + (P − 1) + (G − 1) + {bonus}</>}</strong>
     <small>Bonus Chromatica = {bonus}; il Polytrone non possiede una carica consumabile in questa versione.</small>
    </div>
    <p className="le-clarification"><b>Come funziona davvero:</b> i vicini offrono una
     <em> verifica di soglia</em>, non cedono energia. Durante la sintesi,
     <strong> 0 unità</strong> vengono sottratte a loro o al budget:
     i vicini non cedono energia.
     Il Polytrone nato riceve la propria energia intrinseca.
     I Polytroni che tornano a casa restituiscono invece ⌊E/2⌋ al budget.
     {treasury!==undefined&&<> Budget attuale: <strong>{show(treasury)}</strong>.</>}</p>
   </>}
 </section>;
}
