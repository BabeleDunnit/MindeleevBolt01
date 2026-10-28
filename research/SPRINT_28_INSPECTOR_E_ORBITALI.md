# Sprint 28 — Rapier Inspector, collision pause e proposta di orbitali Shape-DNA

**Data:** 28 ottobre 2026
**Branch:** \`experiments/sprint28-rapier-inspection\` da \`experiments/sprint27-planar-rapier\`
**Entrypoint:** \`?experiment=planar-rapier\` (sostituisce in GitHub Pages solo la versione esposta su questo branch; il codice Sprint27 resta preservato).
**Stato:** inspector/debug tools implementati e verificati in CI. **Orbitali: discussione, non implementati**.

Il Design Team è formato da sette prospettive simulate da ChatGPT, **non** sette professionisti esterni. Riferirsi alle prospettive **per esteso**: **Ludologo**, **Architetto del Puzzle**, **Progettista di Sistemi Emergenti**, **Genetista**, **Psicologo del Giocatore**, **Fisico-Matematico**, **Compositore di Sistemi Musicali**.

## 1. Modifiche realizzate

### A. Dropdown e controlli che ricalcolano il campo
- Nello Sprint 27 i menu \`scenario\`, \`count\`, \`dna\`, \`returnPalette\`, \`physics\` aggiornano \`draft\`, ma non il vero \`plan\` utilizzato dal mondo Rapier: il nuovo scenario rimane inattivo fino a \`Rilancia\`. Nello Sprint28 i dropdown applicano **immediatamente** un nuovo piano e ricreano mondo fisico, geometrie, collisioni e contatori.
- Le **slider** della calibrazione si applicano automaticamente dopo **200ms senza movimenti**, così il rendering WebGL non viene ricreato a ogni pixel del trascinamento. Nessuna richiesta di premere Applica.
- \`Rilancia / Ripeti\` resta per gli esperimenti ripetibili con configurazione identica.

### B. Selezione da scena 3D e Inspector
- Raycaster Three.js sui poliedri reali. Un click sceglie transformer o viaggiatore; per particelle molto piccole si può anche utilizzare il dropdown Inspector.
- Highlight in scena dell'individuo selezionato, pannello con nome, ruolo, DNA attivo, seme, verbo, operatori, palette, stato, posizioni, velocità, ENERGY, numero contatti e vere V/F della mesh Conway.
- Il DNA può essere cambiato scegliendo una ricetta dal menu o inserendola a mano. Il parser effettivo è quello di Polyhedronisme/decoder (es. \`k02T\` valido, \`i02T\` non valido nell'implementazione corrente).
- Per i sei controller e i viaggiatori iniziali, la modifica si **salva nel protocollo** (\`plan.stationDNA\` / \`plan.travelerDNA\`) e riparte dalla condizione iniziale, senza introdurre una dipendenza dalla storia precedente.
- Per eventuali figli generati dopo \`Clona\`/\`Scinde\`, l'Inspector esegue una **modifica esplicita in tempo reale con il motore in pausa**; il DNA modificato non viene spacciato per un preset riproducibile ed è **temporaneo**. \`editDNA\` ricostruisce il vero collider Rapier oltre alla mesh Three.
- Legenda integrata dei semi/verbi:
  * T = **Colora** (palette; eventuali operatori Conway applicati anche al DNA);
  * C = **Combina** (fusione di due viaggiatori compatibili);
  * O = **Scinde** (fissione pseudocasuale dei geni);
  * D = **Clona** (due copie del genotipo, budget condiviso);
  * I = **Seleziona** (filtro, i respinti non vengono cancellati).
  Seme = verbo, operatori = wrapper genetico.

### C. Dimensioni delle due famiglie
- Nuove dimensioni fisiche configurabili indipendentemente: controller default \`.68\`, viaggiatori default \`.26\` (circa **2,6 volte più piccoli** come scala lineare).
- Le dimensioni vengono passate sia al **renderer Three.js** sia ai **collider convessi Rapier**. Non è una semplice apparenza grafica. Controlli separati con rapporto in tempo reale.
- La simulazione continua a essere **planare**: movimento prevalente XZ, temporanei sollevamenti/rotazioni 3D, ritorno a quota sink Y≈1. Nessun lancio sferico.

### D. Pause on collision
- Checkbox \`Pausa alla collisione\`, ignorando eventi di sola emissione, riassorbimento o modifica manuale.
- Il motore avanza **un passo fisico da 1/120 s alla volta**, ispeziona i nuovi eventi e si ferma **sullo stesso passo della collisione**, prima di integrarvi un passo ulteriore.
- Eventi: transformer↔viaggiatore anche quando la reazione è **nulla**, viaggiatore↔viaggiatore, reazioni color/fuse/split/clone/filter/buffer.
- Seleziona in Inspector il viaggiatore coinvolto, registra collision step, prima/dopo ed eventuale stazione nominata. Cliccando Riprendi si può proseguire fino alla collisione successiva.

### E. Verifiche
- \`scripts/check-rapier-inspection.mjs\`: verifica UI renderizzata lato server (presenza controlli), tipologia degli eventi che mettono in pausa, scala dei reali collider rispetto alle dimensioni, overrides dei DNA individuali e diversi, edit sul corpo attivo, ripartenza riproducibile, calcolo Rapier reale, contatti dopo il ridimensionamento e assenza di coordinate non finite.
- CI esegue anche \`check-planar-rapier\`, \`check-island-affinity\`, \`check-musical-return\`, \`check-shape-dna\`, \`check-visible-polyhedra\`, \`check-phase\`, generazione e check Atlas e build Vite. Nessun merge nel branch Sprint27.

**Limitazioni di testing:** test automatici headless e React SSR non sostituiscono una sessione umana di click/drag in browser con WebGL. In particolare l'esperienza del picking di viaggiatori minuscoli e la scena sotto elevati carichi visivi richiedono playtest.

## 2. Discussione: orbitali Shape-DNA a occupazione variabile

### Proposta dell'autore
I viaggiatori si accalcano presso gli stessi attrattori, senza conservare le distanze desiderate. Ipotesi: usare Shape-DNA per derivare **mutue distanze** e creare "orbitali" intorno ai controller o a centri di aggregazione, contando il numero di viaggiatori geneticamente/geomtricamente uguali e **modulando i raggi degli anelli**. Servono strutture caleidoscopiche visibili dall'alto, non un branco Boids e non rail/slot disegnati a priori.

### Ludologo
È una possibile meccanica di auto-organizzazione e scoperta: la stessa ricetta emessa 1, 6, 12 volte dà scene differenti con nuove occupazioni e distribuzioni. Una concentrazione non deve produrre semplicemente un muro di corpi: la formazione di cerchi e gusci può avere implicazioni pratiche sulla probabilità d'incontro e sul rendimento di ritorno. **Non implementarla prima della verifica fisica puntuale** nello Sprint28.

### Progettista di Sistemi Emergenti
Favorisce una **dinamica di gruppo basata su potenziali pairwise** anziché un comando "metti il viaggiatore n nello slot k". I viaggiatori identici possono organizzarsi spontaneamente intorno a un controller o a un baricentro comune, ma devono poter passare da un bacino all'altro dopo una trasformazione. Per alti numeri N usare più corone e limiti sulla densità massima anziché far crescere senza limiti un solo raggio. "Orbitali" può significare occupazione anulare, non binari né moto sferico.

### Fisico-Matematico
Obiezione precisa: Shape-DNA misura una firma geometrica di corpi, non contiene già una legge di distribuzione orbitale. Scegliere una distanza di separazione \(d_0\) da Shape-DNA, poi derivare un raggio dalla **capienza** è una legge ludica da giustificare e tarare.

Per \(N\ge3\) portatori identici equidistribuiti su un anello, se si desidera una separazione **fra vicini** \(d_0\):
\[
R_N=\frac{d_0}{2\sin(\pi/N)}.
\]
Per N=2, \(R_2=d_0/2\); per N=1 non esiste uno spacing intragruppo. Questo non significa poter soddisfare contemporaneamente **tutte** le coppie di distanze desiderate, specialmente per N grandi o gruppi misti. Considerare repulsione di contatto, un campo di riferimento del controller, potenziale inter-viaggiatori, e occupazioni multiple.

Una funzione-potenziale candidata, **non da implementare già oggi**, può combinare il confinamento radiale attorno a un centro c:
\[
U_r=\frac{k_r}{2}\sum_i (\|\mathbf x_i-\mathbf c\|-R_N)^2
\]
con interazioni inter-portatore e repulsione a breve distanza, senza assegnare posizioni angolari fisse. I gradienti generano le forze. Quando N cambia per clonazione/fissione o ritorno alla Sorgente, \(R_N\) cambia e il potenziale fa **lavoro**: va contabilizzato/reso evidente in successive versioni.

**Attenzione:** una corona in equilibrio non è necessariamente un'**orbita in rotazione**. Con forze conservative centrali e damping, gli agenti possono disporsi ad anello e fermarsi. Un'emissione puramente radiale dal centro ha momento angolare iniziale nullo: la circolazione dovrebbe emergere da collisioni asimmetriche o da una legge tangenziale separata, non può essere garantita dall'esistenza dell'anello.

### Genetista
La definizione di "uguali" deve essere verificabile: inizialmente raggruppare per **ricetta Conway identica e palette**, poi confrontare un raggruppamento per **fenotipo geometrico** Shape-DNA (che può includere \`C\` e \`dO\` pur mantenendo verbi genetici differenti). Il cambiamento di DNA dopo collisione deve aggiornare immediatamente appartenenza al gruppo e distanza preferita, ma non teletrasportare il viaggiatore.

### Architetto del Puzzle
Fare dell'orbitale una proprietà che si scopre, non una tabella di parametri da studiare. L'Inspector di un viaggiatore dovrebbe in futuro mostrare: gruppo di affinità, numero di individui equivalenti, \(d_0\) desiderata, raggio risultante, forza istantanea e controller di riferimento. Il giocatore vede che clonare "riempie" un orbitale e modifica il campo; scindere lo riorganizza.

### Psicologo del Giocatore
Voto favorevole alla sperimentazione separata: gruppi in anelli sono leggibili e memorabili dall'alto; se l'effetto si ottiene solo con molte impostazioni invisibili, si perde l'accessibilità. Provare prima scenari con 1/3/6 identici, poi 12. Prevedere "fotografia" di campo quando l'utente mette in pausa su una collisione.

### Compositore di Sistemi Musicali
Anelli con distribuzione quasi regolare creano successioni di urti e ritorni potenzialmente ritmiche; la **rotazione persistente**, se presente, produce cicli temporali mentre configurazioni statiche producono un insieme armonico stazionario. Non introdurre quantizzazione temporale arbitraria per simulare un fenomeno visivo non esistente.

## 3. Programma di prove consigliato dopo lo Sprint 28

1. Campo con 1, 3, 6, 12 viaggiatori di **DNA esattamente uguale**, stesso controller, nessuna reazione: misurare distanza minima, variance dello spacing fra vicini, frequenza di overlap e ritorni.
2. Stesso setup con due geno/fenotipi diversi: Shape-DNA diverso produce raggi/preferenze verificabili? Attenzione alle approssimazioni spettrali e ai fallback.
3. Introdurre un controller O/D che cambia il numero delle copie/genomi: cambia la densità senza teleport?
4. Comparare "molle current" vs "potenziale orbitale con occupazione" mantenendo costante impulso iniziale, dimensioni, massa, damping e regole della Sorgente.
5. Valutare indipendentemente **simmetria visiva**, **quantità di moto tangenziale**, **percentuale di collisioni** e **energia restituita**: evitare di chiamare orbitale efficiente soltanto perché è bello.

### Verdetto
Il Team raccomanda **di studiare l'orbitale Shape-DNA a capienza variabile come esperimento successivo**, non come patch opaca sul modello Rapier. **Prima** rendere attendibili gli strumenti di ispezione e replay e osservare le vere collisioni che causano l'accalcamento.

**Non è stata implementata alcuna nuova forza orbitale in Sprint28.**
