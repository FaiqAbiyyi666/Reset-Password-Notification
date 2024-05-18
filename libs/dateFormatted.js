module.exports = {
  dateFormatted: (timestamp) => {
    let date = new Date(timestamp);
    let options = { day: "numeric", month: "long", year: "numeric" };
    let dateFormatted = new Intl.DateTimeFormat("id-ID", options).format(date);
    return dateFormatted;
  },
};
