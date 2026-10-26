# MINDELEEV — Co-design adversarial, Sessione 06
## Fusione, fissione, equilibrio, automi, DNA e motivazione
**Data:** 26 ottobre 2026  
**Stato:** analisi e ipotesi progettuali; NON playtest né sistema di regole validato.  
**Repository di destinazione:** BabeleDunnit/MindeleevBolt01 — branch isolato research/sprint06-fusion-fission-co-design.  
**Metodo:** cinque prospettive esperte *simulate* in una singola sessione di ragionamento, con quattro round di critica incrociata. Non sono persone o agenti indipendenti che abbiano lavorato in parallelo; le conclusioni sono proposte falsificabili, non risultati di un panel empirico.

---

# 0. Executive decision record

## Ipotesi-guida (accettata provvisoriamente)
**Mindeleev è un gioco in cui il giocatore modifica la struttura di alcuni Polytroni e impara a prevedere come l'intero sistema reagirà alla modifica.** La ricompensa fondamentale non è il numero di particelle o l'esplosione visiva: è un nuovo stato comprensibile, una nuova possibilità strategica e una scoperta riutilizzabile.

## Decisioni di progettazione, non ancora convalidate
- **D1 — FUSIONE e FISSIONE:** le trattiamo come coppia fondamentale di riscrittura del DNA; devono produrre scelte interessanti, non essere due animazioni. La fissione deve chiedere *quale taglio* applicare, almeno dopo il tutorial.
- **D2 — INTERAZIONE:** accostare due Polytroni è un'ottima metafora di fusione; un colpo energetico/cannone è un'ottima metafora di fissione. **Metafore non equivalgono automaticamente a regole.** Confrontare interfaccia diretta e interfaccia a strumenti; evitare attivazioni involontarie.
- **D3 — ENERGIA:** una sola risorsa spendibile, ENERGY. Lo stress delle molle, l'energia potenziale e l'eventuale calore sono quantità del modello, **non ulteriori valute spendibili**. Nessun ciclo fusione/fissione deve produrre guadagno netto illimitato di ENERGY.
- **D4 — DNA:** mantenere distinti sequenza degli operatori Conway, famiglia cromatica/alleli, poliedro regolare di partenza T/C/O/D/I. Tutti e tre devono avere conseguenze ludiche dimostrabili, ma NON inserirli tutti nel primo livello.
- **D5 — FEEDBACK:** anticipazione leggibile, trasformazioni atomiche, spiegazione post-reazione, annulla/ripristina, diario delle scoperte. Esplosioni e danza sono ricompense sensoriali dopo che il giocatore ha capito la causa.
- **D6 — IMPLEMENTAZIONE:** inizio web frontend-only, stato deterministico e serializzabile; renderer Three.js separato dalle regole e dal sistema di animazione spring-mass. Niente dipendenza da Spatial, Unity o backend per il single-player iniziale.
- **D7 — FOCUS:** NON fondere automaticamente Ring Reactor, Discovery Lab, Cellular Mutatron ed Equilibrium Reactor in un solo prototipo. Verificare due modelli minimi antagonisti prima di scegliere il core.
- **D8 — COLLEZIONE E SCIENZA:** la Tavola Mindeleev registra ricette, equivalenze strutturali, discendenze e leggi osservate; non gonfiare la progressione con milioni di combinazioni quasi identiche.

## Consenso e dissenso
**Consenso 5/5:** priorità a causazione comprensibile; fusion/fission entrambe necessarie da testare; colore e seme non devono essere cosmetici; no predatory loops; web first.  
**Dissenso persistente:** lo spazio *continuo* deve essere la meccanica oppure soltanto il renderer di una logica *discreta*? L'Architetto e lo Psicologo preferiscono iniziare dal discreto; Emergenza e Fisico spingono per un esperimento fisico parallelo. Non risolviamo per preferenza: facciamo A/B fra prototipi.

---

# 1. Evidenza recuperata dalle tre repository

## 1.1 Mendeleev (Godot 2D, master)
- PolytronsCannon.gd: RigidBody2D, coppie interagenti, forze da molla con smorzamento e distanze min/max; rilevamento EQUILIBRIUM/CHAOTIC; cannone che lancia un Polytrone con impulso e sottrae una quantità energetica; collasso di coppie mantenute troppo vicine; transizione del nucleo quando il sistema si assesta.
- La distanza desiderata nucleo-Polytrone contiene già **numero di lati e indice del colore**: formula originale approssimativa potenza(lati,1.3)*20 + indice_colore*10. È una prova della precedente intenzione di usare colori e geometria nelle dinamiche.
- Lo stato del Polytrone era [radius, colorIdx, sides]; nucleo, orbitali, colore e forma non erano soltanto pittura.
- Nota: definire un sistema CHAOTIC tramite una soglia di velocità non è diagnosi matematica di caos. Con attrito, incompatibilità geometrica può produrre un minimo di stress diverso da zero e stare ferma. L'orbita persistente non deriva automaticamente dalle molle smorzate.

