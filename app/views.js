// 五个页面的 HTML 模板。只负责把算好的汇总拼成 HTML，
// 不碰状态、不绑事件（事件在 main.js 的 mount 里绑）。
// 所有插进模板的数字先由调用方算好，文字先转义。

const K = globalThis.SiteKit;

import { CATEGORIES, MONTH_LABEL, RULE_503020, categoryById } from './data.js';

// 到截止日的整月数：从下个月数到截止当月（含截止月）。
// 如 2026-11 到 2027-06：12 月到 6 月，共 7 个月。
function monthsLeft(deadline) {
  const [y, m] = deadline.split('-').map(Number);
  return Math.max(1, (y - 2026) * 12 + (m - 11));
}

function money(n) {
  return K.fmtMoney(Math.round(n));
}

// 分类支出占比图例：颜色块 + 名称 + 金额 + 占比。
function legend(parts, total) {
  return (
    '<ul class="legend">' +
    parts
      .map(
        (p) =>
          '<li><span class="dot-swatch" style="background:' +
          K.esc(p.color) +
          '"></span>' +
          K.esc(p.label) +
          ' <b>' +
          money(p.value) +
          '</b> · ' +
          ((p.value / total) * 100).toFixed(1) +
          '%</li>',
      )
      .join('') +
    '</ul>'
  );
}

// ---------------------------------------------------------------------------
// 概览 #/
// ---------------------------------------------------------------------------

export function overview(s) {
  const parts = CATEGORIES.map((c) => ({
    label: c.name,
    value: s.spentByCategory[c.id] || 0,
    color: c.color,
  })).filter((p) => p.value > 0);

  const alerts =
    s.overBudget.length === 0
      ? '<p class="ok">本月没有分类超支，继续保持。</p>'
      : '<ul class="alerts">' +
        s.overBudget
          .map(
            (o) =>
              '<li><b>' +
              K.esc(o.name) +
              '</b> 已花 ' +
              money(o.spent) +
              '，超出预算 ' +
              money(o.over) +
              '（预算 ' +
              money(o.budget) +
              '）。</li>',
          )
          .join('') +
        '</ul>';

  const recent = [...s.expenses]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  return (
    '<section class="hero"><h1>这个月，钱花得明明白白</h1>' +
    '<p>' +
    K.esc(MONTH_LABEL) +
    ' · 示例家庭：月收入 ' +
    money(s.incomeTotal) +
    '，预算 ' +
    money(s.budgetTotal) +
    '，目标每月存下 ' +
    money(s.savingTarget) +
    '。下面是示例数据，可以一键清空后记自己的账。</p></section>' +
    '<section class="stats">' +
    K.stat('本月收入', money(s.incomeTotal)) +
    K.stat('本月已支出', money(s.totalSpent)) +
    K.stat('本月结余', money(s.balance)) +
    K.stat('储蓄目标完成', Math.min(100, Math.round((s.balance / s.savingTarget) * 100)) + '%') +
    '</section>' +
    '<section><h2>钱都去哪了</h2><div class="split">' +
    '<div>' +
    K.donutChart(parts, {
      centerLabel: '本月支出',
      centerValue: money(s.totalSpent),
      format: (v) => money(v),
      ariaLabel: '本月各分类支出占比',
    }) +
    '</div><div>' +
    legend(parts, s.totalSpent) +
    '</div></div></section>' +
    '<section><h2>50 / 30 / 20 分配</h2>' +
    '<p class="hint">按预算分：必需 ' +
    money(s.needsBudget) +
    '（' +
    ((s.needsBudget / s.incomeTotal) * 100).toFixed(1) +
    '%）· 想要 ' +
    money(s.wantsBudget) +
    '（' +
    ((s.wantsBudget / s.incomeTotal) * 100).toFixed(1) +
    '%）· 储蓄 ' +
    money(s.savingTarget) +
    '（' +
    ((s.savingTarget / s.incomeTotal) * 100).toFixed(1) +
    '%）。经验法则是 ' +
    RULE_503020.needs +
    ' / ' +
    RULE_503020.wants +
    ' / ' +
    RULE_503020.saving +
    '，这家必需占比偏高，适合先从食品和交通找省钱空间。</p>' +
    K.barStrip(
      [
        { label: '必需', value: s.needsBudget, color: '#1565c0' },
        { label: '想要', value: s.wantsBudget, color: '#e67e22' },
        { label: '储蓄', value: s.savingTarget, color: '#2e7d32' },
      ],
      { format: (v) => money(v), ariaLabel: '50/30/20 预算分配条' },
    ) +
    '</section>' +
    '<section><h2>超支提醒</h2>' +
    alerts +
    '</section>' +
    '<section><h2>最近五笔支出</h2>' +
    K.table(
      ['日期', '分类', '备注', '金额'],
      recent.map((e) => {
        const c = categoryById(e.category);
        return [e.date.slice(5), c ? c.name : e.category, e.note, money(e.amount)];
      }),
    ) +
    '<p><a href="#/expenses">去记账 →</a>　<a href="#/planner">调整预算 →</a></p></section>'
  );
}

