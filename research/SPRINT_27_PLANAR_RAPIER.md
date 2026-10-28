# Sprint 27 — Planar Rapier Mutatron
## Rigid-body tridimensionali, caleidoscopio planare e attrazione spettrale

**Data:** 28 ottobre 2026  
**Branch:** \`experiments/sprint27-planar-rapier\`, da \`experiments/sprint26-island-affinity-lab\`.  
**Entrypoint:** \`?experiment=planar-rapier\`. Il vecchio Island Affinity Lab rimane raggiungibile e non viene rimpiazzato.

## Vincolo fondamentale dell'autore (NON negoziabile)

Il movimento e le configurazioni finali restano nel **piano orizzontale del Mutatron**, con corpi intorno alla quota dei PolytronSink circa 1 unità sopra il piano. Non fare emissioni sferiche né uno swarm permanentemente tridimensionale. I poliedri sono tridimensionali: possono **ruotare, urtarsi in modo fisico, sollevarsi e scavalcarsi transitoriamente**, e poi devono ritornare verso il piano. La camera dall'alto definisce il caleidoscopio; uno **zoom-to-3D osservativo** (in prospettiva Tower Madness/cameraRig già presenti nel catalogo precedente) può mostrarne la profondità senza alterare le leggi.

## Implementazione dello Sprint 27

- **Rapier 3D**: pacchetto fissato a \`@dimforge/rapier3d-compat@0.21.0\` (JS/WASM con bundle compat), lockfile generato da npm nella GitHub Action dedicata. Test headless esegue Rapier WASM reale, non un proxy.
- **Three.js**: poliedri e palette dal codice esistente \`polytronGeometry\`, con vertici/colliders convessi da \`dnaToPoly\`. Illuminazione, materiali, bordi, rotazioni reali da quaternioni Rapier.
- **Corpi rigidi**: controller/isole con rigid body *fixed* alla quota desiderata; viaggiatori *dynamic* con massa, velocità, inerzia angolare, friction, restitution, CCD e veri collision events. Le stazioni restano nominate come nei prototipi.
- **Quota di equilibrio**: la gravità Rapier agisce lungo Y ma i viaggiatori ricevono una forza esterna che la bilancia e aggiunge una molla di richiamo all'altezza del sink. Parametri calcolati da \(k=m(2\pi/T)^2\), \(c=2\zeta m(2\pi/T)\) (T periodo naturale, ζ rapporto di smorzamento).
- **Correzione fisica critica**: le forze applicate con \`RigidBody.addForce\` sono **persistenti** in Rapier! Il motore deve eseguire \`resetForces(true)\` all'inizio di ogni passo, altrimenti le forze e l'energia numerica si accumulano artificiosamente e i corpi schizzano via.
- **Attrazioni**: controller↔viaggiatori con campo gravitation-like regolarizzato a distanza, ampiezza dipendente dall'affinità Shape-DNA effettivamente misurata; viaggiatore↔viaggiatore conserva la distanza preferita come **termine elastico** derivato dallo stesso descrittore. Entrambe le leggi sono **ipotesi ludiche**, non conseguenze necessarie della fisica dei solidi o di Shape-DNA.
- **Fisica a passo fisso 120 Hz**, rendering a frame rate variabile; corpi reali si scontrano (Rapier), rotazioni derivano dagli urti e non sono animate ad hoc.
- **Emissione**: una sonda singola o sei portatori simultanei in sei direzioni radialmente simmetriche nel piano; per dodici, due corone planari di sei posizioni sfasate evitano di far nascere collider interpenetranti.
- **Reazioni**: emissione iniziale da Architron-Sorgente, controller T/Colora (palette e operatori Conway della stazione applicati al DNA del viaggiatore), più \`C\` Combina, \`O\` Scinde, \`D\` Clona, \`I\` Seleziona in uno scenario esplorativo; colpi impossibili non distruggono il carrier, \`C\` usa buffer con rilascio. DNA modificato ricostruisce effettivamente *mesh e convex hull*.
- **Camera**: vista zenitale principale, seconda camera prospettica per osservare le collisioni e lo spostamento verticale, senza attivare moto sferico. La camera attuale è un **prototipo di osservazione**, non ancora il cameraRig completo già presente nel catalogo.
- **Calibrazione**: slider di periodo e damping, velocità radiale, attrazione spettrale, restituzione, accoppiamento fra viaggiatori, smorzamento angolare e quota di equilibrio. Parametri cambiati richiedono rilancio; non alterano retroattivamente una traiettoria.
- **Test**: script \`scripts/check-planar-rapier.mjs\` valida le formule critiche, l'emissione radiale, la presenza di controller fissi e viaggiatori dinamici, colliders in urto, trasformazioni genetiche da collisioni vere, assenza di NaN, quota limitata, vincolo esplicito di convergenza dall'alto verso la quota PolytronSink e conservazione della sola ENERGY *trasportata* senza farm da metamorfosi. La CI include regressioni degli altri laboratori e build Vite.

## Limiti dichiarati

1. **Non** è una dimostrazione di conservazione globale dell'energia meccanica: il campo esterno e la molla verticale svolgono lavoro; la trasformazione di una mesh cambia momento d'inerzia. Nelle normali collisioni fra corpi Rapier risolve impulsi e momento angolare, ma lo scambio con le isole *fixed* significa che la quantità di moto dei soli viaggiatori non è conservata come sistema isolato.
2. La molla verticale mantiene una quota di equilibrio, non è un vincolo rigido a y=1: una collisione può spingere temporaneamente fuori quota. È voluto. In condizioni di campo troppo forti possono esserci deviazioni eccessive; calibrare e verificare visivamente.
3. Shape-DNA è calcolato con FEM triangolare e limite di complessità. La componente spettrale ricorre a fallback dichiarato per mesh oltre i limiti; non chiamare quel fallback «Shape-DNA» esatto.
4. La MindeleevTable completa (persistenza, archiviazione di ricette apprese, forme selezionabili dal pet, assorbimento fra individui) **non** è ancora collegata all'esperimento 3D. I controller rappresentano le stazioni con nomi ma la storia non si consolida in questo lab.
5. Il confronto con Party Planner 2D resta possibile nel lab precedente. Il nuovo prototipo verifica soprattutto **urti fisici e piani di equilibrio**, non ha ancora un ottimizzatore autonomo dei parametri né simulazione accurata di costi energetici di trasmutazione.
6. Test automatizzati verificano riproducibilità locale di comportamento e proprietà fisiche, ma non possono giudicare la bellezza, intuitività o ricchezza musicale del caleidoscopio. La musica dello Sprint26 non è ancora integrata in questa scena Rapier 3D.
7. I 72 Polytroni e tutti i loro ID permanenti appartengono al progetto complessivo; il laboratorio simula sei controller e un pet-Sorgente, non il roster completo o il multiplayer.

## Prossimi test progettuali

- Lanciare **1 vs 6 vs 12** allo stesso budget e confrontare percentuali di incontri, tempi di viaggio, durata di orbite, sollevamenti e ritorni.
- Con camera zenitale verificare **simmetrie globali e deviazioni locali** causate dalle vere collisioni e dall'orientamento dei corpi, senza forzare simmetrie grafiche copiate.
- Attivare/disattivare l'attrazione spettrale, variare T/ζ e misurare convergenze e distribuzioni di orbite; distinguere l'effetto del moto di restituzione verticale dalle forze del piano.
- Scegliere una piccola famiglia di ricette con Shape-DNA veramente ben discriminante e confrontare distanze preferite/attrazione fra forme.
- Solo dopo giudicare quando implementare un **bilancio energetico meccanico pieno** e un sistema musicale causale più sviluppato.

**Decisione di design:** il gioco resta planare, visto preferenzialmente dall'alto; 3D reale = i corpi e gli urti, NON le traiettorie globali o il tipo di emissione.