## 1.2 MindeleevSpatial (Unity / Spatial.io, develop)
- Old/PolytronEngineHexLifeBehaviour.cs: Life su celle esagonali, sopravvivenza con 3 o 6 vicini, nascita con 2; aggiornamento sincrono.
- MutatronEngine.cs Evolve(): una cella confronta il proprio numero politronico con quelli dei sei vicini; se il numero di vicini superiori è pari accumula +2n e sottrae 1 a ognuno dei vicini superiori; se dispari accumula -1. L'algoritmo applica gli accumulatori simultaneamente.
- Su una griglia da 19 celle inizializzata con 0/1/2 per anello, una verifica numerica di questa regola ha ottenuto somma dei numeri 30,30,54,78,66,54 nelle prime cinque evoluzioni e numeri negativi. **Non si può assumere** che il numero politronico sia un'energia conservata.
- BindingManager.cs: separa le variazioni dei *tile recipes* dai cambi di binding degli oggetti, ricostruisce BORN/DIED/STAY/MOVE, sposta i Polytroni con un sistema di attrazione spring-mass. Nella logica del dance, BORN può significare chiamare un oggetto preesistente dal deposito, non crearlo ex nihilo.
- PolyhedronRecipeAlgebra.cs: tabelle sperimentali per operatori e semi (fusioni, scissioni), regole in parte arbitrarie e non dimostrate fisiche.
- PolyhedronRecipeKabbalah.cs: un'altra aritmetica, con somma simbolica in base 6, media dei semi e ripartizione degli operatori; **le due algebre non sono la stessa legge**.
- MutatronEngine.ComputeCrossoverRecipes(): prodotto cartesiano delle sequenze di operatori, palette e solidi iniziali ereditabili; GeneticsManager gestisce partner e ritorno degli oggetti.
- Il sistema visivo di danza è prezioso. La legge dell'automa e la legge della genetica sono ancora da scegliere.

## 1.3 MindeleevBolt01 (Vite/React/Three.js, develop)
- src/polytron/mapping.ts: 20 simboli d'operatore, 5 semi T/C/O/D/I, sequenze fino a 4 operazioni e 10 palette nei codici numerici ordinari; 8.420.050 *codici di ricetta*, non altrettanti solidi strutturalmente unici.
- Le altre palette sono indirizzabili per DNA esplicito, ma il catalogo numerico ordinario non le attraversa tutte. Il cambio cromatico del renderer non è automaticamente un mutamento genetico.
- src/polytron/polytron.ts genera geometrie con polyhedronisme e palette e le consegna a Three.js.
- src/hex/hexGrid.ts e src/hex/hexWorld.ts offrono coordinate assiali / ring-index e posizioni grafiche.
- È presente anche una dipendenza da Supabase in package.json: verificare puntualmente se esiste un uso attivo prima di affermare che ogni componente originale è interamente autonomo sul web. I nostri esperimenti single-player possono comunque funzionare con stato locale e GitHub Pages.
- Attenzione alle ricette non rappresentabili per profondità >4, ai solidi oltre il budget facciale e all'equivalenza geometrica di DNA diversi.

Riferimenti:
- https://github.com/BabeleDunnit/Mendeleev/blob/master/PolytronsCannon.gd
- https://github.com/BabeleDunnit/MindeleevSpatial/blob/develop/Assets/Mindeleev/Scripts/MutatronEngine.cs
- https://github.com/BabeleDunnit/MindeleevSpatial/blob/develop/Assets/Mindeleev/Scripts/BindingManager.cs
- https://github.com/BabeleDunnit/MindeleevSpatial/blob/develop/Assets/Mindeleev/Scripts/PolyhedronRecipeAlgebra.cs
- https://github.com/BabeleDunnit/MindeleevBolt01/blob/develop/src/polytron/mapping.ts

---

# 2. I cinque ruoli e le domande che devono difendere

1. **Architetto del Puzzle (PA):** quale scelta concreta, quali informazioni, quali soluzioni alternative, quali soft-lock e quali puzzle *provabilmente* risolvibili?
2. **Progettista di Sistemi Emergenti (SE):** una piccola legge produce varietà, oscillazioni, collassi, strutture e pattern inattesi senza essere soltanto rumore?
3. **Genetista della Collezione (GC):** colore, solido iniziale e sequenza degli operatori si combinano in eredità interessante e leggibile, oppure in un catalogo gonfiato?
4. **Psicologo del Giocatore (PG):** il giocatore comprende la causalità, ha agency, sente progresso e prova curiosità senza FOMO o grind?
5. **Fisico Ermetico (FE):** qual è il modello astratto, quali quantità si conservano, qual è la differenza fra analogia, definizione matematica e realtà fisica?

La discussione che segue è una simulazione adversarial. Citazioni fra virgolette rappresentano posizioni di design dei ruoli, **non dichiarazioni di consulenti reali**.

---

# 3. Round I — Cosa è davvero il gioco?

**Proposta iniziale SE:** "Il giocatore altera uno stato e guarda una simulazione locale riconfigurare tutto il campo. Pochi parametri bastano a generare una profondità sorprendente."

**Obiezione PA:** "Ma se il campo trova comunque da solo un equilibrio, il giocatore è spettatore. Serve una condizione-obiettivo non banale: produrre una ricetta, allineare una famiglia, evitare una reazione, o rendere possibile uno stato con il minimo di energia."

**Obiezione PG:** "L'esito delle reazioni dev'essere attribuibile a una decisione. Un filmato meraviglioso di 15 oggetti che si scambiano di posto non è feedback comprensibile."

**Obiezione FE:** "Non usare 'equilibrio' come sinonimo di bella disposizione. Sono necessari una funzione di stress, una misura di velocità residua e una definizione di stabilità operativa."

**Obiezione GC:** "Se due Polytroni con forma diversa ma numero simile reagiscono ugualmente, i semi, la geometria e la cromia sono componenti decorative."

