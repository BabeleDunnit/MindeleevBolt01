# Mindeleev — Sprint 09: boardgame leggibile e ipotesi Tower Defense
**Data:** 26 ottobre 2026  
**Branch:** experiments/sprint09-readable-forces-and-boardplay  
**Stato:** prototipo + proposta adversarial, NON prova di divertimento o puzzle verificato da solver.  
**Cinque ruoli:** Architetto del Puzzle (PA), Progettista di Sistemi Emergenti (SE), Genetista (GC), Psicologo del Giocatore (PG), Fisico Ermetico (FE). Le discussioni sono simulazioni critiche in questa sessione, NON agenti autonomi o professionisti esterni.

## 1. Feedback e decisioni
1. **La fase duale continua a essere la candidata più forte.** Mantenerla.
2. **Il cannone che imprime soltanto un impulso è ridondante con il drag.** Non aggiungere potenza o upgrade; lasciarlo come confronto temporaneo nel laboratorio. Una futura versione potrebbe bombardare per mutazioni o produrre particelle incidenti, ma richiede una legge verificabile.
3. **La cristallizzazione deve permettere mosse da boardgame.** Nuovo test: muovi su una cella confinante o scambia con l'occupante, pagando 1 ENERGY. Fusione e fissione restano uno strumento differente. Non inferire che questo sia il bilanciamento definitivo.
4. **La distanza desiderata non è leggibile dal bond rosso soltanto.** Il bond diagnostica *quanto* sia lontana dal suo ideale, non *dove* si trovi l'ideale. Nuovo test: selezionando un corpo compaiono cerchietti fantasma nel punto in cui desidererebbe vedere ciascun altro corpo lungo la direzione corrente, oltre a un riepilogo di cromia/seme/DNA.
5. **I tutorial a quattro corpi sono troppo semplici.** Nuovi scenari con sei e otto individui e obiettivi che richiedono più trasformazioni; non rivendicare che siano già stati validati da un solver.
6. **ENERGY non ha ancora una fonte soddisfacente.** Non implementare un reward finché non sia escluso un ciclo di guadagno a costo netto negativo.
7. **Tower Defense come meccanica candidata**, senza ondate temporizzate, aggressività o complessità da RTS. La griglia costruisce un reattore che guida, filtra o neutralizza un flusso.

