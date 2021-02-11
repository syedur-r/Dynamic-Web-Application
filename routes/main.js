module.exports = function(app) {      
	// Home Page
	app.get('/',function(req, es) {
		res.render('index.html') // renders the home page
	});
	
	// About Page
	app.get('/about',function(req, es) {         
		res.render('about.html'); // renders the about page
	});     

	// User Login Page
	app.get('/login', function(req, res){
		res.render('login.html'); // renders the login page with the login form
	});

	// Register Page
	app.get('/register', function(req, res) {
		res.render('register.html'); // renders the register page with the registration form        
	});

	// Delete Form Page
	app.get('/deleteuser', function(req, res) {
		res.render('delete.html'); // renders the delete user page with the username form
	});

	// Addbook Page         
	app.get('/addbook',function(req, res) {                 
		res.render("addbook.html"); // renders the addbook page with all its form data
	});

	// Search Page
	app.get('/search',function(req, res) {           
		res.render("search.html"); // renders the search page with the form and buttons
	});

	// helper function that escapes any special character entered, to prevent virtual server from crashing                                
	var removeSpecialChar = function(regex) {                                 
		// escapes any special character by replacing it with a back slash and the exact special character                            
		return regex.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');                                                  
	}
	        
	//Search Result Page
	app.get('/search-result', function(req, res) {       
		var MongoClient = require('mongodb').MongoClient; // includes the mongodb module
		var url = 'mongodb://localhost'; // retrieves the mongodb url to create a connection

		MongoClient.connect(url, function (err, client) { // creates a mongodb connection
			if(err) throw err; // if occurs, the application will throw an error
			var searchRecord = req.query.keyword; // stores the search query inside a variable
			var db = client.db('mybookshopdb'); // retrieves the database collection which stores all the book records
			var specialRecord = removeSpecialChar(searchRecord); // calls the helper function above with the 
									    // search query as a parameter
			
			// execute mongodb search and retrive the search results from the database (as an object)
			db.collection('books').find({ name: new RegExp(specialRecord, 'si') }).toArray((findErr, result) => {
				if (findErr) throw findErr; // if occurs, the application will throw an error       
				else
					var searchCount = [result.length]; // stores the number of results
					// depending on the number of results, the text will either display "result" or "results"
					var strresult = searchCount == 1 ? "result" : "results";
					// otherwise an ejs file will be rendered, displaying the search results
					res.render('search-result.ejs', {searchedBooks: result, searchRecord, searchCount, strresult});
				client.close(); // exits the mybookshopdb database
			});
		});
 
	});

	// Masking the password
	var maskPassword = function(password) { // helper function to mask the password
		var mask = password.slice(0, 1) + "•".repeat(password.length - 1); // masks all the letters of the password
										  // except the first letter, just to be sure
		return password.replace(password, mask); // returns the password as a masked password
	}

	// Register Result Page
	app.post('/registered', function (req,res) {
		// saving data in database                         
		var MongoClient = require('mongodb').MongoClient; // includes the mongodb module to use its features
		var url = 'mongodb://localhost'; // retrieves the mongodb url to create a connection
		const bcrypt = require('bcrypt'); // includes the bcrypt module to use its callback functions
		const saltRounds = 10; // stores the number of salts that will be added to the password
		const plainPassword = req.body.password; // stores the password input by the user
		var maskedPassword = maskPassword(req.body.password); // masks the inputted password using the helper function

		// hash the password and storing it in the database
		bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
			if (err) throw err; // if an error occurs, the application will throw an error
			// Store hashed password in your database.                                                                            
			MongoClient.connect(url, function(err, client) { // connects to the mongodb database                        
				if (err) throw err; // if an error occurs, the application will throw an error
				var db = client.db('myfirstdatabase'); // connects to the myfirstdatabase client
				
				// inserts all the inputted data into one record of the accounts collection in the myfirstdatabase client
				db.collection('accounts').insertOne({                         
					firstname: req.body.firstname, // inserts the first name of the user
					lastname: req.body.lastname, // inserts the last name of the user
					username: req.body.username, // inserts the user name of the user
					email: req.body.email, // inserts the email of the user
					password: hashedPassword // inserts the hashed password of the user
				});                         
				client.close(); // exits the myfirstdatabase database           
                                                                           
				// sends a response in the form of a paragraph text, displaying the username, masked password,
				// and hashed password of a registered user
				res.send('<p style="font-family:sans-serif;font-size:35px;">Hello <strong>'+ req.body.username + '</strong>' +
				', you have successfully been registered as a user!</p>'+ 
				'<p style="font-family:sans-serif;font-size:35px;">The password registered to your account is: <strong>' + 
				maskedPassword + '</strong>. Your hashed password is <strong>' + hashedPassword + '</strong>.</p>' + '<br/>' +
				'<a style="font-family:sans-serif;font-size:15px;" href='+ './login'+'>Login</a>' + '<br/><br/>' + 
				'<a style="font-family:sans-serif;font-size:15px;" href=' + './'+'>Home</a>');
			}); // end of mongodb connection function
		}); // end of bcrypt function         
	});

	// User Login Result Page{
	app.post('/loggedin', function(req,res) {
		var MongoClient = require('mongodb').MongoClient; // includes the mongodb module to use its features
		var url = 'mongodb://localhost'; // retrieves the mongodb url to create a connection

		// creates a mongodb connection
		MongoClient.connect(url, function (err, client) {                         
			if(err) throw err; // if an error occurs, the application will throw an error                                          
			var db = client.db('myfirstdatabase'); // connects to the myfirstdatabase database
			var findUser = req.body.userName; // stores the username input inside a variable
			var user = removeSpecialChar(findUser); // uses the helper function to escape any special characters in the username
			
			// execute mongodb search 
			db.collection('accounts').find({username: user}).toArray((findErr, result) => { // retrieves the record of
														   // the users data based on
														  // the username query
				if (findErr) throw findErr; // if an error occurs, the application will throw an error
				// if the result is empty or undefined, an ejs file will be rendered displaying an error message 
				else if (result == null || result.length <= 0) res.render('failedlogin.ejs');
			
				// retrieves the hashed password from the database by looping through the result object
				result.forEach(function(getUserData) {
					const bcrypt = require('bcrypt'); // includes the brcypt module to use its callback functions
					const plainPassword = req.body.password; // gets the password inputted by the user
					const hashedPassword = getUserData.password; // gets the hashed password from the forEach loop
					
					// load hashed password from password database
					bcrypt.compare(plainPassword, hashedPassword, function(err, result) {     
						if (err) throw err; // if an error occurs, the application will throw an error
						var userData = { // creates an object to store the user's data
							firstname: getUserData.firstname, // stores the user's first name
							lastname: getUserData.lastname, // stores the user's last name
							username: getUserData.username // stores the user's user name
						};

						// checks if the username and passwords match
						if (result == true && user == getUserData.username) res.render('welcomeuser.ejs', userData);
						// if all else fails, an ejs file will be rendered displaying an error message
						else res.render('failedlogin.ejs');
					});
				});                                                         
				client.close(); // exits the myfirstdatabase database
			});                 
		});
	});

	// User Data
	app.get('/listusers', function(req, res) {
		var MongoClient = require('mongodb').MongoClient; // includes the mongodb module to use its features                 
		var url = 'mongodb://localhost'; // retrieves the mongodb url to create a connection

		// creates a mongodb connection
		MongoClient.connect(url, function(err, client) {
			if (err) throw err; // if an error occurs, the application will throw an error
			var db = client.db('myfirstdatabase'); // connects to the myfirstdatabase database
			db.collection('accounts').find().toArray((findErr, results) => { // retrieves all the records of the users
											 // stored in the accounts collection
				if (findErr) throw findErr; // if an error occurs, the application will throw an error
				else
					res.render('listusers.ejs', {users:results}); // otherwise an ejs file will be rendered,
										     // displaying the list of all registered users
				client.close(); // exits the myfirstdatabase database
			});
		});
	});
	
	// Delete User Data
	app.post('/deleted', function(req, res) {
		var MongoClient = require('mongodb').MongoClient; // includes the mongodb module to use its features
		var url = 'mongodb://localhost'; // retrieves the mongodb url to create a connection 

		// creates a mongodb connection
		MongoClient.connect(url, function(err, client) {                         
			if (err) throw err; // if an error occurs, the application will throw an error
			var findUser = req.body.userName; // stores the input username into a variable                                   
			var db = client.db('myfirstdatabase'); // connects to the myfirstdatabase database
			var user = removeSpecialChar(findUser); // escapes any special characters in the username                             
		
			// retrieves the username from the database to see if it exists	
			db.collection('accounts').find({username: user}).toArray((findErr, result) => {	
				if (findErr) throw findErr; // if an error occurs, the application will throw an error
				// if the username is undefined or is empty, an ejs file will be rendered displaying an error message
				else if (result == null || result.length <= 0) res.render('faileddelete.ejs');
			
				// loops through the user's records to see if the username matches the input username
				result.forEach(function(getUserName) {
					// checks if the database username matches the input username
					if (user == getUserName.username) {
						// deletes this users record from the database
						db.collection('accounts').deleteOne({username: new RegExp(user)});
						// an ejs file will be rendered to confirm that the user's record has been deleted
						res.render('deleteusers.ejs', {userName:user});
					} else res.render('faileddelete.ejs'); // if all else fails, an ejs file will be rendered
									      // displaying an error message
				});
				client.close(); // exits the myfirstdatabase database
			});	
		});
	});

	// Books Data
	app.get('/list', function(req, res) {       
		var MongoClient = require('mongodb').MongoClient; // includes the mongodb module to use its features
		var url = 'mongodb://localhost'; // retrieves the mongodb url to create a connection
		
		// creates a mongodb connection
		MongoClient.connect(url, function(err, client) {
			if (err) throw err; // if an error occurs, the application will throw an error
			var db = client.db('mybookshopdb'); // connects to the mybookshopdb database
			db.collection('books').find().toArray((findErr, results) => { // retrieves all the records 
										     // stored in the books collection     
				if (findErr) throw findErr; // if an error occurs, the application will throw an error
				else   
					res.render('list.ejs', {availablebooks:results}); // otherwise an ejs file will be rendered,
											 // displaying all the books data 
				client.close(); // exits the mybookshopdb database
			}); 
		}); 
	});
	
	// Book Added Page
	app.post('/bookadded', function(req,res) {        
		// saving data in database        
		var MongoClient = require('mongodb').MongoClient; // includes the mongodb module to use its features
		var url = 'mongodb://localhost'; // retrieves the mongodb url to create a connection
	
		// creates a mongodb connection
		MongoClient.connect(url, function(err, client) {
			if (err) throw err; // if an error occurs, the application will throw an error
			var db = client.db ('mybookshopdb'); // connects to the mybookshopdb database
			// inserts one new record into the books database collection
			db.collection('books').insertOne({
				name: req.body.name, // stores the name of the book
				price: req.body.price // stores the price of the book
			});

			var bookData = { // stores all the book data inside an object to be passed through the ejs file
				name: req.body.name, // stores the name of the book
				price: req.body.price // stores the price of the book
			};			

			res.render('bookadded.ejs', bookData); // renders the ejs file once the record has been inserted
			client.close(); // exits the mybookshopdb database
		});
	});
}