import 'server-only';
import type { NextRequest } from 'next/server';
import CalendarEntry from '../models/CalendarEntry';
import { json, readBody, validate } from '../http';
import { requireUser } from '../auth';
import { calendarSchema } from '../validators/calendarValidator';

// GET /calender
export async function getCalendar(req: NextRequest) {
  const user = await requireUser(req);

  const entries = await CalendarEntry.find({ user_id: user._id })
    .sort({ from_date: 1 });

  return json({ data: entries });
}

// POST /calender
export async function addCalendarEntry(req: NextRequest) {
  const user = await requireUser(req);
  const body = await readBody(req);
  validate(calendarSchema, body);
  const { city, from_date, to_date, time, interested_to_meet } = body;

  await CalendarEntry.create({
    user_id: user._id,
    city,
    from_date,
    to_date,
    time,
    interested_to_meet
  });

  return json({ message: 'Calendar entry added successfully' }, 201);
}
