// Hero-sectie op Home; hoogte gekoppeld aan HOME_HERO_HEIGHT_PX (App sidebar).
import SafeImg from './SafeImg'
import { HOME_HERO_HEIGHT_CLASS } from '../constants/layout'
import { borderSubtle, heroOverlayHome, textOnPhoto } from '../utils/themeClasses'

const HERO_IMG =
  'https://images.unsplash.com/photo-1728116693268-125c5d6ad9e2?auto=format&fit=crop&w=1920&q=80'

export default function HomeHero() {
  return (
    <section
      className={`relative w-full shrink-0 border-b ${HOME_HERO_HEIGHT_CLASS} ${borderSubtle}`}
    >
      <div className="relative h-full w-full">
        <SafeImg
          src={HERO_IMG}
          alt="Formule 1-raceauto op het circuit — hero"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className={`absolute inset-0 ${heroOverlayHome}`} />
        <div className="absolute inset-x-0 top-24 bottom-0 z-10 flex flex-col justify-center lg:pl-[5rem]">
          <div className="mx-auto w-full max-w-6xl px-6 py-2 md:px-10">
            <div className="inline-block max-w-full">
              <h1 className={`text-3xl font-extrabold tracking-tight md:text-5xl lg:text-6xl ${textOnPhoto}`}>
                Welkom bij{' '}
                <span className="text-[#d50000] italic [text-shadow:0_4px_12px_rgba(0,0,0,0.88)]">
                  Auto
                </span>
                <span className="italic">Dash</span>
              </h1>
              <p className={`mt-2 max-w-xl text-base font-medium leading-relaxed md:text-xl ${textOnPhoto}`}>
                Jouw dashboard voor races, tijden en weer op het circuit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
