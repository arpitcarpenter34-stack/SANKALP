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


INDICATOR_REGISTRY = [
    {
        "pattern": r"\b(brent\s+crude(?:\s+oil)?|wti\s+crude(?:\s+oil)?|crude\s+oil|crude)\b",
        "entity_id": "crude_oil",
        "name": "Crude Oil",
        "entity_type": "commodity",
        "event_type": "commodity_price_shock",
    },
    {
        "pattern": r"\b(diesel(?:\s+fuel)?)\b",
        "entity_id": "diesel",
        "name": "Diesel",
        "entity_type": "commodity",
        "event_type": "commodity_price_shock",
    },
    {
        "pattern": r"\b(petrol|gasoline)\b",
        "entity_id": "petrol",
        "name": "Petrol",
        "entity_type": "commodity",
        "event_type": "commodity_price_shock",
    },
    {
        "pattern": r"\b(rbi\s+repo\s+rate|repo\s+rate|policy\s+rate)\b",
        "entity_id": "rbi_repo_rate",
        "name": "RBI Repo Rate",
        "entity_type": "economic_indicator",
        "event_type": "central_bank_policy_rate",
    },
    {
        "pattern": r"\b(retail\s+inflation|cpi\s+inflation|consumer\s+price\s+index|cpi|inflation)\b",
        "entity_id": "retail_inflation",
        "name": "Retail Inflation",
        "entity_type": "economic_indicator",
        "event_type": "macroeconomic_indicator_release",
    },
    {
        "pattern": r"\b(edible\s+oil|cooking\s+oil|palm\s+oil|mustard\s+oil)\b",
        "entity_id": "edible_oil",
        "name": "Edible Oil",
        "entity_type": "commodity",
        "event_type": "commodity_price_shock",
    },
    {
        "pattern": r"\b(wheat)\b",
        "entity_id": "wheat",
        "name": "Wheat",
        "entity_type": "commodity",
        "event_type": "commodity_price_shock",
    },
    {
        "pattern": r"\b(lpg(?:\s+cylinders?)?|cooking\s+gas)\b",
        "entity_id": "lpg",
        "name": "LPG",
        "entity_type": "commodity",
        "event_type": "commodity_price_shock",
    },
]

UPWARD_PATTERN = r"(?:\b(surge|surges|surged|surging|rise|rises|rose|rising|hike|hikes|hiked|hiking|jump|jumps|jumped|jumping|gain|gains|gained|gaining|climb|climbs|climbed|climbing|increase|increases|increased|increasing)\b|(?<=\s)\+(?=\d|\s)|^\+(?=\d|\s))"
DOWNWARD_PATTERN = r"(?:\b(cut|cuts|slash|slashes|slashed|slashing|fall|falls|fell|falling|drop|drops|dropped|dropping|decline|declines|declined|declining|decrease|decreases|decreased|decreasing|slump|slumps|slumped|slumping)\b|(?<=\s)\-(?=\d|\s)|^\-(?=\d|\s))"
FLUCTUATION_PATTERN = r"\b(fluctuate|fluctuates|fluctuated|fluctuating|fluctuation|swing|swings|swinging|swung|volatile|volatility)\b"
PERCENT_PATTERN = r"(?:by\s+|of\s+|[\+\-])?\s*(\d+(?:\.\d+)?)\s*(%|percent(?:age)?(?:\s+points)?|basis\s+points|bps)(?!\w)"


