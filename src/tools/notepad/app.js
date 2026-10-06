const LANG=document.documentElement.lang==="ja"?"ja":"en";
const $=id=>document.getElementById(id);
const PK=window.PK;
const T={
en:{new:"New note",q:"Search notes",ph:"Start typing. Everything is saved in this browser automatically.",copy:"Copy",copied:"Copied",dl:"Download .txt",del:"Delete",confirm:"Click again to delete",untitled:"Untitled",meta:(c,l)=>`${c} characters · ${l} lines`,saved:t=>`Saved in this browser · ${t}`,welcome:"Welcome to Notepad\n\nNotes are saved automatically in this browser. Nothing is uploaded.\n\n- Press “New note” to add another note\n- Search finds text in all notes\n- Download a note as a .txt file to keep a copy"},
ja:{new:"新しいメモ",q:"メモを検索",ph:"入力を始めてください。内容はこのブラウザに自動保存されます。",copy:"コピー",copied:"コピーしました",dl:".txtで保存",del:"削除",confirm:"もう一度押すと削除",untitled:"無題",meta:(c,l)=>`${c}文字・${l}行`,saved:t=>`このブラウザに保存済み・${t}`,welcome:"メモ帳へようこそ\n\nメモはこのブラウザに自動で保存されます。アップロードはされません。\n\n・「新しいメモ」でメモを追加\n・検索ですべてのメモから探せます\n・.txtで保存して控えを残せます"}
}[LANG];
let notes=PK.get("notes",null),cur=PK.get("notes:cur",null);
if(!notes||!notes.length){notes=[{id:Date.now(),text:T.welcome,t:Date.now()}];cur=notes[0].id}
if(!notes.some(n=>n.id===cur))cur=notes[0].id;
const save=()=>{PK.set("notes",notes);PK.set("notes:cur",cur)};
const note=()=>notes.find(n=>n.id===cur);
const title=n=>(n.text.split("\n").find(l=>l.trim())||T.untitled).trim().slice(0,60);
const when=t=>new Intl.DateTimeFormat(LANG==="ja"?"ja-JP":"en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(t);
const esc=s=>s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function list(){
  const q=$("q").value.trim().toLowerCase();
  $("notes").innerHTML=notes.slice().sort((a,b)=>b.t-a.t).filter(n=>!q||n.text.toLowerCase().includes(q)).map(n=>`<li><button type="button" data-id="${n.id}" aria-current="${n.id===cur}"><strong>${esc(title(n))}</strong><small>${when(n.t)}</small></button></li>`).join("");
}
function meta(){const n=note(),s=n.text;$("meta").textContent=T.meta([...s].length.toLocaleString(),s?s.split("\n").length:0);$("saved").textContent=T.saved(when(n.t))}
function open(id){cur=id;$("ed").value=note().text;save();list();meta();resetDel()}
let timer;
$("ed").addEventListener("input",()=>{const n=note();n.text=$("ed").value;n.t=Date.now();meta();clearTimeout(timer);timer=setTimeout(()=>{save();list()},300)});
$("new").addEventListener("click",()=>{const n={id:Date.now(),text:"",t:Date.now()};notes.push(n);open(n.id);$("ed").focus()});
$("notes").addEventListener("click",e=>{const b=e.target.closest("[data-id]");if(b)open(+b.dataset.id)});
$("q").addEventListener("input",list);
let armed=false;function resetDel(){armed=false;$("del").textContent=T.del;$("del").classList.remove("confirm")}
$("del").addEventListener("click",()=>{
  if(!armed){armed=true;$("del").textContent=T.confirm;$("del").classList.add("confirm");setTimeout(resetDel,3000);return}
  notes=notes.filter(n=>n.id!==cur);if(!notes.length)notes=[{id:Date.now(),text:"",t:Date.now()}];open(notes.slice().sort((a,b)=>b.t-a.t)[0].id);save();
});
$("copy").addEventListener("click",()=>{const b=$("copy");try{navigator.clipboard.writeText($("ed").value).then(()=>{b.textContent=T.copied;setTimeout(()=>b.textContent=T.copy,1500)},()=>{})}catch(e){}});
$("dl").addEventListener("click",()=>{const n=note(),a=document.createElement("a");a.href=URL.createObjectURL(new Blob([n.text],{type:"text/plain;charset=utf-8"}));a.download=(title(n).replace(/[\\/:*?"<>|]/g,"_")||"note")+".txt";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),3000)});
// Keep tabs in sync: another tab editing notes updates this one.
window.addEventListener("storage",e=>{if(e.key==="pk:notes"&&document.activeElement!==$("ed")){notes=PK.get("notes",notes);if(!notes.some(n=>n.id===cur))cur=notes[0].id;open(cur)}});
$("new").textContent=T.new;$("q").placeholder=T.q;$("ed").placeholder=T.ph;$("copy").textContent=T.copy;$("dl").textContent=T.dl;
open(cur);
