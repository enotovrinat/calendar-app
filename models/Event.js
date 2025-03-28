const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  googleEventId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Валидация дат
eventSchema.pre('save', function(next) {
  if (this.endDate < this.startDate) {
    next(new Error('Дата окончания не может быть раньше даты начала'));
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema); 