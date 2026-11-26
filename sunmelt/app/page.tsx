import Header from "../layout/Header";
import ProductCarousel from "../component/ui/ProductCarousel";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center w-screen bg-background bg-black">
        <header className="w-full min-h-16">
            <Header />
        </header>
      <main className="w-full">
          <ProductCarousel />
      </main>
    </div>
  );
}
