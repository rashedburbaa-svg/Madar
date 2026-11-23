# خريطة الكود — مستعمرة المدار

مولّدة آلياً بـ `python3 codemap.py`. اقرأ هذا الملف أولاً، ثم افتح الأسطر المطلوبة فقط (`sed -n` أو Read مع offset).

## js/anim.js — 37 سطر، 6KB
bfx:2 · puff:3 · rise:4 · lights:5 · CORR:23 · corridorsSVG:24 · dur:30 · doorSVG:32 · doorOpen:37

## js/artdata.js — 1480KB — الصور فقط (base64) — لا تقرأه؛ ابحث بـ grep عن ART.اسم

## js/artdata2.js — 27KB — صور إضافية (base64) — لا تقرأه

## js/artdata3.js — 12KB — صور إضافية (base64) — لا تقرأه

## js/artdata4.js — 28KB — صور إضافية (base64) — لا تقرأه

## js/artdata5.js — 76KB — صور خطوات المشي (base64) — لا تقرأه

## js/artdata6.js — 132KB — صور الزعماء والطائرات (base64) — لا تقرأه

## js/astro3d.js — 57 سطر، 6KB
Astro3D:2 · mat:4 · build:5 · cap:15 · limb:30 · init:40 · pose:45 · draw:51 · dir:52

## js/balance.js — 22 سطر، 1KB
BAL:2

## js/colony.js — 709 سطر، 110KB
RES:4 · BLD:5 · BORDER:19 · PARTS:20 · GAMEOF:21 · colSave:23 · cap:24 · crew:25 · techLv:27 · tMul:27 · mult:28 · rate:29 · upCost:30 · upTime:31 · canPay:32 · pay:33 · OVERB:34 · gain:35 · fmtN:37 · fmtDur:38 · accrue:40 · finishBuild:44 · startBuild:46 · rush:54 · left:54 · repair:57 · colonyReward:64 · got:64 · QUESTS:75 · questCheck:96 · storyBox:99 · chapterDone:102 · TINT:106 · TNAME:107 · _mix:108 · GSET:109 · tintDefs:112 · tint:116 · lvBadge:117 · _sh:136 · _box:138 · _win:140 · _lattice:141 · art:144 · artRaw:145 · mod:187 · SLOT:258 · PRODB:260 · FEN:262 · fp:263 · fenceStyle:264 · dp:267 · domeSVG:268 · fenceSVG:283 · fenceRaw:284 · gateSVG:296 · gateRaw:297 · CRE:319 · CTOP:377 · ROAM:378 · TDEG:385 · towerN:386 · tierOf:387 · WNAME:388 · HEAD:389 · towerSVG:393 · towersSVG:395 · towersRaw:396 · CHP:401 · CTYPES:403 · crType:404 · popN:405 · creaturesSVG:406 · BT:409 · SPEED:411 · fenceR:412 · okSpot:413 · spawnPt:414 · pickTarget:415 · stepCreature:417 · battleInit:422 · svgEl:431 · spawnPack:433 · battleTick:437 · fire:452 · spark:457 · boom:458 · hurt:461 · fxAt:467 · zapSVG:468 · sceneSVG:470 · cam:511 · camView:512 · camZoom:518 · camBind:522 · up:527 · fxFloat:533 · fxRing:535 · resBar:539 · costHTML:540 · cardHTML:541 · bindActions:554 · go:558 · openSheet:560 · renderSheet:563 · listHTML:569 · closeSheet:574 · rankChip:575 · renderColony:576 · left:578 · go:593 · bRate:609 · bCap:610 · fillStores:611 · bubMin:612 · collect:613 · collectAll:618 · bubbleSVG:619 · updBubbles:621 · updRes:623 · flyRes:625 · phase:635 · SKY:636 · nightLights:637 · guideSVG:643 · tgt:643 · DAILY:647 · dayKey:648 · chestReady:649 · chestBox:650 · raidsOn:657 · raidPower:658 · defPower:659 · raidPlan:660 · raidCheck:661 · lost:665 · raidSoon:667 · raidShow:668 · end:674 · ambStart:678 · os:680 · ambStop:685 · ambSync:686 · focusB:690 · goTo:691 · left:699

