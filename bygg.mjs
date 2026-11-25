// Lager ferdige, statiske sider (ren HTML uten JavaScript) i mappen del/ fra data.js.
// Kjør:  node bygg.mjs
// Sidene kan deles som lenker, og leses av KI-verktøy som ikke kjører JavaScript.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require=createRequire(import.meta.url);
const D=require('./data.js');
const {ZONES,TYPES,CATS,CAT_LABEL,SESSIONS,TYPE_ORDER,PLANS,DISTS,LEVELS,PHASE,DAYS,USES,
  fmtNum,fmtDur,flat,sessionFor,itemName,itemDur,zonePct,planName,pathOf,distRows,formatText,RPE_SCALE,RPE_SHORT,teori,MINPLAN,SEED_STYRKE,STYRKE_RETNING}=D;

const OUT='del';
fs.rmSync(OUT,{recursive:true,force:true});
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const rel=(from,to)=>path.posix.relative(path.posix.dirname(from),to)||path.posix.basename(to);
const appLink=(from,hash)=>{const up=path.posix.relative(path.posix.dirname('del/'+from),'.');return `${up}/index.html#${hash}`};
const written=[];

const CSS=`body{font:16px/1.55 system-ui,sans-serif;max-width:860px;margin:0 auto;padding:16px;color:#1a2322}
nav,footer{font-size:14px;margin:8px 0 18px}nav a,footer a{margin-right:12px}
table{border-collapse:collapse;width:100%;margin:10px 0;font-size:14px}th,td{border:1px solid #ccd5d2;padding:5px 7px;text-align:left;vertical-align:top}
th{background:#eef3f1}h1{font-size:26px}h2{margin-top:30px;border-bottom:2px solid #0f766e;padding-bottom:4px}h3{margin-top:22px}
.note{background:#e6f2f0;padding:8px 12px;border-radius:8px}.muted{color:#5d6b69}a{color:#0f766e}
.tablewrap{overflow-x:auto}table.gridtab th[scope=row]{background:#e6f2f0}`;

function nav(from){
  const l=(k,t,id)=>`<a href="${rel(from,pathOf(k,id))}">${t}</a>`;
  return `<nav aria-label="Navigasjon">${l('index','Oversikt')}${l('alt','Alt innhold på én side')}${l('teori','Teori')}${l('planer','Treningsplaner')}${l('minplan','Min plan')}${l('okter','Løpeøkter')}${l('styrke','Styrkeøkter')}</nav>`;
}
function write(p,title,body,desc,appHash){
  const html=`<!DOCTYPE html>
<html lang="nb"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} – Treningslogg (80/20-løping)</title>
<meta name="description" content="${esc(desc||title)}"><style>${CSS}</style></head>
<body>${nav(p)}<main>
${body}
</main>
<footer><hr>${appHash?`<a href="${appLink(p,appHash)}">Åpne i appen</a>`:''}<span class="muted">Treningslogg basert på «80/20 Running». Siden er ren HTML og kan leses av KI-verktøy.</span></footer>
</body></html>`;
  const f=path.join(OUT,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,html);written.push(p);
}

