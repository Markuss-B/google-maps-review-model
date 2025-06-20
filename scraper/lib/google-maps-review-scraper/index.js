import { SortEnum } from "./src/types.js";
import { validateParams, fetchReviews, paginateReviews, filterReviews } from "./src/utils.js";
import parseReviews from "./src/parser.js";

/**
 * Scrapes reviews from a given Google Maps URL.
 *
 * @param {string} url - The URL of the Google Maps location to scrape reviews from.
 * @param {Object} options - The options for scraping.
 * @param {string} [options.sort_type="relevent"] - The type of sorting for the reviews ("relevent", "newest", "highest_rating", "lowest_rating").
 * @param {string} [options.search_query=""] - The search query to filter reviews.
 * @param {string} [options.pages="max"] - The number of pages to scrape (default is "max"). If set to a number, it will scrape that number of pages (results will be 10 * pages) or until there are no more reviews.
 * @param {string} [options.languageFilter="any"] - Filter for review language, default "any" ("en", "lv").
 * @param {string|number} [options.maxReviewCount="max"] - Maximum number of reviews (default is "max").
 * @param {number} [options.languagePatience=null] - Number of consecutive pages allowed to return zero matching reviews before stopping early. If set to null, patience logic is disabled (all pages will be fetched up to the limit).
 * @returns {Promise<Array|number>} - Returns an array of reviews or 0 if no reviews are found.
 * @throws {Error} - Throws an error if the URL is not provided or if fetching reviews fails.
 */
export async function scraper(url, { sort_type = "relevent", search_query = "", pages = "max", languageFilter = "any", maxReviewCount = "max", languagePatience = null } = {}) {
    try {
        validateParams(url, sort_type, pages);

        const sort = SortEnum[sort_type];
        const initialData = await fetchReviews(url, sort, "", search_query);

        if (!initialData || !initialData[2] || !initialData[2].length) return 0;

        let reviews = await parseReviews(initialData[2]);
        reviews = filterReviews(reviews, {languageFilter});

        if (!initialData[1] || pages === 1) return parseReviews(initialData[2]);

        return await paginateReviews(url, sort, pages, search_query, initialData[1], reviews, languageFilter, maxReviewCount, languagePatience);
    } catch (e) {
        console.error(e);
        return;
    }
}

/**
 * Scrapes reviews from a given Google Maps URL.
 *
 * @param {string} url - The URL of the Google Maps location to scrape reviews from.
 * @param {Object} options - The options for scraping.
 * @param {string} [options.sort_type="relevant"] - The type of sorting for the reviews ("relevant", "newest", "highest_rating", "lowest_rating").
 * @param {string} [options.search_query=""] - The search query to filter reviews.
 * @returns {Promise<Array|number>} - Returns an array of reviews or 0 if no reviews are found.
 * @throws {Error} - Throws an error if the URL is not provided or if fetching reviews fails.
 */
export async function scrapePage(url, { sort_type = "relevant", search_query = "", page=""} = {}) {
    try {
        const sort = SortEnum[sort_type];
        const data = await fetchReviews(url, sort, page, search_query);

        if (!data || !data[2] || !data[2].length) return { reviews: [], nextPage: null };

        let reviews = await parseReviews(data[2]);

        let nextPage = data[1]?.replace(/"/g, "");

        return {reviews, nextPage}
    } catch (e) {
        console.error(e);
        return {reviews: [], nextPage: null}
    }
}