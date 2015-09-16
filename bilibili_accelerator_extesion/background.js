var enabled = false;

bili_cdn = '36.250.74.110';

var speed_test_result = [];
var speed_test_completed = true;
var best_url = '';

var on_headers_received_listener = function(details) {
  if (!enabled) {
    return;
  }
  get_bili_cdn();
  if (bili_cdn.trim() === '') {
    return;
  }
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

var video_url_listener = function(details) {
  if (!enabled) {
    return;
  }
  if (!details.url.includes('http://interface.bilibili.com/playurl')) {
    return;
  }
  if (!speed_test_completed) {
    return;
  }
  console.log('Fetching URL list');
  speed_test_result = [];
  speed_test_completed = false;
  url_regex = /<url><\!\[CDATA\[(.+?)\]\]><\/url>/g;
  var url_count = 0;
  var xhr = new XMLHttpRequest();
  xhr.open("GET", details.url, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      while (url_match_result = url_regex.exec(xhr.responseText)) {
        url = url_match_result[1];
        url_count++;
        test_video_speed(url, function(time_count, current_url){
          speed_test_result.push(time_count);
          if (Math.min.apply(Math, speed_test_result) == time_count) {
            best_url = current_url;
          }
          console.log('speed_test_result.length = ' + speed_test_result.length);
          if (speed_test_result.length==url_count) {
            console.log('Test completed.');
            speed_test_completed = true;
          }
        });
      }
      console.log('Total url count = ' + url_count);
    }
  }
  xhr.send();
}

var last_time_stamp = 0;
var on_before_request_listener = function(details) {
  if (!enabled) {
    return;
  }
  if (bili_cdn.trim() != '') {
    if (details.url.includes('http://ws.acgvideo.com') || details.url.includes(bili_cdn)) {
      return;
    }
  }
  if (details.type == 'xmlhttprequest') {
    return;
  }
  console.log('New video connection. type=' + details.type);
  if (!speed_test_completed) {
    console.log('Speed test not finished. Cancelling.')
    return {cancel: true};
  }
  if (details.timeStamp - last_time_stamp < 3*1000) {
    console.log('In-browser redirection detected. Ignoring.')
    return;
  } else {
    last_time_stamp = details.timeStamp;
  }
  console.log('Selecting fastest url: ' + best_url);
  return {redirectUrl: best_url};

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
      bili_cdn = '';
      return;
    }
   /* if (data.bili_cdn.trim() === '') {
      return;
    }*/
    bili_cdn = data.bili_cdn;
  });
}

var save_bili_cdn = function(new_cdn) {
  chrome.storage.local.set({'bili_cdn':new_cdn}, function(){
    get_bili_cdn();
  });
}

chrome.webRequest.onBeforeRequest.addListener(on_before_request_listener, 
  {urls: ["http://*.acgvideo.com/*"]},
  ["blocking"]);

chrome.webRequest.onHeadersReceived.addListener(on_headers_received_listener, 
  {urls: ["http://ws.acgvideo.com/*"]},
  ["blocking", "responseHeaders"]);

chrome.webRequest.onBeforeRequest.addListener(video_url_listener,
  {urls: ["http://interface.bilibili.com/*"]},
  ["blocking"]);

get_bili_cdn();


function test_video_speed(url, callback) {
  console.log('Begin speedtest for ' + url);
  var time_count = 0;
  var time_count_interval = setInterval(function(){
    time_count++;
    if (time_count > 3*1000) {
      console.log('url=' + url + '; timeout;');
      callback(99999999, url);
      xhr.abort();
      clearInterval(time_count_interval);
    }
  }, 1);
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url + '&rand=' + getRandomInt(10000000,99999999) , true);
  xhr.timeout = 3*1000;
  xhr.onreadystatechange = function() {
    if (xhr.response.length >= 1024*1024) {
      xhr.abort();
      console.log('url=' + url + '; time_count=' + time_count);
      callback(time_count, url);
      clearInterval(time_count_interval);
    }
  }
  xhr.ontimeout = function() {
    console.log('url=' + url + '; timeout;');
    callback(99999999, url);
    clearInterval(time_count_interval);
  }
  xhr.send();
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
