const fs = require('fs');

makeCategoryBreakdownFile = (cat, head, file, row) => {
  let rows = '';
  if (head === true) {
    rows += "Transaction Date,Description,Category,Debit";
  } else {
    rows += `${row[0]},${row[3]},${row[4]},${row[5]},`;
  }

  rows += '\n'
  if (head === true) {
    fs.writeFileSync(`${file.slice(0,-4)}_${cat}.csv`, rows, (err) => {
      if (err) throw (err)
    })
    console.log('New File Created!');
    head = false;
  } else {
    fs.appendFile(`${file.slice(0,-4)}_${cat}.csv`, rows, (err) => {
      if (err) console.log(err);
    })
  }
}

getSpendingTotals = (file, category) => {
  console.log(`PARSING ${file} spreadsheet file...`);
  const dataString = fs.readFileSync(file, "utf8");

  // split raw data into rows
  let allRows = dataString.split('\n');

  const columnNames = allRows[0].split(',');

  // omit column names from array of rows
  allRows = allRows.slice(1);

  // create output object for this function to return
  const totals = {};

  // boolean variable to keep track of adding column names to output file
  let head = true;
  allRows.forEach((row) => {
    let rowArr = row.split(',');
    // if row is blank skip row
    if (rowArr[4] === undefined || rowArr[3].slice(0,11) === "CAPITAL ONE") {
      return
    }
    // if there's a credit change it to a negative debit
    if (rowArr[6] > 0) {
      rowArr[5] = '-'+rowArr[6]
    }

    let rowObj = {};
    // pair column names and values as key value pairs

    for (let i = 4; i < 6; i++) {
      // logs relevant data for category in question
      if (category !== undefined && rowArr[i] === category) {
        // console.log(rowArr[i - 1], rowArr[i + 1])
        if (head === true) {
          makeCategoryBreakdownFile(category, head, file, rowArr)
          head = false
        } else {
          makeCategoryBreakdownFile(category, false, file, rowArr)
        }
      }
      rowObj[columnNames[i]] = rowArr[i];

  }
    /* each row of is represented as key value pair in the final object, the key is the item number, the value
     is an object of column names (keys) and values */
    if (totals.hasOwnProperty(rowObj[columnNames[4]])) {
      totals[rowObj[columnNames[4]]] += Number(rowArr[5])
    } else {
      totals[rowObj[columnNames[4]]] = Number(rowArr[5])
    }
  })
  for (let name in totals) {
    let rows = `${name}, ${totals[name]}\n`;
    fs.appendFile(`${file.slice(0, -4)}Totals.csv`, rows, (err) => {
      if (err) throw (err)
    })
  }
  console.log(`\nTotals Aggregated from ${file.slice(0, -4).toUpperCase()} statement:\n`)
  console.log(totals)
}

fineGrainedBreakdown = (file, csv) => {
  console.log(`PARSING ${file} spreadsheet file...`);
  const dataString = fs.readFileSync(file, "utf8");
  // split raw data into rows
  let allRows = dataString.split('\n');
  let headerRow = 0;
  const columnNames = allRows[headerRow].split(',');
  // omit column names from array of rows
  allRows = allRows.slice(headerRow + 1);
  // create output object for this function to return
  const totals = {};

  // iterate through the rows and add them to the new object only if the item has an NDC
  let descriptionCol = 0;
  while (columnNames[descriptionCol] !== 'Description') {
    descriptionCol ++
  }
  let debitCol = 0;
  while (columnNames[debitCol] !== 'Debit') {
    debitCol ++
  }
  allRows.forEach((row) => {
    let rowArr = row.split(',');
    if (rowArr[descriptionCol] === undefined) return
    let name = rowArr[descriptionCol];
    // edge cases to combine different store locations
    if (name.slice(0,6) === 'WAL-MA' || name.slice(0,6) === 'WM SUP') {
      name = 'WAL-MART'
    }
    if (name.slice(0,6) === 'WINN D') {
      name = 'WINN DIXIE'
    }
    if (name.slice(0,9) === 'AMZN Mktp' || name.slice(0,6) === 'AMAZON') {
      name = 'AMAZON '
    }
    if (name.slice(0,6) === 'PANERA') {
      name = 'PANERA '
    }
    if (name.slice(0,8).toLowerCase() === 'mcdonald') {
      name = 'MCDONALDS '
    }

    if (totals.hasOwnProperty(name)) {
      totals[name] += Number(rowArr[debitCol])
    } else {
      totals[name] = Number(rowArr[debitCol])
    }
  })
  console.log(`\nTotals Aggregated from ${file.slice(0, -4).toUpperCase()}\n`)
  console.log(totals)

  if (csv === 'csv') {
    for (let name in totals) {
      let rows = `${name}, ${totals[name]}\n`;
      fs.appendFile(`${file.slice(0, -4)}Totals.csv`, rows, (err) => {
        if (err) throw (err)
      })
    }
  }

}

/* Notes: don't run getSpendingTotals and fineGrainedBreakdown at the same time. fs recreates the file
 each time, preventing it from being read by fineGrainedBreakdown
 also don't run too many getSpendingTotals at once
  - add the name of the category you want to breakdown as a second argument to getSpendingTotals to
   output a csv file of all the purchases in that category
  - use fineGrainedBreakdown to get total spent at each establishment in a given csv file
  - add 'csv' as second argument to fineGrainedBreakdown to output a csv file of totals spent/retailer
  */

// ********** uncomment lines below here to run specific functions and optionally output csv files **********

// getSpendingTotals('february.csv');
// getSpendingTotals('march.csv');
// getSpendingTotals('february.csv', 'Dining');
// getSpendingTotals('march.csv', 'Dining');

// fineGrainedBreakdown('march_Merchandise.csv','csv')
// fineGrainedBreakdown('february_Merchandise.csv','csv')
// fineGrainedBreakdown('february_Dining.csv', 'csv')
// fineGrainedBreakdown('march_Dining.csv','csv')