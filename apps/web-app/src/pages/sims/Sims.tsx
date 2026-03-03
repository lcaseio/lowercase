import { SimsList } from "@/components/sims/SimList";
import { Header } from "@/layout/Header";
import { Main } from "@/layout/Main";

export function Sims() {
  return (
    <div id="page-wrapper">
      <Header />
      <Main>
        <h2 className="text-xl font-bold mb-5">Sims</h2>
        <SimsList />
      </Main>
    </div>
  );
}
