const LANG=document.documentElement.lang==="ja"?"ja":"en";
const $=id=>document.getElementById(id);
// [id, en label, ja label, factor to base unit, group]; group "jp" = traditional Japanese units.
const K={
length:{en:"Length",ja:"長さ",base:"m",def:"m",u:[["mm","Millimetre (mm)","ミリメートル (mm)",.001],["cm","Centimetre (cm)","センチメートル (cm)",.01],["m","Metre (m)","メートル (m)",1],["km","Kilometre (km)","キロメートル (km)",1000],["in","Inch (in)","インチ (in)",.0254],["ft","Foot (ft)","フィート (ft)",.3048],["yd","Yard (yd)","ヤード (yd)",.9144],["mi","Mile (mi)","マイル (mi)",1609.344],["nmi","Nautical mile","海里",1852],["sun","Sun 寸","寸",1/33,"jp"],["shaku","Shaku 尺","尺",10/33,"jp"],["ken","Ken 間","間",60/33,"jp"],["ri","Ri 里","里",129600/33,"jp"]]},
weight:{en:"Weight",ja:"重さ",def:"kg",u:[["mg","Milligram (mg)","ミリグラム (mg)",1e-6],["g","Gram (g)","グラム (g)",.001],["kg","Kilogram (kg)","キログラム (kg)",1],["t","Tonne (t)","トン (t)",1000],["oz","Ounce (oz)","オンス (oz)",.028349523125],["lb","Pound (lb)","ポンド (lb)",.45359237],["st","Stone (st)","ストーン (st)",6.35029318],["monme","Monme 匁","匁",.00375,"jp"],["kin","Kin 斤","斤",.6,"jp"],["kan","Kan 貫","貫",3.75,"jp"]]},
temp:{en:"Temperature",ja:"温度",def:"c",u:[["c","Celsius (°C)","摂氏 (°C)"],["f","Fahrenheit (°F)","華氏 (°F)"],["k","Kelvin (K)","ケルビン (K)"]]},
area:{en:"Area",ja:"面積",def:"m2",u:[["cm2","Square centimetre (cm²)","平方センチメートル (cm²)",1e-4],["m2","Square metre (m²)","平方メートル (m²)",1],["a","Are (a)","アール (a)",100],["ha","Hectare (ha)","ヘクタール (ha)",1e4],["km2","Square kilometre (km²)","平方キロメートル (km²)",1e6],["ft2","Square foot (ft²)","平方フィート (ft²)",.09290304],["yd2","Square yard (yd²)","平方ヤード (yd²)",.83612736],["ac","Acre","エーカー",4046.8564224],["mi2","Square mile (mi²)","平方マイル (mi²)",2589988.110336],["tsubo","Tsubo 坪","坪",400/121,"jp"],["jo","Jō 畳 (1.62 m²)","畳 (1.62 m²)",1.62,"jp"],["tan","Tan 反","反",120000/121,"jp"],["cho","Chō 町","町",1200000/121,"jp"]]},
volume:{en:"Volume",ja:"体積・容量",def:"l",u:[["ml","Millilitre (mL)","ミリリットル (mL)",.001],["l","Litre (L)","リットル (L)",1],["m3","Cubic metre (m³)","立方メートル (m³)",1000],["tsp","Teaspoon (US)","小さじ（米）",.00492892159375],["tbsp","Tablespoon (US)","大さじ（米）",.01478676478125],["floz","Fluid ounce (US)","液量オンス（米）",.0295735295625],["cup","Cup (US)","カップ（米）",.2365882365],["pt","Pint (US)","パイント（米）",.473176473],["gal","Gallon (US)","ガロン（米）",3.785411784],["galuk","Gallon (UK)","ガロン（英）",4.54609],["cupjp","Cup (Japan, 200 mL)","カップ（日本・200mL）",.2,"jp"],["go","Gō 合","合",2401/13310,"jp"],["sho","Shō 升","升",24010/13310,"jp"],["to","To 斗","斗",240100/13310,"jp"]]},
speed:{en:"Speed",ja:"速さ",def:"kmh",u:[["ms","Metres per second (m/s)","メートル毎秒 (m/s)",1],["kmh","Kilometres per hour (km/h)","キロメートル毎時 (km/h)",1/3.6],["mph","Miles per hour (mph)","マイル毎時 (mph)",.44704],["kn","Knot (kn)","ノット (kn)",1852/3600],["fts","Feet per second (ft/s)","フィート毎秒 (ft/s)",.3048]]},
data:{en:"Data size",ja:"データ量",def:"mb",u:[["bit","Bit","ビット",.125],["b","Byte (B)","バイト (B)",1],["kb","Kilobyte (KB)","キロバイト (KB)",1e3],["mb","Megabyte (MB)","メガバイト (MB)",1e6],["gb","Gigabyte (GB)","ギガバイト (GB)",1e9],["tb","Terabyte (TB)","テラバイト (TB)",1e12],["kib","Kibibyte (KiB)","キビバイト (KiB)",1024],["mib","Mebibyte (MiB)","メビバイト (MiB)",1048576],["gib","Gibibyte (GiB)","ギビバイト (GiB)",1073741824],["tib","Tebibyte (TiB)","テビバイト (TiB)",1099511627776]]}
};
const T={en:{v:"Value",from:"From",jp:"Traditional Japanese units",copy:"Copy",copied:"Copied",hint:"Click Copy to copy a result. Results are rounded to 10 significant digits."},
ja:{v:"数値",from:"単位",jp:"尺貫法（日本の伝統単位）",copy:"コピー",copied:"コピー済",hint:"「コピー」で結果をコピーできます。結果は有効数字10桁で表示しています。"}}[LANG];
const NF=new Intl.NumberFormat(LANG==="ja"?"ja-JP":"en-US",{maximumSignificantDigits:10});
const fmt=n=>!isFinite(n)?"—":n!==0&&(Math.abs(n)>=1e15||Math.abs(n)<1e-6)?n.toPrecision(8).replace(/\.?0+e/,"e"):NF.format(n);
const toK={c:x=>x+273.15,f:x=>(x-32)*5/9+273.15,k:x=>x},fromK={c:x=>x-273.15,f:x=>(x-273.15)*9/5+32,k:x=>x};
let kind=(location.hash.slice(1) in K)?location.hash.slice(1):"length";

