const T={
en:{tag:"Shrink and resize photos in your browser. Nothing is uploaded, so it’s fast and private.",fmt:"Output format",same:"Same as original",q:"Quality",max:"Longest side",orig:"Original size",
 dt:"Drop images here",ds:"JPEG, PNG, WebP, AVIF or GIF (first frame). Paste with Ctrl+V / ⌘V also works.",db:"Choose images",sample:"No image handy? Try a sample.",
 saved:(a,b,p)=>`${a} → ${b} · ${p} smaller`,grew:(a,b)=>`${a} → ${b}`,clear:"Clear",zip:"Download all (ZIP)",dl:"Download",working:"Working…",kept:"Already smaller than the result, so the original is kept.",fail:"This file can’t be read by your browser.",
 facts:[["Stays on your device","Images are decoded and re-encoded by your browser. No upload, no account and no file limits."],["Removes hidden data","Re-encoding drops EXIF metadata such as GPS location and camera serial numbers. Photos are rotated correctly first."],["Good defaults","WebP at quality 80 usually cuts a phone photo by 70–90% with no visible change. AVIF appears when your browser can make it."]],
 foot:"Free and open source. No cookies, no analytics."},
ja:{tag:"写真をブラウザ内で圧縮・リサイズ。アップロードしないので速く、プライバシーも守られます。",fmt:"出力形式",same:"元の形式",q:"画質",max:"長辺の最大",orig:"元のサイズ",
 dt:"ここに画像をドロップ",ds:"JPEG・PNG・WebP・AVIF・GIF（1フレーム目）。Ctrl+V / ⌘V で貼り付けも可能です。",db:"画像を選ぶ",sample:"手元に画像がなければサンプルで試せます。",
 saved:(a,b,p)=>`${a} → ${b}・${p} 削減`,grew:(a,b)=>`${a} → ${b}`,clear:"クリア",zip:"まとめて保存（ZIP）",dl:"保存",working:"処理中…",kept:"元のファイルの方が小さいため、元のまま保持します。",fail:"このブラウザでは読み込めないファイルです。",
 facts:[["端末の外に出ません","画像の読み込みと再エンコードはブラウザ内で行います。アップロード・登録・枚数制限はありません。"],["隠れた情報を削除","再エンコードでGPS位置情報やカメラのシリアル番号などのEXIFを削除します。向きは先に正しく補正します。"],["おすすめ設定","WebP・画質80なら、スマホ写真は見た目を変えずに70〜90%小さくなることが多いです。ブラウザが対応していればAVIFも選べます。"]],
 foot:"無料・オープンソース。Cookieもアクセス解析もありません。"}
};
const $=id=>document.getElementById(id);
const store={get(k){try{return JSON.parse(localStorage.getItem("lt:"+k))}catch(e){return null}},set(k,v){try{localStorage.setItem("lt:"+k,JSON.stringify(v))}catch(e){}}};
const S={lang:document.documentElement.lang==="ja"?"ja":"en",fmt:store.get("fmt")||"image/webp",q:store.get("q")??80,max:store.get("max")??0,items:[]};
const probe=document.createElement("canvas");probe.width=probe.height=2;
const can=t=>probe.toDataURL(t).startsWith("data:"+t);
const FORMATS=[["image/webp","WebP"],["image/jpeg","JPEG"],["image/png","PNG"],["image/avif","AVIF"]].filter(([t])=>can(t));
if(!FORMATS.some(f=>f[0]===S.fmt)&&S.fmt!=="same")S.fmt=FORMATS[0][0];
const EXT={"image/webp":"webp","image/jpeg":"jpg","image/png":"png","image/avif":"avif"};
const kb=n=>n<1024?n+" B":n<1048576?(n/1024).toFixed(n<10240?1:0)+" KB":(n/1048576).toFixed(2)+" MB";
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function renderStatic(){
  const t=T[S.lang];
  $("l-fmt").textContent=t.fmt;$("l-q").textContent=t.q;$("l-max").textContent=t.max;
  $("fmt").innerHTML=FORMATS.concat([["same",t.same]]).map(([v,l])=>`<option value="${v}"${v===S.fmt?" selected":""}>${l}</option>`).join("");
  $("max").innerHTML=[0,3840,2560,1920,1280,800].map(v=>`<option value="${v}"${v===S.max?" selected":""}>${v?v+" px":t.orig}</option>`).join("");
  $("q").value=S.q;$("qv").textContent=S.q;
  $("d-title").textContent=t.dt;$("d-sub").textContent=t.ds;$("d-btn").textContent=t.db;$("sample").textContent=t.sample;
  $("clear").textContent=t.clear;$("zip").textContent=t.zip;
  renderList();
}

let job=0;
async function processAll(){const my=++job;for(const it of S.items){if(my!==job)return;await processOne(it);renderList()}}
async function processOne(it){
  it.busy=true;
  try{
    if(!it.bmp)it.bmp=await createImageBitmap(it.file,{imageOrientation:"from-image"});
    const {width:w,height:h}=it.bmp,sc=S.max&&Math.max(w,h)>S.max?S.max/Math.max(w,h):1;
    const W=Math.max(1,Math.round(w*sc)),H=Math.max(1,Math.round(h*sc));
    let type=S.fmt==="same"?(EXT[it.file.type]&&can(it.file.type)?it.file.type:"image/png"):S.fmt;
    const cv=document.createElement("canvas");cv.width=W;cv.height=H;const x=cv.getContext("2d");
    if(type==="image/jpeg"){x.fillStyle="#fff";x.fillRect(0,0,W,H)}
    x.imageSmoothingQuality="high";x.drawImage(it.bmp,0,0,W,H);
    const blob=await new Promise(r=>cv.toBlob(r,type,S.q/100));
    it.w=w;it.h=h;it.W=W;it.H=H;
    const sameShape=sc===1&&type===it.file.type;
    if(sameShape&&blob.size>=it.file.size){it.out=it.file;it.kept=true}else{it.out=blob;it.kept=false}
    it.type=it.out.type||type;it.err=false;
  }catch(e){it.err=true}
  it.busy=false;
}
function outName(it){const base=it.file.name.replace(/\.[^.]+$/,"")||"image";return it.kept?it.file.name:`${base}.${EXT[it.type]||"img"}`}

