#!/usr/bin/env node
/**
 * Skill Vision — verifica di conformità del sorgente.
 *
 *   node scripts/audit-identita.mjs [cartella]
 *
 * Controlla quello che si può controllare leggendo il codice:
 * valori esadecimali fuori palette, bianco e nero puri, ombre,
 * valori arbitrari fuori scala, caratteri non previsti.
 *
 * NON controlla il contrasto reale: quello dipende dal fondo su cui
 * il testo appoggia davvero, non da quello della pagina, e si vede
 * solo ad applicazione avviata. Lo snippet in fondo al file fa quel
 * controllo dalla console del browser.
 *
 * Esce con codice 1 se trova difetti, così è usabile in CI.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";

const ROOT = process.argv[2] ?? ".";

const ESTENSIONI = new Set([".ts", ".tsx", ".js", ".jsx", ".vue", ".svelte", ".css", ".scss", ".html"]);
const SALTA = new Set(["node_modules", ".next", ".git", "dist", "build", "out", "coverage", ".turbo"]);
// globals.css è l'unico posto dove i valori possono stare.
const ESENTI = [/globals\.css$/, /theme\.css$/, /tokens\.css$/];

const PALETTE = new Set([
  "#fffef5", "#fdfcf2", "#f7f5ea", "#fffce0", "#eeeada", "#dbd7c7",
  "#aba79a", "#767369", "#55534b", "#45433c", "#2b2926", "#1b1a17", "#0d0c0a",
  "#e6fb2d", "#ddee1c", "#b4c614", "#8c980b", "#565d05",
  "#bf3022", "#ef6b54", "#8a5107", "#e08a0b", "#1c7a4d", "#3fbf7f",
  "#0f7a85", "#2aa5b0", "#b0208c", "#d65fb8", "#6a4fa3", "#9070c0",
]);

const SPAZI  = new Set([0, 1, 2, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128]);
const RAGGI  = new Set([0, 6, 10, 16, 24, 32, 9999]);
const CORPI  = new Set([12, 13, 14, 15, 16, 18, 20, 24, 32]);

const difetti = [];
const segna = (file, riga, testo, regola, nota) =>
  difetti.push({ file, riga, testo: testo.trim().slice(0, 90), regola, nota });

function* file(dir) {
  for (const voce of readdirSync(dir)) {
    if (SALTA.has(voce) || voce.startsWith(".")) continue;
    const p = join(dir, voce);
    if (statSync(p).isDirectory()) yield* file(p);
    else if (ESTENSIONI.has(extname(p))) yield p;
  }
}

for (const percorso of file(ROOT)) {
  const rel = relative(ROOT, percorso) || percorso;
  if (ESENTI.some((r) => r.test(rel))) continue;

  const righe = readFileSync(percorso, "utf8").split("\n");

  righe.forEach((riga, i) => {
    const n = i + 1;
    const pulita = riga.replace(/\/\/.*$/, "");

    // 1 — esadecimali
    for (const m of pulita.matchAll(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g)) {
      let hex = m[0].toLowerCase();
      if (hex.length === 4) hex = "#" + [...hex.slice(1)].map((c) => c + c).join("");
      if (hex === "#ffffff" || hex === "#000000") {
        segna(rel, n, riga, "bianco o nero puro",
              "il sistema non li contiene: gli estremi sono neutral-0 e neutral-950");
      } else if (!PALETTE.has(hex)) {
        segna(rel, n, riga, "colore fuori palette", hex);
      } else {
        segna(rel, n, riga, "colore scritto a mano",
              `${hex} è in palette ma va usato come token, non come valore`);
      }
    }

    // 2 — bianco e nero come classi
    for (const m of pulita.matchAll(/\b(?:bg|text|border|fill|stroke|from|to|via)-(white|black)\b/g)) {
      segna(rel, n, riga, "bianco o nero puro", m[0]);
    }

    // 3 — ombre
    for (const m of pulita.matchAll(/(?<![\w-])shadow-(?!none\b)[a-z0-9/[\]-]+/g)) {
      segna(rel, n, riga, "ombra", `${m[0]} — le superfici si separano per colore e perimetro`);
    }
    if (/box-shadow\s*:(?!\s*none)/.test(pulita)) {
      segna(rel, n, riga, "ombra", "box-shadow");
    }

    // 3b — sfumature, aloni, sfocature (regola 4)
    for (const m of pulita.matchAll(/\bbg-(?:gradient|linear|radial|conic)-[a-z0-9/[\]-]+/g)) {
      segna(rel, n, riga, "sfumatura", `${m[0]} — nessuna sfumatura nel sistema`);
    }
    if (/\b(?:linear|radial|conic)-gradient\s*\(/.test(pulita)) {
      segna(rel, n, riga, "sfumatura", "gradient() in CSS");
    }
    for (const m of pulita.matchAll(/(?<![\w-])(?:backdrop-)?blur(?:-[a-z0-9[\]]+)?\b/g)) {
      if (m[0] === "blur-none" || m[0] === "backdrop-blur-none") continue;
      segna(rel, n, riga, "sfocatura", `${m[0]} — i livelli flottanti usano scrim e bordo`);
    }
    for (const m of pulita.matchAll(/(?<![\w-])drop-shadow(?:-[a-z0-9[\]]+)?\b/g)) {
      if (m[0] === "drop-shadow-none") continue;
      segna(rel, n, riga, "ombra", `${m[0]} — alone o ombra su icone e grafici`);
    }

    // 4 — valori arbitrari
    for (const m of pulita.matchAll(/\b([a-z]+)-\[(\d+(?:\.\d+)?)px\]/g)) {
      const [tutto, prefisso, valore] = m;
      const px = parseFloat(valore);
      const spazio = /^(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space)$/.test(prefisso);
      const raggio = /^rounded/.test(prefisso);
      const corpo = prefisso === "text";
      if (spazio && !SPAZI.has(px))
        segna(rel, n, riga, "spaziatura fuori scala", `${tutto} — ammessi 4 8 12 16 24 32 48 64 96 128`);
      else if (raggio && !RAGGI.has(px))
        segna(rel, n, riga, "raggio fuori scala", `${tutto} — ammessi 6 10 16 24 32 full`);
      else if (corpo && !CORPI.has(px))
        segna(rel, n, riga, "corpo fuori scala", `${tutto} — ammessi 12 13 14 15 16 18 20 24 32`);
      else if (!spazio && !raggio && !corpo)
        segna(rel, n, riga, "valore arbitrario", tutto);
    }

    // 5 — dimensioni in CSS
    for (const m of pulita.matchAll(/font-size\s*:\s*(\d+)px/g)) {
      if (!CORPI.has(parseInt(m[1], 10)))
        segna(rel, n, riga, "corpo fuori scala", `${m[1]}px`);
    }

    // 6 — caratteri
    for (const m of pulita.matchAll(/font-family\s*:\s*([^;}\n]+)/g)) {
      const v = m[1].toLowerCase();
      if (!/geist|var\(|inherit|ui-sans|ui-monospace/.test(v))
        segna(rel, n, riga, "carattere non previsto", m[1].trim().slice(0, 50));
    }
    for (const m of pulita.matchAll(/\bfont-\[['"]?([A-Za-z][\w\s-]*)['"]?\]/g)) {
      if (!/geist/i.test(m[1]))
        segna(rel, n, riga, "carattere non previsto", m[0]);
    }

    // 7 — maiuscolo fuori dallo stile label
    if (/\buppercase\b/.test(pulita) && !/font-mono|label-mono|text-app-label/.test(pulita)) {
      segna(rel, n, riga, "maiuscolo fuori label",
            "il maiuscolo esiste solo nello stile label: mono, 12px, tracking positivo");
    }
  });
}

/* ---------------------------------------------------------- resoconto */

