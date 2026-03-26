import express from 'express';
import routes from './routes/routes.js';
import path from 'path';
const app = express();
const port = process.env.PORT || 8080




// setup for static files
app.use(express.static(path.join(process.cwd(), 'public')));

//ejs setup
app.set('view engine', 'ejs');
app.set('views','./views')
 
//create routes
app.use('/', routes)

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`)
}) 