function renderList(){
  const t=T[S.lang],ready=S.items.filter(i=>i.out&&!i.err);
  $("summary").hidden=!S.items.length;
  const a=ready.reduce((s,i)=>s+i.file.size,0),b=ready.reduce((s,i)=>s+i.out.size,0);
  $("total").textContent=ready.length?t.saved(kb(a),kb(b),Math.max(0,Math.round((1-b/a)*100))+"%"):t.working;
  $("zip").disabled=!ready.length||ready.length!==S.items.length;
  $("list").innerHTML=S.items.map((it,i)=>{
    if(it.err)return `<li class="item"><img src="${it.thumb}" alt=""><div><div class="name">${esc(it.file.name)}</div><div class="note">${t.fail}</div></div><div class="side"></div></li>`;
    const done=it.out&&!it.busy,p=done?Math.round((1-it.out.size/it.file.size)*100):0;
    return `<li class="item${done&&p<0?" grew":""}"><img src="${it.thumb}" alt=""><div style="min-width:0"><div class="name" title="${esc(it.file.name)}">${esc(done?outName(it):it.file.name)}</div>
      <div class="nums"><span>${kb(it.file.size)} → <b>${done?kb(it.out.size):"…"}</b></span>${done?`<span>${it.w}×${it.h}${it.W!==it.w?` → <b>${it.W}×${it.H}</b>`:""}</span>`:""}</div>
      <div class="bar"><i style="width:${done?Math.min(100,Math.max(2,100-Math.max(0,p))):0}%"></i></div>${done&&it.kept?`<div class="note">${t.kept}</div>`:""}</div>
      <div class="side"><span class="pct${p>0?" good":""}">${done?(p>0?"−"+p:"+"+(-p))+"%":""}</span><button class="btn" type="button" data-dl="${i}"${done?"":" disabled"}>${t.dl}</button></div></li>`;
  }).join("");
}

function addFiles(files){
  const imgs=[...files].filter(f=>f.type.startsWith("image/"));if(!imgs.length)return;
  for(const f of imgs)S.items.push({file:f,thumb:URL.createObjectURL(f)});
  renderList();processAll();
}
function save(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}

function sample(){
  const c=document.createElement("canvas");c.width=3000;c.height=2000;const x=c.getContext("2d");
  const g=x.createLinearGradient(0,0,0,2000);g.addColorStop(0,"#7fa7d9");g.addColorStop(.55,"#f3c98b");g.addColorStop(.56,"#2f4a5c");g.addColorStop(1,"#14202b");x.fillStyle=g;x.fillRect(0,0,3000,2000);
  x.fillStyle="#fff3d6";x.beginPath();x.arc(2100,1000,180,0,7);x.fill();
  for(let i=0;i<9000;i++){x.fillStyle=`rgba(255,255,255,${Math.random()*.12})`;x.fillRect(Math.random()*3000,1110+Math.random()*890,Math.random()*60,2)}
  for(let i=0;i<14;i++){x.fillStyle=`hsl(210,25%,${8+i}%)`;const w=120+Math.random()*160,h=200+Math.random()*500,X=i*220;x.fillRect(X,1110-h,w,h)}
  c.toBlob(b=>addFiles([new File([b],"sample-skyline.png",{type:"image/png"})]),"image/png");
}

$("fmt").addEventListener("change",e=>{S.fmt=e.target.value;store.set("fmt",S.fmt);processAll()});
$("max").addEventListener("change",e=>{S.max=+e.target.value;store.set("max",S.max);processAll()});
let qt;$("q").addEventListener("input",e=>{S.q=+e.target.value;$("qv").textContent=S.q;store.set("q",S.q);clearTimeout(qt);qt=setTimeout(processAll,250)});
$("file").addEventListener("change",e=>{addFiles(e.target.files);e.target.value=""});
const drop=$("drop");
["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("over")}));
["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("over")}));
drop.addEventListener("drop",e=>addFiles(e.dataTransfer.files));
document.addEventListener("paste",e=>addFiles([...e.clipboardData.items].filter(i=>i.kind==="file").map(i=>i.getAsFile())));
$("sample").addEventListener("click",sample);
$("list").addEventListener("click",e=>{const b=e.target.closest("[data-dl]");if(!b)return;const it=S.items[+b.dataset.dl];save(it.out,outName(it))});
$("clear").addEventListener("click",()=>{job++;S.items.forEach(i=>{URL.revokeObjectURL(i.thumb);i.bmp?.close?.()});S.items=[];renderList()});
$("zip").addEventListener("click",async()=>{
  const z=new JSZip(),used=new Set();
  for(const it of S.items){if(!it.out)continue;let n=outName(it),k=1;while(used.has(n))n=outName(it).replace(/(\.\w+)$/,`-${k++}$1`);used.add(n);z.file(n,it.out)}
  save(await z.generateAsync({type:"blob"}),"lightened.zip");
});
renderStatic();
