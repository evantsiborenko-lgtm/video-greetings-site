(() => {
  'use strict';
  const STORAGE_KEY='kvs_analytics_consent_v1';
  const METRIKA_ID=109744286;
  const PRIVACY_URL='https://kvsvideo.ru/privacy.html';
  let banner=null,metrikaStarted=false;
  const getChoice=()=>{try{return localStorage.getItem(STORAGE_KEY)}catch(_){return null}};
  const setChoice=(v)=>{try{localStorage.setItem(STORAGE_KEY,v)}catch(_){}};
  function loadMetrika(){if(metrikaStarted||getChoice()!=='allow')return;metrikaStarted=true;window.ym=window.ym||function(){(window.ym.a=window.ym.a||[]).push(arguments)};window.ym.l=window.ym.l||(Date.now?Date.now():new Date().getTime());const src=`https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`;if(!Array.from(document.scripts).some(s=>s.src===src)){const s=document.createElement('script');s.async=true;s.src=src;(document.scripts[0]?.parentNode||document.head).insertBefore?((document.scripts[0]?.parentNode)?document.scripts[0].parentNode.insertBefore(s,document.scripts[0]):document.head.appendChild(s)):document.head.appendChild(s)}window.ym(METRIKA_ID,'init',{ssr:true,webvisor:true,clickmap:true,referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true})}
  function close(){if(banner){banner.remove();banner=null}}
  function allow(){setChoice('allow');close();loadMetrika();document.dispatchEvent(new CustomEvent('kvs:analytics-consent',{detail:{value:'allow'}}))}
  function deny(){const loaded=metrikaStarted||typeof window.ym==='function';setChoice('deny');close();document.dispatchEvent(new CustomEvent('kvs:analytics-consent',{detail:{value:'deny'}}));if(loaded)location.reload()}
  function make(manage=false){close();banner=document.createElement('section');banner.className='kvs-consent';banner.setAttribute('role','dialog');banner.setAttribute('aria-labelledby','kvs-consent-title');banner.innerHTML=`<div class="kvs-consent__copy"><strong id="kvs-consent-title">Аналитика сайта</strong><p>Мы используем Яндекс Метрику для статистики посещений и улучшения сайта. Сервис может использовать cookie и данные об устройстве. <a href="${PRIVACY_URL}">Подробнее в Политике конфиденциальности</a>.</p></div><div class="kvs-consent__actions"><button type="button" class="kvs-consent__button" data-kvs-consent="allow">Разрешить аналитику</button><button type="button" class="kvs-consent__button" data-kvs-consent="deny">Только необходимые</button></div>${manage?'<button type="button" class="kvs-consent__close" aria-label="Закрыть настройки аналитики">×</button>':''}`;banner.addEventListener('click',e=>{const c=e.target.closest('[data-kvs-consent]');if(c){c.dataset.kvsConsent==='allow'?allow():deny();return}if(e.target.closest('.kvs-consent__close'))close()});document.body.appendChild(banner)}
  function init(){const c=getChoice();if(c==='allow')loadMetrika();else if(c!=='deny')make(false);document.addEventListener('click',e=>{const t=e.target.closest('[data-analytics-settings]');if(t){e.preventDefault();make(true)}})}
  window.KVSAnalyticsConsent={open:()=>make(true),allow,deny,choice:getChoice};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
