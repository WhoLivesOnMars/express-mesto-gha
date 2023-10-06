const http2 = require('node:http2');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

const NotFoundError = require('../errors/not-found-err');
const BadRequestError = require('../errors/bad-request-err');
const UnauthorizedError = require('../errors/unauthorized-err');
const ConflictError = require('../errors/conflict-err');

const {
  HTTP_STATUS_OK,
  HTTP_STATUS_CREATED,
} = http2.constants;

const updateUser = (req, res, next) => {
  User.findByIdAndUpdate(
    req.user._id,
    req.body,
    { new: true, runValidators: true },
  )
    .orFail(() => {
      throw new NotFoundError('Пользователь с указанным id не существует');
    })
    .then((user) => res.status(HTTP_STATUS_OK).send({ data: user }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequestError('Переданы некорректные данные при обновлении'));
      } else {
        next(err);
      }
    });
};

module.exports.updateUser = (req, res, next) => {
  updateUser(req, res, next);
};

module.exports.updateUserAvatar = (req, res, next) => {
  updateUser(req, res, next);
};

module.exports.getUsers = (req, res, next) => {
  User.find({})
    .then((users) => {
      res.send(users);
    })
    .catch((err) => {
      next(err);
    });
};

module.exports.getUser = (req, res, next) => {
  const { userId } = req.params;

  User.findById(userId)
    .orFail(() => {
      throw new NotFoundError('Пользователь с указанным id не существует');
    })
    .then((user) => {
      res.status(HTTP_STATUS_OK).send({ data: user });
    })
    .catch((err) => {
      if (err instanceof mongoose.CastError) {
        next(new BadRequestError('Некорректный формат _id пользователя'));
      } else if (err instanceof mongoose.Error.DocumentNotFoundError) {
        next(new NotFoundError('Пользователь по указанному _id не найден'));
      } else {
        next(err);
      }
    });
};

module.exports.getCurrentUser = (req, res, next) => {
  User.findById(req.user._id)
    .orFail(() => {
      throw new NotFoundError('Пользователь с указанным id не существует');
    })
    .then((user) => {
      res.status(HTTP_STATUS_OK).send(user);
    })
    .catch((err) => {
      if (err instanceof mongoose.CastError) {
        next(new BadRequestError('Некорректный формат _id пользователя'));
      } else if (err instanceof mongoose.Error.DocumentNotFoundError) {
        next(new NotFoundError('Пользователь по указанному _id не найден'));
      } else {
        next(err);
      }
    });
};

module.exports.createUser = (req, res, next) => {
  const { name, about, avatar } = req.body;

  bcrypt.hash(req.body.password, 10)
    .then((hash) => User.create({
      email: req.body.email,
      password: hash,
      name,
      about,
      avatar,
    })
      .then((user) => {
        res.status(HTTP_STATUS_CREATED).send({
          _id: user._id,
          email: user.email,
          name: user.name,
          about: user.about,
          avatar: user.avatar,
        });
      })
      .catch((err) => {
        if (err.code === 11000) {
          next(new ConflictError('Пользователь с указанным email уже существует'));
        } else if (err.name === 'ValidationError') {
          next(new BadRequestError('Переданы некорректные данные при создании пользователя'));
        } else {
          next(err);
        }
      }))
    .catch((err) => {
      next(err);
    });
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;

  User.findUserByCredentials(email, password)
    .then((user) => {
      bcrypt.compare(String(password), user.password)
        .then((isValidUser) => {
          if (isValidUser) {
            const token = jwt.sign({ _id: user._id }, 'super-strong-secret', { expiresIn: '7d' });
            res.cookie('jwt', token, {
              httpOnly: true,
              maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            res.send({ token });
          } else {
            throw new UnauthorizedError('Указаны неверные логин или пароль');
          }
        });
    })
    .catch((err) => {
      next(err);
    });
};
