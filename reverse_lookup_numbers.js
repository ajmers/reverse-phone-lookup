const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const axios = require('axios');
const https = require('https');

const API_KEY = process.env.VOXOLOGY_API_KEY;

const myArgs = process.argv.slice(2);
const [ filename, delimiter ] = myArgs;

const errors = []

fs.createReadStream(path.resolve(__dirname, filename )) //
  .pipe(csv.parse({ headers: true, delimiter: delimiter }))
    .on('error', error => console.error(error))                          //
  .on('data', row => {
    const theNumber = row.Phone;
    const theDate = row.Date;
    const url = `https://api.voxolo.gy/v1/PhoneNumberInformation/+${theNumber}?include=cnam,carrier,location&integrations=ekata_reverse_phone`
    if (row.Type == 'to' && row.Minutes > 2) {
      //console.log("Minutes:", row.Minutes);
      axios
        .get(url, {
          headers: {
            "cache-control": "no-cache",
            "content-type": "application/json",
            "x-api-key": `${API_KEY}`          }
        })
        .then(res => {
          const belongsTo = res.data.integrations.whitepages_reverse_phone.belongs_to
          const name =  belongsTo && belongsTo.name
          const industry = belongsTo && belongsTo.industry;
          const cnam = res.data.cnam.caller_name;
          if (belongsTo) {
            console.log(`${theDate} ${row.Minutes}: ${cnam} / ${theNumber} ${name} ${industry}`);
          } else {
            console.log(`${theDate} ${theNumber} / ${res.data.integrations.whitepages_reverse_phone.current_addresses[0].state_code}`);
          }
       })
        .catch(error => {
          //console.log("Error:", error);
          //errors.push(`${error.response.data.help}\n`);
        });

    }

  })
    .on('end', rowCount => console.log(`Parsed ${rowCount} rows`));      //

console.log(errors);
