// 白いぼうし — あらすじ絵本
// 絵・音・物語の進行をすべてこのファイルで行います（ライブラリ不要）。
(function(){
const TAU=Math.PI*2;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const cv=document.getElementById('scene'),ctx=cv.getContext('2d');
const $=id=>document.getElementById(id);
const HORI=0, YANA=1500, FIELD=3200, HAT=YANA+200;

let W=0,H=0,DPR=1,S=1,GY=0,CX=0;
function resize(){DPR=Math.min(2,devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);layout();}
/* 画面の大きさと向きに合わせて、絵の大きさと位置を決める。
   文章カードが下にあるときはその上の空き、横にあるときはその左の空きに、景色がおさまるようにする */
function layout(){
  const card=document.getElementById('card');if(!card)return;
  const side=card.offsetLeft>W*.3, top=48;
  const areaW=side?card.offsetLeft:W, areaH=side?H:card.offsetTop+card.querySelector('.inner').offsetTop;
  S=Math.max(.6,Math.min(3.2,Math.min(areaW/380,(areaH-top)/330)));
  const band=311*S;GY=top+Math.max(0,(areaH-top-band)/2)+215*S;CX=areaW/2;
}
addEventListener('resize',resize);resize();

/* ---------- state ---------- */
let T=0, step=-1;
const taxi={x:HORI,v:0,wheel:0,drive:null};
const cam={x:HORI+90};
let light='red', orange='car', orangeAnim=0, hat='ground', hatLift=0, nameTag=0, girl=0, family=null, matsui=0;
let fly=null; const parts=[]; let fieldFlies=[];
for(let i=0;i<16;i++)fieldFlies.push({bx:FIELD-250+Math.random()*700,by:-40-Math.random()*90,ph:Math.random()*TAU,sp:.6+Math.random()*.8});
const clouds=Array.from({length:7},(_,i)=>({x:i*420+Math.random()*200,y:-260+Math.random()*90,s:.7+Math.random()*.7}));
const willows=[];for(let x=1000,i=0;x<=2550;x+=230,i++)willows.push({x,ph:Math.random()*TAU,flip:i%2?-1:1,s:.9+((i*37)%5)*.05});
const TAXI_SRC='assets/img/taxi.webp';
const GENT_SRC='assets/img/gentleman.webp';
const HEAD_SRC='assets/img/gentleman-head.webp';
const ready=i=>i.complete&&i.naturalWidth>0;
const taxiImg=new Image();taxiImg.src=TAXI_SRC;
const gentImg=new Image();gentImg.src=GENT_SRC;
const headImg=new Image();headImg.src=HEAD_SRC;
const TSC=150/1620;
const lx=px=>(px-890)*TSC, ly=py=>22+(py-789)*TSC;
const REAR={x:lx(505),y:ly(255),w:(830-505)*TSC,h:(420-255)*TSC};
const FRONT={x:lx(875),y:ly(255),w:(1165-875)*TSC,h:(420-255)*TSC};
const gent={mode:'stand',x:HORI+112,t:0,from:0,to:0,dur:1};
function gentMove(mode,from,to,dur){gent.mode=mode;gent.t=0;gent.from=from;gent.to=to;gent.dur=dur;gent.x=from;}
const momImg=new Image();momImg.src='assets/img/mother.webp';
const boyImg=new Image();boyImg.src='assets/img/boy.webp';
const matsuiImg=new Image();matsuiImg.src='assets/img/matsui.webp';
const mHeadImg=new Image();mHeadImg.src='assets/img/matsui-head.webp';
const bflyImg=new Image();bflyImg.src='assets/img/butterfly.webp';
const hatImg=new Image();hatImg.src='assets/img/hat.webp';
const orangeImg=new Image();orangeImg.src='assets/img/natsumikan.webp';
const gHeadImg=new Image();gHeadImg.src='assets/img/girl-head.webp';
const willowImg=new Image();willowImg.src='assets/img/willow.webp';

/* ---------- sound ---------- */
let ac=null,sound=true,master=null,bgmGain=null,bus=null;
function audioInit(){
  try{ac=new (window.AudioContext||window.webkitAudioContext)();}catch(e){ac=null;return;}
  master=ac.createGain();master.gain.value=1;master.connect(ac.destination);
  bgmGain=ac.createGain();bgmGain.gain.value=0;bgmGain.connect(master);
  // やわらかい響き（手作りのリバーブ）
  bus=ac.createGain();bus.connect(bgmGain);
  const rv=ac.createConvolver(),len=ac.sampleRate*2.2,buf=ac.createBuffer(2,len,ac.sampleRate);
  for(let c=0;c<2;c++){const d=buf.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3);}
  rv.buffer=buf;const wet=ac.createGain();wet.gain.value=.3;bus.connect(rv);rv.connect(wet);wet.connect(bgmGain);
  setInterval(tick,25);
  document.addEventListener('visibilitychange',()=>{if(!ac)return;document.hidden?ac.suspend():ac.resume();});
}
function tone(f,when,dur,vol,type){const o=ac.createOscillator(),g=ac.createGain();o.type=type||'triangle';o.frequency.value=f;
  g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(vol,when+.02);g.gain.exponentialRampToValueAtTime(.0001,when+dur);
  o.connect(g);g.connect(master);o.start(when);o.stop(when+dur+.05);}
function chime(n){if(!ac)return;try{const t=ac.currentTime;n.forEach((f,i)=>tone(f,t+i*.11,1.2,.06));}catch(e){}}

/* ---------- BGM（WebAudioで演奏するオリジナル曲） ---------- */
const mtof=m=>440*Math.pow(2,(m-69)/12);
const _=null;
const TRACKS={
  // まちの曲：初夏の大通り、明るく軽やかに
  A:{bpm:100,inst:'pluck',melVol:.11,padVol:.03,bassVol:.09,bass:[0,4],sparkle:0,
     chords:[[53,57,60],[50,53,57],[46,50,53],[48,52,55],[53,57,60],[45,48,52],[46,50,53],[53,57,60]],
     mel:[[72,_,69,72,74,72,69,_],[69,_,65,67,69,_,_,_],[70,_,74,72,70,69,67,_],[67,_,69,70,72,_,_,_],
          [72,_,77,76,74,72,_,69],[72,_,69,67,69,_,64,_],[65,67,69,70,72,74,72,70],[69,_,65,_,65,_,_,_]]},
  // ふしぎの曲：帽子と蝶、女の子。ゆっくり、オルゴールのように
  B:{bpm:72,inst:'bell',melVol:.07,padVol:.028,bassVol:.07,bass:[0],bassLen:7,sparkle:.12,
     chords:[[50,53,57,64],[46,50,53,57],[43,50,53,58],[45,52,55,60]],
     mel:[[81,_,_,76,_,77,_,_],[74,_,_,_,72,_,74,_],[77,_,76,_,74,_,_,_],[76,_,_,72,_,_,_,_]]},
  // 菜の花の曲：ひらけた景色、あたたかく
  C:{bpm:92,inst:'pluck',melVol:.1,padVol:.034,bassVol:.09,bass:[0,4,6],sparkle:.06,
     chords:[[48,52,55],[45,48,52],[41,45,48],[43,47,50]],
     mel:[[76,_,79,_,81,79,76,_],[72,_,76,_,74,_,_,_],[77,_,76,74,72,_,69,_],[71,_,72,74,79,_,_,_]]}
};
const BGM_VOL=.55;
const seq={track:null,want:null,bar:0,eighth:0,nextTime:0,switchAt:0};
function voice(f,t,dur,vol,type,attack){const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(bus);o.start(t);o.stop(t+dur+.05);}
function bell(f,t,vol){voice(f,t,1.6,vol,'sine',.005);voice(f*2.01,t,.7,vol*.35,'sine',.005);}
function pluck(f,t,dur,vol){voice(f,t,dur,vol,'triangle',.01);voice(f*2,t,dur*.5,vol*.18,'sine',.01);}
function scheduleEighth(t){
  const tr=TRACKS[seq.track],bar=seq.bar%tr.chords.length,e=seq.eighth,d=60/tr.bpm/2,ch=tr.chords[bar];
  if(e===0)ch.forEach(m=>voice(mtof(m),t,d*8.5,tr.padVol,'sine',.4));
  if(tr.bass.includes(e))voice(mtof(ch[0]-12),t,d*(tr.bassLen||2),tr.bassVol,'sine',.02);
  const m=tr.mel[bar][e];
  if(m!=null){tr.inst==='bell'?bell(mtof(m),t,tr.melVol):pluck(mtof(m),t,d*1.8,tr.melVol);}
  if(tr.sparkle&&Math.random()<tr.sparkle)bell(mtof(ch[Math.floor(Math.random()*ch.length)]+24),t+d*.5,.018);
  seq.eighth++;if(seq.eighth>=8){seq.eighth=0;seq.bar++;}
  seq.nextTime+=d;
}
function tick(){
  if(!ac||!seq.track)return;
  if(seq.nextTime<ac.currentTime)seq.nextTime=ac.currentTime+.05;
  while(seq.nextTime<ac.currentTime+.15){
    if(seq.switchAt&&seq.nextTime>=seq.switchAt){
      seq.track=seq.want;seq.bar=0;seq.eighth=0;seq.switchAt=0;
      const g=bgmGain.gain;g.cancelScheduledValues(seq.nextTime);g.setValueAtTime(0,seq.nextTime);g.linearRampToValueAtTime(BGM_VOL,seq.nextTime+1.2);
    }
    scheduleEighth(seq.nextTime);
  }
}
function fadeTo(v,dur){const g=bgmGain.gain,n=ac.currentTime;g.cancelScheduledValues(n);g.setValueAtTime(g.value,n);g.linearRampToValueAtTime(v,n+dur);}
function setTrack(name){
  if(!ac||seq.want===name)return;seq.want=name;
  if(!seq.track){seq.track=name;seq.bar=0;seq.eighth=0;seq.nextTime=ac.currentTime+.1;fadeTo(BGM_VOL,1.5);return;}
  fadeTo(0,.7);seq.switchAt=ac.currentTime+.75;
}

$('snd').addEventListener('click',()=>{sound=!sound;if(master){const n=ac.currentTime;master.gain.cancelScheduledValues(n);master.gain.setValueAtTime(master.gain.value,n);master.gain.linearRampToValueAtTime(sound?1:0,n+.3);}$('snd').innerHTML=sound?'<ruby>音<rt>おと</rt></ruby> オン':'<ruby>音<rt>おと</rt></ruby> オフ';$('snd').setAttribute('aria-pressed',sound);});

/* ---------- story ---------- */
const HORI_W='堀{ほり}ばた', YANA_W='柳{やなぎ}の裏通{うらどお}り';
const STEPS=[
 {where:HORI_W,text:'お堀{ほり}ばたで乗{の}せた紳士{しんし}が、レモンの匂{にお}いかとたずねました。赤信号{あかしんごう}でブレーキをかけた運転手{うんてんしゅ}の松井{まつい}さんは、にこにこして首{くび}をふります。',btn:'つぎへ',go:()=>next()},
 {where:HORI_W,text:'匂{にお}いのもとは夏{なつ}みかん。田舎{いなか}のおふくろが、もぎたてを速達{そくたつ}で送{おく}ってくれたのです。嬉{うれ}しくて、いちばん大{おお}きいのを車{くるま}に乗{の}せてきました。',btn:'信号{しんごう}が青{あお}になる',
  go:()=>{light='green';chime([523,659]);driveTo(YANA,3.2,()=>{gentMove('exit',taxi.x-10,taxi.x-190,3.2);next();});}},
 {where:YANA_W,text:'細{ほそ}い裏通{うらどお}りで紳士{しんし}をおろしたあと、柳{やなぎ}の下{した}の車道{しゃどう}ぎわに、小{ちい}さな白{しろ}い帽子{ぼうし}が落{お}ちているのを見{み}つけました。このままでは車{くるま}にひかれてしまいます。',btn:'帽子{ぼうし}をひろう',go:pickHat},
 {where:YANA_W,text:'つまみ上{あ}げたとたん、中{なか}から白{しろ}い蝶{ちょう}がふわりと飛{と}び出{だ}しました。蝶{ちょう}は高{たか}く舞{ま}い上{あ}がり、並木{なみき}の向{む}こうへ見{み}えなくなりました。',btn:'帽子{ぼうし}のうらを見{み}る',go:()=>{nameTag=1;chime([659]);next();}},
 {where:YANA_W,text:'帽子{ぼうし}のうらには、赤{あか}い糸{いと}で男{おとこ}の子{こ}の名前{なまえ}。とっておいた蝶{ちょう}がいなくなっていたら、その子{こ}はきっとしょんぼりするでしょう。',btn:'夏{なつ}みかんを置{お}く',go:placeOrange},
 {where:YANA_W,text:'松井{まつい}さんは夏{なつ}みかんに白{しろ}い帽子{ぼうし}をかぶせ、風{かぜ}で飛{と}ばないように石{いし}でつばをおさえました。甘{あま}ずっぱい匂{にお}いが、あたりにひろがります。',btn:'車{くるま}にもどる',go:()=>{matsui=0;girl=1;chime([784,659]);next();}},
 {where:YANA_W,text:'車{くるま}にもどると、後{うし}ろの席{せき}におかっぱの女{おんな}の子{こ}がちょこんと座{すわ}っていました。道{みち}に迷{まよ}ったという女{おんな}の子{こ}の行{い}き先{さき}は、菜{な}の花橋{はなばし}です。',btn:'エンジンをかける',go:()=>{family={x:HAT+520,t:0};next();}},
 {where:YANA_W,text:'向{む}こうから、虫{むし}とりあみを抱{かか}えた男{おとこ}の子{こ}が、お母{かあ}さんの手{て}を引{ひ}いてやってきます。女{おんな}の子{こ}は身{み}をのりだして、早{はや}く行{い}ってとせかしました。',btn:'アクセルを踏{ふ}む',
  go:()=>{chime([392,523,659]);driveTo(FIELD,4.2,()=>next());}},
 {where:'菜{な}の花橋{はなばし}',text:'柳{やなぎ}の並木{なみき}がみるみる後{うし}ろへ流{なが}れていきました。空色{そらいろ}のタクシーは、菜{な}の花{はな}のゆれる橋{はし}のほうへ走{はし}っていきます。',btn:'もう一度{いちど}よむ',go:reset}
];
// 漢字{かな} → <ruby>
function rb(s){return s.replace(/([一-鿿々]+)\{([^}]+)\}/g,'<ruby>$1<rt>$2</rt></ruby>');}
function show(){
  const s=STEPS[step];const line=$('line');line.style.opacity=0;
  $('where').innerHTML=rb(s.where);
  setTrack(step>=8?'C':step>=3?'B':'A');
  stepStart=T;
  setTimeout(()=>{line.innerHTML=rb(s.text);line.style.opacity=1;$('step').textContent=(step+1)+' / '+STEPS.length;
    $('act').innerHTML=rb(s.btn);$('act').disabled=false;$('back').hidden=step===0;$('card').classList.remove('away');},280);
}
/* 1場面もどる: その場面のはじめの様子を組み立て直す */
let timers=[];
function later(fn,ms){timers.push(setTimeout(fn,ms));}
function applyState(k){
  timers.forEach(clearTimeout);timers=[];taxi.drive=null;fly=null;
  taxi.x=k>=8?FIELD:k>=2?YANA:HORI;cam.x=taxi.x+90;
  light=k>=2?'green':'red';
  matsui=(k>=3&&k<=5)?1:0;
  hat=k>=5?'onorange':k>=3?'lift':'ground';hatLift=k>=3?1:0;
  nameTag=k===4?1:0;
  fetchAnim=null;mX=HAT-34;mFace=1;placeT=0;
  orange=k>=5?'ground':'car';orangeAnim=k>=5?1:0;
  girl=k>=6?1:0;
  gent.mode=k<=1?'in':'gone';
  family=k>=7?{x:HAT+520,t:1}:null;
}
$('back').addEventListener('click',()=>{if(step<=0)return;step--;applyState(step);show();});
function next(){step++;show();}
$('act').addEventListener('click',()=>{if($('act').disabled)return;$('act').disabled=true;STEPS[step].go();});

