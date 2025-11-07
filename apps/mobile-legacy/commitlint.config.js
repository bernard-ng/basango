module.exports = {
    extends: ["@commitlint/config-conventional"],
    rules: {
        "type-enum": [
            2,
            "always",
            [
                "feat", // New feature
                "fix", // Bug fix
                "docs", // Documentation only changes
                "style", // Changes that do not affect the meaning of the code (white-space, formatting, etc)
                "refactor", // Code changes that neither fixes a bug nor adds a feature
                "perf", // Performance improvements
                "test", // Adding missing tests or correcting existing tests
                "build", // Changes that affect the build system or external dependencies
                "ci", // Changes to CI configuration files and scripts
                "chore", // Other changes that don't modify src or test files
                "revert", // Reverts a previous commit
            ],
        ],
        "subject-case": [2, "never", ["sentence-case", "start-case", "pascal-case", "upper-case"]],
    },
};
