from abc import ABC, abstractmethod

class BaseAnalyzer(ABC):
    @abstractmethod
    async def analyze(self, filename: str, **kwargs):
        pass

    @abstractmethod
    async def detect_communities(self, filename: str, **kwargs):
        pass
