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
    <h2 class="section">أفلام مصرية كاملة — شغّلها هنا <small>مجانًا وقانوني</small></h2>${freeRow(FREE_MOVIES, 'movie')}
    <h2 class="section">كرتون كامل — بكار <small>حلقات بتشتغل هنا</small></h2>${freeRow(FREE_SERIES, 'series')}
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


/* ---------- مكتبة المشاهدة المجانية القانونية ----------
   كل حاجة هنا بتتفرج جوه التطبيق: فيديوهات يوتيوب من القناة اللي ناشرة الفيديو،
   أو أفلام ملك عام من أرشيف الإنترنت. */

const FREE_MOVIES = [
  { key:'el-shaitan', title:'الشيطان يقدم حلا', yt:'7Gsy7KdhjME', channel:'Rerun 4K', match:['الشيطان يقدم حلا'] },
  { key:'el-melk', title:'الملك لله', yt:'NhTpYvhnE4E', channel:'Rerun 4K', match:['الملك لله'] },
  { key:'ga3altani', title:'جعلتني مجرماً', yt:'sLXkhu2q73o', channel:'Reel Movies', match:['جعلتني مجرما'] },
  { key:'el-badla', title:'البدلة', yt:'F8OdAX2s2Ak', channel:'Reel Movies', match:['البدله'] },
  { key:'el-khaliya', title:'الخلية', yt:'eIpixDQcQGQ', channel:'Reel Movies', match:['الخليه'] },
  { key:'khareg-law', title:'خارج على القانون', yt:'QXwLDo18mBM', channel:'أمير الأفلام المصرية', match:['خارج علي القانون','خارج على القانون'] },
  { key:'masgoon', title:'مسجون ترانزيت', yt:'Cgr6tHoOVIg', channel:'سكت شات', match:['مسجون ترانزيت'] },
  { key:'captain-masr', title:'كابتن مصر', yt:'94g5_Fyq96w', channel:'سينما أفلام', match:['كابتن مصر'] },
  { key:'el-khediwy', title:'الخديوي', yt:'fsNN0uuGofA', channel:'أحمد العوضي (القناة الرسمية)', match:['الخديوى','الخديوي'] },
  { key:'el-rahina', title:'الرهينة', yt:'NwzIUrTqHR8', channel:'FunnyFlix', match:['الرهينه'] }
];

const FREE_SERIES = [
  {
    key:'bakkar', title:'مسلسل بكار', channel:'EMPC KIDS · ماسبيرو أطفال', match:['بكار'],
    seasons:[
      { name:'الجزء الأول', episodes:[
        { n:1, yt:'jb8YoiLsRD4', t:'الحلقة ١' },
        { n:5, yt:'9N_oDmoYmgc', t:'الحلقة ٥' },
        { n:6, yt:'xpwujurS2S0', t:'الحلقة ٦' },
        { n:9, yt:'ZxlobKz3mJ0', t:'الحلقة ٩' }
      ]},
      { name:'الجزء الثاني', episodes:[
        { n:1, yt:'KnUlHSn23eY', t:'الجزء التاني كامل بدون فواصل' }
      ]},
      { name:'الجزء السادس', episodes:[
        { n:1, yt:'twR2FLalwAE', t:'الحلقة ١' }
      ]}
    ]
  },
  {
    key:'el-beit-beity', title:'مسلسل البيت بيتي', channel:'Screen 2000 (المنتج)', match:['البيت بيتي','بيت بيتي'],
    seasons:[
      { name:'حلقات كاملة', episodes:[
        { n:1, yt:'Pf93S0pEIO8', t:'الهروب من الفندق' },
        { n:2, yt:'Z5xZmw6rWhI', t:'العيلة المسكونة' },
        { n:3, yt:'B2dX1ybfmFo', t:'مشروع العمر' },
        { n:4, yt:'HlgXz_RZ3xo', t:'القرية الفاضية' },
        { n:5, yt:'n28G6P4oYgo', t:'ساعة منتصف الليل' },
        { n:6, yt:'7JQdxuC8Mvk', t:'لعنة الفندق' },
        { n:7, yt:'gbu7aYYNIgQ', t:'الوصية الأخيرة' },
        { n:8, yt:'A87g1YNGMpM', t:'الجار الميت' },
        { n:9, yt:'Jsv9Dm4lEIs', t:'عفاريت السطوح' },
        { n:10, yt:'etW3dSR1SGc', t:'باب السرداب' },
        { n:11, yt:'5FFqJrEDyhE', t:'هروب مستحيل' },
        { n:12, yt:'6D3oGuRt2t0', t:'المقبرة الملعونة' },
        { n:13, yt:'rZYjlMbl6Ho', t:'ليلة مع المهرج' },
        { n:14, yt:'r1Cqlz_H1WA', t:'لعنة البيت القديم' },
        { n:15, yt:'0BZir8AbQeA', t:'القصر الملعون' },
        { n:16, yt:'neL_IBhHWj8', t:'لعنة الأوضة 215' },
        { n:17, yt:'4agUqntZN4A', t:'أسرار مقفلة' },
        { n:18, yt:'w0Qei0udqEA', t:'ورطة مع عفريت' },
        { n:19, yt:'DzCgHkBGYQk', t:'لعنة الورقة' },
        { n:20, yt:'H6JU0JF7LJ4', t:'عفاريت القصر' }
      ]}
    ]
  }
];

const ytThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

function normAr(s) {
  return String(s || '')
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim().toLowerCase();
}

function findFree(item) {
  const keys = [item.title, item.name, item.original_title, item.original_name]
    .filter(Boolean).map(normAr);
  const hit = (list) => list.find(f => (f.match || []).some(m => keys.includes(normAr(m))));
  const s = hit(FREE_SERIES);
  if (s) return { kind: 'series', item: s };
  const m = hit(FREE_MOVIES);
  if (m) return { kind: 'movie', item: m };
  return null;
}

function freeCard(f, kind) {
  const id = kind === 'series' ? (f.seasons[0].episodes[0].yt) : f.yt;
  return `<div class="card" data-play-free="${kind}:${f.key}">
    <div class="poster-wrap">
      <img class="poster" loading="lazy" src="${ytThumb(id)}" alt="${esc(f.title)}">
      <span class="badge play-badge">▶ شغّل</span>
    </div>
    <div class="t">${esc(f.title)}</div>
    <div class="y">${esc(f.channel)}</div>
  </div>`;
}

function freeRow(list, kind) {
  return `<div class="row-scroll">${list.map(f => freeCard(f, kind)).join('')}</div>`;
}

function playYouTube(yt, title) {
  const modal = document.getElementById('playerModal');
  document.getElementById('playerTitle').textContent = title || 'مشاهدة';
  document.getElementById('playerFrame').src =
    `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  modal.classList.add('open');
}

function epAll(s) {
  const out = [];
  s.seasons.forEach((se, si) => se.episodes.forEach(e => out.push({ ...e, season: si, seasonName: se.name })));
  return out;
}

function playFree(kind, key, epIdx) {
  if (kind === 'movie') {
    const m = FREE_MOVIES.find(x => x.key === key);
    if (m) playYouTube(m.yt, m.title);
    return;
  }
  const s = FREE_SERIES.find(x => x.key === key);
  if (!s) return;
  const ep = (epIdx === undefined || epIdx === null || epIdx === '')
    ? s.seasons[0].episodes[0] : epAll(s)[Number(epIdx)];
  if (ep) playYouTube(ep.yt, `${s.title} — ${ep.t}`);
}

function viewFreeSeries(key) {
  const s = FREE_SERIES.find(x => x.key === key);
  if (!s) { app.innerHTML = `<div class="empty">مش لاقي المسلسل ده.</div>`; return; }
  const eps = epAll(s);
  app.innerHTML = `
    <h2 class="section">${esc(s.title)} <small>${esc(s.channel)}</small></h2>
    <p class="note">اضغط على أي حلقة وهتشتغل هنا على طول، من قناة الناشر نفسها على يوتيوب.</p>
    ${s.seasons.map(se => `
      <div class="block">
        <h3>${esc(se.name)}</h3>
        <div class="eplist">
          ${se.episodes.map(e => {
            const idx = eps.findIndex(x => x.yt === e.yt);
            return `<button class="ep" data-play-free="series:${s.key}:${idx}">
              <span class="epn">▶</span><span class="ept">${esc(e.t)}</span></button>`;
          }).join('')}
        </div>
      </div>`).join('')}
  `;
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

  const free = findFree(d);
  const playBlock = free ? `
    <div class="block play-block">
      <h3>${free.kind === 'series' ? 'شغّل الحلقات هنا مجانًا' : 'شغّل الفيلم هنا مجانًا'}</h3>
      <p class="note" style="margin:0 0 10px">${esc(free.item.title)} — من قناة ${esc(free.item.channel)} على يوتيوب.</p>
      <button class="btn primary" data-play-free="${free.kind}:${free.item.key}">▶ شغّل دلوقتي</button>
      ${free.kind === 'series' ? `<button class="btn ghost" data-go="#/fs/${free.item.key}" style="margin-inline-start:8px">الحلقات</button>` : ''}
    </div>` : `
    <div class="block">
      <h3>مفيش نسخة مجانية قانونية للعمل ده</h3>
      <p class="note" style="margin:0">العمل ده مش متاح مجانًا بشكل قانوني، عشان كده مفيش زرار تشغيل هنا.
      شوف المنصات الرسمية اللي فوق، أو جرّب قسم <a href="#/free" style="color:#22d3ee">مجاني</a> اللي فيه أفلام وكرتون بيتفرجوا جوه التطبيق.</p>
    </div>`;

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
  ${playBlock}
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
    if (p[0] === 'fs' && p[1]) return viewFreeSeries(p[1]);
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
  const playBtn = e.target.closest('[data-play-free]');
  if (playBtn) {
    const parts = playBtn.dataset.playFree.split(':');
    playFree(parts[0], parts[1], parts[2]);
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