/* ---------- økter ---------- */
const catOf=s=>s.cat==='alt'?'Annen trening':CAT_LABEL[s.cat]+' intensitet';
const rpeOf=z=>ZONES[z].rpe;
function stepsHtml(s){
  const li=x=>`<li><b>${esc(x.l)}</b>: ${x.d==null?'':fmtDur(x)+' '}i sone ${x.z} (${ZONES[x.z].n}). Opplevd anstrengelse (RPE) ${rpeOf(x.z)} av 10. ${zonePct(x.z)} av laktatterskelpuls.</li>`;
  return '<ol>'+s.steps.map(x=>x.rep?`<li><b>${x.rep} gjentakelser</b> av:<ul>${x.steps.map(li).join('')}</ul></li>`:li(x)).join('')+'</ol>';
}
function sessionBody(s,from,h=1,full=true){
  const T=TYPES[s.type];
  const H=n=>`h${Math.min(h+n,6)}`;
  const total=s.km?`${fmtNum(s.km)} km (tid avhengig av tempo: ${s.low})`:s.min?`${fmtNum(s.min)} min`:'';
  const dist=distRows(s);
  const uses=USES[s.id]?Object.entries(USES[s.id]).map(([k,set])=>`<li><a href="${rel(from,pathOf('plan',k))}">${planName(k)}</a>: uke ${[...set].sort((a,b)=>a-b).join(', ')}</li>`).join(''):'';
  return `<${H(0)}>${esc(s.name)}</${H(0)}>
<p><b>Kategori:</b> ${catOf(s)}${T?`. <b>Øktype:</b> <a href="${rel(from,pathOf('type',s.type))}">${T.name}</a>`:''}.${total?` <b>Totalt:</b> ${total}.`:''}</p>
${formatText(s)?`<p><b>Format:</b> ${esc(formatText(s))}</p>`:''}
${s.note?`<p class="note">${esc(s.note)}</p>`:''}
${s.steps.length?`<${H(1)}>Trinn for trinn</${H(1)}>${stepsHtml(s)}`:''}
${dist.length?`<${H(1)}>Intensitetsfordeling</${H(1)}><ul>${dist.map(([a,b])=>`<li>${a}: ${b}</li>`).join('')}</ul>`:''}
${T&&full?`<${H(1)}>Slik gjennomfører du økten</${H(1)}><p class="muted">${esc(RPE_SHORT)}</p><ol>${T.how.map(x=>`<li>${esc(x)}</li>`).join('')}<li>Bruk opplevd anstrengelse til å finjustere innsatsen underveis i hele økten.</li></ol>
<${H(1)}>Om øktypen</${H(1)}><p>${esc(T.desc)}</p>`:''}
`;
}
for(const s of Object.values(SESSIONS)){
  const p=pathOf('okt',s.id);
  const T=TYPES[s.type];
  const sib=T?Object.values(SESSIONS).filter(x=>x.type===s.type):[];
  write(p,s.name,sessionBody(s,p)+(T?`<p><a href="${rel(p,pathOf('type',s.type))}">← Alle ${T.name.toLowerCase()}</a></p>`:`<p><a href="${rel(p,pathOf('okter'))}">← Treningsøkter</a></p>`),
    `${s.name}: ${formatText(s)||s.note||''}`.slice(0,300),`/okt/${s.id}`);
}
for(const t of TYPE_ORDER){
  const T=TYPES[t],p=pathOf('type',t);
  const list=Object.values(SESSIONS).filter(s=>s.type===t);
  const rows=list.map(s=>`<tr><td><a href="${rel(p,pathOf('okt',s.id))}">${esc(s.name)}</a></td><td>${s.km?fmtNum(s.km)+' km':s.min?fmtNum(s.min)+' min':'–'}</td><td>${esc(formatText(s)||'Hele turen i sone 1')}</td></tr>`).join('');
  write(p,T.name,`<h1>${T.name}</h1><p><b>Kategori:</b> ${CAT_LABEL[T.cat]} intensitet</p><p>${esc(T.desc)}</p>
<h2>Slik gjennomfører du den</h2><p class="muted">${esc(RPE_SHORT)}</p><ol>${T.how.map(x=>`<li>${esc(x)}</li>`).join('')}<li>Bruk opplevd anstrengelse til å finjustere innsatsen underveis i hele økten.</li></ol>
<h2>Øktene (${list.length})</h2><div class="tablewrap"><table><tr><th>Økt</th><th>Totalt</th><th>Format</th></tr>${rows}</table></div>
<p><a href="${rel(p,pathOf('okter'))}">← Alle øktyper</a></p>`,`${T.name}: ${T.desc}`.slice(0,300),`/type/${t}`);
}
function oktOverview(from,h=1){
  return `<h${h}>Løpeøkter</h${h}><p>13 øktyper i tre intensitetsgrupper. Lavintensitet er sone 1–2, moderat sone 3 og høy sone 4–5.</p>`+
  CATS.map(c=>`<h${h+1}>${c.name} (${c.sub})</h${h+1}><p>${esc(c.intro)}</p><ul>`+TYPE_ORDER.filter(t=>TYPES[t].cat===c.id).map(t=>`<li><a href="${rel(from,pathOf('type',t))}"><b>${TYPES[t].name}</b></a> – ${esc(TYPES[t].desc)}</li>`).join('')+'</ul>').join('');
}
write(pathOf('okter'),'Løpeøkter',oktOverview(pathOf('okter')),'Oversikt over alle løpeøkter, gruppert etter intensitet','/okter');

