import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const temporary = await mkdtemp(join(tmpdir(), "mindeleev-phase-"));
try {
  const outfile = join(temporary, "phase-engine.mjs");
  await build({
    entryPoints: ["src/experiments/phaseShiftEngine.ts"],
    outfile,
    tsconfig: "tsconfig.app.json",
    bundle: true,
    platform: "node",
    format: "esm",
    logLevel: "warning",
  });
  const { selfTests } = await import(pathToFileURL(outfile).href);
  const errors = selfTests();
  if (errors.length) {
    console.error("Mutatron phase engine tests failed:", errors.join(", "));
    process.exitCode = 1;
  } else {
    console.log("Mutatron phase engine: every scenario and fission regression passed.");
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
