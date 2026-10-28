# Sessione 21 / Sprint 19 — Fenotipi visibili, collisioni leggibili e l’Architron come pet

**Data:** 28 ottobre 2026  
**Branch:** \`experiments/sprint19-visible-polyhedra\` (derivato dallo Sprint 18); \`research/session20-architron-pet-memory-transfer\` resta un altro ramo documentale non alterato.  
**Metodo:** i sette ruoli del Design Team sono **prospettive critiche simulate**, non specialisti esterni che si sono riuniti. Nelle risposte i titoli devono essere sempre **scritti per esteso**.

## 0. Chiarimenti definitivi dell'autore

1. I **72 Polytroni non sono anonimi**: ciascuno ha nome, identità permanente e \`MindeleevTable\`. Solo i viaggiatori effimeri *Lemmings-like* sono anonimi, anche se portano DNA Conway.
2. Il giocatore è **deus ex machina**, non Architron incarnato. Il gioco può iniziare con un solo **Architron-pet** di cui prendersi cura, espandendosi poi a **squadre**, eventuale multiplayer e gilde. **Non** progettare adesso un servizio multiplayer o un roster infinito: l'architettura può tenere distinti gli ID e la selezione senza implementare network.
3. Nel vero MindeleevSpatial una forma registrata nella MindeleevTable permetteva all'individuo di **assumere quella forma**. Il nuovo repertorio deve quindi essere una capacità **attiva**, non solo una cronaca storica o una checklist. Il costo/condizione del richiamo resta da determinare: non bypassare l'intera algebra Conway.
4. L'automa cellulare di MindeleevSpatial creava un caleidoscopio suggestivo ma sostanzialmente imprevedibile. L'oggetto della ricerca contemporanea è **predizione comprensibile** delle reazioni tramite algebra Conway, relazione fra DNA e geometria, e test riproducibili.
5. **Nelle simulazioni dobbiamo ora vedere i veri poliedri di Conway**, anziché icone di triangoli e quadrati, per giudicare bellezza e riconoscibilità. Il controllo a simboli schematici resta utile per separare comprensione formale e spettacolo visivo.

## 1. Decisione del Design Team: non un'alternativa, ma due strumenti sperimentali

### Architetto del Puzzle
**Favorevole** al passaggio alle geometrie reali ora che la simulazione funziona con simboli semplici. Il giocatore deve poter osservare una coppia di forme e **anticipare il tipo di interazione**; se può capire solo guardando una stringa \`aC\` non stiamo realizzando il gioco. Insiste però sul controllo schematico: un fenomeno deve essere **formalmente leggibile** anche quando togliamo le superfici colorate. «Funziona con quadrati e triangoli» è un gate per la legge; «si riconosce e si desidera con poliedri» è un gate per il prodotto.

### Ludologo
**Favorevole**: per un gioco con l'apprendimento di nuove combinazioni il riconoscimento visivo è capitale, come nei giochi in cui la forma/creatura suggerisce affordance. Il gioco di crescita del pet è differente dalla ricerca di 72 figurine; bisogna evitare che una Shape-DNA distante diventi automaticamente più forte. Più forme memoria = più possibilità; non necessariamente rango maggiore.
**Obiezione:** poliedri estremamente elaborati a 20px possono essere indistinguibili. Occorre una vista 3D ampia, prima/dopo, indizi di facce/valenze e tempo di osservazione. Preferire prove di comprensione delle collisioni con e senza DNA visibile.

### Genetista
**Favorevole con condizione:** gli individui fissi sono singoli esseri nominati, portatori anonimi restano effimeri; la forma può cambiare mentre il nome non cambia. MindeleevTable è il repertorio di metamorfosi riassumibili. Quando la stessa forma deriva da più ricette, la corrispondenza tra individuo e fenotipo può essere **molti-a-uno**.
**Obiezione:** se una forma imparata può essere evocata senza spesa, la sintesi perde scopo. Definire "recall" come transizione condizionata da energia/stato o come selezione di una ricetta già **conosciuta ma non creata**: testare prima di implementarlo. La tavola personale resta indipendente da Phenotype Atlas.

### Fisico-Matematico
**Distinzione essenziale per le "eccezioni":**
- \`D\` indica genotipo/ricetta; \`P(D)\` la mesh geometrica; \`Q(P)\` caratteristiche funzionali fenotipiche.
- Una **legge solo fenotipica** \`R=F(P_A,P_B,statoFisico)\` **non può distinguere** \`D_A\` e \`D_A'\` se la geometria e ogni altro stato fisico sono identici. Se lo fa, viola la premessa "le proprietà sono del fenotipo".
- Una **reazione genetica** \`G(D_A,D_B)\` può invece produrre diversi DNA figli anche quando \`P(D_A)=P(D_A')\`. Esempio: ricette geometricamente equivalenti hanno storie operatoriali differenti e possono essere ricombinate in modi diversi. Questo è legittimo se le regole dichiarano esplicitamente il **genotipo come stato interno fisico/ereditario**.
- Una trasformazione genetica può modificare il DNA **senza cambiare il fenotipo**: “reazione silenziosa” anziché “eccezione misteriosa”. Viceversa due viste 2D simili possono nascondere forme 3D diverse.
- \`d²C=C\` è un buon test di neutralità geometrica entro le identità di Conway; non confondere l'uguaglianza dei descrittori numerici con una prova di congruenza geometrica.
- No bonus ENERGY per complessità, bellezza, alias o sola lunghezza del DNA.
**Obiezione:** se ogni equivalenza deve essere appresa con una UI testuale si perde intuizione; progettare indizi attraverso forma/suono, non una formula consultata a ogni incontro.

### Progettista di Sistemi Emergenti
**Forte consenso** sull'uso della geometria reale per comprendere lo spettacolo, mantenendo **regole locali semplici** e possibilità di reazioni a catena. Il solver di Sintesi e un automa cellulare non sono incompatibili: automa con nuove regole ricavate dalla mesh e dal genotipo, non effetti casuali senza relazione chiara.
**Rischio:** 72 veri modelli 3D sul board possono rendere tutto illeggibile: occorrono gerarchia, focus dell'Architron, colori e scie. Lo stato fluido resta parte del progetto; non è ancora stato testato su questo modello.

### Psicologo del Giocatore
Il percorso di apprendimento dovrebbe passare da \`vedo\` → \`ipotizzo\` → \`metto alla prova\` → \`capisco\` → \`trovo un'eccezione spiegabile\`, non da \`subisco\` → \`leggo manuale\`.
**Obiezione:** le eccezioni diventano interessanti se generano **curiosità e senso di padronanza**, non quando smentiscono la relazione tra forma e regola senza feedback. I primi 3–5 incontri devono essere molto comprensibili. Pet e primi individui selezionati creano attaccamento, ma evitare collezionismo compulsivo imposto.

### Compositore di Sistemi Musicali
La riconoscibilità di una forma dovrebbe avere un equivalente udibile. Se due ricette fenotipicamente equivalenti producono **stessa reazione geometrica**, la risposta sonora del campo potrebbe coincidere; se la mutazione cambia solo il genotipo, può esserci una traccia ritmica/timbrica discreta per l'informazione ereditaria. L'Architron mantiene un tema personale anche cambiando mesh. Evitare un codice di note ad hoc per ogni operatore prima di aver compreso il sistema.
**Obiezione:** 72 sorgenti 3D e decine di eventi devono essere **mixate** con il pet in evidenza e gli altri in secondo piano; non tutte le collisioni devono produrre automaticamente una nota forte.

## 2. Interpretazione della “eccezione” a una collisione

L'autore vuole che sia più facile imparare la conseguenza di una collisione *guardando due forme reali*, ma ammette che alcune reazioni siano non evidenti o nulle per equivalenze di Conway; questo può generare scoperta come una apparente eccezione alla fisica.

**Tre casi distinti da rendere leggibili:**
1. **Nessuna reazione reale**: la regola locale non si applica, oppure reagenti già in equilibrio. Event log esplicito, non bug invisibile.
2. **Genotipo diverso, stessa forma**: una ricombinazione di operatori modifica \`D\` ma \`P(D')\` coincide con \`P(D)\`. Fenotipo e attività geometrica restano invariate mentre la MindeleevTable/possibilità future possono cambiare. Questa è un’**equivalenza**, non una legge fisica violata.
3. **Stessa apparenza, genotipi diversi**: due individui con \`P(D_1)=P(D_2)\` reagiscono **differentemente nella fase genetica** perché le loro stringhe/storie di operatori differiscono. Qui lo stato interno che decide la reazione è reale e deve diventare **ispezionabile** e coerente. Se anche il genotipo è identico e gli stati rilevanti sono identici, le stesse leggi non possono dare esiti differenti.
4. **Stessa proiezione 2D, geometrie 3D diverse**: il problema è un limite della camera; la vista 3D reale in grande può mostrarlo.

**Conclusione:** non occorre che tutte le reazioni siano intuibili al primo sguardo. Occorre che ogni sorpresa sia **spiegabile a posteriori attraverso il modello e gli indizi visivi/genetici a disposizione**. L'eccezione deve rivelare una struttura nascosta, non correggere arbitrariamente una regola.

## 3. Primo incremento visivo implementato nello Sprint 19

**Sorgenti:**
- \`src/experiments/PolytronMeshGlyph.tsx\` — proiezione fissa ortografica delle **facce reali** prodotte da \`dnaToPoly\`, con colori \`paletteColor\` (Polyhedronisme), normali orientate e profondità; nessuna rotazione in-place. Render SVG, non una riproduzione fotografica né un motore ottico.
- \`src/experiments/MusicalReturnLab.tsx\` — usa i veri poliedri sul board, anche per i portatori DNA mobili; prima/dopo accanto agli eventi di mutazione; preview ingrandita con numero vero di vertici/facce; Architron evidenziato come **uno dei tre individui**, ruolo scambiabile nel test; centro visibile come **Sorgente**. Toggle «Poliedri reali» vs «Schematica», condividono la STESSA simulazione, timeline, evento musicale e ledger ENERGY.
- \`scripts/check-visible-polyhedra.mjs\`: verifica che i veri mesh T/C/O/D/I/aC/dC abbiano V/F corretti, superfici proiettate, palette, e che trasformazioni restino deterministiche.
- \`.github/workflows/pages-visible-polyhedra.yml\`: test grafica, regressioni e deploy.

**Scope intenzionale:** focus Architron è **soltanto visuale** nello Sprint 19, nessun potere o legame energetico speciale: il valore del pet nel modello completo richiede il modulo personale della MindeleevTable. Non ci sono ancora 72 persone simultanee, squadre, multiplayer/gilde, memoria persistita o costo della re-assunzione di forme.

**Importante:** il vecchio routing di Sprint 18 usa ancora **numero di lati più frequente** della mesh per determinare la svolta. La nuova visualizzazione è *autenticamente derivata dalla mesh* ma la legge di collisione non è una rappresentazione completa di Conway; il passaggio fenotipo→reazione è una **ipotesi progettuale temporanea**. Non dichiarare che le combinazioni genetiche siano già leggibili/matematicamente risolte.

## 4. Piano successivo, raccomandato dal Team

### Test della memorizzazione
- Definire \`Individual {id,name,currentDNA,knownRecipes/learnedSpecies,personalHistory,role}\`.
- In un test isolato un individuo impara \`aC\` dopo una collisione. In una scarica successiva gli è possibile **assumere \`aC\` perché la sua MindeleevTable la contiene**, non perché ogni ricetta sia disponibile di default.
- Comparare costi di richiamo (0, 1, o spesa proporzionale a potenziale \`U\` definito) **senza presupporre che il più caro sia più corretto**. Verificare la tensione rispetto alla sintesi Conway e al trasferimento del repertorio (Sessione 20).
- Non confondere "apprendere" con assumere subito; storia genetica e repertorio disponibile sono registri distinti.

### Test delle eccezioni (sotto controllo)
- \`d(d(C))=C\`: predire stesso fenotipo dopo una sequenza genetica che appare più lunga.
- \`O\` e \`dC\` (e \`aT\`) come famiglie di equivalenze geometriche con ricette diverse; verificare con confronti di congruenza, non solo V/E/F.
- Calcolare \`D\` prima/dopo, \`P(D)\` prima/dopo, \`R\` prima/dopo; visualizzare sempre la causa differenziale.
- Due modalità in laboratorio: **collisione governata dal fenotipo** vs **trasformazione genetica governata dagli operatori**. Se otteniamo risultati differenti, abbiamo un fenomeno genuino da insegnare.
- **Gate:** una persona riconosce almeno una reazione osservando il poliedro e ne sa spiegare almeno una «eccezione» dopo aver visto la storia genetica?

### Test di densità visiva
- Comparare giudizi su gli stessi 3/6/12 Polytroni reali, su SVG lite e su 3D vero con un viewport che li distingua. Le forme complesse con molte facce potrebbero essere illeggibili nelle celle da 24px.
- L'identità dell'Architron (segno persistente) deve essere riconoscibile senza cancellare quella degli altri individui; il kaleidoscopio deve essere osservabile con trasparenze/isolamento temporaneo di pochi protagonisti.
- Non attribuire alla grafica sola il compito di convalidare le regole: giudizio estetico richiede osservazione umana e playtest.

## 5. Verdetto del Design Team

**Convergenza:** veri poliedri necessari **ora**, schematici come controllo. Architron-pet è ruolo assegnato a un individuo, gli altri 71 mantengono nomi, storia e pieno sviluppo. Carrier anonimi restano distinti. In futuro cominciare con un solo Architron seguito, poi squadre e funzioni sociali solo se supportate da regole realmente interessanti. **MindeleevTable = memoria abilitante**: una forma conosciuta deve poter essere richiamata, in condizioni da definire. **Eccezioni** legittime solo se riconducibili a stati interni o equivalenze Conway identificabili, non effetti arbitrari.

**Dissenso:** quanto peso dare alla reazione visivamente immediata vs alla regola genetica nascosta. Il Fisico-Matematico vuole fenomeni identici a parità di ogni stato rilevante; il Genetista difende la possibilità di eredità nascosta; l'Architetto del Puzzle pone come requisito che il giocatore **possa scoprirla** senza manuali enciclopedici.

**Criterio di successo:** non è sufficiente che i poliedri reali siano belli. È necessario che quando due forme si incontrano il giocatore possa progressivamente costruirsi una teoria affidabile della loro interazione.
