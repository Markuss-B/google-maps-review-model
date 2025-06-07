import { scraper } from "google-maps-review-scraper"
import fs from "fs";
import XLSX from 'xlsx';

// Load the workbook
const workbook = XLSX.readFile('places_list.xlsx');

// Pick the first sheet name
const sheetName = workbook.SheetNames[0];

// Get the worksheet
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet, {
});

const place = data[0].Place;
const url = data[0].Link;

const result = await scraper(url, { clean: true, pages:1 })

const reviews = JSON.parse(result);

// // Filter and map:
const englishReviews = reviews
  .filter(r => r.review && r.review.language === "en")
  .map(r => ({
    place: place,
    text: r.review.text,
    rating: r.review.rating
  }));

fs.writeFileSync("reviews.json", JSON.stringify(englishReviews, null, 2));
console.log(englishReviews.length + " reviews saved to reviews.json");