const LANG=document.documentElement.lang==="ja"?"ja":"en";
const $=id=>document.getElementById(id);
const PK=window.PK;
// Presets: [id, ja label, en label, 表書き, 水引 knot, colour, show noshi mark]
const USES=[
 ["kekkon","結婚祝い","Wedding gift","寿","awaji","kinbeni",1],
 ["kekkon2","結婚祝い（御結婚御祝）","Wedding gift (formal)","御結婚御祝","musubi","kohaku",1],
 ["shussan","出産祝い","Birth of a baby","御出産御祝","cho","kohaku",1],
 ["oiwai","お祝い全般","General celebration","御祝","cho","kohaku",1],
 ["uchi","内祝い（お返し）","Return gift (uchi-iwai)","内祝","cho","kohaku",1],
 ["orei","お礼","Thank-you gift","御礼","cho","kohaku",1],
 ["chugen","お中元","Summer gift (ochūgen)","御中元","cho","kohaku",1],
 ["seibo","お歳暮","Year-end gift (oseibo)","御歳暮","cho","kohaku",1],
 ["nenga","お年賀","New Year gift","御年賀","cho","kohaku",1],
 ["aisatsu","ご挨拶（引越し等）","Greeting gift (moving etc.)","御挨拶","cho","kohaku",1],
 ["soshina","粗品","Small token gift","粗品","cho","kohaku",1],
 ["kaiki","快気祝い","Recovery celebration","快気祝","musubi","kohaku",1],
 ["mimai","お見舞い","Get-well gift","御見舞","musubi","kohaku",0],
 ["sunshi","寸志","Small gratuity","寸志","cho","kohaku",1],
 ["kokorozashi","香典返し（志）","Funeral return gift","志","musubi","kokubyaku",0],
 ["reizen","御霊前","Funeral offering","御霊前","musubi","kokubyaku",0],
 ["butsuzen","御仏前（四十九日以降）","Memorial offering","御仏前","musubi","kibyaku",0],
 ["custom","自由に入力","Custom","","cho","kohaku",1]
];
const KNOTS={cho:["蝶結び（何度あってもよいお祝い）","Bow (for repeatable occasions)"],musubi:["結び切り（一度きりがよいこと）","Tight knot (once-in-a-lifetime)"],awaji:["あわじ結び（結婚・一度きり）","Awaji knot (weddings)"]};
const COLORS={kohaku:["紅白","Red & white",["#c8102e","#c9c9c9"]],kinbeni:["金銀","Gold & silver",["#c9a227","#a8a8a8"]],kokubyaku:["黒白","Black & white",["#222222","#c9c9c9"]],kibyaku:["黄白","Yellow & white",["#d4a017","#c9c9c9"]]};
const FONTS={brush:["筆文字","Brush","Yuji Syuku"],mincho:["明朝体","Mincho (serif)","Shippori Mincho B1"]};
const PAPERS={a4:["A4（210×297mm）","A4 (210×297 mm)",210,297],b5:["B5（182×257mm）","B5 (182×257 mm)",182,257],a5:["A5（148×210mm）","A5 (148×210 mm)",148,210],tanzaku:["短冊のし（70×200mm）","Narrow strip (70×200 mm)",70,200]};
const T={
ja:{use:"用途",omote:"表書き",names:"名入れ（連名は1行に1人、右から順に並びます）",hnames:"例：山田 太郎　／会社名を入れる場合は1行目に会社名",mizuhiki:"水引",color:"水引の色",font:"書体",paper:"用紙サイズ",mark:"熨斗（のし）を付ける",pdf:"PDFで保存",png:"画像（PNG）で保存",print:"印刷する",
 tips:{mourn:"弔事では熨斗を付けず、黒白または黄白の結び切りを使います。",mimai:"お見舞いは熨斗なし・紅白結び切りが一般的です。",wed:"結婚祝いは「何度も結び直さない」結び切りかあわじ結びを使います。",def:"蝶結びは、出産や進学など何度あってもうれしいお祝いに使います。"},def:"山田 太郎"},
en:{use:"Occasion",omote:"Heading (omotegaki, Japanese)",names:"Name(s) (one per line; read right to left)",hnames:"Write names in Japanese if possible, e.g. 山田 太郎",mizuhiki:"Mizuhiki knot",color:"Cord colour",font:"Font",paper:"Paper size",mark:"Add the noshi symbol",pdf:"Download PDF",png:"Download PNG",print:"Print",
 tips:{mourn:"For condolences, leave out the noshi symbol and use black-and-white or yellow-and-white tight knots.",mimai:"Get-well gifts use a red-and-white tight knot with no noshi symbol.",wed:"Weddings use a tight knot or awaji knot, which can’t be untied: the wish is that it happens only once.",def:"The bow can be untied and retied, so it suits happy events that can happen again, like births."},def:"山田 太郎"}
}[LANG];
const L=LANG==="ja"?1:2;
const cv=$("cv"),cx=cv.getContext("2d");
const opts=(o,sel)=>Object.entries(o).map(([k,v])=>`<option value="${k}"${k===sel?" selected":""}>${LANG==="ja"?v[0]:v[1]}</option>`).join("");
$("use").innerHTML=USES.map(u=>`<option value="${u[0]}">${u[L]}</option>`).join("");
$("mizuhiki").innerHTML=opts(KNOTS);$("color").innerHTML=opts(COLORS);$("font").innerHTML=opts(FONTS,"brush");$("paper").innerHTML=opts(PAPERS,"a4");
for(const k of["use","omote","names","mizuhiki","color","font","paper","mark"])$("l-"+k).textContent=T[k];
$("h-names").textContent=T.hnames;$("pdf").textContent=T.pdf;$("png").textContent=T.png;$("print").textContent=T.print;

