var enabled = false;

var enable_proxy = false;

bili_cdn = '36.250.74.110';

var speed_test_result = [];
var speed_test_completed = true;
var best_url = '';
var url_list = [];
var current_tab_id = -1;
var current_testing_id = -1;
var last_redirect_time = 0;

var inject_html = "<div style='position:fixed;right:0px;bottom:0px;background-color:blue;color:white;z-index:9999999;' id='bilibili_accelerator_box'>Bilibili Accelerator初始化中</div>";
var inject_html_reloaded = "<div style='position:fixed;right:0px;bottom:0px;background-color:blue;color:white;z-index:9999999;' id='bilibili_accelerator_box'>Bilibili Accelerator运行中</div>";
var inject_script_function = "\
function appendHtml(el, str) {\
  var div = document.createElement('div');\
  div.innerHTML = str;\
  while (div.children.length > 0) {\
    el.appendChild(div.children[0]);\
  }\
}\
";

var load_enabled_info = function() {
  chrome.storage.local.get(function(data){
    if (data.enabled === true) {
      enabled = true;
    } else {
      enabled = false;
    }
  });
}

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
      chrome.tabs.executeScript(current_tab_id, {code: "document.getElementById('bilibili_accelerator_box').innerHTML += '<br/>重定向到" + bili_cdn + "';"}, function(response) {
        
      });
    }
  }
  return {responseHeaders: headers};
}

var all_test_completed = false;
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

  if (all_test_completed && best_url != '') {
    last_redirect_time = 0;
    all_test_completed = false;

    chrome.tabs.executeScript(current_tab_id, {code: inject_script_function + "appendHtml(document.body,\"" + inject_html_reloaded + "\");"}, function(response) {
      
    });
    apply_proxy_setting(function() {
      setTimeout(function(){
        clear_proxy();
      }, 10000);
    });
    return;
  }
  
  current_tab_id = details.tabId;
  console.log('current tabid=' + current_tab_id);

  chrome.tabs.executeScript(current_tab_id, {code: inject_script_function + "appendHtml(document.body,\"" + inject_html + "\");"}, function(response) {
      
  }); 

  console.log('Fetching URL list');
  speed_test_result = [];
  speed_test_completed = false;
  best_url_found = false;
  url_list = [];
  best_url = '';
  url_regex = /<url><\!\[CDATA\[(.+?)\]\]><\/url>/g;
  var xhr = new XMLHttpRequest();
  xhr.open("GET", details.url, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      while (url_match_result = url_regex.exec(xhr.responseText)) {
        url = url_match_result[1];
        url_list.push(url);
      }
      apply_proxy_setting(function(){
        console.log('Total url count = ' + url_list.length);
        init_speed_test(0);
      });
    }
  }
  xhr.send();
}

var init_speed_test = function(url_index) {
  var url = url_list[url_index];
  chrome.tabs.executeScript(current_tab_id, {code: "document.getElementById('bilibili_accelerator_box').innerHTML += '<br/>测速中..." + (url_index+1) + "/" + url_list.length + "';"}, function(response) {
        
  });
  current_testing_id = parseInt(Math.random()*10000000);
  test_video_speed(url, current_testing_id, function(time_count, current_url){
    if (time_count !== 99999999)
      speed = parseInt(1024 / parseFloat(time_count/1000)) + 'KB/S';
    else
      speed = '超时';
    chrome.tabs.executeScript(current_tab_id, {code: "document.getElementById('bilibili_accelerator_box').innerHTML += '<br/>速度 " + speed + "';"}, function(response) {
        
    });
    speed_test_result.push(time_count);
    if (Math.min.apply(Math, speed_test_result) === time_count) {
      best_url = current_url;
    }
    console.log('speed_test_result.length = ' + speed_test_result.length);
    if (speed_test_result.length === url_list.length) {
      //All speed tests done
      chrome.tabs.executeScript(current_tab_id, {code: "document.getElementById('bilibili_accelerator_box').innerHTML += '<br/>测速完成';"}, function(response) {
        
      });
      console.log('Test completed.');
      speed_test_completed = true;
      console.log('Reloading tab');
      clear_proxy(function() {
        chrome.tabs.reload(current_tab_id);
        all_test_completed = true;
      });
    }
    if (url_index < url_list.length - 1) {
      init_speed_test(url_index + 1);
    }
  });
}

var on_before_request_listener = function(details) {
  if (!enabled) {
    return;
  }
  //if (current_tab_id === -1) {
  //  return;
  //}
  if (bili_cdn.trim() !== '') {
    if (details.url.includes('http://ws.acgvideo.com') || details.url.includes(bili_cdn)) {
      return;
    }
  }
  if (details.type === 'xmlhttprequest') {
    return;
  }
  if (details.url.includes('crossdomain.xml')) {
    return;
  }
  console.log('New video connection. type=' + details.type + '; url=' + details.url);
  if (!speed_test_completed) {
    console.log('Speed test not finished. Cancelling.')
    return {cancel: true};
  }
  if (details.timeStamp - last_redirect_time < 3*1000) {
    console.log('In-browser redirection detected. Ignoring.')
    return;
  } else {
    last_redirect_time = details.timeStamp;
  }
  console.log('Selecting fastest url: ' + best_url);
  var best_host = /http:\/\/(.+?)\/.*?/.exec(best_url)[1];
  if (url_list.length === 0) {
    return;
  }
  var file_name = /\/([^\/]+?\.(flv|mp4))/.exec(details.url)[1];
  console.log('filename = ' + file_name);
  var new_url = url_list[0];
  for (index in url_list) {
    if (url_list[index].includes(file_name)) {
      new_url = url_list[index];
    }
  }
  for (index in url_list) {
    if (url_list[index].includes('http://' + best_host) && url_list[index].includes(file_name)) {
      console.log('Best matched url found.');
      new_url = url_list[index];
    }
  }
  console.log('Redirecting to: ' + new_url);
  try {
    if (current_tab_id !== -1)
      chrome.tabs.executeScript(current_tab_id, {code: "document.getElementById('bilibili_accelerator_box').innerHTML += '<br/>选择最优线路...';"}, function(response) {

      });
  } catch (err) {

  }
  if (best_url != '') {
    return {redirectUrl: new_url};
  }
}

