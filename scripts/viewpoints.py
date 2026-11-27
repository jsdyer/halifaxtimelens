"""Print source-backed, script-free Halifax viewpoints from the same edition as the map."""
from collections import defaultdict
from html import escape
import json
from math import asin, cos, radians, sin, sqrt
import re
from urllib.parse import urlencode, urlsplit
from xml.etree import ElementTree as ET

MOSAICS = "https://open.canada.ca/data/en/dataset/4e8e3c6a-c961-4def-bdc7-f24823462818"
SATELLITE = "https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a/items/S2C_20TMQ_20250929_0_L2A"
MUNICIPAL = "https://www.halifax.ca/about-halifax/municipal-archives/exhibits/historical-aerial-photos"


def e(value):
    return escape(str(value), quote=True)


def link(path, label):
    return f'<a href="{e(path)}">{e(label)}</a>'


def source(url, label):
    u = urlsplit(url)
    if u.scheme != "https" or not u.hostname or u.username or u.password:
        raise ValueError(f"Invalid archive URL for {label}")
    return link(url,label)


def nearby(stop, photos):
    lat,lon = map(radians,stop["center"])
    found = []
    for photo in photos:
        y,x = radians(photo[3]),radians(photo[4])
        a = sin((y-lat)/2)**2 + cos(lat)*cos(y)*sin((x-lon)/2)**2
        metres = 6371000*2*asin(min(1,sqrt(a)))
        if metres <= 1000:
            found.append((metres,photo))
    return sorted(found,key=lambda item:(item[0],item[1][0]))


def map_url(root, key, stop, left, right, points=False):
    lat,lon=stop["center"]
    params = dict(lat=lat,lng=lon,z=stop["zoom"],split=50,left=left,right=right,radius="1",view="compare")
    if stop.get("records"):
        params["story"] = key
    if points:
        params["points"] = 1
    return root+"#"+urlencode(params)


def photo_section(results, edition):
    groups = defaultdict(list)
    for item in results:
        groups[item[1][2]].append(item)
    count = len(results)
    intro = f'{count} municipal index {"point falls" if count == 1 else "points fall"} within 1 km of this map centre in the {e(edition["retrieved"])} snapshot. Distances are to the published index points. The direction and footprint of a photograph can differ.'
    rows = []
    for year,items in sorted(groups.items()):
        metres,photo=items[0]
        text=f"{photo[1]} · {photo[0]}"
        record = source(photo[5], text) if photo[5] else e(text)+" (no catalogue URL supplied)"
        rows.append(f'<li><strong>{e(year)}</strong> · {len(items)} indexed. Closest: {record}, {metres:,.0f} m from the viewpoint.</li>')
    index_link=source(MUNICIPAL,"How Halifax Municipal Archives indexes the photographs")
    return "<h2>Photo index within one kilometre</h2><p>"+intro+"</p><ul>"+"".join(rows)+"</ul><p>"+index_link+"</p>"


def body(key, stop, stops, edition):
    root="../../"
    choices=link(map_url(root,key,stop,"1947","1977",True),"Compare 1947 with 1977 on the map")
    choices+=" · "+link(map_url(root,key,stop,"1977","satellite",True),"Compare 1977 with 2025")
    body=[f'<p class="view-intro">{e(stop["question"])}</p><p>{e(stop["look"])}</p>',
          '<p class="compare-links">'+choices+'</p><div class="time-strip">']
    for year,label in ((1947,"1947 aerial mosaic"),(1977,"1977 aerial mosaic"),(2025,"29 September 2025 satellite")):
        observation = e(stop["observations"][str(year)])
        path=f'{root}data/viewpoints/{stop["slug"]}-{year}.webp'
        body.append(f'<figure><a href="{e(path)}" aria-label="Enlarge {e(label)} of {e(stop["title"])}"><img src="{e(path)}" width="540" height="360" alt="{e(label)} of {e(stop["title"])}"></a><figcaption><strong>{e(label)}</strong><span>{observation}</span></figcaption></figure>')
    imagery = source(MOSAICS,"NRCan aerial mosaics and original files")+" · "+source(SATELLITE,"Copernicus Sentinel-2C scene")
    body.append('</div><p class="view-note">The three north-up extracts use the same map bounds. The 1947 and 1977 mosaics have 1 m and 0.5 m source resolution. The 2025 scene uses 10 m source pixels, so individual buildings are less distinct. Historical mosaics can have alignment differences. '+imagery+'.</p>')
    if stop.get("records"):
        body.append('<h2>Dated archive photographs</h2><ul class="archive-pair">')
        for record in stop["records"]:
            title=source(record["url"],record["title"])
            body.append(f'<li><strong>{e(record["date"])}</strong><h3>{title}</h3><p>{e(record["note"])}</p><small>Halifax Municipal Archives · {e(record["ref"])}</small></li>')
        body.append('</ul><p class="view-note">These oblique photographs each show the area from their own viewing angle.</p>')
    body.append(photo_section(nearby(stop,edition["photos"]),edition))
    if stop.get("context"):
        context=stop["context"]
        body.append("<p>"+source(context["url"],context["title"])+"</p>")
    if stop.get("related"):
        related=stop["related"]
        body.append("<h2>From the postal records</h2><p>"+e(related["note"])+" "+source(related["url"],related["title"])+".</p>")
    next_stop=stops[stop["next"]]
    body.append("<h2>Continue along the harbour</h2><p>"+e(stop["connection"])+" "+link("../"+next_stop["slug"]+"/","Open "+next_stop["title"])+".</p>")
    return "".join(body)