### Sintesi del Round I
La **decisione cardinale** è una relazione causale: *modifica deliberata -> trasformazione locale -> variazione delle relazioni -> nuova disposizione -> spiegazione e scoperta*. Almeno un momento deve richiedere previsione umana anziché mera sperimentazione casuale. Il giocatore deve poter capire *perché* una sua operazione ha cambiato lo stato.

**Esito:** bocciato come core il sandbox esclusivamente automatico; mantenuto come modalità libera successiva. Nessun ruolo ritiene attualmente sufficiente una semplice animazione di fisica o Life.

---

# 4. Round II — Fusione e fissione, simmetria e strumenti

## 4.1 Fusione: quando due diventano uno
Tre condizioni concettualmente distinte:
- **vicinanza** (spaziale, continua o adiacenza discreta);
- **compatibilità** (dipendente dal genotipo e da eventuali capacità geometriche);
- **consenso/innesco** (azione intenzionale, con costo di ENERGY).

Fondere alla sola prossimità provoca reazioni involontarie e instabilità degli input. Fondere solo tramite un pulsante annulla il fascino del gesto. **Proposta preferita:** gesto di avvicinamento + anteprima di compatibilità + conferma al rilascio; la vicinanza è un prerequisito di reazione, non un evento automatico irreversibile. In VR il gesto può essere due mani, sul web trascinamento o due selezioni.

**Dissenso SE:** la fusione automatica ai contatti potrebbe generare catene emergenti più spettacolari.  
**Replica PA/PG:** riserviamola a un laboratorio senza conseguenze permanenti o a livelli che la introducano esplicitamente, mostrando la previsione prima del commit.

## 4.2 Fissione: uno diventa due
Problema specifico: *dove* scindere? Una fissione senza scelta del punto di taglio è soltanto una generazione di oggetti. Se la ricetta è, per esempio, **adk05D**, il taglio fra a e d potrebbe produrre **a05D + dk05D**; un taglio diverso **ad05D + k05D**. Le conseguenze combinatorie sono diverse. Queste operazioni tagliano **sequenze d'operatori**, non il solido geometrico come fosse un blocco materiale; questa distinzione va esplicitata.

**Dissenso FE:** non chiamare geometrica una scomposizione che duplica il seme D senza corrispondenza a una partizione volumetrica reale. Si tratta di **algebra ludica delle ricette**, legittima ma da nominare correttamente.

## 4.3 Fusion/Fission invertibili? Un vincolo informativo
La coppia precedente può essere una trasformazione localmente reversibile quando:
- entrambi i reagenti hanno lo stesso seme;
- condividono la stessa configurazione cromatica;
- gli operatori sono semplicemente concatenati in ordine;
- il taglio prescelto è registrato;
- la lunghezza finale e le ricette risultanti sono ammissibili.

Ma **non possiamo fondere arbitrariamente due semi distinti T e I e pretendere una fissione perfettamente inversa usando soltanto un seme risultante fra cinque**: comprimere 25 coppie possibili in 5 simboli perde informazioni. Lo stesso vale per l'ereditarietà cromatica, se due genotipi vengono compressi in una sola palette. O si conserva la genealogia come stato extra, o si accetta una fusione irreversibile, o si limita la compatibilità.

**Decisione MVP:** iniziare con reazioni fra semi uguali e cromie omogenee, così da collaudare le proprietà della manipolazione di sequenze. Nei test genetici successivi introdurre incroci non invertibili ma con regola pubblica, oppure una genealogia esplicita. Non inventare un'invertibilità falsa.

## 4.4 Quattro proposte di strumenti, in competizione
| Schema | Fusione | Fissione | Pro | Contro |
|---|---|---|---|---|
| A: gesti contestuali | avvicina due | seleziona uno e indica taglio | Intuitivo e strategico | Interfaccia disomogenea |
| B: due strumenti | applicatore di fusione | applicatore di fissione | Regole visibili, precisione | Più modalità e click |
| C: gesto + cannone | avvicina | cannone energetico con taglio scelto | Identità scenografica | Mira ambigua, alto costo d'interazione |
| D: collisioni fisiche | urto lento | urto veloce | Eleganza simulativa | Esiti poco controllabili, sensibilità al frame rate |

**Preferenza provvisoria 3/5: A.** Il cannone (C) va comunque testato, perché è un elemento identitario dei prototipi storici. **B** è la condizione di controllo per confrontare ergonomia e tasso di errori. **D** non deve essere il primo modello.

## 4.5 Se il giocatore può trascinare qualunque oggetto ovunque, la posizione non conta
Critica decisiva PA: la manipolazione spaziale illimitata e gratuita fa collassare il puzzle in un menu di possibili coppie. Perciò:
- nel prototipo **discreto**, l'accostamento rispetta celle, percorsi e distanze consentite; gli spostamenti hanno costo deterministico;
- nel prototipo **fisico**, il giocatore non teletrasporta gratis i Polytroni: esercita impulsi/forze o usa un gesto limitato con lavoro/costo espresso e leggibile;
- il feedback di contatto non deve imporre un minigioco di destrezza, a meno che il progetto scelga deliberatamente l'abilità motoria come parte del core.

**Esito Round II:** approvata la coppia fusione/fissione; identificato il maggior rischio di design come la **libertà di movimento non vincolata**.

---

# 5. Round III — Fisica continua o automa discreto?

