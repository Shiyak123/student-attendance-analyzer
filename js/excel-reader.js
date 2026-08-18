/**
 * Student Attendance Analyzer - Excel Reader Module
 * Uses SheetJS (XLSX) to process workbooks directly in the browser memory.
 */

window.ExcelReader = {
  /**
   * Reads an uploaded Excel File object and returns workbook object
   * @param {File} file 
   * @returns {Promise<{fileName: string, sheetNames: string[], workbook: Object}>}
   */
  readWorkbook: function(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new Error("No file provided."));
      }

      const reader = new FileReader();

      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target.result);
          // Read with cellDates: true so SheetJS automatically converts date cells
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          
          resolve({
            fileName: file.name,
            sheetNames: workbook.SheetNames,
            workbook: workbook
          });
        } catch (err) {
          reject(new Error("Failed to parse Excel workbook. Please ensure it is a valid .xlsx or .xls file."));
        }
      };

      reader.onerror = function() {
        reject(new Error("Error reading file from disk."));
      };

      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Extracts raw row grid from a specified sheet in the workbook
   * @param {Object} workbook 
   * @param {string} sheetName 
   * @returns {Array<Array<any>>}
   */
  getSheetGrid: function(workbook, sheetName) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return [];
    
    // Convert sheet to 2D matrix array with default empty strings
    return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  },

  /**
   * Formats raw Excel dates or serial numbers into readable DD MMM YYYY, HH:mm
   * @param {any} val 
   * @returns {string}
   */
  formatDateValue: function(val) {
    if (!val || val === '' || val === null || val === undefined) {
      return "Not Available";
    }

    let dateObj = null;

    if (val instanceof Date) {
      dateObj = val;
    } else if (typeof val === 'number') {
      // Excel serial date formula
      if (val > 25569 && val < 100000) {
        dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
      }
    } else if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed === '' || trimmed.toLowerCase() === 'not available') {
        return "Not Available";
      }
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        dateObj = parsed;
      } else {
        return trimmed;
      }
    }

    if (dateObj && !isNaN(dateObj.getTime())) {
      const pad = n => String(n).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${pad(dateObj.getDate())} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}, ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
    }

    return String(val);
  }
};
