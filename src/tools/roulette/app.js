const LANG=document.documentElement.lang==="ja"?"ja":"en";
const $=id=>document.getElementById(id);
const PK=window.PK;
const T={
en:{spin:"Spin",items:"Items (one per line)",remove:"Remove the winner after each spin",shuffle:"Shuffle order",restore:"Restore removed items",hist:"History",need:"Add at least two items.",win:w=>`🎉 ${w}`,def:"Pizza\nSushi\nTacos\nRamen\nCurry\nSalad"},
ja:{spin:"回す",items:"項目（1行に1つ）",remove:"当たった項目を次から除外する",shuffle:"順番をシャッフル",restore:"除外した項目を戻す",hist:"履歴",need:"項目を2つ以上入力してください。",win:w=>`🎉 ${w}`,def:"焼肉\n寿司\nラーメン\nカレー\nパスタ\nハンバーガー"}
}[LANG];
const COLORS=["#2440c4","#e0614f","#f2b84b","#3f9e6e","#8a5cc2","#2f9fb8","#d9709e","#7a8b2f","#c7782c","#4f6bd8"];
const cv=$("wheel"),cx=cv.getContext("2d");
let angle=0,spinning=false,removed=PK.get("roulette:removed",[]),hist=[];
const items=()=>$("items").value.split("\n").map(s=>s.trim()).filter(Boolean);
function draw(){
  const it=items(),n=it.length,R=360,seg=2*Math.PI/Math.max(n,1);
  cx.clearRect(0,0,720,720);cx.save();cx.translate(R,R);cx.rotate(angle);
  if(n<2){cx.fillStyle=getComputedStyle(document.body).getPropertyValue("--line");cx.beginPath();cx.arc(0,0,R-4,0,7);cx.fill()}
  else it.forEach((t,i)=>{
    cx.beginPath();cx.moveTo(0,0);cx.arc(0,0,R-4,i*seg,(i+1)*seg);cx.closePath();cx.fillStyle=COLORS[i%COLORS.length===0&&i===n-1&&n%COLORS.length===1?1:i%COLORS.length];cx.fill();
    cx.strokeStyle="rgba(255,255,255,.7)";cx.lineWidth=2;cx.stroke();
    cx.save();cx.rotate((i+.5)*seg);cx.textAlign="right";cx.textBaseline="middle";cx.fillStyle="#fff";
    const size=Math.max(16,Math.min(34,260/Math.max(6,t.length)*1.4,seg*R*.42));cx.font=`600 ${size}px "IBM Plex Sans JP",system-ui,sans-serif`;
    let s=t;while(cx.measureText(s).width>R-70&&s.length>1)s=s.slice(0,-1);if(s!==t)s=s.slice(0,-1)+"…";
    cx.fillText(s,R-28,0);cx.restore();
  });
  cx.restore();cx.beginPath();cx.arc(R,R,34,0,7);cx.fillStyle="#fff";cx.fill();cx.lineWidth=4;cx.strokeStyle="#141a2b";cx.stroke();
}
// The pointer is at the top (−90°). The winner is the segment under it when the wheel stops.
function spin(){
  const it=items();if(it.length<2){$("result").textContent=T.need;return}if(spinning)return;spinning=true;$("spin").disabled=true;$("result").textContent="";
  const r=new Uint32Array(1);crypto.getRandomValues(r);
  const start=angle,target=start+2*Math.PI*(6+Math.floor(Math.random()*3))+r[0]/2**32*2*Math.PI,dur=4200,t0=performance.now();
  const ease=t=>1-Math.pow(1-t,4);
  (function frame(now){const t=Math.min(1,(now-t0)/dur);angle=start+(target-start)*ease(t);draw();
    if(t<1)return requestAnimationFrame(frame);
    spinning=false;$("spin").disabled=false;angle%=2*Math.PI;
    const seg=2*Math.PI/it.length,pos=((-Math.PI/2-angle)%(2*Math.PI)+2*Math.PI)%(2*Math.PI),w=it[Math.floor(pos/seg)];
    $("result").textContent=T.win(w);hist.unshift(w);$("hist").innerHTML=hist.slice(0,30).map(h=>`<li>${h.replace(/</g,"&lt;")}</li>`).join("");
    if($("remove").checked){removed.push(w);const lines=$("items").value.split("\n");const i=lines.findIndex(l=>l.trim()===w);lines.splice(i,1);$("items").value=lines.join("\n");persist();setTimeout(draw,900)}
  })(t0);
}
function persist(){PK.set("roulette:items",$("items").value);PK.set("roulette:removed",removed);PK.set("roulette:remove",$("remove").checked)}
$("spin").textContent=T.spin;$("l-items").textContent=T.items;$("l-remove").textContent=T.remove;$("shuffle").textContent=T.shuffle;$("restore").textContent=T.restore;$("l-hist").textContent=T.hist;
$("items").value=PK.get("roulette:items",T.def);$("remove").checked=PK.get("roulette:remove",false);
$("items").addEventListener("input",()=>{persist();draw()});$("remove").addEventListener("change",persist);
$("spin").addEventListener("click",spin);
$("shuffle").addEventListener("click",()=>{const a=items();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}$("items").value=a.join("\n");persist();draw()});
$("restore").addEventListener("click",()=>{if(!removed.length)return;$("items").value=items().concat(removed).join("\n");removed=[];persist();draw()});
document.addEventListener("keydown",e=>{if((e.code==="Space"||e.code==="Enter")&&e.target===document.body){e.preventDefault();spin()}});
document.fonts?.ready.then(draw);draw();
