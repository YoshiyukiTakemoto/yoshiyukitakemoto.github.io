const LANG=document.documentElement.lang==="ja"?"ja":"en";
const T={
en:{between:"Days between dates",add:"Add or subtract",start:"Start date",end:"End date",incl:"Include the end date",n:"Amount",unit:"Unit",units:{d:"days",w:"weeks",m:"months",y:"years"},biz:"Weekdays only",
 days:"days",weeks:(w,d)=>`${w} weeks ${d} days`,ymd:(y,m,d)=>`${y} y ${m} m ${d} d`,wk:"Weeks + days",ymdL:"Years, months, days",bizL:"Weekdays (Mon–Fri)",weL:"Weekend days",hrs:"Hours",
 from:(a,b)=>`from ${a} to ${b}`,later:n=>`${n} days from today`,ago:n=>`${n} days ago`,today:"Today",
 qb:[["Until 31 December","eoy"],["Until New Year’s Day","ny"],["Last 365 days","l365"]],qa:[["+7 days",7,"d"],["+30 days",30,"d"],["+90 days",90,"d"],["+100 days",100,"d"],["+6 months",6,"m"],["−1 year",-1,"y"]],
 bizNote:"Weekdays exclude Saturdays and Sundays. Public holidays are not excluded.",neg:"The end date is before the start date, so the result is negative."},
ja:{between:"2つの日付の間の日数",add:"日付の加算・減算",start:"開始日",end:"終了日",incl:"終了日を含める（両端入れ）",n:"数",unit:"単位",units:{d:"日",w:"週間",m:"か月",y:"年"},biz:"平日のみで数える",
 days:"日",weeks:(w,d)=>`${w}週と${d}日`,ymd:(y,m,d)=>`${y}年${m}か月${d}日`,wk:"週と日",ymdL:"年・月・日",bizL:"平日（月〜金）",weL:"土日",hrs:"時間",
 from:(a,b)=>`${a} から ${b} まで`,later:n=>`今日から${n}日後`,ago:n=>`${n}日前`,today:"今日",
 qb:[["今年の大晦日まで","eoy"],["来年の元日まで","ny"],["過去365日","l365"]],qa:[["7日後",7,"d"],["30日後",30,"d"],["90日後",90,"d"],["100日後",100,"d"],["6か月後",6,"m"],["1年前",-1,"y"]],
 bizNote:"平日は土曜・日曜を除いた日数です。祝日は除外していません。",neg:"終了日が開始日より前のため、結果はマイナスになります。"}
}[LANG];
const $=id=>document.getElementById(id);
const DAY=86400000;
const parse=s=>{const [y,m,d]=s.split("-").map(Number);return Date.UTC(y,m-1,d)};
const iso=t=>new Date(t).toISOString().slice(0,10);
const now=new Date(),TODAY=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
const long=t=>new Intl.DateTimeFormat(LANG==="ja"?"ja-JP":"en-GB",{timeZone:"UTC",year:"numeric",month:"long",day:"numeric",weekday:"long"}).format(t);
const fmt=n=>n.toLocaleString(LANG==="ja"?"ja-JP":"en-US");
const wd=t=>new Date(t).getUTCDay();
function addMonths(t,n){const d=new Date(t),y=d.getUTCFullYear(),m=d.getUTCMonth()+n,day=d.getUTCDate();const last=new Date(Date.UTC(y,m+1,0)).getUTCDate();return Date.UTC(y,m,Math.min(day,last))}
function ymd(a,b){ // a<=b
  const A=new Date(a),B=new Date(b);let y=B.getUTCFullYear()-A.getUTCFullYear(),m=B.getUTCMonth()-A.getUTCMonth(),d=B.getUTCDate()-A.getUTCDate();
  if(d<0){m--;d+=new Date(Date.UTC(B.getUTCFullYear(),B.getUTCMonth(),0)).getUTCDate()}
  if(m<0){y--;m+=12}return[y,m,d];
}
function weekdays(a,b){ // count Mon–Fri in [a,b)
  let n=Math.round((b-a)/DAY),full=Math.floor(n/7),c=full*5;for(let t=a+full*7*DAY;t<b;t+=DAY){const w=wd(t);if(w&&w<6)c++}return c;
}
const fact=(k,v)=>`<div><dt>${k}</dt><dd>${v}</dd></div>`;

