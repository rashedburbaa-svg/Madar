/* balance data: the tunable numbers of the economy and combat, kept apart from the game logic */
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
  // «عالم المدار»: dodging is by movement only (joystick), so every danger is telegraphed first
  world:{
    enemy:{windupMs:420,lungeMul:1.65,lungeMs:300,reach:46,hitMul:1.2,recoverMs:1100,packMin:3,packMax:6,maxActive:55,zoneLv:[1,5,10,15,20,25]},
    guard:{phase2At:0.5,fireMul:1.35,summonBonus:2,respawnS:300,fastKills:25},
    gear:{base:0.04,guard:0.25,perTier:0.005,discount:0.5},   // rare weapon part: chance per kill; tier = HQ level + region; one part halves an upgrade's 💎 cost
    events:{everyS:110,types:['invasion','meteors'],invasionExtra:10,meteorWarnMs:1100,meteorN:7,meteorR:42,meteorDmg:0.18}  // meteor damage = share of max health
  }
};
