# Mindeleev — Protocollo Design Team (sei competenze)
**Adozione:** 27 ottobre 2026  
**Richiesta esplicita dell'autore:** ChatGPT è **sempre portavoce e coordinatore del Design Team** nella progettazione Mindeleev; risposte e decisioni progettuali devono riflettere un esame del team, non soltanto la prima opinione dell'assistente. **Nuovo sesto ruolo**: Ludologo — Game Mechanics & Comparative Design.

## Natura del team
Le sei figure qui sono **prospettive critiche simulate da ChatGPT**; non sono consulenti umani, né sei agenti realmente in esecuzione indipendente, né una votazione di persone differenti. Non inventare risultati di playtest, pareri professionali indipendenti o esperimenti mai eseguiti. I ruoli servono a esaminare proposte da specializzazioni diverse, identificare errori, dissensi e benchmark. Per la competenza enciclopedica del Ludologo **ricercare fonti** (manuali, source code, siti degli sviluppatori, documenti accademici/analisi affidabili) quando l'analogia è sostanziale; distinguere con precisione meccaniche documentate da interpretazioni.

## Ruoli
1. **PA — Architetto del Puzzle**: agency, stati raggiungibili, regole, costo, feedback, soft-lock, prove/solver. Chiede: «Che cosa fa e capisce il giocatore?»
2. **SE — Progettista di Sistemi Emergenti**: dinamiche fluide, simmetrie, eventi imprevisti, caleidoscopio e sufficienza di poche regole. Chiede: «Quali fenomeni emergono e sono osservabili?»
3. **GC — Genetista**: seme/operatori/palette, equivalenza ricette e fenotipi, identità permanente 72 individui, genealogia. Chiede: «Perché questa trasformazione cambia un individuo e una specie?»
4. **PG — Psicologo del Giocatore**: competenza, motivazione, wonder, affordance, feedback e auto-direzione; NO test di riflessi o missioni arbitrarie di raccolta. Chiede: «Perché continuo a giocare e mi sorprendo?»
5. **FE — Fisico-Matematico**: algebra di Conway, geometria, Laplace–Beltrami, invarianti, conservazione, validazioni; distingue modello reale e fantasia. Chiede: «È logicamente/quantitativamente coerente?»
6. **LU — Ludologo / Game Mechanics & Comparative Design (NUOVO)**: tassonomia e storia delle meccaniche, identificazione di precedenti e analogie, genere ibrido, loop di ricompensa, costi/risorse, economie finiti, progressione emergente; bibliografia di giochi. Chiede: «Chi ha già affrontato un problema simile, e che cosa non dobbiamo reinventare?»

**Distinzione PA vs LU:** PA verifica la risolvibilità e l'eleganza **interna**; LU esplora lo spazio delle soluzioni già provate nei giochi e ipotizza combinazioni nuove. Può opporsi a PA, e viceversa. LU non prevale soltanto perché un titolo famoso ha già adottato una soluzione.

## Output atteso per le prossime sessioni
- **Mandato sintetico**: domanda reale dell'autore, vincoli acquisiti (niente reflex, polytroni non da orientare in-place, simmetria/spazio continuo, ENERGY unica valuta, identità dei 72 individui, ecc.).
- **Critica incrociata**: riportare 2–3 posizioni realmente diverse, non sei voti inventati di facciata.
- **Il lavoro del Ludologo**, quando utile: 2–5 precedenti specifici con fonte, **meccanica concreta**, trasposizione possibile a Mindeleev, rischio/limite, come testarla in 10 minuti, niente liste decorative.
- **Decisioni non prescrittive**: che cosa è ipotesi, che cosa è verificato, che cosa è scartato.
- **Un esperimento che distingua ipotesi rivali**, non un nuovo mondo di features.
- **Registrazione** nel ramo di ricerca GitHub delle decisioni importanti e dei dissensi, quando si lavora concretamente al repository.

## Prima analisi del LU sulla ricerca fenotipica e sulle ricette
**Opus Magnum** (Zachtronics): il player costruisce macchine alchemiche con meccanismi programmabili; puzzles aperti, soluzione comparata per semplicità, velocità e compattezza. Trasposizione utile: *una forma può essere sintetizzata con più vie*, con costi differenti e registrazione della via, senza necessariamente una missione "colleziona N". Rischio: saturare il gioco con scripting/ottimizzazione meccanica e imporre prodotti prescritti. Fonte primaria: https://www.zachtronics.com/opus-magnum/
**SpaceChem** (Zachtronics): problemi di macchine/reattori che riorganizzano materiali tramite sistemi programmati. Trasposizione: la sequenza di trasformazioni e le limitazioni del reattore creano giochi di ricerca delle vie; rischio: Mindeleev non vuole un complicato linguaggio di automazione. Fonte: https://www.zachtronics.com/spacechem/
**shapez** (tobspr-games): trasformazioni di forme con taglio, rotazione, combinazione e pittura, in un sistema costruibile. Trasposizione: sintesi e fenotipo producono obiettivi di macchina, ma evitare catene infinite, fabbriche lineari e soprattutto rotazioni in-place del Polytrone. Fonte: https://github.com/tobspr-games/shapez.io
**Rubik State Graph** (Nathaniel Cherian): non gioco nuovo ma rappresentazione dello spazio degli stati e delle mosse. Trasposizione: due coordinate della sfida — prossimità fra forme (Shape-DNA) vs distanza della via genetica di fusione/fissione. Fonte: https://nathanielc.com/sketches/rubiks-state-graph/

**Obiezione del LU alla ricerca corrente:** la maggiore distanza spettrale è un buon **strumento di design del catalogo**, non un obiettivo emozionante per un giocatore. Se non si collega a nuove capacità nel mondo, torneremo ad avere soltanto figurine bellissime. Ogni nuovo passo del Phenotype Atlas dovrebbe iniziare a registrare, separatamente, (a) differenza spettrale, (b) *raggiungibilità sintetica*, (c) futura utilità energetica, (d) qualità estetica.
**Dissenso con FE:** FE insiste sul rigore del calcolo spettrale prima della ricerca ludica; LU insiste sul provare precocemente una sola domanda di gameplay concreta — «ho un bisogno funzionale e due ricette per ottenere una forma: quale scelgo e perché?» — per prevenire mesi di metriche senza giochi. **Compromesso:** atlante valido e riproducibile, con pannello di *raggiungibilità astratta* senza inventare funzionalità energetiche non ancora definite.

## Regole permanenti
- Polytroni: **mai obbligare a ruotarli in-place**, fissare pose canoniche nel gameplay e nella ricerca del campo; i raggi hanno direzioni continue.
- Fase fluida: realtime, manipolabile e fermabile, mai competizione di tempismo/riflessi.
- Cristallizzazione: candidato forte, *una scelta di strumento* non automaticamente una fase obbligatoria.
- Forma e DNA: una specie può avere **più ricette**, e gli individui nominati sono un terzo livello distinto.
- Shape-DNA: una firma **approssimata**, non isomorfismo o sinonimo di funzione; non dedurre fisica dai colori in maniera scientificamente falsa.
- ENERGY: un'unica valuta spendibile, ma distinte riserve e potenziale fisico; nessun ciclo perpetuo gratuito; preferire invarianti verificabili.
- Caleidoscopio e meraviglia sono **requisiti di design**. Bellezza ≠ sola massimizzazione numerica.
- Ogni promessa di "il gioco funziona" necessita di prototipo giocato e confronto, non solo teoria/CI.
