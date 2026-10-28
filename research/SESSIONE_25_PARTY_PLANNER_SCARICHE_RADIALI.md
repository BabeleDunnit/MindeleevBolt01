# Mindeleev — Sessione 25
## Grammatica platonica consolidata, scissione pseudocasuale, Party Planner e scariche radiali

**Data:** 28 ottobre 2026.  
**Branch:** \`research/session25-party-planner-radial-emission\` da \`research/session24-functional-grammar-and-source\`.  
**Stato:** decisioni provvisorie di design e protocolli di prova; **nessun codice di gameplay, motore, audio o renderer modificato**.
**Metodo:** sette prospettive critiche simulate da ChatGPT, non sette esperti indipendenti. Nella risposta scrivere sempre i nomi **per esteso**: **Ludologo; Genetista; Architetto del Puzzle; Fisico-Matematico; Progettista di Sistemi Emergenti; Psicologo del Giocatore; Compositore di Sistemi Musicali**.

## 0. Mandato dell'autore, vincoli accettati

- Preferire **«Colora»** a «Impronta» per il seme T.
- Spostare il **filtro Seleziona all'icosaedro I**. I primi e ultimi dei cinque semi \`T\` e \`I\` non modificano direttamente il DNA Conway nel loro verbo base; i tre centrali \`C\`, \`O\`, \`D\` eseguono trasformazioni del flusso genetico.
- In una reazione impossibile **trasformazione nulla**: il carrier mantiene DNA/mesh/palette/energia, salvo eventuale normale dinamica fisica già in corso; l'Inspector mostra il motivo. Non sostituire con comportamenti gratuiti.
- La **scissione genetica O** taglia un DNA Conway **casualmente**, sfruttando la ricchezza di esiti nella ricerca genetica; si preserva la replicabilità dei test con un PRNG a seme dell'esperimento. \`len(ops)=1\` non offre punto di taglio interno, \`len(ops)=2\` un solo punto, \`len(ops)=3\` due punti, \`len(ops)=n\` \`n−1\` punti.
- Per la fisica preferire **Party Planner** con distanze ideali di coppia, forse simmetrie, più che Boids che tende al movimento biologico di stormi; conservare apertura a effetti di separazione minima.
- Emettere dall'**Architron-Sorgente** sia una **sonda singola** per esperimenti leggibili, sia **scariche simultanee radialmente simmetriche** (inizialmente 6 o 12, accanto a eventuali successioni di anelli) per caleidoscopio, eventi sincroni e musica polifonica.
- Le forme reali sono visibili; 72 named, uno solo è Architron-pet centrale, gli altri disponibili come stazioni; anonimi solo carrier temporanei. \`MindeleevTable\` fornisce DNA iniziali e filtri di ritorno.
- ENERGY finita, mai creata da distanza percorsa, replicazione, qualità di simmetria o eventi audio; distinzione fra spettacolo di equilibri e utile energetico.

## 1. Grammatica consolidata — cinque verbi distinti

| Seme platonico | Verbo semplice | Operazione base | Modifica DNA direttamente? | Inapplicabilità |
|---|---|---|---|---|
| \`T\` Tetraedro | **COLORA** | Assegna palette della stazione al portatore; cambia affinità cromatica, non ricetta di operatori | **No** | Palette già identica ⇒ effetto cromatico idempotente |
| \`C\` Cubo | **COMBINA** | Attende 2 carrier compatibili; fusione di concatenazione di \`ops\` sotto stesso seed/palette (come Sprint09) | **Sì** | Partner assente/incompatibile o limite DNA ⇒ nessuna fusione, con buffer/release espliciti |
| \`O\` Ottaedro | **SCINDE** | Taglia in punto interno pseudocasuale \`ops=a_1...a_n\`, emette due carrier con seme/palette coerenti | **Sì** | \`n < 2\` ⇒ trasformazione nulla, no «clonazione mascherata» |
| \`D\` Dodecaedro | **CLONA** | Due carrier temporanei con identico DNA (e palette), risorse/energia divise | **Duplica informazione, non cambia stringa** | Limite su capienza/energia/materiale ⇒ nulla |
| \`I\` Icosaedro | **SELEZIONA** | Filtra portatori, per palette/affinità o target scoperto; ammesso non si ricombina geneticamente | **No** | Non compatibile ⇒ non trasformato e non cancellato; interazione di campo da specificare |

Il *verbo* si sceglie dal **seme originale** anche quando la mesh visibile è identica a quella di un altro seme (\`C\` vs \`dO\`). **Operatori Conway della stazione** possono modificare i prodotti del verbo, non il verbo di base. Esempio \`aD\` clona un carrier e poi applica \`a\` a entrambe le copie; \`dO\` scinde e applica \`d\` alle due ricette risultanti; \`aT\` colora e poi applica \`a\`; \`dI\` seleziona e poi modifica i carrier *ammessi* con \`d\`, se si sceglie l'applicazione del wrapper ai risultati. La distinzione fra "verbo base non genetico" e "wrapper genetico" è intenzionale.

**Specificare l'ordine del wrapper**: \`W_s(outDNA)\` sulla ricetta risultante, con rigore sugli operatori implementati. Non dichiarare che funzioni come tintura, fusione, filtri o clonazione siano fisicamente dedotte dai cinque solidi: sono la chimica fittizia proposta.

**Definire un unico contratto** \`reaction(stationSeed,stationOperators,carrierDNA,carrierPalette,stationState,energy,seedPRNG) -> output[] + events + ledgerDelta\`; DNA e geometria si aggiornano dopo successi, la trasformazione nulla conserva lo stato se fallita.

### Punto difficile: fallimento di «Combina»
Un cubo che ha in buffer un solo carrier non è una *trasformazione nulla*; è un'**operazione in attesa** con portatore e energia registrati, da liberare secondo una regola a timeout/ripristino dichiarata. Fallimento di compatibilità con secondo carrier non deve distruggere il primo né consumare energia gratuitamente. Non confondere «in attesa» con «fallita».

### Regola cromatica e wrapper
\`T\` con palette identica non modifica il colore. Il team deve ancora scegliere se \`aT\` applica \`a\` comunque a ogni incontro, o solo quando la colorazione ha mutato il carrier: **due protocolli alternativi** da testare, perché la premessa «trasformazione nulla quando impossibile» riguarda una reazione geneticamente impossibile, mentre la ricolorazione idempotente è una reazione possibile ma senza cambiamento. Non appiattire questo caso senza decidere.

## 2. Fissione casuale ≠ esperimento irripetibile

**Genetista:** il taglio casuale è una fonte legittima di diversificazione genetica. Per \`abcC\`: taglio dopo \`a\` ⇒ \`aC + bcC\`; dopo \`b\` ⇒ \`abC + cC\`. Un'unica ricetta di lunghezza due ha un solo taglio interno; \`C\` o \`aC\` non sono scindibili se entrambi i figli devono possedere almeno un operatore. Nessun trasferimento arbitrario di DNA alla stazione.

**Fisico-Matematico:** la riproducibilità dei test richiede fissare *setup, seed del PRNG, identità/ordinalità dei carrier, ordine degli eventi e step fisico*. Una nuova variazione genetica cambia soltanto il seed/draw; replay identico lo conserva. L'algoritmo di PRNG è implementazione deterministica, la scelta del punto è per il giocatore realmente imprevedibile. Non generare randomness a ogni frame per rendering e poi usarla implicitamente nella fisica.

**Architetto del Puzzle:** prevedere gli **esiti possibili**, non sempre l'esito puntuale, è un livello di padronanza legittimo. L'Inspector può mostrare «2 tagli possibili / 2 risultati» e cronologia delle scissioni, senza rivelare il futuro PRNG. Il gioco non deve richiedere la conoscenza del seme pseudocasuale per risolvere il problema.

**Psicologo del Giocatore:** due comandi distinti \`Ripeti identico\` vs \`Nuova variazione\`; il secondo varia il seed mantenendo configurazione e budget. La ripetizione diventa pedagogia e un modo per coltivare famiglie genetiche.

**Interazione con simmetria:** random indipendente nei 6 settori può rompere la simmetria anche partendo con 6 portatori identici; può essere desiderabile come «rottura spontanea» ma non deve sembrare un bug. Testare **random indipendente per carrier** vs **random correlato per gruppi di emissione simmetrica** (senza specchiare artificialmente il movimento): in quello correlato, stessa ricetta su stazioni equivalenti e stesso evento → stessi tagli, quindi preservare meglio la simmetria; in quello indipendente si genera varietà. La randomizzazione diventa un elemento controllabile del protocollo.

## 3. Party Planner — identificazione storica verificata

**Party Planner** di **Rich Gold / Richard Goldstein** fu descritto da **A. K. Dewdney** su *Scientific American*, settembre 1987, articolo *Diverse personalities search for social equilibrium at a computer party*. Gli «invitati» hanno una **matrice di distanze ideali**; il programma originale sceglieva fra **otto celle adiacenti** la posizione che riduceva l'insoddisfazione (quindi **non** era di per sé un simulatore spring-mass continuo). Gold voleva organizzare elementi visivi in un quadro secondo distanze di affinità e osservò la «danza» dell'algoritmo.

Fonti:
- SciAm (documento originale, 1987): https://www.wkbpic.com/wkbx/SA/1987/1987-09-01.pdf — versione PDF grande, non verificata con screenshot: documentata tramite estratti indicizzati; non riprodurre testo esteso.
- Reimplementazione con distanze ideali: https://gist.github.com/wiseman/5eb4ef4114c73f277931
- Biografia autore ISEA: https://www.isea-symposium-archives.org/person/rich-gold/
- Craig Reynolds Boids ufficiale: https://red3d.com/cwr/boids/index.html

**Connessione musicale importante:** Gold fu anche compositore e cofondatore della **League of Automatic Music Composers** nel 1975; questo fa di Party Planner una reference storica particolarmente interessante per Mindeleev, che vuole **algoritmo visivo + musica generativa**, non sonorizzazione decorativa. Verificato su biografia ISEA e profilo Stanford (https://hci.stanford.edu/courses/cs547/abstracts/02-03/021011-gold.html).

**Ludologo:** preferisce Party Planner al modello Boids perché parte da **distanze desiderate**, non da «imitare l'orientamento dei vicini», e può offrire disposizione visiva geometrica interpretabile. Ma Party Planner è *l'ispirazione*, non una promessa che ogni simulazione creerà esagoni cristallini.

**Progettista di Sistemi Emergenti:** prendere una funzione di stress/riposo dalle distanze fra le coppie, adattata come sistema dinamico continuo smorzato e visivamente elegante. Nessuna ricerca di un *animale virtuale* e nessuna steering decision «follow the flock»; solo vicinanza o repulsione secondo forma e parentela.

**Fisico-Matematico:** Shape-DNA fornisce una distanza **spettrale** fra forme, che va mappata a una distanza spaziale preferita \`r*_{ij}\` attraverso una funzione dichiarata. Una metrica spettrale non è di per sé una distanza fisica, non implica attrazione, e i **tre modi non nulli** del catalogo Sprint15 potrebbero non distinguere abbastanza le forme. Testare più modi e caratteristiche geometriche supplementari prima di pretendere un «codice fisico intrinseco».

Schema di ricerca, non legge reale:
\[
U = \frac{1}{2}\sum_{i<j} k_{ij} \left(|x_i-x_j|-r^*_{ij}\right)^2,
\qquad
m_i\ddot{x}_i=-\nabla_{x_i}U-\gamma\dot{x}_i+F_{\mathrm{boundary}}.
\]
Scegliere \`r* = rmin+(rmax-rmin)g(dShapeDNA)\`, con \`g\` monotona e calibrata e collisioni repulsive; integrare a passo logico fisso, log unico di eventi, finitezza di energia potenziale e cinetica. Il potenziale può venire modificato da mutazioni; qualsiasi cambiamento di U corrisponde a energia/lavoro che deve essere contabilizzato.

**Obiezione cruciale:** il minimo di U non è necessariamente una figura regolare. Distanze ideali contraddittorie, condizioni di bordo, posizione delle isole named e mutazioni possono rompere D6. Una figura perfettamente cristallina e completamente smorzata può fermarsi del tutto, senza ritorni né poliritmie. Simmetria ≠ dinamismo.

**Dissenso proposto:** Party Planner come **spina dorsale**, repulsione minima come forma di prevenzione compenetrazioni, eventualmente un termine secondario di allineamento Boids se emergesse un motivo concreto (non introdurre ora Boids integrale).

## 4. Emissione radiale — due modalità entrambe importanti

**Sonda singola:** uno (o pochi) carrier vengono emessi a direzione scelta o fissata; permette di vedere previsioni, metamorfosi, attrazioni e fallimenti; esperienza principalmente analitica. Replay identico.

**Scarica radiale simultanea:** N carrier, posizionati a corona/cerchio intorno al centro e lanciati verso l'esterno con velocità di uguale modulo e direzioni \(\theta_j=\theta_0 + 2\pi j/N\). Proporre inizialmente **6** per compatibilità con simmetria esagonale del board, poi 12; N=3,4,8 possono essere interessanti senza uniformare tutto a D6. Uno **snapshot** per l'anello, costo energetico totale diviso tra portatori, azione iniziale sincrona. Una o più ondate successive possono essere sfasate angularmente per figure musicalmente e visivamente diverse.

**Compositore di Sistemi Musicali:** la simultaneità iniziale crea attacchi insieme; poi i percorsi delle varie forme producono *poliritmie* e ritorni non simultanei. La possibilità di generare «canon» e ensemble è un prodotto della causalità, non un preset musicale.

**Progettista di Sistemi Emergenti:** per una vera simmetria rotazionale fino a \`D6\` servono **anche** stazioni/campi iniziali simmetrici, proprietà e condizioni di collisione equivarianti alla rotazione e scelta dell'offset \(\theta_0\) coerente. Un lancio radiale in un campo di controller non simmetrico NON crea necessariamente un caleidoscopio simmetrico. L'angolo di orientamento della scarica non equivale alla rotazione manuale dei singoli Polytroni, che rimane vietata.

**Genetista:** stesso DNA iniziale per anello per avere simmetria possibile; oppure anelli con DNA diversi per orchestrare una sequenza più ricca. Eventuali semi PRNG accoppiati mantengono stessa fissione per posizioni equivalenti, altrimenti emergenza genetica asimmetrica.

**Architetto del Puzzle:** distinguere chiaramente \`PROBE\` (una traiettoria per capire) da \`BURST\` (sistema collettivo) nella UI. Conservare focus su un carrier selezionabile durante la raffica e possibilità di riavvolgimento senza necessità di riflessi. Lo stesso costo totale per confronto fra singolo e radiale, o almeno un bilancio normalizzato, per evitare risultati ingannevoli.

## 5. Sorgente come centro e filtro: evitare il riassorbimento immediato

L'**Architron** è un individuo named tra i 72, con ID/nome/MindeleevTable e ruolo sintonizzato al centro; non è semplicemente un viaggiatore anonimo. Gli altri named possono fungere da controller/isole, non perdere identità. Emette DNA scelti dalla sua Tavola, poi riassorbe carrier **solo quando soddisfano il filtro scelto** e raggiungono il volume di accoglienza.

**Problema:** se il carrier parte al centro e ha già DNA ammesso, il filtro lo riassorbirebbe subito. Proposta di controllo **geometrico leggibile**: il riassorbimento avviene solo su un **attraversamento dall'esterno all'interno** del raggio di cattura (\(r_{\mathrm{before}}>R\) e \(r_{\mathrm{after}}\le R\), componente di velocità entrante), non per presenza iniziale; il target può richiedere colore/forma differente dalla emissione per rendere necessaria una trasformazione. Non basta un timer segreto di immunità.

**Economia:** ogni pacchetto porta ENERGY finita divisa da budget iniziale; se C fonde o D clona oppure O scinde, energia, materia e lavori fisici devono rimanere bilanciati. Alla raccolta, l'Architron ottiene soltanto energia effettivamente trasportata, eventualmente più lavoro estratto da riserve esterne consumate; nessuna ENERGY per semplice bellezza o ritorno multiplo della stessa energia.

## 6. Posizioni del Design Team, dissensi

**Ludologo:** sostiene la grammatica T Colorа, C Combina, O Scinde, D Clona, I Seleziona e Party Planner. Scegliere 1+6 come due esperienze: imparare una legge e vedere il sistema funzionare. Richiama l'origine artistica e musicale di Rich Gold.

**Genetista:** taglio casuale come vero generatore di diversità, non generatore di eventi non ricostruibili; fallimento reazione nulla; alias fenotipici \`C\` vs \`dO\` legittimamente con verbo seme diverso. Attenzione a \`aT\` che può operare DNA anche se T di base non lo fa.

**Architetto del Puzzle:** gradisce tutti i mutamenti, ma vuole prova che la complessità non esploda. Richiede una modalità \`1 viaggiatore\` e una \`6 viaggiatori\` su stesse condizioni, con seme PRNG fissato e Inspector predittivo.

**Progettista di Sistemi Emergenti:** Party Planner offre potenziali simmetrici ma non simmetrie garantite. Vivamente favorevole al lancio radiale, purché le simmetrie siano conseguenza della geometria e della fisica, non un motore di particelle che copia artificiosamente 6 immagini.

**Fisico-Matematico:** accetta il taglio casuale **purché la distribuzione sia dichiarata e il PRNG registrato**, un evento impossibile produca trasformazione nulla; mantiene dissenso sulle simmetrie promesse e sul trasferimento energetico del nuovo potenziale dopo mutazione.

**Psicologo del Giocatore:** «ripeti identico» e «nuova variazione» devono essere due azioni intuitive; il pet Architron e il ritorno restano motivazioni emotive, senza chiedere studio di autovalori.

**Compositore di Sistemi Musicali:** simultaneità radiale = polifonia d'origine, divergenze = contrappunto; ripetizione con lo stesso seed produce lo stesso pezzo; variazioni del seed cambiano anche partitura ma non fanno cambiare fisica in base a BPM o frame rate.

## 7. Micro-esperimenti raccomandati (NON implementati)

- **R0: geometria dell'emissione**: 1 carrier contro 6 simultanei (e poi 12) stesso DNA e stesso budget totale. Campo senza controller, poi 6 controller simmetrici e 6 asimmetrici; misurare quanta simmetria rimane e se si osserva la formazione di cristalli/orbite.
- **R1: Party Planner vs Boids**: stessi individui, firme Shape-DNA e seed; A distanze preferite+smorzamento, B Boids classico, C Party Planner+repulsione minima. Confrontare simmetria misurata, cicli di equilibri, frequenza di ritorno e leggibilità.
- **R2: split pseudo-casuale**: O con DNA a 1, 2, 3, 4 operatori; verificare fallimento nullo e 1/2/3 tagli possibili; replay identico, nuova variazione, indipendente vs random condiviso su anello.
- **R3: grammatica completa**: T/C/O/D/I con stesso DNA ma forme operative diverse se seed diverso e alias di mesh \`C\` vs \`dO\`; Inspector mostra seed, verbo, varianti, motivazione del fallimento. Clonazione e scissione differenziate visivamente e contabilizzate.
- **R4: ritorno alla Sorgente**: filtro di rientro inizialmente incompatibile con emissione, modificabile per incontro T; attraversamento dall'esterno con condizione entrante, confronto 1 vs 6. Verificare che attrazione e trasformazione rendano possibile il ritorno senza hardcoded homing.
- **R5: audio e memorie**: lo stesso log serve note/voce pet, metamorfosi e rendimento, controller named impara emanazioni pur restando nella propria forma attuale; riproducibilità.

**Kill gates:** errore nel ledger, fissione che clona invece di dividere, micro-reazioni non equivalenti al replay, una sola attrazione dominante che blocca tutto, simmetrie artificiose senza corrispondenza con il campo, musica decorativa non causale, 6 carrier sempre simultanei senza differenze nei tempi di collisione, filtro che ricattura il portatore senza alcun viaggio.

## 8. Conclusione operativa

**Stato registrato:**
- T = **Colora**, C = **Combina**, O = **Scinde**, D = **Clona**, I = **Seleziona**.
- Reazione impossibile → **trasformazione nulla** (tranne stato di buffer C separato).
- Scissione → taglio **casuale** ma esperimento riproducibile tramite PRNG e seed conservato.
- Party Planner, letteralmente basato su **distanze preferite** e storicamente legato a Rich Gold, è la prima scelta concettuale rispetto a Boids. Adattare il movimento discreto originale a una dinamica spring-mass continua è una scelta di progetto, non una funzionalità originale già presente.
- Architron-Sorgente → emette sia sonda singola sia anello radiale simultaneo, con DNA dalla MindeleevTable e filtro di rientro; altri 71 named come stazioni e gli effimeri come particelle.
- Serve confermare con test che le distanze spettrali e i setup radiali producano pattern effettivamente estetici e rientri possibili, senza trappole o vantaggi energetici non conservativi.

**Non modificare il Musical Return Reactor per questa review.** Preparare eventuale nuovo branch di esperimento soltanto per una successiva richiesta implementativa.
