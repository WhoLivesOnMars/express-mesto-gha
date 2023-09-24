const http2 = require('node:http2');
const mongoose = require('mongoose');
const Card = require('../models/card');

const {
  HTTP_STATUS_OK,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} = http2.constants;

module.exports.getCards = (req, res) => {
  Card.find({})
    .then((cards) => res.status(HTTP_STATUS_OK).send({ data: cards }))
    .catch(() => res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).send({ message: 'Произошла ошибка' }));
};

module.exports.deleteCard = (req, res) => {
  Card.findByIdAndRemove(req.params.cardId)
    .orFail(new mongoose.Error.DocumentNotFoundError())
    .then((card) => {
      if (card.owner.toString() !== req.user._id) {
        res.status(HTTP_STATUS_FORBIDDEN).send({ message: 'Вы не можете удалить эту карточку' });
      } else {
        res.status(HTTP_STATUS_OK).send({ message: 'Карточка удалена' });
      }
    })
    .catch((err) => {
      if (err instanceof mongoose.CastError) {
        res.status(HTTP_STATUS_BAD_REQUEST).send({ message: 'Некорректный формат _id карточки' });
      } else {
        res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).send({ message: 'Произошла ошибка' });
      }
    });
};

module.exports.createCard = (req, res) => {
  const {
    name,
    link,
    likes,
    createdAt,
  } = req.body;
  Card.create({
    name,
    link,
    owner: req.user._id,
    likes,
    createdAt,
  })
    .then((card) => res.status(HTTP_STATUS_CREATED).send({ data: card }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return res.status(HTTP_STATUS_BAD_REQUEST).send({ message: 'Переданы некорректные данные при создании карточки' });
      }
      return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).send({ message: 'Произошла ошибка' });
    });
};

module.exports.likeCard = (req, res) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $addToSet: { likes: req.user._id } },
    { new: true },
  )
    .orFail(new mongoose.Error.DocumentNotFoundError())
    .then((card) => {
      res.status(HTTP_STATUS_OK).send(card);
    })
    .catch((err) => {
      if (err instanceof mongoose.CastError) {
        res.status(HTTP_STATUS_BAD_REQUEST).send({ message: 'Некорректный формат _id карточки' });
      } else {
        res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).send({ message: 'Произошла ошибка' });
      }
    });
};

module.exports.dislikeCard = (req, res) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $pull: { likes: req.user._id } },
    { new: true },
  )
    .orFail(new mongoose.Error.DocumentNotFoundError())
    .then((card) => {
      res.status(HTTP_STATUS_OK).send(card);
    })
    .catch((err) => {
      if (err instanceof mongoose.CastError) {
        res.status(HTTP_STATUS_BAD_REQUEST).send({ message: 'Некорректный формат _id карточки' });
      } else {
        res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).send({ message: 'Произошла ошибка' });
      }
    });
};
