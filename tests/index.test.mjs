import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');

test('uses the shared module generator instead of an embedded duplicate', () => {
  assert.match(html, /type="module"/);
  assert.match(html, /\.\/src\/ui-state\.mjs/);
  assert.match(html, /\.\/src\/fusion\.mjs/);
  assert.doesNotMatch(html, /function gen\(/);
});

test('offers every approved configurator choice', () => {
  for (const value of [
    'modern', 'legacy', 'colored', 'mono',
    'best-good-ok', 'tiers', 'source', 'percentages',
    'compact', 'separate', 'combined', 'audio', 'dv',
    'suppress-with-dv', 'show-both',
    'off', 'languages', 'uLanguages',
    'classic', 'filename', 'renoria', 'jeor', 'snoak',
    'detailed', 'icon-only', 'split',
  ]) assert.match(html, new RegExp(`data-v="${value}"`));
  for (const label of ['Icon Style', 'Icon Theme', 'Quality System', 'Languages Display', 'Formatter Display', 'Dolby Vision Display', 'Audio Display', 'Combination System', 'HDR Display', 'Quality Badges', 'SeaDex Display']) {
    assert.match(html, new RegExp(`>${label}<`));
  }
  assert.match(html, />Tiers \(T1\/T2\/T3\)</);
  assert.match(html, />Best\/Good\/OK</);
  assert.match(html, />Percentages</);
  assert.match(html, /data-g="quality"[\s\S]*?data-v="tiers"[\s\S]*?data-v="best-good-ok"[\s\S]*?data-v="source"[\s\S]*?data-v="percentages"/);
  assert.doesNotMatch(html, />Scores \(Best\/Good\/OK\)|>Scores \(%\)</);
  assert.match(html, />Preferred Only</);
  assert.match(html, /data-g="languageMode"[\s\S]*?data-v="uLanguages"[\s\S]*?data-v="languages"[\s\S]*?data-v="off"/);
  assert.match(html, />All Detected</);
  assert.match(html, /data-g="priority"[\s\S]*?class="o on" data-v="dv"[\s\S]*?>Pair Atmos with DV<[\s\S]*?data-v="audio"[\s\S]*?>Pair Atmos with Audio</);
  assert.match(html, />DV Priority</);
  assert.doesNotMatch(html, />Keep Separate</);
  assert.equal((html.match(/>Separate Badges</g) || []).length, 2);
  assert.match(html, />Split \(Best\/Alt\)</);
  assert.match(html, /data-g="formatterStyle"[\s\S]*?class="o on" data-v="classic"[\s\S]*?>Classic<[\s\S]*?data-v="filename"[\s\S]*?>Filename<[\s\S]*?data-v="renoria"[\s\S]*?>Renoria<[\s\S]*?data-v="jeor"[\s\S]*?>Jeor<[\s\S]*?data-v="snoak"[\s\S]*?>Snoak</);
  assert.doesNotMatch(html, /data-v="fusion"|data-v="classic-service"|data-v="classic-filename"/);
});

test('keeps Modern-only combination choices visible and accessibly locked for Legacy', () => {
  assert.match(html, /data-modern-only="true"/);
  assert.match(html, /setAttribute\('aria-disabled', legacy\.toString\(\)\)/);
  assert.match(html, /Combined badges are available only with Modern\./);
  assert.match(html, /class="tip-pop"/);
  assert.match(html, /showPopup/);
});

test('uses a single scrolling stack with Preview before collapsed Advanced Settings', () => {
  assert.match(html, /class="wrap"/);
  assert.match(html, /class="sec"/);
  assert.match(html, /class="opts"/);
  assert.doesNotMatch(html, /class="controls-grid"/);
  assert.doesNotMatch(html, /grid-template-columns:repeat\(2/);
  assert.match(html, /<div id="pv"><\/div>[\s\S]*<details class="advanced" id="advanced">/);
  assert.doesNotMatch(html, /<details class="advanced" id="advanced" open/);
  assert.match(html, /<summary>\s*<span class="advanced-title"><span class="oph">Advanced Settings<\/span><\/span>\s*<span class="section-note">Fine-tune how Dolby Vision, audio, HDR, quality, and SeaDex badges are displayed\.<\/span>\s*<\/summary>/);
  assert.match(html, /\.advanced\{[^}]*border:0;[^}]*background:transparent/);
  assert.match(html, /\.advanced-body\{padding:0\}/);
  assert.match(html, /\.advanced summary\{[^}]*margin:1\.8rem 0 0/);
  assert.match(html, /\.advanced-title\{[^}]*gap:\.35rem;[^}]*margin-bottom:\.6rem/);
  assert.match(html, /\.advanced-title \.oph\{margin:0;font-weight:700\}/);
  assert.match(html, /\.advanced\[open\] summary \.section-note\{margin-bottom:\.8rem\}/);
  assert.match(html, /toggleAttribute\('hidden', !current\.pairingPriorityVisible\)/);
});

