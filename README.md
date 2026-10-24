# Compact Pane for Zotero

Compact Pane reduces clutter in Zotero's metadata pane. It shows a smaller set of fields suited to the item type, lets you expand the full field list, and adds a command for copying attachment paths.

## Install

Current version: **0.3.2**. Supported target: **Zotero 9.x and 10.0.x on macOS**. No companion add-on is required.

1. Download [`zotero-compact-pane.xpi`](https://github.com/kvarnelis/zotero-compact-pane/releases/latest/download/zotero-compact-pane.xpi) from [Releases](https://github.com/kvarnelis/zotero-compact-pane/releases).
2. In Zotero, open the Add-ons Manager and choose **Install Add-on From File…**.
3. Select the XPI and restart Zotero.

After this version is installed, Zotero can check this repository's `updates.json` for future releases. Downloading and installing a newer XPI manually also works.

## Use

Select an item and use the compact/expanded field control in its information pane. Compact mode chooses fields by item type; expanded mode returns the full metadata view. Switching views does not remove metadata from the item.

The add-on also adds **Copy Attachment Path** to the item context menu. For a parent item, it looks for its attachments. A small guard prevents a repeated duplicate-merge command while an earlier merge is still being handled.

## Limits

The implementation patches Zotero's internal metadata, sidenav, and duplicate-merge interface components, so upstream UI changes can affect it. Current testing targets macOS. This standalone component has not received a full UI acceptance test. The repository's test script checks JavaScript syntax; no separate behavioral tests were present in the source being extracted.

## Build and check

Building requires a Unix shell, `zip`, and Python 3. Syntax checks and any included unit tests require Node.js. End users installing an XPI do not need these developer tools.

```sh
./scripts/build.sh
./scripts/test.sh
```

The package is written to `dist/zotero-compact-pane.xpi`. The build also regenerates `updates.json` with the package's SHA-256 hash and versioned release URL. To publish an update, change the version in `manifest.json`, build and check, commit the new update manifest, and attach that exact XPI to release `v<version>`.

Keep examples synthetic. Do not commit library exports, conversations, personal configuration, or screenshots containing private material.

## License

No repository-wide license has been specified. Author attribution is retained in the add-on manifest.
