const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const sandbox = {module: {exports: {}}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/homepage/black-cat-sample.js'), 'utf8'), sandbox);
const { dailyCatScene, catVisitScene, CAT_SPRITES } = sandbox.module.exports;

const sceneAt = time => dailyCatScene(Date.parse(`2026-09-22T${time}+08:00`));

test('daily visit starts at Beijing noon and is fully gone at 14:00', () => {
  assert.equal(sceneAt('11:59:59.999').phase, 'away');
  assert.deepEqual(JSON.parse(JSON.stringify(sceneAt('12:00:00.000'))), {phase:'enter', group:'walk', frame:0, progress:0});
  assert.equal(sceneAt('12:00:18.000').phase, 'settle');
  assert.equal(sceneAt('12:00:21.000').phase, 'sleep');
  assert.equal(sceneAt('13:59:38.999').phase, 'sleep');
  assert.equal(sceneAt('13:59:39.000').phase, 'wake');
  assert.equal(sceneAt('13:59:42.000').phase, 'exit');
  assert.ok(sceneAt('13:59:59.999').progress > .999);
  assert.equal(sceneAt('14:00:00.000').phase, 'away');
});

test('opening or returning at 13:00 goes directly to sleep', () => {
  assert.equal(sceneAt('13:00:00.000').phase, 'sleep');
  assert.equal(sceneAt('23:59:59.999').phase, 'away');
  assert.equal(sceneAt('00:00:00.000').phase, 'away');
});

test('the visit repeats across dates and ignores the visitor timezone', () => {
  const equivalentInstants = ['2026-09-22T12:00:09+08:00', '2026-09-22T04:00:09Z', '2026-09-21T21:00:09-07:00'];
  for (const date of equivalentInstants) assert.equal(dailyCatScene(Date.parse(date)).progress, .5);
  for (const date of ['2026-09-23', '2026-10-01', '2027-01-01']) {
    assert.equal(dailyCatScene(Date.parse(`${date}T12:30:00+08:00`)).phase, 'sleep');
    assert.equal(dailyCatScene(Date.parse(`${date}T14:00:00+08:00`)).phase, 'away');
  }
});

test('84-second manual preview retains the same movement and finishes', () => {
  assert.equal(catVisitScene(9000, 84000).progress, .5);
  assert.equal(catVisitScene(21000, 84000).phase, 'sleep');
  assert.equal(catVisitScene(63000, 84000).phase, 'wake');
  assert.equal(catVisitScene(75000, 84000).progress, .5);
  assert.equal(catVisitScene(84000, 84000).phase, 'away');
});

test('walking keeps a lazy eight-pose cadence without changing travel time', () => {
  for (const start of [0, 66000]) {
    const frames = Array.from({length:8}, (_, i) => catVisitScene(start + i * 260, 84000).frame);
    assert.deepEqual(frames, [0,1,2,3,4,5,6,7]);
    assert.equal(catVisitScene(start + 2080, 84000).frame, 0);
  }
});

test('transitions and resting use valid, varied poses from the new sheet', () => {
  const poses = {settle:new Set(), sleep:new Set(), wake:new Set()};
  for (let time = 0; time < 84000; time += 10) {
    const scene = catVisitScene(time, 84000);
    assert.ok(CAT_SPRITES[scene.group]?.[scene.frame], `missing pose at ${time}ms`);
    poses[scene.phase]?.add(`${scene.group}:${scene.frame}`);
  }
  assert.ok(poses.settle.size >= 10);
  assert.equal(poses.sleep.size, 8);
  assert.ok(poses.wake.size >= 10);
  // Sleeping starts with closed eyes, including when reduced motion is used.
  assert.equal(catVisitScene(21000, 84000).frame, 1);
});

test('every clipped pose fits the original cat stage without adjacent sprites', () => {
  for (const group of Object.values(CAT_SPRITES)) {
    for (const [x1,y1,x2,y2] of group) {
      assert.ok(x1 >= 0 && y1 >= 0 && x2 <= 1448 && y2 <= 1086);
      assert.ok((x2 - x1) * 1.25 <= 200);
      assert.ok((y2 - y1) * 1.25 <= 154);
      assert.ok(x2 > x1 && y2 > y1);
    }
  }
});
