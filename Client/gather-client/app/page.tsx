import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page_home}>
      <div className={styles.page_btn_cont}>
        <Link className={styles.page_btn} href='/Chat'>Go to Chat</Link>
        <Link className={styles.page_btn} href='/Pipeline'>Go to Pipeline</Link>
        <Link className={styles.page_btn} href='/Roleplay'>Go to RP Page</Link>
      </div>
    </div>
  );
}
