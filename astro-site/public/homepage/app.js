const data = window.SITE_DATA;
const byId = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

const citationById = new Map(data.featured.filter((item) => item.citation).map((item) => [item.id, item.citation]));
for (const item of data.publications) {
  if (item.citation) citationById.set(item.id, item.citation);
}

function paperTitle(item) {
  const title = escapeHtml(item.title);
  return item.href
    ? `<a href="${escapeHtml(item.href)}" data-paper="${escapeHtml(item.id)}" target="_blank" rel="noopener noreferrer">${title}</a>`
    : title;
}

function citationButton(item) {
  return citationById.has(item.id)
    ? `<button class="cite-button" type="button" data-cite="${escapeHtml(item.id)}">BibTeX</button>`
    : '';
}

function renderNews() {
  byId('news-list').innerHTML = data.news.map((item) => `
    <li class="news-item"><time>${escapeHtml(item.date)}</time><div>${item.text}</div></li>
  `).join('');
}

function featuredImage(item) {
  if (item.thumbnail?.kind === 'eventalign') return `
    <div class="featured-thumbnail event-thumbnail" role="img" aria-label="${escapeHtml(item.imageAlt)}">
      <img class="event-plot" src="${escapeHtml(item.thumbnail.plot)}" alt="" width="1650" height="574" />
      <span class="event-wash" aria-hidden="true"></span>
      <img class="event-monkey" src="${escapeHtml(item.thumbnail.subject)}" alt="" width="1275" height="1234" />
      <span class="event-eyebrow" aria-hidden="true">EVENT EXPOSURE</span>
      <strong class="event-hook" aria-hidden="true">1 DAY <span>vs</span><br />30 DAYS</strong>
    </div>
  `;
  if (item.thumbnail?.kind === 'gift') return `
    <div class="featured-thumbnail meme-thumbnail" role="img" aria-label="${escapeHtml(item.imageAlt)}">
      <img class="meme-plot" src="${escapeHtml(item.thumbnail.plot)}" alt="" width="2601" height="1881" />
      <span class="meme-wash" aria-hidden="true"></span>
      <span class="meme-eyebrow" aria-hidden="true">GIFT <span>vs</span> PPO</span>
      <strong class="meme-hook" aria-hidden="true">WHO WINS?</strong>
      <img class="meme-subject" src="${escapeHtml(item.thumbnail.subject)}" alt="" width="1242" height="1266" />
    </div>
  `;
  return `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt)}" width="640" height="282" />`;
}

function renderFeatured() {
  byId('featured-list').innerHTML = data.featured.map((item) => `
    <article class="featured-card">
      ${featuredImage(item)}
      <div class="featured-body">
        <h3>${paperTitle(item)}</h3>
        <p class="venue">${escapeHtml(item.venue)}</p>
        <div class="featured-bottom"><p>${item.authors.map((name) => name === 'Yanlin Liu' ? `<strong>${escapeHtml(name)}</strong>` : escapeHtml(name)).join(', ')}</p>${citationButton(item)}</div>
      </div>
    </article>
  `).join('');
}