function start(){
  if(step>=0)return;
  audioInit();
  gentMove('enter',gent.x,taxi.x-10,1.3);
  $('title').classList.add('gone');$('hint').style.display='none';$('top').style.opacity=1;chime([523,659,784]);
  step=0;show();
}
$('title').addEventListener('click',start);$('hint').addEventListener('click',start);
$('title').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();start();}});

function driveTo(x,dur,done){$('card').classList.add('away');taxi.drive={from:taxi.x,to:x,t:0,dur:reduce?dur*.5:dur,done};}
function pickHat(){matsui=1;hat='lift';hatLift=0;
  later(()=>{const h=handHat();fly={t:0,x:h.x,y:h.y-10,trail:[],tt:0};burst(h.x,h.y-8);chime([880,1047,1319]);next();},700);}
/* 松井さんがタクシーまで夏みかんを取りに行き、もどって帽子をかぶせる */
let stepStart=0;
const sparks=[];
// ポップアップのアップ絵：出すタイミング
const POPS=[
  {id:'closeupM',snd:[784,659],on:false,want:()=>step===0&&T-stepStart>1.2&&!taxi.drive},
  {id:'closeup',snd:[988,1175],on:false,want:()=>step===7&&!!family&&(family.after||0)>.5&&!taxi.drive}
];
let fetchAnim=null, mX=HAT-34, mFace=1, placeT=0;
function placeOrange(){nameTag=0;fetchAnim={t:0};}
function stepFetch(dt){
  const f=fetchAnim;f.t+=dt;const A=HAT-34,B=taxi.x+18;
  if(f.t<1.8){mX=A+(B-A)*ease(f.t/1.8);mFace=-1;}
  else if(f.t<2.4){mX=B;mFace=-1;if(orange==='car'&&f.t>2.05){orange='hand';chime([659]);}}
  else if(f.t<4.2){mX=B+(A-B)*ease((f.t-2.4)/1.8);mFace=1;}
  else if(f.t<5.1){mX=A;mFace=1;orange='place';hat='place';placeT=(f.t-4.2)/.9;}
  else{fetchAnim=null;orange='ground';hat='onorange';chime([659,784,988]);next();}
}
function reset(){applyState(0);step=0;show();}
cv.addEventListener('click',e=>{
  if(step<0){start();return;}
  if(step===2&&!$('act').disabled){const r=cv.getBoundingClientRect();const wx=cam.x+(e.clientX-r.left-CX)/S;
    if(Math.abs(wx-HAT)<70){$('act').disabled=true;pickHat();}}
});

