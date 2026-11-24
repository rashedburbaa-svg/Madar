# خريطة الكود — مستعمرة المدار

مولّدة آلياً بـ `python3 codemap.py`. اقرأ هذا الملف أولاً، ثم افتح الأسطر المطلوبة فقط (`sed -n` أو Read مع offset).

## js/anim.js — 36 سطر، 6KB
bfx:2 · puff:3 · rise:4 · lights:5 · CORR:23 · corridorsSVG:24 · dur:30 · doorSVG:32 · doorOpen:36

## js/artdata.js — 1480KB — الصور فقط (base64) — لا تقرأه؛ ابحث بـ grep عن ART.اسم

## js/artdata2.js — 27KB — صور إضافية (base64) — لا تقرأه

## js/artdata3.js — 12KB — صور إضافية (base64) — لا تقرأه

## js/artdata4.js — 28KB — صور إضافية (base64) — لا تقرأه

## js/artdata5.js — 76KB — صور خطوات المشي (base64) — لا تقرأه

## js/artdata6.js — 132KB — صور الزعماء والطائرات (base64) — لا تقرأه

## js/astro3d.js — 57 سطر، 6KB
Astro3D:2 · mat:4 · build:5 · cap:15 · limb:30 · init:40 · pose:45 · draw:51 · dir:52

## js/balance.js — 147 سطر، 12KB
BAL:3

## js/build.js — 256 سطر، 36KB
WB:10 · doorOpen:12 · TOOLS:15 · ISDEV:17 · pipes:17 · NAME:18 · EDGE:19 · cost:20 · costTxt:21 · ctr:22 · dev:23 · devAt:24 · eType:25 · maxHp:26 · hpOf:27 · covered:28 · zoneOk:29 · target:31 · pieceAt:35 · why:37 · pay2:46 · refund:47 · cacheB:49 · changed:52 · place:53 · near:67 · link:69 · solve:77 · sum:78 · pp:82 · grp:83 · rooms:85 · solid:86 · damage:89 · blast:93 · push:97 · clampN:102 · hpBar:104 · showHp:105 · floor2d:106 · edge2d:128 · items2d:142 · roof2d:146 · make3d:156 · build3d:157 · S2:160 · BG:165 · hurt:166 · box:167 · mat:177 · own:179 · draw3d:192 · paint:196 · open2:199 · starter:201 · has:203 · put:206 · wire:210 · TUT:213 · tb:216 · tutBase:217 · tutDraw:218 · tutTick:221 · start:223 · showPanel:236 · onKill:242 · netTick:244 · update:246 · stop:251 · center:253 · radarOn:254 · refresh:255

## js/colony.js — 710 سطر، 111KB
RES:4 · BLD:5 · BORDER:19 · PARTS:20 · GAMEOF:21 · colSave:23 · cap:24 · crew:25 · techLv:27 · tMul:27 · mult:28 · rate:29 · upCost:30 · upTime:31 · canPay:32 · pay:33 · OVERB:34 · gain:35 · fmtN:37 · fmtDur:38 · accrue:40 · finishBuild:44 · startBuild:46 · rush:54 · left:54 · repair:57 · colonyReward:64 · got:64 · QUESTS:75 · questCheck:96 · storyBox:99 · chapterDone:102 · TINT:106 · TNAME:107 · _mix:108 · GSET:109 · tintDefs:112 · tint:116 · lvBadge:117 · _sh:136 · _box:138 · _win:140 · _lattice:141 · art:144 · artRaw:145 · mod:187 · SLOT:258 · PRODB:260 · FEN:262 · fp:263 · fenceStyle:264 · dp:267 · domeSVG:268 · fenceSVG:283 · fenceRaw:284 · gateSVG:296 · gateRaw:297 · CRE:319 · CTOP:377 · ROAM:378 · TDEG:385 · towerN:386 · tierOf:387 · WNAME:388 · HEAD:389 · towerSVG:393 · towersSVG:395 · towersRaw:396 · CHP:401 · CTYPES:403 · crType:404 · popN:405 · creaturesSVG:406 · BT:409 · SPEED:411 · fenceR:412 · okSpot:413 · spawnPt:414 · pickTarget:415 · stepCreature:417 · battleInit:422 · svgEl:431 · spawnPack:433 · battleTick:437 · fire:452 · spark:457 · boom:458 · hurt:461 · fxAt:467 · zapSVG:468 · sceneSVG:470 · cam:511 · camView:512 · camZoom:518 · camBind:522 · up:528 · fxFloat:534 · fxRing:536 · resBar:540 · costHTML:541 · cardHTML:542 · bindActions:555 · go:559 · openSheet:561 · renderSheet:564 · listHTML:570 · closeSheet:575 · rankChip:576 · renderColony:577 · left:579 · go:594 · bRate:610 · bCap:611 · fillStores:612 · bubMin:613 · collect:614 · collectAll:619 · bubbleSVG:620 · updBubbles:622 · updRes:624 · flyRes:626 · phase:636 · SKY:637 · nightLights:638 · guideSVG:644 · tgt:644 · DAILY:648 · dayKey:649 · chestReady:650 · chestBox:651 · raidsOn:658 · raidPower:659 · defPower:660 · raidPlan:661 · raidCheck:662 · lost:666 · raidSoon:668 · raidShow:669 · end:675 · ambStart:679 · os:681 · ambStop:686 · ambSync:687 · focusB:691 · goTo:692 · left:700

