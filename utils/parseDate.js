const parseDate = (date) => {
  const tokens = date.split("-");

  const year = Number(tokens[0]);
  const month = Number(tokens[1]);
  const day = Number(tokens[2]);

  return new Date(year, month, day);
};

module.exports = parseDate;
