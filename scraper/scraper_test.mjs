import { scraper } from "google-maps-review-scraper"
import fs from "fs";

const url = "https://www.google.com/maps/place/Latvijas+Nacion%C4%81lais+m%C4%81kslas+muzejs/@56.9540954,24.1159194,16.04z/data=!4m8!3m7!1s0x46eecfcfc8bb3df3:0xc447c1df0dcf5c67!8m2!3d56.955829!4d24.1130753!9m1!1b1!16zL20vMGJoOWt3?entry=ttu&g_ep=EgoyMDI1MDQxNi4xIKXMDSoASAFQAw%3D%3D";

const result = await scraper(url, { clean: true, pages:1 })

const reviews = JSON.parse(result);

// // Filter and map:
const englishReviews = reviews
  .filter(r => r.review && r.review.language === "en")
  .map(r => ({
    text: r.review.text,
    rating: r.review.rating
  }));

fs.writeFileSync("reviews.json", JSON.stringify(englishReviews, null, 2));
console.log(englishReviews.length + " reviews saved to reviews.json");