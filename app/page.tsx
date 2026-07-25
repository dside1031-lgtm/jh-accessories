export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <h1 className="text-2xl font-bold">
            JH Accessories
          </h1>

          <nav className="flex gap-6 text-sm">
            <a href="#">首頁</a>
            <a href="#">商品</a>
            <a href="#">最新商品</a>
            <a href="#">聯絡我們</a>
          </nav>

        </div>
      </header>


      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-24 text-center">

        <h2 className="text-5xl font-bold">
          品質生活，從細節開始
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          JH Accessories 精選生活用品，
          提供簡約、美觀且實用的生活配件。
        </p>

        <button className="mt-10 rounded-xl bg-black px-8 py-4 text-white">
          開始選購
        </button>

      </section>


      {/* Products */}
      <section className="mx-auto max-w-7xl px-6 py-16">

        <h3 className="mb-8 text-3xl font-bold">
          精選商品
        </h3>


        <div className="grid gap-8 md:grid-cols-4">

          {[1, 2, 3, 4].map((item) => (

            <div
              key={item}
              className="rounded-2xl border p-5"
            >

              <div className="h-48 rounded-xl bg-gray-200"></div>

              <h4 className="mt-4 font-semibold">
                生活用品 {item}
              </h4>

              <p className="mt-2 text-gray-500">
                NT$399
              </p>

            </div>

          ))}

        </div>

      </section>


      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-gray-500">
        © 2026 JH Accessories
      </footer>


    </main>
  );
}