export function selectFrontierEnding(state){const f=state.frontier,v=state.village;if(f.ending)return f.ending;
 if(f.receipts.length===3&&f.evidence==='publish'&&f.donated>=60)return'lighthouse';
 if(v.growth>=3&&f.donated>=60&&f.deliveries>=2&&v.vehicle==='car')return'homeward';
 if(f.romance&&f.trust>=4&&f.events.includes('stranger-helped'))return'two-tickets';
 if(f.evidence==='sell')return'paper-king';
 if(f.concerts>=3&&f.trust>=2)return'night-radio';
 if(f.released>=3&&f.photos.length>=3)return'river-keeper';
 if(f.job&&f.job.destination==='clinic'&&f.events.includes('ghost-heard'))return'last-delivery';
 if(f.drinks>=3&&f.company>=1&&f.restCount>=2)return'borrowed-dawn';
 if(f.receipts.length===3&&f.evidence==='keep')return'unbought';
 if(f.rangeScore>=80&&f.events.includes('stranger-helped'))return'the-witness';
 if(f.visits.length>=9&&f.distance>=100)return'open-road';
 return'small-hours';
}
export function finishFrontier(state){const f=state.frontier;f.ending=selectFrontierEnding(state);if(!f.endingHistory.includes(f.ending))f.endingHistory.push(f.ending);return f.ending;}
