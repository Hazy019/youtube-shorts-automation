import boto3
import os
from dotenv import load_dotenv

load_dotenv()

s3 = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name='us-east-1'
)

bucket = os.getenv('BUCKET_NAME')
prefix = 'sites/'

with open('s3_list.txt', 'w') as f:
    try:
        f.write(f"Listing prefix '{prefix}' in bucket '{bucket}'...\n")
        response = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)
        if 'Contents' in response:
            for obj in response['Contents']:
                f.write(f" - {obj['Key']}\n")
        else:
            f.write("No objects found with that prefix.\n")
    except Exception as e:
        f.write(f"Error: {e}\n")
