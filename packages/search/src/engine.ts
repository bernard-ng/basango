import type { SearchRequest, SearchResult } from "./contracts";

export type {
  SearchFacet,
  SearchFilters,
  SearchHighlight,
  SearchHit,
  SearchRequest,
  SearchResult,
  SearchSentiment,
} from "./contracts";
export {
  SEARCH_FACETS,
  searchFacetSchema,
  searchFiltersSchema,
  searchHighlightSchema,
  searchHitSchema,
  searchRequestSchema,
  searchResultSchema,
  searchSentimentSchema,
} from "./contracts";

export type SearchEngine = {
  search(request: SearchRequest): Promise<SearchResult>;
};
