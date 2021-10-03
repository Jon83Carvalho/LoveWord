provider "aws" {
    region = var.aws_region
}


#Centralizar arquivo de controle

terraform {
  backend "s3" {
    bucket="terraformtfstatejcprj"
    key="state/terraform.tfstate"
    region="us-east-2"
  }
}