function render(){
  const k=K[kind],from=$("from").value,v=parseFloat($("v").value);
  const conv=kind==="temp"?u=>fromK[u[0]](toK[from](v)):(()=>{const f=k.u.find(u=>u[0]===from)[3];return u=>v*f/u[3]})();
  let html="",grp=false;
  for(const u of k.u){
    if(u[4]==="jp"&&!grp){grp=true;html+=`<tr class="grp"><td colspan="3">${T.jp}</td></tr>`}
    const r=isNaN(v)?NaN:conv(u);
    html+=`<tr${u[0]===from?' class="self"':""}><td class="u">${LANG==="ja"?u[2]:u[1]}</td><td class="n">${fmt(r)}</td><td><button type="button" data-v="${isFinite(r)?+r.toPrecision(12):""}">${T.copy}</button></td></tr>`;
  }
  $("res").innerHTML=html;
}
function setKind(k){
  kind=k;document.querySelectorAll("#kinds button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.k===k));
  $("from").innerHTML=K[k].u.map(u=>`<option value="${u[0]}"${u[0]===K[k].def?" selected":""}>${LANG==="ja"?u[2]:u[1]}</option>`).join("");
  try{history.replaceState(null,"",k==="length"?location.pathname:"#"+k)}catch(e){}
  render();
}
$("l-v").textContent=T.v;$("l-from").textContent=T.from;$("hint").textContent=T.hint;
$("kinds").innerHTML=Object.entries(K).map(([k,v])=>`<button type="button" data-k="${k}">${v[LANG]}</button>`).join("");
$("kinds").addEventListener("click",e=>{const b=e.target.closest("[data-k]");if(b)setKind(b.dataset.k)});
$("v").addEventListener("input",render);$("from").addEventListener("change",render);
$("res").addEventListener("click",e=>{const b=e.target.closest("button[data-v]");if(!b||!b.dataset.v)return;
  const ok=()=>{b.textContent=T.copied;setTimeout(()=>b.textContent=T.copy,1400)};try{navigator.clipboard.writeText(b.dataset.v).then(ok,()=>{})}catch(err){}});
setKind(kind);
