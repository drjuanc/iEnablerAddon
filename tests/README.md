# Tests

Development-only mock-page tests for `content/content.js`. They load the content script into
anonymised copies of iEnabler pages with [jsdom](https://github.com/jsdom/jsdom), so no login or
live portal is needed. They are not part of the extension: `tests/` is left out of GitHub's
**Download ZIP** and of `git archive` (see `.gitattributes`), and nothing in `manifest.json` refers to it.

| File | What it checks |
|---|---|
| `sim.js` | Paste from Excel and deregistered flagging: page detection (w06, w26, w24, IAHY, form action variants), paste validation, `chk_outOf` on w24, student count and row numbers (count text, numbers 1..n, flagged rows, submitted fields unchanged), w06/w26/IAHY behaviour unchanged |
| `subjects.js` | The "Search subjects" filter with `do_menu` and `doMenu` links, no filter on marks pages, Ctrl+click / Ctrl+Enter on the subject pop-up menu. Runs the script inside a mock `mi_main_menu` frame F3 |

## Running them

Needs Node.js 18 or later. From the repo folder, in WSL:

```bash
cd tests
npm install                      # once: installs jsdom into tests/node_modules
node sim.js && node subjects.js  # runs both files
```

`npm test` does the same, but only with a Linux npm (`sudo apt install npm`). If `which npm`
shows a `/mnt/c/...` path, that is the Windows npm, which cannot run scripts from a
`\\wsl.localhost` folder ("UNC paths are not supported"): use the `node` line above.

Each prints a `PASS` or `FAIL` line per check, ends with `All passed` or `N FAILED`, and exits
non-zero on any failure. To run one file: `node sim.js` or `node subjects.js`.

To test another copy of the script, such as the version on `main`, pass its path:

```bash
git show main:content/content.js > /tmp/content.main.js
node sim.js /tmp/content.main.js
```

## Notes

- jsdom does no layout and does not load frames by name, so the files stub what they need:
  every element counts as shown (for the IAHY page's visibility check), the F3 frame's name is
  set by hand and served from a portal URL, and `chrome.storage` answers at once with the
  modern look on.
- Keep the mock pages anonymised: made-up student numbers, names and tokens only.
- `tests/node_modules/` is ignored by Git. It sits inside the folder Chrome loads unpacked, which
  does no harm, but delete it if you want a lean copy.
