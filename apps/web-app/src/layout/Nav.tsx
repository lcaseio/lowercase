import { Link } from "react-router-dom";

export function Nav() {
  return (
    <nav>
      <ul>
        <li>
          <a href="/">dashboard</a>
        </li>
        <li>
          <Link to="/runner">runner</Link>
        </li>
        <li>
          <a href="/flows">flows</a>
        </li>
        <li>
          <a href="/sims">sims</a>
        </li>
        <li>
          <a href="/runs">runs</a>
        </li>

        <li>
          <a href="/system">system</a>
        </li>
      </ul>
    </nav>
  );
}
