const CITIES=[
["Tokyo","東京","Asia/Tokyo"],["Osaka","大阪","Asia/Tokyo"],["Seoul","ソウル","Asia/Seoul"],["Shanghai","上海","Asia/Shanghai"],["Beijing","北京","Asia/Shanghai"],["Hong Kong","香港","Asia/Hong_Kong"],["Taipei","台北","Asia/Taipei"],["Singapore","シンガポール","Asia/Singapore"],["Bangkok","バンコク","Asia/Bangkok"],["Jakarta","ジャカルタ","Asia/Jakarta"],["Manila","マニラ","Asia/Manila"],["Ho Chi Minh City","ホーチミン","Asia/Ho_Chi_Minh"],["Hanoi","ハノイ","Asia/Bangkok"],["Kuala Lumpur","クアラルンプール","Asia/Kuala_Lumpur"],["Mumbai","ムンバイ","Asia/Kolkata"],["Delhi","デリー","Asia/Kolkata"],["Bengaluru","ベンガルール","Asia/Kolkata"],["Kathmandu","カトマンズ","Asia/Kathmandu"],["Dhaka","ダッカ","Asia/Dhaka"],["Karachi","カラチ","Asia/Karachi"],["Dubai","ドバイ","Asia/Dubai"],["Riyadh","リヤド","Asia/Riyadh"],["Tehran","テヘラン","Asia/Tehran"],["Tel Aviv","テルアビブ","Asia/Jerusalem"],["Istanbul","イスタンブール","Europe/Istanbul"],["Moscow","モスクワ","Europe/Moscow"],["Cairo","カイロ","Africa/Cairo"],["Lagos","ラゴス","Africa/Lagos"],["Nairobi","ナイロビ","Africa/Nairobi"],["Johannesburg","ヨハネスブルグ","Africa/Johannesburg"],["London","ロンドン","Europe/London"],["Dublin","ダブリン","Europe/Dublin"],["Lisbon","リスボン","Europe/Lisbon"],["Paris","パリ","Europe/Paris"],["Berlin","ベルリン","Europe/Berlin"],["Madrid","マドリード","Europe/Madrid"],["Rome","ローマ","Europe/Rome"],["Amsterdam","アムステルダム","Europe/Amsterdam"],["Zurich","チューリッヒ","Europe/Zurich"],["Stockholm","ストックホルム","Europe/Stockholm"],["Warsaw","ワルシャワ","Europe/Warsaw"],["Athens","アテネ","Europe/Athens"],["Kyiv","キーウ","Europe/Kyiv"],["New York","ニューヨーク","America/New_York"],["Toronto","トロント","America/Toronto"],["Washington, D.C.","ワシントンD.C.","America/New_York"],["Chicago","シカゴ","America/Chicago"],["Denver","デンバー","America/Denver"],["Los Angeles","ロサンゼルス","America/Los_Angeles"],["San Francisco","サンフランシスコ","America/Los_Angeles"],["Seattle","シアトル","America/Los_Angeles"],["Vancouver","バンクーバー","America/Vancouver"],["Mexico City","メキシコシティ","America/Mexico_City"],["Honolulu","ホノルル","Pacific/Honolulu"],["Anchorage","アンカレッジ","America/Anchorage"],["São Paulo","サンパウロ","America/Sao_Paulo"],["Buenos Aires","ブエノスアイレス","America/Argentina/Buenos_Aires"],["Bogotá","ボゴタ","America/Bogota"],["Lima","リマ","America/Lima"],["Santiago","サンティアゴ","America/Santiago"],["Sydney","シドニー","Australia/Sydney"],["Melbourne","メルボルン","Australia/Melbourne"],["Brisbane","ブリスベン","Australia/Brisbane"],["Perth","パース","Australia/Perth"],["Adelaide","アデレード","Australia/Adelaide"],["Auckland","オークランド","Pacific/Auckland"],["UTC","UTC（協定世界時）","Etc/UTC"]
].filter(c=>validTz(c[2])).map(([en,ja,tz])=>({en,ja,tz}));

