const assert = require('assert');
const s = require('../subnet.js');

assert.deepStrictEqual(s.parseIPv4('192.168.1.10'), [192,168,1,10]);
assert.throws(() => s.parseIPv4('192.168.001.10'));
assert.strictEqual(s.prefixToMask(24), '255.255.255.0');
assert.strictEqual(s.prefixToMask(0), '0.0.0.0');
assert.strictEqual(s.maskToPrefix('255.255.254.0'), 23);
assert.throws(() => s.maskToPrefix('255.0.255.0'));

let r=s.calculate('192.168.1.10',24);
assert.strictEqual(r.networkAddress,'192.168.1.0');
assert.strictEqual(r.broadcastAddress,'192.168.1.255');
assert.strictEqual(r.firstUsable,'192.168.1.1');
assert.strictEqual(r.lastUsable,'192.168.1.254');
assert.strictEqual(r.usableHosts,254);
assert.strictEqual(r.addressType,'Private (RFC 1918)');

r=s.calculate('172.17.174.1/23',24);
assert.strictEqual(r.prefix,23);
assert.strictEqual(r.networkAddress,'172.17.174.0');
assert.strictEqual(r.broadcastAddress,'172.17.175.255');
assert.strictEqual(r.usableHosts,510);

r=s.calculate('10.0.0.0',31);
assert.strictEqual(r.firstUsable,'10.0.0.0');
assert.strictEqual(r.lastUsable,'10.0.0.1');
assert.strictEqual(r.usableHosts,2);

r=s.calculate('203.0.113.5',32);
assert.strictEqual(r.networkAddress,'203.0.113.5');
assert.strictEqual(r.broadcastAddress,'203.0.113.5');
assert.strictEqual(r.usableHosts,1);
assert.strictEqual(r.addressType,'Documentation / example');

r=s.calculate('8.8.8.8',0);
assert.strictEqual(r.networkAddress,'0.0.0.0');
assert.strictEqual(r.broadcastAddress,'255.255.255.255');
assert.strictEqual(r.totalAddresses,4294967296);

console.log('All subnet calculator tests passed.');
