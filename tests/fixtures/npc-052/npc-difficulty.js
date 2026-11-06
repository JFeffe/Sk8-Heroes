// Difficulty only changes decisions. Dice, card rules, rewards and starting
// resources are always those of the shared engine, for every controller.
export const NPC_DIFFICULTIES=[
 {id:'easy',label:'Détente',caution:2.25,searchDepth:1,parScoreCap:6,chaseFirst:false,preserveDice:false,optimizePlacement:false,switchAfterRoll:false,variety:.75,regret:5,relativeRegret:.3,description:'Joue surtout le prochain trick et s’arrête plus tôt.'},
 {id:'normal',label:'Normal',caution:1.12,searchDepth:2,parScoreCap:7,chaseFirst:false,preserveDice:true,optimizePlacement:false,switchAfterRoll:false,variety:.6,regret:3,relativeRegret:.2,description:'Sécurise son premier essai, puis cherche à battre le meneur.'},
 {id:'expert',label:'Expert',caution:1,searchDepth:3,parScoreCap:12,chaseFirst:true,preserveDice:true,optimizePlacement:true,switchAfterRoll:false,variety:0,regret:0,relativeRegret:0,description:'Prévoit trois tricks et optimise le placement des dés et les jetons.'}
];
export const npcDifficulty=id=>NPC_DIFFICULTIES.find(p=>p.id===id)||NPC_DIFFICULTIES[1];