function validTz(tz){try{new Intl.DateTimeFormat("en",{timeZone:tz});return true}catch(e){return false}}
const ZONES=(Intl.supportedValuesOf?Intl.supportedValuesOf("timeZone"):[]).filter(z=>z.includes("/")&&!CITIES.some(c=>c.tz===z)).map(z=>{const n=z.split("/").pop().replace(/_/g," ");return {en:n,ja:n,tz:z,zone:true}});

const T={
en:{tag:"Find the hour when every city is at work. Free, no sign-up, runs entirely in your browser.",add:"Add a city or time zone",ph:"Try “Berlin”, “Mumbai” or “America/Denver”",date:"Date",work:"Working hours",dur:"Meeting length",min:"min",h:"h",base:"Base",makeBase:"Use as base",remove:"Remove",overlap:"Everyone at work",now:"now",legWork:"Working hours",legEdge:"Early / late",legNight:"Night",allFit:n=>`${n} start time${n>1?"s":""} fit everyone’s working hours`,noFit:(k,m)=>`No time fits everyone. Best: ${k} of ${m} at work`,one:"Add another city to compare",picked:"Chosen time",copy:"Copy text",copied:"Copied",copyFail:"Text selected. Press Ctrl+C / ⌘C to copy.",gcal:"Add to Google Calendar",meeting:"Meeting",hint:"Click any hour in the grid to choose a different start time.",chip:{work:"Working",edge:"Early / late",night:"Night"},foot:"Time zone and daylight-saving rules come from your browser’s built-in IANA database, so the planner stays correct without a server. Your city list is saved only on this device.",nores:"No matches"},
ja:{tag:"すべての都市が勤務時間になる時間帯を探します。無料・登録不要・ブラウザだけで動作します。",add:"都市・タイムゾーンを追加",ph:"「ベルリン」「Mumbai」「America/Denver」など",date:"日付",work:"勤務時間",dur:"会議の長さ",min:"分",h:"時間",base:"基準",makeBase:"基準にする",remove:"削除",overlap:"全員が勤務中",now:"現在",legWork:"勤務時間",legEdge:"早朝・夜",legNight:"深夜",allFit:n=>`全員の勤務時間に収まる開始時刻: ${n}件`,noFit:(k,m)=>`全員が収まる時間はありません。最大 ${m}都市中 ${k}都市`,one:"比較する都市をもう1つ追加してください",picked:"選択中の時間",copy:"テキストをコピー",copied:"コピーしました",copyFail:"テキストを選択しました。Ctrl+C / ⌘C でコピーしてください。",gcal:"Google カレンダーに追加",meeting:"会議",hint:"グリッドの任意の時間をクリックすると開始時刻を変更できます。",chip:{work:"勤務時間",edge:"早朝・夜",night:"深夜"},foot:"タイムゾーンとサマータイムの規則はブラウザ内蔵の IANA データベースを使うため、サーバーなしで正確に計算します。都市リストはこの端末にのみ保存されます。",nores:"該当なし"}
};

const store={get(k){try{return JSON.parse(localStorage.getItem("overlap:"+k))}catch(e){return null}},set(k,v){try{localStorage.setItem("overlap:"+k,JSON.stringify(v))}catch(e){}}};
const today=new Date();
const S={
  lang:document.documentElement.lang==="ja"?"ja":"en",
  cities:(store.get("cities")||[]).filter(c=>c&&validTz(c.tz)),
  ws:store.get("ws")??9, we:store.get("we")??18, dur:store.get("dur")??60,
  date:`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`,
  sel:null
};
if(!S.cities.length)S.cities=["Tokyo","London","New York"].map(n=>CITIES.find(c=>c.en===n)).filter(Boolean);
const save=()=>{store.set("cities",S.cities);store.set("ws",S.ws);store.set("we",S.we);store.set("dur",S.dur);};

