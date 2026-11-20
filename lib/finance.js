// Pure finance math — testable, no DOM/localStorage access.

export function branchPL(state, brand, branch) {
  const salesRec = (state.geidea || []).find((x) => x.brand === brand && x.branch === branch);
  const fin = (state.finance || []).find((x) => x.brand === brand && x.branch === branch) || {
    foodCost: 0,
    payroll: 0,
    rent: 0,
    other: 0,
  };
  const sales = Number(salesRec?.total || 0);
  const foodCost = Number(fin.foodCost || 0);
  const payroll = Number(fin.payroll || 0);
  const rent = Number(fin.rent || 0);
  const other = Number(fin.other || 0);
  const totalCost = foodCost + payroll + rent + other;
  const profit = sales - totalCost;
  const margin = sales > 0 ? Math.round((profit / sales) * 100) : 0;
  return { sales, foodCost, payroll, rent, other, totalCost, profit, margin };
}

export function brandPL(state, brand, BRANDS) {
  return (BRANDS[brand] || []).reduce(
    (acc, branch) => {
      const p = branchPL(state, brand, branch);
      acc.sales += p.sales;
      acc.foodCost += p.foodCost;
      acc.payroll += p.payroll;
      acc.rent += p.rent;
      acc.other += p.other;
      acc.totalCost += p.totalCost;
      acc.profit += p.profit;
      return acc;
    },
    { sales: 0, foodCost: 0, payroll: 0, rent: 0, other: 0, totalCost: 0, profit: 0 }
  );
}

export function marginPct(profit, sales) {
  return sales > 0 ? Math.round((profit / sales) * 100) : 0;
}

export function recipeMargin(cost, price) {
  const c = Number(cost || 0);
  const p = Number(price || 0);
  return p > 0 ? Math.round(((p - c) / p) * 100) : 0;
}
