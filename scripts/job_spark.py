# carregamento dos dados em formato parquet
from pyspark.sql.functions import mean, max, min, col, count
from pyspark.sql import SparkSession

spark = (
    SparkSession.builder.appName("PrjFinal-spar-job")
    .getOrCreate()
)

# Ler os dados 
enem = (
    spark
    .read
    .format("txt")
    .option("header", True)
    .option("inferSchema", True)
    .option("delimiter", ";")
    .load("s3://dados-proj-jc-edc/raw/")
)

# Ler os dados 
(
    enem
    .write
    .mode("overwrite")
    .format("parquet")
    .partitionBy("year")
    .save("s3://dados-proj-jc-edc/process/")
)
