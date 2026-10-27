# MINDELEEV — Sessione 10: perché esiste il reattore?
## Energia, valore della sintesi, funzione della cristallizzazione, cannone ed escatologia ludica

**Data:** 27 ottobre 2026  
**Stato:** co-design strategico, nessuna modifica alle meccaniche del prototipo.  
**Base:** Sprint 09 / report delle Sessioni 06, 07, 08b, 09.  
**Metodo:** cinque prospettive esperte **simulate** dall'assistente con obiezioni incrociate. Non sono cinque agenti o consulenti indipendenti, non ci sono playtest o misure di utenti.  
**Riferimenti:** ITER (https://www.iter.org/faqs); Octalysis (https://octalysisgroup.com/octalysis-framework/). La fisica reale è una metafora vincolante quanto basta a evitare contraddizioni, non una pretesa di riprodurre fusioni nucleari.

---

# 0. Mandato e questioni irrisolte

## Domande dell'autore
1. **Perché sintetizzare nuovi Polytroni**, se non per completare una collezione? La complessità geometrica ne aumenta il valore? L'analogia col Tokamak e l'Arc Reactor suggerisce un investimento di ENERGY per ricavare un output energetico superiore al costo di avvio.
2. **Perché spostare Polytroni cristallizzati?** Se non cambia alcuna funzione oltre all'adiacenza per reagire, resta un boardgame cosmetico.
3. **Che senso ha il cannone?** Finché dà soltanto un impulso, il drag è più intuitivo e interessante.
4. **Perché il giocatore dovrebbe proseguire**, senza missioni "colleziona N specie" e senza trasformare tutto in un simulatore/collector?

## Fatti tecnici dello Sprint 09
- Le ricette sono programmi Conway di operatori, una palette e un seme T/C/O/D/I; il numero politronico è un identificatore, non massa né energia.
- La distanza desiderata fra due corpi oggi usa *una funzione arbitraria semplice* (palette uguale 64, differente 124, +12 se semi diversi, +7 per ogni differenza nella lunghezza della catena).
- Lo stress visibile è una somma non normalizzata di deviazioni quadratiche per tutte le coppie, con contributo radiale. Non può essere usato direttamente come premio confrontabile fra popolazioni diverse.
- In cristallo movimento/scambio costa ENERGY e cambia posizioni/vicinati. Il drag della fase fluida è invece gratuito nel laboratorio: **l'economia è oggi aggirabile** via rilascio→drag→ricattura, salvo introdurre differenze effettive fra strumenti, costi o modalità.
- Fusione/fissione consumano ENERGY, riscrivono DNA; una schermata conferma il target di ricetta, ma nessuna struttura ha ancora una funzione energetica. Il cannone delle quattro frecce aggiunge moto soltanto.
- Nessun award ENERGY, nessuna rete di conduzione, nessun raggio con effetto differenziale. Non fingere che il motore attuale sia già un "reattore".

**Diagnosi:** mancano *una funzione utile degli individui*, *una ragione per la topologia del cristallo* e *una legge per la provenienza dei guadagni*. Questi tre vuoti sono lo stesso problema da angolazioni differenti.

---

# 1. Panel simulato e disciplina
- **PA — Architetto del Puzzle:** agency, decisioni locali, feedback, risolvibilità, soft-lock, dilemmi e anti-exploit.
- **SE — Progettista di Sistemi Emergenti:** fenomeni spontanei, attrattori, sorpresa, contemplazione, varietà senza centinaia di regole.
- **GC — Genetista/Collezione:** DNA e fenotipo con vero potere causale, identità, progressione non arbitraria, anti-grind.
- **PG — Psicologo del Giocatore:** Octalysis, soddisfazione progressiva, competenza, autonomia e leggibilità, no riflessi.
- **FE — Fisico Ermetico:** energetica contabile, conservazioni o sorgenti definite, stress vs potenziale vs disponibilità di lavoro.

---

# 2. Round I — Perché dovrei sintetizzare qualcosa?

## Proposta 1: "il Polytrone complesso vale di più"
**GC (provocazione):** "In Pocket Frogs la rarità desiderabile può motivare la raccolta; un icosaedro con catena lunga può essere il nostro oro."  
**PA (obiezione):** "Ma *vale di più per fare cosa*? Se è soltanto più caro da vendere a un banco, abbiamo aggiunto un sistema di prezzi arbitrario; la selezione ottimale sarà spesso un loop di crafting."  
**FE:** "Il numero delle facce, la lunghezza degli operatori e il volume non sono automaticamente energia immagazzinata. Dire D/I più potenti è una scelta di bilanciamento, non un fatto scientifico."  
**PG:** "Un numero che sale dà progressione di breve periodo (CD2) ma non la fantasia di padroneggiare un universo (CD3)."
**SE:** "Se vince sempre il poliedro più complesso, perdiamo varietà e belle configurazioni semplici."
**ESITO: RESPINTA** come regola generale "maggiore complessità => maggior rendimento". Conservare la complessità come **costo/potenziale di capacità/specializzazione**, con compromessi.

## Proposta 2: "il Polytrone è un componente funzionale"
**GC:** "Nuova ricetta = una nuova risposta alle relazioni. Alcune forme si accordano a un flusso, altre stabilizzano una rete, altre collegano distanze differenti, altre rendono possibile un passaggio energetico altrimenti impossibile."  
**PA:** "Questa è una motivazione vera solo se un giocatore sa prevedere almeno in parte *quale ricetta gli manca per migliorare il reattore*, e può provare a sintetizzarla."  
**SE:** "Preferibile a una tabella di valori se le prestazioni emergono dalle interazioni, senza assegnare 20 abilità manuali a 20 operatori."
**FE:** "Per avere potere causale reale basta iniziare con due proprietà: *compatibilità/risonanza del legame* e *capacità di connessione*. Non richiediamo subito chimica con dieci indici."  
**PG:** "Quando sintetizzo, voglio vedere qualcosa che prima era impossibile: una connessione verde, un nuovo percorso, un incremento di rendimento, una crescita spontanea del sistema."
**ESITO: PRIMA SCELTA.** La collettabilità deve discendere dalla scoperta di nuove funzioni, non viceversa.

## Proposta 3: "il Polytrone consuma se stesso come combustibile"
**FE:** "Possibile: ogni genotipo ha energia libera interna, la reazione da alto a basso potenziale libera energia, la fissione inversa richiede almeno altrettanta ENERGY più perdite. Ma è una seconda algebra da formalizzare."
**GC:** "Rischio: il giocatore si affeziona ai Polytroni, ma il gioco li brucia per guadagnare denaro; la collezione viene punita."
**PA:** "Potenzialmente buona per una variante avanzata, non per il prossimo MVP."
**ESITO: PARCHEGGIATA**. Preferenza per componenti riutilizzabili prima di introdurre fuel materiale consumabile.

**Verdetto Round I:** ciò che rende prezioso un Polytrone è **l'utilità di una nuova struttura in un insieme di relazioni e in un processo**, non un prezzo fisso crescente con complessità.

---

# 3. Round II — Da dove viene ENERGY?

## La lezione del Tokamak, correttamente interpretata
ITER distingue l'energia rilasciata dal plasma dalla potenza richiesta ai sistemi di riscaldamento; il progetto Q=10 intende 500 MW di fusione/50 MW di riscaldamento, non dieci volte la potenza elettrica netta dell'impianto. ITER non produce elettricità. Questo è un modello **concettuale**, non un inventario reale di particelle per Mindeleev.
**L'Arc Reactor di Tony Stark è finzione**: utile come obiettivo di fantasia/autosufficienza, non come analogia scientifica.

## Quattro modelli in competizione

### E-A — Bonus per la prima scoperta
- Ogni nuova configurazione o sintesi utile produce +ENERGY *una sola volta*.
- Vantaggi: semplice, niente ciclo farmabile, supporto a CD7 Curiosity.
- Svantaggi: appare come un premio arbitrario distribuito dal gioco; richiede una lista di "scoperte" che diventa una missione implicita. Non fornisce al board un ruolo di macchina.
- Panel: PA/PG lo accettano come *strumento di onboarding*, SE/GC/FE non lo scelgono come core.

### E-B — Convertire lo stress rilasciato in ENERGY
- Quando una trasmutazione riduce il potenziale del campo, parte dell'energia rilasciata viene raccolta.
- Vantaggi: connessione elegante fra il bond visualizzato, la scelta di DNA e guadagno.
- Limite fisico: un sistema già rilassato non può produrre potenza continua soltanto restando rilassato. Attrito smorza e dissipa, non ricarica per magia.
- Limite matematico: serve una funzione di potenziale completa, di stato, con riferimento/normalizzazione e un bilancio per ogni fusione/fissione. Altrimenti sequenze inversibili potrebbero fabbricare ENERGY da nulla.
- Panel: FE e SE la considerano interessante *come rendimento secondario di una singola transizione*, non come fonte principale nell'MVP.

### E-C — Raccogliere un flusso esterno mediante un reattore polytronico
- Una sorgente ambientale consegna una **quantità finita di energia per ciclo esperimento** (es. 12 unità sotto forma di quattro impulsi da 3). Questa NON è una seconda valuta spendibile dall'utente: è energia che attraversa il sistema.
- La rete di Polytroni, con geometrie/colori/vicinati/distanze, ne cattura una quota deterministica \`0 ≤ η ≤ 1\`.
- L'ENERGY raccolta torna all'unico portafoglio del giocatore. Può superare il costo di costruzione e avvio, ma **non** l'energia complessivamente disponibile nel flusso esterno.
- Vantaggi: risponde contemporaneamente a *perché sintetizzare*, *perché muovere sul board*, *perché un cannone/innesco potrebbe contare*, *perché stress e basso errore sono desiderabili*.
- Rischio: se basta avviare lo stesso flusso infinite volte, il gioco diventa ENERGY farming. La sorgente deve avere un budget finito o la ricompensa energetica dev'essere basata su un record non ripetibile.
- Panel: preferita **5/5** come MVP da testare; **dissenso** su quanto il flusso debba essere deterministico o emergente.

### E-D — L'universo fornisce ENERGY passivamente a rate
- Lasciare un cristallo fermo genera +1 ENERGY ogni N secondi.
- Economicamente autoreferenziale, incentiva idle/grind e annulla lo scopo dei puzzle.
- **RESPINTA 5/5**.

## Esempio di bilancio, numeri inventati per il prototipo
- ENERGY portafoglio iniziale: **10**.
- Costruzione / risistemazione / innesco: **6** spendibili.
- Energia ambientale totale presente nel flusso di prova: **12** (es. quattro impulsi × 3).
- Reattore con efficienza \`η = 0,75\` recupera **9** ENERGY.
- Portafoglio finale: \`10 - 6 + 9 = 13\`. **Profitto netto del giocatore = +3**.
- Ma dall'ambiente sono arrivate **12** unità: \`9 ≤ 12\`. Nessuna energia viene creata.
- Se due reattori hanno stessa costruzione (costo 6), ma catturano rispettivamente 4 e 9, il primo è perdente, il secondo è vincente.
- Il confronto ha significato solo con sorgente e condizioni equivalenti e senza moltiplicazione gratuita dei cicli.

**Obiezione FE:** il tasso \`η\` deve essere il risultato di eventi locali e proprietà dei pezzi, non un bonus globale calcolato perché una formula lo decreta. Un indicatore di stress basso può migliorare la capacità di *trasferire* energia, ma non essere la fonte stessa.

---

# 4. Round III — Perché serve il board cristallino?

## Difetto attuale
Il cristallo è soprattutto una *griglia di manipolazione del DNA*. Muovere/scambiare permette di creare vicinati per la fusione, ma non costruisce ancora un sistema produttivo.

## Tre candidati al rapporto fra board e potenza

### B1 — "Componi una catena di conduzione" (preferito)
1. Una sorgente sul bordo entra nel campo come impulso/flusso energetico, un collettore o nucleo al centro lo può ricevere.
2. I Polytroni occupano celle e formano una **rete di collegamenti**. Una coppia può condurre soltanto se soddisfa un vincolo di distanza/affinità compatibile con i suoi geni.
3. Il flusso attraversa questa rete; su ogni collegamento la qualità del trasferimento dipende dall'errore di distanza e da una legge semplice, visibile sulla heat map dei legami.
4. La disposizione sul cristallo cambia **quali collegamenti esistono, quale percorso si attiva e quanta energia arriva**. Lo stato libero serve a esplorare e/o migliorare il successivo layout; il passaggio di fase deve avere una conseguenza, non essere un tasto decorativo.
5. Fusione/fissione modificano il DNA e quindi legami possibili; sintesi di un nuovo Polytrone può sbloccare un collegamento/accoppiamento altrimenti impossibile.

**Riserva PA:** se qualunque percorso funziona senza pensiero, diventa Pipe Mania. Ogni nuova ricetta deve poter cambiare **la decisione migliore**.  
**Riserva SE:** se la fisica continua non cambia affatto la potenza né la cattura, potrebbe essere soltanto uno screensaver. Provare un livello in cui la dinamica naturale aiuta a trovare accoppiamenti utili.  
**Riserva FE:** usare una misura relativa di compatibilità per collegamenti attivi, non semplicemente lo stress aggregato su TUTTE le coppie: disconnettere oggetti altrimenti diventerebbe un facile exploit.  
**Riserva GC:** la silhouette deve rendere visibile la capacità funzionale, non dover leggere il codice alfanumerico.

### B2 — Black Box / fasci che deviano o trasmutano
- Da un lato parte un fascio; geni e posizioni dei Polytroni determinano curvatura, riflessione, filtraggio, mutazioni, uscita.
- Pregi: fa tornare interessante un cannone come **iniettore diagnostico/energetico**, non come impulso di movimento. Il giocatore ragiona su percorsi e regole di interazione.
- Difetti: raggi con molte regole possono spostare il centro del gioco dalla geometria generativa a un rompicapo di ottica. C'è il rischio di aggiungere una seconda fisica arbitraria.
- Panel: candidato per **secondo passo** dopo B1, a meno che una demo minima con due comportamenti superi B1 in leggibilità e desiderio di giocare ancora.

### B3 — Tower Defense tradizionale
- Ondate avversarie, torrette, danni, vite del nucleo.
- Pregio: obiettivo immediato.
- Difetto: le reazioni e l'equilibrio diventano accessory cosmetics; combatte con la direzione puzzle-caleidoscopio, impone pressione temporale non desiderata.
- **RESPINTO per il core**, non necessariamente come modalità futura.

### Principio adottato
**"Cristallizzo per costruire una macchina; libero per osservarne e modificarne la dinamica."** Il board non è una pausa del mondo, è una configurazione intenzionale delle possibilità.

---

# 5. Round IV — Perché sintetizzare DNA sempre più complessi?

**GC:** "Ogni nuovo Polytrone deve avere una funzione realizzata *dal suo fenotipo*, non un aumento di rarità prefissato."  
**PA:** "Una nuova ricetta vale se rende raggiungibile un nuovo stato funzionale: una distanza ottima, un passaggio fra colori, una connessione a più vie, un assestamento diverso."  
**SE:** "Teniamo forme semplici utili anche nel late game: altrimenti selezione monotona verso I e catene più lunghe."  
**FE:** "Non inventare 'più facce = più joule'. Possibile usare proprietà calcolabili del poliedro: per esempio la valenza dei vertici o la distribuzione di facce."
**PG:** "Il momento magico: trasformo un pezzo, lo rilascio, si riallineano tutti i legami, e vedo la rete che prima disperdeva energia diventare produttiva."

## Una legge fisico-ludica minima da provare, NON definitiva
Separare tre funzioni già presenti nel DNA:
- **Colori / famiglia:** compatibilità con gli ingressi e con altri geni (quali connessioni sono favorite), finite palette combinatorie.
- **Seme e geometria Conway risultante:** una proprietà strutturale verificabile come capacità di coordinazione (per esempio una funzione della valenza dei vertici calcolata dalla mesh), non un valore di rarità arbitrario.
- **Sequenza di operatori:** modifica effettiva della struttura e quindi della capacità/compatibilità; non attribuire a ogni lettera un'abilità scritta a mano.

**Avvertenza:** nel motore oggi l'unico effetto strutturale degli operatori nelle forze è la *lunghezza della sequenza*, non la topologia reale del solido. Questo deve cambiare per rendere la sintesi di nuove geometrie significativa.

La complessità può avere:
1. **costo di sintesi crescente**, che rende alcune strutture investimenti;
2. **una specializzazione nuova**, ad esempio un incrocio cromatico prima impossibile;
3. **un tradeoff**, ad esempio maggiore capacità di conduzione ma più stress di compatibilità.

Non prevedere automaticamente un premio crescente per numero di facce. Un D o I dovrebbe diventare desiderabile perché risolve *un problema funzionale* in quella rete, non perché rarissimo per definizione.

---

# 6. Round V — Qual è l'escatologia, senza missioni?

## Tre fantasie a confronto
1. **Collezionista di specie:** massimizzare le voci della Tavola. Insufficiente come core; la collezione resta memoria delle scoperte.
2. **Chimico della ricchezza:** convertire materia povera in materia più preziosa e venderla per ENERGY. Comprensibile, ma rischia una tabella di prezzi e attività ripetitive.
3. **Artefice di un universo autosufficiente:** con poca ENERGY iniziale scoprire geni, costruire un sistema funzionante e far crescere la capacità di investire in nuove trasformazioni. Non "arriva alla missione 20", ma **raggiungi la soglia in cui il tuo sistema può alimentare la tua curiosità**.

**Preferenza del panel: 3**, con riserva sul pericolo di un'unica configurazione ottimale che annulla creatività ed esplorazione.

### Progressione senza missioni del tipo "colleziona 8..."
- Prima comprendo un legame (nessuna missione artificiale: il feedback mostra semplicemente il risultato).
- Poi riesco a costruire una rete che cattura parte di un flusso esterno.
- Scopro che posso sintetizzare un Polytrone più costoso che modifica realmente l'efficienza del circuito.
- La maggiore capacità energetica consente di tentare trasformazioni prima impraticabili.
- Inizio a progettare strutture che sono insieme **sufficientemente rilassate, robuste e produttive**.
- Collezione/Tavola = cronaca delle leggi e dei design scoperti, con blueprint replicabili.
- Fine *morbida*: un ecosistema polytronico sostenibile, capace di produrre margine operativo per ulteriori esperimenti senza perdere controllo e leggibilità.

**PG:** "Dare al giocatore un obiettivo proprio ('posso costruire un reattore più efficace?') è diverso dal dargli una checklist. Servono però progressi percepibili presto: un indicatore di rendimento e una prova prima/dopo."  
**PA:** "La vera condizione di vittoria locale è raggiungere *break-even* su un flusso finito. Non prescriviamo un DNA-obiettivo."  
**SE:** "La libertà di guardare un caleidoscopio emergente deve rimanere, non subordinata alla produzione."  
**GC:** "La Tavola deve registrare *capacità* e combinazioni scoperte, non ripetere varianti cromatiche senza nuovi effetti."  
**FE:** "Autonomia non significa moto perpetuo: un sistema può essere autosufficiente rispetto alla ENERGY richiesta all'operatore se accede a una sorgente esterna, esattamente come una macchina solare."

---

# 7. Le obiezioni che quasi fanno fallire l'ipotesi

### O1. Se basta ricristallizzare per aggirare la tassa di movimento?
Lo Sprint 09 permette trascinamenti gratuiti in fase fluida ma movimenti cristallini a costo 1. **Prima di un'economia persistente**, servono regole coerenti: o trascinamento e cristallizzazione consumano lavoro calcolabile; oppure la fase libera è sandbox esplorativo e il circuito produttivo richiede un impegno/restrizione dichiarato. **Non scegliere prima di provare entrambe le opzioni**.

### O2. Se ottengo energia senza una ragione fisica?
Una sorgente ambientale, un materiale iniziale energetico o un premio simbolico devono essere espliciti. Una configurazione "nobile" stress basso **non** crea energia dal nulla. Può ridurre dissipazione e aumentare la resa di un flusso.

### O3. Se ripeto lo stesso ciclo e guadagno per sempre?
La fonte di energia del puzzle deve essere **finita** (o la ricompensa personale una tantum/record), e il replay deve ripristinare un test in modalità simulazione *senza* duplicare ENERGY persistente. Attenzione a undo e reload duplicati; ledger delle sorgenti consumate/reward in uno stato separato.

### O4. Se fondere riduce N e quindi fa apparire stress basso?
Calcolare lo stress dei legami **attivi** e misure normalizzate, insieme a minimi di copertura/quantità da condurre; non premiare il semplice campo vuoto. Evitare di confrontare ingenuamente lo stress totale di N=4 con N=9.

### O5. Se il reattore più potente è anche sempre il più complesso?
Mantenere tradeoff: costo, connessioni, fragilità e risonanza. Alcune ricette corte devono restare componenti perfetti di reti avanzate.

### O6. Se il flow simula soltanto una tabella Pipe Mania?
Il giocatore deve aver bisogno di usare il cambiamento di DNA, non soltanto la posizione. La simulazione fluida deve incidere sulla stabilizzazione o fornire insight utili; altrimenti il core è un puzzle di instradamento e il caleidoscopio è ornamentale.

### O7. Se la scelta casuale di fusione/fissione decide se posso guadagnare?
Mantenere mutazioni deterministiche nel primo confronto. Se arriverà l'alea, far vedere gli esiti, i pesi e possibilità di controllo; non creare break-even basato su tentativi random.

---

# 8. Un microgioco verificabile: REACTOR ZERO
**È una proposta per il prossimo sprint, NON già implementata.**

### Campo
- Griglia di 19 sink esagonali; 5–6 Polytroni con DNA differenti; un ingresso e un collettore visibili.
- Fluido realtime solo come dinamica esplorabile, cristallo come fase di progetto; nessun countdown.
- La sorgente fornisce esattamente **4 pacchetti**, ognuno con una quantità di energia nota. Non è un secondo wallet. Il giocatore non compra pacchetti; sono una condizione esterna del mondo.
- Un solo tipo di flusso all'inizio. Non introdurre subito rosso/blu, nemici, tre uscite, sostanze chimiche nuove, HP e heat bars.

### Azioni disponibili
1. **Muovi / Scambia** sul cristallo: modifica il grafo di conduttanza.
2. **Fondi / Scindi**: modifica DNA e quindi una proprietà realmente funzionale della rete.
3. **Rilascia / Cristallizza**: modifica lo stato e permette alla dinamica di riassestare/catturare; testare il costo del passaggio per eliminare aggiramenti.
4. **Avvia flusso**: fa attraversare i pacchetti lungo le connessioni, con percorso e perdite anticipati visivamente. Non è un'azione di riflessi.

Il **cannone** è assente nella prima variante: le quattro frecce-impulso attuali hanno già perso contro il drag. **Variante B:** un "iniettore" da bordo sostituisce *Avvia flusso*, permettendo di scegliere la direzione e, poi, forse l'energia/tipo del proiettile. Se non apre una decisione distinguibile, non ripristinarlo per affetto nostalgico.

### Una legge di conduzione schematica, volutamente semplificata
- Le connessioni possibili dipendono dalla distanza sulla griglia e dall'affinità dei geni.
- La qualità di ogni collegamento dipende dall'errore \`e_ij = |d_ij - d*_ij|/d*_ij\`.
- Per esempio \`t_ij = clamp(1 - e_ij / τ, 0, 1)\` nel range selezionato; il pacchetto subisce una perdita sul collegamento, determinata da \`t_ij\`.
- È una **formula test**, non una legge fisica. Evitare frazioni energetiche che creano arrotondamenti esploitabili; mantenere calcolo di rendimento in grandezze reali e quantizzare una sola volta al collettore.
- Un collegamento verde può condurre bene; un legame rosso deve disperdere parte del flusso. Gli indicatori visivi esistenti diventano strumenti strategici.
- Non serve introdurre un "tipo" di ogni operatore Conway: nel primo test le proprietà rimangono funzione calcolata del DNA e di una firma strutturale semplice.

### Bilancio dimostrativo
Portafoglio iniziale 10 ENERGY, investimento massimo scelto 6; flusso ambientale 12 ENERGY. Una soluzione mediocre cattura 4; una efficiente cattura 9.  
\`E_finale = 10 - 6 + E_catturata\` = **8** oppure **13**.  
La domanda ludica è: *quali operazioni sul DNA e sulla disposizione permettono di passare da 4 a 9?*

### Interfaccia
- Prima dell'avvio, gli impulsi e i percorsi sono mostrati come **tracce luminose previste**, con perdite marcate nei legami rossi.
- È mostrato il guadagno stimato del test attuale: perdita / break-even / produttivo.
- Non servono dieci pannelli: ogni Polytrone è leggibile per forma, colore e porti di connessione; dettaglio su selezione.
- La fase fluida resta meravigliosamente animata, senza prove di tempismo.

### Esperimenti comparativi *indispensabili*
- **V-A rete senza sintesi:** solo spostamenti sulla griglia. Il giocatore ottiene al massimo una resa modesta.
- **V-B rete con sintesi:** una fusione o fissione **rende raggiungibile un rendimento sensibilmente maggiore**, non per bonus speciale ma per effetto sulla legge del collegamento.
- **V-C controllo senza fisica fluida:** identica rete, manipolazione discreta. Serve a dimostrare che la fase fluida apporta decisioni, non soltanto bellezza.
- **V-D variante iniettore:** scelta del fascio da bordo vs semplice *Avvia flusso*; conservare solo se genera decisioni significative.

**Gates:** simulazione deterministica, solver per piccole combinazioni di posizioni/ricette, preview identica al risultato, no loop ENERGY positivo senza sorgente, nessun soft-lock, nessun timer/reflex, alcuni casi in cui forme semplici battono forme complesse.

---

# 9. Alternative da NON dimenticare

### A. "Energia per transmutazione da potenziale genetico"
Definire un potenziale interno \`G(DNA,legami)\` con costo di riscrittura e rendimento netto da una trasformazione da stato alto a basso; serve materia/precursori ad alto potenziale e l'inversa deve sempre costare almeno quanto è stato ricavato (in sistema isolato). Più elegante dal lato alchimia pura, più oneroso da formalizzare e meno immediato per il board. **Seconda candidata**, se Reactor Zero non convince.

### B. "Stato nobile"
Configurazione di 3+ Polytroni con stress normalizzato basso, moto basso e robustezza a piccole perturbazioni. Non produce ENERGY per immobilità. Può essere un **moltiplicatore di efficienza** di un flusso oppure un record di ricerca. Non farne una check-list di missioni.

### C. "Mercato di trasmutazione"
Valore intrinseco e domanda di geometrie rare, ENERGY ricavata dalla loro vendita. Fornisce un obiettivo ma è una forma di economy game alternativa; potrebbe diventare una fabbrica di grinds. **Non primo core**.

### D. "Obiettivi puramente contemplativi"
Se il gioco fosse un generative sandbox senza economia, una Tavola delle scoperte potrebbe essere sufficiente. Ma l'autore chiede esplicitamente un **gioco** con scelte e conseguenze; non nascondere il deficit di gameplay dietro lo stupore visuale.

---

# 10. Matrice di decisione del panel (consensi SIMULATI)

| Questione | Decisione provvisoria | Consenso | Da dimostrare |
|---|---|---|---|
| Valore di un Polytrone | Funzionale nella rete, non prezzo monotono | 5/5 | Una ricetta nuova rende possibile un flusso altrimenti impossibile |
| Produzione di ENERGY | Conversione di flusso esterno finito | 5/5 | Guadagno netto del giocatore e bilancio totale non negativo |
| Ruolo del cristallo | Progettazione di rete di accoppiamenti e trasporto | 4/5, SE prudente | Spostare un pezzo cambia percorso e resa |
| Ruolo della fase fluida | Trovare/riassestare configurazioni e esplorare interazioni | 5/5 sulla desiderabilità, 2/5 sulla necessità strategica ancora da dimostrare | V-B batte V-C in profondità, non solo spettacolarità |
| Cannone attuale | Togliere le frecce impulso dal core | 5/5 | Drag ha stessa funzione a UX migliore |
| Iniettore futuro | Variante come ingresso energia/particelle e mutazione | 3/5 favorevoli, PA/PG cauti | Decisione distinta dal pulsante di avvio |
| Stress basso | Rendimento migliore, non generatore | 5/5 | Heat map predice differenze di rendimento |
| Complessità DNA | Specializzazione con costi e tradeoff | 5/5 | Ci sono casi in cui pezzi semplici restano ottimali |
| Meta-scopo | Costruire un sistema autonomo rispetto al budget dell'operatore e usare il guadagno per nuove sintesi | 4/5; SE vuole libertà anche senza economia | Il giocatore sceglie da sé di migliorare senza checklist |
| Missioni Pocket Frogs | Evitare come progressione principale | 5/5 | Tutorial/test guidati possibili, non colleziona N |

---

# 11. Domande davvero aperte
1. La "sorgente esterna" dev'essere un ambiente finito per scenario, un cosmo con giacimenti, una radiazione perpetua con consumo controllato, oppure una pura prova di efficienza con **wallet non persistente**? Questo decide se ENERGY è un'economia duratura o un punteggio per problemi singoli.
2. Il cristallo *fissa* una rete o deve modificare il flusso mentre si rilassa? La differenza è cruciale per il carattere duale.
3. Quale unica proprietà del poliedro, calcolata da Conway (valenza, distribuzione delle facce, simmetrie…), è **visibile** e utile senza trasformarsi in una tabella di numeri?
4. In che modo gli operatori Conway modificano una proprietà reale senza rendere automaticamente potenti le sequenze più lunghe?
5. Se una fusione libera energia, quale variabile diminuisce e come impedire alla fissione inversa di duplicarla?
6. La fonte di ENERGY può essere anche il *riposizionamento operato dal campo*? Se sì, contabilizzare il lavoro dell'utente e la dissipazione, non premiare il drag gratuito.
7. L'utente vuole una progressione persistente con riserve ENERGY, oppure esperimenti indipendenti in cui è memorabile trovare un layout break-even? Non decidere per inerzia.
8. Il cannone di bombardamento deve mutare DNA, portare energia, introdurre materia o una sola di queste? Evitare che diventi uno strumento universale che rende inutili fusione/fissione.
9. Come preservare i 3D Platonic/Conway nella scena del reattore anziché ridurli a icone con abilità? Affrontare con un viewer 2D↔3D ortogonale alla fase.
10. Una struttura con enorme stress ma alta conduzione può essere accettabile? Distinguere performance istantanea, resilienza e stabilità operativa.

---

# 12. Verdetto e lavoro seguente

**Tesi preferita:** il Polytrone ha valore perché è un *componente capace di trasformare la resa di un sistema*. Il reticolo è il luogo della progettazione intenzionale; il fluido ne espone le relazioni fisiche ed emergenti; una fonte ambientale trasferisce energia attraverso un circuito inventato dal giocatore; le trasmutazioni permettono nuove architetture; il guadagno finanzia nuove sperimentazioni.

**Escatologia proposta:** partire con energia finita, capire le leggi, scoprire nuove strutture, progettare un primo reattore a margine positivo, reinvestire per costruire sistemi sempre più autonomi, robusti e sorprendenti. La Tavola Mindeleev registra il cammino, non lo prescrive.

**Obiezione da non rimuovere:** questo è ancora un *pitch di design*, non il nucleo verificato del gioco. Potrebbe fallire perché il reattore diventa un altro puzzle di instradamento con Polytroni intercambiabili. Per questo il primo confronto deve misurare **un miglioramento che richieda proprio la sintesi del DNA e non si possa ottenere con il solo spostamento**.

**Nessuna implementazione modificata da questa sessione.** Prossimo esperimento raccomandato: micro-prototipo isolato REACTOR ZERO con rete e sorgente finita, più una versione di controllo senza sintesi o senza fluido; non introdurre subito il cannon-bombardamento, probabilità genetiche, upgrade, nemici, rarità o missioni.