test('keeps information and disabled-state popups open until explicit dismissal', () => {
  assert.equal((html.match(/class="info-btn"/g) || []).length, 11);
  assert.doesNotMatch(html, /popupTimer|setTimeout\([^,]+, 4000\)/);
  assert.match(html, /document\.addEventListener\('pointerdown'/);
  assert.match(html, /popup\.contains\(event\.target\)/);
  assert.match(html, /openTrigger\?\.contains\(event\.target\)/);
  assert.match(html, /openPopup === card && openTrigger === trigger/);
  assert.match(html, /event\.key === 'Escape'/);
  assert.match(html, /function closePopup\(\)/);
  assert.match(html, /showPopup\(option\.closest\('\.sec'\), reason, option\)/);
});

test('matches the live control-card geometry without changing the preview shell', () => {
  assert.match(html, /\.wrap\{max-width:640px;[^}]*padding:1\.5rem 1rem 4rem/);
  assert.match(html, /\.sec\{[^}]*margin-bottom:\.9rem;[^}]*padding:\.9rem 1rem/);
  assert.match(html, /\.sh\{[^}]*justify-content:flex-start;[^}]*gap:\.3rem/);
  assert.match(html, /\.info-btn\{[^}]*width:12px;[^}]*height:12px;[^}]*flex:0 0 12px;[^}]*border:1px solid #2b2b2b;[^}]*border-radius:50%;[^}]*background:#171717/);
  assert.match(html, /\.tip-pop\{[^}]*width:210px;[^}]*max-width:calc\(100vw - 2rem\)/);
  assert.match(html, /@media\(max-width:520px\)\{[\s\S]*?\.wrap\{padding:1\.5rem \.65rem 3rem\}[\s\S]*?h1\{font-size:1\.5rem;margin-left:\.35rem\}[\s\S]*?\.sub\{margin:0 \.35rem 1\.8rem\}[\s\S]*?\.sec\{margin:0 \.35rem \.9rem;padding:\.9rem 1rem;border-radius:12px\}/);
  assert.doesNotMatch(html, /\.o\{padding:\.34rem \.52rem/);
  assert.doesNotMatch(html, /\.opts\{gap:\.27rem\}/);
});

test('contains no duplicate element IDs', () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
});

