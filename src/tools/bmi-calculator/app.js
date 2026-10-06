const LANG=document.documentElement.lang==="ja"?"ja":"en";
const $=id=>document.getElementById(id);
// Bands: [upper limit, label]. Japan uses the Japan Society for the Study of Obesity (JASSO) scale; elsewhere WHO.
const T={
ja:{h:"身長（cm）",w:"体重（kg）",bands:[[18.5,"低体重（やせ）"],[25,"普通体重"],[30,"肥満（1度）"],[35,"肥満（2度）"],[40,"肥満（3度）"],[99,"肥満（4度）"]],
 std:"標準体重（BMI 22）",range:"普通体重の範囲（BMI 18.5〜25未満）",diff:"標準体重との差",who:"WHO基準",whoBands:["低体重","普通体重","過体重（Pre-obese）","肥満"],
 note:"日本肥満学会の基準で判定しています（BMI 25以上が肥満）。18歳以上の成人向けの目安で、筋肉量や体型は考慮されません。健康上の判断は医師にご相談ください。"},
en:{h:"Height (cm)",w:"Weight (kg)",bands:[[18.5,"Underweight"],[25,"Healthy weight"],[30,"Overweight"],[35,"Obesity class I"],[40,"Obesity class II"],[99,"Obesity class III"]],
 std:"Weight at BMI 22",range:"Healthy weight range (BMI 18.5–24.9)",diff:"Difference from BMI 22",who:"",
 note:"Categories follow the World Health Organization adult scale. BMI is a screening measure for adults aged 18 and over; it doesn’t account for muscle mass, age, sex or ethnicity. Some Asian populations use lower cut-offs. Talk to a doctor about your health."}
}[LANG];
const COLORS=["var(--b1)","var(--b2)","var(--b3)","var(--b4)","var(--b5)","var(--b5)"];
const MIN=14,MAX=42;
let units="metric";
const one=n=>n.toFixed(1);
function kgOut(kg){return units==="imperial"?`${one(kg/0.45359237)} lb`:`${one(kg)} kg`}
function render(){
  let h,w;
  if(units==="imperial"){h=((+$("ft").value||0)*12+(+$("in").value||0))*2.54;w=(+$("lb").value||0)*0.45359237}else{h=+$("h").value;w=+$("w").value}
  if(!(h>50&&w>10)){$("bmi").textContent="—";$("cat").textContent="";return}
  const m=h/100,b=w/(m*m),i=T.bands.findIndex(x=>b<x[0]);
  $("bmi").textContent=one(b);$("cat").textContent=T.bands[i][1];$("cat").style.background=COLORS[i];$("cat").style.color="var(--fg)";
  $("mark").style.left=Math.min(100,Math.max(0,(b-MIN)/(MAX-MIN)*100))+"%";
  const std=22*m*m,d=w-std;
  let facts=`<div><dt>${T.std}</dt><dd>${kgOut(std)}</dd></div><div><dt>${T.range}</dt><dd>${kgOut(18.5*m*m)} – ${kgOut(24.9*m*m)}</dd></div><div><dt>${T.diff}</dt><dd>${d>0?"+":""}${kgOut(d)}</dd></div>`;
  if(T.who){const wi=b<18.5?0:b<25?1:b<30?2:3;facts+=`<div><dt>${T.who}</dt><dd>${T.whoBands[wi]}</dd></div>`}
  $("facts").innerHTML=facts;
}
// Scale bar: widths proportional to each band within MIN..MAX.
let prev=MIN;
$("bands").innerHTML=T.bands.map(([u],i)=>{const hi=Math.min(u,MAX),w=(hi-prev)/(MAX-MIN)*100;prev=hi;return w>0?`<span style="width:${w}%;background:${COLORS[i]}"></span>`:""}).join("");
$("l-h").textContent=T.h;$("l-w").textContent=T.w;$("note").textContent=T.note;
if(LANG==="en")$("units").hidden=false;
$("units").addEventListener("click",e=>{const b=e.target.closest("[data-u]");if(!b)return;units=b.dataset.u;
  document.querySelectorAll("#units button").forEach(x=>x.setAttribute("aria-pressed",x===b));$("metric").hidden=units!=="metric";$("imperial").hidden=units!=="imperial";render()});
document.querySelector(".bmi").addEventListener("input",render);
if(LANG==="en"&&/^en-US/.test(navigator.language||""))$("units").querySelector('[data-u="imperial"]').click();
render();
