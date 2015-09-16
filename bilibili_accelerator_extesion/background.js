var enabled = false;

bili_cdn = '36.250.74.110';

var on_headers_received_listener = function(details) {
  if (!enabled) {
    return;
  }
  get_bili_cdn();
  var headers = details.responseHeaders;
  for (var i=0;i<headers.length;i++) {
    if (headers[i].name === 'Location') {
      var re = /^http:\/\/(.+?)\/(.+)$/g
      var match_array = re.exec(headers[i].value);
      var new_url = 'http://' + bili_cdn + '/' + match_array[2];
      console.log('Redirecting to ' + new_url);
      headers[i].value =  new_url;
    }
  }
  return {responseHeaders: headers};
}

var start_intercept = function() {
  enabled = true;

}

var stop_intercept = function() {
  enabled = false;
}

var get_bili_cdn = function() {
  chrome.storage.local.get(function(data){
    if (!data.bili_cdn) {
      return;
    }
    if (data.bili_cdn.trim() === '') {
      return;
    }
    bili_cdn = data.bili_cdn;
  });
}

var save_bili_cdn = function(new_cdn) {
  chrome.storage.local.set({'bili_cdn':new_cdn}, function(){
    get_bili_cdn();
  });
}

chrome.webRequest.onHeadersReceived.addListener(on_headers_received_listener, 
  {urls: ["http://ws.acgvideo.com/*", "http://cc.acgvideo.com/*"]},
  ["blocking", "responseHeaders"]);

get_bili_cdn();