/* ---------- update ---------- */
const ease=e=>e<.5?2*e*e:1-Math.pow(-2*e+2,2)/2;
function update(dt){
  T+=dt;
  const px=taxi.x;
  if(taxi.drive){const d=taxi.drive;d.t+=dt/d.dur;const e=ease(Math.min(1,d.t));taxi.x=d.from+(d.to-d.from)*e;
    if(d.t>=1){taxi.drive=null;d.done&&d.done();}}
  taxi.v=(taxi.x-px)/Math.max(dt,1e-4);taxi.wheel+=(taxi.x-px)/14;
  cam.x+=(taxi.x+90-cam.x)*(1-Math.exp(-dt*4));
  if(hat==='lift')hatLift=Math.min(1,hatLift+dt*2);
  if(fetchAnim)stepFetch(dt);
  if(gent.mode==='enter'||gent.mode==='exit'){gent.t+=dt/gent.dur;gent.x=gent.from+(gent.to-gent.from)*Math.min(1,gent.t);if(gent.t>=1)gent.mode=gent.mode==='enter'?'in':'gone';}
  for(const p of sparks){p.life-=dt*1.6;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.95;p.vy*=.95;}
  for(let i=sparks.length-1;i>=0;i--)if(sparks[i].life<=0)sparks.splice(i,1);
  if(fly){fly.t+=dt;fly.tt+=dt;if(fly.tt>.05){fly.tt=0;const p=flyPos(fly.t);fly.trail.push({x:p.x,y:p.y,a:1});}
    for(const d of fly.trail)d.a-=dt*.9;fly.trail=fly.trail.filter(d=>d.a>0);if(fly.t>6)fly=null;}
  if(family){family.t=Math.min(1,family.t+dt/3.2);if(family.t>=1)family.after=(family.after||0)+dt;}
  // 男の子とお母さんが着いてから、女の子の「はやく！」
  for(const p of POPS){const w=p.want();if(w!==p.on){p.on=w;$(p.id).classList.toggle('show',w);if(w)chime(p.snd);}}
  if(orange==='car'&&Math.random()<dt*6)parts.push({x:taxi.x+FRONT.x+FRONT.w,y:52+FRONT.y,vx:20+Math.random()*20+taxi.v*.6,vy:-10-Math.random()*14,life:1,r:1.4+Math.random()*1.6});
  if(orange==='ground'&&step<8&&Math.random()<dt*4)parts.push({x:HAT+(Math.random()-.5)*16,y:-24,vx:(Math.random()-.5)*16,vy:-12-Math.random()*10,life:1,r:1.2+Math.random()*1.4});
  for(const p of parts){p.life-=dt*.55;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.98;}
  for(let i=parts.length-1;i>=0;i--)if(parts[i].life<=0)parts.splice(i,1);
}

