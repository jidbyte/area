/**
 * Mock data for building storefront/dashboard UI before real shops, products,
 * and orders exist in Neon. Ported from the GoCart reference project, with
 * field names lined up to AREA's own schema (`shopId`/`slug` instead of
 * GoCart's `storeId`/`username`, etc). Images come from src/assets/gocart.
 *
 * This is NOT seed data for the database — it's for wiring up components
 * (product cards, dashboards, order lists) against realistic shapes while
 * the real data layer is still being built, phase by phase.
 */
import { gocartAssets } from "@/assets/gocart";

// ---- Shops -----------------------------------------------------------

export const dummyShops = [
  {
    id: "shop_1",
    clerkOrgId: "org_dummy_1",
    name: "GreatStack",
    slug: "greatstack",
    description:
      "GreatStack is the education marketplace where you can buy goodies related to coding and tech.",
    address: "123 Maplewood Drive, Springfield, IL 62704, USA",
    status: "approved" as const,
    isActive: true,
    logo: gocartAssets.gs_logo,
    email: "greatstack@example.com",
    contact: "+0 1234567890",
    commissionRate: 500, // 5%, basis points
    createdAt: "2025-08-22T08:22:16.189Z",
    updatedAt: "2025-08-22T08:22:44.273Z",
    // display-only, not part of the `shop` table — comes from Clerk in real usage
    owner: { name: "GreatStack", email: "user.greatstack@gmail.com", image: gocartAssets.gs_logo },
  },
  {
    id: "shop_2",
    clerkOrgId: "org_dummy_2",
    name: "Happy Shop",
    slug: "happyshop",
    description:
      "At Happy Shop, we believe shopping should be simple, smart, and satisfying — fashion, electronics, home essentials, and more, all under one digital roof.",
    address: "3rd Floor, Happy Shop, New Building, 123 Street, C Sector, NY, US",
    status: "approved" as const,
    isActive: true,
    logo: gocartAssets.happy_store,
    email: "happyshop@example.com",
    contact: "+0 1234567890",
    commissionRate: 500,
    createdAt: "2025-09-04T09:04:16.189Z",
    updatedAt: "2025-09-04T09:04:44.273Z",
    owner: { name: "Great Stack", email: "user.greatstack@gmail.com", image: gocartAssets.gs_logo },
  },
];

// ---- Products ----------------------------------------------------------

type ProductSeed = [
  name: string,
  price: number,
  compareAtPrice: number,
  image: (typeof gocartAssets)[keyof typeof gocartAssets],
  category: string,
];

const productSeeds: ProductSeed[] = [
  ["Modern table lamp", 29, 40, gocartAssets.product_img1, "Decoration"],
  ["Smart speaker gray", 29, 50, gocartAssets.product_img2, "Speakers"],
  ["Smart watch white", 29, 60, gocartAssets.product_img3, "Watch"],
  ["Wireless headphones", 29, 70, gocartAssets.product_img4, "Headphones"],
  ["Smart watch black", 29, 49, gocartAssets.product_img5, "Watch"],
  ["Security camera", 29, 59, gocartAssets.product_img6, "Camera"],
  ["Smart pen for iPad", 29, 89, gocartAssets.product_img7, "Pen"],
  ["Home theater", 29, 99, gocartAssets.product_img8, "Theater"],
  ["Wireless earbuds", 29, 89, gocartAssets.product_img9, "Earbuds"],
  ["Smart watch pro", 29, 179, gocartAssets.product_img10, "Watch"],
  ["RGB gaming mouse", 29, 39, gocartAssets.product_img11, "Mouse"],
  ["Smart home cleaner", 29, 199, gocartAssets.product_img12, "Cleaner"],
];

export const dummyProducts = productSeeds.map(
  ([name, price, compareAtPrice, image, category], i) => {
    const quantity = 8 + i * 3; // varied stock levels for a believable inventory view
    return {
      id: `prod_${i + 1}`,
      shopId: i % 2 === 0 ? dummyShops[0].id : dummyShops[1].id,
      name,
      sku: `SKU-${1000 + i}`,
      brand: null as string | null,
      model: null as string | null,
      description:
        `${name} with a sleek design — perfect for any room, made of high-quality materials, ` +
        `and backed by a lifetime warranty.`,
      price, // matches product.price in the real schema
      compareAtPrice, // display-only ("was" price) — not a schema column
      cost: Math.round(price * 0.6),
      quantity,
      restockLevel: Math.max(3, Math.round(quantity * 0.2)),
      optimalLevel: Math.round(quantity * 1.5),
      isActive: true,
      images: [{ url: image, isPrimary: true }],
      categories: [category],
      inStock: quantity > 0,
      createdAt: "2025-07-25T09:21:25.000Z",
      updatedAt: "2025-07-25T09:21:25.000Z",
    };
  },
);

export const categories = Array.from(new Set(productSeeds.map(([, , , , c]) => c)));

