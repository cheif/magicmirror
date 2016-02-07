// Utilities
function zeroPad(n) {
  return (n < 10) ? '0' + n : n;
}

function queryStringToObjectDecodeJSON(queryString) {
  return queryString.replace('?', '').split('&').reduce(function(params, pair) {
    var splits = pair.split('=');
    var val = decodeURIComponent(splits[1]);
    try {
      val = JSON.parse(atob(val));
    } catch(e) {
      // Probably a normal string
    }
    params[splits[0]] = val;
    return params;
  }, {});
}

function objectToQueryStringEncodeJSON(obj) {
  window.obj = obj;
  return '?' + Object.keys(obj).map(function(k) {
    var val = obj[k];
    if (val instanceof Object) {
      val = btoa(JSON.stringify(val));
    }
    return k + '=' + encodeURIComponent(val);
  }).join('&');
}