const ROT=new Set([..."ー－-〜～…‥（）()「」『』【】〔〕［］｛｝＝=→←"]);
// Draw a vertical line of text centred on x, from top y, fitting height h.
function vtext(s,x,y,h,maxSize,font){
  const ch=[...s];if(!ch.length)return;const size=Math.min(maxSize,h/ch.length);const step=Math.min(size*1.12,h/ch.length);
  cx.font=`${size}px "${font}", serif`;cx.textAlign="center";cx.textBaseline="middle";const top=y+(h-step*ch.length)/2;
  ch.forEach((c,i)=>{const cy=top+step*(i+.5);if(c===" "||c==="　")return;cx.save();cx.translate(x,cy);if(ROT.has(c))cx.rotate(Math.PI/2);cx.fillText(c,0,0);cx.restore()});
}
function cords(x1,x2,y,col,W){const n=5,g=W*.0055;for(let i=0;i<n;i++){cx.strokeStyle=col;cx.lineWidth=W*.0032;cx.beginPath();cx.moveTo(x1,y+(i-2)*g);cx.lineTo(x2,y+(i-2)*g);cx.stroke()}}
function loop(cxp,cyp,rx,ry,rot,col,W){const n=5,g=W*.0055;for(let i=0;i<n;i++){cx.strokeStyle=col;cx.lineWidth=W*.0032;cx.beginPath();cx.ellipse(cxp,cyp,rx-i*g*.8,ry-i*g*.8,rot,0,Math.PI*2);cx.stroke()}}
function tail(x0,y0,x1,y1,col,W){const n=5,g=W*.0055;for(let i=0;i<n;i++){cx.strokeStyle=col;cx.lineWidth=W*.0032;cx.beginPath();cx.moveTo(x0+(i-2)*g,y0);cx.quadraticCurveTo(x0+(i-2)*g+(x1-x0)*.2,y0+(y1-y0)*.6,x1+(i-2)*g,y1);cx.stroke()}}
function noshiMark(x,y,w,h){
  const hex=(cx0,t,b,ww)=>{cx.beginPath();cx.moveTo(cx0,t);cx.lineTo(cx0+ww/2,t+ww*.45);cx.lineTo(cx0+ww/2,b-ww*.45);cx.lineTo(cx0,b);cx.lineTo(cx0-ww/2,b-ww*.45);cx.lineTo(cx0-ww/2,t+ww*.45);cx.closePath()};
  cx.save();cx.translate(x,y);cx.rotate(-.12);hex(0,0,h,w);cx.fillStyle="#c8102e";cx.fill();hex(0,w*.18,h-w*.18,w*.62);cx.fillStyle="#fff";cx.fill();
  cx.fillStyle="#e8b923";cx.fillRect(-w*.08,h*.22,w*.16,h*.56);cx.restore();
}
async function draw(){
  const P=PAPERS[$("paper").value],dpi=200,W=Math.round(P[2]/25.4*dpi),H=Math.round(P[3]/25.4*dpi);
  cv.width=W;cv.height=H;cx.fillStyle="#fff";cx.fillRect(0,0,W,H);
  const font=FONTS[$("font").value][2],[right,left]=COLORS[$("color").value][2],knot=$("mizuhiki").value;
  try{await document.fonts.load(`40px "${font}"`,$("omote").value+$("names").value)}catch(e){}
  const narrow=W/H<.5,cy=H*(narrow?.42:.45),mid=W/2;
  // Cords: darker colour on the right as you face it.
  cords(0,mid,cy,left,W);cords(mid,W,cy,right,W);
  if(knot==="cho"){loop(mid-W*.085,cy-H*.028,W*.085,H*.026,.35,left,W);loop(mid+W*.085,cy-H*.028,W*.085,H*.026,-.35,right,W);tail(mid-W*.01,cy,mid-W*.11,cy+H*.1,left,W);tail(mid+W*.01,cy,mid+W*.11,cy+H*.1,right,W)}
  else if(knot==="musubi"){tail(mid-W*.01,cy,mid-W*.07,cy+H*.12,left,W);tail(mid+W*.01,cy,mid+W*.07,cy+H*.12,right,W)}
  else{loop(mid,cy-H*.035,W*.05,H*.03,0,right,W);loop(mid-W*.045,cy+H*.005,W*.05,H*.028,.5,left,W);loop(mid+W*.045,cy+H*.005,W*.05,H*.028,-.5,right,W);tail(mid-W*.03,cy+H*.02,mid-W*.09,cy+H*.12,left,W);tail(mid+W*.03,cy+H*.02,mid+W*.09,cy+H*.12,right,W)}
  cx.fillStyle=right;cx.beginPath();cx.roundRect?cx.roundRect(mid-W*.022,cy-H*.018,W*.044,H*.036,W*.008):cx.rect(mid-W*.022,cy-H*.018,W*.044,H*.036);cx.fill();
  if($("noshi-mark").checked)noshiMark(W*(narrow?.78:.82),H*.04,W*(narrow?.14:.075),H*(narrow?.13:.12));
  cx.fillStyle="#111";
  const om=$("omote").value.trim(),names=$("names").value.split("\n").map(s=>s.trim()).filter(Boolean).slice(0,5);
  vtext(om,mid,H*.07,cy-H*.11,W*(narrow?.5:.14),font);
  if(names.length){const n=names.length,colW=Math.min(W*(narrow?.36:.1),W*.5/n),size=Math.min(colW*.85,W*(narrow?.32:.085));
    names.forEach((nm,i)=>vtext(nm,mid+(n-1)/2*colW-i*colW,cy+H*.16,H*.92-(cy+H*.16),size,font))}
  const u=$("use").value,tip=["kokorozashi","reizen","butsuzen"].includes(u)?T.tips.mourn:u==="mimai"?T.tips.mimai:u.startsWith("kekkon")?T.tips.wed:T.tips.def;$("tip").textContent=tip;
  PK.set("noshi",{use:u,omote:$("omote").value,names:$("names").value,mizuhiki:knot,color:$("color").value,font:$("font").value,paper:$("paper").value,mark:$("noshi-mark").checked});
}
function applyUse(){const u=USES.find(x=>x[0]===$("use").value);if(u[0]!=="custom")$("omote").value=u[3];$("mizuhiki").value=u[4];$("color").value=u[5];$("noshi-mark").checked=!!u[6];draw()}
const fname=ext=>`noshi-${$("omote").value.trim()||"custom"}.${ext}`;
$("use").addEventListener("change",applyUse);
for(const id of["omote","names","mizuhiki","color","font","paper","noshi-mark"])$(id).addEventListener("input",draw);
$("png").addEventListener("click",()=>cv.toBlob(b=>saveBlob(b,fname("png")),"image/png"));
$("pdf").addEventListener("click",async()=>{const P=PAPERS[$("paper").value];const jpeg=await canvasJPEG(cv,.95);saveBlob(miniPDF([{jpeg,w:cv.width,h:cv.height,pw:P[2]/25.4*72,ph:P[3]/25.4*72}]),fname("pdf"))});
$("print").addEventListener("click",()=>{const P=PAPERS[$("paper").value];let st=$("page-style");if(!st){st=document.createElement("style");st.id="page-style";document.head.appendChild(st)}
  st.textContent=`@page{size:${P[2]}mm ${P[3]}mm;margin:0}`;$("print-img").src=cv.toDataURL("image/png");$("print-img").onload=()=>window.print()});
const s=PK.get("noshi",null);
if(s){for(const k of["use","omote","names","mizuhiki","color","font","paper"])if(s[k]!=null)$(k).value=s[k];$("noshi-mark").checked=s.mark!==false;draw()}else{$("use").value="oiwai";$("names").value=T.def;applyUse()}
