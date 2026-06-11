export const CALENDARS = [
  {
    code: 'gregory',
    name: 'Gregorian Calendar',
    nameId: 'Kalender Gregorian',
    description: 'The internationally accepted civil calendar',
    eras: ['BC', 'AD'],
    months: 12,
    daysInWeek: 7,
    origin: 'Vatican',
    yearAdopted: 1582,
  },
] as const;

export const CALENDAR_CODES = CALENDARS.map((c) => c.code) as CalendarCode[];

export const CALENDAR_CODE = Object.fromEntries(
  CALENDAR_CODES.map((calendar) => [calendar.toUpperCase(), calendar] as const),
) as {
  [K in CalendarCode as Uppercase<K>]: K;
};

export type CalendarCode = (typeof CALENDARS)[number]['code'];
export type CalendarConfig = (typeof CALENDARS)[number];
