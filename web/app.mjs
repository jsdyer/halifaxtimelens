import {$,el,share,link} from './common.mjs';
import {PLACES,EXTENT,readView,label,wmsOptions} from './model.mjs';
import {stories,viewpoints} from './stories.mjs';
import {setupPhotos, photoSettings} from './photo-research.mjs';
const startingHash = location.hash.includes("=") ? location.hash : document.body.dataset.view || "";
const params = new URLSearchParams(startingHash.slice(1));
const view=readView(startingHash),box=[[EXTENT[0][1],EXTENT[0][0]],[Math.max(44.78, EXTENT[1][1]),EXTENT[1][0]]];
const map=L.map('map',{scrollWheelZoom:false,minZoom:11,maxZoom:18,maxBounds:box,maxBoundsViscosity:.7}).setView([view.lat,view.lng],view.zoom);
const right=L.map('right-map',{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,touchZoom:false,minZoom:11,maxZoom:18}).setView(map.getCenter(),map.getZoom());
L.control.scale({imperial:false}).addTo(map);map.attributionControl.addAttribution('<a href="https://open.canada.ca/data/en/dataset/4e8e3c6a-c961-4def-bdc7-f24823462818">NRCan / NAPL</a>');
let leftLayer, rightLayer;
const loaded = new Set();
const failed = new Set();
let generation = 0;
function layerFor(key, side, version) {
  let layer;
  if (key === 'satellite') {
    layer = L.imageOverlay('./data/halifax-sentinel-2025.webp', [[44.5100452, -63.8], [44.82, -63.33]], {
      alt: 'True-colour Copernicus Sentinel-2C image of Halifax, 29 September 2025', pane: 'tilePane'
    });
  } else if (key === 'streets') {
    layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19,
      attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'});
  } else {
    layer = L.tileLayer.wms('https://datacube.services.geo.ca/ows/aerial', wmsOptions(key));
  }
  layer.on('tileerror error', () => {
    if (version !== generation) return;
    failed.add(side);
    $('map-notice').hidden = false;
    $('imagery-error').textContent = 'Some imagery could not load on the ' + [...failed].join(' and ') + '.';
    $('status').textContent = 'Some comparison imagery is unavailable.';
  });
  layer.on('load', () => {
    if (version !== generation) return;
    loaded.add(side);
    if (!failed.size && loaded.size === 2 && $('left-year').value !== $('right-year').value)
      $('status').textContent = 'Comparison ready. Slide, pan or choose a starting place.';
  });
  return layer;
}
function updateLayers() {
  generation++;
  loaded.clear();
  failed.clear();
  $('status').textContent = 'Loading the selected layers…';
  $('map-notice').hidden = true;
  leftLayer?.remove(); rightLayer?.remove();
  const left = $('left-year').value, rightKey = $('right-year').value;
  leftLayer = layerFor(left, 'left', generation).addTo(map);
  rightLayer = layerFor(rightKey, 'right', generation).addTo(right);
  for (const [side, key] of [['left',left],['right',rightKey]]) {
    $(side+'-label').textContent = label(key);
    $('image-'+side).textContent = key === 'streets' ? 'Street map' : key === 'satellite' ? '2025 satellite' : key;
  }
  if (left === rightKey) $('status').textContent = 'Both sides show the same layer. Choose different layers to compare.';
}
$('retry-imagery').onclick = updateLayers;
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
function updateComparisonLocation() {
  const center = map.getCenter();
  const story = stories[$('story').value];
  const nearest = Object.values(PLACES).reduce((best, item) =>
    center.distanceTo(item.center) < center.distanceTo(best.center) ? item : best);
  const place = center.distanceTo(nearest.center) < 150 ? nearest : null;
  const atStory = story && center.distanceTo(story.center) < 150;
  const stop = atStory ? story : place === PLACES.ferry ? viewpoints.ferry : null;
  const profile = $('viewpoint-record');
  profile.hidden = !stop;
  if (stop) {
    profile.href = './records/' + stop.slug + '/';
    profile.textContent = 'Open the ' + stop.title + ' viewpoint and its source images';
  }
  $('comparison-location').textContent = atStory ? story.title : place ? place.name : 'Map centre · ' + center.lat.toFixed(3) + '°, ' + center.lng.toFixed(3) + '°';
  if (!story) {
    $('place-title').textContent = place ? place.name : 'This map location';
    $('place-note').textContent = place ? place.note : 'Browse the archive photographs indexed near the centre of this view.';
    for (const button of document.querySelectorAll('[data-place]')) {
      button.setAttribute('aria-pressed', String(PLACES[button.dataset.place] === place));
    }
  }
}
map.on('moveend', updateComparisonLocation);
function place(key){showStory('',false);const p=PLACES[key];map.setView(p.center,p.zoom);$('place-title').textContent=p.name;$('place-note').textContent=p.note;for(const b of document.querySelectorAll('[data-place]'))b.setAttribute('aria-pressed',String(b.dataset.place===key));}
function showStory(key, moveMap) {
  const story = Object.hasOwn(stories, key) ? stories[key] : null;
  $('story').value = story ? key : '';
  $('story-records').replaceChildren();
  $('open-story').hidden = !story;
  for (const button of $('guide-choices').children) button.setAttribute('aria-pressed', String(button.dataset.story === key));
  updateComparisonLocation();
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
updateComparisonLocation();
await setupPhotos(map, right, params, () => place("ferry"));
if (params.get("view") === "compare") $("comparison-location").scrollIntoView();

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
  if (next.get('view') === 'compare') $('comparison-location').scrollIntoView();
});
