import { pickCity, toPkCurrency } from "./format";

export function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function activeUserIdsInRange(products, transactions, startMs, endMs) {
  const ids = new Set();
  products.forEach((product) => {
    const at = product.upload_date_time ? new Date(product.upload_date_time).getTime() : NaN;
    if (Number.isFinite(at) && at >= startMs && at < endMs && product.user_id) {
      ids.add(product.user_id);
    }
  });
  transactions.forEach((transaction) => {
    const at = transaction.createdAt ? new Date(transaction.createdAt).getTime() : NaN;
    if (Number.isFinite(at) && at >= startMs && at < endMs) {
      if (transaction.buyer?.id) ids.add(transaction.buyer.id);
      if (transaction.seller?.id) ids.add(transaction.seller.id);
    }
  });
  return ids.size;
}

export function buildDauSeries(products, transactions) {
  const now = new Date();
  const points = [];
  for (let offset = 13; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - offset);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    points.push({
      label: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value: activeUserIdsInRange(products, transactions, day.getTime(), nextDay.getTime()),
    });
  }
  return points;
}

export function buildMauSeries(products, transactions) {
  const now = new Date();
  const buckets = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
    buckets.push({
      label: monthStart.toLocaleDateString(undefined, { month: "short" }),
      value: activeUserIdsInRange(products, transactions, monthStart.getTime(), nextMonth.getTime()),
    });
  }
  return buckets;
}

const GMV_PALETTE = ["#0a6e6e", "#ff6b35", "#ffd166", "#2563eb", "#8b5cf6", "#16a34a", "#d97706"];

export function buildGmvByCategory(products) {
  const grouped = new Map();
  products.forEach((product) => {
    const categoryName = product.category?.category_name || "Others";
    grouped.set(categoryName, (grouped.get(categoryName) || 0) + Number(product.price || 0));
  });

  const top = [...grouped.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7);
  return {
    topCategory: top[0]?.[0] || "No Data",
    bars: top.map(([label, value], index) => ({
      label,
      value,
      formatted: toPkCurrency(value),
      color: GMV_PALETTE[index % GMV_PALETTE.length],
    })),
  };
}

const CATEGORY_SPLIT_COLORS = ["#0a6e6e", "#ff6b35", "#ffd166", "#2563eb"];

export function buildCategorySplit(products) {
  const grouped = new Map();
  products.forEach((product) => {
    const categoryName = product.category?.category_name || "Others";
    grouped.set(categoryName, (grouped.get(categoryName) || 0) + 1);
  });

  const entries = [...grouped.entries()].sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, entry) => sum + entry[1], 0) || 1;
  const top = entries.slice(0, 4).map(([label, count], index) => ({
    label,
    count,
    pct: Math.round((count / total) * 100),
    color: CATEGORY_SPLIT_COLORS[index % CATEGORY_SPLIT_COLORS.length],
  }));

  return {
    slices: top,
    totalListings: entries.reduce((sum, entry) => sum + entry[1], 0),
    hasData: top.length > 0,
  };
}

export function buildRecentRegistrations(users) {
  return [...users]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5)
    .map((user) => {
      const status = String(user.status || "active").toLowerCase() === "inactive" ? "Suspended" : "Active";
      return {
        id: user.id,
        name: user.name || user.email || "User",
        city: pickCity(user),
        status,
        createdAt: user.createdAt,
      };
    });
}

export function buildTopSellersThisWeek(products) {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const grouped = new Map();

  products.forEach((product) => {
    const uploadedAt = product.upload_date_time ? new Date(product.upload_date_time).getTime() : NaN;
    if (!Number.isFinite(uploadedAt) || now - uploadedAt > weekMs) return;
    const seller = product.user;
    if (!seller?.id) return;

    if (!grouped.has(seller.id)) {
      grouped.set(seller.id, {
        id: seller.id,
        name: seller.name || seller.email || `Seller ${seller.id}`,
        listings: 0,
        revenue: 0,
        ratingAvg: Number(seller.sellerRatingAvg || 0),
        ratingCount: Number(seller.sellerRatingCount || 0),
      });
    }

    const row = grouped.get(seller.id);
    row.listings += 1;
    row.revenue += Number(product.price || 0);
    row.ratingAvg = Number(seller.sellerRatingAvg || row.ratingAvg || 0);
    row.ratingCount = Number(seller.sellerRatingCount || row.ratingCount || 0);
  });

  return [...grouped.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
}
