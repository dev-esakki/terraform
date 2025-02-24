/* eslint-disable no-console */
const {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} = require('@aws-sdk/client-s3');
const path = require('path');

// Configure AWS SDK
const s3Client = new S3Client({ region: 'us-west-2' });

// Define the S3 bucket and folders
const bucketName = 'my-scheduler-sla';

const activeServices = () => [
  { serviceId: 2, region: 'us-east-1', frequency: 5 },
  { serviceId: 1, region: 'us-west-1', frequency: 5 },
  { serviceId: 2, region: 'us-west-2', frequency: 5 },
  { serviceId: 3, region: 'us-west-1', frequency: 5 },
];

// for current month set -1
function constructKey(months) {
  const currentDate = new Date();
  const previousMonth = new Date(currentDate);
  previousMonth.setMonth(currentDate.getMonth() - months);
  const month = (previousMonth.getMonth() + 1).toString().padStart(2, '0');
  const year = previousMonth.getFullYear().toString();
  return {
    year,
    month,
  };
}

function monthlyUptimeSLA(data, month, year) {
  const sumofSLAs = Object.values(data).reduce((acc, value) => acc + value, 0);
  const numberofDays = new Date(year, month, 0).getDate();
  return Number((sumofSLAs / numberofDays).toFixed(2));
}

async function modifyMonthlySLA(key, jsonData) {
  const command = new PutObjectCommand({
    Bucket: 'my-scheduler-sla',
    Key: key,
    Body: jsonData,
    ContentType: 'application/json',
  });
  const response = await s3Client.send(command);
  return response;
}

// Function to convert stream to string
const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });

async function constructMonthlySLA(jsond) {
  const jsonData = JSON.stringify({ [jsond.month]: jsond.sla });
  const fileName = 'monthlySLA.json';
  const key = path.join(jsond.region, jsond.serviceId, jsond.year, fileName);
  const listParams = { Bucket: bucketName, Key: key };
  try {
    const headCommand = new HeadObjectCommand(listParams);
    await s3Client.send(headCommand);
  } catch (error) {
    if (error.name === 'NotFound') {
      modifyMonthlySLA(key, jsonData);
    } else {
      console.error('Error in getting the month json file', error);
    }
  }
  const listCommand = new GetObjectCommand(listParams);
  const getResponse = await s3Client.send(listCommand);
  const data = await streamToString(getResponse.Body);
  const monthlySLA = JSON.parse(data);
  monthlySLA.push(jsonData);
  modifyMonthlySLA(key, jsonData);
  return monthlySLA;
}

// Function to get JSON files from S3
const getJsonFilesFromS3 = async () => {
  try {
    const services = activeServices();
    for (const service of services) {
      const { year, month } = constructKey(0);
      const Key = `${service.region}/${service.serviceId}/${year}/${month}/dailySLA.json`;
      const listParams = { Bucket: bucketName, Key };
      try {
        const headCommand = new HeadObjectCommand(listParams);
        await s3Client.send(headCommand);
        const listCommand = new GetObjectCommand(listParams);
        const getResponse = await s3Client.send(listCommand);
        const data = await streamToString(getResponse.Body);
        const sla = monthlyUptimeSLA(JSON.parse(data), month, year);
        const slaDetails = {
          region: service.region,
          serviceId: String(service.serviceId),
          sla,
          month: String(month),
          year: String(year),
        };
        await constructMonthlySLA(slaDetails);
        console.log('MonthlySLA created successfully');
      } catch (error) {
        if (error.name === 'NotFound') {
          console.log(`File ${Key} does not exist in bucket ${bucketName}.`);
        } else {
          console.error('Error in getting the json file', error);
        }
      }
    }
  } catch (err) {
    console.error('Error', err);
  }
};

// Call the function
getJsonFilesFromS3();
