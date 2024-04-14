const express = require('express');
const {engine}  = require('express-handlebars');


const path = require('path');

const app = express();
const port = 3000;

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
    // Define routes
const blogRoutes = require(path.join(__dirname, 'routes', 'blog.js'))
app.use('/', blogRoutes)







