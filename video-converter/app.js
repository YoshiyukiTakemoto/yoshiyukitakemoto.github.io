// Video converter built on ffmpeg.wasm (single-threaded core, loaded from jsDelivr on first use). Files never leave the browser.
const LANG=document.documentElement.lang==="ja"?"ja":"en";
const $=id=>document.getElementById(id);
const PK=window.PK;
const CORE="https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/";
const T={
en:{dt:"Drop a video here",ds:"MP4, MOV, WMV, AVI, MKV, WebM, FLV, M4V, 3GP, MPEG and more. Your video is converted on your device and never uploaded.",db:"Choose a video",
 to:"Convert to",quality:"Quality",res:"Resolution",fps:"GIF frame rate",gw:"GIF width (px)",ss:"Start (m:ss)",tot:"End (m:ss)",mute:"Remove audio",copy:"Skip re-encoding when possible (fast, no quality loss)",
 run:"Convert",cancel:"Cancel",other:"Choose another file",dl:"Download",
 q:{high:"High",std:"Standard",small:"Small file"},r:{0:"Original",1080:"1080p",720:"720p",480:"480p",360:"360p"},
 fmt:{mp4:"MP4 (H.264)",mov:"MOV (H.264)",webm:"WebM (VP8)",wmv:"WMV (Windows Media)",gif:"GIF animation",mp3:"MP3 (audio only)",m4a:"M4A / AAC (audio only)",wav:"WAV (audio only)"},
 loading:p=>`Loading the converter (about 31 MB, first time only)… ${p}%`,reading:"Reading the file…",working:(p,e)=>`Converting… ${p}% · ${e}s`,copying:"Copying streams (no re-encoding)…",
 done:(a,b,s)=>`Done in ${s}s · ${a} → ${b}`,fail:"Conversion failed. The file may be damaged, copy-protected (DRM), or too large for the browser’s memory.",loadFail:"Couldn’t load the converter. Check your connection and try again.",
 big:"Large files (over 500 MB) may fail in the browser.",noprev:"Your browser can’t preview this format, but the file is ready to download.",unknown:"unknown"},
ja:{dt:"ここに動画をドロップ",ds:"MP4、MOV、WMV、AVI、MKV、WebM、FLV、M4V、3GP、MPEGなどに対応。動画は端末内で変換され、アップロードされません。",db:"動画を選ぶ",
 to:"変換後の形式",quality:"画質",res:"解像度",fps:"GIFのフレームレート",gw:"GIFの幅（px）",ss:"開始（分:秒）",tot:"終了（分:秒）",mute:"音声を消す",copy:"可能なら再エンコードしない（高速・劣化なし）",
 run:"変換する",cancel:"中止",other:"別のファイルを選ぶ",dl:"保存",
 q:{high:"高画質",std:"標準",small:"小さいファイル"},r:{0:"元のまま",1080:"1080p",720:"720p",480:"480p",360:"360p"},
 fmt:{mp4:"MP4（H.264）",mov:"MOV（H.264）",webm:"WebM（VP8）",wmv:"WMV（Windows Media）",gif:"GIFアニメ",mp3:"MP3（音声のみ）",m4a:"M4A / AAC（音声のみ）",wav:"WAV（音声のみ）"},
 loading:p=>`変換プログラムを読み込み中（約31MB・初回のみ）… ${p}%`,reading:"ファイルを読み込み中…",working:(p,e)=>`変換中… ${p}%・${e}秒`,copying:"再エンコードせずにコピー中…",
 done:(a,b,s)=>`完了（${s}秒）・${a} → ${b}`,fail:"変換できませんでした。ファイルが壊れている、コピー保護（DRM）付き、またはブラウザのメモリに対して大きすぎる可能性があります。",loadFail:"変換プログラムを読み込めませんでした。通信状況を確認して、もう一度お試しください。",
 big:"500MBを超えるファイルは、ブラウザでは変換に失敗することがあります。",noprev:"この形式はブラウザでプレビューできませんが、保存はできます。",unknown:"不明"}
}[LANG];
const AUDIO=new Set(["mp3","m4a","wav"]);
const MIME={mp4:"video/mp4",mov:"video/quicktime",webm:"video/webm",wmv:"video/x-ms-wmv",gif:"image/gif",mp3:"audio/mpeg",m4a:"audio/mp4",wav:"audio/wav"};
const preset=JSON.parse($("vc").dataset.preset||"{}");
let ff=null,file=null,info=null,outURL=null,busy=false;
const kb=n=>n<1048576?(n/1024).toFixed(0)+" KB":(n/1048576).toFixed(1)+" MB";
const tsec=s=>{if(!s)return 0;s=String(s).trim();if(!s)return 0;const p=s.split(":").map(Number);if(p.some(isNaN))return NaN;return p.reduce((a,b)=>a*60+b,0)};
const clock=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;
function prog(p,text){$("prog").hidden=false;$("bar").style.width=Math.max(0,Math.min(100,p))+"%";$("ptext").textContent=text}
function err(m){$("err").hidden=!m;$("err").textContent=m||""}

