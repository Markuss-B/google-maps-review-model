import { scraper } from "./lib/google-maps-review-scraper/index.js"
import fs from "fs";
import XLSX from 'xlsx';

const maxReviewsPerPlace = 2000;
const xlsxFilePath = '../data/places_list.xlsx';
const reviewsFilePath = '../data/reviews.jsonl';

// load the excel
const workbook = XLSX.readFile(xlsxFilePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const data = XLSX.utils.sheet_to_json(worksheet, {});

for (const row of data) {
  const place = row.Place;
  const url = row.Link;
  const scraped = row.Scraped;

  if (scraped) {
    console.log(`Skipping ${place}: already scraped`);
    continue;
  }

  if (!url) {
    console.log(`Skipping ${place}: no URL`);
    continue;
  }

  console.log(`Scraping reviews for: ${place}`);

  // scrape the place
  try {
    const reviews = await scraper(url, {languageFilter: "en", maxReviewCount: maxReviewsPerPlace, languagePatience: 15 }); // 10 reviews per page

    const englishReviews = reviews
      .map(r => ({
        place: place,
        rating: r.review.rating,
        text: r.review.text
      }));

    console.log(`Found ${englishReviews.length} english reviews for ${place}`);

    // Append each review to file as one line:
    for (const review of englishReviews) {
      fs.appendFileSync(reviewsFilePath, JSON.stringify(review) + "\n");
    }

    // Mark this place as scraped
    row.Scraped = englishReviews.length;

    // Save review count in the excel
    XLSX.utils.sheet_add_json(worksheet, data, { origin: "A1", skipHeader: false });
    XLSX.writeFile(workbook, xlsxFilePath);

    await new Promise(resolve => setTimeout(resolve, 2000));  // polite delay

  } catch (err) {
    console.error(`Error scraping ${place}:`, err.message);
  }
}

console.log("Reviews saved to reviews.jsonl");
