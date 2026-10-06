import { useState } from "react";
import HexWorld from "@/components/HexWorld";
import { runCodecSelfTests } from "@/polytron/mapping";

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
        resolve({ passed, failed, done: true });
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
  const runTestsParam = new URLSearchParams(window.location.search).has("run-tests");
  return (
    <>
      <HexWorld />
      {runTestsParam && <TestOverlay />}
    </>
  );
}

export default App;
