// Kit Jump: an original endless platformer. All art is drawn with canvas shapes.
const LANG=document.documentElement.lang==="ja"?"ja":"en";
const $=id=>document.getElementById(id);
const PK=window.PK;
const TX={
en:{title:"KIT JUMP",start:"Press Space or tap to start",over:"GAME OVER",retry:"Press Space or tap to try again",score:"SCORE",best:"BEST",coins:"COINS",newBest:"NEW BEST!",paused:"PAUSED",
 keys:"Move <kbd>←</kbd> <kbd>→</kbd> / <kbd>A</kbd> <kbd>D</kbd> · Jump <kbd>Space</kbd> / <kbd>↑</kbd> / <kbd>W</kbd> (hold to jump higher)",share:(s,d)=>`I scored ${s} in Kit Jump and ran ${d} m. Can you beat it?`},
ja:{title:"KIT JUMP",start:"スペースキーかタップでスタート",over:"GAME OVER",retry:"スペースキーかタップでもう一度",score:"SCORE",best:"BEST",coins:"COINS",newBest:"自己ベスト更新！",paused:"一時停止中",
 keys:"移動 <kbd>←</kbd> <kbd>→</kbd> / <kbd>A</kbd> <kbd>D</kbd>・ジャンプ <kbd>Space</kbd> / <kbd>↑</kbd> / <kbd>W</kbd>（長押しで高く跳ぶ）",share:(s,d)=>`Kit Jumpでスコア${s}（${d}m）を出しました。あなたは超えられる？`}
}[LANG];
const W=640,H=360,T=30,ROWS=12;
const G=1800,JUMP=640,RUN=220,ACC=1600,FRIC=1400;
const cv=$("game"),cx=cv.getContext("2d");cx.setTransform(cv.width/W,0,0,cv.height/H,0,0);
let cols,genX,gh,enemies,parts,p,cam,state="title",score,coins,stomps,best=PK.get("kj:best",0),paused=false,newBest=false,t=0;
const keys={left:false,right:false,jump:false};let jumpPressed=false;
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));

// ---- level generation: columns of 12 tiles. 0 empty, 1 ground, 2 block, 3 coin ----
function col(h){const c=new Int8Array(ROWS);for(let r=ROWS-h;r<ROWS;r++)c[r]=1;return c}
function put(c){cols[genX++]=c;return c}
function flat(n,opts={}){const start=genX;for(let i=0;i<n;i++){const c=put(col(gh));if(opts.coins&&i>0&&i<n-1)c[ROWS-gh-2]=3}
  if(opts.enemy&&n>=5)enemies.push({x:(start+n-2)*T,y:(ROWS-gh)*T-20,w:24,h:20,vx:-45,alive:true,dead:0})}
function generate(upTo){
  while(genX<upTo){
    const d=Math.min(1,genX/700);
    if(genX<18){flat(1);continue}
    const r=Math.random();
    if(r<.32)flat(rnd(4,9),{coins:Math.random()<.4,enemy:Math.random()<.35+.4*d});
    else if(r<.52){const n=rnd(2,2+Math.round(2*d));for(let i=0;i<n;i++){const c=put(new Int8Array(ROWS));if(n>=3&&i===Math.floor(n/2))c[ROWS-gh-3]=3}flat(rnd(3,4))}
    else if(r<.66){gh=Math.max(2,Math.min(6,gh+(Math.random()<.5?1:-1)*(Math.random()<.3?2:1)));flat(rnd(3,5))}
    else if(r<.8){const a=1,w=rnd(3,4),n=a+w+rnd(1,2),py=ROWS-gh-2; // floating platform 2 blocks up, at most 2 empty columns after it
      for(let i=0;i<n;i++){const c=put(new Int8Array(ROWS));if(i>=a&&i<a+w){c[py]=2;if(Math.random()<.6)c[py-1]=3}}flat(rnd(3,4))}
    else if(r<.9){flat(2);const hgt=rnd(1,2);for(let i=0;i<rnd(1,2);i++){const c=put(col(gh));for(let k=1;k<=hgt;k++)c[ROWS-gh-k]=2}flat(3,{enemy:Math.random()<.3+.4*d})}
    else{flat(2);const py=ROWS-gh-3;for(let i=0;i<4;i++){const c=put(col(gh));c[py]=i%2?3:2;if(i%2)c[py]=2,c[py-1]=3}flat(3,{coins:true})}
  }
}
const tile=(tx,ty)=>ty<0||ty>=ROWS?0:(cols[tx]?cols[tx][ty]:0);
const solid=(tx,ty)=>{const v=tile(tx,ty);return v===1||v===2};

