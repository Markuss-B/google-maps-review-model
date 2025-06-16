/**
 * Parses an array of reviews and returns a minified JSON string of the parsed reviews.
 * @param {Array} reviews - The array of reviews to parse. Each review is expected to be an array with specific nested structures.
 * @returns {Promise<string>} A promise that resolves to a JSON string of the parsed reviews.
 *
 */
export default async function parseReviews(reviews) {
    const parsedReviews = await Promise.all(reviews.map(([review], index) => {
		const hasResponse = !!review[3][14]?.[0]?.[0]
		return {
			review_id: review[0],
			review: {
				rating: review[2][0]?.[0] || null,
				text: review[2][15]?.[0]?.[0] || null,
				language: review[2][14]?.[0] || null,
			}
		}
	}));

    return parsedReviews;
}