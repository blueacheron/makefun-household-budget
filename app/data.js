// 示例家庭数据：一个四口之家的 2026 年 11 月预算账本。
//
// 数字是编好的示例，不是任何真实家庭的账：月收入 ¥12,000，八个分类
// 的预算合计 ¥9,000，储蓄目标 ¥3,000/月；16 条示例支出合计 ¥6,510，
// 与概览、报表里的汇总是同一组数（改一条支出，所有汇总跟着变）。
// 页面上标明了“示例数据”，可以一键清空后记自己的账。

// 八个支出分类：kind 分必需 / 想要两组，供 50/30/20 对照用。
export const CATEGORIES = [
  { id: 'housing', name: '住房', kind: 'needs', color: '#1565c0' },
  { id: 'food', name: '食品', kind: 'needs', color: '#2e7d32' },
  { id: 'transport', name: '交通', kind: 'needs', color: '#00838f' },
  { id: 'education', name: '教育', kind: 'needs', color: '#6a1b9a' },
  { id: 'daily', name: '日用', kind: 'needs', color: '#d4a017' },
  { id: 'fun', name: '娱乐', kind: 'wants', color: '#e67e22' },
  { id: 'medical', name: '医疗', kind: 'needs', color: '#c0392b' },
  { id: 'other', name: '其他', kind: 'wants', color: '#757575' },
];

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || null;
}

export const MONTH = '2026-11';
export const MONTH_LABEL = '2026 年 11 月';

// 月收入的两项来源。
export const INCOME = [
  { label: '工资', amount: 10500 },
  { label: '其他收入', amount: 1500 },
];

// 每月各分类预算（合计 ¥9,000），储蓄目标 ¥3,000/月。
export const BUDGETS = {
  housing: 3000,
  food: 2400,
  transport: 800,
  education: 1000,
  daily: 600,
  fun: 500,
  medical: 300,
  other: 400,
};

export const SAVING_TARGET = 3000;

// 示例支出：16 条。分类小计：住房 3000、食品 1288、交通 588、
// 教育 520、日用 146、娱乐 382、医疗 126、其他 460，合计 6510。
// 其中“其他”已花 460，超出 400 的预算，概览页会提醒。
export const EXPENSES = [
  { id: 'e01', date: '2026-11-01', category: 'housing', amount: 3000, note: '11 月房租' },
  { id: 'e02', date: '2026-11-02', category: 'food', amount: 486, note: '超市周采购' },
  { id: 'e03', date: '2026-11-03', category: 'transport', amount: 200, note: '地铁月卡充值' },
  { id: 'e04', date: '2026-11-05', category: 'food', amount: 132, note: '菜市场' },
  { id: 'e05', date: '2026-11-07', category: 'fun', amount: 96, note: '电影票两张' },
  { id: 'e06', date: '2026-11-08', category: 'daily', amount: 87, note: '洗衣液、纸巾' },
  { id: 'e07', date: '2026-11-10', category: 'food', amount: 154, note: '外卖三顿' },
  { id: 'e08', date: '2026-11-12', category: 'transport', amount: 68, note: '雨天打车' },
  { id: 'e09', date: '2026-11-14', category: 'education', amount: 520, note: '孩子网课续费' },
  { id: 'e10', date: '2026-11-15', category: 'food', amount: 418, note: '超市周采购' },
  { id: 'e11', date: '2026-11-17', category: 'medical', amount: 126, note: '感冒药' },
  { id: 'e12', date: '2026-11-19', category: 'fun', amount: 286, note: '家庭聚餐' },
  { id: 'e13', date: '2026-11-21', category: 'food', amount: 98, note: '水果' },
  { id: 'e14', date: '2026-11-23', category: 'daily', amount: 59, note: '洗发水' },
  { id: 'e15', date: '2026-11-24', category: 'other', amount: 460, note: '修洗衣机' },
  { id: 'e16', date: '2026-11-25', category: 'transport', amount: 320, note: '加油' },
];

// 近 6 个月收支（示例）。11 月支出 6510 与上面 16 条记录一致；
// 月均支出 (7820+8340+9120+6980+7450+6510)/6 = ¥7,703，
// 月均结余 (4180+3660+3380+5020+4550+5490)/6 = ¥4,380。
export const MONTHLY = [
  { month: '2026-06', label: '6 月', income: 12000, spent: 7820 },
  { month: '2026-07', label: '7 月', income: 12000, spent: 8340 },
  { month: '2026-08', label: '8 月', income: 12500, spent: 9120 },
  { month: '2026-09', label: '9 月', income: 12000, spent: 6980 },
  { month: '2026-10', label: '10 月', income: 12000, spent: 7450 },
  { month: '2026-11', label: '11 月', income: 12000, spent: 6510 },
];

// 食品分类近 6 个月的支出趋势（示例，11 月截至 26 日）。
export const FOOD_TREND = [
  { label: '6 月', value: 1980 },
  { label: '7 月', value: 2140 },
  { label: '8 月', value: 2310 },
  { label: '9 月', value: 1890 },
  { label: '10 月', value: 2050 },
  { label: '11 月', value: 1288 },
];

// 储蓄目标：每月需存 =（目标 − 已存）÷ 到截止日的整月数。
// 应急基金：(20000−12500) ÷ 7 个月 ≈ ¥1,072/月；
// 孩子教育：(30000−8000) ÷ 21 个月 ≈ ¥1,048/月。
export const GOALS = [
  { id: 'g1', name: '应急基金', target: 20000, saved: 12500, deadline: '2027-06-30' },
  { id: 'g2', name: '孩子教育', target: 30000, saved: 8000, deadline: '2028-08-31' },
];

// 50/30/20 经验法则：必需 50%、想要 30%、储蓄 20%。
export const RULE_503020 = { needs: 50, wants: 30, saving: 20 };
