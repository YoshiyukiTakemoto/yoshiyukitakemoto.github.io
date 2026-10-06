const LANG=document.documentElement.lang==="ja"?"ja":"en";
const $=id=>document.getElementById(id);
const PK=window.PK;
const T={
en:{to:"Convert to",q:"Quality",pdfmode:"PDF page size",pm:{fit:"Same as image",a4:"A4, image centred"},dt:"Drop images here",ds:"HEIC (iPhone), JPEG, PNG, WebP, AVIF, GIF, BMP, SVG and ICO. Nothing is uploaded.",db:"Choose images",
 count:n=>`${n} ${n===1?"image":"images"}`,clear:"Clear",all:"Download all",allPdf:"Download as one PDF",dl:"Download",working:"Converting…",heic:"Loading the HEIC decoder (1.3 MB, first time only)…",fail:"This file couldn’t be read. If it’s HEIC, try another browser.",
 fmt:{jpg:"JPG (JPEG)",png:"PNG",webp:"WebP",avif:"AVIF",bmp:"BMP",ico:"ICO (favicon, 16–256 px)",pdf:"PDF"}},
ja:{to:"変換後の形式",q:"画質",pdfmode:"PDFのページサイズ",pm:{fit:"画像と同じ大きさ",a4:"A4（画像を中央に配置）"},dt:"ここに画像をドロップ",ds:"HEIC（iPhone）、JPEG、PNG、WebP、AVIF、GIF、BMP、SVG、ICOに対応。アップロードはされません。",db:"画像を選ぶ",
 count:n=>`${n}枚`,clear:"クリア",all:"まとめて保存",allPdf:"1つのPDFにまとめて保存",dl:"保存",working:"変換中…",heic:"HEIC読み込み用のプログラムを準備中（初回のみ1.3MB）…",fail:"このファイルは読み込めませんでした。HEICの場合は別のブラウザでお試しください。",
 fmt:{jpg:"JPG（JPEG）",png:"PNG",webp:"WebP",avif:"AVIF",bmp:"BMP",ico:"ICO（ファビコン・16〜256px）",pdf:"PDF"}}
}[LANG];
const probe=document.createElement("canvas");probe.width=probe.height=1;
const can=t=>probe.toDataURL(t).startsWith("data:"+t);
const FMTS=["jpg","png","webp","avif","bmp","ico","pdf"].filter(f=>f!=="avif"||can("image/avif")).filter(f=>f!=="webp"||can("image/webp"));
const MIME={jpg:"image/jpeg",png:"image/png",webp:"image/webp",avif:"image/avif"};
let items=[],job=0;
const esc=s=>s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const kb=n=>n<1048576?(n/1024).toFixed(n<10240?1:0)+" KB":(n/1048576).toFixed(2)+" MB";
const isHeic=f=>/hei[cf]$/i.test(f.type)||/\.hei[cf]$/i.test(f.name);

