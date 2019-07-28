'use strict';

const death = require('death')({
  uncaughtException: true,
});

const state = { isShutdown: false };

death(() => {
  state.isShutdown = true;
});

module.exports = (app, {
  errorStatusCode = 503,
  errorBody = {
    message: 'shutting down',
  },
  successStatusCode = 200,
  successBody = {
    message: 'ok',
  },
} = {}) => {
  app.get('/health', (req, res) => {
    // SIGTERM already happened
    // app is not ready to server more requests
    if (state.isShutdown) {
      res.status(errorStatusCode).json(errorBody);
      return;
    }

    res.status(successStatusCode).json(successBody);
  });
};
