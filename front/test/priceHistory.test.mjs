import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHistory, priceWindow, summarizeHistory, chartPoints, exampleHistory } from '../src/services/priceHistory.mjs';

test('absent prices stay absent, never become zero or demo prices', () => {
  assert.equal(summarizeHistory([]), null);
  assert.deepEqual(chartPoints([]), []);
  assert.deepEqual(normalizeHistory([{ date: '2026-11-07', price: null }, { date: '2026-11-07', price: 0 }, { date: 'invalid', price: 100 }, { date: '2026-11-07', price: '100' }]), []);
});
test('period includes the start day, excludes older and future prices', () => {
  const data = ['2026-10-08', '2026-10-09', '2026-11-07', '2026-11-08'].map(date => ({ date, price: 100 }));
  assert.deepEqual(priceWindow(data, 30, new Date('2026-11-07T12:00:00Z')).map(row => row.date), ['2026-10-09', '2026-11-07']);
});
test('summary sorts records and measures real first-to-last change without mutating input', () => {
  const data = [{ date: '2026-11-07', price: 80 }, { date: '2026-11-01', price: 100 }, { date: '2026-11-03', price: 110 }];
  assert.deepEqual(summarizeHistory(data), { latest: 80, low: 80, high: 110, change: -20, percent: -20 });
  assert.equal(data[0].price, 80);
});
test('flat or single-day charts stay finite and irregular dates have proportional spacing', () => {
  for (const rows of [[{date:'2026-11-01',price:100}], [{date:'2026-11-01',price:100},{date:'2026-11-07',price:100}]]) {
    assert.ok(chartPoints(rows).every(point => Number.isFinite(point.x) && Number.isFinite(point.y)));
  }
  const points = chartPoints([{date:'2026-11-01',price:100},{date:'2026-11-02',price:90},{date:'2026-11-05',price:80}],400);
  assert.deepEqual(points.map(point => point.x),[0,100,400]);
});
test('demo records are explicitly labeled and time range changes their count', () => {
  const now = new Date('2026-11-07T12:00:00Z'), rows = exampleHistory(now);
  assert.ok(rows.every(row => row.source === '화면 확인용 예시'));
  assert.equal(priceWindow(rows,90,now).length,13);
  assert.equal(priceWindow(rows,30,now).length,5);
});
