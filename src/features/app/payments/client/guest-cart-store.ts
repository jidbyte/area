import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GuestCartItem = {
  productId: string;
  name: string;
  sellingPrice: number;
  quantity: number;
  maxQuantity: number;
  imageUrl: string | null;
};

type ShopGuestCart = {
  shopSlug: string;
  items: GuestCartItem[];
};

type GuestCartState = {
  // Keyed by shopId — a guest can have items sitting in more than one
  // store's cart at once, same as a signed-in buyer could.
  carts: Record<string, ShopGuestCart>;
  addItem: (shopId: string, shopSlug: string, item: Omit<GuestCartItem, "quantity">, quantity: number) => void;
  updateQuantity: (shopId: string, productId: string, quantity: number) => void;
  removeItem: (shopId: string, productId: string) => void;
  clearShopCart: (shopId: string) => void;
};

/**
 * Guest-only cart cache. Signed-in buyers never touch this — their cart is
 * the existing server/DB-backed one (features/cart/server), which already
 * persists across sessions/devices correctly. This store exists purely to
 * avoid a DB round-trip (and a DB row) for anonymous browsing, per the
 * "zustand cache when not logged in" requirement. It's merged into the real
 * server cart at checkout time (see checkout page), since payment and stock
 * checks need server-side authority regardless of how the cart got built.
 */
export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set) => ({
      carts: {},

      addItem: (shopId, shopSlug, item, quantity) =>
        set((state) => {
          const existing = state.carts[shopId]?.items ?? [];
          const existingItem = existing.find((i) => i.productId === item.productId);
          const nextQuantity = Math.min(
            (existingItem?.quantity ?? 0) + quantity,
            item.maxQuantity,
          );

          const items = existingItem
            ? existing.map((i) =>
                i.productId === item.productId ? { ...i, quantity: nextQuantity } : i,
              )
            : [...existing, { ...item, quantity: nextQuantity }];

          return {
            carts: { ...state.carts, [shopId]: { shopSlug, items } },
          };
        }),

      updateQuantity: (shopId, productId, quantity) =>
        set((state) => {
          const shopCart = state.carts[shopId];
          if (!shopCart) return state;

          const items =
            quantity < 1
              ? shopCart.items.filter((i) => i.productId !== productId)
              : shopCart.items.map((i) =>
                  i.productId === productId
                    ? { ...i, quantity: Math.min(quantity, i.maxQuantity) }
                    : i,
                );

          return { carts: { ...state.carts, [shopId]: { ...shopCart, items } } };
        }),

      removeItem: (shopId, productId) =>
        set((state) => {
          const shopCart = state.carts[shopId];
          if (!shopCart) return state;
          return {
            carts: {
              ...state.carts,
              [shopId]: {
                ...shopCart,
                items: shopCart.items.filter((i) => i.productId !== productId),
              },
            },
          };
        }),

      clearShopCart: (shopId) =>
        set((state) => {
          const next = { ...state.carts };
          delete next[shopId];
          return { carts: next };
        }),
    }),
    { name: "area-guest-cart" },
  ),
);
