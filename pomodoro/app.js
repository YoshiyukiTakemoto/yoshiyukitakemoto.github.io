const LANG=document.documentElement.lang==="ja"?"ja":"en";
const $=id=>document.getElementById(id);
const T={
en:{work:"Focus",short:"Short break",long:"Long break",start:"Start",pause:"Pause",resume:"Resume",reset:"Reset",skip:"Skip",settings:"Settings (minutes)",dwork:"Focus",dshort:"Short break",dlong:"Long break",every:"Long break every",
 auto:"Start the next session automatically",sound:"Play a sound when time is up",notify:"Show a notification when time is up",today:n=>`Today: ${n} focus ${n===1?"session":"sessions"} completed`,done:{work:"Focus session done. Time for a break.",short:"Break over. Back to focus.",long:"Long break over. Back to focus."},denied:"Notifications are blocked for this site in your browser settings."},
ja:{work:"作業",short:"短い休憩",long:"長い休憩",start:"スタート",pause:"一時停止",resume:"再開",reset:"リセット",skip:"スキップ",settings:"設定（分）",dwork:"作業",dshort:"短い休憩",dlong:"長い休憩",every:"長い休憩の間隔（回）",
 auto:"次のセッションを自動で開始",sound:"終了時に音を鳴らす",notify:"終了時に通知を表示",today:n=>`今日の完了：${n}ポモドーロ`,done:{work:"作業終了。休憩しましょう。",short:"休憩終了。作業に戻りましょう。",long:"長い休憩終了。作業に戻りましょう。"},denied:"このサイトの通知がブラウザの設定でブロックされています。"}
}[LANG];
const PK=window.PK;
const S=Object.assign({d:{work:25,short:5,long:15},every:4,auto:true,sound:true,notify:false},PK.get("pomo:cfg",{}));
// Running state survives reloads: mode, endAt (ms) while running, left (ms) while paused, done-in-cycle count.
let R=Object.assign({mode:"work",endAt:0,left:S.d.work*60000,cycle:0},PK.get("pomo:run",{}));
const save=()=>{PK.set("pomo:cfg",S);PK.set("pomo:run",R)};
const day=d=>d.toISOString().slice(0,10);
const hist=()=>PK.get("pomo:hist",{});
const total=()=>S.d[R.mode]*60000;
const fmt=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`};
let tick=null,actx=null;

function beep(){if(!S.sound)return;try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();[0,.35,.7].forEach(t=>{const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=880;o.connect(g);g.connect(actx.destination);g.gain.setValueAtTime(.0001,actx.currentTime+t);g.gain.exponentialRampToValueAtTime(.3,actx.currentTime+t+.02);g.gain.exponentialRampToValueAtTime(.0001,actx.currentTime+t+.25);o.start(actx.currentTime+t);o.stop(actx.currentTime+t+.3)})}catch(e){}}
function notify(msg){if(S.notify&&"Notification" in window&&Notification.permission==="granted"){try{new Notification("Plainkit",{body:msg,icon:"/icon-192.png"})}catch(e){}}}
function finish(){
  const was=R.mode;beep();notify(T.done[was]);
  if(was==="work"){const h=hist(),k=day(new Date());h[k]=(h[k]||0)+1;PK.set("pomo:hist",h);R.cycle++}
  R.mode=was==="work"?(R.cycle%S.every===0?"long":"short"):"work";
  R.left=total();R.endAt=S.auto?Date.now()+R.left:0;save();draw();
}
function loop(){if(R.endAt&&Date.now()>=R.endAt)finish();draw()}
function draw(){
  const left=R.endAt?R.endAt-Date.now():R.left,run=!!R.endAt;
  $("time").textContent=fmt(left);
  $("prog").style.strokeDashoffset=339.29*(1-Math.max(0,left)/total());
  $("timer").classList.toggle("rest",R.mode!=="work");
  document.querySelectorAll("#modes button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.m===R.mode));
  $("start").textContent=run?T.pause:(R.left<total()?T.resume:T.start);
  document.title=run?`${fmt(left)} · ${T[R.mode]}`:baseTitle;
  const h=hist();$("count").textContent=T.today(h[day(new Date())]||0);
  if(run&&!tick)tick=setInterval(loop,250);if(!run&&tick){clearInterval(tick);tick=null}
}
function week(){
  const h=hist(),days=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d}),max=Math.max(4,...days.map(d=>h[day(d)]||0));
  const wd=new Intl.DateTimeFormat(LANG==="ja"?"ja-JP":"en-GB",{weekday:"short"});
  $("week").innerHTML=days.map(d=>{const n=h[day(d)]||0;return`<div><span class="n">${n}</span><b style="height:${4+n/max*40}px;opacity:${n?1:.25}"></b>${wd.format(d)}</div>`}).join("");
}
const baseTitle=document.title;
for(const k of["work","short","long"])$("m-"+k).textContent=T[k];
for(const k of["reset","skip"])$(k).textContent=T[k];
for(const k of["settings","dwork","dshort","dlong","every","auto","sound","notify"])$("l-"+k).textContent=T[k];
$("d-work").value=S.d.work;$("d-short").value=S.d.short;$("d-long").value=S.d.long;$("every").value=S.every;$("auto").checked=S.auto;$("sound").checked=S.sound;$("notify").checked=S.notify;
$("start").addEventListener("click",()=>{
  try{actx=actx||new (window.AudioContext||window.webkitAudioContext)()}catch(e){} // unlock audio on a user gesture
  if(R.endAt){R.left=R.endAt-Date.now();R.endAt=0;document.title=baseTitle}else R.endAt=Date.now()+R.left;save();draw()});
$("reset").addEventListener("click",()=>{R.endAt=0;R.left=total();document.title=baseTitle;save();draw()});
$("skip").addEventListener("click",()=>{R.endAt=0;R.mode=R.mode==="work"?"short":"work";R.left=total();document.title=baseTitle;save();draw()});
$("modes").addEventListener("click",e=>{const b=e.target.closest("[data-m]");if(!b)return;R.mode=b.dataset.m;R.endAt=0;R.left=total();document.title=baseTitle;save();draw()});
document.querySelector(".settings").addEventListener("change",e=>{
  S.d={work:+$("d-work").value||25,short:+$("d-short").value||5,long:+$("d-long").value||15};S.every=Math.max(2,+$("every").value||4);S.auto=$("auto").checked;S.sound=$("sound").checked;S.notify=$("notify").checked;
  if(e.target.id==="notify"&&S.notify&&"Notification" in window){Notification.requestPermission().then(p=>{if(p!=="granted"){S.notify=false;$("notify").checked=false;$("count").textContent=T.denied;save()}})}
  if(!R.endAt)R.left=total();save();draw();
});
document.addEventListener("keydown",e=>{if(e.code==="Space"&&!/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)){e.preventDefault();$("start").click()}});
document.addEventListener("visibilitychange",()=>{if(!document.hidden){loop();week()}});
if(R.endAt&&Date.now()>=R.endAt)finish();
draw();week();