let heicReady=null;
function loadHeic(){return heicReady||(heicReady=new Promise((ok,no)=>{const s=document.createElement("script");s.src="/image-converter/heic2any.min.js";s.onload=ok;s.onerror=no;document.head.appendChild(s)}))}
async function decode(f){
  try{return await createImageBitmap(f,{imageOrientation:"from-image"})}catch(e){}
  if(isHeic(f)){$("count").textContent=T.heic;await loadHeic();const b=await heic2any({blob:f,toType:"image/png"});return createImageBitmap(Array.isArray(b)?b[0]:b)}
  // SVG and some ICO files only decode through an <img> element.
  return new Promise((ok,no)=>{const u=URL.createObjectURL(f),im=new Image();im.onload=()=>{const w=im.naturalWidth||512,h=im.naturalHeight||512,c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(im,0,0,w,h);URL.revokeObjectURL(u);ok(c)};im.onerror=()=>{URL.revokeObjectURL(u);no(new Error("decode"))};im.src=u});
}
function canvasOf(src,w,h,bg){const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");if(bg){x.fillStyle=bg;x.fillRect(0,0,w,h)}x.imageSmoothingQuality="high";x.drawImage(src,0,0,w,h);return c}
const blobOf=(c,type,q)=>new Promise(r=>c.toBlob(r,type,q));
function bmp(c){
  const w=c.width,h=c.height,d=c.getContext("2d").getImageData(0,0,w,h).data,row=Math.ceil(w*3/4)*4,size=54+row*h,b=new DataView(new ArrayBuffer(size));
  b.setUint16(0,0x424d);b.setUint32(2,size,true);b.setUint32(10,54,true);b.setUint32(14,40,true);b.setInt32(18,w,true);b.setInt32(22,h,true);b.setUint16(26,1,true);b.setUint16(28,24,true);b.setUint32(34,row*h,true);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const s=((h-1-y)*w+x)*4,o=54+y*row+x*3;b.setUint8(o,d[s+2]);b.setUint8(o+1,d[s+1]);b.setUint8(o+2,d[s])}
  return new Blob([b.buffer],{type:"image/bmp"});
}
async function ico(src,w,h){
  const sizes=[16,32,48,64,128,256],pngs=[];
  for(const s of sizes){const c=document.createElement("canvas");c.width=c.height=s;const x=c.getContext("2d"),k=Math.min(s/w,s/h);x.imageSmoothingQuality="high";x.drawImage(src,(s-w*k)/2,(s-h*k)/2,w*k,h*k);pngs.push(new Uint8Array(await (await blobOf(c,"image/png")).arrayBuffer()))}
  const head=new DataView(new ArrayBuffer(6+16*sizes.length));head.setUint16(2,1,true);head.setUint16(4,sizes.length,true);let off=head.byteLength;
  sizes.forEach((s,i)=>{const e=6+i*16;head.setUint8(e,s===256?0:s);head.setUint8(e+1,s===256?0:s);head.setUint16(e+4,1,true);head.setUint16(e+6,32,true);head.setUint32(e+8,pngs[i].length,true);head.setUint32(e+12,off,true);off+=pngs[i].length});
  return new Blob([head.buffer,...pngs],{type:"image/x-icon"});
}
async function pdfPage(src,w,h){
  if($("pdfmode").value==="a4"){const W=1240,H=1754,m=60,k=Math.min((W-2*m)/w,(H-2*m)/h),c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,W,H);x.imageSmoothingQuality="high";x.drawImage(src,(W-w*k)/2,(H-h*k)/2,w*k,h*k);return{jpeg:await canvasJPEG(c,+$("q").value/100),w:W,h:H,pw:595.28,ph:841.89}}
  const c=canvasOf(src,w,h,"#fff");return{jpeg:await canvasJPEG(c,+$("q").value/100),w,h,pw:w*.75,ph:h*.75};
}
async function convert(it){
  const to=$("to").value,q=+$("q").value/100;it.busy=true;
  try{
    if(!it.src)it.src=await decode(it.file);
    const w=it.src.width,h=it.src.height;it.w=w;it.h=h;
    if(to==="ico")it.out=await ico(it.src,w,h);
    else if(to==="bmp")it.out=bmp(canvasOf(it.src,w,h,"#fff"));
    else if(to==="pdf"){it.page=await pdfPage(it.src,w,h);it.out=miniPDF([it.page])}
    else it.out=await blobOf(canvasOf(it.src,w,h,to==="jpg"?"#fff":null),MIME[to],to==="png"?undefined:q);
    it.ext=to;it.err=false;
  }catch(e){it.err=true}
  it.busy=false;
}
async function convertAll(){const my=++job;render();for(const it of items){if(my!==job)return;await convert(it);render()}}
const outName=it=>(it.file.name.replace(/\.[^.]+$/,"")||"image")+"."+it.ext;
function render(){
  $("summary").hidden=!items.length;$("count").textContent=T.count(items.length);
  $("all").textContent=$("to").value==="pdf"?T.allPdf:T.all;$("all").disabled=items.some(i=>i.busy||!i.out&&!i.err);
  $("list").innerHTML=items.map((it,i)=>`<li class="item"><img src="${it.thumb}" alt=""><div style="min-width:0"><div class="name">${esc(it.out&&!it.busy?outName(it):it.file.name)}</div>${it.err?`<div class="err">${T.fail}</div>`:`<div class="nums">${kb(it.file.size)} → ${it.out&&!it.busy?kb(it.out.size):T.working}${it.w?` · ${it.w}×${it.h}`:""}</div>`}</div><button class="btn" type="button" data-dl="${i}"${it.out&&!it.busy?"":" disabled"}>${T.dl}</button></li>`).join("");
}
function add(files){
  const fs=[...files].filter(f=>f&&(f.type.startsWith("image/")||isHeic(f)||/\.(ico|svg)$/i.test(f.name)));if(!fs.length)return;
  for(const f of fs)items.push({file:f,thumb:isHeic(f)?"/icon-192.png":URL.createObjectURL(f)});convertAll();
}
$("to").innerHTML=FMTS.map(f=>`<option value="${f}">${T.fmt[f]}</option>`).join("");$("to").value=PK.get("ic:to","jpg");if(!$("to").value)$("to").value="jpg";
$("pdfmode").innerHTML=Object.entries(T.pm).map(([k,v])=>`<option value="${k}">${v}</option>`).join("");
for(const k of["to","q","pdfmode"])$("l-"+k).textContent=T[k];
$("d-title").textContent=T.dt;$("d-sub").textContent=T.ds;$("d-btn").textContent=T.db;$("clear").textContent=T.clear;
const sync=()=>{const to=$("to").value;$("q-f").hidden=!["jpg","webp","avif","pdf"].includes(to);$("pdf-f").hidden=to!=="pdf";PK.set("ic:to",to)};
$("to").addEventListener("change",()=>{sync();convertAll()});$("pdfmode").addEventListener("change",convertAll);
let qt;$("q").addEventListener("input",()=>{$("qv").textContent=$("q").value;clearTimeout(qt);qt=setTimeout(convertAll,300)});
$("file").addEventListener("change",e=>{add(e.target.files);e.target.value=""});
const drop=$("drop");["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("over")}));
["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("over")}));
drop.addEventListener("drop",e=>add(e.dataTransfer.files));
document.addEventListener("paste",e=>add([...e.clipboardData.items].filter(i=>i.kind==="file").map(i=>i.getAsFile())));
$("list").addEventListener("click",e=>{const b=e.target.closest("[data-dl]");if(b){const it=items[+b.dataset.dl];saveBlob(it.out,outName(it))}});
$("clear").addEventListener("click",()=>{job++;items.forEach(i=>i.thumb.startsWith("blob:")&&URL.revokeObjectURL(i.thumb));items=[];render()});
$("all").addEventListener("click",async()=>{
  const ok=items.filter(i=>i.out&&!i.err);if(!ok.length)return;
  if($("to").value==="pdf"){saveBlob(miniPDF(ok.map(i=>i.page)),"images.pdf");return}
  if(ok.length===1){saveBlob(ok[0].out,outName(ok[0]));return}
  const z=new JSZip(),used=new Set();for(const it of ok){let n=outName(it),k=1;while(used.has(n))n=outName(it).replace(/(\.\w+)$/,`-${k++}$1`);used.add(n);z.file(n,it.out)}
  saveBlob(await z.generateAsync({type:"blob"}),"converted.zip");
});
sync();render();