## 5.1 Modello a due strati, oggetti distinti
**Stato logico**: ID stabile, DNA e genealogia, occupazione o coordinate, ENERGY, regole disponibili, condizioni-obiettivo, turn count, registro operazioni.  
**Motore dinamico**: eventuale tensione fra coppie, velocità, forze, attriti, ricerca di assestamento; aggiornamento a passo fisso se influenza le regole.  
**Renderer**: geometrie polyhedronisme/Three.js, animazione spring-mass, luci, colori, esplosione/reazione, interazione mouse/touch/WebXR.  
**Motore di scoperta**: registra previsioni, osservazioni, identità geometriche, famiglie e proprietà.

Il renderer non determina la verità del gameplay. La fisica può determinarla *soltanto* nel prototipo continuo e dopo aver definito passaggio temporale e risoluzione delle collisioni.

## 5.2 Potenziale per il modello fisico
Una proposta minima per N Polytroni:
U(x) = (1/2) * SOMMA_(i<j) k_ij [ clamp(|x_i-x_j|, dMin_ij, dMax_ij) - |x_i-x_j| ]^2
(o, in una variante più semplice, minima quadratica della differenza dalla singola distanza obiettivo d_ij).

Forza F_i = -grad_i(U) - gamma_i * velocita_i. L'energia cinetica cambia per gli impulsi, mentre lo smorzamento riduce il movimento. **La funzione U non è una valuta e non deve essere necessariamente zero in ogni equilibrio.**

Contraddizioni di distanza generano minimi residui. Esempio: tre desiderata AB=2, BC=2, AC=5 non possono essere soddisfatte simultaneamente, per disuguaglianza triangolare. Cambiare AC a 3 rende ammissibile un triangolo con tutte e tre le distanze desiderate. Anche un sistema incompatibile può stabilizzarsi in un compromesso statico. La definizione di vittoria potrebbe dipendere da tolleranze, non dalla parola CHAOTIC.

Le distanze preferite dovranno dipendere da proprietà reali dei Polytroni: prima distinguere un attributo geometrico verificabile (es. conteggi/simmetrie di facce) e una famiglia cromatica finita; NON usare l'indice della palette come distanza numerica naturale, perché palette 05 non è fisicamente 'più distante' da palette 02 rispetto a 03.

## 5.3 L'«esplosione» globale
Dopo una fusione:
1. la topologia dei legami e le distanze preferite cambiano;
2. il vecchio equilibrio può non essere più un minimo della nuova U;
3. le particelle accelerano verso altre posizioni;
4. il sistema dissipa parte del moto e si assesta.

**Non promettiamo un'esplosione a ogni fusione:** alcuni cambiamenti dovrebbero produrre spostamenti piccoli. Se un livello chiede una riconfigurazione violenta, va progettato con una tensione iniziale e una variazione di vincoli sufficienti. L'eventuale energia aggiunta per motivi narrativi deve essere contabilizzata, non soltanto animata.

## 5.4 Il problema del controllo
PA: con un motore fisico vero, trovare livelli risolvibili richiede ricerca in uno spazio continuo.  
SE: rinunciare alla fisica per controllabilità sacrifica l'originalità.  
PG: l'originalità non vale se il risultato è attribuito al caso.  
FE: simulazioni smorzate con passo fisso, limiti numerici e interazioni controllate sono almeno falsificabili.  
GC: un genotipo deve modificare proprietà misurabili, altrimenti la fisica è un rivestimento.

**Soluzione non consensuale, da testare:** due prototipi indipendenti:
- **A / Chemical Surgery (discreto):** 19 celle, vicinato esagonale, cambi di DNA atomici; spring-mass usato solo per rappresentare vecchio e nuovo stato. La logica è esatta e adatta a ricerca automatica di puzzle.
- **B / Equilibrium Reactor (continuo):** 4–6 Polytroni mobili, 2D fisica vera, impulsi controllabili, distanze preferite da genotipo; nessun automa cellulare né struttura ad anelli obbligatoria. Valutazione della stabilità e delle cause in tempo reale.

**Cellular Mutatron** rimane un esperimento C distinto (fase seguente), non una legge obbligatoria inserita subito in A e B.

---

# 6. Round IV — Octalysis, progressione e rischio di manipolazione

Framework di riferimento: Yu-kai Chou, *Octalysis: 8 Core Drives*. Fonte primaria: https://yukaichou.com/gamification-examples/octalysis-gamification-framework/

**Octalysis è una lente progettuale per interrogare la motivazione, non una prova che un gioco sia divertente.** Le valutazioni che seguono descrivono una *intenzione*, non risultati di misurazioni psicometriche.

| Core Drive | Obiettivo Mindeleev | Funzionalità ammissibile | Cosa rifiutiamo |
|---|---|---|---|
| CD1 Epic Meaning & Calling | Esploratore di un cosmo di leggi e famiglie | Tavola da completare per scoperta, narrazione sobria | Finta autorità scientifica |
| CD2 Development & Accomplishment | Maestria: prevedo e progetto trasformazioni | Sfide con più soluzioni, punteggi opzionali per efficienza | Numeri infiniti da macinare |
| CD3 Empowerment of Creativity & Feedback | Core motivazionale | Creazione/manipolazione + reazione leggibile + laboratorio | Azioni spettacolari prive di agency |
| CD4 Ownership & Possession | Affezione ai propri ceppi e genealogie | Catalogo locale, discendenza, salvare configurazioni | Distruzione punitiva dei Polytroni unici |
| CD5 Social Influence & Relatedness | Condivisione volontaria | Link a puzzle, seed esportabili, soluzioni confrontabili | Multiplayer come prerequisito |
| CD6 Scarcity & Impatience | Molto basso; sfida combinatoria | Budget ENERGY nel singolo livello | Energy refill a timer, attese commerciali |
| CD7 Unpredictability & Curiosity | La legge inizialmente ignota, poi scopribile | Effetti emergenti deterministici, ipotesi e verifiche | Loot box o casualità opaca nel nucleo strategico |
| CD8 Loss & Avoidance | Molto basso | Conseguenze locali reversibili e retry | Perdita permanente, streak, FOMO |

