const assert = require('assert');
const p = require('../poe.js');

assert.strictEqual(p.getStandard('af').pseMax, 15.4);
assert.strictEqual(p.getStandard('at').pdMax, 25.5);
assert.strictEqual(p.getStandard('bt3').pseMax, 60);
assert.strictEqual(p.getStandard('bt4').pdMax, 71.3);

let r = p.calculate({switchBudget:370,poePorts:24,reservePct:20,portStandard:'at',groups:[{name:'Wireless APs',quantity:6,watts:22},{name:'IP cameras',quantity:8,watts:10},{name:'VoIP phones',quantity:4,watts:7}]});
assert.strictEqual(r.totalDevices, 18);
assert.strictEqual(r.plannedLoad, 240);
assert.strictEqual(r.usableBudget, 296);
assert.strictEqual(r.remainingBudget, 56);
assert.strictEqual(r.remainingPorts, 6);
assert.strictEqual(r.status, 'healthy');
assert.strictEqual(r.capabilityViolations.length, 0);

r = p.calculate({switchBudget:100,poePorts:8,reservePct:20,portStandard:'at',groups:[{name:'APs',quantity:4,watts:25}]});
assert.strictEqual(r.status, 'over');
assert.ok(r.reasons.some(x => x.includes('power')));

r = p.calculate({switchBudget:500,poePorts:4,reservePct:0,portStandard:'at',groups:[{name:'Cameras',quantity:5,watts:8}]});
assert.strictEqual(r.status, 'over');
assert.ok(r.reasons.some(x => x.includes('ports')));

r = p.calculate({switchBudget:500,poePorts:24,reservePct:0,portStandard:'af',groups:[{name:'AP',quantity:1,watts:22}]});
assert.strictEqual(r.status, 'over');
assert.strictEqual(r.capabilityViolations.length, 1);

r = p.calculate({switchBudget:300,poePorts:24,reservePct:0,portStandard:'at',groups:[{name:'AP',quantity:11,watts:24}]});
assert.strictEqual(r.status, 'near');

assert.throws(() => p.calculate({switchBudget:0,poePorts:8,reservePct:20,portStandard:'at',groups:[{quantity:1,watts:5}]}));
assert.throws(() => p.calculate({switchBudget:100,poePorts:0,reservePct:20,portStandard:'at',groups:[{quantity:1,watts:5}]}));
assert.throws(() => p.calculate({switchBudget:100,poePorts:8,reservePct:100,portStandard:'at',groups:[{quantity:1,watts:5}]}));

console.log('All PoE calculator tests passed.');