/* ---------- planer ---------- */
function planTable(key,from){
  const P=PLANS[key],dist=DISTS.find(x=>x.k===key.split('-')[0]);
  const cell=items=>!items.length?'Hvile':items.map(it=>{
    if(it.race)return `<b>Løpsdag – ${dist.name}</b>`;
    const s=sessionFor(it);
    const href=rel(from,s?pathOf('okt',s.id):pathOf('type',it.code));
    const d=itemDur(it,s);
    const extra=[d,it.alt?'el. annen trening':''].filter(Boolean).join(', ');
    return `<a href="${href}">${esc(itemName(it))}${it.code==='r'&&it.n?'':''}</a>${extra?` (${extra})`:''}`;
  }).join('<br>+ ');
  return `<div class="tablewrap"><table><tr><th>Uke</th><th>Fase</th>${DAYS.map(d=>`<th>${d}</th>`).join('')}<th>Lav / moderat-høy</th></tr>`+
   P.weeks.map((w,i)=>`<tr><td>${i+1}</td><td>${PHASE[w.ph]}</td>${w.days.map(d=>`<td>${cell(d)}</td>`).join('')}<td>${w.low} % / ${100-w.low} %</td></tr>`).join('')+'</table></div>';
}
function planBody(key,from,h=1){
  const P=PLANS[key],l=key.split('-')[1];
  return `<h${h}>${planName(key)} – ${P.weeks.length} uker</h${h}>
<p><b>Nivå ${l}: ${LEVELS[l]}.</b></p><p><b>Målgruppe:</b> ${esc(P.m)}</p><p><b>Forutsetning:</b> ${esc(P.f)}</p><p><b>Treningsbelastning:</b> ${esc(P.b)}</p>
${P.n?`<p class="note">${esc(P.n)}</p>`:''}
<p class="muted">Uken starter på mandag, men øktene kan flyttes til andre dager. «el. annen trening» betyr at økten kan byttes med annen kondisjonstrening. Der en dag har to økter står de under hverandre med «+». Tallet bak øktnavnet viser til økten i øktoversikten (klikk for detaljer).</p>
${planTable(key,from)}`;
}
for(const d of DISTS){
  for(const l of [1,2,3]){
    const key=`${d.k}-${l}`,p=pathOf('plan',key);
    write(p,planName(key),planBody(key,p)+`<p><a href="${rel(p,pathOf('dist',d.k))}">← ${d.name}, alle nivåer</a></p>`,`${planName(key)}: ${PLANS[key].m}`.slice(0,300),`/plan/${key}`);
  }
  const p=pathOf('dist',d.k);
  write(p,d.name,`<h1>${d.name} – ${d.weeks} uker, tre nivåer</h1><ul>${[1,2,3].map(l=>`<li><a href="${rel(p,pathOf('plan',d.k+'-'+l))}">Nivå ${l}: ${LEVELS[l]}</a></li>`).join('')}</ul>`+
    [1,2,3].map(l=>planBody(`${d.k}-${l}`,p,2)).join(''),`Treningsplaner for ${d.name}, nivå 1–3`,`/dist/${d.k}`);
}
function planOverview(from,h=1){
  return `<h${h}>Treningsplaner</h${h}><p>Fire distanser med tre nivåer hver. Hver plan viser uke for uke hvilke økter som skal gjøres hvilke dager.</p>
<table><tr><th>Distanse</th><th>Uker</th>${[1,2,3].map(l=>`<th>Nivå ${l}<br><span class="muted">${LEVELS[l]}</span></th>`).join('')}</tr>`+
  DISTS.map(d=>`<tr><td><a href="${rel(from,pathOf('dist',d.k))}"><b>${d.name}</b></a></td><td>${d.weeks}</td>${[1,2,3].map(l=>`<td><a href="${rel(from,pathOf('plan',d.k+'-'+l))}">Åpne planen</a></td>`).join('')}</tr>`).join('')+'</table>';
}
write(pathOf('planer'),'Treningsplaner',planOverview(pathOf('planer')),'Oversikt over treningsplaner for 5 km, 10 km, halvmaraton og maraton','/planer');