**Mix desiderato:** CD3, CD2, CD7 e CD4 dominanti; CD1 come cornice; CD5 facoltativo; CD6 e CD8 non sono motori di retention. La curiosità nasce da **regole ignote ma stabili**, non da ricompense randomizzate. Compito del PG: distinguere desiderio di tornare a giocare da comportamento compulsivo.

## Viaggio del giocatore
- **Scoperta:** vedo un contatto, riconosco una trasformazione; il gioco non svela ogni legge ma non falsifica il feedback.
- **Onboarding:** una fusione sicura, una fissione con taglio, un livello che richiede entrambe; prima di presentare i colori come geni.
- **Scaffolding:** esperimenti su combinazioni e incompatibilità, obiettivi con alternative, disponibilità di annulla.
- **Endgame:** costruzione di puzzle, esplorazione di famiglie, catalogazione di equivalenze e condivisione; non aggiunta di un secondo contatore di risorsa.

---

# 7. Regole candidate: versione *alpha-minimal* R0–R12
**Sono specifiche per un esperimento, non norme finali del gioco.**

**R0 - Schema.** Ogni Polytrone: id, seed in {T,C,O,D,I}, ops = sequenza ordinata (inizialmente subset {a,d,k} massimo 4), genotype cromatico, posizione, genealogia. Il numero politronico è un *identificatore di ricetta*, NON l'energia.

**R1 - Numero ed equivalenze.** Un codice può identificare una ricetta valida senza identificare un solido unico. Tenere distinti: uguaglianza della stringa, equivalenza strutturale/geometrica e identità dell'individuo.

**R2 - ENERGY.** Unica risorsa spendibile, assegnata all'inizio del puzzle; nessuna rigenerazione per cicli locali. Azioni atomiche a costo intero noto: per test iniziale fusione=1, fissione=1, impulso/spostamento ammesso=1; anteprima, ispezione, annulla e reset non richiedono ENERGY. Questi costi sono una convenzione di gioco da testare, non energia fisica in joule.

**R3 - Fusione.** Nel primo test soltanto due Polytroni vicini/compatibili, stesso seme e stesso genotipo cromatico, sequenza risultante concat(opsA,opsB) nell'ordine scelto; nessun superamento del limite di profondità e nessuna ricetta invalida. Il giocatore conferma intenzionalmente. Due -> uno.

**R4 - Fissione.** Una sequenza di almeno due operatori può essere tagliata in un punto interno scelto; le due ricette risultanti ereditano nel primo test il medesimo seme e la cromia del genitore. Una -> due. Esige collocazione libera o destinazione fisicamente valida.

**R5 - Reversibilità condizionata.** Se c'è spazio e abbastanza ENERGY, riapplicare fusione su due frammenti nell'ordine originale ricrea la stringa iniziale, ma consuma comunque ENERGY. Nessun arbitraggio positivo.

**R6 - Continuità.** Un'azione è decisa e risolta *atomicamente*; prima di mostrare il movimento il motore registra vecchio e nuovo stato. L'animazione non modifica retroattivamente il risultato discreto.

**R7 - Reazioni automatiche.** Nel puzzle iniziale nessuna fusione spontanea al contatto; in un laboratorio successivo le reazioni automatiche richiedono un toggle esplicito e un preview.

**R8 - Prossimità.** Non si trascinano gratis Polytroni attraverso l'intero universo. Nel modello discreto solo vicinanze e mosse ammesse; nel continuo impulsi/prelievi limitati con costi annunciati. Altrimenti la pianificazione spaziale è vacua.

**R9 - Colore.** La palette è parte dell'identità funzionale, distinta dal tema grafico. Prototipo genetico separato: due alleli da tre famiglie simboliche possono produrre sei genotipi non ordinati e fenotipi leggibili. L'incrocio può essere deterministico con una scelta esplicita dell'allele di ciascun genitore. Niente probabilità nascoste per creare scarsità.

**R10 - Seme.** Tutti e cinque i solidi iniziali devono risultare utili in giochi futuri. Preferire regole derivate da signature di facce, conteggi, simmetrie e trasformazioni validamente calcolate; rifiutare un sistema arbitrario T=attacco, C=difesa, ecc. finché non dimostra profondità.

**R11 - Evoluzione automatica.** Può cambiare geometrie/posizioni solo sulla base dello stato precedente completo, con transizione sincrona e log causale. Nel modello continuo usare timestep fisso e criteri operativi di stabilità; niente update dipendente dal render FPS.

**R12 - Sicurezza ludica.** Collezione conservata attraverso salvataggi/blueprint; undo disponibile per analisi e apprendimento; non distruggere progressione per un errore di mira.

## Esempio di trasformazione DNA verificabile come stringa
- Prima: a05D + dk05D, geni compatibili.
- Fusione: adk05D.
- Fissione dopo il primo operatore: a05D + dk05D.
- Fissione dopo il secondo operatore: ad05D + k05D.

**Attenzione:** il processo non è la divisione materiale di un poliedro in frammenti geometrici. È riscrittura dell'espressione generatrice, resa fisica narrativamente dal gioco. Sarebbe irresponsabile inventare una legge geometrica che non abbiamo definito.

