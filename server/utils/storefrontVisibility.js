const StorefrontConfig = require('../models/StorefrontConfig');

/**
 * Source of truth for public storefront visibility. Professional status,
 * subscription status and storefront publication are separate business states.
 */
async function getPublishedSpaceIds(espaceType) {
  return StorefrontConfig.distinct('espaceId', { espaceType, publie: true });
}

module.exports = { getPublishedSpaceIds };
