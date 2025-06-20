import { scraper } from "./lib/google-maps-review-scraper/index.js"
import fs from "fs";
import XLSX from 'xlsx';

const url = "https://www.google.com/maps/place/London+Stansted+Airport/@51.8863747,-0.0635548,11z/data=!4m10!1m2!2m1!1sairport!3m6!1s0x487604b8a52a1bb7:0x30a4d0976b352648!8m2!3d51.8863747!4d0.2413158!15sCgdhaXJwb3J0WgkiB2FpcnBvcnSSARVpbnRlcm5hdGlvbmFsX2FpcnBvcnSqATwQASoLIgdhaXJwb3J0KAAyHhABIhoyqn08Egw-gILFZbHpRXxdNsV4vgiTu0DuuTILEAIiB2FpcnBvcnTgAQA!16zL20vMGhjc2g?hl=en&entry=ttu&g_ep=EgoyMDI1MDQyMy4wIKXMDSoJLDEwMjExNjQwSAFQAw%3D%3D";

const reviews = await scraper(url, {sort_type: "lowest_rating", languageFilter: "en", maxReviewCount: 50, languagePatience: 15 }); // 10 reviews per page

const englishReviews = reviews
  .map(r => ({
    rating: r.review.rating,
    text: r.review.text
  }));

console.log(englishReviews);