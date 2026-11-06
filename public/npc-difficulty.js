// Difficulty only changes decisions. Dice, card rules, rewards and starting
// resources are always those of the shared engine, for every controller.
export const NPC_DIFFICULTIES=[
 {id:'easy',label:'Détente',caution:2.25,searchDepth:1,draftHorizon:1,maxBonusSpend:1,parScoreCap:6,chaseFirst:false,preserveDice:false,optimizePlacement:false,switchAfterRoll:false,variety:.85,regret:5,relativeRegret:.35,description:'Joue surtout le prochain trick et garde ses jetons.'},
 {id:'normal',label:'Normal',caution:1.3,searchDepth:2,draftHorizon:2,maxBonusSpend:2,parScoreCap:7,chaseFirst:false,preserveDice:true,optimizePlacement:false,switchAfterRoll:false,variety:.8,regret:4.5,relativeRegret:.3,description:'Prévoit deux tricks et utilise ses bonus avec modération.'},
 {id:'expert',label:'Expert',caution:1,searchDepth:3,draftHorizon:null,maxBonusSpend:null,parScoreCap:12,chaseFirst:true,preserveDice:true,optimizePlacement:true,switchAfterRoll:false,variety:0,regret:0,relativeRegret:0,description:'Prévoit trois tricks et optimise le placement des dés et les jetons.'}
];
export const npcDifficulty=id=>NPC_DIFFICULTIES.find(p=>p.id===id)||NPC_DIFFICULTIES[1];
