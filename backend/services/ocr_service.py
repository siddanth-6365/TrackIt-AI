import os
import io
import base64
from PIL import Image
import pytesseract
from mistralai import Mistral

# Initialize Mistral client lazily
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
if MISTRAL_API_KEY:
    mistral_client = Mistral(api_key=MISTRAL_API_KEY)
else:
    mistral_client = None


def do_ocr(image_bytes: bytes) -> str:
    """
    Uses Mistral Document AI OCR (if configured) or falls back to Tesseract.

    :param image_bytes: Raw image bytes
    :return: Extracted text (as markdown/plain)
    """
    # 1) Try Mistral OCR
    if mistral_client:
        try:
            # Encode bytes to base64
            b64 = base64.b64encode(image_bytes).decode('utf-8')
            resp = mistral_client.ocr.process(
                model="mistral-ocr-latest",
                document={
                    "type": "image_url", 
                    "image_url": f"data:image/jpeg;base64,{b64}"
                },
                include_image_base64=False
            )
            # Collect markdown from pages
            text_fragments = []
            for page in getattr(resp, 'pages', []):
                md = getattr(page, 'markdown', None)
                if md:
                    text_fragments.append(md)
            extracted = "\n\n".join(text_fragments)
            print("[Mistral OCR] extracted text:\n", extracted)
            return extracted
        except Exception as e:
            print(f"[Mistral OCR] error: {e}, falling back to Tesseract.")
    # 2) Fallback to pytesseract
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        text = pytesseract.image_to_string(image)
        print("[Tesseract OCR] extracted text:\n", text)
        return text
    except Exception as e:
        print(f"[Tesseract OCR] error: {e}")
        return ""


# # ocr.py using pytesseract
# from PIL import Image
# import pytesseract
# import io

# def do_ocr(image_bytes: bytes) -> str:
#     """
#     Use pytesseract to extract text from an image.
#     :param image_bytes: The raw bytes of the image.
#     :return: Extracted full text from the receipt.
#     """
#     # Open the image from bytes and convert to RGB
#     image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
#     # Optionally, do some image pre-processing here (e.g., resizing, converting to grayscale)
    
#     # Run pytesseract OCR on the image
#     full_text = pytesseract.image_to_string(image)
#     print("OCR Output:", full_text)
#     return full_text




# from doctr.io import DocumentFile
# from doctr.models import ocr_predictor


# def do_ocr(image_bytes: bytes) -> str:
#     """
#     Use doctr OCR to extract text from an image.
#     :param image_bytes: The raw bytes of the image.
#     :return: Extracted full text from the receipt.
#     """
#     model = ocr_predictor(pretrained=True)
#     doc = DocumentFile.from_images([image_bytes])
#     result = model(doc)
    
#     raw_lines = []
#     for page in result.pages:
#         for block in page.blocks:
#             for line in block.lines:
#                 line_text = ' '.join(word.value for word in line.words)
#                 raw_lines.append(line_text)
#     full_text = '\n'.join(raw_lines)
#     return full_text