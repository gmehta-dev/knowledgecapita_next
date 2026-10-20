import { handler } from '@/server/http';
import { addCalendarEntry, getCalendar } from '@/server/controllers/calendarController';

export const GET = handler(getCalendar);
export const POST = handler(addCalendarEntry);
