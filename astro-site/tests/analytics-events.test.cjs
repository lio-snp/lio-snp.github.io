const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../public/analytics-events.js'), 'utf8');
function harness(tracker) {
  let click;
  const events = [];
  vm.runInNewContext(source, {
    URL,
    document: { addEventListener: (type, handler) => {
      assert.equal(type, 'click');
      click = handler;
    } },
    window: {
      location: { href: 'https://lio-snp.github.io/', origin: 'https://lio-snp.github.io' },
      umami: tracker === undefined ? { track: (name, data) => events.push([name, JSON.parse(JSON.stringify(data))]) } : tracker,
    },
  });
  return {
    events,
    click: (element) => click({
      target: { closest: () => element },
      preventDefault: () => assert.fail('Analytics must not cancel a click'),
      stopPropagation: () => assert.fail('Analytics must not block other handlers'),
    }),
  };
}
const button = (dataset = {}, id = '') => ({ dataset, id, tagName: 'BUTTON' });
const link = (href) => ({ dataset: {}, tagName: 'A', href });

test('dynamic research and cat controls produce one named event each', () => {
  const h = harness();
  h.click(button({ paper: 'gift' }));
  h.click(button({ cite: 'eventalign' }));
  h.click(button({ project: 'sme' }));
  h.click(button({}, 'pet-preview'));
  assert.deepEqual(h.events, [
    ['paper_open', { paper: 'gift' }],
    ['citation_open', { paper: 'eventalign' }],
    ['research_path_select', { project: 'sme' }],
    ['cat_call', {}],
  ]);
});

test('outbound events contain labels, never email addresses or query strings', () => {
  const h = harness();
  h.click(link('mailto:private@example.com?subject=private'));
  h.click(link('https://scholar.google.com/citations?user=private'));
  h.click(link('/en/cv/'));
  h.click(link('#research-path'));
  h.click(link('https://example.com/en/cv/'));
  h.click(null);
  assert.deepEqual(h.events, [
    ['contact_email', {}], ['profile_open', { profile: 'scholar' }], ['cv_open', {}],
  ]);
});

test('missing, throwing, or rejected trackers leave interactions intact', async () => {
  for (const tracker of [null, { track: () => { throw Error('blocked'); } }, { track: () => Promise.reject(Error('offline')) }]) {
    assert.doesNotThrow(() => harness(tracker).click(button({}, 'pet-preview')));
  }
  await new Promise((resolve) => setImmediate(resolve));
});
