# Sprint 30 — Force Diagnostics / Cubo incompatibile

**Data:** 29 ottobre 2026.  
**Branch:** \`experiments/sprint30-force-diagnostics\`, dal precedente \`experiments/sprint29-selection-visibility\`.  
**URL:** \`?experiment=planar-rapier\` su GitHub Pages.  
**Stato:** diagnostica di forze implementata; **attrazione selettiva NON ancora applicata al moto**.

## Motivazione

In una prova con Cubo (seme \`C\`/Combina) si osserva un accumulo di viaggiatori. L'esame di \`PlanarRapierEngine.ts\` conferma **due contributi indipendenti**:

1. **Forza transformer→viaggiatore universale**: per ogni coppia, campo attrattivo regolarizzato \`grav=(4+5*similarity)*attraction/(.7+distance²)\` più termine elastico \`(distance-ideal)*.15*attraction\`. Anche a somiglianza Shape-DNA zero il campo grav è positivo, quindi può trattenere viaggiatori geneticamente incompatibili.
2. **Buffer Cubo (meccanica Combina)**: il primo viaggiatore viene disabilitato come corpo Rapier e rimane in attesa del partner; timeout \`361\` passi logici a 120Hz circa 3 s. Fusioni effettive richiedono stesso seme, stessa palette, almeno un gene Conway complessivo e lunghezza totale con wrapper della stazione ≤4. **Due portatori \`01C\` non si fondono**: è una trasformazione nulla con rilascio del primo, ma l'attrazione universale può farli tornare.

Altri fattori: le molle fra viaggiatori hanno intensità bassa rispetto al campo delle stazioni; e l'Architron-Sorgente attrae chi ha già avuto almeno un contatto e possiede la palette di rientro.

## Codice e strumenti aggiunti

- \`Plan.forceChannels\` con tre interruttori **indipendenti**:
  - \`transformers\` → il campo planare da stazioni a viaggiatori
  - \`travelers\` → le molle Shape-DNA fra coppie di viaggiatori
  - \`source\` → richiamo planare dell'Architron-Sorgente
- I tre interruttori sono **tutti attivi per impostazione predefinita**, mantenendo la fisica precedente. Il vecchio \`Plan.physics="off"\` continua a spegnere transformer e molle, ma non agisce sul richiamo della Sorgente, ora esplicitamente separato. **Il richiamo verticale al piano** continua sempre a operare (non fa parte di queste tre famiglie, perché è un vincolo costitutivo del Mutatron).
- UI con modalità rapide: «Tutte», «Solo urti», «Solo transformer», «Solo viaggiatori», «Solo Sorgente». Ogni modifica resetta deterministicamente la prova, preservando DNA, emissione, geometria e random seed.
- In \`agentsView()\` i viaggiatori includono \`forces\`: contributi orizzontali vettoriali (\`x\`,\`z\`, magnitudine) separati per le tre famiglie, forza verticale applicata, per ogni controller modulo, distanza effettiva, distanza preferita, similarità spettrale e **diagnosi genetica**. Le diagnostiche sono campionate **prima** di \`world.step\`, gli impulsi Rapier da urti non sono inclusi; se forze opposte si annullano il vettore risultante può valere zero pur con componenti importanti.
- Per un controller \`C\` l'Inspector mostra \`Cubo libero\` o \`Buffer Cubo occupato\`, con ID e DNA del partner, età e durata residua del buffer; per tutti i viaggiatori in volo mostra la reattività genetica verso il partner attualmente trattenuto.
- \`rapierCompatibility.ts\` ospita \`cubeFusion\` (riutilizzato anche dalla **vera reazione** dell'engine, per evitare diagnosi e codice divergenti) e \`analyzeEncounter\` per tutti i semi. L'Inspector distingue fra \`ready\`, \`waiting\`, \`blocked\`, \`pass\`. Questa analisi **non governa l'attrazione**, al momento.
- Collisioni 3D vere, ricostruzione collider Conway, pannello DNA, picking, pausa su collisione e rapporti di scala delle famiglie rimangono quelli del precedente Sprint29.

## Esperimento comparativo C0 / C1: protocollo

**C0 — Controllo con tutte le forze attive:** nello scenario «Cinque verbi platonici» scegliere Cubo P02 e viaggiatori di DNA \`01C\`, scegliere «Tutte». Attivare «Pausa alla collisione», osservare forza di P02 su viaggiatore v*, stato buffer C, compatibilità e motivo della fusione nulla. Ripetere con lo stesso seed.

**C1 — Senza il richiamo dei transformer:** stesso identico scenario, stessa scarica, ma spegnere soltanto «Attrazione transformer ↔ viaggiatori». Continuano a operare molle fra viaggiatori e richiamo della Sorgente. Misurare frequenza dei contatti, tempi nei pressi del Cubo e quanti rientri avvengono. Per il controllo estremo «Solo urti» spegne **tutti e tre** i campi planari, lasciando dinamica Rapier e richiamo al piano.

**Controlli supplementari:** «Solo transformer» contro «Solo viaggiatori», e «Solo Sorgente», per capire quale componente crea aggregazione; ricordare che il richiamo della Sorgente **si attiva soltanto dopo un incontro** e solo con palette appropriata.

Le forze effettive nell'Inspector sono in **newton** secondo le unità di massa/distanza/tempo del modello Rapier; le tarature per il gioco restano ipotesi ludiche. I campi non sono ancora un modello completo di scambio di energia potenziale o lavoro delle mutazioni.

## Test

\`scripts/check-rapier-forces.mjs\`:
- compila il motore e UI con esbuild, verifica rendering React dei controlli e presenza degli Inspector condizionali;
- conferma la stessa logica di fusione in motore e diagnosi, inclusa **fusione impossibile di \`01C\` + \`01C\`** e fusione possibile di \`a01C\` + \`01C\`;
- verifica, eseguendo **Rapier WASM reale**, che tre famiglie di forze siano misurabili e disattivabili singolarmente, che la forza zero venga riportata precisamente come zero, che le stazioni rimangano consultabili anche se la loro forza è spenta;
- controlla il richiamo della Sorgente dopo vera trasformazione cromatica in condizione di rientro e verifica un vero Cubo occupato con un \`01C\`.
- la CI esegue tutte le regressioni precedenti e il build/deploy GitHub Pages.

## Cosa NON è stato fatto

**Nessuna nuova attrazione genetica selettiva** in questo sprint. Non è stata introdotta alcuna fase obbligatoria di rilascio o forza orbitale: dobbiamo prima misurare il fenomeno. Questa distinzione è centrale per non confondere la causalità fra una regola nuova e gli effetti della fisica preesistente.

## Decisione proposta per Sprint31 dopo esperimenti

Valutare una legge selettiva:
- Cubo libero: debole richiamo/possibilità di cattura iniziale;
- Cubo con primo partner: attrazione intensa solo verso potenziali partner validi (secondo \`cubeFusion\`);
- dopo incontro: breve fase di rifiuto di ricattura dello stesso carrier finché non esca da un volume definito;
- appoggiare i criteri di affinità Shape-DNA come modulatore della forza, mai come sostituto della fattibilità genetica;
- introdurre metriche quantitative sulla permanenza nel raggio di collisione, incontri utili, collisioni ripetute e ritorni alla Sorgente.

Le sette prospettive simulate del Design Team (Ludologo, Architetto del Puzzle, Progettista di Sistemi Emergenti, Genetista, Psicologo del Giocatore, Fisico-Matematico, Compositore di Sistemi Musicali) sostengono questo approccio sperimentale, pur mantenendo dissenso sulla scelta finale di attrazione selettiva vs campo geometrico di fondo.
