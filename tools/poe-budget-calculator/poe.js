(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BBPoE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var STANDARDS = {
    af:  { label: 'IEEE 802.3af (PoE)', pseMax: 15.4, pdMax: 12.95, pairs: 2 },
    at:  { label: 'IEEE 802.3at (PoE+)', pseMax: 30,   pdMax: 25.5,  pairs: 2 },
    bt3: { label: 'IEEE 802.3bt Type 3',  pseMax: 60,   pdMax: 51,    pairs: 4 },
    bt4: { label: 'IEEE 802.3bt Type 4',  pseMax: 90,   pdMax: 71.3,  pairs: 4 }
  };

  function asFiniteNumber(value, label) {
    var n = Number(value);
    if (!Number.isFinite(n)) throw new Error(label + ' must be a valid number.');
    return n;
  }

  function normalizePositive(value, label) {
    var n = asFiniteNumber(value, label);
    if (n <= 0) throw new Error(label + ' must be greater than 0.');
    return n;
  }

  function normalizeNonNegative(value, label) {
    var n = asFiniteNumber(value, label);
    if (n < 0) throw new Error(label + ' cannot be negative.');
    return n;
  }

  function normalizeInteger(value, label) {
    var n = asFiniteNumber(value, label);
    if (!Number.isInteger(n) || n < 0) throw new Error(label + ' must be a whole number of 0 or more.');
    return n;
  }

  function normalizeReserve(value) {
    var n = normalizeNonNegative(value, 'Design reserve');
    if (n >= 100) throw new Error('Design reserve must be less than 100%.');
    return n;
  }

  function getStandard(key) {
    if (!STANDARDS[key]) throw new Error('Choose a supported PoE port capability.');
    return STANDARDS[key];
  }

  function normalizeGroups(groups) {
    if (!Array.isArray(groups) || groups.length === 0) throw new Error('Add at least one powered-device group.');
    return groups.map(function (group, index) {
      var prefix = 'Device group ' + (index + 1);
      var name = String(group && group.name != null ? group.name : '').trim() || ('Group ' + (index + 1));
      var quantity = normalizeInteger(group && group.quantity, prefix + ' quantity');
      var watts = normalizeNonNegative(group && group.watts, prefix + ' watts per device');
      return {
        name: name,
        quantity: quantity,
        watts: watts,
        totalWatts: quantity * watts
      };
    });
  }

  function calculate(input) {
    input = input || {};
    var switchBudget = normalizePositive(input.switchBudget, 'Switch PoE budget');
    var poePorts = normalizeInteger(input.poePorts, 'PoE port count');
    if (poePorts <= 0) throw new Error('PoE port count must be at least 1.');
    var reservePct = normalizeReserve(input.reservePct == null ? 20 : input.reservePct);
    var standard = getStandard(input.portStandard || 'at');
    var groups = normalizeGroups(input.groups);

    var totalDevices = groups.reduce(function (sum, g) { return sum + g.quantity; }, 0);
    var plannedLoad = groups.reduce(function (sum, g) { return sum + g.totalWatts; }, 0);
    var usableBudget = switchBudget * (1 - reservePct / 100);
    var remainingBudget = usableBudget - plannedLoad;
    var budgetUtilization = usableBudget > 0 ? (plannedLoad / usableBudget) * 100 : 0;
    var rawBudgetUtilization = (plannedLoad / switchBudget) * 100;
    var remainingPorts = poePorts - totalDevices;
    var portUtilization = (totalDevices / poePorts) * 100;

    var capabilityViolations = groups.filter(function (g) {
      return g.quantity > 0 && g.watts > standard.pseMax;
    });

    var reasons = [];
    if (plannedLoad > usableBudget) reasons.push('planned power exceeds the usable switch budget');
    if (totalDevices > poePorts) reasons.push('planned devices exceed the available PoE ports');
    if (capabilityViolations.length) reasons.push('one or more devices exceed the selected per-port capability');

    var status;
    if (reasons.length) status = 'over';
    else if (budgetUtilization >= 85 || portUtilization >= 85) status = 'near';
    else status = 'healthy';

    return {
      switchBudget: switchBudget,
      reservePct: reservePct,
      usableBudget: usableBudget,
      plannedLoad: plannedLoad,
      remainingBudget: remainingBudget,
      budgetUtilization: budgetUtilization,
      rawBudgetUtilization: rawBudgetUtilization,
      poePorts: poePorts,
      totalDevices: totalDevices,
      remainingPorts: remainingPorts,
      portUtilization: portUtilization,
      portStandardKey: input.portStandard || 'at',
      portStandard: standard,
      groups: groups,
      capabilityViolations: capabilityViolations,
      status: status,
      reasons: reasons
    };
  }

  return { STANDARDS: STANDARDS, getStandard: getStandard, calculate: calculate };
});
