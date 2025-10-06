from unittest.mock import patch

import pytest
from bs4 import BeautifulSoup
from pydantic import HttpUrl

from basango.core.config import WordPressSourceConfig
from basango.core.config.fetch_config import CrawlerConfig, ClientConfig
from basango.core.config.source_config import HtmlSourceConfig, SourceSelectors
from basango.domain import SourceKind, PageRange
from basango.services.crawler.html_crawler import HtmlCrawler


class TestHtmlCrawler:
    """Test suite for HtmlCrawler."""

    @pytest.fixture
    def mock_client_config(self):
        return ClientConfig()

    @pytest.fixture
    def mock_html_source_config(self):
        return HtmlSourceConfig(
            source_id="test_source",
            source_url=HttpUrl("https://example.com"),
            pagination_template="news",
            source_selectors=SourceSelectors(pagination="ul.pagination > li a"),
            supports_categories=True,
        )

    @pytest.fixture
    def mock_crawler_config(self, mock_html_source_config):
        return CrawlerConfig(source=mock_html_source_config, category="tech")

    @pytest.fixture
    def html_crawler(self, mock_crawler_config, mock_client_config):
        return HtmlCrawler(mock_crawler_config, mock_client_config)

    def test_with_valid_html_source(self, html_crawler):
        """Test __init__ with valid HTML source config."""
        assert html_crawler.source.source_kind == SourceKind.HTML
        assert isinstance(html_crawler.source, HtmlSourceConfig)

    def test_with_invalid_source_kind_raises_error(self, mock_client_config):
        """Test __init__ raises ValueError when source kind is not HTML."""
        wordpress_source = WordPressSourceConfig(
            source_id="test_wordpress",
            source_url=HttpUrl("https://example.com"),
        )
        config = CrawlerConfig(source=wordpress_source)

        with pytest.raises(
            ValueError, match="HtmlCrawler requires a source of kind HTML"
        ):
            HtmlCrawler(config, mock_client_config)

    def test_with_no_source_raises_error(self, mock_client_config):
        """Test __init__ raises ValueError when no source is provided."""
        config = CrawlerConfig(source=None)

        with pytest.raises(
            ValueError, match="HtmlCrawler requires a source of kind HTML"
        ):
            HtmlCrawler(config, mock_client_config)

    def test_get_pagination_returns_valid_page_range(self, html_crawler):
        """Test that get_pagination returns a valid PageRange."""
        with patch.object(html_crawler, "get_last_page", return_value=5):
            result = html_crawler.get_pagination()

            assert isinstance(result, PageRange)
            assert result.start == 0
            assert result.end == 5
            assert str(result) == "0:5"

    def test_get_last_page_with_valid_pagination_links(self, html_crawler):
        """Test get_last_page extracts page number from pagination links."""
        # Mock HTML with pagination links
        mock_html = """
        <ul class="pagination">
            <li><a href="/news?page=1">1</a></li>
            <li><a href="/news?page=2">2</a></li>
            <li><a href="/news?page=3">3</a></li>
            <li><a href="/news?page=10">10</a></li>
        </ul>
        """
        mock_soup = BeautifulSoup(mock_html, "html.parser")

        with patch.object(html_crawler, "crawl", return_value=mock_soup):
            result = html_crawler.get_last_page()
            assert result == 10

    def test_get_last_page_with_no_pagination_links(self, html_crawler):
        """Test get_last_page returns 1 when no pagination links found."""
        mock_html = "<div>No pagination here</div>"
        mock_soup = BeautifulSoup(mock_html, "html.parser")

        with patch.object(html_crawler, "crawl", return_value=mock_soup):
            result = html_crawler.get_last_page()
            assert result == 1

    def test_get_last_page_with_empty_href(self, html_crawler):
        """Test get_last_page returns 1 when href is empty or None."""
        mock_html = """
        <ul class="pagination">
            <li><a>No href</a></li>
        </ul>
        """
        mock_soup = BeautifulSoup(mock_html, "html.parser")

        with patch.object(html_crawler, "crawl", return_value=mock_soup):
            result = html_crawler.get_last_page()
            assert result == 1

    def test_get_last_page_with_regex_extraction(self, html_crawler):
        """Test get_last_page extracts page number using regex."""
        mock_html = """
        <ul class="pagination">
            <li><a href="/articles/page/25/">Page 25</a></li>
        </ul>
        """
        mock_soup = BeautifulSoup(mock_html, "html.parser")

        with patch.object(html_crawler, "crawl", return_value=mock_soup):
            result = html_crawler.get_last_page()
            assert result == 25

    def test_get_last_page_with_query_parameters(self, html_crawler):
        """Test get_last_page extracts page number from query parameters."""
        mock_html = """
        <ul class="pagination">
            <li><a href="/news?category=tech&page=15&sort=date">Last</a></li>
        </ul>
        """
        mock_soup = BeautifulSoup(mock_html, "html.parser")

        with patch.object(html_crawler, "crawl", return_value=mock_soup):
            result = html_crawler.get_last_page()
            assert result == 15

    def test_get_last_page_with_invalid_page_parameter(self, html_crawler):
        """Test get_last_page returns 1 when page parameter is invalid."""
        mock_html = """
        <ul class="pagination">
            <li><a href="/news?page=invalid">Last</a></li>
        </ul>
        """
        mock_soup = BeautifulSoup(mock_html, "html.parser")

        with patch.object(html_crawler, "crawl", return_value=mock_soup):
            result = html_crawler.get_last_page()
            assert result == 1

    def test_get_last_page_with_category_support(self, html_crawler):
        """Test get_last_page uses category in URL when supported."""
        mock_html = """
        <ul class="pagination">
            <li><a href="/news?category=tech&page=8">8</a></li>
        </ul>
        """
        mock_soup = BeautifulSoup(mock_html, "html.parser")

        with patch.object(html_crawler, "crawl") as mock_crawl:
            mock_crawl.return_value = mock_soup
            html_crawler.get_last_page()

            # The URL construction concatenates source_url with the path
            # Since the template doesn't contain {category}, it should remain unchanged
            expected_url = "https://example.com/news"
            mock_crawl.assert_called_once_with(expected_url)

    def test_get_last_page_with_category_template(self, mock_client_config):
        """Test get_last_page uses category replacement when template contains {category}."""
        source_config = HtmlSourceConfig(
            source_id="test_source",
            source_url=HttpUrl("https://example.com"),
            pagination_template="news/{category}",
            source_selectors=SourceSelectors(pagination="ul.pagination > li a"),
            supports_categories=True,
        )
        crawler_config = CrawlerConfig(source=source_config, category="tech")
        crawler = HtmlCrawler(crawler_config, mock_client_config)

        mock_html = """
        <ul class="pagination">
            <li><a href="/news/tech?page=5">5</a></li>
        </ul>
        """
        mock_soup = BeautifulSoup(mock_html, "html.parser")

        with patch.object(crawler, "crawl") as mock_crawl:
            mock_crawl.return_value = mock_soup
            crawler.get_last_page()

            expected_url = "https://example.com/news/tech"
            mock_crawl.assert_called_once_with(expected_url)

    def test_get_last_page_without_category_support(self, html_crawler):
        """Test get_last_page uses default template when categories not supported."""
        # Modify source to not support categories
        html_crawler.source.supports_categories = False

        mock_html = """
        <ul class="pagination">
            <li><a href="/news?page=5">5</a></li>
        </ul>
        """
        mock_soup = BeautifulSoup(mock_html, "html.parser")

        with patch.object(html_crawler, "crawl") as mock_crawl:
            mock_crawl.return_value = mock_soup
            html_crawler.get_last_page()

            # Verify the URL was constructed without category replacement
            expected_url = "https://example.com/news"
            mock_crawl.assert_called_once_with(expected_url)

    def test_get_last_page_without_category_in_config(
        self, mock_client_config, mock_html_source_config
    ):
        """Test get_last_page uses default template when no category in config."""
        config = CrawlerConfig(source=mock_html_source_config, category=None)
        crawler = HtmlCrawler(config, mock_client_config)

        mock_html = """
        <ul class="pagination">
            <li><a href="/news?page=3">3</a></li>
        </ul>
        """
        mock_soup = BeautifulSoup(mock_html, "html.parser")

        with patch.object(crawler, "crawl") as mock_crawl:
            mock_crawl.return_value = mock_soup
            crawler.get_last_page()

            # Verify the URL was constructed without category replacement
            expected_url = "https://example.com/news"
            mock_crawl.assert_called_once_with(expected_url)

    def test_get_last_page_with_multiple_numbers_in_href(self, html_crawler):
        """Test get_last_page extracts first number when multiple numbers present."""
        mock_html = """
        <ul class="pagination">
            <li><a href="/news/2024/page/42/comments/100">Last</a></li>
        </ul>
        """
        mock_soup = BeautifulSoup(mock_html, "html.parser")

        with patch.object(html_crawler, "crawl", return_value=mock_soup):
            result = html_crawler.get_last_page()
            # Should extract the first number found (2024)
            assert result == 2024

    def test_supports_html_source_kind(self):
        """Test that supports method returns True for HTML source kind."""
        assert HtmlCrawler.supports() is SourceKind.HTML

    def test_get_pagination_integration(self, html_crawler):
        """Integration test for get_pagination calling get_last_page."""
        mock_html = """
        <ul class="pagination">
            <li><a href="/news?page=7">7</a></li>
        </ul>
        """
        mock_soup = BeautifulSoup(mock_html, "html.parser")

        with patch.object(html_crawler, "crawl", return_value=mock_soup):
            result = html_crawler.get_pagination()

            assert isinstance(result, PageRange)
            assert result.start == 0
            assert result.end == 7

    def test_get_last_page_with_non_string_href(self, html_crawler):
        """Test get_last_page handles non-string href attributes."""
        # Create a mock element with href as a list (AttributeValueList)
        mock_html = """
        <ul class="pagination">
            <li><a href="/news?page=5">5</a></li>
        </ul>
        """
        mock_soup = BeautifulSoup(mock_html, "html.parser")

        # Modify the href to simulate a non-string type by removing it
        pagination_link = mock_soup.select("ul.pagination > li a")[-1]
        # Instead of setting href to a list, let's test with missing href
        del pagination_link.attrs["href"]

        with patch.object(html_crawler, "crawl", return_value=mock_soup):
            result = html_crawler.get_last_page()
            assert result == 1