## js/colony2.js — 94 سطر، 13KB
TECH:4 · techCost:20 · techTime:21 · researchTick:22 · startResearch:23 · rushResearch:26 · left:26 · labHTML:28 · DPOOL:35 · dtasks:36 · pick:36 · dtask:39 · tasksReady:40 · updTaskBadge:41 · tasksHTML:42 · claimTask:44 · strike:49 · BOSS_HP:55 · bossSVG:56 · bossBar:57 · bossSpawn:60 · bossTick:63 · bossDown:67 · MET:72 · meteorTick:73 · metBanner:77 · metSpawn:79 · labArt:87

## js/colony3.js — 69 سطر، 12KB
PLANETS:4 · galOpen:13 · artCount:14 · expDur:15 · planetOpen:16 · expStart:17 · expClaim:19 · rushExp:23 · left:23 · planetSVG:25 · galaxyBox:26 · pos:28 · TRD:42 · traderTick:43 · traderSVG:48 · traderHTML:49 · trade:51 · CREW:54 · crewPts:55 · crewInit:56 · suits:58 · crewTick:64

## js/colony4.js — 120 سطر، 14KB
building:5 · freeSlot:6 · rush2:7 · left:7 · buyBot2:10 · STAGES:15 · stagesHTML:16 · extraCard:21 · go:28 · SPECS:32 · specApply:33 · HAZ:46 · GUARD:47 · hazOk:48 · festOn:65 · festChip:66 · CREWN:70 · crewLine:71 · tips:71 · IMGHUE:84 · imgArt:85 · towerImg:98 · survBonus:104 · lines:112 · pend:116

## js/core.js — 213 سطر، 25KB
load:3 · isObj:4 · save:5 · rng:6 · shuffle:7 · toastQ:8 · toast:9 · nextToast:10 · starSVG:12 · fmtTime:13 · IC:14 · SFXB:32 · SFXVOL:33 · sfxLoad:34 · sfxPlay:36 · snd:38 · seqs:41 · buzz:48 · drawPrefs:49 · setStats:55 · setStat:56 · btn:57 · clearOverlays:58 · winBox:59 · celebrate:67 · cols:70 · step:72 · gState:79 · gSave:80 · starTotal:81 · todayKey:84 · yesterdayKey:85 · ACH:89 · unlock:96 · onWin:97 · RANKS:109 · rankOf:112 · addXP:113 · drawRank:115 · weekKey:120 · day:120 · GNAMES:121 · missionsFor:122 · wkCheck:127 · mission:128 · bump:129 · drawMissions:133 · shareResult:139 · openPicker:158 · resume:173 · packSave:179 · data:179 · sumOf:183 · unpackSave:184 · confirmBox:208 · close:213

## js/explore.js — 110 سطر، 19KB
EX:2 · EXDOOR:3 · exInside:4 · exAvatar:5 · exMark:9 · exDraw:10 · exPos:13 · exGo:14 · exStep:16 · exToggle:22 · exPoint:24 · exClick:26 · INT:35 · crewWalk:36 · skyCol:38 · room:39 · screen:46 · props:52 · intInfo:67 · IDESC:73 · enterB:74 · close:78 · JOY:84 · joyEl:85 · joyDraw:86 · inScene:88 · joyUp:92 · joyStep:96 · exNear:104

## js/farmgame.js — 72 سطر، 12KB
FarmGame:2 · CROPS:3 · CR:7 · UPG:9 · fl:11 · speed:12 · init:13 · save:14 · grow:16 · fillOrders:19 · addXP_:22 · stg:23 · trayHTML:24 · render:29 · seedPicker:37 · tap:41 · fx:47 · send:48 · order:49 · buyUp:51 · farmCard:65

## js/hub.js — 43 سطر، 4KB
GAMES:3 · pilotCard:4 · renderHub:8 · drawBadges:25 · showTab:29 · openGame:33 · goHub:41

## js/i18n-en.js — 146KB — جدول الترجمة الإنجليزية — ابحث فيه بـ grep فقط

