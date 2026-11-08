const LANG=document.documentElement.lang==="ja"?"ja":"en";
const $=id=>document.getElementById(id);
const PK=window.PK;
const T={
ja:{total:"合計金額（円）",unit:"集める単位",mode:"端数の扱い",people:"参加者",weight:"負担割合",add:"＋ 参加者を追加",copy:"テキストをコピー",copied:"コピーしました",text:"共有用テキスト（LINEなどに貼り付け）",
 units:[[1,"1円"],[10,"10円"],[100,"100円"],[500,"500円"],[1000,"1,000円"]],modes:[["up","切り上げて集める（余りは幹事へ）"],["down","切り捨てて集める（不足は幹事が負担）"]],
 names:["幹事","Aさん","Bさん","Cさん"],person:n=>`参加者${n}`,yen:n=>n.toLocaleString("ja-JP")+"円",
 per:"1人あたり（割合1の人）",over:n=>`集まる合計 ${n}`,surplus:n=>`余り ${n}（幹事の取り分）`,short:n=>`不足 ${n}（幹事が負担）`,exact:"ぴったりです",head:(t,n)=>`【割り勘】合計 ${t}・${n}人`,def:12800},
en:{total:"Total bill",unit:"Round each share to",mode:"Rounding",people:"People",weight:"Share",add:"+ Add person",copy:"Copy text",copied:"Copied",text:"Text to share",
 units:[[.01,"0.01"],[.5,"0.50"],[1,"1"],[5,"5"],[10,"10"]],modes:[["up","Round up (organiser keeps the extra)"],["down","Round down (organiser covers the rest)"]],
 names:["Organiser","Alex","Sam","Kim"],person:n=>`Person ${n}`,yen:n=>n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}),
 per:"Per person (share 1)",over:n=>`Collected ${n}`,surplus:n=>`Extra ${n} (to the organiser)`,short:n=>`Short by ${n} (organiser covers it)`,exact:"Splits exactly",head:(t,n)=>`Bill split: ${t} between ${n}`,def:186.4}
}[LANG];
const esc=s=>s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let S=PK.get("split",null)||{total:T.def,unit:LANG==="ja"?100:.01,mode:"up",people:T.names.map((n,i)=>({n,w:1}))};
const save=()=>PK.set("split",S);
function people(){
  $("people").innerHTML=S.people.map((p,i)=>`<li><input aria-label="${T.people} ${i+1}" data-i="${i}" data-k="n" value="${esc(p.n)}"><input class="w" type="number" min="0" step="0.1" data-i="${i}" data-k="w" value="${p.w}" aria-label="${T.weight}"><button type="button" class="x" data-del="${i}" aria-label="✕">✕</button></li>`).join("");
}
function calc(){
  const tot=+S.total||0,u=S.unit,W=S.people.reduce((s,p)=>s+(+p.w||0),0);
  // Everyone except the organiser (first row) pays a rounded share; the organiser settles the difference.
  const r=x=>{const k=Math.round(x/u*1e6)/1e6;return(S.mode==="up"?Math.ceil(k):Math.floor(k))*u};
  const pays=S.people.map(p=>W?r(tot*(+p.w||0)/W):0);
  const others=pays.slice(1).reduce((a,b)=>a+b,0),org=Math.max(0,tot-others),diff=pays[0]-org;
  const rounded=v=>Math.round(v*100)/100;
  const list=S.people.map((p,i)=>({n:p.n||T.person(i+1),w:+p.w||0,pay:rounded(i===0?org:pays[i])}));
  const per=W?r(tot/W):0;
  $("sum").innerHTML=`<span>${T.per}</span><strong>${T.yen(per)}</strong><span>${T.over(T.yen(rounded(others+pays[0])))} · ${Math.abs(diff)<1e-9?T.exact:diff>0?T.surplus(T.yen(rounded(diff))):T.short(T.yen(rounded(-diff)))}</span>`;
  $("res").innerHTML=list.map((p,i)=>`<li><span>${esc(p.n)}${p.w!==1?` <small>×${p.w}</small>`:""}</span><b>${T.yen(p.pay)}</b></li>`).join("");
  $("text").value=[T.head(T.yen(tot),list.length),...list.map(p=>`${p.n}: ${T.yen(p.pay)}`)].join("\n");
}
for(const k of["total","unit","mode","people","weight","text"])$("l-"+k).textContent=T[k];
$("add").textContent=T.add;$("copy").textContent=T.copy;
$("unit").innerHTML=T.units.map(([v,l])=>`<option value="${v}">${l}</option>`).join("");
$("mode").innerHTML=T.modes.map(([v,l])=>`<option value="${v}">${l}</option>`).join("");
$("total").value=S.total;$("unit").value=S.unit;$("mode").value=S.mode;
$("total").addEventListener("input",()=>{S.total=$("total").value;save();calc()});
$("unit").addEventListener("change",()=>{S.unit=+$("unit").value;save();calc()});
$("mode").addEventListener("change",()=>{S.mode=$("mode").value;save();calc()});
$("people").addEventListener("input",e=>{const i=e.target.dataset.i;if(i==null)return;S.people[i][e.target.dataset.k]=e.target.dataset.k==="w"?e.target.value:e.target.value;save();calc()});
$("people").addEventListener("click",e=>{const b=e.target.closest("[data-del]");if(!b||S.people.length<=2)return;S.people.splice(+b.dataset.del,1);save();people();calc()});
$("add").addEventListener("click",()=>{S.people.push({n:T.person(S.people.length+1),w:1});save();people();calc();$("people").querySelector("li:last-child input").select()});
$("copy").addEventListener("click",()=>{const b=$("copy");try{navigator.clipboard.writeText($("text").value).then(()=>{b.textContent=T.copied;setTimeout(()=>b.textContent=T.copy,1500)},()=>{$("text").select()})}catch(e){$("text").select()}});
people();calc();
