import type { PerfumeProduct } from "@leyros/types";
import { getProductFaqs } from "@/lib/product-faqs";
import styles from "./ProductFaqs.module.css";

export function ProductFaqs({ product }: { product: PerfumeProduct }) {
  const faqs = getProductFaqs(product);
  if (!faqs.length) return null;
  return (
    <section className={styles.section} aria-labelledby="product-faqs-title">
      <div className="page-shell">
        <h2 id="product-faqs-title" className={styles.title}>FAQs</h2>
        <div className={styles.list}>
          {faqs.map((faq, index) => (
            <details key={faq.question} name={`product-faq-${product.id}`} className={styles.item}>
              <summary><span className={styles.number}>{String(index + 1).padStart(2, "0")}</span><span>{faq.question}</span><span className={styles.toggle} aria-hidden="true" /></summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
