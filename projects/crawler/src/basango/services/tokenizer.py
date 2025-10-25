"""
Tokenizer utilities for counting and encoding article text.

This module wraps the `tiktoken` encoder to provide simple helpers for:
- encoding/decoding text to token ids
- counting tokens for different parts of an Article

The `Tokenizer` can be constructed with either a specific `model` (preferred)
or an `encoding` name fallback.
"""

import logging

import tiktoken
from typing import Optional

from basango.domain.token_statistics import TokenStatistics


class Tokenizer:
    """Thin wrapper around tiktoken encoder for token operations."""

    def __init__(
        self, encoding: str = "cl100k_base", model: Optional[str] = None
    ) -> None:
        self.encoding = encoding
        # Prefer model-based encoding lookup if a model is provided.
        self.tokenizer = (
            tiktoken.encoding_for_model(model)
            if model
            else tiktoken.get_encoding(encoding)
        )

    def encode(self, text: str) -> list[int]:
        """Encode text into a list of token ids."""
        return self.tokenizer.encode(text)

    def decode(self, tokens: list[int]) -> str:
        """Decode a list of token ids back into a string."""
        return self.tokenizer.decode(tokens)

    def count_tokens(
        self, title: str, body: str, categories: list[str]
    ) -> TokenStatistics:
        """Return token counts for the provided Article.

        The excerpt count is computed on the first 200 characters of the body
        to give a quick estimate of a short preview's token length.
        """
        logging.info(f"[Tokenizer] tokenizing {title}...")
        return TokenStatistics(
            title=len(self.encode(title)),
            body=len(self.encode(body)),
            excerpt=len(self.encode(body[:200])),
            categories=len(self.encode(", ".join(categories))),
        )
