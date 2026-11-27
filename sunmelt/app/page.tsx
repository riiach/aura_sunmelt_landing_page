import Header from "../layout/Header";
import ProductHero from "../component/ui/ProductHero";

export default function Home() {
  return (
    <ProductHero header={
        <header className="w-full flow-root">
            <Header />
        </header>
    } />
  );
}