## js/colony2.js — 94 سطر، 14KB
TECH:4 · techCost:20 · techTime:21 · researchTick:22 · startResearch:23 · rushResearch:26 · left:26 · labHTML:28 · DPOOL:35 · dtasks:36 · pick:36 · dtask:39 · tasksReady:40 · updTaskBadge:41 · tasksHTML:42 · claimTask:44 · strike:49 · BOSS_HP:55 · bossSVG:56 · bossBar:57 · bossSpawn:60 · bossTick:63 · bossDown:67 · MET:72 · meteorTick:73 · metBanner:77 · metSpawn:79 · labArt:87

## js/colony3.js — 69 سطر، 12KB
PLANETS:4 · galOpen:13 · artCount:14 · expDur:15 · planetOpen:16 · expStart:17 · expClaim:19 · rushExp:23 · left:23 · planetSVG:25 · galaxyBox:26 · pos:28 · TRD:42 · traderTick:43 · traderSVG:48 · traderHTML:49 · trade:51 · CREW:54 · crewPts:55 · crewInit:56 · suits:58 · crewTick:64

## js/colony4.js — 120 سطر، 14KB
building:5 · freeSlot:6 · rush2:7 · left:7 · buyBot2:10 · STAGES:15 · stagesHTML:16 · extraCard:21 · go:28 · SPECS:32 · specApply:33 · HAZ:46 · GUARD:47 · hazOk:48 · festOn:65 · festChip:66 · CREWN:70 · crewLine:71 · tips:71 · IMGHUE:84 · imgArt:85 · towerImg:98 · survBonus:104 · lines:112 · pend:116

## js/core.js — 213 سطر، 25KB
load:3 · isObj:4 · save:5 · rng:6 · shuffle:7 · toastQ:8 · toast:9 · nextToast:10 · starSVG:12 · fmtTime:13 · IC:14 · SFXB:32 · SFXVOL:33 · sfxLoad:34 · sfxPlay:36 · snd:38 · seqs:41 · buzz:48 · drawPrefs:49 · setStats:55 · setStat:56 · btn:57 · clearOverlays:58 · winBox:59 · celebrate:67 · cols:70 · step:72 · gState:79 · gSave:80 · starTotal:81 · todayKey:84 · yesterdayKey:85 · ACH:89 · unlock:96 · onWin:97 · RANKS:109 · rankOf:112 · addXP:113 · drawRank:115 · weekKey:120 · day:120 · GNAMES:121 · missionsFor:122 · wkCheck:127 · mission:128 · bump:129 · drawMissions:133 · shareResult:139 · openPicker:158 · resume:173 · packSave:179 · data:179 · sumOf:183 · unpackSave:184 · confirmBox:208 · close:213

## js/devices.js — 124 سطر، 20KB
WBD:5 · box:7 · shadow:8 · glow:9 · fxs:10 · GLOW:12 · piped:36 · tick:57 · fx2d:67 · SHN:69 · SHF:70 · shipCost:71 · seg:75 · eco:89 · par:91 · pp:93 · tankIn:94 · baseEco:100 · shipFx:102 · BFX:110 · ctx:111 · tone:113 · hiss:114 · play:116 · bfx:124

## js/explore.js — 110 سطر، 19KB
EX:2 · EXDOOR:3 · exInside:4 · exAvatar:5 · exMark:9 · exDraw:10 · exPos:13 · exGo:14 · exStep:16 · exToggle:22 · exPoint:24 · exClick:26 · INT:35 · crewWalk:36 · skyCol:38 · room:39 · screen:46 · props:52 · intInfo:67 · IDESC:73 · enterB:74 · close:78 · JOY:84 · joyEl:85 · joyDraw:86 · inScene:88 · joyUp:92 · joyStep:96 · exNear:104

## js/farmgame.js — 72 سطر، 12KB
FarmGame:2 · CROPS:3 · CR:7 · UPG:9 · fl:11 · speed:12 · init:13 · save:14 · grow:16 · fillOrders:19 · addXP_:22 · stg:23 · trayHTML:24 · render:29 · seedPicker:37 · tap:41 · fx:47 · send:48 · order:49 · buyUp:51 · farmCard:65

