import SafeImg from './SafeImg'
import {
  cardText,
  cardTextMuted,
  cardTextSoft,
  newsCard,
  textFaint,
} from '../utils/themeClasses'
import { formatNewsDate } from '../services/motorsportNewsService'

const NEWS_IMAGE_FALLBACK = '/placeholders/ph3.jpg'

export default function NewsArticleCard({ article, compact = false }) {
  const dateLabel = formatNewsDate(article.publishedAt)

  return (
    <article
      className={`${newsCard} group flex h-full flex-col overflow-hidden sm:flex-row ${
        compact ? 'sm:gap-4' : 'sm:gap-5'
      }`}
    >
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative shrink-0 overflow-hidden ${compact ? 'sm:w-36' : 'sm:w-44 md:w-52'}`}
        aria-label={`${article.title} — artikel openen`}
      >
        <div
          className={`aspect-[16/10] w-full sm:aspect-auto sm:h-full ${
            compact ? 'sm:min-h-[7.5rem]' : 'sm:min-h-[9.5rem]'
          }`}
        >
          <SafeImg
            src={article.image}
            fallbackSrc={NEWS_IMAGE_FALLBACK}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            fallback={
              <div className="flex h-full min-h-[8rem] w-full items-center justify-center bg-slate-200 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400 sm:min-h-full">
                Geen afbeelding
              </div>
            }
          />
        </div>
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition group-hover:opacity-100" />
      </a>

      <div className={`flex min-w-0 flex-1 flex-col ${compact ? 'p-4' : 'p-4 sm:p-5'}`}>
        <time className={`text-xs font-medium uppercase tracking-wide ${textFaint}`} dateTime={article.publishedAt || undefined}>
          {dateLabel}
        </time>
        <h3 className={`mt-2 text-base font-semibold leading-snug md:text-lg ${cardText}`}>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 dark:hover:text-red-400"
          >
            {article.title}
          </a>
        </h3>
        {article.description ? (
          <p className={`mt-2 line-clamp-3 text-sm leading-relaxed ${cardTextSoft}`}>
            {article.description}
          </p>
        ) : (
          <p className={`mt-2 text-sm italic ${cardTextMuted}`}>Geen beschrijving beschikbaar.</p>
        )}
        <p className={`mt-auto pt-3 text-xs ${cardTextMuted}`}>
          Bron: extern nieuwsartikel
        </p>
      </div>
    </article>
  )
}
