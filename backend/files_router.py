import os
import re
import logging
from typing import Tuple, Optional

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from typing import Optional

UPLOAD_FOLDER = "uploads" 

logger = logging.getLogger(__name__)
router = APIRouter()

def detect_file_type(content: str) -> Tuple[Optional[str], bool, str]:
    lines = content.split('\n')   
    non_empty_lines = [line.strip() for line in lines if line.strip()]
    
    if len(non_empty_lines) < 3:
        return None, False, "File is too short or doesn't contain enough content"
    whatsapp_patterns = [
        r'\[([\d/\.]+), ([\d:]+)\] ([^:]+):(.+)',  
        r'([\d/]+), ([\d:]+) - ([^:]+):(.+)',     
        r'([\d/\.]+), ([\d:]+) - (.+?):(.+)'      
    ]
    
    whatsapp_matches = 0
    for line in non_empty_lines[:10]:  
        for pattern in whatsapp_patterns:
            if re.match(pattern, line):
                whatsapp_matches += 1
                break
    
    wikipedia_patterns = [
        r'== .+ ==',  
        r'=== .+ ===',
        r'\[\[.+\]\]',  
        r'\{\{.+\}\}', 
        r'\* .+',       
        r'# .+',        
    ]
    
    wikipedia_matches = 0
    wiki_indicators = ['[[', ']]', '{{', '}}', '== ', ' ==']
    
    for line in non_empty_lines[:20]: 
        for pattern in wikipedia_patterns:
            if re.search(pattern, line):
                wikipedia_matches += 1
                break

        for indicator in wiki_indicators:
            if indicator in line:
                wikipedia_matches += 1
                break
    
    total_lines_checked = min(len(non_empty_lines), 10)
    whatsapp_ratio = whatsapp_matches / total_lines_checked if total_lines_checked > 0 else 0
    wikipedia_ratio = wikipedia_matches / min(len(non_empty_lines), 20) if len(non_empty_lines) > 0 else 0
    
    if whatsapp_ratio >= 0.3:  
        return "whatsapp", True, ""
    elif wikipedia_ratio >= 0.2: 
        return "wikipedia", True, ""
    else:
        return None, False, f"File not recognized as valid WhatsApp or Wikipedia file. Found {whatsapp_matches} WhatsApp lines and {wikipedia_matches} Wikipedia elements"

def validate_whatsapp_format(content: str) -> Tuple[bool, str]:
    lines = content.split('\n')
    valid_messages = 0
    total_non_empty = 0
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        total_non_empty += 1
        whatsapp_patterns = [
            r'\[([\d/\.]+), ([\d:]+)\] ([^:]+):(.+)',
            r'([\d/]+), ([\d:]+) - ([^:]+):(.+)',
            r'([\d/\.]+), ([\d:]+) - (.+?):(.+)'
        ]
        
        for pattern in whatsapp_patterns:
            if re.match(pattern, line):
                valid_messages += 1
                break
    
    if total_non_empty == 0:
        return False, "File is empty"
    
    validity_ratio = valid_messages / total_non_empty
    
    if validity_ratio < 0.3:
        return False, f"Only {valid_messages}/{total_non_empty} lines ({validity_ratio:.1%}) match WhatsApp format"
    
    return True, f"Found {valid_messages} valid WhatsApp messages out of {total_non_empty} lines"

def validate_wikipedia_format(content: str) -> Tuple[bool, str]:
    lines = content.split('\n')
    wiki_elements = {
        'headers': 0,      
        'links': 0,        
        'templates': 0,    
        'lists': 0,       
        'references': 0    
    }
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if re.search(r'=+ .+ =+', line):
            wiki_elements['headers'] += 1
        
        if '[[' in line and ']]' in line:
            wiki_elements['links'] += 1
        
        if '{{' in line and '}}' in line:
            wiki_elements['templates'] += 1
        
        if re.match(r'^[\*#] ', line):
            wiki_elements['lists'] += 1
        
        if '<ref' in line.lower():
            wiki_elements['references'] += 1
    
    total_elements = sum(wiki_elements.values())
    
    if total_elements < 3:
        return False, f"Found only {total_elements} Wikipedia elements. File doesn't appear to be valid Wikipedia content"
    
    details = ", ".join([f"{count} {element}" for element, count in wiki_elements.items() if count > 0])
    return True, f"Found {total_elements} Wikipedia elements: {details}"

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    platform: str = Form(...)
):
    try:
        if platform not in {"whatsapp", "wikipedia"}:
            return JSONResponse(
                content={"error": "Platform must be either 'whatsapp' or 'wikipedia'"},
                status_code=400
            )

        if not file.filename.endswith('.txt'):
            logger.warning(f"Invalid file type uploaded: {file.filename}")
            return JSONResponse(
                content={"error": "Only text files (.txt) are supported"},
                status_code=400
            )

        content = await file.read()

        try:
            text_content = content.decode('utf-8')
        except UnicodeDecodeError:
            try:
                text_content = content.decode('latin-1')
            except UnicodeDecodeError:
                return JSONResponse(
                    content={ "error": "Unable to read the file. Please ensure the file is encoded in UTF-8." },
                    status_code=400
                )

        detected_type, is_valid, error_message = detect_file_type(text_content)


        if not is_valid:
            logger.warning(f"File format not recognized: {error_message}")
            
            if platform == "whatsapp":
                detailed_valid, details = validate_whatsapp_format(text_content)
            elif platform == "wikipedia":
                detailed_valid, details = validate_wikipedia_format(text_content)
            else:
                detailed_valid, details = False, "Unsupported platform"

            if not detailed_valid:
                return JSONResponse(
                    content={
                        "error": f"{platform.capitalize()} format not valid. Please try a different file.",
                    },
                    status_code=400
                )

    
        if detected_type != platform:
            logger.warning(f"Platform mismatch: expected '{platform}', but detected '{detected_type}'")
            return JSONResponse(
                content={
                    "error": f"Invalid file for {platform.capitalize()} platform",
                    "details": f"File was detected as {detected_type.capitalize()}"
                },
                status_code=400
            )

        if platform == "whatsapp":
            detailed_valid, details = validate_whatsapp_format(text_content)
        elif platform == "wikipedia":
            detailed_valid, details = validate_wikipedia_format(text_content)
        else:
            detailed_valid, details = False, "Unsupported platform"

        if not detailed_valid:
            logger.warning(f"Detailed validation failed for {file.filename} ({platform}): {details}")
            return JSONResponse(
                content={
                    "error": f"Invalid {platform} file format",
                    "details": details
                },
                status_code=400
            )

        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)

        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        with open(file_path, "wb") as f:
            f.write(content)

        logger.info(f"File uploaded successfully: {file.filename} (type: {platform})")
        return JSONResponse(
            content={
                "message": "File uploaded successfully!",
                "filename": file.filename,
                "file_type": platform,
                "details": details
            },
            status_code=200
        )

    except Exception as e:
        logger.error(f"Error uploading file {file.filename}: {e}")
        raise HTTPException(detail=str(e), status_code=500)
    

@router.delete("/delete/{filename}")
async def delete_file(filename: str):
    try:
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            return JSONResponse(content={"message": f"File '{filename}' deleted successfully!"}, status_code=200)
        else:
            return JSONResponse(content={"error": f"File '{filename}' not found."}, status_code=404)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)