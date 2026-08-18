/**
 * Student Attendance Analyzer - Main Application Controller
 * Manages view wizard states, file uploads, column mapping, search, filtering, sorting, CSV export & hash navigation.
 */

document.addEventListener('DOMContentLoaded', () => {
  const App = {
    state: {
      fileName: 'Sample Dataset',
      workbook: null,
      selectedSheet: '',
      sheetNames: [],
      grid: [],
      headers: [],
      mapping: {},
      scheduledDuration: 143,
      allRecords: [],
      filteredRecords: [],
      searchQuery: '',
      statusFilter: 'All',
      sortField: 'name', // 'name', 'attendance', 'duration'
      sortOrder: 'asc',
      currentView: 'view-landing'
    },

    hashMap: {
      'view-landing': 'landing',
      'view-sheet-select': 'sheet-select',
      'view-mapping': 'mapping',
      'view-dashboard': 'dashboard'
    },

    viewMap: {
      'landing': 'view-landing',
      'sheet-select': 'view-sheet-select',
      'mapping': 'view-mapping',
      'dashboard': 'view-dashboard'
    },

    init: function() {
      this.bindEvents();
      this.initRouting();
    },

    bindEvents: function() {
      // Landing buttons
      const excelFileInput = document.getElementById('excelFileInput');
      if (excelFileInput) {
        excelFileInput.addEventListener('change', (e) => this.handleFileSelect(e));
      }

      const btnSample = document.getElementById('btnSample');
      if (btnSample) {
        btnSample.addEventListener('click', () => this.loadSampleData());
      }

      // Wizard Sheet Selection
      const btnProceedSheet = document.getElementById('btnProceedSheet');
      if (btnProceedSheet) {
        btnProceedSheet.addEventListener('click', () => this.handleSheetConfirmed());
      }

      const btnBackToLanding = document.getElementById('btnBackToLanding');
      if (btnBackToLanding) {
        btnBackToLanding.addEventListener('click', () => this.switchView('view-landing'));
      }

      // Wizard Column Mapping
      const btnProceedMapping = document.getElementById('btnProceedMapping');
      if (btnProceedMapping) {
        btnProceedMapping.addEventListener('click', () => this.handleMappingConfirmed());
      }

      const btnBackToSheet = document.getElementById('btnBackToSheet');
      if (btnBackToSheet) {
        btnBackToSheet.addEventListener('click', () => this.switchView('view-sheet-select'));
      }

      // Dashboard Controls
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.state.searchQuery = e.target.value;
          this.applyFiltersAndRender();
        });
      }

      const statusPills = document.querySelectorAll('.pill-btn');
      statusPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
          statusPills.forEach(p => p.classList.remove('active'));
          e.target.classList.add('active');
          this.state.statusFilter = e.target.getAttribute('data-status');
          this.applyFiltersAndRender();
        });
      });

      const sortSelect = document.getElementById('sortSelect');
      if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
          this.state.sortField = e.target.value;
          this.applyFiltersAndRender();
        });
      }

      const btnReset = document.getElementById('btnReset');
      if (btnReset) {
        btnReset.addEventListener('click', () => this.resetToLanding());
      }

      const btnBackToLandingDash = document.getElementById('btnBackToLandingDash');
      if (btnBackToLandingDash) {
        btnBackToLandingDash.addEventListener('click', () => this.resetToLanding());
      }

      const btnExportCsv = document.getElementById('btnExportCsv');
      if (btnExportCsv) {
        btnExportCsv.addEventListener('click', () => this.exportCsv());
      }
    },

    initRouting: function() {
      // Listen for browser Back / Forward buttons & Hash changes
      window.addEventListener('hashchange', () => this.handleHashChange());
      window.addEventListener('popstate', () => this.handleHashChange());

      // Initial route resolution on page load
      this.handleHashChange();
    },

    handleHashChange: function() {
      const hash = window.location.hash.replace('#', '').trim();
      const targetView = this.viewMap[hash] || 'view-landing';

      // Validation guard for data presence
      if (targetView === 'view-dashboard' && this.state.allRecords.length === 0) {
        this.switchView('view-landing', true);
        return;
      }
      if (targetView === 'view-sheet-select' && !this.state.workbook) {
        this.switchView('view-landing', true);
        return;
      }
      if (targetView === 'view-mapping' && this.state.headers.length === 0) {
        this.switchView('view-landing', true);
        return;
      }

      this.switchView(targetView, false);
    },

    switchView: function(viewId, pushHash = true) {
      this.state.currentView = viewId;

      document.querySelectorAll('.view-section').forEach(sec => {
        sec.classList.remove('active');
      });
      const target = document.getElementById(viewId);
      if (target) target.classList.add('active');

      if (pushHash) {
        const hashName = this.hashMap[viewId] || 'landing';
        if (window.location.hash !== '#' + hashName) {
          window.history.pushState({ viewId: viewId }, '', '#' + hashName);
        }
      }
    },

    // 1. File Upload Processing
    handleFileSelect: async function(e) {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const result = await window.ExcelReader.readWorkbook(file);
        this.state.fileName = result.fileName;
        this.state.workbook = result.workbook;
        this.state.sheetNames = result.sheetNames;

        if (this.state.sheetNames.length === 0) {
          alert('The uploaded Excel workbook contains no sheets.');
          return;
        }

        // Detect recommended sheet
        this.state.selectedSheet = window.Analyzer.detectBestSheet(this.state.sheetNames);

        this.renderSheetSelectionView();
        this.switchView('view-sheet-select');
      } catch (err) {
        alert(err.message || 'Error processing Excel file.');
      }
    },

    // 2. Sheet Selection View
    renderSheetSelectionView: function() {
      document.getElementById('displayFileName').textContent = this.state.fileName;
      document.getElementById('displaySheetCount').textContent = `${this.state.sheetNames.length} sheets detected`;

      const select = document.getElementById('sheetSelectDropdown');
      select.innerHTML = '';

      this.state.sheetNames.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        if (name === this.state.selectedSheet) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
    },

    handleSheetConfirmed: function() {
      const select = document.getElementById('sheetSelectDropdown');
      this.state.selectedSheet = select.value;

      this.state.grid = window.ExcelReader.getSheetGrid(this.state.workbook, this.state.selectedSheet);

      if (this.state.grid.length <= 1) {
        alert('Selected sheet contains no data rows.');
        return;
      }

      this.state.headers = this.state.grid[0] || [];
      this.state.mapping = window.Analyzer.autoDetectColumns(this.state.headers);

      this.renderMappingView();
      this.switchView('view-mapping');
    },

    // 3. Mapping View
    renderMappingView: function() {
      const gridContainer = document.getElementById('mappingGrid');
      gridContainer.innerHTML = '';

      const fields = [
        { key: 'studentName', label: 'Student Name', required: true },
        { key: 'studentId', label: 'Student ID', required: false },
        { key: 'registrationId', label: 'Registration ID', required: false },
        { key: 'duration', label: 'Total Duration (Minutes)', required: true },
        { key: 'attendancePct', label: 'Attendance %', required: false },
        { key: 'status', label: 'Attendance Status', required: false },
        { key: 'firstJoin', label: 'First Join Time', required: false },
        { key: 'remark', label: 'Remark', required: false }
      ];

      fields.forEach(field => {
        const item = document.createElement('div');
        item.className = 'mapping-item';

        const isDetected = this.state.mapping[field.key] >= 0;

        let optionsHtml = `<option value="-1">-- Not Mapped --</option>`;
        this.state.headers.forEach((h, idx) => {
          const selected = this.state.mapping[field.key] === idx ? 'selected' : '';
          optionsHtml += `<option value="${idx}" ${selected}>${h || 'Column ' + (idx + 1)}</option>`;
        });

        item.innerHTML = `
          <div class="mapping-header">
            <span class="mapping-name">${field.label} ${field.required ? '<span style="color:#dc2626">*</span>' : ''}</span>
            <span class="mapping-status ${isDetected ? 'status-detected' : (field.required ? 'status-required' : 'status-optional')}">
              ${isDetected ? 'Auto-Detected' : (field.required ? 'Select Required' : 'Optional')}
            </span>
          </div>
          <select class="form-select mapping-select" data-field="${field.key}">
            ${optionsHtml}
          </select>
        `;

        gridContainer.appendChild(item);
      });

      // Bind mapping select changes
      document.querySelectorAll('.mapping-select').forEach(sel => {
        sel.addEventListener('change', (e) => {
          const fieldKey = e.target.getAttribute('data-field');
          this.state.mapping[fieldKey] = parseInt(e.target.value);
        });
      });
    },

    handleMappingConfirmed: function() {
      const scheduledInput = document.getElementById('scheduledDurationInput');
      if (scheduledInput) {
        this.state.scheduledDuration = parseInt(scheduledInput.value) || 143;
      }

      this.state.allRecords = window.Analyzer.processRecords(
        this.state.grid,
        this.state.mapping,
        this.state.scheduledDuration
      );

      if (this.state.allRecords.length === 0) {
        alert('No valid student records found after column mapping.');
        return;
      }

      this.renderDashboard();
      this.switchView('view-dashboard');
    },

    // 4. Sample Dataset Loader
    loadSampleData: async function() {
      try {
        const response = await fetch('./data/sample-data.json');
        if (!response.ok) {
          throw new Error('Failed to fetch sample dataset.');
        }
        const data = await response.json();
        
        this.state.fileName = 'QS4QS_Attendance_Management.xlsx (Sample)';
        this.state.selectedSheet = 'Final Attendance';
        this.state.allRecords = data;
        
        this.renderDashboard();
        this.switchView('view-dashboard');
      } catch (err) {
        alert('Could not load sample data: ' + err.message);
      }
    },

    // 5. Dashboard View Render & Controls
    renderDashboard: function() {
      // Set Header Titles
      document.getElementById('dashFileName').textContent = this.state.fileName;
      document.getElementById('dashSessionInfo').textContent = `Sheet: ${this.state.selectedSheet} | Scheduled: 143 min`;

      this.applyFiltersAndRender();
    },

    applyFiltersAndRender: function() {
      let result = [...this.state.allRecords];

      // A. Apply Search Filter
      if (this.state.searchQuery.trim() !== '') {
        const q = this.state.searchQuery.toLowerCase().trim();
        result = result.filter(r => {
          return (r.studentName && r.studentName.toLowerCase().includes(q)) ||
                 (r.studentId && r.studentId.toLowerCase().includes(q)) ||
                 (r.registrationId && r.registrationId.toLowerCase().includes(q));
        });
      }

      // B. Apply Status Filter
      if (this.state.statusFilter !== 'All') {
        result = result.filter(r => r.attendanceStatus === this.state.statusFilter);
      }

      // C. Apply Sorting
      result.sort((a, b) => {
        if (this.state.sortField === 'name') {
          return a.studentName.localeCompare(b.studentName);
        } else if (this.state.sortField === 'attendance') {
          return b.attendancePercentage - a.attendancePercentage; // High to Low
        } else if (this.state.sortField === 'duration') {
          return b.durationMinutes - a.durationMinutes; // High to Low
        }
        return 0;
      });

      this.state.filteredRecords = result;

      // D. Update KPI Stats (Calculated dynamically from dataset)
      const stats = window.Analyzer.calculateStatistics(this.state.allRecords);
      document.getElementById('kpiTotal').textContent = stats.totalStudents;
      document.getElementById('kpiFull').textContent = stats.fullAttendance;
      document.getElementById('kpiPresent').textContent = stats.present;
      document.getElementById('kpiPartial').textContent = stats.partial;
      document.getElementById('kpiAbsent').textContent = stats.absent;
      document.getElementById('kpiAvg').textContent = `${stats.averageAttendancePct}%`;

      // E. Update Chart.js Doughnut Chart
      window.ChartManager.renderChart('attendanceChart', stats);

      // F. Render Student Table
      this.renderStudentTable();
    },

    renderStudentTable: function() {
      const tbody = document.getElementById('studentTableBody');
      const counter = document.getElementById('recordCounter');

      counter.textContent = `Showing ${this.state.filteredRecords.length} of ${this.state.allRecords.length} students`;

      if (this.state.filteredRecords.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="empty-state">
              No matching student records found for the active filter.
            </td>
          </tr>
        `;
        return;
      }

      let rowsHtml = '';
      this.state.filteredRecords.forEach(r => {
        let badgeClass = 'badge-absent';
        if (r.attendanceStatus === 'Full Attendance') badgeClass = 'badge-full';
        else if (r.attendanceStatus === 'Present') badgeClass = 'badge-present';
        else if (r.attendanceStatus === 'Partial') badgeClass = 'badge-partial';

        const idDisplay = r.studentId === 'Not Available' ? `<span class="text-na">Not Available</span>` : r.studentId;
        const joinDisplay = r.firstJoin === 'Not Available' ? `<span class="text-na">Not Available</span>` : r.firstJoin;

        rowsHtml += `
          <tr>
            <td>${idDisplay}</td>
            <td><strong>${r.studentName}</strong></td>
            <td>${r.registrationId}</td>
            <td>${joinDisplay}</td>
            <td>${r.durationMinutes} min</td>
            <td><strong>${r.attendancePercentage}%</strong></td>
            <td><span class="badge ${badgeClass}">${r.attendanceStatus}</span></td>
            <td>${r.remark}</td>
          </tr>
        `;
      });

      tbody.innerHTML = rowsHtml;
    },

    // 6. CSV Exporter
    exportCsv: function() {
      if (!this.state.filteredRecords || this.state.filteredRecords.length === 0) {
        alert('No data to export.');
        return;
      }

      const headers = ['Student ID', 'Student Name', 'Registration ID', 'First Join', 'Duration (Min)', 'Attendance %', 'Status', 'Remark'];
      const csvRows = [headers.join(',')];

      this.state.filteredRecords.forEach(r => {
        const row = [
          `"${(r.studentId || '').replace(/"/g, '""')}"`,
          `"${(r.studentName || '').replace(/"/g, '""')}"`,
          `"${(r.registrationId || '').replace(/"/g, '""')}"`,
          `"${(r.firstJoin || '').replace(/"/g, '""')}"`,
          r.durationMinutes,
          r.attendancePercentage,
          `"${(r.attendanceStatus || '').replace(/"/g, '""')}"`,
          `"${(r.remark || '').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
      const link = document.createElement('a');
      link.setAttribute('href', csvContent);
      link.setAttribute('download', `Attendance_Report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    resetToLanding: function() {
      this.state.workbook = null;
      this.state.allRecords = [];
      this.state.filteredRecords = [];
      this.state.searchQuery = '';
      this.state.statusFilter = 'All';

      const fileInput = document.getElementById('excelFileInput');
      if (fileInput) fileInput.value = '';

      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.value = '';

      this.switchView('view-landing');
    }
  };

  App.init();
});
