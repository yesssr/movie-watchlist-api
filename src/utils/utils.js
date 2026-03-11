require("dotenv").config();
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { default: axios } = require("axios");
const { SendError } = require("../middleware/error");


exports.sendResponse = (res, statusCode, message, data, token) => {
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
    credentials: token,
  }
  )
}
exports.saveImageToCloud = async (imageData) => {
  const formData = new FormData();
  formData.append('image', imageData.toString('base64'));
  const response = await fetch('https://api.imgur.com/3/image', {
    method: 'POST',
    headers: {
      Authorization: `Client-ID ${process.env.CLIENT_ID}`,
    },
    body: formData,
  });

  const result = await response.json();
  return result.data.link;
}

exports.saveImage = (file, imageBuffer) => {
  return new Promise((resolve, rejects) => {
    fs.writeFile(file, imageBuffer, (err) => {
      if (!err) resolve("OK")
      else rejects(new SendError("Error proccessing file!.", 500));
    })
  })
}

exports.deleteImage = (file) => {
  return new Promise((resolve, rejects) => {
    fs.unlink(file, (err) => {
      if (!err) resolve("OK");
      else rejects(new SendError("Error deleting file!.", 500));
    })
  })
}

exports.getUniqNumber = () => {
  let date = new Date().toLocaleDateString().split('/');
  let day = date[1], month = date[0], year = date[2];
  let number = year + '' + month + '' + day;
  let randomNumber = Math.floor(Math.random().toFixed(4) * 10000);
  return (number + '' + randomNumber);
}

exports.createToken = (payload) => {
  return new Promise((resolve, rejects) => {
    jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: process.env.JWT_EXPIRED,
    }, (err, token) => {
      if (!err) resolve(token);
      else rejects('Err generate token');
    });
  })
}

exports.verifyToken = (token) => {
  const isMatch = jwt.verify(token, process.env.JWT_SECRET_KEY);
  return isMatch;
}

exports.hashPass = (password) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

exports.comparePass = async (password, hashPass) => {
  const isMatch = await bcrypt.compare(password, hashPass);
  return isMatch;
}