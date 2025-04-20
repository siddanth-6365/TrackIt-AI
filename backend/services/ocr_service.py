# ocr.py using pytesseract
from PIL import Image
import pytesseract
import io

def do_ocr(image_bytes: bytes) -> str:
    """
    Use pytesseract to extract text from an image.
    :param image_bytes: The raw bytes of the image.
    :return: Extracted full text from the receipt.
    """
    # Open the image from bytes and convert to RGB
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    # Optionally, do some image pre-processing here (e.g., resizing, converting to grayscale)
    
    # Run pytesseract OCR on the image
    full_text = pytesseract.image_to_string(image)
    # print("OCR Output:", full_text)
    return full_text




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