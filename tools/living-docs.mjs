#!/usr/bin/env node
// Living documentation generator.
// Scans every Gherkin .feature file (web + mobile, FR + EN) and renders a
// single business-readable HTML page. Dependency-free (Node built-ins only).

import { readFileSync, readdirSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const SOURCES = [
  { dir: join(ROOT, 'tests/playwright/features'), platform: 'Web' },
  { dir: join(ROOT, 'apps/mobile/e2e/features'), platform: 'Mobile' },
];

const STEP_KEYWORDS =
  /^(Étant donné(?: que| qu')?|Soit|Sachant que|Quand|Lorsque|Alors|Et|Mais|Given|When|Then|And|But|\*)\s+/;
const KW = {
  feature: /^(Fonctionnalité|Feature)\s*:\s*(.*)$/,
  background: /^(Contexte|Background)\s*:/,
  scenario: /^(Scénario|Scenario)\s*:\s*(.*)$/,
  outline: /^(Plan du [Ss]cénario|Scenario Outline|Scenario Template)\s*:\s*(.*)$/,
  examples: /^(Exemples|Examples)\s*:/,
};

function walk(dir) {
  let out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out = out.concat(walk(p));
    else if (name.endsWith('.feature')) out.push(p);
  }
  return out;
}

function parseFeature(text) {
  const lines = text.split('\n');
  const feature = { lang: '', name: '', tags: [], description: [], scenarios: [] };
  let pendingTags = [];
  let section = null; // 'feature' | 'background' | 'scenario'
  let current = null;
  let inExamples = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const lang = line.match(/^#\s*language\s*:\s*([a-zA-Z-]+)/);
    if (lang) { feature.lang = lang[1]; continue; }
    if (line.startsWith('#')) continue;

    if (line.startsWith('@')) {
      pendingTags.push(...line.split(/\s+/).filter((t) => t.startsWith('@')));
      continue;
    }

    let m;
    if ((m = line.match(KW.feature))) {
      feature.name = m[2].trim();
      feature.tags = pendingTags;
      pendingTags = [];
      section = 'feature';
      inExamples = false;
      continue;
    }
    if (KW.background.test(line)) {
      section = 'background';
      inExamples = false;
      continue;
    }
    if ((m = line.match(KW.outline)) || (m = line.match(KW.scenario))) {
      const isOutline = KW.outline.test(line);
      current = {
        type: isOutline ? 'outline' : 'scenario',
        name: m[2].trim(),
        tags: pendingTags,
        steps: [],
        examples: [],
      };
      feature.scenarios.push(current);
      pendingTags = [];
      section = 'scenario';
      inExamples = false;
      continue;
    }
    if (KW.examples.test(line)) { inExamples = true; continue; }

    if (inExamples && line.startsWith('|')) {
      current.examples.push(line.split('|').map((c) => c.trim()).filter(Boolean));
      continue;
    }
    if (STEP_KEYWORDS.test(line)) {
      if (section === 'scenario' && current) current.steps.push(line);
      // background steps are implied; we don't render them per-scenario
      continue;
    }
    if (section === 'feature') feature.description.push(line);
  }
  return feature;
}

// ---- Collect -------------------------------------------------------------
const features = [];
for (const { dir, platform } of SOURCES) {
  for (const file of walk(dir).sort()) {
    const f = parseFeature(readFileSync(file, 'utf8'));
    f.platform = platform;
    f.file = relative(ROOT, file);
    features.push(f);
  }
}

const totalScenarios = features.reduce((n, f) => n + f.scenarios.length, 0);
const tagCounts = {};
for (const f of features)
  for (const s of f.scenarios)
    for (const t of [...f.tags, ...s.tags]) tagCounts[t] = (tagCounts[t] || 0) + 1;

// ---- Render --------------------------------------------------------------
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const langBadge = (l) => (l === 'fr' ? '🇫🇷 FR' : l === 'en' ? '🇬🇧 EN' : esc(l || '?'));
const tagChips = (tags) =>
  tags.map((t) => `<span class="tag">${esc(t)}</span>`).join(' ');

function renderExamples(ex) {
  if (!ex.length) return '';
  const [head, ...rows] = ex;
  return `<table class="examples"><thead><tr>${head
    .map((c) => `<th>${esc(c)}</th>`)
    .join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
}

function renderScenario(s) {
  const type = s.type === 'outline' ? 'Plan du scénario' : 'Scénario';
  return `<div class="scenario">
    <div class="scenario-head"><span class="stype">${type}</span> ${esc(s.name)} ${tagChips(s.tags)}</div>
    <ul class="steps">${s.steps.map((st) => `<li>${esc(st)}</li>`).join('')}</ul>
    ${renderExamples(s.examples)}
  </div>`;
}

function renderFeature(f) {
  return `<section class="feature">
    <h3>${esc(f.name)} <span class="plat ${f.platform.toLowerCase()}">${f.platform}</span> <span class="lang">${langBadge(f.lang)}</span> ${tagChips(f.tags)}</h3>
    <div class="file">${esc(f.file)}</div>
    ${f.description.length ? `<p class="desc">${f.description.map(esc).join('<br>')}</p>` : ''}
    ${f.scenarios.map(renderScenario).join('')}
  </section>`;
}

const tagLegend = Object.entries(tagCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([t, n]) => `<span class="tag">${esc(t)} <b>${n}</b></span>`)
  .join(' ');

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Taskly — Living Documentation</title>
<style>
  :root{--bg:#0f172a;--card:#1e293b;--text:#e2e8f0;--muted:#94a3b8;--accent:#a5b4fc;--border:#334155}
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);line-height:1.5}
  .wrap{max-width:920px;margin:0 auto;padding:2rem 1.25rem}
  h1{font-size:1.8rem;margin:0 0 .25rem}
  .sub{color:var(--muted);margin:0 0 1.5rem}
  .summary{display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1.5rem}
  .stat{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:.75rem 1.1rem}
  .stat b{font-size:1.5rem;display:block}
  .legend{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1rem;margin-bottom:2rem}
  .feature{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:1.25rem 1.4rem;margin-bottom:1.25rem}
  h3{margin:0 0 .15rem;font-size:1.15rem}
  .file{color:var(--muted);font-size:.78rem;font-family:ui-monospace,monospace;margin-bottom:.6rem}
  .desc{color:var(--muted);font-size:.9rem;margin:.25rem 0 1rem}
  .scenario{border-top:1px solid var(--border);padding:.8rem 0}
  .scenario-head{font-weight:600;margin-bottom:.35rem}
  .stype{color:var(--accent);font-weight:700;margin-right:.25rem}
  .steps{margin:.2rem 0 .4rem;padding-left:1.1rem;color:var(--text)}
  .steps li{margin:.1rem 0}
  .tag{display:inline-block;background:#312e81;color:#c7d2fe;border-radius:999px;padding:.05rem .5rem;font-size:.72rem;font-weight:600}
  .plat{display:inline-block;border-radius:6px;padding:.05rem .45rem;font-size:.72rem;font-weight:700}
  .plat.web{background:#0e7490;color:#cffafe}
  .plat.mobile{background:#7c3aed;color:#ede9fe}
  .lang{font-size:.78rem;color:var(--muted)}
  table.examples{border-collapse:collapse;margin:.3rem 0 .2rem;font-size:.82rem}
  table.examples th,table.examples td{border:1px solid var(--border);padding:.2rem .55rem;text-align:left}
  table.examples th{background:#0b1220;color:var(--muted)}
  footer{color:var(--muted);font-size:.8rem;margin-top:2rem;text-align:center}
</style></head>
<body><div class="wrap">
  <h1>Taskly — Living Documentation</h1>
  <p class="sub">Comportements garantis par la suite de tests, générés depuis les fichiers Gherkin (FR + EN, web + mobile).</p>
  <div class="summary">
    <div class="stat"><b>${features.length}</b> fonctionnalités</div>
    <div class="stat"><b>${totalScenarios}</b> scénarios</div>
    <div class="stat"><b>${Object.keys(tagCounts).length}</b> tags</div>
  </div>
  <div class="legend"><strong>Tags</strong><br>${tagLegend || '<span class="muted">aucun</span>'}</div>
  ${features.map(renderFeature).join('')}
  <footer>Généré par <code>tools/living-docs.mjs</code> — ne pas éditer à la main.</footer>
</div></body></html>`;

const outDir = join(ROOT, 'docs');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, 'living-documentation.html');
writeFileSync(outFile, html);
console.log(
  `✓ Living documentation: ${relative(ROOT, outFile)} — ${features.length} features, ${totalScenarios} scénarios, ${Object.keys(tagCounts).length} tags`,
);
