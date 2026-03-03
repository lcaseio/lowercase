import { RunList } from "@/components/runs/RunList";
import { Header } from "@/layout/Header";
import { Main } from "@/layout/Main";

export function Runs() {
  return (
    <div id="page-wrapper">
      <Header />
      <Main>
        <h2 className="text-xl font-bold mb-5">Runs</h2>
        <RunList />
      </Main>
    </div>
  );
}
