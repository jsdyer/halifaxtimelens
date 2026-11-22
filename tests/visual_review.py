"""Reproduce a real waterfront comparison independently of a changing tile service."""
from io import BytesIO
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from PIL import Image
from playwright.sync_api import expect

# Upper-left Web Mercator coordinate and square tile span for the 7 x 5 tile
# extract. See the fixture source in README.md. Leaflet requests 256 px tiles.
WEST, NORTH = -7081126.300338728, 5569507.628971083
TILE_SPAN = 40075016.68557849 / (2 ** 15)


def capture_waterfront(browser, base, output):
    output.mkdir(exist_ok=True)
    fixture = Path(__file__).parent / "fixtures/waterfront-1947.webp"
    with Image.open(fixture) as historic:
        def tile(route):
            query = parse_qs(urlsplit(route.request.url).query)
            assert query["time"] == ["1947-07-01T12:00:00Z"]
            left, _, right, top = map(float, query["bbox"][0].split(","))
            assert abs(right - left - TILE_SPAN) < 0.001
            x = round((left - WEST) / TILE_SPAN) * 256
            y = round((NORTH - top) / TILE_SPAN) * 256
            assert 0 <= x <= historic.width - 256 and 0 <= y <= historic.height - 256
            encoded = BytesIO()
            historic.crop((x, y, x + 256, y + 256)).save(encoded, format="PNG")
            route.fulfill(content_type="image/png", body=encoded.getvalue())

        for width, height in [(1280, 900), (390, 844)]:
            page = browser.new_page(viewport={"width": width, "height": height}, reduced_motion="reduce")
            page.route("https://datacube.services.geo.ca/ows/aerial*", tile)
            page.goto(base + "#lat=44.64860&lng=-63.57190&z=15&left=1947&right=satellite&split=50")
            expect(page.locator("#status")).to_contain_text("Comparison ready")
            expect(page.locator("#reveal")).to_have_value("50")
            page.wait_for_function("document.querySelector('#right-map img.leaflet-image-layer')?.naturalWidth === 2900")
            page.locator("#comparison").screenshot(path=str(output / f"Halifax-waterfront-{width}.png"),
                                                   animations="disabled")
            page.close()
