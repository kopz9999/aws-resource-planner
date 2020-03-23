const AWS = require('aws-sdk');
const fs = require('fs');

const REGIONS = [
  "eu-north-1",
  "ap-south-1",
  "eu-west-3",
  "eu-west-2",
  "eu-west-1",
  "ap-northeast-2",
  "ap-northeast-1",
  "sa-east-1",
  "ca-central-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "eu-central-1",
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
];

async function recordSet(region, tags = []) {
  const resourcegroupstaggingapi = new AWS.ResourceGroupsTaggingAPI({ region });


  let results, response, paginationToken = null, params, rows = [], row, tagValue;
  do {
    params = {
      PaginationToken: paginationToken,
      // ResourcesPerPage: 'NUMBER_VALUE',
      TagsPerPage: 100
    };
    response = await resourcegroupstaggingapi.getResources(params).promise();
    paginationToken = response.PaginationToken;
    results = response.ResourceTagMappingList;
    results.forEach(record => {
      row = [];
      row.push(record.ResourceARN);
      row.push(region);
      if (tags.length > 0) {
        tags.forEach(tag => {
          tagValue = record.Tags.filter(tagObject => tag.toLowerCase() === tagObject.Key.toLowerCase())[0];
          if (tagValue) {
            row.push(tagValue.Value);
          } else {
            row.push("-");
          }
        });
      }
      rows.push(row.map(c => `"${c}"`).join(","));
    });
  } while (paginationToken);
  return rows;
}

async function generateCSV() {
  let tags = ["project"];
  let headers = [["resource", "region"].concat(tags).join(",")];
  let promises = REGIONS.map( r =>  recordSet(r, tags) );
  let matrix = await Promise.all(promises);
  let file = headers.concat(matrix.flat(Infinity)).join("\n");
  fs.writeFileSync("resources.csv", file);
}

generateCSV();
