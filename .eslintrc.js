module.exports = {
    "env": {
        "es2021": true,
        "node": true
    },
    "extends": ["standard-with-typescript", "prettier-standard"],
    "overrides": [
        {
            files: ['*.ts', '*.tsx'], 
            parserOptions: {
                project: ['./tsconfig.json'],
            }
        }
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "rules": {
        "@typescript-eslint/explicit-function-return-type" : 0
    }
}
