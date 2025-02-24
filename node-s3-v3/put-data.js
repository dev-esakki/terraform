/* eslint-disable no-console */
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

const s3Client = new S3Client({ region: 'us-west-2' });

const jsond = [
  { latest: 1 },
  {
    1740249756: 0,
  },
  {
    1740250056: 0,
  },
  {
    1740250356: 0,
  },
  {
    1740250656: 1,
  },
  {
    1740250956: 1,
  },
  {
    1740251256: 1,
  },
  {
    1740251556: 1,
  },
  {
    1740251856: 1,
  },
  {
    1740252156: 1,
  },
  {
    1740252456: 1,
  },
  {
    1740252756: 1,
  },
  {
    1740253056: 1,
  },
  {
    1740253356: 1,
  },
  {
    1740253656: 1,
  },
  {
    1740253956: 1,
  },
  {
    1740254256: 1,
  },
  {
    1740254556: 1,
  },
  {
    1740254856: 1,
  },
  {
    1740255156: 1,
  },
  {
    1740255456: 1,
  },
  {
    1740255756: 1,
  },
  {
    1740256056: 1,
  },
  {
    1740256356: 1,
  },
  {
    1740256656: 1,
  },
  {
    1740256956: 1,
  },
  {
    1740257256: 1,
  },
  {
    1740257556: 1,
  },
  {
    1740257856: 1,
  },
  {
    1740258156: 1,
  },
  {
    1740258456: 1,
  },
  {
    1740258756: 1,
  },
  {
    1740259056: 1,
  },
  {
    1740259356: 1,
  },
  {
    1740259656: 1,
  },
  {
    1740259956: 1,
  },
  {
    1740260256: 1,
  },
];

const uploadFile = async () => {
  try {
    const jsonData = JSON.stringify(jsond);
    const date = new Date();
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    // Define the folder and file name
    const region = 'us-west-1';
    const fileName = 'data-points.json';

    const key = path.join(region, '3', year, month, day, fileName);
    // console.log('key', key)
    const command = new PutObjectCommand({
      Bucket: 'my-scheduler-sla',
      Key: key,
      Body: jsonData,
      ContentType: 'application/json',
    });
    const response = await s3Client.send(command);
    console.log(response);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};

uploadFile();