// Fetch a file as a blob URL, reporting download progress.
async function blobURL(url,type,onp){const r=await fetch(url);const total=+r.headers.get("content-length")||0;
  if(!r.body||!total){return URL.createObjectURL(new Blob([await r.arrayBuffer()],{type}))}
  const rd=r.body.getReader(),chunks=[];let got=0;for(;;){const{done,value}=await rd.read();if(done)break;chunks.push(value);got+=value.length;onp&&onp(got/total)}
  return URL.createObjectURL(new Blob(chunks,{type}))}
async function load(){
  if(ff)return ff;const f=new FFmpegWASM.FFmpeg();
  prog(0,T.loading(0));
  const js=await blobURL(CORE+"ffmpeg-core.js","text/javascript"),wasm=await blobURL(CORE+"ffmpeg-core.wasm","application/wasm",p=>prog(p*100,T.loading(Math.round(p*100))));
  await f.load({coreURL:js,wasmURL:wasm});ff=f;return ff;
}
// Read duration, size and codecs from ffmpeg's own report on the input.
async function probe(name){const lines=[];const h=e=>lines.push(e.message);ff.on("log",h);try{await ff.exec(["-hide_banner","-i",name])}catch(e){}ff.off("log",h);
  const all=lines.join("\n"),d=all.match(/Duration: (\d+):(\d+):([\d.]+)/),v=all.match(/Video: (\w+)[^\n]*?, (\d{2,5})x(\d{2,5})/),a=all.match(/Audio: (\w+)/);
  return{dur:d?+d[1]*3600+ +d[2]*60+ +d[3]:0,vcodec:v?v[1]:"",w:v?+v[2]:0,h:v?+v[3]:0,acodec:a?a[1]:""}}
