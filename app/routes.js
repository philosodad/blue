// app/routes.js
// Todo -
// Look into route separation: https://github.com/strongloop/express/blob/master/examples/route-separation/index.js
require( '../config/database' );
var Project = require( './models/project' );
var Board = require( './models/board' );
var mongoose = require( 'mongoose' );

module.exports = function(app, passport) {

    // Default Page - Redirects to login options if not authenticated
    app.get('/', isLoggedIn, function(req, res) {
        res.redirect('/projects');
    });

    // Authentication options page
    app.get('/auth', function(req, res) {
      res.render('auth.ejs')
    });

    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    // process the login form
    // app.post('/login', do all our passport stuff here);
    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // we will want this protected so you have to be logged in to visit
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

    // logout function
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // Projects View
    app.get('/projects', isLoggedIn, function(req, res) {
      Project.find( function(err, projects) {
        res.render('projects/index.ejs', {
          user : req.user,
          projects : projects
        });
      });
    });

    app.get('/projects/action/createProject', isLoggedIn, function(req, res) {
      res.render('projects/action/createProject.ejs', {
        user : req.user
      });
    });

    app.get('/projects/action/createBoard', isLoggedIn, function(req, res) {
      res.render('projects/action/createBoard.ejs', {
        user : req.user,
        projectName: req.query.projectName
      });
    });

    // process the project creation form
    app.post('/projects/action/createProject', isLoggedIn, function(req, res) {
      new Project({
        name         : req.body.name,
        description  : req.body.description,
        last_update  : Date.now(),
        owner        : req.user._id,
      }).save( function( err, project, count ){
        res.redirect( '/' );
      });
    });

    app.post('/projects/action/createBoard', isLoggedIn, function(req, res) {
      projectName = req.body.projectName;
      new Board({
        name         : req.body.name,
        last_update  : Date.now(),
        owner        : req.user._id,
      }).save( function( err, board, count ){
        console.log("Board " + board.name + " added with id " + board._id);
        Project.findOneAndUpdate(
          { "name": projectName },
          { $push: { "membership.boards": board._id }},
          function(err, project) {
            if (err) console.log(err);
          }
        )
        res.redirect( '/projects/' + projectName );
      });
    });

    // delete a project
    app.get('/projects/action/delete', isLoggedIn, function(req, res) {
      console.log("Deleting Project with ID '" + req.query.id + "'");
      Project.findById( req.query.id, function ( err, project ){
        project.remove( function ( err, project ){
          if( err ) return next( err );
          res.redirect( '/' );
        });
      });
    });

    app.get('/projects/:projectName', isLoggedIn, function(req, res) {
      projectName = req.params.projectName;
      console.log("Loading board " + projectName);
      var boards = [];
      Project.findOne({ name: projectName }, function(err, project) {
        if (typeof project.membership != 'undefined' && project.membership.boards[0] != 'undefined' && 0 < project.membership.boards.length) {
          project.membership.boards.forEach(function(element, index, array) {
            Board.findOne({ _id: element }, function(err, board) {
              console.log("Found board " + board);
              boards.push(board);
              console.log("Boards is now - " + boards);
              res.render('projects/project.ejs', {
                boards: [ board ],
                project: project
              });
            });
          });

          console.log("Boards: " + boards);
        };
      });
    });

};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/auth');
}

// Create project
exports.createProject = function ( req, res ){
  new Project({
    name         : req.body.name,
    description  : req.body.description,
    last_update  : Date.now(),
    owner        : user.name,
  }).save( function( err, project, count ){
    res.redirect( '/' );
  });
};
