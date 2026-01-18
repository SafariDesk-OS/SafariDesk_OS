"""
Gemini API Client with retry logic, rate limiting, and cost tracking
"""

import time
import json
import logging
from typing import Optional, Dict, Any, List, Callable
from decouple import config
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

logger = logging.getLogger(__name__)

class GeminiClient:
    """
    Client for interacting with Google Gemini 1.5 Flash API
    Includes retry logic, rate limiting, and cost tracking
    """
    
    def __init__(self):
        self.api_key = config('GEMINI_API_KEY', default=None)
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=self.api_key)
        
        # Model configuration
        self.model_name = config('GEMINI_MODEL', default='gemini-flash-latest')
        self.max_retries = int(config('GEMINI_MAX_RETRIES', default=3))
        self.retry_delay = float(config('GEMINI_RETRY_DELAY', default=1.0))
        self.timeout = int(config('GEMINI_TIMEOUT', default=30))
        
        # Safety settings
        self.safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        }
        
        # Optionally validate/normalize model via discovery to avoid 404s on backend/version mismatch
        self.model_name = self._resolve_model_name(self.model_name)
        logger.info(f"Gemini client initialized with model '{self.model_name}'")

        # Initialize a default model (without system instructions)
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            safety_settings=self.safety_settings
        )
        
        # Cost tracking (tokens)
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.total_requests = 0
    
    def _calculate_backoff(self, attempt: int) -> float:
        """Calculate exponential backoff delay"""
        return self.retry_delay * (2 ** attempt)
    
    def _log_api_call(self, prompt: str, response: str, input_tokens: int, output_tokens: int):
        """Log API call for debugging and cost tracking"""
        self.total_input_tokens += input_tokens
        self.total_output_tokens += output_tokens
        self.total_requests += 1
        
        logger.info(
            f"Gemini API call - Input tokens: {input_tokens}, Output tokens: {output_tokens}, "
            f"Total requests: {self.total_requests}"
        )

    def _resolve_model_name(self, preferred: str) -> str:
        """Best-effort normalization of the model name.
        Tries discovery and falls back across known IDs that support generateContent.
        """
        candidates: List[str] = [
            preferred,
            # Common alternates across API surfaces/versions
            'gemini-1.5-flash-latest',
            'gemini-1.5-flash-001',
            'gemini-1.5-pro',
            'gemini-pro',
        ]
        try:
            models = getattr(genai, 'list_models', None)
            if callable(models):
                available = []
                for m in models():  # type: ignore[func-returns-value]
                    # m can be dict-like or object; normalize access
                    name = getattr(m, 'name', None) or (m.get('name') if isinstance(m, dict) else None)
                    methods = getattr(m, 'supported_generation_methods', None) or (
                        m.get('supported_generation_methods') if isinstance(m, dict) else None)
                    if not name:
                        continue
                    available.append((name, set(methods or [])))
                # Prefer first candidate that supports generateContent
                for cand in candidates:
                    for name, methods in available:
                        if name.endswith(cand) and ('generateContent' in methods or 'generate_content' in methods):
                            if cand != preferred:
                                logger.warning(f"GEMINI_MODEL '{preferred}' adjusted to '{name}' based on discovery")
                            return name.split('/')[-1] if '/' in name else name
        except Exception as e:
            # Discovery is best-effort; continue with provided name if it fails
            logger.debug(f"Model discovery failed; proceeding with '{preferred}': {e}")
        return preferred
    
    def generate_content(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        retry_on_error: bool = True
    ) -> Dict[str, Any]:
        """
        Generate content using Gemini API with retry logic
        
        Args:
            prompt: User prompt
            system_instruction: System instruction/prompt
            temperature: Temperature for generation (0.0-2.0)
            max_tokens: Maximum tokens to generate
            retry_on_error: Whether to retry on errors
            
        Returns:
            Dict with 'content', 'input_tokens', 'output_tokens', 'model'
        """
        
        generation_config = {
            'temperature': temperature,
        }
        
        if max_tokens:
            generation_config['max_output_tokens'] = max_tokens
        
        last_exception = None
        
        for attempt in range(self.max_retries):
            try:
                start_time = time.time()
                
                # Choose model: if a system instruction is provided, build a model instance with it
                model = (
                    genai.GenerativeModel(
                        model_name=self.model_name,
                        safety_settings=self.safety_settings,
                        system_instruction=system_instruction,
                    )
                    if system_instruction else self.model
                )

                # Generate content
                response = model.generate_content(
                    prompt,
                    generation_config=generation_config,
                )
                
                processing_time = int((time.time() - start_time) * 1000)
                
                # Extract tokens (if available in response)
                input_tokens, output_tokens = self._extract_usage_tokens(response)
                
                # Get response text
                if response.text:
                    content = response.text
                else:
                    content = str(response)
                
                # Log API call
                self._log_api_call(prompt, content, input_tokens, output_tokens)
                
                return {
                    'content': content,
                    'input_tokens': input_tokens,
                    'output_tokens': output_tokens,
                    'total_tokens': input_tokens + output_tokens,
                    'processing_time_ms': processing_time,
                    'model': self.model_name,
                    'raw_response': response
                }
                
            except Exception as e:
                last_exception = e
                logger.warning(
                    f"Gemini API call failed (attempt {attempt + 1}/{self.max_retries}): {str(e)}"
                )
                # On 404 model not found / not supported, attempt a one-time model fallback
                msg = str(e)
                if '404' in msg and ('not found' in msg.lower() or 'not supported' in msg.lower()):
                    original = self.model_name
                    fallback = self._resolve_model_name(self.model_name)
                    if fallback and fallback != original:
                        self.model_name = fallback
                        self.model = genai.GenerativeModel(
                            model_name=self.model_name,
                            safety_settings=self.safety_settings,
                        )
                        logger.warning(f"Switched GEMINI model from '{original}' to '{self.model_name}' and retrying")
                        # brief delay before retry
                        time.sleep(self._calculate_backoff(attempt))
                        continue

                if not retry_on_error or attempt == self.max_retries - 1:
                    raise
                
                # Exponential backoff
                backoff_delay = self._calculate_backoff(attempt)
                time.sleep(backoff_delay)
        
        # If we get here, all retries failed
        raise Exception(f"Gemini API call failed after {self.max_retries} attempts: {str(last_exception)}")

    # --- Agentic function-calling loop ---
    def generate_agentic_response(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_dispatcher: Optional[Dict[str, Callable[..., Any]]] = None,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        max_iterations: int = 4,
    ) -> Dict[str, Any]:
        """
        Agentic generation with Gemini function calling.

        Args:
            messages: list of {'role': 'user'|'assistant'|'system'|'tool', 'content': str}
            tools: list of tool schemas
            tool_dispatcher: mapping tool name -> callable(**kwargs)
            system_instruction: optional system prompt
            temperature: sampling temperature
            max_tokens: optional max output tokens
            max_iterations: max tool-call loops per turn

        Returns:
            Dict with final content, tool_call trace, and raw responses.
        """
        conversation = self._to_genai_messages(messages)
        traces: List[Dict[str, Any]] = []
        total_input_tokens = 0
        total_output_tokens = 0

        generation_config = {'temperature': temperature}
        if max_tokens:
            generation_config['max_output_tokens'] = max_tokens

        model = genai.GenerativeModel(
            model_name=self.model_name,
            safety_settings=self.safety_settings,
            system_instruction=system_instruction,
            tools=tools or None,
        )
        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(
                "Agentic start model=%s messages=%s tools=%s",
                self.model_name,
                len(messages),
                [t.get("name") for t in (tools or [])],
            )

        last_response = None
        for _ in range(max_iterations):
            response = model.generate_content(
                conversation,
                generation_config=generation_config,
            )
            last_response = response
            in_tok, out_tok = self._extract_usage_tokens(response)
            total_input_tokens += in_tok
            total_output_tokens += out_tok

            calls = self._extract_function_calls(response)
            if logger.isEnabledFor(logging.DEBUG):
                logger.debug(
                    "Agentic turn model=%s calls=%s input_tokens=%s output_tokens=%s",
                    self.model_name,
                    [c.get("name") for c in calls],
                    in_tok,
                    out_tok,
                )
            if not calls:
                try:
                    final_text = response.text if getattr(response, "text", None) else str(response)
                except Exception:
                    final_text = str(response)
                if logger.isEnabledFor(logging.DEBUG):
                    logger.debug("Agentic final text (truncated): %s", (final_text or "")[:400])
                self._log_api_call("agentic_turn", final_text, in_tok, out_tok)
                return {
                    "content": final_text,
                    "tool_calls": traces,
                    "input_tokens": total_input_tokens,
                    "output_tokens": total_output_tokens,
                    "model": self.model_name,
                    "raw_response": response,
                }

            for call in calls:
                tool_name = call.get("name")
                arguments = call.get("arguments") or {}
                result_payload: Dict[str, Any]
                error: Optional[str] = None

                func = (tool_dispatcher or {}).get(tool_name)
                if not func:
                    error = f"Unknown tool '{tool_name}'"
                    logger.warning(f"Agentic tool call failed: {error} args={arguments}")
                    result_payload = {"error": error}
                else:
                    try:
                        result_payload = func(**arguments)
                    except Exception as exc:
                        error = str(exc)
                        logger.warning(f"Agentic tool '{tool_name}' raised: {exc}", exc_info=True)
                        result_payload = {"error": error}

                if logger.isEnabledFor(logging.DEBUG):
                    logger.debug(
                        "Agentic tool result tool=%s error=%s keys=%s",
                        tool_name,
                        error,
                        list(result_payload.keys()),
                    )
                traces.append({
                    "tool": tool_name,
                    "args": arguments,
                    "result": result_payload,
                    "error": error,
                })

                # Append function call and result to conversation (Gemini v1 shape)
                conversation.append({
                    "role": "model",
                    "parts": [
                        {
                            "function_call": {
                                "name": tool_name,
                                "args": arguments,
                            }
                        }
                    ],
                })
                conversation.append({
                    "role": "function",
                    "parts": [
                        {
                            "function_response": {
                                "name": tool_name,
                                "response": result_payload,
                            }
                        }
                    ],
                })

        final_fallback = ""
        if last_response:
            # If the last response was a function_call without text, skip text conversion
            if not self._extract_function_calls(last_response):
                try:
                    final_fallback = last_response.text if getattr(last_response, "text", None) else ""
                except Exception:
                    final_fallback = ""
        return {
            "content": final_fallback or "I ran into an issue completing that request.",
            "tool_calls": traces,
            "input_tokens": total_input_tokens,
            "output_tokens": total_output_tokens,
            "model": self.model_name,
            "raw_response": last_response,
        }
    
    def generate_content_stream(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ):
        """
        Generate content with streaming response
        
        Yields:
            Chunks of generated text
        """
        generation_config = {
            'temperature': temperature,
        }
        
        if max_tokens:
            generation_config['max_output_tokens'] = max_tokens
        
        try:
            # Choose model per request based on system instruction
            model = (
                genai.GenerativeModel(
                    model_name=self.model_name,
                    safety_settings=self.safety_settings,
                    system_instruction=system_instruction,
                )
                if system_instruction else self.model
            )

            response = model.generate_content(
                prompt,
                generation_config=generation_config,
                stream=True,
            )
            
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            logger.error(f"Gemini streaming error: {str(e)}")
            raise

    def _extract_usage_tokens(self, response) -> tuple[int, int]:
        """Normalize usage_metadata access across SDK object shapes."""
        usage = getattr(response, 'usage_metadata', None)
        prompt_tokens = 0
        output_tokens = 0
        if usage:
            if hasattr(usage, 'prompt_token_count'):
                prompt_tokens = getattr(usage, 'prompt_token_count') or 0
            elif isinstance(usage, dict):
                prompt_tokens = usage.get('prompt_token_count', 0)

            if hasattr(usage, 'candidates_token_count'):
                output_tokens = getattr(usage, 'candidates_token_count') or 0
            elif isinstance(usage, dict):
                output_tokens = usage.get('candidates_token_count', 0)
        return int(prompt_tokens or 0), int(output_tokens or 0)

    def _extract_function_calls(self, response) -> List[Dict[str, Any]]:
        """
        Normalize function_call extraction across SDK shapes.
        Looks for candidates[*].function_calls or top-level function_call.
        """
        calls: List[Dict[str, Any]] = []
        candidates = getattr(response, "candidates", None) or []
        for cand in candidates:
            # Newer SDK embeds function_call inside content.parts
            content_parts = getattr(getattr(cand, "content", None), "parts", None) or []
            for part in content_parts:
                fc_part = getattr(part, "function_call", None) or (part.get("function_call") if isinstance(part, dict) else None)
                if fc_part:
                    name = getattr(fc_part, "name", None) or (fc_part.get("name") if isinstance(fc_part, dict) else None)
                    args = getattr(fc_part, "args", None) or getattr(fc_part, "arguments", None)
                    if isinstance(fc_part, dict):
                        args = fc_part.get("args") or fc_part.get("arguments") or {}
                    calls.append({"name": name, "arguments": args or {}})

            fcalls = getattr(cand, "function_calls", None) or getattr(cand, "function_call", None)
            if fcalls:
                if isinstance(fcalls, dict):
                    fcalls = [fcalls]
                for fc in fcalls:
                    name = getattr(fc, "name", None) or (fc.get("name") if isinstance(fc, dict) else None)
                    args = getattr(fc, "args", None) or getattr(fc, "arguments", None)
                    if isinstance(fc, dict):
                        args = fc.get("args") or fc.get("arguments") or {}
                    if args is None:
                        args = {}
                    calls.append({"name": name, "arguments": args})

        top_fc = getattr(response, "function_call", None) or getattr(response, "function_calls", None)
        if top_fc:
            if isinstance(top_fc, dict):
                top_list = [top_fc]
            elif isinstance(top_fc, list):
                top_list = top_fc
            else:
                top_list = [top_fc]
            for fc in top_list:
                name = getattr(fc, "name", None) or (fc.get("name") if isinstance(fc, dict) else None)
                args = getattr(fc, "args", None) or getattr(fc, "arguments", None) or {}
                if isinstance(fc, dict):
                    args = fc.get("args") or fc.get("arguments") or {}
                calls.append({"name": name, "arguments": args})

        return [c for c in calls if c.get("name")]

    def _to_genai_messages(self, messages: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """
        Convert simplified message dicts to Gemini content format.
        Expected input: {'role': 'user'|'assistant'|'tool'|'function', 'content': str}
        """
        converted: List[Dict[str, Any]] = []
        role_map = {
            "assistant": "model",
            "tool": "function",
        }
        for msg in messages:
            role = msg.get("role", "user")
            if role == "system":
                # system_instruction should be used instead of system role messages
                continue
            content = msg.get("content", "")
            converted.append({
                "role": role_map.get(role, role),
                "parts": [content],
            })
        return converted
    
    def get_usage_stats(self) -> Dict[str, Any]:
        """Get usage statistics"""
        return {
            'total_requests': self.total_requests,
            'total_input_tokens': self.total_input_tokens,
            'total_output_tokens': self.total_output_tokens,
            'total_tokens': self.total_input_tokens + self.total_output_tokens,
        }
    
    def reset_usage_stats(self):
        """Reset usage statistics"""
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.total_requests = 0