function between(){
  const s=$("b-start").value,e=$("b-end").value;if(!s||!e)return;
  let a=parse(s),b=parse(e);const neg=b<a;if(neg)[a,b]=[b,a];
  const incl=$("b-incl").checked,end=b+(incl?DAY:0),n=Math.round((end-a)/DAY),sign=neg?"−":"";
  const [y,m,d]=ymd(a,end),biz=weekdays(a,end);
  $("r-between").innerHTML=`<div class="hero"><strong>${sign}${fmt(n)}</strong><span>${T.days} · ${T.from(long(parse(s)),long(parse(e)))}</span></div>
  <dl class="facts">${fact(T.wk,T.weeks(Math.floor(n/7),n%7))}${fact(T.ymdL,T.ymd(y,m,d))}${fact(T.bizL,fmt(biz))}${fact(T.weL,fmt(n-biz))}${fact(T.hrs,fmt(n*24))}</dl>
  <p class="hint">${neg?T.neg+" ":""}${T.bizNote}</p>`;
}
function add(){
  const s=$("a-start").value;if(!s)return;const a=parse(s),n=Math.trunc(+$("a-n").value||0),u=$("a-unit").value,biz=$("a-biz").checked&&u==="d";
  let r=a;
  if(biz){let left=Math.abs(n),step=n<0?-DAY:DAY;while(left>0){r+=step;const w=wd(r);if(w&&w<6)left--}}
  else if(u==="d")r=a+n*DAY;else if(u==="w")r=a+n*7*DAY;else r=addMonths(a,u==="m"?n:n*12);
  const diff=Math.round((r-TODAY)/DAY);
  $("r-add").innerHTML=`<div class="hero"><strong>${long(r)}</strong></div>
  <dl class="facts">${fact("ISO 8601",iso(r))}${fact(T.today,diff===0?"±0":diff>0?T.later(fmt(diff)):T.ago(fmt(-diff)))}${fact(T.days,fmt(Math.round((r-a)/DAY)))}</dl>${biz?`<p class="hint">${T.bizNote}</p>`:""}`;
}

$("m-between").textContent=T.between;$("m-add").textContent=T.add;
$("l-bstart").textContent=$("l-astart").textContent=T.start;$("l-bend").textContent=T.end;$("l-incl").textContent=T.incl;
$("l-an").textContent=T.n;$("l-unit").textContent=T.unit;$("l-biz").textContent=T.biz;
$("a-unit").innerHTML=Object.entries(T.units).map(([k,v])=>`<option value="${k}">${v}</option>`).join("");
$("b-start").value=$("a-start").value=iso(TODAY);
$("b-end").value=`${now.getFullYear()}-12-31`;
$("b-quick").innerHTML=T.qb.map(([l,k])=>`<button type="button" data-q="${k}">${l}</button>`).join("");
$("a-quick").innerHTML=T.qa.map(([l,n,u])=>`<button type="button" data-n="${n}" data-u="${u}">${l}</button>`).join("");
$("mode").addEventListener("click",e=>{const b=e.target.closest("[data-mode]");if(!b)return;
  document.querySelectorAll("#mode button").forEach(x=>x.setAttribute("aria-pressed",x===b));
  $("p-between").hidden=b.dataset.mode!=="between";$("p-add").hidden=b.dataset.mode!=="add";
  try{history.replaceState(null,"",b.dataset.mode==="add"?"#add":location.pathname)}catch(err){}});
$("b-quick").addEventListener("click",e=>{const k=e.target.dataset.q;if(!k)return;const y=now.getFullYear();
  $("b-start").value=iso(k==="l365"?TODAY-365*DAY:TODAY);$("b-end").value=k==="eoy"?`${y}-12-31`:k==="ny"?`${y+1}-01-01`:iso(TODAY);between()});
$("a-quick").addEventListener("click",e=>{const b=e.target.closest("[data-n]");if(!b)return;$("a-n").value=b.dataset.n;$("a-unit").value=b.dataset.u;$("a-start").value=iso(TODAY);add()});
for(const id of["b-start","b-end","b-incl"])$(id).addEventListener("input",between);
for(const id of["a-start","a-n","a-unit","a-biz"])$(id).addEventListener("input",add);
if(location.hash==="#add")$("m-add").click();
between();add();
