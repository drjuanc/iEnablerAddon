// Mock-frame tests for the subjects table filter (do_menu and doMenu), marks pages and Ctrl+click.
// Usage: node subjects.js [path/to/content.js]  (default: the repo's content/content.js). See README.md
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(process.argv[2] || path.join(__dirname, '..', 'content', 'content.js'), 'utf8');
const TOP = 'https://ieweb.wsu.ac.za/pls/prodi41/w99pkg.mi_main_menu';
let failed = 0;

function check(name, ok, detail) {
    if (!ok) failed++;
    console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  [' + detail + ']' : ''));
}

// Loads the content script in frame F3 of a mock main menu page, modern look and Ctrl+click on.
// F3 is served from a portal URL (as on the live site), so links resolve as they do there
const { ResourceLoader } = require('jsdom');
const F3_URL = 'https://ieweb.wsu.ac.za/pls/prodi41/w06pkg.w06subjects';
async function inF3(body) {
    class Loader extends ResourceLoader {
        fetch(url) { return url == F3_URL ? Promise.resolve(Buffer.from('<html><body>' + body + '</body></html>')) : Promise.resolve(Buffer.from('')); }
    }
    const top = new JSDOM(`<html><body><iframe name="F3" src="${F3_URL}"></iframe></body></html>`,
        { url: TOP, runScripts: 'outside-only', pretendToBeVisual: true, resources: new Loader() });
    await new Promise(r => top.window.document.querySelector('iframe').addEventListener('load', r));
    const w = top.window.frames[0];
    w.name = 'F3'; // jsdom does not take the frame's name from the iframe's name attribute
    w.matchMedia = () => ({ matches: false, addEventListener() { } });
    w.chrome = {
        storage: { sync: { get(cb) { cb({ config: [['customTheme', true], ['ctrlClickNewTab', true]] }); } }, onChanged: { addListener() { } } },
        runtime: { lastError: null, getURL: p => p }
    };
    w.opened = [];
    w.open = (url, target, features) => w.opened.push([url, target, features]);
    w.errors = [];
    w.addEventListener('error', e => w.errors.push(e.message));
    try { w.eval(src); } catch (e) { w.errors.push(e.message); }
    return w;
}

// Typing in the search box: rows filter at once, the count after its 300 ms pause
async function search(w, text) {
    const box = w.document.getElementById('ienablerSearch');
    box.value = text;
    box.dispatchEvent(new w.Event('input'));
    await new Promise(r => setTimeout(r, 350));
    return Array.from(w.document.querySelectorAll('#tbSubjects tbody tr')).filter(r => !r.hidden).map(r => r.cells[0].textContent.trim());
}

const header = '<tr class="rlheader"><td>Subject</td><td>Type</td><td>Description</td><td>Paper</td><td>Mark 1</td><td>Mark 2</td></tr>';

// Old portal: do_menu, subject name in the 13th argument
function oldRow(code, name, desc) {
    return `<tr class="rldata"><td><a href="#" onclick="do_menu('2026','${code}','1','A','C','50','NF','x','y','1','2','3','${name}')">${code}</a></td>
<td>MD</td><td>${desc}</td><td>1</td><td>OS</td><td>ZZ</td></tr>`;
}

// New portal (live markup, tokens anonymised): return doMenu(...); 16 arguments, no subject name
function newRow(code, desc) {
    return `<tr class="rldata"><td><a href="#" onclick="return doMenu('${code}','2026','2026','11','1',
'A','C','50','NF','TOKEN0000000000000000000000000000A','TOKEN0000000000000000000000000000B','1','','','',''); return false;">${code}</a></td>
<td>MD</td><td>${desc}</td><td>1</td><td>OS</td><td>ZZ</td></tr>`;
}

const oldTable = `<table class="rltable">${header}${oldRow('AEM37W0', 'Emergency Medicine', 'Desc one')}${oldRow('BIO11A0', 'Biology', 'Desc two')}${oldRow('CHM21B0', 'Chemistry', 'Desc three')}</table>`;
const newTable = `<table class="rltable">${header}${newRow('AEM37W0', 'Emergency Medicine')}${newRow('BIO11A0', 'Human Biology')}${newRow('CHM21B0', 'Chemistry')}</table>`;

// Marks pages, as the portal serves them in F3
function marksPage(action, rowClass, withLink) {
    const link = withLink ? `<a href="#" onclick="return doMenu('X','2026'); return false;">X</a><a href="#" onclick="do_menu('2026','X')">X</a>` : '';
    return `<form name="frmOne" action="${action}"><table class="rltable"><tr class="rlheader mrheader"><td>Student Number</td><td>Mark</td></tr>
<tr class="${rowClass}"><td>220000001<input type="hidden" name="x_stno" value="220000001">${link}</td><td><input type="text" name="x_mark"></td></tr></table>
<input type="submit" value="Save"></form>`;
}

