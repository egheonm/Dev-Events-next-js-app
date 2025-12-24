import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// TypeScript interface for Booking document
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Booking schema definition
const bookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: (email: string) => {
          // Basic Email Format validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },
        message: 'Please provide a valid email address',
      },
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Pre-save hook to validate that the referenced Event exists
bookingSchema.pre('save', async function (next) {
  // Only validate eventId if it's new or modified
  if (this.isModified('eventId')) {
    try {
      // Import Event model dynamically to avoid circular dependency
      const Event = mongoose.models.Event || (await import('./event.model')).default;
      
      // Check if the event exists in the database
      const eventExists = await Event.exists({ _id: this.eventId });
      
      if (!eventExists) {
        return next(new Error('Referenced event does not exist'));
      }
    } catch (error) {
      if (error instanceof Error) {
        return next(error);
      }
      return next(new Error('Failed to validate event reference'));
    }
  }

  next();
});

// Create index on eventId for efficient queries
bookingSchema.index({ eventId: 1 });

// Compound index for finding bookings by event and email
bookingSchema.index({ eventId: 1, email: 1 });

// Export the Booking model (reuse existing model if already compiled)
const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
