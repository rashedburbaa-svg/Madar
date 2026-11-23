/* balance data: the tunable numbers of the economy and combat, kept apart from the game logic */
const BAL={
  mineProd:70,            // metal per hour at level 1 (was 60)
  foodCostMul:1.5,        // building food costs ×1.5 so food stays valuable
  raid:{perHq:15,growth:1.1,perWin:6},           // raid strength = perHq·hq·growth^(hq-1) + perWin·wins
  tower:{rate:{gun:0.45,laser:0.7,plasma:0.9},bonus:{gun:0,laser:1,plasma:2}}, // seconds per shot, extra damage by tier
  colBoss:{base:150,perHq:70,perTower:30},       // colony beast boss health
  iceDragonHp:660
};
