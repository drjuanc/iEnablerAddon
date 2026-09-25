# iEnablerAddon

Browser extension (Chrome/Edge) that improves the look and usability of the Walter Sisulu University ITS iEnabler portal. Formerly "Pimp iEnabler". Currently being rewritten and improved.

## Project structure

- `manifest.json`: extension manifest
- `background.js`: background/service worker script
- `config.js`: default settings and `mergeConfig`, shared by `background.js` (importScripts) and the popup. The config is an array of `[key, value]` pairs read by index in the popup (`content.js` reads it by key); removing an entry shifts every later index. `mergeConfig` also migrates old settings (e.g. drops `customLoginColors`)
- `content/`: content scripts injected into iEnabler pages
  - `content.js`: login page, and the main menu page and its frames (F1 menu, F3 content), including the subjects table. Theme, colours, accessibility and the dark colour scheme (`ie-dark`) apply and revert live via `chrome.storage.onChanged`
    - Login page: all its changes need "Use the improved login page" (`customLogin`, `body.customLogin`), not the modern look. With it on, the page also follows the Appearance settings WSU colours (`body.customLoginColors`), Colour scheme (`html.ie-dark`) and Hide the page footer (`html.ie-no-footer`), live via `chrome.storage.onChanged`; the login page switches apply live through messages to `background.js`
  - `css/`: styling for login page, main menu (`content.css`), frames (`framef1.css`, `framef3.css`), `accessibility.css`, `dark.css` (dark colour scheme, `html.ie-dark`, injected last) and shared variables
- `popup/`: extension popup (`popup.html`, `popup.js`, `popup.css`, `theme.js`), plain HTML, CSS and JS. Settings and About tabs. The Colour scheme setting (Automatic, Light, Dark; config `colourScheme`) always sets the popup's theme (`--pop*` roles in `content/css/variables.css`) and adds `ie-dark` to the iEnabler pages (main menu: with the modern look on; login page: with the improved login page on). In Appearance, WSU colours and Hide the page footer are enabled while the modern look or the improved login page is on; Accessibility enhancements only with the modern look
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

- Future task: convert the whole config from an index-based array to named keys everywhere (`config.js`, `popup.js`, `content.js`, `background.js`), with a migration in `mergeConfig`. Not started.

<!-- Add your goals here, for example:
- Migrate to Manifest V3 (if not already)
- Remove jQuery dependency
- Improve table filtering/sorting
- Dark mode
-->