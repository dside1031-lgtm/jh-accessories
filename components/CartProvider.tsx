"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { useProduct } from "@/components/ProductProvider";

// =====================================================
// 購物車商品型別
// =====================================================

export type CartItem = {
  id: string | number;
  name: string;
  price: number;
  image?: string;
  category?: string;
  quantity: number;
};

// =====================================================
// 購物車 Context 型別
// =====================================================

type CartContextType = {
  cart: CartItem[];

  addToCart: (
    product: any
  ) => boolean;

  removeFromCart: (
    id: string | number
  ) => void;

  increaseQuantity: (
    id: string | number
  ) => void;

  decreaseQuantity: (
    id: string | number
  ) => void;

  clearCart: () => void;
};

// =====================================================
// Context
// =====================================================

const CartContext =
  createContext<CartContextType | null>(
    null
  );

// =====================================================
// localStorage Key
// =====================================================

const CART_STORAGE_KEY = "cart";

// =====================================================
// 安全數字
// =====================================================

function safeNumber(
  value: unknown,
  fallback = 0
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return fallback;
  }

  return number;
}

// =====================================================
// 安全庫存
// =====================================================

function getStock(
  product: any
) {
  const stock =
    safeNumber(
      product?.stock,
      0
    );

  if (stock <= 0) {
    return 0;
  }

  return Math.floor(stock);
}

// =====================================================
// 安全商品價格
// =====================================================

function getPrice(
  product: any
) {
  const price =
    safeNumber(
      product?.price,
      0
    );

  if (price < 0) {
    return 0;
  }

  return price;
}

// =====================================================
// 判斷是否為有效購物車商品
// =====================================================

function isValidCartItem(
  item: any
): item is CartItem {
  if (!item) {
    return false;
  }

  if (
    item.id === undefined ||
    item.id === null
  ) {
    return false;
  }

  if (
    typeof item.name !==
    "string"
  ) {
    return false;
  }

  const quantity =
    safeNumber(
      item.quantity,
      0
    );

  if (
    !Number.isFinite(quantity) ||
    quantity < 1
  ) {
    return false;
  }

  return true;
}

// =====================================================
// 正規化購物車
// =====================================================

function normalizeCart(
  value: unknown
): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isValidCartItem)
    .map((item) => ({
      id: item.id,

      name:
        String(
          item.name || ""
        ).trim() ||
        "未命名商品",

      price:
        Math.max(
          0,
          getPrice(item)
        ),

      image:
        typeof item.image ===
        "string"
          ? item.image
          : "",

      category:
        typeof item.category ===
        "string"
          ? item.category
          : "",

      quantity:
        Math.max(
          1,
          Math.floor(
            safeNumber(
              item.quantity,
              1
            )
          )
        ),
    }));
}

