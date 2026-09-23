const marks = [
  "LEYROS",
  "HAUTE PARFUMERIE",
  "PARIS · KANNAUJ",
  "EXTRAIT DE PARFUM",
  "THE ATELIER",
  "LEYROS JOURNAL",
];

export function EditorialMarquee() {
  return (
    <section className="editorial-strip" aria-label="The world of Leyros">
      <span className="sr-only">Leyros haute parfumerie, Paris and Kannauj, extrait de parfum.</span>
      <div className="editorial-marquee" aria-hidden="true">
        {[0, 1].map((group) => (
          <div className="editorial-track" key={group}>
            {marks.map((mark, index) => (
              <span className={`editorial-mark mark-${index + 1}`} key={`${group}-${mark}`}>{mark}</span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
