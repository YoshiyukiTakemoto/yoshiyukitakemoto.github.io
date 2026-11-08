const LANG=document.documentElement.lang==="ja"?"ja":"en";
const $=id=>document.getElementById(id);
const PK=window.PK;
const T={
en:{birth:"Your date of birth",span:"Life expectancy (years)",past:"Weeks lived",now:"This week",future:"Weeks ahead",
 pct:p=>`${p}% lived`,sub:(a,b)=>`${a} weeks lived · about ${b} weeks to go`,f:[["Days lived"],["Weekends left"],["Summers left"],["New Year’s Days left"],["Full moons left"],["Heartbeats so far (approx.)"]],
 share:(p,w,s)=>`I’ve lived ${p}% of a ${s}-year life. About ${w} weeks to go. What will you do with yours?`,big:n=>n>=1e9?(n/1e9).toFixed(1)+" billion":n>=1e6?(n/1e6).toFixed(1)+" million":n.toLocaleString("en-US"),def:"1995-06-15"},
ja:{birth:"あなたの生年月日",span:"想定する寿命（歳）",past:"過ごした週",now:"今週",future:"これからの週",
 pct:p=>`人生の${p}%`,sub:(a,b)=>`これまで${a}週・残り約${b}週`,f:[["生きてきた日数"],["残りの週末"],["残りの夏"],["残りのお正月"],["残りの満月"],["これまでの心拍数（約）"]],
 share:(p,w,s)=>`${s}年の人生の${p}%が過ぎました。残りは約${w}週。あなたは？`,big:n=>n>=1e8?(n/1e8).toFixed(1)+"億":n>=1e4?Math.round(n/1e4).toLocaleString("ja-JP")+"万":n.toLocaleString("ja-JP"),def:"1995-06-15"}
}[LANG];
const DAY=86400000,WEEK=7*DAY,COLS=52;
const cv=$("grid"),cx=cv.getContext("2d");
function render(){
  const b=$("birth").value,span=Math.min(120,Math.max(30,+$("span").value||85));if(!b)return;
  PK.set("liw",{b,span});
  const [y,m,d]=b.split("-").map(Number),birth=Date.UTC(y,m-1,d),now=Date.now(),end=Date.UTC(y+span,m-1,d);
  const lived=Math.max(0,Math.floor((now-birth)/WEEK)),total=span*COLS,left=Math.max(0,total-lived);
  const pct=Math.min(100,(now-birth)/(end-birth)*100),pctS=pct.toFixed(1),days=Math.floor((now-birth)/DAY);
  const yearsLeft=Math.max(0,(end-now)/(365.2425*DAY));
  $("pct").textContent=T.pct(pctS);$("sub").textContent=T.sub(lived.toLocaleString(),left.toLocaleString());
  const vals=[days.toLocaleString(),Math.floor(yearsLeft*52.18).toLocaleString(),Math.floor(yearsLeft).toLocaleString(),Math.floor(yearsLeft).toLocaleString(),Math.floor((end-now)/(29.53*DAY)).toLocaleString(),T.big(Math.round(days*24*60*75))];
  $("facts").innerHTML=T.f.map(([k],i)=>`<div><dt>${k}</dt><dd>${vals[i]}</dd></div>`).join("");
  PK.share($("share"),T.share(pctS,left.toLocaleString(),span));
  // Grid: one row per year of life, 52 squares per row; a label every 10 years.
  const cs=getComputedStyle(document.body),fg=cs.getPropertyValue("--fg").trim(),muted=cs.getPropertyValue("--muted").trim(),line=cs.getPropertyValue("--line").trim();
  const pad=44,cell=Math.floor((cv.width-pad-8)/COLS),gap=2;cv.height=span*cell+20;
  cx.clearRect(0,0,cv.width,cv.height);cx.font="500 18px 'IBM Plex Mono',monospace";cx.textAlign="right";cx.textBaseline="middle";
  for(let r=0;r<span;r++){
    if(r%10===0){cx.fillStyle=muted;cx.fillText(r,pad-8,r*cell+cell/2+10)}
    for(let c=0;c<COLS;c++){const i=r*COLS+c,x=pad+c*cell,yy=r*cell+10;
      if(i<lived){cx.fillStyle=fg;cx.fillRect(x,yy,cell-gap,cell-gap)}
      else if(i===lived){cx.fillStyle="#e0614f";cx.fillRect(x,yy,cell-gap,cell-gap)}
      else{cx.strokeStyle=line;cx.lineWidth=1.5;cx.strokeRect(x+.75,yy+.75,cell-gap-1.5,cell-gap-1.5)}}
  }
}
for(const k of["birth","span"])$("l-"+k).textContent=T[k];
$("lg-past").textContent=T.past;$("lg-now").textContent=T.now;$("lg-future").textContent=T.future;
const saved=PK.get("liw",null);$("birth").value=saved?.b||T.def;$("span").value=saved?.span||85;
$("birth").addEventListener("input",render);$("span").addEventListener("input",render);
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",render);
render();
