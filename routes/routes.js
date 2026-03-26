import express from 'express';
import { homeController } from '../controllers/homeController.js';

const routes = express.Router();

// Home route
routes.get('/', homeController);

// ✅ ADD THIS CONTACT ROUTE
routes.post('/contact', (req, res) => {
  console.log(req.body); // see data in terminal

  res.send("Message received successfully ✅");
});

export default routes;