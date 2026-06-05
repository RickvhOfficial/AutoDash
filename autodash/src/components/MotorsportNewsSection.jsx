import { Link } from 'react-router-dom'
import ErrorMessage from './ErrorMessage'
import LoadingSpinner from './LoadingSpinner'
import NewsArticleCard from './NewsArticleCard'
import { useMotorsportNews } from '../hooks/useMotorsportNews'
import { MIN_NEWS_ARTICLES } from '../services/motorsportNewsService'
import {
  borderDefault,
  cardText,
  cardTextMuted,
  textFaint,
} from '../utils/themeClasses'

export default function MotorsportNewsSection({
  limit = MIN_NEWS_ARTICLES,
  compact = false,
  showViewAllLink = false,
  className = '',
}) {
  const { articles, loading, error, retry } = useMotorsportNews()
  const visible = articles.slice(0, limit)

  return (
    <section className={className} aria-labelledby="motorsport-news-heading">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mb-2 block h-0.5 w-14 rounded-full bg-red-500/70" />
          <h2 id="motorsport-news-heading" className={`text-xl font-bold md:text-2xl ${cardText}`}>
            Motorsport nieuws
          </h2>
          <p className={`mt-1 max-w-2xl text-sm ${cardTextMuted}`}>
            Het laatste Formule 1-nieuws — klik op een kop om het volledige artikel te lezen.
          </p>
        </div>
        {showViewAllLink && !loading && !error && articles.length > 0 && (
          <Link
            to="/news"
            className={`inline-flex shrink-0 items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition hover:border-red-500/60 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/45 dark:hover:text-red-300 ${borderDefault} ${cardText}`}
          >
            Alle nieuws
          </Link>
        )}
      </div>

      {loading && <LoadingSpinner message="Motorsport nieuws laden..." />}

      {!loading && error && (
        <ErrorMessage message={error} onRetry={retry} />
      )}

      {!loading && !error && visible.length > 0 && (
        <ul
          className={
            compact ? 'grid gap-4 md:grid-cols-2' : 'grid gap-5 lg:grid-cols-2'
          }
        >
          {visible.map((article) => (
            <li key={article.id}>
              <NewsArticleCard article={article} compact={compact} />
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && visible.length === 0 && (
        <p className={`text-center text-sm ${textFaint}`}>Geen nieuwsartikelen gevonden.</p>
      )}
    </section>
  )
}
