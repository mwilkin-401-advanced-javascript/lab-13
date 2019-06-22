'use strict';

/**
* @module exports
* @param req - request
* @param res - response
* @desc error resource not found (404)
 */

module.exports = (req,res) => {
  let error = { error: 'Resource Not Found' };
  res.status(404).json(error);
};
