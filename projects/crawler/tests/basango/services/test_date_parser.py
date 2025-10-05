from datetime import datetime, timezone

import pytest

from basango.services.date_parser import DateParser


@pytest.mark.parametrize(
    "date_str, fmt, pattern, replacement, expected",
    [
        (
            "2004-02-12T15:19:21",
            "%Y-%m-%dT%H:%M:%S",
            None,
            None,
            1076599161,  # 2004-02-12 15:19:21 UTC
        ),
        (
            "08/10/2024 - 00:00",
            "%Y-%m-%d %H:%M",
            r"/(\d{2})\/(\d{2})\/(\d{4}) - (\d{2}:\d{2})/",
            r"$3-$2-$1 $4",
            1728345600,  # 2024-10-08 00:00:00 UTC
        ),
        (
            "mar 08/10/2024 - 00:00",
            "%Y-%m-%d %H:%M",
            r"/\w{3} (\d{2})\/(\d{2})\/(\d{4}) - (\d{2}:\d{2})/",
            r"$3-$2-$1 $4",
            1728345600,  # 2024-10-08 00:00:00 UTC
        ),
        (
            "Mardi 8 octobre 2024 - 00:00",
            "%Y-%m-%d %H:%M",
            r"/(\d{1}) (\d{1,2}) (\d{2}) (\d{4}) - (\d{2}:\d{2})/",
            r"$4-$3-$2 $5",
            1728345600,  # 2024-10-08 00:00:00 UTC
        ),
        (
            "8.10.2024 00:00",
            "%d.%m.%Y %H:%M",
            None,
            None,
            1728345600,  # 2024-10-08 00:00:00 UTC
        ),
    ],
)
def test_create_timestamp_with_valid_dates(
    date_str: str,
    fmt: str | None,
    pattern: str | None,
    replacement: str | None,
    expected: int,
) -> None:
    dr = DateParser()
    result = dr.create_timestamp(date_str, fmt, pattern, replacement)
    assert result == expected


def test_create_timestamp_with_invalid_date_falls_back_to_midnight_today() -> None:
    dr = DateParser()

    # Compute expected midnight (UTC) before invoking the parser to avoid edge cases.
    now = datetime.now(timezone.utc)
    expected_midnight = int(
        now.replace(hour=0, minute=0, second=0, microsecond=0).timestamp()
    )

    result = dr.create_timestamp("invalid date string", None, None, None)
    assert result == expected_midnight
