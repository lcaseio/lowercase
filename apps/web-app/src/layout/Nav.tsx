import { ModeToggle } from "@/components/mode-toggle";
import { Link } from "react-router-dom";

export function Nav() {
  return (
    <nav className="flex items-center">
      <ul className="flex gap-2">
        <li>
          <Link to="/">dashboard</Link>
        </li>
        <li>
          <Link to="/runner">runner</Link>
        </li>
        <li>
          <Link to="/flows">flows</Link>
        </li>
        <li>
          <a href="/sims">sims</a>
        </li>
        <li>
          <a href="/runs">runs</a>
        </li>

        <li>
          <Link to="/system">system</Link>
        </li>
      </ul>
      <ModeToggle />
    </nav>
  );
}
