# Mindeleev — Stato del progetto

**Documento canonico di continuità fra chat e sessioni di lavoro.**

- **Ultima revisione:** 27 novembre 2026.
- **Posizione canonica:** `main/research/MINDELEEV_PROJECT_STATE.md`.
- **Codice sperimentale corrente:** [`experiment/kaleidoscope-radius`](https://github.com/BabeleDunnit/MindeleevBolt01/tree/experiment/kaleidoscope-radius), **non** `main`.
- **Funzione:** indice aggiornato di decisioni, implementazioni, verifiche e domande aperte. Non sostituisce le sessioni storiche, i test, il codice, né il [protocollo del Design Team](https://github.com/BabeleDunnit/MindeleevBolt01/blob/experiment/kaleidoscope-radius/research/DESIGN_TEAM_PROTOCOLLO.md).

## 0. Come riprendere il lavoro in una nuova chat

Alla richiesta **«Riprendi Mindeleev dallo stato del progetto su GitHub»**:

1. Leggere **questo documento su `main`** e controllare la data dell'ultima revisione.
2. Leggere il [protocollo Design Team](https://github.com/BabeleDunnit/MindeleevBolt01/blob/experiment/kaleidoscope-radius/research/DESIGN_TEAM_PROTOCOLLO.md), poi solo i documenti storici pertinenti al problema.
3. Identificare il **prototipo** e il **branch** interessati; verificare commit, codice e test attuali prima di proporre modifiche. `main` può essere meno aggiornato dei rami sperimentali.
4. Distinguere **decisione esplicita dell'autore**, **meccanica presente nel codice**, **risultato verificato**, **ipotesi aperta**. Una proposta non è una feature realizzata; una CI verde non è un playtest.
5. Concludere ogni sessione significativa aggiornando questa pagina con data, link ai commit, decisioni nuove, dubbi e test realmente svolti. Collegare la ricerca preesistente **senza duplicarla**.

**Precedenza:** il codice sul ramo corretto dice *cosa fa il software*; le ultime decisioni esplicite dell'autore dicono *cosa dovrebbe fare*. In caso di conflitto segnalare la discrepanza, non scambiare l'una per l'altra.

## 1. Identità e vincoli trasversali del progetto

Mindeleev esplora Polytroni (numeri polytronici, cinque gruppi platonici, periodi, palette/Chromatica, Shape-DNA e fenotipi) nel Mutatron, con topologie esagonali, trasformazioni, risonanza, fisica e sistemi audiovisivi. Coesistono **esperimenti diversi**, con regole volutamente differenti.

Orientamenti progettuali acquisiti nelle sessioni di ricerca:

- Il sistema deve offrire **causalità comprensibile**, scoperta, bellezza e possibilità di contemplare; evitare test di riflessi e missioni arbitrarie di raccolta.
- La simmetria è una risorsa estetica e sistemica, non una regola che obbliga ogni composizione a essere perfettamente simmetrica.
- ENERGY è il riferimento economico: non introdurre cicli che creano ricchezza illimitata senza fonte o vincolo dimostrabile.
- Distinguere **identità permanente**, **manifestazione/numero polytronico**, **posizione** e **viaggiatori anonimi**. Alcuni modelli storici assumono 72 individui nominati; non trasferire automaticamente ogni vincolo a ogni laboratorio.
- **Kaleidoscope/Resonance Playground, RC01 e MindeleevSpatial Unity sono linee differenti.** Non applicare modifiche all'una senza un mandato esplicito.

## 2. Mappa dei prototipi e dei riferimenti

| Sistema | Dove si trova | Stato alla revisione |
| --- | --- | --- |
| **Kaleidoscope Lab / Resonance Playground** | [`experiment/kaleidoscope-radius`](https://github.com/BabeleDunnit/MindeleevBolt01/tree/experiment/kaleidoscope-radius) | **Prototipo attivo** delle ultime discussioni: Difficulty Analyzer, bilancio ENERGY, Dance, editor manifestazione |
| **Mindeleev RC01** | [`release-candidate/rc01-mobile-board`](https://github.com/BabeleDunnit/MindeleevBolt01/tree/release-candidate/rc01-mobile-board) | Linea distinta di boardplay, controlli touch e fisica; non confondere con il prototipo di risonanza |
| **MindeleevSpatial (Unity)** | [Repository Unity](https://github.com/BabeleDunnit/MindeleevSpatial) | Fonte storica per il concetto originale di Dance e le sperimentazioni fisiche |
| **Altri esperimenti** | Rami `experiments/*` e [ricerca storica](https://github.com/BabeleDunnit/MindeleevBolt01/tree/experiment/kaleidoscope-radius/research) | Studi e prototipi autonomi; non assumerli come versione corrente |

**Apri il prototipo attivo:** [Kaleidoscope — Resonance Playground](https://babeledunnit.github.io/MindeleevBolt01/?experiment=kaleidoscope-lab&mode=resonance&radius=2&family=metatron&symmetry=D6&seed=0).

**Baseline codice controllata:** [`eff6b5454f520683900926fc13d18ded5374b32a`](https://github.com/BabeleDunnit/MindeleevBolt01/commit/eff6b5454f520683900926fc13d18ded5374b32a); [GitHub Actions 45646895632](https://github.com/BabeleDunnit/MindeleevBolt01/actions/runs/45646895632) completata con successo il **25 novembre 2026** (TypeScript, test di regressione, build e deploy). **Non** è una verifica sperimentale dell'equilibrio energetico di lungo periodo.

## 3. Decisioni per il prototipo **Resonance Playground**

| Tema | Decisione dell'autore | Stato nel prototipo |
| --- | --- | --- |
| Affinità di gruppo | Usare **solo il gruppo effettivo del tile**, mai il gruppo duale | **Implementata** nel campo di risonanza |
| Polytroni Home ↔ Mutatron | **Nessun costo di acquisto**, nessun rimborso; i trasferimenti conservano l'energia intrinseca | **Implementata** |
| Evoluzione del Mutatron | **Nessun costo di evoluzione per ora**; eventuale costo legato al raggio è futuro e non deciso | **Implementata** come evolve gratuito |
| Polytron Dance | Dopo Evolve, cercare disposizione più simmetrica con ricompensa **invariata o lievemente inferiore**, senza fisica/animazione per ora | **Euristica corretta** per evitare stasi frequente, con fallback dichiarato; risultato energetico e playtest da misurare |
| Editor in plancia | Consentire modifica di **gruppo, periodo e numero polytronico** e aggiornare valutazione/capacità energetica | **Implementato** come editor sotto la plancia quando si seleziona un Polytrone; accessibilità visiva corretta, test manuale ancora richiesto |
| Screensaver energeticamente stabile | Bilancio medio per ciclo circa **zero**, non crescita indefinita | **Obiettivo aperto**, non dimostrato |
| Decadimento / memoria configurazionale | Considerarli solo dopo aver verificato se la Dance basta | **Ipotesi aperte**, non implementate |

**Situazione energetica esatta:** nella versione attuale `treasury` rappresenta la capacità ENERGY disponibile, `occupiedEnergy` l'energia intrinseca **impegnata** dai Polytroni sulla plancia. Entrata, uscita e spostamento non consumano ENERGY. La modifica diretta della manifestazione con l'editor cambia l'energia intrinseca e ricalcola l'impegno: è un'operazione **di test**, non una meccanica canonica di mutazione gratuita. La **presentazione di una commissione** può ancora aggiungere ENERGY alla `treasury`; il semplice `Evolve` non accredita. Questa asimmetria è parte del problema di accumulo da studiare.

**Dance attuale:** dopo l'evoluzione della richiesta, `polytronDance` esplora un campione deterministico di permutazioni/orbite e riutilizza le funzioni di risonanza condivise col Difficulty Analyzer. Conserva Seal/nome, numero, palette e somma delle energie dei Polytroni. **Cerca anzitutto** una variazione della **ricompensa teorica** tra `0` e `-1 E`, senza abbassare la simmetria misurata; esplora esaustivamente le collocazioni per uno/due Polytroni sulle plance piccole e usa ricerca campionata per plance più dense. Se il vincolo è impossibile da soddisfare, una modalità di ripiego privilegia comunque un movimento visibile, dichiarando esplicitamente che la previsione energetica è fuori obiettivo. Nessun movimento accredita ENERGY. **Non ne deriva** una dimostrazione di rendimento netto nullo dell'intero ciclo.

**Difficulty Analyzer:** euristico (ricerca greedy limitata), non ottimo matematico certificato. La portata di risonanza influisce sia sul valutatore sia sull'analisi. Distinguere la sua previsione dal bilancio energetico realmente accreditato.

**Codice e test da aprire prima di intervenire** (tutti nel ramo `experiment/kaleidoscope-radius`):

- [`src/experiments/KaleidoscopeLab.tsx`](https://github.com/BabeleDunnit/MindeleevBolt01/blob/experiment/kaleidoscope-radius/src/experiments/KaleidoscopeLab.tsx): richieste, configurazione, `Evolve`.
- [`src/experiments/ResonancePlayground.tsx`](https://github.com/BabeleDunnit/MindeleevBolt01/blob/experiment/kaleidoscope-radius/src/experiments/ResonancePlayground.tsx): plancia, editor, economia, trigger Dance.
- [`src/polytron/resonanceField.ts`](https://github.com/BabeleDunnit/MindeleevBolt01/blob/experiment/kaleidoscope-radius/src/polytron/resonanceField.ts): compatibilità, qualità, simmetria, ricompensa.
- [`src/polytron/resonanceDifficulty.ts`](https://github.com/BabeleDunnit/MindeleevBolt01/blob/experiment/kaleidoscope-radius/src/polytron/resonanceDifficulty.ts): solutore euristico e scenari di difficoltà.
- [`src/polytron/polytronDance.ts`](https://github.com/BabeleDunnit/MindeleevBolt01/blob/experiment/kaleidoscope-radius/src/polytron/polytronDance.ts): ricerca delle disposizione simmetriche.
- [`scripts/check-resonance-playground.mjs`](https://github.com/BabeleDunnit/MindeleevBolt01/blob/experiment/kaleidoscope-radius/scripts/check-resonance-playground.mjs): invarianti e regressioni.

## 4. Domande aperte / prossimo esperimento

**Priorità:** accertare se `Evolve + Dance` consente un funzionamento autonomo, gradevole e con bilancio ENERGY medio vicino a zero **senza introdurre subito decadimento o memoria**.

**Protocollo proposto, non ancora eseguito:**

1. Usare configurazioni iniziali replicabili con 2, 3, 6 e più Polytroni, più seed, raggi e portate.
2. Confrontare `Evolve` da solo, `Evolve + Dance` casuale e `Evolve + Dance` guidata da simmetria e resa.
3. Loggare per ciclo: `treasury`, energia impegnata, libera, ricompensa effettivamente accreditata, variazione della ricompensa teorica dopo Dance, simmetria, qualità, quantità di spostamenti, visite a stati già visti.
4. Distinguere cicli **con commissione presentata** da cicli **Evolve gratuito**.
5. Misurare deriva media/varianza e ripetitività visiva su sequenze lunghe; **solo dopo** confrontare memoria, decadimento e revisione del sistema di premi.

**Rischio progettuale:** massimizzare la simmetria o ridurre la ricompensa teorica **non** garantisce che l'economia del gioco rimanga in equilibrio. Evitare di confondere qualità estetica, punteggio di risonanza, ricompensa e profitto cumulativo.

### Aggiornamento interfaccia — 27 novembre 2026

**Implementato** nel ramo [`experiment/kaleidoscope-radius`](https://github.com/BabeleDunnit/MindeleevBolt01/tree/experiment/kaleidoscope-radius), commit [`33bf47b7759f954d910d3551b7f3da7f29fb0d73`](https://github.com/BabeleDunnit/MindeleevBolt01/commit/33bf47b7759f954d910d3551b7f3da7f29fb0d73): il Difficulty Analyzer è stato spostato dalla stretta colonna laterale a una sezione a larghezza piena; scenari, frontiera e rischi sono disposti orizzontalmente sui display larghi. I comandi per confermare/annullare piazzamenti, spostamenti e richiami sono sotto il Mutatron, accanto all'editor di Polytroni; l'anteprima viene fissata con un clic sul target prima della conferma. Lo header espone saldo attuale, energia impegnata, premio teorico e proiezioni dopo la mossa; **il premio previsto non è energia già incassata**. [GitHub Actions 45982915422](https://github.com/BabeleDunnit/MindeleevBolt01/actions/runs/45982915422) passata, incluso il deploy. Nessuna regola economica cambiata; verifica visiva manuale ancora utile.

**Correzione del layout Analyzer (27 novembre 2026):** l'autore ha segnalato che il pannello a larghezza piena scorreva sotto il Mutatron sticky. Sul ramo `experiment/kaleidoscope-radius`, commit [`5a0357090a18ae3cd08a45966ab04e6826884027`](https://github.com/BabeleDunnit/MindeleevBolt01/commit/5a0357090a18ae3cd08a45966ab04e6826884027), l'Analyzer è stato **riportato dentro la sidebar originale** e diviso in quattro schede autonome: **Sintesi**, **Strategie**, **Frontiera energetica**, **Rischi e mosse sfavorevoli**. Evitare di trasformarlo nuovamente in un elemento full-width di `kaleido-layout`. Le altre funzionalità della plancia (editor e conferma sotto Mutatron, forecast header) restano immutate; contabilità e regole punitive **non modificate**. Test di regressione dedicati al posizionamento nella sidebar; per il risultato CI vedere [workflow di deploy](https://github.com/BabeleDunnit/MindeleevBolt01/actions/runs/45986342882). Verifica visuale nel browser consigliata.

**Affinamento header e reflow (27 novembre 2026):** nel ramo [`experiment/kaleidoscope-radius`](https://github.com/BabeleDunnit/MindeleevBolt01/tree/experiment/kaleidoscope-radius), commit [`2c5dfcf29c5ccedcbca871372dcb10f64a921063`](https://github.com/BabeleDunnit/MindeleevBolt01/commit/2c5dfcf29c5ccedcbca871372dcb10f64a921063), eliminato il pannello «Regole di risonanza»: la **portata di risonanza** è controllata nello header del Mutatron. Quattro indicatori ENERGY di pari rango: saldo, **impegnata**, **libera**, ricompensa prevista; impegnata e libera hanno entrambe forecast prima/dopo. La sidebar abbandona la Grid con coordinate/righe forzate e usa CSS multicolonna con **reflow verticale**, prevenendo i vuoti fra pannelli di altezze diverse. Conferma/spostamento/editor restano sotto la plancia; le quattro sezioni Difficulty Analyzer restano nella sidebar. [CI e Pages](https://github.com/BabeleDunnit/MindeleevBolt01/actions/runs/45989493627) completati con successo. **Nessuna variazione al punteggio, alla Dance o alla contabilità; verifica visiva sul proprio display ancora raccomandata.**

**Affinamento header/azioni (27 novembre 2026):** nel ramo [`experiment/kaleidoscope-radius`](https://github.com/BabeleDunnit/MindeleevBolt01/tree/experiment/kaleidoscope-radius), commit [`bad3580b777ccaf5f51768a03282ad245cc92f47`](https://github.com/BabeleDunnit/MindeleevBolt01/commit/bad3580b777ccaf5f51768a03282ad245cc92f47): lo header del Mutatron usa una colonna a larghezza effettiva piena, con quattro card ENERGY adattive per evitare la grande area vuota sulla destra segnalata nello screenshot. **Solo la conferma/annullamento dello spostamento** è stata riportata nella scheda laterale «Spostamento di un Polytrone» (con conferma disabilitata fino a destinazione fissata); **piazzamento/richiamo** restano confermabili sotto la plancia e la modifica della manifestazione resta nell'editor sotto plancia. Nessuna variazione al calcolo di risonanza, Dance o ENERGY. [GitHub Actions](https://github.com/BabeleDunnit/MindeleevBolt01/actions/runs/45991142330) per i test e il deploy; verifica visuale su viewport reali ancora richiesta.

### Biblioteca di calibrazione delle richieste — implementata il 27 novembre 2026

**Decisione dell'autore:** aggiungere al *solo Resonance Playground* preset fissi per studiare la percezione della richiesta, la densità degli indizi e, in futuro, le regole domanda-risposta; **non modificare il generatore artistico attuale** né ribilanciare ora Difficulty Analyzer, punteggi, Polytron Dance o economia.

**Codice:** [`src/polytron/resonanceCalibration.ts`](https://github.com/BabeleDunnit/MindeleevBolt01/blob/experiment/kaleidoscope-radius/src/polytron/resonanceCalibration.ts) contiene sei ricette e un lettore diagnostico puro. Il Playground offre **due pannelli compatti** nella sidebar: «Laboratorio preset» per scegliere/caricare, «Densità della richiesta attuale» per leggere i conteggi. [`KaleidoscopeLab.tsx`](https://github.com/BabeleDunnit/MindeleevBolt01/blob/experiment/kaleidoscope-radius/src/experiments/KaleidoscopeLab.tsx) applica una ricetta tramite **`generateKaleidoscope` invariato**, resettando la sessione del giocatore anche quando ricarica lo stesso preset; Evolve continua a usare la normale evoluzione ereditata. Versione testata [`515620b18c418a872f0f8e15ae5684827ff2b969`](https://github.com/BabeleDunnit/MindeleevBolt01/commit/515620b18c418a872f0f8e15ae5684827ff2b969).

| Preset | Raggio/famiglia/simmetria/seed | Indizi/celle giocabili alla generazione 0 |
| --- | --- | --- |
| A · Compatto meno denso | 2 / Metatron / D6 / 7 | 12 / 18 |
| B · Compatto pieno | 2 / Metatron / D6 / 0 | 18 / 18 |
| C · Intermedio aperto | 3 / Cristalli / D6 / 5 | 18 / 36 |
| D · Intermedio pieno | 3 / Cristalli / D6 / 1 | 36 / 36 |
| E · Ampio aperto | 5 / Rosette / D6 / 55 | 36 / 90 |
| F · Ampio pieno | 5 / Rosette / D6 / 17 | 90 / 90 |

**Distinzioni diagnosticabili:** numero/percentuale di *tile-indizio*, celle prive di indizi, **celle effettivamente libere per il giocatore** (tolti solo i Polytroni presenti, non gli indizi), orbite con indizi su orbite possibili, palette, gruppi e distribuzione per anello. Un'indicazione su una cella **non la rende indisponibile**: due strati distinti, richiesta e risposta. Le configurazioni dense non introducono automaticamente interferenza negativa con il valutatore vigente. I preset non sono livelli «facili»/«difficili» già dimostrati, ma **strumenti di confronto**.

**Verifica:** [GitHub Actions del commit di riferimento](https://github.com/BabeleDunnit/MindeleevBolt01/actions/runs/46032800449); [test dedicati](https://github.com/BabeleDunnit/MindeleevBolt01/blob/experiment/kaleidoscope-radius/scripts/check-resonance-playground.mjs) confrontano i sei conteggi contro il generatore reale, il determinismo, il normale Evolve e la possibilità di collocare un Polytrone sopra un indizio. Il generatore `src/polytron/kaleidoscopeGenerator.ts` e `src/polytron/resonanceField.ts` **non sono stati cambiati**. Da fare: playtest di leggibilità e risposte campione (concentrata, distribuita, simmetrica ma incompatibile) prima di variare i pesi.

### Valutazione umana delle risposte — 27 novembre 2026

**Decisione dell'autore:** rendere valutabili esempi *preconfigurati* di domande e risposte, assegnando due voti separati: **gradevolezza estetica** e **appropriatezza rispetto alla richiesta**. I voti restano nel browser senza DB (localStorage) e si possono esportare/importare in JSON; i giudizi devono essere raccolti **prima** di vedere lo scoring del motore. Solo dopo si potrà valutare un modello di scoring alternativo, anche una **piccola rete neurale**, senza assumere che 36 esempi siano sufficienti a generalizzare.

**Implementato** nel ramo [experiment/kaleidoscope-radius](https://github.com/BabeleDunnit/MindeleevBolt01/tree/experiment/kaleidoscope-radius):
- [src/polytron/resonanceCalibration.ts](https://github.com/BabeleDunnit/MindeleevBolt01/blob/experiment/kaleidoscope-radius/src/polytron/resonanceCalibration.ts) ora conserva A–F e aggiunge G, H, I per isolare **C6, C3 e C2** rispetto al caso **C (D6)**: stesso Cristalli/raggio 3/seed 5, rispettivamente **24/36**, **24/36**, **26/36** indizi (D6 C = 18/36). **NON** è stato cambiato il generatore artistico.
- [src/polytron/resonanceReviewCases.ts](https://github.com/BabeleDunnit/MindeleevBolt01/blob/experiment/kaleidoscope-radius/src/polytron/resonanceReviewCases.ts) produce **4 risposte standard per ciascuna delle 9 domande**: 1) tre Polytroni distribuiti a 120°; 2) uno spostato di anello; 3) tre Polytroni raggruppati; 4) stesse posizioni del primo caso, palette diversa. Identico numero di individui, numero polytronico e impegno energetico in ogni confronto; rappresentazioni vere flat-Z della domanda e solide della risposta.
- [src/experiments/ResonanceReviewLab.tsx](https://github.com/BabeleDunnit/MindeleevBolt01/blob/experiment/kaleidoscope-radius/src/experiments/ResonanceReviewLab.tsx) è una **terza vista** del Kaleidoscope Lab, «Valutazione umana»: due plance affiancate, richiesta già compiuta e risposta con Polytroni preposizionati; voto 0–10 per gradevolezza, voto 0–10 o «non so giudicare» per appropriatezza, note libere. Metodo e qualità del motore sono nascosti sino al salvataggio.
- [src/polytron/resonanceReviewStorage.ts](https://github.com/BabeleDunnit/MindeleevBolt01/blob/experiment/kaleidoscope-radius/src/polytron/resonanceReviewStorage.ts) definisce un archivio JSON versionato, con validazione rigorosa degli ID **A-1 … I-4**; i voti sono locali per origin/browser e possono andare persi se si cancellano i dati del sito. Importa/esporta JSON per backup, senza server.
- [GitHub Actions del commit di integrazione](https://github.com/BabeleDunnit/MindeleevBolt01/actions/runs/46041518213): TypeScript, regressioni dei nove preset e 36 risposte, build e deploy. **Verificare il risultato del workflow** prima di dichiarare l'ultima versione pubblicata. Sono ancora necessari controlli visuali e un vero playtest.

**Importante per ricerca ML:** questi 36 confronti (9 domande × 4 risposte) sono un *campione pilota*, **non** sufficiente a concludere che una rete neurale sia un valutatore affidabile. Nessun training o ribilanciamento in questo intervento. Per un eventuale modello prevedere due output distinti e validazione su richieste/seed/simmetrie **mai viste in addestramento**, preferibilmente con confronto a un modello interpretabile e verifiche del PATTO. Le domande sono sempre tile-indizio e i Polytroni appartengono solo alla risposta.

**Design review delle regole punitive — NON approvata, NON implementata.** La funzione `resonanceReward` tronca attualmente il premio a valori `>=0`; una presentazione non può perdere ENERGY. Il Difficulty Analyzer non può trovare payoff negativi con questo modello. Tre direzioni da confrontare: **(A)** ricompense con segno e soglia calibrata alla difficoltà; **(B)** penalità per interferenza/frustrazione delle relazioni locali; **(C)** memoria/potenziale energetico limitato che impedisca il farming degli stessi stati. Un semplice premio con segno (A) o una penalità locale (B) **non garantiscono** da soli che due movimenti dopo Dance non riportino al profitto. La prossima decisione richiede un confronto del Design Team e simulazioni di cicli, conservando l'attuale assenza di costi di acquisto ed evoluzione fino a nuova decisione esplicita.

## 5. Archivio storico esistente — link, non duplicazioni

- [**Protocollo del Design Team**](https://github.com/BabeleDunnit/MindeleevBolt01/blob/experiment/kaleidoscope-radius/research/DESIGN_TEAM_PROTOCOLLO.md): metodologia, ruoli e obbligo di esplicitare dissensi. Il Team è composto da **prospettive critiche simulate da ChatGPT**, non da consulenti umani/agenti indipendenti. Nominare per esteso: Architetto del Puzzle, Progettista di Sistemi Emergenti, Genetista, Psicologo del Giocatore, Fisico-Matematico, Ludologo, Compositore di Sistemi Musicali.
- [**Sessione 16 — Caleidoscopio**](https://github.com/BabeleDunnit/MindeleevBolt01/blob/experiment/kaleidoscope-radius/research/SESSIONE_16_DESIGN_TEAM_CALEIDOSCOPIO.md): causalità, Shape-DNA, estetica e obiettivi ludici.
- [**Sessione 22 — Isole, affinità, Polytron Dance**](https://github.com/BabeleDunnit/MindeleevBolt01/blob/experiment/kaleidoscope-radius/research/SESSIONE_22_ISOLE_AFFINITA_POLYTRON_DANCE.md): audit della Dance Unity originale. **Non** coincide con l'attuale algoritmo del Playground.
- [**Sessione 12 — Algebra energetica**](https://github.com/BabeleDunnit/MindeleevBolt01/blob/experiment/kaleidoscope-radius/research/SESSIONE_12_ALGEBRA_ENERGETICA_FORMALE.md): invarianti e modelli possibili; non tutti sono regole adottate.
- [**Cartella research**](https://github.com/BabeleDunnit/MindeleevBolt01/tree/experiment/kaleidoscope-radius/research): sessioni numerate e report degli sprint.

La presenza di un'ipotesi in una sessione storica **non** implica che sia approvata o attiva nell'ultima versione.

## 6. Manutenzione e registro

**Questo è l'unico stato canonico**, conservato su `main`; README e altri rami possono **linkarlo**, ma non crearne copie concorrenti.

A fine sessione significativa aggiornare il documento (tramite PR, rispettando le protezioni di `main`) con: data, branch e commit effettivo, cambiamenti realizzati, test e simulazioni eseguiti, decisioni dell'autore, limiti aperti e prossimo esperimento. Non trasformarlo in una trascrizione completa: per la storia usare gli altri documenti.

### Changelog

- **2026-11-27 (valutazione umana e simmetrie)** — Aggiunta vista con 36 esempi domanda-risposta, giudizi separati estetica/appropriatezza salvati solo in localStorage e JSON, e 3 nuovi preset C6/C3/C2; rete neurale solo come ipotesi da testare con dati raccolti, generatore e scorer invariati.



- **2026-11-27 (preset di calibrazione)** — Introdotti sei casi A–F e diagnostica della densità degli indizi/effettiva disponibilità delle celle, senza modificare generazione, Analyzer o ENERGY. Restano da testare risposte campione e leggibilità.



- **2026-11-27 (header e comandi di spostamento)** — Header energetico esteso a tutta larghezza con card responsive; spostamento confermato/annullato nel pannello omonimo, placement/recall ancora sotto la plancia. Solo UI.


- **2026-11-27 (reflow pannelli e header)** — Portata di risonanza nello header; ENERGY libera e impegnata equiparate; CSS multicolonna al posto di righe esplicite per eliminare i vuoti laterali. Solo UI, test e deploy verificati.


- **2026-11-27 (ripristino Analyzer)** — Annullato il posizionamento full-width: quattro schede compatte dentro la sidebar, evitando lo scroll sotto il Mutatron; test sul layout aggiunti. Nessuna modifica alle regole energetiche.

- **2026-11-27 (revisione UI e bilancio)** — Layout orizzontale, comandi sotto plancia, forecast energetico nello header; review di tre possibili modelli punitivi registrata come aperta, senza modifiche alla contabilità.


- **2026-11-27 (correzione)** — Segnalazione dell'autore: Dance spesso senza spostamenti, editor difficile da individuare. Corretta ricerca della Dance (per 1–2 Polytroni ricerca esaustiva su raggio piccolo, simmetria visiva, fallback dichiarato) e spostato l'editor immediatamente sotto la plancia. Ampliate le regressioni per verificare spostamenti reali e visibilità dei controlli. Ramo `experiment/kaleidoscope-radius`; verificare lo stato della CI e il deployment prima di dichiarare la modifica pubblicata.


- **2026-11-27** — Creazione del registro centrale e dei puntatori alla ricerca; fotografia del Resonance Playground con Dance/editor, affinità per solo gruppo del tile e problema aperto di bilancio ENERGY. **Nessuna nuova regola di gameplay in questo intervento documentale.**
