const { defineConfig } = require('cypress');

module.exports = defineConfig({
  video: false,
  screenshotOnRunFailure: true,
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:4173',
    env: {
      apiUrl: process.env.CYPRESS_API_URL || 'http://localhost:3002'
    },
    specPattern: 'cypress/e2e/**/*.cy.js'
  }
});

