export class ChartManager {
  constructor() {
    this.charts = {};
    this.Chart = null;
  }

  async loadChart() {
    if (this.Chart) return this.Chart;
    if (window.Chart) {
      this.Chart = window.Chart;
      this._registerDefaults();
      return this.Chart;
    }
    try {
      const module = await import('https://esm.sh/chart.js@4');
      this.Chart = module.Chart || module.default?.Chart;
      if (this.Chart) this._registerDefaults();
    } catch {
      console.warn('Chart.js gagal dimuat');
    }
    return this.Chart;
  }

  _registerDefaults() {
    if (!this.Chart) return;
    this.Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    this.Chart.defaults.color = '#5b5a6b';
    this.Chart.defaults.plugins.legend.labels.usePointStyle = true;
  }

  async create(canvasId, type, data, options = {}) {
    const Chart = await this.loadChart();
    if (!Chart) return null;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }
    const ctx = canvas.getContext('2d');
    this.charts[canvasId] = new Chart(ctx, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: options.showLegend ?? true, position: 'bottom' },
        },
        ...options,
      },
    });
    return this.charts[canvasId];
  }

  async createTaskChart(canvasId, pending, completed) {
    return this.create(canvasId, 'doughnut', {
      labels: ['Pending', 'Selesai'],
      datasets: [{ data: [pending, completed], backgroundColor: ['#4f46e5', '#006c49'], borderWidth: 0 }],
    }, { showLegend: true, cutout: '70%' });
  }

  async createAttendanceChart(canvasId, present, absent) {
    return this.create(canvasId, 'doughnut', {
      labels: ['Hadir', 'Tidak Hadir'],
      datasets: [{ data: [present, absent], backgroundColor: ['#006c49', '#ba1a1a'], borderWidth: 0 }],
    }, { showLegend: true, cutout: '70%' });
  }

  async createWeeklyActivityChart(canvasId, labels, data) {
    return this.create(canvasId, 'bar', {
      labels,
      datasets: [{ label: 'Tugas Selesai', data, backgroundColor: '#4f46e5', borderRadius: 6 }],
    }, { showLegend: false, scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } } });
  }

  destroy(canvasId) {
    if (this.charts[canvasId]) { this.charts[canvasId].destroy(); delete this.charts[canvasId]; }
  }

  destroyAll() {
    Object.values(this.charts).forEach(c => c.destroy());
    this.charts = {};
  }
}

export const chartManager = new ChartManager();
