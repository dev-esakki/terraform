locals {
  uptime_data = yamldecode(file("./inputs.yaml"))
}

module "lambda-us-west-2" {
    source = "./modules/lambda"
    providers = {
      aws = aws.oregon
    }
    lambda_vars = local.uptime_data
}

module "sqs-us-west-2" {
    source = "./modules/sqs"
    providers = {
      aws = aws.oregon
    }
    sqs_vars = module.lambda-us-west-2.lambda_consumer_function
}

module "lambda-us-west-1" {
    source = "./modules/lambda"
    providers = {
      aws = aws.california
    }
    lambda_vars = local.uptime_data
}

module "sqs-us-west-1" {
    source = "./modules/sqs"
    providers = {
      aws = aws.california
    }
    sqs_vars = module.lambda-us-west-1.lambda_consumer_function
}
