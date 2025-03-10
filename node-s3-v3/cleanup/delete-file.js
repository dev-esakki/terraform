/* eslint-disable no-console */
const { S3Client, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({ region: 'us-west-2' });

const bucketName = 'my-scheduler-sla';

const getJsonFilesFromS3 = async () => {
  try {
    const services = [2, 3];
    for (const service of services) {
      let Prefix;
      if (service === 2) {
        Prefix = `us-west-1/${service}/2025/`;
      } else {
        Prefix = `us-west-1/${service}/`;
      }
      const listParams = { Bucket: bucketName, Prefix };
      try {
        const listedObjects = new ListObjectsV2Command(listParams);
        const listedObject = await s3Client.send(listedObjects);
        // console.log('listedObject', listedObject)
        if (!listedObject?.Contents?.length) {
          console.log(`No files found for ${Prefix} in bucket ${bucketName}.`);
        } else {
          for (const element of listedObject.Contents) {
            const deleteParams = {
              Bucket: bucketName,
              Key: element.Key,
            };
            console.log('deleteParams', deleteParams);
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
getJsonFilesFromS3();
