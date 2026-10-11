export default function Home() {
  return (
    <main id="main-content" className="container" tabIndex={-1}>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">A little space for a good book</p>
          <h1 id="hero-title">Your books.<br />Your reading <em>journey.</em></h1>
          <p className="hero-description">For the stories you want to find, the pages you’re lost in, and the books that stay with you.</p>
          <a className="button" href="#about">Meet Folio <span aria-hidden="true">↓</span></a>
          <p className="hero-footnote">A personal library, one book at a time.</p>
        </div>
        <div className="book-art" aria-hidden="true">
          <span className="art-caption">THE READING LIFE</span>
          <div className="book book-back"><span>A world<br />between<br />the covers.</span><i>FOLIO EDITIONS</i></div>
          <div className="book book-front"><small>A PLACE TO BEGIN</small><span>One<br />more<br /><em>chapter.</em></span><div className="book-emblem">f.</div><i>YOUR NEXT GREAT STORY</i></div>
          <span className="art-bottom">Find your next chapter.</span>
        </div>
      </section>
      <section id="about" className="about" aria-labelledby="about-title">
        <div className="section-heading">
          <p className="eyebrow">Thoughtfully simple</p>
          <h2 id="about-title">A reading life, all your own.</h2>
          <p>Folio is taking shape as a quiet place to discover books and keep your reading memories together.</p>
        </div>
        <div className="feature-grid">
          <article><span className="feature-number">01 / DISCOVER</span><h3>Follow your curiosity.</h3><p>Find books by title or author, with details from Open Library.</p></article>
          <article><span className="feature-number">02 / COLLECT</span><h3>Make room on your shelf.</h3><p>Keep the books you want to read, are reading, and have finished in one personal library.</p></article>
          <article><span className="feature-number">03 / REMEMBER</span><h3>Keep what stays with you.</h3><p>Record a rating and your own notes, ready to revisit after the last page.</p></article>
        </div>
        <aside className="development-note" aria-label="Development status"><span className="status-dot" aria-hidden="true" /><p><strong>The first chapter is underway.</strong> This is Folio’s starter preview. Book search, accounts, and personal libraries will arrive in upcoming development milestones.</p></aside>
      </section>
    </main>
  );
}