def extract_rule_based_fallback(text: str) -> Dict[str, Any]:
    """
    Conservative rule-based extraction fallback for free-text inputs.
    Extracts recognized indicators, directions, and magnitudes strictly without fabrication.
    Raises SchemaValidationError on ambiguous, unsupported, or conflicting text.
    """
    # 1. Match recognized indicators
    matched_indicators = []
    for ind in INDICATOR_REGISTRY:
        m = re.search(ind["pattern"], text, re.IGNORECASE)
        if m:
            matched_indicators.append({
                "indicator": ind,
                "span": m.span(),
                "mention_text": text[m.start():m.end()]
            })

    if not matched_indicators:
        raise SchemaValidationError("Unsupported text: No recognized financial event indicators found.")

    # Check for conflicting event types across matched indicators
    event_types = {m["indicator"]["event_type"] for m in matched_indicators}
    if len(event_types) > 1:
        raise SchemaValidationError("Ambiguous text: Multiple conflicting event types detected in input.")

    # 2. Match direction
    has_up = bool(re.search(UPWARD_PATTERN, text, re.IGNORECASE))
    has_down = bool(re.search(DOWNWARD_PATTERN, text, re.IGNORECASE))
    has_fluc = bool(re.search(FLUCTUATION_PATTERN, text, re.IGNORECASE))

    if (has_up and has_down) or ((has_up or has_down) and has_fluc):
        raise SchemaValidationError("Ambiguous direction: conflicting upward and downward directional signals detected in text.")

    if has_up:
        direction = "increase"
    elif has_down:
        direction = "decrease"
    elif has_fluc:
        direction = "fluctuation"
    else:
        direction = None

    # 3. Match magnitude (percentage or basis points)
    magnitude_matches = list(re.finditer(PERCENT_PATTERN, text, re.IGNORECASE))
    val: Optional[float] = None
    unit: Optional[str] = None

    if magnitude_matches:
        unique_vals = {m.group(1) for m in magnitude_matches}
        if len(unique_vals) > 1:
            raise SchemaValidationError("Ambiguous magnitude: multiple conflicting percentage values detected in text.")

        first_match = magnitude_matches[0]
        raw_val = float(first_match.group(1))
        val = float(int(raw_val)) if raw_val.is_integer() else raw_val
        raw_unit = first_match.group(2).lower()
        if "bps" in raw_unit or "basis" in raw_unit:
            unit = "bps"
        else:
            unit = "%"

    # If neither direction nor magnitude is detected, the text is unsupported
    if direction is None and val is None:
        raise SchemaValidationError("Unsupported text: No event direction or magnitude change detected.")

    if direction is None:
        direction = "unspecified"

    # 4. Scenario flag
    is_scenario = bool(re.search(r"\b(scenario|hypothetical)\b|^scenario:", text, re.IGNORECASE))

    # 5. Build event metadata
    primary_ind = matched_indicators[0]["indicator"]
    slug_entity = primary_ind["entity_id"].replace("_", "-")
    slug_dir = direction
    slug_mag = ""
    if val is not None:
        val_disp = int(val) if val == int(val) else str(val).replace(".", "_")
        unit_slug = "pct" if unit == "%" else "bps"
        slug_mag = f"-{val_disp}{unit_slug}"

    event_id = f"{slug_entity}-{slug_dir}{slug_mag}"

    # Build unique entities
    entities = []
    seen_ids = set()
    for m in matched_indicators:
        ind = m["indicator"]
        eid = ind["entity_id"]
        if eid not in seen_ids:
            seen_ids.add(eid)
            entities.append({
                "entity_id": eid,
                "name": ind["name"],
                "entity_type": ind["entity_type"],
                "mention_text": m["mention_text"]
            })

    evidence_snippets = [
        {
            "quote": text.strip(),
            "source_title": "Input Text" if not is_scenario else "User Scenario"
        }
    ]

    magnitude_obj = {
        "direction": direction,
        "value": val,
        "unit": unit
    }

    result: Dict[str, Any] = {
        "event_id": event_id,
        "event_type": primary_ind["event_type"],
        "is_scenario": is_scenario,
        "headline": text.strip(),
        "magnitude": magnitude_obj,
        "entities": entities,
        "evidence_snippets": evidence_snippets,
    }

    # Only include event_date if explicit ISO date is in text
    date_match = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", text)
    if date_match:
        result["event_date"] = date_match.group(1)

    # Only include geography if explicitly mentioned
    if re.search(r"\bindia\b", text, re.IGNORECASE):
        result["geography"] = "India"
    elif re.search(r"\bglobal(?:ly)?\b", text, re.IGNORECASE):
        result["geography"] = "Global"

    return result


class FakeDeterministicProvider(EventExtractionProvider):
    """
    A deterministic fake provider for testing.
    It returns a predefined dictionary based on simple keyword matching in the text.
    If no exact predefined scenario matches, it falls back to conservative rule-based extraction.
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

        # Fallback to rule-based extraction
        return extract_rule_based_fallback(text)


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
        except EventExtractionError:
            raise
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
