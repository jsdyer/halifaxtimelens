import {$, el, link, download} from './common.mjs';
import {nearPhotos, nearbyYears, photoCollection} from './model.mjs';

const shelfKey = 'coolcode:halifaxtimelens:saved-photos';
const metres = distance => Math.round(distance * 1000).toLocaleString('en-CA') + ' m';

export function photoSettings() {
  return {radius: $('photo-radius').value, year: $('photo-year').value, points: $('show-points').checked ? '1' : '0'};
}

export async function setupPhotos(map, right, params, focusFerry) {
  let data;
  try {
    const response = await fetch('./data/photos.json');
    if (!response.ok) throw Error();
    data = await response.json();
  } catch {
    $('photo-meta').textContent = 'The photo index could not load. Open the municipal map above for archive references.';
    return;
  }
  const byId = new Map(data.photos.map(photo => [photo[0], photo]));
  const years = [...new Set(data.photos.map(photo => photo[2]))].sort();
  const pins = [L.layerGroup().addTo(map), L.layerGroup().addTo(right)];
  const saved = new Set();
  let persistent = true;
  try {
    const stored = JSON.parse(localStorage.getItem(shelfKey) || '[]');
    if (Array.isArray(stored)) for (const id of stored) if (byId.has(id)) saved.add(id);
  } catch { persistent = false; }
  for (const year of years) $('photo-year').append(new Option(String(year), String(year)));
  if (years.map(String).includes(params.get('year'))) $('photo-year').value = params.get('year');
  if (['.5', '1', '3'].includes(params.get('radius'))) $('photo-radius').value = params.get('radius');
  $('show-points').checked = params.get('points') === '1';
  $('photo-meta').textContent = data.count + ' indexed photographs · ' + years.join(' and ') + ' · Retrieved ' + data.retrieved + ' UTC';
  let limit = 8;

  function control(title, action) {
    const button = el('button', title);
    button.type = 'button';
    button.onclick = action;
    return button;
  }
  function citation(photo) {
    const label = photo[1] + ' · ' + photo[0];
    return photo[5] ? link(label, photo[5]) : el('span', label + ' · no catalogue link supplied');
  }
  function toggle(id) {
    if (saved.has(id)) saved.delete(id); else saved.add(id);
    try { localStorage.setItem(shelfKey, JSON.stringify([...saved])); persistent = true; }
    catch { persistent = false; }
    notebook();
    render();
  }
  function notebook() {
    $('saved-count').textContent = saved.size + ' saved ' + (saved.size === 1 ? 'reference.' : 'references.') +
      (persistent ? '' : ' Browser storage is unavailable. Download before leaving this page.');
    $('export-photos').disabled = !saved.size;
    $('saved-list').replaceChildren(...[...saved].map(id => {
      const photo = byId.get(id);
      const item = el('li');
      const actions = el('div', '', 'actions');
      actions.append(control('Locate on map', () => {
        map.setView([photo[3], photo[4]], 16, {animate: false});
        $('comparison').scrollIntoView({block: 'center'});
      }), control('Remove', () => toggle(id)));
      item.append(el('strong', String(photo[2]) + ' · '), citation(photo), actions);
      return item;
    }));
  }
  $('export-photos').onclick = () => {
    const collection = photoCollection([...saved].map(id => byId.get(id)), data.retrieved);
    download('halifax-photo-notebook.geojson', JSON.stringify(collection, null, 2), 'application/geo+json');
  };

  function markers(found) {
    for (const layer of pins) layer.clearLayers();
    if (!$('show-points').checked) return;
    for (const {photo} of found) {
      const colour = photo[2] === 1955 ? '#993c18' : '#075578';
      for (const layer of pins) {
        L.circleMarker([photo[3], photo[4]], {
          radius: 5, color: '#fff', weight: 1.5, fillColor: colour, fillOpacity: .95,
          interactive: false, className: 'archive-dot'
        }).addTo(layer);
      }
    }
  }
  function render() {
    const centre = map.getCenter();
    const radius = Number($('photo-radius').value);
    const all = nearPhotos(data.photos, centre.lat, centre.lng, radius);
    const year = $('photo-year').value;
    const found = year ? all.filter(({photo}) => String(photo[2]) === year) : all;
    const evidence = nearbyYears(all);
    $('year-evidence').replaceChildren(...years.map(y => {
      const group = evidence.find(row => row.year === y);
      const card = el('div', '', 'year-card');
      card.append(el('strong', String(y)));
      if (group) {
        card.append(el('span', group.count + ' indexed · nearest ' + metres(group.closest.distance)), citation(group.closest.photo));
      } else card.append(el('span', 'No indexed points within this radius.'));
      return card;
    }));
    $('photo-count').textContent = found.length + ' indexed photographs within ' + radius + ' km of the map centre (' +
      centre.lat.toFixed(4) + ', ' + centre.lng.toFixed(4) + ').';
    $('photo-list').replaceChildren(...found.slice(0, limit).map(({photo, distance}) => {
      const item = el('li');
      item.append(citation(photo), el('small', photo[2] + ' · ' + metres(distance)),
        control(saved.has(photo[0]) ? 'Remove from notebook' : 'Save to notebook', () => toggle(photo[0])));
      return item;
    }));
    $('photo-more').hidden = found.length <= limit;
    markers(found);
  }
  function reset() { limit = 8; render(); }
  map.on('moveend', reset);
  $('photo-ferry').onclick = focusFerry;
  $('photo-more').onclick = () => { limit += 20; render(); };
  $('photo-radius').onchange = reset;
  $('photo-year').onchange = reset;
  $('show-points').onchange = render;
  notebook();
  render();
}
