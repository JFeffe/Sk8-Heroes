import {probability as singleRollProbability} from './dice-probability.mjs';
// A whole-pool reroll discards the initial result. Keep ±1 for the new roll
// whenever it cannot already rescue this one; the two opportunities are IID.
export function probability(card,n,adjust=0,reroll=0){
 const p=singleRollProbability(card,n,adjust,0);
 return reroll?p+(1-p)*p:p;
}
