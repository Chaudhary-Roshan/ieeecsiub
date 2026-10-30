const fs = require('fs');
const path = require('path');

let content = fs.readFileSync(path.join(__dirname, 'buildTemplates.js'), 'utf8');

// Replace pairs of signature spacers in order
let chairTurn = true;
content = content.replace(/<div style="height: (?:28|30|34|36|40)px"><\/div>/g, (match) => {
  if (chairTurn) {
    chairTurn = false;
    return '<div style="height: 44px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 2px;">{{chair_signature}}</div>';
  } else {
    chairTurn = true;
    return '<div style="height: 44px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 2px;">{{advisor_signature}}</div>';
  }
});

fs.writeFileSync(path.join(__dirname, 'buildTemplates.js'), content, 'utf8');
console.log('Injected signatures into buildTemplates.js');

