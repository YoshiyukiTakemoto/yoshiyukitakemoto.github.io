const LANG=document.documentElement.lang==="ja"?"ja":"en";
const $=id=>document.getElementById(id);
const T={
en:{fmt:"Format",min:"Minify",indent:"Indent",sort:"Sort keys",in:"Input JSON",out:"Result",copy:"Copy",copied:"Copied",dl:"Download .json",clear:"Clear",
 ok:(n,s)=>`Valid JSON · ${n} ${n===1?"line":"lines"} · ${s}`,err:(m,l,c)=>`Invalid JSON${l?` at line ${l}, column ${c}`:""}: ${m}`,empty:"Paste JSON on the left."},
ja:{fmt:"整形",min:"圧縮（1行に）",indent:"インデント",sort:"キーを並べ替え",in:"入力（JSON）",out:"結果",copy:"コピー",copied:"コピーしました",dl:".jsonで保存",clear:"クリア",
 ok:(n,s)=>`正しいJSONです・${n}行・${s}`,err:(m,l,c)=>`JSONの形式が正しくありません${l?`（${l}行目 ${c}文字目付近）`:""}：${m}`,empty:"左側にJSONを貼り付けてください。"}
}[LANG];
const SAMPLE='{"name":"Plainkit","tools":["json-formatter","unit-converter"],"free":true,"version":1.2,"owner":{"site":"tools.motty.jp","languages":["en","ja"]}}';
const size=s=>{const b=new TextEncoder().encode(s).length;return b<1024?b+" B":(b/1024).toFixed(1)+" KB"};
function sortKeys(v){if(Array.isArray(v))return v.map(sortKeys);if(v&&typeof v==="object")return Object.fromEntries(Object.keys(v).sort().map(k=>[k,sortKeys(v[k])]));return v}
function locate(src,msg){
  // Browsers report errors as "at position N" (Chrome/Edge), "line L column C" (Firefox) or nothing (Safari).
  let m=msg.match(/line (\d+) column (\d+)/);if(m)return[+m[1],+m[2]];
  m=msg.match(/position (\d+)/);if(m){const pre=src.slice(0,+m[1]).split("\n");return[pre.length,pre[pre.length-1].length+1]}
  return[0,0];
}
function run(minify){
  const src=$("in").value,st=$("status");
  if(!src.trim()){$("out").value="";st.textContent=T.empty;st.className="status";$("in").classList.remove("bad");return}
  try{
    let v=JSON.parse(src);if($("sort").checked)v=sortKeys(v);
    const ind=$("indent").value==="tab"?"\t":+$("indent").value,out=minify?JSON.stringify(v):JSON.stringify(v,null,ind);
    $("out").value=out;st.textContent=T.ok(out.split("\n").length,size(out));st.className="status ok";$("in").classList.remove("bad");
  }catch(e){
    const [l,c]=locate(src,e.message);st.textContent=T.err(e.message.replace(/^JSON\.parse: /,""),l,c);st.className="status err";$("in").classList.add("bad");
    if(l){const lines=src.split("\n"),start=lines.slice(0,l-1).join("\n").length+(l>1?1:0)+c-1;try{$("in").setSelectionRange(start,start+1)}catch(err){}}
  }
}
for(const k of["fmt","min","copy","dl","clear"])$(k).textContent=T[k];
for(const k of["indent","sort","in","out"])$("l-"+k).textContent=T[k];
let mini=false;
$("fmt").addEventListener("click",()=>{mini=false;run(false)});$("min").addEventListener("click",()=>{mini=true;run(true)});
$("indent").addEventListener("change",()=>run(mini));$("sort").addEventListener("change",()=>run(mini));
let t;$("in").addEventListener("input",()=>{clearTimeout(t);t=setTimeout(()=>run(mini),300)});
$("clear").addEventListener("click",()=>{$("in").value="";run(mini);$("in").focus()});
$("copy").addEventListener("click",()=>{const b=$("copy"),o=$("out");const ok=()=>{b.textContent=T.copied;setTimeout(()=>b.textContent=T.copy,1500)};
  try{navigator.clipboard.writeText(o.value).then(ok,()=>{o.select();document.execCommand("copy");ok()})}catch(e){o.select();document.execCommand("copy");ok()}});
$("dl").addEventListener("click",()=>{if(!$("out").value)return;const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([$("out").value],{type:"application/json"}));a.download="formatted.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),3000)});
$("in").value=SAMPLE;run(false);
