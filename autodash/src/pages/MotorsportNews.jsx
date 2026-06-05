// Route: /news — Motorsport nieuwsfeed (F1) via server BFF.
import MotorsportNewsSection from '../components/MotorsportNewsSection'
import PageMainContent from '../components/PageMainContent'
import SafeImg from '../components/SafeImg'
import { HOME_HERO_HEIGHT_CLASS } from '../constants/layout'
import { MAX_NEWS_ARTICLES } from '../services/motorsportNewsService'
import {
  borderSubtle,
  heroOverlay,
  pageShell,
  textOnPhoto,
} from '../utils/themeClasses'

const HERO_IMG = '/placeholders/ph2.jpg'
const HERO_FALLBACK = '/RaceKalender.jpg'

export default function MotorsportNews() {
  return (
    <section className={`flex min-h-0 flex-1 flex-col ${pageShell}`}>
      <div
        className={`relative w-full shrink-0 border-b ${HOME_HERO_HEIGHT_CLASS} ${borderSubtle}`}
      >
        <SafeImg
          src={HERO_IMG}
          fallbackSrc={HERO_FALLBACK}
          alt="Motorsport nieuws hero"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className={`absolute inset-0 ${heroOverlay}`} />
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="w-full px-6 py-7 md:px-10">
            <h1 className={`pl-12 text-3xl font-extrabold tracking-tight md:text-4xl ${textOnPhoto}`}>
              Motorsport Nieuws
            </h1>
            <p className={`mt-2 max-w-xl pl-12 text-sm font-medium md:text-base ${textOnPhoto}`}>
              Formule 1-headlines met thumbnail, samenvatting en publicatiedatum.
            </p>
          </div>
        </div>
      </div>

      <PageMainContent maxWidth="max-w-5xl">
        <MotorsportNewsSection limit={MAX_NEWS_ARTICLES} compact={false} />
      </PageMainContent>
    </section>
  )
}
