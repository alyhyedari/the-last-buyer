import test from 'node:test';
import assert from 'node:assert/strict';
import {ORDER} from '../src/i18n.js';
import {V,VILLAGE_ITEMS,VILLAGE_PROJECTS,VILLAGE_ENTITIES,VILLAGE_OUTCOMES,VILLAGE_OUTCOME_IDS} from '../src/village-content.js';
import {newVillageState,normalizeVillageState,recordVillageEncounter} from '../src/village-state.js';
import {newState,validateState} from '../src/state.js';

test('the village expansion has a complete multilingual economy and 28 fates',()=>{
 assert.equal(VILLAGE_OUTCOMES.length,28);
 assert.equal(new Set(VILLAGE_OUTCOME_IDS).size,28);
 for(const value of [V,...VILLAGE_ITEMS,...VILLAGE_PROJECTS,...VILLAGE_OUTCOMES]){
  const visit=entry=>{if(!entry||typeof entry!=='object')return;if('fa'in entry){for(const locale of ORDER)assert.equal(typeof entry[locale],'string');return;}for(const child of Object.values(entry))visit(child);};
  visit(value);
 }
 assert.ok(VILLAGE_ENTITIES.some(entity=>entity.type==='ghost'));
 assert.ok(VILLAGE_ENTITIES.some(entity=>entity.type==='thief'));
 assert.ok(VILLAGE_ITEMS.some(item=>item.id==='car'&&item.cost===350));
});

test('village state is bounded, idempotent and migrates through the main save',()=>{
 const village=newVillageState();assert.equal(village.money,120);assert.equal(recordVillageEncounter(village,'thief-won'),true);assert.equal(recordVillageEncounter(village,'thief-won'),false);
 village.money=-20;village.growth=99;village.projects=['lamps'];const normalized=normalizeVillageState(village);assert.equal(normalized.money,0);assert.equal(normalized.growth,4);assert.deepEqual(normalized.projects,['lamps']);
 assert.equal(normalizeVillageState({...village,vehicle:'spaceship'}),null);
 const state=newState();state.village=normalized;const round=validateState(state);assert.deepEqual(round.village,normalized);
 const legacy=structuredClone(state);legacy.version=4;delete legacy.village;assert.ok(validateState(legacy).village);
});