---

# 8. DNA, cromia, semi e selezione genetica: divergenza accettata

Il sistema del vecchio Godot aveva colorIdx e sides, con distanze fisiche dipendenti da entrambi. Il progetto Unity aveva tre componenti separabili nella ricetta e una prova di crossover. La versione web ha un parser coerente per ops/palette/seed.

Il Genetista insiste su quattro differenze:
1. **DNA geometrico** = programma di costruzione (catena Conway ordinata).
2. **Genotipo cromatico** = ereditarietà dei colori, non semplice palette scelta dal tema visivo. Un eventuale allele extra va memorizzato come dato d'individuo; può non essere totalmente rappresentato dal codice numerico attuale e richiede una revisione dello schema prima della release.
3. **Fenotipo** = colore e geometria effettivamente renderizzati.
4. **Semi** = condizioni iniziali strutturali che cambiano il risultato di una stessa sequenza d'operatori.

### Tre architetture cromatiche a confronto
- **C1 Palette come gene indivisibile:** 10 varianti, compatibilità binaria. Semplice, ma crossover banale e poche combinazioni.
- **C2 Due alleli in tre famiglie:** A/A, A/B, A/C, B/B, B/C, C/C. Sei genotipi, combinazione deterministica da un allele di ciascun genitore. Perfetto per verificare un incrocio leggibile, ma richiede una codifica nuova oltre il paletteIdx.
- **C3 Composizione continua di H/S/V:** molte combinazioni, ma ereditarietà e leggibilità peggiori; rischio che la cromia sia soltanto un effetto grafico.

**Preferenza GC + PG: C2 come esperimento genetico, NON immediatamente nel core.** C1 può essere il primo proxy nell'esperimento fisico per testare compatibilità.

### Fusione NON è riproduzione genetica
La fusione consuma due individui per generare un nuovo Polytrone (2 -> 1). La riproduzione/breeding può invece generare un discendente mantenendo i genitori (2 -> 3). Sono fenomeni con costi, scelte e significati diversi. Non confonderli per ottenere artificialmente una sola azione. Il sistema di selezione genetica può arrivare *dopo* che la fusione e la fissione hanno dimostrato il loro valore strategico.

### Semina geometrica
Prima di aggiungere cinque classi di abilità, estrarre per ogni solido reale un vettore di caratteristiche calcolato dal motore: V, E, F, istogramma delle facce per numero di lati, simmetrie utilizzabili. Testare se una funzione di affinità basata su questi dati cambia concretamente la soluzione di qualche puzzle. Se non cambia nessuna decisione del giocatore, non è ancora una meccanica.

---

# 9. Confronto finale dei modelli di gameplay

| Variante | Agency | Leggibilità iniziale | Emergenza | Valore estetico | Rischio principale | Decisione |
|---|---|---|---|---|---|---|
| Ring Reactor attuale | Alta | Media | Bassa | Buona | Spostamenti avanti/indietro ripetitivi | Laboratorio di controllo |
| Discovery Lab attuale | Media | Alta | Bassa | Bassa | Mastermind con etichette Conway | Convertire in strato scientifico |
| Cellular Mutatron | Medio-bassa senza interventi | Bassa | Alta | Molto alta | Spettatore di una scatola nera | Tenere isolato per ora |
| Equilibrium Reactor | Da dimostrare | Medio-bassa | Alta | Molto alta | Caos apparente / input incerto | Prototipo fisico B |
| Chemical Surgery | Alta | Alta | Media | Alta con buona animazione | Diventa un editor di stringhe | Prototipo discreto A |

Queste valutazioni sono giudizi qualitativi del co-design, non dati di utenti. La divisione fra A e B è deliberata: **non scegliere il vincitore prima di aver osservato giocatori che provano almeno tre problemi reali in ciascuno**.

---

# 10. Una direzione di gioco più promettente: il laboratorio delle conseguenze

**Core loop candidato:**
1. **Osserva:** Polytroni e loro relazioni, obiettivo e budget ENERGY.
2. **Formula un'ipotesi:** quale trasformazione locale cambierà il sistema in modo utile?
3. **Prepara:** scegli due soggetti o un Polytrone e un punto di fissione; oppure un impulso.
4. **Prevedi:** preview localizzato della legalità della reazione e delle relazioni toccate. Nel tutorial un'anteprima completa del prossimo step; in modalità avanzata l'intero futuro non viene regalato da un pulsante, ma resta simulabile in laboratorio.
5. **Innesca:** paga ENERGY, applica un solo cambiamento deterministico.
6. **Osserva il risultato:** simulazione fisica/animazione, un evento alla volta o in slow motion se c'è una cascata.
7. **Spiega:** delta di DNA, trasformazioni dei vicini, energia spesa, variazione di stress, criterio di vittoria.
8. **Registra:** scoperta nella Tavola, configurazione condivisibile e possibilità di nuovo tentativo.

**Gioco difficile ma non opaco:** le leggi possono essere inizialmente ignote, ma devono essere stabili e inferibili con esperimenti ragionevoli. Una volta scoperte, le loro conseguenze diventano materiale per nuove previsioni. Questa è la funzione più interessante di Discovery Lab.

---

# 11. Specifiche di tre puzzle di carta (non ancora validati con solver)

## P1 — Taglio necessario
Stato: Polytrone adk05D e due destinazioni con richieste a05D e dk05D. Azioni ammesse: fissione con scelta del punto e collocazione di frammenti. Obiettivo: generare entrambe le ricette corrette.  
**Domanda test:** il giocatore capisce che tagliare dopo a è diverso da tagliare dopo d?  
**Rischio:** trivialità; è un tutorial e non prova la profondità.

