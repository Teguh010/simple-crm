module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "standard-with-typescript",
        "plugin:vue/vue3-essential",
        "plugin:vue/vue3-recommended", // Use Vue 3 recommended rules
        "@vue/typescript/recommended", // If using TypeScript
    ],
    "overrides": [
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script"
            }
        }
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module",
        "project": "./tsconfig.json",
        "extraFileExtensions": [".vue"]
    },
    "plugins": [
        "vue"
    ],
    "rules": {
        "@typescript-eslint/explicit-function-return-type": "off",
    }
}
