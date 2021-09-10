const VError = require("verror");

function isWeekendDay() {
  const today = new Date();
  const weekendFormatOptions = {
    timeZone: "America/Bogota",
    weekday: "long",
  };
  const formatter = new Intl.DateTimeFormat([], weekendFormatOptions);
  const weekendDays = ["Saturday", "Sunday"];

  console.log("¿Qué día es hoy?:", formatter.format(today))
  return weekendDays.includes(formatter.format(today));
}

exports.handler = (context, event, callback) => {
  try {
    const todayIsWeekendDay = isWeekendDay();
    console.log("¿Hoy es un día de fin de semana?:", todayIsWeekendDay);
    callback(null, {
      isWeekendDay: todayIsWeekendDay,
    });
  } catch (err) {
    callback(err);
    throw new VError(err, "An unexpected error ocurred");
  }
};
