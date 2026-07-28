import { isAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  normalizeFeaturePlacement,
  serializeSellerFeature,
  serializeSellerFeatures,
} from "@/lib/seller-features";

function parseDurationDays(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  if (![7, 14, 30].includes(parsed)) {
    return null;
  }

  return parsed;
}

function buildEndsAt(startsAt, durationDays) {
  return new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
}

async function loadSellerFeatureRows() {
  const now = new Date();
  const sellers = await prisma.user.findMany({
    where: {
      OR: [
        { products: { some: {} } },
        { sellerFeatures: { some: { endsAt: { gt: now } } } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      sellerRatingAvg: true,
      sellerRatingCount: true,
      address: true,
      addressCity: true,
      _count: {
        select: {
          products: true,
        },
      },
      products: {
        select: {
          price: true,
        },
      },
      sellerFeatures: {
        orderBy: [
          { endsAt: "desc" },
          { createdAt: "desc" },
        ],
      },
    },
    orderBy: [
      { sellerFeatures: { _count: "desc" } },
      { createdAt: "desc" },
    ],
  });

  return sellers.map((seller) => ({
    id: seller.id,
    name: seller.name || seller.email || `Seller ${seller.id}`,
    email: seller.email,
    address: seller.address,
    addressCity: seller.addressCity,
    createdAt: seller.createdAt,
    sellerRatingAvg: Number(seller.sellerRatingAvg || 0),
    sellerRatingCount: Number(seller.sellerRatingCount || 0),
    listings: seller._count.products,
    revenueValue: seller.products.reduce((sum, product) => sum + Number(product.price || 0), 0),
    sellerFeatures: serializeSellerFeatures(seller.sellerFeatures),
  }));
}

export async function GET(request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!prisma.sellerFeature) {
    return Response.json(
      { error: "Seller features are not ready yet. Run Prisma generate and restart the server." },
      { status: 503 }
    );
  }

  try {
    const sellers = await loadSellerFeatureRows();
    return Response.json({ sellers });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to fetch seller features" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!prisma.sellerFeature) {
    return Response.json(
      { error: "Seller features are not ready yet. Run Prisma generate and restart the server." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const sellerId = Number.parseInt(String(body.sellerId || ""), 10);
    const placement = normalizeFeaturePlacement(body.placement);
    const durationDays = parseDurationDays(body.durationDays);

    if (!Number.isFinite(sellerId) || sellerId <= 0) {
      return Response.json({ error: "A valid sellerId is required" }, { status: 400 });
    }

    if (!placement) {
      return Response.json({ error: "Invalid placement" }, { status: 400 });
    }

    if (!durationDays) {
      return Response.json({ error: "Duration must be 7, 14, or 30 days" }, { status: 400 });
    }

    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        products: { select: { id: true }, take: 1 },
      },
    });

    if (!seller || seller.products.length === 0) {
      return Response.json({ error: "Seller not found" }, { status: 404 });
    }

    const startsAt = new Date();
    const endsAt = buildEndsAt(startsAt, durationDays);

    const feature = await prisma.sellerFeature.upsert({
      where: {
        sellerId_placement: {
          sellerId,
          placement,
        },
      },
      update: {
        durationDays,
        startsAt,
        endsAt,
      },
      create: {
        sellerId,
        placement,
        durationDays,
        startsAt,
        endsAt,
      },
    });

    const sellers = await loadSellerFeatureRows();

    return Response.json({
      feature: serializeSellerFeature(feature),
      sellers,
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to feature seller" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!prisma.sellerFeature) {
    return Response.json(
      { error: "Seller features are not ready yet. Run Prisma generate and restart the server." },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const sellerId = Number.parseInt(String(searchParams.get("sellerId") || ""), 10);
    const placement = normalizeFeaturePlacement(searchParams.get("placement"));

    if (!Number.isFinite(sellerId) || sellerId <= 0) {
      return Response.json({ error: "A valid sellerId is required" }, { status: 400 });
    }

    if (!placement) {
      return Response.json({ error: "Invalid placement" }, { status: 400 });
    }

    await prisma.sellerFeature.deleteMany({
      where: {
        sellerId,
        placement,
      },
    });

    const sellers = await loadSellerFeatureRows();
    return Response.json({ sellers });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to remove seller feature" },
      { status: 500 }
    );
  }
}