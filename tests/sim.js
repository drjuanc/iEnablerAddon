// Mock-page tests for Paste from Excel and deregistered flagging (w06, w26, w24, IAHY).
// Usage: node sim.js [path/to/content.js]  (default: the repo's content/content.js). See README.md
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(process.argv[2] || path.join(__dirname, '..', 'content', 'content.js'), 'utf8');
const BASE = 'https://ieweb.wsu.ac.za/pls/prodi41/';
let failed = 0;

function check(name, ok, detail) {
    if (!ok) failed++;
    console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  [' + detail + ']' : ''));
}

// w06/w26: tr.rldata (x_stno, x_mark, x_result, empty td.bdr_t), name in the next row (td.bdr_lbr).
// header: a tr.rlheader first, as in the portal's other tables (not yet seen on a live w06/w26 page)
function oldPage(action, n, header) {
    let rows = header ? '<tr class="rlheader"><td>Student Number</td><td>Mark</td><td>Result</td><td>&nbsp;</td></tr>' : '';
    for (let i = 1; i <= n; i++) {
        rows += `<tr class="rldata"><td><input name="x_stno" value="22000000${i}"></td><td><input type="text" name="x_mark" value="" maxlength="3"></td>
<td><select name="x_result"><option value="P">P</option><option value="F">F</option></select></td><td class="bdr_t">&nbsp;</td></tr>
<tr><td class="bdr_lbr">STUDENT ${i}</td></tr>`;
    }
    return `<html><body><form name="frmOne" action="${action}" method="post"><table>${rows}</table>
<input type="submit" value="Save"><input type="reset"></form></body></html>`;
}

// w24 (w24pkg.w24entermarks): anonymised, structure as reported from the live page
function w24Page(n) {
    let rows = '';
    for (let i = 1; i <= n; i++) {
        rows += `<tr class="mrdatadisp">
<td class="datacella">22000000${i}<input type="hidden" name="x_stno" value="22000000${i}"></td>
<td class="datacella" onmouseover="return overlib('STUDENT ${i}',CENTER);">SURNAME${i}, A</td>
<td class="datacelln">7${i}&nbsp;</td>
<td class="datacelln"><input type="text" name="x_mark" value="" size="3" maxlength="3" onchange="chk_outOf(this);"></td><td>()</td>
<td class="datacelln">&nbsp;</td><td class="datacelln">&nbsp;</td></tr>`;
    }
    const hidden = ['x_subj', 'x_cyr', 'x_exmcyr', 'x_exm1', 'x_paper', 'x_group', 'x_grptyp', 'x_camp', 'x_ot', 'x_chk', 'x_sorder', 'x_type']
        .map(name => `<input type="hidden" name="${name}" value="">`).join('');
    return `<html><head><script>window.checked = []; function chk_outOf(f) { window.checked.push(f.value); }</script></head>
<body><form name="frmOne" action="w24pkg.w24savemulti" method="post">${hidden}<table>
<tr class="mrheader"><td>Student Number</td><td>Student Name</td><td>Full Period Mark</td><td colspan="2">PAPER 1</td><td>Exam Mark</td><td>Final Mark</td></tr>
${rows}</table><input type="submit" value="Save"><input type="reset"></form></body></html>`;
}

function iahyPage() {
    return `<html><body><form name="frmOne" action="web.w06pkg.w06_upd_multi_proc" method="post">
<input type="text" name="x_multi_iahymark"><input type="hidden" name="x_rec_changed">
<input type="text" name="x_multi_iahymark"><input type="hidden" name="x_rec_changed">
<input type="submit" value="Save"></form></body></html>`;
}

// Loads the content script in a frame-less page; the paste prompt answers with `answers` in turn
function load(html, url) {
    const dom = new JSDOM(html, { url, runScripts: 'dangerously', pretendToBeVisual: true });
    const w = dom.window;
    w.errors = [];
    w.alerts = [];
    w.answers = [];
    w.matchMedia = () => ({ matches: false, addEventListener() { } });
    w.chrome = {
        storage: { sync: { get(cb) { cb({ config: [['customTheme', true]] }); } }, onChanged: { addListener() { } } },
        runtime: { lastError: null, getURL: p => p }
    };
    w.prompt = () => w.answers.shift();
    w.alert = msg => w.alerts.push(msg);
    w.confirm = () => true;
    w.scrollTo = () => { };
    // jsdom does no layout: treat every element as shown, for isVisible on the IAHY page
    w.HTMLElement.prototype.getClientRects = () => [{}];
    w.addEventListener('error', e => w.errors.push(e.message));
    try { w.eval(src); } catch (e) { w.errors.push(e.message); }
    return w;
}

