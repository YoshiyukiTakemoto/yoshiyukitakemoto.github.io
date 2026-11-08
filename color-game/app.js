const LANG=document.documentElement.lang==="ja"?"ja":"en";
const $=id=>document.getElementById(id);
const PK=window.PK;
const T={
en:{level:"Level",time:"Seconds",best:"Best",start:"Start",again:"Play again",pick:"Find the tile that’s a different color",wrong:"Wrong tile: −3 seconds",over:n=>`Time’s up! You reached level ${n}.`,
 ranks:[[5,"Keep practising"],[10,"Good eye"],[15,"Sharp eye"],[20,"Color expert"],[25,"Designer’s eye"],[1e9,"Superhuman vision 🦅"]],share:(n,r)=>`I reached level ${n} in the color difference game (${r}). How far can you get?`},
ja:{level:"レベル",time:"残り秒",best:"ベスト",start:"スタート",again:"もう一度",pick:"1つだけ色が違うマスを探してください",wrong:"ハズレ：3秒マイナス",over:n=>`時間切れ！ レベル${n}まで到達しました。`,
 ranks:[[5,"もう少し"],[10,"なかなかの目"],[15,"鋭い色彩感覚"],[20,"色のプロ級"],[25,"デザイナーの目"],[1e9,"超人的な目 🦅"]],share:(n,r)=>`色の違い探しゲームでレベル${n}に到達（${r}）！あなたはどこまで行ける？`}
}[LANG];
let level=1,left=60,timer=null,odd=0,playing=false;
const rank=n=>T.ranks.find(r=>n<r[0])[1];
// Grid grows from 2×2 to 8×8; the colour difference shrinks from 25 to 2 lightness points.
function round(){
  const n=Math.min(8,1+Math.ceil((level+1)/2)),diff=Math.max(2,Math.round(25*Math.pow(.88,level-1)));
  const h=Math.floor(Math.random()*360),s=45+Math.random()*40,l=35+Math.random()*30;
  odd=Math.floor(Math.random()*n*n);
  const b=$("board");b.style.gridTemplateColumns=`repeat(${n},1fr)`;
  b.innerHTML=Array.from({length:n*n},(_,i)=>`<button type="button" data-i="${i}" aria-label="${i+1}" style="background:hsl(${h} ${s}% ${i===odd?l+diff:l}%)"></button>`).join("");
  $("level").textContent=level;
}
function tick(){left--;$("time").textContent=Math.max(0,left);if(left<=0)end()}
function end(){
  clearInterval(timer);playing=false;const reached=level;const best=Math.max(PK.get("cg:best",0),reached);PK.set("cg:best",best);$("best").textContent=best;
  $("board").querySelector(`[data-i="${odd}"]`)?.classList.add("hit");
  $("msg").textContent=`${T.over(reached)} ${rank(reached)}`;$("start").textContent=T.again;$("start").hidden=false;PK.share($("share"),T.share(reached,rank(reached)));
}
function start(){level=1;left=60;playing=true;$("time").textContent=left;$("msg").textContent=T.pick;$("share").innerHTML="";$("start").hidden=true;round();clearInterval(timer);timer=setInterval(tick,1000)}
$("board").addEventListener("pointerdown",e=>{const b=e.target.closest("[data-i]");if(!b||!playing)return;e.preventDefault();
  if(+b.dataset.i===odd){level++;$("msg").textContent=T.pick;round()}else{left=Math.max(0,left-3);$("time").textContent=left;$("msg").textContent=T.wrong;if(left<=0)end()}});
$("l-level").textContent=T.level;$("l-time").textContent=T.time;$("l-best").textContent=T.best;$("start").textContent=T.start;$("best").textContent=PK.get("cg:best",0);
$("start").addEventListener("click",start);
round();