## P2 — Fusione con perdita spaziale
Stato: a05D, dk05D e un terzo Polytrone che occupa una posizione critica; la fusione a+dk risolve il requisito del DNA ma libera/occupa una cella che altera le possibilità successive.  
**Domanda test:** il puzzle richiede una decisione fra DNA e geometria spaziale oppure si risolve con un click automatico?  
**Criterio:** solver deve trovare almeno due vie legali, una più efficiente dell'altra; i movimenti di semplice andata-ritorno non devono dominare.

## P3 — Equilibrio incompatibile
Tre Polytroni mobili con distanze desiderate AB=2, BC=2, AC=5. Una sola modifica cromatica/strutturale cambia la preferenza AC a 3, consentendo U≈0 entro tolleranza.  
**Domanda test:** dopo aver visto il campo sotto tensione, il giocatore sa inferire quale relazione è incompatibile?  
**Rischio:** se si osserva soltanto un tremolio, la causa rimane invisibile. Mostrare i tre legami e scarto reale/desiderato.

**Nota PA:** questi sono esperimenti da provare, non sei puzzle verificati. Prima di parlare di divertimento abbiamo bisogno di generazione dei livelli, solver per il discreto, simulazioni stabili per il continuo e playtest con umani.

---

# 12. Piano di prototipazione / split-test

## Esperimento A — Chemical Surgery
- Board di 19 celle dal codice web, massimo 4–5 Polytroni, massimo 3 operatori visibili.
- Operazioni: spostamento limitato, fusione per contatto/adiacenza e scelta dell'ordine, fissione per punto di taglio.
- Unica risorsa ENERGY; costi iniziali unitari.
- Animazione spring-mass come strato non autorevole, attivabile/disattivabile.
- Stato e mosse serializzabili, BFS/IDA* per la risolvibilità.
- Tre puzzle che richiedono rispettivamente fusione, fissione, entrambe.

## Esperimento B — Equilibrium Reactor
- Nucleo opzionale + 3–5 Polytroni, vista 2D, forze fra coppie e smorzamento.
- Una proprietà strutturale e una cromatica influenzano davvero k_ij o d_ij.
- Due azioni da confrontare: impulso/cannone e reazione mirata (fusione o fissione). Evitare di introdurre altri comandi inizialmente.
- Misurazioni: U(t), velocità residua, distanze desiderate/reali, stabilità su una finestra temporale.
- Stesso seme simulativo, timestep fisso, undo della *configurazione precedente*, log dell'azione.
- Piccoli puzzle controllati che richiedano transizione da un minimo locale o rimozione di un vincolo incompatibile.

## Esperimento C — Cellular Mutatron (dopo A/B)
- 19 celle; confronto tra Life esagonale, vecchia regola numerica e nuova legge genetica.
- Metriche: estinzioni/saturazioni, cicli, varietà, energia non negativa, numero di effetti spiegabili per reazione, possibili azioni del giocatore.
- Non migrare la vecchia algebra come se fosse dimostrata.

## Test UX comparativo
Per **fissione**, A/B fra:
- selezione + scelta del taglio + conferma;
- cannone che colpisce il bersaglio, con taglio selezionato prima del tiro.
Per **fusione**, A/B fra:
- avvicinamento e rilascio con conferma;
- strumento esplicito che seleziona due soggetti.
Raccogliere errori di mira, azioni annullate, tempi e descrizioni verbali del perché di una reazione.

## Criteri di avanzamento preliminari (target da rivedere dopo pilota)
- Dopo i primi due puzzle, almeno il 75% dei tester sa prevedere una reazione semplice *prima* di attivarla.
- Almeno due terzi dei tester risolvono un puzzle di fusione e uno di fissione senza interventi esterni.
- I puzzle non contengono stati irresolubili non segnalati; undo/reset gratuito.
- Nessun ciclo chiuso genera ENERGY netta; nessuna ricetta generata è invalida o supera silenziosamente il budget del renderer.
- Dopo cinque eventi, almeno il 70% sa spiegare la differenza fra fusione, fissione e riassestamento fisico.
- I playtester devono esprimere una preferenza fra A e B **prima** di vedere la versione VR spettacolare, così da isolare valore meccanico e seduzione estetica.

Tali percentuali NON derivano da dati esistenti: sono criteri iniziali per rendere possibile un test falsificabile.

---

# 13. Rischi aperti, senza nasconderli

**G1 — Piacere estetico vs gioco.** La danza può dare soddisfazione anche se l'azione non ha peso strategico. Mitigazione: playtest con visualizzazione ridotta prima di aggiungere effetti.

**G2 — Troppe regole troppo presto.** DNA + colore + seme + nucleo + orbite + CA + economia + cannone + genealogie rendono il tutorial impraticabile. Mitigazione: uno o due concetti per livello, moduli indipendenti.

**G3 — Fissione come clonazione.** Con un seme duplicato e due individui creati a partire da uno, non c'è alcuna conservazione materiale automatica. Mitigazione: dichiarare che sono *frammenti del programma generatore*, oppure definire esplicitamente una legge di conservazione dei costituenti.

**G4 — Algebre discordanti.** Somma da tabella, aritmetica a base sei, concatenazione di operatori e fusione materiale sono quattro operazioni differenti. Non chiamarle tutte 'fusione' senza specificare l'algebra selezionata.

