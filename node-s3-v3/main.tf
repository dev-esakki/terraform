terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.90.0"
    }
  }

  required_version = ">= 1.3.7"
}

provider "aws" {
  region = "us-west-2" # Change to your desired region
  # alias = "oregon"
  default_tags {
    tags = {
      Product             = "uptime-calculation"
      Owner               = "Esakki"
      ApplicationOwner    = "Esakki"
      InfrastructureOwner = "Esakki"
    }
  }
}

resource "aws_lambda_function" "sample_lambda" {
  filename      = "lambda.zip" # Path to your Lambda code ZIP file
  function_name = "sample-lambda"
  role          = "arn:aws:iam::013022175747:role/kinesis-execution-role"
  handler       = "./lambda/index.handler"
  runtime       = "nodejs20.x" # Change to your preferred runtime
}

output "consumer_function" {
  value       = aws_lambda_function.sample_lambda.arn
  description = "Consumer Function function name"
}