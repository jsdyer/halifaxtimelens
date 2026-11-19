# Halifax Time Lens

Compare Halifax and Dartmouth aerial photographs from 1947 and 1977, then find nearby photographs from the Halifax Municipal Archives index.

<!-- coolcode:guide -->
Choose the 2025 satellite layer on either side to compare the harbour with an earlier aerial mosaic. Start with Cogswell and Scotia Square to compare the blocks before clearance with the 1977 mosaic, then open the 1961 photograph and the later demolition view. At the ferry terminal, see the closest 1955 and 2001 archive references within one kilometre, show the indexed points on both maps, and save references to a downloadable GeoJSON notebook.
<!-- /coolcode:guide -->

**[Open the live browser tool](https://coolcode.ca/halifaxtimelens/)** · [CoolCode catalogue](https://coolcode.ca/)

No installation or account is needed to use the tool. This repository contains its independent source, tests and GitHub Pages publishing workflow.

## What you can do

- Drag the reveal slider, pan and zoom synchronized maps, and swap the two sides.
- Jump to the waterfront, North End, Dartmouth, Northwest Arm or Bedford Basin.
- Choose the **29 September 2025 satellite image** or a modern **street map** on either side and share the exact comparison view.
- Open the [Halifax Municipal Archives photo index](https://www.halifax.ca/about-halifax/municipal-archives/exhibits/historical-aerial-photos) at the current map location to explore photographs from 1955–2001. Select a point in the index for archival details, or browse the [Flying to the Past album](https://archives.novascotia.ca/communityalbums/halifaxarchives/).

## Photographic guides and research notebook

Four guides centre the mosaics on the subject of a pair of historical photographs. Each links to the individual archive records, with their reference codes and published dates. The dates of the photographs can be approximate. The suggested map centres locate the neighbourhood, while the original oblique photographs each show a different angle.

| Guide | Earlier source | Later source |
| --- | --- | --- |
| [Cogswell and Scotia Square](https://coolcode.ca/halifaxtimelens/#story=cogswell) | [Downtown Halifax, 4 June 1961](https://archives.novascotia.ca/communityalbums/halifaxarchives/archives/?ID=437) | [Demolition for Scotia Square, circa 1962–1965](https://archives.novascotia.ca/communityalbums/halifaxarchives/archives/?ID=439) |
| [Dartmouth ferry landing](https://coolcode.ca/halifaxtimelens/#story=dartmouth) | [Portland Street, 1950s](https://archives.novascotia.ca/communityalbums/halifaxarchives/archives/?ID=465) | [Queen Street and City Hall, 1960s](https://archives.novascotia.ca/communityalbums/halifaxarchives/archives/?ID=467) |
| [Point Pleasant and the container terminal](https://coolcode.ca/halifaxtimelens/#story=terminal) | [Rail yards and piers, 1960s to 1967](https://archives.novascotia.ca/communityalbums/halifaxarchives/archives/?ID=440) | [Park and terminal, 1980s](https://archives.novascotia.ca/communityalbums/halifaxarchives/archives/?ID=445) |
| [Shannon Park and the MacKay Bridge](https://coolcode.ca/halifaxtimelens/#story=narrows) | [Bedford Institute, 9 September 1965](https://archives.novascotia.ca/communityalbums/halifaxarchives/archives/?ID=441) | [Shannon Park and bridge, 1970s](https://archives.novascotia.ca/communityalbums/halifaxarchives/archives/?ID=475) |

The year cards summarise the complete municipal index within the chosen radius and identify the closest record in each year. The year selector filters the list and optional map dots. Proximity measures the distance between indexed locations and the map centre. The photo may face a different direction or cover different ground. Each saved location exports with its municipal ID, archival reference, year, coordinates and catalogue URL when supplied. The GeoJSON also records the index source and retrieval date.

## Imagery and coverage

[NRCan’s Halifax aerial-photograph mosaic](https://open.canada.ca/data/en/dataset/4e8e3c6a-c961-4def-bdc7-f24823462818) provides georeferenced historical imagery under the Open Government Licence – Canada. Original mosaic resolution is 1 m for 1947 and 0.5 m for 1977. Coverage is the published Halifax-area footprint, not all of HRM or Nova Scotia.

- Capabilities: `https://datacube.services.geo.ca/web/napl-halifax.xml`
- Map tiles: `https://datacube.services.geo.ca/ows/aerial`
- Layer: `halifax`; WMS 1.3.0; time: `1947-07-01T12:00:00Z` or `1977-07-01T12:00:00Z`.

The capabilities URL describes the service; it does not render images. The app uses the advertised GetMap endpoint. Historical images may have alignment differences and seams. A comparison is not a precise boundary or change measurement. The [Sentinel-2C Level-2A scene](https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a/items/S2C_20TMQ_20250929_0_L2A) supplies the true-colour satellite layer. Contains modified Copernicus Sentinel data 2025, distributed under the [Copernicus Sentinel data terms](https://dataspace.copernicus.eu/terms-and-conditions). Its observation time was 15:20 UTC on 29 September 2025. The 10 m source visual is clipped to the Halifax region, reprojected to Web Mercator and resampled to approximately 13 m on the ground. The compressed image loads from this site. The modern street map changes independently. If imagery fails, the app displays a notice and links to the official source.

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

The static build is offline; historical imagery loads from NRCan when a visitor explores. A weekly Action refreshes the [municipal photo index](https://services2.arcgis.com/11XBiaBYA9Ep0yNJ/arcgis/rest/services/Historical_Aerial_Photographs_Index/FeatureServer/0). The bundled file records its retrieval date separately from the mosaic dates. All index locations are included, including entries without a catalogue link. Distance is measured to the indexed point, which may be an oblique view and does not describe a photo footprint. Photo reproductions remain at the archives. CI substitutes external tiles to test the UI deterministically. Real NRCan imagery was checked separately in the browser; CI cannot guarantee continuing upstream availability.

## Privacy

The app stores only the photo IDs you choose to save to the notebook. Remove a reference to delete it from the notebook. When local storage is unavailable, saved references last for the current page session. NRCan receives image requests for the map area; OpenStreetMap receives street-map tile requests. There are no accounts or analytics. Sharing places the comparison view, guide and photo filters in the URL; it does not upload private files. External source links open the original provider.
