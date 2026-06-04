/* 媽媽の栃木・茨城 — app.js  (vanilla, offline) */
(function () {
  "use strict";
  var T = window.TRIP;
  var view = document.getElementById('view');
  var tabbar = document.getElementById('tabbar');
  var offlineBadge = document.getElementById('offlineBadge');

  var ST = {
    ok:   { e: '✅', t: '穩陣' },
    tip:  { e: '💡', t: '貼士' },
    warn: { e: '🟠', t: '注意' },
    alert:{ e: '🔴', t: '緊要' },
    star: { e: '⭐', t: '必去' }
  };

  // ---- helpers ----
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function mapHref(q){ return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q); }
  function telHref(n){ return 'tel:' + String(n).replace(/[^0-9+]/g,''); }
  function badge(st){ var m = ST[st] || ST.ok; return '<span class="badge" data-st="'+st+'">'+m.e+' '+m.t+'</span>'; }
  function fact(label, val, cls){ if(!val) return ''; return '<span class="fact '+(cls||'')+'"><span>'+label+'</span><b>'+esc(val)+'</b></span>'; }

  // ---- 匯率計算機 ----
  var FX_KEY = 'mama_fx_rate';
  function fxRate(){ var r = parseFloat(localStorage.getItem(FX_KEY)); return (r > 0) ? r : ((T.fx && T.fx.jpyPerHkd) || 19); }
  function fxWidget(){
    var r = fxRate();
    return '<div class="fx">'+
      '<div class="fx__row">'+
        '<label class="fx__field"><span>¥ 日圓</span><input id="fxJpy" type="number" inputmode="decimal" placeholder="1000"></label>'+
        '<span class="fx__eq">≈</span>'+
        '<label class="fx__field"><span>HK$ 港元</span><input id="fxHkd" type="number" inputmode="decimal" placeholder="—"></label>'+
      '</div>'+
      '<div class="fx__rate">匯率　1 HK$ = <input id="fxRate" type="number" inputmode="decimal" value="'+r+'"> ¥'+
        '<button id="fxQuick" class="fx__quick" type="button">¥1000 ＝?</button></div>'+
      ((T.fx&&T.fx.note) ? '<p class="fx__note">'+esc(T.fx.note)+'</p>' : '')+
    '</div>';
  }
  function bindFx(){
    var jpy=document.getElementById('fxJpy'), hkd=document.getElementById('fxHkd'), rate=document.getElementById('fxRate');
    if(!jpy) return;
    function rt(){ var r=parseFloat(rate.value)||fxRate(); if(r>0) localStorage.setItem(FX_KEY, r); return r; }
    jpy.addEventListener('input', function(){ var r=rt(), v=parseFloat(jpy.value); hkd.value = (jpy.value && isFinite(v)) ? (v/r).toFixed(2) : ''; });
    hkd.addEventListener('input', function(){ var r=rt(), v=parseFloat(hkd.value); jpy.value = (hkd.value && isFinite(v)) ? Math.round(v*r) : ''; });
    rate.addEventListener('input', function(){ var r=rt(), v=parseFloat(jpy.value); if(jpy.value && isFinite(v)) hkd.value=(v/r).toFixed(2); });
    var q=document.getElementById('fxQuick'); if(q) q.addEventListener('click', function(){ jpy.value=1000; hkd.value=(1000/rt()).toFixed(2); });
  }

  // ---- 行李 packing ----
  var PK_KEY = 'mama_pack_v1';
  function pkGet(){ try{ return JSON.parse(localStorage.getItem(PK_KEY)||'{}'); }catch(e){ return {}; } }
  function pkSet(o){ try{ localStorage.setItem(PK_KEY, JSON.stringify(o)); }catch(e){} }
  function packingHTML(){
    var done = pkGet();
    return '<div class="pkwrap">'+ (T.packing||[]).map(function(g, gi){
      return '<div class="pkgroup"><div class="pkgroup__h">'+esc(g.cat)+'</div>'+
        g.items.map(function(it, ii){ var id='p'+gi+'_'+ii;
          return '<div class="pk'+(done[id]?' is-done':'')+'" data-id="'+id+'" role="button" tabindex="0"><span class="pk__box"></span><span class="pk__txt">'+esc(it)+'</span></div>';
        }).join('')+'</div>';
    }).join('') +'</div>';
  }
  function bindPacking(scope){
    scope.querySelectorAll('.pk').forEach(function(c){
      function t(){ var d=pkGet(), id=c.dataset.id; if(d[id]){ delete d[id]; c.classList.remove('is-done'); } else { d[id]=1; c.classList.add('is-done'); } pkSet(d); }
      c.addEventListener('click', t);
      c.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); t(); } });
    });
  }

  // ---- 字體大細 ----
  var FS_KEY='mama_fs', FS_ORDER=['','lg','xl'];
  function applyFs(v){ document.documentElement.setAttribute('data-fs', v||''); }
  function setFs(v){ try{ localStorage.setItem(FS_KEY, v); }catch(e){} applyFs(v); }
  function curFs(){ try{ return localStorage.getItem(FS_KEY)||''; }catch(e){ return ''; } }
  function bindFs(){
    var dec=document.getElementById('fsDec'), inc=document.getElementById('fsInc');
    if(inc) inc.addEventListener('click', function(){ var i=FS_ORDER.indexOf(curFs()); setFs(FS_ORDER[Math.min(FS_ORDER.length-1, i+1)]); });
    if(dec) dec.addEventListener('click', function(){ var i=FS_ORDER.indexOf(curFs()); setFs(FS_ORDER[Math.max(0, i-1)]); });
  }

  // ---- 今日 / 安裝提示 ----
  function todayIndex(){
    try{ var s=new Date(2026,5,16); s.setHours(0,0,0,0); var n=new Date(); n.setHours(0,0,0,0);
      var d=Math.round((n-s)/86400000); return (d>=0 && d<6) ? d : -1; }catch(e){ return -1; }
  }
  function isStandalone(){ return (window.navigator.standalone === true) || (window.matchMedia && matchMedia('(display-mode: standalone)').matches); }
  var HINT_KEY='mama_hint_install';
  function installHintHTML(){
    if(isStandalone()) return '';
    try{ if(localStorage.getItem(HINT_KEY)) return ''; }catch(e){}
    return '<div class="hint" id="installHint"><span class="hint__txt">💡 想變 app 放主畫面？撳下面【分享】→【加入主畫面】，之後冇網都開到。</span><button class="hint__x" id="hintX" type="button" aria-label="關閉">×</button></div>';
  }
  function bindHint(){
    var x=document.getElementById('hintX');
    if(x) x.addEventListener('click', function(){ try{ localStorage.setItem(HINT_KEY,'1'); }catch(e){} var h=document.getElementById('installHint'); if(h) h.remove(); });
  }

  // ============ DAYS ============
  function timelineItem(it, open){
    var facts = [
      fact('開放', it.hours),
      fact('休', it.closed, 'fact--closed'),
      fact('價', it.price),
      fact('預約', it.booking)
    ].join('');
    var tips = (it.tips && it.tips.length)
      ? '<ul class="tl__tips">' + it.tips.map(function(t){ return '<li>'+esc(t)+'</li>'; }).join('') + '</ul>' : '';
    var warnnote = it.warnNote ? '<div class="tl__warnnote">⚠️ '+esc(it.warnNote)+'</div>' : '';
    var ab = '';
    if (it.map)  ab += '<a class="act act--map" target="_blank" rel="noopener" href="'+mapHref(it.map)+'">🗺️ 地圖</a>';
    if (it.phone) ab += '<a class="act act--call" href="'+telHref(it.phone)+'">📞 '+esc(it.phone)+'</a>';
    if (it.link) ab += '<a class="act act--link" target="_blank" rel="noopener" href="'+esc(it.link)+'">🔗 '+esc(it.linkLabel||'官網')+'</a>';
    var acts = ab ? '<div class="actions">'+ab+'</div>' : '';
    var jp = it.jp ? '<span class="tl__jp">'+esc(it.jp)+'</span>' : '';

    return '<div class="tl'+(open?' is-open':'')+'" data-st="'+esc(it.status)+'">'+
      '<span class="tl__node"></span>'+
      '<div class="tl__time">'+esc(it.time)+'</div>'+
      '<div class="tl__card">'+
        '<button class="tl__main" type="button" aria-expanded="'+(open?'true':'false')+'">'+
          '<span class="tl__ico">'+esc(it.icon||'•')+'</span>'+
          '<span class="tl__ttl">'+esc(it.title)+'</span>'+
          '<span class="tl__caret">▾</span>'+
          jp+
          '<span class="tl__badgeline">'+badge(it.status)+'</span>'+
        '</button>'+
        '<div class="tl__body"><div class="tl__bodyInner"><div class="tl__detail">'+
          (it.desc ? '<p class="tl__desc">'+esc(it.desc)+'</p>' : '')+
          (facts ? '<div class="facts">'+facts+'</div>' : '')+
          tips + warnnote + acts +
        '</div></div></div>'+
      '</div></div>';
  }

  function renderDay(i){
    var d = T.days[i];
    var html = '<div class="day">'+
      '<div class="day__hero">'+
        '<div class="day__emoji">'+esc(d.emoji)+'</div>'+
        '<div class="day__head">'+
          '<div class="day__kicker">Day '+d.n+'　'+esc(d.date)+' '+esc(d.dow)+'　'+esc(d.city)+'</div>'+
          '<h2 class="day__title">'+esc(d.title)+'</h2>'+
          '<p class="day__summary">'+esc(d.summary)+'</p>'+
          (d.weather ? '<span class="chip-weather">🌦️ '+esc(d.weather)+'</span>' : '')+
        '</div>'+
      '</div>'+
      '<div class="timeline">'+ d.timeline.map(timelineItem).join('') +'</div>'+
      (d.rainPlan ? '<div class="block block--rain"><div class="block__h is-rain">🌧️ 落雨後備</div><p>'+esc(d.rainPlan)+'</p></div>' : '')+
      (d.tips && d.tips.length ? '<div class="block"><div class="block__h">📝 貼士</div><ul>'+d.tips.map(function(t){return '<li>'+esc(t)+'</li>';}).join('')+'</ul></div>' : '')+
    '</div>';
    var wrap = document.getElementById('dayWrap');
    wrap.innerHTML = html;
    bindTimeline(wrap);
  }

  function renderDays(){
    var alerts = '<div class="alerts">'+ T.alerts.map(function(a){
      return '<div class="alert-card" data-lv="'+esc(a.level)+'">'+
        '<div class="alert-card__ico">'+esc(a.icon)+'</div>'+
        '<div class="alert-card__title">'+esc(a.title)+'</div>'+
        '<div class="alert-card__text">'+esc(a.text)+'</div>'+
      '</div>';
    }).join('') +'</div>';

    var ti = todayIndex(), startIdx = ti >= 0 ? ti : 0;
    var strip = '<div class="daystrip" id="daystrip">'+ T.days.map(function(d,i){
      return '<button class="daypill'+(i===startIdx?' is-active':'')+(i===ti?' is-today':'')+'" data-day="'+i+'" type="button">'+
        '<span class="daypill__seal">'+d.n+'</span>'+
        '<span class="daypill__lbl">'+(i===ti ? '今日' : esc(d.date)+' '+esc(d.dow))+'</span>'+
      '</button>';
    }).join('') +'</div>';

    view.innerHTML =
      installHintHTML() +
      '<div class="view__head"><p class="view__eyebrow">行程</p><h2 class="view__title">六日 · 逐日睇</h2>'+
      '<p class="view__sub">撳個朱印日子睇當日安排。每格撳一下展開詳情。</p></div>'+
      alerts + strip + '<div id="dayWrap"></div>'+
      '<p class="footer-note">'+esc(T.meta.updated)+'　·　'+esc(T.meta.note)+'<br><b>祝媽媽旅途平安快樂 🌸</b></p>';

    bindHint();
    var pills = view.querySelectorAll('.daypill');
    pills.forEach(function(p){
      p.addEventListener('click', function(){
        pills.forEach(function(x){ x.classList.remove('is-active'); });
        p.classList.add('is-active');
        renderDay(+p.dataset.day);
        p.scrollIntoView({ behavior:'smooth', inline:'center', block:'nearest' });
      });
    });
    renderDay(startIdx);
    if (startIdx > 0 && pills[startIdx]) pills[startIdx].scrollIntoView({ inline:'center', block:'nearest' });
  }

  function bindTimeline(scope){
    scope.querySelectorAll('.tl__main').forEach(function(btn){
      btn.addEventListener('click', function(){
        var tl = btn.closest('.tl');
        var open = tl.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  // ============ TRANSIT ============
  function renderTransit(){
    var f = T.transport.flight;
    var legs = T.transport.legs.map(function(l){
      return '<div class="leg">'+
        '<div class="leg__top"><span class="leg__day">'+esc(l.d)+'</span><span class="leg__route">'+esc(l.from)+' → '+esc(l.to)+'</span></div>'+
        '<div class="leg__mode">'+esc(l.mode)+'</div>'+
        '<div class="leg__meta">'+ fact('時間', l.time) + fact('車資', l.fare) +
          '<span class="fact">IC <b class="'+(l.ic?'ic-yes':'ic-no')+'">'+(l.ic?'可用':'唔收·現金')+'</b></span>'+
        '</div>'+
        '<div class="leg__note">'+esc(l.note)+'</div>'+
      '</div>';
    }).join('');

    var rets = T.transport.returnOptions.map(function(r){
      return '<div class="ret" data-rank="'+esc(r.rank)+'">'+
        '<span class="ret__rank">'+esc(r.rank)+'</span>'+
        '<div class="ret__title">'+esc(r.title)+'</div>'+
        '<div class="leg__meta">'+ fact('時間', r.time) + fact('車資', r.fare) +'</div>'+
        '<div class="ret__detail">'+esc(r.detail)+'</div>'+
        (r.booking ? '<div class="ret__booking">📌 '+esc(r.booking)+'</div>' : '')+
        (r.warn ? '<div class="ret__detail">⚠️ '+esc(r.warn)+'</div>' : '')+
      '</div>';
    }).join('');

    var lug = T.transport.luggage;
    view.innerHTML =
      '<div class="view__head"><p class="view__eyebrow">交通</p><h2 class="view__title">點去 · 點返</h2>'+
      '<p class="view__sub">每程車資、IC 卡收唔收、回程方案。</p></div>'+
      '<div class="t-flight">'+
        '<div class="t-flight__row"><div><div class="t-flight__air">'+esc(f.airline)+'</div>'+
        '<div class="t-flight__route">'+esc(f.route)+'</div></div>'+
        '<div style="text-align:right"><div class="t-flight__time">'+esc(f.time)+'</div><div class="t-flight__term">'+esc(f.terminal)+'</div></div></div>'+
        '<ul>'+ f.notes.map(function(n){return '<li>'+esc(n)+'</li>';}).join('') +'</ul>'+
      '</div>'+
      '<div class="sectionlabel">城際交通</div>'+ legs +
      '<div class="sectionlabel">回程 · 土浦 → 成田</div>'+ rets +
      '<div class="sectionlabel">行李</div>'+
      '<div class="block"><div class="block__h">🧳 宅急便</div><p>'+esc(lug.takkyubin)+'</p></div>'+
      '<div class="block"><div class="block__h">🔒 各站行李櫃</div><ul>'+lug.lockers.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></div>'+
      '<div class="block"><div class="block__h">💳 IC 卡</div><p>'+esc(T.transport.icCard)+'</p></div>';
  }

  // ============ CHECKLIST ============
  var CK_KEY = 'mama_trip_ck_v1';
  function getDone(){ try{ return JSON.parse(localStorage.getItem(CK_KEY)||'[]'); }catch(e){ return []; } }
  function setDone(a){ try{ localStorage.setItem(CK_KEY, JSON.stringify(a)); }catch(e){} }

  function renderChecklist(){
    var done = getDone();
    var items = T.booking.map(function(b,i){
      var isDone = done.indexOf(i) > -1;
      return '<div class="ck'+(isDone?' is-done':'')+'" data-i="'+i+'" role="button" tabindex="0">'+
        '<div class="ck__box"></div>'+
        '<div class="ck__body">'+
          '<div class="ck__item">'+esc(b.item)+'</div>'+
          '<div class="ck__how">'+esc(b.how)+'</div>'+
          '<span class="ck__tag" data-lv="'+esc(b.level)+'">'+esc(b.tag)+'</span>'+
        '</div></div>';
    }).join('');

    view.innerHTML =
      '<div class="view__head"><p class="view__eyebrow">清單</p><h2 class="view__title">出發前 · 要訂咩</h2>'+
      '<p class="view__sub">撳一下打勾，記低已經搞掂嘅。🔴 嗰啲一定要訂。</p></div>'+
      items +
      '<div class="sectionlabel">🎒 行李 Packing</div>'+ packingHTML() +
      '<p class="footer-note">打咗勾會記住，下次開都喺度。</p>';

    view.querySelectorAll('.ck').forEach(function(c){
      function toggle(){
        var i = +c.dataset.i; var d = getDone(); var p = d.indexOf(i);
        if(p>-1){ d.splice(p,1); c.classList.remove('is-done'); } else { d.push(i); c.classList.add('is-done'); }
        setDone(d);
      }
      c.addEventListener('click', toggle);
      c.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(); } });
    });
    bindPacking(view);
  }

  // ============ SOS ============
  function renderSos(){
    var em = T.emergency;
    var tels = em.phones.map(function(p){
      return '<a class="tel" href="'+telHref(p.num)+'">'+
        '<span class="tel__num">'+esc(p.num)+'</span>'+
        '<span><span class="tel__lbl">'+esc(p.label)+'</span>'+(p.note?'<div class="tel__note">'+esc(p.note)+'</div>':'')+'</span>'+
        '<span class="tel__call">📞</span></a>';
    }).join('');
    var phr = T.phrases.map(function(p){
      return '<div class="phrase"><div class="phrase__hk">'+esc(p.hk)+'</div>'+
        '<div class="phrase__jp">'+esc(p.jp)+'</div><div class="phrase__ro">'+esc(p.romaji)+'</div></div>';
    }).join('');

    view.innerHTML =
      '<div class="view__head"><p class="view__eyebrow">緊急</p><h2 class="view__title">出事 · 揾邊個</h2>'+
      '<p class="view__sub">撳個號碼即刻打。下面有日文短句俾媽媽指俾人睇。</p></div>'+
      '<div class="sectionlabel">💱 匯率計算機</div>'+ fxWidget() +
      '<div class="sectionlabel">電話（撳即打）</div>'+ tels +
      '<div class="sectionlabel">日文短句</div>'+ phr +
      '<div class="sectionlabel">實用</div>'+
      '<div class="note-card"><h4>💊 藥房</h4><p>'+esc(em.pharmacy)+'</p></div>'+
      '<div class="note-card"><h4>🚻 廁所</h4><p>'+esc(em.toilet)+'</p></div>'+
      '<div class="note-card"><h4>📶 上網</h4><p>'+esc(em.sim)+'</p></div>'+
      '<div class="note-card"><h4>🌦️ 天氣</h4><p>'+esc(T.weather)+'</p></div>';
    bindFx();
  }

  // ============ PRINT (full document for PDF) ============
  function printDay(d){
    return '<section class="day printday">'+
      '<div class="day__hero">'+
        '<div class="day__emoji">'+esc(d.emoji)+'</div>'+
        '<div class="day__head">'+
          '<div class="day__kicker">Day '+d.n+'　'+esc(d.date)+' '+esc(d.dow)+'　'+esc(d.city)+'</div>'+
          '<h2 class="day__title">'+esc(d.title)+'</h2>'+
          '<p class="day__summary">'+esc(d.summary)+'</p>'+
          (d.weather ? '<span class="chip-weather">🌦️ '+esc(d.weather)+'</span>' : '')+
        '</div>'+
      '</div>'+
      '<div class="timeline">'+ d.timeline.map(function(it){ return timelineItem(it, true); }).join('') +'</div>'+
      (d.rainPlan ? '<div class="block block--rain"><div class="block__h is-rain">🌧️ 落雨後備</div><p>'+esc(d.rainPlan)+'</p></div>' : '')+
      (d.tips && d.tips.length ? '<div class="block"><div class="block__h">📝 貼士</div><ul>'+d.tips.map(function(t){return '<li>'+esc(t)+'</li>';}).join('')+'</ul></div>' : '')+
    '</section>';
  }
  function snapshot(fn){ fn(); return view.innerHTML; }
  function renderPrint(){
    var alerts = '<div class="alerts">'+ T.alerts.map(function(a){
      return '<div class="alert-card" data-lv="'+esc(a.level)+'"><div class="alert-card__ico">'+esc(a.icon)+'</div><div class="alert-card__title">'+esc(a.title)+'</div><div class="alert-card__text">'+esc(a.text)+'</div></div>';
    }).join('') +'</div>';
    var t = snapshot(renderTransit), c = snapshot(renderChecklist), s = snapshot(renderSos);
    view.innerHTML =
      '<div class="printdoc">'+
        '<div class="printcover"><div class="printcover__seal">旅</div>'+
          '<h1>'+esc(T.meta.title)+'</h1><p class="printcover__sub">'+esc(T.meta.subtitle)+'　'+esc(T.meta.dates)+'</p>'+
          '<p class="printcover__route">'+esc(T.meta.route)+'　·　'+esc(T.meta.updated)+'</p></div>'+
        '<h3 class="printsec">出發前要訂</h3>'+ alerts +
        '<h3 class="printsec">逐日行程</h3>'+ T.days.map(printDay).join('') +
        '<h3 class="printsec">交通・回程</h3>'+ t +
        '<h3 class="printsec">Booking 清單</h3>'+ c +
        '<h3 class="printsec">緊急・實用</h3>'+ s +
      '</div>';
  }

  // ============ router ============
  var R = { days: renderDays, transit: renderTransit, checklist: renderChecklist, sos: renderSos };
  function activate(tab, fromHash){
    if (!R[tab]) tab = 'days';
    tabbar.querySelectorAll('.tab').forEach(function(x){
      var on = x.dataset.tab === tab;
      x.classList.toggle('is-active', on);
      if (on) x.setAttribute('aria-current','page'); else x.removeAttribute('aria-current');
    });
    R[tab]();
    view.scrollTop = 0; window.scrollTo(0,0);
    if (view.focus) view.focus({ preventScroll:true });
    if (!fromHash && location.hash !== '#'+tab) history.replaceState(null,'','#'+tab);
  }
  tabbar.querySelectorAll('.tab').forEach(function(t){
    t.addEventListener('click', function(){ activate(t.dataset.tab); });
  });
  window.addEventListener('hashchange', function(){ activate((location.hash||'').slice(1), true); });

  // ---- offline indicator ----
  function updNet(){
    var on = navigator.onLine;
    offlineBadge.textContent = on ? '線上' : '離線 ✓';
    offlineBadge.classList.toggle('is-on', !on);
  }
  window.addEventListener('online', updNet);
  window.addEventListener('offline', updNet);

  applyFs(curFs());
  bindFs();
  updNet();
  if (location.search.indexOf('print') > -1 || location.hash === '#print') {
    document.body.classList.add('printing');
    renderPrint();
  } else {
    activate((location.hash || '').slice(1) || 'days', true);
  }
})();
