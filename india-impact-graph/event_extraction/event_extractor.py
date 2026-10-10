import re
from typing import Dict, Any, List, Optional
import copy

class EventExtractionError(Exception):
    """Base exception for event extraction errors."""
    pass

class InvalidInputError(EventExtractionError):
    pass

class SchemaValidationError(EventExtractionError):
    pass

class ExtractionProviderError(EventExtractionError):
    pass


class EventExtractionProvider:
    """Interface for LLM or mock extraction provider."""
    def extract_event(self, text: str) -> Dict[str, Any]:
        raise NotImplementedError("Subclasses must implement extract_event")


class FakeDeterministicProvider(EventExtractionProvider):
    """
    A deterministic fake provider for testing. 
    It returns a predefined dictionary based on simple keyword matching in the text.
    """
    def extract_event(self, text: str) -> Dict[str, Any]:
        if "SCENARIO: +12% crude oil" in text:
            return {
                "event_id": "crude-oil-shock-12pct",
                "event_type": "commodity_price_shock",
                "is_scenario": True,
                "headline": "Hypothetical +12% crude oil shock",
                "magnitude": {
                    "value": 12,
                    "unit": "%",
                    "direction": "increase"
                },
                "entities": [
                    {
                        "entity_id": "crude_oil",
                        "name": "Crude Oil",
                        "entity_type": "commodity",
                        "mention_text": "crude oil"
                    }
                ],
                "evidence_snippets": [
                    {
                        "quote": "SCENARIO: +12% crude oil",
                        "source_title": "User Scenario"
                    }
                ]
            }
        elif "ARTICLE:" in text and "inflation" in text:
            return {
                "event_id": "rbi-inflation-report",
                "event_type": "macroeconomic_indicator_release",
                "is_scenario": False,
                "event_date": "2024-05-10",
                "geography": "India",
                "entities": [
                    {
                        "entity_id": "rbi_repo_rate",
                        "name": "RBI Repo Rate",
                        "entity_type": "economic_indicator",
                        "mention_text": "inflation"
                    }
                ],
                "evidence_snippets": [
                    {
                        "quote": "inflation is high",
                        "source_title": "Financial Times",
                        "publication_date": "2024-05-11"
                    }
                ]
            }
        elif "BAD_JSON" in text:
            raise ExtractionProviderError("Provider failed to return valid JSON.")
        elif "MISSING_REQUIRED" in text:
            return {"event_id": "missing"}
        
        # Default empty/unsupported
        return {}


import os
import json
import urllib.request
import urllib.error

class LiveLLMProvider(EventExtractionProvider):
    """
    Genuine configurable LLM provider.
    Reads LIVE_LLM_API_KEY and USE_LIVE_LLM from environment.
    """
    def extract_event(self, text: str) -> Dict[str, Any]:
        use_live = os.environ.get("USE_LIVE_LLM", "false").lower() == "true"
        if not use_live:
            raise ExtractionProviderError("Live provider is disabled via configuration. Set USE_LIVE_LLM=true.")
            
        api_key = os.environ.get("LIVE_LLM_API_KEY")
        if not api_key:
            raise ExtractionProviderError("Configuration error: LIVE_LLM_API_KEY is missing.")

        # Real network call using standard library
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        data = {
            "model": "gpt-4-turbo",
            "response_format": {"type": "json_object"},
            "messages": [
                {
                    "role": "system",
                    "content": "You are a financial event extractor. Extract events to match the EventExtraction schema."
                },
                {"role": "user", "content": text}
            ]
        }
        
        req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                resp_data = json.loads(response.read().decode("utf-8"))
                content = resp_data["choices"][0]["message"]["content"]
                return json.loads(content)
        except urllib.error.URLError as e:
            raise ExtractionProviderError(f"Network error while contacting LLM provider: {str(e)}")
        except Exception as e:
            raise ExtractionProviderError(f"Error parsing LLM response: {str(e)}")


class FinancialEventExtractor:
    """
    Extracts and validates financial events using the provided LLM extraction interface.
    """
    
    EVENT_TYPES = {
        "commodity_price_shock", "geopolitical_conflict", "central_bank_policy_rate",
        "trade_regulatory_shift", "macroeconomic_indicator_release"
    }
    
    ENTITY_TYPES = {
        "commodity", "household_item", "economic_indicator", "sector", "instrument_asset", "institution"
    }
    
    DIRECTIONS = {"increase", "decrease", "fluctuation", "unspecified"}

    def __init__(self, provider: EventExtractionProvider):
        self.provider = provider

    def extract(self, text: str) -> Dict[str, Any]:
        if not text or not text.strip():
            raise InvalidInputError("Input text cannot be empty.")
            
        try:
            raw_event = self.provider.extract_event(text)
        except Exception as e:
            raise ExtractionProviderError(f"Provider extraction failed: {str(e)}")
            
        return self.validate_event(raw_event)

    def validate_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates against schemas/event-extraction-schema.json.
        Returns a clean, validated dictionary or raises SchemaValidationError.
        """
        if not isinstance(event, dict):
            raise SchemaValidationError("Event must be a dictionary.")
            
        # Check required fields
        for req in ["event_id", "event_type", "is_scenario", "entities", "evidence_snippets"]:
            if req not in event:
                raise SchemaValidationError(f"Missing required field: '{req}'")
                
        # Validate event_type
        if event["event_type"] not in self.EVENT_TYPES:
            raise SchemaValidationError(f"Invalid event_type: '{event['event_type']}'")
            
        # Validate is_scenario
        if not isinstance(event["is_scenario"], bool):
            raise SchemaValidationError("is_scenario must be a boolean.")
            
        # Validate event_date if present
        if "event_date" in event and event["event_date"] is not None:
            if not isinstance(event["event_date"], str) or not re.match(r"^[0-9]{4}-[0-9]{2}-[0-9]{2}$", event["event_date"]):
                raise SchemaValidationError("event_date must be in YYYY-MM-DD format.")
                
        # Validate magnitude if present
        if "magnitude" in event and event["magnitude"] is not None:
            mag = event["magnitude"]
            if not isinstance(mag, dict):
                raise SchemaValidationError("magnitude must be an object.")
            if "direction" not in mag:
                raise SchemaValidationError("magnitude must contain 'direction'.")
            if mag["direction"] not in self.DIRECTIONS:
                raise SchemaValidationError(f"Invalid magnitude direction: '{mag['direction']}'")
                
        # Validate entities
        if not isinstance(event["entities"], list):
            raise SchemaValidationError("entities must be an array.")
        for ent in event["entities"]:
            if not isinstance(ent, dict):
                raise SchemaValidationError("Each entity must be an object.")
            for req in ["entity_id", "name", "entity_type", "mention_text"]:
                if req not in ent:
                    raise SchemaValidationError(f"Entity missing required field: '{req}'")
            if ent["entity_type"] not in self.ENTITY_TYPES:
                raise SchemaValidationError(f"Invalid entity_type: '{ent['entity_type']}'")
                
        # Validate evidence snippets
        if not isinstance(event["evidence_snippets"], list):
            raise SchemaValidationError("evidence_snippets must be an array.")
        for ev in event["evidence_snippets"]:
            if not isinstance(ev, dict):
                raise SchemaValidationError("Each evidence snippet must be an object.")
            for req in ["quote", "source_title"]:
                if req not in ev:
                    raise SchemaValidationError(f"Evidence snippet missing required field: '{req}'")
                    
        return copy.deepcopy(event)
