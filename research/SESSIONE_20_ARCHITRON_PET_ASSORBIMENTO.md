# Mindeleev — Sessione 20
## L'Architron come pet del deus-ex-machina, memoria trasferibile e costo della perdita

**Data:** 28 ottobre 2026. **Branch:** \`research/session20-architron-pet-memory-transfer\` derivato dalla Sessione 19.  
**Stato:** ricerca di design, **nessuna meccanica implementata** in questa sessione.  
**Metodo:** sette competenze critiche simulate da ChatGPT, non sette specialisti esterni. ChatGPT agisce da portavoce. Citare **per esteso** i nomi dei ruoli nelle comunicazioni all'autore.

## 0. Correzione dell'autore: nuova premessa

Il giocatore **non è più Architron** nel senso di avatar incarnato. Resta **deus-ex-machina**, progetta il Mutatron e prepara il campo; sceglie uno dei 72 Polytroni come **Architron**, un compagno/pet privilegiato, uno dei protagonisti dei fenomeni ma non l'unico. Lo scopo possibile è **crescita dell'individuo** e del suo repertorio di emanazioni, invece del solo incremento della ENERGY. Lo stesso tipo di crescita è possibile per gli altri 71.

L'autore accetta che **collezionare DNA/specie** entri nel gioco come effetto collaterale desiderabile dell'evoluzione del pet (riferimento Pokémon) e propone **assorbimento**: trasferire l'intero contenuto della \`MindeleevTable\` di un Polytrone a un altro, con **perdita reale** della tavola del donatore (Octalysis: Core Drive 8 Loss & Avoidance). L'Architron deve rimanere riconoscibile nel caos caleidoscopico anche quando è «uno di tanti». Chiarire la differenza fra Architron e gli altri individui, e fra questi e i viaggiatori anonimi.

## 1. Accordo di base: distinzione di entità

- **Sorgente**: cella centrale, partenza/ritorno dell'energia e luogo di sincronizzazione, non un essere vivente né necessariamente un magazzino senza fine.
- **72 individui**: numero finito di entità singolari con \`permanentId/sealNumber\`, nome, \`activeDNA\`, eventuale posizione, \`MindeleevTable\` personale. Tutti hanno identità, storie e possono crescere. Alcuni possono essere poco noti al giocatore: *non anonimi nel modello di dati*.
- **Architron**: ruolo di **un solo individuo dei 72**, il prediletto/compagno attuale scelto dal giocatore; può essere trasferito fra individui senza copiare storie. \`architronIndividualId\` separato da \`individualId\`. Nessuna specie "Architron" speciale, nessun bonus magico di legge fisica basato sul ruolo.
- **Portatori temporanei**: particelle/viaggiatori effimeri, privi di identità personale persistente, con stato genetico e energetico; questi sono veramente **anonimi** e possono essere numerosi (ma in numero finito per impulso), alimentando Lemmings/Tower Defense e il caleidoscopio.
- **Species / Phenotype Atlas**: insieme globale di classi geometriche/forme e ricette possibili. Non è la tavola di un singolo individuo.
- **Ricetta**: DNA Conway; non equivale a una specie né all'identità del suo portatore.
- **MindeleevTable personale**: archivio di emanazioni di un singolo individuo, con una componente **attiva** (repertorio trasferibile/riutilizzabile, i poteri sono ancora da definire) e una **cronaca storica immutabile** (biografia/provenienza). La separazione è una decisione di ricerca da testare, non ancora presente nel codice Unity.

**Verifica storica reale:** \`Assets/Mindeleev/Scripts/Polytron.cs\` contiene \`private MindeleevTable mindeleevTable\` per individuo; \`Assets/Mindeleev/Scripts/MindeleevTable.cs\` contiene emanazioni uniche associate a ricetta e numero polytronico; \`MutatronEngine.SetNewArchitron\` consente di trasferire il ruolo senza cambiare l'identità del Polytrone. Il metodo \`AddEmanation\` originale **altera anche l'aspetto visibile** passando alla nuova ricetta: un futuro trasferimento di memoria **non deve** invocarlo indiscriminatamente, altrimenti si trasformerebbe anche il corpo senza costo. Preferire una operazione dominio \`transferRepertoire\` distinta da \`setActiveDNA\`.

Fonti:
- https://github.com/BabeleDunnit/MindeleevSpatial/blob/develop/Assets/Mindeleev/Scripts/MindeleevTable.cs
- https://github.com/BabeleDunnit/MindeleevSpatial/blob/develop/Assets/Mindeleev/Scripts/Polytron.cs
- https://github.com/BabeleDunnit/MindeleevSpatial/blob/develop/Assets/Mindeleev/Scripts/MutatronEngine.cs

## 2. Sette prospettive e vere obiezioni

### Ludologo — Dall'ossessione del Pokédex alla crescita di un compagno
L'idea più utile di **Pokémon** è il legame fra collezione, identità individuale e sviluppo; ma Mindeleev può dare più valore all'incontro e alla trasformazione che alla checklist delle forme. **Chao Garden di Sonic Adventure 2** è un modello particolarmente pertinente: le creature crescono/cambiano aspetto e personalità in relazione a chi le cura, diversamente dal Pokédex come elenco di specie.
Un altro precedente è **Wobbledogs**: creature con corpi e geni mutevoli, con un sistema di storia genetica, non soltanto cattura di esemplari.
**Shin Megami Tensei V** offre precedenti concreti di fusione e trasferimento di competenze (essence fusion) come costi per rafforzare il roster. Distinguere rigorosamente dalla proposta Mindeleev, che trasferirebbe *interi repertori di ricette* e non singole abilità predefinite.

**Obiezione:** il pet potrebbe ridursi a un contatore \`#DNA\`, replicando la collezione compulsiva che cercavamo di evitare. «Crescere» deve aprire **nuove scelte e comportamenti visibili**, non solo incrementare un totale.

Fonti:
- Chao Garden ufficiale Sega: https://sonic.sega.jp/sonicadv2/0601/shots_e.html
- Wobbledogs: https://wobbledogs.com/ ; patch storia genetica: https://steamcommunity.com/games/1424330/announcements/detail/3394051164697862148
- Shin Megami Tensei V, Nintendo guide: https://www.nintendo.com/au/news-and-articles/brave-the-netherworld-with-these-shin-megami-tensei-v-newcomer-tips/

### Architetto del Puzzle — La crescita deve creare una scelta, non un obbligo
Approvato il ruolo deus-ex-machina: disponi il campo, scegli quali individui impiegare, osservi, intervieni fra le scariche (mai su un timer di riflessi).
Per assorbimento confrontare due strategie *reali*:
1. **Specializzazione distribuita:** mantieni due Polytroni con forme/repertori differenti su più sink; maggiore numero di relazioni, risonanze e capacità simultanea.
2. **Concentrazione:** trasferisci il repertorio del secondo all'Architron; guadagni possibilità di sintesi/riattivazione in un unico individuo, ma perdi il donatore come specialista autonomo.
**Kill criterion:** se assorbire è sempre la scelta ottima, non è un puzzle ma un pulsante automatico; se è sempre sbagliato, è narrativa non gameplay.

### Genetista — Non confondere memoria, genotipo corrente e identità
\`permanentId\`, \`name\` e \`activeDNA\` sono indipendenti dal repertorio. Il donatore **non muore** né perde la forma già materializzata nell'operazione di trasferimento: perde **accesso alle emanazioni attive** che ha ceduto. Conserva la cronaca (dono, perdita, destinatario e forme che un tempo aveva vissuto), quindi la perdita è funzionale ma la biografia rimane vera. Può apprendere di nuovo: il costo consiste nel ripetere trasformazioni o trovare nuove vie, non una cancellazione arbitraria di file.
**Rischio:** la MindeleevTable storica non aveva due livelli. Sarebbe un ampliamento intenzionale del modello dati; non attribuire al codice del 2026 ciò che non implementa.
**Altro rischio:** un repertorio grande non può permettere materializzazioni istantanee arbitrarie ignorando l'algebra Conway. La tavola deve rappresentare *possibilità di richiamo/sintesi* soggette a risorse/costi, da definire, non 1000 forme gratuite.

### Psicologo del Giocatore — Il costo emozionale non deve diventare estorsione
Octalysis distingue **Core Drive 4 Ownership & Possession** e **Core Drive 8 Loss & Avoidance**. Entrambi possono convivere nel pet; CD8 è fra quelli "Black Hat", da usare con parsimonia e piena leggibilità.
- Offrire anteprima **prima** dell'assorbimento: cosa riceve A (novità effettive), cosa perde B, quali forme sovrapposte non danno vantaggio.
- Nessuna pressione temporale, FOMO, predazione casuale di un Polytrone amato.
- Possibile reversibilità onerosa attraverso recupero/reapprendimento, non undo completamente gratuito né perdita definitiva opaca.
- Non premiare moralmente assorbimento vs cooperazione; permettere scelta affettiva.

Fonte Octalysis originale: https://yukaichou.com/gamification-examples/octalysis-gamification-framework/

### Progettista di Sistemi Emergenti — L'assorbimento può impoverire il caleidoscopio
Un solo Architron onnipotente e altri 71 svuotati = **monocultura**: perdiamo differenze locali, incontri, simmetrie, relazioni e poliritmie. Gli individui specializzati possono generare pattern corali che un solo archivio concentrato non realizza in simultanea.
**Ipotesi desiderabile:** il sistema ha qualche proprietà di **cooperazione non riproducibile** da un unico individuo; dipende da simultaneità, posizioni e interazioni, non da bonus numerici di molteplicità. Ogni Polytrone usa soltanto una forma materiale alla volta; possedere 40 emanazioni non equivale ad avere 40 generatori distribuiti nel campo.

### Fisico-Matematico — Nessun "valore" creato sommando ricette
Un insieme di ricette non è energia fisica. La crescita personale può essere misurata con:
- **repertorio**: numero di emanazioni *distinte* disponibili, ma senza premiare duplicati;
- **copertura spettrale**: varietà geometrica delle forme (Shape-DNA) nello spazio fenotipico, da calcolare su spettri coerenti/accurati;
- **possibilità funzionali**: quali classi di trasformazioni/campi diventano accessibili con i Polytroni e le risorse attuali;
- **storia**: eventi e cammini personali (non riducibili a un punteggio unico).
**Queste dimensioni NON devono essere sommate a un unico livello di "illuminazione".**
Conservazione del repertorio trasferito: se \`M_A\`, \`M_B\` insiemi di forme attive, \`M_A' = M_A ∪ M_B\` e \`M_B' = ∅\`; eventuali duplicati rimangono un solo elemento, con doppia provenienza. L'operazione non aumenta il numero di token unici disponibili globalmente. Non usare formule di ENERGY tratte dalla cardinalità dell'insieme.
L'Architron non è un individuo matematicamente più potente *in quanto Architron*: è selezionato per un **rapporto con la Sorgente e il giocatore**, eventualmente con una capacità speciale di sincronizzare/registrare il ritorno, conferita dal ruolo e trasferibile con esso.

### Compositore di Sistemi Musicali — Il pet ha una voce, la popolazione è un coro
L'Architron resta distinguibile per un **motivo/voce identitaria** anche quando cambia forma. Il DNA/fenotipo cambia timbro, armonizzazione e fraseggio; la persona musicale rimane riconoscibile. Gli altri individui hanno voci proprie e possono costituire reti/poliritmie.
**Absorb come evento compositivo:** il destinatario acquisisce **materiali tematici trasformabili**, il donatore perde una parte di repertorio attivo ma non la propria identità timbrica. Non associarlo obbligatoriamente a una tromba di vittoria o a un silenzio punitivo; testare esiti commoventi, inquietanti o gioiosi.
**Rischio:** 72 leitmotiv indipendenti simultanei diventano rumore. Ascolto gerarchico: Architron in primo piano, sistema e portatori ai livelli secondari, mix dinamico non una moltiplicazione di sintesi.

## 3. Definizione di "perché lui è lui"

Proposta preferita del Team:
- L'Architron **non nasce come specie speciale**, non è più complesso, luminoso, veloce o migliore per diritto di nascita.
- Il giocatore ne sceglie **uno** e stabilisce un rapporto privilegiato: lo riconosce per nome e sigillo, lo segue e ascolta, custodisce la sua tavola personale, gli offre opportunità di crescita.
- La Sorgente riconosce l'individuo **attualmente associato** al ruolo: può **sintonizzarsi**/completare cicli e rendere visibile il proprio ritorno. Le specifiche energetiche di questa sintonizzazione sono ipotesi, NON privilegio di generazione gratuita.
- Architron può essere scambiato liberamente o a condizioni da decidere con un altro dei 72. **Cambio di ruolo ≠ trasferimento delle MindeleevTable.** L'individuo precedente conserva storia, memorie, forma e possibilità.
- Riconoscibilità visiva: alone/anello coerente, un segno di identità persistente, posizione o trail unico, camera/lighting ma nessuna rotazione in-place; riconoscibilità sonora: motivo personale. Evitare UI che oscuri sciami/caleidoscopio.
- **Anonimi** soltanto i carriers effimeri, non i restanti 71 individui nominati; gli altri possono restare "sconosciuti" narrativamente finché il giocatore li incontra.

**Sintesi:** l'Architron è unico nella **relazione** con chi gioca e con la Sorgente, ma non nelle leggi naturali del suo corpo.

## 4. Il nodo da risolvere PRIMA del prototipo: che cosa trasferisce una MindeleevTable?

Il contenuto Unity originale: insieme di ricette \`recipe → polytronicNumber\`; quando si usa \`AddEmanation\`, il Polytrone acquisisce la nuova ricetta, mostra la forma e incrementa uno score di complessità. Nel nuovo mondo distinguiamo:
1. **Genotipo materializzato:** la forma corrente del Polytrone, non viene alterata dal trasferimento della tavola.
2. **Repertorio richiamabile:** ricette/capacità di evocare o sintetizzare fenomeni, senza bypass di risorse/ricombinazioni del gioco.
3. **Cronaca personale:** sequenza di DNA e incontri che l'individuo ha avuto, anche se il repertorio viene trasferito.

Se in realtà la MindeleevTable fosse SOLO una cronaca senza alcuna capacità di riutilizzo, assorbirla sarebbe principalmente un gesto narrativo. Prima di farne la meccanica di crescita fondamentale definire **almeno un effetto di disponibilità di una emanazione** che cambi una decisione concreta nel campo, coerente con la geometria.

### Semantica di trasferimento proposta (non codificata)
\`transferRepertoire(donorId,receiverId)\`:
- validazioni: ids differenti, entrambi individui esistenti, roster stabile ≤72, condizione energetica o di incontro da decidere;
- calcolo anteprima \`incoming = activeRepertoire(donor) \\ activeRepertoire(receiver)\`;
- il ricevente conserva gli elementi che già possedeva e acquisisce le emanazioni del donatore con provenienza;
- il donatore cede tutto il repertorio trasferibile ma conserva \`activeDNA\`, nome, ID, storia; il donatore può **riacquistare** forme attraverso esperienze successive;
- l'archivio globale delle specie **non** perde conoscenza e non deve essere riscritto;
- eventi append-only \`absorbedFrom\`, \`cededTo\`, \`recipeId\`, \`step\` registrati su entrambe le cronache;
- operazione atomica e idempotente rispetto alla stessa fonte già svuotata: assorbire di nuovo non genera altro valore;
- non esistono duplicazioni, guadagni di ENERGY per numero di forme o trasformazioni istantanee gratuite.
- se \`incoming\` è vuoto, mostrare in modo esplicito «nessuna nuova emanazione acquisita», pur se una perdita del donatore sarebbe possibile.

**Dissenso aperto:** donazione volontaria e reversibile vs assorbimento di tipo fusione irreversibile. La seconda è narrativamente più potente e introduce Loss & Avoidance più forte, ma mette a rischio affezione e identità dei 72 e può incentivare sacrifici seriali. Prova iniziale preferita: trasferimento **funzionale** del repertorio senza distruzione dell'individuo. Eventuali modalità più dure come rituale/trasmutazione tardiva solo dopo playtest.

## 5. Piccolo confronto da implementare DOPO il design review

**T0 — Architron come ruolo/pet, nessun assorbimento:** tre individui nominati, si può cambiare quale è Architron; graficamente/musicalmente riconoscibile; tutti possono acquisire emanazioni tramite incontro. Lo stesso field simula trasmissioni e ritorni di portatori effimeri.
**T1 — Assorbimento con anteprima:** due individui con tavole diverse; trasferimento atomico di repertorio senza cambiare il corpo corrente; UI anteprima differenze, cronaca/provenienza. Osservare se la scelta appare davvero costosa.
**T2 — Alternativa senza assorbimento:** stessi contenuti iniziali e budget, confronto **cooperazione di due individui** vs concentrazione su Architron. Verificare che in almeno un problema ciascuna scelta abbia un vantaggio diverso.
**T3 — Audioscape:** Architron identità musicale persistente, fenomeni dei 71/effimeri udibili ma mixati; trasferimento cambia materiale musicale e stato funzionale, non identità.

**Condizioni di falsificazione:**
- Se l'Architron è indistinguibile da una stazione qualunque, il pet non funziona.
- Se l'Architron dispone di regole fisiche privilegiate rispetto agli altri solo perché "protagonista", si perde la coerenza del mondo.
- Se non sappiamo dire in che cosa consista il vantaggio di *una emanazione trasferita*, non chiamare l'assorbimento "crescita".
- Se concentrare è sempre ottimale, perdiamo comunità/caleidoscopio; se cooperare è sempre ottimale, assorbire non è una decisione.
- Se il donatore viene distrutto senza avviso o perdita di memoria irreversibile senza un motivo, il costo rischia di allontanare invece che coinvolgere.
- Se scambiare Architron trascina la cronaca del vecchio sul nuovo, confondiamo ruolo e individuo.
- Se audio e visual non riflettono i dati reali di trasferimento/relazione, sono accompagnamento cosmetico.
- Se la complessità geometrica e il numero di DNA diventano un unico score di "valore personale", il significato del pet diventa riduttivo.

## 6. Decisioni e irrisolti

**Convergenza provvisoria:** il giocatore resta deus-ex-machina, Architron uno dei 72 pet privilegiato per relazione e sintonizzazione, non nuova specie; altri 71 hanno dignità, storia e sviluppo; carriers possono essere anonimi. Il caleidoscopio deve conservare policentrismo, e l'Architron resta visibile dentro la complessità. L'assorbimento di una \`MindeleevTable\` come **trasferimento non duplicante del repertorio** merita un micro-prototipo con anteprima di perdita e provenienza storica. **Nessun gioco modificato in questa sessione.**

**Dissensi:** definire crescita personale senza contatore monotono, l'utilità di una emanazione appresa senza bypass dell'algebra Conway, la differenza ludica fra cooperazione e concentrazione, la semantica di recupero dopo trasferimento e l'eventuale aspetto esoterico di sacrificio.

**Proposta verbale sintetica del Team:** «Il giocatore non è il viaggiatore: è colui che prepara il mondo affinché un individuo possa cambiare. L'Architron non è superiore agli altri Polytroni: è quello con cui abbiamo scelto di condividere la storia».

**Sviluppi paralleli già presenti:** Sessione 17: flussi/energia/musica. Sessione 18: M0/M1/M2/Photon funzionanti. Sessione 19: test del pellegrinaggio come avatar, ora **sostituito** dalla variante pet/deus-ex-machina; conservare le ipotesi tecniche se utili, non imporre al protagonista una guida diretta.
