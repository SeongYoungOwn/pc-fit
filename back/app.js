//외부 라이브러리 import 영역
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var Sequelize=require("sequelize")

const sequelize = new Sequelize('board', 'root', '123456', {
  host: 'localhost',
  dialect: "mysql"
});
var initModel=require("./model.js")
initModel(sequelize)

var session=require("express-session")
var MysqlStore=require("express-mysql-session")(session)
const options = {
	host: 'localhost',
	port: 3306,
	user: 'root',
	password: '123456',
	database: 'board'
};
var sessionStore=new MysqlStore(options)
var indexRouter = require('./routes/index');
var app = express();
app.use(session({
  key:"board_session_id",
  secret:"test!@#%$$!",
  store:sessionStore
}))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use("/api/board",require("./routes/board"))
app.use("/api/user",require("./routes/user"))
app.use("/api/category",require("./routes/category"))

app.use(express.static(path.join(__dirname,"../front/dist")))
app.use("*",express.static(path.join(__dirname,"../front/dist/index.html")))

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
