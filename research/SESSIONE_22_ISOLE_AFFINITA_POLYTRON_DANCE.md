# Mindeleev — Sessione 22: isole di trasformazione, volo per affinità e protocollo sperimentale

**Data:** 28 ottobre 2026. **Stato:** design review e audit dei precedenti Unity, **nessuna modifica al codice dei prototipi**.  
**Branch:** \`research/session22-islands-affinity-dance\`, derivato da \`experiments/sprint19-visible-polyhedra\`.

**Design Team:** sette prospettive critiche simulate da ChatGPT, non sette professionisti esterni. L'assistente fa da portavoce, riportando dissensi. Citare SEMPRE il nome dei ruoli PER ESTESO: **Ludologo**, **Architetto del Puzzle**, **Progettista di Sistemi Emergenti**, **Genetista**, **Fisico-Matematico**, **Psicologo del Giocatore**, **Compositore di Sistemi Musicali**.

## 0. Ipotesi dell'autore — il nuovo cambio d'architettura
- 19 (o più) **celle esagonali come isole non contigue**: luoghi discreti su cui disporre gli individui nominati, con spazi liberi nel mezzo; non percorsi lungo sei lati.
- **Viaggiatori anonimi** (DNA Conway e palette ma nessuna identità permanente) volano nel piano 2D con dinamica continua, spring-mass, inerzia, attrazione/repulsione e collisioni; la Sorgente è partenza/ritorno.
- Incontri di trasformazione leggibili, basati su **forme e colori**: tetraedro T = applica palette; cubo C = assorbe; ottaedro O = scinde; se la stazione porta operatori Conway, può imporli ai carrier; attirare i carrier in base ad affinità di colore, seed o somiglianza geometrica post-reazione.
- Al posto dei binari Shapez, il giocatore predispone **isole/macchine** e lascia che i carrier trovino percorsi fluidi; riutilizzare il piacere visivo della Polytron Dance e del Mutatron come sistema emergente.
- **Scariche programmabili** (es. 5 portatori prima dell'Architron nominato); gli esperimenti devono essere ripetibili, osservabili in pausa, con possibilità di apprendere per tentativi. Il lancio dell'Architron può costituire la scarica decisiva, mentre i probe possono testare o modificare le isole.
- L'attuale Musical Return Reactor rimane difficile da anticipare: deviare di 60/120/180 gradi in base al numero di lati prevalente delle facce non è intuitive enough. L'utente non vuole un esame universitario; regole memorizzabili e verificabili prima della matematica avanzata.
- Il giocatore è **deus-ex-machina** che cura l'Architron-pet: uno dei 72 individui con nome, ID e repertorio di forme \`MindeleevTable\`. Gli altri 71 sono individui con nome e memoria; solo i viaggiatori Lemmings-like sono anonimi.

## 1. Che cosa era realmente la Polytron Dance in MindeleevSpatial?

**Audit verificato della repo Unity**:
- \`Assets/Mindeleev/Scripts/BindingManager.cs\` (branch \`develop\`), \`PolytronsDance(int levelCount,int evolveCount)\`: confronta stati delle tessere ottenuti dall'automa cellulare e orchesta delta \`BORN\`, \`DIED\`, \`STAY\`, \`MOVE\`; riassegna individui agli slot, richiama da home o rimanda home. La Dance separa evoluzione discreta e movimento: **non è, da sola, una legge di attrazione Shape-DNA**.
- \`Assets/Mindeleev/Scripts/Old/PolytronEngineSpring01Physics.cs\`: prototipo distinto con forza elastica pairwise verso distanza di equilibrio, repulsione al contatto, attrito lineare e Rigidbody.AddForce/AddTorque. Presente come \`Old\`.
- \`Assets/Mindeleev/Scripts/Old/PolytronSpringRecipeBasedEquilibriumPhysics.cs\`: idea di distanza d'equilibrio dipendente da ricette, con blocco \`ComputeForce\` commentato: **non** funzionamento comprovato in produzione.
- Vecchia meccanica dell'automa cellulare generava effetti esteticamente forti ma difficili da anticipare; nuovo lavoro non deve semplicemente reintrodurla come regola senza spiegazione.

Fonti:
https://github.com/BabeleDunnit/MindeleevSpatial/blob/develop/Assets/Mindeleev/Scripts/BindingManager.cs
https://github.com/BabeleDunnit/MindeleevSpatial/blob/develop/Assets/Mindeleev/Scripts/Old/PolytronEngineSpring01Physics.cs
https://github.com/BabeleDunnit/MindeleevSpatial/blob/develop/Assets/Mindeleev/Scripts/Old/PolytronSpringRecipeBasedEquilibriumPhysics.cs

**Architettura recuperabile**: \`evolve discrete state → determine possible transformations/targets → simulate smooth physics → record events → synthesize sound/visual → ledger\`. Distinguere l'aggiornamento del target dal vero movimento continuo.

## 2. Dialogo del Design Team

### Ludologo — «Shapez senza nastri, Osmos con una grammatica di reazioni»
- **Shapez** distingue esplicitamente logistic vs processing buildings; cutter, stacker, painter realizzano metamorfosi comprensibili, i belts trasportano. In Mindeleev il trasporto è autonomo, **non** programmato con conveyor belts.
  Fonte primaria codice/tassonomia: https://github.com/tobspr-games/shapez.io/blob/master/translations/base-en.yaml
- **Osmos** usa movimento fisico, attrazione, repulsione e assorbimento; emettere materia costa materia. Utile per il feeling del volo e per proteggere bilanci fisici.
  Fonte: https://www.osmos-game.hemispheregames.com/
- **The Last Clockwinder**: registrazione/ripetizione di processi per esperimenti iterabili; la GDC 2023 documenta che il replay fu utile anche al testing e debugging. Non copiare la gestualità e i riflessi.
  Fonte: https://gdcvault.com/play/1029182/Independent-Games-Summit-Fixing-Bugs
- Conclusione: la combinazione promettente è **stazioni di trasformazione + routing autonomo per affinità + replay**. Non nascondere tutto nelle leggi numeriche: 3–4 verbi facilmente memorizzabili prima dell'atlante scientifico.

### Architetto del Puzzle — «Le regole prima della sorpresa»
- L'attuale svolta via facce prevalenti ha un legame formalmente geometrico ma **non una affordance intuitiva**. Un buon primo incontro deve consentire: «la forma ha cambiato colore; ora è attratta dal nodo verde».
- Le forme complesse non sono necessariamente riconoscibili al primo sguardo: seed, operatori e palette in Inspector, con preview \`prima → regola → dopo → nuova affinità\`.
- Ogni passaggio è deterministico e ripetibile; audio e poliedri 3D reali sostengono il riconoscimento, non sostituiscono le spiegazioni.
- **Obiezione:** forze simultanee verso tutti i nodi + nascosti parametri di affinità possono essere persino MENO prevedibili delle svolte. Risolvere con prima affinità semplice (palette), poi una seconda dimensione (famiglia/Shape-DNA), forze visibili in preview e limiti al numero di nodi.

### Progettista di Sistemi Emergenti — «Isole = struttura discreta, mare = fisica continua»
- Gli individui named occupano ancore esagonali fisse: un esagono marca **l'indirizzo del nodo**, non una gabbia che dirige il movimento.
- I carrier si muovono nello spazio libero, con accelerazione/inertia/damping/collisioni e possibilità di oscillazioni, overshoot, biforcazioni e pattern caleidoscopici prodotti da **eventi fisici**.
- Le isole sono fisse; **non** è necessario spostare le stazioni spring-mass per ottenere una dance. Nel primo esperimento solo i carrier hanno dinamica continua; spostamento di isole è azione di setup del giocatore.
- **Obiezione:** se il carrier è attratto solo dal più simile, colliderà ripetutamente con la stessa isola o non uscirà da due stazioni in un ciclo. Definire *refrattarietà fisica/temporale dopo collisione*, acquisizione di un nuovo target o esaurimento della stazione, mantenendo legge esplicita e ispezionabile.

### Genetista — «Schema operativo dei semi, ricette come modificatori»
- T (tetraedro senza operatori) = proposta di **tintura**: sostituisce palette del carrier; potrebbe modificare preferenze d'attrazione.
- C (cubo senza operatori) = **assorbimento**: attenzione a distinguere \`carrier\` (può essere consumato) da \`Architron\` nominato (mai distrutto senza semantica chiara/recovery). Energia/DNA trasferiti alla stazione o riserva: no sparizione dal ledger.
- O (ottaedro senza operatori) = **scissione**: due carrier con quantità energetiche distribuite dalla risorsa madre. Possono avere DNA identico, ma non sono *due nuovi individui* né l'energia del genitore raddoppia.
- Stazione con operatori Conway = può applicare una trasformazione/ricombinazione secondo grammatica esplicita (composizione? eredità? fissione sul DNA?); non basta dire “impone gli operatori”: verificare che la generazione della mesh sia valida, che palette/seed non vengano confusi e che il risultato resti dentro i vincoli.
- Dodecaedro/icosaedro **non definiti ancora**; evitare di imporre prematuramente regole a tutte le specie.
- **Tensione:** mappare un verbo su un *seed* è una **regola di gioco scritta a mano**, non una legge dedotta da Shape-DNA. Legittima come chimica fittizia comprensibile, ma non attribuirla alla matematica dei solidi platonici. Ricette geometricamente equivalenti ma con seed originario diverso creerebbero un'eccezione **genetica**: es. \`O\` vs \`dC\` possono mostrare la stessa geometria ma avere diverso verbo se la regola usa il seed. Deve essere comunicato nell'Inspector e mantenuto coerente.
- La forma appresa in \`MindeleevTable\` deve essere nuovamente assumibile con costo/condizione: non implementato nello Sprint19.

### Fisico-Matematico — «L'attrazione non è un criterio di teletrasporto»
Modello minimo, espressione di ricerca e non legge acquisita:
\[
m_i\ddot{\mathbf x}_i = \sum_{j \in \mathrm{isole}}\kappa\, A(i,j)\,w(r_{ij})\,(\mathbf x_j-\mathbf x_i) - \gamma \dot{\mathbf x}_i + \mathbf F_{\mathrm{contact}} .
\]
- \`A(i,j)\` è affinità positiva, **prima palette condivisa** o similarità semplice; più avanti una miscela di distanza geometrica normalizzata e rapporto genetico, con metriche dichiarate.
- \`w(r)\` deve evitare accelerazioni divergenti, non cambiare direzione bruscamente a ogni frame. Il motore con passo temporale fisso integra posizione/velocità; la visualizzazione interpola.
- Non chiamare questa legge rigorosamente “spring-mass”: è una **dinamica smorzata di attrattori**; una molla hookeana pura agisce con forza che aumenta con la distanza dall'equilibrio e può generare oscillazioni, ma va specificato l'equilibrio e la forza. Se si vuole comportamento spring-mass, definire una vera energia potenziale e un equilibrio.
- Energia: se le isole agiscono con forze che cambiano nello stato interno (palette/forma mutata), il campo può svolgere lavoro. Il bilancio deve includere **energia cinetica, potenziale di legame, dissipazione e sorgenti consumate**; la semplice contabilizzazione dello Sprint 18 non è più sufficiente. Evitare energia spendibile inventata dai passi o dalle scissioni.
- Rotazione in-place vietata: cambia solo heading e velocità del carrier, ma i poliedri restano in orientamento canonico.
- Dati di Shape-DNA insufficienti da soli per determinare campo di forza in 2D; una legge affine è un modello ludico separato dalla geometria reale.

### Psicologo del Giocatore — «Semplicità operativa, profondità attraverso ripetizione»
- Quattro cose riconoscibili (forma, colore, incontro, attrazione) sono più insegnabili della deduzione di 60/120/180° dalla faccia prevalente di una forma complessa.
- Il giocatore dispone le isole, formula una ipotesi, prova una scarica, ascolta/guarda, riavvolge, modifica una scelta e ripete; un esperimento **ripetuto con condizioni identiche dà risultati identici**.
- **Obiezione:** una affordance nascosta “cubo = assorbe” resta una convenzione memorizzata, non intuizione fisica autoevidente. Introdurre attraverso una breve scoperta visiva e un Inspector: l’abilità si impara con esempi, non da un manuale universitario.
- Le sorprese valide sono **eccezioni spiegabili** dovute a sequenze Conway equivalenti, stati genetici interni o isole già saturate. Non contraddizioni random.

### Compositore di Sistemi Musicali — «Il percorso è fraseggio; le isole sono nodi sonori»
- La scarsità iniziale di nodi e una scarica di 5 carrier possono produrre **imitazione polifonica**, dissonanze e canoni quando i carrier passano da isole diverse.
- Emissione programmata tipo E(k,n) e riproduzione ripetibile come pattern compositivo; l'Architron ha un **motivo identitario** indipendente dalla sua forma, mentre gli anonimi sono voci secondarie.
- Ogni reazione genera eventi musicali da **unico event log** (tinta, assorbe, scinde, muta, ritorna, fugge); il timbro/pitch non deve costituire un secondo sistema di regole incoerente.
- **Rischio:** 20+ carrier e molte scissioni producono una massa sonora illeggibile. Mixing gerarchico, focus sull'Architron, numero massimo di eventi sonori contemporanei e politmi leggibili.

## 3. Quando parte l'Architron rispetto alla scarica? 3 proposte, una scelta raccomandata per il prossimo test

**V1 — Scarica-prova, stato ripristinato, poi Architron**: i carrier anonimi sono *sonde*. Il giocatore osserva per ricavare una previsione; al lancio dell'Architron si riparte dallo **stesso snapshot** di isole/riserve. Questo è un vero esperimento di previsione. I carrier sonde non guadagnano risorse permanenti nella realtà del gioco; sono simulazione/laboratorio e il costo di informazione va studiato.
**V2 — Scarica come prologo reale**: i primi N carrier anonimi modificano le stazioni, consumano riserve, eventualmente scindono; l'Architron entra dopo di loro nel campo già **trasformato**. Questa è una **preparazione** e non un test valido dello stesso stato iniziale. Strategia molto ricca ma carico cognitivo alto.
**V3 — Architron come una voce della scarica**: il giocatore sceglie in quale posizione inserirlo (primo, terzo, ultimo). Potente per squadre e musica ma troppo ampio come prima implementazione.

**Decisione provvisoria del Team:** testare prima V1, con V2 come controllo. È importante evitare la falsa frase «ho testato la rotta, quindi l'Architron farà la stessa cosa» se il collaudo **ha davvero modificato il campo**. Il ruolo di Architron è \`individualId\` nominato scelto fra 72; non viene creato da una particella anonima o attribuito arbitrariamente al primo/ultimo carrier. Se il pet è inizialmente fra le stazioni, durante il lancio va tolto dalla stazione/aggiornato il ruolo in modo coerente; nel prototipo si può mantenerlo fuori campo fino alla scarica decisiva.

## 4. Che cosa significa 'ritornare alla Sorgente' senza un binario nascosto?

**Problema reale:** se tutte le isole attraggono e la Sorgente non attrae, i carrier possono oscillare indefinitamente fra poche stazioni e non tornare mai; una regola “dopo N incontri torna automaticamente al centro” sarebbe un altro binario invisibile.

Tre possibilità da confrontare:
- Sorgente **attrae sempre debolmente** (campo di background, energia/potenziale finiti), controbilanciando le isole; ritorno come competizione di campi.
- Sorgente porta una **firma di palette/forma** e il carrier deve trasformarsi affinché la sua affinità verso di essa diventi dominante; il ritorno è una costruzione di una configurazione compatibile.
- Sorgente è collettore geometrico raggiungibile solo se traiettoria la intercetta spontaneamente; molte perdite, ma forse troppo rigida.

**Raccomandazione sperimentale:** confrontare 1 e 2, preferendo l'affinità alla Sorgente come risultato **appreso** se le prime configurazioni si dimostrano giocabili. Non aumentare automaticamente ENERGY per distanza percorsa.

## 5. Abbandonare il routing per deflessione è una scelta di design, non una vittoria fisica

Il criterio attuale (numero di lati prevalente della mesh → svolta) è **geometrico ma cognitivamente opaco**. Sostituirlo con forma/colore → effetto è un **miglioramento ipotetico dell'intuitività**, però il prezzo è la natura dichiaratamente **convenzionale** delle regole.
Due possibili grammatiche:
- **G-seed:** il **seme originale nella ricetta** stabilisce il verbo: tetra=tinta, cube=assorbi, octa=scindi; i successivi operatori Conway modificano/filtrano; fenomeno può dipendere dal genotipo invisibile all'occhio. Grande ricchezza di “eccezioni spiegabili”.
- **G-phenotype:** l'operazione dipende dalla **classe geometrica attuale**: a parità di solido si ottiene stessa reazione; per ottenere una funzione distinta occorre un meccanismo addizionale di ricetta/identità. Più leggibile alla prima vista ma perde differenze genetiche profonde.
**Prima prova:** fare G-seed **solo con indicatore seme chiarissimo** e confrontarlo contro G-phenotype in 2 casi equivalenti (O vs dC; C vs ddC). Ciò rivela se le eccezioni sono intriganti o arbitrarie per chi gioca.

## 6. Micro-esperimenti raccomandati, senza implementazione in questa sessione

**I0 — Attrazione di colore (test del movimento):** centro Sorgente, tre isole T di diversa palette, 5 portatori anonimi con stesso DNA e palette, solo tinta e movimenti fluidi. Carriers stessi > traiettorie interpretabili; velocità/forze visualizzabili, replay fixed timestep. Confronto A/B con stesso setup sul vecchio hex routing.

**I1 — Due verbi:** T applica palette, C assorbe. Testare riassegnazione di attrazione dopo tintura, assorbimento, ritorno senza costi nascosti e saldo energetico. Le reazioni possono avere conseguenze anche quando non cambiano la mesh 3D.

**I2 — Scissione:** aggiungere O che crea 2 carrier: verificare rami, no energia duplicata, limiti di numerosità, routing per somiglianza post-scissione. Non cambiare i fissi per ora.

**I3 — Operatori Conway:** aggiungere una stazione aC o dC che impone una ricetta come regola dichiarata e produce vera mesh ricombinata; comparare coppie di genotipi con stesso fenotipo, con Inspector predittivo. \`T\`+palette può essere solo cromia, \`O\` senza operatori può essere scissione identica di genotipo; definire differenza di significato prima di chiamarla fusione.

**I4 — Scarica e pet:** configurazione programmabile di 5 carrier, simulazione annullabile (V1) vs prologo reale (V2), poi un Architron selezionato fra i named, con firma/motivo e MindeleevTable: il pet può usare forme già apprese, nessuna perdita permanente in sandbox senza consenso; prova se la previsione della rotta diventa obiettivo naturale.

**Criteri di kill:**
- Se il routing per affinità produce quasi sempre la stessa isola dominante o cicli di ping-pong, allora la regola non costruisce un puzzle e servono campi locali/condizioni/feedback diversi.
- Se i verb "T tintura, C assorbimento, O scissione" si imparano senza i corpi reali (o l'Inspector risolve tutto), verificare se mesh3D aggiunge davvero una competenza ulteriore.
- Se il confronto con curve di svolta rende più comprensibile il vecchio modello, non rottamare quello vecchio.
- Se l'assorbimento di un named Architron fosse equivalente all'eliminazione del pet, bloccare prima di introdurre la regola senza recupero.
- Se i test sonde modificano il campo senza che il giocatore sappia che non è più lo stesso esperimento, confusione epistemica.
- Se i sistemi sprigionano energia o materia non contabilizzate, errore fisico progettuale.
- Se la sincronia audio dipende dal framerate, test di riproducibilità fallito.
- Se l'attrazione “tra simili” fosse solo una tabella di colori e il fenotipo non avesse alcun ruolo, Mindeleev perderebbe la motivazione della ricerca Shape-DNA: deve restare una dimensione funzionale negli esperimenti successivi.

## 7. Verdetto aperto

Il Design Team si mostra **favorevole a studiare le isole e i viaggiatori fluidi prima di estendere l'attuale Musical Return Reactor**: risolvono verosimilmente due punti deboli (routing non intuitivo, scala 19 celle) e possono produrre poliritmia e interazione caleidoscopica. Non si è dimostrato che “forma/colore → effetto” bastino: i grandi rischi sono le **regole convenzionali presentate come fisica naturale** e l'attrazione continua che forma trappole o percorsi opachi.

**Scelta di metodo:** prima I0, solo colore e dinamica; se produce traiettorie riproducibili e memorizzabili aggiungere una reazione per volta. Tenere il Musical Return e lo Sprint 19 **immutati** come controllo, non cambiare il codice in questa sessione.

**Sintesi:** «Non costruiamo binari su cui far passare forme; costruiamo incontri che cambiano la forma e, cambiandola, cambiano il prossimo incontro». Il giocatore costruisce un'esperienza ripetibile con isole, una scarica di sonde e, quando vuole, l'Architron-pet.
