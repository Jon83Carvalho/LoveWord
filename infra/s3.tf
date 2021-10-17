resource "aws_s3_bucket" "dl" {
  bucket = "datalake-igti-projeto-edc"
  acl    = "private"

  tags = {
    IES   = "IGTI",
    CURSO = "EDC-PROJETO"
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket" "dados" {
  bucket = "dados-proj-jc-edc"
  acl    = "private"

  tags = {
    IES   = "IGTI",
    CURSO = "EDC-PROJETO"
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket" "stream" {
  bucket = "igti-jonas-streaming-bucket"
  acl    = "private"

  tags = {
    IES   = "IGTI",
    CURSO = "EDC-PROJETO"
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}
