from unittest.mock import Mock, patch

import pytest
from pydantic import HttpUrl

from basango.core.config.fetch_config import CrawlerConfig, ClientConfig
from basango.core.config.source_config import (
    WordPressSourceConfig,
    HtmlSourceConfig,
    SourceSelectors,
)
from basango.domain import SourceKind, PageRange
from basango.services.crawler.wordpress_crawler import WordpressCrawler


class TestWordPressCrawler:
    """Test suite for WordPressCrawler."""

    @pytest.fixture
    def mock_client_config(self):
        return ClientConfig()

    @pytest.fixture
    def mock_wordpress_source_config(self):
        return WordPressSourceConfig(
            source_id="test_wordpress_source",
            source_url=HttpUrl("https://example.com/"),
            supports_categories=True,
            categories=["tech", "news"],
        )

    @pytest.fixture
    def mock_crawler_config(self, mock_wordpress_source_config):
        return CrawlerConfig(source=mock_wordpress_source_config, category="tech")

    @pytest.fixture
    def wordpress_crawler(self, mock_crawler_config, mock_client_config):
        return WordpressCrawler(mock_crawler_config, mock_client_config)

    @pytest.fixture
    def mock_response_with_headers(self):
        response = Mock()
        response.headers = {
            WordpressCrawler.TOTAL_PAGES_HEADER: "5",
            WordpressCrawler.TOTAL_POSTS_HEADER: "47",
        }
        return response

    def test_with_valid_wordpress_source(self, wordpress_crawler):
        """Test __init__ with valid WordPress source config."""
        assert wordpress_crawler.source.source_kind == SourceKind.WORDPRESS
        assert isinstance(wordpress_crawler.source, WordPressSourceConfig)

    def test_with_invalid_source_kind_raises_error(self, mock_client_config):
        """Test __init__ raises ValueError when source kind is not WORDPRESS."""
        html_source = HtmlSourceConfig(
            source_id="test_html",
            source_url=HttpUrl("https://example.com"),
            pagination_template="news",
            source_selectors=SourceSelectors(),
        )
        config = CrawlerConfig(source=html_source)

        with pytest.raises(
            ValueError, match="WordpressCrawler requires a source of kind WORDPRESS"
        ):
            WordpressCrawler(config, mock_client_config)

    def test_with_no_source_raises_error(self, mock_client_config):
        """Test __init__ raises ValueError when source is None."""
        config = CrawlerConfig(source=None)

        with pytest.raises(
            ValueError, match="WordpressCrawler requires a source of kind WORDPRESS"
        ):
            WordpressCrawler(config, mock_client_config)

    def test_get_pagination_returns_valid_page_range(
        self, wordpress_crawler, mock_response_with_headers
    ):
        """Test get_pagination returns correct PageRange from WordPress API headers."""
        with patch.object(
            wordpress_crawler.client, "get", return_value=mock_response_with_headers
        ):
            result = wordpress_crawler.get_pagination()

            assert isinstance(result, PageRange)
            assert result.start == 1
            assert result.end == 5
            assert str(result) == "1:5"

    def test_get_pagination_with_default_headers(self, wordpress_crawler):
        """Test get_pagination with default headers when WordPress headers are missing."""
        mock_response = Mock()
        mock_response.headers = {}  # No WordPress headers

        with patch.object(wordpress_crawler.client, "get", return_value=mock_response):
            result = wordpress_crawler.get_pagination()

            assert isinstance(result, PageRange)
            assert result.start == 1
            assert result.end == 1  # Default when no headers

    def test_get_pagination_makes_correct_api_call(self, wordpress_crawler):
        """Test get_pagination makes the correct WordPress API call."""
        mock_response = Mock()
        mock_response.headers = {
            WordpressCrawler.TOTAL_PAGES_HEADER: "3",
            WordpressCrawler.TOTAL_POSTS_HEADER: "25",
        }

        with patch.object(
            wordpress_crawler.client, "get", return_value=mock_response
        ) as mock_get:
            wordpress_crawler.get_pagination()

            expected_url = f"{wordpress_crawler.source.source_url}wp-json/wp/v2/posts?_fields=id&per_page=100"
            mock_get.assert_called_once_with(expected_url)

    def test_fetch_categories_populates_category_map(self, wordpress_crawler):
        """Test _fetch_categories populates the category_map correctly."""
        mock_categories_response = Mock()
        mock_categories_response.json.return_value = [
            {"id": 1, "slug": "technology", "count": 15},
            {"id": 2, "slug": "business", "count": 10},
            {"id": 3, "slug": "sports", "count": 8},
        ]

        with patch.object(
            wordpress_crawler.client, "get", return_value=mock_categories_response
        ):
            wordpress_crawler._fetch_categories()

            assert len(wordpress_crawler.category_map) == 3
            assert wordpress_crawler.category_map[1] == "technology"
            assert wordpress_crawler.category_map[2] == "business"
            assert wordpress_crawler.category_map[3] == "sports"

    def test_fetch_categories_makes_correct_api_call(self, wordpress_crawler):
        """Test _fetch_categories makes the correct WordPress API call."""
        mock_response = Mock()
        mock_response.json.return_value = []

        with patch.object(
            wordpress_crawler.client, "get", return_value=mock_response
        ) as mock_get:
            wordpress_crawler._fetch_categories()

            expected_url = f"{wordpress_crawler.source.source_url}wp-json/wp/v2/categories?{WordpressCrawler.CATEGORY_QUERY}"
            mock_get.assert_called_once_with(expected_url)

    def test_map_categories_with_populated_category_map(self, wordpress_crawler):
        """Test _map_categories returns correct comma-separated string."""

        # Pre-populate category map
        wordpress_crawler.category_map = {
            1: "technology",
            2: "business",
            3: "sports",
            4: "lifestyle",
        }

        result = wordpress_crawler._map_categories([2, 1, 4])

        # Should be sorted by category ID
        assert result == "technology,business,lifestyle"

    def test_map_categories_with_empty_category_map_fetches_categories(
        self, wordpress_crawler
    ):
        """Test _map_categories fetches categories when category_map is empty."""
        mock_categories_response = Mock()
        mock_categories_response.json.return_value = [
            {"id": 1, "slug": "tech", "count": 15},
            {"id": 2, "slug": "news", "count": 10},
        ]

        wordpress_crawler.category_map = {}
        with patch.object(
            wordpress_crawler.client, "get", return_value=mock_categories_response
        ):
            result = wordpress_crawler._map_categories([1, 2])

            assert result == "tech,news"
            assert len(wordpress_crawler.category_map) == 2

    def test_map_categories_filters_unknown_category_ids(self, wordpress_crawler):
        """Test _map_categories filters out unknown category IDs."""
        wordpress_crawler.category_map = {1: "technology", 2: "business"}

        result = wordpress_crawler._map_categories([1, 99, 2, 100])

        # Should only include known categories
        assert result == "technology,business"

    def test_map_categories_with_empty_category_list(self, wordpress_crawler):
        """Test _map_categories returns empty string for empty category list."""
        wordpress_crawler.category_map = {1: "tech", 2: "news"}

        result = wordpress_crawler._map_categories([])

        assert result == ""

    def test_map_categories_sorts_by_category_id(self, wordpress_crawler):
        """Test _map_categories sorts categories by ID."""
        wordpress_crawler.category_map = {3: "charlie", 1: "alpha", 2: "beta"}

        result = wordpress_crawler._map_categories([3, 1, 2])

        # Should be sorted by ID: 1, 2, 3
        assert result == "alpha,beta,charlie"

    def test_supports_wordpress_source_kind(self, wordpress_crawler):
        """Test supports method returns True for WordPress source kind."""
        assert wordpress_crawler.supports(SourceKind.WORDPRESS) is True
        assert wordpress_crawler.supports(SourceKind.HTML) is False

    @pytest.mark.parametrize(
        "pages,posts,expected_start,expected_end",
        [
            ("1", "10", 1, 1),
            ("5", "47", 1, 5),
            ("10", "100", 1, 10),
        ],
    )
    def test_get_pagination_with_various_header_values(
        self, wordpress_crawler, pages, posts, expected_start, expected_end
    ):
        """Test get_pagination with various header values."""
        mock_response = Mock()
        mock_response.headers = {
            WordpressCrawler.TOTAL_PAGES_HEADER: pages,
            WordpressCrawler.TOTAL_POSTS_HEADER: posts,
        }

        with patch.object(wordpress_crawler.client, "get", return_value=mock_response):
            result = wordpress_crawler.get_pagination()

            assert result.start == expected_start
            assert result.end == expected_end
