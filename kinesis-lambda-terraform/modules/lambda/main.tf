resource "aws_lambda_function" "sample_lambda" {
  filename      = "${path.module}/src.zip" # Path to your Lambda code ZIP file
  function_name = "sample-lambda"
  role          = var.lambda_vars.data.role.arn
  handler       = "./src/index.handler"
  runtime       = "nodejs20.x" # Change to your preferred runtime
}

output "consumer_function" {
  value       = aws_lambda_function.sample_lambda.arn
  description = "Consumer Function function name"
}