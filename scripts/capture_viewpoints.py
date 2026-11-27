"""Rebuild the small, geographically matched previews from the two original mosaics and bundled 2025 image.

Requires Pillow (also used by browser tests). The ordinary site build and weekly municipal refresh stay offline for previews.
"""
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
import json
from math import log, pi, radians, tan
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from PIL import Image, ImageStat

ROOT = Path(__file__).resolve().parents[1]
TILE_SERVER = "https://datacube.services.geo.ca/ows/aerial"
SIZE = (540,360)
R = 6378137


def mercator(lat, lon):
    return R*radians(lon), R*log(tan(pi/4+radians(lat)/2))


def bbox(stop):
    x,y = mercator(*stop["center"])
    half_x = stop["width_m"]/2
    half_y = half_x*SIZE[1]/SIZE[0]
    return (x-half_x,y-half_y,x+half_x,y+half_y)


def capture(job):
    stop,year,output = job
    bounds = bbox(stop)
    if year == 2025:
        # Bounds of the Web Mercator imageOverlay published with the 2025 scene.
        west,south = mercator(44.5100452,-63.8)
        east,north = mercator(44.82,-63.33)
        with Image.open(ROOT/"web/data/halifax-sentinel-2025.webp") as image:
            left,bottom,right,top = bounds
            crop = ((left-west)/(east-west)*image.width,(north-top)/(north-south)*image.height,
                    (right-west)/(east-west)*image.width,(north-bottom)/(north-south)*image.height)
            result = image.resize(SIZE,Image.Resampling.BICUBIC,box=crop).convert("RGB")
    else:
        params = dict(SERVICE="WMS",VERSION="1.3.0",REQUEST="GetMap",LAYERS="halifax",STYLES="",CRS="EPSG:3857",
                      BBOX=",".join(f"{v:.3f}" for v in bounds),WIDTH=SIZE[0],HEIGHT=SIZE[1],FORMAT="image/png",
                      TRANSPARENT="true",TIME=f"{year}-07-01T12:00:00Z")
        req = Request(TILE_SERVER+"?"+urlencode(params),headers={"User-Agent":"CoolCode-HalifaxTimeLens/1.0 (+https://coolcode.ca/halifaxtimelens/)"})
        with urlopen(req,timeout=75) as response:
            if response.headers.get_content_type() != "image/png":
                raise ValueError(f"The {year} GetMap response is not an image")
            with Image.open(BytesIO(response.read())) as image:
                if image.size != SIZE or ImageStat.Stat(image.convert("L")).stddev[0] < 3:
                    raise ValueError(f"No usable {year} imagery for {stop['slug']}")
                result = image.convert("RGBA")
                if result.getchannel("A").getbbox() is None:
                    raise ValueError("Mosaic is entirely transparent")
    path=output/f"{stop['slug']}-{year}.webp"
    result.save(path,format="WEBP",quality=82,method=6)
    return path


def main():
    stops = json.loads((ROOT/"web/viewpoints.json").read_text()).values()
    target = ROOT/"web/data/viewpoints"
    target.mkdir(exist_ok=True)
    with TemporaryDirectory(dir=target.parent) as temp:
        jobs=[(stop,year,Path(temp)) for stop in stops for year in (1947,1977,2025)]
        with ThreadPoolExecutor(max_workers=4) as pool:
            images=list(pool.map(capture,jobs))
        for image in images:
            image.replace(target/image.name)
    print(f"Prepared {len(images)} matched source images")


if __name__ == "__main__":
    main()
