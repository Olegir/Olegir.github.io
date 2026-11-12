/* Графік витрат за останні 6 місяців.
   Бере операції з app.js (змінна state) і малює стовпчики без жодних бібліотек. */
'use strict';
(() => {
  // ---------- 1. Налаштування ----------
  const MONTHS_TO_SHOW = 6;
  const MONTH_NAMES = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];

  // ---------- 2. Стилі графіка (додаємо на сторінку з JavaScript) ----------
  const css = `
    .mchart { display: flex; align-items: flex-end; gap: 10px; height: 190px; padding-top: 22px; }
    .mchart .col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; min-width: 0; }
    .mchart .bar-area { flex: 1; width: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; }
    .mchart .value { font-size: 11px; color: var(--muted); margin-bottom: 4px; white-space: nowrap; }
    .mchart .bar { width: 100%; max-width: 46px; border-radius: 8px 8px 3px 3px; background: var(--line); min-height: 3px; transition: height .3s; }
    .mchart .col.now .bar { background: var(--accent); }
    .mchart .col.now .value { color: var(--txt); font-weight: 700; }
    .mchart .month { font-size: 12px; color: var(--muted); margin-top: 8px; }
    .mchart .col.now .month { color: var(--txt); font-weight: 700; }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);

  // ---------- 3. Допоміжні функції ----------
  // Ключ місяця у форматі "2026-11"
  function monthKey(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
  }

  // Короткий формат суми: 12 500 → "12,5 тис"
  function short(n) {
    if (n >= 1000) return (Math.round(n / 100) / 10).toLocaleString('uk-UA') + ' тис';
    return Math.round(n).toLocaleString('uk-UA');
  }

  function full(n) {
    return Math.round(n).toLocaleString('uk-UA') + ' ₴';
  }

  // ---------- 4. ГОЛОВНЕ: рахуємо витрати й малюємо стовпчики ----------
  function renderMonthlyChart() {
    const box = document.getElementById('monthlyChart');
    const summary = document.getElementById('monthlySummary');
    if (!box || typeof state === 'undefined') return;

    // Список останніх 6 місяців: від найстарішого до поточного
    const now = new Date();
    const months = [];
    for (let i = MONTHS_TO_SHOW - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: monthKey(d), name: MONTH_NAMES[d.getMonth()], total: 0 });
    }

    // Складаємо витрати кожного місяця
    for (const t of state.transactions) {
      if (t.type !== 'expense' || typeof t.date !== 'string') continue;
      const m = months.find(x => x.key === t.date.slice(0, 7));
      if (m) m.total += Number(t.amount) || 0;
    }

    const max = Math.max(...months.map(m => m.total));
    box.replaceChildren();

    if (max === 0) {
      const p = document.createElement('p');
      p.className = 'empty';
      p.textContent = 'Додай витрати, щоб побачити графік';
      box.append(p);
      summary.textContent = '';
      return;
    }

    // Малюємо стовпчик для кожного місяця
    months.forEach((m, i) => {
      const col = document.createElement('div');
      col.className = 'col' + (i === months.length - 1 ? ' now' : '');
      col.title = m.name + ': ' + full(m.total);

      const area = document.createElement('div');
      area.className = 'bar-area';

      const value = document.createElement('div');
      value.className = 'value';
      value.textContent = m.total ? short(m.total) : '';

      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.style.height = (100 * m.total / max) + '%';   // висота стовпчика = частка від максимуму

      const label = document.createElement('div');
      label.className = 'month';
      label.textContent = m.name;

      area.append(value, bar);
      col.append(area, label);
      box.append(col);
    });

    // Середнє за місяці, у яких були витрати
    const withData = months.filter(m => m.total > 0);
    const avg = withData.reduce((s, m) => s + m.total, 0) / withData.length;
    summary.textContent = 'Середньо: ' + full(avg) + ' на місяць · поточний місяць виділено';
  }

  // Робимо функцію доступною для app.js і малюємо одразу
  window.renderMonthlyChart = renderMonthlyChart;
  renderMonthlyChart();
})();
