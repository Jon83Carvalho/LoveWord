resource "aws_s3_bucket_object" "job_spark" {
  bucket = aws_s3_bucket.dl.id
  key    = "script/job_spar.py"
  acl    = "private"
  source = "scripts/job_spark.py"
  etag   = "tag-script/job_spark.py"
}

# resource "aws_s3_bucket_object" "delta_insert" {
#   bucket = aws_s3_bucket.dl.id
#   key    = "emr-code/pyspark/01_delta_spark_insert.py"
#   acl    = "private"
#   source = "../etl/01_delta_spark_insert.py"
#   etag   = filemd5("../etl/01_delta_spark_insert.py")
# }

# resource "aws_s3_bucket_object" "delta_upsert" {
#   bucket = aws_s3_bucket.dl.id
#   key    = "emr-code/pyspark/02_delta_spark_upsert.py"
#   acl    = "private"
#   source = "../etl/02_delta_spark_upsert.py"
#   etag   = filemd5("../etl/02_delta_spark_upsert.py")
# }
