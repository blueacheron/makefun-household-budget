// 家庭预算管家：hash 路由 + 内存状态 + 五个页面的交互。
//
//   #/           概览
//   #/planner   预算规划（改数字实时重算）
//   #/expenses  记账（新增 / 编辑 / 删除 / 筛选 / 导出）
//   #/goals     储蓄目标（进度、每月需存、存入、新增）
//   #/reports   报表（近 6 个月收支、食品趋势、月度明细）
//
// 状态只存在内存里（SiteKit.createStore），不写浏览器持久存储、
// 不写 cookie、不发任何网络请求。示例数据在 data.js 里，改一笔账，
// 概览、规划、目标和报表里的汇总都跟着变。

import { BUDGETS, CATEGORIES, EXPENSES, FOOD_TREND, GOALS, INCOME, MONTH, MONTHLY, SAVING_TARGET, categoryById } from './data.js';
import { expensesPage, goalsPage, missing, overview, planWarnings, planner, reports } from './views.js';

const K = globalThis.SiteKit;
const app = document.getElementById('app');

// 初始状态：示例数据的一份拷贝（改状态不改 data.js 的导出）。
const store = K.createStore({
  income: INCOME.map((i) => ({ ...i })),
  budgets: { ...BUDGETS },
  savingTarget: SAVING_TARGET,
  expenses: EXPENSES.map((e) => ({ ...e })),
  goals: GOALS.map((g) => ({ ...g })),
  filterMonth: MONTH,
  filterCategory: '',
});

// 从当前状态算出各页共用的汇总。11 月的月度数字取实时记账，
// 这样报表里的当月支出永远和记账页对得上。
function summarize(state) {
  const incomeTotal = state.income.reduce((a, i) => a + i.amount, 0);
  const budgetTotal = CATEGORIES.reduce((a, c) => a + (state.budgets[c.id] || 0), 0);
  const needsBudget = CATEGORIES.filter((c) => c.kind === 'needs').reduce(
    (a, c) => a + (state.budgets[c.id] || 0),
    0,
  );
  const wantsBudget = budgetTotal - needsBudget;
  const spentByCategory = {};
  for (const e of state.expenses) {
    spentByCategory[e.category] = (spentByCategory[e.category] || 0) + e.amount;
  }
  const totalSpent = state.expenses.reduce((a, e) => a + e.amount, 0);
  const overBudget = CATEGORIES.filter((c) => (spentByCategory[c.id] || 0) > (state.budgets[c.id] || 0)).map(
    (c) => ({
      name: c.name,
      budget: state.budgets[c.id],
      spent: spentByCategory[c.id],
      over: spentByCategory[c.id] - state.budgets[c.id],
    }),
  );
  const visibleExpenses = state.expenses.filter(
    (e) =>
      (state.filterMonth === '' || e.date.slice(0, 7) === state.filterMonth) &&
      (state.filterCategory === '' || e.category === state.filterCategory),
  );
  const monthly = MONTHLY.map((m) =>
    m.month === MONTH ? { ...m, spent: totalSpent } : { ...m },
  );
  return {
    income: state.income,
    incomeTotal,
    budgets: state.budgets,
    budgetTotal,
    needsBudget,
    wantsBudget,
    savingTarget: state.savingTarget,
    expenses: state.expenses,
    spentByCategory,
    totalSpent,
    balance: incomeTotal - totalSpent,
    overBudget,
    visibleExpenses,
    visibleTotal: visibleExpenses.reduce((a, e) => a + e.amount, 0),
    filterMonth: state.filterMonth,
    filterCategory: state.filterCategory,
    goals: state.goals,
    monthly,
    foodTrend: FOOD_TREND,
  };
}

const routes = {
  '': () => overview(summarize(store.get())),
  planner: () => planner(summarize(store.get())),
  expenses: () => expensesPage(summarize(store.get())),
  goals: () => goalsPage(summarize(store.get())),
  reports: () => reports(summarize(store.get())),
};

