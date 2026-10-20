import mongoose, { type Model } from 'mongoose';

const activitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Activity name is required'],
    trim: true
  },
  description: String,
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

activitySchema.virtual('id').get(function (this: any) {
  return this._id.toHexString();
});

activitySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    delete ret.__v;
    return ret;
  }
});

// Reuse the compiled model across hot reloads / route bundles.
const Activity: Model<any> = mongoose.models.Activity || mongoose.model('Activity', activitySchema);
export default Activity;
