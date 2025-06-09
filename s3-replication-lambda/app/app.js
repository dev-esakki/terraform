const { S3Client, PutBucketReplicationCommand, DeleteBucketReplicationCommand } = require('@aws-sdk/client-s3');
const response = require('cfn-response');

exports.handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const s3 = new S3Client({});
  const props = event.ResourceProperties;
console.log("props =======================",props);
  const sourceBucket = props.SourceBucket;
  const destinationBucketArn = props.DestinationBucketArn;
  const replicationRoleArn = props.ReplicationRoleArn;

  const replicationConfig = {
    Role: replicationRoleArn,
    Rules: [
      {
        ID: 'CustomCFNReplicationRule',
        Status: 'Enabled',
        Priority: 1,
        DeleteMarkerReplication: {
          Status: 'Enabled'
        },
        Filter: {},
        Destination: {
          Bucket: destinationBucketArn,
          StorageClass: 'STANDARD'
        }
      }
    ]
  };

  try {
    if (event.RequestType === 'Delete') {
      await s3.send(new DeleteBucketReplicationCommand({ Bucket: sourceBucket }));
      console.log(`Replication configuration deleted for bucket: ${sourceBucket}`);
    } else {
      await s3.send(new PutBucketReplicationCommand({
        Bucket: sourceBucket,
        ReplicationConfiguration: replicationConfig
      }));
      console.log(`Replication configuration set for bucket: ${sourceBucket}`);
    }

    return response.send(event, context, response.SUCCESS);
  } catch (error) {
    console.error('Error:', error);
    return response.send(event, context, response.FAILED, {
      Error: error.message
    });
  }
};