const titles = {
  '': '家庭预算管家',
  planner: '预算规划 | 家庭预算管家',
  expenses: '记账 | 家庭预算管家',
  goals: '储蓄目标 | 家庭预算管家',
  reports: '报表 | 家庭预算管家',
};

const router = K.startRouter(routes, {
  title: (path) => titles[path] || '家庭预算管家',
  mount: (path) => {
    if (path === 'planner') wirePlanner();
    else if (path === 'expenses') wireExpenses();
    else if (path === 'goals') wireGoals();
  },
  notFound: (path) => missing(path),
});

// ---------------------------------------------------------------------------
// 预算规划：改数字就地重算（不整页重绘，输入框不丢焦点）。
// ---------------------------------------------------------------------------

function refreshPlanner() {
  const s = summarize(store.get());
  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  set('plan-income-total', K.fmtMoney(s.incomeTotal));
  set('plan-budget-total', K.fmtMoney(s.budgetTotal));
  set('plan-needs', K.fmtMoney(s.needsBudget));
  set('plan-wants', K.fmtMoney(s.wantsBudget));
  set('plan-sum', K.fmtMoney(s.budgetTotal + s.savingTarget));
  set('plan-left', K.fmtMoney(s.incomeTotal - s.budgetTotal - s.savingTarget));
  const strip = document.getElementById('plan-strip');
  if (strip) {
    strip.innerHTML = K.barStrip(
      [
        { label: '必需', value: s.needsBudget, color: '#1565c0' },
        { label: '想要', value: s.wantsBudget, color: '#e67e22' },
        { label: '储蓄', value: s.savingTarget, color: '#2e7d32' },
      ],
      { format: (v) => K.fmtMoney(v), ariaLabel: '50/30/20 预算分配条' },
    );
  }
  const warn = document.getElementById('plan-warn');
  if (warn) warn.innerHTML = planWarnings(s);
}

function wirePlanner() {
  document.querySelectorAll('input[data-income]').forEach((input) => {
    input.addEventListener('input', () => {
      const state = store.get();
      const i = Number(input.dataset.income);
      state.income[i].amount = Math.max(0, Number(input.value) || 0);
      store.replace(state);
      refreshPlanner();
    });
  });
  document.querySelectorAll('input[data-budget]').forEach((input) => {
    input.addEventListener('input', () => {
      const state = store.get();
      const id = input.dataset.budget;
      state.budgets[id] = Math.max(0, Number(input.value) || 0);
      store.replace(state);
      // 只更新这一行的迷你条和占比文字。
      const row = input.closest('.budget-row');
      const spent = summarize(state).spentByCategory[id] || 0;
      const pct = state.budgets[id] > 0 ? Math.round((spent / state.budgets[id]) * 100) : 0;
      const fill = row.querySelector('.mini-fill');
      fill.style.width = Math.min(100, pct) + '%';
      fill.classList.toggle('over', spent > state.budgets[id]);
      const label = row.querySelector('label.field span');
      const name = categoryById(id).name;
      label.textContent = `${name}（已花 ${K.fmtMoney(spent)}，占预算 ${pct}%）`;
      refreshPlanner();
    });
  });
  const saving = document.getElementById('plan-saving');
  if (saving) {
    saving.addEventListener('input', () => {
      const state = store.get();
      state.savingTarget = Math.max(0, Number(saving.value) || 0);
      store.replace(state);
      refreshPlanner();
    });
  }
}

// ---------------------------------------------------------------------------
// 记账：新增 / 编辑 / 删除 / 筛选 / 导出 / 清空。
// ---------------------------------------------------------------------------

