# iEnablerAddon

Browser extension (Chrome/Edge) that improves the look and usability of the Walter Sisulu University ITS iEnabler portal. Formerly "Pimp iEnabler". Currently being rewritten and improved.

## Project structure

- `manifest.json`: extension manifest
- `background.js`: background service worker: saves the defaults on install and runs `mergeConfig` on update. No messages: the pages apply settings themselves
- `config.js`: default settings and `mergeConfig`, shared by `background.js` (importScripts) and the popup. The config is an array of `[key, value]` pairs read by index in the popup (`content.js` reads it by key); removing an entry shifts every later index. `mergeConfig` also migrates old settings (drops `customLoginColors`; folds `customLogin` into `customTheme`, on if either was on)
- `content/`: content scripts injected into iEnabler pages
  - `content.js`: login page, and the main menu page and its frames (F1 menu, F3 content), including the subjects table. Theme, colours, accessibility and the dark colour scheme (`ie-dark`) apply and revert live via `chrome.storage.onChanged`
    - Login page (`applyLogin`): "Use the modern look" (`customTheme`) is its master switch too (`body.customLogin`: layout, labels, header/PIN/hint text fixes). With it on, the page follows Appearance: WSU colours (`body.customLoginColors`), Colour scheme (`html.ie-dark`), Hide the page footer (`html.ie-no-footer`), Accessibility enhancements (`html.ie-a11y`: radio labels and fieldset, autocomplete, PIN hint, `lang`, `role="main"`; undo group `loginA11y`), and the Login page options (logo, pre-select, Prospective Students box). All live via `chrome.storage.onChanged`
  - `css/`: styling for login page, main menu (`content.css`), frames (`framef1.css`, `framef3.css`), `accessibility.css`, `dark.css` (dark colour scheme, `html.ie-dark`, injected last) and shared variables
- `popup/`: extension popup (`popup.html`, `popup.js`, `popup.css`, `theme.js`), plain HTML, CSS and JS. Settings and About tabs. The Colour scheme setting (Automatic, Light, Dark; config `colourScheme`) always sets the popup's theme (`--pop*` roles in `content/css/variables.css`) and adds `ie-dark` to the iEnabler pages and the login page with the modern look on. Every other option, in Appearance and in the Login page section, is disabled (shown off, keeping its own setting) while the modern look is off
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

- Future task: convert the whole config from an index-based array to named keys everywhere (`config.js`, `popup.js`; `content.js` already reads by key), with a migration in `mergeConfig`. Not started.

<!-- Add your goals here, for example:
- Migrate to Manifest V3 (if not already)
- Remove jQuery dependency
- Improve table filtering/sorting
- Dark mode
-->