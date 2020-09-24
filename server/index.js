const express = require('express');
const cors = require('cors');
const expressFileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const path = require('path');

// Initialize Express

const app = express();

// Middleware

app.use(expressFileUpload())
app.use(cors({  
    origin: function(origin, callback){
      return callback(null, true);  
    }
}));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('static'))

// Routes

app.get('/',(req,res) => {
    res.sendFile(path.join(__dirname,'dist','index.html'))
})


app.post('/upload',(req,res) => {


    var music = req.files.file;
    // var fileName = req.body.fileName;
    // Use the mv() method to place the file somewhere on your server

    
    const id = uuid.v4();


    music.mv('static/uploads/' + id + '.mp3' , function(err) {

        if(err){
            console.log(err);
        }
        else{
            res.header({"Access-Control-Allow-Origin": "*"}).send({type:'Uploaded',uuid:id})
        }
    });
})

app.listen(process.env.PORT || 5000)