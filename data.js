/* Fast innhold: løpeøkter, planer og teori. Brukes av appen (index.html) og byggeskriptet (bygg.mjs). */
const ZONES={
  1:{n:'Lav aerob',lo:75,hi:80,rpe:'1–2'},
  2:{n:'Moderat aerob',lo:81,hi:89,rpe:'3–4'},
  3:{n:'Terskel',lo:96,hi:100,rpe:'5–6'},
  4:{n:'VO₂maks',lo:102,hi:105,rpe:'7–8'},
  5:{n:'Fart',lo:106,hi:null,rpe:'9–10'}
};
const S=(l,d,z,u='min')=>({l,d,z,u});
const G=(n,...steps)=>({rep:n,steps});
const fmtNum=n=>String(n).replace('.',',');
const fmtDur=s=>{
  if(s.d==null)return 'Hele turen';
  if(s.u==='km')return fmtNum(s.d)+' km';
  if(s.d<1)return Math.round(s.d*60)+' sek';
  return fmtNum(s.d)+' min';
};
const stepW=s=>s.d==null?30:(s.u==='km'?s.d*6:s.d);
const flat=steps=>steps.flatMap(x=>x.rep?Array.from({length:x.rep},()=>x.steps).flat():[x]);

const TYPES={
 r:{name:'Restitusjonstur',one:'Restitusjonstur',cat:'low',short:'Rolig tur i sone 1',
    desc:'Hele turen løpes i sone 1. Den er ment som første løpetur etter en svært krevende økt, ofte som alternativ til hviledag. Den øker treningsmengden skånsomt uten å gå ut over restitusjonen etter hard trening.',
    how:['Bruk opplevd anstrengelse (RPE 1–2) for å komme i sone 1.','Bruk puls for å holde deg i sone 1 hele turen.']},
 g:{name:'Grunnøkter',one:'Grunnøkt',cat:'low',short:'Oppvarming, rolig sone 2, nedjogg',
    desc:'En rolig økt av kort til moderat varighet: oppvarming i sone 1, en periode i sone 2 og nedjogg i sone 1. Dette er økttypen man bruker mest for å sikre nok løping på lav intensitet – «brødet og smøret» i 80/20-treningen.',
    how:['Oppvarming: bruk RPE 1–2 for å komme i sone 1, og puls for å holde deg i sone 1.','Etter oppvarmingen: juster opp til sone 2 med RPE 3–4, og bruk puls for å holde deg i sone 2.','Nedjogg: juster ned til sone 1 (RPE 1–2) og hold deg der på puls.']},
 l:{name:'Langturer',one:'Langtur',cat:'low',short:'Forlenget grunnøkt, måles i km',
    desc:'En forlenget grunnøkt som måles i distanse i stedet for tid. Minimumsdistansen er ca. 9,7 km. Langturens oppgave er å bygge utholdenheten som trengs for å dekke en bestemt løpsdistanse, og da bør alle få samme distanse som forberedelse.',
    how:['Oppvarming: RPE 1–2 for å komme i sone 1, puls for å holde deg der.','Hoveddel: juster opp til sone 2 med RPE 3–4, hold sone 2 på puls.','Nedjogg: ned til sone 1 (RPE 1–2), hold sone 1 på puls.']},
 a:{name:'Rask avslutning',one:'Rask avslutning',cat:'mod',short:'Grunnøkt med sone 3 til slutt',
    desc:'En kort sone 3-innsats legges på slutten av en grunnøkt. Nyttig for å få inn litt moderat løping i grunnperioden (når målet er økt volum) og i restitusjonsuker, når man bare vil ha en «vedlikeholdsdose» moderat intensitet.',
    how:['Oppvarming: RPE 1–2 → sone 1, hold sone 1 på puls.','Juster opp til sone 2 (RPE 3–4) og hold den på puls.','Rask avslutning: juster opp til sone 3 (RPE 5–6).','Hold sone 3 med tempo, puls eller begge til løpet er ferdig.']},
 t:{name:'Tempoøkter',one:'Tempoøkt',cat:'mod',short:'Én lang sone 3-innsats',
    desc:'En vedvarende innsats i sone 3 mellom oppvarming og nedjogg. Svært effektivt for å bedre evnen til å holde relativt høy fart. Vektlegges i toppfasen av treningen foran løp fra 5 km til maraton.',
    how:['Oppvarming: RPE 1–2 → sone 1, hold sone 1 på puls.','Juster opp til sone 2 (RPE 3–4) og hold den på puls.','Tempodelen: juster opp til sone 3 (RPE 5–6) og hold sone 3 med tempo, puls eller begge gjennom hele delen.','Juster tilbake til sone 2 og til slutt sone 1 til nedjoggen. Hold sonene på puls.']},
 c:{name:'Cruise-intervaller',one:'Cruise-intervalløkt',cat:'mod',short:'Flere lange sone 3-intervaller',
    desc:'Flere lange intervaller i sone 3, adskilt av pauser i sone 1. Gir i hovedsak samme effekt som tempoøkter, men fordi sone 3-løpingen deles opp, kan man gjøre mer totalt arbeid på moderat intensitet.',
    how:['Oppvarming: RPE 1–2 → sone 1, hold sone 1 på puls.','Juster opp til sone 2 (RPE 3–4) og hold den på puls.','Hvert cruise-intervall: juster opp til sone 3 (RPE 5–6) og hold sonen med tempo, puls eller begge.','Pause: slipp ned i rolig jogg. Øktformatet oppgir sone 1; bokens retningslinjer nevner sone 2 – hold det rolig nok til at pulsen faller.','Nedjogg: sone 2 og til slutt sone 1, holdt på puls.']},
 lf:{name:'Langtur med fartslek',one:'Langtur med fartslek',cat:'mod',short:'Lang tur med korte sone 3-drag',
    desc:'En utholdenhetstur som for det meste går på lav intensitet, med korte drag i sone 3 strødd utover. Passer sent i en treningssyklus, når grunnutholdenheten allerede er bygget. Sone 3-draga øker tretthetsmotstanden utover det rene lavintensitets-langturer klarer. Måles i distanse.',
    how:['Oppvarming: RPE 1–2 → sone 1, hold sone 1 på puls.','Juster opp til sone 2 (RPE 3–4) og hold den på puls.','Hvert fartslek-drag (0,4 km): RPE 5–6 → sone 3, hold med tempo, puls eller begge.','Mellom draga: ned til sone 2 (RPE 3–4), hold sone 2 på puls.','Nedjogg: sone 1.']},
 lr:{name:'Langtur med rask avslutning',one:'Langtur med rask avslutning',cat:'mod',short:'Lang tur, sone 3 til slutt',
    desc:'En lang tur på lav intensitet med en forholdsvis kort moderat innsats til slutt. Øker tretthetsmotstanden mot slutten av en treningssyklus, når grunnutholdenheten allerede er på plass. Måles i distanse.',
    how:['Oppvarming: RPE 1–2 → sone 1, hold sone 1 på puls.','Hoveddel: sone 2 (RPE 3–4), hold på puls.','Rask avslutning: juster opp til sone 3 (RPE 5–6) og hold med tempo, puls eller begge til du er ferdig.']},
 s:{name:'Fartslekøkter',one:'Fartslekøkt',cat:'high',short:'Korte hardere drag i rolig løping',
    desc:'En krysning mellom grunnøkt og intervalløkt: for det meste sone 2, med korte drag på høy intensitet. Er vanligvis litt lettere enn intervalløkter og gjøres tradisjonelt på stier eller vei i stedet for på bane. Brukes mest som en lavterskel måte å få inn høyintensitetsløping i grunnperioden, og gir en fin pause fra intervaller i restitusjonsuker.',
    how:['Oppvarming: RPE 1–2 → sone 1, hold sone 1 på puls.','Juster opp til sone 2 (RPE 3–4) og hold den på puls.','Hvert drag: juster opp til sone 4 eller 5. Start på RPE 7 for sone 4-drag og RPE 9 for sone 5-drag.','Hold sonen med RPE. RPE kan stige fra 7 til 8 (sone 4) eller fra 9 til 10 (sone 5), men bør som hovedregel ikke nå 8/10 før du er minst halvveis i økten.','Pause: ned i rolig jogg (RPE 3–4). Øktformatet oppgir sone 1.','Nedjogg: sone 1 (RPE 1–2), hold på puls.']},
 b:{name:'Bakkeintervaller',one:'Bakkeintervalløkt',cat:'high',short:'Korte drag oppover i sone 5',
    desc:'I praksis en intervalløkt i motbakke, med korte drag oppover i sone 5. Gir mye av den samme nytten som intervaller (økt aerob kapasitet og høyintensiv tretthetsmotstand, bedre løpsøkonomi), men er mindre belastende for bena fordi støtkreftene er mye lavere i oppoverbakke. En god bro mellom grunntrening og toppfase.',
    how:['Oppvarming: RPE 1–2 → sone 1, hold sone 1 på puls.','Juster opp til sone 2 (RPE 3–4) og hold den på puls.','Hvert bakkedrag: juster opp med RPE 5–6 til sone 5, og hold sone 4–5 med tempo.','Etter draget: ned til sone 1 (RPE 1–2). Bruk RPE i pausen – gå eller jogg rolig ned igjen.','Nedjogg: sone 1 (RPE 1–2), hold på puls.']},
 k:{name:'Korte intervaller',one:'Kortintervalløkt',cat:'high',short:'Drag på 1–1,5 min i sone 5',
    desc:'Gjentatte drag på 60–90 sekunder i sone 5, adskilt av joggepauser i sone 1. Forbedrer aerob kapasitet, høyintensiv tretthetsmotstand og løpsøkonomi.',
    how:['Oppvarming: RPE 1–2 → sone 1, hold sone 1 på puls.','Juster opp til sone 2 (RPE 3–4) og hold den på puls.','Start hvert drag på RPE 9 (sone 5) og hold sone 5 med tempo.','Etter draget: ned til sone 1 (RPE 1–2). Hold sone 1 i pausen med RPE.','Nedjogg: sone 1, hold på puls.']},
 i:{name:'Lange intervaller',one:'Langintervalløkt',cat:'high',short:'Drag på 3–5 min i sone 4',
    desc:'Gjentatte drag på 3–5 minutter i sone 4. Maksimerer høyintensiv tretthetsmotstand.',
    how:['Oppvarming: RPE 1–2 → sone 1, hold sone 1 på puls.','Juster opp til sone 2 (RPE 3–4) og hold den på puls.','Start hvert drag på RPE 7 (sone 4) og hold sone 4 med tempo.','Etter draget: ned til sone 1 (RPE 1–2). Hold sone 1 i pausen med RPE.','Nedjogg: sone 1, hold på puls.']},
 m:{name:'Blandede intervaller',one:'Blandet intervalløkt',cat:'high',short:'Sone 5, 4 og 3 i samme økt',
    desc:'Skal gjøre løperen skarp før konkurranse, etter at et solid treningsgrunnlag er bygget. Inneholder innsats i sone 3, 4 og 5, og vedlikeholder treningseffekten fra økter som hver for seg har fokusert på én av sonene.',
    how:['Oppvarming: RPE 1–2 → sone 1, hold sone 1 på puls.','Juster opp til sone 2 (RPE 3–4) og hold den på puls.','Sone 5-intervall: start på RPE 9 og hold sonen med tempo.','Sone 4-intervall: start på RPE 7 og hold sonen med tempo.','Sone 3-intervall: RPE 5–6; hold sonen med puls, tempo eller begge.','Etter hvert intervall: ned til sone 1 (RPE 1–2). Hold sone 1 i pausene med RPE.','Nedjogg: sone 1, hold på puls.']}
};
const CATS=[
 {id:'low',name:'Lavintensitet',sub:'Sone 1–2',intro:'Restitusjonsturer, grunnøkter og langturer inneholder bare innsats i sone 1 og 2.'},
 {id:'mod',name:'Moderat intensitet',sub:'Sone 3',intro:'Raske avslutninger, tempoøkter, cruise-intervaller, langturer med fartslek og langturer med rask avslutning inneholder innsats i sone 3.'},
 {id:'high',name:'Høy intensitet',sub:'Sone 4–5',intro:'Fartslekøkter, bakkeintervaller og intervaller (lange, korte og blandede) inneholder høyintensitetsinnsats i sone 4 og 5.'}
];
const CAT_LABEL={low:'Lav',mod:'Moderat',high:'Høy'};