/* ---- time math (all via Intl, no tz data shipped) ---- */
const fc=new Map();
function F(tz,lang,opts){const k=tz+lang+JSON.stringify(opts);if(!fc.has(k))fc.set(k,new Intl.DateTimeFormat(lang,{timeZone:tz,...opts}));return fc.get(k)}
function parts(tz,ms){const o={};for(const p of F(tz,"en-US",{hourCycle:"h23",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).formatToParts(ms))o[p.type]=p.value;return{y:+o.year,mo:+o.month,d:+o.day,h:+o.hour%24,mi:+o.minute}}
function offsetMin(tz,ms){const p=parts(tz,ms);return Math.round((Date.UTC(p.y,p.mo-1,p.d,p.h,p.mi)-Math.floor(ms/60000)*60000)/60000)}
function midnight(y,m,d,tz){const g=Date.UTC(y,m-1,d);let t=g-offsetMin(tz,g)*60000;return g-offsetMin(tz,t)*60000}
function offLabel(min){const s=min<0?"−":"+",a=Math.abs(min);return `UTC${s}${Math.floor(a/60)}${a%60?":"+String(a%60).padStart(2,"0"):""}`}
function abbr(tz,ms){const p=F(tz,"en-US",{timeZoneName:"short"}).formatToParts(ms).find(p=>p.type==="timeZoneName");return p&&!/^GMT|^UTC/.test(p.value)?p.value:""}
const hm=p=>`${String(p.h).padStart(2,"0")}:${String(p.mi).padStart(2,"0")}`;
const L=()=>S.lang==="ja"?"ja-JP":"en-GB";
function kind(p,dur){const m=p.h*60+p.mi;if(m>=S.ws*60&&m+dur<=S.we*60)return"work";if(m>=6*60&&m<22*60)return"edge";return"night"}
const nm=c=>S.lang==="ja"?c.ja:c.en;
const esc=s=>String(s).replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));

function columns(){
  const [y,m,d]=S.date.split("-").map(Number), base=S.cities[0].tz;
  const t0=midnight(y,m,d,base), nd=new Date(Date.UTC(y,m-1,d+1)), t1=midnight(nd.getUTCFullYear(),nd.getUTCMonth()+1,nd.getUTCDate(),base);
  const n=Math.max(23,Math.min(25,Math.round((t1-t0)/3600000)));
  return Array.from({length:n},(_,i)=>t0+i*3600000);
}

/* ---- render ---- */
function renderStatic(){
  const t=T[S.lang];
  document.getElementById("l-add").textContent=t.add; document.getElementById("city-q").placeholder=t.ph;
  document.getElementById("l-date").textContent=t.date; document.getElementById("l-work").textContent=t.work; document.getElementById("l-dur").textContent=t.dur;
  const opt=(v,l,s)=>`<option value="${v}"${v===s?" selected":""}>${l}</option>`;
  ws.innerHTML=Array.from({length:9},(_,i)=>i+5).map(h=>opt(h,`${h}:00`,S.ws)).join("");
  we.innerHTML=Array.from({length:10},(_,i)=>i+14).map(h=>opt(h,`${h}:00`,S.we)).join("");
  dur.innerHTML=[30,45,60,90,120].map(v=>opt(v,v<60||v%60?`${v} ${t.min}`:`${v/60} ${t.h}`,S.dur)).join("");
  date.value=S.date;
  legend.innerHTML=`<span><i style="background:var(--day)"></i>${t.legWork}</span><span><i style="background:var(--dusk)"></i>${t.legEdge}</span><span><i style="background:var(--night)"></i>${t.legNight}</span>`;
}

