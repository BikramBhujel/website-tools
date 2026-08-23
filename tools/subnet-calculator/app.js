(function(){
  'use strict';

  var $ = function(id){ return document.getElementById(id); };
  var lastResult = null;

  function formatNumber(n){
    return Number(n).toLocaleString('en-US');
  }

  function escapeHtml(value){
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function row(label, value, copyValue){
    var safeValue = escapeHtml(value);
    var safeCopy = escapeHtml(copyValue == null ? value : copyValue);
    return '<div class="bb-subnet-result-row"><div class="bb-subnet-result-label">'+escapeHtml(label)+'</div><div class="bb-subnet-result-value"><code>'+safeValue+'</code><button class="bb-subnet-copy" type="button" data-copy="'+safeCopy+'" aria-label="Copy '+escapeHtml(label)+'">Copy</button></div></div>';
  }

  function routeItem(label, value){
    return '<div class="bb-subnet-route-item"><span>'+escapeHtml(label)+'</span><code>'+escapeHtml(value)+'</code></div>';
  }

  function summaryText(result){
    return [
      'IPv4 Subnet Summary',
      'Input: '+result.inputAddress+'/'+result.prefix,
      'CIDR network: '+result.cidr,
      'Subnet mask: '+result.subnetMask,
      'Wildcard mask: '+result.wildcardMask,
      'Network address: '+result.networkAddress,
      'Broadcast address: '+result.broadcastAddress,
      'First usable host: '+result.firstUsable,
      'Last usable host: '+result.lastUsable,
      'Total addresses: '+result.totalAddresses,
      'Usable hosts: '+result.usableHosts,
      'Address type: '+result.addressType
    ].join('\n');
  }

  function render(result){
    lastResult = result;
    $('copy-summary').hidden = false;
    $('result').innerHTML =
      '<div class="bb-subnet-route" aria-label="Address range overview">' +
        routeItem('Network', result.networkAddress) +
        routeItem('First host', result.firstUsable) +
        routeItem('Last host', result.lastUsable) +
        routeItem('Broadcast', result.broadcastAddress) +
      '</div>' +
      '<div class="bb-subnet-result-table">' +
        row('CIDR network', result.cidr) +
        row('Subnet mask', result.subnetMask) +
        row('Wildcard mask', result.wildcardMask) +
        row('Network address', result.networkAddress) +
        row('Broadcast address', result.broadcastAddress) +
        row('First usable host', result.firstUsable) +
        row('Last usable host', result.lastUsable) +
        row('Total addresses', formatNumber(result.totalAddresses), result.totalAddresses) +
        row('Usable hosts', formatNumber(result.usableHosts), result.usableHosts) +
        row('Address type', result.addressType) +
      '</div>' +
      '<div class="bb-subnet-binary"><div><span>Address in binary</span><code>'+escapeHtml(result.binaryAddress)+'</code></div><div><span>Mask in binary</span><code>'+escapeHtml(result.binaryMask)+'</code></div></div>' +
      '<p class="bb-subnet-note">'+escapeHtml(result.hostSemantics)+'</p>';

    document.querySelectorAll('#bb-subnet-tool [data-copy]').forEach(function(btn){
      btn.addEventListener('click', function(){ copyText(btn.getAttribute('data-copy'), btn); });
    });
  }

  function showError(message){
    lastResult = null;
    $('copy-summary').hidden = true;
    $('result').innerHTML = '<div class="bb-subnet-error" role="alert">'+escapeHtml(message)+'</div>';
  }

  async function copyText(text, button){
    try{
      await navigator.clipboard.writeText(text);
    }catch(e){
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    if(button){
      var old = button.textContent;
      button.textContent = 'Copied';
      setTimeout(function(){ button.textContent = old; }, 900);
    }
  }

  function calculate(){
    try{
      var value = $('address').value.trim();
      var prefix = $('prefix').value;
      var result = window.BBSubnet.calculate(value, prefix);
      $('prefix').value = result.prefix;
      render(result);
      try { history.replaceState(null, '', '#'+encodeURIComponent(result.inputAddress+'/'+result.prefix)); } catch(e) {}
    }catch(e){
      showError(e && e.message ? e.message : 'Unable to calculate this subnet.');
    }
  }

  function reset(){
    lastResult = null;
    $('address').value = '';
    $('prefix').value = '24';
    $('copy-summary').hidden = true;
    $('result').innerHTML = '<div class="bb-subnet-empty"><strong>Ready to calculate</strong><span>Enter an IPv4 address and CIDR prefix to see the network boundaries and host range.</span></div>';
    $('address').focus();
    try { history.replaceState(null, '', location.pathname + location.search); } catch(e) {}
  }

  function loadHash(){
    if(!location.hash) return false;
    try{
      var value = decodeURIComponent(location.hash.slice(1));
      if(value.indexOf('/') > -1){
        var bits = value.split('/');
        $('address').value = bits[0];
        $('prefix').value = bits[1];
        return true;
      }
    }catch(e){}
    return false;
  }

  $('calculate').addEventListener('click', calculate);
  $('sample').addEventListener('click', function(){
    $('address').value = '172.17.174.1';
    $('prefix').value = '23';
    calculate();
  });
  $('reset').addEventListener('click', reset);
  $('copy-summary').addEventListener('click', function(){
    if(lastResult) copyText(summaryText(lastResult), $('copy-summary'));
  });

  document.querySelectorAll('#bb-subnet-tool [data-prefix]').forEach(function(btn){
    btn.addEventListener('click', function(){
      $('prefix').value = btn.getAttribute('data-prefix');
      if($('address').value.trim()) calculate();
      else $('address').focus();
    });
  });

  $('address').addEventListener('input', function(){
    var m = $('address').value.trim().match(/\/(\d{1,2})$/);
    if(m){
      var n = Number(m[1]);
      if(n >= 0 && n <= 32) $('prefix').value = String(n);
    }
  });
  $('address').addEventListener('keydown', function(e){ if(e.key === 'Enter') calculate(); });
  $('prefix').addEventListener('keydown', function(e){ if(e.key === 'Enter') calculate(); });

  if(loadHash()) calculate();
})();