function reset(){cols=[];genX=0;gh=3;enemies=[];parts=[];const spawnY=(ROWS-gh)*T-28;generate(60); // spawn height uses the starting ground, before generation changes gh
  p={x:3*T,y:spawnY,w:22,h:28,vx:0,vy:0,ground:false,coy:0,buf:0,face:1,sq:0,maxX:3*T};cam=0;score=0;coins=0;stomps=0;newBest=false}
// Move an entity along one axis and resolve collisions against solid tiles.
function move(e,dx,dy){
  e.x+=dx;let x0=Math.floor(e.x/T),x1=Math.floor((e.x+e.w-.01)/T),y0=Math.floor(e.y/T),y1=Math.floor((e.y+e.h-.01)/T),hitX=false;
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)if(solid(tx,ty)){if(dx>0)e.x=tx*T-e.w;else if(dx<0)e.x=(tx+1)*T;hitX=true}
  e.y+=dy;x0=Math.floor(e.x/T);x1=Math.floor((e.x+e.w-.01)/T);y0=Math.floor(e.y/T);y1=Math.floor((e.y+e.h-.01)/T);let hitY=0;
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)if(solid(tx,ty)){if(dy>0){e.y=ty*T-e.h;hitY=1}else if(dy<0){e.y=(ty+1)*T;hitY=-1}}
  return{hitX,hitY};
}
function burst(x,y,col,n){for(let i=0;i<n;i++)parts.push({x,y,vx:(Math.random()-.5)*220,vy:-Math.random()*260,life:.6,col})}
function die(){state="over";burst(p.x+p.w/2,p.y+p.h/2,"#2440c4",24);if(score>best){best=score;newBest=true;PK.set("kj:best",best)}
  PK.share($("share"),TX.share(score,Math.floor(p.maxX/T)))}
