var bg_page = chrome.extension.getBackgroundPage();

function trigger() {
  if (!bg_page.enabled) {
    bg_page.start_intercept();
    document.getElementById('main_btn').innerHTML="关闭";

  } else {
    bg_page.stop_intercept();
    document.getElementById('main_btn').innerHTML="启用";
  }
}

function go_to_web() {
  chrome.tabs.create({url: 'http://www.bilibili.com'});
}

function trigger_proxy_setting() {
  if (document.getElementById('enable_proxy_check').checked==true) {
    bg_page.save_proxy_setting(true);
  } else {
    bg_page.save_proxy_setting(false);
  }
}

document.getElementById('main_btn').addEventListener('click', trigger);

document.getElementById('bili_cdn_change').addEventListener('click', function(){
  bg_page.save_bili_cdn(document.getElementById('bili_cdn_input').value);
});

document.getElementById('web_link').addEventListener('click', go_to_web);

document.getElementById('enable_proxy_check').addEventListener('click', trigger_proxy_setting);


document.addEventListener('DOMContentLoaded', function() {
  if (bg_page.enabled) {
    document.getElementById('main_btn').innerHTML="关闭";
  } else {
    document.getElementById('main_btn').innerHTML="启用";
  }
  if (bg_page.enable_proxy) {
    document.getElementById('enable_proxy_check').checked=true;
  } else {
    document.getElementById('enable_proxy_check').checked=false;
  }
  document.getElementById('bili_cdn_input').value = bg_page.bili_cdn;
});

