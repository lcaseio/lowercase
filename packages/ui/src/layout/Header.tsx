import { RuntimeControls } from "../components/RuntimeControls.js";
import { Nav } from "./Nav.js";

export function Header(props: { title: string }) {
  return (
    <header>
      <h2>{props.title}</h2>
      <Nav />
      <RuntimeControls />
    </header>
  );
}