function renderResearchPath() {
  const root = byId('research-path');
  const scroll = byId('research-path-scroll');
  const canvas = byId('research-path-canvas');
  const drawing = byId('research-path-drawing');
  const marks = byId('research-path-marks');
  const monthWidth = 48;
  const leftInset = 40;
  const axisY = 398;
  const rows = { lending: 90, sme: 175, eventalign: 265, gift: 355, pairwise: 90 };
  const dateForMonth = (month) => new Date(`${month}-01T00:00:00Z`);
  const origin = dateForMonth(data.researchPath[0].start);
  const today = new Date();
  const now = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' });
  const dateLabel = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  const x = (date) => {
    const months = (date.getUTCFullYear() - origin.getUTCFullYear()) * 12 + date.getUTCMonth() - origin.getUTCMonth();
    const daysInMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    return leftInset + (months + (date.getUTCDate() - 1) / daysInMonth) * monthWidth;
  };
  const projects = data.researchPath.map((project) => {
    const start = dateForMonth(project.start);
    const lastMonth = project.end && dateForMonth(project.end);
    // A completed end month is inclusive: May–July spans all three months.
    const end = lastMonth ? new Date(Date.UTC(lastMonth.getUTCFullYear(), lastMonth.getUTCMonth() + 1, 1)) : now;
    const period = !lastMonth ? `${dateLabel.format(start)}–present`
      : start.getUTCFullYear() === lastMonth.getUTCFullYear()
        ? `${monthLabel.format(start)}–${dateLabel.format(lastMonth)}`
        : `${dateLabel.format(start)}–${dateLabel.format(lastMonth)}`;
    return { ...project, left: x(start), right: x(end), y: rows[project.id], period };
  });
  const axisEnd = Math.max(x(now), ...projects.map((project) => project.right));
  const width = Math.max(1440, axisEnd + 80, ...projects.map((project) => project.left + 325));
  canvas.style.width = `${width}px`;
  drawing.setAttribute('viewBox', `0 0 ${width} 435`);

  function mark(tag, attributes, text) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    if (text) element.textContent = text;
    marks.appendChild(element);
    return element;
  }

  mark('line', { class: 'path-axisline', x1: 24, y1: axisY, x2: axisEnd + 20, y2: axisY });
  for (let month = new Date(origin); x(month) <= axisEnd; month.setUTCMonth(month.getUTCMonth() + 6)) {
    const position = x(month);
    mark('line', { class: 'path-gridline', x1: position, y1: 6, x2: position, y2: axisY });
    mark('line', { class: 'path-axisline', x1: position, y1: axisY - 5, x2: position, y2: axisY + 5 });
    // Keep the latest tick label clear of the current-date label.
    if (Math.abs(position - x(now)) > 100) {
      mark('text', { class: 'path-time', x: position, y: axisY + 24 }, dateLabel.format(month));
    }
  }
  mark('line', { class: 'path-axisline', x1: x(now), y1: axisY - 5, x2: x(now), y2: axisY + 5 });
  mark('text', { class: 'path-time', x: x(now), y: axisY + 24, 'text-anchor': 'end' }, 'Now');

  byId('research-path-nodes').innerHTML = projects.map((project) => `
    <button type="button" class="path-node" data-project="${escapeHtml(project.id)}" style="left:${project.left}px;top:${project.y - 75}px" aria-pressed="false" aria-label="${escapeHtml(`${project.name}. ${project.period}. ${project.note}`)}" title="${escapeHtml(project.period)}">
      <span class="path-node-heading"><span class="path-node-name">${escapeHtml(project.name)}</span><span class="path-node-period" aria-hidden="true">${escapeHtml(project.period)}</span></span>
      <span class="path-node-note">${escapeHtml(project.note)}</span>
    </button>
  `).join('');

  for (const project of projects) {
    const duration = mark('g', { class: 'path-project', 'data-duration': project.id });
    duration.appendChild(mark('line', { class: 'path-duration', x1: project.left, y1: project.y, x2: project.right, y2: project.y }));
    duration.appendChild(mark('circle', { class: 'path-dot', cx: project.left, cy: project.y, r: 4 }));
    duration.appendChild(project.end
      ? mark('circle', { class: 'path-end', cx: project.right, cy: project.y, r: 3 })
      : mark('path', { class: 'path-duration', d: `M${project.right - 5} ${project.y - 4} L${project.right} ${project.y} L${project.right - 5} ${project.y + 4}` }));

    for (const sourceId of project.from || []) {
      const source = projects.find((item) => item.id === sourceId);
      const targetX = project.left;
      const route = source.end
        ? `M${source.right} ${source.y} H${source.right + 305} C${targetX - 90} ${source.y} ${targetX - 140} ${project.y} ${targetX - 7} ${project.y}`
        : `M${targetX} ${source.y} C${targetX - 64} ${source.y} ${targetX - 64} ${project.y} ${targetX - 7} ${project.y}`;
      mark('path', { class: 'path-connection', d: route, 'data-from': sourceId, 'data-to': project.id, 'marker-end': 'url(#path-direction)' });
    }
  }

  root.addEventListener('click', (event) => {
    const node = event.target.closest('.path-node');
    if (!node) return;
    const active = node.getAttribute('aria-pressed') === 'true' ? '' : node.dataset.project;
    root.querySelectorAll('.path-node').forEach((item) => item.setAttribute('aria-pressed', String(item.dataset.project === active)));
    root.querySelectorAll('.path-project').forEach((item) => item.classList.toggle('is-active', item.dataset.duration === active));
    root.querySelectorAll('.path-connection').forEach((item) => item.classList.toggle('is-active', item.dataset.from === active || item.dataset.to === active));
  });
  scroll.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const offsets = { ArrowLeft: -80, ArrowRight: 80, Home: -scroll.scrollWidth, End: scroll.scrollWidth };
    if (!(event.key in offsets)) return;
    event.preventDefault();
    scroll.scrollBy({ left: offsets[event.key] });
  });
}

