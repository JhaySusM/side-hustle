import { pickCity, toJoinedDate, toPkCurrency, isSameDay } from "./format";

// DAU/WAU/MAU here are derived purely from product-upload timestamps (not
// real session tracking) — a faithful port of the old backoffice's heuristic,
// not a new metric.
export function deriveUserActivity(users, products, transactions) {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const userIdSet = new Set(users.map((user) => user.id));

  const recentByDays = (list, field, days) =>
    list.filter((item) => {
      const value = item?.[field];
      const date = value ? new Date(value).getTime() : NaN;
      return Number.isFinite(date) && now - date <= days * DAY;
    }).length;

  const newRegistration = recentByDays(users, "createdAt", 7);
  const newListingsToday = recentByDays(products, "upload_date_time", 1);
  const transactionsToday = recentByDays(transactions, "createdAt", 1);

  const activeIdsWithin = (days) => {
    const ids = new Set();
    products.forEach((product) => {
      const date = product.upload_date_time ? new Date(product.upload_date_time).getTime() : NaN;
      if (Number.isFinite(date) && now - date <= days * DAY && userIdSet.has(product.user_id)) {
        ids.add(product.user_id);
      }
    });
    return ids.size;
  };

  return {
    dau: activeIdsWithin(1),
    wau: activeIdsWithin(7),
    mau: activeIdsWithin(30),
    newRegistration,
    newListingsToday,
    transactionsToday,
  };
}

export function buildLiveUsers(users, reports = []) {
  const reportedUserIds = new Set();
  reports
    .filter((report) => report?.status === "open")
    .forEach((report) => {
      const listingSellerId = report?.listing?.seller?.id;
      const sellerReportId = report?.seller?.id;
      if (listingSellerId) reportedUserIds.add(listingSellerId);
      if (sellerReportId) reportedUserIds.add(sellerReportId);
    });

  return users.map((user) => {
    const statusRaw = String(user.status || "active").toLowerCase();
    const status = statusRaw === "inactive" ? "Suspended" : reportedUserIds.has(user.id) ? "Reported" : "Active";
    const name = user.name || user.email || "User";
    return {
      id: user.id,
      name,
      email: user.email || "—",
      phone: user.phone || "N/A",
      city: pickCity(user),
      joined: toJoinedDate(user.createdAt),
      listings: 0,
      status,
      color: "#0a6e6e",
    };
  });
}

export function hydrateUsersList(users, products, reports) {
  const countsByUser = new Map();
  products.forEach((product) => {
    if (!product.user_id) return;
    countsByUser.set(product.user_id, (countsByUser.get(product.user_id) || 0) + 1);
  });

  return buildLiveUsers(users, reports).map((user) => ({
    ...user,
    listings: countsByUser.get(user.id) || 0,
  }));
}

// `active` is computed server-side (src/lib/seller-features.js serializeSellerFeature)
// as endsAt > now, so it doesn't need to be recomputed client-side here.
export function getActiveSellerFeatures(seller) {
  return (seller?.sellerFeatures || []).filter((feature) => feature?.active);
}

export function getSellerStatus(seller) {
  if (getActiveSellerFeatures(seller).length > 0) return "Featured";
  return seller?.status || "Active";
}

export function summarizeSellerPlacements(seller) {
  return getActiveSellerFeatures(seller)
    .map((feature) => feature.placementLabel)
    .filter(Boolean)
    .join(", ");
}

export function mapFeaturePlacementLabelToValue(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "homepage banner") return "homepage_banner";
  if (normalized === "category top") return "category_top";
  if (normalized === "search boost") return "search_boost";
  return "";
}

const SELLER_PALETTE = ["#0a6e6e", "#ff6b35", "#2563eb", "#8b5cf6", "#16a34a", "#dc2626"];

