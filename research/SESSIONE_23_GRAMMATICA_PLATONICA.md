# MINDELEEV — Sessione 23
## Una grammatica di cinque verbi platonici, con DNA Conway latente e isole fisiche

**Data:** 28 ottobre 2026  
**Branch:** \`research/session23-platonic-grammar\` a partire da \`research/session22-islands-affinity-dance\`.  
**Stato:** discussione di game design e proposta falsificabile, **nessuna modifica al codice o alla fisica del gioco**.  
**Design Team:** sette prospettive critiche simulate dall'assistente, **non** sette specialisti indipendenti. Nella comunicazione scrivere sempre il nome dei ruoli **per esteso**.

## 0. Mandato dell'autore

L'autore preferisce **la regola genetica del seme**:
- \`C\` e \`dO\` hanno la **stessa forma cubica** ma possono produrre reazioni diverse perché il loro **seme originale è differente**;
- la differenza latente è **scopribile** attraverso Inspector/strumenti diagnostici, osservazione, replay e storia genetica; è un evento ludico interessante, non una violazione della coerenza della legge;
- i 5 solidi platonici base possono codificare **cinque verbi semplici** combinabili;
- gli operatori Conway dovrebbero arricchire le reazioni in modo **coerente e imparabile**, anziché assegnare una nuova abilità indipendente a ogni ricetta;
- durante il setup le celle esagonali sono **vicine**; al lancio si allontanano animando le isole, liberando un campo continuo di movimento con spring-mass/affinità. Gli individui controller sono tutti named, fra i 72; l'**Architron non è un controller** ed entra nel campo come viaggiatore nominato, potenzialmente dopo una scarica di sonde anonime;
- gli incontri dei portatori possono **aumentare il repertorio MindeleevTable del controller** (e la cronaca) senza modificarne **DNA materializzato o mesh visibile**; invece i viaggiatori mutano DNA/mesh all'istante;
- gli equilibri e le configurazioni affollate sono anche spettacolo; il problema di gioco potrebbe diventare ottenere **un'alta quota di rientri alla Sorgente**, non semplicemente evitare qualsiasi equilibrio. L'ENERGY netta proviene da risorse fisiche finite, non dal tragitto o dal numero di trasformazioni.

## 1. Ludologo: cinque verbi base, una scelta coerente

La proposta di prima grammatica, **non legge geometrica intrinseca**, è:

| Seme (DNA) | Nome breve | Funzione base proposta | Perché funziona come verbo ludico | Stato |
|---|---|---|---|---|
| \`T\` tetraedro | **IMPRONTA** | trasferisce al carrier la propria palette; il carrier cambia attrazione; il controller resta identico | trasformazione osservabile e immediata; 4 facce, primo oggetto da imparare | Candidato forte |
| \`C\` cubo | **COMBINA** | accoglie temporaneamente un primo carrier, attende un secondo geneticamente compatibile, genera un carrier fuso con DNA combinato, bilancio energetico | l'«assorbi» iniziale diventa buffering/fusione, non una torre letale; introduce cooperazione | Candidato con requisito di buffer e timeout |
| \`O\` ottaedro | **SCINDE** | un carrier si divide in due temporanei, ciascuno eredita il DNA salvo modificatori; energia totale ≤ energia madre meno costi | cambia densità, cinematica, polifonia; necessita limite di generazione | Candidato forte |
| \`D\` dodecaedro | **SELEZIONA** | attira/passare soltanto se palette compatibile, respinge o lascia proseguire gli altri; non usa binari | gate, filtro, topologia del campo; in seguito filtri per seme, geometria o Shape-DNA | Candidato forte |
| \`I\` icosaedro | **DUALIZZA** | applica \`d\` al DNA del carrier; modifica la vera mesh secondo dualità di Conway | azione genetica percepibile, talvolta mutazione silenziosa; \`ddX=X\` funziona come legge facile da verificare | Candidato da comparare con alternativa RISONANZA |

**Alternativa per I**, se il "d" è troppo analitico nei primi incontri: **RISUONA**. Uno stato locale potrebbe sintonizzare frequenze/affinità e convogliare energia alla Sorgente senza cambiare la mesh. È però più difficile da spiegare e meno fondato sull'algebra Conway; il Ludologo preferisce iniziare da DUALIZZA e lasciare risonanza a una proprietà emergente del campo o a una fase successiva.

**Perché questa grammatica:** trasformare un attributo (\`T\`), fondere due oggetti (\`C\`), biforcare un oggetto (\`O\`), selezionare (\`D\`), trasformare internamente (\`I\`). È una piccola **macchina alchemica aperta**; la differenza da Shapez è che i carrier **volano liberamente** e che le stesse stazioni sono esseri che imparano. Le cinque funzioni sono convenzioni di universo, non proprietà dimostrate dei solidi.

### Analoghi concreti verificati
- **SpaceChem** usa *waldos* programmabili che spostano reagenti ed eseguono bond/unbond: sono il riferimento alla separazione **trasporto/trasformazione**, ma un waldo segue tracciati espliciti mentre qui la traiettoria viene da forze e DNA. https://www.zachtronics.com/spacechem/ e https://spacechem.fandom.com/wiki/Instructions
- **Shapez** dispone di Painter, Color Mixer, Cutter, Stacker, Shape Analyzer, Comparator e Belt Filter. Gli equivalenti sono trasformazioni di materia e segnali, mentre i nostri verbi sono **associati ai semi** e i percorsi non sono binari. Fonte primaria descrizioni macchine: https://github.com/tobspr-games/shapez.io/blob/master/translations/base-en.yaml
- **Shapez 2**: belt filter confronta segnale con forma effettiva e smista flussi. https://shapez2.wiki.gg/wiki/Flow_Control
- Postmortem di SpaceChem (Zach Barth): il minimo numero di concetti da apprendere nei livelli iniziali era troppo alto; l'autore osserva che introdurre troppe regole prima della comprensione dello scopo ha creato confusione. Questo è un *avvertimento* per la nostra grammatica di cinque verbi: **introdurre un solo verbo per volta**. https://www.gamedeveloper.com/design/postmortem-zachtronics-industries-i-spacechem-i-

## 2. Regola genetica composta: "il seme è il verbo, la parola Conway è il modificatore"

Definizione candidata **esplicita e testabile**, NON valida ancora per tutta l'algebra Conway:

\`StationDNA = W + palette + Seed\`, con \`W\` parola Conway (scritta a sinistra, applicazione matematica da destra a sinistra), e \`Seed ∈ {T,C,O,D,I}\`.

Per un carrier in ingresso \`X\`:
1. Il **seme** della stazione seleziona il **verbo**: imprint, combine, split, filter, dualize.
2. Il verbo produce zero, uno o più **carrier in uscita** o mette una coda in buffer; il controller resta fisicamente della sua forma originaria.
3. I **modificatori** \`W\` della stazione sono applicati come autentiche operazioni Conway alle ricette di uscita, con semantica definita \`outDNA = W(outDNA_base)\`. Il controller può quindi causare un'operazione sul carrier senza mutare il proprio corpo.
4. La palette del controller ha una funzione diretta nel verbo \`T\` e nel filtro \`D\`. Le altre operazioni possono conservarla sul carrier, salvo regola esplicita.
5. L'Inspector mostra \`baseVerb\`, \`W\`, regola attiva, palette, buffer, costo, \`incoming→outgoing\`, e soprattutto le forme reali prima/dopo.

**Esempi diagnostici:**
- \`T\` imprime la palette; \`aT\` imprime palette e aggiunge \`a\` al DNA in uscita, per esempio \`C → aC\`, una vera differenza di mesh; la stazione stessa può apparire un ottaedro pur essendo geneticamente un tetraedro.
- \`O\` scinde il carrier in due figli (copie di DNA, budget fisso diviso); \`dO\` scinde **e dualizza i due figli**. Il controller \`dO\` ha aspetto cubico, ma il suo seme rimane \`O\`.
- \`C\` combina due carrier geneticamente compatibili; \`tC\` combina e poi applica la troncatura \`t\` al DNA di uscita.
- \`D\` filtra (prima solo per palette uguale alla sua), \`dD\` filtra e dualizza *solo i carrier ammessi*.
- \`I\` dualizza; \`aI\` dualizza e poi fa \`a\` al DNA in uscita: esempio \`a(dX)=adX\`. L'ordine è parte della legge, mai implicito.
- \`ddC\` e \`C\` sono stessa geometria per identità Conway, ma hanno parole diverse: una reazione **solo fenotipica** deve vederli uguali, una reazione **genetica** potrebbe produrre figli diversi.

**Importante:** questo è un *sistema di elaborazione del DNA* ispirato all'algebra geometrica, **non la dimostrazione che le trasformazioni Conway siano naturalmente "catalizzate" dal seme**. Le lettere non sono abilità arbitrarie, ma gli operatori matematici reali usati per costruire le nuove mesh. Non introdurre in automatico operatori non computabili, mesh degeneri o DNA senza seed; ogni trasformazione deve superare il parser e avere un numero massimo di operatori.

### Compatibilità della fusione
Non inventare un modo di fondere seed eterogenei: nello Sprint 09 la fusione concatenativa richiede la stessa famiglia di seed e la stessa palette. La stazione \`C\` deve:
- aspettare 2 portatori compatibili in buffer, con singolo ordine di consumo;
- se non sono compatibili, lasciare passare/respingere o eseguire un esito segnalato; **non eliminare il secondo carrier senza spiegazione**;
- sommare energia dopo dedurre dissipazioni/costi; nessun guadagno da DNA concatenati;
- introdurre timeout, recupero e limitazione alla capienza; nessuna coda infinita e nessuna moltiplicazione di named individuals.
La stazione controller registra sempre la coppia incontrata, anche se non si è riusciti a fondere.

### Scissione e numero di portatori
\`O\` in prima versione produce due copie effimere dello stesso DNA. Non è *fissione genetica* nel senso di spezzare una parola in due parti: è una **biforcazione dei portatori**. Il Genetista chiede di tenere queste due operazioni distinte, per non mentire sul contenuto genealogico; la vera fissione genetica dovrebbe spezzare gli operatori secondo una regola specifica. Entrambe possono essere testate in due varianti; non duplicare materia/energia indiscriminatamente.

## 3. I sette esperti: consensi e obiezioni, con nomi per esteso

**Ludologo**: preferisce cinque verbi con soglie di complessità bassa; i wrapper Conway introducono combinazioni e "ricette rare" comprensibili. Inizia solo con \`T\` e \`D\` (tinta e filtro), poi \`I\` (cambio geometrico), \`O\` (rami), infine \`C\` (buffer/fusione). Questo ricorda SpaceChem/Shapez nelle azioni, ma **è più simile alla programmazione tramite affinità** che a una fabbrica con binari.

**Architetto del Puzzle**: veto sulla prospettiva che tutti e cinque i verbi siano introdotti in un unico livello: l'Inspector è uno strumento di spiegazione, non un glossario necessario prima di premere Play. Ogni cambiamento deve poter essere previsto con una sequenza \`vedo aspetto → indizio sul seme → osservazione → controllo Inspector\`. Test "prevedi il prossimo incontro" prima di mostrare il DNA completo.

**Genetista**: stessa forma, seme differente è la base delle eccezioni \`C\` vs \`dO\`; **il primo verbo è scelto dal seed, anche quando l'operazione Conway fa apparire un altro poliedro**. Il controller **named** mantiene forma e identità attuali; la sua MindeleevTable può apprendere le **ricette reali che ha incontrato o generato**, con evento/provenienza. Viaggiatori anonimi cambiano mesh e DNA immediatamente. Architron è named, MA **non controller**, e parte dalla Sorgente come pet dopo probe.
**Rischio**: se "copio qualsiasi DNA incontrato" dà poteri equivalenti senza sforzo, una singola scarica potrebbe riempire la tavola e rendere superflua la sintesi. Apprendimento qualificato: osservato / riconosciuto / assimilato / assumibile sono stati diversi da testare, non aggiungere subito quattro monete.

**Fisico-Matematico**: verifica che \`dO=C\` in Conway, dunque l'apparente paradosso è una dipendenza genetica, non geometricamente derivata. Leggi fisiche distinguere \`reaction(seed, W, incomingDNA, physicalState)\`, non \`reaction(visibleMeshOnly)\`. Se due stati completi identici danno due esiti differenti, simulazione non deterministica o errore. Energia dei viaggiatori, energia cinetica, potenziale di attrazione e stato energetico di stazioni devono entrare nel ledger. Due figli \`E_1+E_2 <= E_madre + E_fonte_consumata\`. Nessun gain per numero di archi, operatori o lunghezza della traiettoria.

**Progettista di Sistemi Emergenti**: la biforcazione \`O\` può creare il caleidoscopio; il \`C\` crea code, colli di bottiglia e sincronizzazioni; \`D\` crea bacini d'attrazione e flussi multipli; \`T\` cambia lo stesso campo su cui i carrier stanno navigando; \`I\` può rendere temporaneamente equivalente una ricetta a un'altra. **Obiezione**: forza attrattiva semplice può bloccare gli agenti a una singola stazione. Necessaria una relazione di incontro/repulsione o condizione di uscita esplicita, senza teletrasporti.

**Psicologo del Giocatore**: la lezione da SpaceChem è *cinque verbi emergenti ≠ insegnarne cinque subito*. Avviare con T + D e guardare come colore causa un nuovo percorso. Poi prova 5 viaggiatori identici e l'Architron; varia una sola condizione, assicura replay. L'eccezione visiva deve essere accompagnata da un ragionamento causa-effetto ricostruibile e da una ricompensa di comprensione, non dal numero di caselle verdi.

**Compositore di Sistemi Musicali**: cinque famiglie di eventi distinguibili, ma **non attribuire automaticamente una nota fissa a ogni seme**: forma e palette possono modificare timbro; \`T\` modifica continuità/colore, \`C\` unisce due voci, \`O\` crea due linee, \`D\` articola pausa/risposta, \`I\` inversione/trasformazione motivica. L'Architron ha motivo proprio, riconoscibile anche quando attraversa operatori; il suo repertorio musicale cresce con la MindeleevTable. Un solo event log governa simulazione, grafica, ENERGY e audio.

## 4. Visualizzazione di setup/esperimento: due scale fisiche, un unico campo

### Setup (board vicino)
- I sink esagonali formano una **griglia raccolta**, utile al posizionamento e alla vista tattica. Ogni controller è un Polytrone named (fra 72) con \`permanentId\`, ricetta attiva, palette, \`MindeleevTable\` e Inspector.
- Il giocatore assegna **controller diversi** ai sink; il ruolo di Architron-pet è escluso dai controller, perché sarà uno dei protagonisti viaggiatori della scarica.
- Nessuna rotazione in-place del corpo; pose 3D canoniche fisse.

### Esecuzione (isole lontane)
- La camera può arretrare e le **posizioni fisiche delle isole possono separarsi** con interpolazione visiva; decidere se la separazione è un'animazione deterministica che definisce un nuovo layout di riferimento (nessun "lavoro fisico" durante setup), oppure un moto reale che costa lavoro. Non mescolare le due definizioni senza avviso.
- I carrier volano fra le isole con equazioni a tempo continuo integrate a passo fisso; non muovono per caselle, il campo conserva posizioni e masse.
- Le isole rimangono punti di incontro; il renderer delle vere mesh mostra metamorfosi dei viaggiatori e *non* modifica il corpo dei controller semplicemente perché hanno imparato un DNA.

**Vincolo UX:** mantenere i legami visivi (ancoraggi, nomi e colori) fra la posizione di setup e quella di esecuzione; una dislocazione opaca può uccidere la prevedibilità, non solo abbellirla. I Polytroni named devono poter essere tracciati anche nella modalità zoom-out.

## 5. Architron non-controller: quando e come viaggia

**Architron** = uno dei 72 **named** selezionati dal giocatore, non una particella anonima, mai contemporaneamente una stazione controller. Per l'esperimento iniziale parte dalla Sorgente con un DNA selezionato dalla sua \`MindeleevTable\`.

Due scenari distinti:
- **Test in sandbox:** si programmano 5 sonde anonime, si simula la scarica e il mondo viene ripristinato da uno **snapshot identico**; poi, separatamente, si manda l'Architron. Le sonde sono virtuali/diagnostiche, non consumano davvero riserve persistenti.
- **Prologo trasformativo:** le 5 sonde percorrono e **modificano davvero** il campo, prima del lancio dell'Architron; la Sorgente/field continua con le riserve e le memorie modificate. Non chiamarlo più "test del medesimo stato": è preparazione.
- **Comparazione:** lo stesso script di 5 sonde, stesso seed random, con reset vs senza reset; la differenza di esito dell'Architron isola il valore del prologo.

Architron può assimilare forme come ogni altro individuo, ha storia personale e una firma audiovisiva; il suo DNA corrente può cambiare durante il volo; torna alla Sorgente per consolidare il proprio repertorio, ma **non esiste bonus ENERGY solo perché è un pet**. Perdere l'Architron non equivale a cancellare l'individuo named: replay, stato da recuperare, eventuale fallimento del rito senza morte irreversibile.

## 6. Named controller: cresce il repertorio senza cambiare aspetto

\`ControllerState={permanentId,name,currentDNA,personalTable(activeFormRecipes,history),location,buffer,energy}\`.
Al contatto, prima di tentare il verbo, appendere un **evento di esperienza** non modificante la mesh:
\`experienced{incomingDNA,incomingPalette,resultDNA?,outcome,carrierId,time}\`.
In seguito, se la condizione di assimilazione è soddisfatta, aggiungere \`resultDNA\` o \`incomingDNA\` alla lista di **forme assumibili** della sua MindeleevTable. La **forma materializzata** del controller non cambia automaticamente per la sola acquisizione; il giocatore potrà selezionare una forma già appresa fra esperimenti o tramite comando e costo definito.
Il controller può aumentare in competenza anche quando non è Architron. Il trasferimento di repertorio fra named (Sessione 20) dovrà spostare **conoscenza attiva**, preservando la cronaca storica.

**Importante:** la selezione dei controller influenza i verbi disponibili e il numero di persone specializzate; possedere molte forme in un singolo named non equivale ad avere molte stazioni operative simultaneamente.

## 7. Equilibrio e scopo di ritorno: separare bello da produttivo

Un sistema con molte traiettorie oscillanti/equilibri può essere **visivamente e musicalmente bello** anche se è economicamente inefficiente. Non cancellare o penalizzare automaticamente i sistemi stabili:
- la vista può continuare per contemplazione e replay;
- la simulazione *economica* deve avere un limite energetico, un termine o una condizione di convergenza, senza loop computazionali illimitati;
- le riserve nelle isole/ambiente sono **finite**, e la sorgente contabilizza solo ciò che rientra realmente;
- la forma, la massa e la quantità di portatori possono cambiare a seguito di C/O, ma la **somma delle energie e del lavoro** è tracciata; incrementi di ENERGY dall'ambiente implicano consumo misurabile delle riserve ambientali o del potenziale degli individui.

Due misure **separate**:
- **rendimento del rito:** energia netta riportata alla Sorgente \`E_ritornata - E_iniettata - E_lavoro_speso\` in rapporto alle riserve consumate;
- **comportamento emergente:** distribuzione di attrattori, frequenza incontri, specie attraversate, pattern di orbite e sincronizzazioni e impronta sonora.
Il giocatore può scegliere di massimizzare ritorno oppure creare una composizione naturale; non premiare direttamente la bellezza con ENERGY.

**Fonte come attrattore da testare**: nessuna regola da gioco obbliga un carrier "purificato" a tornare. Primo test: sorgente debole attrattore sempre presente, secondo test: affinità alla sorgente basata su palette/fenotipo dell'Architron. Quest'ultimo collegherebbe la crescita del pet con la progettazione della rete di ritorni, ma non è ancora dimostrato giocabile.

## 8. Esperimenti minimi richiesti, prima di implementare un grande sistema

**G0 — T + D, un solo portatore:** stessa traiettoria sotto due disposizioni isole, presenza/assenza di ricolorazione e filtro D. Risultato interpretabile da forma/palette senza Inspector approfondito.

**G1 — O/I, vero DNA e poliedri animati:** stesso viaggiatore, collisione con I dualizza \`C→dC\`, O scinde in due figli; budget di due rami conservato. Il giocatore riconosce la metamorfosi; ripetere con \`dO\` visivamente cubico che però scinde e dualizza i figli. Inspector deve spiegare la differenza C vs dO.

**G2 — C, memoria e fusione:** due portatori compatibili colpiscono il medesimo cubo; il primo attende, il secondo attiva fusione, il risultato non crea energia e rispetta seed/palette; buffer scaduto con feedback leggibile.

**G3 — Named histories:** quattro named controller, l'Architron è fra gli altri individui fuori dal campo setup; collidendo le sonde fanno apprendere una nuova forma al controller, che mantiene la mesh visibile; nello step successivo il controller può assumere la forma dalla propria MindeleevTable con costo esplicito. Ruoli e nomi persistono.

**G4 — Probe then pet:** programma 5 anonimi + Architron selezionato. Varia "sonda ripristinata" vs "prologo reale"; stessa geometria di isole, dinamica continua. Inspector permette follow individual carrier e ricostruzione delle decisioni del campo. Audio causale e poliritmia.

**G5 — Comparison with Musical Return:** layout e scars di input analoghi, hex-step con turn proxy vs isole/affinità. I reviewer devono poter prevedere prossima trasformazione/obiettivo dopo 2–3 prove; niente esigenza di inferire formule.

**Kill criteria:**
- Una stazione T recolora ma attrae perennemente il carrier appena tinto: serve risolvere emergenza/uscita con legge di contatto, non nascondere un teleport.
- C trattiene un carrier indefinitamente, perdendo di vista il significato economico e generando lag/computazione: serve un timeout e una decisione esplicita di fallimento.
- O fa esplodere il numero di viaggiatori e la musica; numero max/radix/kinds sotto controllo; l'energia non si duplica.
- Tutti i nodi si comportano quasi allo stesso modo, oppure la sorgente ruba sempre i viaggiatori: nessun puzzle.
- Le apparenti eccezioni sono inspiegabili anche dopo aver guardato l'Inspector.
- Un named controller cambia forma involontariamente quando apprende una nuova ricetta.
- Il pet diventa uno dei controller, duplicando il proprio ID, o prende energia senza fonte.
- Nessun vero rendimento di ritorno perché tutto viene catturato per sempre in trappole.
- Il test non è deterministicamente ripetibile (passo fisso, eventi stabili, nessun ordine di aggiornamento dipendente dal framerate).
- Ritmo musicale costruito solo da note decorative invece che dalla sequenza di trasformazioni.

## 9. Decisione provvisoria

**Raccomandazione del Ludologo:** mappatura iniziale **T imprime / C combina / O scinde / D seleziona / I dualizza**. È il compromesso più insegnabile e generativo; provare **I risuona** come variante solo se dualità non contribuisce al gameplay.
**Consenso degli altri membri simulati:** seme = verbo; operatori Conway = modificatori reali sul DNA dei carrier. Non chiamare fisica del poliedro una legge di gioco convenzionale. Inspector e ripetizione rendono apprendibili le eccezioni C vs dO.
**Sequenza consigliata:** T/D → I → O → C, con colpi ripetuti e prototipo di 2–3 isole prima di un campo completo. Il controller named *impara* dagli incontri senza mutare materialmente; il pet viaggia per ultimo o dopo prova secondo due ipotesi controllate. La scacchiera iniziale è compatta e si espande fisicamente/visivamente in un campo continuo durante la simulazione.

**Nessun motore o UI implementati in questa sessione.** La proposta è registrata per essere verificata contro i quattro esperimenti dello Sprint 18 e il renderer reale dello Sprint 19.
