/* ساحر موفيز — صنعه الساحر 🧙‍♂️
   بيانات الأفلام والمسلسلات من TMDB (واجهة مجانية للاستخدام الشخصي).
   مفيش سيرفرات مقرصنة: كل اللي بيتعرض مصادر قانونية (مشاهدة رسمية / يوتيوب / أرشيف الإنترنت). */

const TMDB_KEY = 'f8a123dcdc8da443eac7a758ad259eb1';
const API = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p';
const REGION = 'EG';
const LANG = 'ar';

const app = document.getElementById('app');
const toastEl = document.getElementById('toast');

/* ---------- helpers ---------- */
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

async function api(path, params = {}) {
  const url = new URL(API + path);
  url.searchParams.set('api_key', TMDB_KEY);
  url.searchParams.set('language', LANG);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error('TMDB ' + res.status);
  return res.json();
}

const img = (p, size = 'w342') => p ? `${IMG}/${size}${p}` : '';
const titleOf = (i) => i.title || i.name || i.original_title || i.original_name || 'بدون عنوان';
const origOf = (i) => i.original_title || i.original_name || '';
const yearOf = (i) => (i.release_date || i.first_air_date || '').slice(0, 4);
const typeOf = (i) => i.media_type || (i.first_air_date ? 'tv' : 'movie');
const typeLabel = (t) => t === 'tv' ? 'مسلسل' : t === 'person' ? 'شخص' : 'فيلم';

function posterCard(i) {
  const t = typeOf(i);
  if (t === 'person') return '';
  const rate = i.vote_average ? i.vote_average.toFixed(1) : '';
  return `<div class="card" data-go="#/${t}/${i.id}">
    <div class="poster-wrap">
      <img class="poster" loading="lazy" src="${img(i.poster_path)}" alt="${esc(titleOf(i))}"
        onerror="this.style.opacity=.25">
      ${rate ? `<span class="badge">★ ${rate}</span>` : ''}
      <span class="type-badge">${typeLabel(t)}</span>
    </div>
    <div class="t">${esc(titleOf(i))}</div>
    <div class="y">${yearOf(i) || '—'}</div>
  </div>`;
}

function grid(items) {
  const clean = (items || []).filter(i => typeOf(i) !== 'person');
  if (!clean.length) return `<div class="empty">مفيش نتايج هنا.</div>`;
  return `<div class="grid">${clean.map(posterCard).join('')}</div>`;
}

function row(items) {
  const clean = (items || []).filter(i => typeOf(i) !== 'person');
  return `<div class="row-scroll">${clean.map(posterCard).join('')}</div>`;
}

function skeletons(n = 6) {
  return `<div class="row-scroll">${Array.from({ length: n }).map(() =>
    `<div class="card" style="flex:0 0 132px"><div class="skeleton" style="aspect-ratio:2/3"></div>
     <div class="skeleton" style="height:14px;margin:8px"></div></div>`).join('')}</div>`;
}

