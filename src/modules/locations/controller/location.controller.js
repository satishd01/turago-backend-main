/**
 * Location Controller.
 */

import locationService from '../service/location.service.js';
import { sendSuccess } from '../../../common/utils/apiResponse.js';
import { asyncHandler } from '../../../common/utils/asyncHandler.js';

export const reverseGeocode = asyncHandler(async (req, res) => {
  const latitude = parseFloat(req.query.latitude);
  const longitude = parseFloat(req.query.longitude);

  const result = await locationService.reverseGeocode(latitude, longitude);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Location resolved successfully',
    data: result,
  });
});

export const autocomplete = asyncHandler(async (req, res) => {
  const input = req.query.input || req.query.query || req.query.search || req.query.q;
  const { latitude, longitude } = req.query;

  const results = await locationService.autocomplete(input, {
    latitude: latitude ? parseFloat(latitude) : undefined,
    longitude: longitude ? parseFloat(longitude) : undefined,
  });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Autocomplete results fetched',
    data: results,
  });
});

export const getPopularLocations = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.query;

  const locations = await locationService.getPopularLocations({
    latitude: latitude ? parseFloat(latitude) : undefined,
    longitude: longitude ? parseFloat(longitude) : undefined,
  });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Popular locations retrieved',
    data: locations,
  });
});

export const getDirections = asyncHandler(async (req, res) => {
  const { origin, destination, vehicleType } = req.body;

  const result = await locationService.getDirectionsAndFare({
    origin,
    destination,
    vehicleType,
  });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Directions and fare estimate calculated',
    data: result,
  });
});
