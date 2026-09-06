"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CouponProvider } from "@/components/CouponProvider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menuItems = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: "📊",
    },
    {
      href: "/admin/products",
      label: "商品管理",
      icon: "📦",
    },
    {
      href: "/admin/orders",
      label: "訂單管理",
      icon: "🧾",
    },
    {
      href: "/admin/inventory",
      label: "庫存管理",
      icon: "🏷️",
    },
    {
      href: "/admin/inventory/logs",
      label: "庫存異動紀錄",
      icon: "📋",
    },
    {
      href: "/admin/inventory/stocktake",
      label: "庫存盤點",
      icon: "🔍",
    },
    {
      href: "/admin/members",
      label: "會員管理",
      icon: "👥",
    },
    {
      href: "/admin/coupons",
      label: "優惠券管理",
      icon: "🎟️",
    },
    {
      href: "/admin/reports",
      label: "報表分析",
      icon: "📈",
    },
  ];

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  return (
    <CouponProvider>
      <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-[#0b1120] text-white">
        {/* =====================================================
            Header
        ===================================================== */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#111827]">
          <div
            className="
              mx-auto
              flex
              min-h-16
              w-full
              max-w-7xl
              min-w-0
              items-center
              justify-between
              gap-3
              px-4
              sm:px-6
              lg:px-8
            "
          >
            {/* Logo */}
            <Link
              href="/admin"
              className="min-w-0 max-w-full"
            >
              <div
                className="
                  truncate
                  text-xl
                  font-bold
                  leading-tight
                  text-white
                  sm:text-2xl
                "
              >
                JH Accessories
              </div>

              <div className="truncate text-xs text-gray-400 sm:text-sm">
                後台管理系統
              </div>
            </Link>

            {/* 回到前台 */}
            <Link
              href="/"
              className="
                shrink-0
                rounded-lg
                border
                border-white/10
                px-3
                py-2
                text-sm
                font-semibold
                text-gray-200
                transition
                hover:bg-white/10
                hover:text-white
                sm:px-4
              "
            >
              <span className="hidden sm:inline">
                回到前台首頁 →
              </span>

              <span className="sm:hidden">
                前台 →
              </span>
            </Link>
          </div>
        </header>

        {/* =====================================================
            Admin Body
        ===================================================== */}
        <div className="mx-auto w-full max-w-7xl min-w-0">
          {/* ===================================================
              Mobile Navigation
          =================================================== */}
          <div className="w-full min-w-0 border-b border-white/10 bg-[#111827] lg:hidden">
            <div
              className="
                flex
                w-full
                min-w-0
                gap-2
                overflow-x-auto
                px-3
                py-3
                [scrollbar-width:none]
                [&::-webkit-scrollbar]:hidden
              "
            >
              {menuItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex
                      shrink-0
                      items-center
                      gap-1.5
                      whitespace-nowrap
                      rounded-lg
                      border
                      px-3
                      py-2
                      text-sm
                      font-semibold
                      transition
                      ${
                        active
                          ? "border-white bg-white text-black"
                          : "border-white/10 bg-[#1f2937] text-gray-200 hover:bg-[#374151] hover:text-white"
                      }
                    `}
                  >
                    <span className="shrink-0">
                      {item.icon}
                    </span>

                    <span>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ===================================================
              Desktop Layout
              Sidebar + Main Content
          =================================================== */}
          <div
            className="
              flex
              w-full
              min-w-0
              items-start
            "
          >
            {/* =================================================
                Desktop Sidebar
            ================================================= */}
            <aside
              className="
                hidden
                w-60
                shrink-0
                self-stretch
                bg-[#111827]
                lg:block
              "
            >
              <div className="sticky top-16">
                {/* Admin Title */}
                <div className="border-b border-gray-700 px-5 py-6">
                  <h2 className="text-2xl font-bold text-white">
                    Admin
                  </h2>

                  <p className="mt-1 text-sm text-gray-400">
                    Accessories 後台管理
                  </p>
                </div>

                {/* Desktop Menu */}
                <nav className="p-3">
                  {menuItems.map((item) => {
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`
                          mb-1
                          flex
                          min-h-11
                          items-center
                          gap-3
                          rounded-lg
                          px-4
                          py-3
                          text-sm
                          font-semibold
                          transition
                          ${
                            active
                              ? "bg-white text-gray-900"
                              : "text-gray-300 hover:bg-gray-800 hover:text-white"
                          }
                        `}
                      >
                        <span className="shrink-0 text-lg">
                          {item.icon}
                        </span>

                        <span className="min-w-0 truncate">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* =================================================
                Main Content
            ================================================= */}
            <main
              className="
                w-full
                min-w-0
                max-w-full
                flex-1
                overflow-x-hidden
                bg-[#0b1120]
                px-3
                py-5
                sm:px-6
                sm:py-6
                lg:px-8
                lg:py-8
              "
            >
              {children}
            </main>
          </div>
        </div>
      </div>
    </CouponProvider>
  );
}