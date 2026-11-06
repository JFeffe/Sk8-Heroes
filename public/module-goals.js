export function moduleGoalPresentation(module){
 const b=module.bonus;
 const goals={
  base:{heading:'RETOUR AUX BASES',title:'BASE +1',caption:'Par carte Base'},
  favored:{heading:'TYPE FAVORISÉ',title:'+1',icon:b.type,caption:'Par trick de ce type'},
  signature:{heading:'DÉ SIGNATURE',title:'DÉ PERSO +2',caption:'Une fois par essai'},
  stars:{heading:'ÉTOILES DU PARK',title:'★ +1',caption:'Par étoile physique utilisée'},
  amplitude:{heading:'GRANDE AMPLITUDE',title:'3–4 DÉS : +2',caption:'Par trick'},
  recovery:{heading:'ZONE DE RÉCUPÉRATION',title:'2 TRICKS → 1 JETON',caption:'Exactement · au choix'},
  'three-score':{heading:'BELLE SORTIE',title:'3e : +2 PTS',caption:'Bonus de séquence · 1 jeton'},
  'three-tokens':{heading:'SESSION GÉNÉREUSE',title:'3 TRICKS → 2 JETONS',caption:'Au choix · +1 pt de séquence'}
 };
 const goal=goals[b.kind];if(!goal)throw Error('Unknown module effect: '+b.kind);return goal;
}
export const thirdTrickOffer=module=>({points:module.bonus.kind==='three-score'?2:1,tokens:module.bonus.kind==='three-tokens'?2:1});
