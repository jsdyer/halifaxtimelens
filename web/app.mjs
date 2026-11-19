import {$,el,share} from './common.mjs';
import {PLACES,EXTENT,readView,label,wmsOptions} from './model.mjs';
const view=readView(location.hash),box=[[EXTENT[0][1],EXTENT[0][0]],[EXTENT[1][1],EXTENT[1][0]]];
const map=L.map('map',{scrollWheelZoom:false,minZoom:11,maxZoom:18,maxBounds:box,maxBoundsViscosity:.7}).setView([view.lat,view.lng],view.zoom);
const right=L.map('right-map',{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,touchZoom:false,minZoom:11,maxZoom:18}).setView(map.getCenter(),map.getZoom());
L.control.scale({imperial:false}).addTo(map);map.attributionControl.addAttribution('<a href="https://open.canada.ca/data/en/dataset/4e8e3c6a-c961-4def-bdc7-f24823462818">NRCan / NAPL</a>');
let leftLayer,rightLayer;const loaded=new Set();
function layerFor(year,side){const l=year==='streets'?L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}):L.tileLayer.wms('https://datacube.services.geo.ca/ows/aerial',wmsOptions(year));l.on('tileerror',()=>{$('map-notice').hidden=false;$('map-notice').textContent='Some imagery could not load. Try another year or open the official NRCan viewer below.';});l.on('load',()=>{loaded.add(side);if(loaded.size===2)$('status').textContent='Comparison ready. Slide, pan or choose a starting place.';});return l;}
function updateLayers(){loaded.clear();$('status').textContent='Loading the selected layers…';$('map-notice').hidden=true;if(leftLayer)leftLayer.remove();if(rightLayer)rightLayer.remove();leftLayer=layerFor($('left-year').value,'left').addTo(map);rightLayer=layerFor($('right-year').value,'right').addTo(right);for(const [side,id] of [['left','left-year'],['right','right-year']]){$(side+'-label').textContent=label($(id).value);$('image-'+side).textContent=$(id).value==='streets'?'Street map':$(id).value;}if($('left-year').value===$('right-year').value)$('status').textContent='Both sides show the same layer. Choose different years to compare.';}
function reveal(){const n=Number($('reveal').value);$('right-map').style.clipPath=`inset(0 0 0 ${n}%)`;$('curtain').style.left=n+'%';$('percentage').value=n+'%';}
function updateArchiveLink() {
  const {lat, lng} = map.getCenter();
  const url = new URL('https://hrm.maps.arcgis.com/apps/mapviewer/index.html');
  url.searchParams.set('webmap', 'a4b041e843d2463b99e8680057076725');
  url.searchParams.set('center', [lng.toFixed(5), lat.toFixed(5)].join(','));
  url.searchParams.set('level', map.getZoom());
  $('archive-map').href = url.href;
}
map.on('moveend zoomend', updateArchiveLink);
updateArchiveLink();
map.on('move zoom resize',()=>right.setView(map.getCenter(),map.getZoom(),{animate:false}));new ResizeObserver(()=>{map.invalidateSize();right.invalidateSize();}).observe($('comparison'));
$('left-year').value=view.left;$('right-year').value=view.right;$('reveal').value=view.split;for(const id of ['left-year','right-year'])$(id).onchange=updateLayers;$('reveal').oninput=reveal;$('swap').onclick=()=>{const a=$('left-year').value;$('left-year').value=$('right-year').value;$('right-year').value=a;updateLayers();};
function place(key){const p=PLACES[key];map.setView(p.center,p.zoom);$('place-title').textContent=p.name;$('place-note').textContent=p.note;for(const b of document.querySelectorAll('[data-place]'))b.setAttribute('aria-pressed',String(b.dataset.place===key));}
for(const [key,p] of Object.entries(PLACES)){const b=el('button',p.name+' ↗');b.dataset.place=key;b.setAttribute('aria-pressed',String(key==='waterfront'));b.onclick=()=>place(key);$('places').append(b);}$('reset').onclick=()=>place('waterfront');$('share').onclick=()=>{const c=map.getCenter();share({lat:c.lat.toFixed(5),lng:c.lng.toFixed(5),z:map.getZoom(),left:$('left-year').value,right:$('right-year').value,split:$('reveal').value});};updateLayers();reveal();

import {nearPhotos} from './model.mjs';
let photoIndex,photoLimit=8;
function renderPhotos(){
  if(!photoIndex)return;
  const centre=map.getCenter(),radius=Number($('photo-radius').value);
  const found=nearPhotos(photoIndex.photos,centre.lat,centre.lng,radius,$('photo-year').value);
  $('photo-count').textContent=found.length+' indexed photographs within '+radius+' km of the map centre ('+centre.lat.toFixed(4)+', '+centre.lng.toFixed(4)+').';
  $('photo-list').replaceChildren(...found.slice(0,photoLimit).map(({photo:p,distance})=>{
    const item=el('li'),reference=p[1]+' · '+p[0];
    if(p[5]){const link=el('a',reference);link.href=p[5];item.append(link)}else{item.append(el('span',reference+' · catalogue link unavailable'))}
    item.append(el('small',p[2]+' · '+Math.round(distance*1000).toLocaleString('en-CA')+' m'));return item;
  }));
  $('photo-more').hidden=found.length<=photoLimit;
}
function resetPhotos(){photoLimit=8;renderPhotos()}
map.on('moveend',resetPhotos);
map.on('click',event=>map.panTo(event.latlng));
$('photo-ferry').onclick=()=>map.setView([44.6497,-63.5714],16);
$('photo-more').onclick=()=>{photoLimit+=20;renderPhotos()};
$('photo-radius').onchange=resetPhotos;$('photo-year').onchange=resetPhotos;
try{
  const res=await fetch('./data/photos.json');if(!res.ok)throw Error();photoIndex=await res.json();
  const years=[...new Set(photoIndex.photos.map(p=>p[2]))].sort();
  for(const y of years)$('photo-year').append(new Option(String(y),String(y)));
  $('photo-meta').textContent=photoIndex.count+' index records · '+years.join(' and ')+' · Retrieved '+photoIndex.retrieved+' UTC';
  renderPhotos();
}catch{$('photo-meta').textContent='The bundled photo index could not load. Use the municipal archive map above.'}
