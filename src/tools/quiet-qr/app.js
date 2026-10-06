qrcode.stringToBytes=s=>Array.from(new TextEncoder().encode(s));

const T={
en:{tag:"QR codes that never expire. No tracking, no sign-up, and nothing leaves your browser.",
 types:{url:"Link",text:"Text",wifi:"Wi‑Fi",vcard:"Contact",email:"Email",tel:"Phone",sms:"SMS"},
 f:{url:"Web address",text:"Text",ssid:"Network name (SSID)",password:"Password",enc:"Security",hidden:"Hidden network",first:"First name",last:"Last name",org:"Company",title:"Job title",phone:"Phone",email:"Email",site:"Website",address:"Address",to:"Email address",subject:"Subject",body:"Message",number:"Phone number",msg:"Message"},
 none:"None",ecl:"Error correction",eclv:{L:"Low · 7%",M:"Medium · 15%",Q:"High · 25%",H:"Max · 30%"},size:"PNG size",margin:"Quiet zone",modules:"modules",colors:"Colours",transparent:"Transparent",
 png:"Download PNG",svg:"Download SVG",copy:"Copy image",copied:"Copied to clipboard",copyFail:"Your browser can’t copy images. Use Download PNG.",payload:"Encoded data",
 empty:"Type something to make a code.",tooLong:"Too much data for one QR code. Shorten the text.",
 lowContrast:"Low contrast. Some phones may fail to scan this code. Use a darker foreground or a lighter background.",inverted:"Light code on a dark background. Many scanners can’t read inverted codes.",
 ver:(v,n,b)=>`Version ${v} · ${n}×${n} · ${b} bytes`,
 facts:[["Works forever","The data is inside the image itself. There is no redirect server that can expire, add ads or start charging."],["Private by design","Codes are made in your browser. Wi‑Fi passwords and contact details are never sent anywhere."],["Print-ready","SVG stays sharp at any size. Keep the quiet zone and at least 2 cm width for printed codes."]],
 foot:"Free and open source. No cookies, no analytics."},
ja:{tag:"期限切れにならないQRコードを作成。トラッキングなし・登録不要・データはブラウザの外に出ません。",
 types:{url:"URL",text:"テキスト",wifi:"Wi‑Fi",vcard:"連絡先",email:"メール",tel:"電話",sms:"SMS"},
 f:{url:"URL",text:"テキスト",ssid:"ネットワーク名（SSID）",password:"パスワード",enc:"セキュリティ",hidden:"非公開ネットワーク",first:"名",last:"姓",org:"会社名",title:"役職",phone:"電話番号",email:"メール",site:"ウェブサイト",address:"住所",to:"宛先メールアドレス",subject:"件名",body:"本文",number:"電話番号",msg:"メッセージ"},
 none:"なし",ecl:"誤り訂正レベル",eclv:{L:"L・7%",M:"M・15%",Q:"Q・25%",H:"H・30%"},size:"PNGサイズ",margin:"余白",modules:"セル",colors:"色",transparent:"背景を透明に",
 png:"PNGを保存",svg:"SVGを保存",copy:"画像をコピー",copied:"クリップボードにコピーしました",copyFail:"このブラウザでは画像をコピーできません。PNGを保存してください。",payload:"埋め込まれるデータ",
 empty:"内容を入力するとコードが表示されます。",tooLong:"データが多すぎて1つのQRコードに入りません。短くしてください。",
 lowContrast:"コントラストが低く、読み取れない端末があります。前景を濃く、または背景を明るくしてください。",inverted:"暗い背景に明るいコードです。反転コードを読めないスキャナが多くあります。",
 ver:(v,n,b)=>`バージョン ${v}・${n}×${n}・${b} バイト`,
 facts:[["ずっと使える","データは画像そのものに入っています。リダイレクト用サーバーがないので、期限切れ・広告挿入・有料化がありません。"],["プライバシー重視","コードはブラウザ内で作成されます。Wi‑Fiのパスワードや連絡先はどこにも送信されません。"],["印刷にも対応","SVGはどのサイズでも鮮明です。印刷するときは余白を残し、幅2cm以上にしてください。"]],
 foot:"無料・オープンソース。Cookieもアクセス解析もありません。"}
};
const FIELDS={
 url:[["url","url","wide"]],
 text:[["text","area","wide"]],
 wifi:[["ssid","text"],["password","text"],["enc","enc"],["hidden","check"]],
 vcard:[["first","text"],["last","text"],["phone","tel"],["email","email"],["org","text"],["title","text"],["site","url","wide"],["address","text","wide"]],
 email:[["to","email","wide"],["subject","text","wide"],["body","area","wide"]],
 tel:[["number","tel","wide"]],
 sms:[["number","tel","wide"],["msg","area","wide"]]
};
const store={get(k){try{return JSON.parse(localStorage.getItem("qq:"+k))}catch(e){return null}},set(k,v){try{localStorage.setItem("qq:"+k,JSON.stringify(v))}catch(e){}}};
const S={lang:document.documentElement.lang==="ja"?"ja":"en",type:"url",
 v:{url:"https://yoshiyukitakemoto.github.io/",enc:"WPA"},ecl:"M",size:1024,margin:4,fg:"#141a2b",bg:"#ffffff",transparent:false};
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let qr=null;

