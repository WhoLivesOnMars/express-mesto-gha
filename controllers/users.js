const http2 = require('node:http2');
const mongoose = require('mongoose');
const User = require('../models/user');

const {
  HTTP_STATUS_OK,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} = http2.constants;

const updateUser = (req, res, updateData) => {
  User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true },
  )
    .orFail(new mongoose.Error.DocumentNotFoundError())
    .then((user) => res.status(HTTP_STATUS_OK).send({ data: user }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        res.status(HTTP_STATUS_BAD_REQUEST).send({ message: 'Переданы некорректные данные при обновлении' });
      } else {
        res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).send({ message: 'Произошла ошибка' });
      }
    });
};

module.exports.updateUser = (req, res) => {
  const { name, about } = req.body;
  updateUser(req, res, { name, about });
};

module.exports.updateUserAvatar = (req, res) => {
  const { avatar } = req.body;
  updateUser(req, res, { avatar });
};

module.exports.getUsers = (req, res) => {
  User.find({})
    .then((users) => res.status(HTTP_STATUS_OK).send({ data: users }))
    .catch(() => res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).send({ message: 'Произошла ошибка' }));
};

module.exports.getUser = (req, res) => {
  const { userId } = req.params;

  User.findById(userId)
    .orFail(new mongoose.Error.DocumentNotFoundError())
    .then((user) => {
      if (!user) {
        res.status(HTTP_STATUS_NOT_FOUND).send({ message: 'Пользователь по указанному _id не найден' });
      } else {
        res.status(HTTP_STATUS_OK).send({ data: user });
      }
    })
    .catch((err) => {
      if (err instanceof mongoose.CastError) {
        res.status(HTTP_STATUS_BAD_REQUEST).send({ message: 'Некорректный формат _id пользователя' });
      } else {
        res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).send({ message: 'Произошла ошибка' });
      }
    });
};

module.exports.createUser = (req, res) => {
  const { name, about, avatar } = req.body;

  User.create({ name, about, avatar })
    .then((user) => res.status(HTTP_STATUS_CREATED).send({ data: user }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        res.status(HTTP_STATUS_BAD_REQUEST).send({ message: 'Переданы некорректные данные при создании пользователя' });
      } else {
        res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).send({ message: 'Произошла ошибка' });
      }
    });
};
