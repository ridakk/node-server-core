'use strict';

const ON_DEATH = require('death');
const debug = require('debug')('node-server-core:graceful');

let DEBUG_DELAY;
let HEALTH_PROBE_DELAY;
let PROCESS_EXIT_DELAY;
let isShuttingDown = false;

function gracefulStop() {
  debug('Server is shutting down...');

  setTimeout(() => {
    // .unref is required to not to block event loop to wait until
    // this timer to expire if process is able to exit on its own.
    process.exit(1); // eslint-disable-line no-process-exit
  }, PROCESS_EXIT_DELAY).unref();

  // TODO: emit an event let other modules know that server is shutting downs

  // We can set process.exitCode and allow the process to exit
  // naturally once event loop is empty
  //
  // But we need to be sure that we are avoiding scheduling any
  // additional work for the event loop otherwise will
  // always be shutting down forcefully with timer above.
  //
  // Any existing timers, open connections to dbs etc...
  // must be closed in order to perform graceful shutdown
  // properly.
  process.exitCode = 1;
}

function onTerminated(signal) {
  if (isShuttingDown === true) {
    debug(`Got ${signal}, shutdown is already triggered...`);
    return;
  }

  isShuttingDown = true;
  // TODO: emit an event let other modules know that server is about to quit

  debug(`Got ${signal}, graceful shutdown start`);

  // Wait a little bit to give enough time for health to fail (we don't want more traffic)
  setTimeout(gracefulStop, HEALTH_PROBE_DELAY + DEBUG_DELAY);
}

module.exports = ({
  healthFailureTreshold = 2,
  healthPeriod = 15,
  processExitDebugDelay = 400,
  processExitDelay = 3000,
} = {}) => {
  debug('Attaching quit hook...');

  DEBUG_DELAY = processExitDebugDelay;
  HEALTH_PROBE_DELAY = healthFailureTreshold * healthPeriod * 1000;
  PROCESS_EXIT_DELAY = processExitDelay;
  ON_DEATH(onTerminated);
};
