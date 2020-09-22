const express = require('express');
const cors = require('cors');
const expressFileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const path = require('path');

// Initialize Express

const app = express();

// Middleware

app.use(expressFileUpload())
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('static'))

// Routes

app.get('/',(req,res) => {
    res.sendFile(path.join(__dirname,'dist','index.html'))
})

app.listen(process.env.PORT || 5000)