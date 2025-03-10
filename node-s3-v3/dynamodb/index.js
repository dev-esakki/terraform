/* eslint-disable no-console */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-west-2' });
const docClient = DynamoDBDocumentClient.from(client);

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
  const { serviceId, year, month, day, dataPoints } = data;
  const putS3data = new PutObjectCommand({
    Bucket: 'my-scheduler-sla',
    Key: `${serviceId}/${year}/${month}/${day}/data-points.json`,
    Body: JSON.stringify(dataPoints),
    ContentType: 'application/json',
  });
  const response = await s3Client.send(putS3data);
  return response;
}

exports.handler = async (event) => {
  if (event.type === 'putdata') {
    await putData(event);
  }
  const result = await invokeDB();
  console.log(result);
  return result;
};