test('renders marker matches with the original preview treatment', () => {
  assert.match(html, /function rgbaFromARGB\(value\)/);
  assert.match(html, /border-color:\$\{rgbaFromARGB\(filter\.borderColor\)\}/);
  assert.match(html, /background:\$\{rgbaFromARGB\(filter\.tagColor\)\}/);
  assert.match(html, /color:\$\{rgbaFromARGB\(filter\.textColor\)\}/);
  assert.match(html, /\.tg\{[^}]*padding:0 9px;[^}]*height:26px/);
  assert.doesNotMatch(html, /\.tg\{[^}]*min-height:/);
  assert.match(html, /\.tg img\{height:17px/);
  assert.match(html, /\.tg\.lg img\{height:24px\}/);
  assert.match(html, /C\.badgeFamily === 'modern' && \(filter\.id === 'a-dv'/);
  assert.match(html, /\.\/src\/preview\.mjs/);
  assert.doesNotMatch(html, /const STREAMS = \[/);
});

test('keeps the compact identity without helper copy or a mobile grid', () => {
  assert.match(html, /@media\(max-width:520px\)/);
  assert.doesNotMatch(html, /\.opts\{[^}]*grid-template-columns|class="controls-grid"/);
  assert.doesNotMatch(html, /class="hint"/);
  assert.doesNotMatch(html, /\.hint\{/);
});

test('renders the conditional live-site-style setup guide with local copy feedback', () => {
  assert.match(html, /<h2 class="oph">Setup Guide<\/h2>\s*<div class="section-note" id="guide-intro"><\/div>\s*<h2 class="oph setup-heading">Setup<\/h2>\s*<div id="guide"><\/div>/);
  assert.match(html, /document\.getElementById\('guide-intro'\)\.textContent = guideIntroduction\(\)/);
  assert.match(html, /guide\.innerHTML = steps\.join\(''\)/);
  assert.match(html, /Scoring Template/);
  assert.match(html, /AIOStreams → Featured Templates → Tamtaro Complete SEL Setup → Load Template/);
  assert.match(html, /Overrides filters and sorting only/);
  assert.match(html, /AIOStreams → Formatter → Import from URL → Save/);
  assert.match(html, /Fusion → Settings → Filters → Import Filters/);
  assert.match(html, />Copy Import URL</);
  assert.match(html, /Copied!/);
  assert.match(html, /Copy failed/);
  assert.match(html, /C\.quality !== 'source'/);
  assert.doesNotMatch(html, /Copy Marker Suffix|Copy Formatter URL|suffix-length|formatter-url|fusion-url|class="toast"|class="warn"|5,000-character/);
});

test('offers Custom last with a disk glyph and an accessible import dialog', () => {
  assert.match(html, /data-g="formatterStyle"[\s\S]*?data-v="snoak"[\s\S]*?data-v="custom"[\s\S]*?<svg/);
  assert.match(html, /data-v="custom"[^>]*>[\s\S]*?<span>Custom<\/span><\/button>/);
  assert.match(html, /<dialog id="custom-formatter-dialog"[\s\S]*?aria-labelledby="custom-dialog-title"/);
  assert.match(html, /dialog\{[^}]*margin:auto/);
  assert.match(html, /id="custom-local-btn"[\s\S]*?>Import from File</);
  assert.match(html, /id="custom-url-btn"[\s\S]*?>Import from URL</);
  assert.match(html, /id="custom-file-input"[^>]*accept="\.json,application\/json"/);
  assert.match(html, /id="custom-url-input"[^>]*type="url"/);
  assert.match(html, /role="alert"/);
  assert.match(html, /if \(event\.key === 'Escape'\) \{ closePopup\(\); if \(customDialog\.open\) closeCustomDialog\(\); \}/);
});

test('loads custom formatters through the shared domain module and keeps them session-only', () => {
  assert.match(html, /\.\/src\/custom-formatter\.mjs/);
  assert.match(html, /parseCustomFormatter/);
  assert.match(html, /composeCustomFormatter/);
  assert.match(html, /renderCustomFormatter/);
  assert.match(html, /customFormatterFileName/);
  assert.match(html, /let customFormatter/);
  assert.doesNotMatch(html, /localStorage[^\n]*custom|sessionStorage[^\n]*custom/i);
  assert.match(html, /response = await fetch\(url/);
  assert.match(html, /\['http:', 'https:'\]\.includes\(parsedUrl\.protocol\)/);
  assert.match(html, /host may block browser requests \(CORS\)/);
  assert.match(html, /if \(!url\) throw new TypeError\('Enter an HTTP or HTTPS formatter URL\.'\)/);
  assert.match(html, /catch \(fetchError\) \{[\s\S]*?fetchError instanceof TypeError[\s\S]*?host may block browser requests \(CORS\)/);
});

test('renders custom visible text safely while preserving the Fusion badge pipeline', () => {
  assert.match(html, /formatterContextFor/);
  assert.match(html, /renderCustomFormatter\(customFormatter, formatterContextFor\(stream\)\)/);
  assert.match(html, /escapeHTML\(visible\.name\)/);
  assert.match(html, /escapeHTML\(visible\.description\)/);
  assert.match(html, /const badges = matchingFilters\(stream\)\.map\(badgeHTML\)\.join\(''\)/);
});

test('downloads custom JSON with escaped markers and restores URL copying for built-ins', () => {
  assert.match(html, /Download JSON/);
  assert.match(html, /AIOStreams → Formatter → Import → Import from File → Save/);
  assert.match(html, /stringifyExport/);
  assert.match(html, /new Blob\(\[stringifyExport\(formatter\)\]/);
  assert.match(html, /customFormatterFileName\(customSourceStem\)/);
  assert.match(html, /C\.formatterStyle === 'custom'/);
  assert.match(html, /Copy Import URL/);
  assert.match(html, /data-guide-download/);
});
