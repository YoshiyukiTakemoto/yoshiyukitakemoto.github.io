// Kit Blaster: an original vertical shooter. All ships and effects are drawn with canvas shapes.
const LANG=document.documentElement.lang==="ja"?"ja":"en";
const $=id=>document.getElementById(id);
const PK=window.PK;
const TX={
en:{title:"KIT BLASTER",start:"Press Space or tap to start",over:"GAME OVER",retry:"Press Space or tap to play again",score:"SCORE",best:"BEST",wave:"WAVE",boss:"WARNING: BOSS",newBest:"NEW BEST!",paused:"PAUSED",
 keys:"Move <kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> / <kbd>WASD</kbd> · Slow <kbd>Shift</kbd> · Pause <kbd>P</kbd> · Auto-fire · On phones, drag anywhere",share:(s,w)=>`I scored ${s.toLocaleString()} and reached wave ${w} in Kit Blaster. Can you beat it?`},
ja:{title:"KIT BLASTER",start:"スペースキーかタップでスタート",over:"GAME OVER",retry:"スペースキーかタップでもう一度",score:"SCORE",best:"BEST",wave:"WAVE",boss:"WARNING: BOSS",newBest:"自己ベスト更新！",paused:"一時停止中",
 keys:"移動 <kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> / <kbd>WASD</kbd>・低速移動 <kbd>Shift</kbd>・一時停止 <kbd>P</kbd>・弾は自動発射・スマホは画面をドラッグ",share:(s,w)=>`Kit Blasterでスコア${s.toLocaleString()}、WAVE ${w}まで到達！ あなたは超えられる？`}
}[LANG];
const W=360,H=640;
const cv=$("game"),cx=cv.getContext("2d");cx.setTransform(cv.width/W,0,0,cv.height/H,0,0);
let state="title",paused=false,t=0,shake=0,best=PK.get("kb:best",0),newBest=false;
let p,shots,eb,enemies,items,parts,stars,wave,queue,score,chain,chainT,banner,bannerT;
const keys={};
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// ---- sound: tiny synth, created on the first user gesture ----
let ac=null,muted=PK.get("kb:muted",false);
function snd(kind){if(muted)return;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain(),n=ac.currentTime;o.connect(g);g.connect(ac.destination);
  const S={boom:["sawtooth",140,40,.25,.12],hit:["square",520,200,.06,.04],item:["triangle",660,1320,.15,.08],hurt:["sawtooth",300,60,.4,.15],boss:["square",110,110,.6,.06]}[kind];
  o.type=S[0];o.frequency.setValueAtTime(S[1],n);o.frequency.exponentialRampToValueAtTime(S[2],n+S[3]);g.gain.setValueAtTime(S[4],n);g.gain.exponentialRampToValueAtTime(.0001,n+S[3]);o.start(n);o.stop(n+S[3])}catch(e){}}

function reset(){
  p={x:W/2,y:H-90,r:5,lives:3,inv:2,cool:0,power:1};
  shots=[];eb=[];enemies=[];items=[];parts=[];wave=0;queue=[];score=0;chain=1;chainT=0;banner="";bannerT=0;newBest=false;
}
stars=Array.from({length:70},()=>({x:Math.random()*W,y:Math.random()*H,s:rnd(.3,1.2)}));

