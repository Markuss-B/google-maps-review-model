import listugcposts from "./listugcposts.js";
import { SortEnum } from "./types.js";
import { URL } from "url";
import parser from "./parser.js";

/**
 * Validates parameters for the Google Maps review scraper.
 *
 * @param {string} url - Must include "https://www.google.com/maps/place/".
 * @param {string} sort_type - Must be a valid key in SortEnum.
 * @param {string|number} pages - "max" or a number.
 * @throws {Error} If any parameter is invalid.
 */
export function validateParams(url, sort_type, pages) {
    const parsedUrl = new URL(url);
    if (parsedUrl.host !== "www.google.com" || !parsedUrl.pathname.startsWith("/maps/place/")) {
        throw new Error(`Invalid URL: ${url}`);
    }
    if (!SortEnum[sort_type]) {
        throw new Error(`Invalid sort type: ${sort_type}`);
    }
    if (pages !== "max" && isNaN(pages)) {
        throw new Error(`Invalid pages value: ${pages}`);
    }
}

/**
 * Fetches reviews from a given URL with sorting and pagination options.
 *
 * @param {string} url - The URL to fetch reviews from.
 * @param {string} sort - The sorting option for the reviews.
 * @param {string} [nextPage=""] - Token for the next page, if any.
 * @param {string} [search_query=""] - Search query to filter reviews, if any.
 * @returns {Promise<Object>} Parsed JSON data of reviews.
 * @throws {Error} If the request fails or the response is invalid.
 */
export async function fetchReviews(url, sort, nextPage = "", search_query = "") {
    const apiUrl = listugcposts(url, sort, nextPage, search_query);
    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.statusText}`);
    }
    const textData = await response.text();
    const rawData = textData.split(")]}'")[1];
    return JSON.parse(rawData);
}


/**
 * Paginates through reviews from a given URL.
 *
 * @param {string} url - The URL to fetch reviews from.
 * @param {string} sort - Sorting parameter for reviews.
 * @param {string|number} pages - Number of pages or "max".
 * @param {string} search_query - Search query to filter reviews.
 * @param {Array} initialData - Initial data containing reviews and next page token.
 * @param {string} languageFilter - Filter for review language, default "any".
 * @param {string|number} maxReviewCount - Number of reviews ir "max".
 * @param {string|number} maxReviewCount -  Number of consecutive pages allowed to return zero matching reviews before stopping early.
 * @returns {Promise<Array>} Array of reviews or parsed reviews.
 */
export async function paginateReviews(url, sort, pages, search_query, page, reviews, languageFilter="any", maxReviewCount="max", languagePatience=null) {
    let languageMissCount = 0;

    let errorPatience = 5;
    let errors = 0

    let nextPage = page?.replace(/"/g, "");
    let currentPage = 2;
    while (nextPage && (pages === "max" || currentPage <= +pages) && (maxReviewCount === "max" || reviews.length < maxReviewCount)) {
        console.log(`${reviews.length} reviews scraped. Scraping page ${currentPage}...`);
        let data;
        try {
            data = await fetchReviews(url, sort, nextPage, search_query);
        } catch (error) {
            console.error(`Failed to fetch page ${currentPage}:`, error);
            errors++;
            if (errors >= errorPatience) {
                break;
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Avoid rate-limiting
                continue;
            }
        }

        if (!data || !Array.isArray(data) || data.length < 3 || !Array.isArray(data[2])) {
            console.warn(`Unexpected or incomplete data on page ${currentPage}. Stopping pagination.`);
            break;
        }

        let newFilteredReviews = await parser(data[2]);
        newFilteredReviews = filterReviews(newFilteredReviews, { languageFilter });

        if (languagePatience !== null) {
            if (newFilteredReviews.length === 0) {
                languageMissCount++;
                if (languageMissCount >= languagePatience) {
                    console.log(`Stopping early after ${languageMissCount} pages with no ${languageFilter} reviews.`);
                    break;
                }
            } else {
                languageMissCount = 0;
            }
        }

        newFilteredReviews = newFilteredReviews

        reviews = [...reviews, ...newFilteredReviews];
        nextPage = data[1]?.replace(/"/g, "");

        if (!nextPage) break;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Avoid rate-limiting
        currentPage++;

        errors = 0;
    }
    
    return reviews;
}

export function filterReviews(reviews, { languageFilter = "any", requireRating = true, requireText = true } = {}) {
  return reviews.filter(review => {
    const lang = review.review?.language;
    const rating = review.review?.rating;
    const text = review.review?.text?.trim();

    if (languageFilter !== "any" && lang !== languageFilter) return false;
    if (requireRating && (rating === null || rating === undefined)) return false;
    if (requireText && (!text || text.length === 0)) return false;

    return true;
  });
}
