/* ============================================================
   APEX 5D · shared chart components (Recruiting + Assessment)
   ============================================================
   Two dependency-free, inline-SVG chart styles used to replace the
   old flat parallel bar/line combos on results pages:

     - renderIsometricBars: grouped pseudo-3D cuboid bars (one or
       more series per category), used where several sources are
       compared side by side (e.g. Manager/Peer/Self, Obtained/Expected).
     - renderCapsuleBars: vertical pill/capsule bars with a
       semi-transparent track and a color-coded fill level, used for
       single-value-vs-target comparisons (e.g. skill vs benchmark).

   Colors are passed through as CSS color strings (var(--x), hex, or
   color-mix() expressions) and written straight into the SVG markup,
   so charts stay theme-reactive (light/dark) without re-rendering —
   the browser resolves CSS custom properties on inline SVG same as
   on any other element. No canvas, no external chart library.

   Category labels are deliberately rendered as plain HTML (a CSS grid
   row below the chart, each cell holding a `transform:rotate(...)`
   span) rather than as SVG <text transform="rotate(...)">. SVG text
   rotated around an explicit pivot interacts badly with the viewBox
   scaling used here (uniform scale-to-fit via aspect-ratio) and with
   sibling paint order — long rotated labels ended up visually clipped
   under neighbouring bars. Plain HTML text with a CSS transform has
   none of that: it's normal document flow, doesn't get clipped by
   siblings, and is trivial to reason about.
   ============================================================ */
