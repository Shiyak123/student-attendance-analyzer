/**
 * Student Attendance Analyzer - Chart Manager Module
 * Manages Chart.js doughnut chart instance and dynamic data binding.
 */

window.ChartManager = {
  chartInstance: null,

  /**
   * Initializes or updates the Attendance Distribution Doughnut Chart
   * @param {string} canvasId 
   * @param {Object} stats {fullAttendance, present, partial, absent}
   */
  renderChart: function(canvasId, stats) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const dataValues = [
      stats.fullAttendance || 0,
      stats.present || 0,
      stats.partial || 0,
      stats.absent || 0
    ];

    const chartData = {
      labels: ['Full Attendance', 'Present', 'Partial', 'Absent'],
      datasets: [{
        data: dataValues,
        backgroundColor: [
          '#16a34a', // Full Attendance - Green
          '#2563eb', // Present - Blue
          '#d97706', // Partial - Orange/Amber
          '#dc2626'  // Absent - Red
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6
      }]
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: {
              size: 12,
              family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            },
            padding: 16,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return ` ${label}: ${value} students (${percentage}%)`;
            }
          }
        }
      },
      cutout: '68%'
    };

    if (this.chartInstance) {
      this.chartInstance.data = chartData;
      this.chartInstance.update();
    } else {
      this.chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
        options: chartOptions
      });
    }
  }
};