const SESSIONS={};
const TYPE_ORDER=['r','g','l','a','t','c','lf','lr','s','b','k','i','m'];
const add=(type,n,steps,extra={})=>{
  const T=TYPES[type];
  const id=type+(n||'');
  SESSIONS[id]=Object.assign({id,type,n,name:n?`${T.one} ${n}`:T.one,steps},extra);
};
// Restitusjonstur
add('r',0,[S('Hele turen',null,1)],{name:'Restitusjonstur',noTime:true,note:'Boken oppgir ikke varighet for restitusjonsturene. Tallet i planen (1–6) viser til bokens øktnummer, men detaljer for hvert nummer er ikke med i materialet.'});
// Grunnøkter
for(let n=1;n<=9;n++)add('g',n,[S('Oppvarming',5,1),S('Rolig løping',10+5*(n-1),2),S('Nedjogg',5,1)]);
// Langturer
{const tot=[9.7,11.3,12.9,14.5,16.1,17.7,19.3,20.9,22.5,24.1,25.7,27.4,29,30.6,32.2];
 const z2=[7.2,8.9,10.5,12.1,13.7,15.3,16.9,18.5,20.1,21.7,23.3,24.9,26.6,28.2,29.8];
 for(let n=1;n<=15;n++)add('l',n,[S('Oppvarming',1.6,1,'km'),S('Rolig løping',z2[n-1],2,'km'),S('Nedjogg',0.8,1,'km')],
   {km:tot[n-1],low:`${42+7*(n-1)}–${72+12*(n-1)} min avhengig av tempo`});}
// Rask avslutning
{const d=[[15,5],[20,5],[20,10],[25,10],[25,12],[30,12],[35,12],[35,15],[40,15],[45,15]];
 d.forEach(([z2,z3],i)=>add('a',i+1,[S('Oppvarming',5,1),S('Rolig løping',z2,2),S('Rask avslutning',z3,3)]));}
// Tempo
[15,18,20,24,28,30,32,36,40,45].forEach((z3,i)=>add('t',i+1,[S('Oppvarming',5,1),S('Rolig løping',5,2),S('Tempo',z3,3),S('Rolig løping',5,2),S('Nedjogg',5,1)]));
// Cruise
[5,8,10,12,15].forEach((d,i)=>add('c',i+1,[S('Oppvarming',5,1),S('Rolig løping',5,2),G(4,S('Cruise-intervall',d,3),S('Pause',3,1)),S('Rolig løping',5,2),S('Nedjogg',5,1)]));
// Langtur med fartslek
{const tot=[16.1,19.3,22.5,25.7,29,32.2];
 const lo=['56–96','65–111','74–126','83–141','92–156','101–171'],mo=['12–20','15–25','18–30','21–35','24–40','27–45'];
 for(let i=0;i<6;i++)add('lf',i+1,[S('Oppvarming',0.8,1,'km'),S('Rolig løping',1.6,2,'km'),G(8+2*i,S('Fartslek-drag',0.4,3,'km'),S('Rolig løping',1.2,2,'km')),S('Nedjogg',0.8,1,'km')],
   {km:tot[i],low:lo[i]+' min avhengig av tempo',modS:mo[i]+' min avhengig av tempo'});}
// Langtur med rask avslutning
{const tot=[16.1,19.3,22.5,25.7,29,32.2],z2=[13.7,16.9,19.3,22.5,24.9,28.2],z3=[1.6,1.6,2.4,2.4,3.2,3.2];
 const lo=['63–90','77–110','87–125','101–145','112–160','126–180'],mo=['6–9','6–9','10–17','10–17','14–18','14–18'];
 for(let i=0;i<6;i++)add('lr',i+1,[S('Oppvarming',0.8,1,'km'),S('Rolig løping',z2[i],2,'km'),S('Rask avslutning',z3[i],3,'km')],
   {km:tot[i],low:lo[i]+' min avhengig av tempo',modS:mo[i]+' min avhengig av tempo'});}
// Fartslek
[[3,2,4],[5,1,5],[4,2,4],[6,1,5],[5,2,4],[7,1,5],[6,2,4],[8,1,5],[9,1,5],[7,2,4],[10,1,5],[8,2,4],[9,2,4],[12,1,5]]
 .forEach(([r,d,z],i)=>add('s',i+1,[S('Oppvarming',5,1),S('Rolig løping',5,2),G(r,S('Drag',d,z),S('Pause',2,1)),S('Nedjogg',5,1)]));
// Bakkeintervaller
[[6,.5,1.5],[8,.5,1.5],[6,1,2],[10,.5,1.5],[12,.5,1.5],[8,1,2],[6,1.5,2.5],[10,1,2],[8,1.5,2.5],[12,1,2],[10,1.5,2.5],[12,1.5,2.5]]
 .forEach(([r,d,p],i)=>add('b',i+1,[S('Oppvarming',5,1),S('Rolig løping',5,2),G(r,S('Bakkedrag oppover',d,5),S('Pause',p,1)),S('Nedjogg',5,1)]));
// Korte intervaller
[[6,1,2],[8,1,2],[6,1.5,2.5],[10,1,2],[8,1.5,2.5],[12,1,2],[10,1.5,2.5],[12,1.5,2.5]]
 .forEach(([r,d,p],i)=>add('k',i+1,[S('Oppvarming',5,1),S('Rolig løping',5,2),G(r,S('Drag',d,5),S('Pause',p,1)),S('Nedjogg',5,1)]));
