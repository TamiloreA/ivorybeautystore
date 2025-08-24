const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String
});

module.exports = mongoose.models.Collection || mongoose.model('Collection', collectionSchema);

