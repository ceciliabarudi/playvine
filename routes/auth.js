'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/user.js');
const checkLogin = require('../middleware/checkLogIn.js');
const checkFields = require('../middleware/checkFields.js');

const saltRounds = 10;

/* GET signup page. */
router.get('/signup', checkLogin.isLoggedIn, (req, res, next) => {
  const usernameData = req.flash('FormData');
  const data = {
    messages: req.flash('message'),
    title: 'Playvine - Sign Up',
    username: usernameData
  };
  res.render('signup', data);
});

/* POST signup */
router.post('/signup', checkLogin.isLoggedIn, checkFields.requireField, (req, res, next) => {
  const { username, password } = req.body;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hashedPassword = bcrypt.hashSync(password, salt);
  const newUser = {
    username,
    password: hashedPassword
  };

  // insert user to database

  User.create(newUser, (err, user) => {
    if (err) {
      if (err.code === 11000) {
        req.flash('message', `Username '${newUser.username}' has already been taken.`);
        req.flash('FormData', username);
      } else {
        throw err;
      }
      return res.redirect('/auth/signup');
    } else {
      req.flash('userCreated', 'Your are ready to go!');
      req.session.currentUser = newUser;
      return res.redirect('/sessions');
    }
  });
});

/* GET login page. */
router.get('/login', checkLogin.isLoggedIn, (req, res, next) => {
  const usernameData = req.flash('FormData');
  const data = {
    messages: req.flash('message'),
    title: 'Playvine - Log in',
    username: usernameData
  };
  res.render('login', data);
});

/* POST login */
router.post('/login', checkLogin.isLoggedIn, (req, res, next) => {
  const { username, password } = req.body;
  User.findOne({ username })
    .then((user) => {
      if (!user) {
        req.flash('message', `Username "${username}" doesn't exist`);
        return res.redirect('/auth/login');
      }
      if (bcrypt.compareSync(password /* provided password */, user.password/* hashed password */)) {
        req.session.currentUser = user;
        res.redirect('/sessions');
      } else {
        req.flash('message', 'Incorrect username or password. Try again.');
        req.flash('FormData', username);
        return res.redirect('/auth/login?username=' + encodeURIComponent(username));
      }
    })
    .catch(next);
});

/* POST logout */
router.post('/logout', (req, res, next) => {
  if (req.session.currentUser) {
    delete req.session.currentUser;
  }
  res.redirect('/');
});

module.exports = router;
