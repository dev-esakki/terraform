const { S3Client, PutBucketReplicationCommand, DeleteBucketReplicationCommand, GetBucketReplicationCommand } = require('@aws-sdk/client-s3');

exports.handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  const s3 = new S3Client({});
  const props = event.ResourceProperties;
  console.log("props =======================",props);
  const sourceBucket = props.SourceBucket;
  const destinationBucketArn = props.DestinationBucketArn;
  const replicationRoleArn = props.ReplicationRoleArn;
  try {
    const getReplication = new GetBucketReplicationCommand({ Bucket: sourceBucket });
    console.log("getReplication =======================",getReplication);
    const getRepConfig = await s3.send(getReplication)
    if (getRepConfig?.ReplicationConfiguration?.Rules?.length > 0) {
      console.log(`Replication rule already exists for ${sourceBucket}`);
      return { Status: 'SUCCESS', Message: `Replication rule already exists for ${sourceBucket}` };
    }
  } catch (error) {
    if (error.name !== "ReplicationConfigurationNotFoundError") {
      throw error;
    }
    console.log("No replication rule, proceeding to add.");
  }
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
        Filter: {
          Prefix: ''
        },
        Destination: {
          Bucket: destinationBucketArn,
          StorageClass: 'STANDARD'
        }
      }
    ]
  };
  await s3.send(new PutBucketReplicationCommand({
    Bucket: sourceBucket,
    ReplicationConfiguration: replicationConfig
  }));
  console.log(`Replication configuration set for bucket: ${sourceBucket}`);
  return { Status: 'SUCCESS' };
  
};
