# Halifax Time Lens

Compare Halifax and Dartmouth aerial photographs from 1947 and 1977.

**[Open the live browser tool](https://coolcode.ca/halifaxtimelens/)** · [CoolCode catalogue](https://coolcode.ca/)

No installation or account is needed to use the tool. This repository contains its independent source, tests and GitHub Pages publishing workflow.

## What you can do

- Drag the reveal slider, pan and zoom synchronized maps, and swap the two sides.
- Jump to the waterfront, North End, Dartmouth, Northwest Arm or Bedford Basin.
- Add a modern **street map** for orientation and share the exact comparison view.

## Imagery and coverage

[NRCan’s Halifax aerial-photograph mosaic](https://open.canada.ca/data/en/dataset/4e8e3c6a-c961-4def-bdc7-f24823462818) provides georeferenced historical imagery under the Open Government Licence – Canada. Original mosaic resolution is 1 m for 1947 and 0.5 m for 1977. Coverage is the published Halifax-area footprint, not all of HRM or Nova Scotia.

- Capabilities: `https://datacube.services.geo.ca/web/napl-halifax.xml`
- Map tiles: `https://datacube.services.geo.ca/ows/aerial`
- Layer: `halifax`; WMS 1.3.0; time: `1947-07-01T12:00:00Z` or `1977-07-01T12:00:00Z`.

The capabilities URL describes the service; it does not render images. The app uses the advertised GetMap endpoint. Historical images may have alignment differences and seams. A comparison is not a precise boundary or change measurement. Modern OpenStreetMap data is a street map, **not current aerial photography**. If imagery fails, the app displays a notice and links to the official source.

OpenStreetMap contributors supply the street map. Leaflet's licence is included in `web/vendor/LICENSE`.

## Development

```sh
node --test tests/*.test.mjs
python3 -m unittest discover -s tests -v
python3 scripts/build.py
```

The build writes `dist/` and works at the project subpath `/halifaxtimelens/`. Do not commit `dist/` or add a `CNAME`; the account’s main Pages site supplies the coolcode.ca domain. Node is used for tests, not a frontend dependency bundle.

`web/` contains the application; `scripts/` contains the offline builder; `tests/` contains model/source/build checks and Chromium user-flow tests. Browser checks cover project paths, controls, sharing, exports or layer selection, error handling, and mobile overflow. GitHub Actions installs their test-only dependencies from `tests/browser-requirements.txt`.

## Publishing and maintenance

`.github/workflows/pages.yml` checks pull requests and main commits. Only a successful main build deploys. Repository Settings → Pages must use **GitHub Actions**. The browser-checks artifact contains desktop/mobile screenshots. A failed build leaves the previous deployment in place.

`.github/dependabot.yml` enables **GitHub Dependabot**, which proposes updates to workflow actions and configured dependencies as pull requests. A proposal does not update main until merged. Review the diff and checks for the current PR commit before merging. Netlify is not used by this project.

`tool.json` describes this tool in the CoolCode catalogue. Its reviewed record belongs in `jsdyer/jsdyer.github.io/data/tools.json`; run that repository’s `scripts/sync_readme.py` to keep the hub README and polished homepage aligned. Changing this repository alone does not change the homepage listing.

## Source availability

The static build is offline; historical imagery loads from NRCan when a visitor explores. No scheduled data commit is needed for these fixed survey years. CI substitutes external tiles to test the UI deterministically. Real NRCan imagery was checked separately in the browser; CI cannot guarantee continuing upstream availability.

## Privacy

The app does not retain searches or location history. NRCan receives image requests for the map area; OpenStreetMap receives street-map tile requests. There are no accounts or analytics. Sharing places the selected record or comparison view in the URL; it does not upload private files. External source links open the original provider.
