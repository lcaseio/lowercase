import { ModeToggle } from "@/components/mode-toggle";
import { Link } from "react-router-dom";

export function Nav() {
  return (
    <nav className="flex items-center">
      <ul className="flex gap-2 ">
        <li className="hover:text-cyan-700 hover:dark:text-cyan-500">
          <Link to="/">dashboard</Link>
        </li>
        <li className="hover:text-cyan-700 hover:dark:text-cyan-500">
          <Link to="/runner">runner</Link>
        </li>
        <li className="hover:text-cyan-700 hover:dark:text-cyan-500">
          <Link to="/flows">flows</Link>
        </li>
        <li className="hover:text-cyan-700 hover:dark:text-cyan-500">
          <Link to="/sims">sims</Link>
        </li>
        <li className="hover:text-cyan-700 hover:dark:text-cyan-500">
          <Link to="/runs">runs</Link>
        </li>
        <li className="hover:text-cyan-700 hover:dark:text-cyan-500">
          <Link to="/artifacts">artifacts</Link>
        </li>
        <li className="hover:text-cyan-700 hover:dark:text-cyan-500">
          <Link to="/evals">evals</Link>
        </li>
        <li className="hover:text-cyan-700 hover:dark:text-cyan-500">
          <Link to="/system">system</Link>
        </li>
      </ul>
      <ModeToggle />
    </nav>
  );
}