function render(){
  const t=T[S.lang], cols=columns(), now=Date.now(), M=S.cities.length;
  const info=cols.map(ms=>{const ps=S.cities.map(c=>parts(c.tz,ms));const k=ps.map(p=>kind(p,S.dur));return{ms,ps,k,fit:k.filter(x=>x==="work").length}});
  const full=info.filter(x=>x.fit===M).length, best=Math.max(...info.map(x=>x.fit));
  if(S.sel==null||S.sel>=cols.length){
    let bi=0,bs=-1;info.forEach((x,i)=>{const s=x.fit*10+(x.k[0]==="work"?1:0);if(s>bs){bs=s;bi=i}});S.sel=bi;
  }
  verdict.className="pill"+(full&&M>1?" ok":"");
  verdict.textContent=M<2?t.one:full?t.allFit(full):t.noFit(best,M);

  grid.style.gridTemplateColumns=`var(--label) repeat(${cols.length},minmax(46px,1fr))`;
  let h=`<div class="lab top"><span class="eyebrow">${t.overlap}</span></div>`;
  info.forEach((x,i)=>{const isNow=now>=x.ms&&now<x.ms+3600000;
    h+=`<div class="meter${x.fit===M&&M>1?" full":""}${i===S.sel?" sel":""}" data-col="${i}" title="${x.fit}/${M}">${isNow?`<span class="now">${t.now}</span>`:""}<b style="height:${Math.max(3,Math.round(x.fit/M*26))}px"></b><span>${x.fit}/${M}</span></div>`});
  S.cities.forEach((c,ci)=>{
    const off=offsetMin(c.tz,cols[0]), ab=abbr(c.tz,cols[0]), np=parts(c.tz,now);
    h+=`<div class="lab"><div class="who"><div class="name" title="${esc(c.tz)}">${esc(nm(c))}${ci===0?`<span class="badge">${t.base}</span>`:""}</div><div class="meta">${offLabel(off)}${ab?" · "+ab:""}</div></div><span class="clock">${hm(np)}</span><div class="acts">${ci?`<button class="icon" type="button" data-base="${ci}" title="${t.makeBase}" aria-label="${t.makeBase}: ${esc(nm(c))}">⇡</button>`:""}${M>1?`<button class="icon" type="button" data-rm="${ci}" title="${t.remove}" aria-label="${t.remove}: ${esc(nm(c))}">✕</button>`:""}</div></div>`;
    info.forEach((x,i)=>{const p=x.ps[ci],prev=i?info[i-1].ps[ci]:null,nd=!prev||prev.d!==p.d;
      const lbl=p.mi?`${p.h}:${String(p.mi).padStart(2,"0")}`:p.h;
      const day=nd?`<span class="d">${F(c.tz,L(),{weekday:"short",day:"numeric"}).format(x.ms)}</span>`:"";
      h+=`<div class="cell ${x.k[ci]}${nd&&i?" newday":""}${i===S.sel?" sel":""}" data-col="${i}" tabindex="${ci===0?0:-1}" role="button" aria-label="${esc(nm(c))} ${hm(p)}">${day}<span>${lbl}</span></div>`});
  });
  grid.innerHTML=h;
  renderSlot(info[S.sel]);
}

