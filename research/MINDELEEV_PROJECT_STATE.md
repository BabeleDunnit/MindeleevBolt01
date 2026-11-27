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

- **2026-11-27 (revisione UI e bilancio)** — Layout orizzontale, comandi sotto plancia, forecast energetico nello header; review di tre possibili modelli punitivi registrata come aperta, senza modifiche alla contabilità.


- **2026-11-27 (correzione)** — Segnalazione dell'autore: Dance spesso senza spostamenti, editor difficile da individuare. Corretta ricerca della Dance (per 1–2 Polytroni ricerca esaustiva su raggio piccolo, simmetria visiva, fallback dichiarato) e spostato l'editor immediatamente sotto la plancia. Ampliate le regressioni per verificare spostamenti reali e visibilità dei controlli. Ramo `experiment/kaleidoscope-radius`; verificare lo stato della CI e il deployment prima di dichiarare la modifica pubblicata.


- **2026-11-27** — Creazione del registro centrale e dei puntatori alla ricerca; fotografia del Resonance Playground con Dance/editor, affinità per solo gruppo del tile e problema aperto di bilancio ENERGY. **Nessuna nuova regola di gameplay in questo intervento documentale.**