function update(dt){
  t+=dt;for(const q of parts){q.life-=dt;q.vy+=G*.6*dt;q.x+=q.vx*dt;q.y+=q.vy*dt}parts=parts.filter(q=>q.life>0);
  if(state!=="play"||paused)return;
  const dir=(keys.right?1:0)-(keys.left?1:0);
  if(dir){p.vx+=dir*ACC*dt;p.vx=Math.max(-RUN,Math.min(RUN,p.vx));p.face=dir}else{const f=FRIC*dt;p.vx=Math.abs(p.vx)<=f?0:p.vx-Math.sign(p.vx)*f}
  if(jumpPressed){p.buf=.12;jumpPressed=false}else p.buf-=dt;
  p.coy=p.ground?.09:p.coy-dt;
  if(p.buf>0&&p.coy>0){p.vy=-JUMP;p.buf=0;p.coy=0;p.ground=false}
  if(!keys.jump&&p.vy<-260)p.vy=-260; // release early for a short hop
  p.vy=Math.min(900,p.vy+G*dt);
  const wasAir=!p.ground,r=move(p,p.vx*dt,p.vy*dt);
  if(r.hitX)p.vx=0;
  if(r.hitY>0){if(wasAir&&p.vy>300)p.sq=.12;p.vy=0;p.ground=true}else{if(r.hitY<0)p.vy=0;p.ground=false}
  if(p.x<cam){p.x=cam;p.vx=Math.max(0,p.vx)}
  p.sq=Math.max(0,p.sq-dt);
  // coins
  for(let ty=Math.floor(p.y/T);ty<=Math.floor((p.y+p.h)/T);ty++)for(let tx=Math.floor(p.x/T);tx<=Math.floor((p.x+p.w)/T);tx++)if(tile(tx,ty)===3){cols[tx][ty]=0;coins++;burst(tx*T+15,ty*T+15,"#f2b84b",8)}
  // enemies
  for(const e of enemies){if(!e.alive){e.dead-=dt;continue}if(e.x>cam+W+60)continue;
    e.vy=(e.vy||0)+G*dt;const er=move(e,e.vx*dt,e.vy*dt);if(er.hitY>0)e.vy=0;
    const front=e.vx<0?Math.floor((e.x-1)/T):Math.floor((e.x+e.w+1)/T);if(er.hitX||(er.hitY>0&&!solid(front,Math.floor((e.y+e.h+2)/T))))e.vx=-e.vx;
    if(e.y>H+40)e.alive=false;
    if(p.x<e.x+e.w&&p.x+p.w>e.x&&p.y<e.y+e.h&&p.y+p.h>e.y){
      if(p.vy>0&&p.y+p.h-e.y<16){e.alive=false;e.dead=.4;stomps++;p.vy=keys.jump?-JUMP*.95:-JUMP*.6;burst(e.x+12,e.y+10,"#8a5cc2",12)}else{die();return}}}
  enemies=enemies.filter(e=>e.alive||e.dead>0).filter(e=>e.x>cam-80);
  if(p.y>H+60){die();return}
  // camera follows; the world is generated ahead and forgotten behind
  cam=Math.max(cam,p.x-W*.4);generate(Math.floor((cam+W)/T)+30);
  for(let i=Math.floor(cam/T)-10;i>=0&&cols[i];i--)delete cols[i];
  p.maxX=Math.max(p.maxX,p.x);score=Math.floor((p.maxX-3*T)/T)+coins*10+stomps*50;
}
// ---- drawing ----
function rr(x,y,w,h,r){cx.beginPath();cx.roundRect?cx.roundRect(x,y,w,h,r):cx.rect(x,y,w,h)}
function draw(){
  const g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#7cc4f2");g.addColorStop(1,"#d9f0ff");cx.fillStyle=g;cx.fillRect(0,0,W,H);
  // parallax: clouds and two hill layers
  cx.fillStyle="rgba(255,255,255,.9)";for(let i=0;i<6;i++){const x=((i*170-cam*.2)%(W+200)+W+200)%(W+200)-100,y=40+(i*37)%70;cx.beginPath();cx.ellipse(x,y,34,12,0,0,7);cx.ellipse(x+22,y-8,22,14,0,0,7);cx.fill()}
  for(const [k,col,h0,amp] of [[.3,"#9bd6a8",250,30],[.55,"#6cbf83",280,24]]){cx.fillStyle=col;cx.beginPath();cx.moveTo(0,H);for(let x=0;x<=W;x+=8){const wx=x+cam*k;cx.lineTo(x,h0-amp*Math.sin(wx/90)-amp*.5*Math.sin(wx/37))}cx.lineTo(W,H);cx.fill()}
  cx.save();cx.translate(-Math.floor(cam),0);
  const a=Math.floor(cam/T)-1,b=a+Math.ceil(W/T)+2;
  for(let tx=a;tx<=b;tx++){const c=cols[tx];if(!c)continue;for(let ty=0;ty<ROWS;ty++){const v=c[ty],x=tx*T,y=ty*T;
    if(v===1){cx.fillStyle="#b07a4a";cx.fillRect(x,y,T,T);cx.fillStyle="#9a6a3f";cx.fillRect(x+4,y+12,5,5);cx.fillRect(x+18,y+20,4,4);
      if(!solid(tx,ty-1)){cx.fillStyle="#4caf50";cx.fillRect(x,y,T,9);cx.fillStyle="#3d9142";cx.fillRect(x,y+7,T,3)}}
    else if(v===2){cx.fillStyle="#2440c4";rr(x+1,y+1,T-2,T-2,6);cx.fill();cx.fillStyle="#4f6bd8";rr(x+5,y+5,T-10,T-10,4);cx.fill()}
    else if(v===3){const bob=Math.sin(t*5+tx)*2;cx.fillStyle="#f2b84b";cx.beginPath();cx.arc(x+15,y+15+bob,8,0,7);cx.fill();cx.fillStyle="#fff3c4";cx.fillRect(x+12,y+10+bob,3,7)}}}
  for(const e of enemies){if(e.x>cam+W+40)continue;const sq=e.alive?1:.35,eh=e.h*sq;
    cx.fillStyle="#8a5cc2";rr(e.x,e.y+e.h-eh,e.w,eh,8);cx.fill();
    if(e.alive){cx.fillStyle="#fff";const ex=e.vx<0?4:10;cx.fillRect(e.x+ex,e.y+5,4,5);cx.fillRect(e.x+ex+7,e.y+5,4,5);cx.fillStyle="#141a2b";cx.fillRect(e.x+ex+(e.vx<0?0:2),e.y+7,2,3);cx.fillRect(e.x+ex+7+(e.vx<0?0:2),e.y+7,2,3)}}
  if(state!=="over"){const s=p.sq>0?.8:1,w=p.w/s*(s<1?1.15:1),h=p.h*s;const x=p.x+(p.w-w)/2,y=p.y+p.h-h;
    cx.fillStyle="#2440c4";rr(x,y,w,h,7);cx.fill();cx.fillStyle="#8ea2ff";rr(x+3,y+3,w*.45,h*.35,4);cx.fill();
    cx.fillStyle="#fff";const ex=p.face>0?w*.45:w*.15;cx.fillRect(x+ex,y+8,5,7);cx.fillRect(x+ex+8,y+8,5,7);cx.fillStyle="#141a2b";cx.fillRect(x+ex+(p.face>0?2:0),y+10,3,4);cx.fillRect(x+ex+8+(p.face>0?2:0),y+10,3,4)}
  for(const q of parts){cx.globalAlpha=Math.max(0,q.life/.6);cx.fillStyle=q.col;cx.fillRect(q.x,q.y,4,4)}cx.globalAlpha=1;
  cx.restore();
  // HUD
  cx.font="600 14px 'IBM Plex Mono',monospace";cx.textBaseline="top";cx.fillStyle="#141a2b";cx.textAlign="left";
  cx.fillText(`${TX.score} ${score}`,14,12);cx.fillText(`${TX.coins} ${coins}`,14,30);cx.textAlign="right";cx.fillText(`${TX.best} ${best}`,W-56,12);
  const center=(big,small,y=H/2-30)=>{cx.fillStyle="rgba(20,26,43,.55)";cx.fillRect(0,y-24,W,small?96:70);cx.fillStyle="#fff";cx.textAlign="center";cx.font="700 40px 'Bricolage Grotesque',system-ui,sans-serif";cx.fillText(big,W/2,y-12);if(small){cx.font="500 16px 'IBM Plex Sans JP',system-ui,sans-serif";cx.fillText(small,W/2,y+38)}};
  if(state==="title")center(TX.title,TX.start);
  if(state==="over")center(newBest?TX.newBest:TX.over,`${TX.score} ${score} · ${TX.retry}`);
  if(paused&&state==="play")center(TX.paused,"");
}
let last=performance.now();
function frame(now){const dt=Math.min(1/30,(now-last)/1000);last=now;
  // two fixed sub-steps per frame keep collisions stable
  update(dt/2);update(dt/2);draw();requestAnimationFrame(frame)}