/* ---------- views ---------- */
async function viewHome() {
  app.innerHTML = `<div class="hero"><div class="skeleton" style="position:absolute;inset:0"></div></div>
    <h2 class="section">الأكثر مشاهدة دلوقتي</h2>${skeletons()}
    <h2 class="section">🇪🇬 مصري وعربي</h2>${skeletons()}
    <h2 class="section">أفلام مشهورة</h2>${skeletons()}`;

  const [trending, arabicM, arabicT, popular] = await Promise.all([
    api('/trending/all/week').catch(() => ({ results: [] })),
    api('/discover/movie', { with_original_language: 'ar', sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
    api('/discover/tv', { with_original_language: 'ar', sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
    api('/movie/popular').catch(() => ({ results: [] }))
  ]);

  const arabic = [...(arabicM.results || []), ...(arabicT.results || [])]
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 18);
  const hero = (trending.results || [])[0];

  app.innerHTML = `
    ${hero ? `<div class="hero" data-go="#/${typeOf(hero)}/${hero.id}">
      <img class="bd" src="${img(hero.backdrop_path, 'w780')}" alt="">
      <div class="grad"></div>
      <div class="inner">
        <h1>${esc(titleOf(hero))}</h1>
        <p>${esc(hero.overview || 'اضغط تشوف التفاصيل وفين تتفرج عليه.')}</p>
        <button class="btn primary" data-go="#/${typeOf(hero)}/${hero.id}">التفاصيل ▸</button>
      </div></div>` : ''}

    <div class="chips">
      <button class="chip" data-go="#/movies">أفلام</button>
      <button class="chip" data-go="#/tv">مسلسلات</button>
      <button class="chip" data-go="#/cartoon">كرتون وأنيمي</button>
      <button class="chip" data-go="#/free">مجاني وقانوني</button>
    </div>

    <h2 class="section">الأكثر مشاهدة دلوقتي</h2>${row(trending.results)}
    <h2 class="section">مصري وعربي <small>أفلام ومسلسلات</small></h2>${row(arabic)}
    <h2 class="section">أفلام مشهورة</h2>${row(popular.results)}
  `;
  bind();
}

async function viewList(kind) {
  const conf = {
    movies: { title: 'أفلام', path: '/movie/popular', extra: {} },
    tv: { title: 'مسلسلات', path: '/tv/popular', extra: {} },
    cartoon: { title: 'كرتون وأنيمي', path: '/discover/movie', extra: { with_genres: '16', sort_by: 'popularity.desc' } }
  }[kind];

  app.innerHTML = `<h2 class="section">${conf.title}</h2>
    <div class="chips">
      <button class="chip active" data-go="#/${kind}">الأكثر شعبية</button>
      <button class="chip" data-go="#/${kind}/top">الأعلى تقييم</button>
    </div><div class="spinner"></div>`;

  let path = conf.path, extra = { ...conf.extra };
  if (kind === 'movies') path = '/movie/popular';
  if (kind === 'tv') path = '/tv/popular';
  const d = await api(path, extra).catch(() => ({ results: [] }));
  app.innerHTML = `<h2 class="section">${conf.title}</h2>
    <div class="chips">
      <button class="chip active" data-go="#/${kind}">الأكثر شعبية</button>
      <button class="chip" data-go="#/${kind}/top">الأعلى تقييم</button>
    </div>${grid(d.results)}`;
  bind();
}

async function viewListTop(kind) {
  const map = {
    movies: { title: 'أفلام', path: '/movie/top_rated' },
    tv: { title: 'مسلسلات', path: '/tv/top_rated' },
    cartoon: { title: 'كرتون وأنيمي', path: '/discover/movie', extra: { with_genres: '16', sort_by: 'vote_average.desc', 'vote_count.gte': 500 } }
  }[kind];
  app.innerHTML = `<h2 class="section">${map.title}</h2>
    <div class="chips">
      <button class="chip" data-go="#/${kind}">الأكثر شعبية</button>
      <button class="chip active" data-go="#/${kind}/top">الأعلى تقييم</button>
    </div><div class="spinner"></div>`;
  const d = await api(map.path, map.extra || {}).catch(() => ({ results: [] }));
  app.innerHTML = `<h2 class="section">${map.title}</h2>
    <div class="chips">
      <button class="chip" data-go="#/${kind}">الأكثر شعبية</button>
      <button class="chip active" data-go="#/${kind}/top">الأعلى تقييم</button>
    </div>${grid(d.results)}`;
  bind();
}

async function viewSearch(q) {
  app.innerHTML = `<h2 class="section">نتايج البحث عن «${esc(q)}»</h2><div class="spinner"></div>`;
  const d = await api('/search/multi', { query: q, include_adult: 'false' }).catch(() => ({ results: [] }));
  const items = (d.results || []).filter(i => typeOf(i) !== 'person');
  app.innerHTML = items.length
    ? `<h2 class="section">نتايج البحث عن «${esc(q)}» <small>${items.length} نتيجة</small></h2>${grid(items)}
       <p class="note" style="margin-top:16px">مش لاقي حاجة؟ جرّب الاسم بالإنجليزي كمان.</p>`
    : `<h2 class="section">نتايج البحث عن «${esc(q)}»</h2>
       <div class="empty">مفيش نتايج.<br>جرّب تكتب الاسم بطريقة تانية أو بالإنجليزي.</div>`;
  bind();
}

const PROVIDER_KINDS = [
  ['flatrate', 'اشتراك مدفوع'],
  ['free', 'مجاني'],
  ['ads', 'مجاني بإعلانات'],
  ['rent', 'إيجار'],
  ['buy', 'شراء']
];

async function viewDetail(type, id) {
  app.innerHTML = `<div class="spinner"></div>`;
  let d;
  try {
    d = await api(`/${type}/${id}`, { append_to_response: 'credits,similar,watch/providers' });
  } catch (e) {
    app.innerHTML = `<div class="empty">مش قادر أجيب تفاصيل العمل ده دلوقتي.<br>جرّب تاني بعد شوية.</div>`;
    return;
  }
  const t = typeOf(d);
  const providers = (d['watch/providers'] && d['watch/providers'].results && d['watch/providers'].results[REGION]) || null;
  const tmdbLink = providers && providers.link ? providers.link : `https://www.themoviedb.org/${t}/${id}/watch?locale=${REGION}`;
  const ytQ = encodeURIComponent(`${titleOf(d)} ${origOf(d)} ${yearOf(d)} فيلم كامل`);
  const iaQ = encodeURIComponent(titleOf(d));
  const genres = (d.genres || []).map(g => `<span class="genre">${esc(g.name)}</span>`).join('');
  const runtime = d.runtime ? `${d.runtime} دقيقة` : '';
  const seasons = d.number_of_seasons ? `${d.number_of_seasons} موسم` : '';
  const vote = d.vote_average ? `★ ${d.vote_average.toFixed(1)}` : '';
  const votes = d.vote_count ? `(${d.vote_count} تقييم)` : '';
  const cast = (d.credits && d.credits.cast || []).slice(0, 12);

  let providerHTML = `<p class="note">مفيش بيانات مشاهدة رسمية لمصر دلوقتي.</p>`;
  if (providers) {
    const parts = [];
    for (const [k, label] of PROVIDER_KINDS) {
      const list = providers[k];
      if (list && list.length) {
        parts.push(`<div class="prov-label">${label}</div><div class="providers">${list.map(p =>
          `<a class="prov" href="${esc(tmdbLink)}" target="_blank" rel="noopener">
             <img src="${img(p.logo_path, 'w92')}" alt="${esc(p.provider_name)}" loading="lazy">
             <span>${esc(p.provider_name)}</span></a>`).join('')}</div>`);
      }
    }
    providerHTML = parts.length ? parts.join('') +
      `<p class="note" style="margin-top:10px">اللينكات بتفتح صفحة المشاهدة الرسمية (بيانات JustWatch عن طريق TMDB).</p>`
      : `<p class="note">مفيش منصة رسمية في مصر بتبثّه دلوقتي.</p>`;
  }

  app.innerHTML = `
  <div class="detail-hero">
    <img class="bd" src="${img(d.backdrop_path, 'w780')}" alt="">
    <div class="grad"></div>
  </div>
  <div class="detail-head">
    <img class="p" src="${img(d.poster_path, 'w342')}" alt="${esc(titleOf(d))}">
    <div class="meta">
      <h1>${esc(titleOf(d))}</h1>
      ${origOf(d) && origOf(d) !== titleOf(d) ? `<p class="orig">${esc(origOf(d))}</p>` : ''}
      <div class="stars">${vote} <span style="color:#9aa7c7;font-weight:600">${votes}</span></div>
      <div class="meta-line">
        <span>${typeLabel(t)}</span>${yearOf(d) ? `<span>· ${yearOf(d)}</span>` : ''}
        ${runtime ? `<span>· ${runtime}</span>` : ''}${seasons ? `<span>· ${seasons}</span>` : ''}
      </div>
    </div>
  </div>

  <div class="genres">${genres}</div>
  ${d.tagline ? `<p class="tagline">«${esc(d.tagline)}»</p>` : ''}
  <p class="tagline">${esc(d.overview || 'مفيش وصف بالعربي للعمل ده.')}</p>

  <div class="block">
    <h3>فين تتفرج عليه في مصر</h3>
    ${providerHTML}
  </div>

  <div class="block">
    <h3>مصادر مجانية وقانونية</h3>
    <div class="watch-links">
      <a class="wlink" href="https://www.youtube.com/results?search_query=${ytQ}" target="_blank" rel="noopener">
        <span class="ic"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg></span> دوّر عليه على يوتيوب (مشاهدة قانونية)</a>
      <a class="wlink" href="https://archive.org/search?query=${iaQ}" target="_blank" rel="noopener">
        <span class="ic"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M4 21V10h16v11M2 10l10-6 10 6"/></svg></span> أرشيف الإنترنت (أفلام ملك عام مجانًا)</a>
      <a class="wlink" href="${esc(tmdbLink)}" target="_blank" rel="noopener">
        <span class="ic"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18"/></svg></span> كل المنصات المتاحة في مصر (JustWatch)</a>
    </div>
    <p class="note" style="margin-top:10px">مفيش هنا سيرفرات مقرصنة: اللينكات كلها لمصادر قانونية.</p>
  </div>

  ${cast.length ? `<h2 class="section">فريق العمل</h2>
    <div class="cast">${cast.map(p => `<div class="person">
      <img loading="lazy" src="${img(p.profile_path, 'w185')}" alt="${esc(p.name)}" onerror="this.style.opacity=.2">
      <div class="n">${esc(p.name)}</div><div class="r">${esc(p.character || '')}</div></div>`).join('')}</div>` : ''}

  ${(d.similar && d.similar.results || []).length ? `<h2 class="section">شبه كده كمان</h2>${row(d.similar.results.slice(0, 18))}` : ''}
  `;
  bind();
}

/* ---------- free & legal (archive.org) ---------- */
let freeCache = null;
async function viewFree() {
  app.innerHTML = `<h2 class="section">مجاني وقانوني <small>أفلام ملك عام من أرشيف الإنترنت</small></h2>
    <div class="chips">
      <button class="chip active" data-free="feature_films">أفلام كلاسيكية</button>
      <button class="chip" data-free="classic_cartoons">كرتون قديم</button>
      <button class="chip" data-free="arabic">عربي</button>
    </div><div id="freeBody"><div class="spinner"></div></div>`;
  await loadFree('feature_films');
}

async function loadFree(kind) {
  const body = document.getElementById('freeBody');
  if (!body) return;
  body.innerHTML = `<div class="spinner"></div>`;
  const q = kind === 'arabic'
    ? 'mediatype:movies AND language:(Arabic)'
    : `collection:${kind} AND mediatype:movies`;
  const url = 'https://archive.org/advancedsearch.php?q=' + encodeURIComponent(q) +
    '&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=year&fl%5B%5D=downloads&fl%5B%5D=description' +
    '&sort%5B%5D=downloads+desc&rows=24&page=1&output=json';
  try {
    const r = await fetch(url);
    const j = await r.json();
    const docs = (j.response && j.response.docs) || [];
    freeCache = docs;
    if (!docs.length) { body.innerHTML = `<div class="empty">مفيش نتايج.</div>`; return; }
    body.innerHTML = `<div class="grid">${docs.map((d, i) => `
      <div class="card" data-free-idx="${i}">
        <div class="poster-wrap">
          <img class="poster" loading="lazy" src="https://archive.org/services/img/${encodeURIComponent(d.identifier)}"
            alt="${esc(d.title)}" onerror="this.style.opacity=.2">
          <span class="type-badge">مجاني</span>
        </div>
        <div class="t">${esc(d.title || d.identifier)}</div>
        <div class="y">${esc(d.year || '')}</div>
      </div>`).join('')}</div>
      <p class="note" style="margin-top:14px">دي أفلام ملك عام (Public Domain) بتتفرج جوه التطبيق مباشرة، من أرشيف الإنترنت.</p>`;
    bind();
  } catch (e) {
    body.innerHTML = `<div class="empty">مش قادر أوصل لأرشيف الإنترنت دلوقتي.</div>`;
  }
}

function openPlayer(identifier, title) {
  const modal = document.getElementById('playerModal');
  document.getElementById('playerTitle').textContent = title || 'مشاهدة';
  document.getElementById('playerFrame').src = `https://archive.org/embed/${encodeURIComponent(identifier)}`;
  modal.classList.add('open');
}

function closePlayer() {
  const modal = document.getElementById('playerModal');
  modal.classList.remove('open');
  document.getElementById('playerFrame').src = 'about:blank';
}

/* ---------- router ---------- */
function currentRoute() {
  const h = location.hash || '#/home';
  return h.replace(/^#\/?/, '').split('/').filter(Boolean);
}

async function route() {
  const p = currentRoute();
  window.scrollTo(0, 0);
  document.querySelectorAll('.tab').forEach(b => {
    const go = b.dataset.go || '';
    b.classList.toggle('active', go === '#/' + (p[0] || 'home'));
  });
  const q = document.getElementById('q');
  if (p[0] !== 'search' && q.value) q.value = '';

  try {
    if (!p.length || p[0] === 'home') return viewHome();
    if ((p[0] === 'movie' || p[0] === 'tv') && p[1]) return viewDetail(p[0], p[1]);
    if (p[0] === 'movies' || p[0] === 'tv' || p[0] === 'cartoon') {
      return p[1] === 'top' ? viewListTop(p[0]) : viewList(p[0]);
    }
    if (p[0] === 'search') return viewSearch(decodeURIComponent(p[1] || ''));
    if (p[0] === 'free') return viewFree();
    return viewHome();
  } catch (e) {
    app.innerHTML = `<div class="empty">حصلت مشكلة في التحميل.<br>اتأكد من النت وجرّب تاني.</div>`;
  }
}

/* click delegation */
function bind() {
  // cards / chips use data-go
}

document.addEventListener('click', (e) => {
  const go = e.target.closest('[data-go]');
  if (go && go.dataset.go) {
    location.hash = go.dataset.go;
    return;
  }
  const freeBtn = e.target.closest('[data-free]');
  if (freeBtn) {
    document.querySelectorAll('[data-free]').forEach(b => b.classList.remove('active'));
    freeBtn.classList.add('active');
    loadFree(freeBtn.dataset.free);
    return;
  }
  const freeItem = e.target.closest('[data-free-idx]');
  if (freeItem && freeCache) {
    const d = freeCache[Number(freeItem.dataset.freeIdx)];
    if (d) openPlayer(d.identifier, d.title);
  }
});

document.getElementById('searchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const v = document.getElementById('q').value.trim();
  if (!v) return;
  location.hash = '#/search/' + encodeURIComponent(v);
});

document.getElementById('playerClose').addEventListener('click', closePlayer);

/* ---------- PWA ---------- */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const b = document.getElementById('installBtn');
  b.hidden = false;
  b.onclick = async () => {
    b.hidden = true;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  };
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

window.addEventListener('hashchange', route);
route();
