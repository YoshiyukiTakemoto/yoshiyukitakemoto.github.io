const LANG=document.documentElement.lang==="ja"?"ja":"en";
const T={
en:{text:"Your text",ph:"Type or paste text here. Counts update as you type.",limit:"Limit",chars:"Characters",noSpace:"Without spaces",noWs:"Without spaces or line breaks",words:"Words",sentences:"Sentences",lines:"Lines",paras:"Paragraphs",utf8:"Bytes (UTF‑8)",sjis:"Bytes (Shift_JIS, approx.)",x:"X (Twitter) count",genko:"Manuscript pages (400 chars)",read:"Reading time",speak:"Speaking time",copy:"Copy text",copied:"Copied",clear:"Clear",left:n=>`${n} left`,over:n=>`${n} over the limit`,min:"min",sec:"s",sheets:"pages"},
ja:{text:"テキスト",ph:"ここに文章を入力または貼り付けてください。入力に合わせて文字数が更新されます。",limit:"目標文字数",chars:"文字数",noSpace:"空白を除く",noWs:"空白・改行を除く",words:"単語数",sentences:"文の数",lines:"行数",paras:"段落数",utf8:"バイト数（UTF‑8）",sjis:"バイト数（Shift_JIS 目安）",x:"X（Twitter）換算",genko:"原稿用紙（400字詰め）",read:"読む時間の目安",speak:"話す時間の目安",copy:"テキストをコピー",copied:"コピーしました",clear:"クリア",left:n=>`あと ${n} 文字`,over:n=>`${n} 文字オーバー`,min:"分",sec:"秒",sheets:"枚"}
}[LANG];
const $=id=>document.getElementById(id);
const store={get(k){try{return localStorage.getItem("cc:"+k)}catch(e){return null}},set(k,v){try{localStorage.setItem("cc:"+k,v)}catch(e){}}};
const G=typeof Intl.Segmenter==="function"?new Intl.Segmenter(LANG,{granularity:"grapheme"}):null;
const W=typeof Intl.Segmenter==="function"?new Intl.Segmenter(LANG,{granularity:"word"}):null;
const S=typeof Intl.Segmenter==="function"?new Intl.Segmenter(LANG,{granularity:"sentence"}):null;
const graphemes=s=>G?[...G.segment(s)].map(x=>x.segment):Array.from(s);
const fmt=n=>n.toLocaleString(LANG==="ja"?"ja-JP":"en-US");

function xWeight(s){
  // X counts most CJK characters and emoji as 2, Latin as 1, and every URL as 23.
  let n=0;const urls=s.match(/https?:\/\/\S+/g)||[];n+=urls.length*23;s=s.replace(/https?:\/\/\S+/g,"");
  for(const g of graphemes(s)){if(/\p{Extended_Pictographic}/u.test(g)){n+=2;continue}const c=g.codePointAt(0);
    n+=(c<=0x10FF||(c>=0x2000&&c<=0x200D)||(c>=0x2010&&c<=0x201F)||(c>=0x2032&&c<=0x2037))?1:2}
  return n;
}
function sjisBytes(s){let n=0;for(const ch of s){const c=ch.codePointAt(0);n+=c<0x80||(c>=0xFF61&&c<=0xFF9F)?1:2}return n}
function dur(sec){if(sec<60)return `${Math.max(sec?1:0,Math.round(sec))} ${T.sec}`;const m=Math.floor(sec/60),s=Math.round(sec%60);return s?`${m} ${T.min} ${s} ${T.sec}`:`${m} ${T.min}`}

function update(){
  const s=$("text").value;store.set("text",s);
  const g=graphemes(s.replace(/\r\n/g,"\n"));
  const chars=g.length,noSpace=g.filter(c=>!/^[ \t　 ]$/.test(c)).length,noWs=g.filter(c=>!/^\s$/u.test(c)&&c!=="　").length;
  const words=W?[...W.segment(s)].filter(x=>x.isWordLike).length:(s.trim().match(/\S+/g)||[]).length;
  const sentences=S?[...S.segment(s)].filter(x=>x.segment.trim()).length:0;
  const lines=s?s.split(/\r\n|\r|\n/).length:0, paras=s.split(/\n\s*\n/).filter(p=>p.trim()).length;
  const cjk=(s.match(/[぀-ヿ㐀-鿿豈-﫿]/g)||[]).length, latinWords=(s.replace(/[぀-ヿ㐀-鿿豈-﫿]/g," ").match(/[A-Za-z0-9'’-]+/g)||[]).length;
  const readSec=cjk/500*60+latinWords/238*60, speakSec=cjk/300*60+latinWords/150*60;
  $("s-chars").textContent=fmt(chars);
  const rows=[[T.noSpace,noSpace],[T.noWs,noWs],[T.words,words],[T.sentences,sentences],[T.lines,lines],[T.paras,paras],[T.utf8,new TextEncoder().encode(s).length]];
  if(LANG==="ja")rows.push([T.sjis,sjisBytes(s)]);
  rows.push([T.x,`${fmt(xWeight(s))} <small>/ 280</small>`]);
  if(LANG==="ja"||cjk)rows.push([T.genko,`${(noWs/400).toFixed(1)} <small>${T.sheets}</small>`]);
  rows.push([T.read,dur(readSec)],[T.speak,dur(speakSec)]);
  $("stats").innerHTML=rows.map(([k,v])=>`<dt>${k}</dt><dd>${typeof v==="number"?fmt(v):v}</dd>`).join("");
  const lim=+$("limit").value,bar=$("limitbar");
  bar.hidden=!lim;
  if(lim){const over=chars>lim;bar.classList.toggle("over",over);bar.querySelector("i").style.width=Math.min(100,chars/lim*100)+"%";$("limitmsg").textContent=`${fmt(chars)} / ${fmt(lim)} · ${over?T.over(fmt(chars-lim)):T.left(fmt(lim-chars))}`}
}

$("l-text").textContent=T.text;$("text").placeholder=T.ph;$("l-limit").textContent=T.limit;$("l-chars").textContent=T.chars;
$("copy").textContent=T.copy;$("clear").textContent=T.clear;
$("text").value=store.get("text")||"";$("limit").value=store.get("limit")||"";
$("text").addEventListener("input",update);
$("limit").addEventListener("input",()=>{store.set("limit",$("limit").value);update()});
$("clear").addEventListener("click",()=>{$("text").value="";update();$("text").focus()});
$("copy").addEventListener("click",()=>{const b=$("copy"),ta=$("text");
  const done=()=>{b.textContent=T.copied;setTimeout(()=>b.textContent=T.copy,1800)};
  try{navigator.clipboard.writeText(ta.value).then(done,()=>{ta.select();document.execCommand("copy");done()})}catch(e){ta.select();document.execCommand("copy");done()}});
update();