// Lange intervaller
[[3,3,2],[4,3,2],[3,5,3],[5,3,2],[6,3,2],[4,5,3],[5,5,3],[6,5,3],[7,5,3],[8,5,3]]
 .forEach(([r,d,p],i)=>add('i',i+1,[S('Oppvarming',5,1),S('Rolig løping',5,2),G(r,S('Drag',d,4),S('Pause',p,1)),S('Nedjogg',5,1)]));
// Blandede intervaller
add('m',1,[S('Oppvarming',5,1),S('Rolig løping',5,2),S('Drag',1,5),S('Pause',2,1),S('Drag',3,4),S('Pause',2,1),S('Drag',5,3),S('Pause',2,1),S('Drag',3,4),S('Pause',2,1),S('Drag',1,5),S('Nedjogg',5,1)],{mixed:true});
add('m',2,[S('Oppvarming',5,1),S('Rolig løping',5,2),S('Drag',1.5,5),S('Pause',2,1),S('Drag',5,4),S('Pause',2,1),S('Drag',10,3),S('Pause',2,1),S('Drag',5,4),S('Pause',2,1),S('Drag',1.5,5),S('Nedjogg',5,1)],{mixed:true});
add('m',3,[S('Oppvarming',5,1),S('Rolig løping',5,2),G(2,S('Drag',1,5),S('Pause',2,1)),G(2,S('Drag',3,4),S('Pause',2,1)),S('Drag',10,3),S('Pause',2,1),G(2,S('Drag',3,4),S('Pause',2,1)),G(2,S('Drag',1,5),S('Pause',2,1)),S('Nedjogg',5,1)],{mixed:true});
add('m',4,[S('Oppvarming',5,1),S('Rolig løping',5,2),G(2,S('Drag',1.5,5),S('Pause',2.5,1)),G(2,S('Drag',5,4),S('Pause',2,1)),S('Drag',10,3),S('Pause',2,1),G(2,S('Drag',1.5,5),S('Pause',2,1)),G(2,S('Drag',5,4),S('Pause',2,1)),S('Nedjogg',5,1)],{mixed:true,note:'Boken oppgir 71:00 totalt, men summerer man delene i boken blir det 70 minutter. Her vises summen av trinnene. Pausene i blokkene følger bildet i boken (2,5 min i første, 2 min i andre) og kan være en unøyaktighet.'});
// Spesial
SESSIONS.ms={id:'ms',type:'ms',name:'Maratonsimulator',steps:[],cat:'mod',special:true,
  note:'Maratonsimulator er en spesialøkt i maratonplanene. Den er ikke beskrevet i øktoversikten, så detaljer mangler foreløpig.'};
SESSIONS.x={id:'x',type:'x',name:'Annen kondisjonstrening 20 min',steps:[],cat:'alt',special:true,
  note:'Annen kondisjonstrening er all slags aerob mosjon i stedet for løping, for eksempel sykling, svømming eller rask gange. Planen oppgir 20 minutter, og du bestemmer selv aktiviteten.'};

// utledede felt
Object.values(SESSIONS).forEach(s=>{
  s.cat=s.cat||TYPES[s.type].cat;
  const fl=flat(s.steps);
  if(!s.km&&!s.noTime&&!s.special){
    s.min=fl.reduce((a,x)=>a+x.d,0);
    const sum=zs=>fl.filter(x=>zs.includes(x.z)).reduce((a,x)=>a+x.d,0);
    s.lowM=sum([1,2]);s.modM=sum([3]);s.highM=sum([4,5]);
  }
});

/* =========================================================
   DATA – planer (fra 80-20-planer.md), kompakt kodet
   Kode: g=Grunnøkt r=Restitusjonstur l=Langtur a=Rask avslutning t=Tempoøkt c=Cruise
   lf=Langtur m/fartslek lr=Langtur m/rask avslutning s=Fartslek b=Bakke k=Kort i=Lang m=Blandet
   ms=Maratonsimulator x=Annen kondisjonstrening  ~ = «el. kryss»  + = to økter samme dag  - = hvile  RACE = løpet
   Linje: fase|man tir ons tor fre lør søn|lav-%
   ========================================================= */
