import express from 'express';
import routes from './routes/routes.js';
import path from 'path';

const app = express();

// Allow JSON body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static files
app.use(express.static(path.join(process.cwd(), 'public')));

// ejs setup
app.set('view engine', 'ejs');
app.set('views', './views');

app.use('/', routes);

export default app;
