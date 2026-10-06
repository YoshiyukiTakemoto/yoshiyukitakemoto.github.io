const LANG=document.documentElement.lang==="ja"?"ja":"en";
const $=id=>document.getElementById(id);
const T={
ja:{add:"税抜 → 税込",remove:"税込 → 税抜",amt:"金額（円）",rate:"税率",custom:"税率（%）",round:"端数処理",
 rates:[["10","10%（標準税率）"],["8","8%（軽減税率：食品など）"],["custom","その他"]],rounds:[["floor","切り捨て"],["round","四捨五入"],["ceil","切り上げ"]],
 ex:"税抜価格",tax:"消費税",inc:"税込価格",table:"早見表（税抜 → 税込）",th:["税抜","税込 10%","税込 8%"],dec:0,def:1980,unit:"円",list:[100,200,300,500,800,1000,1500,2000,3000,5000,8000,10000,20000,30000,50000,100000]},
en:{add:"Add tax",remove:"Remove tax",amt:"Amount",rate:"Tax rate",custom:"Rate (%)",round:"Rounding",
 rates:[["20","20% (UK VAT, France)"],["19","19% (Germany)"],["21","21% (Spain, Netherlands)"],["22","22% (Italy)"],["10","10% (Japan, Australia GST)"],["15","15% (New Zealand GST)"],["5","5% (Canada GST)"],["custom","Other"]],rounds:[["round","Round to nearest"],["floor","Round down"],["ceil","Round up"]],
 ex:"Net (excl. tax)",tax:"Tax",inc:"Gross (incl. tax)",table:"Quick table (net → gross)",th:["Net","+20%","+10%"],dec:2,def:49.99,unit:"",list:[1,5,10,20,25,50,75,100,150,200,250,500,750,1000,2500,5000]}
}[LANG];
const NF=new Intl.NumberFormat(LANG==="ja"?"ja-JP":"en-US",{minimumFractionDigits:T.dec,maximumFractionDigits:T.dec});
const money=n=>NF.format(n)+(T.unit?" "+T.unit:"");
// Work in minor units (yen or cents) to avoid floating-point drift.
const RND={floor:Math.floor,ceil:Math.ceil,round:x=>Math.round(x)};
const scale=10**T.dec;
function rate(){const v=$("rate").value;return v==="custom"?Math.max(0,parseFloat($("custom").value)||0):+v}
function calc(amount,r,mode,rm){
  // toFixed(6) strips binary noise such as 999.9999999 before rounding to whole minor units.
  const a=Math.round(amount*scale),fn=x=>RND[rm](+x.toFixed(6));
  if(mode==="add"){const tax=fn(a*r/100);return[a,tax,a+tax]}
  const net=fn(a*100/(100+r));return[net,a-net,a];
}
let mode="add";
function render(){
  const amt=parseFloat($("amt").value);$("custom-f").hidden=$("rate").value!=="custom";
  if(isNaN(amt)){$("out").innerHTML="";return}
  const [n,t,g]=calc(amt,rate(),mode,$("round").value).map(x=>x/scale);
  $("out").innerHTML=`<dt>${T.ex}</dt><dd${mode==="remove"?' class="total"':""}>${money(n)}</dd><dt>${T.tax} (${rate()}%)</dt><dd>${money(t)}</dd><dt>${T.inc}</dt><dd${mode==="add"?' class="total"':""}>${money(g)}</dd>`;
}
function table(){
  const rm=$("round").value,[r1,r2]=LANG==="ja"?[10,8]:[20,10];
  $("qt-h").innerHTML=`<tr>${T.th.map(h=>`<th>${h}</th>`).join("")}</tr>`;
  $("qt").innerHTML=T.list.map(v=>`<tr><td>${NF.format(v)}</td><td>${NF.format(calc(v,r1,"add",rm)[2]/scale)}</td><td>${NF.format(calc(v,r2,"add",rm)[2]/scale)}</td></tr>`).join("");
}
$("m-add").textContent=T.add;$("m-remove").textContent=T.remove;
for(const k of["amt","rate","custom","round","table"])$("l-"+k).textContent=T[k];
$("rate").innerHTML=T.rates.map(([v,l])=>`<option value="${v}">${l}</option>`).join("");
$("round").innerHTML=T.rounds.map(([v,l])=>`<option value="${v}">${l}</option>`).join("");
$("amt").value=T.def;
$("mode").addEventListener("click",e=>{const b=e.target.closest("[data-m]");if(!b)return;mode=b.dataset.m;document.querySelectorAll("#mode button").forEach(x=>x.setAttribute("aria-pressed",x===b));render()});
for(const id of["amt","rate","custom"])$(id).addEventListener("input",render);
$("round").addEventListener("change",()=>{render();table()});
render();table();
