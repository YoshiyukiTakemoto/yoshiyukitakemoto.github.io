const LANG=document.documentElement.lang==="ja"?"ja":"en";
const NF=new Intl.NumberFormat(LANG==="ja"?"ja-JP":"en-US",{maximumFractionDigits:6});
const f=n=>isFinite(n)?NF.format(+n.toPrecision(12)):"—";
const inp=(id,v)=>`<input id="${id}" type="number" step="any" value="${v}" inputmode="decimal">`;
// Each card: question template (with inputs), and a function returning [answer, explanation].
const C=LANG==="ja"?[
 ["a","Aの B% はいくつ？",`${inp("a1",2000)} の ${inp("a2",15)} % は？`,(x,p)=>[f(x*p/100),`${f(x)} × ${f(p)} ÷ 100`]],
 ["b","AはBの何%？",`${inp("b1",45)} は ${inp("b2",60)} の何%？`,(x,y)=>[f(x/y*100)+"%",`${f(x)} ÷ ${f(y)} × 100`]],
 ["c","増減率（AからBへ何%変化？）",`${inp("c1",800)} → ${inp("c2",1000)}`,(x,y)=>{const r=(y-x)/Math.abs(x)*100;return[`<span class="${r>=0?"up":"down"}">${r>0?"+":""}${f(r)}%</span>`,`(${f(y)} − ${f(x)}) ÷ ${f(Math.abs(x))} × 100 ・ ${r>=0?"増加":"減少"} ${f(Math.abs(y-x))}`]}],
 ["d","割引（A円のB%オフ）",`${inp("d1",3980)} 円の ${inp("d2",30)} % オフ`,(x,p)=>[f(x*(1-p/100))+"円",`割引額 ${f(x*p/100)}円 ・ ${f(100-p)}%の価格`]],
 ["e","AをB%増やす",`${inp("e1",250000)} を ${inp("e2",3)} % 増やすと？`,(x,p)=>[f(x*(1+p/100)),`増加分 ${f(x*p/100)} ・ ${f(x)} × ${f(1+p/100)}`]],
 ["g","割合から元の数（B%がAのとき全体は？）",`${inp("g1",30)} が全体の ${inp("g2",12)} % のとき、全体は？`,(x,p)=>[f(x/p*100),`${f(x)} ÷ ${f(p)} × 100`]]
]:[
 ["a","What is X% of Y?",`What is ${inp("a2",15)} % of ${inp("a1",2000)} ?`,(x,p)=>[f(x*p/100),`${f(x)} × ${f(p)} ÷ 100`]],
 ["b","X is what percent of Y?",`${inp("b1",45)} is what % of ${inp("b2",60)} ?`,(x,y)=>[f(x/y*100)+"%",`${f(x)} ÷ ${f(y)} × 100`]],
 ["c","Percentage change",`From ${inp("c1",800)} to ${inp("c2",1000)}`,(x,y)=>{const r=(y-x)/Math.abs(x)*100;return[`<span class="${r>=0?"up":"down"}">${r>0?"+":""}${f(r)}%</span>`,`(${f(y)} − ${f(x)}) ÷ ${f(Math.abs(x))} × 100 · ${r>=0?"increase":"decrease"} of ${f(Math.abs(y-x))}`]}],
 ["d","Discount (X% off)",`${inp("d2",30)} % off ${inp("d1",39.8)}`,(x,p)=>[f(x*(1-p/100)),`You save ${f(x*p/100)} · ${f(100-p)}% of the price`]],
 ["e","Increase by X%",`Increase ${inp("e1",2500)} by ${inp("e2",3)} %`,(x,p)=>[f(x*(1+p/100)),`Increase of ${f(x*p/100)} · ${f(x)} × ${f(1+p/100)}`]],
 ["g","Find the whole from a part",`${inp("g1",30)} is ${inp("g2",12)} % of what?`,(x,p)=>[f(x/p*100),`${f(x)} ÷ ${f(p)} × 100`]]
];
const pc=document.getElementById("pc");
pc.innerHTML=C.map(([k,h,q])=>`<section class="panel" id="card-${k}"><h2>${h}</h2><div class="q">${q}</div><div class="ans" aria-live="polite"><strong id="${k}-r"></strong><span id="${k}-x"></span></div></section>`).join("");
function calc(k){const c=C.find(c=>c[0]===k),x=parseFloat(document.getElementById(k+"1").value),y=parseFloat(document.getElementById(k+"2").value);
  const [r,e]=isNaN(x)||isNaN(y)?["—",""]:c[3](x,y);document.getElementById(k+"-r").innerHTML=r;document.getElementById(k+"-x").textContent=e;}
pc.addEventListener("input",e=>{const k=e.target.id&&e.target.id[0];if(k)calc(k)});
C.forEach(c=>calc(c[0]));