## js/i18n.js — 53 سطر، 4KB
LANG:3 · I18N:4 · UNIT:7 · trCore:8 · nums:11 · SPLITS:21 · trDeep:22 · tr:27 · TATTR:33 · trAttr:34 · trText:35 · trNode:36 · setLang:42 · run:48

## js/interior2.js — 75 سطر، 13KB
TIERC:3 · TIERN:4 · iGain:5 · IST:7 · iReady:18 · iStations:26 · iPlayer:27 · say:34 · walk:35 · step:36 · upd:38 · pt:39 · left:47 · IROLE:51 · ecoNow:52 · iScreenSVG:54 · iScreenUpd:62 · bar:71

## js/meta.js — 112 سطر، 14KB
pilotBonus:4 · DIFFM:7 · before:8 · got:10 · SHOP:17 · shopOn:23 · shopHTML:25 · act:26 · shopWhy:29 · shopBuy:32 · got:35 · shieldTick:39 · battleBadges:59 · metaBadges:65 · rw:70 · MUS:81 · NOTE:82 · SONG:84 · mtone:86 · mpad:88 · mkick:90 · mschedule:91 · arp:100 · mstart:104 · mstop:107 · musSync:108 · draw:112

## js/panorama.js — 40 سطر، 3KB
panoSeen:6 · regionPanorama:7 · im:11 · tick:30 · mv:34 · close:36

## js/pilot.js — 241 سطر، 41KB
PilotGame:2 · rnd:6 · shipStats:8 · HANG:10 · PLANES:12 · plane:16 · hl:17 · SECT:18 · EN:21 · DIFF:22 · DF:23 · diffHTML:24 · reset:25 · shake:29 · addQ:31 · nextWave:32 · pats:35 · MINI:40 · spawnMini:41 · miniFire:43 · mk:51 · formation:52 · spawnBoss:64 · fire:66 · missile:69 · nearest:70 · boom:72 · kill:73 · hit:77 · hurtP:78 · update:81 · kx:83 · ks:126 · bossFire:128 · pick:133 · mineBurst:135 · nova:136 · txt:137 · sprite:139 · PIMG:140 · IMG:140 · img:140 · makeNeb:141 · draw:143 · em:148 · drawEnemy:175 · step:199 · stats:200 · resize:201 · toLocal:202 · clearOv:203 · overlay:204 · intro:205 · CARD:208 · planeImg:208 · planesHTML:209 · hangarHTML:211 · bindHangar:212 · begin:214 · die:215 · show:218 · pause:220 · end:233

## js/prestige.js — 77 سطر، 12KB
PLN:2 · PG:3 · PREQ:4 · ARK:5 · arkCost:7 · arkN:8 · pgReady:9 · arkTick:10 · arkBuild:12 · arkRush:14 · arkHTML:15 · pgHTML:23 · pgGo:31 · doRelaunch:34 · flight:48 · padSVG:55 · PSET:65 · fly:66 · pStage:70 · landmarkSVG:71 · PLM:74

## js/sfx.js — 13 سطر، 1KB
withSnd:2

## js/sfxdata.js — 71KB — الأصوات (base64) — لا تقرأه

## js/ship3d.js — 69 سطر، 9KB
Ship3D:2 · cache:3 · init:4 · glowM:9 · box:10 · cone:11 · fighter:13 · scout:26 · bomber:30 · diver:35 · boss:38 · stealth:45 · heavy:50 · star:55 · MK:61 · SPAN:62 · sprite:64

## js/survival.js — 99 سطر، 18KB
svInit:5 · svOn:6 · NEED:7 · svTarget:8 · moraleBonus:9 · svTick:10 · mood:18 · choiceBox:21 · svApply:26 · out:26 · svResult:31 · EVENTS:35 · svEvent:57 · STAT:63 · chance:64 · ADV:65 · advHTML:82 · advStart:91 · loot:92 · add:92 · scene:93 · finish:95 · advBtn:98

