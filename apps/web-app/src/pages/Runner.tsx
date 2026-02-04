import { Header } from "../layout/Header";
import { Main } from "../layout/Main";

export function Runner() {
  return (
    <div id="page-wrapper">
      <Header />
      <Main>
        <h2 className="text-xl font-bold mb-5">Runner</h2>
      </Main>
    </div>
  );
}