// ---------------------------------------------------------------------------
// 预算规划 #/planner
// ---------------------------------------------------------------------------

export function planner(s) {
  const incomeRows = s.income
    .map(
      (item, i) =>
        '<label class="field"><span>' +
        K.esc(item.label) +
        '</span><input type="number" min="0" step="100" value="' +
        item.amount +
        '" data-income="' +
        i +
        '" inputmode="numeric"></label>',
    )
    .join('');

  const budgetRows = CATEGORIES.map((c) => {
    const spent = s.spentByCategory[c.id] || 0;
    const budget = s.budgets[c.id];
    const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
    return (
      '<div class="budget-row"><label class="field"><span>' +
      K.esc(c.name) +
      '（已花 ' +
      money(spent) +
      '，占预算 ' +
      pct +
      '%）</span><input type="number" min="0" step="50" value="' +
      budget +
      '" data-budget="' +
      c.id +
      '" inputmode="numeric"></label>' +
      '<div class="mini-bar"><div class="mini-fill' +
      (spent > budget ? ' over' : '') +
      '" style="width:' +
      Math.min(100, pct) +
      '%"></div></div></div>'
    );
  }).join('');

  return (
    '<section><h1>预算规划</h1>' +
    '<p>改任何一个数字，下面的合计、分配条和对照立刻重算；改完自动同步到概览、记账和报表。</p></section>' +
    '<section><h2>月收入</h2><div class="form-grid">' +
    incomeRows +
    '</div><p>月收入合计：<b id="plan-income-total">' +
    money(s.incomeTotal) +
    '</b></p></section>' +
    '<section><h2>分类预算</h2>' +
    budgetRows +
    '</section>' +
    '<section><h2>分配对照</h2>' +
    '<div id="plan-strip">' +
    K.barStrip(
      [
        { label: '必需', value: s.needsBudget, color: '#1565c0' },
        { label: '想要', value: s.wantsBudget, color: '#e67e22' },
        { label: '储蓄', value: s.savingTarget, color: '#2e7d32' },
      ],
      { format: (v) => money(v), ariaLabel: '50/30/20 预算分配条' },
    ) +
    '</div>' +
    '<ul class="plan-lines">' +
    '<li>预算合计 <b id="plan-budget-total">' +
    money(s.budgetTotal) +
    '</b>（必需 <span id="plan-needs">' +
    money(s.needsBudget) +
    '</span> · 想要 <span id="plan-wants">' +
    money(s.wantsBudget) +
    '</span>）</li>' +
    '<li>每月储蓄目标 <input id="plan-saving" type="number" min="0" step="100" value="' +
    s.savingTarget +
    '" inputmode="numeric"> 元</li>' +
    '<li>预算 + 储蓄 = <b id="plan-sum">' +
    money(s.budgetTotal + s.savingTarget) +
    '</b>，剩余未分配 <b id="plan-left">' +
    money(s.incomeTotal - s.budgetTotal - s.savingTarget) +
    '</b></li>' +
    '</ul>' +
    '<div id="plan-warn">' +
    planWarnings(s) +
    '</div></section>'
  );
}

export function planWarnings(s) {
  const out = [];
  if (s.needsBudget / s.incomeTotal > 0.5) {
    out.push(
      '<p class="warn">必需开支占收入 ' +
        ((s.needsBudget / s.incomeTotal) * 100).toFixed(1) +
        '%，高于 50% 的经验线：可以看看食品和交通有没有能省的。</p>',
    );
  }
  if (s.budgetTotal + s.savingTarget > s.incomeTotal) {
    out.push(
      '<p class="warn">预算加储蓄已经超过收入 ' +
        money(s.budgetTotal + s.savingTarget - s.incomeTotal) +
        '，请先调低某一项。</p>',
    );
  }
  if (s.overBudget.length > 0) {
    out.push(
      '<p class="warn">' +
        s.overBudget.map((o) => K.esc(o.name)).join('、') +
        '本月已超支，超出的部分会从结余里扣。</p>',
    );
  }
  return out.length ? out.join('') : '<p class="ok">分配合理：必需在 50% 以内，预算加储蓄没有超过收入。</p>';
}

