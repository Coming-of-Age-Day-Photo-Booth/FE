import Link from "next/link";
import { ROUTES } from "../lib/routes";

export default function Nav() {
  return (
    <nav>
      <Link href={ROUTES.home}>Home </Link>
      <Link href={ROUTES.kim}> Kim </Link>
      <Link href={ROUTES.park}> Park </Link>
      <Link href={ROUTES.choo}> Choo </Link>
      <Link href={ROUTES.lim}> Lim </Link>
    </nav>
  );
}