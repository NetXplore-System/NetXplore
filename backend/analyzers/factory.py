from .whatsapp_analyzer import WhatsAppAnalyzer
from .wikipedia_analyzer import WikipediaAnalyzer
from .base_analyzer import BaseAnalyzer

def get_analyzer(platform: str) -> BaseAnalyzer:
    platform = platform.lower()
    if platform == "whatsapp":
        return WhatsAppAnalyzer()
    elif platform == "wikipedia":
        return WikipediaAnalyzer()
    else:
        raise ValueError(f"Unsupported platform: {platform}")
