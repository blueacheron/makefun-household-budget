[![make.fun bounty](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/blueacheron/makefun-household-budget/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/blueacheron/makefun-household-budget/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)

# 家庭预算管家 · Household Budget Planner

一个真的能用的家庭预算工具站：记一笔账、排一份预算、盯住储蓄目标、看半年收支报表。中文为主，纯静态，无构建步骤，零网络请求：打开 `app/index.html` 即可用，数据只存在当前页面内存里。

## 五个页面（hash 路由）

- **概览 #/**：本月收支总览、结余、50/30/20 分配条、各分类支出占比图、超支提醒、最近五笔支出。
- **预算规划 #/planner**：设月收入、按分类设预算，50/30/20 规则对照，改任何一个数字都实时重算。
- **记账 #/expenses**：新增 / 编辑 / 删除支出记录（日期、分类、金额、备注），按月和分类筛选，导出 JSON，一键清空示例数据。
- **储蓄目标 #/goals**：设目标（金额、截止日期），进度条、每月需存多少，随记账自动更新。
- **报表 #/reports**：近 6 个月支出柱状图、结余走势折线图、食品支出趋势、月度明细、月均支出与结余。

## 示例数据

站内自带一个示例家庭的账本（2026 年 11 月，标明是示例）：月收入 ¥12,000（工资 ¥10,500 + 其他 ¥1,500）；八个分类预算合计 ¥9,000；储蓄目标 ¥3,000/月；16 条示例支出合计 ¥6,510，结余 ¥5,490；两个年度目标：应急基金 ¥20,000（已存 ¥12,500）、孩子教育 ¥30,000（已存 ¥8,000）。示例数据可以一键清空后记自己的账。

## 本地运行

```sh
node serve.ts        # http://localhost:8080
```

## 提交

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # 写 out/dossier.json，跑两次字节一致
```

参赛：make.fun 赏金 best-household-budget-site-20261126-1457（Make the best household budget site）。
