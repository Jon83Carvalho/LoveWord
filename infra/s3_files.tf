resource "aws_s3_bucket_object" "job_spark" {
  bucket = aws_s3_bucket.dl.id
  key    = "script/job_spark.py"
  acl    = "private"
  source = "../scripts/job_spark.py"
  etag   = "tag-script/job_spark.py"
}

resource "aws_s3_bucket_object" "delta_insert" {
  bucket = aws_s3_bucket.dl.id
  key    = "script/01_delta_spark_insert.py"
  acl    = "private"
  source = "../scripts/01_delta_spark_insert.py"
  etag   = filemd5("../scripts/01_delta_spark_insert.py")
}

resource "aws_s3_bucket_object" "delta_upsert" {
  bucket = aws_s3_bucket.dl.id
  key    = "script/02_delta_spark_upsert.py"
  acl    = "private"
  source = "../scripts/02_delta_spark_upsert.py"
  etag   = filemd5("../scripts/02_delta_spark_upsert.py")
}