## js/hub.js — 43 سطر، 4KB
GAMES:3 · pilotCard:4 · renderHub:8 · drawBadges:25 · showTab:29 · openGame:33 · goHub:41

## js/i18n-en.js — 157KB — جدول الترجمة الإنجليزية — ابحث فيه بـ grep فقط

## js/i18n.js — 53 سطر، 4KB
LANG:3 · I18N:4 · UNIT:7 · trCore:8 · nums:11 · SPLITS:21 · trDeep:22 · tr:27 · TATTR:33 · trAttr:34 · trText:35 · trNode:36 · setLang:42 · run:48

## js/interior2.js — 75 سطر، 13KB
TIERC:3 · TIERN:4 · iGain:5 · IST:7 · iReady:18 · iStations:26 · iPlayer:27 · say:34 · walk:35 · step:36 · upd:38 · pt:39 · left:47 · IROLE:51 · ecoNow:52 · iScreenSVG:54 · iScreenUpd:62 · bar:71

## js/layout.js — 77 سطر، 10KB
LAY:5 · LAY_G:8 · LAY_B:9 · layValid:10 · layApply:11 · laySnap:13 · layOk:17 · LAY_PAIRS:21 · layPath:22 · corrList:24 · layAuto:26 · done:26 · layEnsure:29 · layHas:30 · layToggle:31 · layGridSVG:34 · layToolbar:39 · layOpen:41 · laySvgPt:42 · layBind:43 · keep:58 · end:59 · layClick:66 · layCancel:73

## js/meta.js — 112 سطر، 14KB
pilotBonus:4 · DIFFM:7 · before:8 · got:10 · SHOP:17 · shopOn:23 · shopHTML:25 · act:26 · shopWhy:29 · shopBuy:32 · got:35 · shieldTick:39 · battleBadges:59 · metaBadges:65 · rw:70 · MUS:81 · NOTE:82 · SONG:84 · mtone:86 · mpad:88 · mkick:90 · mschedule:91 · arp:100 · mstart:104 · mstop:107 · musSync:108 · draw:112

## js/panorama.js — 40 سطر، 3KB
panoSeen:6 · regionPanorama:7 · im:11 · tick:30 · mv:34 · close:36

## js/pilot.js — 241 سطر، 41KB
PilotGame:2 · rnd:6 · shipStats:8 · HANG:10 · PLANES:12 · plane:16 · hl:17 · SECT:18 · EN:21 · DIFF:22 · DF:23 · diffHTML:24 · reset:25 · shake:29 · addQ:31 · nextWave:32 · pats:35 · MINI:40 · spawnMini:41 · miniFire:43 · mk:51 · formation:52 · spawnBoss:64 · fire:66 · missile:69 · nearest:70 · boom:72 · kill:73 · hit:77 · hurtP:78 · update:81 · kx:83 · ks:126 · bossFire:128 · pick:133 · mineBurst:135 · nova:136 · txt:137 · sprite:139 · PIMG:140 · IMG:140 · img:140 · makeNeb:141 · draw:143 · em:148 · drawEnemy:175 · step:199 · stats:200 · resize:201 · toLocal:202 · clearOv:203 · overlay:204 · intro:205 · CARD:208 · planeImg:208 · planesHTML:209 · hangarHTML:211 · bindHangar:212 · begin:214 · die:215 · show:218 · pause:220 · end:233

## js/prestige.js — 81 سطر، 13KB
PLN:2 · PG:3 · PREQ:4 · ARK:5 · arkCost:7 · arkN:8 · pgReady:9 · arkTick:10 · arkBuild:12 · arkRush:14 · arkHTML:15 · pgHTML:23 · pgGo:31 · doRelaunch:34 · flight:48 · padSVG:55 · PSET:65 · fly:66 · pStage:71 · PHZ:72 · horizonSVG:73 · landmarkSVG:75 · PLM:78

## js/sfx.js — 13 سطر، 1KB
withSnd:2

## js/sfxdata.js — 71KB — الأصوات (base64) — لا تقرأه

## js/ship3d.js — 69 سطر، 9KB
Ship3D:2 · cache:3 · init:4 · glowM:9 · box:10 · cone:11 · fighter:13 · scout:26 · bomber:30 · diver:35 · boss:38 · stealth:45 · heavy:50 · star:55 · MK:61 · SPAN:62 · sprite:64

## js/survival.js — 99 سطر، 18KB
svInit:5 · svOn:6 · NEED:7 · svTarget:8 · moraleBonus:9 · svTick:10 · mood:18 · choiceBox:21 · svApply:26 · out:26 · svResult:31 · EVENTS:35 · svEvent:57 · STAT:63 · chance:64 · ADV:65 · advHTML:82 · advStart:91 · loot:92 · add:92 · scene:93 · finish:95 · advBtn:98

