const fs = require('fs');
const path = require('path');

const dir = __dirname;
const index = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(dir, 'styles.css'), 'utf8');
const engine = fs.readFileSync(path.join(dir, 'poe.js'), 'utf8');
const app = fs.readFileSync(path.join(dir, 'app.js'), 'utf8');

const start = index.indexOf('<div id="bb-poe-calculator">');
const end = index.indexOf('<script src="poe.js"></script>');
if (start < 0 || end < 0 || end <= start) throw new Error('Could not locate calculator body in index.html');

const body = index.slice(start, end).trim();
const bundle = `<!--\nPhase 11.3 — Native PoE Budget Calculator\nBlogger page body bundle.\nNo iframe. No CDN. No API dependency. No Supabase dependency.\n-->\n<style>\n${css}\n</style>\n\n${body}\n\n<script>\n${engine}\n</script>\n<script>\n${app}\n</script>\n`;

const outDir = path.join(dir, '..', '..', 'blogger');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'poe-budget-calculator.html');
fs.writeFileSync(out, bundle, 'utf8');
console.log(out);
