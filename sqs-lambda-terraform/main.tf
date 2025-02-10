terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.52.0"
    }
  }

  required_version = ">= 1.3.7"
}

provider "aws" {
  region = "us-west-2" # Change to your desired region
  default_tags {
    tags = {
      Product             = "uptime-calculation"
      Owner               = "Esakki"
      ApplicationOwner    = "Esakki"
      InfrastructureOwner = "Esakki"
    }
  }
}

locals {
  uptime_data = yamldecode(file("./inputs.yaml"))
}

resource "aws_sqs_queue" "terraform_queue_deadletter" {
  name = "terraform-example-deadletter-queue"
}

resource "aws_sqs_queue" "terraform_queue" {
  name                      = "terraform-example-queue"
  delay_seconds             = 0
  max_message_size          = 2048
  message_retention_seconds = 86400
  receive_wait_time_seconds = 10
  redrive_policy            = "{\"deadLetterTargetArn\":\"${aws_sqs_queue.terraform_queue_deadletter.arn}\",\"maxReceiveCount\":4}"
}

resource "aws_lambda_function" "sqs_consumer" {
  filename      = "src.zip" # Path to your Lambda code ZIP file
  function_name = "sqs-consumer"
  role          = local.uptime_data.data.role.arn
  handler       = "./src/index.handler"
  runtime       = "nodejs20.x" # Change to your preferred runtime
}

resource "aws_lambda_event_source_mapping" "event_source_mapping" {
  event_source_arn = aws_sqs_queue.terraform_queue.arn
  enabled          = true
  batch_size       = 1
  function_name    = aws_lambda_function.sqs_consumer.arn
}


resource "aws_sqs_queue_redrive_allow_policy" "terraform_queue_redrive_allow_policy" {
  queue_url = aws_sqs_queue.terraform_queue_deadletter.id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue",
    sourceQueueArns   = [aws_sqs_queue.terraform_queue.arn]
  })
}

output "sqs_consumer_function" {
  value       = aws_sqs_queue.terraform_queue.arn
  description = "SQS function name"
}

output "lambda_consumer_function" {
  value       = aws_lambda_function.sqs_consumer.arn
  description = "SQS function name"
}