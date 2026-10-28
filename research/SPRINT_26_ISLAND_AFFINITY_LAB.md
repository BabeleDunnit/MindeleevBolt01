# Sprint 26 — Island Affinity Reactor
## Correzione della grammatica T e prototipo comparativo R0–R4

**Data:** 28 ottobre 2026.  
**Branch:** \`experiments/sprint26-island-affinity-lab\` discendente da \`research/session25-party-planner-radial-emission\`.  
**Stato:** sandbox di ricerca separata dal Musical Return Reactor (\`?experiment=island-affinity\`).  
**Metodo:** le sette prospettive del Design Team sono simulate dall'assistente: **Ludologo**, **Genetista**, **Architetto del Puzzle**, **Fisico-Matematico**, **Progettista di Sistemi Emergenti**, **Psicologo del Giocatore**, **Compositore di Sistemi Musicali**. Citare sempre i titoli per esteso.

## 1. Correzione richiesta dall'autore

La tabella della Sessione 25 era ambigua: «T non modifica DNA» vale **solo per il verbo elementare T**. Se un controller \`k02T\` colora con palette 02 e contiene l'operatore Conway \`k\`, deve modificare **sia la palette sia la forma/DNA del viaggiatore**. Stesso principio per \`a02T\`, \`d02I\`, ecc. La regola globale è:

**Verbo base dal seme → trasformazione del flusso → wrapper Conway della stazione applicato ai prodotti.**

I semi base e le funzioni restano:
- \`T\`: **Colora**, cambia palette del carrier; un wrapper (es. \`k\` o \`a\`) applica anche una vera trasformazione Conway.
- \`C\`: **Combina**, buffer due portatori compatibili (stesso seed/palette e sequenza operatoriale di lunghezza limitata), fonde concatenando i geni. Incompatibilità produce nulla; buffer ha timeout separato per evitare perdita occulta.
- \`O\`: **Scinde**, taglia casualmente una sequenza di almeno 2 operatori in due sequenze non vuote, con figli che ereditano seed e palette; il taglio è pseudocasuale **riproducibile dal seed del run**.
- \`D\`: **Clona**, produce due viaggiatori con stessi geni; l'ENERGY è suddivisa.
- \`I\`: **Seleziona**, ammette i viaggiatori con palette compatibile. Non ha trasformazione genetica come verbo base; un wrapper può cambiarne la forma se ammessi.

**Attenzione all'esempio letterale \`i02T\`:** il parser originale Polyhedronisme in questa repository **non supporta l'operatore minuscolo \`i\`**. \`k02T\` è supportato. La richiesta dell'autore è un principio di combinazione di operatori, non un mandato a implementare operatori sconosciuti. Il laboratorio usa \`k02T\` e \`a02T\` come casi di prova.

Il fallimento di un'operazione genetica produce **trasformazione nulla** (nessun cambiamento a DNA/corpo/palette). Il blocco temporaneo del primo portatore in attesa del partner per C è uno **stato** esplicito con rilascio/timeout, distinto dal fallimento.

## 2. Implementazione del motore

\`src/experiments/IslandAffinityEngine.ts\`:
- utilizza \`dnaToPoly\` del vero Polyhedronisme e \`surfaceShapeDNA\` esistente; pre-calcola/cacha firme FEM e distanze spettrali in scala logaritmica;
- \`affinity\` ritorna \`distance\`, \`similarity\`, \`rest\`, \`fallback\`; distanza preferita \`rest=15+78(1-\mathrm{similarity})\` in unità del mondo *inventate*: **non** proprietà fisica dei solidi;
- limite di 80 vertici per la FEM corrente; per forme più complesse si segnala esplicitamente un **fallback approssimato** su numero facce/vertici (non asserire che sia Shape-DNA pieno);
- a passo fisso: molle tra portatori e controller più coppie portatore-portatore secondo distanza preferita (**Party Planner reinterpretato**), oppure controllo Boids separazione/allineamento/coesione, oppure ibrido. Boids non è l'algoritmo di Rich Gold.
- modalità emissione: una sonda a 30° oppure 6/12 portatori distribuiti su una circonferenza radialmente a passo angolare uguale; singolo budget diviso in modo equo; campo isole dal layout dei 6 sink del primo anello esagonale espanso.
- 5 individui con nome generato utilizzando i 3 nomi già presenti nel sistema, con altri nomi provvisori da sostituire con la vera funzione completa del roster; attualmente il laboratorio visualizza 6 controller **su 71 possibili**, non implementa tutto il roster.
- l'Architron è **il pet-Sorgente al centro**, non una stazione laterale. In questo primo laboratorio ha un repertorio/filtri **di prova** (input DNA e palette di rientro manuali, non ancora una vera \`MindeleevTable\` persistente).
- controller named aumentano \`known\` e \`history\` quando incontrano nuovi DNA, **senza cambiare la forma corrente**. Gli anonimi cambiano DNA/mesh durante le collisioni.
- si accolgono portatori solo quando hanno già avuto almeno un incontro e attraversano il raggio centrale **dall'esterno verso l'interno**, con palette attuale uguale a quella selezionata. Non è un homing arbitrario a tempo, ma il campo verso la Sorgente viene attivato da **affinità di ritorno**; la legge è ancora un'ipotesi ludica, non una derivazione automatica da Shape-DNA.
- ledger separato della **ENERGY trasportata**: \`input+harvested=returned+escaped+inField+buffered+dissipated\`; \`harvested\` proviene da riserve limitate delle isole. Clonazioni e scissioni non duplicano ENERGY.
- **Limite fisico deliberato:** il campo elastico NON possiede ancora un vero ledger di lavoro/energia cinetica/potenziale. Non dichiarare conservazione fisica completa. Nessun guadagno persistente da replay.
- generatore di casualità riproducibile (mulberry32) con seed modificabile; ogni taglio è un campionamento nuovo; \`Ripeti identico\` conserva seed, \`Nuova variazione\` lo incrementa.
- emergenza simmetrica **non garantita**: la scarica radiale è simmetrica inizialmente, ma controller con DNA non simmetrici, rumore genetico o rottura di equilibri possono alterarla; la fisica non copia sei traiettorie a mano.

\`src/experiments/IslandAffinityLab.tsx\`: UI per selezione R0–R4, fisica, singolo/corona, quantità, genotipo, filtro cromatico, ENERGY, random seed; simulazione avanti/pausa/rewind/timeline, selezione controller e viaggiatore, Inspector sul DNA visibile e sulla distanza preferita, MindeleevTable temporanea del controller e note, vero SVG delle mesh (stessa sorgente dello Sprint19), suoni originali su event log. Setup visualmente compatto e run visualmente espanso; **la transizione è per ora un cambio di scala sul layout, non una simulazione di lavoro fisico delle isole**.

\`scripts/check-island-affinity.mjs\`: test su grammatica, parser (i non supportato), operatori differenti per T, scissione nulla/sdoppiamento, PRNG, Shape-DNA e confronto R0–R4, simulazioni con tutte tre varianti di fisica, ledger, identità dei controller, colorazione + wrapper, apprendimento senza metamorfosi stazione, filtro e rientri.

## 3. Micro-esperimenti e limiti

**R0 — Singola contro corona:** 1 vs 6 vs 12, stessa legge. Mostra il potenziale di simmetria. Guardare simmetria *effettiva* dei percorsi, non inferirla dal solo numero di emessi. Il budget diviso riduce energia per portatore.

**R1 — Party Planner contro Boids:** stessa geometria, tre opzioni \`party/boids/hybrid\`; la differenza riguarda il comportamento portatore-portatore e il peso delle distanze preferite rispetto alla coesione. È un **controllo esplorativo**, non una replica filologica dei due algoritmi.

**R2 — Fissione e clonazione:** input \`ad01C\` può essere tagliato da O, mentre \`01C\` produce trasformazione nulla. D duplica la ricetta, non il pool di ENERGY. I figli sono scostati tangenzialmente per evitare coincidenza numerica perfetta, con un piccolo impulso: questo è un proxy **non ancora bilanciato in energia meccanica**.

**R3 — Cinque verbi:** ogni seme produce una famiglia di eventi; il gioco non deve dichiarare che il solo seed porti una legge fisica naturale. Il wrapper di T cambia davvero DNA oltre alla palette, se l'operatore è applicabile.

**R4 — Rientro alla Sorgente:** il filtro selezionato consente il ritorno solo quando il carrier è stato trasformato o ha fatto un incontro ed è tornato geometricamente nel centro. La sola origine al centro non basta.

**Limiti prioritari:** curve/campo di energia non coerenti con una vera Hamiltoniana che tenga conto delle mutazioni; volumi di collisione proxy; numero massimo 36 carrier in laboratorio; tavola dell'Architron provvisoria e non persistente; indisponibilità di un sistema completo di reazioni fra tutte le ricette fino a profondità 4 e tutte le forme complesse; fisica del buffer da approfondire; musica originale illustrativa non ancora un vero sequencer Euclideo/NodeBeat; non sono stati ancora eseguiti playtest umani.

## 4. Criteri di valutazione degli esperti, tutti per esteso

**Ludologo:** il confronto R0–R4 deve aggiungere scelte vere, non solo cinque demo estetiche.  
**Genetista:** differenze \`a02T\` vs \`k02T\` devono tradursi in forme diverse del viaggiatore; l'operazione O corta deve restituire trasformazione nulla.  
**Architetto del Puzzle:** prima si deve comprendere T + filtro, poi i tre verbi genetici, senza memorizzare tabella dei pesi spettrali.  
**Fisico-Matematico:** metrica spettrale reale ma campo scelto come legge di gioco; il ledger delle ENERGY trasportate è conservativo, **non** il bilancio meccanico completo.  
**Progettista di Sistemi Emergenti:** la scala e le scariche radiali dovrebbero produrre formazioni osservabili, ma la simmetria non è promessa né costruita con rendering duplicato.  
**Psicologo del Giocatore:** seed fisso e controllo replay rendono la ripetizione utile alla scoperta; episodi troppo opachi non devono richiedere un manuale di chimica.  
**Compositore di Sistemi Musicali:** toni dalla cronologia delle reazioni, non musica precomposta. Ampliare soltanto dopo che le traiettorie hanno un senso ludico e causale.

**Sviluppo futuro:** comparazione controllata di ritorni effettivi, miglioramento della funzione di affinità e della sorgente come target spettrale, sequenze e repertori con tavole persistenti, saldi di energia cinetica/potenziale, generazione di molteplici individui nominati e team senza imporre multiplayer.
