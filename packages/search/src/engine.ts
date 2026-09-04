import type { SearchRequest, SearchResult } from "./contracts";

export type {
  SearchFacet,
  SearchFilters,
  SearchHighlight,
  SearchHit,
  SearchRequest,
  SearchResult,
  SearchScope,
  SearchSentiment,
  SearchSort,
} from "./contracts";
export {
  SEARCH_FACETS,
  searchFacetSchema,
  searchFiltersSchema,
  searchHighlightSchema,
  searchHitSchema,
  searchRequestSchema,
  searchResultSchema,
  searchScopeSchema,
  searchSentimentSchema,
  searchSortSchema,
} from "./contracts";

export type SearchEngine = {
  search(request: SearchRequest): Promise<SearchResult>;
};