function paste(w, text) {
    w.answers.push(text);
    const b = w.document.getElementById('btnPaste');
    if (b) b.click();
}

const marks = w => Array.from(w.document.querySelectorAll('input[name="x_mark"]')).map(f => f.value);

// --- Detection ---
console.log('== Detection');
[
    ['w06 relative action', oldPage('w06pkg.w06savemulti', 2), true, true],
    ['w26 relative action', oldPage('w26pkg.w26savemulti', 2), true, true],
    ['w06 absolute path, mixed case', oldPage('/pls/prodi41/W06PKG.w06SaveMulti', 2), true, true],
    ['w06 full URL with query', oldPage(BASE + 'w06pkg.w06savemulti?x=1', 2), true, true],
    ['IAHY', iahyPage(), true, false],
    ['w24', w24Page(5), true, false],
    ['unknown action', oldPage('w99pkg.other', 2), false, false],
    ['empty action', oldPage('', 2), false, false],
    ['broken action', oldPage('https://[bad', 2), false, false],
].forEach(([name, html, button, dereg]) => {
    const w = load(html, BASE + 'page');
    const b = w.document.getElementById('btnPaste');
    check(name + ': button ' + (button ? 'shown' : 'absent'), !!b == button);
    check(name + ': dereg panel ' + (dereg ? 'shown' : 'absent'), !!w.document.querySelector('.ienablerDeregPanel') == dereg);
    check(name + ': no script errors', !w.errors.length, w.errors.join('; '));
    if (b) check(name + ': button is a keyboard-focusable labelled input[type=button]',
        b.tagName == 'INPUT' && b.type == 'button' && b.value == 'Paste from Excel' && b.tabIndex == 0);
});

// --- w24 paste ---
console.log('== w24 paste');
{
    const w = load(w24Page(5), BASE + 'w24pkg.w24entermarks');
    paste(w, '55\r\n60\r\n\r\n100\r\n0\r\n');
    check('marks filled in order, blank line leaves the mark empty', JSON.stringify(marks(w)) == '["55","60","","100","0"]', marks(w).join(','));
    check('chk_outOf ran once per field', JSON.stringify(w.checked) == '["55","60","","100","0"]', w.checked.join(','));
    check('no alerts', !w.alerts.length, w.alerts.join(' | '));
    check('hidden fields untouched', Array.from(w.document.querySelectorAll('input[type=hidden]:not([name=x_stno])')).every(f => f.value === ''));
}
{
    const w = load(w24Page(5), BASE + 'w24pkg.w24entermarks');
    paste(w, '55\n7.5\n101\n-3\n40\n');
    check('decimals, >100 and negatives rejected, nothing written', marks(w).every(v => v === '') && /Nothing was pasted/.test(w.alerts[0]), w.alerts[0] && w.alerts[0].split('\n').slice(2).join(' / '));
    check('chk_outOf not run when nothing is written', !w.checked.length);
}
{
    const w = load(w24Page(5), BASE + 'w24pkg.w24entermarks');
    paste(w, '55\n60\n70\n');
    check('wrong number of lines rejected', marks(w).every(v => v === '') && /Students to receive marks on this page: 5/.test(w.alerts[0]));
}
{
    const w = load(w24Page(5), BASE + 'w24pkg.w24entermarks');
    paste(w, '55\t1\n60\t2\n70\t3\n80\t4\n90\t5\n');
    check('more than one column rejected', marks(w).every(v => v === '') && /only one column/.test(w.alerts[0]));
}

