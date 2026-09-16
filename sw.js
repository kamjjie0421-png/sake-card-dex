/* 오프라인 캐시. 버전은 빌드마다 갱신된다 — 고정 이름(v1)으로 두면
   cache-first 가 옛 index.html 을 영구히 물고 있어 카드를 추가해도 화면이 안 바뀐다
   (2026-09-15 실측: 카드 98종인데 화면은 38종). */
var C='sake-app-20260916143913';
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(C).then(function(c){
    return c.addAll(['./','./index.html','./manifest.webmanifest','./icon.svg']);
  }).then(function(){return self.skipWaiting();}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){return k!==C;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var u=new URL(e.request.url);
  var isDoc=e.request.mode==='navigate'||/\.(html|json)$/.test(u.pathname)||u.pathname.endsWith('/');
  if(isDoc){           /* 문서·데이터: 네트워크 우선, 끊기면 캐시 */
    e.respondWith(fetch(e.request).then(function(res){
      var cp=res.clone(); caches.open(C).then(function(c){c.put(e.request,cp);}); return res;
    }).catch(function(){return caches.match(e.request).then(function(r){return r||caches.match('./index.html');});}));
    return;
  }
  e.respondWith(caches.match(e.request).then(function(r){   /* 아이콘 등 정적: 캐시 우선 */
    return r||fetch(e.request).then(function(res){
      var cp=res.clone(); caches.open(C).then(function(c){c.put(e.request,cp);}); return res;
    });
  }));
});
