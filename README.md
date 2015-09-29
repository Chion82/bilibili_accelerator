#Bilibili Accelerator

#Changelog

9.29 Add socks5 proxy option. You can now use ShadowSocks to boost video loading.  
	更新socks5代理功能。现在可以通过ShadowSocks代理加速视频，效果显著！SS代理服务器不需要国内IP，插件可自动解决国外版权问题。推荐自建亚洲SS服务器（如日本conoha、DO新加坡节点），加速效果更明显。

#Introduction

Bilibili accelerator is a Chrome extension which helps you accelerate the loading speed of videos hosted on bilibili.com . The extension is explicitly developed for users using the China Education and Research Network and other ISPs with poor connectivities to the Bilibili video CDN servers. The main principal of the extension is to automatically perform a speed test of each available video URL based on the intercepted URL list before Chrome loads a video, and finally select the best one.

#Usage

* Simply drag the ```bilibili_accelerator_extension.crx``` to your Chrome extension management page.

* Click the activate button and that's it. Browse bilibili.com and enjoy watching the accelerated videos.

* If your network status extremely sucks, try locking the CDN IP for videos with ```http://ws.acgvideo.com``` prefixed URLs. This can be done by the following steps:

	- Enter one of these IP addresses in the popup panel and click "Save Bili CDN". The IPs below are well optimal CDN servers for the China Education and Research Network. You can also enter a customized IP which is the best proxy for ```ws.acgvideo.com``` in your network environment.

	> 36.250.74.110  
	> 113.207.80.35  
	> 36.250.74.21

	- In some cases, locking the CDN IP results in poor graphical quality of videos or even sometimes endless loading with continuous failure, because the video sources stored on Bilibili CDN servers are not fully synchronized.

#Note

* When the extension is activated, initializing a video costs up to 30-60 seconds because the extension is performing speed tests and any video requests prior to the completion of the tests are rejected, causing the flash player to continuously retry. This also explains why connection failures occur when the player is loading a video.
