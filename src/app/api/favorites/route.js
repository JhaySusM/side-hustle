import { prisma } from "@/lib/prisma";
import { requireRequestUser } from "@/lib/auth";

export async function GET(request) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            category: true,
            user: {
              select: { id: true, name: true, email: true, address: true },
            },
          },
        },
      },
    });

    return Response.json({
      favorites: favorites.map((favorite) => ({
        ...favorite,
        product: {
          ...favorite.product,
          isFavorited: true,
        },
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message || "Failed to fetch favorites" }, { status: 500 });
  }
}

export async function POST(request) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const body = await request.json();
    const productId = Number(body.productId);

    if (!productId) {
      return Response.json({ error: "Product ID is required" }, { status: 400 });
    }

    const product = await prisma.productList.findUnique({
      where: { id: productId },
      select: { id: true, user_id: true },
    });

    if (!product) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    if (product.user_id === user.id) {
      return Response.json({ error: "You cannot favorite your own listing" }, { status: 400 });
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        productId,
      },
    });

    return Response.json({ favorite, isFavorited: true });
  } catch (error) {
    return Response.json({ error: error.message || "Failed to save favorite" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const body = await request.json();
    const productId = Number(body.productId);

    if (!productId) {
      return Response.json({ error: "Product ID is required" }, { status: 400 });
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: user.id,
        productId,
      },
    });

    return Response.json({ success: true, isFavorited: false });
  } catch (error) {
    return Response.json({ error: error.message || "Failed to remove favorite" }, { status: 500 });
  }
}