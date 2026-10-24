import { useState } from "react";
import ConwayRingLab from "@/experiments/ConwayRingLab";
import HexWorld, { PALETTE_SETS } from "@/components/HexWorld";
import { runCodecSelfTests } from "@/polytron/mapping";
import { runInterestingSelfTests } from "@/polytron/interesting";

type TestResult = {
  passed: number;
  failed: Array<{ label: string; detail: string }>;
  done: boolean;
  error?: string;
};

// In-app self-tests, only run when the URL contains ?run-tests.
function runTests(): Promise<TestResult> {
  return new Promise((resolve) => {
    // Let the overlay paint before the (heavy) synchronous test run.
    setTimeout(() => {
      try {
        const { passed, failed } = runCodecSelfTests();
        try {
          const more = runInterestingSelfTests();
          resolve({
            passed: passed + more.passed,
            failed: [...failed, ...more.failed],
            done: true,
          });
        } catch (e) {
          resolve({ passed, failed: [...failed, { label: "interesting-runner", detail: String(e) }], done: true });
        }
      } catch (e) {
        resolve({ passed: 0, failed: [], done: true, error: String(e) });
      }
    }, 50);
  });
}

function TestOverlay() {
  const [result, setResult] = useState<TestResult | null>(null);

  if (result === null) {
    runTests().then(setResult);
    return <div className="fixed inset-0 flex items-center justify-center text-white bg-black">Running self-tests…</div>;
  }

  return (
    <div className="fixed inset-0 overflow-auto bg-black text-white p-6 font-mono text-sm">
      {result.error ? (
        <p className="text-red-400">Test runner crashed: {result.error}</p>
      ) : (
        <>
          <p className={result.failed.length === 0 ? "text-green-400" : "text-red-400"}>
            {result.failed.length === 0 ? "ALL TESTS PASSED" : "TESTS FAILED"} — {result.passed} passed,{" "}
            {result.failed.length} failed
          </p>
          <ul className="mt-4 space-y-1">
            {result.failed.map((f) => (
              <li key={f.label} className="text-red-400">
                {f.label}: {f.detail}
              </li>
            ))}
          </ul>
        </>
      )}
      <button
        className="mt-6 px-4 py-2 border border-white/40 rounded hover:bg-white/10"
        onClick={() => setResult(null)}
      >
        Re-run
      </button>
    </div>
  );
}

function App() {
  if (new URLSearchParams(window.location.search).get("experiment") === "conway-ring") return <ConwayRingLab />;
  const runTestsParam = new URLSearchParams(window.location.search).has("run-tests");
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [clearSignal, setClearSignal] = useState(0);
  const [interestingMode, setInterestingMode] = useState(false);
  const [maxFaces, setMaxFaces] = useState(500);
  const [rings, setRings] = useState(25);
  const [fps, setFps] = useState<number | null>(null);
  const current = PALETTE_SETS[paletteIdx];

  const panelClass =
    "w-24 px-2 py-1.5 rounded-md border border-white/30 bg-black/60 text-white text-sm font-medium backdrop-blur-sm focus:outline-none focus:border-white/70 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  return (
    <>
      <HexWorld
        paletteSetId={current.id}
        clearSignal={clearSignal}
        interestingMode={interestingMode}
        maxRings={rings}
        maxFaces={maxFaces}
        onFps={setFps}
      />
      <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/30 bg-black/60 text-white/90 text-sm font-medium backdrop-blur-sm">
          <label htmlFor="max-faces" className="text-white/60">
            Max faces
          </label>
          <input
            id="max-faces"
            type="number"
            min={1}
            max={20000}
            value={maxFaces}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v) && v >= 1) setMaxFaces(Math.min(Math.floor(v), 20000));
            }}
            className={panelClass}
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/30 bg-black/60 text-white/90 text-sm font-medium backdrop-blur-sm">
          <label htmlFor="rings" className="text-white/60">
            Rings
          </label>
          <input
            id="rings"
            type="number"
            min={0}
            max={100}
            value={rings}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v) && v >= 0) setRings(Math.min(Math.floor(v), 100));
            }}
            className={panelClass}
          />
        </div>
        <div className="px-3 py-2 rounded-md border border-white/30 bg-black/60 text-white/90 text-sm font-mono backdrop-blur-sm min-w-16 text-center">
          {fps === null ? "—" : fps} fps
        </div>
        <button
          className="px-4 py-2 rounded-md border border-white/30 bg-black/60 text-white/90 text-sm font-medium backdrop-blur-sm hover:bg-black/80 hover:border-white/60 transition-colors"
          onClick={() => setClearSignal((n) => n + 1)}
        >
          Clear info
        </button>
        <button
          className="px-4 py-2 rounded-md border border-white/30 bg-black/60 text-white/90 text-sm font-medium backdrop-blur-sm hover:bg-black/80 hover:border-white/60 transition-colors"
          onClick={() => setInterestingMode((v) => !v)}
        >
          {interestingMode ? "Interesting only" : "All polytrons"}
        </button>
        <button
          className="px-4 py-2 rounded-md border border-white/30 bg-black/60 text-white/90 text-sm font-medium backdrop-blur-sm hover:bg-black/80 hover:border-white/60 transition-colors"
          onClick={() => setPaletteIdx((paletteIdx + 1) % PALETTE_SETS.length)}
        >
          {current.label}
        </button>
      </div>
      {runTestsParam && <TestOverlay />}
    </>
  );
}

export default App;
