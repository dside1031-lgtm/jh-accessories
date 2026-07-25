import { products } from "@/data/products";
export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b">
        <h1 className="text-2xl font-bold">
          JH Accessories
        </h1>

        <nav className="space-x-6 text-sm">
          <span>首頁</span>
          <span>商品</span>
          <span>關於我們</span>
          <span>聯絡</span>
        </nav>
      </header>

      {/* Banner */}
      <section className="px-8 py-20 text-center bg-gray-100">
        <h2 className="text-5xl font-bold mb-6">
          生活用品選物店
        </h2>

        <p className="text-lg text-gray-600 mb-8">
          精選實用、美觀、便利的生活好物
        </p>

        <button className="bg-black text-white px-8 py-3 rounded-lg">
          開始購物
        </button>
      </section>


      {/* Products */}
      <section className="px-8 py-16">

        <h2 className="text-3xl font-bold mb-10 text-center">
          熱門商品
        </h2>


        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          {products.map((product) => (

            <div
              key={product.id}
              className="border rounded-xl p-6 hover:shadow-lg transition"
            >

              <div className="mb-6">
               <img
               src={product.image}
               alt={product.name}
               className="w-full h-64 object-cover rounded-lg"
              />
          </div>


              <h3 className="font-bold text-lg">
                {product.name}
              </h3>


              <p className="mt-3 text-gray-600">
               NT$ {product.price}
             </p>


              <button className="mt-5 w-full border py-2 rounded-lg">
                查看商品
              </button>

            </div>

          ))}

        </div>

      </section>


      {/* Categories */}
      <section className="bg-gray-100 px-8 py-16">

        <h2 className="text-3xl font-bold text-center mb-10">
          商品分類
        </h2>


        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-center">

          <div className="bg-white p-6 rounded-xl">
            居家用品
          </div>

          <div className="bg-white p-6 rounded-xl">
            收納用品
          </div>

          <div className="bg-white p-6 rounded-xl">
            生活小物
          </div>

          <div className="bg-white p-6 rounded-xl">
            配件
          </div>

        </div>

      </section>


      {/* Footer */}
      <footer className="px-8 py-10 text-center border-t">

        <h3 className="font-bold text-xl">
          JH Accessories
        </h3>

        <p className="text-gray-500 mt-3">
          讓生活更簡單、更美好
        </p>

      </footer>

    </main>
  );
}