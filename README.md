# iEnablerAddon

A Chrome/Edge browser extension that improves the look and usability of the [Walter Sisulu University](https://www.wsu.ac.za/) ITS iEnabler portal (`ieweb.wsu.ac.za`).

Formerly published as *Pimp My iEnabler*.

## What it does

The stock iEnabler pages are dense, dated and awkward on modern displays. This extension restyles them without changing how the portal works.

- **Modern look** — a cleaner, easier-to-read design for the login page and the pages after login, including the menu and the subjects table.
- **WSU colours** — official WSU branding on the menu, headings, tables and login box.
- **Accessibility enhancements** — clearer focus outlines, larger text and click areas, proper labels, and better keyboard and screen reader support.
- **Colour scheme** — Automatic (follows the device), Light or Dark, applied to the popup, the iEnabler pages and the login page.
- **Hide the page footer** — removes the bar of portal links at the bottom.
- **Login page tweaks** — replace the low-resolution logo with the current WSU logo, pre-select who you log in as (Student, Personnel, Alumni or Other), and hide the Prospective Students box.

The extension is self-contained: no remote scripts, no CDNs, no tracking. It only runs on `ieweb.wsu.ac.za`.

## Install

Load the extension unpacked:

1. Download or clone this repository.
2. Open `chrome://extensions` (or `edge://extensions`) and turn on **Developer mode**.
3. Click **Load unpacked** and select the project folder.
4. Open the iEnabler portal — the extension applies straight away.

## Usage

Click the iEnablerAddon toolbar icon to open the popup.

- **Settings** — turn options on and off. **Use the modern look** is the master switch: every other option in Appearance and Login page applies only while it is on. The Colour scheme always sets the popup's theme, and applies to the portal when the modern look is on. Changes take effect live on any open iEnabler tab.
- **About** — version, author and a link to report a problem.

## Development

- Extension manifest: `manifest.json` (Manifest V3).
- Default settings and migration: `config.js`, shared by `background.js` and the popup.
- Content scripts and styling: `content/`.
- Popup UI: `popup/`.
- Assets (fonts, icons, WSU logo): `assets/`.
- Third-party libraries: `lib/` — do not edit.

See [`CLAUDE.md`](CLAUDE.md) for the full project layout and conventions.

## Author

Dr Juan Carlos Garcia-Alonso
Department of Family Medicine and Rural Health, Walter Sisulu University
[jgarcia-alonso@wsu.ac.za](mailto:jgarcia-alonso@wsu.ac.za)
