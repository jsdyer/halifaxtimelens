import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
from xml.etree import ElementTree as ET
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from build import ROOT, build, metadata


class BuildTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        shutil.copytree(ROOT / "web", self.root / "web")
        shutil.copyfile(ROOT / "tool.json", self.root / "tool.json")

    def edit(self, **changes):
        tool = json.loads((self.root / "tool.json").read_text())
        tool.update(changes)
        (self.root / "tool.json").write_text(json.dumps(tool))

    def test_build_is_scoped_to_web_and_escapes_metadata(self):
        (self.root / "private.txt").write_text("must not publish")
        self.edit(title='<img src=x onerror="bad()">')
        build(self.root)
        page = (self.root / "dist/index.html").read_text()
        self.assertIn('&lt;img', page)
        self.assertNotIn('<img', page)
        self.assertNotIn('{{', page)
        self.assertIn('href="./style.css"', page)
        self.assertFalse((self.root / "dist/private.txt").exists())
        self.assertTrue((self.root / "dist/.nojekyll").exists())

    def test_new_index_record_changes_viewpoint_report_and_sitemap_matches_files(self):
        snapshot = self.root / "web/data/photos.json"
        data = json.loads(snapshot.read_text())
        data["photos"].append(["NEW", "Local test reference", 1999, 44.6642, -63.5694, ""])
        data["count"] += 1
        snapshot.write_text(json.dumps(data))
        build(self.root)
        out = self.root / "dist"
        profile = (out / "records/dartmouth-ferry-landing/index.html").read_text()
        self.assertIn("Local test reference",profile)
        self.assertIn("no catalogue URL supplied",profile)
        self.assertIn("101-80C-1-1.1",profile)
        self.assertIn("101-80C-1-1.2",profile)
        self.assertIn("right=satellite",profile)
        self.assertIn("https://coolcode.ca/postmarkplaces/records/offices/dartmouth/",profile)
        base = "https://coolcode.ca/halifaxtimelens/"
        urls = [el.text for el in ET.parse(out/"sitemap.xml").findall(".//{*}loc")]
        routes = {p.parent.relative_to(out).as_posix()+"/" for p in (out/"records").rglob("index.html")}
        self.assertEqual(set(urls),{base+route for route in routes})
        for route in routes:
            self.assertIn(f'<link rel="canonical" href="{base}{route}">', (out/route/"index.html").read_text())

    def test_url_matches_tool_id(self):
        self.edit(url="/different/")
        with self.assertRaises(ValueError): metadata(self.root)

    def test_browser_access_is_explicit(self):
        self.edit(access="install")
        with self.assertRaisesRegex(ValueError, "immediately usable"):
            metadata(self.root)

    def test_failed_build_keeps_existing_output(self):
        build(self.root)
        existing = (self.root / "dist/index.html").read_bytes()
        self.edit(source="javascript:bad()")
        with self.assertRaises(ValueError): build(self.root)
        self.assertEqual((self.root / "dist/index.html").read_bytes(), existing)


if __name__ == "__main__": unittest.main()
