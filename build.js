// Generates all 32 preset JSON files for Fusion import
// Tier patterns use TRaSH Guides release group standard (filename-based)
// All lookahead patterns use ^ anchor for mutual exclusion
const fs=require('fs'),path=require('path');
const I='https://raw.githubusercontent.com/9mousaa/BetterFormatter/main/images/';

const ST={
  best:{bc:'#FF00FF37',bg:'#E600E932',tc:'#27C04F'},
  good:{bc:'#FF2D9943',bg:'#3300E932',tc:'#27C04F'},
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

// TRaSH Guides release groups per tier
const RMX_T1='3L|BiZKiT|BLURANiUM|BMF|CiNEPHiLES|FraMeSToR|PiRAMiDHEAD|PmP|WiLDCAT|ZQ';
const RMX_T2='ATELiER|NCmt|playBD|SiCFoI|SURFINBIRD|TEPES|12GaugeShotgun|decibeL|EPSiLON|HiFi|KRaLiMaRKo|PTer|TRiToN';
const RMX_T3='iFT|NTb|PTP|SumVision|TOA';
const RMX_ALL=RMX_T1+'|'+RMX_T2+'|'+RMX_T3;

const BLU_T1='CtrlHD|MainFrame|W4NK3R|DON|BBQ|BMF|c0kE|Chotab|CRiSC|D-Z0N3|Dariush|decibeL|EbP|EDPH|LolHD|NCmt|PTer|TayTO|TDD|TnP|VietHD|ZQ|ZoroSenpai|Geek|NTb';
const BLU_T2='HQMUX|ATELiER|EA|HiDt|HiSD|iFT|QOQ|SA89|sbR';
const BLU_T3='BHDStudio|hallowed|HONE|SPHD|WEBDV|HiFi|playHD|LoRD';
const BLU_ALL=BLU_T1+'|'+BLU_T2+'|'+BLU_T3;

const WEB_T1='ABBIE|ABBiE|AJP69|APEX|BLUTONiUM|BYNDR|CMRG|CRFW|CRUD|CasStudio|CtrlHD|FLUX|GNOME|HONE|KiNGS|Kitsune|NOSiViD|NTb|NTG|PAXA|PEXA|QOQ|RAWR|RTN|SiC|T6D|TEPES|TheFarm|TOMMY|ViSUM|XEPA|ZoroSenpai|monkee';
const WEB_T2='dB|MiU|MZABI|playWEB|SbR|SMURF|XEBEC|4KBEC|CEBEX|Flights|PHOENiX|3cTWeB|BTW|Chotab|Cinefeel|CiT|Coo7|DEEP|END|ETHiCS|FC|iJP|iKA|iT00NZ|JETIX|KHN|KiMCHI|LAZY|MiU|NPMS|NYH|orbitron|PSiG|ROCCaT|RTFM|SA89|SDCC|SIGMA|SiGMA|SPiRiT|TVSmash|WELP';
const WEB_T3='BLOOM|Dooky|DRACULA|GNOMiSSiON|HHWEB|NINJACENTRAL|SLiGNOME|SwAgLaNdEr|T4H|ViSiON';
const WEB_ALL=WEB_T1+'|'+WEB_T2+'|'+WEB_T3;

// Source detection fragments
const IS_RMX='(?:[_. ]|\\d{4}p-|\\bHybrid-)(?:(?:BD|UHD)[-_. ]?)?Remux\\b|(?:(?:BD|UHD)[-_. ]?)?Remux[_. ]\\d{4}p';
const IS_BLU='(?:BluRay|Blu-Ray|HD-?DVD|BDMux|BD(?!$)|UHD|4K)';
const NOT_RMX='(?!.*(?:(?:[_. ]|\\d{4}p-|\\bHybrid-)(?:(?:BD|UHD)[-_. ]?)?Remux\\b|(?:(?:BD|UHD)[-_. ]?)?Remux[_. ]\\d{4}p))';
const IS_WEB='(?:WEB[-_. ]DL(?:mux)?|WEBDL|WebRip|Web-Rip|WEBMux|(?:720|1080|2160)p[-. ]WEB[-. ]|[-. ]WEB[-. ](?:720|1080|2160)p|(?:AMZN|NF|DP)[. -]WEB[. -])';
const NOT_WEB='(?!.*(?:WEB[-_. ]DL|WEBDL|WebRip|Web-Rip|WEBMux))';

// Build tier pattern: (?i) for case-insensitive, matches source+group in filename OR tier label
function tierPat(source,groups,label,smallcaps){
  if(source==='remux') return '(?i)(?:(?=.*(?:'+IS_RMX+'))(?=.*\\b(?:'+groups+')\\b)|\\b'+label+'\\b|'+smallcaps+')';
  if(source==='bluray') return '(?i)(?:(?=.*'+IS_BLU+')'+NOT_RMX+NOT_WEB+'(?=.*\\b(?:'+groups+')\\b)|\\b'+label+'\\b|'+smallcaps+')';
  if(source==='web') return '(?i)(?:(?=.*'+IS_WEB+')(?=.*\\b(?:'+groups+')\\b)|\\b'+label+'\\b|'+smallcaps+')';
}

// Unranked pattern: matches source but NOT any known group
function unrankedPat(source,allGroups){
  if(source==='remux') return '(?i)^(?=.*(?:'+IS_RMX+'))(?!.*\\b(?:'+allGroups+')\\b)';
  if(source==='bluray') return '(?i)^(?=.*'+IS_BLU+')'+NOT_RMX+NOT_WEB+'(?!.*\\b(?:'+allGroups+')\\b)';
  if(source==='web') return '(?i)^(?=.*'+IS_WEB+')(?!.*\\b(?:'+allGroups+')\\b)';
}

const DV='\\b(?:dv|dovi|dolby[\\s._-]?vision)\\b';
const ATMOS='\\batmos\\b';
const TH='\\btrue[\\s._-]?hd\\b';
const DDP='(?:\\bddp|\\bdd\\+|\\beac-?3|\\be-?ac-?3)';
const DD='\\b(?:dd[25][. ][01]|dd[^p+a-z]\\b|\\bac-?3)\\b';

function gen(C){
  const p=C.icon,mono=p==='mono',T=[],G=[];
  const qs=k=>mono?ST.res:ST[k];

  // Quality
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
    // TRaSH Guides filename-based tier detection with label fallback
    const tiers=[
      {n:'T1',rmx:RMX_T1,blu:BLU_T1,web:WEB_T1,sub:'\u2081'},
      {n:'T2',rmx:RMX_T2,blu:BLU_T2,web:WEB_T2,sub:'\u2082'},
      {n:'T3',rmx:RMX_T3,blu:BLU_T3,web:WEB_T3,sub:'\u2083'},
    ];
    for(const t of tiers){
      T.push(mk('q-rmx-'+t.n.toLowerCase(),'Remux '+t.n,tierPat('remux',t.rmx,'Remux '+t.n,'\u0280\u1d07\u1d0d\u1d1c\u0445 \u1d1b'+t.sub),p+'-icon-remux-'+t.n.toLowerCase()+'.png',qs('best'),'gq'));
      T.push(mk('q-blu-'+t.n.toLowerCase(),'BluRay '+t.n,tierPat('bluray',t.blu,'Bluray '+t.n,'\u0299\u029f\u1d1c\u0280\u1d00\u028f \u1d1b'+t.sub),p+'-icon-bluray-'+t.n.toLowerCase()+'.png',qs('best'),'gq'));
      T.push(mk('q-web-'+t.n.toLowerCase(),'Web '+t.n,tierPat('web',t.web,'WEB '+t.n,'\u1d21\u1d07\u0299 \u1d1b'+t.sub),p+'-icon-webdl-'+t.n.toLowerCase()+'.png',qs('best'),'gq'));
    }
    // Unranked fallbacks
    T.push(mk('q-rmx-u','Remux',unrankedPat('remux',RMX_ALL),p+'-remux.png',ST.res,'gq'));
    T.push(mk('q-blu-u','BluRay',unrankedPat('bluray',BLU_ALL),p+'-bluray.png',ST.res,'gq'));
    T.push(mk('q-web-u','Web',unrankedPat('web',WEB_ALL),p+'-webdl.png',ST.res,'gq'));
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

  // SeaDex — right after quality (from AIOStreams formatter output)
  T.push(mk('v-seadex','SeaDex','(?i)\\b(?:seadex|best[\\s._-]?release|alt[\\s._-]?(?:best[\\s._-]?)?release)\\b|\u1d00\u029f\u1d1b \u0280\u1d07\u029f\u1d07\u1d00s\u1d07|\u0299\u1d07s\u1d1b \u0280\u1d07\u029f\u1d07\u1d00s\u1d07',p+'-SeaDex.png',mono?ST.res:ST.best,'gv'));

  // Resolution
  T.push(mk('r-4k','4K','(?i)^(?=.*(?:2160[pi]?|4k|uhd))(?!.*(?:1080[pi]?|720[pi]?))','4k.png',ST.res,'gr'));
  T.push(mk('r-1080','1080p','(?i)\\b1080[pi]?\\b','1080p.png',ST.res,'gr'));
  T.push(mk('r-720','720p','(?i)\\b720[pi]?\\b','720p.png',ST.res,'gr'));

  // HDR
  const dvBlock=C.hdr==='nodv'?'(?!.*'+DV+')':'';
  T.push(mk('v-hdr10p','HDR10+','(?i)^'+dvBlock+'(?=.*hdr[\\s._-]?10[\\s._-]?(?:\\\\+|plus|p))','HDR10Plus.png',ST.res,'gv'));
  T.push(mk('v-hdr10','HDR10','(?i)^'+dvBlock+'(?=.*hdr[\\s._-]?10)(?!.*hdr[\\s._-]?10[\\s._-]?(?:\\\\+|plus|p))','HDR10.png',ST.res,'gv'));
  T.push(mk('v-hdr','HDR','(?i)^'+dvBlock+'(?=.*\\bHDR\\b)(?!.*hdr[\\s._-]?10)','HDR.png',ST.res,'gv'));

  // IMAX (before audio — visual category)
  T.push(mk('v-imax-e','IMAX Enhanced','(?i)\\bimax[\\s._-]?enhanced\\b','IMAX-enhanced.png',ST.res,'gv'));
  T.push(mk('v-imax','IMAX','(?i)^(?=.*\\bIMAX\\b)(?!.*enhanced)','IMAX.png',ST.res,'gv'));

  // Audio + DV
  if(C.dv==='combo'){
    T.push(mk('a-at-dv','Atmos+DV','(?i)^(?=.*'+ATMOS+')(?=.*'+DV+')','atmos-vision.png',ST.tr,'ga'));
    T.push(mk('a-at','Atmos','(?i)^(?=.*'+ATMOS+')(?!.*'+DV+')','atmos.png',ST.tr,'ga'));
    T.push(mk('a-th-dv','TrueHD+DV','(?i)^(?=.*'+TH+')(?!.*'+ATMOS+')(?=.*'+DV+')','truehd-vision.png',ST.tr,'ga'));
    T.push(mk('a-th','TrueHD','(?i)^(?=.*'+TH+')(?!.*'+ATMOS+')(?!.*'+DV+')','truehd.png',ST.tr,'ga'));
    T.push(mk('a-dp-dv','DD++DV','(?i)^(?=.*'+DDP+')(?!.*'+ATMOS+')(?!.*'+TH+')(?=.*'+DV+')','digitalplus-vision.png',ST.tr,'ga'));
    T.push(mk('a-dp','DD+','(?i)^(?=.*'+DDP+')(?!.*'+ATMOS+')(?!.*'+TH+')(?!.*'+DV+')','digitalplus.png',ST.tr,'ga'));
    T.push(mk('a-dd-dv','DD+DV','(?i)^(?=.*'+DD+')(?!.*'+DDP+')(?!.*'+TH+')(?!.*'+ATMOS+')(?=.*'+DV+')','digital-vision.png',ST.tr,'ga'));
    T.push(mk('a-dd','DD','(?i)^(?=.*'+DD+')(?!.*'+DDP+')(?!.*'+TH+')(?!.*'+ATMOS+')(?!.*'+DV+')','digital.png',ST.tr,'ga'));
    T.push(mk('a-dv','DV','(?i)^(?=.*'+DV+')(?!.*'+ATMOS+')(?!.*'+TH+')(?!.*'+DDP+')(?!.*'+DD+')','vision.png',ST.tr,'gv'));
  }else{
    T.push(mk('a-dv','DV','(?i)'+DV,'vision.png',ST.tr,'gv'));
    T.push(mk('a-at','Atmos','(?i)'+ATMOS,'atmos.png',ST.tr,'ga'));
    T.push(mk('a-th','TrueHD','(?i)^(?=.*'+TH+')(?!.*'+ATMOS+')','truehd.png',ST.tr,'ga'));
    T.push(mk('a-dp','DD+','(?i)^(?=.*'+DDP+')(?!.*'+ATMOS+')(?!.*'+TH+')','digitalplus.png',ST.tr,'ga'));
    T.push(mk('a-dd','DD','(?i)^(?=.*'+DD+')(?!.*'+DDP+')(?!.*'+TH+')(?!.*'+ATMOS+')','digital.png',ST.tr,'ga'));
  }

  // DTS
  T.push(mk('a-dtsx','DTS:X','(?i)\\bdts[-_.: ]?x\\b','dtsx.png',ST.res,'ga'));
  T.push(mk('a-dtsma','DTS-HD MA','(?i)^(?=.*\\bdts[-_. ]?(?:hd[-_. ]?)?ma\\b)(?!.*\\bdts[-_.: ]?x\\b)','dtshdma.png',ST.res,'ga'));
  T.push(mk('a-dtshd','DTS-HD','(?i)^(?=.*\\bdts[-_. ]?hd\\b)(?!.*\\bdts[-_. ]?(?:hd[-_. ]?)?ma\\b)(?!.*\\bdts[-_.: ]?x\\b)','dtshd.png',ST.res,'ga'));
  T.push(mk('a-dts','DTS','(?i)^(?=.*\\bDTS\\b)(?!.*\\bdts[-_. ]?(?:hd|ma|xll|x)\\b)','dts.png',ST.res,'ga'));

  // Surround
  T.push(mk('ch-71','7.1','[^0-9][7-8][. ][01]','7dot1.png',ST.tr,'gc'));
  T.push(mk('ch-51','5.1','^(?=.*[^0-9]5[. ][01])(?!.*[^0-9][7-8][. ][01])','5dot1.png',ST.tr,'gc'));

  // Languages
  const L=[['en','\ud83c\uddec\ud83c\udde7','(?i)\\benglish\\b|\\beng\\b'],['es','\ud83c\uddea\ud83c\uddf8','(?i)\\bspanish\\b|\\bspa\\b'],['fr','\ud83c\uddeb\ud83c\uddf7','(?i)\\bfrench\\b|\\bfra\\b'],['de','\ud83c\udde9\ud83c\uddea','(?i)\\bgerman\\b|\\bdeu\\b'],['it','\ud83c\uddee\ud83c\uddf9','(?i)\\bitalian\\b|\\bita\\b'],['pt','\ud83c\udde7\ud83c\uddf7','(?i)\\bportuguese\\b|\\bpor\\b'],['ja','\ud83c\uddef\ud83c\uddf5','(?i)\\bjapanese\\b|\\bjpn\\b|[\u3040-\u309F\u30A0-\u30FF]'],['ko','\ud83c\uddf0\ud83c\uddf7','(?i)\\bkorean\\b|\\bkor\\b|[\uAC00-\uD7AF]'],['zh','\ud83c\udde8\ud83c\uddf3','(?i)\\bchinese\\b|\\bchi\\b|[\u4E00-\u9FFF]'],['hi','\ud83c\uddee\ud83c\uddf3','(?i)\\bhindi\\b|\\bhin\\b|[\u0900-\u097F]'],['ar','\ud83c\uddf8\ud83c\udde6','(?i)\\barabic\\b|\\bara\\b|[\u0600-\u06FF]'],['ru','\ud83c\uddf7\ud83c\uddfa','(?i)\\brussian\\b|\\brus\\b|[\u0400-\u04FF]'],['mu','\ud83c\udf10','(?i)\\bmulti\\b|\\bdual[\\s._-]?audio\\b']];
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
