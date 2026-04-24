"""On-server TFLite inference — used by WhatsApp pipeline and /api/v1/analyze."""
import io
import json
import logging
import os

import numpy as np
from PIL import Image, ImageOps, ImageEnhance

logger = logging.getLogger(__name__)

# Prefer ai-edge-litert → tflite_runtime → tensorflow → stub fallback
_Interpreter = None
try:
    from ai_edge_litert.interpreter import Interpreter as _Interpreter
    logger.info("Using ai-edge-litert for TFLite inference")
except Exception:
    pass

if _Interpreter is None:
    try:
        from tflite_runtime.interpreter import Interpreter as _Interpreter
        logger.info("Using tflite_runtime for TFLite inference")
    except Exception:
        pass

if _Interpreter is None:
    try:
        import tensorflow as tf
        _Interpreter = tf.lite.Interpreter
        logger.info("Using tensorflow.lite for TFLite inference")
    except Exception as e:
        logger.warning("All TFLite runtimes unavailable (%s) — inference will use Gemini-only fallback", e)
        _Interpreter = None

# ── Paths ─────────────────────────────────────────────────────────────────────
_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_MODELS_DIR = os.path.normpath(os.path.join(_BASE, "..", "app", "assets", "models"))

_MODEL_PATHS = {
    "oral": os.path.join(_MODELS_DIR, "janarogya_oral_int8.tflite"),   # INT8 — faster
    "skin": os.path.join(_MODELS_DIR, "janarogya_skin_int8.tflite"),
}
_LABEL_PATHS = {
    "oral": os.path.join(_MODELS_DIR, "labels_oral.json"),
    "skin": os.path.join(_MODELS_DIR, "labels_skin.json"),
}

# Model trained at 224×224 with EfficientNetB3
_INPUT_SIZE = 224

# MEDIUM_RISK maps to HIGH_RISK (conservative — never under-report)
_RISK_NORMALISE = {
    "LOW_RISK":    "LOW_RISK",
    "MEDIUM_RISK": "HIGH_RISK",
    "HIGH_RISK":   "HIGH_RISK",
    "INVALID":     "INVALID",
}

_interpreters: dict = {}
_labels: dict = {}


# ── Label loading ─────────────────────────────────────────────────────────────

def _load_labels(scan_type: str) -> list[str]:
    if scan_type not in _labels:
        path = _LABEL_PATHS.get(scan_type)
        if path and os.path.exists(path):
            with open(path) as f:
                raw = json.load(f)
            _labels[scan_type] = [raw[str(i)] for i in range(len(raw))]
            logger.info("Labels for %s: %s", scan_type, _labels[scan_type])
        else:
            logger.warning("Label file missing for %s — using defaults", scan_type)
            _labels[scan_type] = ["LOW_RISK", "MEDIUM_RISK", "HIGH_RISK"]
    return _labels[scan_type]


# ── Interpreter loading ───────────────────────────────────────────────────────

def _get_interpreter(scan_type: str):
    if _Interpreter is None:
        raise RuntimeError("No TFLite runtime available — inference disabled")
    if scan_type not in _interpreters:
        path = _MODEL_PATHS.get(scan_type)
        if not path or not os.path.exists(path):
            raise FileNotFoundError(f"TFLite model not found: {path}")
        interp = _Interpreter(model_path=path)
        interp.allocate_tensors()
        _interpreters[scan_type] = interp
        inp = interp.get_input_details()[0]
        out = interp.get_output_details()[0]
        logger.info(
            "Loaded %s model: %s | input dtype=%s shape=%s | output shape=%s",
            scan_type, os.path.basename(path),
            inp["dtype"].__name__, inp["shape"], out["shape"],
        )
    return _interpreters[scan_type]


# ── Image preprocessing ───────────────────────────────────────────────────────

