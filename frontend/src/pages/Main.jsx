import { useState } from 'react'
import { LANDING_TEXT } from '../mock/landing'
import Navbar from '../components/landing/Navbar'
import Hero from '../components/landing/Hero'
import Problem from '../components/landing/Problem'
import Features from '../components/landing/Features'
import Roles from '../components/landing/Roles'
import HowItWorks from '../components/landing/HowItWorks'
import Pricing from '../components/landing/Pricing'
import Trust from '../components/landing/Trust'
import FAQ from '../components/landing/FAQ'
import FinalCTA from '../components/landing/FinalCTA'
import Footer from '../components/landing/Footer'

export default function Main() {
  const [lang, setLang] = useState('id')
  const t = LANDING_TEXT[lang]

  return (
    <div className="font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[#1F2937] bg-[#F3F6FA] min-h-screen">
      <Navbar t={t} lang={lang} setLang={setLang} />
      <Hero t={t} />
      <Problem t={t} />
      <Features t={t} />
      <Roles t={t} />
      <HowItWorks t={t} />
      <Pricing t={t} />
      <Trust t={t} />
      <FAQ t={t} />
      <FinalCTA t={t} />
      <Footer t={t} />
    </div>
  )
}