// ---------------------------------------------------------------------------
// 记账 #/expenses
// ---------------------------------------------------------------------------

export function expensesPage(s) {
  const options = CATEGORIES.map(
    (c) => '<option value="' + c.id + '">' + K.esc(c.name) + '</option>',
  ).join('');

  const months = [...new Set(s.expenses.map((e) => e.date.slice(0, 7)))].sort().reverse();
  const monthOptions = months
    .map((m) => '<option value="' + m + '"' + (m === s.filterMonth ? ' selected' : '') + '>' + m + '</option>')
    .join('');

  const rows = s.visibleExpenses.map((e) => {
    const c = categoryById(e.category);
    return [
      e.date,
      c ? c.name : e.category,
      e.note,
      money(e.amount),
      '编辑 / 删除',
    ];
  });

  return (
    '<section><h1>记账</h1>' +
    '<p>示例数据共 ' +
    s.expenses.length +
    ' 条，下面筛选后 ' +
    s.visibleExpenses.length +
    ' 条。新增、编辑、删除都会立刻反映在概览和报表里。</p></section>' +
    '<section><h2 id="expense-form-title">记一笔</h2>' +
    '<form id="expense-form"><input type="hidden" id="exp-id" value="">' +
    '<div class="form-grid">' +
    '<label class="field"><span>日期</span><input id="exp-date" type="date" value="2026-11-26" required></label>' +
    '<label class="field"><span>分类</span><select id="exp-category">' +
    options +
    '</select></label>' +
    '<label class="field"><span>金额（元）</span><input id="exp-amount" type="number" min="0.01" step="0.01" placeholder="例如 120" required inputmode="decimal"></label>' +
    '<label class="field"><span>备注</span><input id="exp-note" type="text" maxlength="40" placeholder="例如 超市采购"></label>' +
    '</div>' +
    '<p><button type="submit">保存这笔</button> <button type="button" id="exp-cancel" hidden>取消编辑</button></p>' +
    '</form></section>' +
    '<section><h2>支出记录</h2>' +
    '<div class="filters"><label>月份 <select id="filter-month">' +
    monthOptions +
    '</select></label>' +
    '<label>分类 <select id="filter-category"><option value="">全部</option>' +
    CATEGORIES.map(
      (c) =>
        '<option value="' +
        c.id +
        '"' +
        (c.id === s.filterCategory ? ' selected' : '') +
        '>' +
        K.esc(c.name) +
        '</option>',
    ).join('') +
    '</select></label>' +
    '<button type="button" id="export-json">导出 JSON</button> ' +
    '<button type="button" id="clear-sample">清空示例数据</button></div>' +
    '<p>筛选合计：<b>' +
    money(s.visibleTotal) +
    '</b>（' +
    s.visibleExpenses.length +
    ' 条）</p>' +
    '<div class="table-wrap">' +
    K.table(['日期', '分类', '备注', '金额', '操作'], rows, {
      rowAttr: (row, i) => 'data-expense-id="' + K.esc(s.visibleExpenses[i].id) + '"',
    }) +
    '</div>' +
    '<p class="hint">点一行里的“编辑”会把这笔填回表单，改完保存；点“删除”直接去掉。数据只存在当前页面内存里，关掉页面就回到示例数据，重要记录请点“导出 JSON”存一份。</p></section>'
  );
}

// ---------------------------------------------------------------------------
// 储蓄目标 #/goals
// ---------------------------------------------------------------------------

