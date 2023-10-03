const express = require('express');
const mongoose = require('mongoose');
const { errors } = require('celebrate');

const app = express();
const { PORT = 3000 } = process.env;

const routes = require('./routes');
const errorHandler = require('./middlewares/error-handler');

mongoose.connect('mongodb://localhost:27017/mestodb', {
  useNewUrlParser: true,
}).then(() => {
  console.log('Connected to db');
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', routes);

app.use((req, res) => {
  res.status(404).json({ message: 'Запрашиваемый ресурс не найден' });
});

app.use(errors());
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Application is running on port ${PORT}`);
});