## js/survive.js — 700 سطر، 86KB
SurviveGame:2 · UP:7 · EVO:30 · CHARS:37 · DROPS:44 · DCOL:45 · TYPES:46 · DIFF:61 · DF:62 · diffHTML:63 · hpMul:64 · wpn:65 · BOSSES:67 · bossFor:76 · GUARDS:77 · spawnBoss:81 · bossAI:86 · shot:88 · drawBoss:120 · META:164 · mlv:176 · mcost:177 · openLab:178 · draw:180 · BIOMES:194 · makeBg:203 · blot:208 · pts:228 · makeAmb:250 · stepAmb:253 · drawAmb:262 · setBiome:270 · eyes:272 · SPR:275 · spr:275 · drawFx:278 · SPRK:286 · SFLT:287 · SSZ:288 · drawSprite:294 · BSPR:296 · drawAlien:297 · drawAstronaut:330 · VC:341 · shadow:344 · resize:345 · reset:346 · spawn:353 · pickType:360 · startWave:363 · CH:373 · setChallenge:376 · chText:384 · chProgress:387 · endChallenge:390 · avail:394 · applyUp:395 · chooseUpgrade:396 · nearest:412 · FT:413 · shake:413 · hurt:414 · kill:416 · drop:428 · take:429 · hitP:438 · update:441 · srcs:467 · pts:491 · push:527 · feel:562 · die:563 · show:573 · stats:581 · draw:582 · sz:620 · mx2:622 · step:650 · frame:654 · begin:661 · pause:662 · intro:666 · toLocal:675 · end:689 · lab:696

## js/terra.js — 69 سطر، 9KB
TFM:4 · TFS:9 · tfInit:20 · tfTI:21 · tfStage:22 · tfOpen:23 · tfCost:24 · tfRates:25 · tfTick:26 · got:27 · terraBonus:31 · terraBtn:32 · terraHTML:33 · bar:34 · tfBuy:43 · mixHex:49 · tfLook:50 · swap:51

## js/three.min.js — 653KB — مكتبة three.js — لا تقرأه

## js/world.js — 486 سطر، 73KB
WORLD:3 · WorldGame:32 · bot:35 · IMG:36 · img:36 · regAt:39 · regTrace:43 · regPos:48 · regMid:49 · regRand:51 · open:53 · gateOk:54 · gateTxt:55 · discover:56 · enterReg:58 · gateReady:60 · rnd:61 · seeded:62 · buildWorld:64 · kinds:66 · weap:73 · stats:74 · restat:76 · newPlayer:77 · monStats:80 · bandLv:82 · spawnMon:83 · wakeGuard:88 · input:91 · say:96 · update:97 · shot:112 · dirty:159 · RD:162 · raidTick:163 · raidSteal:175 · tk:175 · raidHud:178 · worldEvent:182 · gainXP:190 · hitP:193 · float:194 · kill:195 · guardTick:205 · hudBuild:208 · forge:222 · WTXT:229 · hudTick:230 · gw:235 · drawMini:240 · PAT:248 · pat:249 · propSpr:254 · tri:255 · MATC:269 · draw2d:270 · vis:282 · sprC:312 · c2:316 · LEGS:317 · legs:318 · monKey:322 · drawMon:323 · drawBot:341 · drawPlayer:344 · make3D:347 · deep:351 · TX:356 · sky:358 · blobT:363 · blob:365 · gmat:368 · rockG:377 · GEO:378 · COLR:381 · GLOWK:382 · spr:394 · NM:401 · part:406 · limb:418 · pool:424 · sync:425 · draw:429 · met3:451 · unlockReg:452 · dispose:453 · setView:455 · frame:459 · resize:460 · pd:462 · POIS:465 · worldCard:481

## js/worldmap.js — 130 سطر، 17KB
REG:3 · GEAR:18 · WM:29 · matN:30 · regOpen:31 · regReq:32 · regReady:33 · wmBonus:36 · gearOn:39 · tripDur:44 · tripStart:45 · tripRush:49 · addMat:50 · tripTick:51 · hrs:53 · got:60 · lmBuild:68 · gearMake:70 · regGo:73 · MAPV:76 · closeMap:77 · mapBox:78 · tripLine:81 · shipLine:83 · left:83 · matBar:85 · mapHTML:86 · regHTML:91 · gearHTML:106 · mapRender:111 · on:114

## style.css — 928 سطر، 99KB

## index.html — 120 سطر، 6KB

## sw.js — 12 سطر، 2KB
ASSETS:2
