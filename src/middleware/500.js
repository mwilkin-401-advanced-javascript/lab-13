'use strict';

/**
* @module exports
* @param err - error
* @param req - request
* @param res - response
* @desc error first callback for a server error (500)
 */


module.exports = (err, req, res) => {
  console.log('__SERVER_ERROR__', err);
  let error = { error: err.message || err };
  res.status(500).json(error);
};
