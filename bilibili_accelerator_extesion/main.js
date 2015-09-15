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

document.getElementById('main_btn').addEventListener('click', trigger);

document.getElementById('bili_cdn_change').addEventListener('click', function(){
  bg_page.save_bili_cdn(document.getElementById('bili_cdn_input').value);
});

document.getElementById('web_link').addEventListener('click', go_to_web);


document.addEventListener('DOMContentLoaded', function() {
  if (bg_page.enabled) {
    document.getElementById('main_btn').innerHTML="关闭";
  } else {
    document.getElementById('main_btn').innerHTML="启用";
  }
  document.getElementById('bili_cdn_input').value = bg_page.bili_cdn;
});

