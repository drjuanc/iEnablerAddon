# iEnablerAddon

A browser extension for Chrome and Microsoft Edge that improves the look and usability of the Walter Sisulu University (WSU) ITS iEnabler portal (`ieweb.wsu.ac.za`). It was formerly known as "Pimp iEnabler".

The extension only changes how the portal looks and behaves in your own browser. It does not send your data anywhere, and everything it needs is included in the extension: no remote scripts or external services.

## Features

All settings are in the extension's popup (click the iEnablerAddon icon in the browser toolbar). Changes apply straight away to any open iEnabler pages, without reloading.

### Appearance

- **Use the modern look**: a cleaner, easier-to-read design for the iEnabler pages and the login page. This is the main switch. The other options (apart from the colour scheme) only apply while it is on.
- **WSU colours**: the official WSU colours for the menu, headings, tables and the login page.
- **Accessibility enhancements**: changes aimed at WCAG 2.2 AA:
  - clearer focus outlines
  - larger text and click areas
  - better keyboard and screen reader support, such as labelled fields, table headers, frame titles and a "Skip to content" link
- **Hide the page footer**: removes the bar of portal links (Contact Us, Disclaimer and others) at the bottom of the pages, giving more room.
- **Colour scheme**: Automatic (follows your device), Light or Dark, for the popup, the iEnabler pages and the login page.

### Login page

- **New WSU logo**: replaces the old low-resolution logo with the current one.
- **I log in as** (Student, Personnel, Alumni or Other) and **Pre-select my choice on the login page**: your choice is selected for you each time the login page opens.
- **Hide the Prospective Students box**: shows only the login box, for a tidier page.

With the modern look on, the login page also gets a clearer layout, better labels ("PIN", "Student number" or "Staff number") and buttons that fit on one row.

### Subjects table search

On pages with a subjects table, a search box above the table filters the rows as you type. It searches the subject codes, subject names and mark types, and shows how many subjects match. Mark type codes (for example MD or OS) show their full name when you hover over them.

### Paste from Excel

On the pages where you enter marks for many students at once, a **Paste from Excel** button fills in all the mark fields in one go:

1. In Excel, copy a single column of marks in the same order as the students appear on the page.
2. Click **Paste from Excel** and paste the column into the box.

If the number of marks does not match the number of students on the page, you are warned before anything is filled in.

## Installing (unpacked)

The extension is not in the Chrome Web Store or Microsoft Edge Add-ons, so you install it from its folder:

1. Download the code: on the [GitHub page](https://github.com/drjuanc/iEnablerAddon), choose **Code > Download ZIP**, then unzip it (or clone the repository with Git).
2. Open the extensions page:
   - Chrome: go to `chrome://extensions`
   - Edge: go to `edge://extensions`
3. Turn on **Developer mode** (top right in Chrome, left-hand panel in Edge).
4. Click **Load unpacked** and choose the unzipped folder (the one that contains `manifest.json`).
5. Optionally, pin iEnablerAddon to the toolbar so its settings are one click away.

To update, replace the folder with the new version and click the reload button on the extension's card on the extensions page. Your settings are kept.

## Author

**Dr Juan Carlos Garcia-Alonso**
Department of Family Medicine and Rural Health, Walter Sisulu University

- Email: [dr.juanc@gmail.com](mailto:dr.juanc@gmail.com)
- GitHub: [https://github.com/drjuanc/iEnablerAddon](https://github.com/drjuanc/iEnablerAddon)

To report a problem, use **Report a problem** on the About tab of the extension's popup, or open an issue on GitHub.
