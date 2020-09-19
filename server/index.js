import express from 'express';
import cors from 'cors';
import expressFileUpload from 'express-fileupload';
import bodyParser from 'body-parser';

// Initialize Express

const app = express();

// Middleware

app.use(expressFileUpload())
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('static'))

// Routes

app.get('/',(req,res) => {
    res.send(
        {
            "Value":"something"
        }
    )
})

app.listen(process.env.PORT || 5000)