(async () => {
    console.log('== Subjects table, old markup (do_menu)');
    {
        const w = await inF3(oldTable);
        const box = w.document.getElementById('ienablerSearch');
        check('filter shown', !!box);
        check('no script errors', !w.errors.length, w.errors.join('; '));
        check('real <thead>, table id tbSubjects', !!w.document.querySelector('#tbSubjects thead th'));
        check('count', w.document.querySelector('.ienablerCount').textContent == '3 subjects', w.document.querySelector('.ienablerCount').textContent);
        check('search box labelled', w.document.querySelector('label[for="ienablerSearch"]').textContent == 'Search subjects');
        check('subject name (13th argument) set as the link title', w.document.querySelector('#tbSubjects a').title == 'Emergency Medicine');
        check('search finds a row by its subject name', JSON.stringify(await search(w, 'biology')) == '["BIO11A0"]');
        check('count after search', w.document.querySelector('.ienablerCount').textContent == '1 of 3 subjects');
    }

    console.log('== Subjects table, new markup (return doMenu(...), 16 arguments)');
    {
        const w = await inF3(newTable);
        check('filter shown', !!w.document.getElementById('ienablerSearch'));
        check('no script errors', !w.errors.length, w.errors.join('; '));
        check('count', w.document.querySelector('.ienablerCount').textContent == '3 subjects', w.document.querySelector('.ienablerCount').textContent);
        check('no subject name made up from doMenu arguments (no link title)', Array.from(w.document.querySelectorAll('#tbSubjects a')).every(a => !a.title));
        check('search by code', JSON.stringify(await search(w, 'chm21')) == '["CHM21B0"]');
        check('search by description (next cell)', JSON.stringify(await search(w, 'human bio')) == '["BIO11A0"]');
        check('search matches nothing', JSON.stringify(await search(w, 'zzz-none')) == '[]' && w.document.querySelector('.ienablerCount').textContent == 'No subjects match');
        check('clearing the search shows every row', (await search(w, '')).length == 3);
        check('onclick left untouched', /^return doMenu\('AEM37W0'/.test(w.document.querySelector('#tbSubjects a').getAttribute('onclick')));
    }

    console.log('== Not a subjects table');
    {
        const look = `<table class="rltable">${header}<tr><td><a href="#" onclick="undo_menu('x')">X</a></td></tr><tr><td><a href="#" onclick="window.domenuitem=1">Y</a></td></tr></table>`;
        check('undo_menu( and domenuitem do not count as subject links', !(await inF3(look)).document.getElementById('ienablerSearch'));
        const noHeader = `<table class="rltable">${newRow('AEM37W0', 'Desc')}</table>`;
        check('table without tr.rlheader gets no filter', !(await inF3(noHeader)).document.getElementById('ienablerSearch'));
    }

    console.log('== Marks pages: no filter, Paste from Excel still shown');
    for (const [name, action, rowClass] of [
        ['w06', 'w06pkg.w06savemulti', 'rldata'],
        ['w26', 'w26pkg.w26savemulti', 'rldata'],
        ['w24', 'w24pkg.w24savemulti', 'mrdatadisp'],
    ]) {
        // Worst case: the marks table looks like the subjects table and even has do_menu/doMenu links
        const w = await inF3(marksPage(action, rowClass, true));
        check(name + ': no filter', !w.document.getElementById('ienablerSearch'));
        check(name + ': Paste from Excel shown', !!w.document.getElementById('btnPaste'));
        check(name + ': no script errors', !w.errors.length, w.errors.join('; '));
    }

    console.log('== Ctrl+click on a subject menu option (current overlib pop-up, 4 tables)');
    {
        const popup = `<div id="overDiv"><table><tr><td><table><tr><td>AEM37W0</td></tr></table>
<table><tr><td><table><tr><td><a id="opt" href="w06pkg.w06marks_entry?x_subj=AEM37W0">Marks</a>
<a id="js" href="javascript:void(0)">Other</a></td></tr></table></td></tr></table></td></tr></table></div>`;
        const w = await inF3(newTable + popup);
        w.document.querySelector('#tbSubjects a').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
        check('pop-up menu table classed popUpContent', !!w.document.querySelector('table.popUpContent #opt'));
        const ctrl = new w.MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true, button: 0 });
        w.document.getElementById('opt').dispatchEvent(ctrl);
        const expected = TOP + '#ienabler-goto=' + encodeURIComponent('https://ieweb.wsu.ac.za/pls/prodi41/w06pkg.w06marks_entry?x_subj=AEM37W0');
        check('Ctrl+click opens the portal in a new tab at that page', w.opened.length == 1 && w.opened[0][0] == expected && ctrl.defaultPrevented, w.opened.map(o => o[0]).join(' '));
        w.document.getElementById('opt').dispatchEvent(new w.KeyboardEvent('keydown', { bubbles: true, cancelable: true, ctrlKey: true, key: 'Enter' }));
        check('Ctrl+Enter does the same', w.opened.length == 2);
        w.document.getElementById('js').dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true, button: 0 }));
        check('javascript: link left to the portal', w.opened.length == 2);
        w.document.getElementById('opt').dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
        check('plain click left to the portal', w.opened.length == 2);
    }

    console.log(failed ? '\n' + failed + ' FAILED' : '\nAll passed');
    process.exit(failed ? 1 : 0);
})();
