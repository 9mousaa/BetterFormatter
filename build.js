// Generates all 32 preset JSON files for Fusion import
const fs=require('fs'),path=require('path');
const I='https://raw.githubusercontent.com/9mousaa/BetterFormatter/main/images/';

const ST={
  best:{bc:'#FF00FF37',bg:'#E600E932',tc:'#27C04F'},
  good:{bc:'#FF2D9943',bg:'#3300E932',tc:'#27C04F'},
  bad:{bc:'#FF9D613D',bg:'#33FF7728',tc:'#FF6904'},
  res:{bc:'#FF858283',bg:'#33FFFFFF',tc:'#FFFFFF'},
  tr:{bc:'#00000000',bg:'#00000000',tc:'#FFFFFF'},
  dim:{bc:'#00000000',bg:'#00000000',tc:'#80FFFFFF'},
};

function hsl(h,s,l){const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return l-a*Math.max(Math.min(k-3,9-k,1),-1)};return[Math.round(f(0)*255),Math.round(f(8)*255),Math.round(f(4)*255)]}
function hx(r,g,b){return((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1).toUpperCase()}
function pctS(p){const c=hsl((p/100)*120,1,.45),h=hx(...c);return{bc:'#66'+h,bg:'#33'+h,tc:'#FF'+h}}

function mk(id,name,pat,img,st,gid){
  return{borderColor:st.bc,groupId:gid,id,imageURL:img?I+img:'',isEnabled:true,name,pattern:pat,tagColor:st.bg,tagStyle:'filled and bordered',textColor:st.tc,type:'filter'};
}

function gen(C){
  const p=C.icon,mono=p==='mono',T=[],G=[];
  const qs=k=>mono?ST.res:ST[k];

  const dvR='\\b(?:dv|dovi|dolby[\\s._-]?vision)\\b';
  const dvY='(?=.*(?i)'+dvR+')';
  const dvN='(?!.*(?i)'+dvR+')';
  const atmosR='(?i)\\batmos\\b';
  const thR='(?i)true[\\s._-]?hd';
  const ddpR='(?i)(?:dd[p+]|e[\\s._-]?ac[\\s._-]?3)';
  const ddR='(?i)(?:dd[^p+a-z]|(?<!e-)ac-?3)';

  // Quality
  if(C.qual==='bgb'){
    T.push(mk('q-br','Best Remux','(?=.*\u265b)(?=.*(?i)remux)',p+'-best-remux.png',qs('best'),'gq'));
    T.push(mk('q-bb','Best BluRay','(?=.*\u265b)(?=.*(?i)(?:bluray|blu-ray))(?!.*(?i)remux)',p+'-best-bluray.png',qs('best'),'gq'));
    T.push(mk('q-bw','Best WebDL','(?=.*\u265b)(?=.*(?i)(?:web[-_. ]?dl|webdl|webrip))',p+'-best-webdl.png',qs('best'),'gq'));
    T.push(mk('q-gr','Good Remux','(?=.*[\u2b51\u2726])(?=.*(?i)remux)',p+'-good-remux.png',qs('good'),'gq'));
    T.push(mk('q-gb','Good BluRay','(?=.*[\u2b51\u2726])(?=.*(?i)(?:bluray|blu-ray))(?!.*(?i)remux)',p+'-good-bluray.png',qs('good'),'gq'));
    T.push(mk('q-gw','Good WebDL','(?=.*[\u2b51\u2726])(?=.*(?i)(?:web[-_. ]?dl|webdl|webrip))',p+'-good-webdl.png',qs('good'),'gq'));
    T.push(mk('q-bad','Bad','[\u25b3\u2205]',p+'-Bad.png',qs('bad'),'gq'));
  }else if(C.qual==='tier'){
    const subs=['\u2081','\u2082','\u2083'];
    const srcs=[['remux','Remux','\u0280\u1d07\u1d0d\u1d1c\u0445'],['bluray','Bluray','\u0299\u029f\u1d1c\u0280\u1d00\u028f'],['webdl','WEB','\u1d21\u1d07\u0299']];
    for(let i=0;i<3;i++){
      const tn='T'+(i+1);
      for(const[k,l,sc] of srcs){
        T.push(mk('q-'+k+'-t'+(i+1),l+' '+tn,'(?:\\b'+l+' '+tn+'\\b|'+sc+' \u1d1b'+subs[i]+')',p+'-icon-'+k+'-t'+(i+1)+'.png',qs('best'),'gq'));
      }
    }
  }else if(C.qual==='src'){
    T.push(mk('q-r','Remux','(?i)\\bremux\\b',p+'-remux.png',qs('best'),'gq'));
    T.push(mk('q-b','BluRay','(?=.*(?i)\\b(?:bluray|blu-ray)\\b)(?!.*(?i)\\bremux\\b)',p+'-bluray.png',qs('best'),'gq'));
    T.push(mk('q-w','WebDL','(?i)\\b(?:web[-_. ]?dl|webdl|webrip|web-rip)\\b',p+'-webdl.png',qs('best'),'gq'));
  }else if(C.qual==='pct'){
    for(let i=100;i>=1;i--)T.push(mk('pct-'+i,i+'%','(?<![0-9])'+i+'%','',mono?ST.res:pctS(i),'gp'));
    T.push(mk('q-r','Remux','(?i)\\bremux\\b',p+'-remux.png',qs('best'),'gq'));
    T.push(mk('q-b','BluRay','(?=.*(?i)\\b(?:bluray|blu-ray)\\b)(?!.*(?i)\\bremux\\b)',p+'-bluray.png',qs('best'),'gq'));
    T.push(mk('q-w','WebDL','(?i)\\b(?:web[-_. ]?dl|webdl|webrip|web-rip)\\b',p+'-webdl.png',qs('best'),'gq'));
  }

  // Resolution
  T.push(mk('r-4k','4K','(?i)(?=.*(?:\\b2160[pi]?\\b|\\b4k\\b|\\buhd\\b))(?!.*\\b(?:1080[pi]?|720[pi]?)\\b)','4k.png',ST.res,'gr'));
  T.push(mk('r-1080','1080p','(?i)\\b1080[pi]?\\b','1080p.png',ST.res,'gr'));
  T.push(mk('r-720','720p','(?i)\\b720[pi]?\\b','720p.png',ST.res,'gr'));

  // HDR (ordered before audio for display priority)
  const hp=C.hdr==='nodv'?dvN:'';
  T.push(mk('v-hdr10p','HDR10+',hp+'(?=.*(?i)(?:hdr[\\s._-]?10[\\s._-]?(?:\\+|plus|p)))','HDR10Plus.png',ST.res,'gv'));
  T.push(mk('v-hdr10','HDR10',hp+'(?=.*(?i)\\bhdr[\\s._-]?10\\b)(?!.*(?i)hdr[\\s._-]?10[\\s._-]?(?:\\+|plus|p))','HDR10.png',ST.res,'gv'));
  T.push(mk('v-hdr','HDR',hp+'(?=.*(?i)\\bHDR\\b)(?!.*(?i)\\bhdr[\\s._-]?10\\b)','HDR.png',ST.res,'gv'));

  // Audio + DV
  if(C.dv==='combo'){
    // Atmos (top priority — catches TrueHD Atmos and DD+ Atmos)
    T.push(mk('a-atmos-dv','Atmos+DV','(?=.*'+atmosR+')'+dvY,'atmos-vision.png',ST.tr,'ga'));
    T.push(mk('a-atmos','Atmos','(?=.*'+atmosR+')'+dvN,'atmos.png',ST.tr,'ga'));
    // TrueHD without Atmos
    T.push(mk('a-th-dv','TrueHD+DV','(?=.*'+thR+')(?!.*'+atmosR+')'+dvY,'truehd-vision.png',ST.tr,'ga'));
    T.push(mk('a-th','TrueHD','(?=.*'+thR+')(?!.*'+atmosR+')'+dvN,'truehd.png',ST.tr,'ga'));
    // DD+ without Atmos or TrueHD
    T.push(mk('a-ddp-dv','DD++DV','(?=.*'+ddpR+')(?!.*'+atmosR+')(?!.*'+thR+')'+dvY,'digitalplus-vision.png',ST.tr,'ga'));
    T.push(mk('a-ddp','DD+','(?=.*'+ddpR+')(?!.*'+atmosR+')(?!.*'+thR+')'+dvN,'digitalplus.png',ST.tr,'ga'));
    // DD without DD+/TrueHD/Atmos
    T.push(mk('a-dd-dv','DD+DV','(?=.*'+ddR+')(?!.*'+ddpR+')(?!.*'+thR+')(?!.*'+atmosR+')'+dvY,'digital-vision.png',ST.tr,'ga'));
    T.push(mk('a-dd','DD','(?=.*'+ddR+')(?!.*'+ddpR+')(?!.*'+thR+')(?!.*'+atmosR+')'+dvN,'digital.png',ST.tr,'ga'));
    // DV standalone (no Dolby audio — for DTS+DV, FLAC+DV, etc.)
    T.push(mk('a-dv','DV','(?=.*(?i)'+dvR+')(?!.*'+atmosR+')(?!.*'+thR+')(?!.*'+ddpR+')(?!.*'+ddR+')','vision.png',ST.tr,'gv'));
  }else{
    T.push(mk('a-dv','DV','(?i)'+dvR,'vision.png',ST.tr,'gv'));
    T.push(mk('a-atmos','Atmos',atmosR,'atmos.png',ST.tr,'ga'));
    T.push(mk('a-th','TrueHD','(?=.*'+thR+')(?!.*'+atmosR+')','truehd.png',ST.tr,'ga'));
    T.push(mk('a-ddp','DD+','(?=.*'+ddpR+')(?!.*'+atmosR+')(?!.*'+thR+')','digitalplus.png',ST.tr,'ga'));
    T.push(mk('a-dd','DD','(?=.*'+ddR+')(?!.*'+ddpR+')(?!.*'+thR+')(?!.*'+atmosR+')','digital.png',ST.tr,'ga'));
  }

  // DTS (always separate, resolution style)
  T.push(mk('a-dtsx','DTS:X','(?i)\\bdts[-_.: ]?x\\b(?![-_. ]?(?:26[456]))','dtsx.png',ST.res,'ga'));
  T.push(mk('a-dtsma','DTS-HD MA','(?i)\\bdts[-_. ]?(?:hd[-_. ]?ma|ma|xll)\\b','dtshdma.png',ST.res,'ga'));
  T.push(mk('a-dtshd','DTS-HD','(?i)\\bdts[-_. ]?hd\\b(?![-_. ]?ma)','dtshd.png',ST.res,'ga'));
  T.push(mk('a-dts','DTS','(?=.*(?i)\\bDTS\\b)(?!.*(?i)\\bdts[-_. ]?(?:hd|ma|xll|x)\\b)','dts.png',ST.res,'ga'));

  // Surround
  T.push(mk('ch-71','7.1','(?=.*[^0-9][7-8][. ][0-1]\\b)(?!.*[^0-9]5[. ][0-1]\\b)','7dot1.png',ST.tr,'gc'));
  T.push(mk('ch-51','5.1','(?=.*[^0-9]5[. ][0-1]\\b)(?!.*[^0-9][7-8][. ][0-1]\\b)','5dot1.png',ST.tr,'gc'));

  // Languages
  const L=[['en','\ud83c\uddec\ud83c\udde7','(?i)\\benglish\\b|\\beng\\b|\ud83c\uddec\ud83c\udde7|\ud83c\uddfa\ud83c\uddf8'],['es','\ud83c\uddea\ud83c\uddf8','(?i)\\bspanish\\b|\\bspa\\b|\ud83c\uddea\ud83c\uddf8|\ud83c\uddf2\ud83c\uddfd'],['fr','\ud83c\uddeb\ud83c\uddf7','(?i)\\bfrench\\b|\\bfra\\b|\ud83c\uddeb\ud83c\uddf7'],['de','\ud83c\udde9\ud83c\uddea','(?i)\\bgerman\\b|\\bdeu\\b|\ud83c\udde9\ud83c\uddea'],['it','\ud83c\uddee\ud83c\uddf9','(?i)\\bitalian\\b|\\bita\\b|\ud83c\uddee\ud83c\uddf9'],['pt','\ud83c\udde7\ud83c\uddf7','(?i)\\bportuguese\\b|\\bpor\\b|\ud83c\udde7\ud83c\uddf7|\ud83c\uddf5\ud83c\uddf9'],['ja','\ud83c\uddef\ud83c\uddf5','(?i)\\bjapanese\\b|\\bjpn\\b|\ud83c\uddef\ud83c\uddf5'],['ko','\ud83c\uddf0\ud83c\uddf7','(?i)\\bkorean\\b|\\bkor\\b|\ud83c\uddf0\ud83c\uddf7'],['zh','\ud83c\udde8\ud83c\uddf3','(?i)\\bchinese\\b|\\bchi\\b|\ud83c\udde8\ud83c\uddf3|\ud83c\uddf9\ud83c\uddfc'],['hi','\ud83c\uddee\ud83c\uddf3','(?i)\\bhindi\\b|\\bhin\\b|\ud83c\uddee\ud83c\uddf3'],['ar','\ud83c\uddf8\ud83c\udde6','(?i)\\barabic\\b|\\bara\\b|\ud83c\uddf8\ud83c\udde6|\ud83c\udde6\ud83c\uddea'],['ru','\ud83c\uddf7\ud83c\uddfa','(?i)\\brussian\\b|\\brus\\b|\ud83c\uddf7\ud83c\uddfa'],['mu','\ud83c\udf10','(?i)\\bmulti\\b|\\bdual[\\s._-]?audio\\b']];
  for(const[c,f,pt] of L)T.push(mk('l-'+c,f,pt,'',ST.dim,'gl'));

  // Groups
  if(C.qual==='pct')G.push({borderColor:'#66009900',color:'#27C04F',id:'gp',isExpanded:true,name:'Score'});
  G.push({borderColor:ST.best.bc,color:'#27C04F',id:'gq',isExpanded:true,name:'Quality'});
  G.push({borderColor:ST.res.bc,color:'#FFBE01',id:'gr',isExpanded:true,name:'Resolution'});
  G.push({borderColor:ST.res.bc,color:'#FF6B6B',id:'gv',isExpanded:true,name:'Visual'});
  G.push({borderColor:'#00000000',color:'#45B7D1',id:'ga',isExpanded:true,name:'Audio'});
  G.push({borderColor:'#00000000',color:'#FFD700',id:'gc',isExpanded:true,name:'Channels'});
  G.push({borderColor:'#00000000',color:'#4ECDC4',id:'gl',isExpanded:true,name:'Language'});

  return{filters:T,groups:G};
}

// Generate all 32 presets
const dir=path.join(__dirname,'presets');
fs.mkdirSync(dir,{recursive:true});
let count=0;
for(const icon of['colored','mono']){
  for(const qual of['bgb','tier','src','pct']){
    for(const dv of['combo','sep']){
      for(const hdr of['nodv','always']){
        const data=gen({icon,qual,dv,hdr});
        const name=`${icon}-${qual}-${dv}-${hdr}.json`;
        fs.writeFileSync(path.join(dir,name),JSON.stringify(data,null,2));
        count++;
        console.log(`[${count}/32] ${name} (${data.filters.length} tags)`);
      }
    }
  }
}
console.log(`Done. ${count} presets generated.`);
