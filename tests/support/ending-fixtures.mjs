import {newState} from '../../src/state.js';
import {CHAPTERS} from '../../src/content.js';
// Authored story journeys, deliberately not generated from the route rules.
export const JOURNEYS={
 repayment:{},custodian:{},fire:{},shared:{},leave:{},autopilot:{},witness:{},loop:{micro:{0:1}},
 installments:{major:{0:0,3:0}},workshop:{major:{5:1,6:2}},address:{major:{0:2}},letters:{projects:['letters']},
 commons:{major:{3:2},projects:['lights']},reserve:{major:{1:2}},exitright:{major:{4:2}},
 monopoly:{major:{4:1},micro:{1:1,4:1}},blackout:{micro:{7:1}},deluge:{major:{3:1},micro:{3:1}},
 jackpot:{major:{0:1,6:1},micro:{5:1}},ferry:{major:{5:2},micro:{7:1}},quiet:{micro:{7:1}},
 lantern:{micro:{7:1},projects:['lights','melody']},broadcast:{},palimpsest:{major:{6:2}}
};
export function endingJourney(id){
 if(!Object.hasOwn(JOURNEYS,id))throw new Error('Missing authored journey: '+id);
 const story=JOURNEYS[id],s=newState();s.chapter=s.unlocked=7;s.zone='chapter';s.position={...CHAPTERS[7].start};
 s.visited=CHAPTERS.map(c=>c.index);s.episodes=[...s.visited];s.solved=CHAPTERS.flatMap(c=>c.entities.filter(e=>e.type==='station').map(e=>e.id));
 s.records=CHAPTERS.flatMap(c=>c.entities.filter(e=>e.type==='record').map(e=>e.id));s.playSeconds=3650;
 s.decisions={0:0,1:0,2:0,3:0,4:0,5:0,6:0,...story.major};s.microDecisions={0:0,1:0,2:0,3:0,4:0,5:0,6:0,7:0,...story.micro};
 s.projects=[...(story.projects||[])];return s;
}