function start(){reset();state="play";$("share").innerHTML="";cv.focus({preventScroll:true})}
function onScreen(){const r=$("stage").getBoundingClientRect();return r.bottom>0&&r.top<innerHeight}
// ---- input ----
const KEYMAP={ArrowLeft:"left",KeyA:"left",ArrowRight:"right",KeyD:"right",Space:"jump",ArrowUp:"jump",KeyW:"jump",KeyZ:"jump"};
addEventListener("keydown",e=>{const k=KEYMAP[e.code];if(!k||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  if(state!=="play"){if(k==="jump"&&onScreen()&&(document.activeElement===cv||document.activeElement===document.body)){e.preventDefault();start()}return}
  e.preventDefault();if(k==="jump"&&!keys.jump)jumpPressed=true;keys[k]=true});
addEventListener("keyup",e=>{const k=KEYMAP[e.code];if(k)keys[k]=false});
cv.addEventListener("pointerdown",e=>{e.preventDefault();cv.focus({preventScroll:true});if(state!=="play")start();else if(e.pointerType==="mouse"){jumpPressed=true;keys.jump=true}});
cv.addEventListener("pointerup",()=>{if(state==="play")keys.jump=false});
const touch=$("touch");
if(matchMedia("(pointer: coarse)").matches)touch.hidden=false;
touch.querySelectorAll("button").forEach(b=>{const k=b.dataset.k;
  b.addEventListener("pointerdown",e=>{e.preventDefault();if(state!=="play"){start();return}if(k==="jump"&&!keys.jump)jumpPressed=true;keys[k]=true;b.classList.add("on");b.setPointerCapture(e.pointerId)});
  for(const ev of["pointerup","pointercancel","lostpointercapture"])b.addEventListener(ev,()=>{keys[k]=false;b.classList.remove("on")})});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&state==="play")paused=true});
cv.addEventListener("blur",()=>{if(state==="play"){keys.left=keys.right=keys.jump=false}});
addEventListener("keydown",e=>{if(e.code==="KeyP"&&state==="play")paused=!paused;else if(paused&&KEYMAP[e.code])paused=false});
cv.addEventListener("pointerdown",()=>{paused=false});
$("fs").addEventListener("click",()=>{const s=$("stage");try{document.fullscreenElement?document.exitFullscreen():s.requestFullscreen()}catch(e){}});
$("keys").innerHTML=TX.keys;
reset();requestAnimationFrame(frame);
