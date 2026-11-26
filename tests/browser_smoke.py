"""CI checks real bundled data and project-subpath flows; external tiles are stubbed."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from visual_review import capture_waterfront
import os, json, re, shutil, tempfile, threading
from urllib.parse import parse_qs, urlsplit
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1]
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

def main():
    slug=json.loads((ROOT/'tool.json').read_text())['id']
    shots=ROOT/'browser-checks'; shots.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as temp:
        shutil.copytree(ROOT/'dist',Path(temp)/slug)
        server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=temp))
        threading.Thread(target=server.serve_forever,daemon=True).start()
        try:
            with sync_playwright() as p:
                browser=p.chromium.launch(executable_path=os.getenv("CHROME_BIN")); page=browser.new_page(viewport={'width':1440,'height':1050})
                errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
                svg='<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#dce4d5"/></svg>'
                page.route('https://tile.openstreetmap.org/**',lambda r:r.fulfill(content_type='image/svg+xml',body=svg))
                wms=[]
                def imagery(route):
                    q=parse_qs(urlsplit(route.request.url).query)
                    assert q.get('layers')==['halifax'] and q.get('time') in [['1947-07-01T12:00:00Z'],['1977-07-01T12:00:00Z']]
                    wms.append(q); route.fulfill(content_type='image/svg+xml',body=svg)
                page.route('https://datacube.services.geo.ca/ows/aerial*',imagery)
                base=f'http://127.0.0.1:{server.server_port}/{slug}/'
                page.goto(base)
                if slug=='halifaxtimelens':
                    expect(page.locator('#status')).to_contain_text('Comparison ready')
                    assert {q['time'][0][:4] for q in wms}=={'1947','1977'}
                    page.goto(base+'#story=cogswell')
                    expect(page.locator('#place-title')).to_have_text('Cogswell and Scotia Square')
                    expect(page.locator('#story-records')).to_contain_text('4 June 1961')
                    expect(page.locator('#story-records a')).to_have_count(2)
                    page.locator('#story').select_option('narrows')
                    expect(page.locator('#story-records')).to_contain_text('Africville')
                    handle = page.locator('#drag-handle').bounding_box()
                    box = page.locator('#comparison').bounding_box()
                    page.mouse.move(handle['x']+handle['width']/2,handle['y']+handle['height']/2)
                    page.mouse.down()
                    page.mouse.move(box['x']+box['width']*.65,handle['y']+handle['height']/2)
                    page.mouse.up()
                    assert 63 <= int(page.locator('#reveal').input_value()) <= 67
                    page.locator('#photo-ferry').click()
                    expect(page.locator('#photo-count')).to_contain_text('16 indexed photographs')
                    page.locator('#photo-year').select_option('1955')
                    expect(page.locator('#photo-list li')).to_have_count(2)
                    expect(page.locator('#year-evidence')).to_contain_text('1955')
                    expect(page.locator('#year-evidence')).to_contain_text('2001')
                    page.locator('#show-points').check()
                    expect(page.locator('#map .archive-dot')).to_have_count(2)
                    expect(page.locator('#right-map .archive-dot')).to_have_count(2)
                    page.locator('#photo-list button').first.click()
                    expect(page.locator('#saved-count')).to_contain_text('1 saved reference')
                    with page.expect_download() as info: page.locator('#export-photos').click()
                    collection = json.loads(Path(info.value.path()).read_text())
                    assert collection['features'][0]['properties']['year'] == 1955
                    assert collection['features'][0]['geometry']['coordinates'][0] < 0
                    page.locator('#reveal').fill('70')
                    assert '70%' in page.locator('#right-map').get_attribute('style')
                    page.locator('#right-year').select_option('satellite')
                    image = page.locator('#right-map img.leaflet-image-layer')
                    expect(image).to_be_visible()
                    page.wait_for_function("document.querySelector('#right-map img.leaflet-image-layer')?.naturalWidth === 2900")
                    page.locator('#swap').click()
                    expect(page.locator('#left-year')).to_have_value('satellite')
                    page.locator('#share').click()
                    assert 'left=satellite' in page.locator('#share-url').input_value()
                    page.locator('#swap').click()
                    page.locator('#right-year').select_option('streets')
                    expect(page.locator('#right-label')).to_have_text('Modern street map')
                    page.locator('[data-place="dartmouth"]').click()
                    expect(page.locator('#place-title')).to_have_text('Downtown Dartmouth')
                    archive = page.get_by_role('link', name='Find archival aerial photos around this map location')
                    expect(archive).to_have_attribute('href', re.compile(r'center=-63\.568[0-9]*%2C44\.665[0-9]*'))
                    params = parse_qs(urlsplit(archive.get_attribute('href')).query)
                    assert params['webmap'] == ['a4b041e843d2463b99e8680057076725']
                    assert params['level'] == ['15']
                    page.locator('#share').click(); url=page.locator('#share-url').input_value()
                    assert 'right=streets' in url and 'split=70' in url
                    page.goto(url); expect(page.locator('#right-year')).to_have_value('streets')
                    expect(page.locator('#reveal')).to_have_value('70')
                    expect(page.locator('#saved-list li')).to_have_count(1)
                    expect(page.locator('#photo-year')).to_have_value('1955')
                    expect(page.locator('#show-points')).to_be_checked()
                    page.locator('#saved-list').get_by_role('button',name='Remove',exact=True).click()
                    expect(page.locator('#export-photos')).to_be_disabled()
                    page.locator('#swap').click(); expect(page.locator('#left-year')).to_have_value('streets')
                elif slug=='hiddenwater':
                    page.locator('.result').first.wait_for()
                    page.locator('#in-view').uncheck(); page.locator('#query').fill('Yorkson')
                    page.locator('#filters button[type="submit"]').click()
                    page.locator('.result').first.wait_for(); assert 'Yorkson' in page.locator('.result').first.inner_text()
                    page.locator('.result').first.click(); page.locator('#detail h2').wait_for()
                    page.get_by_role('button',name='Share this segment').click()
                    url=page.locator('#share-url').input_value(); assert '#record=' in url
                    with page.expect_download() as info:page.locator('#geojson').click()
                    data=json.loads(Path(info.value.path()).read_text()); assert data['features'] and data['sources']
                    page.goto(url); page.locator('#detail h2').wait_for()
                    page.locator('#query').fill('nonexistentwaterwayzzzz'); page.locator('#filters button[type="submit"]').click()
                    expect(page.locator('#status')).to_contain_text('No matching'); assert page.locator('#csv').is_disabled()
                    page.locator('[data-place="city"]').click(); page.locator('.result').first.wait_for()
                else:
                    page.locator('.result').first.wait_for(); expect(page.locator('#count')).to_have_text(f"{len(json.loads((ROOT/'web/data/applications.json').read_text())['records']):,}")
                    page.locator('#changed').check(); assert int(page.locator('#count').inner_text().replace(',','')) <= len(json.loads((ROOT/'web/data/applications.json').read_text())['records'])
                    page.locator('#city-preset').click(); page.locator('.result').first.wait_for()
                    assert '0 Township' in page.locator('#map-caption').inner_text()
                    page.locator('.result').first.click(); page.locator('#detail h2').wait_for()
                    page.get_by_role('button',name='☆ Save application',exact=True).click()
                    page.locator('#saved').check(); expect(page.locator('.result')).to_have_count(1)
                    page.get_by_role('button',name='Share',exact=True).click(); url=page.locator('#share-url').input_value()
                    page.goto(url); page.get_by_role('button',name='★ Remove from saved',exact=True).wait_for()
                    with page.expect_download() as info:page.locator('#csv').click()
                    assert 'snapshot_retrieved' in Path(info.value.path()).read_text()
                    page.locator('#query').fill('nonexistentprojectzzzz'); page.locator('#filters button[type="submit"]').click()
                    expect(page.locator('#status')).to_contain_text('No matching')
                    page.locator('#willoughby').click(); page.locator('.result').first.wait_for()
                page.screenshot(path=str(shots/'desktop.png'),full_page=True)
                page.set_viewport_size({'width':390,'height':844})
                assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), 'Mobile page overflows horizontally'
                page.screenshot(path=str(shots/'mobile.png'),full_page=True)
                if slug!='halifaxtimelens':
                    page.route('**/data/*.json',lambda r:r.fulfill(status=503,body='Unavailable'))
                    page.reload(); expect(page.locator('#status')).to_contain_text('could not load')
                if slug == 'halifaxtimelens':
                    capture_waterfront(browser, base, shots / 'percy')
                assert not errors, errors
                page.goto(base + 'cogswell.html#explore')
                page.wait_for_function("document.querySelector('#story').value === 'cogswell' && document.querySelector('#right-year').value === '1977'")
                assert page.locator('link[rel="canonical"]').get_attribute('href') == 'https://coolcode.ca/halifaxtimelens/cogswell.html'
                page.goto(base + 'dartmouth-ferry.html')
                page.wait_for_function("document.querySelector('#story').value === 'dartmouth' && document.querySelector('#right-year').value === 'satellite'")
                assert page.locator('link[rel="canonical"]').get_attribute('href') == 'https://coolcode.ca/halifaxtimelens/dartmouth-ferry.html'
                browser.close()
            print('Browser flows, source links, exports, saved/deep-link state, failure handling and mobile layout passed')
        finally:server.shutdown()
if __name__=='__main__': main()
