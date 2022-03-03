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


search_query = "love"   

before = datetime.now()
tweets = tw.Cursor(api.search_tweets,
              q=search_query).items(10)
after = datetime.now()
# store the API responses in a list

deltaT=(after-before).microseconds
tweets_copy = []
for tweet in tweets:
    tweets_copy.append(tweet)
    
print("Total Tweets fetched:", len(tweets_copy),before,after)

tweets_df = pd.DataFrame()
# populate the dataframe




for tweet in tweets_copy:
    hashtags = []
    try:
        for hashtag in tweet.entities["hashtags"]:
            hashtags.append(hashtag["text"])
        text = api.get_status(id=tweet.id, tweet_mode='extended').full_text
    except:
        pass
    tweets_df = tweets_df.append(pd.DataFrame({'user_location': tweet.user.location,\
                                               'text': text, 
                                               'hashtags': [hashtags if hashtags else None],
                                               'deltaT': deltaT}))
    tweets_df = tweets_df.reset_index(drop=True)
# show the dataframe

tweets_df=tweets_df.groupby(['user_location']).agg('count')

tweets_df.to_csv(csv_buffer)
s3_resource = boto3.resource('s3')
s3_resource.Object(bucket, 'tweets_df.csv').put(Body=csv_buffer.getvalue())



def lambda_handler(event, context):
    # TODO implement
    return {
        'statusCode': 200,
        'body':'OK!!!!! {}'.format(deltaT)
    }
