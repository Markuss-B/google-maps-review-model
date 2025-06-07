const XLSX = require('xlsx');

// Load the workbook
const workbook = XLSX.readFile('places_list.xlsx');

// Pick the first sheet name
const sheetName = workbook.SheetNames[0];

// Get the worksheet
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet, {
});

console.log(data[0].Link)

// console.log(data);

// Loop over the rows:
// data.forEach(row => {
//   console.log(row.City, row.Rating);
// });

// Filter rows
// const spainPlaces = data.filter(row => row.Country === 'Spain');
// console.log(spainPlaces);

// Map to new structure
// const placesLinks = data.map(row => ({
//   name: row.Place,
//   link: row.Link
// }));

// console.log(placesLinks);

// // Convert "Rating" and "Review count" to numbers:
// const cleanedData = data.map(row => ({
//   ...row,
//   Rating: parseFloat(String(row.Rating).replace(',', '.')), // "1,1" → 1.1
//   'Review count': parseInt(row['Review count'], 10)
// }));

// console.log(cleanedData);

// // sort by review count descending
// const sortedByReviews = [...cleanedData].sort((a, b) => b['Review count'] - a['Review count']);
// console.log(sortedByReviews);

