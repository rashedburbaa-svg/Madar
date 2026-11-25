/* balance data: the tunable numbers of the economy and combat, kept apart from the game logic.
   Every number here keeps the value the game already had; names, emojis and texts stay in the game files. */
const BAL={
  mineProd:70,            // metal per hour at level 1 (was 60)
  foodCostMul:1.5,        // building food costs ×1.5 so food stays valuable
  raid:{perHq:15,growth:1.1,perWin:6},           // raid strength = perHq·hq·growth^(hq-1) + perWin·wins
  tower:{rate:{gun:0.45,laser:0.7,plasma:0.9},bonus:{gun:0,laser:1,plasma:2}}, // seconds per shot, extra damage by tier
  colBoss:{base:150,perHq:70,perTower:30},       // colony beast boss health
  iceDragonHp:660,
  techProd:0.15,          // production research: +15% per level (was +10%)
  techBoss:0.15,          // boss research: +15% damage on bosses per level
  techIon:0.10,           // ion drive: galaxy trips 10% shorter per level
  techScan:0.25,          // galaxy scanner: +25% trip rewards per level
  svBossHp:0.65,          // Survive bosses: health ×0.65 so a boss fight lasts about 30 s, not over a minute

  /* ---------- batch 1: the 12 buildings and the 5 ship parts (colony.js) ---------- */
  bld:{
    maxLv:10,
    base:{hq:[200,150,100],mine:[60,80,30],solar:[80,50,30],farm:[70,70,20],habitat:[100,80,80],radio:[150,120,40],
          obs:[160,140,60],def:[220,180,60],tower:[160,140,40],wall:[90,70,20],lab:[220,200,90],dock:[250,200,80]},  // level-1 cost [metal, energy, food]
    req:{radio:2,obs:2,def:3,tower:2,lab:3,dock:2},     // HQ level needed to build
    prod:{solar:['e',60],farm:['f',45],radio:['c',0.6]}, // per hour at level 1 (the mine uses mineProd, set below)
    costGrowth:1.6,           // cost = base · 1.6^level (food also ×foodCostMul)
    prodGrowth:1.15,          // output = prod · level · 1.15^(level-1)
    time:{base:20,growth:1.85,techCut:0.08},   // seconds = 20 · 1.85^level · (1 − 0.08·«روبوتات بناء»)
    rushSecPerGem:60,         // finishing a build now: 1 💎 per minute left
    cap:{base:600,growth:1.7,techStore:0.15},  // store = 600 · 1.7^(hq-1) · (1 + 0.15·«مخازن مضغوطة»)
    crew:{base:3,perHabitat:2},crewProd:0.04,  // each crew member +4% output
    wallProd:0.03,            // each dome level +3% output
    defLoot:0.2,              // each defence level +20% Survive loot
    taskLvBonus:0.3           // a task building's level raises its game reward +30% per level
  },
  ship:{
    parts:{engine:[400,400,100,10],nav:[650,700,160,20],shield:[1000,850,300,30],antenna:[1400,1500,420,45],hull:[2200,2000,800,60]},  // [metal, energy, food, crystal]
    dockLv:[1,2,3,4,5]        // repair dock level needed for each part
  },

  /* ---------- batch 2: the 12 researches and the 6 galaxy trips (colony2.js, colony3.js) ---------- */
  tech:{
    maxLv:5,max:{scan:3},
    base:{mine:[200,150,60],power:[150,200,60],agri:[150,150,100],store:[260,200,80],build:[240,240,100],offline:[200,220,120],
          dmg:[300,220,80],rate:[260,300,80],strike:[220,320,60],boss:[400,250,80],ion:[300,300,100],scan:[350,500,100]},
    req:{boss:{hq:5,strike:2},ion:{hq:5},scan:{hq:6,ion:1}},
    costGrowth:1.85,gemBase:3,gemPerLv:3,       // cost = base · 1.85^level, 💎 3 + 3·level
    time:{base:45,growth:2.1,labCut:0.04},      // seconds = 45 · 2.1^level · (1 − 0.04·lab level)
    rushSecPerGem:60,
    effect:{offline:2,offlineBaseH:8,dmg:1,rate:0.10,strike:0.5}  // rate: towers fire 10% faster per level (the card always said +10%; the code gave 8% until 24 Nov 2026)
  },
  galaxy:{
    planets:[{t:1200,r:{m:900,e:700,c:8}},{t:3600,r:{e:1800,f:1400,c:14}},{t:7200,r:{f:3200,m:2000,c:20}},
             {t:14400,r:{m:4500,e:4000,c:30}},{t:28800,r:{m:8000,e:7000,f:5000,c:45}},{t:43200,r:{c:120,m:12000,e:12000,f:9000}}],  // trip seconds and reward
    firstMul:1.5,hqBonus:0.08,artBonus:0.05,rushSecPerGem:120,xp:{first:80,again:30}
  },

  /* ---------- batch 3: the 6 regions and the 5 weapons (worldmap.js, world.js) ---------- */
  regions:{
    list:[{hq:1,scout:null,bonus:['all',0.03]},{hq:3,scout:{m:800,e:600,t:5},bonus:['e',0.06]},{hq:4,scout:{m:1500,e:1200,t:10},bonus:['m',0.06]},
          {hq:5,scout:{m:2500,e:2500,t:15},bonus:['c',0.08]},{hq:6,scout:{m:4000,e:4000,f:2000,t:20},bonus:['f',0.06]},{hq:8,scout:{m:7000,e:7000,f:4000,t:30},bonus:['all',0.03]}],  // scout t = minutes; bonus per landmark stage
    landmark:{cost:[{x:15,m:1500,e:1500},{x:50,m:5000,e:5000},{x:120,m:14000,e:14000}],rate:[0,2,4,8]},  // x = the region's material; rate = material per hour
    hqBonus:0.08,rushSecPerGem:120
  },
  hero:{
    player:{hp:120,dmg:12,rate:2.6,spd:150,range:270},
    mon:{small:{hp:26,dmg:8,spd:84,r:13},big:{hp:95,dmg:16,spd:56,r:20}},
    guard:{hp:520,lvOver:5,dmg:22,r:44,spd:46},   // region guardian: level = region level + 5
    hpGrow:1.15,dmgGrow:1.1,heroDmg:1.1,heroHp:12,xpBase:20,xpPow:1.5,xp:{small:4,big:10,guard:120},
    weap:{rifle:{rate:2.6,mul:1,cost:null},spread:{rate:2.0,mul:0.75,cost:{ice:20,alloy:20}},saber:{rate:1.5,mul:2.2,range:72,cost:{magma:20,alloy:20}},
          chain:{rate:1.8,mul:1.05,cost:{quartz:25,ice:15}},nova:{rate:0.9,mul:1.6,range:150,cost:{gas:25,spore:25}}},
    weapUp:{gem:15,mat:8}       // upgrade l→l+1: 💎 15·l and the weapon's material 8·l
  },

  /* ---------- batch 4: صمود المدار، طيّار المدار، مزرعة المدار ---------- */
  sv:{
    chars:{scout:{hp:1,dmg:1,rate:1,spd:1},sniper:{hp:0.85,dmg:1.75,rate:0.72,spd:1},runner:{hp:0.8,dmg:1,rate:1.1,spd:1.25},tank:{hp:1.3,dmg:1,rate:1,spd:0.85}},
    types:{grunt:{r:9,hp:20,spd:52,dps:12},runner:{r:7,hp:11,spd:92,dps:9},tank:{r:15,hp:85,spd:33,dps:20},spitter:{r:10,hp:28,spd:44,dps:10,shoots:2.4},
           blaster:{r:8,hp:14,spd:78,dps:6},splitter:{r:12,hp:40,spd:40,dps:12},spawnling:{r:6,hp:9,spd:70,dps:7},digger:{r:11,hp:34,spd:46,dps:14},
           healer:{r:10,hp:30,spd:40,dps:6},boss:{r:26,hp:520,spd:38,dps:28,shoots:2.8}},
    diff:{easy:{hp:0.7,dmg:0.55,sp:0.8,rw:0.6},normal:{hp:1.45,dmg:1.4,sp:1.25,rw:1},hard:{hp:2.2,dmg:2.1,sp:1.6,rw:1.7}},
    waveHp:{base:1.1,lin:0.25,quad:0.02},weaponPerWave:0.05,   // enemy hp ×(1.1+0.25(w-1)+0.02(w-1)²); weapon +5% per wave
    bosses:{golem:{r:28,hp:680,spd:30,dps:30},worm:{r:17,hp:560,spd:92,dps:26},ice:{r:24,hp:660,spd:46,dps:24},lava:{r:27,hp:640,spd:34,dps:30},
            octo:{r:26,hp:600,spd:38,dps:28},ship:{r:32,hp:720,spd:26,dps:30},brood:{r:20,hp:360,spd:44,dps:24},wraith:{r:18,hp:300,spd:36,dps:20}},
    bossDpsWave:{per:0.04,max:1.2},
    colony:{dmg:{def:4,tower:2,max:60},hp:{habitat:8,wall:4,max:120},rate:{solar:3,max:40}}   // colony support for Survive and عالم المدار
  },
  pilot:{
    hang:{hull:{max:5,c:12},dmg:{max:5,c:14},rate:{max:5,c:14},mag:{max:3,c:8},start:{max:2,c:30},bomb:{max:2,c:25},shield:{max:1,c:20}},hangGrowth:1.6,  // cost = c·(level+1)^1.6 💎
    planes:{orbit:{cost:0,hull:1,dmg:1,rate:1,spd:1},ghost:{cost:60,hull:.75,dmg:.8,rate:1.55,spd:1.35},tank:{cost:90,hull:1.45,dmg:.9,rate:.85,spd:.8},nova:{cost:150,hull:1,dmg:1,rate:1,spd:1.05}},
    en:{scout:{hp:14,r:15,sc:60},diver:{hp:10,r:14,sc:70},bomber:{hp:60,r:24,sc:180},ufo:{hp:30,r:18,sc:120},mini:{hp:300,r:30,sc:600},cruiser:{hp:90,r:26,sc:260},
        mine:{hp:16,r:12,sc:50},kami:{hp:12,r:12,sc:90},sniper:{hp:45,r:17,sc:200},rock:{hp:24,r:16,sc:40},boss:{hp:900,r:70,sc:3000}},   // sc = score
    diff:{easy:{hp:0.85,dmg:0.7,fr:0.85,bs:0.9,rw:0.6,ex:0},normal:{hp:1.85,dmg:1.75,fr:1.6,bs:1.25,rw:1,ex:1},hard:{hp:2.8,dmg:2.6,fr:2.1,bs:1.45,rw:2,ex:3}},
    stats:{hull:100,hullPerLv:12,hullPerPart:10,hullUp:0.12,dmgPerLv:0.06,dmgPerPart:0.04,dmgUp:0.08,bombs:2},
    colony:{dmg:{def:2,tower:1,wall:1,max:30},hull:{habitat:4,wall:3,max:60}}
  },
  farm:{
    crops:{let:{t:60,f:40,xp:2,lv:1},tom:{t:180,f:120,xp:4,lv:1},car:{t:300,f:180,xp:6,lv:2},str:{t:600,f:320,xp:9,lv:3},corn:{t:1200,f:600,xp:14,lv:4},
           pep:{t:1800,f:850,xp:18,lv:5},mel:{t:3600,f:1600,xp:28,lv:6},mush:{t:5400,f:1000,xp:40,lv:7,c:3}},   // t = seconds, f = food
    trays:4,xp:{base:40,growth:1.6},caps:{base:2,max:7},
    up:{lamp:{max:5,m:400,growth:2,speed:0.15},spr:{max:1,c:40},net:{max:1,c:30}}
  },

  /* ---------- free modular building in عالم المدار (build.js, phase 1): pieces snap to a 48-unit grid in المدار-1 ---------- */
  build:{
    cell:48,reach:58,tapReach:230,roofFade:190,refund:0.5,wireMaxCells:6,
    floor:{m:20},wall:{m:15,e:5,hp:120},wire:{m:5},
    gen:{m:120,e:40,power:10,surplusE:6},     // power generator: +10 power for its network; unused power feeds the colony +6 ⚡/hour per unit
    lamp:{m:20,use:2},             // a base light: uses 2 power, glows only when its network has enough
    // phase 2: openings on cell edges, covers over cells, corridors; every structural piece has health
    door:{m:25,e:10,hp:90},        // the astronaut walks through, monsters do not
    window:{m:20,e:15,hp:60},      // glass in a wall: blocks everyone, lets the light through
    roof:{m:15,hp:80},             // flat roof panel over a floor cell (hides while you are inside)
    dome:{m:20,e:25,hp:70},        // glass dome over a floor cell
    cor:{m:30,e:10,hp:80},         // covered glass corridor tile: a floor with its own canopy
    // phase 3: devices (devices.js). use = power taken from the wire network; pipes join devices to tanks
    craft:{m:150,e:60,use:3,recipes:{recycle:{sc:10,out:{m:60}},cell:{sc:5,m:40,out:{e:50}},part:{sc:20,c:5,out:{gear:1}}}},   // crafting & scrap recycling table
    planter:{m:60,e:20,use:1,perHour:40},        // grow bed: +40 🌱/hour to the colony while powered and piped to a tank (phase 4)
    tank:{m:80,cap:300,capAdd:150},              // storage tank: every tank adds 150 to the colony's stores
    research:{m:100,e:60,use:2,cut:0.05,maxN:2}, // research screen: each powered one makes research 5% faster (up to 2)
    radar:{m:90,e:50,use:2},                     // radar screen: the six regions, guardians and signals
    turret:{m:180,e:80,use:4,range:260,rate:1.2,dmgMul:0.6,def:10},   // powered defence turret: 60% of the hero's damage; +10 colony defence
    pipe:{m:8},pipeMaxCells:6,
    // raids on the built base (world.js): a wave walks from the wild to the base; a powered radar warns earlier and points at it
    raid:{firstS:75,everyS:180,warnRadar:20,warnBase:8,n0:4,perLv:1,maxN:14,dist:640,timeoutS:120,steal:{m:30,f:15},win:{c:3,sc:15}},
    // ship assembly bay (devices.js): the five ship modules, each from the materials of the regions, each with an instant ability
    bay:{m:200,e:100,use:2},
    ship:[
      {id:'armor',cost:{mat:{alloy:30,spore:20},sc:25,m:300},fx:0.15},   // 1 hull of protection: −15% damage to the astronaut and the base
      {id:'core',cost:{mat:{magma:30},cells:3,e:300},fx:15},             // 2 power core: +15 power on the bay's network
      {id:'drive',cost:{mat:{ice:30},sc:30,m:200},fx:0.20},              // 3 drive: +20% astronaut speed
      {id:'radar',cost:{mat:{quartz:35},e:250},fx:0.35},                 // 4 radar array: +35% radar reach (earlier raid warning, longer turret range)
      {id:'nav',cost:{mat:{gas:40},gear:1,c:20},fx:0.10}],               // 5 final navigation: completes the ship (chapter 2) and +10% colony production
    scrapPerKill:1,scrapGuard:10,tutGems:10,     // the base tutorial gives 💎 10 at the end                // scrap the monsters leave for the recycling table
    monDmg:0.5,                    // a monster stopped by a piece hits it for 50% of its damage per second
    meteorDmg:45,                  // a meteor hitting the base takes this much from every piece under it
    repairPerHp:0.25               // repair cost: ⛏️ 0.25 per health point restored
  },

  /* ---------- «عالم المدار»: dodging is by movement only (joystick), so every danger is telegraphed first ---------- */
  world:{
    enemy:{windupMs:420,lungeMul:1.65,lungeMs:300,reach:46,hitMul:1.2,recoverMs:1100,packMin:3,packMax:6,maxActive:55,zoneLv:[1,5,10,15,20,25]},
    guard:{phase2At:0.5,fireMul:1.35,summonBonus:2,respawnS:300,fastKills:25},
    gear:{base:0.04,guard:0.25,perTier:0.005,discount:0.5},   // rare weapon part: chance per kill; tier = HQ level + region; one part halves an upgrade's 💎 cost
    bot:{rate:1.1,dmgMul:0.35,range:240},   // companion drone: shots per second, share of the hero's damage, reach
    events:{everyS:110,types:['invasion','meteors'],invasionExtra:10,meteorWarnMs:1100,meteorN:7,meteorR:42,meteorDmg:0.18},  // meteor damage = share of max health
    time:{dayS:480,startTod:0.3,nightGen:0.85,nightRaid:1.5},   // one full day = 8 real minutes; at night generators give 85% and the raid clock runs 1.5× faster
    weather:{stormP:0.35,minS:70,maxS:160,storm:{gen:0.7,farm:0.75},clearFarm:1.1,particles:90},   // chance a new spell is a storm, spell length (s), storm penalties, clear-day farm bonus
    terrain:{perRegion:[14,12,12,12,14,12]},   // hills, mesas and craters per region
    edgeFog:520,   // width of the fog band at the planet's edge
    story:{gems:3}   // 💎 for a story step (+1 per step number)
  }
};
BAL.bld.prod.mine=['m',BAL.mineProd];
BAL.sv.bosses.ice.hp=BAL.iceDragonHp;
