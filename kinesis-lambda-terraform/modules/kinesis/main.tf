resource "aws_kinesis_stream" "sample_stream" {
  name             = "sample-stream"
  shard_count      = 1
  retention_period = 24
}

resource "aws_lambda_event_source_mapping" "sample_mapping" {
  event_source_arn  = aws_kinesis_stream.sample_stream.arn
  function_name     = var.kinesis_vars
  starting_position = "LATEST"
}

output "kinesis_data_stream" {
  value       = aws_kinesis_stream.sample_stream.arn
  description = "Kinesis data stream with shards"
}