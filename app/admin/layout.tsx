"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
      icon: "??",
    },
    {
      href: "/admin/products",
      label: "?†å?ç®¡ç?",
      icon: "?“¦",
    },
    {
      href: "/admin/orders",
      label: "è¨‚å–®ç®¡ç?",
      icon: "??",
    },
    {
      href: "/admin/inventory",
      label: "åº«å?ç®¡ç?",
      icon: "??",
    },
    {
      href: "/admin/inventory/logs",
      label: "åº«å??°å?ç´€??,
      icon: "?”ï?",
    },
    {
      href: "/admin/inventory/stocktake",
      label: "åº«å??¤é?",
      icon: "??",
    },
    {
      href: "/admin/members",
      label: "?ƒå“¡ç®¡ç?",
      icon: "?‘¤",
    },
    {
      href: "/admin/coupons",
      label: "?ªæ???,
      icon: "??ï¸?,
    },
    {
      href: "/admin/reports",
      label: "?±è¡¨?†æ?",
      icon: "??",
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
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-gray-100">
      {/* =====================================================
          Header
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b bg-white">
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
                text-gray-900
                sm:text-2xl
              "
            >
              JH Accessories
            </div>

            <div className="truncate text-xs text-gray-500 sm:text-sm">
              ?»å?ç®¡ç?ç³»çµ±
            </div>
          </Link>

          {/* ?å???*/}

          <Link
            href="/"
            className="
              shrink-0
              rounded-lg
              border
              px-3
              py-2
              text-sm
              font-semibold
              text-blue-600
              transition
              hover:bg-blue-50
              sm:px-4
            "
          >
            <span className="hidden sm:inline">
              ?åˆ°?†å? ??
            </span>

            <span className="sm:hidden">
              ?†å? ??
            </span>
          </Link>
        </div>
      </header>

      {/* =====================================================
          Admin Body
      ===================================================== */}

      <div
        className="
          mx-auto
          w-full
          max-w-7xl
          min-w-0
        "
      >
        {/* ===================================================
            Mobile Navigation

            ???è?ä¿®æ­£ï¼?
            ?‹æ??¸å–®ä¸å?è·?main ?¾åœ¨?Œä???flex row
        =================================================== */}

        <div className="w-full min-w-0 border-b bg-white lg:hidden">
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
              const active =
                isActive(item.href);

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
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
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

            lg ä»¥ä?ï¼?
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
                  Accessories å¾Œå°ç®¡ç?
                </p>
              </div>

              {/* Desktop Menu */}

              <nav className="p-3">
                {menuItems.map((item) => {
                  const active =
                    isActive(item.href);

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

              ???‹æ?ï¼?
              å®Œæ•´ä½”æ»¿å¯¬åº¦

              ??æ¡Œæ?ï¼?
              Sidebar ?³å´?©é?ç©ºé?
          ================================================= */}

          <main
            className="
              w-full
              min-w-0
              max-w-full
              flex-1
              overflow-x-hidden
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
  );
}
