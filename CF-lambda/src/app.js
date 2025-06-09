const { CloudWatchClient, GetMetricDataCommand} = require('@aws-sdk/client-cloudwatch')
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm')
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs')

const region = 'us-west-2'

const client = new CloudWatchClient({ region })
const ssmClient = new SSMClient({ region })
const sqsClient = new SQSClient({ region })

exports.handler = async (event) => {
  try {
    const params = {
      Name: '/my/app/configs',
      WithDecryption: true
    }
    const command = new GetParameterCommand(params)
    const data = await ssmClient.send(command)
    console.log("Success. Parameter: ", data.Parameter.Value)
    
  } catch (err) {
    console.log("Error", err)
  } 
}