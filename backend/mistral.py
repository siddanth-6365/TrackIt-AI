import os
from mistralai import Mistral

api_key = "lN2owPtXmsQO6n6CcbTQALPFf5CYCs5x"
client = Mistral(api_key=api_key)

ocr_response = client.ocr.process(
    model="mistral-ocr-latest",
    document={
        "type": "image_url",
        "image_url": "https://raw.githubusercontent.com/mistralai/cookbook/refs/heads/main/mistral/ocr/receipt.png"
    },
    include_image_base64=True
)

print(ocr_response) 