def _preprocess(image_bytes: bytes) -> np.ndarray:
    """
    Match training preprocessing: plain resize + normalise to [0, 1].
    No center-crop or autocontrast — those shift input distribution away
    from what the model saw during training.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((_INPUT_SIZE, _INPUT_SIZE), Image.BILINEAR)
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)   # (1, 224, 224, 3)


# ── Public inference API ──────────────────────────────────────────────────────

def run_inference(image_bytes: bytes, scan_type: str) -> tuple[str, float]:
    """
    Run TFLite model on image bytes.
    Returns (normalised_risk_label, confidence).
    Fails safe → HIGH_RISK 0.60 so the pipeline never silently skips a real case.
    """
    try:
        interp  = _get_interpreter(scan_type)
        labels  = _load_labels(scan_type)

        input_details  = interp.get_input_details()
        output_details = interp.get_output_details()

        arr = _preprocess(image_bytes)

        # Quantise input if model is INT8
        input_dtype = input_details[0]["dtype"]
        if input_dtype in (np.int8, np.uint8):
            scale, zero_point = input_details[0]["quantization"]
            arr = ((arr / scale) + zero_point).clip(
                np.iinfo(input_dtype).min,
                np.iinfo(input_dtype).max,
            ).astype(input_dtype)

        interp.set_tensor(input_details[0]["index"], arr)
        interp.invoke()

        output = interp.get_tensor(output_details[0]["index"])[0].copy()

        # Dequantise output if INT8
        out_dtype = output_details[0]["dtype"]
        if out_dtype in (np.int8, np.uint8):
            scale, zero_point = output_details[0]["quantization"]
            output = (output.astype(np.float32) - zero_point) * scale

        # Softmax if raw logits
        if output.max() > 1.01 or output.min() < -0.01:
            output = np.exp(output - output.max())
            output /= output.sum()

        # Log all class probabilities
        prob_str = " | ".join(
            f"{labels[i] if i < len(labels) else i}={output[i]:.3f}"
            for i in range(len(output))
        )
        logger.info("TFLite %s probabilities: %s", scan_type, prob_str)

        idx   = int(np.argmax(output))
        conf  = float(output[idx])
        raw   = labels[idx] if idx < len(labels) else "HIGH_RISK"
        label = _RISK_NORMALISE.get(raw, "HIGH_RISK")

        logger.info("TFLite %s → raw=%s normalised=%s conf=%.3f", scan_type, raw, label, conf)
        return label, conf

    except Exception as exc:
        logger.error("TFLite inference failed (%s): %s — safe fallback HIGH_RISK", scan_type, exc)
        return "HIGH_RISK", 0.60


def get_all_probabilities(image_bytes: bytes, scan_type: str) -> dict:
    """Return all class probabilities — used for analytics and doctor review."""
    try:
        interp  = _get_interpreter(scan_type)
        labels  = _load_labels(scan_type)
        input_details  = interp.get_input_details()
        output_details = interp.get_output_details()

        arr = _preprocess(image_bytes)
        input_dtype = input_details[0]["dtype"]
        if input_dtype in (np.int8, np.uint8):
            scale, zero_point = input_details[0]["quantization"]
            arr = ((arr / scale) + zero_point).clip(
                np.iinfo(input_dtype).min, np.iinfo(input_dtype).max
            ).astype(input_dtype)

        interp.set_tensor(input_details[0]["index"], arr)
        interp.invoke()
        output = interp.get_tensor(output_details[0]["index"])[0].copy()

        out_dtype = output_details[0]["dtype"]
        if out_dtype in (np.int8, np.uint8):
            scale, zero_point = output_details[0]["quantization"]
            output = (output.astype(np.float32) - zero_point) * scale

        if output.max() > 1.01 or output.min() < -0.01:
            output = np.exp(output - output.max())
            output /= output.sum()

        return {labels[i] if i < len(labels) else str(i): round(float(output[i]), 4)
                for i in range(len(output))}
    except Exception:
        return {}
