// 家庭预算管家 · Household Budget Planner — hand-in program.
//
// This repo is a plain static site: app/ is the site itself (HTML, CSS and
// ES modules, no build step, nothing loaded over the network) and
// screenshots/ holds three real browser renders of it running. This program
// gathers both into /output and writes /output/dossier.json, the summary
// the make.fun judge reads: the screenshots, the first load's files and
// bytes, and the site's source. It runs on Node 22 with the standard
// library only.
//
// The dossier is written by the vendored make.fun library in
// vendor/makefun-frontend.ts, copied unchanged from the competition kit —
// the scorer requires dossier.json to be byte for byte what that library
// writes, so do not edit the vendored file.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Run it twice and the two dossier.json files must be byte-identical.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Make sure the output directory exists, then clear only its CONTENTS —
// never the directory itself. In the grader the output directory is a
// volume mount, and removing a mount point throws EBUSY ("Device or
// resource busy") even with force:true, which used to fail the run. Clearing
// the files inside it is safe and still keeps a stale screenshot or dossier
// from an earlier run from leaking into a later entry.
mkdirSync(outputDir, { recursive: true });
for (const entry of readdirSync(outputDir)) {
  rmSync(join(outputDir, entry), { recursive: true, force: true });
}

cpSync(join(repoDir, 'app'), join(outputDir, 'app'), { recursive: true });

const shotsDir = join(repoDir, 'screenshots');
const shotsTarget = join(outputDir, 'screenshots');
mkdirSync(shotsTarget, { recursive: true });
if (existsSync(shotsDir)) cpSync(shotsDir, shotsTarget, { recursive: true });

// Caps from the competition's own gate: at most 4 screenshots, each at most
// 256 KiB; app/ at most 993 files and directories and 16 MiB in all. Only
// text_max_bytes shapes the dossier bytes; the other caps refuse an entry
// the scorer would refuse.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`wrote ${join(outputDir, 'dossier.json')} (${dossier.length} bytes)`);
