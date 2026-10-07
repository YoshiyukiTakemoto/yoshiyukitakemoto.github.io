// Kit Dungeon: an original turn-based roguelike. Floors are generated from a seed, so the daily dungeon is the same for everyone.
const LANG=document.documentElement.lang==="ja"?"ja":"en";
const $=id=>document.getElementById(id);
const PK=window.PK;
const J=LANG==="ja";
const TX={
daily:J?"今日のダンジョン":"Today’s dungeon",free:J?"新しいダンジョン":"New random dungeon",confirm:J?"もう一度押すと今の冒険を終了":"Click again to abandon this run",
modeDaily:d=>J?`今日のダンジョン（${d}）・全員共通`:`Today’s dungeon (${d}) · same for everyone`,modeFree:J?"フリープレイ":"Free play",
inv:J?"持ち物（数字キーで使用）":"Items (press 1–8 to use)",stairs:J?"階段を降りる":"Go down the stairs",
floor:J?"階層":"Floor",lv:"LV",atk:J?"攻撃":"ATK",def:J?"防御":"DEF",gold:J?"ゴールド":"Gold",kills:J?"撃破":"Kills",weapon:J?"武器":"Weapon",armor:J?"防具":"Armor",
fl:n=>J?`地下${n}階`:`B${n}`,
keys:J?"移動 <kbd>←↑↓→</kbd> / <kbd>WASD</kbd>・待機 <kbd>Space</kbd>・階段を降りる <kbd>Enter</kbd>・アイテム <kbd>1</kbd>〜<kbd>8</kbd>・マップをタップでもその方向へ1歩進みます":"Move <kbd>←↑↓→</kbd> / <kbd>WASD</kbd> · Wait <kbd>Space</kbd> · Descend <kbd>Enter</kbd> · Items <kbd>1</kbd>–<kbd>8</kbd> · Tap the map to step towards that spot",
m:{enter:n=>J?`地下${n}階に着いた。`:`You arrive on floor B${n}.`,hit:(a,b,d)=>J?`${a}は${b}に${d}のダメージ。`:`${a} hits ${b} for ${d}.`,miss:(a,b)=>J?`${a}の攻撃は${b}に当たらなかった。`:`${a} misses ${b}.`,
 kill:(b,x)=>J?`${b}を倒した！（経験値${x}）`:`You defeat the ${b}! (+${x} XP)`,lvup:n=>J?`レベル${n}に上がった！`:`You reach level ${n}!`,you:J?"あなた":"You",
 pick:n=>J?`${n}を拾った。`:`You pick up ${n}.`,full:J?"持ち物がいっぱいで拾えない。":"Your bag is full.",gold:n=>J?`${n}ゴールドを拾った。`:`You find ${n} gold.`,
 equip:n=>J?`${n}を装備した。`:`You equip the ${n}.`,worse:n=>J?`${n}を見つけたが、今の装備の方が強い。`:`You find a ${n}, but yours is better.`,
 heal:n=>J?`HPが${n}回復した。`:`You recover ${n} HP.`,bomb:J?"爆弾が炸裂した！":"The bomb explodes!",tele:J?"どこかへワープした。":"You are whisked away.",
 stairs:J?"階段がある。Enterか「階段を降りる」で次の階へ。":"There are stairs here. Press Enter to go down.",dead:(b,f)=>J?`${b}に倒された…（地下${f}階）`:`You were defeated by the ${b} on B${f}.`,
 start:J?"冒険を始めた。階段を探して、深く潜ろう。":"Your adventure begins. Find the stairs and go deep."},
over:J?"GAME OVER":"GAME OVER",
share:(mode,f,lv,g,k)=>J?`Plainkit キットダンジョン${mode?`【${mode}】`:""} 地下${f}階まで到達 ⚔LV${lv} 💰${g} 👾${k}体撃破`:`Plainkit Kit Dungeon${mode?` [${mode}]`:""}: reached B${f} ⚔LV${lv} 💰${g} 👾${k} defeated`
};
// [id, en, ja, hp, atk, def, xp, first floor, colour, shape]
const MONS=[["slime","Slime","スライム",6,3,0,3,1,"#5cc97a","blob"],["bat","Bat","コウモリ",5,3,0,4,1,"#9b7bff","bat"],["rat","Giant rat","大ネズミ",8,4,1,5,2,"#b08968","rat"],
 ["goblin","Goblin","ゴブリン",12,5,1,8,3,"#7fb800","humanoid"],["skeleton","Skeleton","ガイコツ",16,6,2,12,5,"#e8e4d8","humanoid"],["orc","Orc","オーク",24,8,3,18,7,"#5a8f4e","big"],
 ["ghost","Ghost","ゴースト",18,9,2,20,9,"#bcd4ff","ghost"],["golem","Golem","ゴーレム",40,10,6,35,12,"#8d8d8d","big"],["wyvern","Wyvern","ワイバーン",45,14,5,50,15,"#e0614f","bat"],["demon","Demon","デーモン",60,17,7,80,19,"#c2185b","big"]];
