const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'buildTemplates.js');
let code = fs.readFileSync(file, 'utf8');

// Replace IEEE text inside 80x54 white box (Projects Expo winner / participation)
code = code.replace(
  /<div style="width: 80px; height: 54px; background: #FFFFFF; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-family: Montserrat, sans-serif; font-weight: 800; font-size: 16px; color: #00629B">IEEE<\/div>/g,
  '<div style="width: 80px; height: 54px; background: #FFFFFF; border-radius: 6px; display: flex; align-items: center; justify-content: center; padding: 4px">{{ieee_logo}}</div>'
);

// Replace standalone IEEE text (Design 1, 2, 3, volunteer)
code = code.replace(
  /<div style="font-family: Montserrat, sans-serif; font-weight: 800; font-size: 20px; color: #00629B; letter-spacing: 0.08em">IEEE<\/div>/g,
  '{{ieee_logo}}'
);

// Also replace hardcoded images with dynamic tags
code = code.replace(/src="\/ieee-cs-logo\.png"/g, 'src="{{chapter_logo}}"');
code = code.replace(/src="\/logo\.png"/g, 'src="{{university_logo}}"');

fs.writeFileSync(file, code, 'utf8');
console.log('Successfully updated scripts/buildTemplates.js with dynamic logo tags');

// Run buildTemplates.js
require('./buildTemplates.js');
