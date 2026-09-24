# iEnablerAddon

Browser extension (Chrome/Edge) that improves the look and usability of the Walter Sisulu University ITS iEnabler portal. Formerly "Pimp iEnabler". Currently being rewritten and improved.

## Project structure

- `manifest.json`: extension manifest
- `background.js`: background/service worker script
- `config.js`: default settings and `mergeConfig`, shared by `background.js` (importScripts) and the popup
- `content/`: content scripts injected into iEnabler pages
  - `content.js`: login page, and the main menu page and its frames (F1 menu, F3 content), including the subjects table. Theme, colours, accessibility and the dark colour scheme (`ie-dark`) apply and revert live via `chrome.storage.onChanged`
  - `css/`: styling for login page, main menu (`content.css`), frames (`framef1.css`, `framef3.css`), `accessibility.css`, `dark.css` (dark colour scheme, `html.ie-dark`, injected last) and shared variables
- `popup/`: extension popup (`popup.html`, `popup.js`, `popup.css`, `theme.js`), plain HTML, CSS and JS. Settings and About tabs. The Colour scheme setting (Automatic, Light, Dark; config `colourScheme`) always sets the popup's theme (`--pop*` roles in `content/css/variables.css`) and, adds `ie-dark` to the iEnabler pages (main menu: with the modern look on; login page: with the improved login page on)
- `assets/`: fonts, icons (16–128 px) and the WSU logo (`pics/wsu-logo-new.png`)
- `lib/`: third-party libraries. Do not edit these files.
  - Login page: `bootstrap.css` (content-script stylesheet, `*mi_login*` only)
  - Popup and portal pages after login: no libraries
  - No longer used, kept until they are removed: `bootstrap.min.css` and its `.map`, `bootstrap.bundle.min.js`, `jquery.min.js`

## Development environment

- Code lives in WSL (Ubuntu 24.04) at `~/iEnablerAddon`
- Editor: VS Code. When suggesting changes, give full file contents or clear edits, not bash heredocs.
- Testing: load unpacked in Chrome/Edge on Windows from `\\wsl.localhost\Ubuntu-24.04\home\crash\iEnablerAddon`
- GitHub: `drjuanc/iEnablerAddon`, default branch `main`

## Conventions

- Use UK/South African English in all text, comments and UI strings.
- Follow WSU branding (existing colours in `content/css/variables.css`, WSU logos in `assets/pics/`).
- Keep the extension self-contained: no remote scripts or CDNs.
- Preserve existing behaviour unless a change is explicitly agreed.

## Workflow rules

- Work on a feature branch, not directly on `main`.
- Explain the plan before making large changes.
- Do not commit or push without asking first.
- Do not modify anything in `lib/` unless asked to upgrade or remove a library.

## Rewrite goals

<!-- Add your goals here, for example:
- Migrate to Manifest V3 (if not already)
- Remove jQuery dependency
- Improve table filtering/sorting
- Dark mode
-->