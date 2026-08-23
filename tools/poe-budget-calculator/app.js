(function () {
  'use strict';

  var root = document.getElementById('bb-poe-calculator');
  if (!root || !window.BBPoE) return;

  var $ = function (id) { return root.querySelector('#' + id); };
  var groupsEl = $('bb-poe-groups');
  var resultEl = $('bb-poe-result');
  var nextId = 1;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmt(n, digits) {
    return Number(n).toLocaleString('en-US', {
      minimumFractionDigits: digits || 0,
      maximumFractionDigits: digits == null ? 1 : digits
    });
  }

  function addGroup(data) {
    data = data || {};
    var id = nextId++;
    var row = document.createElement('div');
    row.className = 'bb-poe-device-row';
    row.setAttribute('data-row-id', String(id));
    row.innerHTML =
      '<div class="bb-poe-field bb-poe-name-field"><label>Device group</label><input class="bb-poe-name" type="text" autocomplete="off" placeholder="Access points" value="' + escapeHtml(data.name || '') + '"></div>' +
      '<div class="bb-poe-field"><label>Qty</label><input class="bb-poe-qty" type="number" min="0" step="1" value="' + escapeHtml(data.quantity == null ? 1 : data.quantity) + '"></div>' +
      '<div class="bb-poe-field"><label>W / device</label><input class="bb-poe-watts" type="number" min="0" step="0.1" value="' + escapeHtml(data.watts == null ? 15.4 : data.watts) + '"></div>' +
      '<div class="bb-poe-row-total"><span>Group load</span><strong class="bb-poe-row-watts">0 W</strong></div>' +
      '<button class="bb-poe-remove" type="button" aria-label="Remove device group">Remove</button>';
    groupsEl.appendChild(row);

    row.querySelectorAll('input').forEach(function (input) {
      input.addEventListener('input', function () { updateRow(row); calculate(false); });
    });
    row.querySelector('.bb-poe-remove').addEventListener('click', function () {
      row.remove();
      if (!groupsEl.children.length) addGroup({ name: 'Powered device', quantity: 1, watts: 15.4 });
      calculate(false);
    });
    updateRow(row);
  }

  function updateRow(row) {
    var qty = Number(row.querySelector('.bb-poe-qty').value || 0);
    var watts = Number(row.querySelector('.bb-poe-watts').value || 0);
    var total = Number.isFinite(qty * watts) ? qty * watts : 0;
    row.querySelector('.bb-poe-row-watts').textContent = fmt(total, 1) + ' W';
  }

  function collectGroups() {
    return Array.prototype.map.call(groupsEl.querySelectorAll('.bb-poe-device-row'), function (row) {
      return {
        name: row.querySelector('.bb-poe-name').value,
        quantity: row.querySelector('.bb-poe-qty').value,
        watts: row.querySelector('.bb-poe-watts').value
      };
    });
  }

  function statusCopy(result) {
    if (result.status === 'over') {
      return { title: 'Design needs attention', text: result.reasons.join('; ') + '.', cls: 'is-over' };
    }
    if (result.status === 'near') {
      return { title: 'Within limits, but close', text: 'The design fits, but power or port utilization is above the preferred planning threshold.', cls: 'is-near' };
    }
    return { title: 'Capacity available', text: 'The current device plan fits within both the usable power budget and the available PoE ports.', cls: 'is-healthy' };
  }

  function metric(label, value, note) {
    return '<div class="bb-poe-metric"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong>' +
      (note ? '<small>' + escapeHtml(note) + '</small>' : '') + '</div>';
  }

  function render(result) {
    var status = statusCopy(result);
    var budgetPct = Math.max(0, Math.min(result.budgetUtilization, 100));
    var portPct = Math.max(0, Math.min(result.portUtilization, 100));

    var violations = result.capabilityViolations.length
      ? '<div class="bb-poe-warning"><strong>Per-port capability check</strong><p>' +
        result.capabilityViolations.map(function (g) {
          return escapeHtml(g.name) + ' requires ' + fmt(g.watts, 1) + ' W/device, above ' + fmt(result.portStandard.pseMax, 1) + ' W for ' + escapeHtml(result.portStandard.label) + '.';
        }).join('<br>') + '</p></div>'
      : '';

    resultEl.innerHTML =
      '<div class="bb-poe-status ' + status.cls + '"><strong>' + escapeHtml(status.title) + '</strong><span>' + escapeHtml(status.text) + '</span></div>' +
      '<div class="bb-poe-metrics">' +
        metric('Usable budget', fmt(result.usableBudget, 1) + ' W', fmt(result.reservePct, 0) + '% design reserve applied') +
        metric('Planned load', fmt(result.plannedLoad, 1) + ' W', fmt(result.budgetUtilization, 1) + '% of usable budget') +
        metric('Remaining', fmt(result.remainingBudget, 1) + ' W', result.remainingBudget >= 0 ? 'after reserve' : 'budget deficit') +
        metric('PoE ports', result.totalDevices + ' / ' + result.poePorts, result.remainingPorts >= 0 ? result.remainingPorts + ' ports free' : Math.abs(result.remainingPorts) + ' ports over') +
      '</div>' +
      '<div class="bb-poe-meter-block"><div class="bb-poe-meter-head"><span>Power utilization</span><strong>' + fmt(result.budgetUtilization, 1) + '%</strong></div><div class="bb-poe-meter"><i style="width:' + budgetPct + '%"></i></div></div>' +
      '<div class="bb-poe-meter-block"><div class="bb-poe-meter-head"><span>Port utilization</span><strong>' + fmt(result.portUtilization, 1) + '%</strong></div><div class="bb-poe-meter"><i style="width:' + portPct + '%"></i></div></div>' +
      '<dl class="bb-poe-facts">' +
        '<div><dt>Selected port capability</dt><dd>' + escapeHtml(result.portStandard.label) + '</dd></div>' +
        '<div><dt>Maximum PSE power / port</dt><dd>' + fmt(result.portStandard.pseMax, 1) + ' W</dd></div>' +
        '<div><dt>Maximum standard PD power</dt><dd>' + fmt(result.portStandard.pdMax, 2) + ' W</dd></div>' +
        '<div><dt>Pairs used by standard</dt><dd>' + result.portStandard.pairs + '</dd></div>' +
      '</dl>' + violations;
  }

  function calculate(showErrors) {
    try {
      var result = window.BBPoE.calculate({
        switchBudget: $('bb-poe-budget').value,
        poePorts: $('bb-poe-ports').value,
        reservePct: $('bb-poe-reserve').value,
        portStandard: $('bb-poe-standard').value,
        groups: collectGroups()
      });
      render(result);
    } catch (e) {
      if (showErrors !== false) {
        resultEl.innerHTML = '<div class="bb-poe-error" role="alert">' + escapeHtml(e && e.message ? e.message : 'Unable to calculate this PoE plan.') + '</div>';
      }
    }
  }

  function loadExample() {
    $('bb-poe-budget').value = '370';
    $('bb-poe-ports').value = '24';
    $('bb-poe-reserve').value = '20';
    $('bb-poe-standard').value = 'at';
    groupsEl.innerHTML = '';
    addGroup({ name: 'Wireless APs', quantity: 6, watts: 22 });
    addGroup({ name: 'IP cameras', quantity: 8, watts: 10 });
    addGroup({ name: 'VoIP phones', quantity: 4, watts: 7 });
    calculate(true);
  }

  function reset() {
    $('bb-poe-budget').value = '370';
    $('bb-poe-ports').value = '24';
    $('bb-poe-reserve').value = '20';
    $('bb-poe-standard').value = 'at';
    groupsEl.innerHTML = '';
    addGroup({ name: 'Powered devices', quantity: 1, watts: 15.4 });
    calculate(true);
  }

  $('bb-poe-add').addEventListener('click', function () { addGroup({ name: '', quantity: 1, watts: 15.4 }); calculate(false); });
  $('bb-poe-calculate').addEventListener('click', function () { calculate(true); });
  $('bb-poe-example').addEventListener('click', loadExample);
  $('bb-poe-reset').addEventListener('click', reset);
  ['bb-poe-budget','bb-poe-ports','bb-poe-reserve','bb-poe-standard'].forEach(function (id) {
    $(id).addEventListener('input', function () { calculate(false); });
    $(id).addEventListener('change', function () { calculate(false); });
  });

  loadExample();
})();
