export default function Footer({ t }) {
  return (
    <footer className="max-w-[1200px] mx-auto px-6 pt-8 pb-12 flex flex-wrap justify-between gap-4 text-sm text-[#5F6368]">
      <span>
        <strong className="text-[#1F2937]">BIMS</strong> — Bimbel Multi Tenant SaaS
      </span>
      <span>{t.footer}</span>
    </footer>
  )
}
