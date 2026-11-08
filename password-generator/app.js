const LANG=document.documentElement.lang==="ja"?"ja":"en";
const T={
en:{len:"Length",sets:"Characters",upper:"Uppercase A–Z",lower:"Lowercase a–z",digits:"Numbers 0–9",symbols:"Symbols !@#$…",ambig:"Avoid look-alikes (I l 1 O 0)",out:"Passwords",gen:"Generate new",copy:"Copy",copied:"Copied",none:"Pick at least one character type.",
 bits:(b,l)=>`${b} bits of entropy · ${l}`,lv:["Weak","Fair","Strong","Very strong"],copyFail:"Select the password and copy it manually."},
ja:{len:"文字数",sets:"使う文字",upper:"英大文字 A–Z",lower:"英小文字 a–z",digits:"数字 0–9",symbols:"記号 !@#$…",ambig:"紛らわしい文字を除く（I l 1 O 0）",out:"パスワード",gen:"再生成",copy:"コピー",copied:"コピーしました",none:"文字の種類を1つ以上選んでください。",
 bits:(b,l)=>`エントロピー ${b} ビット・${l}`,lv:["弱い","普通","強い","非常に強い"],copyFail:"パスワードを選択して手動でコピーしてください。"}
}[LANG];
const $=id=>document.getElementById(id);
const SETS={upper:"ABCDEFGHIJKLMNOPQRSTUVWXYZ",lower:"abcdefghijklmnopqrstuvwxyz",digits:"0123456789",symbols:"!@#$%^&*()-_=+[]{};:,.?/~"};
const AMBIG=/[Il1O0o|]/g;
const store={get(k){try{return JSON.parse(localStorage.getItem("pg:"+k))}catch(e){return null}},set(k,v){try{localStorage.setItem("pg:"+k,JSON.stringify(v))}catch(e){}}};

// Uniform random integer in [0,n) using rejection sampling, so no character is favoured.
function rand(n){const lim=Math.floor(0x100000000/n)*n,a=new Uint32Array(1);let x;do{crypto.getRandomValues(a);x=a[0]}while(x>=lim);return x%n}
function pools(){return Object.keys(SETS).filter(k=>$("c-"+k).checked).map(k=>$("c-ambig").checked?SETS[k].replace(AMBIG,""):SETS[k])}
function make(len,ps){
  const all=ps.join("");
  // Regenerate until every chosen character type appears (only matters for short lengths).
  for(;;){let s="";for(let i=0;i<len;i++)s+=all[rand(all.length)];if(len<ps.length||ps.every(p=>[...s].some(c=>p.includes(c))))return s}
}
function strength(len,size){
  const b=Math.floor(len*Math.log2(size)),lv=b<50?0:b<70?1:b<100?2:3,st=$("strength");
  st.classList.toggle("good",lv>=2);st.querySelector("i").style.width=Math.min(100,b/128*100)+"%";$("s-label").textContent=T.bits(b,T.lv[lv]);
}
function gen(){
  const len=Math.max(4,Math.min(64,Math.trunc(+$("len").value)||16)),ps=pools();
  store.set("opts",{len,...Object.fromEntries(["upper","lower","digits","symbols","ambig"].map(k=>[k,$("c-"+k).checked]))});
  if(!ps.length){$("pw").innerHTML="";$("msg").textContent=T.none;$("strength").querySelector("i").style.width="0";$("s-label").textContent="";return}
  $("msg").textContent="";strength(len,ps.join("").length);
  $("pw").innerHTML=Array.from({length:5},()=>make(len,ps)).map(p=>`<li><code>${p.replace(/&/g,"&amp;").replace(/</g,"&lt;")}</code><button class="btn" type="button">${T.copy}</button></li>`).join("");
}

for(const k of["len","sets","upper","lower","digits","symbols","ambig","out"])$("l-"+k).textContent=T[k];
$("gen").textContent=T.gen;
const o=store.get("opts");if(o){$("len").value=$("len-n").value=o.len;for(const k of["upper","lower","digits","symbols","ambig"])if(k in o)$("c-"+k).checked=o[k]}
$("len").addEventListener("input",()=>{$("len-n").value=$("len").value;gen()});
$("len-n").addEventListener("change",()=>{$("len").value=$("len-n").value;$("len-n").value=$("len").value;gen()});
document.querySelector(".sets").addEventListener("change",gen);
$("gen").addEventListener("click",gen);
$("pw").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const code=b.previousElementSibling.textContent;
  const ok=()=>{b.textContent=T.copied;setTimeout(()=>b.textContent=T.copy,1600)},fail=()=>{$("msg").textContent=T.copyFail;const r=document.createRange();r.selectNodeContents(b.previousElementSibling);getSelection().removeAllRanges();getSelection().addRange(r)};
  try{navigator.clipboard.writeText(code).then(ok,fail)}catch(err){fail()}});
gen();
