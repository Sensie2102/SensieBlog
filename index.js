const express = require('express');
const {engine}  = require('express-handlebars');

const path = require('path');

const app = express();
const port = 3000;

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

// Serve static files
app.use(express.static(path.join(__dirname, 'static')));

// Define routes
app.use('/', require(path.join(__dirname, 'routes', 'blog.js')));

// Start the server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});


