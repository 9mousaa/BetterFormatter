// Generates all 32 preset JSON files for Fusion import
// All lookahead patterns use ^ anchor to prevent position-shifting false matches
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

// Pattern fragments (no (?i), no extra \b wrapping — caller handles)
const DV='\\b(?:dv|dovi|dolby[\\s._-]?vision)\\b';
const ATMOS='\\batmos\\b';
const TH='\\btrue[\\s._-]?hd\\b';
const DDP='\\b(?:ddp|dd\\+|eac3|e-ac-?3)\\b';
const DD='\\b(?:dd[25][. ][01]|dd[^p+a-z]\\b|\\bac-?3)\\b';

function gen(C){
  const p=C.icon,mono=p==='mono',T=[],G=[];
  const qs=k=>mono?ST.res:ST[k];

  // Quality — score symbols don't need ^ (single char match)
  if(C.qual==='bgb'){
    T.push(mk('q-br','Best Remux','(?i)^(?=.*\u265b)(?=.*remux)',p+'-best-remux.png',qs('best'),'gq'));
    T.push(mk('q-bb','Best BluRay','(?i)^(?=.*\u265b)(?=.*(?:bluray|blu-ray))(?!.*remux)',p+'-best-bluray.png',qs('best'),'gq'));
    T.push(mk('q-bw','Best WebDL','(?i)^(?=.*\u265b)(?=.*(?:web[-_. ]?dl|webdl|webrip))',p+'-best-webdl.png',qs('best'),'gq'));
    T.push(mk('q-gr','Good Remux','(?i)^(?=.*[\u2b51\u2726])(?=.*remux)',p+'-good-remux.png',qs('good'),'gq'));
    T.push(mk('q-gb','Good BluRay','(?i)^(?=.*[\u2b51\u2726])(?=.*(?:bluray|blu-ray))(?!.*remux)',p+'-good-bluray.png',qs('good'),'gq'));
    T.push(mk('q-gw','Good WebDL','(?i)^(?=.*[\u2b51\u2726])(?=.*(?:web[-_. ]?dl|webdl|webrip))',p+'-good-webdl.png',qs('good'),'gq'));
    T.push(mk('q-or','OK Remux','(?i)^(?=.*[\u25b3\u2205])(?=.*remux)','mono-ok-remux.png',ST.res,'gq'));
    T.push(mk('q-ob','OK BluRay','(?i)^(?=.*[\u25b3\u2205])(?=.*(?:bluray|blu-ray))(?!.*remux)','mono-ok-bluray.png',ST.res,'gq'));
    T.push(mk('q-ow','OK WebDL','(?i)^(?=.*[\u25b3\u2205])(?=.*(?:web[-_. ]?dl|webdl|webrip))','mono-ok-webdl.png',ST.res,'gq'));
  }else if(C.qual==='tier'){
    const subs=['\u2081','\u2082','\u2083'];
    const srcs=[['remux','Remux','\u0280\u1d07\u1d0d\u1d1c\u0445'],['bluray','Bluray','\u0299\u029f\u1d1c\u0280\u1d00\u028f'],['webdl','WEB','\u1d21\u1d07\u0299']];
    for(let i=0;i<3;i++){
      const tn='T'+(i+1);
      for(const[k,l,sc] of srcs)
        T.push(mk('q-'+k+'-t'+(i+1),l+' '+tn,'(?:\\b'+l+' '+tn+'\\b|'+sc+' \u1d1b'+subs[i]+')',p+'-icon-'+k+'-t'+(i+1)+'.png',qs('best'),'gq'));
    }
  }else if(C.qual==='src'){
    T.push(mk('q-r','Remux','(?i)\\bremux\\b',p+'-remux.png',qs('best'),'gq'));
    T.push(mk('q-b','BluRay','(?i)^(?=.*(?:bluray|blu-ray))(?!.*remux)',p+'-bluray.png',qs('best'),'gq'));
    T.push(mk('q-w','WebDL','(?i)\\b(?:web[-_. ]?dl|webdl|webrip|web-rip)\\b',p+'-webdl.png',qs('best'),'gq'));
  }else if(C.qual==='pct'){
    for(let i=100;i>=1;i--)T.push(mk('pct-'+i,i+'%','(?<![0-9])'+i+'%','',mono?ST.res:pctS(i),'gp'));
    T.push(mk('q-r','Remux','(?i)\\bremux\\b',p+'-remux.png',qs('best'),'gq'));
    T.push(mk('q-b','BluRay','(?i)^(?=.*(?:bluray|blu-ray))(?!.*remux)',p+'-bluray.png',qs('best'),'gq'));
    T.push(mk('q-w','WebDL','(?i)\\b(?:web[-_. ]?dl|webdl|webrip|web-rip)\\b',p+'-webdl.png',qs('best'),'gq'));
  }

  // Resolution
  T.push(mk('r-4k','4K','(?i)^(?=.*(?:2160[pi]?|4k|uhd))(?!.*(?:1080[pi]?|720[pi]?))','4k.png',ST.res,'gr'));
  T.push(mk('r-1080','1080p','(?i)\\b1080[pi]?\\b','1080p.png',ST.res,'gr'));
  T.push(mk('r-720','720p','(?i)\\b720[pi]?\\b','720p.png',ST.res,'gr'));

  // HDR — ^ anchored with clean lookaheads
  const dvBlock=C.hdr==='nodv'?'(?!.*'+DV+')':'';
  T.push(mk('v-hdr10p','HDR10+','(?i)^'+dvBlock+'(?=.*hdr[\\s._-]?10[\\s._-]?(?:\\+|plus|p))','HDR10Plus.png',ST.res,'gv'));
  T.push(mk('v-hdr10','HDR10','(?i)^'+dvBlock+'(?=.*hdr[\\s._-]?10)(?!.*hdr[\\s._-]?10[\\s._-]?(?:\\+|plus|p))','HDR10.png',ST.res,'gv'));
  T.push(mk('v-hdr','HDR','(?i)^'+dvBlock+'(?=.*\\bHDR\\b)(?!.*hdr[\\s._-]?10)','HDR.png',ST.res,'gv'));

  // Audio + DV — ALL ^ anchored, single (?i) at start, no double \b
  if(C.dv==='combo'){
    // Atmos+DV (combined badge)
    T.push(mk('a-at-dv','Atmos+DV','(?i)^(?=.*'+ATMOS+')(?=.*'+DV+')','atmos-vision.png',ST.tr,'ga'));
    // Atmos alone (no DV)
    T.push(mk('a-at','Atmos','(?i)^(?=.*'+ATMOS+')(?!.*'+DV+')','atmos.png',ST.tr,'ga'));
    // TrueHD+DV (no Atmos)
    T.push(mk('a-th-dv','TrueHD+DV','(?i)^(?=.*'+TH+')(?!.*'+ATMOS+')(?=.*'+DV+')','truehd-vision.png',ST.tr,'ga'));
    // TrueHD alone (no Atmos, no DV)
    T.push(mk('a-th','TrueHD','(?i)^(?=.*'+TH+')(?!.*'+ATMOS+')(?!.*'+DV+')','truehd.png',ST.tr,'ga'));
    // DD++DV (no Atmos, no TrueHD)
    T.push(mk('a-dp-dv','DD++DV','(?i)^(?=.*'+DDP+')(?!.*'+ATMOS+')(?!.*'+TH+')(?=.*'+DV+')','digitalplus-vision.png',ST.tr,'ga'));
    // DD+ alone
    T.push(mk('a-dp','DD+','(?i)^(?=.*'+DDP+')(?!.*'+ATMOS+')(?!.*'+TH+')(?!.*'+DV+')','digitalplus.png',ST.tr,'ga'));
    // DD+DV (no DD+, no TrueHD, no Atmos)
    T.push(mk('a-dd-dv','DD+DV','(?i)^(?=.*'+DD+')(?!.*'+DDP+')(?!.*'+TH+')(?!.*'+ATMOS+')(?=.*'+DV+')','digital-vision.png',ST.tr,'ga'));
    // DD alone
    T.push(mk('a-dd','DD','(?i)^(?=.*'+DD+')(?!.*'+DDP+')(?!.*'+TH+')(?!.*'+ATMOS+')(?!.*'+DV+')','digital.png',ST.tr,'ga'));
    // DV standalone (non-Dolby audio)
    T.push(mk('a-dv','DV','(?i)^(?=.*'+DV+')(?!.*'+ATMOS+')(?!.*'+TH+')(?!.*'+DDP+')(?!.*'+DD+')','vision.png',ST.tr,'gv'));
  }else{
    T.push(mk('a-dv','DV','(?i)'+DV,'vision.png',ST.tr,'gv'));
    T.push(mk('a-at','Atmos','(?i)'+ATMOS,'atmos.png',ST.tr,'ga'));
    T.push(mk('a-th','TrueHD','(?i)^(?=.*'+TH+')(?!.*'+ATMOS+')','truehd.png',ST.tr,'ga'));
    T.push(mk('a-dp','DD+','(?i)^(?=.*'+DDP+')(?!.*'+ATMOS+')(?!.*'+TH+')','digitalplus.png',ST.tr,'ga'));
    T.push(mk('a-dd','DD','(?i)^(?=.*'+DD+')(?!.*'+DDP+')(?!.*'+TH+')(?!.*'+ATMOS+')','digital.png',ST.tr,'ga'));
  }

  // DTS (simple patterns, no exclusion needed between DTS variants except hierarchy)
  T.push(mk('a-dtsx','DTS:X','(?i)\\bdts[-_.: ]?x\\b','dtsx.png',ST.res,'ga'));
  T.push(mk('a-dtsma','DTS-HD MA','(?i)^(?=.*\\bdts[-_. ]?(?:hd[-_. ]?)?ma\\b)(?!.*\\bdts[-_.: ]?x\\b)','dtshdma.png',ST.res,'ga'));
  T.push(mk('a-dtshd','DTS-HD','(?i)^(?=.*\\bdts[-_. ]?hd\\b)(?!.*\\bdts[-_. ]?(?:hd[-_. ]?)?ma\\b)(?!.*\\bdts[-_.: ]?x\\b)','dtshd.png',ST.res,'ga'));
  T.push(mk('a-dts','DTS','(?i)^(?=.*\\bDTS\\b)(?!.*\\bdts[-_. ]?(?:hd|ma|xll|x)\\b)','dts.png',ST.res,'ga'));

  // Surround
  T.push(mk('ch-71','7.1','[^0-9][7-8][. ][01]','7dot1.png',ST.tr,'gc'));
  T.push(mk('ch-51','5.1','^(?=.*[^0-9]5[. ][01])(?!.*[^0-9][7-8][. ][01])','5dot1.png',ST.tr,'gc'));

  // Languages
  const L=[['en','\ud83c\uddec\ud83c\udde7','(?i)\\benglish\\b|\\beng\\b'],['es','\ud83c\uddea\ud83c\uddf8','(?i)\\bspanish\\b|\\bspa\\b'],['fr','\ud83c\uddeb\ud83c\uddf7','(?i)\\bfrench\\b|\\bfra\\b'],['de','\ud83c\udde9\ud83c\uddea','(?i)\\bgerman\\b|\\bdeu\\b'],['it','\ud83c\uddee\ud83c\uddf9','(?i)\\bitalian\\b|\\bita\\b'],['pt','\ud83c\udde7\ud83c\uddf7','(?i)\\bportuguese\\b|\\bpor\\b'],['ja','\ud83c\uddef\ud83c\uddf5','(?i)\\bjapanese\\b|\\bjpn\\b'],['ko','\ud83c\uddf0\ud83c\uddf7','(?i)\\bkorean\\b|\\bkor\\b'],['zh','\ud83c\udde8\ud83c\uddf3','(?i)\\bchinese\\b|\\bchi\\b'],['hi','\ud83c\uddee\ud83c\uddf3','(?i)\\bhindi\\b|\\bhin\\b'],['ar','\ud83c\uddf8\ud83c\udde6','(?i)\\barabic\\b|\\bara\\b'],['ru','\ud83c\uddf7\ud83c\uddfa','(?i)\\brussian\\b|\\brus\\b'],['mu','\ud83c\udf10','(?i)\\bmulti\\b|\\bdual[\\s._-]?audio\\b']];
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
      }
    }
  }
}
console.log(`Generated ${count} presets.`);
