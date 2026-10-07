const LANG=document.documentElement.lang==="ja"?"ja":"en";
const $=id=>document.getElementById(id);
const PK=window.PK;
const T={
en:{lv:{easy:"Easy",medium:"Medium",hard:"Hard"},today:d=>`Daily puzzle · ${d}`,practice:"Practice puzzle",time:"Time",miss:"Mistakes",streak:"Streak",notes:"Notes",erase:"Erase",undo:"Undo",showerr:"Show mistakes",random:"New practice puzzle",backToday:"Back to today’s puzzle",
 done:(t,m)=>`Solved in ${t} with ${m} ${m===1?"mistake":"mistakes"}!`,share:(d,l,t,m,s)=>`Plainkit Sudoku ${d} ${l} ⏱${t} ✅${m?` ${m} mistakes`:" no mistakes"}${s>1?` 🔥${s}-day streak`:""}`},
ja:{lv:{easy:"初級",medium:"中級",hard:"上級"},today:d=>`今日の問題・${d}`,practice:"練習問題",time:"タイム",miss:"ミス",streak:"連続日数",notes:"メモ",erase:"消す",undo:"戻す",showerr:"間違いを赤で表示",random:"新しい練習問題",backToday:"今日の問題に戻る",
 done:(t,m)=>`クリア！ タイム ${t}・ミス${m}回`,share:(d,l,t,m,s)=>`Plainkit 数独 ${d} ${l} ⏱${t} ✅ミス${m}回${s>1?` 🔥${s}日連続`:""}`}
}[LANG];
const CLUES={easy:40,medium:32,hard:26};
const pad2=n=>String(n).padStart(2,"0");
const dateKey=(d=new Date())=>`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const fmt=s=>`${Math.floor(s/60)}:${pad2(s%60)}`;
let level=PK.get("sdk:level","easy"),practice=null,P,G,sel=-1,noteMode=false,timer=null;

function key(){return practice?`p:${practice}:${level}`:`d:${dateKey()}:${level}`}
function load(){
  const seed=practice?`practice-${practice}-${level}`:`${dateKey()}-${level}`;
  P=Sudoku.make(seed,CLUES[level]);
  G=PK.get("sdk:"+key(),null)||{v:P.puzzle.slice(),n:Array(81).fill(0),t:0,m:0,done:false,h:[]};
  sel=-1;prune();render();tick();
}
function save(){PK.set("sdk:"+key(),G)}
// Keep storage small: drop daily games older than 14 days and practice games other than the current one.
function prune(){try{const cut=new Date();cut.setDate(cut.getDate()-14);const c=dateKey(cut);
  for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);
    if(k.startsWith("pk:sdk:d:")&&k.slice(9,19)<c)localStorage.removeItem(k);
    if(k.startsWith("pk:sdk:p:")&&(!practice||!k.startsWith(`pk:sdk:p:${practice}:`)))localStorage.removeItem(k)}}catch(e){}}
function streak(){const d=PK.get("sdk:days",{});let n=0,x=new Date();if(!d[dateKey(x)])x.setDate(x.getDate()-1);while(d[dateKey(x)]){n++;x.setDate(x.getDate()-1)}return n}
function tick(){clearInterval(timer);if(!G.done)timer=setInterval(()=>{if(document.hidden)return;G.t++;$("time").textContent=fmt(G.t);if(G.t%5===0)save()},1000)}
function render(){
  const v=G.v,sv=sel>=0?v[sel]:0,showErr=$("showerr").checked;
  const r0=sel>=0?Math.floor(sel/9):-1,c0=sel%9,b0=sel>=0?Math.floor(r0/3)*3+Math.floor(c0/3):-1;
  $("board").innerHTML=v.map((x,i)=>{const r=Math.floor(i/9),c=i%9,b=Math.floor(r/3)*3+Math.floor(c/3);
    const cls=["cell",P.puzzle[i]?"given":"",i===sel?"sel":sv&&x===sv?"same":(sel>=0&&(r===r0||c===c0||b===b0))?"hl":"",showErr&&x&&!P.puzzle[i]&&x!==P.solution[i]?"bad":""].join(" ");
    const inner=x?x:G.n[i]?`<span class="nt">${[1,2,3,4,5,6,7,8,9].map(d=>`<span>${G.n[i]&(1<<d)?d:""}</span>`).join("")}</span>`:"";
    return`<button type="button" class="${cls}" data-i="${i}" role="gridcell" aria-label="R${r+1}C${c+1} ${x||""}" tabindex="-1">${inner}</button>`}).join("");
  const cnt=d=>v.filter(x=>x===d).length;
  $("pad").innerHTML=[1,2,3,4,5,6,7,8,9].map(d=>`<button type="button" data-d="${d}"${cnt(d)>=9?" disabled":""}>${d}<small>${9-cnt(d)}</small></button>`).join("");
  $("time").textContent=fmt(G.t);$("miss").textContent=G.m;$("streak").textContent=streak();
  document.querySelectorAll("#levels button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.l===level));
  $("today").textContent=practice?T.practice:T.today(dateKey());$("random").textContent=practice?T.backToday:T.random;
  $("notes").setAttribute("aria-pressed",noteMode);
  $("done").hidden=!G.done;if(G.done){$("done-msg").textContent=T.done(fmt(G.t),G.m);if(!practice)PK.share($("share"),T.share(dateKey(),T.lv[level],fmt(G.t),G.m,streak()));else $("share").innerHTML=""}
}
function input(d){
  if(sel<0||P.puzzle[sel]||G.done)return;
  G.h.push([sel,G.v[sel],G.n[sel]]);if(G.h.length>200)G.h.shift();
  if(noteMode&&d){if(G.v[sel])return;G.n[sel]^=1<<d}
  else{G.v[sel]=G.v[sel]===d?0:d;G.n[sel]=0;
    if(d&&G.v[sel]===d){if(d!==P.solution[sel])G.m++;else{ // clear this digit from notes in the same row, column and box
      const r=Math.floor(sel/9),c=sel%9;for(let k=0;k<81;k++){const rr=Math.floor(k/9),cc=k%9;if(rr===r||cc===c||(Math.floor(rr/3)===Math.floor(r/3)&&Math.floor(cc/3)===Math.floor(c/3)))G.n[k]&=~(1<<d)}}}}
  if(G.v.every((x,i)=>x===P.solution[i])){G.done=true;clearInterval(timer);if(!practice){const d=PK.get("sdk:days",{});d[dateKey()]=1;PK.set("sdk:days",d)}}
  save();render();
}
$("levels").innerHTML=Object.entries(T.lv).map(([k,v])=>`<button type="button" data-l="${k}">${v}</button>`).join("");
$("l-time").textContent=T.time;$("l-miss").textContent=T.miss;$("l-streak").textContent=T.streak;$("notes").textContent=T.notes;$("erase").textContent=T.erase;$("undo").textContent=T.undo;$("l-showerr").textContent=T.showerr;
$("levels").addEventListener("click",e=>{const b=e.target.closest("[data-l]");if(!b)return;save();level=b.dataset.l;PK.set("sdk:level",level);load()});
$("board").addEventListener("pointerdown",e=>{const b=e.target.closest("[data-i]");if(!b)return;sel=+b.dataset.i;render();$("board").focus({preventScroll:true})});
$("pad").addEventListener("click",e=>{const b=e.target.closest("[data-d]");if(b)input(+b.dataset.d)});
$("erase").addEventListener("click",()=>{if(sel>=0&&!P.puzzle[sel]){G.h.push([sel,G.v[sel],G.n[sel]]);G.v[sel]=0;G.n[sel]=0;save();render()}});
$("undo").addEventListener("click",()=>{const h=G.h.pop();if(!h||G.done)return;[sel,G.v[h[0]],G.n[h[0]]]=[h[0],h[1],h[2]];save();render()});
$("notes").addEventListener("click",()=>{noteMode=!noteMode;render()});
$("showerr").addEventListener("change",render);
$("random").addEventListener("click",()=>{save();practice=practice?null:Date.now().toString(36);load()});
$("board").addEventListener("keydown",e=>{
  if(/^[1-9]$/.test(e.key)){input(+e.key);e.preventDefault()}
  else if(e.key==="Backspace"||e.key==="Delete"||e.key==="0"){$("erase").click();e.preventDefault()}
  else if(e.key==="n"||e.key==="N"){noteMode=!noteMode;render()}
  else if((e.ctrlKey||e.metaKey)&&e.key==="z"){$("undo").click();e.preventDefault()}
  else{const m={ArrowUp:-9,ArrowDown:9,ArrowLeft:-1,ArrowRight:1}[e.key];if(m){e.preventDefault();sel=sel<0?40:(sel+m+81)%81;render()}}
});
window.addEventListener("pagehide",save);
load();
