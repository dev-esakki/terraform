
resource "aws_lambda_function" "sqs_consumer" {
  filename      = "${path.module}/src.zip" # Path to your Lambda code ZIP file
  function_name = "sqs-consumer"
  role          = var.lambda_vars.data.role.arn
  handler       = "./src/index.handler"
  runtime       = "nodejs20.x" # Change to your preferred runtime
}

output "lambda_consumer_function" {
  value       = aws_lambda_function.sqs_consumer.arn
  description = "SQS function name"
}