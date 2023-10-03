const jwt = require('jsonwebtoken');
const { HTTP_STATUS_UNAUTHORIZED } = require('node:http2').constants;

module.exports = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res
      .status(HTTP_STATUS_UNAUTHORIZED)
      .send({ message: 'Ошибка авторизации' });
  }

  const token = authorization.replace('Bearer ', '');
  let payload;

  try {
    payload = jwt.verify(token, 'super-strong-secret');
  } catch (err) {
    return res
      .status(HTTP_STATUS_UNAUTHORIZED)
      .send({ message: 'Ошибка авторизации' });
  }

  req.user = payload; // записываем пейлоуд в объект запроса

  return next(); // пропускаем запрос дальше
};
