const Country = require("../models/Country");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");

const getAllCountries = async (req, res) => {
  const countries = await Country.find({}).lean();
  res.status(StatusCodes.OK).json({ countries });
};

const createCountry = async (req, res) => {
  const { name } = req.body;

  const countryNameAlreadyExists = await Country.findOne({ name }).lean();
  if (countryNameAlreadyExists) {
    throw new BadRequestError("Country already exists!");
  }

  const country = await Country.create({
    name,
    countryFlag: `https://countryflagsapi.com/png/${name.toLowerCase()}`,
  });
  res.status(StatusCodes.CREATED).json({ country });
};

const getCountry = async (req, res) => {
  const { id } = req.params;
  const country = await Country.findOne({ _id: id }).lean();

  if (!country) {
    throw new NotFoundError("Country does not exist!");
  }

  res.status(StatusCodes.OK).json({ country });
};

const updateCountry = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  const countryNameAlreadyExists = await Country.findOne({ name }).lean();
  if (countryNameAlreadyExists) {
    throw new BadRequestError("Country already exists!");
  }

  const country = await Country.findOneAndUpdate(
    { _id: id },
    {
      name,
      countryFlag: `https://countryflagsapi.com/png/${name.toLowerCase()}`,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!country) {
    throw new NotFoundError("Country does not exist!");
  }

  res.status(StatusCodes.OK).json({ country });
};

const deleteCountry = async (req, res) => {
  const { id } = req.params;
  const country = await Country.findByIdAndRemove({ _id: id });

  if (!country) {
    throw new NotFoundError("Country does not exist!");
  }

  res.status(StatusCodes.OK).send();
};

module.exports = {
  getAllCountries,
  createCountry,
  getCountry,
  updateCountry,
  deleteCountry,
};
