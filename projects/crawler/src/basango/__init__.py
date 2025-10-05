def main() -> None:
    # Lazy import to avoid importing CLI deps during package import
    from basango.cli import app

    app()


if __name__ == "__main__":  # pragma: no cover
    main()