function renderFinance() {
  byId('finance-list').innerHTML = data.finance.map((item) => `
    <article class="finance-item">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.authors)}</p>
      <div class="paper-meta"><em>${escapeHtml(item.venue)}</em><span class="year-pill">${escapeHtml(item.year)}</span></div>
    </article>
  `).join('');
}

function addSelectOptions(select, allLabel, values) {
  select.innerHTML = `<option value="">${escapeHtml(allLabel)}</option>`
    + values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
}

const filters = {
  year: byId('filter-year'),
  type: byId('filter-type'),
  topic: byId('filter-topic')
};
let page = 1;
const pageSize = 3;

function renderPublications() {
  const matches = data.publications.filter((item) =>
    (!filters.year.value || String(item.year) === filters.year.value)
    && (!filters.type.value || item.type === filters.type.value)
    && (!filters.topic.value || item.topics.includes(filters.topic.value))
  );
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  page = Math.min(page, pages);
  const visible = matches.slice((page - 1) * pageSize, page * pageSize);
  byId('publication-list').innerHTML = visible.length ? visible.map((item) => `
    <article class="publication-item">
      <h3>${paperTitle(item)}</h3>
      <p class="authors">${escapeHtml(item.authors)}</p>
      <div class="paper-meta"><em>${escapeHtml(item.venue)}</em><span class="year-pill">${item.year}</span><span class="type-pill">${escapeHtml(item.type)}</span>${citationButton(item)}</div>
    </article>
  `).join('') : '<p class="empty-state">No research matches these filters.</p>';

  byId('results-count').textContent = `${matches.length} research ${matches.length === 1 ? 'item' : 'items'}, page ${page} of ${pages}`;
  byId('pagination').hidden = pages === 1;
  byId('pagination').innerHTML = pages === 1 ? '' : `
    <button type="button" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Previous page">←</button>
    ${Array.from({ length: pages }, (_, i) => `<button type="button" data-page="${i + 1}" ${page === i + 1 ? 'aria-current="page"' : ''}>${i + 1}</button>`).join('')}
    <button type="button" data-page="${page + 1}" ${page === pages ? 'disabled' : ''} aria-label="Next page">→</button>
  `;
}

function renderEducation() {
  byId('education-list').innerHTML = data.education.map((item) => `
    <li><div><h3>${escapeHtml(item.degree)}</h3><p>${escapeHtml(item.institution)}</p></div><span>${escapeHtml(item.period)}</span></li>
  `).join('');
}

function updateScrollUI() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  document.querySelector('.scroll-progress').style.width = `${scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0}%`;
  byId('back-to-top').classList.toggle('visible', window.scrollY > 260);
  let current = 'about';
  for (const section of document.querySelectorAll('.page-section')) {
    if (section.getBoundingClientRect().top <= 170) current = section.id;
  }
  for (const link of document.querySelectorAll('[data-nav]')) {
    const selected = link.dataset.nav === current;
    link.classList.toggle('active', selected);
    if (selected) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}

function openCitation(id) {
  const text = citationById.get(id);
  if (!text) return;
  byId('citation-text').textContent = text;
  byId('copy-citation').querySelector('span').textContent = 'Copy';
  byId('citation-dialog').showModal();
}

renderNews();
renderFeatured();
renderResearchPath();
renderFinance();
renderEducation();
addSelectOptions(filters.year, 'All years', [...new Set(data.publications.map((item) => item.year))].sort((a, b) => b - a));
addSelectOptions(filters.type, 'All types', [...new Set(data.publications.map((item) => item.type))].sort());
addSelectOptions(filters.topic, 'All topics', [...new Set(data.publications.flatMap((item) => item.topics))].sort());
renderPublications();
updateScrollUI();

Object.values(filters).forEach((select) => select.addEventListener('change', () => {
  page = 1;
  renderPublications();
}));

byId('pagination').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-page]');
  if (!button || button.disabled) return;
  page = Number(button.dataset.page);
  renderPublications();
});

document.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-cite]');
  if (button) openCitation(button.dataset.cite);
});

byId('close-citation').addEventListener('click', () => byId('citation-dialog').close());
byId('citation-dialog').addEventListener('click', (event) => {
  if (event.target === byId('citation-dialog')) byId('citation-dialog').close();
});
byId('copy-citation').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(byId('citation-text').textContent);
    byId('copy-citation').querySelector('span').textContent = 'Copied';
  } catch {
    byId('copy-citation').querySelector('span').textContent = 'Select text to copy';
  }
});
byId('back-to-top').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
window.addEventListener('scroll', updateScrollUI, { passive: true });
window.addEventListener('resize', updateScrollUI, { passive: true });
window.addEventListener('hashchange', updateScrollUI);