/* ---------- min plan ---------- */
const fd=(s)=>{const [y,m,d]=s.split('-').map(Number);return `${d}.${m}.`};
const addD=(s,n)=>{const [y,m,d]=s.split('-').map(Number);const t=new Date(Date.UTC(y,m-1,d+n));return t.toISOString().slice(0,10)};
function minplanBody(from,h=1){
  const M=MINPLAN;
  const cell=(it,date)=>it.map(x=>{
    if(x.t==='rest')return 'Hvile';
    if(x.t==='run'){const s=SESSIONS[x.id];return `<a href="${rel(from,pathOf('okt',x.id))}">${esc(s.name)}</a> (${s.min} min)`}
    if(x.t==='x')return `<a href="${rel(from,pathOf('okt','x'))}">Annen kondisjonstrening</a> (${x.min} min)`;
    const s=SEED_STYRKE.find(y=>y.id===x.id);return `<a href="${rel(from,pathOf('styrke'))}#${x.id}">${esc(s.name)}</a> (ca. ${s.dur} min)`;
  }).join('<br>+ ');
  return `<h${h}>${M.title}</h${h}><p><b>Periode:</b> ${M.period}</p><p>${esc(M.intro)}</p>
<h${h+1}>Ukeplan</h${h+1}><p class="muted">Planen er satt i minutter fordi tiden styrer belastningen. Klikk på en økt for å se hvordan den gjennomføres.</p>
<div class="tablewrap"><table><tr><th>Uke</th><th>Datoer</th>${DAYS.map(d=>`<th>${d}</th>`).join('')}<th>Løpetid</th><th>Merknad</th></tr>`+
  M.weeks.map(w=>`<tr><td>${w.n}</td><td>${w.label}</td>${w.days.map((d,i)=>`<td><span class="muted">${fd(addD(w.start,i))}</span><br>${cell(d)}</td>`).join('')}<td>${w.min} min</td><td>${esc(w.note)}</td></tr>`).join('')+`</table></div>
<h${h+1}>Ukemønster</h${h+1}><table>${M.mønster.map(r=>`<tr><th>${r[0]}</th><td>${esc(r[1])}</td></tr>`).join('')}</table><p>${esc(M.mønsterNote)}</p>
<h${h+1}>Utgangspunkt</h${h+1}><ul>${M.summary.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
<h${h+1}>Prinsipper</h${h+1}>${M.prinsipper.map((p,i)=>`<h${h+2}>${i+1}. ${esc(p[0])}</h${h+2}><p>${esc(p[1])}</p>`).join('')}
<h${h+1}>Kryssstrening når tiden er knapp</h${h+1}><p>${esc(M.kryss.tekst)}</p><table><tr><th>Tidsbudsjett</th><th>Slik ser det ut</th><th>Bruk når</th></tr>${M.kryss.tabell.map(r=>`<tr><td>${r[0]}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</table>
<h${h+1}>Bremseregler</h${h+1}><p>${esc(M.bremsNote)}</p><ul>${M.brems.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
<h${h+1}>Etter nyttår</h${h+1}>${M.videre.map(p=>`<h${h+2}>${esc(p[0])}</h${h+2}><p>${esc(p[1])}</p>`).join('')}
<p class="note"><b>Ikke sjekket:</b> ${M.ikkeSjekket.map(esc).join(' ')}</p>`;
}
write(pathOf('minplan'),'Min plan frem til nyttår',minplanBody(pathOf('minplan')),'Personlig treningsplan 23. nov 2026 – 3. jan 2027 med løping, kryss og styrke','/minplan');

/* ---------- styrkeøkter (eksempler) ---------- */
function styrkeBody(from,h=1){
  return `<h${h}>Styrkeøkter og korte økter – eksempler</h${h}><p>Tilpasset gammel PCL-skade, ingen hopp hjemme, og målene markløft, benkpress, pull-ups, ekte push-ups, seter, kompresjon, invert (toes to bar), kjernestabilitet og spenst. Ikke fra 80/20-boka. I tillegg finnes to korte økter (mobilitet og flow, 3–5 min) som kan tas hver morgen. I appen kan du lage egne styrkeøkter (øvelse, sett, repetisjoner og belastning); de lagres bare i nettleseren og vises ikke her.</p>
`+SEED_STYRKE.map(s=>`<h${h+1} id="${s.id}">${esc(s.name)}</h${h+1}><p><b>Kategori:</b> ${esc(s.cat)}. <b>Varighet:</b> ca. ${s.dur} min.</p><p>${esc(s.note)}</p>
<div class="tablewrap"><table><tr><th>Øvelse</th><th>Sett × reps</th><th>Belastning</th><th>Merknad</th></tr>${s.ex.map(e=>`<tr><td>${esc(e.n)}</td><td>${e.sets} × ${esc(e.reps)}</td><td>${esc(e.load)}</td><td>${esc(e.note)}</td></tr>`).join('')}</table></div>`).join('')+
  `<h${h+1}>Retningslinjer</h${h+1}>`+STYRKE_RETNING.map(p=>`<h${h+2}>${esc(p[0])}</h${h+2}><p>${esc(p[1])}</p>`).join('');
}
write(pathOf('styrke'),'Styrkeøkter',styrkeBody(pathOf('styrke')),'Eksempel-styrkeøkter A (treningssenter) og B (hjemme) og korte økter (mobilitet, flow)','/styrke');

/* ---------- teori ---------- */
function teoriSecs(from){return teori({app:false,pulse:null,href:(k,id)=>rel(from,pathOf(k,id))})}
{
  const p=pathOf('teori'),secs=teoriSecs(p);
  write(p,'Teori',`<h1>Teori</h1><ul>${secs.map(x=>`<li><a href="${rel(p,pathOf('teori-sec',x.id))}">${x.title}</a></li>`).join('')}</ul>`+secs.map(x=>`<h2>${x.title}</h2>${x.html}`).join(''),'Prinsipper og teori bak 80/20-treningen','/teori');
  for(const x of teori({app:false,pulse:null,href:()=>'#'})){
    const q=pathOf('teori-sec',x.id);
    const sx=teoriSecs(q).find(y=>y.id===x.id);
    write(q,x.title,`<h1>${sx.title}</h1>${sx.html}<p><a href="${rel(q,p)}">← Teori</a></p>`,x.title,'/teori');
  }
}

/* ---------- alt innhold ---------- */
{
  const p=pathOf('alt');
  const secs=teoriSecs(p);
  const body=`<h1>Treningslogg – alt innhold</h1>
<p>Denne siden samler teori, alle treningsplaner og alle løpeøkter på én side, slik at et KI-verktøy kan lese alt med én lenke. Hver del har også egne sider (se <a href="${rel(p,pathOf('index'))}">oversikten</a>).</p>
<h2>Innhold</h2><ul><li><a href="#teori">Teori</a></li><li><a href="#planer">Treningsplaner</a></li><li><a href="#minplan">Min plan</a></li><li><a href="#styrke">Styrkeøkter</a></li><li><a href="#okter">Løpeøkter</a></li></ul>
<section id="teori"><h2>Teori</h2>${secs.map(x=>`<h3>${x.title}</h3>${x.html}`).join('')}</section>
<section id="planer"><h2>Treningsplaner</h2>${DISTS.map(d=>[1,2,3].map(l=>planBody(`${d.k}-${l}`,p,3)).join('')).join('')}</section>
<section id="minplan">${minplanBody(p,2)}</section>
<section id="styrke">${styrkeBody(p,2)}</section>
<section id="okter"><h2>Løpeøkter</h2>
${CATS.map(c=>`<h3>${c.name} (${c.sub})</h3><p>${esc(c.intro)}</p>`+TYPE_ORDER.filter(t=>TYPES[t].cat===c.id).map(t=>{
  const T=TYPES[t],list=Object.values(SESSIONS).filter(s=>s.type===t);
  return `<h4>${T.name}</h4><p>${esc(T.desc)}</p><p><b>Slik gjennomfører du den:</b></p><ol>${T.how.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>
  <div class="tablewrap"><table><tr><th>Økt</th><th>Totalt</th><th>Format</th></tr>${list.map(s=>`<tr><td><a href="${rel(p,pathOf('okt',s.id))}">${esc(s.name)}</a></td><td>${s.km?fmtNum(s.km)+' km':s.min?fmtNum(s.min)+' min':'–'}</td><td>${esc(formatText(s)||'Hele turen i sone 1')}</td></tr>`).join('')}</table></div>`;
}).join('')).join('')}
<h3>Andre økter i planene</h3><ul>${['ms','x'].map(id=>`<li><a href="${rel(p,pathOf('okt',id))}">${SESSIONS[id].name}</a>: ${esc(SESSIONS[id].note)}</li>`).join('')}</ul></section>`;
  write(p,'Alt innhold',body,'Teori, alle treningsplaner og alle løpeøkter samlet på én side','/planer');
}

/* ---------- oversikt ---------- */
{
  const p=pathOf('index');
  const L=(k,id,t)=>`<a href="${rel(p,pathOf(k,id))}">${t}</a>`;
  write(p,'Oversikt',`<h1>Treningslogg – 80/20-løping</h1>
<p>Ferdige tekstsider for deling og for lesing med KI-verktøy. Alt innholdet i appen finnes her uten JavaScript.</p>
<h2>Alt på én side</h2><p>${L('alt','','Alt innhold (teori, alle planer, alle økter)')}</p>
<h2>Teori</h2><ul><li>${L('teori','','All teori')}</li>${teori({app:false,pulse:null,href:()=>'#'}).map(x=>`<li>${L('teori-sec',x.id,x.title)}</li>`).join('')}</ul>
<h2>Treningsplaner</h2><p>${L('planer','','Oversikt over alle planer')}</p><table><tr><th>Distanse</th><th>Alle nivåer</th><th>Nivå 1</th><th>Nivå 2</th><th>Nivå 3</th></tr>
${DISTS.map(d=>`<tr><td>${d.name}</td><td>${L('dist',d.k,'Alle tre')}</td>${[1,2,3].map(l=>`<td>${L('plan',d.k+'-'+l,d.weeks+' uker')}</td>`).join('')}</tr>`).join('')}</table>
<h2>Min plan</h2><p>${L('minplan','','Min plan frem til nyttår (23. nov – 3. jan)')}</p>
<h2>Styrkeøkter</h2><p>${L('styrke','','Eksempel-styrkeøkter A og B')}</p>
<h2>Løpeøkter</h2><p>${L('okter','','Oversikt over øktyper')}</p>
${CATS.map(c=>`<h3>${c.name} (${c.sub})</h3><ul>${TYPE_ORDER.filter(t=>TYPES[t].cat===c.id).map(t=>{
  const list=Object.values(SESSIONS).filter(s=>s.type===t);
  return `<li>${L('type',t,'<b>'+TYPES[t].name+'</b>')}: ${list.map(s=>L('okt',s.id,s.name.replace(TYPES[t].one,'').trim()||s.name)).join(', ')}</li>`}).join('')}</ul>`).join('')}
<h3>Spesialøkter i planene</h3><ul><li>${L('okt','ms','Maratonsimulator')}</li><li>${L('okt','x','Annen kondisjonstrening')}</li></ul>`,'Oversikt over alle delbare sider','/planer');
}
console.log(`Bygget ${written.length} sider i ${OUT}/`);
