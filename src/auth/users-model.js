'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const usedTokens = new Set();

const users = new mongoose.Schema({
  username: {type:String, required:true, unique:true},
  password: {type:String, required:true},
  email: {type: String},
  role: {type: String, default:'user', enum: ['admin','editor','user']},
});

users.pre('save', function(next) {
  bcrypt.hash(this.password, 10)
    .then(hashedPassword => {
      this.password = hashedPassword;
      next();
    })
    .catch(console.error);
});

users.statics.createFromOauth = function(email) {

  if(! email) { return Promise.reject('Validation Error'); }

  return this.findOne( {email} )
    .then(user => {
      if( !user ) { throw new Error('User Not Found'); }
      console.log('Welcome Back', user.username);
      return user;
    })
    .catch( error => {
      console.log('Creating new user');
      let username = email;
      let password = 'none';
      console.error(error);
      return this.create({username, password, email});
    });

};

users.statics.authenticateBasic = function(auth) {
  let query = {username:auth.username};
  return this.findOne(query)
    .then( user => user && user.comparePassword(auth.password) )
    .catch(error => {throw error;});
};

users.statics.authenticateKey = function(token) {
  const parsedKey = jwt.verify(token, process.env.SECRET);
  console.log('parsedKey:', parsedKey);
  let { id } = parsedKey;
  // Sends back user and key rather than only user
  return this.findById(id)
    .then(user => ({ user, key: parsedKey }))
    .catch(error => {
      throw error;
    });
};

users.statics.authenticateBearer = function(token) {
  if(usedTokens.has(token)){
    return Promise.reject('Invalid Token!');
  }
  let parsedToken = jwt.verify(token, process.env.SECRET);

  parsedToken.type !== 'key' && usedTokens.add(token);

  let query = {_id: parsedToken.id};
  return this.findOne(query);
};

users.methods.comparePassword = function(password) {
  return bcrypt.compare( password, this.password )
    .then( valid => valid ? this : null);
};

users.methods.generateToken = function(type) {
  let tokenDat = {
    id: this._id,
    capabilities: this.role,
    type: type || 'user',
  };
  let options = {};
  if(tokenDat.type === 'user'){
    options = {expiresIn: '15m'};
  }
  return jwt.sign(tokenDat, process.env.SECRET, options);
};

users.methods.generateKey = function() {
  return this.generateToken('key');
};

module.exports = mongoose.model('users', users);
