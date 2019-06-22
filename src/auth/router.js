'use strict';

const express = require('express');
const authRouter = express.Router();

const User = require('./users-model.js');
const auth = require('./middleware.js');
const oauth = require('./oauth/google.js');

authRouter.get('/', (req, res) => {
  res.status(200).send('Server up...');
});

/**
 * Sign up a user
 * @route POST / signup
 * @param req - request
 * @param res - response
 * @param next - next middleware
 * @returns {Object} request token
 * @returns {Error} error
 */

authRouter.post('/signup', (req, res, next) => {
  let user = new User(req.body);
  user.save()
    .then( (user) => {
      req.token = user.generateToken();
      req.user = user;
      res.set('token', req.token);
      res.cookie('auth', req.token);
      res.send(req.token);
    }).catch(next);
});

/**
 * Create a key
 * @route POST / key
 * @param auth - authorization protected route
 * @param req - request
 * @param res - response
 * @param next - next middleware
 * @returns {Object} 200 - key
 *
 */

authRouter.post('/key', auth, (req, res, next) => {
  let key = req.user.generateKey();
  res.status(200).send(key);
  next();
});

/**
 * Get a token for the user
 * @route GET / signin
 * @param auth - authorization protected route
 * @param req - request
 * @param res - response
 * @returns {Object} req.token
 *
 */

authRouter.get('/signin', auth, (req, res) => {
  res.cookie('auth', req.token);
  res.send(req.token);
});

/**
 * Get oauth from google
 * @route GET / oauth
 * @param req - request
 * @param res - response
 * @param next - next middleware
 * @returns {Object} 200 - token
 *
 */

authRouter.get('/oauth', (req,res,next) => {
  oauth.authorize(req)
    .then( token => {
      res.status(200).send(token);
    })
    .catch(next);
});


module.exports = authRouter;