export function goalsPage(s) {
  const needSum = s.goals.reduce((sum, g) => sum + Math.ceil((g.target - g.saved) / monthsLeft(g.deadline)), 0);

  const cards = s.goals
    .map((g) => {
      const monthly = Math.ceil((g.target - g.saved) / monthsLeft(g.deadline));
      const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
      return (
        '<article class="card goal-card"><h3>' +
        K.esc(g.name) +
        '</h3>' +
        K.progressBar(g.saved, g.target, {
          label: money(g.saved) + ' / ' + money(g.target),
          ariaLabel: g.name + ' 进度 ' + pct + '%',
        }) +
        '<p>目标 ' +
        money(g.target) +
        ' · 已存 ' +
        money(g.saved) +
        ' · 还差 ' +
        money(g.target - g.saved) +
        '</p>' +
        '<p>截止 ' +
        K.esc(g.deadline) +
        '，还剩 ' +
        monthsLeft(g.deadline) +
        ' 个月，每月需存 <b>' +
        money(monthly) +
        '</b></p>' +
        '<p><button type="button" data-goal-add="' +
        K.esc(g.id) +
        '">存入 ¥100</button> ' +
        '<button type="button" data-goal-del="' +
        K.esc(g.id) +
        '">删除目标</button></p></article>'
      );
    })
    .join('');

  return (
    '<section><h1>储蓄目标</h1>' +
    '<p>本月结余 <b>' +
    money(s.balance) +
    '</b>，两个目标每月一共需存 <b>' +
    money(needSum) +
    '</b>。' +
    (s.balance >= needSum
      ? '本月结余够覆盖，进度不用愁。'
      : '本月结余不够覆盖每月需存，可以先从想要开支里挪一点。') +
    '</p></section>' +
    '<section class="goal-grid">' +
    cards +
    '</section>' +
    '<section><h2>新建目标</h2>' +
    '<form id="goal-form"><div class="form-grid">' +
    '<label class="field"><span>目标名称</span><input id="goal-name" type="text" maxlength="20" placeholder="例如 换车基金" required></label>' +
    '<label class="field"><span>目标金额（元）</span><input id="goal-target" type="number" min="1" step="100" placeholder="例如 50000" required inputmode="numeric"></label>' +
    '<label class="field"><span>已存（元）</span><input id="goal-saved" type="number" min="0" step="100" value="0" inputmode="numeric"></label>' +
    '<label class="field"><span>截止日期</span><input id="goal-deadline" type="date" value="2027-12-31" required></label>' +
    '</div><p><button type="submit">添加目标</button></p></form></section>'
  );
}

// ---------------------------------------------------------------------------
// 报表 #/reports
// ---------------------------------------------------------------------------

export function reports(s) {
  const spentSeries = s.monthly.map((m) => ({ label: m.label, value: m.spent }));
  const balanceSeries = s.monthly.map((m) => ({
    label: m.label,
    value: m.income - m.spent,
  }));
  const avgSpent = Math.round(s.monthly.reduce((a, m) => a + m.spent, 0) / s.monthly.length);
  const avgBalance = Math.round(s.monthly.reduce((a, m) => a + (m.income - m.spent), 0) / s.monthly.length);
  const topSpent = s.monthly.reduce((a, m) => (m.spent > a.spent ? m : a), s.monthly[0]);
  const topBalance = s.monthly.reduce(
    (a, m) => (m.income - m.spent > a.income - a.spent ? m : a),
    s.monthly[0],
  );

  return (
    '<section><h1>报表</h1>' +
    '<p>近 6 个月的收支回顾（示例数据）。11 月是当月，支出 ' +
    money(s.monthly[s.monthly.length - 1].spent) +
    ' 元，与记账页的记录一致；改一笔账，这里的 11 月数字跟着变。</p></section>' +
    '<section class="stats">' +
    K.stat('月均支出', money(avgSpent)) +
    K.stat('月均结余', money(avgBalance)) +
    K.stat('支出最高月', topSpent.label + ' · ' + money(topSpent.spent)) +
    K.stat('结余最高月', topBalance.label + ' · ' + money(topBalance.income - topBalance.spent)) +
    '</section>' +
    '<section><h2>近 6 个月支出</h2>' +
    K.barChart(spentSeries, {
      format: (v) => money(v),
      selected: '11 月',
      ariaLabel: '近 6 个月每月支出柱状图',
    }) +
    '</section>' +
    '<section><h2>近 6 个月结余走势</h2>' +
    K.lineChart(balanceSeries, {
      format: (v) => money(v),
      selected: '11 月',
      ariaLabel: '近 6 个月每月结余折线图',
    }) +
    '</section>' +
    '<section><h2>食品支出趋势</h2>' +
    '<p class="hint">食品是这家最大的必需开支：8 月最高 2310 元，11 月截至 26 日 1288 元。</p>' +
    K.lineChart(s.foodTrend, {
      format: (v) => money(v),
      selected: '11 月',
      ariaLabel: '食品分类近 6 个月支出趋势',
    }) +
    '</section>' +
    '<section><h2>月度明细</h2>' +
    K.table(
      ['月份', '收入', '支出', '结余'],
      s.monthly.map((m) => [m.label, money(m.income), money(m.spent), money(m.income - m.spent)]),
    ) +
    '</section>'
  );
}

export function missing(path) {
  return (
    '<h1>没有这个页面</h1><p>地址 #/' +
    K.esc(path) +
    ' 不存在。<a href="#/">回概览</a></p>'
  );
}