// ---- waves: each wave queues spawns at times; a boss every 5th wave ----
function nextWave(){
  wave++;const n=wave,q=[];let at=0;
  if(n%5===0){q.push({at:1.5,f:()=>spawn("boss",W/2,-60)});banner=TX.boss;bannerT=2;snd("boss")}
  else{banner=`${TX.wave} ${n}`;bannerT=1.4;
    const groups=2+Math.min(6,Math.floor(n/2));
    for(let g=0;g<groups;g++){const r=Math.random(),x=rnd(50,W-50);at+=rnd(1,2.2);
      if(r<.35)for(let i=0;i<5;i++)q.push({at:at+i*.22,f:()=>spawn("drone",x,-20)});
      else if(r<.55||n<2)for(let i=0;i<3;i++)q.push({at:at+i*.35,f:()=>spawn("diver",rnd(40,W-40),-20)});
      else if(r<.78)q.push({at,f:()=>spawn("turret",x,-30)});
      else{const side=Math.random()<.5;for(let i=0;i<6;i++)q.push({at:at+i*.18,f:()=>spawn("spinner",side?-20:W+20,80,side)})}}}
  queue=q.map(s=>({...s,at:t+s.at}));
}
function spawn(type,x,y,side){
  const lvl=1+Math.floor(wave/6),e={type,x,y,x0:x,t:0,hp:1,r:12,score:100,flash:0,fire:rnd(.8,1.6)};
  if(type==="drone"){e.vy=110+wave*3;e.hp=lvl}
  if(type==="diver"){e.hp=lvl;e.r=11;e.score=150}
  if(type==="turret"){e.hp=6*lvl;e.r=16;e.score=400;e.ty=rnd(90,220)}
  if(type==="spinner"){e.hp=lvl;e.r=10;e.score=120;e.side=side;e.cx=side?60:W-60}
  if(type==="boss"){e.hp=e.max=140+60*(wave/5-1);e.r=40;e.score=5000;e.fire=2}
  enemies.push(e);
}
const bspeed=()=>Math.min(280,140+wave*8);
function aim(e,n=1,spread=.25,sp=bspeed()){const a=Math.atan2(p.y-e.y,p.x-e.x);for(let i=0;i<n;i++){const k=a+(i-(n-1)/2)*spread;eb.push({x:e.x,y:e.y,vx:Math.cos(k)*sp,vy:Math.sin(k)*sp,r:4})}}
function ring(e,n,off=0,sp=bspeed()*.8){for(let i=0;i<n;i++){const k=off+i/n*Math.PI*2;eb.push({x:e.x,y:e.y,vx:Math.cos(k)*sp,vy:Math.sin(k)*sp,r:4})}}
function updEnemy(e,dt){
  e.t+=dt;e.flash=Math.max(0,e.flash-dt);
  if(e.type==="drone"){e.y+=e.vy*dt;e.x=e.x0+Math.sin(e.t*3)*28;if(wave>1&&(e.fire-=dt)<0){e.fire=Math.max(1.2,2.6-wave*.08);aim(e)}}
  else if(e.type==="diver"){if(e.t<.9){e.y+=120*dt}else{if(!e.vx){const a=Math.atan2(p.y-e.y,p.x-e.x);e.vx=Math.cos(a)*280;e.vy=Math.sin(a)*280}e.x+=e.vx*dt;e.y+=e.vy*dt}}
  else if(e.type==="turret"){if(e.t<4.5)e.y+=(e.ty-e.y)*Math.min(1,dt*2);else e.y+=90*dt;if(e.t<4.5&&(e.fire-=dt)<0){e.fire=Math.max(.6,1.3-wave*.04);aim(e,wave>4?3:1,.22)}}
  else if(e.type==="spinner"){e.cx+=(e.side?1:-1)*40*dt;const a=e.t*2.4;e.x=e.cx+Math.cos(a)*(e.side?-1:1)*40;e.y=80+e.t*55+Math.sin(a)*30;if(wave>4&&(e.fire-=dt)<0){e.fire=2.4;aim(e)}}
  else if(e.type==="boss"){
    if(e.y<120)e.y+=60*dt;else{e.x=W/2+Math.sin(e.t*.6)*110;
      if((e.fire-=dt)<0){const ph=e.hp/e.max;
        if(ph>.6){aim(e,7,.18);e.fire=1.3}else if(ph>.3){ring(e,16,e.t);aim(e,3,.2);e.fire=1.1}else{ring(e,22,e.t*2);aim(e,5,.15);e.fire=.8}}}}
}
function kill(e){
  score+=e.score*chain;chain=Math.min(8,chain+(chainT>0?1:0));chainT=1.2;
  burst(e.x,e.y,e.type==="boss"?"#ffd166":"#ff7ab8",e.type==="boss"?80:16,e.type==="boss"?320:180);snd("boom");shake=e.type==="boss"?.6:.08;
  const r=Math.random();if(e.type==="boss"){items.push({x:e.x,y:e.y,k:"P"},{x:e.x-20,y:e.y,k:"L"});eb=[]}
  else if(r<(p.power<4?.09:.03))items.push({x:e.x,y:e.y,k:"P"});else if(r>.985)items.push({x:e.x,y:e.y,k:"L"});
}
function burst(x,y,col,n,sp){for(let i=0;i<n;i++){const a=Math.random()*6.28,v=Math.random()*sp;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rnd(.3,.8),col})}}
function hurt(){
  if(p.inv>0)return;p.lives--;p.inv=2.2;p.power=Math.max(1,p.power-1);chain=1;shake=.4;snd("hurt");burst(p.x,p.y,"#8ea2ff",30,220);
  eb=eb.filter(b=>Math.hypot(b.x-p.x,b.y-p.y)>120);
  if(p.lives<0){state="over";if(score>best){best=score;newBest=true;PK.set("kb:best",best)}PK.share($("share"),TX.share(score,wave))}
}
function fire(){
  const s=(x,y,vx,vy)=>shots.push({x:p.x+x,y:p.y+y,vx,vy});
  s(0,-14,0,-620);if(p.power>=2){s(-8,-8,0,-620);s(8,-8,0,-620)}if(p.power>=3){s(-6,-6,-120,-600);s(6,-6,120,-600)}if(p.power>=4){s(-10,-4,-230,-560);s(10,-4,230,-560)}
}
function update(dt){
  t+=dt;bannerT-=dt;shake=Math.max(0,shake-dt);
  for(const s of stars){s.y+=s.s*120*dt;if(s.y>H){s.y=0;s.x=Math.random()*W}}
  for(const q of parts){q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.96;q.vy*=.96}parts=parts.filter(q=>q.life>0);
  if(state!=="play"||paused)return;
  const slow=keys.ShiftLeft||keys.ShiftRight,sp=slow?130:260;
  const dx=(keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0),dy=(keys.ArrowDown||keys.KeyS?1:0)-(keys.ArrowUp||keys.KeyW?1:0);
  const m=dx&&dy?.7071:1;p.x=clamp(p.x+dx*sp*m*dt,12,W-12);p.y=clamp(p.y+dy*sp*m*dt,40,H-20);
  p.inv=Math.max(0,p.inv-dt);chainT-=dt;if(chainT<=0)chain=1;
  if((p.cool-=dt)<=0){p.cool=.11;fire()}
  for(const s of shots){s.x+=s.vx*dt;s.y+=s.vy*dt}shots=shots.filter(s=>s.y>-20&&s.x>-20&&s.x<W+20);
  for(const b of eb){b.x+=b.vx*dt;b.y+=b.vy*dt}eb=eb.filter(b=>b.y>-30&&b.y<H+30&&b.x>-30&&b.x<W+30);
  while(queue.length&&queue[0].at<=t)queue.shift().f();
  for(const e of enemies)updEnemy(e,dt);
  for(const e of enemies){if(e.hp<=0)continue;
    for(const s of shots)if(!s.dead&&Math.abs(s.x-e.x)<e.r+3&&Math.abs(s.y-e.y)<e.r+6){s.dead=1;e.hp--;e.flash=.06;if(e.hp<=0){kill(e);break}else if(e.type==="boss"&&Math.random()<.2)snd("hit")}
    if(e.hp>0&&Math.hypot(e.x-p.x,e.y-p.y)<e.r+p.r+2){hurt();if(e.type!=="boss"){e.hp=0;kill(e)}}}
  shots=shots.filter(s=>!s.dead);
  enemies=enemies.filter(e=>e.hp>0&&e.y<H+50&&e.x>-80&&e.x<W+80&&(e.type==="boss"||e.t<25));
  for(const b of eb)if(Math.hypot(b.x-p.x,b.y-p.y)<b.r+p.r){b.dead=1;hurt()}eb=eb.filter(b=>!b.dead);
  for(const it of items){it.y+=70*dt;if(Math.hypot(it.x-p.x,it.y-p.y)<20){it.got=1;snd("item");if(it.k==="P"){if(p.power<4)p.power++;else score+=1000}else p.lives=Math.min(5,p.lives+1)}}
  items=items.filter(i=>!i.got&&i.y<H+20);
  if(!queue.length&&!enemies.length&&state==="play")nextWave();
}
// ---- drawing ----
function ship(x,y,a=1){cx.globalAlpha=a;
  cx.fillStyle="#ffb347";cx.beginPath();cx.moveTo(x-4,y+10);cx.lineTo(x,y+16+Math.random()*6);cx.lineTo(x+4,y+10);cx.fill();
  cx.fillStyle="#4f6bd8";cx.beginPath();cx.moveTo(x,y-14);cx.lineTo(x+13,y+8);cx.lineTo(x+5,y+11);cx.lineTo(x-5,y+11);cx.lineTo(x-13,y+8);cx.closePath();cx.fill();
  cx.fillStyle="#8ea2ff";cx.fillRect(x-13,y+4,4,6);cx.fillRect(x+9,y+4,4,6);cx.fillStyle="#fff";cx.beginPath();cx.ellipse(x,y-2,3,5,0,0,7);cx.fill();cx.globalAlpha=1}
