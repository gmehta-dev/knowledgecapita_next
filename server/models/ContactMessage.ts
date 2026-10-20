import mongoose, { type Model } from 'mongoose';

const contactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required']
  },
  contact_no: {
    type: String,
    required: [true, 'Contact number is required'],
    validate: {
      validator: function (v: string) {
        return /^\d{10}$/.test(v);
      },
      message: 'Contact number must be exactly 10 digits'
    }
  },
  query: {
    type: String,
    required: [true, 'Query is required']
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

contactMessageSchema.virtual('id').get(function (this: any) {
  return this._id.toHexString();
});

contactMessageSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    delete ret.__v;
    return ret;
  }
});

// Reuse the compiled model across hot reloads / route bundles.
const ContactMessage: Model<any> = mongoose.models.ContactMessage || mongoose.model('ContactMessage', contactMessageSchema);
export default ContactMessage;
