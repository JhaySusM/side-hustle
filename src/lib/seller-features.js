const FEATURE_PLACEMENTS = {
  HOMEPAGE_BANNER: "homepage_banner",
  CATEGORY_TOP: "category_top",
  SEARCH_BOOST: "search_boost",
};

const FEATURE_PLACEMENT_LABELS = {
  [FEATURE_PLACEMENTS.HOMEPAGE_BANNER]: "Homepage Banner",
  [FEATURE_PLACEMENTS.CATEGORY_TOP]: "Category Top",
  [FEATURE_PLACEMENTS.SEARCH_BOOST]: "Search Boost",
};

export function normalizeFeaturePlacement(value) {
  const input = String(value || "").trim().toLowerCase();

  if (!input) {
    return null;
  }

  if (input === FEATURE_PLACEMENTS.HOMEPAGE_BANNER || input === "homepage banner") {
    return FEATURE_PLACEMENTS.HOMEPAGE_BANNER;
  }

  if (input === FEATURE_PLACEMENTS.CATEGORY_TOP || input === "category top") {
    return FEATURE_PLACEMENTS.CATEGORY_TOP;
  }

  if (input === FEATURE_PLACEMENTS.SEARCH_BOOST || input === "search boost") {
    return FEATURE_PLACEMENTS.SEARCH_BOOST;
  }

  return null;
}

export function getFeaturePlacementLabel(value) {
  const placement = normalizeFeaturePlacement(value);
  return placement ? FEATURE_PLACEMENT_LABELS[placement] : "";
}

export function isFeatureActive(feature, now = new Date()) {
  if (!feature?.endsAt) {
    return false;
  }

  const endsAt = new Date(feature.endsAt);
  if (Number.isNaN(endsAt.getTime())) {
    return false;
  }

  return endsAt.getTime() > now.getTime();
}

export function serializeSellerFeature(feature) {
  const placement = normalizeFeaturePlacement(feature?.placement);
  if (!placement) {
    return null;
  }

  const active = isFeatureActive(feature);

  return {
    id: feature.id,
    sellerId: feature.sellerId,
    placement,
    placementLabel: FEATURE_PLACEMENT_LABELS[placement],
    durationDays: Number(feature.durationDays || 0),
    startsAt: feature.startsAt,
    endsAt: feature.endsAt,
    active,
  };
}

export function serializeSellerFeatures(features) {
  return (features || [])
    .map(serializeSellerFeature)
    .filter(Boolean);
}

export function getActivePlacements(features) {
  const placements = new Set();

  for (const feature of serializeSellerFeatures(features)) {
    if (feature.active) {
      placements.add(feature.placement);
    }
  }

  return placements;
}

export function attachSellerFeatureState(product) {
  const features = serializeSellerFeatures(product?.user?.sellerFeatures || []);
  const activePlacements = getActivePlacements(features);

  return {
    ...product,
    user: product?.user
      ? {
          ...product.user,
          sellerFeatures: features,
          isFeaturedSeller: activePlacements.size > 0,
          featuredPlacements: [...activePlacements],
        }
      : product.user,
  };
}

export function compareProductsBySellerFeature(left, right, context = {}) {
  const leftPlacements = new Set(left?.user?.featuredPlacements || []);
  const rightPlacements = new Set(right?.user?.featuredPlacements || []);

  const preferredPlacement = context.preferredPlacement || null;
  const leftPreferred = preferredPlacement && leftPlacements.has(preferredPlacement) ? 1 : 0;
  const rightPreferred = preferredPlacement && rightPlacements.has(preferredPlacement) ? 1 : 0;

  if (leftPreferred !== rightPreferred) {
    return rightPreferred - leftPreferred;
  }

  const leftFeatured = leftPlacements.size > 0 ? 1 : 0;
  const rightFeatured = rightPlacements.size > 0 ? 1 : 0;

  if (leftFeatured !== rightFeatured) {
    return rightFeatured - leftFeatured;
  }

  const leftId = Number(left?.id || 0);
  const rightId = Number(right?.id || 0);
  return rightId - leftId;
}

export { FEATURE_PLACEMENTS };