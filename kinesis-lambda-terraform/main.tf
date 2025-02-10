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
  region = "us-east-1" # Change to your desired region
  default_tags {
    tags = {
      product              = "uptime-calculation"
      owner                = "Esakki"
      application_owner    = "Esakki"
      infrastructure_owner = "Esakki"
    }
  }
}
# locals {
#   role_name = "kinesis-execution-role"
#   policy_arn = "arn:aws:iam::aws:policy/AmazonKinesisFullAccess"
#   role_arn = "arn:aws:iam::013022175747:role/kinesis-execution-role"
# }
locals {
  uptime_sla_data = yamldecode(file("./inputs.yaml"))
}
resource "aws_kinesis_stream" "sample_stream" {
  name             = "sample-stream"
  shard_count      = 1
  retention_period = 24
}
resource "aws_lambda_function" "sample_lambda" {
  filename      = "src.zip" # Path to your Lambda code ZIP file
  function_name = "sample-lambda"
  role          = local.uptime_sla_data.data.role_and_policys.role_arn
  handler       = "index.handler"
  runtime       = "nodejs20.x" # Change to your preferred runtime
  vpc_config {
    subnet_ids         = [local.uptime_sla_data.data.private_links.subnet_ids[0], local.uptime_sla_data.data.private_links.subnet_ids[1]]
    security_group_ids = [local.uptime_sla_data.data.private_links.security_group_ids[0], local.uptime_sla_data.data.private_links.security_group_ids[1]]
  }
}

# Attach the policy to the role
resource "aws_iam_role_policy_attachment" "attach-kinesis" {
  role       = local.uptime_sla_data.data.role_and_policys.role_name
  policy_arn = local.uptime_sla_data.data.role_and_policys.policy_arn
}

resource "aws_lambda_event_source_mapping" "sample_mapping" {
  event_source_arn  = aws_kinesis_stream.sample_stream.arn
  function_name     = aws_lambda_function.sample_lambda.arn
  starting_position = "LATEST"
}

output "kinesis_data_stream" {
  value       = aws_kinesis_stream.sample_stream.arn
  description = "Kinesis data stream with shards"
}

output "consumer_function" {
  value       = aws_lambda_function.sample_lambda.arn
  description = "Consumer Function function name"
}