// =====================================================
// CartProvider
// =====================================================

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    products,
  } = useProduct();

  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  // ===================================================
  // 載入 localStorage
  // ===================================================

  useEffect(() => {
    try {
      const savedCart =
        localStorage.getItem(
          CART_STORAGE_KEY
        );

      if (!savedCart) {
        setCart([]);
        return;
      }

      const parsed =
        JSON.parse(savedCart);

      const normalized =
        normalizeCart(parsed);

      setCart(normalized);
    } catch (error) {
      console.error(
        "讀取購物車失敗：",
        error
      );

      setCart([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  // ===================================================
  // 儲存 localStorage
  // ===================================================

  useEffect(() => {
    if (!loaded) {
      return;
    }

    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
      );
    } catch (error) {
      console.error(
        "儲存購物車失敗：",
        error
      );
    }
  }, [cart, loaded]);

  // ===================================================
  // 取得目前最新商品
  // ===================================================

  function getCurrentProduct(
    id: string | number
  ) {
    return products.find(
      (product: any) =>
        String(product.id) ===
        String(id)
    );
  }

  // ===================================================
  // 加入購物車
  // ===================================================

  function addToCart(
    product: any
  ): boolean {
    if (!product) {
      return false;
    }

    const productId =
      product.id;

    if (
      productId ===
        undefined ||
      productId === null
    ) {
      alert(
        "商品資料錯誤"
      );

      return false;
    }

    const currentProduct =
      getCurrentProduct(
        productId
      );

    if (!currentProduct) {
      alert(
        "找不到這個商品"
      );

      return false;
    }

    const stock =
      getStock(
        currentProduct
      );

    if (stock <= 0) {
      alert(
        "商品已售罄"
      );

      return false;
    }

    let success = false;

    setCart(
      (prevCart) => {
        const existingIndex =
          prevCart.findIndex(
            (item) =>
              String(item.id) ===
              String(productId)
          );

        // =============================================
        // 已存在購物車
        // =============================================

        if (
          existingIndex >= 0
        ) {
          const existing =
            prevCart[
              existingIndex
            ];

          const currentQuantity =
            Math.max(
              0,
              Math.floor(
                safeNumber(
                  existing.quantity,
                  0
                )
              )
            );

          if (
            currentQuantity + 1 >
            stock
          ) {
            return prevCart;
          }

          success = true;

          return prevCart.map(
            (
              item,
              index
            ) =>
              index ===
              existingIndex
                ? {
                    ...item,

                    name:
                      currentProduct.name,

                    price:
                      getPrice(
                        currentProduct
                      ),

                    image:
                      currentProduct.image ||
                      "",

                    category:
                      currentProduct.category ||
                      "",

                    quantity:
                      currentQuantity +
                      1,
                  }
                : item
          );
        }

        // =============================================
        // 第一次加入
        // =============================================

        success = true;

        const newItem: CartItem =
          {
            id:
              currentProduct.id,

            name:
              String(
                currentProduct.name ||
                  "未命名商品"
              ),

            price:
              getPrice(
                currentProduct
              ),

            image:
              currentProduct.image ||
              "",

            category:
              currentProduct.category ||
              "",

            quantity: 1,
          };

        return [
          ...prevCart,
          newItem,
        ];
      }
    );

    if (!success) {
      alert(
        `庫存不足，目前只剩 ${stock} 件`
      );
    }

    return success;
  }

  // ===================================================
  // 增加商品數量
  // ===================================================

  function increaseQuantity(
    id: string | number
  ) {
    const currentProduct =
      getCurrentProduct(id);

    if (!currentProduct) {
      alert(
        "商品不存在，可能已被刪除。"
      );

      return;
    }

    const stock =
      getStock(
        currentProduct
      );

    if (stock <= 0) {
      alert(
        "商品目前已售罄。"
      );

      return;
    }

    let success = false;

    setCart(
      (prevCart) => {
        return prevCart.map(
          (item) => {
            if (
              String(item.id) !==
              String(id)
            ) {
              return item;
            }

            const currentQuantity =
              Math.max(
                1,
                Math.floor(
                  safeNumber(
                    item.quantity,
                    1
                  )
                )
              );

            if (
              currentQuantity >=
              stock
            ) {
              return item;
            }

            success = true;

            return {
              ...item,

              name:
                currentProduct.name,

              price:
                getPrice(
                  currentProduct
                ),

              image:
                currentProduct.image ||
                "",

              category:
                currentProduct.category ||
                "",

              quantity:
                currentQuantity +
                1,
            };
          }
        );
      }
    );

    if (!success) {
      alert(
        `庫存不足，目前最多只能購買 ${stock} 件`
      );
    }
  }

  // ===================================================
  // 減少商品數量
  // ===================================================

  function decreaseQuantity(
    id: string | number
  ) {
    setCart(
      (prevCart) =>
        prevCart.map(
          (item) => {
            if (
              String(item.id) !==
              String(id)
            ) {
              return item;
            }

            const quantity =
              Math.max(
                1,
                Math.floor(
                  safeNumber(
                    item.quantity,
                    1
                  )
                )
              );

            return {
              ...item,

              quantity:
                Math.max(
                  1,
                  quantity - 1
                ),
            };
          }
        )
    );
  }

  // ===================================================
  // 移除商品
  // ===================================================

  function removeFromCart(
    id: string | number
  ) {
    setCart(
      (prevCart) =>
        prevCart.filter(
          (item) =>
            String(item.id) !==
            String(id)
        )
    );
  }

  // ===================================================
  // 清空購物車
  // ===================================================

  function clearCart() {
    setCart([]);

    try {
      localStorage.removeItem(
        CART_STORAGE_KEY
      );
    } catch (error) {
      console.error(
        "清除購物車失敗：",
        error
      );
    }
  }

  // ===================================================
  // 同步商品最新資料
  //
  // 商品名稱、價格、圖片、分類可能
  // 在後台被修改。
  //
  // 購物車保留數量，
  // 但同步最新商品資訊。
  // ===================================================

  useEffect(() => {
    if (!loaded) {
      return;
    }

    if (
      !Array.isArray(products)
    ) {
      return;
    }

    setCart(
      (prevCart) => {
        let changed = false;

        const nextCart =
          prevCart
            .map((item) => {
              const currentProduct =
                getCurrentProduct(
                  item.id
                );

              // -----------------------------------------
              // 商品已不存在
              // -----------------------------------------

              if (
                !currentProduct
              ) {
                changed = true;
                return null;
              }

              const stock =
                getStock(
                  currentProduct
                );

              // -----------------------------------------
              // 商品已售罄
              //
              // 保留商品，但數量最多調整成 0
              // 後續直接移除。
              // -----------------------------------------

              if (
                stock <= 0
              ) {
                changed = true;
                return null;
              }

              // -----------------------------------------
              // 庫存不足 → 自動調整購物車數量
              // -----------------------------------------

              const safeQuantity =
                Math.min(
                  Math.max(
                    1,
                    Math.floor(
                      safeNumber(
                        item.quantity,
                        1
                      )
                    )
                  ),
                  stock
                );

              const nextItem: CartItem =
                {
                  ...item,

                  name:
                    String(
                      currentProduct.name ||
                        "未命名商品"
                    ),

                  price:
                    getPrice(
                      currentProduct
                    ),

                  image:
                    currentProduct.image ||
                    "",

                  category:
                    currentProduct.category ||
                    "",

                  quantity:
                    safeQuantity,
                };

              // -----------------------------------------
              // 判斷是否真的有變更
              // -----------------------------------------

              if (
                item.name !==
                  nextItem.name ||
                item.price !==
                  nextItem.price ||
                item.image !==
                  nextItem.image ||
                item.category !==
                  nextItem.category ||
                item.quantity !==
                  nextItem.quantity
              ) {
                changed = true;
              }

              return nextItem;
            })
            .filter(
              (
                item
              ): item is CartItem =>
                item !== null
            );

        if (!changed) {
          return prevCart;
        }

        return nextCart;
      }
    );
  }, [
    products,
    loaded,
  ]);

  // ===================================================
  // Provider
  // ===================================================

  return (
    <CartContext.Provider
      value={{
        cart,

        addToCart,

        removeFromCart,

        increaseQuantity,

        decreaseQuantity,

        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// =====================================================
// useCart
// =====================================================

export function useCart() {
  const context =
    useContext(
      CartContext
    );

  if (!context) {
    throw new Error(
      "useCart 必須在 CartProvider 裡使用"
    );
  }

  return context;
}