## js/survive.js — 696 سطر، 87KB
SurviveGame:2 · UP:7 · EVO:30 · CHARS:37 · DROPS:43 · DCOL:44 · TYPES:45 · DIFF:59 · DF:60 · diffHTML:61 · hpMul:62 · wpn:63 · BOSSES:65 · bossFor:73 · GUARDS:74 · spawnBoss:77 · bossAI:82 · shot:84 · drawBoss:116 · META:160 · mlv:172 · mcost:173 · openLab:174 · draw:176 · BIOMES:190 · makeBg:199 · blot:204 · pts:224 · makeAmb:246 · stepAmb:249 · drawAmb:258 · setBiome:266 · eyes:268 · SPR:271 · spr:271 · drawFx:274 · SPRK:282 · SFLT:283 · SSZ:284 · drawSprite:290 · BSPR:292 · drawAlien:293 · drawAstronaut:326 · VC:337 · shadow:340 · resize:341 · reset:342 · spawn:349 · pickType:356 · startWave:359 · CH:369 · setChallenge:372 · chText:380 · chProgress:383 · endChallenge:386 · avail:390 · applyUp:391 · chooseUpgrade:392 · nearest:408 · FT:409 · shake:409 · hurt:410 · kill:412 · drop:424 · take:425 · hitP:434 · update:437 · srcs:463 · pts:487 · push:523 · feel:558 · die:559 · show:569 · stats:577 · draw:578 · sz:616 · mx2:618 · step:646 · frame:650 · begin:657 · pause:658 · intro:662 · toLocal:671 · end:685 · lab:692

## js/terra.js — 69 سطر، 9KB
TFM:4 · TFS:9 · tfInit:20 · tfTI:21 · tfStage:22 · tfOpen:23 · tfCost:24 · tfRates:25 · tfTick:26 · got:27 · terraBonus:31 · terraBtn:32 · terraHTML:33 · bar:34 · tfBuy:43 · mixHex:49 · tfLook:50 · swap:51

## js/three.min.js — 653KB — مكتبة three.js — لا تقرأه

## js/world.js — 381 سطر، 56KB
WORLD:3 · WorldGame:28 · bot:31 · IMG:32 · img:32 · regAt:33 · regPos:34 · regMid:35 · open:36 · gateOk:37 · gateTxt:38 · discover:39 · enterReg:41 · gateReady:43 · rnd:44 · seeded:45 · buildWorld:47 · kinds:49 · weap:56 · stats:57 · restat:59 · newPlayer:60 · monStats:62 · bandLv:64 · spawnMon:65 · wakeGuard:70 · input:73 · say:78 · update:79 · shot:93 · dirty:138 · worldEvent:140 · gainXP:148 · hitP:151 · float:152 · kill:153 · guardTick:163 · hudBuild:166 · forge:178 · WTXT:185 · hudTick:186 · gw:191 · drawMini:196 · PAT:203 · pat:204 · propSpr:209 · tri:210 · MATC:224 · draw2d:225 · vis:234 · sprC:263 · c2:267 · LEGS:268 · legs:269 · monKey:273 · drawMon:274 · drawBot:292 · drawPlayer:295 · make3D:298 · TX:302 · gmat:304 · GEO:308 · COLR:310 · spr:317 · NM:323 · part:327 · pool:331 · sync:332 · draw:334 · met3:347 · unlockReg:348 · dispose:349 · setView:351 · frame:355 · resize:356 · pd:358 · POIS:361 · worldCard:376

## js/worldmap.js — 130 سطر، 17KB
REG:3 · LMCOST:16 · LMRATE:17 · GEAR:18 · WM:29 · matN:30 · regOpen:31 · regReq:32 · regReady:33 · wmBonus:36 · gearOn:39 · tripDur:44 · tripStart:45 · tripRush:49 · addMat:50 · tripTick:51 · hrs:53 · got:60 · lmBuild:68 · gearMake:70 · regGo:72 · MAPV:76 · closeMap:77 · mapBox:78 · tripLine:81 · shipLine:83 · left:83 · matBar:85 · mapHTML:86 · regHTML:91 · gearHTML:106 · mapRender:111 · on:114

## style.css — 873 سطر، 93KB

## index.html — 117 سطر، 6KB

## sw.js — 12 سطر، 2KB
ASSETS:2
