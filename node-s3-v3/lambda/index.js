/* eslint-disable no-return-await */
/* eslint-disable no-plusplus */
/* eslint-disable no-console */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-west-2' });
const docClient = DynamoDBDocumentClient.from(client);

const s3Client = new S3Client({ region: 'us-west-2' });
const bucketName = 'my-scheduler-sla';

async function invokeDB() {
  const params = {
    TableName: 'customers',
    FilterExpression: '#status = :status',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':status': true,
    },
  };
  const data = await docClient.send(new ScanCommand(params));
  const activeList = data.Items;
  return activeList;
}

async function putData(data) {
  if (!data?.serviceId) return { status: 400, body: 'serviceId is required' };
  const { serviceId, year, month, day, dataPoints } = data;
  const putS3data = new PutObjectCommand({
    Bucket: bucketName,
    Key: `us-west-2/${serviceId}/${year}/${month}/${day}/data-points.json`,
    Body: JSON.stringify(dataPoints),
    ContentType: 'application/json',
  });
  const response = await s3Client.send(putS3data);
  return response;
}

function generateTimestamp(data) {
  if (!data?.date) return { status: 400, body: 'date is required' };
  const { date } = data;
  const times = {};
  const startTime = new Date(date).getTime();
  for (let i = 0; i < 24; i++) {
    times[startTime + i * 3600000] = 1;
  }
  times.latest = 1;
  console.log(times);
  return times;
}

exports.handler = async (event) => {
  if (!event.type) {
    return { statusCode: 400, body: 'No type provided' };
  }
  const obj = {
    putData,
    generateTimestamp,
  };
  const triggerEvent = obj[event.type];
  const result = await invokeDB();
  console.log(result);
  return await triggerEvent?.(event);
};
