// Leonida Ledger — the entrypoint for gta6-trophy-guide-01 (Node 22, stdlib only).
//
// The guide itself is plain static files under app/ (index.html, app.js, style.css
// and data/trophies.json), offline by design: it loads nothing over the network.
// This program hands the guide in. It copies app/ and screenshots/ from beside
// this file into the output directory and writes dossier.json there, the summary
// the judge reads (the screenshots, the first load's files and bytes, the source),
// built with the vendored make.fun library. The library must stay exactly as the
// kit shipped it: the scorer rebuilds the dossier with its own copy and compares
// the two byte for byte.
//
// Run it locally with:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader, MAKEFUN_OUTPUT_DIR is unset and /output is used instead.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// Where the repository sits, and where the entry goes.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(repoRoot, 'app'), join(outputDir, 'app'));
if (existsSync(join(repoRoot, 'screenshots'))) {
  copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));
}

// The scorer's caps for this competition: the dossier text at most 160 KiB, at
// most 4 screenshots of 256 KiB each, app/ at most 993 files and 48 MiB. The
// library refuses an entry past those limits, so a failure here is a real one.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});

writeFileSync(join(outputDir, 'dossier.json'), dossier);