const PLANS={
'5-1':{m:'Passer nybegynnere som forbereder seg til sitt første 5 km-løp, og mer erfarne løpere som trenger eller foretrekker et relativt lavvolums program.',f:'Løpe minst 3 ganger i uken og drive aerob trening 6 ganger i uken før du starter.',b:'2 t 10 min i uke 1 → 3 t 52 min i uke 8',w:`
G|- g1 x s1 x g2 x|91
G|- a1 g2~ g2~ s2 g2~ g3|87
G|- a1 g2~ g2~ s1 g2~ g3|89
T|- s2 g3~ g3~ b1 r3~ a2|82
T|- s3 g4~ g4~ b2 r4~ a3|79
T|- s2 g3~ g3~ b1 r3~ a2|82
T|- s4 r4~ g4~ i1 r4~ a4|79
T|- s5 r5~ g5~ i2 r5~ a5|78
N|- i1 r3~ g3~ s1 r1~ RACE|75`},
'5-2':{m:'Laget for løpere som er klare til å øke treningsbelastningen ett til to hakk for å forbedre 5 km-tiden.',f:'Løpe minst 3 ganger i uken, med noen korte drag på moderat og høy intensitet og noen rolige turer på minst 9,7 km, og drive aerob trening 7 ganger i uken.',b:'4 t 30 min i uke 1 → ca. 5 t 31 min i uke 8',w:`
G|g5~ s3 g5~ g5~ b2 r5~ l1|88
G|g5~ s5 g6~ g5~ b4 r5~ l2|86
G|- s3 g6~ g5~ b3 r6~ l1|86
T|g6~ i1 r6~ g6~ k4 r6~ a7|81
T|r6~ i2 r6~ g7~ k5 r6~ a8|79
T|- i1 r5~ g6~ k2 r5~ a6|79
T|r6~ k3 r6~ g8~ i6 r6~ a9|79
T|r6~ k2 r6~ g9~ i7 r6~ a10|78
N|- i2 r4~ g3~ s2 r2~ RACE|77`},
'5-3':{m:'Passer erfarne konkurranseløpere som er forberedt på å trene to ganger daglig enkelte dager for å bli bedre på 5 km.',f:'Løpe minst 3 ganger i uken, med noen korte drag på moderat og høy intensitet og noen rolige turer på minst 11,3 km, og drive aerob trening minst 7 ganger i uken.',b:'5 t 35 min i uke 1 → ca. 8 t 16 min i uke 7',w:`
G|g6~ s5+g4~ g6~ g6~ b4 r6~ l2|88
G|g6~ s10+g4~ g6~ g6~+g4~ b5 r6~ l3|87
G|- s7+g6~ g6~ g6~ b3 r6~ l2|86
T|g6~ i2+r5~ g6~ g6~+g5~ k7 r6~+g5~ t6|79
T|r6~ i4+r6~ g6~ g6~+g6~ k8 r6~+g6~ t7|78
T|- i2+r5~ g6~ g6~+g5~ k5 r6~+g5~ t4|80
T|r6~ k4+r6~ g6~ g6~+g6~ i9 r6~+g6~ a10|81
T|r6~ k3+r5~ g6~ g6~+g5~ i8 r6~+g5~ a8|79
N|- i4 r5~ g4~ s2 r3 RACE|77`},
'10-1':{m:'Passer nye løpere som forbereder seg til sitt første 10 km-løp, og mer erfarne løpere som trenger eller foretrekker et relativt lavvolums program.',f:'Løpe minst 3 ganger i uken i opptil 30 minutter eller mer og drive aerob trening 6 ganger i uken.',b:'2 t 37 min i uke 1 → 3 t 56 min i uke 10',w:`
G|- a1 g2~ g2~ s1 g2~ g3|89
G|- a2 g3~ g2~ s2 g2~ g4|89
G|- a1 g2~ g2~ s1 g2~ g3|89
G|- a3 g3~ g2~ b1 r3~ g5|88
G|- a3 g3~ g3~ b2 r3~ g6|88
G|- a2 g2~ g2~ b1 r3~ g5|90
T|- s3 g3~ g4~ k1 r3~ g5|80
T|- s5 g3~ g4~ k2 r4~ g6|80
T|- i1 g3~ g4~ s2 r3~ a2|81
T|- i2 g4~ g4~ m2 r4~ g7|78
N|- i4 g4~ g3~ m1 g3~ g6|79
N|- s2 g3~ g2~ a1 r1~ RACE|85`},
'10-2':{m:'Laget for løpere som er klare til å øke treningsbelastningen ett til to hakk for å forbedre 10 km-tiden.',f:'Løpe minst 3 ganger i uken, med noen korte drag på moderat og høy intensitet og noen rolige turer på minst 9,7 km, og drive aerob trening 7 ganger i uken.',b:'4 t 43 min i uke 1 → ca. 5 t 59 min i uke 10',w:`
G|g5~ a4 g5~ g5~ s4 g5~ l1|90
G|g5~ a5 g6~ g5~ s5 g5~ l2|89
G|- a4 g5~ g6~ s4 g5~ l1|89
G|g5~ a7 g6~ g5~ b5 r6~ l3|89
G|r5~ a8 g6~ g6~ b6 r6~ l4|89
G|- a5 g6~ g6~ b3 r6~ l2|89
T|g6~ s7 g6~ g6~ k4 r6~ a9|79
T|r6~ s10 g7~ g6~ k5 r7~ a10|78
T|- i2 g6~ g5~ s6 r6~ a7|79
T|g6~ i4 g7~ g6~ m3 r7~ lf1|78
N|r5~ i3 g5~ g5~ m1 g4~ a7|79
N|- s5 g4~ g3~ a3 r2~ RACE|81`},
'10-3':{m:'Passer erfarne konkurranseløpere som er forberedt på å trene to ganger daglig enkelte dager for å bli bedre på 10 km.',f:'Løpe minst 3 ganger i uken, med noen korte drag på moderat og høy intensitet og noen rolige turer på minst 11,3 km, og drive aerob trening minst 7 ganger i uken.',b:'5 t 39 min i uke 1 → ca. 8 t 41 min i uke 10',w:`
G|g6~ a4+g3~ g6~ g6~ s6 g6~ l2|90
G|g6~ a5+g3~ g6~ g6~+g3~ s7 g6~ l3|90
G|- a4+g5~ g6~ g6~ s6 g5~ l4|90
G|g6~ t2+g3~ g6~ g6~+g3~ b4 r6~+g3~ lr1|89
G|r6~ t3+r4~ g6~ g6~+g4~ b5 r6~+g4~ lr2|89
G|- t2+r4~ g6~ g6~+g4~ b3 r6~+g4~ a9|87
T|g6~ s10+r5~ g6~ g6~+g5~ k7 r6~+g5~ lf1|81
T|r6~ s12+r6~ g6~ g6~+g6~ k8 r6~+g6~ lf2|81
T|- i4+r5~ g5~ g5~+g5~ s8 r5~+g5~ a10|83
T|g6~ i7+r6~ g6~ g6~+g6~ m4 r6~+g6~ lf2|81
N|r5~ i5+r5~ g5~ g5~+g5~ m3 g9~ lf1|82
N|- s5 g4~ g3~ a3 r2~ RACE|81`},
'hm-1':{m:'Passer nye løpere som forbereder seg til sitt første halvmaraton, og mer erfarne løpere som trenger eller foretrekker et relativt lavvolums program.',f:'Løpe minst 3 ganger i uken, med turer på opptil 9,7 km eller mer, og drive aerob trening 6 ganger i uken.',b:'3 t 9 min i uke 1 → 4 t 56 min i uke 14',w:`
G|- a1 g2~ g2~ s2 g2~ l1|89
G|- a2 g3~ g2~ s1 g2~ l2|91
G|- a1 g2~ g2~ s2 g2~ l1|89
G|- a3 g3~ g2~ b2 r3~ l3|88
G|- a4 g3~ g3~ b4 r3~ l4|88
G|- a2 g2~ g3~ b3 r3~ l2|89
T|- t1 r3~ g4~ k2 r3~ l5|86
T|- c1 r4~ g4~ k3 r3~ l6|81
T|- t1 r3~ g3~ k2 r3~ l3|83
T|- t3 r4~ g4~ i2 r4~ lf1|80
T|- t4 r4~ g5~ i4 r4~ lr1|80
T|- t2 r4~ g4~ i3 r4~ l3|83
T|- t5 r4~ g5~ m1 r5~ lr2|81
T|- t6 r5~ g5~ m1 r5~ lr1|80
N|- a3 g3~ g2~ s1 r1 RACE|84`},
'hm-2':{m:'Laget for løpere som er klare til å øke treningsbelastningen ett til to hakk for å forbedre halvmaratontiden.',f:'Løpe minst 3 ganger i uken, med noen korte drag på moderat og høy intensitet og noen rolige turer på minst 11,3 km, og drive aerob trening 7 ganger i uken.',b:'4 t 44 min i uke 1 → ca. 6 t 20 min i uke 13',w:`
G|g5~ a3 g5~ g5~ s4 g5~ l2|90
G|g5~ a4 g6~ g5~ s5 g5~ l3|90
G|- a3 g5~ g5~ s4 g5~ l1|88
G|g5~ a4 r6~ g6~ b5 r5~ l5|90
G|g5~ a5 r6~ g6~ b6 r6~ l7|90
G|- a4 r5~ g5~ b4 r5~ l3|88
T|g6~ c1 r6~ g6~ k4 r6~ lf1|79
T|r6~ t4 r6~ g6~ k5 r6~ lf2|80
T|- c1 r5~ g6~ k3 r5~ lr1|81
T|g6~ t5 r6~ g6~ i3 r6~ lf2|81
T|r6~ c2 r6~ g6~ i6 r6~ lr2|81
T|- t4 r5~ g6~ i3 r5~ lf1|79
T|g6~ t7 r6~ g6~ m2 r6~ lr3|81
N|r5~ t5 r5~ g4~ m2 r4~ lf1|78
N|- a5 g4~ g3~ s2 r2 RACE|83`},
'hm-3':{m:'Passer erfarne konkurranseløpere som er forberedt på å trene to ganger daglig enkelte dager for å bli bedre på halvmaraton.',f:'Løpe minst 3 ganger i uken, med noen korte drag på moderat og høy intensitet og noen rolige turer på minst 12,9 km, og drive aerob trening minst 7 ganger i uken.',b:'5 t 52 min i uke 1 → ca. 9 t 31 min i uke 13',w:`
G|g6~ a6+g3~ g6~ g6~ s8 g6~ l3|90
G|g6~ a7+g3~ g7~ g6~+g3~ s10 g6~ l5|91
G|- a6+g3~ g6~ g6~ s8 g6~ l3|88
G|g6~ a8+g4~ g8~ g6~+g4~ b7 r6~+g4~ l7|91
G|g6~ a9+g5~ g8~ g6~+g4~ b8 r6~+g4~ l9|91
G|- a7+g4~ g6~ g6~+g4~ b6 r6~+g4~ l4|90
T|g6~ c2+g5~ g9~ g6~+g5~ k6 r6~+g5~ lf1|80
T|g6~ t6+g6~ g9~ g6~+g6~ k7 r6~+g6~ lf2|82
T|- c1+g5~ g6~ g5~+g5~ k4 r5~+g5~ lf1|81
T|g6~ t8+r6~ g9~ g6~+r6~ i7 r6~+r6~ lf3|81
T|r6~ c3+r6~ g9~ g6~+r6~ i8 r6~+r6~ lf3|81
T|- c2+r5~ g6~ g5~+r5~ i3 r5~+r5~ lr1|81
T|r6~ t9+r6~ g9~ g6~+r6~ m4 r6~+r6~ lr4|80
N|r5~ t6+r5~ g5~ g5~+r4~ m2 r4~+r4~ lf1|83
N|- a6 g5~ g4~ s5 r2 RACE|80`},
'mar-1':{m:'Passer nye løpere som forbereder seg til sitt første maraton, og mer erfarne løpere som trenger eller foretrekker et relativt lavvolums program.',f:'Løpe minst 3 ganger i uken, med turer på opptil 9,7 km eller mer, og drive aerob trening 6 ganger i uken.',b:'3 t 21 min i uke 1 → 6 t 34 min i uke 16',n:'Dette nivået har ingen økter som kan byttes ut med annen trening. Uke 16: boken oppgir «M/H 81 %», trolig en trykkfeil for 21 %. Her er 21 % brukt.',w:`
G|- a2 g3 g3 s1 g3 l1|92
G|- a3 g4 g3 s2 g3 l2|91
G|- a2 g3 g3 s1 g3 l1|92
G|- a4 g4 g3 b1 r4 l3|91
G|- a6 g4 g4 b2 r4 l4|90
G|- a4 g3 g4 b1 r3 l2|90
G|- a7 g5 g4 b4 r4 l5|89
G|- a8 g5 g5 b6 r4 l7|89
G|- a6 g4 g4 b4 r4 l4|89
T|- t2 r5 g5 k1 r4 l9|88
T|- c1 r5 g5 k2 r5 l11|84
T|- t2 r4 g5 k1 r4 lf1|79
T|- t3 r5 g6 i2 r5 lr1|83
T|- t4 r6 g6 i3 r5 lf2|78
T|- t2 r5 g5 i1 r5 ms|79
T|- c2 r6 g6 m1 r6 lr5|79
N|- t4 g5 g5 m1 r4 lf2|79
N|- a4 g4 g3 s2 r1 RACE|84`},
'mar-2':{m:'Laget for løpere som er klare til å øke treningsbelastningen ett til to hakk for å forbedre maratontiden.',f:'Løpe minst 3 ganger i uken, med noen korte drag på moderat og høy intensitet og noen rolige turer på minst 12,9 km, og drive aerob trening 7 ganger i uken.',b:'4 t 52 min i uke 1 → ca. 6 t 56 min i uke 13',n:'Uke 17: nummeret på søndagens «Langtur med rask avslutning» er ikke oppgitt i boken.',w:`
G|g5~ a4 g5~ g5~ s4 g5~ l3|91
G|g5~ a6 g5~ g5~ s5 g5~ l4|90
G|- a4 g5~ g4~ s4 g5~ l2|89
G|g5~ a6 g5~ g5~ b4 r5~ l5|90
G|g5~ a7 g6~ g5~ b5 r5~ l7|90
G|- a6 g5~ g5~ b4 r5~ l3|89
G|g5~ a8 g6~ g5~ b6 r6~ l9|90
G|g5~ a9 g6~ g6~ b8 r6~ l11|88
G|- a6 g6~ g5~ b6 r6~ l5|88
T|g6~ c1 r6~ g6~ k4 r6~ l13|84
T|r6~ t4 r6~ g6~ k5 r6~ l15|86
T|- t3 r5 g5 k3 r5 l7|85
T|g6~ t5 r6~ g6~ i3 r6~ lf4|80
T|r6~ c2 r6~ g6~ i5 r6~ lr4|79
T|- t4 r5~ g5~ i2 r5~ ms|77
T|r6~ t6 r6~ g6~ m2 r6~ lf5|78
N|r5~ c1 g4~ g4~ m1 r4~ lr|82
N|- a4 g3~ g3~ s3 r1 RACE|83`},
'mar-3':{m:'Passer erfarne konkurranseløpere som er forberedt på å trene to ganger daglig enkelte dager for å bli bedre på maraton.',f:'Løpe minst 3 ganger i uken, med noen korte drag på moderat og høy intensitet og noen rolige turer på minst 16,1 km, og drive aerob trening minst 7 ganger i uken.',b:'6 t 43 min i uke 1 → ca. 10 t 51 min i uke 16',n:'Uke 13: lørdagens andre økt står i boken som «Grunnøkt eller annen trening» uten nummer. Uke 4: balansen 94 % / 6 % er gjengitt slik den står i boken.',w:`
G|g6~ a6+g3~ g6~ g6~ s6 g6~ l5|92
G|g6~ a6+g3~ g6~ g6~+g3~ s10 g6~ l7|91
G|- a6+g3~ g6~ g6~ s8 g6~ l5|87
G|g6~ a7+g4~ g6~ g6~+g4~ b7 r6~ l9|94
G|g6~ a8+g4~ g7~ g6~+g4~ b8 r6~+g4~ l11|90
G|- a7+g4~ g6~ g6~+g4~ b6 r6~ l7|90
G|g6~ a9+g5~ g7~ g6~+g5~ b9 r6~+g5~ l13|89
G|g6~ a10+g6~ g7~ g6~+g6~ b11 r6~+g6~ l15|90
G|- a9+g5~ g6~ g5~+g5~ b6 r5~+g5~ l8|92
T|g6~ c2+r6~ g8~ g6~+g6~ k7 r6~+g6~ lf4|80
T|r6~ t8+r6~ g8~ g6~+g6~ k8 r6~+g6~ lr4|83
T|- c2+r5~ g6~ g5~+g5~ k4 r5~+g5~ lf3|80
T|r6~ c3+r6~ g9~ g6~+g6~ i6 r6~+g6~ lf5|81
T|r6~ t9+r6~ g9~ g6~+g6~ i7 r6~+g6~ lf6|81
T|- t4+r5~ g6~ g5~+g5~ i4 r5~+g5~ ms|80
T|r6~ c4+r6~ g9~ g6~+g6~ m4 r6~+g6~ lr6|80
N|r5~ t6+r5~ g5~ g5~+g4~ m2 r4~+g4~ lf3|82
N|- a6 g5~ g4~ s5 r2 RACE|80`}
};
const DISTS=[
 {k:'5',name:'5 km',km:'5',weeks:9,label:'5 km'},
 {k:'10',name:'10 km',km:'10',weeks:12,label:'10 km'},
 {k:'hm',name:'Halvmaraton',km:'21,1',weeks:15,label:'Halvmaraton'},
 {k:'mar',name:'Maraton',km:'42,2',weeks:18,label:'Maraton'}
];
const LEVELS={1:'Nybegynner / lavt volum',2:'Økt belastning',3:'Erfaren – dobbeltøkter'};
const PHASE={G:'Grunnfase',T:'Toppfase',N:'Nedtrapping'};
const DAYS=['Man','Tir','Ons','Tor','Fre','Lør','Søn'];