// --- w06/w26 unchanged ---
console.log('== w06 / w26 unchanged');
['w06pkg.w06savemulti', 'w26pkg.w26savemulti'].forEach(action => {
    const w = load(oldPage(action, 3), BASE + 'page');
    let events = 0;
    w.document.querySelectorAll('input[name="x_mark"]').forEach(f => { f.addEventListener('change', () => events++); f.addEventListener('input', () => events++); });
    paste(w, '10\n20\n30\n');
    check(action + ': paste fills marks', JSON.stringify(marks(w)) == '["10","20","30"]', marks(w).join(','));
    check(action + ': no input/change events fired (as before)', events == 0, events);

    // Flag 220000002 as deregistered (not in the registered list), then paste skips that row
    const list = w.document.getElementById('ienablerDeregList');
    if (!list) return check(action + ': dereg panel present', false);
    list.value = '220000001\n220000003\n';
    w.document.querySelector('.ienablerDeregButtons button').click();
    const flagged = w.document.querySelectorAll('tr.rldata[data-ienabler-dereg]');
    check(action + ': dereg flags the missing student', flagged.length == 1 && flagged[0].querySelector('[name=x_stno]').value == '220000002');
    paste(w, '11\n33\n');
    check(action + ': paste skips the flagged row', JSON.stringify(marks(w)) == '["11","20","33"]', marks(w).join(','));
});

