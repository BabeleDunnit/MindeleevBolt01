# Sprint 08 — Mutatron a due stati / Phase Shift Lab

**Stato:** prototipo per test di game design, non gioco completo né dimostrazione di fisica quantistica.
**Branch isolato:** experiments/sprint08-mutatron-dual-state.
**Ingresso:** \`https://babeledunnit.github.io/MindeleevBolt01/?experiment=phase-shift\` **solo dopo che il deployment GitHub Pages è andato a buon fine**.

## Ipotesi falsificabile
Il passaggio deliberato **fluido → cristallo → fluido** deve aggiungere una decisione reale, non un'animazione o una prova di riflessi. La fase fluida usa movimento continuo da forze; la cristallizzazione colloca gli individui su 19 sink esagonali in modo deterministico; fusione/fissione manipolano realmente la sequenza Conway; il DNA cambia poi le forze della fase fluida successiva.

## Cosa funziona nel codice
- Due scenari iniziali con le stesse quattro ricette, ma posizioni diverse.
- Simulazione smorzata, a passo fisso e **realtime automatica** in fase fluida. Pausa/Riprendi e +1/+60 passi solo per studiare le reazioni; nessuna prova di riflessi.
- Impulsi discretizzati nelle quattro direzioni (−1 ENERGY), e trascinamento diretto del Polytrone in fase fluida (gratuito soltanto come strumento di laboratorio).
- Tensioni fra coppie, distanze preferite dipendenti da palette cromatica, seme T/C/O/D/I e lunghezza del DNA. I bond mostrano l'errore di distanza con tinta verde→rossa, spessore e alpha continui; stress e velocità RMS sono distinti.
- Anteprima della cattura prima della conferma, con linee e sink destinazione.
- Assegnazione ottima di un massimo di sei Polytroni ai 19 sink: programmazione dinamica, costo della distanza quadratica, una sola particella per cella.
- Fase cristallina: fusione per adiacenza e ordine del DNA; fissione scegliendo il punto di taglio e il sink vuoto. Anteprime di prodotti e legalità, prima di confermare. Tutte le ricette rispettano il parser corrente e massimo quattro operatori.
- Rilascio nel fluido, modificando gli equilibri a seguito di una trasformazione.
- Undo e reset.
- Anteprima 3D dell'individuo selezionato, ottenuta da \`src/polytron/polytron.ts\` e geometria Polyhedronisme; nella mappa, i glifi 2D sono soltanto segnaposto per un futuro renderer 3D più complesso.
- \`selfTests()\` in \`phaseShiftEngine.ts\`, segnalati in UI all'avvio.

## Come provarlo
1. Apri \`?experiment=phase-shift\`; scegli **01 · Primo legame**.
2. Osserva il movimento continuo, prova il trascinamento diretto, la pausa e l'anteprima della cristallizzazione; poi prova \`Cristallizza sui sink\` senza avanzare il campo.
3. Seleziona A e B (nell'ordine) e premi \`Fondi\`. Si dovrebbe ottenere **ad05C**; verifica anche che si riduca ENERGY.
4. Premi \`Rilascia nel campo fluido\`, osserva la simulazione ripartire automaticamente, con legami, stress e posizione che cambiano; in pausa puoi avanzare per passi tecnici.
5. Annulla e ripeti cambiando prima la posizione con un trascinamento oppure con impulsi (senza alcun vincolo di velocità).
6. Nella fase cristallina prova la fissione di **adk02D**, scegliendo uno dei due tagli legali e una cella libera adiacente. Verifica che cambino le ricette e le conseguenze del rilascio.
7. Ripeti nello scenario **02 · Campo perturbato**.

## Cosa misurare, senza confondere stupore e gioco
- La scelta della fase influenza davvero la prossima mossa conveniente?
- Dopo due cicli, il giocatore sa prevedere il risultato della cattura (preview visibile)?
- L'uso di fusione/fissione produce nuove opzioni oppure soltanto cambia il colore dei glifi?
- L'impulso controllato offre una scelta utile o è un clic superfluo?
- Dopo una trasformazione riesci a spiegare *quale affinità* è cambiata?
- Quale passaggio è soltanto bello da guardare e potrebbe essere rimosso senza perdita ludica?

## Limiti deliberati
- Non è un playtest con giocatori né un puzzle con soluzione ottimale certificata. Primo scenario = tutorial dimostrativo, secondo = laboratorio comparativo.
- La funzione delle affinità cromatiche è inventata e semplicissima; non è ancora genetica cromatica mendeliana.
- Il solido di partenza influenza qui una distanza radiale, ma il collegamento con la reale topologia poliedrica non è ancora formalizzato.
- La quantità chiamata "stress" è un osservabile, NON una seconda valuta. Non basta a certificare un equilibrio: mostriamo anche il moto RMS. La somma degli scarti cambia scala quando cambia il numero di individui.
- La quantizzazione globale minimizza la somma degli spostamenti quadratici, ma può scegliere un sink non strettamente più vicino per ogni singola particella. Il preview usa esattamente la stessa funzione dell'azione.
- La fissione conserva il seme e la palette nei due frammenti ma non conserva il volume fisico del poliedro; manipola una *ricetta*.
- La simulazione è riproducibile a livello dello stato TypeScript a parità di input e passi; non dichiariamo ancora garanzie di bit-identity su tutte le piattaforme.
- Il campo usa una fisica di prototipo con forze semplificate e smorzamento. Non rappresenta fedelmente Particle Lenia o Lenia.
- **GitHub Pages ospita un solo sito per repository**, quindi la pubblicazione sperimentale sostituisce la precedente. Il branch contiene anche Ring Reactor, Discovery Lab e catalogo originali.

## Riferimenti di co-design
- Sessione 06: \`research/sprint06-fusion-fission-co-design\` / \`research/SESSIONE_06_CO_DESIGN.md\`
- Sessione 07: \`research/sprint07-lenia-crystallization\` / \`research/SESSIONE_07_LENIA_CRISTALLIZZAZIONE.md\`

## Verifiche tecniche / deploy
Workflow: \`.github/workflows/pages-dual-state.yml\`. Esegue \`npm ci\`, \`npm run typecheck\`, \`npm run build\` e controlli per Pages/Vite. Se fallisce prima di qualsiasi step, il problema riguarda l'avvio del job, non un errore del motore identificato. Per restrizioni dell'environment \`github-pages\`, il workflow usa il proprio environment \`phase-lab\` (da verificare in GitHub Actions). Non affermare che sia online prima del successo della build e del deploy.


## Aggiornamento 08b — Feedback autore e discussione degli agenti
- [Report Sessione 08b — stress, ENERGY, cromia e probabilità](research/SESSIONE_08B_FEEDBACK_E_ENERGY.md).
- Aggiornati: realtime automatico, pausa, drag, focus visivo, legami cromatici continui e preview di fusione/fissione.
- **Non ancora implementati**: produzione ENERGY da stati nobili/stabili, mutazioni seed, palette primario/secondario e genetica probabilistica. Sono problemi progettuali aperti, non feature attive.
- Futuro: vista 2D↔3D indipendente dalle fasi fisiche fluido/cristallo.
