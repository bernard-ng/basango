from datetime import datetime, timezone

import pytest

from basango.domain import DateRange


def ts(y: int, m: int, d: int, hh: int = 0, mm: int = 0, ss: int = 0) -> int:
    return int(datetime(y, m, d, hh, mm, ss, tzinfo=timezone.utc).timestamp())


def test_from_parses_two_dates_with_default_format() -> None:
    dr = DateRange.create("2024-10-01:2024-10-08")
    assert dr.start == ts(2024, 10, 1)
    assert dr.end == ts(2024, 10, 8)


def test_str_and_format_roundtrip() -> None:
    dr = DateRange.create("2024-10-01:2024-10-02")
    assert str(dr) == f"{ts(2024, 10, 1)}:{ts(2024, 10, 2)}"
    assert dr.format("%Y-%m-%d") == "2024-10-01:2024-10-02"


def test_in_range_out_range_inclusive_boundaries() -> None:
    dr = DateRange.create("2024-10-01:2024-10-02")
    start = ts(2024, 10, 1)
    end = ts(2024, 10, 2)
    before = start - 1
    after = end + 1
    midday_end = ts(2024, 10, 2, 12, 0, 0)

    assert dr.in_range(start) is True
    assert dr.in_range(end) is True
    assert dr.out_range(before) is True
    # End is at 00:00 of end day; times later that day are outside
    assert dr.out_range(midday_end) is True
    assert dr.out_range(after) is True


def test_backward_uses_days_and_next_day_end() -> None:
    base = datetime(2024, 10, 31, tzinfo=timezone.utc)
    dr = DateRange.backward(date=base, days=10)
    assert dr.start == ts(2024, 10, 21)
    assert dr.end == ts(2024, 11, 1)


def test_from_raises_on_invalid_separator_or_spec() -> None:
    with pytest.raises(AssertionError):
        DateRange.create("2024-10-01:2024-10-08", separator="")
    with pytest.raises(AssertionError):
        DateRange.create("2024-10-01", separator=":")


def test_from_accepts_python_format_string() -> None:
    dr = DateRange.create("2024/10/01|2024/10/02", fmt="%Y/%m/%d", separator="|")
    assert dr.start == ts(2024, 10, 1)
    assert dr.end == ts(2024, 10, 2)
