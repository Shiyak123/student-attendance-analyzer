# Student Attendance Analyzer

A lightweight, simple, attractive, and effective static web application that parses Zoom and Excel student attendance workbooks (`.xlsx` / `.xls`) directly inside the user's browser, auto-detects attendance sheets and headers, and generates an interactive reporting dashboard.

---

## 🌟 Features

- **100% Client-Side & Private**: All Excel files are processed in memory using [SheetJS](https://sheetjs.com/). No student data or files are ever sent to a server.
- **Universal Excel Parsing**: Works with any attendance workbook, not just a single hard-coded file format.
- **Smart Sheet & Header Auto-Detection**: Automatically identifies sheets named `Final Attendance`, `Attendance`, `Students`, or `Result` and maps standard column headers (`Student ID`, `Student Name`, `Duration`, `Attendance %`, `Status`, `First Join`, `Remark`).
- **Flexible Calculation Engine**:
  - **Mode A**: Preserves existing pre-calculated `Attendance %` and `Status` values if present in Excel.
  - **Mode B**: Automatically calculates $\text{Attendance \%} = \min\left(100, \frac{\text{Total Duration}}{\text{Scheduled Duration}} \times 100\right)$ if percentage is missing.
- **Dynamic KPI Dashboard**: Instant summary metric cards for Total Students, Full Attendance, Present, Partial, Absent, and Average Attendance %.
- **Chart.js Visualizations**: Clear doughnut chart showing attendance category breakdown.
- **Live Search & Status Filtering**: Search instantly across Student Name, Student ID, and Registration ID. Filter by status (`All`, `Full Attendance`, `Present`, `Partial`, `Absent`).
- **Multi-Column Sorting**: Sort by Student Name, Attendance %, or Duration.
- **CSV Data Export**: One-click download of the currently filtered student table as a CSV file.
- **Zero Cost Hosting**: 100% static frontend deployable for free on **GitHub Pages**.

---

## 🛠️ Technology Stack

- **HTML5**: Semantic document structure.
- **CSS3**: Custom design system with CSS variables, light academic aesthetic, responsive grid/flexbox, and mobile horizontal table scrolling.
- **JavaScript (ES6+)**: Pure vanilla JS (no heavy frameworks or build toolchains).
- **SheetJS (`xlsx.full.min.js`)**: Fast browser-based Excel file parsing.
- **Chart.js (v4)**: Dynamic responsive charts.

---

## 📊 Reference Sample Dataset Stats

When clicking **"View Sample Dashboard"**, the application loads the real reference dataset extracted from `QS4QS_Attendance_Management.xlsx` (`Final Attendance` sheet):

- **Total Students**: `101`
- **Full Attendance (100%)**: `28`
- **Present (75%–99%)**: `7`
- **Partial (1%–74%)**: `12`
- **Absent (0%)**: `54`
- **Missing Student IDs**: `8` (rendered cleanly as `"Not Available"`)
- **Average Attendance**: `39%` (38.6%)

---

## 🚀 How to Run Locally

Since this is a 100% static web application, no Node.js backend, server, or build step is required!

### Option A: Open Directly in Browser
Double-click `index.html` or open it with any web browser (Chrome, Edge, Firefox, Safari).

### Option B: Local Development Server
Using Python:
```bash
python -m http.server 8000
```
Or using Node `serve` / VS Code Live Server:
```bash
npx serve .
```
Then visit `http://localhost:8000`.

---

## 🌐 Deploying to GitHub Pages (Free Hosting)

Follow these simple steps to deploy your repository to GitHub Pages:

### 1. Initialize Git & Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - Student Attendance Analyzer"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/student-attendance-analyzer.git
git push -u origin main
```

### 2. Enable GitHub Pages in Repository Settings
1. Go to your GitHub repository: `https://github.com/YOUR_USERNAME/student-attendance-analyzer`.
2. Click **Settings** $\rightarrow$ **Pages** (in the left sidebar under Code and automation).
3. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch` (or choose `GitHub Actions` if using the included workflow).
   - **Branch**: Select `main` and folder `/ (root)`.
4. Click **Save**.

Your dashboard will be live at:
`https://YOUR_USERNAME.github.io/student-attendance-analyzer/`

---

## 📋 License

MIT License. Open source and free to use for academic and institutional attendance reporting.