(function(global){
  let uidCounter = 0;

  function escXml(s){
    return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function fmtVal(v, unit, dec){
    return (Number(v)||0).toFixed(dec==null?1:dec) + (unit||'');
  }
  function resolveEl(container){
    if(typeof container!=='string') return container;
    return document.getElementById(container) || document.querySelector(container);
  }
  /* The rotated label's own layout box is just one text line tall — its
     visual footprint after the -32° rotation drops well below that box, so
     the row needs explicit bottom margin reserved for it, or the next block
     below renders overlapping it. */
  function labelRowHtml(labels, fontSize){
    const angle = 32*Math.PI/180;
    let maxW = 0;
    labels.forEach(l=>{ const w = String(l==null?'':l).length*fontSize*0.58; if(w>maxW) maxW=w; });
    const dropH = Math.ceil(maxW*Math.sin(angle) + fontSize*1.4);
    return `<div style="display:grid;grid-template-columns:repeat(${labels.length},1fr);margin-top:4px;margin-bottom:${dropH}px">
      ${labels.map(l=>`<div style="text-align:right;overflow:visible"><span style="display:inline-block;transform-origin:100% 0;transform:rotate(-32deg);white-space:nowrap;font-size:${fontSize}px;font-weight:600;color:var(--muted,#767369);padding-right:3px">${escXml(l)}</span></div>`).join('')}
    </div>`;
  }

  /* ---------------- 3D ISOMETRIC BARS ----------------
     opts.groups: [{ label, values:[v1,v2,...], target? }]
     opts.seriesNames: legend labels, one per value in a group
     opts.seriesColors: CSS colors, one per value in a group
     opts.max: chart domain max
     opts.unit / opts.dec: value-label formatting
  */
  function renderIsometricBars(container, opts){
    const el = resolveEl(container);
    if(!el) return;
    const groups = opts.groups||[];
    if(!groups.length){ el.innerHTML=''; return; }
    const seriesNames = opts.seriesNames||[];
    const seriesColors = opts.seriesColors||['var(--accent,#B4C614)'];
    const max = opts.max||10;
    const unit = opts.unit||'';
    const dec = opts.dec==null?1:opts.dec;

    const uid = 'iso'+(uidCounter++);
    const nSeries = groups[0].values.length;
    const barW = 24, barGap = 8, colGap = 26, dx = 8, dy = -9;
    const chartH = 190, padTop = 30, padBottom = 10;
    const groupW = nSeries*barW + (nSeries-1)*barGap;
    const colW = groupW + colGap + Math.max(0,dx);
    const totalW = colW * groups.length;
    const svgH = padTop + chartH + padBottom;
    const baseline = padTop + chartH;

    let bars = '';
    groups.forEach((g, gi)=>{
      let x = gi*colW + colGap/2;
      const gx = x;
      g.values.forEach((v, si)=>{
        const bx = x;
        const h = Math.max(2, (Math.min(Math.max(v,0),max)/max) * chartH);
        const y1 = baseline - h;
        const color = seriesColors[si] || seriesColors[seriesColors.length-1];
        const frontId = `${uid}-f${si}-${gi}`;
        bars += `
          <g style="filter:url(#${uid}-shadow)">
            <defs>
              <linearGradient id="${frontId}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="color-mix(in srgb, ${color} 85%, white)"/>
                <stop offset="100%" stop-color="color-mix(in srgb, ${color} 75%, black)"/>
              </linearGradient>
            </defs>
            <polygon points="${bx},${y1} ${bx+barW},${y1} ${bx+barW+dx},${y1+dy} ${bx+dx},${y1+dy}" fill="color-mix(in srgb, ${color} 90%, white)"/>
            <polygon points="${bx+barW},${y1} ${bx+barW+dx},${y1+dy} ${bx+barW+dx},${baseline+dy} ${bx+barW},${baseline}" fill="color-mix(in srgb, ${color} 55%, black)"/>
            <rect x="${bx}" y="${y1}" width="${barW}" height="${h}" fill="url(#${frontId})"/>
            <text x="${bx+barW/2+dx/2}" y="${y1+dy-6}" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--ink,#0D0C0A)">${fmtVal(v,unit,dec)}</text>
          </g>`;
        x += barW + barGap;
      });
      if(g.target!=null){
        const ty = baseline - (Math.min(g.target,max)/max)*chartH;
        bars += `<line x1="${gx-3}" y1="${ty}" x2="${gx+groupW+3+dx}" y2="${ty}" stroke="var(--ink,#0D0C0A)" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.55"/>`;
      }
    });

    const legend = seriesNames.length>1 ? `<div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-bottom:8px;font-size:11px;font-weight:600;color:var(--muted,#767369)">
      ${seriesNames.map((n,i)=>`<span style="display:inline-flex;align-items:center;gap:5px"><i style="width:10px;height:10px;border-radius:3px;background:${seriesColors[i]||seriesColors[0]};display:inline-block"></i>${escXml(n)}</span>`).join('')}
    </div>` : '';

    el.innerHTML = `${legend}<div style="max-width:${totalW}px">
      <svg viewBox="0 0 ${totalW} ${svgH}" preserveAspectRatio="none" style="width:100%;height:${svgH}px;display:block">
        <defs><filter id="${uid}-shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="rgba(13,12,10,0.3)"/></filter></defs>
        ${bars}
      </svg>
      ${labelRowHtml(groups.map(g=>g.label), 11)}
    </div>`;
  }

  /* ---------------- CAPSULE / PILL BARS ----------------
     opts.items: [{ label, value, color?, target?, sub? }]
     opts.max / opts.unit / opts.dec: value-label formatting
  */
  function renderCapsuleBars(container, opts){
    const el = resolveEl(container);
    if(!el) return;
    const items = opts.items||[];
    if(!items.length){ el.innerHTML=''; return; }
    const max = opts.max||100;
    const unit = opts.unit==null?'%':opts.unit;
    const dec = opts.dec==null?0:opts.dec;
    const pillW = opts.pillWidth||30;
    const colGap = opts.gap||30;
    const trackH = opts.height||170;
    const padTop=28, padBottom=8;
    const colW = pillW + colGap;
    const uid = 'cap'+(uidCounter++);
    const totalW = colW * items.length;
    const svgH = padTop+trackH+padBottom;
    const baseline = padTop+trackH;

    let defs='', body='';
    items.forEach((it,i)=>{
      const x = i*colW + colGap/2;
      const v = Math.max(0, Math.min(Number(it.value)||0, max));
      const fillH = Math.max(pillW*0.55, (v/max)*trackH);
      const clipId = `${uid}-clip${i}`;
      const color = it.color || 'var(--teal, #DDEE1C)';
      defs += `<clipPath id="${clipId}"><rect x="${x}" y="${padTop}" width="${pillW}" height="${trackH}" rx="${pillW/2}"/></clipPath>`;
      body += `
        <rect x="${x}" y="${padTop}" width="${pillW}" height="${trackH}" rx="${pillW/2}" fill="var(--panel-2, rgba(120,120,120,.12))" stroke="var(--line,rgba(120,120,120,.25))" stroke-width="1"/>
        <g clip-path="url(#${clipId})">
          <rect x="${x}" y="${baseline-fillH}" width="${pillW}" height="${fillH}" rx="${pillW/2}" fill="${color}"/>
        </g>
        ${it.target!=null?`<line x1="${x-4}" y1="${baseline-(Math.min(it.target,max)/max)*trackH}" x2="${x+pillW+4}" y2="${baseline-(Math.min(it.target,max)/max)*trackH}" stroke="var(--ink,#0D0C0A)" stroke-width="2" stroke-dasharray="2,2" opacity="0.7"/>`:''}
        <text x="${x+pillW/2}" y="${padTop-10}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink,#0D0C0A)">${fmtVal(v,unit,dec)}</text>
      `;
    });

    el.innerHTML = `<div style="max-width:${totalW}px">
      <svg viewBox="0 0 ${totalW} ${svgH}" preserveAspectRatio="none" style="width:100%;height:${svgH}px;display:block"><defs>${defs}</defs>${body}</svg>
      ${labelRowHtml(items.map(it=>it.label), 10.5)}
      ${items.some(it=>it.sub) ? `<div style="display:grid;grid-template-columns:repeat(${items.length},1fr)">${items.map(it=>`<div style="text-align:center;font-size:9px;color:var(--muted,#767369)">${it.sub?escXml(it.sub):''}</div>`).join('')}</div>` : ''}
    </div>`;
  }

  global.ApexCharts3D = { renderIsometricBars, renderCapsuleBars };
})(window);
