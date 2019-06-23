'use strict';

const User = require('./users-model.js');

/**
* @module exports
* @param req - request
* @param res - response
* @param next - next middleware
* @desc it checks the case, it the token is a key, depending on case will either be authbasic or auth bearer
 */

module.exports = (req, res, next) => {

  try {
    let [authType, authString] = req.headers.authorization.split(/\s+/);

    if (req.url === '/key') {
      if (authType.toLowerCase() === 'bearer') {
        return _authKey(authString);
      }
      return _authError();
    }

    switch( authType.toLowerCase() ) {
    case 'basic':
      return _authBasic(authString);
    case 'bearer':
      return _authBearer(authString);
    default:
      return _authError();
    }
  }
  catch(e) {
    next(e);
  }

  /**
  * @function _authBasic
  * @param str - string
  * @dec encoding user information with base64
  */

  function _authBasic(str) {
    // str: am9objpqb2hubnk=
    let base64Buffer = Buffer.from(str, 'base64'); // <Buffer 01 02 ...>
    let bufferString = base64Buffer.toString(); // john:mysecret
    let [username, password] = bufferString.split(':'); // john='john'; mysecret='mysecret']
    let auth = {username,password}; // { username:'john', password:'mysecret' }

    return User.authenticateBasic(auth)
      .then(user => _authenticate(user) )
      .catch(next);
  }

  /**
    * @function _authBearer
    * @param authString - authorized string
    * @dec returns an authenticated user with Bearer authorization
    */

  function _authBearer(authString){
    return User.authenticateBearer(authString)
      .then(user => _authenticate(user))
      .catch(next);
  }

  /**
   * @function _authenticate
   * @param user - user
   * @dec generates a token if the user is authorized otherwise throws an error
   */

  function _authenticate(user) {
    if(user) {
      req.user = user;
      req.token = user.generateToken();
      next();
    }
    else {
      _authError();
    }
  }

  /**
   * @function _authKey
   * @param key - key
   * @dec returns an authenticated key which can be used for user signin multiple times
   */

  function _authKey(key) {
    return User.authenticateKey(key)
      .then(result => {
        const { user } = result;
        const { key } = result;
        if (user) {
          req.user = user;
          req.token = user.refreshKey(key);
          next();
        } else {
          _authError();
        }
      })
      .catch(next);
  }

  /**
   * @function _authError
   * @param none
   * @dec returns a 401, unauthorize error
   */

  function _authError() {
    next({status: 401, statusMessage: 'Unathorized', message: 'This is not the page you are looking for'});
  }

};