/* ---------- drawing helpers ---------- */
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function circ(x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function worldT(par){par=par==null?1:par;ctx.setTransform(DPR*S,0,0,DPR*S,DPR*(CX-cam.x*par*S),DPR*GY);}

function drawSky(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  const g=ctx.createLinearGradient(0,0,0,GY);g.addColorStop(0,'#9fd3ea');g.addColorStop(1,'#e6f4f2');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,GY+2);
  // summer sun glow
  const sx=W*.82,sy=GY*.22,sg=ctx.createRadialGradient(sx,sy,0,sx,sy,W*.35);
  sg.addColorStop(0,'rgba(255,250,220,.9)');sg.addColorStop(1,'rgba(255,250,220,0)');ctx.fillStyle=sg;ctx.fillRect(0,0,W,GY);
  worldT(.15);ctx.fillStyle='rgba(255,255,255,.92)';
  for(const c of clouds){const x=c.x,y=c.y,s=c.s;circ(x,y,26*s);circ(x+26*s,y-10*s,32*s);circ(x+58*s,y,24*s);ctx.fillRect(x,y,58*s,24*s);}
  // far rows: moat-side greenery → buildings → hills
  const t1=clamp((cam.x-500)/700,0,1), t2=clamp((cam.x-2400)/600,0,1);
  worldT(.55);
  if(t1<1){ctx.globalAlpha=1-t1;ctx.fillStyle='#9cc58a';for(let i=-12;i<14;i++){const x=i*70;circ(x,-30,34+((i*7)%5)*4);}ctx.fillRect(-900,-30,1900,30);ctx.globalAlpha=1;}
  if(t1>0&&t2<1){ctx.globalAlpha=t1*(1-t2);
    for(let i=0;i<60;i++){const x=200+i*58,h=70+((i*37)%5)*26,w=50;
      ctx.fillStyle=i%3?'#e9edf1':'#dbe3ea';ctx.fillRect(x,-h,w,h);
      ctx.fillStyle='rgba(159,211,234,.55)';for(let r=14;r<h-10;r+=18)for(let c=8;c<w-8;c+=14)ctx.fillRect(x+c,-h+r,7,9);}
    ctx.globalAlpha=1;}
  if(t2>0){ctx.globalAlpha=t2;ctx.fillStyle='#a9cf8e';ctx.beginPath();ctx.moveTo(1200,0);
    for(let x=1200;x<=2600;x+=40)ctx.lineTo(x,-40-Math.sin(x*.006)*26);ctx.lineTo(2600,0);ctx.fill();ctx.globalAlpha=1;}
}

