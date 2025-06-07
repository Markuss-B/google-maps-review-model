import { scraper } from "google-maps-review-scraper"
import fs from "fs";
import XLSX from 'xlsx';

const maxReviewsPerPlace = 5000;
const xlsxFileName = 'places_list.xlsx';

const workbook = XLSX.readFile(xlsxFileName);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const data = XLSX.utils.sheet_to_json(worksheet, {});  // Array of rows

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

  try {
    const result = await scraper(url, { clean: true, pages: maxReviewsPerPlace/10 }); // 10 reviews per page
    const reviews = JSON.parse(result);

    const englishReviews = reviews
      .filter(r => r.review && r.review.language === "en")
      .map(r => ({
        place: place,
        rating: r.review.rating,
        text: r.review.text
      }));

    console.log(`Found ${englishReviews.length} english reviews for ${place}`);

    // Append each review to file as one line:
    for (const review of englishReviews) {
      fs.appendFileSync("reviews.jsonl", JSON.stringify(review) + "\n");
    }

    // Mark this place as scraped
    row.Scraped = englishReviews.length;

    // Save workbook immediately after each place:
    XLSX.utils.sheet_add_json(worksheet, data, { origin: "A1", skipHeader: false });
    XLSX.writeFile(workbook, xlsxFileName);

    await new Promise(resolve => setTimeout(resolve, 2000));  // polite delay

  } catch (err) {
    console.error(`Error scraping ${place}:`, err.message);
  }
}

console.log("Reviews saved to reviews.jsonl");
