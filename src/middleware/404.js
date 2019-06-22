'use strict';

module.exports = (req,res) => {
  let error = { error: 'Resource Not Found' };
  res.status(404).json(error);
};
