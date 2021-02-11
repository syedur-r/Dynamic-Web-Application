var express = require('express'); // includes all the modules for express to be able to use it in variables and functions
var bodyParser= require('body-parser'); // includes the body-parser module to use in the express application to read GET/POST requests

var MongoClient = require('mongodb').MongoClient; // includes the mongodb module to use in express for mongodb database connection
var url = "mongodb://localhost/mybookshopdb"; // retrieves the url for a database connection

const app = express() // creates a new instance of express
const port = 8000 // the port number which will used to connect the app to the local host

// body parser
app.use(bodyParser.urlencoded({ extended: true })) // this code returns middleware and is able to accept any unicode encoding of the body

// create mongodb connection
MongoClient.connect(url, function(err, db) {
	if (err) throw err; // if an error occurs, the application will throw an error
	console.log("Database created!"); // the console will display "Database created!" as soon as the web app is running
	db.close(); // exits the database client
});

// new code added to your Express web server 
require('./routes/main')(app); // includes the main.js route to load all the express routes
app.set('views',__dirname + '/views'); // this is the directory where all the html and ejs files are stored
app.set('view engine', 'ejs'); // express internally loads the ejs module
app.engine('html', require('ejs').renderFile); // allows html files to render ejs files

////////////////////////////////////////////////////////////////////////////

app.listen(port, () => console.log(`Example app listening on port ${port}!`)) // runs the application on node using the port number 8000
