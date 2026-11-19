export const YEARS=['1947','1977','streets'];
export const EXTENT=[[-63.7422255,44.5553848],[-63.3866545,44.7305971]];
export const PLACES={waterfront:{name:'Halifax waterfront',center:[44.6486,-63.5719],zoom:15,note:'Follow the edges of the harbour, piers and waterfront streets across both aerial surveys.'},north:{name:'North End',center:[44.6691,-63.6002],zoom:15,note:'Compare the street grid, railway lands and industrial waterfront. Use the modern street map to orient yourself.'},dartmouth:{name:'Downtown Dartmouth',center:[44.6654,-63.5687],zoom:15,note:'Explore the Dartmouth waterfront and surrounding blocks on the opposite side of the harbour.'},arm:{name:'Northwest Arm',center:[44.631,-63.605],zoom:14,note:'Trace the shoreline, green spaces and neighbourhood streets around the Northwest Arm.'},basin:{name:'Bedford Basin',center:[44.699,-63.638],zoom:13,note:'Compare the basin shoreline. Historical coverage is limited to the published mosaic footprint.'}};
export function readView(hash){const p=new URLSearchParams(hash.replace(/^#/,''));const n=(k,f,min,max)=>{const v=p.has(k)?Number(p.get(k)):NaN;return Number.isFinite(v)&&v>=min&&v<=max?v:f;};return {lat:n('lat',44.6486,44.55,44.78),lng:n('lng',-63.5719,-63.75,-63.38),zoom:n('z',14,11,18),split:n('split',50,0,100),left:YEARS.includes(p.get('left'))?p.get('left'):'1947',right:YEARS.includes(p.get('right'))?p.get('right'):'1977'};}
export function label(year){return year==='streets'?'Modern street map':`${year} aerial photograph`;}
export function wmsOptions(year){if(!['1947','1977'].includes(year))throw Error('Unsupported aerial year');return {layers:'halifax',format:'image/png',transparent:true,version:'1.3.0',time:`${year}-07-01T12:00:00Z`,maxZoom:18,tileSize:256};}

export function nearPhotos(photos,lat,lon,radius,year='') {
  const rad=Math.PI/180;
  return photos.filter(r=>!year||String(r[2])===String(year)).map(photo=>{
    const a=Math.sin((photo[3]-lat)*rad/2)**2+Math.cos(lat*rad)*Math.cos(photo[3]*rad)*Math.sin((photo[4]-lon)*rad/2)**2;
    return {photo,distance:6371*2*Math.asin(Math.min(1,Math.sqrt(a)))};
  }).filter(item=>item.distance<=radius).sort((a,b)=>a.distance-b.distance||a.photo[0].localeCompare(b.photo[0]));
}

export const archiveSource = 'https://services2.arcgis.com/11XBiaBYA9Ep0yNJ/arcgis/rest/services/Historical_Aerial_Photographs_Index/FeatureServer/0';

export function nearbyYears(found) {
  const byYear = new Map();
  for (const item of found) {
    const year = item.photo[2];
    if (!byYear.has(year)) byYear.set(year, {year, count: 0, closest: item});
    byYear.get(year).count++;
  }
  return [...byYear.values()].sort((a, b) => a.year - b.year);
}

export function photoCollection(photos, retrieved) {
  return {
    type: 'FeatureCollection',
    source: archiveSource,
    retrieved,
    location_meaning: 'Municipal index point. Camera direction and photograph coverage are unknown.',
    features: photos.map(([id, reference, year, lat, lon, url]) => ({
      type: 'Feature', id, geometry: {type: 'Point', coordinates: [lon, lat]},
      properties: {reference, year, catalogue_url: url || null}
    }))
  };
}
