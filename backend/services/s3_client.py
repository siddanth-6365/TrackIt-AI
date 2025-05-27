import os
import uuid
import asyncio
import boto3
from botocore.exceptions import BotoCoreError, ClientError

# Load AWS creds & config from environment
AWS_ACCESS_KEY_ID     = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION            = os.getenv("AWS_REGION")
S3_BUCKET_NAME        = os.getenv("S3_BUCKET_NAME")
S3_FOLDER             = os.getenv("S3_FOLDER") 

# Initialize the S3 client
s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION,
)

async def upload_image_to_s3(image_bytes: bytes) -> str:
    """
    Upload `image_bytes` to S3 under a unique key and return its public URL.
    """
    def _upload(bytes_data: bytes, key: str):
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=key,
            Body=bytes_data,
            ContentType="image/jpeg",
        )
        return f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{key}"

    # generate a unique key with folder prefix
    filename = f"{uuid.uuid4()}.jpg"
    key = f"{S3_FOLDER.rstrip('/')}/{filename}"

    loop = asyncio.get_running_loop()
    try:
        url = await loop.run_in_executor(None, _upload, image_bytes, key)
    except (BotoCoreError, ClientError) as e:
        raise RuntimeError(f"S3 upload failed: {e}")

    return url
