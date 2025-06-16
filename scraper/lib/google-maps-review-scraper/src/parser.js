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
			time: {
				published: review[1][2] || null,
				last_edited: review[1][3] || null,
			},
			author: {
				name: review[1][4][5][0] || null,
				profile_url: review[1][4][5][1] || null,
				url: review[1][4][5][2][0] || null,
				id: review[1][4][5][3] || null,
			},
			review: {
				rating: review[2][0]?.[0] || null,
				text: review[2][15]?.[0]?.[0] || null,
				language: review[2][14]?.[0] || null,
			},
			images: review[2][2]?.map(image => ({
				id: image[0] || null,
				url: image[1][6][0] || null,
				size: {
					width: image[1][6][2][0] || null,
					height: image[1][6][2][1] || null,
				},
				location: {
					friendly: image[1][21][3][7]?.[0] || null,
					lat: image[1][8][0][2] || null,
					long: image[1][8][0][1] || null,
				},
				caption: image[1][21][3][5]?.[0] || null,
			})) || null,
			source: review[1][13][0] || null,
			response: hasResponse ? {
				text: review[3][14]?.[0]?.[0] || null,
				time: {
					published: review[3]?.[1] || null,
					last_edited: review[3]?.[2] || null,
				},
			} : null
		}
	}));

    return JSON.stringify(parsedReviews, null, 2);
}