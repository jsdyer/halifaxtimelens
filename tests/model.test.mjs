import test from 'node:test';import assert from 'node:assert/strict';import {readView,wmsOptions,label} from '../web/model.mjs';
test('shared views round trip valid years, coordinates and reveal position',()=>{const v=readView('#lat=44.66&lng=-63.58&z=16&split=75&left=1977&right=streets');assert.equal(v.lat,44.66);assert.equal(v.left,'1977');assert.equal(v.right,'streets');assert.equal(v.split,75);});
test('invalid shared parameters cannot select arbitrary layers or leave the footprint',()=>{const v=readView('#lat=90&lng=NaN&z=99&split=-2&left=evil');assert.equal(v.lat,44.6486);assert.equal(v.zoom,14);assert.equal(v.split,50);assert.equal(v.left,'1947');});
test('WMS time uses the exact supported source dimensions',()=>{assert.equal(wmsOptions('1947').time,'1947-07-01T12:00:00Z');assert.equal(wmsOptions('1977').layers,'halifax');assert.throws(()=>wmsOptions('2026'));assert.equal(label('streets'),'Modern street map');});

import {nearPhotos} from '../web/model.mjs';
test('a nearby point can have no catalogue URL and year/radius constrain the selection',()=>{
 const photos=[['a','A',1955,44.65,-63.57,''],['b','B',2001,44.652,-63.57,''],['c','C',2001,45.0,-63.57,'']];
 assert.deepEqual(nearPhotos(photos,44.65,-63.57,1).map(r=>r.photo[0]),['a','b']);
 assert.deepEqual(nearPhotos(photos,44.65,-63.57,1,'2001').map(r=>r.photo[0]),['b']);
});

import {nearbyYears, photoCollection, archiveSource} from '../web/model.mjs';
import {stories} from '../web/stories.mjs';
import {readFileSync} from 'node:fs';
const index = JSON.parse(readFileSync(new URL('../web/data/photos.json', import.meta.url)));
test('The ferry landing year comparison counts the complete selected radius', () => {
  const groups = nearbyYears(nearPhotos(index.photos, 44.6497, -63.5714, 1));
  assert.deepEqual(groups.map(g => [g.year, g.count]), [[1955, 2], [2001, 14]]);
  assert.ok(groups.every(g => g.closest.distance <= 1 && g.closest.photo[2] === g.year));
  assert.deepEqual(nearbyYears([]), []);
});
test('Notebook locations use GeoJSON longitude order and preserve empty catalogue URLs', () => {
  const collection = photoCollection([['id', 'ref', 2001, 44.64, -63.57, '']], '2026-11-19');
  assert.deepEqual(collection.features[0].geometry.coordinates, [-63.57, 44.64]);
  assert.equal(collection.features[0].properties.catalogue_url, null);
  assert.equal(collection.source, archiveSource);
});
test('Each map guide links two distinct archive references and a view within the mosaic', () => {
  for (const story of Object.values(stories)) {
    assert.equal(new Set(story.records.map(record => record.ref)).size, 2);
    assert.ok(story.records.every(record => record.url.startsWith('https://archives.novascotia.ca/') && record.date));
    assert.ok(story.center[0] > 44.55 && story.center[0] < 44.73);
  }
});