function drawEnemy(e){
  const f=e.flash>0;cx.save();cx.translate(e.x,e.y);
  if(e.type==="drone"){cx.rotate(e.t*2);cx.fillStyle=f?"#fff":"#ff4fa3";cx.fillRect(-9,-9,18,18);cx.fillStyle="#2a0f2f";cx.fillRect(-4,-4,8,8)}
  else if(e.type==="diver"){if(e.vx)cx.rotate(Math.atan2(e.vy,e.vx)-Math.PI/2);cx.fillStyle=f?"#fff":"#ff8c42";cx.beginPath();cx.moveTo(0,12);cx.lineTo(10,-10);cx.lineTo(0,-4);cx.lineTo(-10,-10);cx.closePath();cx.fill()}
  else if(e.type==="turret"){cx.fillStyle=f?"#fff":"#2ec4b6";cx.beginPath();for(let i=0;i<6;i++){const a=i/6*6.283;cx.lineTo(Math.cos(a)*16,Math.sin(a)*16)}cx.fill();cx.fillStyle="#073b3a";cx.beginPath();cx.arc(0,0,7,0,7);cx.fill();cx.fillStyle="#ff4fa3";cx.beginPath();cx.arc(0,0,3+Math.sin(e.t*8),0,7);cx.fill()}
  else if(e.type==="spinner"){cx.strokeStyle=f?"#fff":"#ffd166";cx.lineWidth=4;cx.beginPath();cx.arc(0,0,8,e.t*6,e.t*6+4.5);cx.stroke()}
  else if(e.type==="boss"){cx.fillStyle=f?"#fff":"#6b3fd1";cx.beginPath();cx.moveTo(-46,-10);cx.lineTo(-24,-30);cx.lineTo(24,-30);cx.lineTo(46,-10);cx.lineTo(30,26);cx.lineTo(-30,26);cx.closePath();cx.fill();
    cx.fillStyle="#2a1660";cx.fillRect(-30,-6,60,14);cx.fillStyle="#ff4fa3";const eye=Math.sin(e.t*3)*10;cx.fillRect(-18+eye,-3,10,8);cx.fillRect(8+eye,-3,10,8);
    cx.fillStyle="#9b7bff";cx.fillRect(-50,-4,8,22);cx.fillRect(42,-4,8,22)}
  cx.restore();
}
function draw(){
  cx.save();if(shake>0)cx.translate((Math.random()-.5)*shake*16,(Math.random()-.5)*shake*16);
  cx.fillStyle="#070b1c";cx.fillRect(-10,-10,W+20,H+20);
  for(const s of stars){cx.fillStyle=`rgba(200,215,255,${.3+s.s*.5})`;cx.fillRect(s.x,s.y,s.s*2,s.s*2+(s.s>1?3:0))}
  for(const it of items){cx.fillStyle=it.k==="P"?"#2ec4b6":"#ff4fa3";cx.beginPath();cx.arc(it.x,it.y,9,0,7);cx.fill();cx.fillStyle="#fff";cx.font="700 11px 'IBM Plex Mono',monospace";cx.textAlign="center";cx.textBaseline="middle";cx.fillText(it.k==="P"?"P":"♥",it.x,it.y+1)}
  for(const e of enemies)drawEnemy(e);
  cx.fillStyle="#9ff0ff";for(const s of shots)cx.fillRect(s.x-1.5,s.y-7,3,12);
  for(const b of eb){cx.fillStyle="#ff4fa3";cx.beginPath();cx.arc(b.x,b.y,b.r+1.5,0,7);cx.fill();cx.fillStyle="#fff";cx.beginPath();cx.arc(b.x,b.y,b.r-1.5,0,7);cx.fill()}
  if(state==="play"||state==="title")ship(p.x,p.y,state==="play"&&p.inv>0&&Math.floor(t*12)%2?.35:1);
  if((keys.ShiftLeft||keys.ShiftRight)&&state==="play"){cx.fillStyle="#fff";cx.beginPath();cx.arc(p.x,p.y,p.r,0,7);cx.fill()}
  for(const q of parts){cx.globalAlpha=Math.min(1,q.life*2);cx.fillStyle=q.col;cx.fillRect(q.x-1.5,q.y-1.5,3,3)}cx.globalAlpha=1;
  cx.restore();
  // HUD
  cx.fillStyle="#fff";cx.font="600 13px 'IBM Plex Mono',monospace";cx.textBaseline="top";cx.textAlign="left";
  cx.fillText(`${TX.score} ${score.toLocaleString()}`,10,10);cx.fillText(`${TX.best} ${best.toLocaleString()}`,10,28);
  if(chain>1){cx.fillStyle="#ffd166";cx.fillText(`x${chain}`,10,46)}
  cx.fillStyle="#9ff0ff";cx.fillText(`${TX.wave} ${wave}  P${p.power}`,10,H-22);
  for(let i=0;i<Math.max(0,p.lives);i++){cx.save();cx.translate(W-20-i*18,H-14);cx.scale(.5,.5);ship(0,0);cx.restore()}
  const boss=enemies.find(e=>e.type==="boss");if(boss){cx.fillStyle="rgba(255,255,255,.2)";cx.fillRect(60,56,W-120,6);cx.fillStyle="#ff4fa3";cx.fillRect(60,56,(W-120)*boss.hp/boss.max,6)}
  const center=(big,small,col="#fff")=>{cx.fillStyle="rgba(7,11,28,.6)";cx.fillRect(0,H/2-60,W,small?110:70);cx.fillStyle=col;cx.textAlign="center";cx.textBaseline="middle";cx.font="700 34px 'Bricolage Grotesque',system-ui,sans-serif";cx.fillText(big,W/2,H/2-28);if(small){cx.fillStyle="#fff";cx.font="500 14px 'IBM Plex Sans JP',system-ui,sans-serif";cx.fillText(small,W/2,H/2+18)}};
  if(state==="title")center(TX.title,TX.start);
  else if(state==="over")center(newBest?TX.newBest:TX.over,`${TX.score} ${score.toLocaleString()} · ${TX.retry}`,newBest?"#ffd166":"#fff");
  else if(paused)center(TX.paused,"");
  else if(bannerT>0){cx.globalAlpha=Math.min(1,bannerT);cx.fillStyle=banner===TX.boss?"#ff4fa3":"#fff";cx.textAlign="center";cx.textBaseline="middle";cx.font="700 26px 'Bricolage Grotesque',system-ui,sans-serif";cx.fillText(banner,W/2,H*.4);cx.globalAlpha=1}
}
let last=performance.now();
function frame(now){const dt=Math.min(1/30,(now-last)/1000);last=now;update(dt/2);update(dt/2);draw();requestAnimationFrame(frame)}
function start(){reset();state="play";paused=false;$("share").innerHTML="";cv.focus({preventScroll:true});try{ac=ac||new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}
function onScreen(){const r=$("stage").getBoundingClientRect();return r.bottom>0&&r.top<innerHeight}
// ---- input ----
const GAME_KEYS=new Set(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space","KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight"]);
addEventListener("keydown",e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  if(state!=="play"){if((e.code==="Space"||e.code==="Enter")&&onScreen()&&(document.activeElement===cv||document.activeElement===document.body)){e.preventDefault();start()}return}
  if(e.code==="KeyP"){paused=!paused;return}
  if(GAME_KEYS.has(e.code)){e.preventDefault();keys[e.code]=true;paused=false}});
addEventListener("keyup",e=>{keys[e.code]=false});
cv.addEventListener("blur",()=>{for(const k in keys)keys[k]=false});
// Drag anywhere: the ship moves by the same distance as the finger, so it stays visible above it.
let drag=null;
cv.addEventListener("pointerdown",e=>{e.preventDefault();cv.focus({preventScroll:true});if(state!=="play"){start();return}paused=false;cv.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,px:p.x,py:p.y}});
cv.addEventListener("pointermove",e=>{if(!drag||state!=="play")return;const k=W/cv.getBoundingClientRect().width*1.25;p.x=clamp(drag.px+(e.clientX-drag.x)*k,12,W-12);p.y=clamp(drag.py+(e.clientY-drag.y)*k,40,H-20)});
for(const ev of["pointerup","pointercancel"])cv.addEventListener(ev,()=>{drag=null});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&state==="play")paused=true});
$("mute").textContent=muted?"🔇":"🔊";$("mute").addEventListener("click",()=>{muted=!muted;PK.set("kb:muted",muted);$("mute").textContent=muted?"🔇":"🔊"});
$("fs").addEventListener("click",()=>{const s=$("stage");try{document.fullscreenElement?document.exitFullscreen():s.requestFullscreen()}catch(e){}});
$("keys").innerHTML=TX.keys;
reset();requestAnimationFrame(frame);
