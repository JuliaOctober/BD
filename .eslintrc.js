module.exports = {
    "env": {
        "browser": true,  // Указывает, что код будет выполняться в браузере
        "es2021": true    // Указывает на использование ES2021
    },
    "extends": "eslint:recommended", // Рекомендуемые настройки ESLint
    "parserOptions": {
        "ecmaVersion": 12, // Версия ECMAScript
        "sourceType": "module" // Если вы используете модули ES6
    },
    "rules": {
        "no-console": "off", // Отключаем правило для console
        "no-alert": "off"    // Отключаем правило для alert
    }
};
