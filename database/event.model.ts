import mongoose, { Document, Model, Schema } from 'mongoose';

// TypeScript interface for Event document
export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Event schema definition
const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    overview: {
      type: String,
      required: [true, 'Overview is required'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Image is required'],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
    },
    mode: {
      type: String,
      required: [true, 'Mode is required'],
      trim: true,
    },
    audience: {
      type: String,
      required: [true, 'Audience is required'],
      trim: true,
    },
    agenda: {
      type: [String],
      required: [true, 'Agenda is required'],
      validate: {
        validator: (arr: string[]) => arr.length > 0,
        message: 'Agenda must contain at least one item',
      },
    },
    organizer: {
      type: String,
      required: [true, 'Organizer is required'],
      trim: true,
    },
    tags: {
      type: [String],
      required: [true, 'Tags are required'],
      validate: {
        validator: (arr: string[]) => arr.length > 0,
        message: 'Tags must contain at least one item',
      },
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Pre-validate hook for slug generation and date/time normalization
type EventDocument = IEvent &
  Document & {
    isModified?: (path?: keyof IEvent | string) => boolean;
  };

eventSchema.pre('validate', async function () {
  // `this` is the document being saved
  const doc = this as EventDocument;

  // Generate a URL-friendly slug when title changes or slug is absent.
  if (doc.isModified?.('title') || !doc.slug) {
    const slugify = (str: string) =>
      str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    const base = slugify(doc.title || '');
    let candidate = base || 'event';

    // Use the model constructor to query existing slugs and append a counter
    const EventModel =
      (mongoose.models.Event as Model<IEvent>) ||
      mongoose.model<IEvent>('Event', eventSchema);
    let counter = 0;

    // Loop until we find a unique slug
    while (true) {
      const exists = await EventModel.exists({ slug: candidate });
      if (!exists) break;
      counter += 1;
      candidate = `${base}-${counter}`;
    }

    doc.slug = candidate;
  }

  // Validate and normalize date to YYYY-MM-DD format if modified
  if (doc.isModified?.('date')) {
    const dateRegex = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    const match = (doc.date as unknown as string)?.match?.(dateRegex);

    if (!match) {
      throw new Error('Invalid date format - expected YYYY-MM-DD');
    }

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);

    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    if (
      isNaN(parsedDate.getTime()) ||
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) {
      throw new Error('Invalid date format - expected YYYY-MM-DD');
    }

    doc.date = match[0];
  }

  // Normalize time format (HH:MM) if modified
  if (doc.isModified?.('time')) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(doc.time as unknown as string)) {
      throw new Error('Time must be in HH:MM format');
    }
    const [hours, minutes] = (doc.time as unknown as string).split(':');
    doc.time = `${hours.padStart(2, '0')}:${minutes}`;
  }
});

// `unique: true` is already set on the `slug` path above, which creates
// a unique index. Removing the explicit schema.index() to avoid duplicate
// index warnings from Mongoose.

// Export the Event model (reuse existing model if already compiled)
const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>('Event', eventSchema);

export default Event;
