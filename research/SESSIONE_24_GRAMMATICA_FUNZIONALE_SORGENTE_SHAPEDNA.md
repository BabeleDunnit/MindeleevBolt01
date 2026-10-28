# Mindeleev — Sessione 24: grammatica funzionale, Shape-DNA come campo, Architron-Sorgente
**28 ottobre 2026 — Design Team, discussione e proposta di esperimenti; nessun codice modificato**

**Branch:** \`research/session24-functional-grammar-and-source\` (dal report Sessione 23).  
**Composizione del Design Team:** sette lenti simulate da ChatGPT: **Ludologo, Architetto del Puzzle, Progettista di Sistemi Emergenti, Genetista, Fisico-Matematico, Psicologo del Giocatore, Compositore di Sistemi Musicali**. Non sono sette consulenti indipendenti. Citare sempre per esteso il titolo del ruolo.

## Mandato e correzioni esplicite dell'autore

- Non usare il seme \`I\` per applicare semplicemente l'operatore Conway \`d\`, che è già disponibile nell'algebra: un seme deve avere un vero verbo di flusso.
- Cinque tipi fondamentali ispirati a \`map/reduce/filter\`: **impronta cromatica, fusione, vera fissione del genotipo, filtro, clonazione**. L'operazione chiamata "scissione" nella Sessione 23 era in realtà una clonazione, perché duplicava integralmente il DNA; distinguerle.
- **Seme = verbo; operatori Conway = trasformazioni aggiuntive applicate ai prodotti del verbo**. La natura genetica può essere invisibile nella mesh: \`C\` e \`dO\` sono cubi congruenti ma verbi diversi, da scoprire con Inspector.
- Distanza/affinità delle *forme reali* calcolata automaticamente con **Shape-DNA**, per dinamiche continue spring-mass, attraction field e Boids-like. Oltre a decine di specie, il numero di possibili ricette cresce molto.
- **L'Architron potrebbe tornare alla Sorgente centrale**, come uno dei 72 individui selezionato dal giocatore, non un controller periferico né un viaggiatore tra gli anonimi. **Dalla sua MindeleevTable** il giocatore sceglie genotipi della scarica iniziale e **filtro di rientro**. Quello che ritorna è riassorbito, produce un bilancio ENERGY (solo da riserve finite) e può insegnare nuove forme all'Architron. Il giocatore resta deus-ex-machina; il pet è il centro del dispositivo.
- Gli altri 71 Polytroni sono sempre named con identità, storia e tavola personale, utilizzabili come controller/isole. Solo i viaggiatori temporanei sono anonimi.
- Evoluzione futura da un solo pet a squadre, multiplayer e gilde, senza far dipendere adesso il design da infrastruttura online.
- Audio/videopattern da **unico event log**. Ripetibilità delle scariche ed eventuale programmazione di sequenze restano essenziali.

## 1. Ludologo — nuova mappatura proposta, cinque verbi distinti

| Seme | Verbo | Analogia funzionale (metafora, non identità tecnica) | Semantica preliminare |
|---|---|---|---|
| **T — Tetraedro** | **IMPRONTA** | map | Ricolora il carrier con la palette della stazione; non modifica da sola la mesh. |
| **C — Cubo** | **COMBINA** | reduce/join | Buffera un carrier; su secondo carrier compatibile fonde le parole operatoriali preservando seed/palette e contabilizzando l'energia. |
| **O — Ottaedro** | **SCINDE** | split/partition | Taglia la sequenza Conway in due parole, ad es. \`adC\` a \`aC\` + \`dC\` (taglio interno); i due prodotti hanno seme/palette ereditati secondo regole esplicite. |
| **D — Dodecaedro** | **SELEZIONA** | filter | Verifica un predicato, inizialmente palette; i non ammessi non spariscono, ma restano nel campo/sono respinti/indirizzati per altre forze. |
| **I — Icosaedro** | **CLONA** | flatMap | Produce due portatori con lo stesso genotipo, dividendo energia e potenziale materiale disponibile; non crea due nuovi individui nominati. |

**Motivo ludologico:** esistono tre operazioni a **numero di carrier variabile** (C: 2→1, O: 1→2 ricette diverse, I: 1→2 ricette uguali) e due operazioni unarie (T: modifica attributo, D: lascia passare/seleziona). I cinque verbi generano complessità combinatoria comprensibile, non decine di superpoteri arbitrari.

**Caveat delle analogie:** \`reduce\` in programmazione funzionale è un accumulatore che combina una sequenza intera, non una funzione binaria rigidamente uguale a un C; \`partition\` è spesso uno split di una collezione per condizione, mentre O taglia la **catena di operatori**, e \`flatMap\` può produrre un numero variabile di output. Questi nomi servono per progettare, non necessariamente compaiono nell'UI del gioco.
Riferimenti:
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap

**Dissenso del Ludologo:** la mappa è elegante ma rischia l'overengineering: i cinque verbi non vanno introdotti in un colpo solo. Propone T+D prima, poi O o I, poi C.

## 2. Genetista — semantica di taglio, clonazione e wrapper Conway

**Stazione:** \`stationDNA = W_s + palette_s + seed_s\`; \`seed_s\` sceglie il verbo e \`W_s\` trasforma gli output mediante le operazioni Conway realmente implementate. Se un verbo produce 2 uscite, \`W_s\` si applica separatamente a ciascuna. \`aI\` = clona e applica \`a\` a entrambe le copie (il controller conserva il proprio stato). \`dO\` = scinde e dualizza i due frammenti. Ereditarietà del DNA del viaggiatore in ingresso deve essere specificata senza interpretare le lettere come skill arbitrarie.

**Fissione O:** per input \`adC\` si taglia internamente fra \`a\` e \`d\`, ottenendo \`aC\` e \`dC\`. Questo è uno **split di una sequenza operatoriale**, non una partizione fisica della mesh in due volumi. Un DNA nudo come \`C\` non ha punto interno e **non può subire la stessa fissione**; la stazione può segnalare nessuna reazione/passaggio invariato, come eccezione imparabile. Per un solo operatore, testare esplicitamente se sia consentita una figlia \`C\` vuota e l'altra \`aC\`, oppure se sia richiesta lunghezza >=2; le regole Sprint09 attuali consentono solo tagli interni (\`1 <= cut < ops.length\`).

**Casualità del punto:** pseudorandom seed registrato nel replay per la prova di esplorazione; successivamente preferire un punto di taglio **controllabile da stato, collisione o stazione** per permettere previsione senza esame di matematica. No fissione "random" non riproducibile.

**Clona I:** i genomi figli coincidono; suddividere il budget ENERGY e il numero di pacchetti materiali. Una minuscola perturbazione simmetrica, repulsione fra portatori o altre forze può differenziare i percorsi; evitare di introdurre arbitrariamente energia cinetica o massa. Aumentare il numero di agenti non equivale a duplicare materia o individui.

**Combina C:** ricetta fusione dello Sprint09 richiede compatibilità seed e palette, concatenazione operatori e limiti di profondità. Preservare le ragioni del fallimento nell'Inspector. Il DNA del controller e il suo fenotipo corrente restano invariati durante apprendimento; la sua \`MindeleevTable\` può registrare anche prodotti con esiti falliti/compatibilità.

**Problema aperto:** l'operator chain potrebbe aumentare oltre il limite 4 originale; non rendere input arbitrari validi per sola somma di stringhe.

## 3. Fisico-Matematico — Shape-DNA non è la forza, ma può parametrizzarla

**Fatto verificabile**: Shape-DNA è lo spettro del Laplace–Beltrami su una superficie, una firma geometrica usata per confrontare forme; non contiene di per sé una forza attrattiva o un modello di valenza. Lavoro di Reuter, Wolter e Peinecke (2006): https://www.sciencedirect.com/science/article/pii/S0010448505001867 ; https://graphics.stanford.edu/courses/cs468-08-fall/pdf/reuter.pdf .

Nel repo corrente \`src/experiments/surfaceShapeDNA.ts\` normalizza gli autovalori per area, con FEM cotangente triangolare; \`scripts/build-phenotype-atlas.mjs\` usa un catalogo con soltanto **3 autovalori non nulli** (tante forme possono avere distanze non discriminanti). La distinzione fra identità geometrica, firma spettrale simile e **genotipo** rimane imprescindibile.

**Proposta di ricerca da Fisico-Matematico:**
1. Confrontare firme spettrali soltanto **normalizzate in maniera coerente**: \(d_{\mathrm{sp}}(A,B)\) robusto su un numero sufficiente di autovalori, ad esempio RMS dei log-ratios con pesi e controllo di mesh; non sostituire alla distanza spettrale un'affermazione di congruenza.
2. Scelto un \(d_{\mathrm{sp}}\) adimensionale, ricavare un'affinità *modellata*, per esempio \(a_{ij} = \exp[-(d_{\mathrm{sp}}(i,j)/\sigma)^2]\). È una **legge inventata ma fondata su descriptor geometrici misurati**, non ottica reale.
3. Ricavare opzionalmente una **distanza preferita** \(r^*_{ij} = r_{\min}+(r_{\max}-r_{\min})g(d_{\mathrm{sp}})\), con \(g\) monotona calibrata. La distanza Shape-DNA non è una distanza spaziale in metri e non può diventarlo senza una mappatura di scala.
4. Un modello elasticamente smorzato esemplificativo: \(m_i\ddot{x}_i = \sum_{j\in N(i)} -k_{ij}(|x_i-x_j|-r^*_{ij})\hat{r}_{ij} - \gamma\dot{x}_i + F_{\mathrm{sep}} + F_{\mathrm{source}}\). \(k_{ij}\) e \(r^*_{ij}\) da firme+parametri, con troncamento locale, passo di simulazione fisso, raggio d'interazione finito.
5. **Attenzione capitale:** se il punto d'equilibrio \(r^*\) è fuori dal raggio di collisione, il carrier può fermarsi **prima** di raggiungere l'isola. Distinguere *attrazione verso contatto* da *orbita di equilibrio* oppure gestire una zona d'incontro con una legge dichiarata.
6. Cambiare forma o palette modifica il potenziale di interazione: l'energia cinetica/potenziale differenziale e il lavoro svolto dalla stazione vanno contabilizzati; ENERGY spendibile non nasce dal nulla.
7. Caches e limiti: con migliaia di forme e centinaia di carrier, un grafo completo delle distanze è \(O(N^2)\) in memoria; usare firme precalcolate per catalogo, query nearest-neighbor/top-k, cutoff spaziale e calcolo/caching per nuove ricette. Lo Sprint15 seleziona 36 specie da 84 forme provvisorie su 249 ricette ammissibili; **non** fornisce firma completa per ogni DNA arbitrario generabile durante una scarica.

**Dissenso FE:** troppa dipendenza dai soli 3 autovalori crea isole di differenze immaginarie; testare che la metrica sia sufficiente per rendere diversi i percorsi, ed eventualmente integrare invarianti geometrici aggiuntivi (V/E/F, distribuzione di lati, simmetrie, approssimazioni di inerzia) visibili al giocatore, senza attribuire alla firma spettrale una precisione che non ha.

## 4. Progettista di Sistemi Emergenti — Boids con carattere geometrico

Boids originale di Craig Reynolds nasce da **separazione, allineamento e coesione**, basate su vicini locali: https://red3d.com/cwr/boids/ . Queste sono regole separate da attrazione agli individui named: potenzialmente combinarle produce sciami, vortici e organizzazioni.
**Proposta**: cominciare con *attrazione al controller più affine* + repulsione a corto raggio fra carrier. Aggiungere allineamento/cohesion Boids solo nella seconda prova, altrimenti non sappiamo quali regole generano il pattern. Il campo deve rimanere in piano 2D continuo; la griglia esagonale è solo il dispositivo di setup che si apre in isole.

**Obiezioni:** un unico attrattore o un minimo locale crea ammassi permanenti; se il gioco richiede sempre ritorni, la Sorgente deve essere un attrattore condizionale e non una regola esterna «dopo 10 step torna». Non imporre vantaggio economico agli sciami per motivi estetici. Un equilibrio metastabile può essere spettacolare ma con output ENERGY basso e energia ancora nel campo.

**Cruciale per I clonazione:** se copie identiche partono con posizione/velocità identiche e le equazioni sono deterministiche, seguiranno traiettorie identiche (nessun vero ramo). Serve condizione fisica di separazione coerente, non un impulso casuale gratuito.

## 5. Architetto del Puzzle — l’Architron come emettitore/collettore è un nuovo obiettivo

L'Architron torna **uno dei 72 named** scelto dal giocatore, stabilmente **al centro** e non usabile come controller/isola laterale. La Sorgente è *il luogo/portale* e il Polytrone Architron *la sua interfaccia vivente*, distinguibili nel modello di dati anche se coincidenti sullo schermo.

La MindeleevTable già in MindeleevSpatial permetteva di **assumere** una forma conosciuta. Nuova ipotesi:
- **Emissione**: il giocatore sceglie uno o più DNA dall'insieme delle forme attivamente **richiamabili** dall'Architron; definisce quantità e ritmo dei portatori. Sono anonimi, non copie di individui nominati; la Sorgente investe ENERGY e/o materia/risorsa definita per ogni carrier.
- **Filtro di ritorno**: il giocatore seleziona dalla Tavola un fenotipo/criterio di affinità o un filtro più semplice (palette/seed) per stabilire quali viaggiatori siano accolti quando raggiungono la Sorgente.
- **Trasformazioni/isole**: gli altri 71 individui named, ciascuno con seme, operatori e storia, configurano campo e reazioni. Possono apprendere emanazioni senza cambiare corpo durante il run; tra run possono scegliere forme memorizzate.
- **Ricezione**: un carrier rientrante accettato consegna **energia realmente trasportata** e informazione genetica; può permettere di aggiungere una nuova emanazione alla Tavola dell'Architron, se la legge di apprendimento lo consente. Un carrier rifiutato non scompare gratuitamente: orbita, è deviato, dissipato o raccolto in altro stato contabilizzato.

### Problema progettuale essenziale: evitare il giro a vuoto
Se si emette un genotipo che soddisfa già il filtro, può essere immediatamente riassorbito e il giocatore non deve creare alcuna trasformazione. Alternative da testare:
- un **target di arrivo diverso dal genotipo emesso**, almeno a livello di palette/forma/DNA; il carrier è **inabile al ritorno** finché non ha attraversato un'interazione pertinente;
- due palette/forme selezionate dalla Tavola e/o un criterio di affinità con una finestra; la Sorgente diventa attrattiva solo dopo acquisizione della firma target;
- se la Tavola può accettare soltanto forme già conosciute, il giocatore **non potrà mai apprendere un fenotipo nuovo**. Separare filtro di *richiamo* da filtro di *accoglienza/ricerca*, per esempio soglia di vicinanza a una firma nota, oppure scansione a costo finito di un carrier ignoto.

**Gate:** il giocatore deve riuscire a prevedere che «il mio portatore è di questa forma, dopo l'isola X diventa vicino alla firma della Sorgente e quindi torna», senza risolvere un problema di spettrometria. Preview sotto forma di indicatore semplice di attrazione, direzione e stato del filtro.

## 6. Genetista — identità, crescita e trasmissione

I 72 polytroni continuano a possedere \`individualId\`, nome, DNA corrente, \`MindeleevTable\`, cronaca. Il **ruolo Architron** è trasferibile fra named senza fonderne le identità. L'Architron è l'individuo nominato **attualmente sintonizzato con la Sorgente**; altri named sono controller disposti fra le isole. Gli anonimi trasportano ricette/forma ed energia ma non hanno \`individualId\`.

Distingue sempre:
- \`knownRecipe\` e \`assumableRecipe\` attivamente posseduta vs \`observed\` (passaggio esperito);
- \`species\`/forma geometrica vs \`genotype\`/ricetta Conway;
- \`currentBodyDNA\` del controller (rimane visibile) vs \`newlyLearnedDNA\` in tavola personale (non trasforma automaticamente la stazione).
- L'attività della Tavola deve avere senso strategico: forme richiamabili possono essere **selezionate per emissione** e **come template di ritorno**, non per forza materializzate istantaneamente e gratis come corpi dei controller.

**Dissenso del Genetista:** far coincidere pet e Sorgente va bene purché l'Architron non sia ridotto a un database senza corpo visibile o biografia; scelta del pet cambia effettivamente il repertorio accessibile, il materiale musicale e le condizioni del gioco. Il suo ruolo è speciale, non la sua specie.

## 7. Compositore di Sistemi Musicali — l'Architron come orchestra del proprio repertorio

Programmare DNA iniziali e filtro di arrivo significa **scegliere un materiale musicale di partenza e una trasformazione attesa**. Ogni isola C/O/I/T/D può produrre operazioni strutturali (somma di voci, differenziazione, copia, timbro, selezione) dal log, NON una nota fissa ad ogni seed.
La Sorgente/Architron mantiene motivo identitario; l'arrivo può produrre una trasformazione/cadenza derivata dal genotipo finale, non sempre un accordo di vittoria. Anche i sistemi in equilibrio producono loop contemplabili. Boids e attrazioni possono generare poliritmie con periodi non necessariamente quantizzati ai passi hex.
**Rischio:** centinaia di portatori possono creare rumore. Gestione per gruppi/voci, priorità eventi significativi e replay deterministico; nessun cambiamento della fisica a causa del framerate o BPM.

## 8. Psicologo del Giocatore — scoperta sperimentale e rischio di carico cognitivo

Il gioco deve iniziare con **l'Architron e due isole**, non con il pannello di controllo di 250 specie. Scegli DNA semplice, scegli "che cosa vorrei recuperare", premi Play, osserva traccia e potenziale, aggiusta isola e ripeti. Il piacere sta nel dominio progressivo di un esperimento esattamente ripetibile.
**Obiezione:** una mappa spettrale a 12 dimensioni non è un'interfaccia da far studiare; mostra semmai una scala di affinità visiva e uno strumento approfondito opzionale. Evitare che tutti i criteri (genotype, spectra, palette, ENERGY, target, velocity, seed, music) debbano essere simultaneamente controllati nel tutorial.

## 9. Test suggeriti (senza modificare il motore ora)

**F0 — Architron-Sorgente e filtro**: due DNA nel repertorio personale, una isola T che cambia palette, 3 sonde identiche. L'Architron emette forma A, accetta B (differente) e quindi non può completare subito il loop. Fisica movimento prima banale e prevedibile, ledger, replay. Qui il vero nuovo gameplay è **scegliere emissione e obiettivo**.

**F1 — Affinità Shape-DNA vs solo palette**: due isole fenotipicamente diverse, stesso colore, stessa configurazione energetica. Confrontare forze, traiettorie, percentuale rientro con metrica spettrale (più di 3 modi se possibile). Se la firma non cambia un comportamento riconoscibile, non ha valore ludico nonostante la matematica elegante.

**F2 — Scinde vs Clona**: input \`adC\` su O produce \`aC\`, \`dC\`; su I produce \`adC\`, \`adC\`. Due carrier figli con risorse e energia conservate, condizioni iniziali di separazione fisicamente coerenti. Verificare il caso DNA privo di operatori e l'impatto dei modificatori Conway delle stazioni, come \`aO\` e \`dI\`.

**F3 — Combina e filtra**: con C buffer di due carrier compatibili; D filtro, almeno una situazione in cui il non-ammesso resta a disposizione del campo e può essere trasformato/riammesso. Avoid deadlock con timeout/release del buffer, niente deletions implicite.

**F4 — Flocking + isole**: aggiungere prima separazione locale, poi allineamento, poi coesione da Boids, ciascuno in un esperimento differenziale; distinguere sciami estetici da ritorni efficienti; spiegare perché una configurazione resta in equilibrio.

**F5 — Crescita della Tavola**: un rientro arricchisce il repertorio richiamabile dell'Architron (previa condizione reale), permettendo una nuova scarica che prima non era possibile; il controller named apprende ricetta senza cambiare forma; cambio Architron cambia repertorio, non cancella storie.

**F6 — Event log musicale**: stessa scarica, stesso soundtrack e pattern a parità di configurazione; prime variazioni della Tavola influiscono sul materiale disponibile ma non conferiscono bonus ENERGY. Molti portatori sintetizzati non implicano centinaia di note simultanee.

### Criteri di falsificazione
- Nessun percorso semplice torna senza introdurre automatismi nascosti: schema field/acceptance da ripensare.
- Filtro di ritorno coincide con firma di emissione e non forza alcun incontro: loop triviale, non puzzle.
- Tutte le particelle convergono verso la stessa isola e restano in minima locale indefinitamente: no game.
- Cloni geneticamente identici rimangono perfettamente sovrapposti per tutta la durata, quindi "clona" non apre scelte spaziali.
- La fissione di una ricetta vuota viene venduta come scissione genomica, ma è soltanto cloning: contraddizione verbale da correggere.
- Shape-DNA a 3 autovalori crea false analogie e non differenzia i percorsi; test qualità descrittori prima di definire la legge finale.
- Sequenze Conway non valide o eccessivamente lunghe generano mesh degeneri/performance insostenibile.
- ENERGY netta cresce senza consumo misurabile di riserve/potenziale; errore fisico.
- Il passaggio controller→pet duplica l'identità o il repertorio; errore biologico.
- Le condizioni del gioco non si capiscono dopo 2–3 test senza consultare un manuale: onboarding fallito.

## 10. Verdetto provvisorio della Sessione 24

**Accogliere come nuova ipotesi prioritaria** la matrice **T Impronta, C Combina, O Scinde geneticamente, D Seleziona, I Clona**, con cinque operazioni non ridondanti. È il linguaggio trasformativo primario, i wrapper Conway restano vere funzioni su mesh/ricette. Il **Ludologo** e il **Genetista** sostengono l'analogia funzionale; l'**Architetto del Puzzle** vuole evitare sovraccarico e loop facili; il **Fisico-Matematico** pretende che Shape-DNA sia il descrittore della risposta preferenziale, NON un campo fisico già giustificato; il **Progettista di Sistemi Emergenti** vuole spring-mass/Boids con veri equilibri e moto fluido; il **Compositore di Sistemi Musicali** vuole musica derivata da operazioni e orbite; lo **Psicologo del Giocatore** vuole inizio con due isole e una prova ripetibile.

**L'Architron ritorna al centro come compagno nominato sintonizzato con la Sorgente**, con una MindeleevTable che funge da libreria di DNA iniziali e target di rientro. Nessun carrier anonimo deve diventare automaticamente uno dei 72. Gli altri individui named restano controller. L'esperimento cruciale sarà **fare rientrare un flusso cambiato** senza un comando di ritorno arbitrario né ENERGY gratuita.

**Decisione operativa:** questa sessione registra il confronto. **Non modifica** il Musical Return Reactor né avvia un nuovo Sprint implementativo. 