## 2. Cosa insegna Living Physics
Repository di Tim Hutton: https://github.com/timhutton/livingphysics (codice Processing.js su gh-pages).
- \`Reaction.pde\`: una reazione possiede due condizioni per i tipi/stati e per il legame iniziale, poi applica nuove condizioni e crea o rompe il legame. **Le precondizioni/effetti sono visibili e verificabili.**
- \`Challenges.pde\` / \`AdvancedChallenges.pde\`: livelli progressivi, da semplici azioni di manipolazione a sfide che richiedono più reazioni con prerequisiti, obiettivi e condizioni di successo esplicite.
- \`Atom.pde\`: collisione, trazione, forze delle molle e drag del giocatore sono funzioni separate.
- **Non ereditare** il suo grande linguaggio di reazioni e decine di obiettivi complessi. Salvare la distinzione fra *simulazione*, *regola di trasformazione* e *sfida*; offrire regole esprimibili in due righe.

## 3. Round degli agenti — Tower Defense in un universo alchemico

### Round A: l'ipotesi "torri" è coerente?
**PA:** «Sì, perché ogni occupante della griglia diventa una scelta topologica: dove collocarlo? Si apre/chiude una via, si accosta una coppia per una reazione, si prepara un filtro. Servono ingressi, uscite e condizioni di successo visibili.»  
**SE:** «I percorsi devono nascere dai Polytroni, non da nemici scriptati che seguono una rotaia. Il campo può deformare l'itinerario.»  
**GC:** «Se un Polytrone fa da torre solo perché è grande, abbiamo tradito il DNA. Almeno colore o struttura deve influire sul tipo di flusso trattato.»  
**PG:** «Niente click freneticamente sotto attacco. La "wave" si avvia dopo la pianificazione e può essere fermata/analizzata. I rischi devono essere prevedibili come un percorso di scacchi.»  
**FE:** «Un'ondata finita di impulsi in ingresso fornisce un sistema aperto: può trasferire energia al reattore senza pretendere creazione dal nulla. Evitare di chiamare questo processo fusione nucleare reale.»

**Verdetto:** TD reinterpretato come **reattore di flussi su reticolo**, non guerra contro creature; l'utente pianifica a piacere, poi preme *Avvia flusso*.

### Round B: quale nucleo sperimentare?
| Candidato | Regola | Decisione interessante | Svantaggio |
|---|---|---|---|
| TD1 Difendi il nucleo | Blocca o devia impulsi verso il centro | Coverage e disposizione | Potrebbe diventare un classico tower defense travestito |
| TD2 Filtra il flusso | Due tipi di particelle entrano, devono raggiungere uscite diverse | Scelta strategica dei caratteri e posizioni | Nuovo sistema di percorsi da rendere leggibile |
| **TD3 Sintetizza il flusso** | Il flusso attraversa sequenze di Polytroni e si trasforma | Ordine spaziale, DNA, previsione | Potrebbe sovrapporsi a troppi strumenti |

**Primo test preferito: TD2** con un singolo punto d'ingresso e due uscite, due cromie di impulsi, 3–5 Polytroni fissi sulla griglia e massimo **una** legge di interazione. Può successivamente evolvere verso TD3. Non introduciamo attacco/difesa/HP/torri, upgrade e nemici.

### Round C: l'energia
**PA:** «Premio fisso alla prima soluzione di un circuito, non per lasciarlo girare.»  
**SE:** «La sorgente può essere il flusso esterno: impulsi trasportano una quantità finita di energia; alcuni percorsi la trasformano, altri la disperdono.»  
**GC:** «Una ricompensa di scoperta per la prima sintesi di una nuova configurazione stabile può affiancare il circuito, ma mai tramite infinite registrazioni della stessa cosa.»  
**PG:** «Una ricompensa leggibile *perché il giocatore ha risolto* è motivante; una produzione al secondo diventa grind.»  
**FE:** «Se una particella entrante porta una carica energetica unitaria, il massimo recuperabile per quel flusso deve essere ≤ la sua carica, meno perdite definite. Anche in questo caso chiamarla convenzione ludica, non vero bilancio chimico.»

**Schema candidato per il TEST, non implementato:**
- Ogni livello possiede una sequenza finita di, per esempio, **quattro impulsi** (non infinite ondate).
- Il giocatore modifica la scacchiera pagando ENERGY per mosse, fusioni, fissioni.
- Dopo *Avvia reazione*, i quattro impulsi avanzano su turni logicamente discreti, con animazione a velocità regolabile. Nessuna penalità di riflessi.
- Per una sequenza correttamente filtrata si riceve una ricompensa **una tantum** e una nuova scoperta; replays non generano energia.
- La dinamica fluida resta il modo per preparare altre disposizioni oppure rilassare un sistema, non un sostituto della progettazione.
- Si verifica che cambiare colore o DNA di un Polytrone cambi almeno una rotta o un risultato. Altrimenti la componente genetica non contribuisce.

**Dissenso SE:** preferisce che il fluido generi naturalmente anche il flusso senza sceneggiatura. **Replica PA/PG:** prima un problema con successo deducibile, poi una variante free-sandbox emergente.

## 4. Interazione e leggibilità Sprint 09
**Controlli attivi del branch:**
- In cristallo, **Muovi / Scambia** e **Fondi / Scindi** sono modalità distinte e dichiarate.
- Muovi / Scambia: click pezzo + cella confinante oppure drag-and-drop su una cella confinante; scambio se già occupata. Costo iniziale 1 ENERGY.
- Tre livelli sperimentali? In realtà **quattro**: 2 scenari introduttivi da 4 Polytroni; scenario 3 da 6 individui con obiettivo \`adk05C\`; scenario 4 da 8 con obiettivo \`dak05C\`. Nello scenario 4 il simbolo \`k05C\` è inizialmente soltanto dentro \`adk05C\`, dunque occorre una fissione per riutilizzarlo.
- I Polytroni selezionati mostrano una visualizzazione **relativa** delle posizioni ideali dei vicini rispetto all'orientamento corrente. La regola è visualizzata con cromie di affinità e un pannello esplicativo facoltativo.
- Formula provvisoria della distanza desiderata: palette uguale ⇒ 64, palette diversa ⇒ 124; semi diversi ⇒ +12; differenza nel numero di operatori ⇒ +7 per operatore. Sono **regole inventate del prototipo**, non deduzioni da proprietà topologiche Conway.
- Lo stress totale corrente non è un punteggio comparabile fra N diversi: non usarlo per concedere premi fino alla definizione di una misura normalizzata e di una correzione per numero di interazioni.
- Esistono ancora solo pochi oggetti visualizzati 2D con anteprima poliedrica 3D; una vista 3D piena e una camera tipo Tower Madness sono una fase successiva.

**Da verificare nei test reali:**
- Coerenza drag e click della scacchiera, focus, touch e pointer capture.
- Il risultato di un drop corrisponde alla cella evidenziata, anche con scaling SVG e su device mobili.
- Il giocatore capisce i ghost marker senza una lezione numerica?
- Con otto individui, troppe linee sembrano una ragnatela? Necessari filtraggio su selezionato e confronto con un overlay a capacità visiva più limitata.
- Il target \`dak05C\` è davvero raggiungibile entro il budget ENERGY? **Non validato da solver**.
- La fisica del fluido ha un senso geometrico con 8 individui, non soltanto congestione.

## 5. Esperimento successivo raccomandato
**TD-Lite 01 — Il Filtro**:
- Esagoni: 19.
- Tre/talvolta cinque Polytroni con geni diversi.
- Un ingresso, due possibili uscite.
- Flusso finito e deterministico di particelle di due famiglie cromatiche.
- Una sola regola iniziale: il Polytrone di famiglia A devia una particella A, il Polytrone di famiglia B devia una B; la relazione deve essere dichiarata e visualizzata con frecce sul percorso. Eventuali regole più ricche solo dopo test.
- Il giocatore può sistemare Polytroni sulle celle spendendo ENERGY.
- Viene mostrata la **traiettoria prevista di ogni impulso prima dell'avvio** (esattamente come l'anteprima di cristallizzazione).
- Score = corretti instradamenti del flusso finito; premio una tantum, niente farming.
- Stessa configurazione iniziale provata con e senza dinamica fluida/cristallizzazione per misurare se il doppio stato migliora il puzzle.

## 6. Condizione di bocciatura
Bocciare la variante TD-Lite se il percorso rimane banale, se il tempo reale diventa obbligatorio, se il giocatore costruisce una difesa senza utilizzare le proprietà dei Polytroni, se la presenza di flussi riduce l'attenzione sulla geometria e sul DNA, o se l'energia si accumula semplicemente premendo *Avvia flusso* senza una nuova soluzione.

La **priorità attuale** è testare bene fase fluida, movimento cristallino e leggibilità delle distanze. Il TD-Lite è un candidato per il prossimo esperimento isolato, non una meccanica già promossa nel core.
