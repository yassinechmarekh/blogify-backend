const express = require("express");
const dbConnection = require("./config/dbConnection");
require("dotenv").config();

// Connection to db
dbConnection();

// Init app
const app = express();

//Middlewares
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoute'));
app.use('/api/users', require('./routes/userRoute'));
app.use('/api/posts', require('./routes/postRoute'));

// Running the server
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(
    `Server is running in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`
  );
  console.log(`http://localhost:${port}`);
});