def publish_viewpoints(stage,tool):
    stops=json.loads((stage/"viewpoints.json").read_text())
    edition=json.loads((stage/"data/photos.json").read_text())
    if edition["count"] != len(edition["photos"]):
        raise ValueError("Published photo count does not match the index")
    base="https://coolcode.ca"+tool["url"]
    sitemap=ET.Element("urlset",xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    def save(path,title,description,content):
        root="../"*path.count("/")
        url=base+path
        nav=link(root,"Halifax Time Lens")+link(root+"records/","All harbour viewpoints")
        footer=source(MOSAICS,"Natural Resources Canada · Open Government Licence – Canada")+" · "+source("https://dataspace.copernicus.eu/terms-and-conditions","Contains modified Copernicus Sentinel data 2025")+" · "+link("https://coolcode.ca/","CoolCode.ca")
        html=f'''<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)} · Halifax Time Lens</title><meta name="description" content="{e(description)}"><link rel="canonical" href="{e(url)}"><link rel="stylesheet" href="{root}style.css"><link rel="icon" href="{root}favicon.svg"><script defer src="/assets/tool-metrics.js" referrerpolicy="no-referrer"></script></head>
<body class="view-page" data-tool-id="halifaxtimelens"><a class="skip" href="#main">Skip to record</a><header class="topbar"><nav aria-label="Explore the harbour">{nav}</nav></header><main id="main"><h1>{e(title)}</h1>{content}</main><footer><div>Municipal photo index retrieved {e(edition["retrieved"])}. Weekly check scheduled for Wednesdays at 09:38 UTC. Historical survey dates and the 2025 observation stay attached to their images.</div><div>{footer}</div></footer></body></html>'''
        dest=stage/path/"index.html"
        dest.parent.mkdir(parents=True,exist_ok=True)
        dest.write_text(html,encoding="utf-8")
        ET.SubElement(ET.SubElement(sitemap,"url"),"loc").text=url

    slugs=[stop["slug"] for stop in stops.values()]
    if len(slugs)!=len(set(slugs)) or any(not re.fullmatch("[a-z0-9]+(?:-[a-z0-9]+)*",value) for value in slugs):
        raise ValueError("Viewpoint routes must be unique slugs")
    cards=[]
    for key,stop in stops.items():
        for year in (1947,1977,2025):
            if not (stage/"data/viewpoints"/f"{stop['slug']}-{year}.webp").is_file():
                raise ValueError(f'Missing {year} image for {stop["title"]}')
        title=stop["title"]+" in aerial photographs"
        description=f'{stop["title"]} in the 1947 and 1977 Halifax mosaics and the September 2025 satellite scene. {stop["question"]}'
        save("records/"+stop["slug"]+"/",title,description,body(key,stop,stops,edition))
        path=stop["slug"]+"/"
        cards.append(f'<li><a href="{e(path)}"><img src="../data/viewpoints/{e(stop["slug"])}-1977.webp" width="540" height="360" alt=""><strong>{e(stop["title"])}</strong></a><p>{e(stop["question"])}</p></li>')
    title="Halifax and Dartmouth harbour viewpoints"
    description=f'Explore {len(stops)} places in the 1947 and 1977 aerial mosaics and the 2025 satellite image, with dated archive references and nearby photo-index points.'
    save("records/",title,description,'<p class="view-intro">'+e(description)+'</p><ul class="view-directory">'+"".join(cards)+"</ul>")
    ET.ElementTree(sitemap).write(stage/"sitemap.xml",encoding="utf-8",xml_declaration=True)
    return edition["retrieved"]