function wireExpenses() {
  const form = document.getElementById('expense-form');
  const idField = document.getElementById('exp-id');
  const cancelBtn = document.getElementById('exp-cancel');

  // 表格最后一列是操作按钮（SiteKit.table 只出纯文本格，按钮在挂载时补上）。
  document.querySelectorAll('.data-table tbody tr').forEach((row) => {
    const cell = row.lastElementChild;
    const id = row.dataset.expenseId;
    cell.innerHTML =
      '<button type="button" data-act="edit" data-id="' +
      K.esc(id) +
      '">编辑</button> <button type="button" data-act="del" data-id="' +
      K.esc(id) +
      '">删除</button>';
  });

  app.querySelector('.data-table')?.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-act]');
    if (!btn) return;
    const state = store.get();
    const id = btn.dataset.id;
    if (btn.dataset.act === 'del') {
      state.expenses = state.expenses.filter((e) => e.id !== id);
      store.replace(state);
      router.render();
      return;
    }
    const found = state.expenses.find((e) => e.id === id);
    if (!found) return;
    idField.value = found.id;
    document.getElementById('exp-date').value = found.date;
    document.getElementById('exp-category').value = found.category;
    document.getElementById('exp-amount').value = found.amount;
    document.getElementById('exp-note').value = found.note;
    document.getElementById('expense-form-title').textContent = '编辑这笔';
    cancelBtn.hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const amount = Number(document.getElementById('exp-amount').value);
    if (!amount || amount <= 0) return;
    const state = store.get();
    const record = {
      id: idField.value || 'u' + Date.now().toString(36),
      date: document.getElementById('exp-date').value || MONTH + '-26',
      category: document.getElementById('exp-category').value,
      amount: Math.round(amount * 100) / 100,
      note: document.getElementById('exp-note').value.trim(),
    };
    if (idField.value) {
      state.expenses = state.expenses.map((e) => (e.id === record.id ? record : e));
    } else {
      state.expenses = [...state.expenses, record];
    }
    store.replace(state);
    router.render();
  });

  cancelBtn.addEventListener('click', () => router.render());

  document.getElementById('filter-month').addEventListener('change', (event) => {
    const state = store.get();
    state.filterMonth = event.target.value;
    store.replace(state);
    router.render();
  });
  document.getElementById('filter-category').addEventListener('change', (event) => {
    const state = store.get();
    state.filterCategory = event.target.value;
    store.replace(state);
    router.render();
  });
  document.getElementById('export-json').addEventListener('click', () => {
    const state = store.get();
    K.downloadJson('household-budget-2026-11.json', {
      month: MONTH,
      income: state.income,
      budgets: state.budgets,
      savingTarget: state.savingTarget,
      expenses: state.expenses,
      goals: state.goals,
    });
  });
  document.getElementById('clear-sample').addEventListener('click', () => {
    if (!window.confirm('清空后示例数据就没了，确定要清空吗？')) return;
    const state = store.get();
    state.expenses = [];
    state.filterMonth = '';
    store.replace(state);
    router.render();
  });
}

// ---------------------------------------------------------------------------
// 储蓄目标：存入、删除、新增。
// ---------------------------------------------------------------------------

function wireGoals() {
  app.querySelectorAll('button[data-goal-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const state = store.get();
      state.goals = state.goals.map((g) =>
        g.id === btn.dataset.goalAdd ? { ...g, saved: Math.min(g.target, g.saved + 100) } : g,
      );
      store.replace(state);
      router.render();
    });
  });
  app.querySelectorAll('button[data-goal-del]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const state = store.get();
      state.goals = state.goals.filter((g) => g.id !== btn.dataset.goalDel);
      store.replace(state);
      router.render();
    });
  });
  document.getElementById('goal-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const target = Number(document.getElementById('goal-target').value);
    if (!target || target <= 0) return;
    const state = store.get();
    state.goals = [
      ...state.goals,
      {
        id: 'g' + Date.now().toString(36),
        name: document.getElementById('goal-name').value.trim() || '新目标',
        target,
        saved: Math.max(0, Number(document.getElementById('goal-saved').value) || 0),
        deadline: document.getElementById('goal-deadline').value || '2027-12-31',
      },
    ];
    store.replace(state);
    router.render();
  });
}
