(function(){
  'use strict';

  var $ = function(id){ return document.getElementById(id); };

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
    return '<div class="result-row"><div class="result-label">'+escapeHtml(label)+'</div><div class="result-value"><code>'+safeValue+'</code><button class="copy-btn" type="button" data-copy="'+safeCopy+'" aria-label="Copy '+escapeHtml(label)+'">Copy</button></div></div>';
  }

  function render(result){
    $('result').innerHTML =
      '<div class="result-grid">' +
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
      '<div class="binary-block"><div><span>Address (binary)</span><code>'+escapeHtml(result.binaryAddress)+'</code></div><div><span>Mask (binary)</span><code>'+escapeHtml(result.binaryMask)+'</code></div></div>' +
      '<p class="result-note">'+escapeHtml(result.hostSemantics)+'</p>';

    document.querySelectorAll('[data-copy]').forEach(function(btn){
      btn.addEventListener('click', function(){ copyText(btn.getAttribute('data-copy'), btn); });
    });
  }

  function showError(message){
    $('result').innerHTML = '<div class="error" role="alert">'+escapeHtml(message)+'</div>';
  }

  async function copyText(text, button){
    try{
      await navigator.clipboard.writeText(text);
      var old = button.textContent;
      button.textContent = 'Copied';
      setTimeout(function(){ button.textContent = old; }, 1000);
    }catch(e){
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      var old2 = button.textContent;
      button.textContent = 'Copied';
      setTimeout(function(){ button.textContent = old2; }, 1000);
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
  $('reset').addEventListener('click', function(){
    $('address').value = '';
    $('prefix').value = '24';
    $('result').innerHTML = '<div class="empty-state">Enter an IPv4 address and CIDR prefix to calculate the network.</div>';
    $('address').focus();
    try { history.replaceState(null, '', location.pathname + location.search); } catch(e) {}
  });
  $('address').addEventListener('keydown', function(e){ if(e.key === 'Enter') calculate(); });
  $('prefix').addEventListener('keydown', function(e){ if(e.key === 'Enter') calculate(); });

  if(loadHash()) calculate();
})();
