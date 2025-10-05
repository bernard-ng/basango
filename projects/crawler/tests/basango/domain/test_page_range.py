import pytest

from basango.domain import PageRange


def test_it_should_create_page_range():
    pr = PageRange.create("1:10")
    assert pr.start == 1
    assert pr.end == 10


def test_end_page_should_be_greater_than_start_page():
    with pytest.raises(AssertionError):
        PageRange.create("10:1")


def test_non_negative_pages():
    with pytest.raises(AssertionError):
        PageRange.create("-1:-10")
