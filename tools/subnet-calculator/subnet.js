(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BBSubnet = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function parseIPv4(ip) {
    if (typeof ip !== 'string') throw new Error('IPv4 address must be text.');
    var value = ip.trim();
    var parts = value.split('.');
    if (parts.length !== 4) throw new Error('Enter a valid IPv4 address.');
    var octets = parts.map(function (part) {
      if (!/^\d{1,3}$/.test(part)) throw new Error('Enter a valid IPv4 address.');
      if (part.length > 1 && part.charAt(0) === '0') throw new Error('IPv4 octets must not contain leading zeros.');
      var n = Number(part);
      if (!Number.isInteger(n) || n < 0 || n > 255) throw new Error('Each IPv4 octet must be between 0 and 255.');
      return n;
    });
    return octets;
  }

  function ipToUint32(ip) {
    var p = Array.isArray(ip) ? ip : parseIPv4(ip);
    return (((p[0] * 16777216) + (p[1] * 65536) + (p[2] * 256) + p[3]) >>> 0);
  }

  function uint32ToIp(n) {
    n = Number(n) >>> 0;
    return [(n >>> 24) & 255,(n >>> 16) & 255,(n >>> 8) & 255,n & 255].join('.');
  }

  function validatePrefix(prefix) {
    var n = typeof prefix === 'string' && prefix.trim() !== '' ? Number(prefix) : prefix;
    if (!Number.isInteger(n) || n < 0 || n > 32) throw new Error('CIDR prefix must be a whole number from 0 to 32.');
    return n;
  }

  function prefixToMaskUint32(prefix) {
    prefix = validatePrefix(prefix);
    if (prefix === 0) return 0;
    return (0xffffffff << (32 - prefix)) >>> 0;
  }

  function prefixToMask(prefix) { return uint32ToIp(prefixToMaskUint32(prefix)); }

  function maskToPrefix(mask) {
    var n = ipToUint32(mask);
    var binary = (n >>> 0).toString(2).padStart(32, '0');
    if (!/^1*0*$/.test(binary)) throw new Error('Subnet mask must contain contiguous 1 bits followed by 0 bits.');
    var firstZero = binary.indexOf('0');
    return firstZero === -1 ? 32 : firstZero;
  }

  function parseAddressAndPrefix(value, fallbackPrefix) {
    if (typeof value !== 'string') throw new Error('Enter an IPv4 address.');
    var input = value.trim();
    if (!input) throw new Error('Enter an IPv4 address.');
    var parts = input.split('/');
    if (parts.length > 2) throw new Error('Use CIDR notation such as 192.168.1.10/24.');
    var ip = parts[0].trim();
    parseIPv4(ip);
    var prefix = parts.length === 2 ? validatePrefix(parts[1]) : validatePrefix(fallbackPrefix);
    return { ip: ip, prefix: prefix };
  }

  function classifyIPv4(ip) {
    var p = parseIPv4(ip);
    var n = ipToUint32(p);
    function between(start, end) { return n >= ipToUint32(start) && n <= ipToUint32(end); }
    if (ip === '0.0.0.0') return 'Unspecified';
    if (ip === '255.255.255.255') return 'Limited broadcast';
    if (p[0] === 10 || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168)) return 'Private (RFC 1918)';
    if (p[0] === 127) return 'Loopback';
    if (p[0] === 169 && p[1] === 254) return 'Link-local';
    if (between('100.64.0.0', '100.127.255.255')) return 'Shared address space / CGNAT';
    if (between('192.0.2.0', '192.0.2.255') || between('198.51.100.0', '198.51.100.255') || between('203.0.113.0', '203.0.113.255')) return 'Documentation / example';
    if (p[0] >= 224 && p[0] <= 239) return 'Multicast';
    if (p[0] >= 240) return 'Reserved / experimental';
    return 'Public unicast';
  }

  function toBinary(ip) {
    return parseIPv4(ip).map(function (n) { return n.toString(2).padStart(8, '0'); }).join('.');
  }

  function calculate(ip, prefix) {
    var parsed = parseAddressAndPrefix(ip, prefix);
    var ipInt = ipToUint32(parsed.ip);
    var maskInt = prefixToMaskUint32(parsed.prefix);
    var wildcardInt = (~maskInt) >>> 0;
    var networkInt = (ipInt & maskInt) >>> 0;
    var broadcastInt = (networkInt | wildcardInt) >>> 0;
    var total = Math.pow(2, 32 - parsed.prefix);
    var firstInt, lastInt, usable, hostSemantics;

    if (parsed.prefix <= 30) {
      firstInt = (networkInt + 1) >>> 0;
      lastInt = (broadcastInt - 1) >>> 0;
      usable = total - 2;
      hostSemantics = 'Traditional subnet: network and broadcast addresses are reserved.';
    } else if (parsed.prefix === 31) {
      firstInt = networkInt;
      lastInt = broadcastInt;
      usable = 2;
      hostSemantics = 'RFC 3021 point-to-point subnet: both addresses are usable when supported.';
    } else {
      firstInt = networkInt;
      lastInt = networkInt;
      usable = 1;
      hostSemantics = 'Single-host route.';
    }

    return {
      inputAddress: parsed.ip,
      prefix: parsed.prefix,
      cidr: uint32ToIp(networkInt) + '/' + parsed.prefix,
      subnetMask: uint32ToIp(maskInt),
      wildcardMask: uint32ToIp(wildcardInt),
      networkAddress: uint32ToIp(networkInt),
      broadcastAddress: uint32ToIp(broadcastInt),
      firstUsable: uint32ToIp(firstInt),
      lastUsable: uint32ToIp(lastInt),
      totalAddresses: total,
      usableHosts: usable,
      addressType: classifyIPv4(parsed.ip),
      binaryAddress: toBinary(parsed.ip),
      binaryMask: toBinary(uint32ToIp(maskInt)),
      hostSemantics: hostSemantics
    };
  }

  return {
    parseIPv4: parseIPv4,
    ipToUint32: ipToUint32,
    uint32ToIp: uint32ToIp,
    validatePrefix: validatePrefix,
    prefixToMask: prefixToMask,
    maskToPrefix: maskToPrefix,
    parseAddressAndPrefix: parseAddressAndPrefix,
    classifyIPv4: classifyIPv4,
    toBinary: toBinary,
    calculate: calculate
  };
});
