const LANG=document.documentElement.lang==="ja"?"ja":"en";
const $=id=>document.getElementById(id);
const T={
en:{code:"Color code (HEX, RGB, HSL or name)",contrast:"Contrast (WCAG 2)",scale:"Tints and shades",copy:"Copy",copied:"Copied",bad:"Couldn’t read that color. Try #ff8800, rgb(255 136 0), hsl(32 100% 50%) or a name like orange.",onW:"on white",onB:"on black",wText:"White text",bText:"Black text"},
ja:{code:"カラーコード（HEX・RGB・HSL・色名）",contrast:"コントラスト比（WCAG 2）",scale:"明るさのバリエーション",copy:"コピー",copied:"コピー済",bad:"色を読み取れませんでした。#ff8800、rgb(255 136 0)、hsl(32 100% 50%)、orange などの形式で入力してください。",onW:"白背景",onB:"黒背景",wText:"白い文字",bText:"黒い文字"}
}[LANG];
// Parse any CSS color by letting the browser normalise it on a canvas.
const cx=document.createElement("canvas").getContext("2d");
function parse(s){
  s=s.trim();if(/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(s))s="#"+s;
  cx.fillStyle="#010203";cx.fillStyle=s;const a=cx.fillStyle;if(a==="#010203"&&!/^#?010203$/i.test(s))return null;
  if(a[0]==="#")return[1,3,5].map(i=>parseInt(a.slice(i,i+2),16));
  const m=a.match(/[\d.]+/g);return m?m.slice(0,3).map(Number):null;
}
const hex=c=>"#"+c.map(v=>Math.round(v).toString(16).padStart(2,"0")).join("");
function hsl([r,g,b]){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;let h=0,s=0;
  if(d){s=d/(1-Math.abs(2*l-1));h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360}return[h,s*100,l*100]}
function fromHsl(h,s,l){s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1));return[f(0),f(8),f(4)].map(v=>v*255)}
function hsv([r,g,b]){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),d=mx-Math.min(r,g,b);return[hsl([r*255,g*255,b*255])[0],mx?d/mx*100:0,mx*100]}
function cmyk([r,g,b]){const k=1-Math.max(r,g,b)/255;if(k>=1)return[0,0,0,100];return[r,g,b].map(v=>(1-v/255-k)/(1-k)*100).concat(k*100)}
function oklch([r,g,b]){const lin=v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4};[r,g,b]=[r,g,b].map(lin);
  const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
  const L=.2104542553*l+.793617785*m-.0040720468*s,A=1.9779984951*l-2.428592205*m+.4505937099*s,B=.0259040371*l+.7827717662*m-.808675766*s;
  let H=Math.atan2(B,A)*180/Math.PI;if(H<0)H+=360;return[L*100,Math.hypot(A,B),H]}
function lum(c){const v=c.map(x=>{x/=255;return x<=.03928?x/12.92:((x+.055)/1.055)**2.4});return .2126*v[0]+.7152*v[1]+.0722*v[2]}
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
const r0=n=>Math.round(n),r1=n=>Math.round(n*10)/10,r3=n=>Math.round(n*1000)/1000;
let cur=[36,64,196];

function render(src){
  const c=cur,h=hex(c),[H,S,L]=hsl(c),[,SV,V]=hsv(c),[C,M,Y,K]=cmyk(c),[OL,OC,OH]=oklch(c);
  $("swatch").style.background=h;const dark=lum(c)<.18;$("sw-text").style.color=dark?"#fff":"#000";
  if(src!=="picker")$("picker").value=h;if(src!=="code")$("code").value=h;
  const rows=[["HEX",h],["HEX (upper)",h.toUpperCase()],["RGB",`rgb(${c.map(r0).join(", ")})`],["HSL",`hsl(${r0(H)}, ${r0(S)}%, ${r0(L)}%)`],["HSV / HSB",`${r0(H)}°, ${r0(SV)}%, ${r0(V)}%`],["CMYK",`${[C,M,Y,K].map(r0).join("%, ")}%`],["OKLCH",`oklch(${r1(OL)}% ${r3(OC)} ${r1(OH)})`],["CSS RGB 0–1",c.map(v=>r3(v/255)).join(", ")]];
  $("codes").innerHTML=rows.map(([k,v])=>`<tr><td>${k}</td><td><code>${v}</code></td><td><button type="button" data-v="${v}">${T.copy}</button></td></tr>`).join("");
  const tag=(r,n,l)=>`<span class="tag ${r>=n?"pass":"fail"}">${l} ${r>=n?"✓":"✗"}</span>`;
  const box=(bg,fg,label)=>{const r=ratio(bg,fg);return`<div class="cbox"><div class="demo" style="background:${hex(bg)};color:${hex(fg)}">Aa</div><div><b>${r.toFixed(2)}:1</b> <span style="color:var(--muted);font-size:13px">${label}</span><div class="tags">${tag(r,4.5,"AA")}${tag(r,7,"AAA")}${tag(r,3,"AA Large")}</div></div></div>`};
  $("contrast").innerHTML=box([255,255,255],c,T.onW)+box([0,0,0],c,T.onB)+box(c,[255,255,255],T.wText)+box(c,[0,0,0],T.bText);
  const steps=[95,90,80,70,60,50,40,30,20,10,5];
  const closest=steps.reduce((a,b)=>Math.abs(b-L)<Math.abs(a-L)?b:a);
  $("scale").innerHTML=steps.map(l=>{const v=l===closest?c:fromHsl(H,S,l);return`<button type="button" data-hex="${hex(v)}" class="${l===closest?"cur":""}" style="background:${hex(v)};color:${l>55?"#000":"#fff"}" title="${hex(v)}">${hex(v).slice(1)}</button>`}).join("");
}
function fromCode(src,val){const c=parse(val);$("err").hidden=!!c;if(c){$("err").hidden=true;cur=c;render(src)}else $("err").textContent=T.bad}
$("l-code").textContent=T.code;$("l-contrast").textContent=T.contrast;$("l-scale").textContent=T.scale;
$("picker").addEventListener("input",e=>fromCode("picker",e.target.value));
$("code").addEventListener("input",e=>fromCode("code",e.target.value));
$("scale").addEventListener("click",e=>{const b=e.target.closest("[data-hex]");if(b)fromCode(null,b.dataset.hex)});
$("codes").addEventListener("click",e=>{const b=e.target.closest("[data-v]");if(!b)return;const ok=()=>{b.textContent=T.copied;setTimeout(()=>b.textContent=T.copy,1400)};try{navigator.clipboard.writeText(b.dataset.v).then(ok,()=>{})}catch(err){}});
render();
