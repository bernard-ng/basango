const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const prettierPlugin = require("eslint-plugin-prettier");
const unusedImportsPlugin = require("eslint-plugin-unused-imports");

module.exports = defineConfig([
    expoConfig,
    {
        plugins: {
            prettier: prettierPlugin,
            "unused-imports": unusedImportsPlugin,
        },
        rules: {
            "import/default": "off",
            "react/prop-types": "off",
            "react/react-in-jsx-scope": "off",
            "import/named": "off",
            "import/namespace": "error",
            "import/export": "error",
            "no-unused-vars": "off",
            "unused-imports/no-unused-imports": "error",
            "unused-imports/no-unused-vars": [
                "warn",
                {
                    vars: "all",
                    varsIgnorePattern: "^_",
                    args: "after-used",
                    argsIgnorePattern: "^_",
                },
            ],
            "import/order": [
                "error",
                {
                    groups: ["builtin", "external", "internal"],
                    pathGroups: [
                        {
                            pattern: "react",
                            group: "external",
                            position: "before",
                        },
                    ],
                    pathGroupsExcludedImportTypes: ["react"],
                    "newlines-between": "always",
                    alphabetize: {
                        order: "asc",
                        caseInsensitive: true,
                    },
                },
            ],
            "prettier/prettier": "error",
        },
    },
    {
        ignores: ["dist/*"],
    },
]);