async function pick(f){
  if(!f||busy)return;file=f;err("");$("result").hidden=true;$("work").hidden=false;$("drop").hidden=true;busy=true;setUI();
  $("info").innerHTML=`<b>${f.name.replace(/</g,"&lt;")}</b><span>${kb(f.size)}</span>`;if(f.size>500*1048576)err(T.big);
  try{await load()}catch(e){busy=false;setUI();err(T.loadFail);$("prog").hidden=true;return}
  prog(100,T.reading);
  try{await ff.writeFile("in",new Uint8Array(await f.arrayBuffer()));info=await probe("in")}catch(e){info={dur:0}}
  $("prog").hidden=true;busy=false;setUI();
  $("info").innerHTML=`<b>${f.name.replace(/</g,"&lt;")}</b><span>${kb(f.size)}</span>${info.dur?`<span>${clock(info.dur)}</span>`:""}${info.w?`<span>${info.w}×${info.h}</span>`:""}${info.vcodec?`<span>${info.vcodec}${info.acodec?" / "+info.acodec:""}</span>`:info.acodec?`<span>${info.acodec}</span>`:""}`;
  $("to-t").placeholder=info.dur?clock(info.dur):"";
}
function canCopy(to){return $("copy").checked&&(to==="mp4"||to==="mov")&&info&&info.vcodec==="h264"&&(!info.acodec||["aac","mp3"].includes(info.acodec)||$("mute").checked)&&+$("res").value===0}
function args(to){
  const q={high:{crf:20,vb:"5M",ab:"192k",vpx:16,mq:0},std:{crf:26,vb:"2.5M",ab:"128k",vpx:28,mq:2},small:{crf:32,vb:"1M",ab:"96k",vpx:40,mq:5}}[$("quality").value];
  const ss=tsec($("ss").value),te=tsec($("to-t").value),a=[];
  if(ss>0)a.push("-ss",String(ss));a.push("-i","in");if(te>ss)a.push("-t",String(te-ss));
  const H=+$("res").value,vf=H&&info.h&&H<info.h?[`scale=-2:${H}`]:[];const mute=$("mute").checked;
  if(to==="mp4"||to==="mov"){
    if(canCopy(to))a.push("-c:v","copy",...(mute?["-an"]:["-c:a","copy"]));
    else a.push("-c:v","libx264","-preset","veryfast","-crf",String(q.crf),"-pix_fmt","yuv420p",...(vf.length?["-vf",vf.join(",")]:[]),...(mute?["-an"]:["-c:a","aac","-b:a",q.ab]));
    if(to==="mp4")a.push("-movflags","+faststart");}
  else if(to==="webm")a.push("-c:v","libvpx","-crf",String(q.vpx),"-b:v",q.vb,"-deadline","realtime","-cpu-used","8",...(vf.length?["-vf",vf.join(",")]:[]),...(mute?["-an"]:["-c:a","libvorbis","-q:a","4"]));
  else if(to==="wmv")a.push("-c:v","wmv2","-b:v",q.vb,...(vf.length?["-vf",vf.join(",")]:[]),...(mute?["-an"]:["-c:a","wmav2","-b:a",q.ab]));
  else if(to==="gif")a.push("-vf",`fps=${$("fps").value},scale=${$("gw").value}:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse`,"-loop","0");
  else if(to==="mp3")a.push("-vn","-c:a","libmp3lame","-q:a",String(q.mq));
  else if(to==="m4a")a.push("-vn","-c:a","aac","-b:a",q.ab==="96k"?"128k":"192k");
  else if(to==="wav")a.push("-vn","-c:a","pcm_s16le");
  a.push("out."+to);return a;
}
async function run(){
  if(!ff||!info||busy)return;const to=$("to").value,ss=tsec($("ss").value),te=tsec($("to-t").value);if(isNaN(ss)||isNaN(te))return;
  busy=true;setUI();err("");$("result").hidden=true;const t0=performance.now(),span=(te>ss?te:info.dur)-ss||info.dur;
  const copy=canCopy(to);prog(0,copy?T.copying:T.working(0,0));
  const onp=({time})=>{const p=span>0?time/1e6/span*100:0;prog(p,T.working(Math.min(99,Math.round(p)),Math.round((performance.now()-t0)/1000)))};ff.on("progress",onp);
  let rc=1;try{rc=await ff.exec(args(to))}catch(e){rc=1}ff.off("progress",onp);
  if(!ff){return}// cancelled
  let data=null;if(rc===0)try{data=await ff.readFile("out."+to)}catch(e){}
  try{await ff.deleteFile("out."+to)}catch(e){}
  busy=false;setUI();
  if(!data||!data.length){$("prog").hidden=true;err(T.fail);return}
  const blob=new Blob([data],{type:MIME[to]}),secs=((performance.now()-t0)/1000).toFixed(1);prog(100,T.done(kb(file.size),kb(blob.size),secs));
  if(outURL)URL.revokeObjectURL(outURL);outURL=URL.createObjectURL(blob);
  const name=(file.name.replace(/\.[^.]+$/,"")||"video")+"."+to;
  $("preview").innerHTML=to==="gif"?`<img src="${outURL}" alt="">`:AUDIO.has(to)?`<audio controls src="${outURL}"></audio>`:to==="wmv"?`<div class="noprev">${T.noprev}</div>`:`<video controls playsinline src="${outURL}"></video>`;
  const v=$("preview").querySelector("video");if(v)v.onerror=()=>{$("preview").innerHTML=`<div class="noprev">${T.noprev}</div>`};
  $("rname").textContent=name;$("rsize").textContent=kb(blob.size);$("dl").onclick=()=>saveBlob(blob,name);$("result").hidden=false;
}
function setUI(){
  const to=$("to").value,isVideo=!AUDIO.has(to)&&to!=="gif";
  document.querySelectorAll("[data-for=video]").forEach(e=>e.hidden=!isVideo);document.querySelectorAll("[data-for=gif]").forEach(e=>e.hidden=to!=="gif");
  document.querySelectorAll("[data-for=copy]").forEach(e=>e.hidden=!(to==="mp4"||to==="mov"));
  $("run").disabled=busy||!info;$("cancel").hidden=!busy||!ff;$("other").disabled=busy;
  for(const id of["to","quality","res","fps","gw","ss","to-t","mute","copy"])$(id).disabled=busy;
}
// ---- wire up ----
$("d-title").textContent=T.dt;$("d-sub").textContent=T.ds;$("d-btn").textContent=T.db;
for(const k of["to","quality","res","fps","gw","ss","tot","mute","copy"])$("l-"+k).textContent=T[k];
$("run").textContent=T.run;$("cancel").textContent=T.cancel;$("other").textContent=T.other;$("dl").textContent=T.dl;
$("to").innerHTML=Object.entries(T.fmt).map(([k,v])=>`<option value="${k}">${v}</option>`).join("");
$("quality").innerHTML=Object.entries(T.q).map(([k,v])=>`<option value="${k}"${k==="std"?" selected":""}>${v}</option>`).join("");
$("res").innerHTML=[0,1080,720,480,360].map(k=>`<option value="${k}">${T.r[k]}</option>`).join("");
$("to").value=preset.to||PK.get("vc:to","mp4");if(!$("to").value)$("to").value="mp4";
$("to").addEventListener("change",()=>{if(!preset.to)PK.set("vc:to",$("to").value);setUI()});
$("file").addEventListener("change",e=>{pick(e.target.files[0]);e.target.value=""});
const drop=$("drop");["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("over")}));
["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("over")}));
drop.addEventListener("drop",e=>pick(e.dataTransfer.files[0]));
$("run").addEventListener("click",run);
$("cancel").addEventListener("click",()=>{try{ff.terminate()}catch(e){}ff=null;info=null;busy=false;$("prog").hidden=true;$("work").hidden=true;$("drop").hidden=false;setUI()});
$("other").addEventListener("click",()=>{$("work").hidden=true;$("drop").hidden=false;$("result").hidden=true;info=null;file=null;err("");try{ff&&ff.deleteFile("in")}catch(e){}$("file").click()});
setUI();