// Parse planer
const TOK=/^(lf|lr|ms|[a-z])(\d*)(~?)$/;
Object.entries(PLANS).forEach(([key,P])=>{
  P.weeks=P.w.trim().split('\n').map(line=>{
    const [ph,days,lo]=line.split('|');
    return {ph,low:+lo,days:days.split(' ').map(d=>d==='-'?[]:d.split('+').map(t=>{
      if(t==='RACE')return {race:true};
      const m=t.match(TOK);return {code:m[1],n:m[2]?+m[2]:0,alt:m[3]==='~'};
    }))};
  });
  P.key=key;
});
function sessionFor(it){
  if(it.race)return null;
  if(it.code==='ms')return SESSIONS.ms;
  if(it.code==='r')return SESSIONS.r;
  if(it.code==='x')return SESSIONS.x;
  return SESSIONS[it.code+(it.n||'')]||null;
}
function itemName(it){
  if(it.code==='x')return 'Annen kondisjonstrening';
  if(it.code==='ms')return 'Maratonsimulator';
  const T=TYPES[it.code];return it.n?`${T.one} ${it.n}`:T.one;
}
function itemDur(it,s){
  if(!s)return '';
  if(it.code==='x')return '20 min';
  if(s.km)return fmtNum(s.km)+' km';
  if(s.min)return fmtNum(s.min)+' min';
  return '';
}
function itemCat(it){return it.code==='x'?'alt':it.code==='ms'?'mod':TYPES[it.code].cat}

// indeks: hvor brukes en økt
const USES={};
Object.values(PLANS).forEach(P=>P.weeks.forEach((w,wi)=>w.days.forEach(d=>d.forEach(it=>{
  if(it.race)return;
  const s=sessionFor(it);if(!s)return;
  const id=s.id;
  ((USES[id]??={})[P.key]??=new Set()).add(wi+1);
}))));


/* =========================================================
   Felles hjelpere (brukes av både appen og byggeskriptet)
   ========================================================= */
const zonePct=z=>{const Z=ZONES[z];return Z.hi?`${Z.lo}–${Z.hi} %`:`${Z.lo}+ %`};
const planName=k=>{const [d,l]=k.split('-');return `${DISTS.find(x=>x.k===d).name} nivå ${l}`};
const slug=s=>s.toLowerCase().replace(/ø/g,'o').replace(/å/g,'a').replace(/æ/g,'ae').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const DIST_SLUG={'5':'5-km','10':'10-km','hm':'halvmaraton','mar':'maraton'};
/* Adresse til den delbare, statiske siden (relativt til del/) */
function pathOf(kind,id){
  switch(kind){
    case 'index':return 'index.html';
    case 'minplan':return 'min-plan.html';
    case 'styrke':return 'styrke.html';
    case 'alt':return 'alt.html';
    case 'teori':return 'teori.html';
    case 'teori-sec':return 'teori/'+id+'.html';
    case 'planer':return 'planer.html';
    case 'dist':return 'planer/'+DIST_SLUG[id]+'.html';
    case 'plan':{const [d,l]=id.split('-');return `planer/${DIST_SLUG[d]}-niva-${l}.html`}
    case 'okter':return 'okter.html';
    case 'type':return 'okter/typer/'+slug(TYPES[id].name)+'.html';
    case 'okt':return 'okter/'+slug(SESSIONS[id].name)+'.html';
  }
}
/* Fordeling lav / moderat / høy for en økt: [[etikett, tekst], ...] */
function distRows(s){
  if(s.km){const r=[['Lavintensitet',s.low]];if(s.modS)r.push(['Moderat intensitet',s.modS]);return r}
  if(!s.min)return [];
  const a=[];
  if(s.lowM)a.push(['Lavintensitet',fmtNum(s.lowM)+' min']);
  if(s.mixed)a.push(['Moderat/høy intensitet',fmtNum(s.modM+s.highM)+' min']);
  else{if(s.modM)a.push(['Moderat intensitet',fmtNum(s.modM)+' min']);if(s.highM)a.push(['Høy intensitet',fmtNum(s.highM)+' min'])}
  return a;
}
/* Øktformat som tekst, f.eks. «5 min sone 1 → 4 × (3 min sone 4 / 2 min sone 1) → …» */
function formatText(s){
  if(!s.steps.length)return '';
  const one=x=>x.d==null?'Hele turen i sone '+x.z:`${fmtDur(x)} sone ${x.z}`;
  return s.steps.map(x=>x.rep?`${x.rep} × (${x.steps.map(one).join(' / ')})`:one(x)).join(' → ');
}
const zonesOfType=t=>{
  const set=new Set();
  Object.values(SESSIONS).filter(s=>s.type===t).forEach(s=>flat(s.steps).forEach(x=>set.add(x.z)));
  return [...set].sort();
};
const RPE_SCALE=[
 ['1','Ekstremt lett','Jeg føler at jeg kunne løpt for alltid i dette tempoet.'],
 ['2','Veldig lett','Jeg føler at jeg virkelig holder meg tilbake.'],
 ['3','Lett','Jeg føler at jeg holder meg litt tilbake.'],
 ['4','Behagelig','Tempoet føles naturlig, verken å holde igjen eller presse.'],
 ['5','Ganske behagelig','Jeg presser meg bittelitt.'],
 ['6','Litt hardt','Kan holde tempoet i 20–30 min (godt trent: 50–60 min).'],
 ['7','Noe hardt','Smell om 10–15 min (godt trent: 15–20 min).'],
 ['8','Hardt','Kan holde tempoet i omtrent 1,6 km, ikke mer.'],
 ['9','Veldig hardt','Kan holde tempoet i et par minutter, kanskje tre.'],
 ['10','Ekstremt hardt','Kan holde tempoet i ett minutt, maks.']];