function drawGround(){
  worldT();
  const L=cam.x-CX/S-50,R=cam.x+(W-CX)/S+50;
  // far sidewalk / grass strip
  ctx.fillStyle='#d9d4cb';ctx.fillRect(L,-8,R-L,10);
  // field behind road near the end
  if(R>FIELD-700){ctx.fillStyle='#b7d77d';ctx.fillRect(Math.max(L,FIELD-700),-26,R-Math.max(L,FIELD-700),20);
    for(let x=FIELD-700;x<R;x+=9){if(x<L)continue;const y=-20-((x*13)%14);ctx.fillStyle='#f5d43c';circ(x,y,3);}}
  // moat: stone wall and water at the start
  if(L<900){for(let x=-900;x<900;x+=30){ctx.fillStyle=((x/30)%2)?'#b9b3a8':'#c7c1b5';ctx.fillRect(x,-30,30,22);}
    ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-900,-19);ctx.lineTo(900,-19);ctx.stroke();}
  // road
  ctx.fillStyle='#8f97a3';ctx.fillRect(L,0,R-L,74);
  ctx.fillStyle='#f4f1e8';for(let x=Math.floor(L/80)*80;x<R;x+=80)ctx.fillRect(x,36,40,3);
  ctx.fillStyle='#cfc9bf';ctx.fillRect(L,74,R-L,22);ctx.fillStyle='#b9b3a8';ctx.fillRect(L,74,R-L,3);
  // 手前の植えこみ
  ctx.fillStyle='#a9cd86';ctx.fillRect(L,96,R-L,H/S);ctx.fillStyle='#98c077';ctx.fillRect(L,96,R-L,4);
  for(let x=Math.floor(L/26)*26;x<R;x+=26){ctx.fillStyle='#93bd72';circ(x+((x*7)%11),112+((x*13)%30),5);}
  // near field strip
  if(R>FIELD-700){const s=Math.max(L,FIELD-700);ctx.fillStyle='#a8cf6c';ctx.fillRect(s,96,R-s,H/S);
    for(let x=FIELD-700;x<R;x+=7){if(x<L)continue;ctx.fillStyle=(x%3)?'#f7da45':'#f0c62a';circ(x,104+((x*7)%40),3.4);}}
}

