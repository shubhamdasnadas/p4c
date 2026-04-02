"use client";

import React, { useState, useCallback } from "react";
import ComponentCard from "@/components/common/ComponentCard";

// Available keywords to select from
const AVAILABLE_TAGS = [
  "ICICI Securities",
  "Motilal Oswal Group",
  "Groww",
  "India Infoline Finance",
  "Banking",
  "Geojit",
];

const WILDCARD_TAG = "*";

interface NewsArticle {
  title: string;
  summary: string;
  body: string;
  source: string;
  published_at: number | null;
  url: string;
  image_url: string;
  matches: any[];
}

interface ApiResponse {
  total: number;
  todayCount: number;
  articles: NewsArticle[];
  keywordsUsed: string[];
}

export default function NewsTagSelector() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wildcardActive, setWildcardActive] = useState<boolean>(false);

  const activeDisplayTags = wildcardActive ? AVAILABLE_TAGS : selectedTags;
  const getEffectiveTags = (tags: string[]) => {
    if (tags.includes(WILDCARD_TAG)) {
      return AVAILABLE_TAGS;
    }

    return tags;
  };

  const fetchDefaultNews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/opoint-news");

      if (!response.ok) {
        throw new Error("Failed to fetch news");
      }

      const data: ApiResponse = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch news in real-time when tags change
  const fetchNews = useCallback(async (tags: string[]) => {
    const effectiveTags = getEffectiveTags(tags);

    if (effectiveTags.length === 0) {
      setArticles([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const queryString = effectiveTags.join(",");
      const response = await fetch(
        `/api/opoint-news?keywords=${encodeURIComponent(queryString)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch news");
      }

      const data: ApiResponse = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);


  // Handle tag selection
  const toggleTag = (tag: string) => {
    if (tag === WILDCARD_TAG) {
      const newWildcard = !wildcardActive;
      setWildcardActive(newWildcard);

      if (newWildcard) {
        fetchDefaultNews();
      } else {
        if (selectedTags.length > 0) {
          fetchNews(selectedTags);
        } else {
          setArticles([]);
        }
      }
    } else {
      const newTags = selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag];
      setSelectedTags(newTags);

      if (wildcardActive) {
        fetchDefaultNews();
      } else {
        fetchNews(newTags);
      }
    }
  };
  // Clear all tags
  const clearAllTags = () => {
    setSelectedTags([]);
    setWildcardActive(false);

    setArticles([]);
  };

  return (
    <ComponentCard title="News by Interest Tags">
      <div className="space-y-6">
        {/* Tag Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select your interests (* matches all tags):
          </label>

          <div className="flex flex-wrap gap-2">
            {[WILDCARD_TAG, ...AVAILABLE_TAGS].map((tag) => {
              const isActive =
                tag === WILDCARD_TAG
                  ? wildcardActive
                  : wildcardActive || selectedTags.includes(tag);

              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive
                    ? "bg-blue-600 text-white shadow-lg scale-105"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {(selectedTags.length > 0 || wildcardActive) && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Selected: {activeDisplayTags.length} tag{activeDisplayTags.length !== 1 ? "s" : ""}
              </span>
              <button onClick={clearAllTags} className="text-sm px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200">
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Selected Tags Display */}
        {(selectedTags.length > 0 || wildcardActive) && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Active filters:</span>{" "}
              {wildcardActive
                ? selectedTags.length > 0
                  ? `${selectedTags.join(" AND ")} + * (all tags)`
                  : "* (all tags)"
                : selectedTags.join(" AND ")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {activeDisplayTags.map((tag) => (
                <span
                  key={`active-${tag}`}
                  className="px-2 py-1 text-xs rounded-full bg-white/90 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-blue-200 dark:border-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Fetching news...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">
              Error: {error}
            </p>
          </div>
        )}

        {/* Articles Display */}
        {(selectedTags.length > 0 || wildcardActive) && !loading && articles.length > 0 && (<div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {articles.length} Article{articles.length !== 1 ? "s" : ""} Found
          </h3>

          <div className="space-y-4">
            {articles.map((article, idx) => (
              <article
                key={idx}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                {article.image_url && (
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}

                {/* Title */}
                <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {article.title}
                </h4>

                {/* 🔥 Combined Description */}
                {(article.summary || article.body) && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-4">
                    {`${article.summary || ""} ${article.body || ""}`.slice(0, 400)}...
                  </p>
                )}

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                  <span className="font-medium">{article.source}</span>
                  {article.published_at && (
                    <span>
                      {new Date(article.published_at).toLocaleDateString(
                        "en-IN",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  )}
                </div>

                {/* Read More Link */}
                {article.url && (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Read Full Article →
                  </a>
                )}
              </article>
            ))}
          </div>
        </div>
        )}

        {/* Empty State */}
        {(selectedTags.length > 0 || wildcardActive) && !loading && articles.length === 0 && !error && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No articles found for {wildcardActive ? "* (all tags)" : selectedTags.join(" AND ")}
            </p>
          </div>
        )}

        {/* Initial State */}
        {selectedTags.length === 0 && !wildcardActive && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>👆 Select one or more tags, or * for all tags</p>
          </div>
        )}
      </div>
    </ComponentCard>
  );
}
