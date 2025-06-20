import { scraper, scrapePage } from "./lib/google-maps-review-scraper/index.js"
import fs from "fs";
import XLSX from 'xlsx';

const maxReviewsPerPlace = 10000;
// how many pages to go without new reviews.
// seems like few reviews are found after pages and pages of empty reviews or reviews in different languages
// most reviews are found when sorting by relevant
// useful when sorting by relevant, but might not be useful when sorting by lowest_score,
//    because when sorting by lowest score most 1-star reviews are already found in relevant, but we are looking for 2-stars
const patience = null;

const xlsxFilePath = '../data/places_list.xlsx';
const reviewsFilePath = '../data/reviews.jsonl';

const debugFilePath = '../data/debug.log';

// load the excel
const workbook = XLSX.readFile(xlsxFilePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const data = XLSX.utils.sheet_to_json(worksheet, {});

async function main() {
  for (const row of data) {
    const place = row.Place;
    const url = row.Link;
    const scraped = row.Scraped;
    const totalReviews = row["Review count"];

    if (scraped) {
      console.log(`Skipping ${place}: already scraped`);
      continue;
    }

    if (!url) {
      console.log(`Skipping ${place}: no URL`);
      continue;
    }

    console.log(`Scraping reviews for: ${place}`);

    if (totalReviews > maxReviewsPerPlace) {
      const sortTypes = ["relevant", "lowest_rating", "newest", "highest_rating"];
      await scrapeAndSave(row, sortTypes);
    } else {
      const sortTypes = ["relevant"];
      await scrapeAndSave(row, sortTypes);
    }

    await sleep(2000);
  }

  console.log("Reviews saved to reviews.jsonl");
}


// Functions

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeAndSave(row, sortTypes) {
  const maxReviewsPerType = parseInt(maxReviewsPerPlace/sortTypes.length);
  const totalReviews = row["Review count"];
  const place = row.Place;

  let totalScrapedReviews = 0;
  let seenReviewIds = new Set();

  for (const sortType of sortTypes) {
    try {
      console.log(`Scraping ${place} by ${sortType}.`)
      
      let result = await scrapeAndSaveSortType(row, sortType, maxReviewsPerType, seenReviewIds, totalScrapedReviews);
      totalScrapedReviews = result.totalScrapedReviews;
      let scrapedPagesCount = result.pageCount;
  
      if (scrapedPagesCount >= parseInt(totalReviews / 10)-1) {
        break; // reached max page count, sorting differently wont find new reviews
      }
    } catch (err) {
      console.error(`Error scraping ${place}:`, err.message);
    }

    await sleep(2000); // polite delay
  }
}

async function scrapeAndSaveSortType(row, sortType, maxTypeReviews, seenReviewIds, totalScrapedReviews) {
  const place = row.Place;
  const url = row.Link;

  let scrapedReviewsCount = 0;
  let pageCount = 0;
  let nextPage = "";
  let patienceCounter = 0;
  while (scrapedReviewsCount < maxTypeReviews && totalScrapedReviews < maxReviewsPerPlace && (nextPage || pageCount === 0)) {
    let result = await scrapePage(url, {sort_type: sortType, page: nextPage});
    logResult(result, place, sortType, pageCount);

    let reviews = result.reviews;
    nextPage = result.nextPage;

    // filter reviews by language and make sure they have rating and text
    reviews = filterReviewsByContent(reviews, {languageFilter: "en"});
    reviews = filterReviewsById(reviews, seenReviewIds);

    saveReviews(reviews, place);

    scrapedReviewsCount += reviews.length;
    totalScrapedReviews += reviews.length;
    pageCount++;

    console.log(`${scrapedReviewsCount} reviews (total: ${totalScrapedReviews}) from ${sortType} / page ${pageCount}`);

    updateScrapedCount(row, totalScrapedReviews);

    // stop looking for reviews if not finding any new reviews
    if (patience !== null) {
      patienceCounter = reviews.length === 0 ? patienceCounter + 1 : 0;

      if (patienceCounter > patience) {
        break;
      }
    }

    await sleep(700);  // polite delay
  }

  return {totalScrapedReviews, pageCount};
}

function logResult(result, place, sortType, pageCount) {
  // log the result to debug file

  fs.appendFileSync(debugFilePath, JSON.stringify({
    place,
    sortType,
    pageCount,
    result
  }, null, 2) + '\n\n');
}

function filterReviewsById(reviews, seenReviewIds) {
  // filter reviews by id r.id
  return reviews.filter(review => {
    if (seenReviewIds.has(review.author.id)) {
      //console.log(`Found repeat author ${review.author.id}.`);
      return false;
    }

    seenReviewIds.add(review.author.id);

    return true;
  })
}

function filterReviewsByContent(reviews, { languageFilter = "any", requireRating = true, requireText = true } = {}) {
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

function saveReviews(reviews, place) {
  // convert for saving
  reviews = reviews
    .map(r => ({
      place: place,
      rating: r.review.rating,
      text: r.review.text
    }));

  // save the filtered reviews
  // Append each review to file as one line:
  for (const review of reviews) {
    fs.appendFileSync(reviewsFilePath, JSON.stringify(review) + "\n");
  }
}

function updateScrapedCount(row, reviewCount) {
  // Mark this place as scraped
  row.Scraped = reviewCount;

  // Save review count in the excel
  XLSX.utils.sheet_add_json(worksheet, data, { origin: "A1", skipHeader: false });
  XLSX.writeFile(workbook, xlsxFilePath);
}

await main();