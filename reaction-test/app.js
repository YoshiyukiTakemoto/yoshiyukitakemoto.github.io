const LANG=document.documentElement.lang==="ja"?"ja":"en";
const $=id=>document.getElementById(id);
const PK=window.PK;
const T={
en:{start:"Tap to start",startH:"When the box turns green, tap as fast as you can. 5 tries.",ready:"Wait for green…",readyH:"Don’t tap yet",go:"TAP!",early:"Too soon!",earlyH:"Tap to try again",ms:n=>`${n} ms`,next:n=>`Tap for try ${n} of 5`,
 done:"Done! Tap to play again",avg:"Average",best:"Best this round",pb:"Your all-time best",rank:"Rating",try:"Try",
 ranks:[[180,"Lightning ⚡"],[220,"Excellent"],[260,"Above average"],[310,"Average"],[400,"A bit slow"],[1e9,"Sleepy 😴"]],share:(a,r)=>`My average reaction time is ${a} ms (${r}). Can you beat it?`},
ja:{start:"タップしてスタート",startH:"緑になったら、できるだけ速くタップ。全5回です。",ready:"緑になるまで待って…",readyH:"まだタップしないで",go:"タップ！",early:"フライング！",earlyH:"タップしてやり直し",ms:n=>`${n} ミリ秒`,next:n=>`タップして${n}回目へ（全5回）`,
 done:"終了！タップでもう一度",avg:"平均",best:"今回のベスト",pb:"自己ベスト",rank:"判定",try:"回目",
 ranks:[[180,"神速 ⚡"],[220,"とても速い"],[260,"平均より速い"],[310,"平均的"],[400,"少しゆっくり"],[1e9,"おねむ 😴"]],share:(a,r)=>`反射神経テストの平均は ${a}ミリ秒（${r}）でした。あなたは何ミリ秒？`}
}[LANG];
let state="wait",times=[],t0=0,timer=null;
const rank=ms=>T.ranks.find(r=>ms<r[0])[1];
function set(cls,msg,hint){$("pad").className="pad "+cls;$("msg").textContent=msg;$("hint").textContent=hint||""}
function tries(){$("tries").innerHTML=[0,1,2,3,4].map(i=>`<div>${times[i]!=null?times[i]:"—"}<small>${LANG==="ja"?`${i+1}${T.try}`:`${T.try} ${i+1}`}</small></div>`).join("")}
function facts(){
  const pb=PK.get("rt:best",null);if(!times.length){$("facts").innerHTML=pb?`<div><dt>${T.pb}</dt><dd>${T.ms(pb)}</dd></div>`:"";return}
  const avg=Math.round(times.reduce((a,b)=>a+b,0)/times.length),best=Math.min(...times);
  $("facts").innerHTML=`<div><dt>${T.avg}</dt><dd>${T.ms(avg)}</dd></div><div><dt>${T.best}</dt><dd>${T.ms(best)}</dd></div><div><dt>${T.pb}</dt><dd>${pb?T.ms(pb):"—"}</dd></div>${times.length===5?`<div><dt>${T.rank}</dt><dd>${rank(avg)}</dd></div>`:""}`;
}
function arm(){state="ready";set("ready",T.ready,T.readyH);timer=setTimeout(()=>{state="go";t0=performance.now();set("go",T.go)},1500+Math.random()*2500)}
function press(e){
  if(e)e.preventDefault();
  if(state==="wait"||state==="early"||state==="between"){if(state==="wait")times=times.length===5?[]:times;tries();facts();$("share").innerHTML="";arm();return}
  if(state==="ready"){clearTimeout(timer);state="early";set("early",T.early,T.earlyH);return}
  if(state==="go"){
    const ms=Math.round(performance.now()-t0);times.push(ms);tries();
    const pb=PK.get("rt:best",null);if(pb==null||ms<pb)PK.set("rt:best",ms);facts();
    if(times.length<5){state="between";set("result",T.ms(ms),T.next(times.length+1))}
    else{state="wait";const avg=Math.round(times.reduce((a,b)=>a+b,0)/5);set("result",T.ms(avg),T.done);PK.share($("share"),T.share(avg,rank(avg)))}
  }
}
// pointerdown is faster than click and avoids the 300 ms tap delay on phones.
$("pad").addEventListener("pointerdown",press);
$("pad").addEventListener("keydown",e=>{if(e.code==="Space"||e.code==="Enter")press(e)});
$("pad").addEventListener("click",e=>e.preventDefault());
set("wait",T.start,T.startH);tries();facts();
