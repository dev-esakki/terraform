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
function constructKey(days) {
  const currentDate = new Date();
  const previousDate = new Date(currentDate);
  previousDate.setDate(currentDate.getDate() - days);
  const month = (previousDate.getMonth() + 1).toString().padStart(2, '0');
  const year = previousDate.getFullYear().toString();
  const day = previousDate.getDate().toString().padStart(2, '0');
  return {
    year,
    month,
    day,
  };
}

function dailyUptimeSLA(data, frequency) {
  const registeredDataPoints = data.filter((obj) => Object.values(obj)).length - 1;
  const expectedDataPoints = Math.floor(60 / frequency) * 24;
  const failedDataPoints = data.filter((obj) => Object.values(obj).includes(0)).length;
  const dailySLA =
    100 -
    ((failedDataPoints + (expectedDataPoints - registeredDataPoints)) / expectedDataPoints) * 100;
  return Number(dailySLA.toFixed(2));
}

async function createDailySLA(jsond) {
  const jsonData = JSON.stringify({ sla: jsond.sla });
  const fileName = 'dailySLA.json';
  const key = path.join(jsond.region, jsond.serviceId, jsond.year, jsond.month, fileName);
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

// Function to get JSON files from S3
const getJsonFilesFromS3 = async () => {
  try {
    const services = activeServices();
    for (const service of services) {
      const { year, month, day } = constructKey(0);
      const Key = `${service.region}/${service.serviceId}/${year}/${month}/${day}/data-points.json`;
      const listParams = { Bucket: bucketName, Key };
      try {
        const headCommand = new HeadObjectCommand(listParams);
        await s3Client.send(headCommand);
        const listCommand = new GetObjectCommand(listParams);
        const getResponse = await s3Client.send(listCommand);
        const data = await streamToString(getResponse.Body);
        const sla = dailyUptimeSLA(JSON.parse(data), service.frequency);
        const slaDetails = {
          region: service.region,
          serviceId: String(service.serviceId),
          sla,
          month: String(month),
          year: String(year),
        };
        await createDailySLA(slaDetails);
        console.log('DailySLA created successfully');
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