function drawLight(){
  const x=HORI+175;worldT();
  ctx.fillStyle='#6d7682';ctx.fillRect(x-2,-100,4,100);ctx.fillRect(x-2,-100,26,4);
  ctx.fillStyle='#3b4450';rr(x+6,-114,48,16,8);ctx.fill();
  const cols=[light==='green'?'#4fd68a':'#2c5a40','#4d4a34',light==='red'?'#ff5a4a':'#5a2c2c'];
  cols.forEach((c,i)=>{ctx.fillStyle=c;circ(x+16+i*14,-106,5);});
  const on=light==='red'?x+44:x+16;const g=ctx.createRadialGradient(on,-106,0,on,-106,18);
  g.addColorStop(0,light==='red'?'rgba(255,90,74,.5)':'rgba(79,214,138,.5)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;circ(on,-106,18);
}
function drawPines(){worldT();for(const x of [-420,-180,330,620]){ctx.fillStyle='#6b5446';ctx.fillRect(x-3,-70,6,40);
  ctx.fillStyle='#4f8a5a';for(let k=0;k<3;k++){ctx.beginPath();ctx.ellipse(x+(k-1)*14,-78-k*10,26-k*5,10,0,0,TAU);ctx.fill();}}}

function drawWillow(w){
  if(!willowImg.complete||!willowImg.naturalWidth)return;
  const h=215*w.s,wd=h*willowImg.naturalWidth/willowImg.naturalHeight;
  const sw=reduce?0:Math.sin(T*1.1+w.ph)*.03;
  ctx.save();ctx.translate(w.x,-4);ctx.transform(1,0,sw,1,0,0);ctx.scale(w.flip,1);
  ctx.drawImage(willowImg,-wd*.48,-h,wd,h);ctx.restore();
}

function drawTaxi(){
  worldT();ctx.save();ctx.translate(taxi.x,52);
  const bump=Math.abs(taxi.v)>5&&!reduce?Math.sin(T*28)*.6:0;ctx.translate(0,bump);
  ctx.fillStyle='rgba(42,58,74,.18)';ctx.beginPath();ctx.ellipse(0,22,76,5,0,0,TAU);ctx.fill();
  if(ready(taxiImg))ctx.drawImage(taxiImg,lx(80),ly(125),1620*TSC,664*TSC);
  // 窓の中の人たち
  ctx.save();ctx.beginPath();ctx.rect(REAR.x,REAR.y,REAR.w,REAR.h);ctx.rect(FRONT.x,FRONT.y,FRONT.w,FRONT.h);ctx.clip();
  if(gent.mode==='in'&&ready(headImg)){const hh=15,hw=hh*headImg.naturalWidth/headImg.naturalHeight;ctx.drawImage(headImg,REAR.x+REAR.w*.5-hw/2,REAR.y+2.5,hw,hh);}
  if(girl&&ready(gHeadImg)){const hh=14,hw=hh*gHeadImg.naturalWidth/gHeadImg.naturalHeight;ctx.drawImage(gHeadImg,REAR.x+REAR.w*.45-hw/2,REAR.y+3,hw,hh);}
  if(!matsui&&ready(mHeadImg)){const cx=FRONT.x+FRONT.w*.42,hh=15,hw=hh*mHeadImg.naturalWidth/mHeadImg.naturalHeight;
    ctx.fillStyle='#ffffff';ctx.fillRect(cx-6,FRONT.y+13,12,6);
    ctx.drawImage(mHeadImg,cx-hw/2,FRONT.y+1,hw,hh);}
  if(orange==='car')drawOrange(FRONT.x+FRONT.w-4.5,FRONT.y+FRONT.h-3.6,3.8);
  ctx.fillStyle='rgba(225,243,250,.28)';ctx.fillRect(REAR.x,REAR.y,REAR.w,REAR.h);ctx.fillRect(FRONT.x,FRONT.y,FRONT.w,FRONT.h);
  ctx.restore();
  // 回るタイヤの印
  for(const px of [415,1413]){const cx=lx(px),cy=ly(672);ctx.fillStyle='#7d8796';circ(cx+Math.cos(taxi.wheel)*3.2,cy+Math.sin(taxi.wheel)*3.2,1.1);}
  ctx.restore();
}
function drawGent(){
  if(!ready(gentImg)||gent.mode==='in'||gent.mode==='gone')return;
  worldT();const h=64,wd=h*gentImg.naturalWidth/gentImg.naturalHeight;
  let a=1,bob=0;
  if(gent.mode==='enter')a=clamp(1-(gent.t-.55)/.45,0,1);
  if(gent.mode==='exit')a=clamp(Math.min(gent.t/.15,(1-gent.t)/.35),0,1);
  if(gent.mode!=='stand'&&!reduce)bob=-Math.abs(Math.sin(T*8))*1.4;
  ctx.globalAlpha=a;ctx.drawImage(gentImg,gent.x-wd*0.50,-1-h+bob,wd,h);ctx.globalAlpha=1;
}

function drawHatShape(x,y,s){
  if(!ready(hatImg))return;const w=30*s,h=w*hatImg.naturalHeight/hatImg.naturalWidth;
  ctx.drawImage(hatImg,x-w/2,y+3.6*s-h,w,h);
}
function drawOrange(x,y,r){
  if(!ready(orangeImg))return;const w=r*2.2,h=w*orangeImg.naturalHeight/orangeImg.naturalWidth;
  ctx.drawImage(orangeImg,x-w/2,y-h/2,w,h);
}
function drawHatArea(){
  worldT();
  const glow=(x,y)=>{const g=ctx.createRadialGradient(x,y,0,x,y,26);g.addColorStop(0,'rgba(255,200,90,.45)');g.addColorStop(1,'rgba(255,200,90,0)');ctx.fillStyle=g;circ(x,y,26);};
  const hh=handHat(),ho=handOrange();
  // orange
  if(orange==='hand')drawOrange(ho.x,ho.y,6);
  if(orange==='place'){const e=ease(Math.min(1,placeT/.6));const x=ho.x+(HAT-ho.x)*e,y=ho.y+(-6-ho.y)*e;glow(x,y);drawOrange(x,y,6+2.5*e);}
  if(orange==='ground'){glow(HAT,-6);drawOrange(HAT,-6,8.5);}
  // hat
  if(hat==='ground')drawHatShape(HAT,-2,1);
  else if(hat==='lift'){const e=ease(hatLift),j=fly&&fly.t<.35?-Math.sin(fly.t/.35*Math.PI)*4:0;drawHatShape(HAT+(hh.x-HAT)*e,-2+(hh.y+2)*e+j,1);
    if(nameTag){ctx.fillStyle='rgba(255,255,255,.95)';rr(HAT-62,-92,112,26,8);ctx.fill();
      ctx.strokeStyle='#d8454a';ctx.setLineDash([2,2]);ctx.lineWidth=1;rr(HAT-58,-88,104,18,6);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='#d8454a';ctx.font='500 11px "Kiwi Maru", serif';ctx.textAlign='center';ctx.fillText('たけの たけお',HAT-6,-75);}}
  else if(hat==='place'){const e=ease(clamp((placeT-.35)/.65,0,1));const x=hh.x+(HAT-hh.x)*e,y=hh.y+(-12-hh.y)*e-Math.sin(Math.PI*e)*8;drawHatShape(x,y,1);}
  else if(hat==='onorange'){drawHatShape(HAT,-12,1);ctx.fillStyle='#9a958c';ctx.beginPath();ctx.ellipse(HAT+15,-2,5,3.4,0,0,TAU);ctx.fill();}
}
function matsuiW(){return ready(matsuiImg)?62*matsuiImg.naturalWidth/matsuiImg.naturalHeight:21.7;}
// 右手（帽子）と左手（夏みかん）の位置。向きが変わると左右が入れかわる
function handHat(){const w=matsuiW();return{x:mFace>0?mX+27:mX+w-27,y:-25};}
function handOrange(){const w=matsuiW();return{x:mFace>0?mX+2:mX+w-2,y:-21};}
function drawMatsui(){
  if(!matsui||!ready(matsuiImg))return;worldT();
  const h=62,w=matsuiW(),walking=fetchAnim&&(fetchAnim.t<1.8||(fetchAnim.t>2.4&&fetchAnim.t<4.2))&&!reduce;
  const bob=walking?-Math.abs(Math.sin(T*9))*1.4:0;
  ctx.save();ctx.translate(mX+w/2,0);ctx.scale(mFace,1);ctx.drawImage(matsuiImg,-w/2,-1-h+bob,w,h);ctx.restore();
}
function drawFamily(){
  if(!family||!ready(momImg)||!ready(boyImg))return;worldT();
  const e=ease(family.t),bx=family.x+(HAT+14-family.x)*e,walking=family.t<1&&!reduce;
  // お母さん（男の子に手を引かれて、少しうしろ）
  const mh=60,mw=mh*momImg.naturalWidth/momImg.naturalHeight,mb=walking?-Math.abs(Math.sin(T*8+1.4))*1.3:0;
  ctx.drawImage(momImg,bx+35,-1-mh+mb,mw,mh);
  // 虫とりあみの男の子
  const bh=52.9,bw=bh*boyImg.naturalWidth/boyImg.naturalHeight,bb=walking?-Math.abs(Math.sin(T*9))*1.8:0;
  ctx.drawImage(boyImg,bx,-1-bh+bb,bw,bh);
}
function butterfly(x,y,s,flap){
  if(!ready(bflyImg))return;const w=20*s,h=w*bflyImg.naturalHeight/bflyImg.naturalWidth;
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(flap*.13)*.35);ctx.scale(.15+.85*Math.abs(Math.sin(flap)),1);
  ctx.drawImage(bflyImg,-w/2,-h*.58,w,h);ctx.restore();
}
// 帽子から出て、松井さんの前をひらひら回ってから、柳の上へ高く舞い上がる
function flyPos(t){
  const x0=fly.x,y0=fly.y;
  if(t<.35){const e=t/.35;return{x:x0,y:y0-e*12};}
  if(t<1.8){const u=(t-.35)/1.45*TAU;return{x:x0+Math.sin(u)*22,y:y0-12-Math.sin(u*2)*7-(t-.35)*6};}
  const u=t-1.8;return{x:x0-u*26+Math.sin(u*2.6)*26,y:y0-21-u*u*9-u*14+Math.sin(u*4.5)*5};
}
function burst(x,y){for(let i=0;i<14;i++){const a=Math.random()*TAU,v=20+Math.random()*30;sparks.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-10,life:1});}}
function drawButterflies(){
  for(const p of sparks){ctx.fillStyle=`rgba(255,255,255,${p.life})`;circ(p.x,p.y,1.6*p.life+.4);}
  worldT();
  if(fly){const t=fly.t,p=flyPos(t);
    // 「あっ！」のふきだし
    if(t>.15&&t<2){ctx.globalAlpha=clamp(Math.min((t-.15)/.2,(2-t)/.3),0,1);const bx=mX+11,by=-86;
      ctx.fillStyle='#fff';rr(bx-17,by-13,34,22,10);ctx.fill();ctx.beginPath();ctx.moveTo(bx-4,by+8);ctx.lineTo(bx,by+15);ctx.lineTo(bx+4,by+8);ctx.fill();
      ctx.fillStyle='#2a3a4a';ctx.font='500 13px "Kiwi Maru", serif';ctx.textAlign='center';ctx.fillText('あっ！',bx,by+3);ctx.globalAlpha=1;}
    // 飛んだあとの点線
    for(const d of fly.trail){ctx.fillStyle=`rgba(93,111,128,${d.a*.6})`;circ(d.x,d.y+5,1.4);}
    const a=clamp((6-t)/1.2,0,1),sc=.5+1.4*clamp(t/.35,0,1);
    ctx.globalAlpha=a;ctx.shadowColor='rgba(42,58,74,.45)';ctx.shadowBlur=6;butterfly(p.x,p.y,sc,T*13);ctx.shadowBlur=0;ctx.shadowColor='transparent';ctx.globalAlpha=1;}
  if(cam.x>FIELD-900)for(const f of fieldFlies){const x=f.bx+Math.sin(T*f.sp+f.ph)*40,y=f.by+Math.sin(T*f.sp*1.7+f.ph)*16;butterfly(x,y,.9,T*12+f.ph);}
}
function drawBridge(){
  worldT();const x=FIELD+260;
  ctx.fillStyle='#e7d9c2';ctx.beginPath();ctx.moveTo(x-120,-8);ctx.quadraticCurveTo(x,-74,x+120,-8);ctx.lineTo(x+110,-8);ctx.quadraticCurveTo(x,-58,x-110,-8);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#c9b79a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-112,-22);ctx.quadraticCurveTo(x,-88,x+112,-22);ctx.stroke();
  for(let k=-4;k<=4;k++){const px=x+k*24,py=-8-(1-(k/5)*(k/5))*58;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,py-14);ctx.stroke();}
}
function drawParts(){worldT();for(const p of parts){ctx.fillStyle=`rgba(242,154,31,${p.life*.55})`;circ(p.x,p.y,p.r);}}

function draw(){
  drawSky();
  drawGround();
  if(cam.x<1100){drawPines();drawLight();}
  if(cam.x>FIELD-900)drawBridge();
  worldT();for(const w of willows)if(Math.abs(w.x-cam.x)<W/S)drawWillow(w);
  drawMatsui();
  drawHatArea();
  drawFamily();
  drawGent();
  drawTaxi();
  drawParts();
  drawButterflies();
}

let last=performance.now();
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);layout();draw();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
})();