if (difetti.length === 0) {
  console.log("\n  Nessun difetto rilevato nel sorgente.\n");
  console.log("  Resta da verificare a applicazione avviata: contrasto reale,");
  console.log("  stati vuoti, comportamento in entrambe le modalità.\n");
  process.exit(0);
}

const perRegola = new Map();
for (const d of difetti) {
  if (!perRegola.has(d.regola)) perRegola.set(d.regola, []);
  perRegola.get(d.regola).push(d);
}

console.log(`\n  ${difetti.length} difetti in ${new Set(difetti.map((d) => d.file)).size} file\n`);

for (const [regola, lista] of [...perRegola].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${regola.toUpperCase()} — ${lista.length}`);
  for (const d of lista.slice(0, 12)) {
    console.log(`    ${d.file}:${d.riga}  ${d.nota ?? ""}`);
  }
  if (lista.length > 12) console.log(`    … altri ${lista.length - 12}`);
  console.log("");
}

console.log("  Il contrasto non è verificabile da qui: dipende dal fondo su cui");
console.log("  il testo appoggia davvero. Usa lo snippet in coda a questo file.\n");

process.exit(1);

/* ============================================================
   CONTROLLO DEL CONTRASTO — console del browser

   Da incollare nella console, su ogni schermata e in entrambe le
   modalità. Associa ogni testo al fondo su cui appoggia davvero,
   non a quello della pagina.

(() => {
  const lum = (c) => {
    const [r, g, b] = c.match(/\d+/g).map(Number).map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const cr = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const fondo = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const b = getComputedStyle(n).backgroundColor;
      if (b && !/rgba\(0, 0, 0, 0\)|transparent/.test(b)) return b;
    }
    return getComputedStyle(document.body).backgroundColor;
  };
  const out = new Map();
  document.querySelectorAll("*").forEach((el) => {
    const t = [...el.childNodes].filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim()).join("").trim();
    if (!t) return;
    const s = getComputedStyle(el);
    const px = parseFloat(s.fontSize);
    const grassetto = parseInt(s.fontWeight, 10) >= 700;
    const soglia = px >= 24 || (px >= 18.66 && grassetto) ? 3 : 4.5;
    const r = cr(s.color, fondo(el));
    if (r >= soglia) return;
    const k = `${s.color}|${fondo(el)}|${px}`;
    if (!out.has(k)) out.set(k, { rapporto: +r.toFixed(2), soglia, px, testo: t.slice(0, 40), n: 0 });
    out.get(k).n++;
  });
  const righe = [...out.values()].sort((a, b) => a.rapporto - b.rapporto);
  righe.length ? console.table(righe) : console.log("Contrasti a posto su questa schermata.");
})();

   ============================================================ */