function renderSlot(x){
  const t=T[S.lang], start=x.ms, end=start+S.dur*60000;
  const dfmt=c=>F(c.tz,L(),{weekday:"short",month:"short",day:"numeric"});
  const title=F(S.cities[0].tz,L(),{weekday:"long",year:"numeric",month:"long",day:"numeric"}).format(start);
  const lines=S.cities.map((c,i)=>{const e=parts(c.tz,end);return{c,txt:`${hm(x.ps[i])}–${hm(e)}`,dt:dfmt(c).format(start),k:x.k[i]}});
  const durTxt=S.dur%60?`${S.dur} ${t.min}`:`${S.dur/60} ${t.h}`;
  const text=`${t.meeting} (${durTxt})\n`+lines.map(l=>`${nm(l.c)}: ${l.txt} · ${l.dt}`).join("\n");
  const z=ms=>new Date(ms).toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
  const gcal=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(t.meeting)}&dates=${z(start)}/${z(end)}&details=${encodeURIComponent(text)}`;
  slot.innerHTML=`<div><span class="eyebrow">${t.picked}</span><h2>${esc(title)}</h2>
    <ul class="rows">${lines.map(l=>`<li><span>${esc(nm(l.c))}</span><span><span class="t">${l.txt}</span> <span class="dt">${esc(l.dt)}</span></span><span class="chip ${l.k}">${t.chip[l.k]}</span></li>`).join("")}</ul>
    <p class="note">${t.hint}</p></div>
    <div class="share"><label class="eyebrow" for="share-text">${t.copy}</label><textarea id="share-text" readonly>${esc(text)}</textarea>
    <div class="btns"><button class="btn primary" type="button" id="copy">${t.copy}</button><a class="btn" href="${gcal}" target="_blank" rel="noopener">${t.gcal}</a></div><span class="note" id="copy-msg" aria-live="polite"></span></div>`;
}

/* ---- search ---- */
const q=document.getElementById("city-q"); let hits=[],hi=0;
function search(){
  const s=q.value.trim().toLowerCase();
  if(!s){results.hidden=true;q.setAttribute("aria-expanded","false");return}
  const all=CITIES.concat(ZONES), m=x=>[x.en,x.ja,x.tz].some(v=>v.toLowerCase().includes(s));
  const starts=x=>[x.en,x.ja].some(v=>v.toLowerCase().startsWith(s));
  hits=all.filter(m).sort((a,b)=>starts(b)-starts(a)||!!a.zone-!!b.zone).slice(0,8); hi=0;
  results.innerHTML=hits.length?hits.map((c,i)=>`<li role="option" data-i="${i}" aria-selected="${i===hi}"><span>${esc(nm(c))}</span><small>${offLabel(offsetMin(c.tz,Date.now()))} · ${esc(c.tz)}</small></li>`).join(""):`<li aria-disabled="true">${T[S.lang].nores}</li>`;
  results.hidden=false;q.setAttribute("aria-expanded","true");
}
function add(c){if(!c)return;if(!S.cities.some(x=>x.en===c.en&&x.tz===c.tz))S.cities.push({en:c.en,ja:c.ja,tz:c.tz});q.value="";results.hidden=true;q.setAttribute("aria-expanded","false");save();render()}
q.addEventListener("input",search);
q.addEventListener("keydown",e=>{
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();if(!hits.length)return;hi=(hi+(e.key==="ArrowDown"?1:hits.length-1))%hits.length;[...results.children].forEach((li,i)=>li.setAttribute("aria-selected",i===hi))}
  else if(e.key==="Enter"){e.preventDefault();add(hits[hi])}
  else if(e.key==="Escape"){q.value="";search()}
});
results.addEventListener("mousedown",e=>{const li=e.target.closest("li[data-i]");if(li){e.preventDefault();add(hits[+li.dataset.i])}});
q.addEventListener("blur",()=>setTimeout(()=>{results.hidden=true;q.setAttribute("aria-expanded","false")},120));

/* ---- events ---- */
date.addEventListener("change",()=>{if(date.value){S.date=date.value;S.sel=null;render()}});
ws.addEventListener("change",()=>{S.ws=+ws.value;S.sel=null;save();render()});
we.addEventListener("change",()=>{S.we=+we.value;S.sel=null;save();render()});
dur.addEventListener("change",()=>{S.dur=+dur.value;S.sel=null;save();render()});
grid.addEventListener("click",e=>{
  const rm=e.target.closest("[data-rm]"),bs=e.target.closest("[data-base]"),col=e.target.closest("[data-col]");
  if(rm){S.cities.splice(+rm.dataset.rm,1);S.sel=null}
  else if(bs){const [c]=S.cities.splice(+bs.dataset.base,1);S.cities.unshift(c);S.sel=null}
  else if(col){S.sel=+col.dataset.col}
  else return;
  save();render();
});
grid.addEventListener("keydown",e=>{const c=e.target.closest(".cell");if(!c)return;
  if(e.key==="Enter"||e.key===" "){e.preventDefault();S.sel=+c.dataset.col;render();grid.querySelector(`.cell[data-col="${S.sel}"]`)?.focus()}
  if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();const n=Math.max(0,Math.min(columns().length-1,+c.dataset.col+(e.key==="ArrowRight"?1:-1)));c.parentElement.querySelectorAll(`.cell[data-col="${n}"]`)[0]?.focus()}
});
slot.addEventListener("click",e=>{
  if(e.target.id!=="copy")return;
  const ta=document.getElementById("share-text"),msg=document.getElementById("copy-msg"),t=T[S.lang];
  const fallback=()=>{ta.focus();ta.select();msg.textContent=t.copyFail};
  try{navigator.clipboard.writeText(ta.value).then(()=>{msg.textContent=t.copied},fallback)}catch(err){fallback()}
});
setInterval(()=>{if(!document.activeElement||!grid.contains(document.activeElement))render()},30000);

renderStatic();render();
