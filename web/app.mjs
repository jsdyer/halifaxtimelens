import {$,el,share,link} from './common.mjs';
import {PLACES,EXTENT,readView,label,wmsOptions} from './model.mjs';
import {stories} from './stories.mjs';
import {setupPhotos, photoSettings} from './photo-research.mjs';
const params = new URLSearchParams(location.hash.slice(1));
const view=readView(location.hash),box=[[EXTENT[0][1],EXTENT[0][0]],[Math.max(44.78, EXTENT[1][1]),EXTENT[1][0]]];
const map=L.map('map',{scrollWheelZoom:false,minZoom:11,maxZoom:18,maxBounds:box,maxBoundsViscosity:.7}).setView([view.lat,view.lng],view.zoom);
const right=L.map('right-map',{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,touchZoom:false,minZoom:11,maxZoom:18}).setView(map.getCenter(),map.getZoom());
L.control.scale({imperial:false}).addTo(map);map.attributionControl.addAttribution('<a href="https://open.canada.ca/data/en/dataset/4e8e3c6a-c961-4def-bdc7-f24823462818">NRCan / NAPL</a>');
let leftLayer,rightLayer;const loaded=new Set();
function layerFor(year,side){const l=year==='streets'?L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}):L.tileLayer.wms('https://datacube.services.geo.ca/ows/aerial',wmsOptions(year));l.on('tileerror',()=>{$('map-notice').hidden=false;$('map-notice').textContent='Some imagery could not load. Try another year or open the official NRCan viewer below.';});l.on('load',()=>{loaded.add(side);if(loaded.size===2 && $('left-year').value!==$('right-year').value)$('status').textContent='Comparison ready. Slide, pan or choose a starting place.';});return l;}
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
function place(key){showStory('',false);const p=PLACES[key];map.setView(p.center,p.zoom);$('place-title').textContent=p.name;$('place-note').textContent=p.note;for(const b of document.querySelectorAll('[data-place]'))b.setAttribute('aria-pressed',String(b.dataset.place===key));}
function showStory(key, moveMap) {
  const story = Object.hasOwn(stories, key) ? stories[key] : null;
  $('story').value = story ? key : '';
  $('story-records').replaceChildren();
  $('open-story').hidden = !story;
  for (const button of $('guide-choices').children) button.setAttribute('aria-pressed', String(button.dataset.story === key));
  if (!story) return;
  if (moveMap) map.setView(story.center, story.zoom, {animate: false});
  $('place-title').textContent = story.title;
  $('place-note').textContent = story.question;
  for (const button of document.querySelectorAll('[data-place]')) button.setAttribute('aria-pressed', 'false');
  const cards = el('div', '', 'evidence-cards');
  for (const record of story.records) {
    const article = el('article');
    article.append(el('strong', record.date), el('h3', record.title), el('p', record.note),
      link('Open photograph · ' + record.ref + ' ↗', record.url));
    cards.append(article);
  }
  $('story-records').append(el('h3', story.question), el('p', story.look), cards);
  if (story.context) $('story-records').append(link(story.context.title + ' ↗', story.context.url));
}

for (const [key, story] of Object.entries(stories)) {
  $('story').append(new Option(story.title, key));
  const button = el('button', story.title);
  button.dataset.story = key;
  button.setAttribute('aria-pressed', 'false');
  button.onclick = () => showStory(key, true);
  $('guide-choices').append(button);
}
$('story').onchange = () => {
  if ($('story').value) showStory($('story').value, true);
  else place('waterfront');
};

for(const [key,p] of Object.entries(PLACES)){const b=el('button',p.name+' ↗');b.dataset.place=key;b.setAttribute('aria-pressed',String(key==='waterfront'));b.onclick=()=>place(key);$('places').append(b);}$('reset').onclick=()=>place('waterfront');$('share').onclick=()=>{const c=map.getCenter();share({lat:c.lat.toFixed(5),lng:c.lng.toFixed(5),z:map.getZoom(),left:$('left-year').value,right:$('right-year').value,split:$('reveal').value,story:$('story').value,...photoSettings()});};updateLayers();reveal();


const handle = $('drag-handle');
function dragSplit(event) {
  const box = $('comparison').getBoundingClientRect();
  $('reveal').value = String(Math.round(100 * (event.clientX - box.left) / box.width));
  reveal();
}
handle.onpointerdown = event => {
  event.preventDefault();
  handle.setPointerCapture(event.pointerId);
  dragSplit(event);
};
handle.onpointermove = event => { if (handle.hasPointerCapture(event.pointerId)) dragSplit(event); };
handle.onpointerup = event => { if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId); };
map.on('click', event => map.panTo(event.latlng));
if (Object.hasOwn(stories, params.get('story'))) showStory(params.get('story'), !params.has('lat') || !params.has('lng'));
await setupPhotos(map, right, params);

window.addEventListener('hashchange', () => {
  const next = new URLSearchParams(location.hash.slice(1));
  if (!next.has('lat') && !Object.hasOwn(stories, next.get('story'))) return;
  const saved = readView(location.hash);
  if (next.has('lat') && next.has('lng')) {
    map.setView([saved.lat, saved.lng], saved.zoom, {animate: false});
    $('left-year').value = saved.left;
    $('right-year').value = saved.right;
    $('reveal').value = saved.split;
    updateLayers();
    reveal();
    const year = next.get('year') || '';
    if (Array.from($('photo-year').options).some(option => option.value === year)) $('photo-year').value = year;
    $('photo-radius').value = ['.5', '1', '3'].includes(next.get('radius')) ? next.get('radius') : '1';
    $('show-points').checked = next.get('points') === '1';
    $('photo-year').dispatchEvent(new Event('change'));
  }
  showStory(next.get('story'), !next.has('lat') || !next.has('lng'));
});