function payload(){
  const v=k=>(S.v[k]||"").trim();
  const wesc=s=>s.replace(/([\\;,:"])/g,"\\$1");
  const vesc=s=>s.replace(/([\\;,])/g,"\\$1").replace(/\n/g,"\\n");
  switch(S.type){
   case"url":{let u=v("url");if(u&&!/^[a-z][a-z0-9+.-]*:/i.test(u))u="https://"+u;return u}
   case"text":return S.v.text||"";
   case"wifi":if(!v("ssid"))return"";return `WIFI:T:${S.v.enc==="nopass"?"nopass":S.v.enc};S:${wesc(v("ssid"))};${S.v.enc!=="nopass"?`P:${wesc(S.v.password||"")};`:""}${S.v.hidden?"H:true;":""};`;
   case"vcard":{if(!v("first")&&!v("last")&&!v("org"))return"";const L=["BEGIN:VCARD","VERSION:3.0",`N:${vesc(v("last"))};${vesc(v("first"))};;;`,`FN:${vesc([v("first"),v("last")].filter(Boolean).join(" ")||v("org"))}`];
     if(v("org"))L.push("ORG:"+vesc(v("org")));if(v("title"))L.push("TITLE:"+vesc(v("title")));if(v("phone"))L.push("TEL;TYPE=CELL:"+v("phone"));if(v("email"))L.push("EMAIL:"+v("email"));if(v("site"))L.push("URL:"+v("site"));if(v("address"))L.push("ADR:;;"+vesc(v("address"))+";;;;");L.push("END:VCARD");return L.join("\n")}
   case"email":{if(!v("to"))return"";const q=[];if(v("subject"))q.push("subject="+encodeURIComponent(v("subject")));if(v("body"))q.push("body="+encodeURIComponent(S.v.body));return `mailto:${v("to")}${q.length?"?"+q.join("&"):""}`}
   case"tel":return v("number")?"tel:"+v("number").replace(/[^\d+]/g,""):"";
   case"sms":return v("number")?`SMSTO:${v("number").replace(/[^\d+]/g,"")}:${S.v.msg||""}`:"";
  }
}

function lum(hex){const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(x=>x<=.03928?x/12.92:((x+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]}

function svgString(withBg){
  const n=qr.getModuleCount(),m=S.margin,W=n+2*m;let d="";
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(qr.isDark(r,c))d+=`M${c+m},${r+m}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" shape-rendering="crispEdges">${withBg&&!S.transparent?`<rect width="${W}" height="${W}" fill="${S.bg}"/>`:""}<path fill="${S.fg}" d="${d}"/></svg>`;
}

function renderStatic(){
  const t=T[S.lang];
  $("types").innerHTML=Object.keys(FIELDS).map(k=>`<button type="button" data-type="${k}" aria-pressed="${k===S.type}">${t.types[k]}</button>`).join("");
  $("l-ecl").textContent=t.ecl;$("l-size").textContent=t.size;$("l-margin").textContent=t.margin;$("l-colors").textContent=t.colors;$("l-transparent").textContent=t.transparent;
  $("ecl").innerHTML=["L","M","Q","H"].map(k=>`<option value="${k}"${k===S.ecl?" selected":""}>${t.eclv[k]}</option>`).join("");
  $("size").innerHTML=[256,512,1024,2048,4096].map(s=>`<option value="${s}"${s===S.size?" selected":""}>${s} px</option>`).join("");
  $("margin").innerHTML=[0,1,2,4,6].map(s=>`<option value="${s}"${s===S.margin?" selected":""}>${s} ${t.modules}</option>`).join("");
  $("dl-png").textContent=t.png;$("dl-svg").textContent=t.svg;$("copy-img").textContent=t.copy;$("l-payload").textContent=t.payload;
  renderFields();
}
function renderFields(){
  const t=T[S.lang];
  $("fields").innerHTML=FIELDS[S.type].map(([k,kind,cls])=>{
    const id="f-"+k,val=esc(S.v[k]||"");
    if(kind==="check")return `<label class="check ${cls||""}"><input type="checkbox" id="${id}" data-k="${k}"${S.v[k]?" checked":""}>${t.f[k]}</label>`;
    let ctl;
    if(kind==="area")ctl=`<textarea id="${id}" data-k="${k}">${val}</textarea>`;
    else if(kind==="enc")ctl=`<select id="${id}" data-k="${k}">${[["WPA","WPA/WPA2/WPA3"],["WEP","WEP"],["nopass",t.none]].map(([v,l])=>`<option value="${v}"${S.v.enc===v?" selected":""}>${l}</option>`).join("")}</select>`;
    else ctl=`<input id="${id}" data-k="${k}" type="${kind}" value="${val}" autocomplete="off"${kind==="url"?' placeholder="https://"':""}>`;
    return `<div class="field ${cls||""}"><label for="${id}">${t.f[k]}</label>${ctl}</div>`;
  }).join("");
  render();
}
function render(){
  const t=T[S.lang],data=payload();
  $("payload").textContent=data||"—";qr=null;
  const btns=["dl-png","dl-svg","copy-img"].map($);
  if(!data){$("stage").innerHTML=`<p class="err">${t.empty}</p>`;$("meta").textContent="";$("warn").hidden=true;btns.forEach(b=>b.disabled=true);return}
  try{qr=qrcode(0,S.ecl);qr.addData(data,"Byte");qr.make()}catch(e){qr=null}
  if(!qr){$("stage").innerHTML=`<p class="err">${t.tooLong}</p>`;$("meta").textContent="";$("warn").hidden=true;btns.forEach(b=>b.disabled=true);return}
  btns.forEach(b=>b.disabled=false);
  $("stage").innerHTML=svgString(true);
  const n=qr.getModuleCount();$("meta").textContent=t.ver((n-17)/4,n,new TextEncoder().encode(data).length);
  const lf=lum(S.fg),lb=S.transparent?1:lum(S.bg),ratio=(Math.max(lf,lb)+.05)/(Math.min(lf,lb)+.05);
  const w=lf>lb&&!S.transparent?t.inverted:ratio<4?t.lowContrast:"";
  $("warn").textContent=w;$("warn").hidden=!w;
}

function canvas(){
  const n=qr.getModuleCount(),W=n+2*S.margin,px=S.size,cv=document.createElement("canvas");cv.width=cv.height=px;
  const x=cv.getContext("2d"),s=px/W;
  if(!S.transparent){x.fillStyle=S.bg;x.fillRect(0,0,px,px)}
  x.fillStyle=S.fg;
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(qr.isDark(r,c)){const x0=Math.round((c+S.margin)*s),y0=Math.round((r+S.margin)*s);x.fillRect(x0,y0,Math.round((c+S.margin+1)*s)-x0,Math.round((r+S.margin+1)*s)-y0)}
  return cv;
}
function save(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
const fname=ext=>`qr-${S.type}.${ext}`;

$("types").addEventListener("click",e=>{const b=e.target.closest("[data-type]");if(!b)return;S.type=b.dataset.type;document.querySelectorAll("#types button").forEach(x=>x.setAttribute("aria-pressed",x===b));renderFields()});
$("fields").addEventListener("input",e=>{const k=e.target.dataset.k;if(!k)return;S.v[k]=e.target.type==="checkbox"?e.target.checked:e.target.value;render()});
for(const id of["ecl","size","margin"])$(id).addEventListener("change",e=>{S[id]=id==="ecl"?e.target.value:+e.target.value;render()});
for(const id of["fg","bg"])$(id).addEventListener("input",e=>{S[id]=e.target.value;render()});
$("transparent").addEventListener("change",e=>{S.transparent=e.target.checked;render()});
$("dl-svg").addEventListener("click",()=>qr&&save(new Blob([svgString(true)],{type:"image/svg+xml"}),fname("svg")));
$("dl-png").addEventListener("click",()=>qr&&canvas().toBlob(b=>save(b,fname("png")),"image/png"));
$("copy-img").addEventListener("click",()=>{
  if(!qr)return;const t=T[S.lang],b=$("copy-img");
  const done=m=>{b.textContent=m;setTimeout(()=>b.textContent=t.copy,2200)};
  try{const p=new Promise(r=>canvas().toBlob(r,"image/png"));navigator.clipboard.write([new ClipboardItem({"image/png":p})]).then(()=>done(t.copied),()=>done(t.copyFail))}catch(e){done(t.copyFail)}
});
renderStatic();
