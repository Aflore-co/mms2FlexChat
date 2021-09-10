const VError = require("verror");
const { google } = require("googleapis");
const today = new Date();

const getApiUtils = (context) => {
  const gCalendar = google.calendar({
    version: "v3",
    auth: context.GOOGLE_CALENDAR_API_KEY,
  });

  return {
    fetchHolidays: async (calendars) => {
      let holidaysObj = {};

      // Se utilizan para obtener el rango de días feriados desde el primer
      // día del año actual hasta el primer día del próximo año
      const timeMin = new Date(today.getFullYear(), 0, 1, -5, 0, 0);
      const timeMax = new Date(today.getFullYear() + 1, 0, 1, -5, 0, 0);

      try {
        for (const calendar of calendars) {
          console.log(
            "Getting events from Google Holiday Calendar for",
            calendar.countryName
          );

          const res = await gCalendar.events.list({
            calendarId: calendar.calendarId,
            orderBy: "startTime",
            singleEvents: true, // required to orderBy: startTime
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            timeZone: "America/Bogota",
          });
          const holidays = res.data.items;

          if (!holidays.length) {
            console.error(
              `No events were found in the Google Holiday Calendar for ${calendar.countryName}.`
            );
          }

          holidaysObj[calendar.countryCode] = holidays;
        }

        return holidaysObj;
      } catch (err) {
        throw new VError(
          err,
          "error while fetching events from Google Holiday Calendar API"
        );
      }
    },
  };
};

const fetchHolidaysFromCalendars = async (context, event) => {
  const { fetchHolidays } = getApiUtils(context);

  const calendars = [
    {
      countryCode: "CO",
      countryName: "Colombia",
      calendarId: "es.co#holiday@group.v.calendar.google.com",
    },
  ];

  const holidays = await fetchHolidays(
    calendars.filter((calendar) => calendar.countryCode === event.COUNTRY_CODE)
  );

  if (Object.keys(holidays).length) {
    return holidays;
  }

  throw new VError({}, "No events were found in the Google Holiday Calendar.");
};

async function todayIsHolidayIn(context, event) {
  const holidays = await fetchHolidaysFromCalendars(context, event);
  console.log(`Número de festivos en ${event.COUNTRY_CODE}:`, holidays[event.COUNTRY_CODE].length);
  const todayDate = today.toISOString().split("T")[0];
  const holidayFilter = holidays[event.COUNTRY_CODE].filter(
    (holiday) => holiday.start.date === todayDate
  );
  const todayIsHoliday = Boolean(holidayFilter.length);

  return todayIsHoliday;
}

exports.handler = async function (context, event, callback) {
  try {
    const todayisHoliday = await todayIsHolidayIn(context, event);
    console.log("¿Hoy es un día festivo?:", todayisHoliday);
    callback(null, {
      isHoliday: todayisHoliday,
    });
  } catch (err) {
    callback(err);
    throw new VError(err, "An unexpected error ocurred");
  }
};