const WEAPONS=[["Dagger","短剣",1],["Short sword","ショートソード",3],["Long sword","ロングソード",5],["Battle axe","バトルアックス",7],["Rune blade","ルーンブレード",10],["Dragon fang","竜牙の剣",14]];
const ARMORS=[["Cloth","布の服",0],["Leather armor","革の鎧",1],["Chain mail","鎖かたびら",3],["Plate armor","プレートアーマー",5],["Mithril mail","ミスリルの鎧",7],["Dragon scale","竜鱗の鎧",10]];
const ITEMS={potion:["Potion","ポーション","#e0614f"],elixir:["Elixir","エリクサー","#f2b84b"],bomb:["Bomb","爆弾","#5b6479"],tele:["Teleport scroll","ワープの巻物","#2ec4b6"]};
const nm=a=>J?a[1]:a[0];
const MW=40,MH=30,VW=15,VH=11,TS=32,FOV=6;
// ---- seeded random ----
function hash(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
const ri=(r,a,b)=>a+Math.floor(r()*(b-a+1));
const pick=(r,a)=>a[Math.floor(r()*a.length)];
let R,cv=$("map"),cx=cv.getContext("2d");cx.setTransform(cv.width/(VW*TS),0,0,cv.height/(VH*TS),0,0);

// ---- floor generation: rooms joined by L-shaped corridors, plus a few loops ----
function genFloor(seed,depth){
  const r=rng(hash(seed+"|"+depth)),map=new Uint8Array(MW*MH),rooms=[];// 0 wall, 1 floor
  for(let tries=0;tries<200&&rooms.length<11;tries++){const w=ri(r,4,9),h=ri(r,4,7),x=ri(r,1,MW-w-2),y=ri(r,1,MH-h-2);
    if(rooms.some(o=>x<o.x+o.w+1&&x+w+1>o.x&&y<o.y+o.h+1&&y+h+1>o.y))continue;rooms.push({x,y,w,h,cx:x+(w>>1),cy:y+(h>>1)})}
  for(const o of rooms)for(let y=o.y;y<o.y+o.h;y++)for(let x=o.x;x<o.x+o.w;x++)map[y*MW+x]=1;
  const dig=(a,b)=>{let x=a.cx,y=a.cy;const hf=r()<.5;const stepX=()=>{while(x!==b.cx){map[y*MW+x]=1;x+=Math.sign(b.cx-x)}},stepY=()=>{while(y!==b.cy){map[y*MW+x]=1;y+=Math.sign(b.cy-y)}};if(hf){stepX();stepY()}else{stepY();stepX()}map[y*MW+x]=1};
  rooms.sort((a,b)=>a.cx-b.cx);for(let i=1;i<rooms.length;i++)dig(rooms[i-1],rooms[i]);
  for(let i=0;i<2;i++)dig(pick(r,rooms),pick(r,rooms));
  const start=rooms[0],end=rooms[rooms.length-1];
  const free=[];for(const o of rooms.slice(1))for(let y=o.y;y<o.y+o.h;y++)for(let x=o.x;x<o.x+o.w;x++)free.push([x,y]);
  const take=()=>{for(let k=0;k<50;k++){const i=Math.floor(r()*free.length),c=free[i];if(c&&!(c[0]===end.cx&&c[1]===end.cy)){free.splice(i,1);return c}}return null};
  const mons=[],items=[],pool=MONS.filter(m=>m[7]<=depth),nM=Math.min(16,4+Math.floor(depth*.7));
  for(let i=0;i<nM;i++){const c=take();if(!c)break;const m=pool.length>3&&r()<.6?pool[ri(r,pool.length-3,pool.length-1)]:pick(r,pool);const sc=1+Math.max(0,depth-m[7])*.06;
    mons.push({id:m[0],x:c[0],y:c[1],hp:Math.round(m[3]*sc),max:Math.round(m[3]*sc),atk:Math.round(m[4]*sc),def:m[5]+Math.floor((depth-m[7])/6),xp:Math.round(m[6]*sc),awake:false})}
  const tier=n=>Math.min(5,Math.floor((depth-1)/3)+ri(r,0,1)-(r()<.3?1:0));
  for(let i=0,n=ri(r,4,6);i<n;i++){const c=take();if(!c)break;const k=r();
    items.push({x:c[0],y:c[1],...(k<.38?{t:"potion"}:k<.46?{t:"elixir"}:k<.56?{t:"bomb"}:k<.64?{t:"tele"}:k<.82?{t:"weapon",lv:Math.max(0,tier())}:{t:"armor",lv:Math.max(0,tier())})})}
  for(let i=0,n=ri(r,2,4);i<n;i++){const c=take();if(c)items.push({x:c[0],y:c[1],t:"gold",n:depth*ri(r,4,12)})}
  return{map,start:[start.cx,start.cy],stairs:[end.cx,end.cy],mons,items,seen:new Uint8Array(MW*MH)};
}
// ---- game state ----
let G=null,vis=new Uint8Array(MW*MH),dist=new Int16Array(MW*MH);
const pass=(x,y)=>x>=0&&y>=0&&x<MW&&y<MH&&G.f.map[y*MW+x]===1;
const monAt=(x,y)=>G.f.mons.find(m=>m.x===x&&m.y===y&&m.hp>0);
const mdef=id=>MONS.find(m=>m[0]===id);
const atk=()=>G.p.batk+WEAPONS[G.p.w][2],def=()=>G.p.bdef+ARMORS[G.p.a][2];
const needXP=lv=>Math.round(10*lv*1.5);
function log(s){G.log.unshift(s);G.log.length=Math.min(G.log.length,30)}
function newGame(daily){
  const d=new Date(),key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  G={seed:daily?"daily-"+key:"free-"+Date.now().toString(36)+Math.random(),daily:daily?key:null,depth:1,dead:false,killer:"",kills:0,gold:0,turn:0,log:[],
     p:{x:0,y:0,hp:30,max:30,batk:3,bdef:0,lv:1,xp:0,w:0,a:0,inv:["potion","potion"]}};
  log(TX.m.start);enterFloor();$("share").innerHTML="";
}
function enterFloor(){G.f=genFloor(G.seed,G.depth);[G.p.x,G.p.y]=G.f.start;log(TX.m.enter(G.depth));fov();save();render()}
function fov(){vis.fill(0);const{x:px,y:py}=G.p;
  for(let dy=-FOV;dy<=FOV;dy++)for(let dx=-FOV;dx<=FOV;dx++){if(dx*dx+dy*dy>FOV*FOV+1)continue;const tx=px+dx,ty=py+dy;if(tx<0||ty<0||tx>=MW||ty>=MH)continue;
    // walk a straight line; walls block what is behind them
    const n=Math.max(Math.abs(dx),Math.abs(dy));let ok=true;for(let i=1;i<n;i++){const x=Math.round(px+dx*i/n),y=Math.round(py+dy*i/n);if(G.f.map[y*MW+x]!==1){ok=false;break}}
    if(ok){vis[ty*MW+tx]=1;G.f.seen[ty*MW+tx]=1}}}
function bfs(){dist.fill(-1);const q=[[G.p.x,G.p.y]];dist[G.p.y*MW+G.p.x]=0;
  for(let i=0;i<q.length;i++){const[x,y]=q[i],d=dist[y*MW+x];if(d>14)continue;for(const[ax,ay]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+ax,ny=y+ay;if(pass(nx,ny)&&dist[ny*MW+nx]<0){dist[ny*MW+nx]=d+1;q.push([nx,ny])}}}}
function strike(a,d,ad,dd){if(Math.random()<.1)return-1;return Math.max(1,ad+Math.floor(Math.random()*3)-dd)}
function gainXP(n){const p=G.p;p.xp+=n;while(p.xp>=needXP(p.lv)){p.xp-=needXP(p.lv);p.lv++;p.max+=6;p.batk+=1;if(p.lv%2===0)p.bdef+=1;p.hp=Math.min(p.max,p.hp+Math.ceil(p.max*.3));log(TX.m.lvup(p.lv))}}
function attack(m){const d=strike(G.p,m,atk(),m.def),name=nm(mdef(m.id).slice(1,3));
  if(d<0){log(TX.m.miss(TX.m.you,name));return}m.hp-=d;m.awake=true;log(TX.m.hit(TX.m.you,name,d));
  if(m.hp<=0){G.kills++;log(TX.m.kill(name,m.xp));gainXP(m.xp)}}
function monsters(){
  bfs();
  for(const m of G.f.mons){if(m.hp<=0)continue;const dd=dist[m.y*MW+m.x];
    if(vis[m.y*MW+m.x])m.awake=true;if(!m.awake||dd<0){if(Math.random()<.3){const[ax,ay]=pick(Math.random,[[1,0],[-1,0],[0,1],[0,-1]]);if(pass(m.x+ax,m.y+ay)&&!monAt(m.x+ax,m.y+ay)&&!(m.x+ax===G.p.x&&m.y+ay===G.p.y)){m.x+=ax;m.y+=ay}}continue}
    if(dd===1){const d=strike(m,G.p,m.atk,def()),name=nm(mdef(m.id).slice(1,3));if(d<0)log(TX.m.miss(name,TX.m.you));else{G.p.hp-=d;log(TX.m.hit(name,TX.m.you,d));if(G.p.hp<=0){die(name);return}}continue}
    if(m.id==="bat"&&Math.random()<.4)continue; // bats flutter erratically
    let best=null;for(const[ax,ay]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=m.x+ax,ny=m.y+ay,nd=dist[ny*MW+nx];if(nd>=0&&nd<dd&&!monAt(nx,ny)&&!(nx===G.p.x&&ny===G.p.y)){best=[nx,ny];break}}
    if(best){m.x=best[0];m.y=best[1]}}
  G.f.mons=G.f.mons.filter(m=>m.hp>0);
}
function die(name){G.dead=true;G.killer=name;G.p.hp=0;log(TX.m.dead(name,G.depth));
  const best=PK.get("kd:best",{});const k=G.daily||"free";if(!best[k]||G.depth>best[k])best[k]=G.depth;PK.set("kd:best",best);
  PK.share($("share"),TX.share(G.daily?(J?"今日のダンジョン ":"Daily ")+G.daily:"",G.depth,G.p.lv,G.gold,G.kills))}
function pickup(){
  const p=G.p,i=G.f.items.findIndex(t=>t.x===p.x&&t.y===p.y);if(i<0)return;const it=G.f.items[i];
  if(it.t==="gold"){G.gold+=it.n;log(TX.m.gold(it.n))}
  else if(it.t==="weapon"){const w=WEAPONS[it.lv];if(it.lv>p.w){p.w=it.lv;log(TX.m.equip(nm(w)))}else log(TX.m.worse(nm(w)))}
  else if(it.t==="armor"){const a=ARMORS[it.lv];if(it.lv>p.a){p.a=it.lv;log(TX.m.equip(nm(a)))}else log(TX.m.worse(nm(a)))}
  else{if(p.inv.length>=8){log(TX.m.full);return}p.inv.push(it.t);log(TX.m.pick(nm(ITEMS[it.t])))}
  G.f.items.splice(i,1);
}
function act(dx,dy){
  if(!G||G.dead)return;
  if(dx||dy){const nx=G.p.x+dx,ny=G.p.y+dy,m=monAt(nx,ny);if(m)attack(m);else if(pass(nx,ny)){G.p.x=nx;G.p.y=ny;pickup();if(nx===G.f.stairs[0]&&ny===G.f.stairs[1])log(TX.m.stairs)}else return}
  endTurn();
}
function endTurn(){G.turn++;fov();monsters();fov();save();render()}
function descend(){if(!G||G.dead||G.p.x!==G.f.stairs[0]||G.p.y!==G.f.stairs[1])return;G.depth++;G.p.hp=Math.min(G.p.max,G.p.hp+Math.ceil(G.p.max*.1));enterFloor()}
function use(i){
  if(!G||G.dead)return;const t=G.p.inv[i];if(!t)return;const p=G.p;G.p.inv.splice(i,1);
  if(t==="potion"){const h=Math.min(p.max-p.hp,15+G.depth*2);p.hp+=h;log(TX.m.heal(h))}
  else if(t==="elixir"){const h=p.max-p.hp;p.hp=p.max;log(TX.m.heal(h))}
  else if(t==="bomb"){log(TX.m.bomb);for(const m of G.f.mons)if(vis[m.y*MW+m.x]){m.hp-=10+G.depth*2;m.awake=true;if(m.hp<=0){G.kills++;const name=nm(mdef(m.id).slice(1,3));log(TX.m.kill(name,m.xp));gainXP(m.xp)}}}
  else if(t==="tele"){const r=Math.random,cells=[];for(let k=0;k<MW*MH;k++)if(G.f.map[k]===1&&!monAt(k%MW,Math.floor(k/MW)))cells.push(k);const c=pick(r,cells);p.x=c%MW;p.y=Math.floor(c/MW);log(TX.m.tele);pickup()}
  endTurn();
}
// ---- save / load (the floor map is stored as a string) ----
function save(){if(!G)return;const f=G.f;PK.set("kd:run",{...G,f:{...f,map:Array.from(f.map).join(""),seen:Array.from(f.seen).join("")}})}
function load(){const s=PK.get("kd:run",null);if(!s||!s.f)return false;s.f.map=Uint8Array.from(s.f.map,Number);s.f.seen=Uint8Array.from(s.f.seen,Number);G=s;fov();return true}
// ---- drawing ----
function rr(x,y,w,h,r){cx.beginPath();cx.roundRect?cx.roundRect(x,y,w,h,r):cx.rect(x,y,w,h)}
function drawMon(m,x,y){const d=mdef(m.id),c=d[8],s=d[9];cx.fillStyle=c;
  if(s==="blob"){cx.beginPath();cx.ellipse(x+16,y+21,11,8,0,0,7);cx.fill();cx.beginPath();cx.arc(x+16,y+15,7,Math.PI,0);cx.fill()}
  else if(s==="bat"){cx.beginPath();cx.moveTo(x+4,y+12);cx.quadraticCurveTo(x+10,y+22,x+16,y+16);cx.quadraticCurveTo(x+22,y+22,x+28,y+12);cx.quadraticCurveTo(x+22,y+15,x+16,y+9);cx.quadraticCurveTo(x+10,y+15,x+4,y+12);cx.fill()}
  else if(s==="rat"){cx.beginPath();cx.ellipse(x+15,y+19,10,6,0,0,7);cx.fill();cx.beginPath();cx.arc(x+24,y+16,4,0,7);cx.fill();cx.strokeStyle=c;cx.lineWidth=2;cx.beginPath();cx.moveTo(x+6,y+20);cx.quadraticCurveTo(x+2,y+26,x+6,y+28);cx.stroke()}
  else if(s==="ghost"){cx.globalAlpha=.85;cx.beginPath();cx.arc(x+16,y+13,9,Math.PI,0);cx.lineTo(x+25,y+27);cx.lineTo(x+20,y+24);cx.lineTo(x+16,y+27);cx.lineTo(x+12,y+24);cx.lineTo(x+7,y+27);cx.closePath();cx.fill();cx.globalAlpha=1}
  else{const big=s==="big";rr(x+(big?5:8),y+(big?6:9),big?22:16,big?22:19,5);cx.fill();cx.fillRect(x+(big?9:11),y+(big?26:26),4,4);cx.fillRect(x+(big?19:17),y+(big?26:26),4,4)}
  cx.fillStyle="#141a2b";const ey=s==="blob"?17:s==="rat"?15:s==="bat"?13:12;if(s==="rat")cx.fillRect(x+25,y+ey,2,2);else{cx.fillRect(x+12,y+ey,3,3);cx.fillRect(x+17,y+ey,3,3)}
  if(m.hp<m.max){cx.fillStyle="#000a";cx.fillRect(x+4,y+2,24,3);cx.fillStyle="#e0614f";cx.fillRect(x+4,y+2,24*m.hp/m.max,3)}}
function drawItem(it,x,y){
  if(it.t==="gold"){cx.fillStyle="#f2b84b";cx.beginPath();cx.arc(x+13,y+18,5,0,7);cx.arc(x+19,y+20,5,0,7);cx.fill();return}
  if(it.t==="weapon"){cx.strokeStyle="#cfd8ec";cx.lineWidth=3;cx.beginPath();cx.moveTo(x+9,y+24);cx.lineTo(x+23,y+8);cx.stroke();cx.strokeStyle="#c9a227";cx.beginPath();cx.moveTo(x+8,y+17);cx.lineTo(x+15,y+24);cx.stroke();return}
  if(it.t==="armor"){cx.fillStyle="#8ea2ff";cx.beginPath();cx.moveTo(x+16,y+7);cx.lineTo(x+25,y+11);cx.lineTo(x+23,y+21);cx.lineTo(x+16,y+26);cx.lineTo(x+9,y+21);cx.lineTo(x+7,y+11);cx.closePath();cx.fill();return}
  const c=ITEMS[it.t][2];if(it.t==="tele"){cx.fillStyle="#efe6cf";cx.fillRect(x+9,y+9,14,15);cx.fillStyle=c;cx.fillRect(x+11,y+13,10,2);cx.fillRect(x+11,y+17,8,2);return}
  if(it.t==="bomb"){cx.fillStyle=c;cx.beginPath();cx.arc(x+16,y+19,7,0,7);cx.fill();cx.fillStyle="#f2b84b";cx.fillRect(x+18,y+9,2,5);return}
  cx.fillStyle=c;cx.beginPath();cx.arc(x+16,y+20,6,0,7);cx.fill();cx.fillRect(x+14,y+9,4,6);
}
function render(){
  if(!G)return;const p=G.p,ox=Math.max(0,Math.min(MW-VW,p.x-(VW>>1))),oy=Math.max(0,Math.min(MH-VH,p.y-(VH>>1)));
  cx.fillStyle="#0b0e1a";cx.fillRect(0,0,VW*TS,VH*TS);
  for(let vy=0;vy<VH;vy++)for(let vx=0;vx<VW;vx++){const x=ox+vx,y=oy+vy,k=y*MW+x;if(!G.f.seen[k])continue;const X=vx*TS,Y=vy*TS,v=vis[k];
    if(G.f.map[k]===1){cx.fillStyle=v?"#3a4166":"#232842";cx.fillRect(X,Y,TS,TS);cx.fillStyle=v?"#424a73":"#262c48";cx.fillRect(X+1,Y+1,TS-2,TS-2)}
    else{cx.fillStyle=v?"#6b5d4f":"#3b342d";cx.fillRect(X,Y,TS,TS);cx.fillStyle=v?"#7d6d5d":"#463e35";cx.fillRect(X,Y,TS,6)}
    if(x===G.f.stairs[0]&&y===G.f.stairs[1]){cx.fillStyle="#f2b84b";for(let i=0;i<4;i++)cx.fillRect(X+6+i*2,Y+8+i*5,20-i*4,3)}}
  for(const it of G.f.items)if(vis[it.y*MW+it.x])drawItem(it,(it.x-ox)*TS,(it.y-oy)*TS);
  for(const m of G.f.mons)if(vis[m.y*MW+m.x])drawMon(m,(m.x-ox)*TS,(m.y-oy)*TS);
  const X=(p.x-ox)*TS,Y=(p.y-oy)*TS;cx.fillStyle=G.dead?"#5b6479":"#2440c4";rr(X+5,Y+5,22,23,6);cx.fill();cx.fillStyle="#8ea2ff";rr(X+8,Y+8,9,7,3);cx.fill();cx.fillStyle="#fff";cx.fillRect(X+12,Y+14,4,5);cx.fillRect(X+18,Y+14,4,5);
  if(G.dead){cx.fillStyle="rgba(11,14,26,.7)";cx.fillRect(0,VH*TS/2-40,VW*TS,80);cx.fillStyle="#fff";cx.textAlign="center";cx.textBaseline="middle";cx.font="700 30px 'Bricolage Grotesque',system-ui,sans-serif";cx.fillText(TX.over,VW*TS/2,VH*TS/2-8);cx.font="500 14px 'IBM Plex Sans JP',system-ui,sans-serif";cx.fillText(TX.fl(G.depth)+" · LV"+p.lv,VW*TS/2,VH*TS/2+22)}
  // side panel
  const pct=Math.max(0,p.hp/p.max);$("hpbar").style.width=pct*100+"%";$("hpbar").classList.toggle("low",pct<.3);$("hptext").textContent=`HP ${Math.max(0,p.hp)} / ${p.max}`;
  const st=[[TX.floor,TX.fl(G.depth)],[TX.lv,`${p.lv} (${p.xp}/${needXP(p.lv)})`],[TX.atk,atk()],[TX.def,def()],[TX.gold,G.gold],[TX.kills,G.kills],[TX.weapon,nm(WEAPONS[p.w])],[TX.armor,nm(ARMORS[p.a])]];
  $("stats").innerHTML=st.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
  $("inv").innerHTML=Array.from({length:8},(_,i)=>{const t=p.inv[i];return`<button type="button" data-i="${i}"${t&&!G.dead?"":" disabled"}>${t?nm(ITEMS[t]):"—"}<small>${i+1}</small></button>`}).join("");
  $("stairs").hidden=G.dead||p.x!==G.f.stairs[0]||p.y!==G.f.stairs[1];
  $("log").innerHTML=G.log.slice(0,3).reverse().map(s=>`<li>${s}</li>`).join("");
  $("mode").textContent=G.daily?TX.modeDaily(G.daily):TX.modeFree;
}
// ---- input ----
const DIRS={ArrowUp:[0,-1],KeyW:[0,-1],KeyK:[0,-1],ArrowDown:[0,1],KeyS:[0,1],KeyJ:[0,1],ArrowLeft:[-1,0],KeyA:[-1,0],KeyH:[-1,0],ArrowRight:[1,0],KeyD:[1,0],KeyL:[1,0]};
cv.addEventListener("keydown",e=>{
  if(DIRS[e.code]){e.preventDefault();act(...DIRS[e.code])}
  else if(e.code==="Space"||e.code==="Period"){e.preventDefault();act(0,0)}
  else if(e.code==="Enter"||e.key===">"){e.preventDefault();descend()}
  else if(/^Digit[1-8]$/.test(e.code)){use(+e.code.slice(5)-1)}});
cv.addEventListener("pointerdown",e=>{cv.focus({preventScroll:true});if(!G||G.dead)return;const r=cv.getBoundingClientRect(),tx=(e.clientX-r.left)/r.width*VW,ty=(e.clientY-r.top)/r.height*VH;
  const ox=Math.max(0,Math.min(MW-VW,G.p.x-(VW>>1))),oy=Math.max(0,Math.min(MH-VH,G.p.y-(VH>>1))),dx=Math.floor(tx)+ox-G.p.x,dy=Math.floor(ty)+oy-G.p.y;
  if(!dx&&!dy){if(G.p.x===G.f.stairs[0]&&G.p.y===G.f.stairs[1])descend();else act(0,0);return}
  Math.abs(dx)>=Math.abs(dy)?act(Math.sign(dx),0):act(0,Math.sign(dy))});
$("pad").addEventListener("click",e=>{const b=e.target.closest("[data-d]");if(!b)return;({up:()=>act(0,-1),down:()=>act(0,1),left:()=>act(-1,0),right:()=>act(1,0),wait:()=>act(0,0)})[b.dataset.d]()});
$("inv").addEventListener("click",e=>{const b=e.target.closest("[data-i]");if(b){use(+b.dataset.i);cv.focus({preventScroll:true})}});
$("stairs").addEventListener("click",()=>{descend();cv.focus({preventScroll:true})});
// Starting a new run while one is in progress needs a second click.
function starter(btn,daily){let armed=false;btn.addEventListener("click",()=>{
  if(G&&!G.dead&&!armed){armed=true;const old=btn.textContent;btn.textContent=TX.confirm;btn.classList.add("confirm");setTimeout(()=>{armed=false;btn.textContent=old;btn.classList.remove("confirm")},3000);return}
  armed=false;btn.classList.remove("confirm");btn.textContent=daily?TX.daily:TX.free;newGame(daily);cv.focus({preventScroll:true})})}
$("daily").textContent=TX.daily;$("free").textContent=TX.free;starter($("daily"),true);starter($("free"),false);
$("l-inv").textContent=TX.inv;$("stairs").textContent=TX.stairs;$("keys").innerHTML=TX.keys;
if(matchMedia("(pointer: coarse)").matches)$("pad").hidden=false;
if(!load())newGame(true);else{if(G.dead)PK.share($("share"),TX.share(G.daily?(J?"今日のダンジョン ":"Daily ")+G.daily:"",G.depth,G.p.lv,G.gold,G.kills))}
render();
