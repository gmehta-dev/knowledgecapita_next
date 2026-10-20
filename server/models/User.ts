import mongoose, { type Model } from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone_number: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  designation: String,
  industry: String,
  area_of_specialization: String,
  profile_image: String,
  brief_bio: String,
  experience: String,
  detailed_bio: String,
  scheduling_assistance: {
    type: String,
    maxlength: 100
  },

  // Added in the Next.js migration. Missing on existing documents = 'user' (no data migration needed).
  // Promote with scripts/make-super-admin.mjs; never settable via sign-up or profile update.
  role: {
    type: String,
    enum: ['user', 'super_admin'],
    default: 'user'
  },

  // Visibility settings (0 = hidden, 1 = visible)
  name_visibility: { type: Number, default: 1 },
  profile_visibility: { type: Number, default: 1 },
  brief_bio_visibility: { type: Number, default: 1 },
  experience_visibility: { type: Number, default: 1 },
  calender_visibility: { type: Number, default: 1 },
  scheduling_visibility: { type: Number, default: 1 },
  detailed_bio_visibility: { type: Number, default: 1 }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Add virtual 'id' field for frontend compatibility
userSchema.virtual('id').get(function (this: any) {
  return this._id.toHexString();
});

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    delete ret.__v;
    return ret;
  }
});

// Hash password before saving
userSchema.pre("save", async function (this: any, next: any) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (this: any, candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for calendar entries
userSchema.virtual('calendar_entries', {
  ref: 'CalendarEntry',
  localField: '_id',
  foreignField: 'user_id'
});

// Indexes for dashboard queries
userSchema.index({ name: 'text' });
userSchema.index({ industry: 1 });
userSchema.index({ designation: 1 });
userSchema.index({ area_of_specialization: 1 });

// Reuse the compiled model across hot reloads / route bundles.
const User: Model<any> = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