// ---- Ratings -------------------------------------------------------------

export const dummyRatings = [
  {
    id: "rat_1",
    rating: 4.2,
    review:
      "I was a bit skeptical at first, but this turned out even better than I imagined. Quality feels premium, it's easy to use, and it delivers on the promise.",
    user: { name: "Kristin Watson", image: gocartAssets.profile_pic1 },
    productId: "prod_1",
    createdAt: "2025-07-19T09:21:25.000Z",
  },
  {
    id: "rat_2",
    rating: 5.0,
    review: "Exactly what I needed. My setup is so much faster and easier to work with now.",
    user: { name: "Jenny Wilson", image: gocartAssets.profile_pic2 },
    productId: "prod_2",
    createdAt: "2025-07-19T09:21:25.000Z",
  },
  {
    id: "rat_3",
    rating: 4.1,
    review: "Amazing product, made everything so much simpler.",
    user: { name: "Bessie Cooper", image: gocartAssets.profile_pic3 },
    productId: "prod_3",
    createdAt: "2025-07-19T09:21:25.000Z",
  },
];

// ---- Address & coupons ---------------------------------------------------

export const dummyAddress = {
  id: "addr_1",
  name: "John Doe",
  email: "johndoe@example.com",
  street: "123 Main St",
  city: "New York",
  state: "NY",
  zip: "10001",
  country: "USA",
  phone: "1234567890",
  createdAt: "2025-07-19T09:21:25.000Z",
};

export const dummyCoupons = [
  { code: "NEW20", shopId: null, description: "20% off for new users", discount: 20, forNewUser: true, forMember: false, isPublic: false, expiresAt: "2026-12-31T00:00:00.000Z" },
  { code: "NEW10", shopId: null, description: "10% off for new users", discount: 10, forNewUser: true, forMember: false, isPublic: false, expiresAt: "2026-12-31T00:00:00.000Z" },
  { code: "OFF20", shopId: null, description: "20% off for all users", discount: 20, forNewUser: false, forMember: false, isPublic: true, expiresAt: "2026-12-31T00:00:00.000Z" },
  { code: "PLUS10", shopId: null, description: "10% off for members", discount: 10, forNewUser: false, forMember: true, isPublic: false, expiresAt: "2027-03-06T00:00:00.000Z" },
];

// ---- Buyer & orders (guest-friendly — buyerClerkUserId is optional) -----

export const dummyBuyer = {
  buyerClerkUserId: null as string | null,
  email: "johndoe@example.com",
  name: "John Doe",
};

export const dummyOrders = [
  {
    id: "order_1",
    buyerEmail: dummyBuyer.email,
    buyerClerkUserId: dummyBuyer.buyerClerkUserId,
    total: 214.2,
    status: "DELIVERED" as const,
    paymentMethod: "PAYSTACK" as const,
    address: dummyAddress,
    createdAt: "2025-08-22T09:15:03.929Z",
    orderGroups: [
      {
        shopId: dummyShops[0].id,
        subtotal: 89,
        status: "DELIVERED" as const,
        items: [{ productId: "prod_1", quantity: 1, price: 89 }],
      },
    ],
  },
  {
    id: "order_2",
    buyerEmail: dummyBuyer.email,
    buyerClerkUserId: dummyBuyer.buyerClerkUserId,
    total: 421.6,
    status: "PROCESSING" as const,
    paymentMethod: "PAYSTACK" as const,
    address: dummyAddress,
    createdAt: "2025-08-22T09:14:35.923Z",
    orderGroups: [
      {
        shopId: dummyShops[0].id,
        subtotal: 229,
        status: "PROCESSING" as const,
        items: [{ productId: "prod_3", quantity: 1, price: 229 }],
      },
      {
        shopId: dummyShops[1].id,
        subtotal: 99,
        status: "SHIPPED" as const,
        items: [{ productId: "prod_4", quantity: 1, price: 99 }],
      },
    ],
  },
];

// ---- Dashboard stats ------------------------------------------------------

export const dummyPlatformDashboard = {
  orders: 6,
  shops: dummyShops.length,
  products: dummyProducts.length,
  revenue: 959.1,
  allOrders: [
    { createdAt: "2025-08-20T08:46:58.239Z", total: 145.6 },
    { createdAt: "2025-08-21T08:46:21.818Z", total: 97.2 },
    { createdAt: "2025-08-22T08:45:59.587Z", total: 54.4 },
    { createdAt: "2025-08-23T09:15:03.929Z", total: 214.2 },
    { createdAt: "2025-08-24T09:14:35.923Z", total: 421.6 },
    { createdAt: "2025-08-25T11:44:29.713Z", total: 26.1 },
  ],
};

export const dummyShopDashboard = {
  ratings: dummyRatings,
  totalOrders: 2,
  totalEarnings: 636,
  totalProducts: 5,
};
