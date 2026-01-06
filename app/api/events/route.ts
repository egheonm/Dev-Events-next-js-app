import  Event, { IEvent } from "@/database/event.model";
import dbConnect from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const formData = await req.formData();

    let event: Record<string, unknown>;
    try {
      // Convert FormData to a plain object. Values may be strings or Files.
      event = Object.fromEntries(formData.entries());
    } catch {
      return NextResponse.json(
        { message: 'Invalid form data' },
        { status: 400 },
      );
    }

    // Coerce common array fields that may be submitted as comma-separated strings.
    // This keeps the payload compatible with the schema which expects arrays.
    ['agenda', 'tags'].forEach((key) => {
      const value = event[key];
      if (typeof value === 'string') {
        const val = value.trim();
        event[key] = val
          ? val.split(',').map((s) => s.trim()).filter(Boolean)
          : [];
      }
    });

    try {
      // Optionally clean up a known test event in non-production environments.
      if (
        process.env.NODE_ENV === 'test' ||
        process.env.CLEANUP_TEST_EVENTS === 'true'
      ) {
        await Event.deleteOne({ slug: 'cloud-next-2026' });
      }

      const createdEvent = await Event.create(event as Partial<IEvent>);
      return NextResponse.json(
        { message: 'Event Created Successfully', event: createdEvent },
        { status: 201 },
      );
    } catch (err: unknown) {
      console.error('Create event error:', err);

      // Handle Mongo duplicate key error (code 11000) to return a 409 Conflict
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: number }).code === 11000
      ) {
        const { keyValue } = err as { keyValue?: Record<string, unknown> };
        const duplicatedField = keyValue
          ? Object.keys(keyValue)[0]
          : 'unknown';

        return NextResponse.json(
          {
            message: 'Duplicate value error',
            error: `A document with the same ${duplicatedField} already exists.`,
            details: keyValue,
          },
          { status: 409 },
        );
      }

      // For validation errors from Mongoose, return 400 with details
      if (err instanceof Error && err.name === 'ValidationError') {
        const details = (err as { errors?: unknown }).errors;
        return NextResponse.json(
          {
            message: 'Validation failed',
            error: err.message,
            details,
          },
          { status: 400 },
        );
      }

      // Unknown error — rethrow to be handled by outer catch
      throw err;
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        message: 'Event Creation Failed',
        error: e instanceof Error ? e.message : 'Unknown',
      },
      { status: 500 },
    );
  }
}
