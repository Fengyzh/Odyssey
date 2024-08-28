import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div>
      <h1>Hello</h1>
      <Link href='/Chat'>Go to Chat</Link>
      <Link href='/Pipeline'>Go to Pipeline</Link>
      <Link href='/Roleplay'>Go to RP Page</Link>
      <Link href='/Test'>Go to Test Page</Link>

    </div>
  );
}
