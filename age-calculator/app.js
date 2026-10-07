const LANG=document.documentElement.lang==="ja"?"ja":"en";
const $=id=>document.getElementById(id);
const DAY=86400000;
const T={
ja:{birth:"生年月日",asof:"基準日（この日時点の年齢）",age:a=>`満${a}歳`,ymd:(y,m,d)=>`${y}歳${m}か月${d}日`,kazoe:"数え年",days:"生まれてからの日数",next:"次の誕生日まで",nextV:(n,a)=>n===0?"今日が誕生日です":`あと${n}日（${a}歳）`,
 wd:"生まれた曜日",eto:"干支",sign:"星座",grade:"学年（基準日時点）",wareki:"和暦の生まれ年",future:"生年月日が基準日より後になっています。",unit:"日"},
en:{birth:"Date of birth",asof:"Age on this date",age:a=>`${a} years old`,ymd:(y,m,d)=>`${y} years, ${m} months, ${d} days`,days:"Days lived",next:"Next birthday",nextV:(n,a)=>n===0?"Happy birthday! It’s today":`In ${n} days (turning ${a})`,
 wd:"Day of the week you were born",eto:"Chinese zodiac",sign:"Star sign",future:"The date of birth is after the chosen date.",unit:"days"}
}[LANG];
const ZJ="子丑寅卯辰巳午未申酉戌亥",ZJR=["ね","うし","とら","う","たつ","み","うま","ひつじ","さる","とり","いぬ","い"],ZE=["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"],ST="甲乙丙丁戊己庚辛壬癸";
const SIGNS=[[1,20,"山羊座","Capricorn"],[2,19,"水瓶座","Aquarius"],[3,21,"魚座","Pisces"],[4,20,"牡羊座","Aries"],[5,21,"牡牛座","Taurus"],[6,22,"双子座","Gemini"],[7,23,"蟹座","Cancer"],[8,23,"獅子座","Leo"],[9,23,"乙女座","Virgo"],[10,24,"天秤座","Libra"],[11,23,"蠍座","Scorpio"],[12,22,"射手座","Sagittarius"],[13,0,"山羊座","Capricorn"]];
const ERAS=[["令和",2019,5,1],["平成",1989,1,8],["昭和",1926,12,25],["大正",1912,7,30],["明治",1868,1,1]];
const p=s=>{const [y,m,d]=s.split("-").map(Number);return{y,m,d,t:Date.UTC(y,m-1,d)}};
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const leap=y=>(y%4===0&&y%100!==0)||y%400===0;
// Birthday in year y. For 29 February in a non-leap year the age goes up on 1 March: Japanese law adds a year
// at the end of the day before the birthday (the end of 28 February), and the UK uses 1 March as well.
function bday(b,y){if(b.m===2&&b.d===29&&!leap(y))return Date.UTC(y,2,1);return Date.UTC(y,b.m-1,b.d)}
function ageOn(b,a){let n=a.y-b.y;if(a.t<bday(b,a.y))n--;return n}
function ymd(b,a){let y=a.y-b.y,m=a.m-b.m,d=a.d-b.d;if(d<0){m--;d+=new Date(Date.UTC(a.y,a.m-1,0)).getUTCDate()}if(m<0){y--;m+=12}return[y,m,d]}
function grade(b,a){
  // Children born 2 April Y – 1 April Y+1 start elementary school in April of Y+7.
  const start=(b.m>4||(b.m===4&&b.d>=2))?b.y+7:b.y+6, fy=a.m>=4?a.y:a.y-1, n=fy-start+1;
  if(n<=0){const k=n+3;return k>=1?`未就学（幼稚園${["年少","年中","年長"][k-1]}相当）`:"未就学"}
  if(n<=6)return`小学${n}年生`;if(n<=9)return`中学${n-6}年生`;if(n<=12)return`高校${n-9}年生`;if(n<=16)return`大学${n-12}年生相当`;return"—";
}
function wareki(b){const e=ERAS.find(e=>b.t>=Date.UTC(e[1],e[2]-1,e[3]));if(!e)return"—";const n=b.y-e[1]+1;return`${e[0]}${n===1?"元":n}年`}
function render(){
  if(!$("birth").value||!$("asof").value)return;
  const b=p($("birth").value),a=p($("asof").value);
  if(b.t>a.t){$("age").textContent="—";$("ymd").textContent=T.future;$("facts").innerHTML="";return}
  const age=ageOn(b,a),[y,m,d]=ymd(b,a),days=Math.round((a.t-b.t)/DAY);
  let ny=a.y,nb=bday(b,ny);if(nb<a.t)nb=bday(b,++ny);const toNext=Math.round((nb-a.t)/DAY);
  // SIGNS[m-1] covers month m up to the day before its cut-off; from the cut-off on it is the next entry.
  const zi=((b.y-4)%12+12)%12,sg=b.d<SIGNS[b.m-1][1]?SIGNS[b.m-1]:SIGNS[b.m];
  const wd=new Intl.DateTimeFormat(LANG==="ja"?"ja-JP":"en-GB",{weekday:"long",timeZone:"UTC"}).format(b.t);
  const nf=n=>n.toLocaleString(LANG==="ja"?"ja-JP":"en-US");
  $("age").textContent=T.age(age);$("ymd").textContent=T.ymd(y,m,d);
  const F=[[T.days,`${nf(days)} ${T.unit}`],[T.next,T.nextV(toNext,ny-b.y)],[T.wd,wd]];
  if(LANG==="ja"){F.splice(0,0,[T.kazoe,`${a.y-b.y+1}歳`]);const g=grade(b,a);if(g!=="—")F.push([T.grade,g]);F.push([T.wareki,wareki(b)],[T.eto,`${ST[((b.y-4)%10+10)%10]}${ZJ[zi]}（${ZJR[zi]}）`],[T.sign,sg[2]])}
  else F.push([T.eto,ZE[zi]],[T.sign,sg[3]]);
  $("facts").innerHTML=F.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
}
$("l-birth").textContent=T.birth;$("l-asof").textContent=T.asof;
const now=new Date();$("asof").value=iso(now);$("birth").value="1990-04-01";$("birth").max="2200-12-31";
$("birth").addEventListener("input",render);$("asof").addEventListener("input",render);
render();