export function hydrateSellersList(sellers, products = []) {
  if ((sellers || []).length) {
    return sellers.map((seller, index) => ({
      ...seller,
      city: seller.addressCity || pickCity(seller),
      since: toJoinedDate(seller.createdAt),
      type: Number(seller.listings || 0) >= 20 ? "Business" : "Individual",
      status: getActiveSellerFeatures(seller).length > 0 ? "Featured" : "Active",
      color: SELLER_PALETTE[index % SELLER_PALETTE.length],
      rating: Number(seller.sellerRatingAvg || seller.rating || 0),
      ratingCount: Number(seller.sellerRatingCount || seller.ratingCount || 0),
      revenueValue: Number(seller.revenueValue || 0),
      revenue: toPkCurrency(seller.revenueValue || 0),
    }));
  }

  const grouped = new Map();
  products.forEach((product) => {
    const seller = product.user;
    if (!seller?.id) return;

    if (!grouped.has(seller.id)) {
      grouped.set(seller.id, {
        id: seller.id,
        name: seller.name || seller.email || `Seller ${seller.id}`,
        city: "Unknown",
        since: toJoinedDate(seller.createdAt || product.upload_date_time),
        type: "Individual",
        listings: 0,
        revenueValue: 0,
        rating: Number(seller.sellerRatingAvg || 0),
        ratingCount: Number(seller.sellerRatingCount || 0),
        status: "Active",
        color: "#0a6e6e",
        sellerFeatures: [],
      });
    }

    const row = grouped.get(seller.id);
    row.listings += 1;
    row.revenueValue += Number(product.price || 0);
  });

  return [...grouped.values()]
    .sort((a, b) => b.listings - a.listings)
    .map((seller) => ({
      ...seller,
      rating: seller.rating > 0 ? seller.rating : 0,
      revenue: toPkCurrency(seller.revenueValue),
    }));
}

const LISTING_STATUS_MAP = { Pending: "pending", Active: "approved", Sold: "approved", Inactive: "rejected" };

export function mapProductsToListingRows(products) {
  return products.slice(0, 200).map((product) => {
    const name = product.product_name || "Untitled listing";
    const lowerName = name.toLowerCase();
    const maybeIllegal = lowerName.includes("gun") || lowerName.includes("pistol") || lowerName.includes("weapon");
    return {
      id: String(product.id),
      emoji: "📦",
      title: name,
      description: product.description || "",
      imageUrl: product.image || "",
      seller: product.user?.name || product.user?.email || "Unknown Seller",
      cat: product.category?.category_name || "Uncategorized",
      price: toPkCurrency(product.price),
      city: pickCity(product.user || {}),
      time: toJoinedDate(product.upload_date_time),
      uploadedAt: product.upload_date_time || null,
      flag: maybeIllegal ? "illegal" : "clean",
      flagLabel: maybeIllegal ? "🚫 Possible Illegal Item" : "Clean",
      status: LISTING_STATUS_MAP[product.product_status] || "pending",
    };
  });
}

export function refreshListingApprovalStats(listingRows) {
  const pendingCount = listingRows.filter((listing) => listing.status === "pending").length;
  const approvedToday = listingRows.filter((listing) => listing.status === "approved" && isSameDay(listing.uploadedAt)).length;
  const rejectedToday = listingRows.filter((listing) => listing.status === "rejected" && isSameDay(listing.uploadedAt)).length;
  const approvedTotal = listingRows.filter((listing) => listing.status === "approved").length;
  const rejectedTotal = listingRows.filter((listing) => listing.status === "rejected").length;
  const reviewedTotal = approvedTotal + rejectedTotal;
  const autoApprovedPct = reviewedTotal > 0 ? (approvedTotal / reviewedTotal) * 100 : 0;

  return { pending: pendingCount, approvedToday, rejectedToday, autoApprovedPct };
}

export function hydrateDashboardStats(users, products, transactions, summary) {
  const activeUsers = users.filter((user) => String(user.status || "").toLowerCase() === "active");
  const sellerIds = new Set(products.map((product) => product.user_id).filter(Boolean));
  const activeSellers = activeUsers.filter((user) => sellerIds.has(user.id)).length;
  const activeBuyers = Math.max(activeUsers.length - activeSellers, 0);
  const conversionRate = products.length ? ((transactions.length / products.length) * 100).toFixed(1) : "0.0";
  const pendingCount = products.filter((product) => product.product_status === "Pending").length;

  return {
    activeSellers,
    activeBuyers,
    conversionRate,
    pendingCount,
    gmv: summary?.gmv || 0,
    verifiedRevenue: summary?.verifiedRevenue || 0,
  };
}