// --- Student count and row numbers ---
console.log('== Student count and row numbers');
const countText = w => (w.document.getElementById('ienablerStudentCount') || {}).textContent;
const rowNos = w => Array.from(w.document.querySelectorAll('.ienablerRowNo')).map(s => s.textContent);
const formFields = w => JSON.stringify(Array.from(new w.FormData(w.document.forms.frmOne).entries()));
const oneToN = n => JSON.stringify(Array.from({ length: n }, (_, i) => (i + 1) + '-'));
const headerNo = row => row && row.cells[0].firstChild && row.cells[0].firstChild.className == 'ienablerRowNoHeader' ? row.cells[0].firstChild : null;
const fieldsBefore = {
    w06: formFields(new JSDOM(oldPage('w06pkg.w06savemulti', 3, true), { url: BASE + 'page' }).window),
    w26: formFields(new JSDOM(oldPage('w26pkg.w26savemulti', 3, true), { url: BASE + 'page' }).window),
    w24: formFields(new JSDOM(w24Page(5), { url: BASE + 'page' }).window),
};
[['w06', 'w06pkg.w06savemulti'], ['w26', 'w26pkg.w26savemulti']].forEach(([name, action]) => {
    const w = load(oldPage(action, 3, true), BASE + 'page');
    const d = w.document;
    const count = d.getElementById('ienablerStudentCount');
    check(name + ': count just above the table, after the button, outside the form', count && d.getElementById('btnPaste').nextElementSibling == count && count.nextElementSibling == d.forms.frmOne && !d.forms.frmOne.contains(count));
    check(name + ': count is "3 students"', countText(w) == '3 students', countText(w));
    check(name + ': count is plain text, not a live region', count && !count.hasAttribute('aria-live') && !count.hasAttribute('role'));
    check(name + ': rows numbered 1-..3-', JSON.stringify(rowNos(w)) == oneToN(3), rowNos(w).join(','));
    const hdr = headerNo(d.querySelector('tr.rlheader'));
    check(name + ': "No." aria-hidden at the start of the first header cell', !!hdr && hdr.textContent == 'No.' && hdr.getAttribute('aria-hidden') == 'true' && hdr.nextSibling.textContent == 'Student Number', d.querySelector('tr.rlheader').cells[0].textContent);
    check(name + ': header has no new column, only one "No."', d.querySelector('tr.rlheader').cells.length == 4 && d.querySelectorAll('.ienablerRowNoHeader').length == 1);
    check(name + ': each number is aria-hidden at the start of the first cell of its student row',
        Array.from(d.querySelectorAll('tr.rldata')).every(tr => tr.cells[0].firstChild.className == 'ienablerRowNo' && tr.cells[0].firstChild.getAttribute('aria-hidden') == 'true'));
    check(name + ': name rows untouched (one td.bdr_lbr, no number)', Array.from(d.querySelectorAll('td.bdr_lbr')).every(td => td.parentNode.cells.length == 1 && !td.querySelector('.ienablerRowNo')));
    check(name + ': no new columns', Array.from(d.querySelectorAll('tr.rldata')).every(tr => tr.cells.length == 4));
    check(name + ': submitted fields unchanged', formFields(w) == fieldsBefore[name]);

    d.getElementById('ienablerDeregList').value = '220000001\n220000003\n';
    d.querySelector('.ienablerDeregButtons button').click();
    check(name + ': count after flagging is "3 students (1 flagged)"', countText(w) == '3 students (1 flagged)', countText(w));
    const flaggedNo = d.querySelector('tr.rldata[data-ienabler-dereg] .ienablerRowNo');
    check(name + ': flagged row keeps its number', !!flaggedNo && flaggedNo.textContent == '2-');
    check(name + ': numbers still 1..3 after flagging', JSON.stringify(rowNos(w)) == oneToN(3), rowNos(w).join(','));
    paste(w, '11\n33\n');
    check(name + ': paste still skips the flagged row', JSON.stringify(marks(w)) == '["11","","33"]', marks(w).join(','));
    check(name + ': x_stno values unchanged', JSON.stringify(Array.from(d.querySelectorAll('[name=x_stno]')).map(f => f.value)) == '["220000001","220000002","220000003"]');

    d.querySelectorAll('.ienablerDeregButtons button')[1].click();
    check(name + ': count after Clear flags is "3 students"', countText(w) == '3 students', countText(w));
    check(name + ': numbers kept after Clear flags', JSON.stringify(rowNos(w)) == oneToN(3), rowNos(w).join(','));
});
{
    const w = load(w24Page(5), BASE + 'w24pkg.w24entermarks');
    const d = w.document;
    check('w24: count is "5 students"', countText(w) == '5 students', countText(w));
    check('w24: rows numbered 1-..5-', JSON.stringify(rowNos(w)) == oneToN(5), rowNos(w).join(','));
    check('w24: numbers are aria-hidden, in the student number cell', Array.from(d.querySelectorAll('tr.mrdatadisp')).every(tr => tr.cells[0].firstChild.className == 'ienablerRowNo' && tr.cells[0].firstChild.getAttribute('aria-hidden') == 'true'));
    check('w24: header row not numbered, no new columns', !d.querySelector('tr.mrheader .ienablerRowNo') && d.querySelector('tr.mrheader').cells.length == 6 && Array.from(d.querySelectorAll('tr.mrdatadisp')).every(tr => tr.cells.length == 7));
    const hdr = headerNo(d.querySelector('tr.mrheader'));
    check('w24: "No." aria-hidden at the start of the first header cell', !!hdr && hdr.textContent == 'No.' && hdr.getAttribute('aria-hidden') == 'true' && hdr.nextSibling.textContent == 'Student Number', d.querySelector('tr.mrheader').cells[0].textContent);
    check('w24: count just above the table, after the button', d.getElementById('btnPaste').nextElementSibling == d.getElementById('ienablerStudentCount') && d.getElementById('ienablerStudentCount').nextElementSibling == d.forms.frmOne);
    check('w24: submitted fields unchanged', formFields(w) == fieldsBefore.w24);
    paste(w, '1\n2\n3\n4\n5\n');
    const filled = Array.from(d.querySelectorAll('tr.mrdatadisp')).map(tr => (tr.querySelector('.ienablerRowNo') || {}).textContent + '=' + tr.querySelector('[name=x_mark]').value);
    check('w24: paste fills row n with line n', JSON.stringify(filled) == '["1-=1","2-=2","3-=3","4-=4","5-=5"]', filled.join(','));
}
{
    const w = load(oldPage('w06pkg.w06savemulti', 1), BASE + 'page');
    check('w06: one student is "1 student"', countText(w) == '1 student', countText(w));
    check('w06 without a header row: rows numbered, no "No." added', JSON.stringify(rowNos(w)) == oneToN(1) && !w.document.querySelector('.ienablerRowNoHeader'));
}
{
    const w = load(iahyPage(), BASE + 'page');
    check('IAHY: count is "2 students"', countText(w) == '2 students', countText(w));
    check('IAHY: no row numbers', !rowNos(w).length && !w.document.querySelector('.ienablerRowNoHeader'));
}
{
    const w = load(oldPage('w99pkg.other', 2), BASE + 'page');
    check('unknown page: no count, no row numbers', !w.document.getElementById('ienablerStudentCount') && !rowNos(w).length);
}

// --- IAHY unchanged ---
console.log('== IAHY unchanged');
{
    const w = load(iahyPage(), BASE + 'page');
    paste(w, '5\n6\n');
    const v = Array.from(w.document.querySelectorAll('input[name="x_multi_iahymark"]')).map(f => f.value);
    const c = Array.from(w.document.querySelectorAll('input[name="x_rec_changed"]')).map(f => f.value);
    check('IAHY: marks filled', JSON.stringify(v) == '["5","6"]', v.join(','));
    check('IAHY: x_rec_changed as before (offset by one)', JSON.stringify(c) == '["","Y"]', c.join(','));
}

console.log(failed ? '\n' + failed + ' FAILED' : '\nAll passed');
process.exit(failed ? 1 : 0);
