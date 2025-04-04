const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const blogRoutes = require(path.join(__dirname, 'routes', 'blog.js'));
app.use('/', blogRoutes);

const authRoutes = require(path.join(__dirname, 'routes', 'auth.js'));
app.use('/auth', authRoutes);

app.use((req, res, next) => {
  res.status(404).send("Not Found");
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Internal server error");
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});







