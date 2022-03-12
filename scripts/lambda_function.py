import json
import pandas as pd
import boto3
import csv
import tweepy as tw
from datetime import datetime
from io import StringIO # python3; python2: BytesIO 

bucket = 'loveword' # already created on S3
csv_buffer = StringIO()


# your Twitter API key and API secret
my_api_key = "ILHSAcxUbvn9LcqzZT7GufoaX"
my_api_secret = "OkutBlmSSk2kyMlQKiCBeWhZnQ6CkVSVYdP8SK7TiFBNoFOczp"
# authenticate
auth = tw.OAuthHandler(my_api_key, my_api_secret)
api = tw.API(auth, wait_on_rate_limit=True)


#search_query = "love"   

search_query = "love OR liebe OR amore OR amour OR amor OR 爱 OR любов OR любовь OR dashuri OR սեր OR ljubav OR amor OR 爱 OR kasih OR  사랑 -filter:retweets"


before = datetime.now()
tweets = tw.Cursor(api.search_tweets,
              q=search_query).items(5000)
after = datetime.now()
# store the API responses in a list

deltaT=(after-before).microseconds
tweets_df = pd.DataFrame()

for tweet in tweets:

    
    tweets_df = tweets_df.append(pd.DataFrame({'user_name': 
                                                    tweet.user.name, 
                                               'user_location': 
                                                   tweet.user.location,
                                               'deltaT': deltaT
                                            },index=[tweet.user.location]))
    tweets_df = tweets_df.reset_index(drop=True)
    
final=datetime.now()    
print("Total Tweets fetched:nice", len(tweets_df['deltaT']),before,after,\
        final)

# show the dataframe

tweets_df_agg=tweets_df[['user_location','deltaT']].groupby(['user_location'])\
    .agg(['count','max'])

tweets_df_agg.deltaT[['count','max']].to_csv(csv_buffer,sep="\\")
s3_resource = boto3.resource('s3')
s3_resource.Object(bucket, 'raw/tweets_df.csv').put(Body=csv_buffer.getvalue())



def lambda_handler(event, context):
    # TODO implement
    return {
        'statusCode': 200,
        'body':'OK!!!!! {},{}'.format(len(tweets_df['deltaT']),deltaT)
    }
