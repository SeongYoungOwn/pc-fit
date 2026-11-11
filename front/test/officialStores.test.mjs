import test from 'node:test';
import assert from 'node:assert/strict';
import { officialStores } from '../src/services/officialStores.mjs';

test('mobile products offer official carriers while laptops only offer their manufacturer', () => {
  for (const category of ['Smartphones', 'Tablets', 'Smartwatches']) {
    const stores = officialStores({ category, brand: ' Samsung ' });
    assert.equal(stores.manufacturer.name, '삼성닷컴');
    assert.equal(stores.carriers.length, 3);
    for (const store of stores.carriers) assert.equal(new URL(store.url).protocol, 'https:');
  }
  assert.equal(officialStores({ category: 'Laptops', brand: 'ASUS' }).carriers.length, 0);
  assert.equal(officialStores({ category: 'Laptops', brand: 'unknown' }).manufacturer, null);
  assert.equal(officialStores({ brand: '__proto__' }).manufacturer, null);
});

test('verified product pages override only the matching store and product', () => {
  const apple = officialStores({ id: 'official_apple_125089', brand: 'Apple', category: 'Smartphones' });
  assert.equal(apple.manufacturer.url, 'https://www.apple.com/kr/shop/buy-iphone/iphone-17');
  assert.equal(apple.manufacturer.isProductPage, true);
  assert.equal(apple.carriers.length, 3);
  assert.ok(apple.carriers.every(store => !store.isProductPage));
  const galaxy = officialStores({ id: '65d7299fce4ffc3791ad6c99', brand: 'Samsung', category: 'Smartphones' });
  assert.match(galaxy.carriers[0].url, /productGrpId=000006332/);
  assert.equal(galaxy.carriers[0].isProductPage, true);
  assert.equal(galaxy.carriers[1].url, 'https://shop.kt.com/');
  assert.equal(galaxy.carriers[1].isProductPage, false);
});

test('unverified models keep home links without borrowing another generation page', () => {
  for (const id of ['older-iphone', '__proto__', undefined]) {
    const stores = officialStores({ id, brand: 'Apple', category: 'Smartphones' });
    assert.equal(stores.manufacturer.url, 'https://www.apple.com/kr/shop');
    assert.equal(stores.manufacturer.isProductPage, false);
    assert.equal(stores.carriers.length, 3);
  }
  assert.deepEqual(officialStores(null), { manufacturer: null, carriers: [] });
});
