import styles from "./PerfumeConcentrationGuide.module.css";

const CONCENTRATIONS = [
  { name: "Pure Parfum", range: "20–30%", wear: "Up to 12 hours", level: 30, shape: "M24 24h48v10c-12 0-12 18 0 18v48H24V52c12 0 12-18 0-18V24Z", cap: "M31 12h34v12H31z", leyros: true },
  { name: "Eau de Parfum", range: "15–20%", wear: "Rich & expressive", level: 20, shape: "M48 32c-24 0-35 18-31 38l8 25c3 10 43 10 46 0l8-25c4-20-7-38-31-38Z", cap: "M39 12h18l-2 20H41l-2-20Z", leyros: false },
  { name: "Eau de Toilette", range: "5–15%", wear: "Light & versatile", level: 12, shape: "M22 42q0-10 10-10h32q10 0 10 10v58H22V42Z", cap: "M34 14h28v12H34zM38 26h20v6H38z", leyros: false },
  { name: "Eau de Cologne", range: "2–4%", wear: "Fresh & airy", level: 4, shape: "M25 34h46v66H25z", cap: "M35 18h26v10H35zM39 28h18v6H39z", leyros: false },
];

export function PerfumeConcentrationGuide() {
  return (
    <section className={styles.guide} aria-labelledby="concentration-guide-title">
      <div className="page-shell">
        <h2 id="concentration-guide-title" className={styles.heading}>Perfume concentration guide</h2>
        <ul className={styles.grid}>
          {CONCENTRATIONS.map((item, index) => (
            <li key={item.name} className={`${styles.item} ${item.leyros ? styles.featured : ""}`}>
              <span className={styles.range}>{item.range}</span>
              <svg className={styles.bottle} viewBox="0 0 96 116" fill="none" aria-hidden="true">
                <defs><clipPath id={`concentration-bottle-${index}`}><path d={item.shape} /></clipPath></defs>
                <g clipPath={`url(#concentration-bottle-${index})`}>
                  <path d={`M10 ${100 - item.level * 1.3}q19-7 38 0t38 0v50H10Z`} fill="currentColor" />
                </g>
                <path d={item.shape} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d={item.cap} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              <h3>{item.name}</h3>
              <p className={styles.wear}>{item.wear}</p>
              {item.leyros && <span className={styles.brand}>Leyros · 30% concentration</span>}
            </li>
          ))}
        </ul>
        <p className={styles.note}>Typical fragrance-oil ranges; formulations vary by brand. Wear time depends on the composition, skin, weather, and application. <a href="https://perfumesociety.org/frequently-asked-questions/" target="_blank" rel="noopener noreferrer">About concentrations ↗</a></p>
      </div>
    </section>
  );
}
