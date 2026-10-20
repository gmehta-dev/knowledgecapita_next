import mongoose, { type Model } from 'mongoose';

const calendarEntrySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  city: {
    type: String,
    required: [true, 'City is required']
  },
  time: {
    type: String,
    required: [true, 'Time is required']
  },
  from_date: {
    type: Date,
    required: [true, 'From date is required']
  },
  to_date: {
    type: Date,
    required: [true, 'To date is required']
  },
  interested_to_meet: {
    type: String,
    required: [true, 'Interested to meet is required']
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

calendarEntrySchema.virtual('id').get(function (this: any) {
  return this._id.toHexString();
});

calendarEntrySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    delete ret.__v;
    return ret;
  }
});

calendarEntrySchema.index({ from_date: 1, to_date: 1 });

// Reuse the compiled model across hot reloads / route bundles.
const CalendarEntry: Model<any> = mongoose.models.CalendarEntry || mongoose.model('CalendarEntry', calendarEntrySchema);
export default CalendarEntry;
