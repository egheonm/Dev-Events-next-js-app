import  Event, { IEvent } from "@/database/event.model";
import dbConnect from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req : NextRequest) {
    try {
        await dbConnect();
        const formData = await req.formData();

        let eventObj: Record<string, any>;
        try {
            // Convert FormData to a plain object. Values may be strings or Files.
            eventObj = Object.fromEntries(formData.entries());
        } catch {
            return NextResponse.json({ message: 'Invalid form data' }, { status: 400 });
        }

        // Coerce common array fields that may be submitted as comma-separated strings.
        // This keeps the payload compatible with the schema which expects arrays.
        ['agenda', 'tags'].forEach((key) => {
            if (typeof eventObj[key] === 'string') {
                const val = (eventObj[key] as string).trim();
                eventObj[key] = val ? val.split(',').map(s => s.trim()).filter(Boolean) : [];
            }
        });

        try {
            const createdEvent = await Event.create(eventObj as Partial<IEvent>);
            return NextResponse.json({ message: 'Event Created Successfully', event: createdEvent }, { status: 201 });
        } catch (err: any) {
            console.error('Create event error:', err);
            // Handle Mongo duplicate key error (code 11000) to return a 409 Conflict
            if (err?.code === 11000) {
                const duplicatedField = err.keyValue ? Object.keys(err.keyValue)[0] : 'unknown';
                return NextResponse.json({
                    message: 'Duplicate value error',
                    error: `A document with the same ${duplicatedField} already exists.`,
                    details: err.keyValue,
                }, { status: 409 });
            }

            // For validation errors from Mongoose, return 400 with details
            if (err?.name === 'ValidationError') {
                return NextResponse.json({ message: 'Validation failed', error: err.message, details: err.errors }, { status: 400 });
            }

            // Unknown error — rethrow to be handled by outer catch
            throw err;
        }

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ message: 'Event Creation Failed', error: e instanceof Error ? e.message : 'Unknown' }, { status: 500 });
    }
}