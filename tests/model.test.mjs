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
