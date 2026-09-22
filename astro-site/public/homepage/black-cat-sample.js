// Bounds in the supplied 1448 × 1086 sheet. Clip each pose separately so that
// its neighbors never leak into the frame; every pose shares the same floor.
const CAT_SPRITES = {
  walk: [[49,260,180,351], [227,254,359,352], [405,261,538,353], [577,256,715,351], [752,260,885,352], [926,251,1059,352], [1098,260,1231,352], [1270,259,1409,352]],
  idle: [[59,92,175,187], [240,92,351,187], [421,93,535,187], [589,92,704,187]],
  sit: [[61,576,172,684], [238,570,348,683], [408,571,518,683], [588,570,700,683], [767,579,875,685], [941,570,1051,683], [1108,569,1220,685], [1285,575,1392,684]],
  curl: [[934,785,1056,870], [1110,794,1233,866], [1277,800,1401,866]],
  sleep: [[61,954,180,1019], [238,955,353,1019], [414,953,529,1019], [584,956,700,1019], [759,950,880,1019], [932,955,1049,1019], [1111,952,1225,1018], [1284,956,1393,1018]]
};

const CAT_SETTLE = [
  ['sit',1,220], ['sit',2,260], ['sit',3,260], ['sit',4,300],
  ['sit',5,220], ['sit',6,240], ['sit',7,280],
  ['curl',0,320], ['curl',1,300], ['curl',2,300], ['sleep',1,300]
];
const CAT_WAKE = [
  ['sleep',0,180], ['sleep',4,200], ['curl',2,160], ['curl',1,220],
  ['curl',0,240], ['sit',6,240], ['sit',5,240], ['sit',4,240],
  ['idle',0,350], ['idle',1,110], ['idle',2,110], ['idle',3,350], ['walk',0,360]
];

function catSequenceFrame(elapsed, sequence) {
  for (const [group, frame, duration] of sequence) {
    if (elapsed < duration) return { group, frame };
    elapsed -= duration;
  }
  const [group, frame] = sequence[sequence.length - 1];
  return { group, frame };
}

// One choreography for the daily two-hour visit and the optional 84-second visit.
function catVisitScene(elapsed, duration) {
  if (elapsed < 0 || elapsed >= duration) return { phase: 'away' };
  if (elapsed < 18000) return { phase:'enter', group:'walk', frame:Math.floor(elapsed / 110) % 8, progress:elapsed / 18000 };
  if (elapsed < 21000) return { phase:'settle', ...catSequenceFrame(elapsed - 18000, CAT_SETTLE) };
  const wakeAt = duration - 21000;
  const exitAt = duration - 18000;
  if (elapsed < wakeAt) {
    // Mostly closed eyes, with a brief sleepy peek every 24 seconds.
    const rest = (elapsed - 21000) % 24000;
    const breathing = [1,2,3,5,6,7,6,5,3,2];
    const frame = rest >= 22800 && rest < 23020 ? 0
      : rest >= 23020 && rest < 23240 ? 4
      : breathing[Math.floor(rest / 600) % breathing.length];
    return { phase:'sleep', group:'sleep', frame };
  }
  if (elapsed < exitAt) return { phase:'wake', ...catSequenceFrame(elapsed - wakeAt, CAT_WAKE) };
  return { phase:'exit', group:'walk', frame:Math.floor((elapsed - exitAt) / 110) % 8, progress:(elapsed - exitAt) / 18000 };
}

function dailyCatScene(now) {
  // Beijing uses UTC+8. UTC getters avoid the visitor's local timezone entirely.
  const beijing = new Date(now + 8 * 60 * 60 * 1000);
  const time = ((beijing.getUTCHours() * 60 + beijing.getUTCMinutes()) * 60 + beijing.getUTCSeconds()) * 1000 + beijing.getUTCMilliseconds();
  return catVisitScene(time - 12 * 60 * 60 * 1000, 2 * 60 * 60 * 1000);
}

if (typeof module !== 'undefined' && module.exports) module.exports = { catVisitScene, dailyCatScene, CAT_SPRITES };

(() => {
  if (typeof document === 'undefined') return;
  const cat = document.getElementById('black-cat');
  const sprite = document.getElementById('pet-frame');
  const track = document.querySelector('.pet-track');
  const preview = document.getElementById('pet-preview');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let previewStart = null, previousFrame = '', raf = 0, timer = 0;

  function drawFrame(group, index) {
    const key = `${group}:${index}`;
    if (key === previousFrame) return;
    previousFrame = key;
    const [x1, y1, x2, y2] = CAT_SPRITES[group][index];
    // One uniform scale preserves the previous visual size across the denser
    // sheet. Center the silhouette and register its feet to the divider.
    const scale = 1.25;
    const width = (x2 - x1) * scale;
    sprite.style.width = `${width}px`;
    sprite.style.height = `${(y2 - y1) * scale}px`;
    sprite.style.left = `${(200 - width) / 2}px`;
    sprite.style.backgroundPosition = `${-x1 * scale}px ${-y1 * scale}px`;
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
        drawFrame('sleep', 1);
      } else {
        if (scene.phase === 'enter') x = -width + (center + width) * scene.progress;
        if (scene.phase === 'exit') x = center + (track.clientWidth - center) * scene.progress;
        drawFrame(scene.group, scene.frame);
      }
      cat.style.transform = `translateX(${x.toFixed(2)}px)`;
    }

    // Walking uses smooth translation. Other visible poses are sampled often
    // enough to retain short blinks; drawFrame skips unchanged sprite writes.
    if (!reduced.matches && (scene.phase === 'enter' || scene.phase === 'exit')) raf = requestAnimationFrame(sync);
    else timer = setTimeout(sync, scene.phase === 'away' || reduced.matches ? 1000 : 80);
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