var start_intercept = function() {
  enabled = true;
  chrome.storage.local.set({'enabled':true}, function(){
    
  });
}

var stop_intercept = function() {
  enabled = false;
  chrome.storage.local.set({'enabled':false}, function(){
    
  });
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

var get_proxy_setting = function(callback) {
  chrome.storage.local.get(function(data){
    if (!data.proxy_enabled) {
      enable_proxy = false;
    } else {
      enable_proxy = data.proxy_enabled;
    }
    console.log('enable_proxy = ' + enable_proxy);
    callback();
  }); 
}

var save_proxy_setting = function(proxy_setting) {
  chrome.storage.local.set({'proxy_enabled': proxy_setting}, function(){
    get_proxy_setting(function(){});
  });
}

var apply_proxy_setting = function(callback) {
  if (!enable_proxy) {
    callback();
    return;
  }
  var config = {
    mode: "fixed_servers",
    rules: {
      singleProxy: {
        scheme: "socks5",
        host: "127.0.0.1",
        port: 1080
      }
    }
  };
  chrome.proxy.settings.set({value: config, scope: 'regular'}, function() {
    console.log('Proxy set.');
    chrome.tabs.executeScript(current_tab_id, {code: "document.getElementById('bilibili_accelerator_box').innerHTML += '<br/>开启socks代理';"}, function(response) {
        
    });
    callback();
  });
}

var clear_proxy = function(callback) {
  if (!enable_proxy) {
    if (callback) {
      callback();
    }
    return;
  }
  chrome.proxy.settings.clear({scope: 'regular'}, function() {
    console.log('Proxy cleared.');
    if (current_tab_id !== -1) {
      chrome.tabs.executeScript(current_tab_id, {code: "document.getElementById('bilibili_accelerator_box').innerHTML += '<br/>关闭socks代理';"}, function(response) {
          
      });
    }
    if (callback) {
      callback();
    }
  });
}

var init_all = function() {

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

  get_proxy_setting(load_enabled_info);

  chrome.proxy.settings.clear({scope: 'regular'}, function() {

  });

  chrome.tabs.onRemoved.addListener(handle_abort);

  chrome.tabs.onUpdated.addListener(handle_abort);

  console.log('Loaded.');

}

setTimeout(init_all, 50);

function test_video_speed(url, testing_id, callback) {
  console.log('Begin speedtest for ' + url);
  var time_count = 0;
  var time_init = Date.now();
  var time_count_interval = setInterval(function(){
    time_count = Date.now() - time_init;
    if (time_count > 15*1000) {
      if (current_tab_id === -1 || testing_id !== current_testing_id) {
        clearInterval(time_count_interval);
        return;
      }
      console.log('url=' + url + '; download timeout;');
      callback(99999999, url);
      xhr.abort();
      clearInterval(time_count_interval);
    }
  }, 1);
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url + (url.includes('?')?'&rand=':'?rand=') + getRandomInt(100000,999999), true);
  xhr.timeout = 15*1000;
  xhr.onreadystatechange = function() {
    if (current_tab_id === -1 || testing_id !== current_testing_id) {
      xhr.abort();
      clearInterval(time_count_interval);
      return;
    }
    if (xhr.response.length >= 1024*1024) {
      xhr.abort();
      console.log('url=' + url + '; time_count=' + time_count);
      callback(time_count, url);
      clearInterval(time_count_interval);
    }
  }
  xhr.ontimeout = function() {
    if (current_tab_id === -1 || testing_id !== current_testing_id) {
      clearInterval(time_count_interval);
      return;
    }
    console.log('url=' + url + '; connection timeout;');
    callback(99999999, url);
    clearInterval(time_count_interval);
  }
  xhr.send();
}

var handle_abort = function(tab_id, remove_info) {
  if (tab_id !== current_tab_id) {
    return;
  }
  if (all_test_completed) {
    return;
  }
  try {
    chrome.tabs.executeScript(current_tab_id, {code: "if(document.getElementById('bilibili_accelerator_box').innerHTML.indexOf('运行中')===-1) document.getElementById('bilibili_accelerator_box').innerHTML += '<br/>意外终止，请刷新页面';"}, function(response) {
          
    });
  } catch (err) {
    console.log('Tab id invalid');
  }
  current_tab_id = -1;
  console.log('Abort.');
  last_best_url_found = 0;
  speed_test_completed = true;
  clear_proxy();
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
