// Uses ERAS, erasOfYear, eraYearLabel, eto, maxYear from eras.js (loaded first).
(function(){
const LANG=document.documentElement.lang==="ja"?"ja":"en";
const T={
en:{until:d=>`until ${d}`,from:d=>`from ${d}`,eto:"Zodiac",age:(a,y)=>`Turns ${a} in ${y}`,before:`Before ${MIN_YEAR}, Japanese eras are not covered.`,over:(e,m)=>`${e} lasted ${m} years.`,lunar:"Before 1873 Japan used the lunisolar calendar, so dates may differ from historical records.",ageH:y=>`Age in ${y}`,first:"Year 1 is written 元年 (gannen) in Japanese."},
ja:{until:d=>`${d}まで`,from:d=>`${d}から`,eto:"干支",age:(a,y)=>`${y}年に満${a}歳`,before:`${MIN_YEAR}年より前の元号には対応していません。`,over:(e,m)=>`${e}は${m}年までです。`,lunar:"1872年（明治5年）までは旧暦のため、当時の記録の日付とは異なる場合があります。",ageH:y=>`${y}年の年齢`,first:""}
}[LANG];
const $=id=>document.getElementById(id);
const now=new Date(),Y=now.getFullYear();
const md=s=>LANG==="ja"?`${s[1]}月${s[2]}日`:new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"long",timeZone:"UTC"}).format(Date.UTC(2000,s[1]-1,s[2]));
const dayBefore=s=>{const d=new Date(Date.UTC(s[0],s[1]-1,s[2]-1));return[d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate()]};
const big=(main,sub)=>`<strong>${main}</strong>${sub?`<p>${sub}</p>`:""}`;

function fromYear(){
  const y=Math.trunc(+$("y").value);
  if(!y||y<MIN_YEAR){$("y-out").innerHTML=`<p>${T.before}</p>`;return}
  const list=erasOfYear(y);
  const label=list.map((x,i)=>{let l=eraYearLabel(x.era,x.n,LANG);if(list.length>1){if(i===0)l+=`<small>${T.until(md(dayBefore(list[1].era.s)))}</small>`;else l+=`<small>${T.from(md(x.era.s))}</small>`}if(LANG==="en")l+=` <span class="kanji">${eraYearLabel(x.era,x.n,"ja")}</span>`;return l}).join(" / ");
  const age=Y-y;
  $("y-out").innerHTML=big(label,`${T.eto}: ${eto(y,LANG)}${age>0?" · "+T.age(age,Y):""}`);
}
function fromEra(){
  const e=ERAS[+$("era").value],n=Math.trunc(+$("ey").value);const m=maxYear(e);
  if(!n||n<1){$("e-out").innerHTML="";return}
  if(n>m){$("e-out").innerHTML=`<p>${T.over(LANG==="ja"?e.ja:e.en,m)}</p>`;return}
  const y=e.s[0]+n-1;
  $("e-out").innerHTML=big(LANG==="ja"?`${y}年`:`${y}`,`${eraYearLabel(e,n,LANG)}${LANG==="en"?` (${eraYearLabel(e,n,"ja")})`:""} · ${T.eto}: ${eto(y,LANG)}${n===1&&T.first?" · "+T.first:""}`);
}
function fromDate(){
  const v=$("d").value;if(!v)return;const [y,m,d]=v.split("-").map(Number);
  const p2=n=>String(n).padStart(2,"0"),e=ERAS.find(x=>v>=`${x.s[0]}-${p2(x.s[1])}-${p2(x.s[2])}`);
  if(!e||y<MIN_YEAR){$("d-out").innerHTML=`<p>${T.before}</p>`;return}
  const n=y-e.s[0]+1,wdJa="日月火水木金土"[new Date(Date.UTC(y,m-1,d)).getUTCDay()];
  const ja=`${eraYearLabel(e,n,"ja")}${m}月${d}日（${wdJa}）`;
  const main=LANG==="ja"?ja:`${e.en} ${n}, ${new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"long",weekday:"long",timeZone:"UTC"}).format(Date.UTC(y,m-1,d))}`;
  $("d-out").innerHTML=big(main,[LANG==="en"?ja:"",y<1873?T.lunar:""].filter(Boolean).join(" · "));
}
$("d").value=`${Y}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
$("y").addEventListener("input",fromYear);$("era").addEventListener("change",fromEra);$("ey").addEventListener("input",fromEra);$("d").addEventListener("input",fromDate);
// Refresh the chart's age column if the page was built in an earlier year.
const h=$("age-h");if(h&&!h.textContent.includes(String(Y))){h.textContent=T.ageH(Y);document.querySelectorAll("td[data-y]").forEach(td=>{const a=Y-+td.dataset.y;td.textContent=a>=0?a:"–"});document.querySelectorAll("tr.cur").forEach(tr=>tr.classList.remove("cur"));document.querySelector(`td[data-y="${Y}"]`)?.parentElement.classList.add("cur")}
fromYear();fromEra();fromDate();
})();
