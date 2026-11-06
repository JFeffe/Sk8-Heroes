import {readFileSync} from 'node:fs';

// Fixed combinations used to exercise turn mechanics, independent of deck edits.
// These are test inputs, not the playable card catalog. The current 85-card
// catalog, odds, tiers, quantities and layers are tested separately.
export const TRICKS=JSON.parse(readFileSync(new URL('../../artwork/cards/tricks/deck-v1/legacy-catalog.json',import.meta.url),'utf8'));