**G5 — Simulazione non stabile.** Collisioni continue, passi temporali variabili e auto-fusioni producono risultati diversi in browser diversi. Mitigazione: integratore deterministico a passo fisso, saturazione delle forze, tolerance tests, replay.

**G6 — Nuovi geni incompatibili con il codec.** Il codice numerico ora codifica ricette, non un albero genealogico e due alleli indipendenti. Separare codice DNA, genotipo e ID individuo; migrazioni versionate.

**G7 — Poliedri geometricamente equivalenti.** Il medesimo solido può essere raggiungibile con ricette differenti. Distinguere collezione di *scoperte di ricetta* da specie geometricamente uniche; validare equivalenze con invarianti e, quando serve, confronto geometrico.

**G8 — Rarefazione artificiale.** Milioni di possibili DNA non significano milioni di scoperte emozionanti. Evitare che la Tavola diventi un album di variazioni insignificanti.

**G9 — Vincoli fisici fittizi.** Se ENERGY significa punti azione e non joule, dirlo. Se il sistema usa dissipazione, non attribuire a U una conservazione che l'algoritmo non assicura.

**G10 — Progressione predatoria.** Nessun blocco di energia ricaricabile nel tempo, loot box, penalità permanente alla collezione o richiesta implicita di tornare ogni giorno.

---

# 14. Decisioni, dissensi e backlog

| ID | Decisione | Confidenza | Condizione di revisione |
|---|---|---|---|
| D1 | Fusion/Fission coppia strategica | Media-alta | Se i puzzle collassano in editing meccanico |
| D2 | Prossimità intenzionale per fusione | Media | Se il click-tool è più chiaro e altrettanto soddisfacente |
| D3 | Il cannone è candidato UX, non requisito della fissione | Media | Se il gesto di bombardamento aggiunge decisioni reali |
| D4 | ENERGY unica valuta | Alta | Se il modello richiede chiarezza contabile, non un nuovo token |
| D5 | Geneticità colore e funzione del seme | Alta come requisito, bassa sulla legge specifica | Dopo esperimenti A/B e genetici |
| D6 | Due prototipi di core separati | Alta | Dopo evidenza empirica di A e B |
| D7 | Discovery Lab come metodo di inferenza trasversale | Media | Se la deduzione rallenta troppo il gameplay |
| D8 | Il CA non è il motore predefinito | Media | Se C supera A/B in agency e leggibilità |
| D9 | Web first, VR-ready input adapters | Alta | Non serve un mondo virtuale per validare il core |

### Dissenso irrisolto
**PA / PG**: "Gioco discreto prima, spettacolarità dopo."  
**SE / FE**: "Il comportamento fisico potrebbe *essere* il puzzle e perderebbe originalità se precomputato."  
**GC**: "Entrambe le soluzioni sono irrilevanti se nessuna ricetta genetica cambia davvero le decisioni."

### Questioni ancora aperte
1. Che cosa si conserva esattamente in una fusione? Soltanto l'informazione degli operatori, un'entità chiamata 'core', oppure un bilancio fisico?
2. Il numero politronico deve avere ordine periodico e significato di famiglia, o rimanere identificatore computabile?
3. Le proprietà cromatiche sono affinità discrete, alleli trasmissibili, vettori continui, o combinazione?
4. Il seme prevale nella fusione o esistono reazioni cross-seed realmente significative?
5. Il contatto è una condizione sufficiente o serve un innesco esplicito?
6. Che ruolo hanno le rotazioni concentriche se il campo è fisico continuo?
7. L'esplosione è sempre una conseguenza dell'energia interna o un effetto cinematografico con budget separato?
8. Il multiplayer sarà cooperazione scientifica/creazione di puzzle o interazione simultanea nello stesso reattore? Non decidere oggi.
9. Quali esperimenti rendono la collezione significativa senza incentivare grind?
10. Quale parte dell'algoritmo Party Planner originale merita di essere migrata, distinguendo dinamiche della fisica e feedback della mappa?

---

# 15. Conclusione del panel

**La via più promettente non è 'Life con poliedri' né 'Pocket Frogs in 3D' né un clone degli acceleratori.** È un gioco di *manipolazione di leggi locali* dove fusione e fissione modificano programmi geometrici, colore e seme condizionano compatibilità e disposizione, e il giocatore sviluppa la capacità di prevedere reazioni globali. 

Questo punto non è una promessa di divertimento: è la migliore ipotesi integratrice emersa dopo aver contrapposto le cinque esigenze. La priorità scientificamente e ludicamente corretta è metterla in condizione di fallire **presto** e con strumenti misurabili, in due prototipi web minimali.

**Non aggiungiamo un'altra meccanica finché non possiamo rispondere a: 'Qual è la decisione interessante che questa meccanica rende possibile?'**

---

# Fonti e stato

## Codice ispezionato
Repository: BabeleDunnit/Mendeleev (master); MindeleevSpatial (develop); MindeleevBolt01 (develop). Sono stati letti i file esplicitamente richiamati nella Sezione 1; non è stata eseguita una build Godot/Unity né una verifica visiva XR.

## Octalysis, riferimento primario
Yu-kai Chou, *Octalysis Gamification Framework*: https://yukaichou.com/gamification-examples/octalysis-gamification-framework/  
Octalysis Group, *Framework*: https://octalysisgroup.com/octalysis-framework/

## Disciplina progettuale
Il report è una sessione di co-design adversarial, NON una garanzia di giocabilità. Solver, benchmark numerici e playtest sono lavoro da eseguire nei rispettivi rami sperimentali.
