function PageTitle({ title, section }) {
  return (
    <section className="page-card">
      <span className="page-badge">{section}</span>
      <h1>{title}</h1>
    </section>
  )
}

export default PageTitle
