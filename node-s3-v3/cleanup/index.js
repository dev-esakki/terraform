/* eslint-disable no-console */
const { S3Client, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');

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

// Function to get JSON files from S3
const getJsonFilesFromS3 = async () => {
  try {
    const services = activeServices();
    for (const service of services) {
      const { year, month, day } = constructKey(90);
      const Prefix = `${service.region}/${service.serviceId}/${year}/${month}/${day}/`;
      const listParams = { Bucket: bucketName, Prefix };
      try {
        const listedObjects = new ListObjectsV2Command(listParams);
        const listedObject = await s3Client.send(listedObjects);
        if (!listedObject?.Contents?.length) {
          console.log(`No files found for ${Prefix} in bucket ${bucketName}.`);
        } else {
          for (const element of listedObject.Contents) {
            const deleteParams = {
              Bucket: bucketName,
              Key: element.Key,
            };
            await s3Client.send(new DeleteObjectCommand(deleteParams));
            console.log('cleaned up successfully');
          }
        }
      } catch (error) {
        if (error.name === 'NotFound') {
          console.log(`File ${Prefix} does not exist in bucket ${bucketName}.`);
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
