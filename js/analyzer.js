/**
 * Student Attendance Analyzer - Core Analyzer Engine Module
 * Handles auto-detection of sheet names, headers, column mapping, and data normalization.
 */

window.Analyzer = {
  // Candidate terms for column matching
  patterns: {
    studentId: ['student id', 'studentid', 'id', 'registration id', 'reg id', 'student registration id'],
    studentName: ['student name', 'name', 'full name', 'student', 'studentname'],
    registrationId: ['registration id', 'registrationid', 'reg id', 'regid'],
    duration: ['total duration', 'duration', 'total duration (minutes)', 'duration (minutes)', 'minutes', 'total minutes', 'attendance duration'],
    attendancePct: ['attendance %', 'attendance percentage', 'present %', 'percentage', 'attendance pct'],
    status: ['attendance status', 'status', 'attendance category', 'category'],
    firstJoin: ['first join', 'join time', 'first join time', 'start time'],
    remark: ['remark', 'remarks', 'note', 'notes']
  },

  /**
   * Recommends the best sheet from the list of available sheet names
   * @param {string[]} sheetNames 
   * @returns {string}
   */
  detectBestSheet: function(sheetNames) {
    if (!sheetNames || sheetNames.length === 0) return '';
    
    // Priority 1: Exact or close match for "Final Attendance"
    const finalSheet = sheetNames.find(s => s.toLowerCase().trim() === 'final attendance');
    if (finalSheet) return finalSheet;

    // Priority 2: Sheets containing 'final' or 'attendance'
    const matchSheet = sheetNames.find(s => {
      const lower = s.toLowerCase();
      return lower.includes('final') || lower.includes('attendance') || lower.includes('students') || lower.includes('result');
    });

    return matchSheet || sheetNames[0];
  },

  /**
   * Normalizes header strings for comparison
   * @param {string} header 
   * @returns {string}
   */
  normalizeHeader: function(header) {
    if (!header) return '';
    return String(header).toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  },

  /**
   * Automatically attempts to map raw sheet column headers to standardized fields
   * @param {string[]} headers 
   * @returns {Object} mapping of field name -> column index
   */
  autoDetectColumns: function(headers) {
    const mapping = {
      studentId: -1,
      studentName: -1,
      registrationId: -1,
      duration: -1,
      attendancePct: -1,
      status: -1,
      firstJoin: -1,
      remark: -1
    };

    if (!headers || headers.length === 0) return mapping;

    const normalizedHeaders = headers.map(h => this.normalizeHeader(h));

    Object.keys(this.patterns).forEach(field => {
      const terms = this.patterns[field];
      
      // Try exact normalized match first
      for (let i = 0; i < normalizedHeaders.length; i++) {
        const h = normalizedHeaders[i];
        if (terms.includes(h)) {
          mapping[field] = i;
          break;
        }
      }

      // If no exact match, try substring match
      if (mapping[field] === -1) {
        for (let i = 0; i < normalizedHeaders.length; i++) {
          const h = normalizedHeaders[i];
          if (terms.some(t => h.includes(t) || t.includes(h))) {
            mapping[field] = i;
            break;
          }
        }
      }
    });

    return mapping;
  },

  /**
   * Processes the raw grid data according to column mapping & session duration
   * @param {Array<Array<any>>} grid 
   * @param {Object} mapping 
   * @param {number} [scheduledDuration=143] 
   * @returns {Array<Object>}
   */
  processRecords: function(grid, mapping, scheduledDuration = 143) {
    if (!grid || grid.length <= 1) return [];

    // Data starts at row index 1 (row 0 is headers)
    const dataRows = grid.slice(1);
    const results = [];

    dataRows.forEach(row => {
      // Skip completely empty rows
      if (!row || row.every(cell => cell === '' || cell === null || cell === undefined)) {
        return;
      }

      // Extract raw cell values based on column indices
      const rawId = mapping.studentId >= 0 ? row[mapping.studentId] : null;
      const rawName = mapping.studentName >= 0 ? row[mapping.studentName] : null;
      const rawRegId = mapping.registrationId >= 0 ? row[mapping.registrationId] : null;
      const rawDuration = mapping.duration >= 0 ? row[mapping.duration] : null;
      const rawPct = mapping.attendancePct >= 0 ? row[mapping.attendancePct] : null;
      const rawStatus = mapping.status >= 0 ? row[mapping.status] : null;
      const rawFirstJoin = mapping.firstJoin >= 0 ? row[mapping.firstJoin] : null;
      const rawRemark = mapping.remark >= 0 ? row[mapping.remark] : null;

      // 1. Student ID & Reg ID Validation
      const isIdMissing = !rawId || String(rawId).trim() === '' || String(rawId).toLowerCase() === 'not available';
      const studentId = isIdMissing ? 'Not Available' : String(rawId).trim();
      const registrationId = rawRegId ? String(rawRegId).trim() : (isIdMissing ? 'Not Available' : studentId);

      // 2. Duration Parsing
      let durationMinutes = 0;
      if (typeof rawDuration === 'number') {
        durationMinutes = Math.max(0, Math.round(rawDuration));
      } else if (rawDuration) {
        durationMinutes = Math.max(0, parseInt(String(rawDuration).replace(/[^0-9]/g, '')) || 0);
      }

      // 3. Attendance Percentage Parsing & Calculation
      let attendancePercentage = null;

      if (rawPct !== null && rawPct !== undefined && rawPct !== '') {
        if (typeof rawPct === 'number') {
          // If fraction (0.94), convert to 94%; if 94, keep 94%
          attendancePercentage = rawPct > 1 ? Math.round(rawPct) : Math.round(rawPct * 100);
        } else {
          const parsed = parseFloat(String(rawPct).replace('%', '').trim());
          if (!isNaN(parsed)) {
            attendancePercentage = parsed > 1 ? Math.round(parsed) : Math.round(parsed * 100);
          }
        }
      }

      // Fallback calculation if Attendance % was missing in Excel
      if (attendancePercentage === null) {
        if (scheduledDuration && scheduledDuration > 0) {
          attendancePercentage = Math.round((durationMinutes / scheduledDuration) * 100);
        } else {
          attendancePercentage = 0;
        }
      }

      // Strictly cap percentage at 100% max
      attendancePercentage = Math.min(100, Math.max(0, attendancePercentage));

      // 4. Attendance Status Determination
      let attendanceStatus = '';
      const statusStr = String(rawStatus || '').trim();

      if (statusStr !== '') {
        const lowerStatus = statusStr.toLowerCase();
        if (lowerStatus.includes('full')) attendanceStatus = 'Full Attendance';
        else if (lowerStatus.includes('present')) attendanceStatus = 'Present';
        else if (lowerStatus.includes('partial')) attendanceStatus = 'Partial';
        else if (lowerStatus.includes('absent')) attendanceStatus = 'Absent';
        else attendanceStatus = statusStr;
      } else {
        // Compute from Attendance %
        if (attendancePercentage === 100) attendanceStatus = 'Full Attendance';
        else if (attendancePercentage >= 75) attendanceStatus = 'Present';
        else if (attendancePercentage >= 1) attendanceStatus = 'Partial';
        else attendanceStatus = 'Absent';
      }

      // 5. First Join Formatting
      const firstJoin = window.ExcelReader.formatDateValue(rawFirstJoin);

      // 6. Remark
      const remark = rawRemark ? String(rawRemark).trim() : (attendanceStatus === 'Absent' ? 'No attendance recorded' : 'Attendance recorded');

      results.push({
        studentId: studentId,
        studentName: rawName ? String(rawName).trim() : 'Not Available',
        registrationId: registrationId,
        firstJoin: firstJoin,
        durationMinutes: durationMinutes,
        attendancePercentage: attendancePercentage,
        attendanceStatus: attendanceStatus,
        remark: remark
      });
    });

    return results;
  },

  /**
   * Computes dataset KPI metrics dynamically
   * @param {Array<Object>} records 
   * @returns {Object}
   */
  calculateStatistics: function(records) {
    if (!records || records.length === 0) {
      return {
        totalStudents: 0,
        fullAttendance: 0,
        present: 0,
        partial: 0,
        absent: 0,
        missingStudentIds: 0,
        averageAttendancePct: 0
      };
    }

    let full = 0;
    let present = 0;
    let partial = 0;
    let absent = 0;
    let missingIds = 0;
    let totalPct = 0;

    records.forEach(r => {
      if (r.studentId === 'Not Available' || !r.studentId) {
        missingIds++;
      }

      totalPct += (r.attendancePercentage || 0);

      const status = r.attendanceStatus;
      if (status === 'Full Attendance') full++;
      else if (status === 'Present') present++;
      else if (status === 'Partial') partial++;
      else absent++;
    });

    const avgPct = Math.round(totalPct / records.length);

    return {
      totalStudents: records.length,
      fullAttendance: full,
      present: present,
      partial: partial,
      absent: absent,
      missingStudentIds: missingIds,
      averageAttendancePct: avgPct
    };
  }
};
