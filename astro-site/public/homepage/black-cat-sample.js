// One choreography for the daily two-hour visit and the optional 84-second preview.
function catVisitScene(elapsed, duration) {
  if (elapsed < 0 || elapsed >= duration) return { phase: 'away' };
  if (elapsed < 18000) return { phase:'enter', group:'walk', frame:Math.floor(elapsed / 260) % 4, progress:elapsed / 18000 };
  if (elapsed < 21000) return { phase:'settle', group:elapsed < 19000 ? 'idle' : elapsed < 20200 ? 'sit' : 'curl', frame:0 };
  const wakeAt = duration - 21000;
  const exitAt = duration - 18000;
  if (elapsed < wakeAt) return { phase:'sleep', group:'sleep', frame:Math.floor((elapsed - 21000) / 3200) % 2 };
  if (elapsed < exitAt) return { phase:'wake', group:elapsed < wakeAt + 1000 ? 'curl' : elapsed < wakeAt + 2100 ? 'sit' : 'idle', frame:0 };
  return { phase:'exit', group:'walk', frame:Math.floor((elapsed - exitAt) / 260) % 4, progress:(elapsed - exitAt) / 18000 };
}

function dailyCatScene(now) {
  // Beijing uses UTC+8. UTC getters avoid the visitor's local timezone entirely.
  const beijing = new Date(now + 8 * 60 * 60 * 1000);
  const time = ((beijing.getUTCHours() * 60 + beijing.getUTCMinutes()) * 60 + beijing.getUTCSeconds()) * 1000 + beijing.getUTCMilliseconds();
  return catVisitScene(time - 12 * 60 * 60 * 1000, 2 * 60 * 60 * 1000);
}

if (typeof module !== 'undefined' && module.exports) module.exports = { catVisitScene, dailyCatScene };

(() => {
  if (typeof document === 'undefined') return;
  const cat = document.getElementById('black-cat');
  const sprite = document.getElementById('pet-frame');
  const track = document.querySelector('.pet-track');
  const preview = document.getElementById('pet-preview');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const frames = {
    walk: [[150,383,324,508], [489,383,676,510], [805,382,995,509], [1134,382,1326,511]],
    idle: [[157,137,319,272]],
    sit: [[496,594,645,732]],
    curl: [[820,890,985,976]],
    sleep: [[820,890,985,976], [1153,894,1314,977]]
  };
  let previewStart = null, previousFrame = '', raf = 0, timer = 0;

  function drawFrame(group, index) {
    const key = `${group}:${index}`;
    if (key === previousFrame) return;
    previousFrame = key;
    const [x1, , x2, y2] = frames[group][index];
    sprite.style.backgroundPosition = `${(200 - (x2 - x1)) / 2 - x1}px ${154 - y2}px`;
    cat.dataset.frame = key;
  }

  function endPreview() {
    previewStart = null;
    preview.setAttribute('aria-pressed', 'false');
  }

  function sync() {
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    if (document.hidden) return;
    const now = Date.now();
    if (previewStart !== null && now - previewStart >= 84000) endPreview();
    const scene = previewStart === null ? dailyCatScene(now) : catVisitScene(now - previewStart, 84000);
    cat.dataset.mode = previewStart === null ? 'daily' : 'preview';
    cat.dataset.phase = scene.phase;
    cat.hidden = scene.phase === 'away';

    if (!cat.hidden) {
      const width = cat.offsetWidth;
      const center = (track.clientWidth - width) / 2;
      let x = center;
      if (reduced.matches) {
        drawFrame('sleep', 0);
      } else {
        if (scene.phase === 'enter') x = -width + (center + width) * scene.progress;
        if (scene.phase === 'exit') x = center + (track.clientWidth - center) * scene.progress;
        drawFrame(scene.group, scene.frame);
      }
      cat.style.transform = `translateX(${x.toFixed(2)}px)`;
    }

    // Only walking needs frame-rate updates. Sleeping and absent states use one
    // small clock check per second; returning to the tab resyncs immediately.
    if (!reduced.matches && (scene.phase === 'enter' || scene.phase === 'exit')) raf = requestAnimationFrame(sync);
    else timer = setTimeout(sync, scene.phase === 'settle' || scene.phase === 'wake' ? 100 : 1000);
  }

  preview.addEventListener('click', () => {
    if (previewStart === null) {
      previewStart = Date.now();
      preview.setAttribute('aria-pressed', 'true');
    }
    track.scrollIntoView({block:'center', behavior:reduced.matches ? 'instant' : 'smooth'});
    sync();
  });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pageshow', sync);
  window.addEventListener('resize', sync, {passive:true});
  reduced.addEventListener('change', sync);
  sync();

  function updateSampleNav() {
    let current = 'about';
    for (const section of document.querySelectorAll('.page-section')) {
      if (section.id === 'news' && innerWidth > 760) continue;
      if (section.getBoundingClientRect().top <= 170) current = section.id;
    }
    if (location.hash === '#news' && Math.abs(document.getElementById('news').getBoundingClientRect().top) < 170) current = 'news';
    for (const link of document.querySelectorAll('.journal-nav [data-nav]')) {
      const selected = link.dataset.nav === current;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current');
    }
  }
  ['scroll','resize','hashchange'].forEach(event => window.addEventListener(event, updateSampleNav, {passive:true}));
  updateSampleNav();
})();
