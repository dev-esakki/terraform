//Sample lambda code

exports.handler = async (event) => {
    console.log('Received SQS records:', JSON.stringify(event, null, 2));
    return {
      statusCode: 200,
      body: 'Processed SQS records successfully',
    };
  };