const RPE_SHORT='RPE er opplevd anstrengelse: et tall fra 1 (så lett at du kunne holdt på for alltid) til 10 (så hardt at du bare orker ett minutt), basert på hvordan det føles og ikke på klokke eller puls.';

/* Teori som seksjoner. o={app:boolean, pulse:fn|null, href:(kind,id)=>string} */
function teori(o){
  const zr=[1,2,3,4,5].map(z=>`<tr><td>${z}</td><td>${ZONES[z].n}</td><td>${zonePct(z)}</td><td>${ZONES[z].rpe} av 10</td>${o.pulse?`<td class="pz">${o.pulse(z)||'–'}</td>`:''}</tr>`).join('');
  const lt=o.app?`<p>Skriv inn din laktatterskelpuls for å få pulsområdene i slag/min i hele appen:</p><input class="num" id="lt" type="number" inputmode="numeric" min="100" max="220" placeholder="f.eks. 160" value="${o.ltValue||''}"> <span class="muted">slag/min</span>`:'';
  return [
  {id:'slik-bruker-du-planene',title:'Slik bruker du planene',html:`
   <p>Planene følger 80/20-prinsippet: det aller meste av løpingen gjøres rolig, og bare en liten del hardt. Velg distanse og nivå, og følg planen uke for uke.</p>
   <p>Uken starter alltid på mandag, men du kan fordele øktene annerledes (for eksempel langtur en annen dag enn søndag). Tallet bak øktnavnet, for eksempel «Tempoøkt 4», viser til økten i øktoversikten. «el. annen trening» betyr at økten kan byttes med annen kondisjonstrening eller mosjon, for eksempel sykling eller svømming. Der en dag har to økter, står de under hverandre.</p>
   <p>Treningssyklusen er 3 eller 4 uker, med gradvis økende volum og en lettere uke til slutt.</p>${o.app?'<p>I appen kan du velge hvilken dag langturen skal ligge på, og sette et bokmerke på en uke i hver plan så du lett finner tilbake.</p>':''}`},
  {id:'velg-riktig-niva',title:'Velg riktig nivå',html:[1,2,3].map(l=>`<p><b>Nivå ${l} – ${LEVELS[l]}.</b> ${l===1?'Nye løpere, eller erfarne som trenger eller foretrekker et relativt lavvolums program. Løp minst 3 ganger i uken og tren aerobt 6 ganger i uken før du starter.':l===2?'For løpere som er klare til å øke belastningen ett til to hakk. Løp minst 3 ganger i uken og tren aerobt 7 ganger i uken.':'For erfarne konkurranseløpere som er forberedt på å trene to ganger daglig enkelte dager.'}</p>`).join('')},
  {id:'pulssoner',title:'Pulssoner og intensitet',html:`
   <p>Sonene regnes som prosent av <b>laktatterskelpuls</b> (ikke makspuls). Hver sone kan styres med puls, opplevd anstrengelse (RPE, se egen seksjon) og tempo. Sone 1–2 er lav intensitet, sone 3 moderat og sone 4–5 høy.</p>
   <table class="t"><tr><th>Sone</th><th>Navn</th><th>% av terskelpuls</th><th>Anstrengelse (RPE)</th>${o.pulse?'<th>Puls</th>':''}</tr>${zr}</table>
   ${lt}
   <p class="muted">Tabellen i boken dekker ikke 90–95 %, så det er et mellomrom mellom sone 2 og 3. Makspuls i dette oppsettet er 200 slag/min.</p>
   <div class="note"><b>Slik finner du laktatterskelpulsen</b> (ikke fra boken, en vanlig feltmetode): Varm opp godt, og løp 30 minutter jevnt så hardt du klarer å holde hele veien, helst alene og på flatt, med pulsbelte. Gjennomsnittspulsen de siste 20 minuttene er en god tilnærming. Gjenta hver 6.–8. uke. Terskelpulsen ligger ofte på 85–92 % av makspuls (ca. 170–184 slag/min ved makspuls 200) – en grov pekepinn.</div>`},
  {id:'rpe',title:'Opplevd anstrengelse (RPE)',html:`
   <p><b>RPE</b> står for <i>Rate of Perceived Exertion</i>, altså opplevd anstrengelse. Det er et tall fra 1 til 10 som sier hvor hardt det føles akkurat nå – uten å se på klokke eller puls. 1 er så lett at du kunne holdt på for alltid, 10 er så hardt at du bare orker ett minutt.</p>
   <p>I planene brukes RPE sammen med puls: RPE hjelper deg å komme i riktig sone når en ny del av økten starter, og pulsen hjelper deg å holde deg der. Underveis i hele økten bruker du RPE til å finjustere innsatsen.</p>
   <p class="muted">Enkel pekepinn (ikke fra boken): ved RPE 1–4 kan du snakke i hele setninger, ved 5–6 bare i korte setninger, og fra 7 og oppover klarer du omtrent bare enkeltord.</p>
   <table class="t"><tr><th>RPE</th><th>Beskrivelse</th><th>Slik kan det kjennes</th></tr>${RPE_SCALE.map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="muted">${r[2]}</td></tr>`).join('')}</table>`},
  {id:'intensitetsfordeling',title:'Intensitetsfordeling (80/20)',html:`
   <p>Sone 1–2 er lav intensitet, sone 3 moderat og sone 4–5 høy. I planene viser «intensitetsbalanse» hvor stor andel av ukens treningstid som er lav (L) og moderat/høy (M/H). Grunnfasen har typisk rundt 90 % lav, toppfasen 78–85 %. Generelt gradvis økende løpevolum med 85–90 % lav intensitet; de «harde» øktene er hovedsakelig langturer, fartslek, løp med rask avslutning og bakkeintervaller.</p>`},
  {id:'ukesoppsett',title:'Eksempel på ukesoppsett',html:`
   <table class="t"><tr><th>Man</th><th>Tir</th><th>Ons</th><th>Tor</th><th>Fre</th><th>Lør</th><th>Søn</th></tr>
   <tr><td>Rolig eller hvile</td><td>Moderat/høy</td><td>Rolig</td><td>Rolig</td><td>Moderat/høy</td><td>Rolig</td><td>Langtur</td></tr></table>`},
  {id:'treningssyklus',title:'Treningssyklus (3 eller 4 uker)',html:`
   <p>Volumet øker gradvis og avsluttes med en lettere uke. Eksempel fra boken: 3-ukers syklus 32 – 39 – 26 km; 4-ukers syklus 97 – 103 – 109 – 80 km. 4-ukersvolumene er høye og passer erfarne løpere.</p>`},
  {id:'okter-til-mal',title:'Økter til hvilket mål?',html:(()=>{
    const L=t=>`<a href="${o.href('type',t)}"><b>${TYPES[t].name.replace('Tempoøkter','Tempo\u00ADøkter').replace('intervaller','inter\u00ADvaller').replace('avslutning','av\u00ADslutning')}</b></a>`;
    return `<p>Hvilke øktyper som passer best avhenger av løpsdistansen. Tabellen følger oppsettet i boken.</p>
   <table class="t gridtab"><colgroup><col style="width:27%"><col><col><col><col></colgroup><tr><th></th><th>5&nbsp;km</th><th>10&nbsp;km</th><th>Halv&shy;maraton</th><th>Maraton</th></tr>
   <tr><th scope="row">Konkurranse&shy;spesifikke økter</th><td>${L('i')}</td><td>${L('t')}</td><td>${L('lf')}</td><td>${L('lr')}</td></tr>
   <tr><th scope="row">Forbe&shy;redende økter</th><td colspan="2">${L('s')}</td><td colspan="2">${L('l')}</td></tr>
   <tr><th scope="row">Generell kondisjon</th><td colspan="4">Gradvis økende løpevolum med 85–90 % lav intensitet. De «harde» øktene er hovedsakelig langturer, fartslek, løp med rask avslutning og bakkeintervaller.</td></tr></table>
   <ul>
    <li><b>Konkurransespesifikke økter</b> ligner mest på selve løpet: ${TYPES.i.short.toLowerCase()} (5 km), ${TYPES.t.short.toLowerCase()} (10 km), ${TYPES.lf.short.toLowerCase()} (halvmaraton) og ${TYPES.lr.short.toLowerCase()} (maraton).</li>
    <li><b>Forberedende økter</b> bygger grunnlaget: ${TYPES.s.short.toLowerCase()} for 5 og 10 km, ${TYPES.l.short.toLowerCase()} for halvmaraton og maraton.</li></ul>`})()}
  ];
}

/* =========================================================
   Min plan (23. nov 2026 – 3. jan 2027) og eksempel-styrkeøkter
   Fra prosjektdokumentene treningsplan-nov-2026-jan-2027.md og styrkeokter-forslag.md
   ========================================================= */
const R_=(id)=>({t:'run',id}), X_=(min)=>({t:'x',min}), ST_=(id)=>({t:'str',id}), REST_={t:'rest'};
const MINPLAN={
  title:'Min plan – frem til nyttår',
  period:'23. nov 2026 – 3. jan 2027',
  intro:'Laget 23. nov 2026 for Ragnhild, basert på Garmin-tall (avlest fra skjermbilder, ± 0,5 km / ± 5 min per uke), 80/20-dokumentene og dine ønsker. Seks uker med 2–3 rolige løp, én kryssøkt og to styrkeøkter i uka.',
  summary:[
    'Nå: ca. 1 t 45 min og 10 km løping i uka, 1,75 løp i uka, snittfart ca. 10 min/km. Siste uke (16.–22. nov) var ca. 3 t 15 min og 18 km, nesten dobbelt av snittet. Akutt belastning 268 (optimalt), men steg fra ca. 40 til ca. 310 på to uker.',
    'Belastningsfokus «balansert»: anaerob 46 (9 %), høy aerob 300 (56 %), lav aerob 189 (35 %). Hypotese: pulsen er for høy på de rolige løpene.',
    'Plan: 90–127 min løping i uka fordelt på 2–3 rolige løp, én kryssøkt og to styrkeøkter.',
    '10 km nivå 1 (12 uker) kan starte 11. januar hvis kriteriene under «Etter nyttår» er oppfylt. Halvmaraton i september 2027 er realistisk. Maraton nivå 1 har seks løpeøkter i uka uten kryssalternativ og passer dårlig med tiden din (kan bli et mål for 2028).'
  ],
  prinsipper:[
    ['Rolig skal føles nesten for rolig','Alt unntatt én kort kvalitetsøkt i uka går i sone 1–2 (puls 75–89 % av laktatterskelpuls, RPE 1–4, du kan snakke i hele setninger). Grunnfasen i boka ligger på 88–91 % lav intensitet. Kort gåpause er bedre enn å løpe over sonen.'],
    ['Foreløpig puls','Laktatterskelpulsen er ikke testet. Grovt anslag med makspuls 200: 170–184 (ikke fra boka). Arbeidsverdi 175: sone 1 ca. 131–140, sone 2 ca. 142–156. På rolige løp holder du deg under ca. 156. 30-minuttersteste i uke 7 (4.–10. jan) erstatter anslaget.'],
    ['Ikke øk intensitet og volum samtidig','Uke 1: ingen kvalitet. Uke 2–4: bare 5 min i sone 3 (rask avslutning). Første sone 4-økt kommer i uke 5.'],
    ['Tre-ukers sykluser: opp, opp, lettere','Syklus 1: 23. nov–13. des. Syklus 2: 14. des–3. jan. Lett uke ≈ 70–75 % av toppuka (boka: ca. 67 %). Toppukene (120 og 127 min) ligger godt under siste ukes 195 min.']
  ],
  mønster:[['Man','Langtur, rolig (første: 30. nov). Man 23. nov er hvile etter søndagens løp'],['Tir','Styrke hjemme, ca. 45 min'],['Ons','Løp, rolig'],['Tor','Kryss, 30 min'],['Fre (kveld)','Løp: rask avslutning eller fartslek'],['Lør (formiddag)','Styrke på treningssenter, ca. 70 min'],['Søn','Hvile']],
  mønsterNote:'Er beina stive etter lørdagens økt, ta det rolig på mandagens langtur i stedet for å hoppe over den. Juledagene kan flyttes fritt, men behold minst én dag mellom løpene.',
  weeks:[
   {n:1,start:'2026-11-23',label:'23.–29. nov',min:90,days:[[REST_],[ST_('str-b')],[R_('g6')],[X_(30)],[R_('g6')],[ST_('str-a')],[REST_]],note:'Landing etter 3 t 15 min-uka. Bare 2 løp, ingen kvalitet. Styrke: ett sett mindre per øvelse.'},
   {n:2,start:'2026-11-30',label:'30. nov–6. des',min:120,days:[[R_('g8')],[ST_('str-b')],[R_('g4')],[X_(30)],[R_('a2')],[ST_('str-a')],[REST_]],note:'Tre løp, langtur mandag. Første 5 min i sone 3. Styrke: ett sett mindre per øvelse.'},
   {n:3,start:'2026-12-07',label:'7.–13. des',min:90,days:[[R_('g4')],[ST_('str-b')],[R_('g3')],[X_(30)],[R_('a1')],[ST_('str-a')],[REST_]],note:'Lettuke, avslutter syklus 1. Styrke: ett sett mindre per øvelse.'},
   {n:4,start:'2026-12-14',label:'14.–20. des',min:110,days:[[R_('g7')],[ST_('str-b')],[R_('g3')],[X_(30)],[R_('a2')],[ST_('str-a')],[X_(20)]],note:'Syklus 2 starter. Hopp inn i styrkeøkt A (fra denne uka). Søndag: valgfri kryss på 20 min hvis det går lett.'},
   {n:5,start:'2026-12-21',label:'21.–27. des',min:127,days:[[R_('g9')],[ST_('str-b')],[R_('g5')],[X_('30–40')],[R_('s1')],[ST_('str-a')],[REST_]],note:'Toppuke. Første sone 4-drag (3 × 2 min). Jul: flytt øktene fritt.'},
   {n:6,start:'2026-12-28',label:'28. des–3. jan',min:90,days:[[R_('g4')],[ST_('str-b')],[R_('g3')],[X_(30)],[R_('a1')],[ST_('str-a')],[REST_]],note:'Lettuke. Hvil før LTHR-testen i uke 7. Styrke: ett sett mindre per øvelse.'}
  ],
  kryss:{
    tekst:'Én økt på 30 min i uka er nok (20 min er også ok; boka bruker 20 min som kryssøkt i nivå 1). All aerob aktivitet i sone 1–2 teller: rolig sykling, romaskin, ellipse, svømming, langrenn, rask gange i motbakke. Vanlig gange ligger som regel under sone 1. Legg økta der du allerede beveger deg (sykle til jobb/butikk). Lav aerob-søylen i Garmin (189) er den du vil øke.',
    tabell:[['Minimum','20 min torsdag','Travle uker, juleuka'],['Planen','30 min torsdag','Standarduke'],['Utvidet','30 min torsdag + 20 min rolig kryss søndag','Fra uke 4, hvis det går lett']]
  },
  brems:[
    'Smerte endrer løpestilen eller er verre dagen etter (ikke bedre etter to dager: fysio/lege).',
    'Hvilepuls 5+ slag over det vanlige i flere dager, dårlig søvn eller tunge bein.',
    'Pulsen klatrer over sone 2 på rolig fart: senk farten eller gå et par minutter.',
    'Garmin: akutt belastning over det grønne feltet, eller belastningsforholdet over grønt. Hold uka som den er og øk ikke neste. (Fanen «Belastningsforhold» er ikke sett; grovt anslag ut fra grafen: ca. 1,8.)',
    'Sykdom: ikke løp med feber eller symptomer under halsen. Start med en halv økt etter to symptomfrie dager.'
  ],
  bremsNote:'Bytt neste løp med kryss eller hvile hvis noe av dette gjelder. Mister du en økt, ta den ikke igjen. Ikke legg inn «bare ett løp til» på en god uke.',
  videre:[
    ['Port 1: 11. januar → 10 km nivå 1 (12 uker, løp ca. 4. april)','Boka forutsetter minst tre løp i uka (30 min+) og seks aerobe økter i uka. Planen gir tre løp fra uke 2. Med én kryssøkt og to styrkeøkter blir det fire aerobe økter, ikke seks: godt nok til å starte, men legg inn 20 min kryss søndag når det passer. Kriterier: 3 løp i uka tre uker på rad, minst 4 aerobe økter i uka, LTHR testet (uke 7: 4.–10. jan, test erstatter fredagens økt), ingen smerter, Garmin-belastning i grønt.'],
    ['Hvorfor 10 km først','10 km nivå 1 starter på 2 t 37 min og topper på 3 t 56 min; halvmaraton nivå 1 starter på 3 t 9 min, maraton på 3 t 21 min. Et 10 km-løp gir en målt tid å bli raskere fra.'],
    ['Port 2: april → halvmaraton eller maraton','Halvmaraton nivå 1: 15 uker, start 7. juni for løp 19. sep (eksempel). Ca. 3 t trening i uka, langtur ≥ 9,7 km. Maraton nivå 1: 18 uker, start 17. mai. Seks løpeøkter i uka uten kryssalternativ, topper på ca. 6 t 34 min (mot ca. 1 t 45 min løping nå). Anbefaling: sikt på halvmaraton i sept 2027 og la maraton bli et mål for 2028, med mindre tiden din endrer seg før april.'],
    ['Å bli raskere','Størst gevinst kommer av jevn frekvens og mer rolig volum, ikke flere harde økter. Strukturert sone 3/4-trening kommer med 10 km-planen (ca. 20 % moderat/høy intensitet i toppfasen).'],
    ['Tidslinje','23. nov–3. jan overgang · 4. jan–4. apr 10 km nivå 1 (LTHR-test uke 7) · 5. apr–6. jun oppbygging (langtur mot 14–16 km, maratonplan ville startet 17. mai) · 7. jun–19. sep halvmaraton nivå 1.']
  ],
  ikkeSjekket:['19. september er et eksempel. Løpsdatoer er ikke slått opp.','Garmin-tall er avlest fra skjermbilder.','Startvekter for styrke er ikke satt.']
};

const SEED_STYRKE=[
 {id:'str-a',name:'Økt A – treningssenter',cat:'Senter',dur:70,
  note:'Lørdag formiddag. Oppvarming, 8 min: 5 min rolig roing eller sykkel, 2 × 10 glute bridge, 2 × 10 sidesteg med strikk. Kraftøvelsene (de to første) tas først, mens du er uthvilt. Er tiden knapp: dropp legghev og Pallof press først. Beholder du bare én kraftøvelse, er det svingen.',
  ex:[
   {n:'Manual- eller kettlebell-sving',sets:3,reps:'8',load:'Manual eller kettlebell',note:'Hoftekraft med lite knebøy. Eksplosivt opp med hofta, rolig ned.'},
   {n:'Hopp opp på lav kasse (10–20 cm), gå ned',sets:3,reps:'3',load:'Kroppsvekt',note:'Fra uke 4 (14. des). Mykt, kneet nesten strakt ved landing. Stopp hvis kneet reagerer.'},
   {n:'Markløft fra klosser eller med trapbar',sets:3,reps:'5',load:'Stang eller trapbar',note:'Stangen omtrent i kneleddhøyde. Rett rygg, knærne bare litt bøyd.'},
   {n:'Benkpress',sets:3,reps:'6–8',load:'Stang',note:'Skuldrene ned og bakover. Bruk stativ eller spotter.'},
   {n:'Pull-up-progresjon',sets:4,reps:'3–5',load:'Strikk, maskin eller negativer',note:'Assistert med strikk eller maskin, eller negativer: start øverst (stå på en benk) og senk deg på 4 sek.'},
   {n:'Hip thrust',sets:3,reps:'8–10',load:'Stang eller maskin',note:'Seter. Hold 1 sek øverst. Skånsomt for kneet.'},
   {n:'Beinpress, kort bevegelse',sets:3,reps:'10',load:'Maskin',note:'Kneet ikke dypere enn ca. 90°. Alternativ: step-up på lav kasse (20–25 cm).'},
   {n:'Hengende benløft (invert-trappa)',sets:3,reps:'5',load:'Kroppsvekt',note:'Se invert-trappa under retningslinjene. Ingen svinging.'},
   {n:'Pallof press',sets:3,reps:'10 per side',load:'Kabel eller strikk',note:'Kjernestabilitet: ikke la overkroppen rotere.'},
   {n:'Legghev, rett og bøyd kne',sets:2,reps:'12 av hver',load:'Kroppsvekt eller manual',note:'Legger og akillessene tåler løpingen bedre og gir mer spenst.'}
  ]},
 {id:'str-b',name:'Økt B – hjemme',cat:'Hjemme',dur:45,
  note:'Tirsdag kveld. Oppvarming, 5 min: kattekyr, hoftesirkler, 2 × 15 muslingskall per side og 2 × 15 pull-apart med strikk. Alt er stille: senk manualene kontrollert og bruk matte. Er tiden knapp: dropp L-hold og sidebru først.',
  ex:[
   {n:'Skrå push-up, ned mot gulvet',sets:4,reps:'5–8',load:'Kroppsvekt',note:'Hendene på kjøkkenbenk, stol eller benk. Senk hendene ett trinn når 4 × 8 går rent. Målet er ekte push-ups på gulvet.'},
   {n:'Enarms manualroing',sets:3,reps:'10 per side',load:'Manual',note:'Støtt på stol eller benk.'},
   {n:'Aktiv hang og skulderbladtrekk (dørstang)',sets:3,reps:'20 sek',load:'Dørstang',note:'Skuldrene ned fra ørene. Grep og lats for pull-ups og invert. Uten stang: strikkeroing 3 × 12 (strikken festes i en dør).'},
   {n:'Enbens hoftehev med manual',sets:3,reps:'10 per side',load:'Manual, strikk rundt knærne',note:'Seter.'},
   {n:'Veggsitt',sets:3,reps:'30–45 sek',load:'Kroppsvekt',note:'Kneet ca. 60°. Quadriceps uten hopp.'},
   {n:'Hul kropp (hollow hold)',sets:3,reps:'15–30 sek',load:'Kroppsvekt',note:'Korsryggen i gulvet, bena strake og lave. Nøkkelposisjon for invert.'},
   {n:'Sidebru',sets:3,reps:'20–30 sek per side',load:'Kroppsvekt',note:'Kjernestabilitet.'},
   {n:'Liggende hofteløft, tær mot taket',sets:3,reps:'6–8',load:'Kroppsvekt',note:'Gulvversjon av inverten: bena rett opp, løft hofta av gulvet uten sving.'},
   {n:'L-hold, hendene på stoler eller klosser',sets:4,reps:'10–15 sek',load:'Kroppsvekt',note:'Kompresjon. Start med bøyde knær.'}
  ]}
];
const STYRKE_RETNING=[
 ['Kneet (PCL)','Generelle retningslinjer, ikke medisinsk råd. Vis programmet til en fysioterapeut før du går tungt. Hold kneet under ca. 90° bøy under last. Unngå dype knebøy og tunge hamstring-curls i maskin. Quadriceps-trening (beinpress med kort bevegelse, veggsitt) er trygt og gir kneet støtte. Ingen hopp hjemme. På senteret kommer hopp først fra uke 4 (14. des). Gå lettere hvis kneet gir etter, hovner, gjør mer vondt enn 3 av 10, eller er verre dagen etter.'],
 ['Slik gjør du det','Stopp hvert sett med 2–3 repetisjoner igjen (RPE 7). Uke 1–2 og lettukene (7.–13. des og 28. des–3. jan): ett sett mindre per øvelse. Nok vekt: når alle sett går med 2 repetisjoner igjen, øk med 2,5 kg på stang og 1–2 kg på manual. Hvil 2 min i de store løftene, 60–90 sek ellers. Startvekter er ikke satt – legg inn egne vekter under «belastning» når du har funnet dem.'],
 ['Invert-trappa (toes to bar)','Bena over hodet, og så hofta over skuldrene. Ett trinn om gangen; gå videre når du får 3 × 5 rene repetisjoner uten svinging: 1) Aktiv hang 20–30 sek. 2) Hengende kneløft, knærne mot brystet. 3) Hengende benløft med strake bein til 90°. 4) Tær mot stang. 5) Hofta opp over skuldrene. Hul kropp og liggende hofteløft hjemme gjør samme jobb på gulvet.'],
 ['Spenst','Utgangspunkt: ca. 20 cm hopp med samlede ben. Spenst kommer mest av maksstyrke og hoftekraft (markløft, sving, hip thrust, legghev) og så litt hopp. Uke 1–3: ingen hopp. Fra uke 4 (14. des): 3 × 3 hopp opp på en lav kasse, gå ned igjen. Øk kassen med 5 cm når alle sett går mykt og uten kneplager. Test hver fjerde uke: stå inntil en vegg, merk høyeste rekk, hopp og merk igjen. Hopp er det mest kneutfordrende i programmet – vis det til fysioterapeuten først.']
];

if(typeof module!=='undefined')module.exports={ZONES,TYPES,CATS,CAT_LABEL,SESSIONS,TYPE_ORDER,PLANS,DISTS,LEVELS,PHASE,DAYS,USES,
  S,G,fmtNum,fmtDur,flat,sessionFor,itemName,itemDur,itemCat,zonePct,planName,slug,pathOf,distRows,formatText,zonesOfType,RPE_SCALE,RPE_SHORT,teori,MINPLAN,SEED_STYRKE,STYRKE_RETNING};
