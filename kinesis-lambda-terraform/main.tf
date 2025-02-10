
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

module "kinesis-us-west-2" {
    source = "./modules/kinesis"
    providers = {
      aws = aws.oregon
    }
    kinesis_vars = module.lambda-us-west-2.consumer_function
}